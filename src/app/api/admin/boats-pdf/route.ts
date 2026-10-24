import { currentUser } from '@/lib/auth';
import { boatsFromPdf } from '@/lib/boat-pdf';
import { GoogleError } from '@/lib/google';
import { can } from '@/lib/perms';
import { QuotaError } from '@/lib/translate';

export const runtime = 'nodejs';
export const maxDuration = 180;

/** POST multipart `file` (one PDF brochure) → { boats } read by Gemini; nothing is saved (admin reviews → drafts) */
const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return json({ error: 'หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่', login: true }, 401);
  const origin = req.headers.get('origin'), host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (origin && host && new URL(origin).host !== host) return json({ error: 'bad origin' }, 403);
  if (!can(u, 'boats')) return json({ error: 'ไม่มีสิทธิ์จัดการเรือ' }, 403);
  let f: FormDataEntryValue | null;
  try { f = (await req.formData()).get('file'); } catch { return json({ error: 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่' }, 400); }
  if (!(f instanceof File)) return json({ error: 'ไม่พบไฟล์' }, 400);
  try { return json(await boatsFromPdf(f, u.name || u.email)); }
  catch (e) {
    if (e instanceof QuotaError) return json({ error: e.message }, 400);
    if (e instanceof GoogleError) return json({ error: e.message }, 502);
    console.error('[boats-pdf]', e); return json({ error: 'อ่าน PDF ไม่สำเร็จ กรุณาลองใหม่' }, 500);
  }
}
