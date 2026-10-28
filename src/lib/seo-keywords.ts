import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

/**
 * /admin → ศูนย์ SEO → คีย์เวิร์ด: rankings imported from a Search Console export (Queries.csv).
 * The latest import and the one before it are kept, so the table can show the change since last time.
 * Used while the Search Console API is not connected (or to keep a snapshot of a longer period).
 */
export const KW_KEY = 'seo.keywords';
export type KwRow = { q: string; clicks: number; imp: number; ctr: number; pos: number };
export type KwImport = { at: string; file: string; by: string; rows: KwRow[] };
export type KwStore = { cur: KwImport | null; prev: KwImport | null };

const num = (v: unknown, max: number) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0; };
export function cleanKwRows(v: unknown): KwRow[] {
  const seen = new Set<string>(), out: KwRow[] = [];
  for (const x of Array.isArray(v) ? v.slice(0, 5000) : []) {
    const o = (x ?? {}) as Record<string, unknown>, q = (typeof o.q === 'string' ? o.q : '').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!q || seen.has(q.toLowerCase())) continue; seen.add(q.toLowerCase());
    out.push({ q, clicks: Math.round(num(o.clicks, 1e9)), imp: Math.round(num(o.imp, 1e10)), ctr: num(o.ctr, 1), pos: Math.round(num(o.pos, 1000) * 10) / 10 });
  }
  return out;
}
export async function kwStore(): Promise<KwStore> {
  const [r] = await db.select().from(settings).where(eq(settings.key, KW_KEY));
  const v = (r?.value ?? {}) as Partial<KwStore>;
  return { cur: v.cur ?? null, prev: v.prev ?? null };
}
/** a new import becomes `cur`; the previous `cur` moves to `prev` */
export async function kwImport(rows: KwRow[], file: string, by: string): Promise<KwStore> {
  const old = await kwStore();
  const v: KwStore = { cur: { at: new Date().toISOString(), file: file.slice(0, 120), by, rows }, prev: old.cur };
  await db.insert(settings).values({ key: KW_KEY, value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } });
  return v;
}

/* ---------- ศูนย์ SEO → AI Search: questions checked by hand in Google AI Overview, ChatGPT and Perplexity ---------- */
export const AI_KEY = 'seo.ai';
const ENG = ['g', 'c', 'p'] as const, RES = ['cited', 'mention', 'no'] as const;
type Check = { r: (typeof RES)[number]; at: string; url: string; hist: [string, string][] };
export type AiQ = { id: string; q: string; lang: 'th' | 'en'; at: string; checks: Partial<Record<(typeof ENG)[number], Check>> };
export type AiStore = { cfg: { freq: 'weekly' | 'biweekly' | 'monthly'; n: number }; qs: AiQ[] };
const txt = (v: unknown, max: number) => (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().slice(0, max);
const day = (v: unknown) => /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? String(v).slice(0, 10) : new Date().toISOString().slice(0, 10);
export function cleanAi(v: unknown): AiStore {
  const o = (v ?? {}) as Record<string, unknown>, c = (o.cfg ?? {}) as Record<string, unknown>;
  const freq = (['weekly', 'biweekly', 'monthly'] as const).find(f => f === c.freq) ?? 'weekly', n = [10, 20, 30, 50].includes(Number(c.n)) ? Number(c.n) : 30;
  const qs: AiQ[] = [], seen = new Set<string>();
  for (const x of Array.isArray(o.qs) ? o.qs.slice(0, 300) : []) {
    const q = (x ?? {}) as Record<string, unknown>, text = txt(q.q, 200); if (!text || seen.has(text.toLowerCase())) continue; seen.add(text.toLowerCase());
    const checks: AiQ['checks'] = {}, ch = (q.checks ?? {}) as Record<string, Record<string, unknown>>;
    for (const e of ENG) { const k = ch[e]; if (!k || !RES.includes(k.r as never)) continue;
      checks[e] = { r: k.r as Check['r'], at: day(k.at), url: /^https?:\/\//.test(txt(k.url, 500)) ? txt(k.url, 500) : '', hist: (Array.isArray(k.hist) ? k.hist : []).slice(-8).filter((h): h is [string, string] => Array.isArray(h) && RES.includes(h[1] as never)).map(h => [day(h[0]), String(h[1])]) }; }
    qs.push({ id: txt(q.id, 40) || Math.random().toString(36).slice(2, 10), q: text, lang: q.lang === 'en' ? 'en' : 'th', at: day(q.at), checks });
  }
  return { cfg: { freq, n }, qs };
}
export async function aiStore(): Promise<AiStore> { const [r] = await db.select().from(settings).where(eq(settings.key, AI_KEY)); return cleanAi(r?.value); }
export async function aiSave(v: unknown) { const s = cleanAi(v); await db.insert(settings).values({ key: AI_KEY, value: s }).onConflictDoUpdate({ target: settings.key, set: { value: s } }); return s; }
