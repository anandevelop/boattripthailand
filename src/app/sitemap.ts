import type { MetadataRoute } from 'next';
import { DESTINATIONS } from '@/lib/destinations';
import { abs } from '@/lib/i18n';
import { getBoats, getPostIndex } from '@/lib/site-data';
import { seoConfig } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [boats, posts, seo] = await Promise.all([getBoats(), getPostIndex(), seoConfig()]);
  // pages set to noindex in /admin → SEO stay out; hreflang alternates follow the SEO switch
  const off = (id: string) => seo.sx[id]?.index === false, hl = seo.smap.hreflang;
  const both = (p: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}) => ({ url: abs('th', p), ...(hl ? { alternates: { languages: { th: abs('th', p), en: abs('en', p) } } } : {}), ...extra });
  const PAGE_ID: Record<string, string> = { '/': 's-home', '/yacht-charter': 's-fleet', '/blog': 's-blog', '/about-us': 's-about', '/privacy-policy': 's-privacy', '/terms-and-conditions': 's-terms' };
  return [
    ...([['/', 1], ['/yacht-charter', 0.9], ['/destinations', 0.5], ['/blog', 0.5], ['/about-us', 0.5], ['/contact', 0.6], ['/privacy-policy', 0.2], ['/terms-and-conditions', 0.2]] as const).filter(([p]) => !(PAGE_ID[p] && off(PAGE_ID[p]))).map(([p, priority]) => both(p, { priority })),
    ...DESTINATIONS.map(d => both(`/destinations/${d.slug}`, { priority: 0.8 })),
    ...boats.filter(b => !off('b-' + b.slug)).map(b => both(`/yacht-charter/${b.slug}`, { lastModified: b.updatedAt, priority: 0.7 })),
    ...posts.filter(p => !off('a-' + p.id)).flatMap(p => { const langs: Record<string, string> = {}; if (p.hasTh && p.slugTh) langs.th = abs('th', `/blog/${encodeURIComponent(p.slugTh)}`); if (p.hasEn && p.slugEn) langs.en = abs('en', `/blog/${encodeURIComponent(p.slugEn)}`); return Object.values(langs).map(url => ({ url, lastModified: p.date, ...(hl ? { alternates: { languages: langs } } : {}) })); }),
  ];
}
