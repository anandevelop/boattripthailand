import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { appUrl } from './leads';
import { pushLine, text } from './line';
import { loadLineCfg, lineSaved } from './line-config';

/** /admin → ตั้งค่า → LINE & แจ้งเตือน: status, connection test, webhook set-up, test message, monthly quota */
const API = 'https://api.line.me/v2/bot';
async function tok() { await loadLineCfg(); return process.env.LINE_CHANNEL_ACCESS_TOKEN || lineSaved().token; }
async function lget(path: string, init?: RequestInit) {
  const t = await tok();
  if (!t) return { ok: false, status: 0, j: null as Record<string, unknown> | null };
  try {
    const r = await fetch(API + path, { ...init, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(10_000), cache: 'no-store' });
    const j = (await r.json().catch(() => null)) as Record<string, unknown> | null;
    return { ok: r.ok, status: r.status, j };
  } catch { return { ok: false, status: -1, j: null }; }
}
const why = (r: { status: number; j: Record<string, unknown> | null }) => r.status === -1 ? 'ติดต่อ LINE ไม่ได้ (เครือข่าย)' : r.status === 401 ? 'Token ไม่ถูกต้องหรือถูกยกเลิกแล้ว' : r.status === 403 ? 'Token ไม่มีสิทธิ์ทำรายการนี้' : String(r.j?.message || `HTTP ${r.status}`);

export const webhookUrl = () => appUrl() + '/api/line/webhook';
export async function groupId() {
  if (process.env.LINE_GROUP_ID) return { id: process.env.LINE_GROUP_ID, src: 'env' as const };
  const [s] = await db.select().from(settings).where(eq(settings.key, 'line.groupId'));
  return { id: (s?.value as string) || null, src: s ? 'saved' as const : null };
}

const G = globalThis as unknown as { __lineInfo?: { at: number; v: Record<string, unknown> } };
export async function lineStatus(refresh = false) {
  const cfg = await loadLineCfg(true), saved = lineSaved();
  const src = (env: string | undefined, s: string) => env ? 'env' : s ? 'saved' : null;
  const g = await groupId();
  const st: Record<string, unknown> = {
    secret: { src: src(process.env.LINE_CHANNEL_SECRET, saved.secret), tail: process.env.LINE_CHANNEL_SECRET ? '' : cfg.secret?.tail ?? '' },
    token: { src: src(process.env.LINE_CHANNEL_ACCESS_TOKEN, saved.token), tail: process.env.LINE_CHANNEL_ACCESS_TOKEN ? '' : cfg.token?.tail ?? '' },
    savedAt: cfg.at ?? null, savedBy: cfg.by ?? null, webhook: webhookUrl(), https: webhookUrl().startsWith('https://'),
    group: { id: g.id ? g.id.slice(0, 6) + '…' + g.id.slice(-4) : null, src: g.src, name: null as string | null },
  };
  if (!(await tok())) return { ...st, bot: null, endpoint: null, quota: null };
  if (!refresh && G.__lineInfo && Date.now() - G.__lineInfo.at < 5 * 60_000) return { ...st, ...G.__lineInfo.v, group: { ...(st.group as object), name: (G.__lineInfo.v.groupName as string) ?? null } };
  const [bot, ep, q, used, gs] = await Promise.all([lget('/info'), lget('/channel/webhook/endpoint'), lget('/message/quota'), lget('/message/quota/consumption'), g.id ? lget(`/group/${encodeURIComponent(g.id)}/summary`) : Promise.resolve(null)]);
  const v = {
    bot: bot.ok ? { name: bot.j?.displayName, basicId: bot.j?.basicId, pic: bot.j?.pictureUrl ?? null, chatMode: bot.j?.chatMode } : { error: why(bot) },
    endpoint: ep.ok ? { url: ep.j?.endpoint ?? '', active: ep.j?.active === true, match: ep.j?.endpoint === webhookUrl() } : null,
    quota: q.ok ? { type: q.j?.type, limit: typeof q.j?.value === 'number' ? q.j.value : null, used: used.ok ? used.j?.totalUsage ?? null : null } : null,
    groupName: gs?.ok ? (gs.j?.groupName as string) ?? null : null,
  };
  G.__lineInfo = { at: Date.now(), v };
  return { ...st, ...v, group: { ...(st.group as object), name: v.groupName } };
}

export async function testLine() {
  const steps: { step: string; ok: boolean; msg: string }[] = [];
  const s = lineSaved();
  steps.push({ step: 'Channel secret', ok: !!(process.env.LINE_CHANNEL_SECRET || s.secret), msg: process.env.LINE_CHANNEL_SECRET ? 'ตั้งใน .env' : s.secret ? 'บันทึกแล้ว (ใช้ตรวจว่าข้อความมาจาก LINE จริง)' : 'ยังไม่ได้ใส่ · webhook จะปฏิเสธทุกข้อความ' });
  if (!(await tok())) { steps.push({ step: 'Channel access token', ok: false, msg: 'ยังไม่ได้ใส่' }); return steps; }
  const bot = await lget('/info');
  steps.push({ step: 'Channel access token', ok: bot.ok, msg: bot.ok ? `เชื่อมกับบอท ${bot.j?.displayName} (${bot.j?.basicId})` : why(bot) });
  if (!bot.ok) return steps;
  const ep = await lget('/channel/webhook/endpoint');
  const url = webhookUrl();
  if (!url.startsWith('https://')) steps.push({ step: 'Webhook URL', ok: false, msg: `APP_URL ต้องเป็น https โดเมนจริง (ตอนนี้ ${url}) · LINE ส่งเข้า localhost ไม่ได้` });
  else if (!ep.ok) steps.push({ step: 'Webhook URL', ok: false, msg: why(ep) });
  else if (ep.j?.endpoint !== url) steps.push({ step: 'Webhook URL', ok: false, msg: ep.j?.endpoint ? `ใน LINE ตั้งเป็น ${ep.j.endpoint} · กด “ตั้ง Webhook ให้อัตโนมัติ”` : 'ยังไม่ได้ตั้ง · กด “ตั้ง Webhook ให้อัตโนมัติ”' });
  else if (ep.j?.active !== true) steps.push({ step: 'Webhook URL', ok: false, msg: 'ตั้ง URL ถูกแล้ว แต่ยังไม่ได้เปิด Use webhook ใน LINE Developers' });
  else {
    const t = await lget('/channel/webhook/test', { method: 'POST', body: JSON.stringify({ endpoint: url }) });
    steps.push({ step: 'Webhook URL', ok: t.ok && t.j?.success === true, msg: t.ok && t.j?.success ? 'LINE ส่งข้อความเข้าเว็บได้' : `LINE ส่งเข้าเว็บไม่สำเร็จ (${t.j?.statusCode ?? t.j?.reason ?? why(t)})` });
  }
  const g = await groupId();
  if (!g.id) steps.push({ step: 'กลุ่ม LINE ทีมขาย', ok: false, msg: 'ยังไม่มี · เชิญบอทเข้ากลุ่มทีมขาย ระบบจะจำกลุ่มให้เอง (ต้องตั้ง Webhook ก่อน)' });
  else { const gs = await lget(`/group/${encodeURIComponent(g.id)}/summary`); steps.push({ step: 'กลุ่ม LINE ทีมขาย', ok: gs.ok, msg: gs.ok ? `กลุ่ม “${gs.j?.groupName}”` : 'บอทไม่ได้อยู่ในกลุ่มนี้แล้ว · เชิญบอทเข้ากลุ่มใหม่' }); }
  G.__lineInfo = undefined;
  return steps;
}

export async function setWebhook() {
  const url = webhookUrl();
  if (!url.startsWith('https://')) throw new Error(`APP_URL ต้องเป็น https โดเมนจริง (ตอนนี้ ${url})`);
  const r = await lget('/channel/webhook/endpoint', { method: 'PUT', body: JSON.stringify({ endpoint: url }) });
  if (!r.ok) throw new Error('ตั้ง Webhook ไม่สำเร็จ: ' + why(r));
  G.__lineInfo = undefined;
  return url;
}

export async function pushTest(by: string) {
  const g = await groupId();
  if (!(await tok())) throw new Error('ยังไม่ได้ใส่ Channel access token');
  if (!g.id) throw new Error('ยังไม่มีกลุ่มทีมขาย · เชิญบอทเข้ากลุ่มก่อน');
  const r = await pushLine(g.id, [text(`✅ ทดสอบจากหลังบ้าน Boat Trip Thailand โดย ${by}\nถ้าเห็นข้อความนี้ แปลว่าลีดใหม่และการแจ้งเตือนจะเข้ากลุ่มนี้`)]);
  if (!r.ok) throw new Error('ส่งไม่สำเร็จ · ตรวจ Token หรือโควตาข้อความของเดือนนี้');
  return true;
}
