import { currentUser } from '@/lib/auth';
import { GoogleError } from '@/lib/google';
import { ALT_BATCH, writeAlts, type AltIn } from '@/lib/media-alt';
import { can } from '@/lib/perms';
import { rateLimit } from '@/lib/ratelimit';
import { QuotaError } from '@/lib/translate';

export const runtime = 'nodejs';
export const maxDuration = 120;

/** POST { items: [{ url, name, dir, owner, tags, th, en }] } (≤ 6) → { items: [{ url, th, en }], skipped } written by Gemini; nothing is saved */
const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
const s = (v: unknown, n: number) => (typeof v === 'string' ? v : '').slice(0, n);

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return json({ error: 'หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่', login: true }, 401);
  const origin = req.headers.get('origin'), host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (origin && host && new URL(origin).host !== host) return json({ error: 'bad origin' }, 403);
  if (!can(u, 'content')) return json({ error: 'ไม่มีสิทธิ์แก้ไขคลังสื่อ' }, 403);
  if (!rateLimit(`media-alt:${u.id}`, 60, 3_600_000))return json({ error: 'เรียก AI ถี่เกินไป · รอสักครู่แล้วลองใหม่' }, 429);
  let b: { items?: unknown };
  try { b = await req.json(); } catch { return json({ error: 'ข้อมูลไม่ถูกต้อง' }, 400); }
  const items: AltIn[] = (Array.isArray(b.items) ? b.items : []).slice(0, ALT_BATCH).map(x => {
    const o = (x ?? {}) as Record<string, unknown>;
    return { url: s(o.url, 2000), name: s(o.name, 200), dir: s(o.dir, 20), owner: s(o.owner, 200), tags: (Array.isArray(o.tags) ? o.tags : []).map(t => s(t, 40)).slice(0, 10), th: s(o.th, 300), en: s(o.en, 300) };
  }).filter(x => x.url && x.dir !== 'team');
  if (!items.length) return json({ error: 'ไม่มีรูปที่ต้องเขียน alt' }, 400);
  try { return json(await writeAlts(items, u.name || u.email)); }
  catch (e) {
    if (e instanceof QuotaError) return json({ error: e.message, stop: true }, 400);
    if (e instanceof GoogleError) return json({ error: e.message, stop: e.code !== 'api' }, 502);
    console.error('[media-alt]', e); return json({ error: 'AI เขียน alt ไม่สำเร็จ กรุณาลองใหม่' }, 500);
  }
}
