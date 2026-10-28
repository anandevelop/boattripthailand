import { audit } from '@/lib/audit';
import { currentUser } from '@/lib/auth';
import { can } from '@/lib/perms';
import { clientInfo } from '@/lib/request';
import { LineCfgError, saveLineCfg } from '@/lib/line-config';
import { lineStatus, pushTest, setWebhook, testLine } from '@/lib/line-admin';
import type { User } from '@/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** /admin → ตั้งค่า → LINE & แจ้งเตือน. Everything needs the "ตั้งค่าเว็บไซต์" permission. Keys are write-only. */
const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
const actor = (u: User) => ({ id: u.id, role: u.role });

async function handle(req: Request, params: Promise<{ op?: string[] }>) {
  const [a] = (await params).op ?? [], method = req.method;
  const me = await currentUser();
  if (!me) return json({ error: 'หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่', login: true }, 401);
  if (!can(me, 'settings')) {
    await audit(actor(me), { action: 'denied', entity: 'auth', ref: 'settings', label: 'ไม่มีสิทธิ์ settings (LINE)', ...(await clientInfo()) });
    return json({ error: 'ไม่มีสิทธิ์ทำรายการนี้' }, 403);
  }
  if (method !== 'GET') {
    const origin = req.headers.get('origin'), host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (origin && host && new URL(origin).host !== host) return json({ error: 'bad origin' }, 403);
  }
  let body: Record<string, unknown> = {};
  if (method !== 'GET') { try { body = ((await req.json()) ?? {}) as Record<string, unknown>; } catch { body = {}; } }
  try {
    if (!a && method === 'GET') return json({ status: await lineStatus(new URL(req.url).searchParams.get('refresh') === '1') });
    if (a === 'config' && method === 'PUT') {
      const v = { secret: body.secret === null ? null : typeof body.secret === 'string' ? body.secret : undefined, token: body.token === null ? null : typeof body.token === 'string' ? body.token : undefined };
      const r = await saveLineCfg(v, me.name);
      const ch = (f: string, b: { tail: string } | null, x: { tail: string } | null, changed: boolean) => changed ? [{ f, from: b ? '••••' + b.tail : null, to: x ? '••••' + x.tail + ' (ใหม่)' : null }] : [];
      const changes = [...ch('Channel secret', r.before.secret, r.after.secret, v.secret !== undefined), ...ch('Channel access token', r.before.token, r.after.token, v.token !== undefined)];
      if (changes.length) await audit(actor(me), { action: 'update', entity: 'settings', ref: 'line', label: 'เชื่อมต่อ LINE Messaging API', changes, ...(await clientInfo()) });
      return json({ status: await lineStatus(true) });
    }
    if (a === 'test' && method === 'POST') { const steps = await testLine(); return json({ steps, status: await lineStatus(true) }); }
    if (a === 'webhook' && method === 'POST') {
      const url = await setWebhook();
      await audit(actor(me), { action: 'update', entity: 'settings', ref: 'line', label: 'ตั้ง Webhook URL ของ LINE', changes: [{ f: 'Webhook', from: null, to: url }] });
      return json({ url, status: await lineStatus(true) });
    }
    if (a === 'push' && method === 'POST') { await pushTest(me.name); return json({ ok: true }); }
    return json({ error: 'ไม่พบ' }, 404);
  } catch (e) {
    if (e instanceof LineCfgError) return json({ error: e.message }, 400);
    const m = e instanceof Error ? e.message : String(e);
    console.error('[admin/line]', e);
    return json({ error: m.slice(0, 300) }, /ไม่สำเร็จ|ยังไม่|APP_URL/.test(m) ? 400 : 500);
  }
}
export const GET = (req: Request, ctx: { params: Promise<{ op?: string[] }> }) => handle(req, ctx.params);
export const POST = GET, PUT = GET;
