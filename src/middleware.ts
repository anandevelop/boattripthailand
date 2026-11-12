import { statSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { noindexSite, reqHost } from '@/lib/indexing';

/**
 * 1. 301 redirects from the old WordPress URLs (table `redirects`, cached 1 min / until the next admin save)
 * 2. trailing slash → none, /th/xxx → /xxx (Thai is the default language, English lives under /en) — always one 301 to the final page
 * 2b. www.<domain> → <domain> (301; files the middleware does not see: next.config.mjs redirects)
 * 3. โหมดปิดปรับปรุง: visitors get a 503 page with the contact channels; signed-in staff see the site
 * 4. /boats and /img: the same URL, a lighter file — AVIF (or WebP for PNG/JPG) when the browser accepts it.
 *    The twins sit next to each image (x.webp.avif, x.png.webp), made by `node scripts/optimize-images.mjs`; an empty twin = no gain.
 * 5. noindex mode (lib/indexing: dev domain new.*): X-Robots-Tag noindex on every page and image
 */
export const config = { runtime: 'nodejs', matcher: ['/boats/:path*', '/img/:path*', '/((?!_next/|api/|admin|boats/|brand/|img/|r/|site/|site-data.js|uploads/|feeds/|icon|favicon|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml|js|css|map)$).*)'] };

let cache: { at: number; map: Map<string, { to: string; code: number }> } | null = null;
async function redirectMap() {
  // reloaded every minute, and right after an admin save (clearSiteCache in lib/site-render marks the time on globalThis)
  const changed = (globalThis as { __bttRedirAt?: number }).__bttRedirAt ?? 0;
  if (cache && cache.at > changed && Date.now() - cache.at < 60_000) return cache.map;
  try {
    const { db } = await import('@/db');
    const { redirects } = await import('@/db/schema');
    const rows = await db.select().from(redirects);
    cache = { at: Date.now(), map: new Map(rows.map(r => [r.from, { to: r.to, code: r.code }])) };
  } catch (e) { console.error('[redirects]', e); cache = { at: Date.now() - 45_000, map: cache?.map ?? new Map() }; }
  return cache.map;
}
/* boat slugs, for the old WordPress boat URLs that are not in the table (cached 5 min) */
let boatCache: { at: number; set: Set<string> } | null = null;
async function boatSlugs() {
  if (boatCache && Date.now() - boatCache.at < 300_000) return boatCache.set;
  try { const { db } = await import('@/db'); const { boats } = await import('@/db/schema'); boatCache = { at: Date.now(), set: new Set((await db.select({ s: boats.slug }).from(boats)).map(r => r.s)) }; }
  catch (e) { console.error('[redirects] boats', e); boatCache = { at: Date.now() - 240_000, set: boatCache?.set ?? new Set() }; }
  return boatCache.set;
}
/** old WordPress boat URL → new one: /yacht/<boat> → /en/yacht-charter/<boat>, /th/yacht/<boat>-th → /yacht-charter/<boat>;
 *  the name as it was, or with "-ft" / "46ft" → "46-ft"; no such boat (any more) → the boat list */
async function oldBoatUrl(key: string) {
  const m = key.match(/^(\/th)?\/(yacht|yachts|type-yacht)(?:\/([^/]+))?$/); if (!m) return null;
  const base = m[1] ? '/yacht-charter' : '/en/yacht-charter';
  if (m[2] !== 'yacht' || !m[3]) return base;
  const raw = m[3].toLowerCase().replace(/-th$/, ''), set = await boatSlugs();
  const found = [raw, raw + '-ft', raw.replace(/(\d)ft$/, '$1-ft'), raw.replace(/-(th|en)$/, '')].find(x => set.has(x));
  return found ? `${base}/${found}` : base;
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

/** AI agents / crawlers never run the page script, so they are counted here from the user agent (วิเคราะห์เว็บไซต์ → แหล่งที่มา & คลิก) */
const AI_UA = /GPTBot|ChatGPT-User|OAI-SearchBot|Claude|anthropic-ai|Perplexity|Bytespider|GoogleOther|Google-Extended|Google-Agent|Gemini-Deep-Research|Meta-External|Amazonbot|Applebot-Extended|CCBot|cohere-ai|Diffbot|YouBot|PetalBot|TikTokSpider|MistralAI-User|DuckAssistBot/i;
function countBot(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  if (!AI_UA.test(ua) || req.method !== 'GET') return;
  let p = req.nextUrl.pathname; try { p = decodeURIComponent(p); } catch { /* keep */ }
  if (/^\/(boats|img)\//.test(p) || /[<>"'`\\\u0000-\u001f]/.test(p)) return;
  void import('@/lib/traffic-src').then(m => m.botHit(ua, p.length > 1 ? p.replace(/\/+$/, '') : p)).catch(e => console.error('[bot count]', e));
}
export async function middleware(req: NextRequest) {
  countBot(req);
  const res = await route(req);
  if (noindexSite(reqHost(req.headers))) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

async function route(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl;
  let path: string;
  try { path = decodeURIComponent(url.pathname); } catch { path = url.pathname; }
  if (/^\/(boats|img)\/.+\.(webp|png|jpe?g)$/i.test(path)) return lighterImage(req, path);
  if (path.startsWith('/boats/') || path.startsWith('/img/')) return NextResponse.next();
  const key = path.replace(/\/+$/, '') || '/';

  const map = await redirectMap();
  const gone = () => new NextResponse('Gone', { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
  // one hop to the final page: a redirect whose target is itself redirected is followed here (a few steps at most)
  const follow = (to: string) => { for (let i = 0; i < 4; i++) { const [p, q] = to.split('?'), n = map.get(p.replace(/\/+$/, '') || '/'); if (!n || n.code === 410 || n.to === to) break; to = n.to + (q && !n.to.includes('?') ? '?' + q : ''); } return to; };
  // www.boattripthailand.com → boattripthailand.com, in the same hop as any other redirect
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim().toLowerCase(), www = host.startsWith('www.');
  const go = (to: string, code = 301) => { const u = new URL(encodeURI(to) + (to.includes('?') ? '' : url.search), url); if (www) { u.protocol = 'https:'; u.host = host.slice(4).replace(/:\d+$/, ''); u.port = ''; } return NextResponse.redirect(u, code); };

  const r = map.get(key);
  if (r && r.code === 410) { void hit(key); return gone(); }
  if (r) { void hit(key); return go(follow(r.to), r.code === 302 ? 302 : 301); }

  // old WordPress boat / boat-type pages that are not in the table
  const ob = await oldBoatUrl(key);
  if (ob) return go(follow(ob), 301);

  // trailing slash and the old /th/ prefix (Thai is the default language now) — together, in one 301, then any redirect of the result
  const slash = url.pathname.length > 1 && url.pathname.endsWith('/'), th = key === '/th' || key.startsWith('/th/');
  if (slash || th) {
    const clean = th ? key.slice(3) || '/' : key, r2 = map.get(clean);
    if (r2 && r2.code === 410) { void hit(clean); return gone(); }
    if (r2) void hit(clean);
    return go(r2 ? follow(r2.to) : clean, 301);
  }
  if (www) return go(key, 301);

  const { maintenance, isStaff, maintenancePage } = await import('@/lib/maintenance');
  const m = await maintenance();
  if (m.on && !(await isStaff(req.cookies.get('btt_admin')?.value /* = SESSION_COOKIE in lib/auth */))) {
    return new NextResponse(maintenancePage(m, key === '/en' || key.startsWith('/en/')), { status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '3600', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  return NextResponse.next();
}
