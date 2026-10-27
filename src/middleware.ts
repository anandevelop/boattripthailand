import { statSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * 1. 301 redirects from the old WordPress URLs (table `redirects`, cached 5 min)
 * 2. trailing slash → none, /th/xxx → /xxx (Thai is the default language, English lives under /en)
 * 3. โหมดปิดปรับปรุง: visitors get a 503 page with the contact channels; signed-in staff see the site
 * 4. /boats and /img: the same URL, a lighter file — AVIF (or WebP for PNG/JPG) when the browser accepts it.
 *    The twins sit next to each image (x.webp.avif, x.png.webp), made by `node scripts/optimize-images.mjs`; an empty twin = no gain.
 */
export const config = { runtime: 'nodejs', matcher: ['/boats/:path*', '/img/:path*', '/((?!_next/|api/|admin|boats/|brand/|img/|site/|site-data.js|uploads/|feeds/|icon|favicon|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml|js|css|map)$).*)'] };

let cache: { at: number; map: Map<string, { to: string; code: number }> } | null = null;
async function redirectMap() {
  if (cache && Date.now() - cache.at < 300_000) return cache.map;
  try {
    const { db } = await import('@/db');
    const { redirects } = await import('@/db/schema');
    const rows = await db.select().from(redirects);
    cache = { at: Date.now(), map: new Map(rows.map(r => [r.from, { to: r.to, code: r.code }])) };
  } catch (e) { console.error('[redirects]', e); cache = { at: Date.now() - 240_000, map: cache?.map ?? new Map() }; }
  return cache.map;
}
async function hit(from: string) {
  try { const { db } = await import('@/db'); const { redirects } = await import('@/db/schema'); const { eq, sql } = await import('drizzle-orm'); await db.update(redirects).set({ hits: sql`${redirects.hits} + 1` }).where(eq(redirects.from, from)); } catch { /* ignore */ }
}

const PUB = join(process.cwd(), 'public'), twins = new Map<string, boolean>();
const hasTwin = (p: string) => { let v = twins.get(p); if (v === undefined) { try { v = statSync(join(PUB, p)).size > 0; } catch { v = false; } if (twins.size > 5000) twins.clear(); twins.set(p, v); } return v; };
function lighterImage(req: NextRequest, path: string) {
  const acc = req.headers.get('accept') || '', ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  const twin = /image\/avif/.test(acc) && hasTwin(path + '.avif') ? '.avif' : ext !== 'webp' && /image\/webp/.test(acc) && hasTwin(path + '.webp') ? '.webp' : '';
  const res = twin ? NextResponse.rewrite(new URL(req.nextUrl.pathname + twin, req.nextUrl)) : NextResponse.next();
  res.headers.set('Vary', 'Accept');   // caches keep one copy per format
  return res;
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  let path: string;
  try { path = decodeURIComponent(url.pathname); } catch { path = url.pathname; }
  if (/^\/(boats|img)\/.+\.(webp|png|jpe?g)$/i.test(path)) return lighterImage(req, path);
  if (path.startsWith('/boats/') || path.startsWith('/img/')) return NextResponse.next();
  const key = path.replace(/\/+$/, '') || '/';

  const r = (await redirectMap()).get(key);
  if (r && r.code === 410) { void hit(key); return new NextResponse('Gone', { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' } }); }
  if (r) { void hit(key); return NextResponse.redirect(new URL(encodeURI(r.to) + url.search, url), r.code === 302 ? 302 : 301); }

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) return NextResponse.redirect(new URL(url.pathname.replace(/\/+$/, '') + url.search, url), 308);
  if (key === '/th' || key.startsWith('/th/')) return NextResponse.redirect(new URL((key.slice(3) || '/') + url.search, url), 301);

  const { maintenance, isStaff, maintenancePage } = await import('@/lib/maintenance');
  const m = await maintenance();
  if (m.on && !(await isStaff(req.cookies.get('btt_admin')?.value /* = SESSION_COOKIE in lib/auth */))) {
    return new NextResponse(maintenancePage(m, key === '/en' || key.startsWith('/en/')), { status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '3600', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  return NextResponse.next();
}
