import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

/**
 * Email through Resend (https://resend.com, HTTP API — no SDK). Set up in /admin → ตั้งค่า → อีเมล & เอกสาร:
 * the API key is stored AES-256-GCM encrypted in settings('mail.config') and never sent back to the browser;
 * RESEND_API_KEY in .env wins. Sender: MAIL_FROM / saved "from" (default contact@boattripthailand.com),
 * replies go to the saved reply-to (default: the contact email in ตั้งค่า).
 */
export const MAIL_KEY = 'mail.config';
type Sealed = { enc: string; tail: string };
export type MailCfg = { key: Sealed | null; from: string; fromName: string; replyTo: string; ack: boolean; at?: string; by?: string };
export class MailError extends Error {}

const ck = () => createHash('sha256').update('btt-mail|' + (process.env.SETTINGS_KEY || process.env.POSTGRES_PASSWORD || process.env.DATABASE_URL || 'btt')).digest();
const seal = (plain: string): Sealed => { const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', ck(), iv), enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]); return { enc: [iv, c.getAuthTag(), enc].map(b => b.toString('base64')).join('.'), tail: plain.slice(-4) }; };
const unseal = (s: Sealed | null) => { if (!s) return ''; try { const [iv, tag, enc] = s.enc.split('.').map(x => Buffer.from(x, 'base64')); const d = createDecipheriv('aes-256-gcm', ck(), iv); d.setAuthTag(tag); return Buffer.concat([d.update(enc), d.final()]).toString('utf8'); } catch { return ''; } };
const isEmail = (s: string) => /^[^\s@<>"]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/i.test(s);

async function siteEmail() {
  const [r] = await db.select().from(settings).where(eq(settings.key, 'admin.sitecfg'));
  const e = String(((r?.value ?? {}) as Record<string, unknown>).email ?? '').trim();
  return isEmail(e) ? e : 'boattripthailand@gmail.com';
}
export async function loadMailCfg(): Promise<MailCfg> {
  const [r] = await db.select().from(settings).where(eq(settings.key, MAIL_KEY));
  const v = (r?.value ?? {}) as Partial<MailCfg>;
  return { key: v.key ?? null, from: v.from || process.env.MAIL_FROM || 'contact@boattripthailand.com', fromName: v.fromName || 'Boat Trip Thailand', replyTo: v.replyTo || await siteEmail(), ack: v.ack ?? true, at: v.at, by: v.by };
}
async function apiKey(cfg?: MailCfg) { return process.env.RESEND_API_KEY || unseal((cfg ?? await loadMailCfg()).key); }
export async function mailReady() { return !!(await apiKey()); }

export async function saveMailCfg(b: Record<string, unknown>, by: string) {
  const before = await loadMailCfg(), s = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  const after: MailCfg = { ...before, at: new Date().toISOString(), by };
  if (b.key === null) after.key = null;
  else if (typeof b.key === 'string' && b.key.trim()) { const k = b.key.trim(); if (!/^re_[A-Za-z0-9_]{10,}$/.test(k)) throw new MailError('API key ของ Resend ขึ้นต้นด้วย re_'); after.key = seal(k); }
  if (b.from !== undefined) { const f = s(b.from, 120).toLowerCase(); if (!isEmail(f)) throw new MailError('อีเมลผู้ส่งไม่ถูกต้อง'); after.from = f; }
  if (b.fromName !== undefined) after.fromName = s(b.fromName, 60).replace(/[<>"]/g, '') || 'Boat Trip Thailand';
  if (b.replyTo !== undefined) { const r = s(b.replyTo, 120); if (!isEmail(r)) throw new MailError('อีเมลตอบกลับไม่ถูกต้อง'); after.replyTo = r; }
  if (b.ack !== undefined) after.ack = b.ack === true;
  await db.insert(settings).values({ key: MAIL_KEY, value: after }).onConflictDoUpdate({ target: settings.key, set: { value: after } });
  return { before, after };
}

/** for the admin: no secrets; `refresh` also asks Resend whether the sender's domain is verified */
export async function mailStatus(refresh = false) {
  const cfg = await loadMailCfg(), env = !!process.env.RESEND_API_KEY, key = await apiKey(cfg);
  let domain: { name: string; status: string; records?: { type: string; name: string; value: string; status: string }[] } | { error: string } | null = null;
  if (refresh && key) {
    try {
      const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15_000) });
      const j = await r.json().catch(() => ({})) as { data?: { id: string; name: string; status: string }[]; message?: string };
      if (!r.ok) domain = { error: j.message || `Resend ตอบ ${r.status}` };
      else {
        const want = cfg.from.split('@')[1], d = (j.data ?? []).find(x => x.name === want);
        if (!d) domain = { name: want, status: 'missing' };
        else {
          const one = await fetch(`https://api.resend.com/domains/${d.id}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15_000) }).then(x => x.json()).catch(() => ({})) as { records?: { type: string; name: string; value: string; status: string }[] };
          domain = { name: d.name, status: d.status, records: (one.records ?? []).map(x => ({ type: x.type, name: x.name, value: x.value, status: x.status })) };
        }
      }
    } catch (e) { domain = { error: e instanceof Error ? e.message : 'เชื่อมต่อ Resend ไม่ได้' }; }
  }
  return { ready: !!key, src: env ? 'env' : cfg.key ? 'saved' : null, tail: env ? '' : cfg.key?.tail ?? '', from: cfg.from, fromName: cfg.fromName, replyTo: cfg.replyTo, ack: cfg.ack, at: cfg.at ?? null, by: cfg.by ?? null, domain };
}

export type Mail = { to: string; subject: string; html: string; text: string; attachments?: { filename: string; content: Buffer }[] };
/** sends one email; returns Resend's message id. Throws MailError with a Thai message the admin can show. */
export async function sendMail(m: Mail) {
  const cfg = await loadMailCfg(), key = await apiKey(cfg);
  if (!key) throw new MailError('ยังไม่ได้ตั้งค่าอีเมล · ตั้งค่า › อีเมล & เอกสาร');
  if (!isEmail(m.to)) throw new MailError('อีเมลผู้รับไม่ถูกต้อง');
  const body = { from: `${cfg.fromName} <${cfg.from}>`, to: [m.to], reply_to: cfg.replyTo, subject: m.subject.slice(0, 200), html: m.html, text: m.text,
    ...(m.attachments?.length ? { attachments: m.attachments.map(a => ({ filename: a.filename, content: a.content.toString('base64') })) } : {}) };
  let r: Response;
  try { r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) }); }
  catch { throw new MailError('เชื่อมต่อ Resend ไม่ได้ · ลองใหม่อีกครั้ง'); }
  const j = await r.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
  if (!r.ok) {
    const msg = j.message || '';
    if (r.status === 401 || r.status === 403) throw new MailError(/domain/i.test(msg) ? `โดเมนผู้ส่ง (${cfg.from.split('@')[1]}) ยังไม่ผ่านการยืนยันใน Resend` : 'API key ของ Resend ไม่ถูกต้อง');
    if (r.status === 429) throw new MailError('ส่งอีเมลเกินโควตาของ Resend ชั่วคราว · ลองใหม่ภายหลัง');
    throw new MailError(`ส่งอีเมลไม่สำเร็จ (${r.status}) ${msg}`.trim());
  }
  return j.id ?? '';
}

/* ---------- shared look for every email (tables + inline styles: works in Gmail / Outlook) ---------- */
export const escHtml = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function mailLayout(o: { lang: 'th' | 'en'; preheader: string; title: string; intro: string; rows?: [string, string][]; after?: string; buttons?: { label: string; href: string; color?: string }[]; footer: string }) {
  const rows = (o.rows ?? []).filter(r => r[1]).map(([k, v]) => `<tr><td style="padding:8px 0;color:#6b5e57;font-size:14px;width:38%;vertical-align:top">${escHtml(k)}</td><td style="padding:8px 0;color:#231416;font-size:14px;font-weight:600">${escHtml(v)}</td></tr>`).join('');
  const btns = (o.buttons ?? []).map(b => `<a href="${escHtml(b.href)}" style="display:inline-block;margin:4px 6px 4px 0;padding:11px 18px;border-radius:999px;background:${b.color || '#70000e'};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600">${escHtml(b.label)}</a>`).join('');
  return `<!doctype html><html lang="${o.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escHtml(o.title)}</title></head>
<body style="margin:0;background:#f3eeec;font-family:'IBM Plex Sans Thai',Sarabun,Tahoma,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escHtml(o.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3eeec;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="background:#70000e;padding:20px 28px;color:#ffffff;font-size:15px;letter-spacing:.14em;font-weight:600">BOAT TRIP THAILAND</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.35;color:#231416;font-weight:600">${escHtml(o.title)}</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#4a3d39">${o.intro}</p>
${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee5e1;border-bottom:1px solid #eee5e1;margin:0 0 18px">${rows}</table>` : ''}
${o.after ? `<p style="margin:0 0 18px;font-size:14.5px;line-height:1.7;color:#4a3d39">${o.after}</p>` : ''}
${btns ? `<div style="margin:0 0 6px">${btns}</div>` : ''}
</td></tr>
<tr><td style="padding:18px 28px;background:#f8f4f3;font-size:12.5px;line-height:1.7;color:#6b5e57">${o.footer}</td></tr>
</table></td></tr></table></body></html>`;
}
