import 'server-only';
import { and, desc, gte, like, lt, not, sql } from 'drizzle-orm';
import { db } from '@/db';
import { trafficDaily as t } from '@/db/schema';

/** Thailand date `n` days ago (0 = today) */
const thDay = (n: number) => new Date(Date.now() + 7 * 3600_000 - n * 864e5).toISOString().slice(0, 10);

/** Website traffic for /admin → วิเคราะห์เว็บไซต์: current period vs the one before, from the first-party counter. */
export async function analyticsData(days: number) {
  const from = thDay(days - 1), prevFrom = thDay(days * 2 - 1), tomorrow = thDay(-1);
  const pages = not(like(t.path, '404:%')), cur = and(gte(t.day, from), lt(t.day, tomorrow), pages);
  const views = sql<number>`sum(${t.views})::int`, sessions = sql<number>`sum(${t.sessions})::int`;
  const slug = sql<string>`regexp_replace(${t.path}, '^(/en)?/yacht-charter/', '')`;
  const [daily, byPath, bySource, byDevice, byLang, notFound, first, byBoat] = await Promise.all([
    db.select({ day: sql<string>`${t.day}::text`, views, sessions }).from(t).where(and(gte(t.day, prevFrom), lt(t.day, tomorrow), pages)).groupBy(t.day),
    db.select({ path: t.path, views, sessions }).from(t).where(cur).groupBy(t.path).orderBy(desc(views)).limit(40),
    db.select({ source: t.source, views, sessions }).from(t).where(cur).groupBy(t.source).orderBy(desc(sessions)),
    db.select({ device: t.device, views, sessions }).from(t).where(cur).groupBy(t.device).orderBy(desc(sessions)),
    db.select({ lang: t.lang, views, sessions }).from(t).where(cur).groupBy(t.lang).orderBy(desc(sessions)),
    db.select({ path: sql<string>`substr(${t.path}, 5)`, views }).from(t).where(and(gte(t.day, thDay(89)), like(t.path, '404:%'))).groupBy(t.path).orderBy(desc(views)).limit(30),
    db.select({ day: sql<string>`min(${t.day})::text` }).from(t),
    db.select({ slug, views }).from(t).where(and(cur, sql`${t.path} ~ '^(/en)?/yacht-charter/[^/]+$'`)).groupBy(slug).orderBy(desc(views)).limit(80),
  ]);
  // one value per day, oldest first: previous period then current period
  const map = new Map(daily.map(d => [d.day, d]));
  const series = Array.from({ length: days * 2 }, (_, i) => { const d = map.get(thDay(days * 2 - 1 - i)); return { views: d?.views ?? 0, sessions: d?.sessions ?? 0 }; });
  return { days, since: first[0]?.day ?? null, prev: series.slice(0, days), cur: series.slice(days), byPath, bySource, byDevice, byLang, notFound, byBoat };
}
