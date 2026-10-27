import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from '@/db';

/**
 * Hourly page-view totals for the "24 ชม." view in /admin → วิเคราะห์เว็บไซต์ → ข้อมูลจริง.
 * One row per Thailand hour ("2026-10-27T14"): views and new sessions only — no page, no visitor.
 * The table is created on first use (no migration needed) and keeps the last 7 days.
 */
let ready: Promise<unknown> | null = null;
const ensure = () => ready ??= db.execute(sql`create table if not exists traffic_hourly (hour text primary key, views integer not null default 0, sessions integer not null default 0)`).catch(e => { ready = null; throw e; });

/** Thailand hour key, `n` hours ago (0 = the current hour) */
export const thHour = (n = 0) => new Date(Date.now() + 7 * 3600_000 - n * 3600_000).toISOString().slice(0, 13);
/** the last `count` hour keys, oldest first (the current hour last) */
export const lastHours = (count: number) => Array.from({ length: count }, (_, i) => thHour(count - 1 - i));

export async function hourlyHit(first: boolean) {
  await ensure();
  await db.execute(sql`insert into traffic_hourly (hour, views, sessions) values (${thHour()}, 1, ${first ? 1 : 0})
    on conflict (hour) do update set views = traffic_hourly.views + 1, sessions = traffic_hourly.sessions + ${first ? 1 : 0}`);
  if (Math.random() < .01) await db.execute(sql`delete from traffic_hourly where hour < ${thHour(24 * 7)}`);
}

/** the last 48 hours: previous 24, then the latest 24 (current hour included) */
export async function hourlySeries() {
  await ensure();
  const H = lastHours(48);
  const r = await db.execute(sql`select hour, views, sessions from traffic_hourly where hour >= ${H[0]}`);
  const rows = ((r as unknown as { rows?: { hour: string; views: number; sessions: number }[] }).rows ?? (r as unknown as { hour: string; views: number; sessions: number }[]));
  const m = new Map(rows.map(x => [x.hour, x]));
  const s = H.map(h => ({ h, views: Number(m.get(h)?.views ?? 0), sessions: Number(m.get(h)?.sessions ?? 0) }));
  return { prev: s.slice(0, 24), cur: s.slice(24) };
}
