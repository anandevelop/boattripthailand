import { audit } from '@/lib/audit';
import { currentUser } from '@/lib/auth';
import { can } from '@/lib/perms';
import { clientInfo } from '@/lib/request';
import { LineCfgError, saveLineCfg } from '@/lib/line-config';
import { lineStatus, pushTest, setWebhook, testLine } from '@/lib/line-admin';
import { loadLeadNotify, saveLeadNotify } from '@/lib/line-notify';
import { psiCfg, savePsiCfg } from '@/lib/pagespeed';
import { loadAlerts, saveAlerts } from '@/lib/system';
import type { User } from '@/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** /admin → ตั้งค่า → LINE & แจ้งเตือน. Everything needs the "ตั้งค่าเว็บไซต์" permission. Keys are write-only. */
const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
const actor = (u: User) => ({ id: u.id, role: u.role });

const LEAD_L = { newLead: 'ลีดใหม่', dupLead: 'ลูกค้าส่งคำขอซ้ำ', sla: 'ลีดรอเกินเวลา', alwaysGroup: 'ส่งเข้ากลุ่มทุกครั้ง' } as const;
const SYS_L = { down: 'เว็บล่มเกิน 2 นาที', ttfb: 'TTFB เกิน 1 วินาที 15 นาที', cron: 'งานอัตโนมัติล้มเหลว', backup: 'สำรองข้อมูลล้มเหลว' } as const;
async function notifyState() {
  const [lead, alerts, psi] = await Promise.all([loadLeadNotify(), loadAlerts(), psiCfg()]);
  return { lead, alerts: alerts.on, psi: psi.alerts, psiThreshold: psi.threshold };
}

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
    if (!a && method === 'GET') return json({ status: await lineStatus(new URL(req.url).searchParams.get('refresh') === '1'), notify: await notifyState() });
    if (a === 'notify' && method === 'PUT') {
      const lead = (body.lead ?? {}) as Record<string, unknown>, sys = (body.alerts ?? null) as Record<string, unknown> | null;
      const changes: { f: string; from: unknown; to: unknown }[] = [], oo = (v: boolean) => v ? 'เปิด' : 'ปิด';
      const l = await saveLeadNotify(lead, me.name);
      for (const [k, f] of Object.entries(LEAD_L) as [keyof typeof LEAD_L, string][]) if (l.before[k] !== l.after[k]) changes.push({ f, from: oo(l.before[k]), to: oo(l.after[k]) });
      if (l.before.slaMinutes !== l.after.slaMinutes) changes.push({ f: 'เวลารอก่อนเตือน (นาที)', from: l.before.slaMinutes, to: l.after.slaMinutes });
      if (sys) {
        const s = await saveAlerts({ ...(await loadAlerts()).on, ...sys }, me.name);
        for (const [k, f] of Object.entries(SYS_L) as [keyof typeof s.after.on, string][]) if (s.before.on[k] !== s.after.on[k]) changes.push({ f, from: oo(s.before.on[k]), to: oo(s.after.on[k]) });
      }
      if (typeof body.psi === 'boolean') {
        const p = await savePsiCfg({ alerts: body.psi }, me.name);
        if (p.before.alerts !== p.after.alerts) changes.push({ f: 'คะแนน PageSpeed ต่ำกว่าเกณฑ์', from: oo(p.before.alerts), to: oo(p.after.alerts) });
      }
      if (changes.length) await audit(actor(me), { action: 'update', entity: 'settings', ref: 'line.notify', label: 'เปิด/ปิดการแจ้งเตือน LINE', changes, ...(await clientInfo()) });
      return json({ notify: await notifyState() });
    }
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
