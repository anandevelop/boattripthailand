import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { sessions, settings, users } from '@/db/schema';
import { sha256 } from './crypto';

/**
 * โหมดปิดปรับปรุง (/admin → ตั้งค่า → ระบบ). Read by the middleware for every public page:
 * visitors get a 503 page with the contact channels; signed-in staff (valid, 2FA-verified session) see the site as usual.
 * The setting is cached for 10 s, so switching it on/off takes effect within ~10 s.
 */
type L = { th?: string; en?: string };
export type Maint = { on: boolean; msg: L; name: string; phone: string; wa: string; line: string; lineUrl: string; email: string };

/** official contacts, used until they are saved in /admin → ตั้งค่า */
const DEF: Record<string, string> = { phone: '+66 61 172 5854', wa: '+66 61 172 5854', line: '@boattripthailand', lineUrl: 'https://lin.ee/kkzkoX7', email: 'boattripthailand@gmail.com' };

let cache: { at: number; v: Maint } | null = null;
export async function maintenance(): Promise<Maint> {
  if (cache && Date.now() - cache.at < 10_000) return cache.v;
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, 'admin.sitecfg'));
    const c = (row?.value ?? {}) as Record<string, unknown>, s = (k: string) => (typeof c[k] === 'string' ? (c[k] as string) : DEF[k] ?? '');
    const name = c.name && typeof c.name === 'object' ? ((c.name as L).en || (c.name as L).th || '') : s('name');
    cache = { at: Date.now(), v: { on: c.maint === true, msg: (c.maintMsg ?? {}) as L, name: name || 'Boat Trip Thailand', phone: s('phone'), wa: s('wa'), line: s('line'), lineUrl: s('lineUrl'), email: s('email') } };
  } catch (e) {
    console.error('[maintenance]', e);
    cache = { at: Date.now(), v: cache?.v ?? { on: false, msg: {}, name: 'Boat Trip Thailand', phone: '', wa: '', line: '', lineUrl: '', email: '' } };
  }
  return cache.v;
}

/** true when the admin cookie belongs to a live, 2FA-verified session of an active user */
export async function isStaff(token: string | undefined) {
  if (!token) return false;
  try {
    const [r] = await db.select({ ok: users.active, v: users.sessionVersion, sv: sessions.sessionVersion }).from(sessions).innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, sha256(token)), eq(sessions.mfaVerified, true), gt(sessions.expiresAt, new Date())));
    return !!r && r.ok && r.v === r.sv;
  } catch { return false; }
}

const esc = (s: string) => s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
export function maintenancePage(m: Maint, en: boolean) {
  const msg = (en ? m.msg.en || m.msg.th : m.msg.th || m.msg.en) || (en ? 'We are updating the website. Please contact us via LINE or phone.' : 'ขณะนี้เว็บไซต์กำลังปรับปรุง กรุณาติดต่อเราทาง LINE หรือโทร');
  const digits = (p: string) => p.replace(/[^\d+]/g, '');
  const links = [
    m.lineUrl && [m.lineUrl, `LINE ${m.line}`],
    m.wa && [`https://wa.me/${digits(m.wa).replace(/^\+/, '')}`, `WhatsApp ${m.wa}`],
    m.phone && [`tel:${digits(m.phone)}`, (en ? 'Call ' : 'โทร ') + m.phone],
    m.email && [`mailto:${m.email}`, m.email],
  ].filter(Boolean) as string[][];
  return `<!doctype html><html lang="${en ? 'en' : 'th'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(m.name)}${en ? ' · Updating' : ' · กำลังปรับปรุง'}</title><link rel="icon" href="/icon.png">
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f6f1ef;color:#231416;font:16px/1.6 system-ui,-apple-system,"Segoe UI","IBM Plex Sans Thai",sans-serif}
main{max-width:460px;width:100%;background:#fff;border-radius:24px;padding:36px 28px;text-align:center;box-shadow:0 20px 60px rgb(35 20 22/.08)}
img{width:64px;height:64px;border-radius:16px}h1{font-size:20px;font-weight:600;margin:16px 0 8px}p{margin:0 0 24px;color:#6b5d5f}
a{display:block;margin-top:10px;padding:12px 16px;border-radius:999px;text-decoration:none;font-weight:500;color:#70000e;box-shadow:inset 0 0 0 1px rgb(112 0 14/.25)}a:first-of-type{background:#70000e;color:#fff;box-shadow:none}
small{display:block;margin-top:22px;color:#9a8c8e;font-size:12px}</style></head>
<body><main><img src="/icon.png" alt=""><h1>${esc(m.name)}</h1><p>${esc(msg)}</p>${links.map(([h, t]) => `<a href="${esc(h)}" rel="noopener">${esc(t)}</a>`).join('')}
<small>${en ? '<a style="all:unset;cursor:pointer;text-decoration:underline" href="/">ภาษาไทย</a>' : '<a style="all:unset;cursor:pointer;text-decoration:underline" href="/en">English</a>'}</small></main></body></html>`;
}
