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

/**
 * Flex card sent to sales for every new lead — "Noir": the boat photo on top with the status chip, time,
 * boat name and program on a dark gradient; white body with label/value rows; one main button.
 * `img` = the boat photo's site path (shown through /api/line/img as JPEG); without it a dark header is used.
 */
export function leadCard(l: { id: string; ref: string; name: string; phone: string; whatsapp?: string | null; boat: string; program?: string | null; img?: string | null; date: string; guests: string; source: string; score: number; scoreLabel: string; message?: string | null; lang: string; at?: Date | string | null }, opts: { title?: string; appUrl: string; waText: string }): LineMessage {
  const ink = '#1d1617', muted = '#9a9091', line = '#efe9e6', maroon = '#70000e', sand = '#f6f1ec';
  const title = opts.title ?? 'ลีดใหม่ · ตอบภายใน 15 นาที';
  const [head, ...rest] = title.split(' · ');
  const kind = /เลยเวลา/.test(title) ? 'late' : /ซ้ำ/.test(title) ? 'dup' : 'lead';
  const accent = kind === 'late' ? '#c4262e' : kind === 'dup' ? '#6b5e60' : maroon;
  const at = l.at ? new Date(l.at) : new Date();
  const when = at.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(/\s*น\.?$/, '') + ' น.';
  const wa = 'https://wa.me/' + (l.whatsapp || l.phone).replace(/\D/g, '').replace(/^0/, '66') + '?text=' + encodeURIComponent(opts.waText);
  const open = `${opts.appUrl}/admin/leads/${l.id}`;

  const T = (text: string, o: Record<string, unknown> = {}) => ({ type: 'text', text: text || '-', size: 'sm', color: ink, wrap: true, ...o });
  const kv = (k: string, v: string, bold = false) => ({ type: 'box', layout: 'horizontal', margin: 'md', contents: [T(k, { color: muted, flex: 0 }), T(v, { align: 'end', weight: bold ? 'bold' : 'regular' })] });
  const chip = (text: string, bg: string, border: string) => ({ type: 'box', layout: 'vertical', flex: 0, backgroundColor: bg, borderWidth: '1px', borderColor: border, cornerRadius: '999px', paddingStart: '11px', paddingEnd: '11px', paddingTop: '5px', paddingBottom: '5px', contents: [T(text, { size: 'xxs', color: '#ffffff', weight: 'bold', wrap: false })] });
  const pill = (label: string, action: Record<string, unknown>, bg: string, fg: string, border?: string) => ({ type: 'box', layout: 'vertical', flex: 1, backgroundColor: bg, cornerRadius: '999px', paddingAll: '13px', action, ...(border ? { borderWidth: '1px', borderColor: border } : {}), contents: [T(label, { color: fg, weight: 'bold', align: 'center', wrap: false })] });

  const chips = { type: 'box', layout: 'horizontal', contents: [chip(`●  ${head}`, accent + 'e6', '#ffffff59'), { type: 'filler' }, chip(when, '#ffffff38', '#ffffff73')] };
  const names = [T(l.boat, { size: 'xxl', weight: 'bold', color: '#ffffff', margin: 'md' }), ...(l.program ? [T(l.program, { size: 'xs', color: '#ffffffcc', margin: 'xs' })] : [])];
  const hero = l.img
    ? { type: 'box', layout: 'vertical', paddingAll: '0px', contents: [
        { type: 'image', url: `${opts.appUrl}/api/line/img?src=${encodeURIComponent(l.img)}`, size: 'full', aspectRatio: '4:3', aspectMode: 'cover' },
        { type: 'box', layout: 'vertical', position: 'absolute', offsetTop: '14px', offsetStart: '14px', offsetEnd: '14px', contents: [chips] },
        { type: 'box', layout: 'vertical', position: 'absolute', offsetBottom: '0px', offsetStart: '0px', offsetEnd: '0px', paddingAll: '20px', paddingTop: '64px',
          background: { type: 'linearGradient', angle: '0deg', startColor: '#161112f2', endColor: '#16111200' }, contents: names },
      ] }
    : { type: 'box', layout: 'vertical', backgroundColor: '#161112', paddingAll: '20px', contents: [chips, ...names] };

  return {
    type: 'flex', altText: `${title}: ${l.name} · ${l.boat}`,
    contents: {
      type: 'bubble', size: 'mega',
      hero,
      body: { type: 'box', layout: 'vertical', paddingAll: '22px', paddingTop: '14px', contents: [
        ...(rest.length ? [kv('สถานะ', rest.join(' · '))] : []),
        kv('วันที่', l.date, true), kv('จำนวน', l.guests),
        { type: 'separator', margin: 'lg', color: line },
        kv('ลูกค้า', l.name, true), kv('โทร', l.phone),
        ...(l.whatsapp && l.whatsapp.replace(/\D/g, '') !== l.phone.replace(/\D/g, '') ? [kv('WhatsApp', l.whatsapp)] : []),
        kv('มาจาก', l.source),
        ...(l.message ? [{ type: 'box', layout: 'vertical', margin: 'lg', paddingAll: '12px', backgroundColor: sand, cornerRadius: '12px', contents: [T(l.message.slice(0, 300), { color: '#5d5153' })] }] : []),
        { type: 'text', text: l.ref, size: 'xxs', color: '#c2b9ba', margin: 'lg', align: 'end' },
      ] },
      footer: { type: 'box', layout: 'vertical', paddingAll: '20px', paddingTop: '0px', spacing: 'sm', contents: [
        pill('รับเรื่อง', { type: 'postback', label: 'รับเรื่อง', data: `claim:${l.id}`, displayText: `รับเรื่อง ${l.ref}` }, accent, '#ffffff'),
        { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
          pill('WhatsApp', { type: 'uri', label: 'WhatsApp', uri: wa }, '#ffffff', '#128c4a', '#d9efe2'),
          pill('เปิดในระบบ', { type: 'uri', label: 'เปิดในระบบ', uri: open }, '#ffffff', ink, line),
        ] },
      ] },
      styles: { footer: { separator: false } },
    },
  };
}
