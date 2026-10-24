import 'server-only';
import { inArray } from 'drizzle-orm';
import { db } from '@/db';
import { boats, seasonCalendars } from '@/db/schema';
import { surchargeOn, type Calendar } from './season';

/**
 * Holiday-surcharge warnings for leads ("ปีใหม่ · +4,000 (Half day) / +7,000 (Full day) บาท"), keyed by `${slug}|${date}`.
 * Sales confirm the final price with the boat owner before quoting.
 */
export async function surchargeWarnings(items: { slug: string | null; date: string | null }[]) {
  const want = items.filter((x): x is { slug: string; date: string } => !!x.slug && !!x.date && /^\d{4}-\d{2}-\d{2}$/.test(x.date));
  const out = new Map<string, string>();
  if (!want.length) return out;
  const [bs, cals] = await Promise.all([
    db.select({ slug: boats.slug, data: boats.data, calendarId: boats.calendarId }).from(boats).where(inArray(boats.slug, [...new Set(want.map(x => x.slug))])),
    db.select().from(seasonCalendars),
  ]);
  const calOf = (id: string | null) => (cals.find(c => c.id === id) ?? cals.find(c => c.id === 'all')) as Calendar | undefined;
  for (const { slug, date } of want) {
    const b = bs.find(x => x.slug === slug), cal = b && calOf(b.calendarId);
    const s = b && cal ? surchargeOn(b as Parameters<typeof surchargeOn>[0], cal, date) : null;
    if (s) out.set(`${slug}|${date}`, s.text);
  }
  return out;
}

export async function surchargeWarning(slug: string | null, date: string | null) {
  return (await surchargeWarnings([{ slug, date }])).get(`${slug}|${date}`) ?? null;
}
