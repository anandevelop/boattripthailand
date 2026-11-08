import { homeScript } from '@/lib/site-render';
import { siteCfg } from '@/lib/site-cfg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** /site-home.js?l=th&h=<hash> — the hidden home view for pages other than home (see site-render.ts run) */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams, lang = q.get('l') === 'en' ? 'en' : 'th', h = (q.get('h') || '').slice(0, 16);
  const r = await homeScript(h, lang, await siteCfg());
  return new Response(r.js, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': r.exact ? 'public, max-age=31536000, immutable' : 'public, max-age=60' } });
}
