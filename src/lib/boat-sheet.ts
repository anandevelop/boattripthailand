import 'server-only';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { db } from '@/db';
import { boats } from '@/db/schema';
import { abs } from './i18n';
import { contactInfo, fmtDate } from './lead-mail';
import { uploadPath } from './media';

/**
 * แผ่นข้อมูลเรือ (boat spec sheet) — /admin → เรือ & ราคา → ปุ่ม PDF.
 * Page 1: photo, key numbers, description, gallery, specs, included / not included. Page 2 (and on): price tables
 * (optional), departure times, notes, and a booking box with a QR code to the boat's page.
 * Drawn fresh from the boat as saved, with pdfkit + Sarabun (same as quotations). No transparency anywhere:
 * the dark shade on the main photo is baked into the JPEG, because some PDF viewers (macOS Preview) blend
 * transparent layers wrongly (the photo turned pink).
 */
type L = 'th' | 'en';
type I18 = { th?: string; en?: string } | null | undefined;
type BoatJson = {
  tables?: { caption?: string; columns?: string[]; rows?: string[][] }[]; includes?: string[]; not_included?: string[]; complimentary?: string[];
  time_slots?: string[][]; notes?: string[]; info?: string[][];
  i18n?: { name?: I18; subtitle?: I18; desc?: I18; notes?: I18; includes?: I18[]; not_included?: I18[]; complimentary?: I18[]; slots?: I18[]; programs?: I18[][] };
};

const MM = 72 / 25.4, PW = 595.28, PH = 841.89, X = 14 * MM, W = PW - 2 * X;
const M = '#70000e', INK = '#231416', MUTED = '#6b5e57', LINE = '#e6dcd9', SAND = '#f8f4f3', ZEBRA = '#fbf8f7';
const FONT = (f: string) => path.join(process.cwd(), 'assets/fonts', f);
const PUB = (f: string) => path.join(process.cwd(), 'public', f);

const INFO_TH: Record<string, string> = {
  'boat name': 'ชื่อเรือ', size: 'ขนาด', length: 'ความยาว', year: 'ปีที่ต่อ', 'year built': 'ปีที่ต่อ', 'year refit': 'ปรับปรุงล่าสุด', refit: 'ปรับปรุงล่าสุด',
  cabin: 'ห้องนอน', cabins: 'ห้องนอน', bedroom: 'ห้องนอน', bedrooms: 'ห้องนอน', 'shower & toilet': 'ห้องน้ำ', bathroom: 'ห้องน้ำ', bathrooms: 'ห้องน้ำ', toilet: 'ห้องน้ำ',
  bathtub: 'อ่างอาบน้ำ', bath: 'ห้องน้ำ', cruising: 'ความเร็วเดินทาง', 'air-conditions': 'แอร์', 'air-condition': 'แอร์', toilets: 'ห้องน้ำ', capacity: 'จำนวนผู้โดยสาร', crew: 'ลูกเรือ', crews: 'ลูกเรือ', overnight: 'ค้างคืน', 'cruising speed': 'ความเร็วเดินทาง', speed: 'ความเร็ว',
  'max speed': 'ความเร็วสูงสุด', engine: 'เครื่องยนต์', engines: 'เครื่องยนต์', builder: 'ผู้ต่อเรือ', model: 'รุ่น', beam: 'ความกว้าง', type: 'ประเภท', pier: 'ท่าเรือ',
};
const SEASON_TH: Record<string, string> = { low: 'โลว์ซีซั่น', high: 'ไฮซีซั่น', peak: 'พีคซีซั่น', green: 'กรีนซีซั่น', shoulder: 'ช่วงกลาง' };

/** a staff translation for the language, else the brochure text */
const pick = (o: I18, src: string, lang: L) => (o && String(o[lang] || '').trim()) || src;
const list = (arr: I18[] | undefined, src: string[], lang: L) => src.map((x, i) => pick(Array.isArray(arr) && arr.length === src.length ? arr[i] : null, x, lang));
const num = (s: string | undefined) => { const m = String(s ?? '').match(/\d+(?:[.,]\d+)?/); return m ? m[0] : ''; };

/** a boat photo (public/ or uploads/) as a JPEG of exactly w×h px, cropped to fill; null if missing */
async function photo(url: string | undefined, w: number, h: number, shade = false) {
  if (!url) return null;
  const clean = url.split('?')[0];
  const file = clean.startsWith('/uploads/') ? uploadPath(clean) : PUB(clean.replace(/^\/+/, ''));
  if (!file || !existsSync(file)) return null;
  try {
    let img = sharp(file).rotate().resize(w, h, { fit: 'cover', position: 'centre' });
    if (shade) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#140406" stop-opacity=".5"/><stop offset=".3" stop-color="#140406" stop-opacity="0"/><stop offset=".45" stop-color="#140406" stop-opacity="0"/><stop offset="1" stop-color="#140406" stop-opacity=".84"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`;
      img = img.composite([{ input: Buffer.from(svg) }]);
    }
    return await img.flatten({ background: '#ffffff' }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  } catch { return null; }
}

export async function boatSheet(slug: string, lang: L, prices: boolean) {
  const [b] = await db.select().from(boats).where(eq(boats.slug, slug));
  if (!b) return null;
  const d = (b.data ?? {}) as BoatJson, i = d.i18n ?? {}, th = lang === 'th', T = (a: string, e: string) => (th ? a : e), ci = await contactInfo();
  const name = pick(i.name, b.name, lang), sub = pick(i.subtitle, b.subtitle ?? '', lang);
  const info = (d.info ?? []).filter(r => r && String(r[0] ?? '').trim() && String(r[1] ?? '').trim() && !/^(n\/?a|-+|–|none|tba)$/i.test(String(r[1]).trim()));
  const key = (k: string) => String(k).trim().toLowerCase().replace(/\s+/g, ' ').replace(/^over night$/, 'overnight');
  const infoGet = (...keys: string[]) => info.find(r => keys.includes(key(r[0])))?.[1] ?? '';
  const url = abs(lang, `/yacht-charter/${b.slug}`);

  /* ---------- photos (prepared in parallel) ---------- */
  const imgs = (b.images ?? []).filter(Boolean);
  const heroH = 116 * MM, gap = 2 * MM;
  const px = (pt: number) => Math.round(pt * 2.4);   // ~170 dpi
  const hero = await photo(imgs[0], px(PW), px(heroH), true);
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });

  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, info: { Title: `${name} · Boat Trip Thailand`, Author: 'Boat Trip Thailand', Subject: T('ข้อมูลเรือ', 'Boat information') } });
  const chunks: Buffer[] = []; doc.on('data', c => chunks.push(c as Buffer));
  const done = new Promise<Buffer>(res => doc.on('end', () => res(Buffer.concat(chunks))));
  doc.registerFont('r', FONT('Sarabun-Regular.ttf')); doc.registerFont('b', FONT('Sarabun-SemiBold.ttf'));

  /* Thai has no spaces between words: wrap on word boundaries ourselves */
  const seg = new Intl.Segmenter(th ? 'th' : 'en', { granularity: 'word' });
  const lines = (text: string, width: number, sp = 0) => {
    const out: string[] = [];
    for (const para of String(text || '').split('\n')) {
      let cur = '';
      for (const { segment } of seg.segment(para)) {
        const next = cur + segment;
        if (doc.widthOfString(next, { characterSpacing: sp }) <= width || !cur) cur = next; else { out.push(cur.trimEnd()); cur = segment.trimStart(); }
      }
      out.push(cur);
    }
    return out;
  };
  let DRY = false;   // measuring pass: lay out without drawing
  type O = { font?: string; size?: number; color?: string; align?: 'left' | 'right' | 'center'; sp?: number; lh?: number; max?: number };
  const write = (text: string, x: number, y: number, width: number, o: O = {}) => {
    const size = o.size ?? 9.5; doc.font(o.font ?? 'r').fontSize(size).fillColor(o.color ?? INK);
    let L = lines(text, width, o.sp ?? 0); if (o.max && L.length > o.max) { L = L.slice(0, o.max); L[o.max - 1] = L[o.max - 1].replace(/\s*\S{0,3}$/, '') + '…'; }
    const h = size * (o.lh ?? 1.45);
    if (!DRY) L.forEach((ln, k) => doc.text(ln, x, y + k * h, { width, align: o.align ?? 'left', lineBreak: false, characterSpacing: o.sp ?? 0 }));
    return y + L.length * h;
  };
  const height = (text: string, width: number, o: O = {}) => { doc.font(o.font ?? 'r').fontSize(o.size ?? 9.5); return lines(text, width, o.sp ?? 0).length * (o.size ?? 9.5) * (o.lh ?? 1.45); };
  const hr = (y: number, color = LINE, w = 0.7) => doc.moveTo(X, y).lineTo(X + W, y).lineWidth(w).strokeColor(color).stroke();
  const heading = (text: string, x: number, y: number, width: number) => {
    if (DRY) return y + 15;
    doc.font('b').fontSize(7.6); const up = th ? text : text.toUpperCase(), sp = th ? 0.4 : 1.5;
    doc.fillColor(M).text(up, x, y, { lineBreak: false, characterSpacing: sp });
    const tw = doc.widthOfString(up, { characterSpacing: sp });
    doc.moveTo(x + tw + 6, y + 5.5).lineTo(x + width, y + 5.5).lineWidth(0.7).strokeColor(LINE).stroke();
    return y + 15;
  };
  const roundImg = (buf: Buffer | null, x: number, y: number, w: number, h: number, r = 6) => {
    if (!buf) { doc.roundedRect(x, y, w, h, r).fill(SAND); return; }
    doc.save(); doc.roundedRect(x, y, w, h, r).clip(); doc.image(buf, x, y, { width: w, height: h }); doc.restore();
  };
  const logo = (white: boolean, x: number, y: number, h: number) => { const f = PUB(white ? 'brand/logo-white.png' : 'brand/logo.png'); if (existsSync(f)) { try { doc.image(f, x, y, { height: h }); } catch { /* bad image */ } } };
  const brand = (white: boolean, x: number, y: number) => { logo(white, x, y, 28); doc.font('b').fontSize(8.5).fillColor(white ? '#ffffff' : INK).text('BOAT TRIP THAILAND', x + 36, y + 9.5, { lineBreak: false, characterSpacing: 2 }); };

  /* ================= page 1 ================= */
  if (hero) doc.image(hero, 0, 0, { width: PW, height: heroH }); else doc.rect(0, 0, PW, heroH).fill(M);
  brand(true, X, 9 * MM);
  { const tag = T(`${b.type === 'yacht' ? 'เรือยอร์ช' : 'เรือส่วนตัว'} · ภูเก็ต`, `Private ${b.type === 'yacht' ? 'yacht' : 'boat'} · Phuket`);
    doc.font('r').fontSize(8); const tw = doc.widthOfString(tag, { characterSpacing: 0.6 }) + 22;
    doc.roundedRect(X + W - tw, 9 * MM + 5, tw, 18, 9).lineWidth(0.8).strokeColor('#d9d2d2').stroke();
    doc.fillColor('#ffffff').text(tag, X + W - tw, 9 * MM + 9.5, { width: tw, align: 'center', lineBreak: false, characterSpacing: 0.6 }); }
  // title block on the photo (bottom)
  { const from = b.fromPrice ? `฿${b.fromPrice.toLocaleString('en-US')}` : '';
    const tW = from ? W - 150 : W;
    doc.font('b').fontSize(34); let ts = 34; while (ts > 22 && doc.fontSize(ts).widthOfString(name) > tW) ts--;
    const bottom = heroH - 9 * MM, subH = sub ? 15 : 0;
    const titleY = bottom - subH - ts * 1.15;
    write(T('เช่าเรือส่วนตัว', 'PRIVATE CHARTER'), X, titleY - 13, tW, { size: 8, color: '#e8e1e1', sp: th ? 0.5 : 2.4 });
    write(name, X, titleY, tW, { font: 'b', size: ts, color: '#ffffff', lh: 1.15 });
    if (sub) write([sub, infoGet('year refit', 'refit') ? T('ปรับปรุง ', 'refit ') + infoGet('year refit', 'refit') : ''].filter(Boolean).join(' · '), X, bottom - 14, tW, { size: 10.5, color: '#efe9e9' });
    if (from) {
      write(T('ราคาเริ่มต้น', 'FROM'), X + W - 150, bottom - 50, 150, { size: 8, color: '#e8e1e1', align: 'right', sp: th ? 0.3 : 1.6 });
      write(from, X + W - 150, bottom - 38, 150, { font: 'b', size: 20, color: '#ffffff', align: 'right', lh: 1.2 });
      write(T('เหมาลำ', 'whole boat'), X + W - 150, bottom - 13, 150, { size: 8.5, color: '#e8e1e1', align: 'right' });
    }
  }
  // key numbers
  let y = heroH;
  { const ft = b.ft ? Math.round(b.ft) : 0, cab = num(infoGet('cabin', 'cabins', 'bedroom', 'bedrooms')), crew = num(infoGet('crew', 'crews')), over = num(infoGet('overnight'));
    const speed = infoGet('cruising speed', 'cruising', 'speed', 'max speed').replace(/\s*(knots?|kn)\.?\s*$/i, '');
    const cells: [string, string, string][] = [
      ...(ft ? [[T('ความยาว', 'Length'), `${ft} ft`, `${Math.round(ft * 0.3048 * 10) / 10} m`] as [string, string, string]] : []),
      ...(b.pax ? [[T('ผู้โดยสาร', 'Guests'), String(b.pax), over ? T(`ไปกลับวัน · ค้างคืน ${over}`, `day trip · ${over} overnight`) : T('ไปกลับวัน', 'day trip')] as [string, string, string]] : []),
      ...(cab ? [[T('ห้องนอน', 'Cabins'), cab, /ensuite|en-suite/i.test(infoGet('cabin', 'cabins')) ? T('ห้องน้ำในตัว', 'all ensuite') : ''] as [string, string, string]] : []),
      ...(crew ? [[T('ลูกเรือ', 'Crew'), crew, T('กัปตันและลูกเรือ', 'captain & crew')] as [string, string, string]] : []),
      ...(speed ? [[T('ความเร็ว', 'Speed'), speed.slice(0, 10), T('น็อต', 'knots')] as [string, string, string]] : []),
    ];
    if (cells.length) {
      const cw = W / cells.length, top = y;
      cells.forEach(([k, v, s], n) => {
        const cx = X + n * cw;
        write(th ? k : k.toUpperCase(), cx, top + 11, cw, { size: 7.3, color: MUTED, align: 'center', sp: th ? 0 : 1.1 });
        write(v, cx, top + 23, cw, { font: 'b', size: 12.5, color: M, align: 'center', lh: 1.3 });
        if (s) write(s, cx, top + 39, cw, { size: 7.3, color: MUTED, align: 'center' });
        if (n) doc.moveTo(cx, top + 8).lineTo(cx, top + 52).lineWidth(0.7).strokeColor(LINE).stroke();
      });
      y = top + 60; hr(y);
    }
  }
  // description
  const desc = pick(i.desc, '', lang);
  if (desc) y = write(desc, X, y + 12, W, { size: 10, color: '#3d2e30', max: 3 }) + 2;
  // specs + included (bottom of page 1) — measured first so the gallery takes only the room that is left
  const FOOT1 = PH - 9 * MM - 22;
  const specsBlock = (y0: number, lim: { specs: number; inc: number; exc: number }) => {
    const colW = (W - 7 * MM) / 2, rx = X + colW + 7 * MM;
    let ly = y0, ry = y0;
    const pier = b.marina ?? '';
    const specs = info.map(r => [th ? INFO_TH[key(r[0])] ?? r[0] : r[0], r[1]]);
    if (pier && !specs.some(r => /pier|marina|ท่าเรือ/i.test(r[0]))) specs.push([T('ท่าเรือ', 'Pier'), pier]);
    if (specs.length) {
      ly = heading(T('ข้อมูลเรือ', 'Specifications'), X, ly, colW);
      for (const [k, v] of specs.slice(0, lim.specs)) { const h = height(v, colW - 82, { font: 'b', size: 8.8 }); write(k, X, ly, 80, { size: 8.8, color: MUTED }); write(v, X + 82, ly, colW - 82, { font: 'b', size: 8.8 }); ly += Math.max(h, 12.8) + 1; }
    }
    const tick = (x: number, yy: number) => { if (!DRY) doc.save().lineWidth(1.1).strokeColor(M).moveTo(x, yy + 5).lineTo(x + 2.4, yy + 7.6).lineTo(x + 6.6, yy + 2.6).stroke().restore(); };
    const twoCol = (items: string[], yy: number, mark: 'tick' | 'dash', limit: number) => {
      const cw = (colW - 10) / 2, rows: number[] = [0, 0];
      const shown = items.slice(0, limit), half = Math.ceil(shown.length / 2);
      shown.forEach((t, n) => { const c = n < half ? 0 : 1, x = rx + c * (cw + 10), top = yy + rows[c];
        if (mark === 'tick') tick(x, top + 1.5); else write('–', x, top, 8, { size: 8.8, color: MUTED });
        const e = write(t, x + 11, top, cw - 11, { size: 8.6, color: mark === 'tick' ? INK : MUTED, lh: 1.35 }); rows[c] = e - yy + 2.6; });
      return yy + Math.max(0, ...rows);
    };
    const inc = [...list(i.includes, d.includes ?? [], lang), ...list(i.complimentary, d.complimentary ?? [], lang)].filter(s => s.trim());
    const exc = list(i.not_included, d.not_included ?? [], lang).filter(s => s.trim());
    if (inc.length) { ry = heading(T('รวมในราคา', 'Included'), rx, ry, colW); ry = twoCol(inc, ry, 'tick', lim.inc); }
    if (exc.length) { ry = heading(T('ไม่รวมในราคา', 'Not included'), rx, ry + 8, colW); ry = twoCol(exc, ry, 'dash', lim.exc); }
    return Math.max(ly, ry);
  };
  const measure = (lim: { specs: number; inc: number; exc: number }) => { DRY = true; const h = specsBlock(0, lim); DRY = false; return h; };
  // the longest lists that fit under at least a 30 mm gallery (or with no gallery at all)
  let lim = { specs: 14, inc: 20, exc: 10 };
  const galTop = y + 10, hasGal = imgs.length > 1;
  const free = (h: number) => FOOT1 - galTop - 16 - h;
  while ((hasGal ? free(measure(lim)) < 30 * MM : free(measure(lim)) < 0) && (lim.specs > 8 || lim.inc > 10)) lim = { specs: Math.max(8, lim.specs - 1), inc: Math.max(10, lim.inc - 2), exc: Math.max(4, lim.exc - 1) };
  const blockH = measure(lim);
  // gallery
  if (hasGal) {
    const galH = Math.max(24 * MM, Math.min(56 * MM, free(blockH))), bigW = (W - 2 * gap) / 2, smW = (W - 2 * gap) / 4, smH = (galH - gap) / 2;
    const smallUrls = imgs.slice(2, 6);
    const [big, ...smalls] = await Promise.all([photo(imgs[1], px(smallUrls.length ? bigW : W), px(galH)), ...smallUrls.map(u => photo(u, px(smW), px(smH)))]);
    if (smalls.some(Boolean)) {
      roundImg(big, X, galTop, bigW, galH);
      smalls.forEach((g, n) => roundImg(g, X + bigW + gap + (n % 2) * (smW + gap), galTop + Math.floor(n / 2) * (smH + gap), smW, smH));
    } else roundImg(big, X, galTop, W, galH);
    y = galTop + galH;
  }
  y = specsBlock(y + 16, lim);

  /* ================= page 2+: prices, times, notes, booking ================= */
  const FOOT = PH - 9 * MM - 14;
  const head2 = () => {
    doc.addPage(); brand(false, X, 10 * MM - 4);
    write(name, X + W - 260, 10 * MM - 4, 260, { font: 'b', size: 13, align: 'right', lh: 1.25 });
    write(prices ? T('ราคาเหมาลำ หน่วยเป็นบาท', 'Whole-boat prices in Thai baht') : T('รายละเอียดทริป', 'Trip details'), X + W - 260, 10 * MM + 13, 260, { size: 8, color: MUTED, align: 'right' });
    const yy = 10 * MM + 30; doc.moveTo(X, yy).lineTo(X + W, yy).lineWidth(1.6).strokeColor(M).stroke(); return yy + 18;
  };
  y = head2();
  const room = (need: number) => { if (y + need > FOOT - 6) y = head2(); };

  if (prices) {
    (d.tables ?? []).forEach((t, ti) => {
      const cols = (t.columns ?? []).map(String), rows = (t.rows ?? []).filter(r => r && r.some(c => String(c ?? '').trim()));
      if (!cols.length || !rows.length) return;
      const n = cols.length, firstW = n <= 2 ? W * 0.6 : n === 3 ? W * 0.46 : W * 0.38, cw = (W - firstW) / (n - 1 || 1);
      const head = cols.map((c, k) => {
        if (!k) return [th ? 'โปรแกรม' : c, ''];
        const m = c.match(/^\s*(\w+)\s+season\b\s*(.*)$/i);
        if (m) return [th ? SEASON_TH[m[1].toLowerCase()] ?? m[1] : m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(), m[2].trim()];
        return [c, ''];
      });
      doc.font('b').fontSize(8); const hh = Math.max(24, ...head.map(([, s], k) => k ? 14 + height(s, cw - 10, { size: 6.8, lh: 1.25 }) : 14)) + 6;
      const rowH = (r: string[]) => Math.max(17, height(pick(i.programs?.[ti]?.[rows.indexOf(r)], String(r[0] ?? ''), lang), firstW - 12, { size: 8.8 }) + 6);
      const cap = String(t.caption ?? '').trim();
      room((cap ? 16 : 0) + hh + rowH(rows[0]) * Math.min(rows.length, 3));
      if (cap) { y = write(th ? cap : cap.charAt(0) + cap.slice(1).toLowerCase(), X, y, W, { font: 'b', size: 10 }) + 1; }
      const drawHead = () => {
        doc.save(); doc.roundedRect(X, y, W, hh, 4).fill(M); doc.rect(X, y + hh - 4, W, 4).fill(M); doc.restore();
        head.forEach(([l, s], k) => {
          const x = k ? X + firstW + (k - 1) * cw : X, w = k ? cw : firstW, al = k ? 'right' : 'left';
          write(l, x + 7, y + (s ? 4 : hh - 15), w - 14, { font: 'b', size: 8, color: '#ffffff', align: al });
          if (s) write(s, x + 7, y + 15, w - 14, { size: 6.8, color: '#e6c9cc', align: al, lh: 1.25 });
        });
        y += hh;
      };
      drawHead();
      rows.forEach((r, ri) => {
        const prog = pick(i.programs?.[ti]?.[ri], String(r[0] ?? ''), lang), h = Math.max(17, height(prog, firstW - 12, { size: 8.8 }) + 6);
        if (y + h > FOOT - 6) { y = head2(); drawHead(); }
        if (ri % 2) doc.rect(X, y, W, h).fill(ZEBRA);
        write(prog, X + 7, y + 3.5, firstW - 12, { size: 8.8 });
        for (let k = 1; k < n; k++) {
          const v = String(r[k] ?? '').replace(/\s*(THB|บาท|฿)\s*/gi, '').trim() || '–';
          write(v, X + firstW + (k - 1) * cw + 7, y + 3.5, cw - 14, { size: 8.8, align: 'right', font: k === n - 1 && n > 2 ? 'b' : 'r', color: k === n - 1 && n > 2 ? M : INK });
        }
        y += h; doc.moveTo(X, y).lineTo(X + W, y).lineWidth(0.6).strokeColor(LINE).stroke();
      });
      y += 16;
    });
  }

  // departure times + good to know
  { const slots = (d.time_slots ?? []).filter(s => s && s[0]).map((s, k) => [Array.isArray(i.slots) && i.slots.length === (d.time_slots ?? []).length ? pick(i.slots[k], s[0], lang) : s[0], String(s[1] ?? '')
      .replace(/(\d{1,2})(?::(\d{2}))?\s*([AP])M/gi, (_, h, m, ap) => `${String((+h % 12) + (ap.toUpperCase() === 'P' ? 12 : 0)).padStart(2, '0')}:${m ?? '00'}`).replace(/\s*-\s*/g, '–').replace(/\s*\/\s*/g, ' · ')]);
    const tn = pick(i.notes, '', lang), notes = (tn ? tn.split('\n') : d.notes ?? []).map(s => s.trim()).filter(Boolean).slice(0, 8);
    if (!prices) notes.push(T('สอบถามราคาและวันว่างได้ทาง WhatsApp / LINE', 'Ask us for prices and availability on WhatsApp / LINE'));
    else notes.push(T('ราคาเหมาลำทั้งลำ ไม่ใช่ราคาต่อคน', 'Prices are for the whole boat, not per person'));
    const lw = slots.length ? W * 0.42 : 0, nx = X + (slots.length ? lw + 7 * MM : 0), nw = W - (nx - X);
    const notesH = 30 + notes.reduce((s, t) => s + height(t, nw - 30, { size: 8.8 }) + 3, 0);
    room(Math.max(notesH, 20 + slots.length * 19));
    const top = y;
    if (slots.length) {
      let sy = heading(T('เวลาออกเรือ', 'Departure times'), X, top, lw);
      for (const [k, v] of slots) {
        write(k, X, sy, lw * 0.45, { size: 8.8 }); write(v, X + lw * 0.42, sy, lw * 0.58, { font: 'b', size: 8.8, align: 'right' });
        sy += Math.max(height(v, lw * 0.58, { font: 'b', size: 8.8 }), height(k, lw * 0.45, { size: 8.8 })) + 4;
        doc.save().dash(2, { space: 2 }).moveTo(X, sy - 2).lineTo(X + lw, sy - 2).lineWidth(0.6).strokeColor(LINE).stroke().undash().restore(); sy += 3;
      }
      y = sy;
    }
    doc.roundedRect(nx, top, nw, notesH, 6).fill(SAND);
    let ny = heading(T('ข้อควรรู้', 'Good to know'), nx + 12, top + 11, nw - 24);
    for (const t of notes) { doc.circle(nx + 15, ny + 6.2, 1.6).fill(M); ny = write(t, nx + 23, ny, nw - 35, { size: 8.8 }) + 3; }
    y = Math.max(y, top + notesH) + 16;
  }

  // booking box with QR — bottom of the last page
  { const bh = 42 * MM, by = FOOT - 14 - bh;
    if (y > by - 6) { y = head2(); }
    doc.roundedRect(X, by, W, bh, 8).fill(M);
    const q = 30 * MM, qx = X + 7 * MM, qy = by + (bh - q) / 2;
    doc.roundedRect(qx, qy, q, q, 5).fill('#ffffff');
    const cells = qr.modules.size, inner = q - 12, cs = inner / cells;
    doc.fillColor('#000000');
    for (let r = 0; r < cells; r++) for (let c = 0; c < cells; c++) if (qr.modules.get(r, c)) doc.rect(qx + 6 + c * cs, qy + 6 + r * cs, cs + 0.15, cs + 0.15);
    doc.fill('#000000');
    const tx = qx + q + 7 * MM, tw = X + W - 7 * MM - tx;
    let ty = by + 7 * MM - 2;
    ty = write(T('เช็กวันว่างและจองเรือ', 'Check your date & book'), tx, ty, tw, { font: 'b', size: 15, color: '#ffffff', lh: 1.25 });
    ty = write(T('สแกนดูรูปทั้งหมดและราคาล่าสุด หรือทักเราได้เลย ตอบกลับภายใน 30 นาที (09:00–21:00 น.)', 'Scan for all photos and live prices, or message us — we reply within 30 minutes (09:00–21:00).'), tx, ty + 1, tw, { size: 9, color: '#ecd3d5' }) + 6;
    for (const [k, v] of [['WhatsApp', ci.wa], ['LINE', ci.line], [T('อีเมล', 'Email'), ci.email]]) { write(k, tx, ty, 60, { size: 9, color: '#d6aeb2' }); write(v, tx + 62, ty, tw - 62, { font: 'b', size: 9, color: '#ffffff' }); ty += 13.5; }
  }

  // footer on every page
  const pages = doc.bufferedPageRange();
  const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  for (let p = 0; p < pages.count; p++) {
    doc.switchToPage(p);
    const fy = PH - 9 * MM - 10;
    doc.moveTo(X, fy - 4).lineTo(X + W, fy - 4).lineWidth(0.6).strokeColor(LINE).stroke();
    const left = p === 0 ? url.replace(/^https?:\/\//, '') : `${th ? ci.companyTh : ci.company} · ${prices ? T(`ราคา ณ ${fmtDate(today, lang)} อาจเปลี่ยนแปลงได้`, `Prices as of ${fmtDate(today, lang)}, subject to change`) : url.replace(/^https?:\/\//, '')}`;
    write(left, X, fy, W - 40, { size: 7.5, color: MUTED });
    write(`${p + 1} / ${pages.count}`, X + W - 40, fy, 40, { size: 7.5, color: MUTED, align: 'right' });
  }
  doc.end();
  return { pdf: await done, name: `${b.slug}-${lang}${prices ? '' : '-no-prices'}.pdf` };
}
