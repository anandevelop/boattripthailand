import { currentUser } from '@/lib/auth';
import { liveNow } from '@/lib/live';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET → who is on the public site right now (aggregate only) */
export async function GET() {
  const u = await currentUser();
  if (!u) return Response.json({ error: 'หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่', login: true }, { status: 401 });
  return Response.json(liveNow(), { headers: { 'Cache-Control': 'no-store' } });
}
