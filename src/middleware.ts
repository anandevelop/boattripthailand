import { NextResponse, type NextRequest } from 'next/server';

/**
 * 1. 301 redirects from the old WordPress URLs (table `redirects`, cached 5 min)
 * 2. trailing slash → none, /th/xxx → /xxx (Thai is the default language, English lives under /en)
 */
export const config = { runtime: 'nodejs', matcher: ['/((?!_next/|api/|admin|boats/|brand/|img/|site/|site-data.js|uploads/|feeds/|icon|favicon|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml|js|css|map)$).*)'] };

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

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  let path: string;
  try { path = decodeURIComponent(url.pathname); } catch { path = url.pathname; }
  const key = path.replace(/\/+$/, '') || '/';

  const r = (await redirectMap()).get(key);
  if (r && r.code === 410) { void hit(key); return new NextResponse('Gone', { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' } }); }
  if (r) { void hit(key); return NextResponse.redirect(new URL(encodeURI(r.to) + url.search, url), r.code === 302 ? 302 : 301); }

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) return NextResponse.redirect(new URL(url.pathname.replace(/\/+$/, '') + url.search, url), 308);
  if (key === '/th' || key.startsWith('/th/')) return NextResponse.redirect(new URL((key.slice(3) || '/') + url.search, url), 301);
  return NextResponse.next();
}
