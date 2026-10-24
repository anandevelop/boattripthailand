import { currentUser } from '@/lib/auth';
import { can } from '@/lib/perms';
import { renderPostPreview, renderSite, routeExists } from '@/lib/site-render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cfg = () => ({ site: (process.env.APP_URL || 'https://www.boattripthailand.com').replace(/\/$/, ''), pixel: process.env.NEXT_PUBLIC_META_PIXEL_ID || '', ga: process.env.NEXT_PUBLIC_GA_ID || '' });
const PRIVATE = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pid = url.searchParams.get('preview');
  if (pid && url.pathname.replace(/^\/en(?=\/)/, '').startsWith('/blog/')) return preview(url, Number(pid));
  const ok = await routeExists(url.pathname);
  const target = ok ? url : new URL((url.pathname.startsWith('/en') ? '/en' : '') + '/404', url);
  const html = await renderSite(target, cfg());
  return new Response(html, {
    status: ok ? 200 : 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': ok ? 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' : 'no-store' },
  });
}

/** /blog/<slug>?preview=<id> — staff with content permission see the article whatever its status */
async function preview(url: URL, id: number) {
  const u = await currentUser();
  if (!u) return Response.redirect(new URL('/admin/login', url), 302);
  if (!can(u, 'content') || !Number.isInteger(id) || id < 1) return new Response('ไม่มีสิทธิ์ดูตัวอย่างบทความนี้', { status: 403, headers: PRIVATE });
  const r = await renderPostPreview(url, id, cfg());
  if (!r) return new Response('ไม่พบบทความ', { status: 404, headers: PRIVATE });
  if ('redirect' in r) return Response.redirect(new URL(r.redirect!, url), 302);
  return new Response(r.html, { headers: PRIVATE });
}
