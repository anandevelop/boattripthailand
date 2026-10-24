import 'server-only';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { boats, posts, seasonCalendars, type Boat, type Post } from '@/db/schema';
import type { Lang } from './i18n';
import { fromPriceOn, pricesOn, todayISO, type Calendar } from './season';

export const getCalendars = unstable_cache(async () => (await db.select().from(seasonCalendars)) as Calendar[], ['calendars'], { revalidate: 300, tags: ['calendars'] });
export const getBoats = unstable_cache(async () => db.select().from(boats).where(eq(boats.active, true)).orderBy(boats.sortOrder), ['boats'], { revalidate: 300, tags: ['boats'] });

export async function boatsWithPrice(date = todayISO()) {
  const [list, cals] = await Promise.all([getBoats(), getCalendars()]);
  const cal = (id: string | null) => cals.find(c => c.id === id) ?? cals.find(c => c.id === 'all')!;
  return list.map(b => ({ ...b, priceToday: fromPriceOn(b, cal(b.calendarId), date) ?? b.fromPrice }));
}
export type BoatCard = Awaited<ReturnType<typeof boatsWithPrice>>[number];

export async function boatDetail(slug: string, date: string) {
  const [list, cals] = await Promise.all([getBoats(), getCalendars()]);
  const b = list.find(x => x.slug === slug);
  if (!b) return null;
  const cal = cals.find(c => c.id === b.calendarId) ?? cals.find(c => c.id === 'all')!;
  return { boat: b, cal, tables: pricesOn(b, cal, date), from: fromPriceOn(b, cal, date) ?? b.fromPrice };
}

export const allPrograms = (b: Boat) => [...new Set(b.data.tables.flatMap(t => t.rows.map(r => r[0]).filter(Boolean)))];

export const postSlug = (p: Pick<Post, 'slugTh' | 'slugEn'>, lang: Lang) => (lang === 'en' ? p.slugEn : p.slugTh);
export const hasLang = (p: Post, lang: Lang) => !!(p.title[lang] && p.blocks[lang]?.length && postSlug(p, lang));

export const getPostIndex = unstable_cache(async () => db.select({ id: posts.id, slugTh: posts.slugTh, slugEn: posts.slugEn, category: posts.category, date: posts.date, cover: posts.cover, title: posts.title, excerpt: posts.excerpt, hasTh: sql<boolean>`jsonb_array_length(${posts.blocks}->'th') > 0`, hasEn: sql<boolean>`jsonb_array_length(${posts.blocks}->'en') > 0` }).from(posts).where(eq(posts.published, true)).orderBy(desc(posts.date)), ['posts-index'], { revalidate: 300, tags: ['posts'] });
export type PostCard = Awaited<ReturnType<typeof getPostIndex>>[number];

export async function getPost(lang: Lang, slug: string) {
  const [p] = await db.select().from(posts).where(and(eq(posts.published, true), or(eq(lang === 'en' ? posts.slugEn : posts.slugTh, slug), eq(lang === 'en' ? posts.slugTh : posts.slugEn, slug)))).limit(1);
  return p ?? null;
}

export const BLOG_CATS: Record<string, { th: string; en: string }> = { guide: { th: 'คู่มือเช่าเรือ', en: 'Charter guides' }, route: { th: 'เส้นทาง & เกาะ', en: 'Routes & islands' }, boat: { th: 'ประเภทเรือ', en: 'Boat types' }, event: { th: 'งานอีเวนต์บนเรือ', en: 'Events on board' }, news: { th: 'ข่าวสาร', en: 'News' } };
