import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { GoogleError } from './google';

/**
 * Admin auto-translate with hard caps.
 *
 * Provider: Gemini API free tier only (GEMINI_API_KEY from Google AI Studio, NO billing account on that
 * project → cannot be charged). Free-tier content may be used by Google to improve its products: only public
 * website text is sent.
 *
 * Caps (checked and reserved BEFORE calling the provider, under a row lock, given back if the call fails):
 *  - TRANSLATE_MONTHLY_LIMIT characters / Thailand month (default 450,000)
 *  - TRANSLATE_DAILY_REQUESTS requests / day (default 200) — stays below Gemini's free daily quota
 */
export const USAGE_KEY = 'translate.usage';
export const LIMIT = Math.max(0, Number(process.env.TRANSLATE_MONTHLY_LIMIT) || 450_000);
export const DAILY_REQ = Math.max(1, Number(process.env.TRANSLATE_DAILY_REQUESTS) || 200);
export const FREE_TIER = 500_000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const CHUNK = 6_000;   // characters per Gemini request (keeps the answer well inside the output limit)

type LogRow = { at: string; user: string; what: string; chars: number; from: string; to: string };
type Usage = { month: string; chars: number; log: LogRow[]; day?: string; reqs?: number };
const thNow = () => new Date(Date.now() + 7 * 3600_000).toISOString();
const month = () => thNow().slice(0, 7), day = () => thNow().slice(0, 10);
/** characters as counted everywhere (tags included) */
export const countChars = (texts: string[]) => texts.reduce((n, t) => n + [...t].length, 0);

export function provider(): 'gemini' | null {
  return process.env.GEMINI_API_KEY ? 'gemini' : null;
}
const LANG_NAME: Record<string, string> = { th: 'Thai', en: 'English', ru: 'Russian', zh: 'Simplified Chinese' };

export async function usage() {
  const [row] = await db.select().from(settings).where(eq(settings.key, USAGE_KEY));
  const u = row?.value as Usage | undefined, m = month(), d = day();
  const cur = u && u.month === m ? u : { month: m, chars: 0, log: [] };
  const p = provider();
  return { month: cur.month, chars: cur.chars, log: cur.log, limit: LIMIT, free: FREE_TIER, reqsToday: cur.day === d ? cur.reqs ?? 0 : 0, dailyReq: DAILY_REQ,
    provider: p, model: p ? GEMINI_MODEL : null, enabled: !!p && process.env.TRANSLATE_ENABLED !== 'false' };
}

export class QuotaError extends Error {}
/** reserve n characters + r requests or throw QuotaError; returns a give-back function */
async function reserve(n: number, r: number, meta: Omit<LogRow, 'at' | 'chars'>) {
  const m = month(), d = day();
  const read = async (t: typeof db) => {
    await t.insert(settings).values({ key: USAGE_KEY, value: { month: m, chars: 0, log: [] } }).onConflictDoNothing();
    const [row] = await t.execute(sql`select value from settings where key = ${USAGE_KEY} for update`).then(x => x.rows as { value: Usage }[]);
    const u: Usage = row.value.month === m ? row.value : { month: m, chars: 0, log: [] };
    if (u.day !== d) { u.day = d; u.reqs = 0; }
    return u;
  };
  await db.transaction(async t => {
    const u = await read(t as unknown as typeof db);
    if (u.chars + n > LIMIT) throw new QuotaError(`เกินเพดานเดือนนี้: ใช้ไปแล้ว ${u.chars.toLocaleString()} + ครั้งนี้ ${n.toLocaleString()} > ${LIMIT.toLocaleString()} ตัวอักษร · เปิดใหม่วันที่ 1 เดือนหน้า`);
    if ((u.reqs ?? 0) + r > DAILY_REQ) throw new QuotaError(`วันนี้แปลครบโควตาแล้ว (${DAILY_REQ} ครั้ง/วัน) · แปลต่อได้พรุ่งนี้`);
    await t.update(settings).set({ value: { ...u, chars: u.chars + n, reqs: (u.reqs ?? 0) + r, log: [{ at: new Date().toISOString(), chars: n, ...meta }, ...u.log].slice(0, 300) } }).where(eq(settings.key, USAGE_KEY));
  });
  return async (note: string) => db.transaction(async t => {
    const u = await read(t as unknown as typeof db); if (u.month !== m) return;
    await t.update(settings).set({ value: { ...u, chars: Math.max(0, u.chars - n), reqs: Math.max(0, (u.reqs ?? 0) - r),
      log: [{ at: new Date().toISOString(), chars: -n, ...meta, what: `${meta.what} (คืนโควตา: ${note})` }, ...u.log].slice(0, 300) } }).where(eq(settings.key, USAGE_KEY));
  });
}

/** split texts into batches of ≤ CHUNK characters (one long text = its own batch) */
function batches(src: string[]) {
  const out: number[][] = []; let cur: number[] = [], size = 0;
  src.forEach((t, i) => { const n = [...t].length; if (cur.length && size + n > CHUNK) { out.push(cur); cur = []; size = 0; } cur.push(i); size += n; });
  if (cur.length) out.push(cur);
  return out;
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function gemini(texts: string[], from: string, to: string, html: boolean): Promise<string[]> {
  const sys = `You translate website content for Boat Trip Thailand, a private yacht / boat charter company in Phuket.
Translate every string from ${LANG_NAME[from] ?? from} to ${LANG_NAME[to] ?? to}. Natural, warm, professional travel-marketing tone for the target readers; not word-for-word.
Rules: keep boat names, marina and pier names, island names, brand names, prices, numbers, units, URLs and emoji exactly as written (use the usual ${LANG_NAME[to] ?? to} spelling only for well-known places, e.g. Phi Phi, Phang Nga Bay).
${html ? 'Strings contain HTML: keep every tag and attribute exactly as is (same order, same href), translate only the visible text between tags.' : 'Strings are plain text: return plain text, no HTML, no markdown.'}
Return ONLY a JSON array of strings with exactly the same number of items, in the same order. Never merge, split, skip or explain.`;
  const body = { systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: 'user', parts: [{ text: JSON.stringify(texts) }] }],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'STRING' } } } };
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
      method: 'POST', headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY!, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 429 && attempt < 2) { await sleep(20_000 * (attempt + 1)); continue; }   // per-minute limit: wait and retry
    if (!r.ok) throw new GoogleError(r.status === 429 ? 'quota' : r.status === 403 ? 'forbidden' : 'api', j?.error?.message || `Gemini ${r.status}`);
    const txt = j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
    let arr: unknown; try { arr = JSON.parse(txt); } catch { arr = null; }
    if (Array.isArray(arr) && arr.length === texts.length && arr.every(x => typeof x === 'string')) return arr as string[];
    if (attempt < 1) continue;   // one retry on a malformed answer
    throw new GoogleError('api', `Gemini ตอบกลับไม่ครบ (${Array.isArray(arr) ? arr.length : 0}/${texts.length}) · ${j.candidates?.[0]?.finishReason ?? ''}`);
  }
}

/** Translate texts (order kept, empty strings stay empty). `html` keeps tags, so article blocks stay intact. */
export async function translate(texts: string[], from: string, to: string, opts: { html?: boolean; user: string; what: string }) {
  const p = provider();
  if (!p || process.env.TRANSLATE_ENABLED === 'false') throw new QuotaError('ระบบแปลอัตโนมัติยังไม่พร้อม (ยังไม่ได้ใส่ GEMINI_API_KEY หรือปิดไว้)');
  const idx = texts.map((t, i) => (t && t.trim() ? i : -1)).filter(i => i >= 0);
  const src = idx.map(i => texts[i]), n = countChars(src);
  if (!n) return { out: texts.map(() => ''), chars: 0 };
  const plan = batches(src);
  const giveBack = await reserve(n, plan.length, { user: opts.user, what: opts.what.slice(0, 120), from, to });
  const done: string[] = new Array(src.length);
  let ok = 0;
  try {
    for (const b of plan) {
      const res = await gemini(b.map(i => src[i]), from, to, !!opts.html);
      if (res.length !== b.length) throw new GoogleError('api', 'คำแปลกลับมาไม่ครบ');
      b.forEach((i, k) => { done[i] = res[k]; }); ok++;
    }
    const out = texts.map(() => ''); idx.forEach((i, k) => { out[i] = done[k]; });
    return { out, chars: n };
  } catch (e) {
    if (!ok) await giveBack(e instanceof Error ? e.message.slice(0, 80) : 'error');   // nothing went through → nothing used
    throw e;
  }
}

/* ---------- machine-translation drafts: kept until a person approves them (not shown on the website) ---------- */
const DRAFT = (kind: string, id: string, lang: string) => `translate.draft.${kind}.${id}.${lang}`;
export async function saveDraft(kind: 'article', id: string, lang: string, value: unknown) {
  const key = DRAFT(kind, id, lang);
  await db.insert(settings).values({ key, value: value as object }).onConflictDoUpdate({ target: settings.key, set: { value: value as object } });
}
export async function listDrafts() {
  const rows = await db.select().from(settings).where(sql`${settings.key} like 'translate.draft.%'`);
  return rows.map(r => { const [, , kind, id, lang] = r.key.split('.'); return { kind, id, lang, value: r.value }; });
}
export async function deleteDraft(kind: 'article', id: string, lang: string) { await db.delete(settings).where(eq(settings.key, DRAFT(kind, id, lang))); }
