import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { GoogleError } from './google';
import { uploadPath } from './media';
import { GEMINI_MODEL, provider, QuotaError, reserve } from './translate';

/**
 * "AI เขียน alt ที่ขาด" on /admin → คลังสื่อ: Gemini (free tier, same key + caps as auto-translate) looks at
 * up to ALT_BATCH images in ONE request and writes a Thai + English alt text for each.
 * Nothing is saved here: the admin page fills only the empty fields and saves them like a manual edit.
 * Images are shrunk to 640px JPEG before sending (only public website photos; staff photos are skipped by the page).
 * One call = 1 request + ALT_CHARS × images on the translate meter.
 */
export const ALT_BATCH = 6;
export const ALT_CHARS = 400;
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

export type AltIn = { url: string; name?: string; dir?: string; owner?: string; tags?: string[]; th?: string; en?: string };
export type AltOut = { url: string; th: string; en: string };

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v : v == null ? '' : String(v)).replace(/[\u0000-\u001f<>"`\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

/** the file behind a library URL: our uploads or an image that ships with the site (never outside those folders) */
function fileOf(url: string) {
  if (url.startsWith('/uploads/')) return uploadPath(url);
  if (!url.startsWith('/') || url.startsWith('//')) return null;
  let rel = url.split(/[?#]/)[0].slice(1); try { rel = decodeURIComponent(rel); } catch { return null; }
  const p = path.resolve(PUBLIC_DIR, rel);
  return p.startsWith(PUBLIC_DIR + path.sep) ? p : null;
}

const PROMPT = (hints: string) => `You write image alt text for boattripthailand.com, a private yacht / boat charter and island-tour website in Phuket, Thailand.
For EACH image (in the order given) write:
- en: natural English alt text, 6–14 words, max 120 characters. Describe what is actually visible (boat type, deck, cabin, sea, island, beach, activity, people doing what) and add place context like "Phuket" or "Phang Nga Bay" only when it fits.
- th: the same meaning in natural Thai, max 120 characters.
No "image of" / "photo of" / "รูปภาพ", no emojis, no quotes, no prices, no claims you cannot see. Use the boat or tour name from the hints when given; never invent names.
Hints per image (may be empty):
${hints}
Return ONLY the JSON array, one object per image: {"i": index, "th": "...", "en": "..."}.`;

const SCHEMA = { type: 'ARRAY', items: { type: 'OBJECT', properties: { i: { type: 'INTEGER' }, th: { type: 'STRING' }, en: { type: 'STRING' } }, required: ['i', 'th', 'en'] } };

export async function writeAlts(items: AltIn[], user: string): Promise<{ items: AltOut[]; skipped: string[] }> {
  if (!provider() || process.env.TRANSLATE_ENABLED === 'false') throw new QuotaError('ยังไม่ได้เชื่อม Gemini (ใส่ GEMINI_API_KEY ใน .env) จึงให้ AI เขียน alt ไม่ได้');
  const ok: { it: AltIn; data: string }[] = [], skipped: string[] = [];
  for (const it of items.slice(0, ALT_BATCH)) {
    const f = fileOf(it.url);
    try {
      if (!f) throw new Error('path');
      const buf = await sharp(await readFile(f)).rotate().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 72 }).toBuffer();
      ok.push({ it, data: buf.toString('base64') });
    } catch { skipped.push(it.url); }
  }
  if (!ok.length) return { items: [], skipped };

  const hints = ok.map(({ it }, i) => `${i}: ${[it.owner && `name: ${clip(it.owner, 80)}`, it.dir && `folder: ${clip(it.dir, 10)}`, it.tags?.length && `tags: ${it.tags.slice(0, 6).map(t => clip(t, 30)).join(', ')}`,
    it.th && `existing Thai alt: ${clip(it.th, 150)}`, it.en && `existing English alt: ${clip(it.en, 150)}`, it.name && `file: ${clip(it.name, 60)}`].filter(Boolean).join(' · ') || '—'}`).join('\n');
  const giveBack = await reserve(ALT_CHARS * ok.length, 1, { user, what: `AI เขียน alt · ${ok.length} รูป`, from: 'image', to: 'th+en' });
  try {
    const parts = [...ok.flatMap(({ data }, i) => [{ text: `Image ${i}:` }, { inline_data: { mime_type: 'image/jpeg', data } }]), { text: PROMPT(hints) }];
    const body = { contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.2, maxOutputTokens: 4096, responseMimeType: 'application/json', responseSchema: SCHEMA } };
    let j: { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } } = {};
    for (let attempt = 0; ; attempt++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY!, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(90_000) });
      j = await r.json().catch(() => ({}));
      if (r.status === 429 && attempt < 1) { await new Promise(res => setTimeout(res, 15_000)); continue; }
      if (!r.ok) throw new GoogleError(r.status === 429 ? 'quota' : r.status === 403 ? 'forbidden' : 'api', r.status === 429 ? 'Gemini ใช้ครบโควตาฟรีชั่วคราว · ลองใหม่อีกสักครู่' : j?.error?.message || `Gemini ${r.status}`);
      break;
    }
    const txt = j.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
    let arr: unknown; try { arr = JSON.parse(txt); } catch { arr = null; }
    if (!Array.isArray(arr)) throw new GoogleError('api', 'AI ตอบกลับไม่ถูกรูปแบบ กรุณาลองใหม่');
    const out: AltOut[] = [];
    for (const x of arr) {
      const o = (x ?? {}) as Record<string, unknown>, i = Number(o.i);
      if (!Number.isInteger(i) || !ok[i] || out.some(a => a.url === ok[i].it.url)) continue;
      const th = clip(o.th, 125), en = clip(o.en, 125);
      if (th || en) out.push({ url: ok[i].it.url, th, en });
    }
    if (!out.length) { await giveBack('AI ไม่ได้ตอบ'); throw new GoogleError('api', 'AI ไม่ได้เขียน alt กลับมา กรุณาลองใหม่'); }
    return { items: out, skipped: [...skipped, ...ok.filter(o => !out.some(a => a.url === o.it.url)).map(o => o.it.url)] };
  } catch (e) {
    if (!(e instanceof GoogleError && e.message.startsWith('AI ไม่ได้เขียน'))) await giveBack(e instanceof Error ? e.message.slice(0, 80) : 'error');
    throw e;
  }
}
