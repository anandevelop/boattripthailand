import { currentUser } from '@/lib/auth';
import { boatSheet } from '@/lib/boat-sheet';
import { can } from '@/lib/perms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** /api/admin/boat-sheet/<slug>?lang=th|en&prices=0|1&dl=1 → the boat's spec sheet as a PDF (staff only) */
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const u = await currentUser();
  if (!u) return new Response('หมดเวลาเข้าระบบ', { status: 401 });
  if (!can(u, 'boats') && !can(u, 'leads')) return new Response('ไม่มีสิทธิ์', { status: 403 });
  const q = new URL(req.url).searchParams, lang = q.get('lang') === 'th' ? 'th' : 'en';
  const out = await boatSheet((await ctx.params).slug, lang, q.get('prices') !== '0');
  if (!out) return new Response('ไม่พบเรือ', { status: 404 });
  return new Response(new Uint8Array(out.pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `${q.get('dl') === '1' ? 'attachment' : 'inline'}; filename="${out.name}"`, 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
}
