import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { accessToken, GoogleError, googleStatus } from './google';

/**
 * Admin auto-translate (Google Cloud Translation, Basic v2) with a hard monthly cap.
 * Google's free tier is 500,000 characters / month; anything above is billed to the card automatically,
 * so this module refuses to send a request that would take the month past TRANSLATE_MONTHLY_LIMIT (default 450,000).
 * Characters are reserved BEFORE the request (and given back if Google fails), under a row lock, so two people
 * translating at the same time cannot overshoot. Google itself is also capped per day in Cloud Console → Quotas.
 * Uses the same service account as analytics (needs the "Cloud Translation API User" role).
 */
export const USAGE_KEY = 'translate.usage';
export const LIMIT = Math.max(0, Number(process.env.TRANSLATE_MONTHLY_LIMIT) || 450_000);
export const FREE_TIER = 500_000;
type LogRow = { at: string; user: string; what: string; chars: number; from: string; to: string };
type Usage = { month: string; chars: number; log: LogRow[] };
const month = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 7);   // Thailand calendar month
/** what Google bills: every character sent, tags included */
export const countChars = (texts: string[]) => texts.reduce((n, t) => n + [...t].length, 0);

export async function usage() {
  const [row] = await db.select().from(settings).where(eq(settings.key, USAGE_KEY));
  const u = row?.value as Usage | undefined, m = month();
  const cur = u && u.month === m ? u : { month: m, chars: 0, log: [] };
  return { ...cur, limit: LIMIT, free: FREE_TIER, enabled: googleStatus().key && process.env.TRANSLATE_ENABLED !== 'false' };
}

export class QuotaError extends Error {}
/** reserve `n` characters for this month or throw QuotaError; returns a function that gives them back */
async function reserve(n: number, meta: Omit<LogRow, 'at' | 'chars'>) {
  const m = month();
  await db.transaction(async t => {
    await t.insert(settings).values({ key: USAGE_KEY, value: { month: m, chars: 0, log: [] } }).onConflictDoNothing();
    const [row] = await t.execute(sql`select value from settings where key = ${USAGE_KEY} for update`).then(r => r.rows as { value: Usage }[]);
    const u: Usage = row.value.month === m ? row.value : { month: m, chars: 0, log: [] };
    if (u.chars + n > LIMIT) throw new QuotaError(`เกินเพดานเดือนนี้: ใช้ไปแล้ว ${u.chars.toLocaleString()} + ครั้งนี้ ${n.toLocaleString()} > ${LIMIT.toLocaleString()} ตัวอักษร · เปิดใหม่วันที่ 1 เดือนหน้า`);
    const v: Usage = { month: m, chars: u.chars + n, log: [{ at: new Date().toISOString(), chars: n, ...meta }, ...u.log].slice(0, 300) };
    await t.update(settings).set({ value: v }).where(eq(settings.key, USAGE_KEY));
  });
  return async (note: string) => db.transaction(async t => {
    const [row] = await t.execute(sql`select value from settings where key = ${USAGE_KEY} for update`).then(r => r.rows as { value: Usage }[]);
    const u = row?.value; if (!u || u.month !== m) return;
    await t.update(settings).set({ value: { ...u, chars: Math.max(0, u.chars - n), log: [{ at: new Date().toISOString(), chars: -n, ...meta, what: `${meta.what} (คืนโควตา: ${note})` }, ...u.log].slice(0, 300) } }).where(eq(settings.key, USAGE_KEY));
  });
}

/** Translate texts (order kept). `html` keeps tags, so article blocks stay intact. */
export async function translate(texts: string[], from: string, to: string, opts: { html?: boolean; user: string; what: string }) {
  if (process.env.TRANSLATE_ENABLED === 'false') throw new QuotaError('ปิดระบบแปลอัตโนมัติไว้ (TRANSLATE_ENABLED=false)');
  const idx = texts.map((t, i) => (t && t.trim() ? i : -1)).filter(i => i >= 0);
  const src = idx.map(i => texts[i]), n = countChars(src);
  if (!n) return { out: texts.map(() => ''), chars: 0 };
  const giveBack = await reserve(n, { user: opts.user, what: opts.what.slice(0, 120), from, to });
  const done: string[] = [];
  try {
    const token = await accessToken();
    // Google: ≤ 128 strings and ~30k characters per request
    for (let i = 0; i < src.length;) {
      const batch: string[] = []; let size = 0;
      while (i < src.length && batch.length < 100 && (size + src[i].length < 25_000 || !batch.length)) { batch.push(src[i]); size += src[i].length; i++; }
      const r = await fetch('https://translation.googleapis.com/language/translate/v2', {
        method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
        body: JSON.stringify({ q: batch, source: from, target: to, format: opts.html ? 'html' : 'text' }), signal: AbortSignal.timeout(60_000),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new GoogleError(r.status === 403 ? 'forbidden' : r.status === 429 ? 'quota' : 'api', j?.error?.message || `Translation ${r.status}`);
      done.push(...(j.data?.translations ?? []).map((x: { translatedText: string }) => x.translatedText));
    }
    if (done.length !== src.length) throw new GoogleError('api', 'Google ส่งคำแปลกลับมาไม่ครบ');
    const out = texts.map(() => ''); idx.forEach((i, k) => { out[i] = done[k]; });
    return { out, chars: n };
  } catch (e) {
    // nothing translated → nothing billed, give the reservation back; if some batches went through, keep it (Google billed them)
    if (!done.length) await giveBack(e instanceof Error ? e.message.slice(0, 80) : 'error');
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
