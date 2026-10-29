import { audit } from '@/lib/audit';
import { currentUser } from '@/lib/auth';
import { can, type Perm } from '@/lib/perms';
import { clientInfo } from '@/lib/request';
import { BackupError, createBackup, dumpData, fmtSize, JOBS, packDump, readBackup, restoreBackup, runJob, saveAlerts, saveUpload, sendAlert, systemStatus, validFile } from '@/lib/system';
import { systemInfo } from '@/lib/system-info';
import type { User } from '@/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * /admin → ระบบ & สำรองข้อมูล. Viewing: settings · download: export · restore: team (Super Admin).
 * Separate from /api/admin/[...op] because downloads/uploads are raw files, not JSON.
 */
const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
const actor = (u: User) => ({ id: u.id, role: u.role });
class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }
async function need(u: User, p: Perm) {
  if (can(u, p)) return;
  await audit(actor(u), { action: 'denied', entity: 'auth', ref: p, label: `ไม่มีสิทธิ์ ${p}`, ...(await clientInfo()) });
  throw new HttpError(403, 'ไม่มีสิทธิ์ทำรายการนี้');
}
const file = (buf: Buffer, name: string) => new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'application/gzip', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });

async function handle(req: Request, params: Promise<{ op?: string[] }>) {
  const op = (await params).op ?? [], [a, b] = op, method = req.method;
  const me = await currentUser();
  if (!me) return json({ error: 'หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่', login: true }, 401);
  if (method !== 'GET') {
    const origin = req.headers.get('origin'), host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (origin && host && new URL(origin).host !== host) return json({ error: 'bad origin' }, 403);
  }
  const body = async () => { try { return ((await req.json()) ?? {}) as Record<string, unknown>; } catch { return {}; } };
  try {
    if (!a && method === 'GET') { await need(me, 'settings'); return json({ ...(await systemStatus()), info: await systemInfo(req.headers), can: { download: can(me, 'export'), restore: can(me, 'team') } }); }

    if (a === 'run' && method === 'POST') {
      await need(me, 'settings');
      const id = String((await body()).job ?? ''), job = JOBS.find(j => j.id === id);
      if (!job) throw new HttpError(400, 'ไม่พบงานนี้');
      const r = await runJob(id, me.name);
      await audit(actor(me), { action: 'update', entity: 'system', ref: id, label: `รันงาน ${job.name} ทันที`, changes: [{ f: 'ผล', from: null, to: (r.ok ? 'สำเร็จ · ' : 'ล้มเหลว · ') + r.msg }] });
      return json({ result: r, status: await systemStatus() });
    }
    if (a === 'backup' && !b && method === 'POST') {
      await need(me, 'settings');
      const r = await createBackup('manual', me.name);
      await audit(actor(me), { action: 'create', entity: 'system', ref: r.file, label: 'สำรองข้อมูลทันที', changes: [{ f: 'ไฟล์', from: null, to: `${r.file} · ${fmtSize(r.size)}` }] });
      return json({ file: r.file, status: await systemStatus() });
    }
    if (a === 'backup' && b && method === 'GET') {
      await need(me, 'export');
      if (!validFile(b)) throw new HttpError(404, 'ไม่พบไฟล์');
      const buf = await readBackup(b); if (!buf) throw new HttpError(404, 'ไม่พบไฟล์');
      await audit(actor(me), { action: 'export', entity: 'system', ref: b, label: `ดาวน์โหลดไฟล์สำรอง ${b}`, ...(await clientInfo()) });
      return file(buf, b);
    }
    if (a === 'export' && method === 'GET') {
      await need(me, 'export');
      const d = await dumpData(me.name), name = `btt-data-${new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)}.json.gz`;
      await audit(actor(me), { action: 'export', entity: 'system', ref: name, label: 'ดาวน์โหลดข้อมูลทั้งหมด', ...(await clientInfo()) });
      return file(packDump(d), name);
    }
    if (a === 'upload' && method === 'POST') {
      await need(me, 'team');
      if (Number(req.headers.get('content-length') || 0) > 300 * 1048576) throw new HttpError(413, 'ไฟล์ใหญ่เกิน 300 MB');
      const buf = Buffer.from(await req.arrayBuffer());
      try {
        const r = await saveUpload(buf, me.name);
        await audit(actor(me), { action: 'create', entity: 'system', ref: r.file, label: 'อัปโหลดไฟล์สำรอง', changes: [{ f: 'ไฟล์', from: null, to: `${r.file} · ${r.rows.toLocaleString()} แถว · สำรองเมื่อ ${r.from}` }] });
        return json({ ...r, status: await systemStatus() });
      } catch (e) { if (e instanceof BackupError) throw new HttpError(400, e.message); throw e; }
    }
    if (a === 'restore' && method === 'POST') {
      await need(me, 'team');
      const B = await body(), f = String(B.file ?? '');
      if (B.confirm !== 'กู้คืน') throw new HttpError(400, 'พิมพ์คำว่า กู้คืน เพื่อยืนยัน');
      if (!validFile(f)) throw new HttpError(404, 'ไม่พบไฟล์สำรองนี้');
      try {
        const r = await restoreBackup(f, me.name);
        await audit(actor(me), { action: 'update', entity: 'system', ref: f, label: `กู้คืนข้อมูลจาก ${f}`, changes: [{ f: 'ข้อมูล', from: `สำรองไว้ก่อนกู้คืน: ${r.safety}`, to: `${r.rows.toLocaleString()} แถว จากไฟล์วันที่ ${r.from}` }], ...(await clientInfo()) });
        return json({ ...r, status: await systemStatus() });
      } catch (e) { if (e instanceof BackupError) throw new HttpError(400, e.message); throw e; }
    }
    if (a === 'alerts' && method === 'PUT') {
      await need(me, 'settings');
      const B = await body(), r = await saveAlerts((B.on ?? {}) as Record<string, unknown>, me.name);
      const L: Record<string, string> = { down: 'เว็บล่มเกิน 2 นาที', ttfb: 'TTFB เกิน 1 วินาที 15 นาที', cron: 'งานอัตโนมัติล้มเหลว', backup: 'สำรองข้อมูลล้มเหลว' };
      const changes = (Object.keys(L) as (keyof typeof r.after.on)[]).filter(k => r.before.on[k] !== r.after.on[k]).map(k => ({ f: L[k], from: r.before.on[k] ? 'เปิด' : 'ปิด', to: r.after.on[k] ? 'เปิด' : 'ปิด' }));
      if (changes.length) await audit(actor(me), { action: 'update', entity: 'settings', ref: 'system.alerts', label: 'แจ้งเตือนเมื่อระบบมีปัญหา', changes });
      return json({ status: await systemStatus() });
    }
    if (a === 'alerts' && b === 'test' && method === 'POST') {
      await need(me, 'settings');
      const sent = await sendAlert('test', `ทดสอบการแจ้งเตือนโดย ${me.name} · ถ้าเห็นข้อความนี้ แปลว่าแจ้งเตือนเข้ากลุ่มนี้ได้`, true).catch(e => { throw new HttpError(502, 'ส่ง LINE ไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e))); });
      if (!sent) throw new HttpError(400, 'ยังไม่ได้เชื่อม LINE OA หรือยังไม่ได้เชิญบอทเข้ากลุ่มทีมขาย');
      return json({ ok: true });
    }
    throw new HttpError(404, 'ไม่พบ');
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error('[system]', e);
    return json({ error: 'เกิดข้อผิดพลาด: ' + (e instanceof Error ? e.message : String(e)).slice(0, 200) }, 500);
  }
}
export const GET = (req: Request, ctx: { params: Promise<{ op?: string[] }> }) => handle(req, ctx.params);
export const POST = GET, PUT = GET;
