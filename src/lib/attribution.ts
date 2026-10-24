'use client';
/** First/last-touch attribution stored in the visitor's browser and sent with every lead. */
type Touch = { src: string; med: string; cmp: string; cnt: string; gclid: string; fbclid: string; ref: string; landing: string; ts: number };
type Attr = { first?: Touch; last?: Touch; visits: number; pages: number; boats: string[] };
const KEY = 'btt_attr';
const read = (): Attr => { try { return { visits: 0, pages: 0, boats: [], ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { visits: 0, pages: 0, boats: [] }; } };
const write = (a: Attr) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* private mode */ } };

export function trackPageView(path: string) {
  const a = read(), q = new URLSearchParams(location.search);
  const t: Touch = { src: q.get('utm_source') || '', med: q.get('utm_medium') || '', cmp: q.get('utm_campaign') || '', cnt: q.get('utm_content') || '', gclid: q.get('gclid') || '', fbclid: q.get('fbclid') || '', ref: document.referrer && !document.referrer.includes(location.host) ? document.referrer : '', landing: path, ts: Date.now() };
  let newVisit = false;
  try { newVisit = !sessionStorage.getItem('btt_v'); sessionStorage.setItem('btt_v', '1'); } catch { /* ignore */ }
  if (!a.first) a.first = t;
  if (t.src || t.gclid || t.fbclid || t.ref || !a.last) a.last = t;
  if (newVisit) a.visits++;
  a.pages++;
  const m = path.match(/\/yacht-charter\/([a-z0-9-]+)$/);
  if (m) a.boats = [m[1], ...a.boats.filter(s => s !== m[1])].slice(0, 8);
  write(a);
}

const host = (u: string) => { try { return new URL(u).hostname; } catch { return ''; } };
export function leadContext() {
  const a = read(), L = a.last, F = a.first;
  return {
    source: L?.gclid ? 'google_ads' : L?.fbclid ? 'meta_ads' : L?.src || (L?.ref ? host(L.ref) : 'direct'), medium: L?.med, campaign: L?.cmp, content: L?.cnt, gclid: L?.gclid, fbclid: L?.fbclid, referrer: L?.ref, landing_page: L?.landing,
    first_touch: F ? { source: F.src || (F.ref ? host(F.ref) : 'direct'), landing_page: F.landing, at: F.ts } : undefined,
    pages_viewed: a.pages, visits: a.visits, returning: a.visits > 1, boats_viewed: a.boats.slice(0, 5), current_page: location.pathname,
    device: matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop', event_id: 'lead.' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  };
}
