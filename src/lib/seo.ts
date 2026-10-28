import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

/**
 * /admin → SEO settings that reach the public site: meta for the fixed pages (s-fleet, s-blog, s-about …),
 * per-page robots / canonical / OG title (ids: s-home, b-<boat slug>, a-<post id>, s-<page>), robots.txt,
 * AI crawlers, /llms.txt, sitemap hreflang and site-verification codes.
 */
export const SEO_KEY = 'seo.config';
type Bi = { th: string; en: string };
export type PageSx = { index: boolean; follow: boolean; canon: string; ogT: Bi };
export type SeoConfig = {
  pages: Record<string, { t: Bi; d: Bi }>;
  sx: Record<string, PageSx>;
  robots: { txt: string; ai: Record<string, boolean>; llms: boolean };
  /** sitemap.xml: hreflang alternates, and which sections / image entries it lists */
  smap: { hreflang: boolean; pages: boolean; boats: boolean; blog: boolean; images: boolean };
  sset: Record<string, unknown>;
};

export const ROBOTS_DEFAULT = 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api';
export const AI_BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot'] as const;
// every page indexable until staff switch one off (matches the site before the SEO centre went live)
export const SEO_DEFAULT: SeoConfig = {
  pages: {}, sx: {},
  robots: { txt: ROBOTS_DEFAULT, ai: Object.fromEntries(AI_BOTS.map(b => [b, true])), llms: true }, smap: { hreflang: true, pages: true, boats: true, blog: true, images: true }, sset: {},
};

const s = (v: unknown, max: number) => (typeof v === 'string' ? v : '').trim().slice(0, max);
const bi = (v: unknown, max: number): Bi => { const o = (v ?? {}) as Record<string, unknown>; return { th: s(o.th, max), en: s(o.en, max) }; };
const ID = /^(s-[a-z]{2,20}|b-[a-z0-9-]{1,80}|a-\d{1,9})$/;
const url = (v: unknown) => { const u = s(v, 500); return /^https:\/\/[^\s"'<>]+$/.test(u) ? u : ''; };

export function cleanSeo(v: unknown): SeoConfig {
  const c = (v ?? {}) as Record<string, Record<string, unknown>>, out: SeoConfig = structuredClone(SEO_DEFAULT);
  for (const [id, p] of Object.entries(c.pages ?? {}).slice(0, 50)) if (/^s-[a-z]{2,20}$/.test(id)) { const o = (p ?? {}) as Record<string, unknown>; out.pages[id] = { t: bi(o.t, 200), d: bi(o.d, 400) }; }
  out.sx = {};
  for (const [id, p] of Object.entries(c.sx ?? {}).slice(0, 2000)) if (ID.test(id)) {
    const o = (p ?? {}) as Record<string, unknown>, x = { index: o.index !== false, follow: o.follow !== false, canon: url(o.canon), ogT: bi(o.ogT, 200) };
    if (!x.index || !x.follow || x.canon || x.ogT.th || x.ogT.en) out.sx[id] = x;   // keep only pages that differ from the default
  }
  const r = (c.robots ?? {}) as Record<string, unknown>, ai = (r.ai ?? {}) as Record<string, unknown>;
  out.robots = { txt: s(r.txt, 5000) || ROBOTS_DEFAULT, ai: Object.fromEntries(AI_BOTS.map(b => [b, ai[b] !== false])), llms: r.llms !== false };
  const sm = (c.smap ?? {}) as Record<string, unknown>;
  out.smap = { hreflang: sm.hreflang !== false, pages: sm.pages !== false, boats: sm.boats !== false, blog: sm.blog !== false, images: sm.images !== false };
  out.sset = c.sset && typeof c.sset === 'object' && JSON.stringify(c.sset).length < 20_000 ? JSON.parse(JSON.stringify(c.sset)) : {};
  return out;
}

export async function seoConfig(): Promise<SeoConfig> {
  const [row] = await db.select().from(settings).where(eq(settings.key, SEO_KEY));
  return row ? cleanSeo(row.value) : SEO_DEFAULT;
}

/** "google-site-verification=abc" / a whole <meta> tag / just "abc" → "abc" */
const code = (v: unknown) => { const t = s(v, 400); const m = t.match(/content=["']([^"']+)["']/) || t.match(/=\s*([\w-]+)\s*$/); return (m ? m[1] : t).replace(/[^\w-]/g, '').slice(0, 120); };

/** What the public site needs (window.__SEO__) */
export function publicSeo(c: SeoConfig) {
  return { pages: c.pages, sx: c.sx, verify: { google: code(c.sset.gsc), bing: code(c.sset.bing) } };
}
