import 'server-only';
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { boats, posts, seasonCalendars, settings } from '@/db/schema';
import { DESTINATIONS } from './destinations';
import { SITE } from './i18n';
import { homeContent } from './home';
import { activitiesContent } from './activities';
import { publicSeo, seoConfig } from './seo';

/**
 * Public site = the approved mockup (site/shell.html + public/site/app.js), rendered on the
 * server so every URL ships complete HTML + SEO tags, then the same script runs in the browser.
 */
type Assets = { shell: string; app: vm.Script; fleet: vm.Script; lucide: vm.Script; version: string };
type Bundle = { at: number; data: SiteData; js: string; version: string };
type Entry = { at: number; gen: number; gz: Buffer };
/*
 * Next.js bundles this module separately into every route that imports it (the site, /site-home.js, /site-data.js, the
 * admin API …). The caches and the render queue live on globalThis so all of them share ONE copy: an admin save clears
 * the cache the site route actually serves from, and two routes never render at the same time.
 */
const S = ((globalThis as unknown as { __bttSsr?: unknown }).__bttSsr ??= {
  assets: null, dataCache: null, dataLoading: null, gen: 0, queued: 0, qTail: Promise.resolve(),
  pages: new Map(), inflight: new Map(), home: new Map(), homeLatest: {}, homeByKey: {}, hi: [], lo: [], pumping: false,
}) as { assets: Assets | null; dataCache: Bundle | null; dataLoading: Promise<Bundle> | null; gen: number; queued: number; qTail: Promise<unknown>;
  pages: Map<string, Entry>; inflight: Map<string, Promise<string>>; home: Map<string, string>; homeLatest: Record<string, string>;
  homeByKey: Record<string, string>; hi: Job[]; lo: Job[]; pumping: boolean };
type Job = { key: string; run: () => void };
S.homeByKey ??= {}; S.hi ??= []; S.lo ??= [];
const ROOT = process.cwd();
const read = (p: string) => readFileSync(path.join(ROOT, p), 'utf8');
function loadAssets() {
  if (S.assets && process.env.NODE_ENV === 'production') return S.assets;
  const appPath = path.join(ROOT, 'public/site/app.js');
  // fleet.js (หน้าเรือทั้งหมด) runs right after app.js, in the browser and here
  const version = String(Math.floor(Math.max(statSync(appPath).mtimeMs, statSync(path.join(ROOT, 'public/site/fleet.js')).mtimeMs)));
  if (S.assets && S.assets.version === version) return S.assets;
  S.assets = { shell: read('site/shell.html').replaceAll('__V__', version).replaceAll('https://boattripthailand.com', SITE), app: new vm.Script(read('public/site/app.js'), { filename: 'app.js' }), fleet: new vm.Script(read('public/site/fleet.js'), { filename: 'fleet.js' }), lucide: new vm.Script(read('public/site/lucide.full.min.js'), { filename: 'lucide.js' }), version };
  return S.assets;
}

/* ---------------- data (cached) ---------------- */
type SiteData = { __SET__: Record<string, unknown>; __HOME__: unknown; __ACTS__: unknown[]; __SEO__: unknown; FLEET: unknown[]; EXTRA: unknown; SEASONS: unknown; BIMG: Record<string, Record<string, string>>; GALLERY: Record<string, string[]>; SHOWIMG: Record<string, string[]>; TEAM_IMG: Record<string, string>; POSTS: PostIdx[]; DEST_PAGES: unknown[] };
type PostIdx = { id: number; cat: string; date: string; cover: string | null; title: { th: string; en: string }; slug: { th: string; en: string }; excerpt: { th: string; en: string }; kw: { th: string; en: string }; has: { th: boolean; en: boolean }; read: { th: number; en: number } };
const strip = (h?: string) => (h ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
type B = { html?: string; items?: { q: string; a: string }[] };
const readMin = (bl: B[], lang: 'th' | 'en') => { const t = bl.map(b => strip(b.html || b.items?.map(i => i.q + ' ' + i.a).join(' '))).join(' '); return Math.max(2, Math.round(lang === 'th' ? t.replace(/\s/g, '').length / 600 : t.split(' ').length / 220)); };

const postIdx = (p: typeof posts.$inferSelect): PostIdx => ({ id: p.id, cat: p.category, date: p.date.toISOString().slice(0, 10), cover: p.cover, title: p.title, slug: { th: p.slugTh ?? '', en: p.slugEn ?? '' }, excerpt: p.excerpt, kw: { th: p.keywords?.split(', ')[0] ?? '', en: p.keywords?.split(', ')[1] ?? '' }, has: { th: !!(p.title.th && p.blocks.th?.length), en: !!(p.title.en && p.blocks.en?.length) }, read: { th: readMin(p.blocks.th ?? [], 'th'), en: readMin(p.blocks.en ?? [], 'en') } });

/**
 * Contact & brand details from /admin → ตั้งค่า (settings 'admin.sitecfg'), as window.__SET__.
 * Only what the public site shows; anything empty or invalid is left out so app.js keeps its built-in value.
 */
function publicSettings(v: unknown) {
  const c = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>, out: Record<string, unknown> = {};
  const s = (x: unknown, max = 200) => (typeof x === 'string' ? x.trim().slice(0, max) : '');
  for (const k of ['phone', 'wa', 'email', 'line', 'company', 'tat'] as const) if (s(c[k])) out[k] = s(c[k]);
  for (const k of ['lineUrl', 'map', 'logo', 'favicon'] as const) if (/^(\/[^/]|https:\/\/)[^\s"'<>]*$/.test(s(c[k], 2000))) out[k] = s(c[k], 2000);
  const a = (c.address ?? {}) as Record<string, unknown>;
  if (s(a.th) || s(a.en)) out.address = { th: s(a.th, 300) || s(a.en, 300), en: s(a.en, 300) || s(a.th, 300) };
  return out;
}

export async function siteData(): Promise<SiteData> { return (await siteDataBundle()).data; }
/**
 * /boats/x.webp → /boats/x.webp?v=<content hash>. Photos are cached for a year (Cloudflare + browsers), so a
 * replaced photo under the same name would keep showing the old one; the hash changes only when the file does.
 */
const VER = new Map<string, string>();
export function ver(u: string) {
  if (!/^\/(boats|img)\/[^?#]+$/.test(u)) return u;
  let v = VER.get(u);
  if (v === undefined) {
    try { v = createHash('sha1').update(readFileSync(path.join(ROOT, 'public', u))).digest('hex').slice(0, 8); } catch { v = ''; }
    VER.set(u, v);
  }
  return v ? `${u}?v=${v}` : u;
}

/** shared data for every page, served as one cacheable script: /site-data.js?v=<version> */
export async function siteDataBundle() {
  if (S.dataCache && Date.now() - S.dataCache.at < 300_000) return S.dataCache;
  return (S.dataLoading ??= loadBundle(S.gen).finally(() => { S.dataLoading = null; }));
}
async function loadBundle(gen: number): Promise<Bundle> {
  const [bs, cals, ps, cfg, home, acts, seo] = await Promise.all([db.select().from(boats).where(eq(boats.active, true)).orderBy(asc(boats.sortOrder)), db.select().from(seasonCalendars), db.select().from(posts).where(eq(posts.published, true)), db.select().from(settings).where(eq(settings.key, 'admin.sitecfg')), homeContent(), activitiesContent(), seoConfig()]);
  const extra = JSON.parse(read('data/boats.json')).extra;
  const FLEET = bs.map(b => ({ slug: b.slug, title: b.name, subtitle: b.subtitle ?? '', type: b.type, ft: b.ft, pax: b.pax, from_: b.fromPrice, marina: b.marina ?? '', pattaya: /pattaya/i.test(b.marina ?? ''), pages: [], info: b.data.info ?? [], includes: b.data.includes ?? [], complimentary: b.data.complimentary ?? [], not_included: b.data.not_included ?? [], time_slots: b.data.time_slots ?? [], notes: b.data.notes ?? [], remarks: [], tables: b.data.tables ?? [], i18n: (b.data as { i18n?: unknown }).i18n ?? null }));
  const BIMG = Object.fromEntries(bs.map(b => [b.slug, Object.fromEntries(['hero', 'a', 'b'].map((k, i) => [k, ver(b.images.find(u => u.endsWith(`-${k}.webp`)) ?? b.images[i] ?? '')]))]));
  /** every photo of a boat in the order set in the admin — first = cover */
  const GALLERY = Object.fromEntries(bs.map(b => [b.slug, b.images.filter(Boolean).map(ver)]));
  const SEASONS = { calendars: cals.map(c => ({ id: c.id, name: c.name, kind: c.kind === 'season' ? 'season' : 'allyear', ranges: c.ranges, special: c.special, ...(c.add ? { add: c.add } : {}), ...(c.addHalf ? { addHalf: c.addHalf } : {}) })), boats: Object.fromEntries(bs.map(b => [b.slug, b.calendarId ?? 'all'])), colmap: Object.fromEntries(bs.filter(b => b.data.colmap).map(b => [b.slug, b.data.colmap])) };
  const SHOWIMG: Record<string, string[]> = {};
  for (const f of readdirSync(path.join(ROOT, 'public/img/acts')).sort()) (SHOWIMG[f.split('-')[0]] ??= []).push('/img/acts/' + f);
  const TEAM_IMG = Object.fromEntries(['kwang', 'save', 'prang'].map(n => [n, `/img/team/${n}.webp`]));
  const POSTS: PostIdx[] = ps.map(postIdx);
  const data = { __SET__: publicSettings(cfg[0]?.value), __HOME__: home, __ACTS__: acts.filter(a => a.active !== false), __SEO__: publicSeo(seo), FLEET, EXTRA: extra, SEASONS, BIMG, GALLERY, SHOWIMG, TEAM_IMG, POSTS, DEST_PAGES: DESTINATIONS.map(({ match, ...d }) => ({ ...d, hero: ver(d.hero), match: match.source })) };
  // big blocks as JSON.parse('…'): browsers parse a JSON string much faster than the same data written as a JS object literal
  const js = Object.entries(data).map(([k, v]) => { const j = JSON.stringify(v); return `window.${k}=${(j.length > 8000 ? `JSON.parse(${JSON.stringify(j)})` : j).replace(/</g, '\\u003c')};`; }).join('\n');
  const bundle = { at: Date.now(), data, js, version: createHash('sha1').update(js).digest('hex').slice(0, 12) };
  if (gen === S.gen) S.dataCache = bundle;   // an admin save landed while this was loading: serve it once, never keep it
  return bundle;
}

export async function postBody(id: number) {
  const [p] = await db.select({ blocks: posts.blocks, seoT: posts.seoTitle, seoD: posts.seoDesc }).from(posts).where(and(eq(posts.id, id), eq(posts.published, true)));   // security: drafts / trashed articles stay private
  return p ?? null;
}

/* ---------------- route validation (real 404s) ---------------- */
export async function routeExists(pathname: string) {
  const p = pathname.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  if (['/', '/yacht-charter', '/blog', '/destinations', '/tours', '/about-us', '/privacy-policy', '/terms-and-conditions', '/cookie-preferences', '/contact'].includes(p)) return true;
  const d = await siteData();
  if (p.startsWith('/yacht-charter/')) return d.FLEET.some(b => (b as { slug: string }).slug === p.slice(15));
  if (p.startsWith('/destinations/')) return DESTINATIONS.some(x => x.slug === p.slice(14));
  if (p.startsWith('/blog/')) { let s = p.slice(6); try { s = decodeURIComponent(s); } catch { /* keep */ } return d.POSTS.some(x => x.slug.th === s || x.slug.en === s); }
  return false;
}

/** /blog?page=N past the last page → 404 (24 per page after the featured article, as in app.js renderBlog) */
export async function blogPageOk(url: URL) {
  if (!/^\/(en\/)?blog\/?$/.test(url.pathname) || !url.searchParams.has('page')) return true;
  const n = Number(url.searchParams.get('page'));
  return Number.isInteger(n) && n >= 1 && n <= Math.max(1, Math.ceil(((await siteData()).POSTS.length - 1) / 24));
}

/* ---------------- server render ---------------- */
/*
 * A render is synchronous (vm + linkedom): ~0.2–0.5 s warm, several seconds cold. When a crawler opens many URLs at once
 * every render used to run back to back in one block — robots.txt, images and the API all waited — and slow renders hit
 * the vm timeout (500). Now:
 *   · one render at a time, with a turn of the event loop between renders, so other requests keep flowing
 *   · one render per URL however many requests ask for it at the same moment (single flight)
 *   · an expired page, or one changed in the admin while the server is busy, is served from the last copy while a
 *     fresh one is made (stale-while-revalidate); a failed render also falls back to the last copy
 *   · the cache key ignores tracking params (?utm_… ?fbclid …) and every query on pages that don't read one
 *   · pages are kept gzipped (Thai text is 2 bytes per character as a JS string: ~10× smaller)
 */
const pageCache = S.pages, inflight = S.inflight;
const TTL = Number(process.env.SITE_CACHE_SECONDS || 3600) * 1000;   // admin saves clear the cache on their own; this only refreshes time-based text
const MAX_PAGES = Number(process.env.SITE_CACHE_PAGES || 2000);
/* the query params each listing reads (fleet.js fxRead, app.js renderBlog / tours); anything else — ?utm_… ?fbclid …, typos,
   random cache-busters — renders the same page, so it must not make a new cache entry (or a new render) */
const QS_KEEP: Record<string, string[]> = { 'yacht-charter': ['budget', 'date', 'dur', 'fav', 'pax', 'q', 'sort', 'stay', 'to', 'type'], blog: ['page'], tours: ['cat'] };
/** the part of a URL that changes the rendered page */
export function pageKey(url: URL) {
  const m = url.search && url.pathname.match(/^\/(?:en\/)?(yacht-charter|blog|tours)\/?$/), keep = m ? QS_KEEP[m[1]] : null;
  if (!keep) return url.pathname;
  const q = keep.filter(k => url.searchParams.has(k)).map(k => [k, (url.searchParams.get(k) || '').slice(0, 80)] as [string, string])
    .filter(([k, v]) => k !== 'page' || (/^\d{1,3}$/.test(v) && +v > 1));
  return url.pathname + (q.length ? '?' + new URLSearchParams(q).toString() : '');
}
const unzip = (e: Entry) => gunzipSync(e.gz).toString('utf8');
/*
 * Render queue, one render at a time with a turn of the event loop between renders. Two lanes: a visitor (or crawler)
 * waiting for a page with no cached copy goes first; background refreshes of expired pages and the start-up warm-up go
 * after. (A crawl of expired pages used to fill one lane with refreshes, and pages that were not cached at all — the /en
 * pages, missing from the warm-up — waited behind them for 20–30 s.)
 */
function enqueue<T>(key: string, fn: () => T, low = false): Promise<T> {
  S.queued++;
  return new Promise<T>((res, rej) => {
    (low ? S.lo : S.hi).push({ key, run: () => { try { res(fn()); } catch (e) { rej(e); } finally { S.queued--; } } });
    if (!S.pumping) { S.pumping = true; setImmediate(pump); }
  });
}
function pump() {
  const j = S.hi.shift() || S.lo.shift();
  if (!j) { S.pumping = false; return; }
  const t = Date.now(); j.run(); const ms = Date.now() - t;
  if (ms > 3000) console.warn(`[ssr] slow render ${ms} ms ${j.key.replace(/^\d+/, '')} · waiting ${S.hi.length} + ${S.lo.length} background`);
  setImmediate(pump);
}
/** a visitor now waits for a page that sits in the low lane: move it up */
function promote(key: string) { const i = S.lo.findIndex(j => j.key === key); if (i >= 0) S.hi.push(...S.lo.splice(i, 1)); }
export const renderQueue = () => S.queued;

export async function renderSite(url: URL, cfg: Record<string, string>, opts: { warm?: boolean } = {}) {
  const a = loadAssets();
  const pk = pageKey(url), key = a.version + pk;   // app.js version in the key so an edited app.js shows up immediately
  const hit = pageCache.get(key);
  if (hit && hit.gen === S.gen && Date.now() - hit.at < TTL) return unzip(hit);
  const stale = !!hit && hit.gen === S.gen;
  const job = fresh(key, new URL(pk, url), cfg, a, !!opts.warm || stale);
  if (!hit) { if (!opts.warm) promote(key); return job; }
  // expired by time → last copy now, new one in the background. Changed in the admin → wait for the new one,
  // unless the server is busy rendering (crawl burst), then the last copy too.
  if (hit.gen === S.gen || S.queued > 2) { job.catch(e => console.error('[ssr]', pk, e)); return unzip(hit); }
  try { return await job; } catch (e) { console.error('[ssr]', pk, e); return unzip(hit); }
}
function fresh(key: string, url: URL, cfg: Record<string, string>, a: Assets, low = false) {
  const running = inflight.get(key);
  if (running) return running;
  const g = S.gen;
  const p = (async () => {
    const bundle = await siteDataBundle(), data = bundle.data;
    // current article: ship its body inline so it renders without a second request
    let post: { id: number; blocks: unknown; seoT: unknown; seoD: unknown } | null = null;
    const m = url.pathname.replace(/^\/en(?=\/|$)/, '').match(/^\/blog\/(.+?)\/?$/);
    if (m) {
      let s = m[1]; try { s = decodeURIComponent(s); } catch { /* keep */ }
      const pi = data.POSTS.find(x => x.slug.th === s || x.slug.en === s);
      const body = pi ? await postBody(pi.id) : null;
      if (pi && body) post = { id: pi.id, ...body };
    }
    const lang = /^\/en(\/|$)/.test(url.pathname) ? 'en' : 'th';
    const html = await enqueue(key, () => run(a, url, data, { __CFG__: cfg, __POST__: post }, lang, false, `${lang}|${a.version}|${bundle.version}`).replace('__DV__', bundle.version), low);
    pageCache.delete(key);
    pageCache.set(key, { at: Date.now(), gen: g, gz: gzipSync(html) });
    if (pageCache.size > MAX_PAGES) for (const k of pageCache.keys()) { if (pageCache.size <= MAX_PAGES * 0.8) break; pageCache.delete(k); }   // oldest first
    return html;
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
/** content changed in the admin: pages re-render on their next visit (the old copy stays as a fallback) */
export function clearSiteCache() { S.gen++; S.dataCache = null; S.dataLoading = null; (globalThis as { __bttRedirAt?: number }).__bttRedirAt = Date.now(); }   // + redirects reload (middleware)

/* the hidden home view that pages other than home need (see run): one cacheable script per version instead of ~190 KB in every page */
const HOME = S.home, HOME_LATEST = S.homeLatest;   // hash → script · lang → latest hash
export async function homeScript(h: string, lang: 'th' | 'en', cfg: Record<string, string>) {
  if (HOME.has(h)) return { js: HOME.get(h)!, exact: true };
  if (!HOME_LATEST[lang]) await renderSite(new URL((lang === 'en' ? '/en' : '') + '/about-us', SITE), cfg);
  const latest = HOME_LATEST[lang];
  return { js: (latest && HOME.get(latest)) || '', exact: latest === h };
}


/** URL an admin opens to preview an article (draft or published) at its real address. */
export const previewPath = (p: { id: number; slugTh: string | null; slugEn: string | null }, lang: 'th' | 'en') =>
  `${lang === 'en' ? '/en' : ''}/blog/${encodeURIComponent((lang === 'en' ? p.slugEn : p.slugTh) || `preview-${p.id}`)}?preview=${p.id}`;

/**
 * Admin preview: renders one article from the database whatever its status. Never cached.
 * window.__PREVIEW__ puts it into POSTS (which only lists published articles) so the browser's app.js finds it too.
 * Returns { redirect } when the URL slug is not the article's current one.
 */
export async function renderPostPreview(url: URL, id: number, cfg: Record<string, string>) {
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return null;
  const lang = /^\/en(\/|$)/.test(url.pathname) ? 'en' : 'th', want = previewPath(p, lang);
  const dec = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
  if (dec(url.pathname + url.search) !== dec(want)) return { redirect: want };
  const idx = postIdx(p), s = decodeURIComponent(want.split('/blog/')[1].split('?')[0]);
  idx.slug[lang] = s;
  const bundle = await siteDataBundle();
  const data = { ...bundle.data, POSTS: [idx, ...bundle.data.POSTS.filter(x => x.id !== id)] };
  const html = run(loadAssets(), url, data, { __CFG__: cfg, __POST__: { id, blocks: p.blocks, seoT: p.seoTitle, seoD: p.seoDesc }, __PREVIEW__: idx }, lang, true).replace('__DV__', bundle.version);
  const banner = `<div style="position:fixed;top:0;inset-inline:0;z-index:9999;background:#b4501a;color:#fff;font:500 12.5px/1.4 system-ui,sans-serif;text-align:center;padding:6px 12px">${p.published ? 'ตัวอย่างบทความ · ข้อมูลล่าสุดที่บันทึกไว้' : 'ตัวอย่างบทความ · ยังไม่เผยแพร่ ลูกค้ายังไม่เห็นหน้านี้'}</div>`;
  return { html: html.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>').replace(/<body([^>]*)>/, `<body$1>${banner}`) };
}

function run(a: Assets, url: URL, data: SiteData, page: Record<string, unknown>, lang: string, inlineHome = false, homeKey = '') {
  const dataJs = Object.entries(page).map(([k, v]) => `window.${k}=${JSON.stringify(v).replace(/</g, '\\u003c')};`).join('');
  const { window, document } = parseHTML(a.shell.replace('__DATA__', ''));
  const listeners: Record<string, ((e: unknown) => void)[]> = {};
  const timers: { fn: () => void; ms: number }[] = [];
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, String(v)), removeItem: (k: string) => void m.delete(k), clear: () => m.clear() }; };
  const sandbox: Record<string, unknown> = {
    document, navigator: { userAgent: 'BTT-SSR', language: lang, clipboard: undefined },
    location: { pathname: url.pathname, search: url.search, hash: '', href: url.href, origin: url.origin, host: url.host, hostname: url.hostname, protocol: url.protocol },
    history: { pushState() {}, replaceState() {} }, localStorage: mem(), sessionStorage: mem(),
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
    requestAnimationFrame: () => 0, cancelAnimationFrame() {}, scrollTo() {}, scrollBy() {},
    setTimeout: (fn: () => void, ms = 0) => { if (typeof fn === 'function' && ms <= 100) timers.push({ fn, ms }); return 0; }, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    innerWidth: 1280, innerHeight: 800, scrollY: 0, devicePixelRatio: 1,
    addEventListener: (t: string, fn: (e: unknown) => void) => { (listeners[t] ??= []).push(fn); }, removeEventListener() {},
    dispatchEvent: (e: { type: string }) => { (listeners[e.type] ?? []).forEach(f => f(e)); return true; },
    getComputedStyle: () => ({ getPropertyValue: () => '' }), fetch: () => new Promise(() => {}),
    Event: window.Event, CustomEvent: window.CustomEvent, Node: window.Node, HTMLElement: window.HTMLElement, DOMParser: window.DOMParser,
    URL, URLSearchParams, Intl, performance: { now: () => Date.now() }, console: { log() {}, info() {}, warn() {}, error: console.error, debug() {} },
  };
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
  Object.assign(sandbox, structuredClone({ ...data, ...page }));
  // the hidden home view is the same for every page of one language + data version: render it once, then let the other
  // pages skip it (about half of a page's render time) and point at the script already built from it
  const knownHome = !inlineHome && homeKey ? S.homeByKey[homeKey] : '';
  if (knownHome && HOME.has(knownHome)) sandbox.__SKIP_HOME__ = true;
  const ctx = vm.createContext(sandbox);
  a.lucide.runInContext(ctx);
  a.app.runInContext(ctx, { timeout: 20000 });   // generous: a busy or cold server must not turn a page into a 500
  a.fleet.runInContext(ctx, { timeout: 20000 });
  for (let round = 0; round < 5 && timers.length; round++) { const batch = timers.splice(0).sort((x, y) => x.ms - y.ms); for (const t of batch) { try { t.fn(); } catch (e) { console.error('[ssr timer]', e); } } }
  vm.runInContext('typeof afterRoute === "function" && afterRoute(); typeof icons === "function" && icons(); typeof fxSsrDone === "function" && fxSsrDone();', ctx);
  document.documentElement.setAttribute('lang', lang);
  // pages other than the home page: the hidden home view (hero H1, home sections, their JSON-LD) is not sent as page
  // content — one H1 per page, no copy of the home text on every URL. The browser puts it back from this string
  // (app.js, first lines) because the app still uses the home view's elements on every page.
  let homeJs = '';
  const vh = document.getElementById('view-home');
  const appTag0 = [...document.querySelectorAll('script[src]')].find(x => (x.getAttribute('src') || '').startsWith('/site/app.js'));
  if (sandbox.__SKIP_HOME__ && vh && vh.classList.contains('hidden') && appTag0) {
    vh.innerHTML = ''; vh.setAttribute('data-deferred', '1');
    const sc = document.createElement('script'); sc.setAttribute('defer', ''); sc.setAttribute('src', `/site-home.js?l=${lang}&h=${knownHome}`); appTag0.parentNode!.insertBefore(sc, appTag0);
  } else if (vh && vh.classList.contains('hidden') && vh.innerHTML.trim()) {
    // per-visitor parts filled during this render ("recently viewed" = the boat being rendered) — the browser fills its own
    const rw = vh.querySelector('#recentWrap'); if (rw) { rw.innerHTML = ''; rw.classList.add('hidden'); }
    const js = `window.__HOME_HTML__=${JSON.stringify(vh.innerHTML).replace(/</g, '\\u003c')};`;
    vh.innerHTML = ''; vh.setAttribute('data-deferred', '1');
    // loaded right before app.js (deferred like it, so in order), which puts it back first thing; the admin preview keeps it inline
    const appTag = inlineHome ? null : [...document.querySelectorAll('script[src]')].find(x => (x.getAttribute('src') || '').startsWith('/site/app.js'));
    if (appTag) {
      const h = createHash('sha1').update(js).digest('hex').slice(0, 12);
      if (!HOME.has(h)) { HOME.set(h, js); if (HOME.size > 40) HOME.delete(HOME.keys().next().value!); }
      HOME_LATEST[lang] = h; if (homeKey) S.homeByKey[homeKey] = h;
      const sc = document.createElement('script'); sc.setAttribute('defer', ''); sc.setAttribute('src', `/site-home.js?l=${lang}&h=${h}`); appTag.parentNode!.insertBefore(sc, appTag);
    } else homeJs = js;
  }
  const dataTag = document.getElementById('btt-data');
  if (dataTag) dataTag.textContent = dataJs + homeJs;
  // Cloudflare Email Obfuscation would turn every address into /cdn-cgi/l/email-protection links (seen as broken links by
  // crawlers); the email_off markers keep plain mailto: links whatever the zone setting is
  return '<!DOCTYPE html>\n' + document.documentElement.outerHTML.replace(/<body([^>]*)>/, '<body$1><!--email_off-->').replace(/<\/body>(?![\s\S]*<\/body>)/, '<!--/email_off--></body>');
}
