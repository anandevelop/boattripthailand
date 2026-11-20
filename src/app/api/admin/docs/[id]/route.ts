import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { leads } from '@/db/schema';
import { apiUser } from '@/lib/api-auth';
import { docById, docPdf } from '@/lib/lead-docs';
import { canSeeLead } from '@/lib/leads';
import { can } from '@/lib/perms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** /api/admin/docs/<id> → the document as a PDF (?dl=1 downloads it). Staff who can see the lead only. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const _auth = await apiUser(req); if (_auth.res) return _auth.res;   // cookie session, or an AI's API token (lib/api-auth.ts)
  const u = _auth.user;
  if (!u) return new Response('หมดเวลาเข้าระบบ', { status: 401 });
  const row = await docById(Number((await ctx.params).id));
  if (!row) return new Response('ไม่พบเอกสาร', { status: 404 });
  const [l] = await db.select().from(leads).where(eq(leads.id, row.leadId));
  if (!l || !can(u, 'leads') || !canSeeLead(u, l)) return new Response('ไม่มีสิทธิ์', { status: 403 });
  const pdf = await docPdf(row);
  const dl = new URL(req.url).searchParams.get('dl') === '1';
  return new Response(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `${dl ? 'attachment' : 'inline'}; filename="${row.no}.pdf"`, 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
}
