import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { trafficDaily } from '@/db/schema';
import { rateLimit } from '@/lib/ratelimit';
import { hourlyHit } from '@/lib/traffic-hourly';

export const runtime = 'nodejs';

/**
 * Cookieless page-view beacon from the public site (navigator.sendBeacon, text/plain JSON).
 * Stores daily totals per page / source / device / language only — nothing that identifies a visitor.
 */
const SOURCES = ['direct', 'google', 'google-ads', 'bing', 'facebook', 'facebook-ads', 'instagram', 'line', 'tiktok', 'youtube', 'ai', 'email', 'referral', 'other'];
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget|python|node-fetch|BTT-SSR/i;

export async function POST(req: Request) {
  const ok = new Response(null, { status: 204 });
  if (BOT.test(req.headers.get('user-agent') || '')) return ok;
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit('t:' + ip, 240, 10 * 60_000)) return ok;
  let b: Record<string, unknown>;
  try { b = JSON.parse((await req.text()).slice(0, 2000)); } catch { return ok; }
  const raw = typeof b.p === 'string' ? b.p : '';
  const nf = raw.startsWith('404:'), p0 = (nf ? raw.slice(4) : raw).split(/[?#]/)[0].slice(0, 200);
  if (!p0.startsWith('/') || /^\/(admin|api|_next)(\/|$)/.test(p0)) return ok;
  let path = p0.length > 1 ? p0.replace(/\/+$/, '') : p0; try { path = decodeURIComponent(path); } catch { /* keep */ }
  if (nf) path = '404:' + path;
  const source = SOURCES.includes(String(b.s)) ? String(b.s) : 'other';
  const device = ['mobile', 'tablet', 'desktop'].includes(String(b.d)) ? String(b.d) : 'desktop';
  const lang = b.l === 'en' ? 'en' : 'th';
  const first = b.f === true ? 1 : 0;
  const day = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);   // Thailand date
  try {
    await db.insert(trafficDaily).values({ day, path, source, device, lang, views: 1, sessions: first })
      .onConflictDoUpdate({ target: [trafficDaily.day, trafficDaily.path, trafficDaily.source, trafficDaily.device, trafficDaily.lang], set: { views: sql`${trafficDaily.views} + 1`, sessions: sql`${trafficDaily.sessions} + ${first}` } });
  } catch (e) { console.error('[track]', e); }
  try { await hourlyHit(!!first); } catch (e) { console.error('[track hourly]', e); }   // the 24-hour view
  return ok;
}
