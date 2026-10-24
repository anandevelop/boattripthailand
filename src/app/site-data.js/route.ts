import { siteDataBundle } from '@/lib/site-render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const b = await siteDataBundle(), v = new URL(req.url).searchParams.get('v');
  return new Response(b.js, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': v === b.version ? 'public, max-age=31536000, immutable' : 'public, max-age=60' } });
}
