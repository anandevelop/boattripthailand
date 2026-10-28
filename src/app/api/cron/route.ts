import { timingSafeEqual } from 'node:crypto';
import { JOBS, runJob, tick } from '@/lib/system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Outside trigger for the scheduled jobs: /api/cron?key=CRON_SECRET (runs whatever is due)
 * or /api/cron?key=…&job=backup (runs one job now). Off unless CRON_SECRET is set in .env.
 */
function okKey(k: string | null) {
  const s = process.env.CRON_SECRET;
  if (!s || s.length < 16 || !k) return false;
  const a = Buffer.from(k), b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function handle(req: Request) {
  const q = new URL(req.url).searchParams;
  if (!process.env.CRON_SECRET) return Response.json({ error: 'CRON_SECRET ยังไม่ได้ตั้งใน .env' }, { status: 404 });
  if (!okKey(q.get('key') || req.headers.get('x-cron-key'))) return Response.json({ error: 'forbidden' }, { status: 403 });
  const job = q.get('job');
  if (job) {
    if (!JOBS.some(j => j.id === job)) return Response.json({ error: 'unknown job' }, { status: 400 });
    const r = await runJob(job, 'cron');
    return Response.json({ job, ...r }, { status: r.ok ? 200 : 500, headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json({ ok: true, ran: await tick() }, { headers: { 'Cache-Control': 'no-store' } });
}
export const GET = handle, POST = handle;
