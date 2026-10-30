import { liveBeat } from '@/lib/live';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

/** Heartbeat from an open tab of the public site (every 30 s) → /admin "ออนไลน์ตอนนี้". No cookie, nothing stored per visitor. */
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget|python|node-fetch|BTT-SSR/i;

export async function POST(req: Request) {
  const ok = new Response(null, { status: 204 });
  if (BOT.test(req.headers.get('user-agent') || '')) return ok;
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit('live:' + ip, 600, 10 * 60_000)) return ok;
  try { liveBeat(JSON.parse((await req.text()).slice(0, 1000))); } catch { /* ignore bad beats */ }
  return ok;
}
