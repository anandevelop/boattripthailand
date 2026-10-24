import 'server-only';
import { hmacBase64, safeEqual } from './crypto';

const API = 'https://api.line.me/v2/bot';
const token = () => process.env.LINE_CHANNEL_ACCESS_TOKEN;
export const lineEnabled = () => !!token();

export function verifyLineSignature(rawBody: string, signature: string | null) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  return safeEqual(hmacBase64(secret, rawBody), signature);
}

async function call(path: string, body: unknown) {
  if (!token()) return { ok: false, skipped: true };
  const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(body) });
  if (!r.ok) console.error('[LINE]', path, r.status, await r.text().catch(() => ''));
  return { ok: r.ok };
}
export type LineMessage = Record<string, unknown>;
export const pushLine = (to: string, messages: LineMessage[]) => call('/message/push', { to, messages: messages.slice(0, 5) });
export const replyLine = (replyToken: string, messages: LineMessage[]) => call('/message/reply', { replyToken, messages: messages.slice(0, 5) });
export const text = (t: string): LineMessage => ({ type: 'text', text: t.slice(0, 4900) });

/** Flex card sent to sales for every new lead */
export function leadCard(l: { id: string; ref: string; name: string; phone: string; boat: string; date: string; guests: string; source: string; score: number; scoreLabel: string; message?: string | null; lang: string }, opts: { title?: string; appUrl: string; waText: string }): LineMessage {
  const row = (k: string, v: string) => ({ type: 'box', layout: 'baseline', spacing: 'sm', contents: [{ type: 'text', text: k, size: 'sm', color: '#8a7d7f', flex: 3 }, { type: 'text', text: v || '-', size: 'sm', color: '#231416', flex: 7, wrap: true }] });
  const wa = 'https://wa.me/' + l.phone.replace(/\D/g, '').replace(/^0/, '66') + '?text=' + encodeURIComponent(opts.waText);
  return {
    type: 'flex', altText: `${opts.title ?? 'ลีดใหม่'}: ${l.name} · ${l.boat}`,
    contents: {
      type: 'bubble',
      header: { type: 'box', layout: 'vertical', backgroundColor: '#70000e', paddingAll: '14px', contents: [{ type: 'text', text: opts.title ?? 'ลีดใหม่ · ตอบภายใน 15 นาที', color: '#ffffff', size: 'sm', weight: 'bold' }, { type: 'text', text: `${l.ref} · ${l.scoreLabel} ${l.score}`, color: '#f2e2e4', size: 'xs', margin: 'sm' }] },
      body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
        { type: 'text', text: l.name, weight: 'bold', size: 'lg', wrap: true },
        row('โทร', l.phone), row('สนใจ', l.boat), row('วันที่', l.date), row('จำนวน', l.guests), row('มาจาก', l.source), row('ภาษา', l.lang === 'en' ? 'English' : 'ไทย'),
        ...(l.message ? [{ type: 'text', text: l.message.slice(0, 300), size: 'sm', color: '#6b5e60', wrap: true, margin: 'md' }] : []),
      ] },
      footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
        { type: 'button', style: 'primary', color: '#70000e', height: 'sm', action: { type: 'postback', label: 'รับเรื่อง', data: `claim:${l.id}`, displayText: `รับเรื่อง ${l.ref}` } },
        { type: 'button', style: 'secondary', height: 'sm', action: { type: 'uri', label: 'WhatsApp ลูกค้า', uri: wa } },
        { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: 'เปิดในระบบ', uri: `${opts.appUrl}/admin/leads/${l.id}` } },
      ] },
    },
  };
}
