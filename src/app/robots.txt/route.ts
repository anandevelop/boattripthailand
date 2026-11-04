import { SITE } from '@/lib/i18n';
import { AI_BOTS, seoConfig } from '@/lib/seo';
import { noindexSite, reqHost } from '@/lib/indexing';

export const dynamic = 'force-dynamic';

/** robots.txt from /admin → SEO → Sitemap & Robots (text + AI crawler switches); the sitemap line is always added */
export async function GET(req: Request) {
  const noindex = noindexSite(reqHost(req.headers));
  const { robots } = await seoConfig();
  const blocked = AI_BOTS.filter(b => robots.ai[b] === false);
  const body = [
    robots.txt.replace(/^\s*Sitemap:.*$/gim, '').trim(),
    ...blocked.map(b => `User-agent: ${b}\nDisallow: /`),
    // crawling stays allowed so engines can read the noindex header; the sitemap is not advertised on the dev domain
    noindex ? '# dev / staging copy: every page is noindex until the move to boattripthailand.com' : `Sitemap: ${SITE}/sitemap.xml`,
  ].join('\n\n') + '\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
