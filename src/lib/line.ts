import 'server-only';
import { hmacBase64, safeEqual } from './crypto';
import { lineSaved, loadLineCfg } from './line-config';

const API = 'https://api.line.me/v2/bot';
/* .env first, then the keys saved in /admin → ตั้งค่า → LINE & แจ้งเตือน (src/lib/line-config.ts) */
const token = () => process.env.LINE_CHANNEL_ACCESS_TOKEN || lineSaved().token;
export const lineEnabled = () => !!token();

export function verifyLineSignature(rawBody: string, signature: string | null) {
  const secret = process.env.LINE_CHANNEL_SECRET || lineSaved().secret;
  if (!secret || !signature) return false;
  return safeEqual(hmacBase64(secret, rawBody), signature);
}

async function call(path: string, body: unknown) {
  await loadLineCfg();
  if (!token()) return { ok: false, skipped: true };
  const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(body) });
  if (!r.ok) console.error('[LINE]', path, r.status, await r.text().catch(() => ''));
  return { ok: r.ok };
}
export type LineMessage = Record<string, unknown>;
export const pushLine = (to: string, messages: LineMessage[]) => call('/message/push', { to, messages: messages.slice(0, 5) });
export const replyLine = (replyToken: string, messages: LineMessage[]) => call('/message/reply', { replyToken, messages: messages.slice(0, 5) });
export const text = (t: string): LineMessage => ({ type: 'text', text: t.slice(0, 4900) });

/** Flex card sent to sales for every new lead — white receipt-style card: icon + title, label/value rows, one main button */
export function leadCard(l: { id: string; ref: string; name: string; phone: string; whatsapp?: string | null; boat: string; date: string; guests: string; source: string; score: number; scoreLabel: string; message?: string | null; lang: string; at?: Date | string | null }, opts: { title?: string; appUrl: string; waText: string }): LineMessage {
  const C = { ink: '#2b1d1f', muted: '#8f8486', line: '#ece6e7', maroon: '#70000e', soft: '#f7f3f1' };
  const title = opts.title ?? 'ลีดใหม่ · ตอบภายใน 15 นาที';
  const kind = /เลยเวลา/.test(title) ? 'late' : /ซ้ำ/.test(title) ? 'dup' : 'lead';
  const accent = kind === 'late' ? '#c4262e' : kind === 'dup' ? '#6b5e60' : C.maroon;
  const scoreColor = l.score >= 60 ? '#b42318' : l.score >= 35 ? '#9a5b00' : '#3b6e8f';
  const at = l.at ? new Date(l.at) : new Date();
  const when = at.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\s*น\.?$/, '') + ' น.';
  const wa = 'https://wa.me/' + (l.whatsapp || l.phone).replace(/\D/g, '').replace(/^0/, '66') + '?text=' + encodeURIComponent(opts.waText);
  const [head, ...rest] = title.split(' · ');

  const kv = (k: string, v: string, o: { strong?: boolean; big?: boolean; color?: string } = {}) => ({
    type: 'box', layout: 'horizontal', spacing: 'lg', margin: o.big ? 'lg' : 'md', contents: [
      { type: 'text', text: k, size: o.big ? 'md' : 'sm', color: o.big ? C.ink : C.muted, weight: o.big ? 'bold' : 'regular', flex: 0, gravity: 'top' },
      { type: 'text', text: v || '-', size: o.big ? 'md' : 'sm', color: o.color ?? C.ink, weight: o.strong || o.big ? 'bold' : 'regular', align: 'end', wrap: true, flex: 1 },
    ] });
  const sep = { type: 'separator', margin: 'xl', color: C.line };
  const btn = (label: string, action: Record<string, unknown>, bg: string, fg: string) => ({
    type: 'box', layout: 'vertical', backgroundColor: bg, cornerRadius: '12px', paddingAll: '12px', action,
    contents: [{ type: 'text', text: label, color: fg, size: 'sm', weight: 'bold', align: 'center' }] });

  return {
    type: 'flex', altText: `${title}: ${l.name} · ${l.boat}`,
    contents: {
      type: 'bubble', size: 'mega',
      body: { type: 'box', layout: 'vertical', paddingAll: '20px', contents: [
        // icon + title + time · ref
        { type: 'box', layout: 'horizontal', spacing: 'lg', contents: [
          { type: 'box', layout: 'vertical', width: '44px', height: '44px', cornerRadius: '22px', flex: 0,
            contents: [{ type: 'image', url: `${opts.appUrl}/brand/line/${kind}.png`, size: 'full', aspectMode: 'cover', aspectRatio: '1:1' }] },
          { type: 'box', layout: 'vertical', justifyContent: 'center', contents: [
            { type: 'text', text: head, weight: 'bold', size: 'lg', color: accent, wrap: true },
            ...(rest.length ? [{ type: 'text', text: rest.join(' · '), size: 'xs', color: C.ink, wrap: true }] : []),
            { type: 'text', text: `${when} · ${l.ref}`, size: 'xs', color: C.muted, margin: 'xs', wrap: true },
          ] },
        ] },
        sep,
        kv('ลูกค้า', l.name, { strong: true }),
        kv('โทร', l.phone),
        ...(l.whatsapp && l.whatsapp.replace(/\D/g, '') !== l.phone.replace(/\D/g, '') ? [kv('WhatsApp', l.whatsapp)] : []),
        kv('สนใจ', l.boat, { big: true, color: C.maroon }),
        kv('วันที่', l.date, { strong: true }),
        kv('จำนวน', l.guests),
        ...(l.message ? [{ type: 'box', layout: 'vertical', backgroundColor: C.soft, cornerRadius: '10px', paddingAll: '10px', margin: 'lg',
          contents: [{ type: 'text', text: l.message.slice(0, 300), size: 'sm', color: '#5d5153', wrap: true }] }] : []),
        sep,
        kv('มาจาก', l.source),
        kv('ภาษา', l.lang === 'en' ? 'English' : 'ไทย'),
        kv('คะแนนลีด', `${l.scoreLabel} · ${l.score}`, { strong: true, color: scoreColor }),
      ] },
      footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', paddingTop: '0px', contents: [
        btn('รับเรื่อง', { type: 'postback', label: 'รับเรื่อง', data: `claim:${l.id}`, displayText: `รับเรื่อง ${l.ref}` }, accent, '#ffffff'),
        { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
          { ...btn('WhatsApp ลูกค้า', { type: 'uri', label: 'WhatsApp', uri: wa }, '#e7f7ee', '#128c4a'), flex: 1 },
          { ...btn('เปิดในระบบ', { type: 'uri', label: 'เปิดในระบบ', uri: `${opts.appUrl}/admin/leads/${l.id}` }, '#f3eeef', C.ink), flex: 1 },
        ] },
      ] },
      styles: { footer: { separator: false } },
    },
  };
}
