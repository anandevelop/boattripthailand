import 'server-only';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { boats, posts, seasonCalendars, settings } from '@/db/schema';
import { DESTINATIONS } from './destinations';
import { homeContent } from './home';
import { activitiesContent } from './activities';
import { publicSeo, seoConfig } from './seo';

/**
 * Public site = the approved mockup (site/shell.html + public/site/app.js), rendered on the
 * server so every URL ships complete HTML + SEO tags, then the same script runs in the browser.
 */
const ROOT = process.cwd();
const read = (p: string) => readFileSync(path.join(ROOT, p), 'utf8');
let assets: { shell: string; app: vm.Script; lucide: vm.Script; version: string } | null = null;
function loadAssets() {
  if (assets && process.env.NODE_ENV === 'production') return assets;
  const appPath = path.join(ROOT, 'public/site/app.js');
  const version = String(Math.floor(statSync(appPath).mtimeMs));
  if (assets && assets.version === version) return assets;
  assets = { shell: read('site/shell.html').replaceAll('__V__', version), app: new vm.Script(read('public/site/app.js'), { filename: 'app.js' }), lucide: new vm.Script(read('public/site/lucide.min.js'), { filename: 'lucide.js' }), version };
  return assets;
}

/* ---------------- data (cached) ---------------- */
type SiteData = { __SET__: Record<string, unknown>; __HOME__: unknown; __ACTS__: unknown[]; __SEO__: unknown; FLEET: unknown[]; EXTRA: unknown; SEASONS: unknown; BIMG: Record<string, Record<string, string>>; SHOWIMG: Record<string, string[]>; TEAM_IMG: Record<string, string>; POSTS: PostIdx[]; DEST_PAGES: unknown[] };
type PostIdx = { id: number; cat: string; date: string; cover: string | null; title: { th: string; en: string }; slug: { th: string; en: string }; excerpt: { th: string; en: string }; kw: { th: string; en: string }; has: { th: boolean; en: boolean }; read: { th: number; en: number } };
let dataCache: { at: number; data: SiteData; js: string; version: string } | null = null;
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
/** shared data for every page, served as one cacheable script: /site-data.js?v=<version> */
export async function siteDataBundle() {
  if (dataCache && Date.now() - dataCache.at < 300_000) return dataCache;
  const [bs, cals, ps, cfg, home, acts, seo] = await Promise.all([db.select().from(boats).where(eq(boats.active, true)).orderBy(asc(boats.sortOrder)), db.select().from(seasonCalendars), db.select().from(posts).where(eq(posts.published, true)), db.select().from(settings).where(eq(settings.key, 'admin.sitecfg')), homeContent(), activitiesContent(), seoConfig()]);
  const extra = JSON.parse(read('data/boats.json')).extra;
  const FLEET = bs.map(b => ({ slug: b.slug, title: b.name, subtitle: b.subtitle ?? '', type: b.type, ft: b.ft, pax: b.pax, from_: b.fromPrice, marina: b.marina ?? '', pattaya: /pattaya/i.test(b.marina ?? ''), pages: [], info: b.data.info ?? [], includes: b.data.includes ?? [], complimentary: b.data.complimentary ?? [], not_included: b.data.not_included ?? [], time_slots: b.data.time_slots ?? [], notes: b.data.notes ?? [], remarks: [], tables: b.data.tables ?? [], i18n: (b.data as { i18n?: unknown }).i18n ?? null }));
  const BIMG = Object.fromEntries(bs.map(b => [b.slug, Object.fromEntries(['hero', 'a', 'b'].map((k, i) => [k, b.images.find(u => u.endsWith(`-${k}.webp`)) ?? b.images[i] ?? '']))]));
  const SEASONS = { calendars: cals.map(c => ({ id: c.id, name: c.name, kind: c.kind === 'season' ? 'season' : 'allyear', ranges: c.ranges, special: c.special, ...(c.add ? { add: c.add } : {}), ...(c.addHalf ? { addHalf: c.addHalf } : {}) })), boats: Object.fromEntries(bs.map(b => [b.slug, b.calendarId ?? 'all'])), colmap: Object.fromEntries(bs.filter(b => b.data.colmap).map(b => [b.slug, b.data.colmap])) };
  const SHOWIMG: Record<string, string[]> = {};
  for (const f of readdirSync(path.join(ROOT, 'public/img/acts')).sort()) (SHOWIMG[f.split('-')[0]] ??= []).push('/img/acts/' + f);
  const TEAM_IMG = Object.fromEntries(['kwang', 'save', 'prang'].map(n => [n, `/img/team/${n}.webp`]));
  const POSTS: PostIdx[] = ps.map(postIdx);
  const data = { __SET__: publicSettings(cfg[0]?.value), __HOME__: home, __ACTS__: acts.filter(a => a.active !== false), __SEO__: publicSeo(seo), FLEET, EXTRA: extra, SEASONS, BIMG, SHOWIMG, TEAM_IMG, POSTS, DEST_PAGES: DESTINATIONS.map(({ match, ...d }) => ({ ...d, match: match.source })) };
  const js = Object.entries(data).map(([k, v]) => `window.${k}=${JSON.stringify(v).replace(/</g, '\\u003c')};`).join('\n');
  dataCache = { at: Date.now(), data, js, version: createHash('sha1').update(js).digest('hex').slice(0, 12) };
  return dataCache;
}

export async function postBody(id: number) {
  const [p] = await db.select({ blocks: posts.blocks, seoT: posts.seoTitle, seoD: posts.seoDesc }).from(posts).where(eq(posts.id, id));
  return p ?? null;
}

/* ---------------- route validation (real 404s) ---------------- */
export async function routeExists(pathname: string) {
  const p = pathname.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  if (['/', '/yacht-charter', '/blog', '/destinations', '/about-us', '/privacy-policy', '/terms-and-conditions', '/cookie-preferences'].includes(p)) return true;
  const d = await siteData();
  if (p.startsWith('/yacht-charter/')) return d.FLEET.some(b => (b as { slug: string }).slug === p.slice(15));
  if (p.startsWith('/destinations/')) return DESTINATIONS.some(x => x.slug === p.slice(14));
  if (p.startsWith('/blog/')) { let s = p.slice(6); try { s = decodeURIComponent(s); } catch { /* keep */ } return d.POSTS.some(x => x.slug.th === s || x.slug.en === s); }
  return false;
}

/* ---------------- server render ---------------- */
const pageCache = new Map<string, { at: number; html: string }>();
const TTL = Number(process.env.SITE_CACHE_SECONDS || 300) * 1000;

export async function renderSite(url: URL, cfg: Record<string, string>) {
  const a = loadAssets();
  // app.js version in the key so an edited app.js shows up immediately
  const key = a.version + url.pathname + url.search;
  const hit = pageCache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.html;
  const bundle = await siteDataBundle(), data = bundle.data;
  // current article: ship its body inline so it renders without a second request
  let post: { id: number; blocks: unknown; seoT: unknown; seoD: unknown } | null = null;
  const m = url.pathname.replace(/^\/en(?=\/|$)/, '').match(/^\/blog\/(.+?)\/?$/);
  if (m) {
    let s = m[1]; try { s = decodeURIComponent(s); } catch { /* keep */ }
    const p = data.POSTS.find(x => x.slug.th === s || x.slug.en === s);
    const body = p ? await postBody(p.id) : null;
    if (p && body) post = { id: p.id, ...body };
  }
  const lang = /^\/en(\/|$)/.test(url.pathname) ? 'en' : 'th';
  const html = run(a, url, data, { __CFG__: cfg, __POST__: post }, lang).replace('__DV__', bundle.version);
  pageCache.set(key, { at: Date.now(), html });
  if (pageCache.size > 800) { const old = [...pageCache.entries()].sort((x, y) => x[1].at - y[1].at).slice(0, 200); old.forEach(([k]) => pageCache.delete(k)); }
  return html;
}
export function clearSiteCache() { pageCache.clear(); dataCache = null; }

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
  const html = run(loadAssets(), url, data, { __CFG__: cfg, __POST__: { id, blocks: p.blocks, seoT: p.seoTitle, seoD: p.seoDesc }, __PREVIEW__: idx }, lang).replace('__DV__', bundle.version);
  const banner = `<div style="position:fixed;top:0;inset-inline:0;z-index:9999;background:#b4501a;color:#fff;font:500 12.5px/1.4 system-ui,sans-serif;text-align:center;padding:6px 12px">${p.published ? 'ตัวอย่างบทความ · ข้อมูลล่าสุดที่บันทึกไว้' : 'ตัวอย่างบทความ · ยังไม่เผยแพร่ ลูกค้ายังไม่เห็นหน้านี้'}</div>`;
  return { html: html.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>').replace(/<body([^>]*)>/, `<body$1>${banner}`) };
}

function run(a: NonNullable<typeof assets>, url: URL, data: SiteData, page: Record<string, unknown>, lang: string) {
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
  const ctx = vm.createContext(sandbox);
  a.lucide.runInContext(ctx);
  a.app.runInContext(ctx, { timeout: 5000 });
  for (let round = 0; round < 5 && timers.length; round++) { const batch = timers.splice(0).sort((x, y) => x.ms - y.ms); for (const t of batch) { try { t.fn(); } catch (e) { console.error('[ssr timer]', e); } } }
  vm.runInContext('typeof afterRoute === "function" && afterRoute(); typeof icons === "function" && icons();', ctx);
  document.documentElement.setAttribute('lang', lang);
  const dataTag = document.getElementById('btt-data');
  if (dataTag) dataTag.textContent = dataJs;
  return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
}
