import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { boats, posts, seasonCalendars } from '@/db/schema';
import { fromPriceOn, todayISO, type Calendar } from './season';

export const getCalendars = unstable_cache(async () => (await db.select().from(seasonCalendars)) as Calendar[], ['calendars'], { revalidate: 300, tags: ['calendars'] });
export const getBoats = unstable_cache(async () => db.select().from(boats).where(eq(boats.active, true)).orderBy(boats.sortOrder), ['boats'], { revalidate: 300, tags: ['boats'] });

export async function boatsWithPrice(date = todayISO()) {
  const [list, cals] = await Promise.all([getBoats(), getCalendars()]);
  const cal = (id: string | null) => cals.find(c => c.id === id) ?? cals.find(c => c.id === 'all')!;
  return list.map(b => ({ ...b, priceToday: fromPriceOn(b, cal(b.calendarId), date) ?? b.fromPrice }));
}

export const getPostIndex = unstable_cache(async () => db.select({ id: posts.id, slugTh: posts.slugTh, slugEn: posts.slugEn, category: posts.category, date: posts.date, updatedAt: posts.updatedAt, cover: posts.cover, title: posts.title, excerpt: posts.excerpt, hasTh: sql<boolean>`jsonb_array_length(${posts.blocks}->'th') > 0`, hasEn: sql<boolean>`jsonb_array_length(${posts.blocks}->'en') > 0` }).from(posts).where(eq(posts.published, true)).orderBy(desc(posts.date)), ['posts-index'], { revalidate: 300, tags: ['posts'] });
