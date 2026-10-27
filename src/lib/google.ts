import 'server-only';
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * Real data for /admin → วิเคราะห์เว็บไซต์ (Google Analytics 4 + Search Console tabs).
 * Read-only, via one Google Cloud service account. Configure in .env:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  the key file contents — raw JSON or base64 (base64 -i key.json | tr -d '\n')
 *     or GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 *   GA4_PROPERTY_ID              numeric property id (GA4 → Admin → Property details), not G-XXXX
 *   GSC_SITE_URL                 https://boattripthailand.com/  (URL-prefix)  or  sc-domain:boattripthailand.com
 * The service account email must be added as Viewer in GA4 and as a user (Restricted) in Search Console.
 */
type SA = { client_email: string; private_key: string };
let saCache: SA | null | undefined;
function serviceAccount(): SA | null {
  if (saCache !== undefined) return saCache;
  let raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim();
  try {
    if (!raw && process.env.GOOGLE_APPLICATION_CREDENTIALS) raw = readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
    if (raw && !raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
    const j = raw ? JSON.parse(raw) : null;
    saCache = j?.client_email && j?.private_key ? { client_email: j.client_email, private_key: j.private_key } : null;
  } catch (e) { console.error('[google] service account key could not be read', e); saCache = null; }
  return saCache;
}

// read-only analytics + Search Console, and Cloud Translation (admin auto-translate, capped in src/lib/translate.ts)
const SCOPES = 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly';
let token: { v: string; exp: number } | null = null;
async function accessToken() {
  if (token && token.exp > Date.now() + 60_000) return token.v;
  const sa = serviceAccount(); if (!sa) throw new GoogleError('no_key', 'ยังไม่ได้ใส่กุญแจ service account');
  const now = Math.floor(Date.now() / 1000), b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: SCOPES, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = unsigned + '.' + createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new GoogleError('auth', `Google ไม่รับกุญแจ service account (${j.error_description || j.error || r.status})`);
  token = { v: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return token.v;
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
  return { key: !!sa, email: sa?.client_email ?? null, ga: { on: !!sa && !!process.env.GA4_PROPERTY_ID, property: process.env.GA4_PROPERTY_ID || null }, gsc: { on: !!sa && !!process.env.GSC_SITE_URL, site: process.env.GSC_SITE_URL || null } };
}

/* ---------- GA4 Data API ---------- */
type Row = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
const num = (r: Row, i: number) => Number(r.metricValues?.[i]?.value ?? 0);
const dim = (r: Row, i = 0) => r.dimensionValues?.[i]?.value ?? '';
const KEY_EVENTS = ['booking_submit', 'whatsapp_click', 'line_click', 'phone_click'];

async function ga4(days: number) {
  const id = process.env.GA4_PROPERTY_ID!, url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(id)}:runReport`;
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
  const id = process.env.GA4_PROPERTY_ID!, url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(id)}:runReport`;
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
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL!)}/searchAnalytics/query`;
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
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL!)}/searchAnalytics/query`;
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
  const s = googleStatus();
  if (refresh) { cache.delete('ga:' + days); cache.delete('gsc:' + days); }
  // 24 hours: refreshed every 10 minutes instead of 30
  if (days === 1) for (const k of ['ga:1', 'gsc:1']) { const c = cache.get(k); if (c && Date.now() - c.at > 10 * 60_000) cache.delete(k); }
  const [ga, sc] = await Promise.all([s.ga.on ? cached('ga:' + days, () => days === 1 ? ga4h() : ga4(days)) : null, s.gsc.on ? cached('gsc:' + days, () => days === 1 ? gsch() : gsc(days)) : null]);
  return { days, status: s, ga, gsc: sc, at: new Date().toISOString() };
}
