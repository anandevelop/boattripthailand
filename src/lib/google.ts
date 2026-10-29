import 'server-only';
import { createCipheriv, createDecipheriv, createHash, createSign, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

/**
 * Real data for /admin → วิเคราะห์เว็บไซต์ (Google Analytics 4 + Search Console tabs).
 * Read-only, via one Google Cloud service account. Configure in .env:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  the key file contents — raw JSON or base64 (base64 -i key.json | tr -d '\n')
 *     or GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 *   GA4_PROPERTY_ID              numeric property id (GA4 → Admin → Property details), not G-XXXX
 *   GSC_SITE_URL                 https://boattripthailand.com/  (URL-prefix)  or  sc-domain:boattripthailand.com
 * The service account email must be added as Viewer in GA4 and as a user (Restricted) in Search Console.
 * The same values can be set in /admin → วิเคราะห์เว็บไซต์ → เชื่อมต่อ API (settings key google.config);
 * .env wins when both are set. The key file saved there is encrypted (AES-256-GCM, key from .env).
 */
export const GOOGLE_KEY = 'google.config';
export type GoogleCfg = { ga4Id: string; propertyId: string; gscSite: string; sa: { email: string; enc: string } | null; at?: string; by?: string };
let CFG: GoogleCfg = { ga4Id: '', propertyId: '', gscSite: '', sa: null }, cfgAt = 0;
const secretKey = () => createHash('sha256').update('btt-google|' + (process.env.SETTINGS_KEY || process.env.POSTGRES_PASSWORD || process.env.DATABASE_URL || 'btt')).digest();
export function sealSecret(plain: string) { const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', secretKey(), iv), enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]); return [iv, c.getAuthTag(), enc].map(b => b.toString('base64')).join('.'); }
function openSecret(sealed: string) { const [iv, tag, enc] = sealed.split('.').map(x => Buffer.from(x, 'base64')); const d = createDecipheriv('aes-256-gcm', secretKey(), iv); d.setAuthTag(tag); return Buffer.concat([d.update(enc), d.final()]).toString('utf8'); }
/** saved settings (cached 60 s); call before reading prop() / site() / serviceAccount() */
export async function loadGoogleCfg(force = false) {
  if (!force && Date.now() - cfgAt < 60_000) return CFG;
  try { const [r] = await db.select().from(settings).where(eq(settings.key, GOOGLE_KEY)); const v = (r?.value ?? {}) as Partial<GoogleCfg>; CFG = { ga4Id: v.ga4Id || '', propertyId: v.propertyId || '', gscSite: v.gscSite || '', sa: v.sa ?? null, at: v.at, by: v.by }; }
  catch (e) { console.error('[google] settings', e); }
  if (force || cfgAt === 0 || JSON.stringify(CFG.sa) !== lastSa) { saCache = undefined; tokens.clear(); lastSa = JSON.stringify(CFG.sa); }
  cfgAt = Date.now(); return CFG;
}
let lastSa = '';
const prop = () => process.env.GA4_PROPERTY_ID || CFG.propertyId;
const site = () => process.env.GSC_SITE_URL || CFG.gscSite;
export const measurementId = async () => process.env.NEXT_PUBLIC_GA_ID || (await loadGoogleCfg()).ga4Id;
type SA = { client_email: string; private_key: string };
let saCache: SA | null | undefined;
function serviceAccount(): SA | null {
  if (saCache !== undefined) return saCache;
  // a key saved in /admin wins over .env, so the admin can swap or remove it without touching the server
  let raw = '';
  try {
    if (CFG.sa?.enc) raw = openSecret(CFG.sa.enc);
    if (!raw) raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim();
    if (!raw && process.env.GOOGLE_APPLICATION_CREDENTIALS) raw = readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
    if (raw && !raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
    const j = raw ? JSON.parse(raw) : null;
    saCache = j?.client_email && j?.private_key ? { client_email: j.client_email, private_key: j.private_key } : null;
  } catch (e) { console.error('[google] service account key could not be read', e); saCache = null; }
  return saCache;
}

// read-only analytics + Search Console, and Cloud Translation (admin auto-translate, capped in src/lib/translate.ts)
const SCOPES = 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly';
const tokens = new Map<string, { v: string; exp: number }>();
async function accessToken(scope = SCOPES) {
  const token = tokens.get(scope);
  if (token && token.exp > Date.now() + 60_000) return token.v;
  const sa = serviceAccount(); if (!sa) throw new GoogleError('no_key', 'ยังไม่ได้ใส่กุญแจ service account');
  const now = Math.floor(Date.now() / 1000), b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = unsigned + '.' + createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new GoogleError('auth', `Google ไม่รับกุญแจ service account (${j.error_description || j.error || r.status})`);
  tokens.set(scope, { v: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 });
  return j.access_token as string;
}

export class GoogleError extends Error { constructor(public code: string, msg: string) { super(msg); } }
async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: 'POST', headers: { authorization: 'Bearer ' + await accessToken(), 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20_000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = j?.error?.message || String(r.status);
    throw new GoogleError(r.status === 403 ? 'forbidden' : r.status === 404 ? 'not_found' : 'api', r.status === 403 ? `service account ยังไม่มีสิทธิ์ดูข้อมูลนี้ (${m})` : m);
  }
  return j;
}

/** Thailand date `n` days ago, YYYY-MM-DD */
const thDay = (n: number) => new Date(Date.now() + 7 * 3600_000 - n * 864e5).toISOString().slice(0, 10);
const days2 = (from: number, count: number) => Array.from({ length: count }, (_, i) => thDay(from + count - 1 - i));   // oldest first

export function googleStatus() {
  const sa = serviceAccount();
  return { key: !!sa, email: sa?.client_email ?? null, ga: { on: !!sa && !!prop(), property: prop() || null }, gsc: { on: !!sa && !!site(), site: site() || null },
    // where each value comes from, for /admin → เชื่อมต่อ API (.env wins, except the key: a key saved in /admin is used first)
    src: { key: CFG.sa ? 'admin' : process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'env' : '', property: process.env.GA4_PROPERTY_ID ? 'env' : CFG.propertyId ? 'admin' : '', envKey: !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim(), site: process.env.GSC_SITE_URL ? 'env' : CFG.gscSite ? 'admin' : '', ga4Id: process.env.NEXT_PUBLIC_GA_ID ? 'env' : CFG.ga4Id ? 'admin' : '' },
    cfg: { ga4Id: process.env.NEXT_PUBLIC_GA_ID || CFG.ga4Id, propertyId: prop(), gscSite: site(), savedEmail: CFG.sa?.email ?? null, at: CFG.at ?? null, by: CFG.by ?? null } };
}

/* ---------- GA4 Data API ---------- */
type Row = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
const num = (r: Row, i: number) => Number(r.metricValues?.[i]?.value ?? 0);
const dim = (r: Row, i = 0) => r.dimensionValues?.[i]?.value ?? '';
const KEY_EVENTS = ['booking_submit', 'whatsapp_click', 'line_click', 'phone_click'];

async function ga4(days: number) {
  const id = prop(), url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(id)}:runReport`;
  const cur = { startDate: thDay(days - 1), endDate: 'today' }, prev = { startDate: thDay(days * 2 - 1), endDate: thDay(days) };
  const run = (b: object) => post(url, b) as Promise<{ rows?: Row[] }>;
  const [daily, tot, pages, ch, dev, country, ev] = await Promise.all([
    run({ dateRanges: [{ startDate: prev.startDate, endDate: 'today' }], dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'keyEvents' }], limit: 400 }),
    run({ dateRanges: [cur, prev], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'keyEvents' }, { name: 'averageSessionDuration' }, { name: 'engagementRate' }] }),
    run({ dateRanges: [cur], dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }, { name: 'userEngagementDuration' }, { name: 'keyEvents' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 20 }),
    run({ dateRanges: [cur], dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 10 }),
    run({ dateRanges: [cur], dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
    run({ dateRanges: [cur], dimensions: [{ name: 'country' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 8 }),
    run({ dateRanges: [cur], dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: KEY_EVENTS } } } }),
  ]);
  const m = new Map((daily.rows ?? []).map(r => { const d = dim(r); return [`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`, { users: num(r, 0), sessions: num(r, 1), keyEvents: num(r, 2) }]; }));
  const series = days2(0, days * 2).map(d => ({ date: d, ...(m.get(d) ?? { users: 0, sessions: 0, keyEvents: 0 }) }));
  // with two date ranges GA adds a dateRange dimension: date_range_0 = cur, date_range_1 = prev
  const t = (k: string) => { const r = (tot.rows ?? []).find(x => dim(x) === k); return { users: r ? num(r, 0) : 0, sessions: r ? num(r, 1) : 0, keyEvents: r ? num(r, 2) : 0, avgDur: r ? num(r, 3) : 0, engRate: r ? num(r, 4) : 0 }; };
  return {
    prev: series.slice(0, days), cur: series.slice(days), totals: { cur: t('date_range_0'), prev: t('date_range_1') },
    pages: (pages.rows ?? []).map(r => ({ path: dim(r), views: num(r, 0), eng: num(r, 0) ? num(r, 1) / num(r, 0) : 0, keyEvents: num(r, 2) })),
    channels: (ch.rows ?? []).map(r => ({ name: dim(r), sessions: num(r, 0) })),
    devices: (dev.rows ?? []).map(r => ({ name: dim(r), sessions: num(r, 0) })),
    countries: (country.rows ?? []).map(r => ({ name: dim(r), sessions: num(r, 0) })),
    events: KEY_EVENTS.map(n => ({ name: n, count: num((ev.rows ?? []).find(r => dim(r) === n) ?? {}, 0) })),
  };
}

/* ---------- the 24-hour view: GA4 by hour (dateHour, in the property's time zone, set to Asia/Bangkok) ---------- */
const thHourKey = (n = 0) => new Date(Date.now() + 7 * 3600_000 - n * 3600_000).toISOString().slice(0, 13);   // "2026-10-27T14"
const hourKeys = (count: number, endAgo = 0) => Array.from({ length: count }, (_, i) => thHourKey(endAgo + count - 1 - i));
const gaHour = (h: string) => h.replace(/[-T]/g, '');   // "2026102714"
async function ga4h() {
  const id = prop(), url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(id)}:runReport`;
  const run = (b: object) => post(url, b) as Promise<{ rows?: Row[] }>;
  const H = hourKeys(48), curH = H.slice(24).map(gaHour), prevH = H.slice(0, 24).map(gaHour), R = [{ startDate: '2daysAgo', endDate: 'today' }];
  const inH = (v: string[]) => ({ filter: { fieldName: 'dateHour', inListFilter: { values: v } } });
  // totals over the 24 hours as one range, so each user is counted once
  const tot = (v: string[]) => run({ dateRanges: R, dimensionFilter: inH(v), metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'keyEvents' }, { name: 'averageSessionDuration' }, { name: 'engagementRate' }] });
  const cur = { dateRanges: R, dimensionFilter: inH(curH) };
  const [hourly, tc, tp, pages, ch, dev, country, ev] = await Promise.all([
    run({ dateRanges: R, dimensions: [{ name: 'dateHour' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'keyEvents' }], limit: 200 }),
    tot(curH), tot(prevH),
    run({ ...cur, dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }, { name: 'userEngagementDuration' }, { name: 'keyEvents' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 20 }),
    run({ ...cur, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 10 }),
    run({ ...cur, dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
    run({ ...cur, dimensions: [{ name: 'country' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 8 }),
    run({ dateRanges: R, dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], dimensionFilter: { andGroup: { expressions: [inH(curH), { filter: { fieldName: 'eventName', inListFilter: { values: KEY_EVENTS } } }] } } }),
  ]);
  const m = new Map((hourly.rows ?? []).map(r => [dim(r), { users: num(r, 0), sessions: num(r, 1), keyEvents: num(r, 2) }]));
  const series = H.map(h => ({ h, date: h.slice(0, 10), ...(m.get(gaHour(h)) ?? { users: 0, sessions: 0, keyEvents: 0 }) }));
  const t = (x: { rows?: Row[] }) => { const r = x.rows?.[0]; return { users: r ? num(r, 0) : 0, sessions: r ? num(r, 1) : 0, keyEvents: r ? num(r, 2) : 0, avgDur: r ? num(r, 3) : 0, engRate: r ? num(r, 4) : 0 }; };
  return {
    hourly: true, prev: series.slice(0, 24), cur: series.slice(24), totals: { cur: t(tc), prev: t(tp) },
    pages: (pages.rows ?? []).map(r => ({ path: dim(r), views: num(r, 0), eng: num(r, 0) ? num(r, 1) / num(r, 0) : 0, keyEvents: num(r, 2) })),
    channels: (ch.rows ?? []).map(r => ({ name: dim(r), sessions: num(r, 0) })),
    devices: (dev.rows ?? []).map(r => ({ name: dim(r), sessions: num(r, 0) })),
    countries: (country.rows ?? []).map(r => ({ name: dim(r), sessions: num(r, 0) })),
    events: KEY_EVENTS.map(n => ({ name: n, count: num((ev.rows ?? []).find(r => dim(r) === n) ?? {}, 0) })),
  };
}

/* ---------- Search Console, 24 hours: hourly data (dataState HOURLY_ALL, last ~10 days, a few hours behind) ---------- */
async function gsch() {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site())}/searchAnalytics/query`;
  type R = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
  const q = (b: object) => post(url, b) as Promise<{ rows?: R[] }>;
  const hourly = await q({ startDate: thDay(4), endDate: thDay(0), dimensions: ['hour'], dataState: 'hourly_all', rowLimit: 500 });
  // keys come with their own offset ("2026-10-27T05:00:00-07:00") → Thailand hour keys
  const toTh = (k: string) => new Date(new Date(k).getTime() + 7 * 3600_000).toISOString().slice(0, 13);
  const m = new Map((hourly.rows ?? []).map(r => [toTh(r.keys![0]), r]));
  // end at the latest hour Google has published (it runs a few hours behind), not at the current hour
  const latest = [...m.keys()].sort().pop() ?? thHourKey(0);
  const ago = Math.max(0, Math.round((new Date(thHourKey(0) + ':00:00Z').getTime() - new Date(latest + ':00:00Z').getTime()) / 3600_000));
  const H = hourKeys(48, ago);
  const series = H.map(h => { const r = m.get(h); return { h, date: h.slice(0, 10), clicks: r?.clicks ?? 0, impressions: r?.impressions ?? 0, position: r?.position ?? 0 }; });
  const sum = (a: typeof series) => { const c = a.reduce((s, x) => s + x.clicks, 0), i = a.reduce((s, x) => s + x.impressions, 0), p = i ? a.reduce((s, x) => s + x.position * x.impressions, 0) / i : 0; return { clicks: c, impressions: i, ctr: i ? c / i : 0, position: p }; };
  const p = series.slice(0, 24), c = series.slice(24);
  // queries and pages are not split by hour: the days the 24 hours fall on (fresh data)
  const cur = { startDate: c[0].date, endDate: c[23].date }, prev = { startDate: p[0].date, endDate: p[23].date };
  const [queries, pages, prevQueries] = await Promise.all([
    q({ ...cur, dimensions: ['query'], dataState: 'all', rowLimit: 1000 }), q({ ...cur, dimensions: ['page'], dataState: 'all', rowLimit: 20 }), q({ ...prev, dimensions: ['query'], dataState: 'all', rowLimit: 1000 }),
  ]);
  return {
    hourly: true, range: cur, lagHours: ago, prev: p, cur: c, totals: { cur: sum(c), prev: sum(p) },
    queries: (queries.rows ?? []).slice(0, 100).map(r => ({ q: r.keys![0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    qpos: Object.fromEntries((queries.rows ?? []).map(r => [r.keys![0].toLowerCase(), [Math.round(r.position * 10) / 10, r.impressions, r.clicks]])),
    qprev: Object.fromEntries((prevQueries.rows ?? []).map(r => [r.keys![0].toLowerCase(), Math.round(r.position * 10) / 10])),
    pages: (pages.rows ?? []).map(r => ({ page: r.keys![0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
  };
}

/* ---------- Search Console (data is final ~3 days later) ---------- */
async function gsc(days: number) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site())}/searchAnalytics/query`;
  const end = 3, cur = { startDate: thDay(end + days - 1), endDate: thDay(end) }, prev = { startDate: thDay(end + days * 2 - 1), endDate: thDay(end + days) };
  type R = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
  const q = (b: object) => post(url, { dataState: 'final', ...b }) as Promise<{ rows?: R[] }>;
  const [daily, queries, pages, prevQueries] = await Promise.all([
    q({ startDate: prev.startDate, endDate: cur.endDate, dimensions: ['date'], rowLimit: 400 }),
    q({ ...cur, dimensions: ['query'], rowLimit: 1000 }),
    q({ ...cur, dimensions: ['page'], rowLimit: 20 }),
    q({ ...prev, dimensions: ['query'], rowLimit: 1000 }),
  ]);
  const m = new Map((daily.rows ?? []).map(r => [r.keys![0], r]));
  const series = days2(end, days * 2).map(d => { const r = m.get(d); return { date: d, clicks: r?.clicks ?? 0, impressions: r?.impressions ?? 0, position: r?.position ?? 0 }; });
  const sum = (a: typeof series) => { const c = a.reduce((s, x) => s + x.clicks, 0), i = a.reduce((s, x) => s + x.impressions, 0), p = i ? a.reduce((s, x) => s + x.position * x.impressions, 0) / i : 0; return { clicks: c, impressions: i, ctr: i ? c / i : 0, position: p }; };
  const p = series.slice(0, days), c = series.slice(days);
  return {
    range: cur, prev: p, cur: c, totals: { cur: sum(c), prev: sum(p) },
    queries: (queries.rows ?? []).slice(0, 100).map(r => ({ q: r.keys![0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    // keyword tracking (SEO → คีย์เวิร์ด): query (lower-case) → [position, impressions, clicks] now, and position in the previous period
    qpos: Object.fromEntries((queries.rows ?? []).map(r => [r.keys![0].toLowerCase(), [Math.round(r.position * 10) / 10, r.impressions, r.clicks]])),
    qprev: Object.fromEntries((prevQueries.rows ?? []).map(r => [r.keys![0].toLowerCase(), Math.round(r.position * 10) / 10])),
    pages: (pages.rows ?? []).map(r => ({ page: r.keys![0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
  };
}

const cache = new Map<string, { at: number; v: unknown }>();
async function cached<T>(k: string, f: () => Promise<T>): Promise<T | { error: string; code: string }> {
  const c = cache.get(k); if (c && Date.now() - c.at < 30 * 60_000) return c.v as T;
  try { const v = await f(); cache.set(k, { at: Date.now(), v }); return v; }
  catch (e) { const code = e instanceof GoogleError ? e.code : 'api'; console.error('[google]', k, e); return { error: e instanceof Error ? e.message : String(e), code }; }
}

/** GA4 + Search Console for the selected range (cached 30 minutes; ?refresh=1 skips the cache) */
export async function googleData(days: number, refresh = false) {
  await loadGoogleCfg(refresh);
  const s = googleStatus();
  if (refresh) { cache.delete('ga:' + days); cache.delete('gsc:' + days); }
  // 24 hours: refreshed every 10 minutes instead of 30
  if (days === 1) for (const k of ['ga:1', 'gsc:1']) { const c = cache.get(k); if (c && Date.now() - c.at > 10 * 60_000) cache.delete(k); }
  const [ga, sc] = await Promise.all([s.ga.on ? cached('ga:' + days, () => days === 1 ? ga4h() : ga4(days)) : null, s.gsc.on ? cached('gsc:' + days, () => days === 1 ? gsch() : gsc(days)) : null]);
  return { days, status: s, ga, gsc: sc, at: new Date().toISOString() };
}

/** /admin → ศูนย์ SEO → Sitemap & Index → ส่งให้ Google: submit the sitemap through the Search Console API.
 *  Needs the write scope (webmasters) and the service account added as an Owner / Full user of the property. */
export async function gscSubmitSitemap(feed: string) {
  await loadGoogleCfg();
  const sc = site(); if (!sc) throw new GoogleError('no_gsc', 'ยังไม่ได้ใส่ Search Console พร็อพเพอร์ตี้');
  const t = await accessToken('https://www.googleapis.com/auth/webmasters');
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(sc)}/sitemaps/${encodeURIComponent(feed)}`, { method: 'PUT', headers: { authorization: `Bearer ${t}` } });
  if (r.ok) return true;
  const j = await r.json().catch(() => ({})) as { error?: { message?: string } };
  throw new GoogleError(r.status === 403 ? 'perm' : 'api', r.status === 403 ? 'Search Console ไม่ให้สิทธิ์ส่ง sitemap · เพิ่มอีเมล service account เป็นผู้ใช้แบบ “เต็ม (Full)” หรือเจ้าของ' : `ส่งไม่สำเร็จ (${j.error?.message || r.status})`);
}

/** Save the connection settings from /admin. `sa` = pasted key file (kept as is when undefined, removed when null). */
export async function saveGoogleCfg(v: { ga4Id?: unknown; propertyId?: unknown; gscSite?: unknown; sa?: unknown }, by: string) {
  const cur = await loadGoogleCfg(true), t = (x: unknown, m: number) => (typeof x === 'string' ? x : '').trim().slice(0, m);
  const ga4Id = t(v.ga4Id, 30).toUpperCase(), propertyId = t(v.propertyId, 20).replace(/^properties\//, ''), gscSite = t(v.gscSite, 200);
  if (ga4Id && !/^G-[A-Z0-9]{4,16}$/.test(ga4Id)) throw new GoogleError('input', 'Measurement ID ต้องขึ้นต้นด้วย G- เช่น G-ABC123XYZ');
  if (propertyId && !/^\d{5,15}$/.test(propertyId)) throw new GoogleError('input', 'Property ID เป็นตัวเลขล้วน (GA4 → ผู้ดูแลระบบ → รายละเอียดพร็อพเพอร์ตี้) ไม่ใช่ G-…');
  if (gscSite && !/^(sc-domain:[a-z0-9.-]+\.[a-z]{2,}|https?:\/\/[^\s]+\/)$/i.test(gscSite)) throw new GoogleError('input', 'Search Console ใช้ sc-domain:example.com หรือ https://example.com/ (มี / ท้าย)');
  let sa = cur.sa;
  if (v.sa === null) sa = null;
  else if (typeof v.sa === 'string' && v.sa.trim()) {
    let raw = v.sa.trim(); if (!raw.startsWith('{')) { try { raw = Buffer.from(raw, 'base64').toString('utf8'); } catch { /* not base64 */ } }
    let j: { type?: string; client_email?: string; private_key?: string } = {}; try { j = JSON.parse(raw); } catch { throw new GoogleError('input', 'อ่านไฟล์ JSON ไม่ได้ · ใช้ไฟล์ที่ดาวน์โหลดจาก Google Cloud → Service account → Keys'); }
    if (j.type !== 'service_account' || !j.client_email || !j.private_key) throw new GoogleError('input', 'ไฟล์นี้ไม่ใช่กุญแจ service account (ต้องมี client_email และ private_key)');
    sa = { email: j.client_email, enc: sealSecret(JSON.stringify({ type: 'service_account', client_email: j.client_email, private_key: j.private_key })) };
  }
  const next: GoogleCfg = { ga4Id, propertyId, gscSite, sa, at: new Date().toISOString(), by };
  await db.insert(settings).values({ key: GOOGLE_KEY, value: next }).onConflictDoUpdate({ target: settings.key, set: { value: next } });
  cache.clear(); await loadGoogleCfg(true);
  return { before: cur, after: next };
}
/** "ทดสอบการเชื่อมต่อ": a token, then one tiny request to each API */
export async function testGoogle() {
  await loadGoogleCfg(true); cache.clear();
  const out: { step: string; ok: boolean; msg: string }[] = [];
  const why = (e: unknown) => { const m = e instanceof Error ? e.message : String(e); return /fetch failed|timeout|aborted|ENOTFOUND|ECONN/i.test(m) ? 'เชื่อมต่อ Google ไม่ได้ · ตรวจอินเทอร์เน็ตของเซิร์ฟเวอร์' : m || 'ไม่สำเร็จ'; };
  const sa = serviceAccount(); if (!sa) return [{ step: 'กุญแจ service account', ok: false, msg: 'ยังไม่ได้ใส่ไฟล์ JSON' }];
  try { await accessToken(); out.push({ step: 'กุญแจ service account', ok: true, msg: sa.client_email }); } catch (e) { return [{ step: 'กุญแจ service account', ok: false, msg: why(e) }]; }
  if (prop()) { try { await post(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(prop())}:runReport`, { dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }], metrics: [{ name: 'sessions' }] }); out.push({ step: 'Google Analytics 4', ok: true, msg: 'อ่านรายงานได้ · พร็อพเพอร์ตี้ ' + prop() }); } catch (e) { out.push({ step: 'Google Analytics 4', ok: false, msg: why(e) }); } }
  else out.push({ step: 'Google Analytics 4', ok: false, msg: 'ยังไม่ได้ใส่ Property ID' });
  if (site()) { try { await post(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site())}/searchAnalytics/query`, { startDate: thDay(10), endDate: thDay(3), rowLimit: 1 }); out.push({ step: 'Search Console', ok: true, msg: 'อ่านข้อมูลได้ · ' + site() }); } catch (e) { out.push({ step: 'Search Console', ok: false, msg: why(e) }); } }
  else out.push({ step: 'Search Console', ok: false, msg: 'ยังไม่ได้ใส่พร็อพเพอร์ตี้' });
  return out;
}
