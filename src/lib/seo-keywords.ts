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
