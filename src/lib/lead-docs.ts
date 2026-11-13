import 'server-only';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { desc, eq, like, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import { db } from '@/db';
import { boats, customers, leadActivities, leadDocs, settings, type Lead, type User } from '@/db/schema';
import { audit } from './audit';
import { contactInfo, fmtDate, waLink } from './lead-mail';
import { dealsFor } from './lead-guard';
import { escHtml, mailLayout, sendMail } from './mail';

/**
 * ใบเสนอราคา (quote) / ใบยืนยันการจอง (confirm) made from a lead in /admin → ลีด.
 * The document is stored as issued (lead_docs.data) and the PDF is drawn from it each time it is opened or emailed,
 * with pdfkit + the Sarabun font (assets/fonts, SIL OFL) so Thai vowels and tone marks sit right.
 * Company / bank / VAT / defaults: /admin → ตั้งค่า → อีเมล & เอกสาร (settings 'docs.config') + บริษัท & ใบอนุญาต.
 */
export const DOCS_KEY = 'docs.config';
export type Kind = 'quote' | 'confirm';
export type Vat = 'none' | 'included' | 'excluded';
export type DocsCfg = { vat: Vat; bankTh: string; bankEn: string; quoteDays: number; depositPct: number; termsTh: string; termsEn: string; at?: string; by?: string };
export type Item = { desc: string; qty: number; price: number };
export type DocData = {
  lang: 'th' | 'en'; issued: string;
  customer: { name: string; phone: string; email: string };
  trip: { boat: string; program: string; date: string; time: string; guests: string; pier: string };
  items: Item[]; discount: number; vat: Vat; depositPct: number; depositDue: string; balanceDue: string; validUntil: string; paid: number; note: string; by: string;
};
export class DocError extends Error {}

const DEF: DocsCfg = {
  vat: 'none', quoteDays: 3, depositPct: 50,
  bankTh: 'ธนาคารกสิกรไทย สาขาโลตัส ภูเก็ต\nเลขที่บัญชี 213-1-65737-7\nชื่อบัญชี BOAT TRIP (THAILAND) CO.,LTD',
  bankEn: "KASIKORN BANK · Lotus's Phuket branch\nAccount no. 213-1-65737-7\nAccount name BOAT TRIP (THAILAND) CO.,LTD",
  termsTh: 'ราคาเหมาลำ รวมกัปตันและลูกเรือ\nยืนยันการจองเมื่อได้รับเงินมัดจำ\nการยกเลิกเป็นไปตามข้อกำหนดที่ boattripthailand.com/terms-and-conditions\nกัปตันอาจเปลี่ยนเส้นทางตามสภาพอากาศเพื่อความปลอดภัย',
  termsEn: 'Price is for the whole boat, captain and crew included\nThe booking is confirmed once the deposit is received\nCancellation as in our terms: boattripthailand.com/en/terms-and-conditions\nThe captain may change the route for safety because of weather',
};
const str = (v: unknown, n: number) => (typeof v === 'string' ? v : '').replace(/\r/g, '').trim().slice(0, n);
const int = (v: unknown, min: number, max: number) => { const n = Math.round(Number(String(v ?? '').replace(/[^\d.-]/g, ''))); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; };
const isoDate = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
const today = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

export async function docsCfg(): Promise<DocsCfg> {
  const [r] = await db.select().from(settings).where(eq(settings.key, DOCS_KEY));
  return { ...DEF, ...((r?.value as Partial<DocsCfg>) ?? {}) };
}
export async function saveDocsCfg(b: Record<string, unknown>, by: string) {
  const before = await docsCfg();
  const after: DocsCfg = { ...before, at: new Date().toISOString(), by,
    vat: (['none', 'included', 'excluded'] as const).includes(b.vat as Vat) ? b.vat as Vat : before.vat,
    bankTh: b.bankTh !== undefined ? str(b.bankTh, 500) : before.bankTh, bankEn: b.bankEn !== undefined ? str(b.bankEn, 500) : before.bankEn,
    termsTh: b.termsTh !== undefined ? str(b.termsTh, 2000) : before.termsTh, termsEn: b.termsEn !== undefined ? str(b.termsEn, 2000) : before.termsEn,
    quoteDays: b.quoteDays !== undefined ? int(b.quoteDays, 1, 60) : before.quoteDays, depositPct: b.depositPct !== undefined ? int(b.depositPct, 0, 100) : before.depositPct };
  await db.insert(settings).values({ key: DOCS_KEY, value: after }).onConflictDoUpdate({ target: settings.key, set: { value: after } });
  return { before, after };
}

/* ---------- totals ---------- */
export function totals(d: Pick<DocData, 'items' | 'discount' | 'vat' | 'depositPct' | 'paid'>) {
  const sub = d.items.reduce((n, i) => n + i.qty * i.price, 0), afterDisc = Math.max(0, sub - d.discount);
  const vat = d.vat === 'excluded' ? Math.round(afterDisc * 0.07) : d.vat === 'included' ? Math.round(afterDisc * 7 / 107) : 0;
  const total = d.vat === 'excluded' ? afterDisc + vat : afterDisc;
  const deposit = Math.round(total * d.depositPct / 100);
  return { sub, afterDisc, vat, total, deposit, balance: Math.max(0, total - d.paid) };
}

/** what the editor opens with: the lead, its customer, boat and agreed price */
export async function docDraft(l: Lead, kind: Kind, u: User) {
  const cfg = await docsCfg();
  const [c] = await db.select().from(customers).where(eq(customers.id, l.customerId));
  const [b] = l.boatSlug ? await db.select({ name: boats.name, marina: boats.marina }).from(boats).where(eq(boats.slug, l.boatSlug)) : [];
  const deal = (await dealsFor([l.id]))[l.id];
  const lang: 'th' | 'en' = l.lang === 'en' ? 'en' : 'th', guests = l.adults + l.children;
  const desc = [b?.name, l.program].filter(Boolean).join(' · ') || (lang === 'th' ? 'เช่าเรือส่วนตัว' : 'Private boat charter');
  const paid = (deal?.payments ?? []).reduce((n, p) => n + p.amount, 0);
  const d: DocData = { lang, issued: today(), by: u.name,
    customer: { name: c?.name ?? '', phone: c?.phone ?? '', email: c?.email ?? '' },
    trip: { boat: b?.name ?? '', program: l.program ?? '', date: l.tripDate ?? '', time: l.slot ?? '', guests: guests ? String(guests) : '', pier: b?.marina ?? '' },
    items: [{ desc, qty: 1, price: deal?.price ?? 0 }], discount: 0, vat: cfg.vat, depositPct: cfg.depositPct,
    depositDue: addDays(today(), Math.min(cfg.quoteDays, 3)), balanceDue: l.tripDate ? addDays(l.tripDate, -1) : '', validUntil: addDays(today(), cfg.quoteDays), paid: kind === 'confirm' ? paid : 0, note: '' };
  return d;
}

function clean(b: Record<string, unknown>): DocData {
  const o = (b ?? {}) as Record<string, unknown>, c = (o.customer ?? {}) as Record<string, unknown>, t = (o.trip ?? {}) as Record<string, unknown>;
  const items = (Array.isArray(o.items) ? o.items : []).slice(0, 30).map(x => { const i = (x ?? {}) as Record<string, unknown>; return { desc: str(i.desc, 300), qty: int(i.qty, 1, 999), price: int(i.price, 0, 50_000_000) }; }).filter(i => i.desc);
  if (!items.length) throw new DocError('ต้องมีรายการอย่างน้อย 1 รายการ');
  const d: DocData = { lang: o.lang === 'en' ? 'en' : 'th', issued: isoDate(o.issued) || today(), by: str(o.by, 80),
    customer: { name: str(c.name, 120), phone: str(c.phone, 40), email: str(c.email, 120) },
    trip: { boat: str(t.boat, 120), program: str(t.program, 200), date: isoDate(t.date), time: str(t.time, 60), guests: str(t.guests, 20), pier: str(t.pier, 160) },
    items, discount: int(o.discount, 0, 50_000_000), vat: (['none', 'included', 'excluded'] as const).includes(o.vat as Vat) ? o.vat as Vat : 'none',
    depositPct: int(o.depositPct, 0, 100), depositDue: isoDate(o.depositDue), balanceDue: isoDate(o.balanceDue), validUntil: isoDate(o.validUntil), paid: int(o.paid, 0, 50_000_000), note: str(o.note, 1500) };
  if (!d.customer.name) throw new DocError('ใส่ชื่อลูกค้า');
  return d;
}

/** QT-2611-0001 / BC-2611-0001: per month, one sequence per kind */
async function nextNo(kind: Kind) {
  const pre = (kind === 'quote' ? 'QT-' : 'BC-') + today().slice(2, 4) + today().slice(5, 7) + '-';
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(leadDocs).where(like(leadDocs.no, pre + '%'));
  return pre + String((r?.n ?? 0) + 1).padStart(4, '0');
}
export async function createDoc(l: Lead, kind: Kind, body: Record<string, unknown>, u: User) {
  const d = clean(body), t = totals(d);
  for (let i = 0; i < 5; i++) {
    const no = await nextNo(kind);
    try {
      const [row] = await db.insert(leadDocs).values({ no, leadId: l.id, kind, lang: d.lang, data: { ...d, by: d.by || u.name }, total: t.total, createdBy: u.name }).returning();
      await db.insert(leadActivities).values({ leadId: l.id, userId: u.id, type: 'doc', data: { no, kind, total: t.total } });
      await audit({ id: u.id, role: u.role }, { action: 'create', entity: 'lead', ref: l.ref, label: l.ref, changes: [{ f: kind === 'quote' ? 'ใบเสนอราคา' : 'ใบยืนยันการจอง', from: null, to: `${no} · ${t.total.toLocaleString('en-US')} บาท` }] });
      return row;
    } catch (e) { if (!/unique|duplicate/i.test(String((e as Error)?.message ?? e))) throw e; }
  }
  throw new DocError('ออกเลขที่เอกสารไม่สำเร็จ ลองใหม่อีกครั้ง');
}
export async function listDocs(leadId: string) {
  const rows = await db.select().from(leadDocs).where(eq(leadDocs.leadId, leadId)).orderBy(desc(leadDocs.createdAt));
  return rows.map(r => ({ id: r.id, no: r.no, kind: r.kind, lang: r.lang, total: r.total, by: r.createdBy, at: r.createdAt, sentAt: r.sentAt, sentTo: r.sentTo, email: (r.data as DocData).customer?.email ?? '' }));
}
export async function docById(id: number) { const [r] = await db.select().from(leadDocs).where(eq(leadDocs.id, id)); return r ?? null; }

/* ---------- PDF ---------- */
const FONT = (f: string) => path.join(process.cwd(), 'assets/fonts', f);
const LOGO = path.join(process.cwd(), 'public/brand/logo.png');
const M = '#70000e', INK = '#231416', MUTED = '#6b5e57', LINE = '#e6dcd9', SAND = '#f8f4f3';
const baht = (n: number) => n.toLocaleString('en-US');

export async function docPdf(row: { no: string; kind: string; data: unknown }) {
  const d = row.data as DocData, t = totals(d), kind = row.kind as Kind, th = d.lang === 'th', T = (a: string, b: string) => th ? a : b, ci = await contactInfo();
  const doc = new PDFDocument({ size: 'A4', margin: 44, info: { Title: `${row.no} · Boat Trip Thailand`, Author: 'Boat Trip Thailand' } });
  const chunks: Buffer[] = []; doc.on('data', c => chunks.push(c as Buffer));
  const done = new Promise<Buffer>(res => doc.on('end', () => res(Buffer.concat(chunks))));
  doc.registerFont('r', FONT('Sarabun-Regular.ttf')); doc.registerFont('b', FONT('Sarabun-SemiBold.ttf'));
  const W = doc.page.width - 88, X = 44;
  // Thai has no spaces between words: wrap on word boundaries ourselves (a zero-width space would print as a box)
  const seg = new Intl.Segmenter(th ? 'th' : 'en', { granularity: 'word' });
  const lines = (text: string, width: number) => {
    const out: string[] = [];
    for (const para of String(text || '').split('\n')) {
      let cur = '';
      for (const { segment } of seg.segment(para)) {
        const next = cur + segment;
        if (doc.widthOfString(next) <= width || !cur) cur = next; else { out.push(cur.trimEnd()); cur = segment.trimStart(); }
      }
      out.push(cur);
    }
    return out;
  };
  const write = (text: string, x: number, y: number, width: number, o: { font?: string; size?: number; color?: string; align?: 'left' | 'right' | 'center'; gap?: number } = {}) => {
    doc.font(o.font ?? 'r').fontSize(o.size ?? 10).fillColor(o.color ?? INK);
    const L = lines(text, width), h = (o.size ?? 10) * 1.45 + (o.gap ?? 0);
    L.forEach((ln, i) => doc.text(ln, x, y + i * h, { width, align: o.align ?? 'left', lineBreak: false }));
    return y + L.length * h;
  };

  // header: logo + company (left) · document title (right)
  let y = 44;
  if (existsSync(LOGO)) { try { doc.image(LOGO, X, y, { height: 34 }); } catch { /* bad image */ } }
  let ly = y + 42;
  ly = write(th ? ci.companyTh : ci.company, X, ly, 280, { font: 'b', size: 11 });
  ly = write(th ? ci.addrTh : ci.addrEn, X, ly, 280, { size: 9, color: MUTED });
  ly = write([ci.tax ? T('เลขประจำตัวผู้เสียภาษี ', 'Tax ID ') + ci.tax : '', ci.tat ? T('ใบอนุญาตนำเที่ยว ', 'TAT licence ') + ci.tat : ''].filter(Boolean).join(' · '), X, ly, 280, { size: 9, color: MUTED });
  ly = write(`${ci.phone} · ${ci.email} · boattripthailand.com`, X, ly, 280, { size: 9, color: MUTED });
  const title = kind === 'quote' ? T('ใบเสนอราคา', 'QUOTATION') : T('ใบยืนยันการจอง', 'BOOKING CONFIRMATION');
  let ts = 20; doc.font('b'); while (ts > 12 && doc.fontSize(ts).widthOfString(title) > 250) ts--;   // long titles (BOOKING CONFIRMATION) shrink to one line
  write(title, X + W - 250, y, 250, { font: 'b', size: ts, color: M, align: 'right' });
  let ry = y + Math.max(34, ts * 1.45 + 8);
  const meta: [string, string][] = [[T('เลขที่', 'No.'), row.no], [T('วันที่', 'Date'), fmtDate(d.issued, d.lang)], ...(kind === 'quote' && d.validUntil ? [[T('ใช้ได้ถึง', 'Valid until'), fmtDate(d.validUntil, d.lang)] as [string, string]] : [])];
  for (const [k, v] of meta) { write(k, X + W - 230, ry, 100, { size: 9.5, color: MUTED }); write(v, X + W - 130, ry, 130, { font: 'b', size: 9.5, align: 'right' }); ry += 15; }
  y = Math.max(ly, ry) + 14;
  doc.moveTo(X, y).lineTo(X + W, y).lineWidth(1).strokeColor(LINE).stroke(); y += 14;

  // customer + trip
  const colW = (W - 16) / 2, boxTop = y;
  const box = (x: number, head: string, rows: [string, string][]) => {
    let yy = boxTop + 10; yy = write(head, x + 12, yy, colW - 24, { font: 'b', size: 10, color: M });
    for (const [k, v] of rows.filter(r => r[1])) { write(k, x + 12, yy + 2, 78, { size: 9, color: MUTED }); yy = write(v, x + 92, yy + 2, colW - 104, { size: 9.5 }); }
    return yy + 8;
  };
  // pdfkit draws in order: measure the text, paint both boxes, then write into them
  const cRows: [string, string][] = [[T('ชื่อ', 'Name'), d.customer.name], [T('โทร', 'Phone'), d.customer.phone], [T('อีเมล', 'Email'), d.customer.email]];
  const tRows: [string, string][] = [[T('เรือ', 'Boat'), d.trip.boat], [T('โปรแกรม', 'Program'), d.trip.program], [T('วันที่', 'Date'), fmtDate(d.trip.date, d.lang)], [T('เวลา', 'Time'), d.trip.time], [T('จำนวนคน', 'Guests'), d.trip.guests], [T('ท่าเรือ', 'Pier'), d.trip.pier]];
  const est = (rows: [string, string][]) => 30 + rows.filter(r => r[1]).reduce((n, [, v]) => { doc.font('r').fontSize(9.5); return n + lines(v, colW - 104).length * 13.8 + 2; }, 0);
  const bh = Math.max(est(cRows), est(tRows));
  doc.roundedRect(X, boxTop, colW, bh, 8).fill(SAND); doc.roundedRect(X + colW + 16, boxTop, colW, bh, 8).fill(SAND);
  box(X, T('ลูกค้า', 'Customer'), cRows); box(X + colW + 16, T('รายละเอียดทริป', 'Trip'), tRows);
  y = boxTop + bh + 18;

  // items
  const cols = [{ w: 24, a: 'left' as const }, { w: W - 24 - 50 - 90 - 96, a: 'left' as const }, { w: 50, a: 'right' as const }, { w: 90, a: 'right' as const }, { w: 96, a: 'right' as const }];
  const head = ['#', T('รายการ', 'Description'), T('จำนวน', 'Qty'), T('ราคาต่อหน่วย', 'Unit price'), T('จำนวนเงิน (บาท)', 'Amount (THB)')];
  doc.rect(X, y, W, 24).fill(M);
  let cx = X; head.forEach((h, i) => { write(h, cx + 6, y + 6, cols[i].w - 12, { font: 'b', size: 9, color: '#ffffff', align: cols[i].a }); cx += cols[i].w; });
  y += 30;
  d.items.forEach((it, n) => {
    doc.font('r').fontSize(10); const h = Math.max(1, lines(it.desc, cols[1].w - 12).length) * 14.5 + 8;
    if (y + h > doc.page.height - 200) { doc.addPage(); y = 44; }
    const vals = [String(n + 1), it.desc, String(it.qty), baht(it.price), baht(it.qty * it.price)];
    cx = X; vals.forEach((v, i) => { write(v, cx + 6, y, cols[i].w - 12, { size: 10, align: cols[i].a }); cx += cols[i].w; });
    y += h; doc.moveTo(X, y - 4).lineTo(X + W, y - 4).lineWidth(.6).strokeColor(LINE).stroke();
  });
  y += 6;

  // totals (right)
  const tr: [string, string, boolean?][] = [[T('รวม', 'Subtotal'), baht(t.sub)]];
  if (d.discount) tr.push([T('ส่วนลด', 'Discount'), '-' + baht(d.discount)]);
  if (d.vat === 'excluded') tr.push([T('ภาษีมูลค่าเพิ่ม 7%', 'VAT 7%'), baht(t.vat)]);
  tr.push([T('ยอดรวมทั้งสิ้น', 'Total'), baht(t.total) + T(' บาท', ' THB'), true]);
  if (d.vat === 'included') tr.push([T('รวมภาษีมูลค่าเพิ่ม 7% แล้ว', 'Includes VAT 7%'), baht(t.vat)]);
  if (d.vat === 'none') tr.push([T('ราคานี้ไม่มีภาษีมูลค่าเพิ่ม', 'No VAT charged'), '']);
  const tx = X + W - 250;
  for (const [k, v, big] of tr) {
    if (big) { doc.roundedRect(tx - 8, y - 4, 258, 24, 6).fill(SAND); }
    write(k, tx, y, 140, { font: big ? 'b' : 'r', size: big ? 11 : 9.5, color: big ? INK : MUTED }); write(v, tx + 140, y, 110, { font: big ? 'b' : 'r', size: big ? 11 : 9.5, align: 'right', color: big ? M : INK });
    y += big ? 26 : 16;
  }
  y += 6;

  // payment
  let py = y;
  py = write(T('การชำระเงิน', 'Payment'), X, py, W, { font: 'b', size: 10.5, color: M });
  const pay: string[] = [];
  if (kind === 'quote') {
    if (d.depositPct > 0 && d.depositPct < 100) pay.push(T(`มัดจำ ${d.depositPct}% = ${baht(t.deposit)} บาท${d.depositDue ? ' ภายใน ' + fmtDate(d.depositDue, 'th') : ''} เพื่อยืนยันการจอง`, `Deposit ${d.depositPct}% = ${baht(t.deposit)} THB${d.depositDue ? ' by ' + fmtDate(d.depositDue, 'en') : ''} to confirm the booking`),
      T(`ส่วนที่เหลือ ${baht(t.total - t.deposit)} บาท${d.balanceDue ? ' ภายใน ' + fmtDate(d.balanceDue, 'th') : ' ก่อนวันออกเรือ'}`, `Balance ${baht(t.total - t.deposit)} THB${d.balanceDue ? ' by ' + fmtDate(d.balanceDue, 'en') : ' before departure'}`));
    else pay.push(T(`ชำระเต็มจำนวน ${baht(t.total)} บาท${d.depositDue ? ' ภายใน ' + fmtDate(d.depositDue, 'th') : ''}`, `Full payment ${baht(t.total)} THB${d.depositDue ? ' by ' + fmtDate(d.depositDue, 'en') : ''}`));
  } else {
    pay.push(T(`ได้รับชำระแล้ว ${baht(d.paid)} บาท`, `Received ${baht(d.paid)} THB`), t.balance ? T(`คงเหลือ ${baht(t.balance)} บาท${d.balanceDue ? ' ชำระภายใน ' + fmtDate(d.balanceDue, 'th') : ''}`, `Balance ${baht(t.balance)} THB${d.balanceDue ? ' due by ' + fmtDate(d.balanceDue, 'en') : ''}`) : T('ชำระครบแล้ว', 'Paid in full'));
  }
  for (const p of pay) py = write('• ' + p, X, py + 1, W * .56, { size: 9.5 });
  const cfg = await docsCfg(), bank = th ? cfg.bankTh : cfg.bankEn;
  let by2 = y;
  if (bank && !(kind === 'confirm' && !t.balance)) {
    doc.roundedRect(X + W * .6, y - 2, W * .4, 16 + lines(bank, W * .4 - 24).length * 13.8 + 14, 8).fill(SAND);
    by2 = write(T('โอนเงินเข้าบัญชี', 'Bank transfer'), X + W * .6 + 12, y + 6, W * .4 - 24, { font: 'b', size: 9.5, color: M });
    by2 = write(bank, X + W * .6 + 12, by2, W * .4 - 24, { size: 9.5 }) + 8;
  }
  y = Math.max(py, by2) + 12;

  // notes + terms
  const block = (head: string, text: string) => {
    if (!text) return;
    doc.font('r').fontSize(9); const need = 20 + lines(text, W).length * 13;
    if (y + need > doc.page.height - 70) { doc.addPage(); y = 44; }
    y = write(head, X, y, W, { font: 'b', size: 10, color: M });
    y = write(text.split('\n').map(x => '• ' + x).join('\n'), X, y + 1, W, { size: 9, color: MUTED }) + 8;
  };
  block(T('หมายเหตุ', 'Notes'), d.note);
  block(T('เงื่อนไข', 'Terms'), th ? cfg.termsTh : cfg.termsEn);

  // footer
  const fy = doc.page.height - 64;
  doc.moveTo(X, fy).lineTo(X + W, fy).lineWidth(.6).strokeColor(LINE).stroke();
  write(T(`ออกโดย ${d.by || '-'} · Boat Trip Thailand`, `Issued by ${d.by || '-'} · Boat Trip Thailand`), X, fy + 8, W / 2, { size: 8.5, color: MUTED });
  write(`WhatsApp ${ci.wa} · LINE ${ci.line}`, X + W / 2, fy + 8, W / 2, { size: 8.5, color: MUTED, align: 'right' });
  doc.end();
  return done;
}

/* ---------- email a document (PDF attached) ---------- */
export async function sendDoc(row: NonNullable<Awaited<ReturnType<typeof docById>>>, l: Lead, to: string, u: User) {
  const m = await docMail(row);
  const id = await sendMail({ to, ...m });
  await db.update(leadDocs).set({ sentAt: new Date(), sentTo: to }).where(eq(leadDocs.id, row.id));
  await db.insert(leadActivities).values({ leadId: l.id, userId: u.id, type: 'email', data: { kind: row.kind, no: row.no, to, ok: true, id } });
  await audit({ id: u.id, role: u.role }, { action: 'update', entity: 'lead', ref: l.ref, label: l.ref, changes: [{ f: 'ส่งอีเมล', from: null, to: `${row.no} → ${to}` }] });
  return id;
}

/** the customer email for a document: subject, body and the PDF — the same for a real send and the admin's test */
async function docMail(row: { no: string; kind: string; data: unknown }) {
  const d = row.data as DocData, th = d.lang === 'th', T = (a: string, b: string) => th ? a : b, t = totals(d), ci = await contactInfo(), kind = row.kind as Kind;
  const pdf = await docPdf(row);
  const title = kind === 'quote' ? T(`ใบเสนอราคา ${row.no}`, `Quotation ${row.no}`) : T(`ยืนยันการจอง ${row.no}`, `Booking confirmation ${row.no}`);
  const html = mailLayout({ lang: d.lang, preheader: title, title: kind === 'quote' ? T(`ใบเสนอราคาสำหรับคุณ${d.customer.name.replace(/^คุณ\s*/, '')}`, `Your quotation, ${d.customer.name}`) : T(`ยืนยันการจองของคุณ${d.customer.name.replace(/^คุณ\s*/, '')}`, `Your booking is confirmed, ${d.customer.name}`),
    intro: kind === 'quote' ? T('ขอบคุณที่สนใจทริปกับเรา แนบใบเสนอราคาเป็นไฟล์ PDF มาในอีเมลนี้', 'Thank you for your interest. Your quotation is attached to this email as a PDF.') : T('ขอบคุณที่จองทริปกับเรา แนบใบยืนยันการจองเป็นไฟล์ PDF มาในอีเมลนี้', 'Thank you for booking with us. Your booking confirmation is attached as a PDF.'),
    rows: [[T('เลขที่', 'No.'), row.no], [T('เรือ', 'Boat'), d.trip.boat], [T('โปรแกรม', 'Program'), d.trip.program], [T('วันที่', 'Date'), fmtDate(d.trip.date, d.lang)], [T('ยอดรวม', 'Total'), baht(t.total) + T(' บาท', ' THB')],
      ...(kind === 'quote' && d.depositPct > 0 && d.depositPct < 100 ? [[T('มัดจำ', 'Deposit'), `${baht(t.deposit)}${T(' บาท', ' THB')}${d.depositDue ? T(' ภายใน ', ' by ') + fmtDate(d.depositDue, d.lang) : ''}`] as [string, string]] : []),
      ...(kind === 'confirm' && t.balance ? [[T('คงเหลือ', 'Balance'), baht(t.balance) + T(' บาท', ' THB')] as [string, string]] : [])],
    after: kind === 'quote' ? T('ตอบกลับอีเมลนี้ หรือทักเราทาง WhatsApp / LINE เพื่อยืนยันการจองได้เลย', 'Reply to this email or message us on WhatsApp / LINE to confirm.') : T('ทีมงานจะส่งรายละเอียดเวลานัดและจุดขึ้นเรือให้ก่อนวันเดินทาง', 'We will send meeting time and boarding details before your trip.'),
    buttons: [{ label: 'WhatsApp', href: waLink(ci.wa), color: '#128c4a' }, { label: 'LINE', href: ci.lineUrl, color: '#06a64a' }],
    footer: `${escHtml(th ? ci.companyTh : ci.company)}${ci.tat ? ' · TAT ' + escHtml(ci.tat) : ''}<br>${escHtml(th ? ci.addrTh : ci.addrEn)}` });
  const text = `${title}\n${d.trip.boat} · ${d.trip.program}\n${fmtDate(d.trip.date, d.lang)}\n${T('ยอดรวม', 'Total')}: ${baht(t.total)}`;
  return { subject: `${title} · Boat Trip Thailand`, html, text, attachments: [{ filename: `${row.no}.pdf`, content: pdf }] };
}

/** admin test (ตั้งค่า › อีเมล & เอกสาร): the real document email + PDF with sample data, settings as saved now. Nothing is stored. */
export async function sendSampleDoc(kind: Kind, lang: 'th' | 'en', to: string, by: string) {
  const cfg = await docsCfg(), th = lang === 'th', T = (a: string, b: string) => th ? a : b;
  const [b] = await db.select({ name: boats.name, marina: boats.marina }).from(boats).limit(1);
  const trip = addDays(today(), 30), boat = b?.name ?? 'Boat Trip Thailand';
  const d: DocData = { lang, issued: today(), by,
    customer: { name: T('ลูกค้าตัวอย่าง', 'Sample Customer'), phone: '+66 81 234 5678', email: to },
    trip: { boat, program: T('ครึ่งวัน 4 ชั่วโมง', 'Half Day 4 hrs.'), date: trip, time: '09:00–13:00', guests: '8', pier: b?.marina ?? '' },
    items: [{ desc: `${boat} · ${T('ครึ่งวัน 4 ชั่วโมง', 'Half Day 4 hrs.')}`, qty: 1, price: 45000 }, { desc: T('อาหารกลางวันบนเรือ', 'Lunch on board'), qty: 8, price: 500 }],
    discount: 0, vat: cfg.vat, depositPct: cfg.depositPct, depositDue: addDays(today(), Math.min(cfg.quoteDays, 3)), balanceDue: addDays(trip, -1),
    validUntil: addDays(today(), cfg.quoteDays), paid: 0, note: T('อีเมลทดสอบ · ข้อมูลในเอกสารนี้เป็นตัวอย่าง', 'Test email · the details in this document are examples') };
  if (kind === 'confirm') d.paid = totals(d).deposit;
  const no = `${kind === 'quote' ? 'QT' : 'BC'}-TEST`;
  const m = await docMail({ no, kind, data: d });
  return sendMail({ to, ...m, subject: T('[ทดสอบ] ', '[TEST] ') + m.subject });
}
