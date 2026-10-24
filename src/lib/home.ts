import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

/**
 * Homepage content edited in /admin → เนื้อหาเว็บไซต์ (Hero, promo banner, FAQ, homepage SEO).
 * data/home.json holds the site's original text; once staff publish, settings 'site.home' replaces it.
 * Text may contain tokens such as {boats} or {from:yacht} that the public app.js fills in (see _tokens in home.json).
 */
export const HOME_KEY = 'site.home';
type Bi = { th: string; en: string };
export type Home = {
  hero: { kicker: Bi; title: Bi; words: Bi[]; sub: Bi; cta1: Bi; cta2: Bi };
  promo: { tag: Bi; title: Bi; sub: Bi; cta: Bi; boat: string; price: number | null; start: string; end: string };
  faq: [Bi, Bi][];
  seo: { title: Bi; desc: Bi; kw: Bi };
};

export const HOME_DEFAULT: Home = (() => {
  const { _tokens, ...h } = JSON.parse(readFileSync(path.join(process.cwd(), 'data/home.json'), 'utf8'));
  void _tokens;
  return h as Home;
})();

const s = (v: unknown, max: number) => (typeof v === 'string' ? v : '').trim().slice(0, max);
const bi = (v: unknown, max = 300): Bi => { const o = (v ?? {}) as Record<string, unknown>; return { th: s(o.th, max), en: s(o.en, max) }; };
const day = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(s(v, 10)) ? s(v, 10) : '');

/** Accepts only the expected shape; anything missing falls back to the original text. */
export function cleanHome(v: unknown): Home {
  const c = (v ?? {}) as Record<string, Record<string, unknown>>, D = HOME_DEFAULT;
  const h = c.hero ?? {}, p = c.promo ?? {}, q = c.seo ?? {};
  const words = (Array.isArray(h.words) ? h.words : []).map(w => bi(w, 60)).filter(w => w.th || w.en).slice(0, 8);
  const faq = (Array.isArray(c.faq) ? c.faq : []).map(x => (Array.isArray(x) ? [bi(x[0], 300), bi(x[1], 2000)] : null))
    .filter((x): x is [Bi, Bi] => !!x && !!(x[0].th || x[0].en)).slice(0, 30);
  const price = Number(p.price);
  return {
    hero: { kicker: bi(h.kicker, 80), title: bi(h.title, 120), words: words.length ? words : D.hero.words, sub: bi(h.sub, 200), cta1: bi(h.cta1, 40), cta2: bi(h.cta2, 40) },
    promo: { tag: bi(p.tag, 40), title: bi(p.title, 160), sub: bi(p.sub, 400), cta: bi(p.cta, 40), boat: s(p.boat, 120), price: Number.isFinite(price) && price > 0 ? Math.round(price) : null, start: day(p.start), end: day(p.end) },
    faq,
    seo: { title: bi(q.title, 200), desc: bi(q.desc, 400), kw: bi(q.kw, 80) },
  };
}

export async function homeContent(): Promise<Home> {
  const [row] = await db.select().from(settings).where(eq(settings.key, HOME_KEY));
  return row ? cleanHome(row.value) : HOME_DEFAULT;
}
