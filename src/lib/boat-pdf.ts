import 'server-only';
import { GoogleError } from './google';
import { GEMINI_MODEL, provider, QuotaError, reserve } from './translate';

/**
 * "นำเข้า PDF" on /admin → จัดการเรือ: read a supplier brochure with Gemini (free tier, same key + caps as auto-translate)
 * and return the boats it finds in the admin's boat shape. Nothing is saved here — the admin reviews and creates drafts.
 * One import = 1 request + PDF_CHARS characters on the translate meter.
 */
export const PDF_CHARS = 10_000;
export const PDF_MAX = 14 * 1024 * 1024;   // Gemini inline request limit is 20 MB (base64 adds a third)

const S = { type: 'STRING' } as const, SA = { type: 'ARRAY', items: S } as const, SAA = { type: 'ARRAY', items: SA } as const;
const SCHEMA = { type: 'ARRAY', items: { type: 'OBJECT', properties: {
  name: S, subtitle: S, type: { type: 'STRING', enum: ['yacht', 'sail', 'power', 'speed', 'longtail'] }, ft: { type: 'NUMBER' }, pax: { type: 'INTEGER' }, marina: S, from_: { type: 'INTEGER' },
  info: SAA, includes: SA, not_included: SA, complimentary: SA, time_slots: SAA, notes: SA,
  tables: { type: 'ARRAY', items: { type: 'OBJECT', properties: { caption: S, columns: SA, rows: SAA }, required: ['columns', 'rows'] } },
}, required: ['name', 'type', 'tables'] } };

const PROMPT = `This PDF is a supplier brochure / rate sheet for boat or yacht charters in Phuket, Thailand.
Extract EVERY distinct boat it offers (one object per boat; skip pages that are only covers, maps or terms). Copy the text as written in the PDF (English), do not invent anything; leave a field empty when the PDF does not say it.
- name: the boat's marketing name with its length, e.g. "Leopard 90 ft". subtitle: model / builder if given.
- type: yacht (motor yacht), sail (sailing catamaran), power (power catamaran), speed (speedboat), longtail.
- ft: length in feet (convert metres × 3.281, 1 decimal). pax: max guests for a day trip. marina: departure pier / marina.
- info: spec rows [label, value], e.g. ["Cabin","3"], ["Crew","5 person"], ["Year","2003"].
- tables: price tables. First column "Program" (trip name + duration + route), then one column per season / option with the exact season names and dates as headers. Prices as written, e.g. "102,000 THB". One row per program.
- from_: the lowest price in THB as a whole number (no commas).
- time_slots: [program, time], e.g. ["Half Day 4 hrs.","9AM-1PM"]. includes / not_included / complimentary / notes: one short line each.
Return ONLY the JSON array.`;

const clip = (v: unknown, n = 300) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, n);
const list = (v: unknown, n = 40, len = 300) => (Array.isArray(v) ? v : []).map(x => clip(x, len)).filter(Boolean).slice(0, n);
const grid = (v: unknown, rows = 40, cols = 12, len = 300) => (Array.isArray(v) ? v : []).filter(Array.isArray).slice(0, rows).map(r => (r as unknown[]).slice(0, cols).map(x => clip(x, len)));
const num = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) || Number(v) <= 0 ? null : Number(v));

export async function boatsFromPdf(file: File, user: string) {
  if (!provider() || process.env.TRANSLATE_ENABLED === 'false') throw new QuotaError('ยังไม่ได้เชื่อม Gemini (ใส่ GEMINI_API_KEY ใน .env) จึงอ่าน PDF ไม่ได้');
  if (file.type && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) throw new QuotaError('รองรับเฉพาะไฟล์ PDF');
  if (file.size > PDF_MAX) throw new QuotaError(`ไฟล์ใหญ่เกิน ${Math.round(PDF_MAX / 1048576)} MB · ลองบีบอัด PDF หรือแยกเป็นหลายไฟล์`);
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.subarray(0, 5).toString() !== '%PDF-') throw new QuotaError('ไฟล์นี้ไม่ใช่ PDF');
  const giveBack = await reserve(PDF_CHARS, 1, { user, what: `นำเข้าเรือจาก PDF · ${file.name}`.slice(0, 120), from: 'pdf', to: 'en' });
  try {
    const body = { contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'application/pdf', data: buf.toString('base64') } }, { text: PROMPT }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 32_768, responseMimeType: 'application/json', responseSchema: SCHEMA } };
    let j: { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; error?: { message?: string } } = {};
    for (let attempt = 0; ; attempt++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY!, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(170_000) });
      j = await r.json().catch(() => ({}));
      if (r.status === 429 && attempt < 1) { await new Promise(res => setTimeout(res, 20_000)); continue; }
      if (!r.ok) throw new GoogleError(r.status === 429 ? 'quota' : r.status === 403 ? 'forbidden' : 'api', j?.error?.message || `Gemini ${r.status}`);
      break;
    }
    const txt = j.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
    let arr: unknown; try { arr = JSON.parse(txt); } catch { arr = null; }
    if (!Array.isArray(arr)) throw new GoogleError('api', `อ่าน PDF ไม่สำเร็จ${j.candidates?.[0]?.finishReason === 'MAX_TOKENS' ? ' · ไฟล์มีเรือเยอะเกินไป ลองแยกเป็นไฟล์ละไม่กี่ลำ' : ''}`);
    const TYPES = ['yacht', 'sail', 'power', 'speed', 'longtail'];
    const boats = arr.slice(0, 30).map(x => {
      const o = (x ?? {}) as Record<string, unknown>;
      const tables = (Array.isArray(o.tables) ? o.tables : []).slice(0, 8).map(t => { const q = (t ?? {}) as Record<string, unknown>; return { caption: clip(q.caption, 200), columns: list(q.columns, 12, 120), rows: grid(q.rows, 60, 12, 200) }; })
        .filter(t => t.columns.length && t.rows.length);
      return { name: clip(o.name, 120), subtitle: clip(o.subtitle, 200), type: TYPES.includes(String(o.type)) ? String(o.type) : 'yacht', ft: num(o.ft), pax: num(o.pax) && Math.round(num(o.pax)!),
        marina: clip(o.marina, 200), from_: num(o.from_) && Math.round(num(o.from_)!), info: grid(o.info, 30, 2), includes: list(o.includes), not_included: list(o.not_included), complimentary: list(o.complimentary),
        time_slots: grid(o.time_slots, 20, 2, 120), notes: list(o.notes, 20, 500), tables };
    }).filter(b => b.name);
    if (!boats.length) { await giveBack('ไม่พบเรือใน PDF'); return { boats }; }
    return { boats };
  } catch (e) {
    await giveBack(e instanceof Error ? e.message.slice(0, 80) : 'error');
    throw e;
  }
}
