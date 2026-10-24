import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { media } from '@/db/schema';
import { audit } from '@/lib/audit';
import { currentUser } from '@/lib/auth';
import { deleteMedia, DIRS, mediaToClient, mediaUsage, saveUpload, UploadError } from '@/lib/media';
import { can } from '@/lib/perms';

export const runtime = 'nodejs';

/**
 * Media library API (/admin → คลังสื่อ and every upload button).
 * POST   multipart `file` (1–20) + `dir`  → upload, returns { items }
 * PUT    { url, name, dir, alt, tags, rights, credit, focal, owner } → save details
 * DELETE ?url=… → remove (refused while the image is still used somewhere)
 */
const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
const str = (v: unknown, max = 500) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, max);
const RIGHTS = ['own', 'ads', 'web', 'unknown'];

async function guard(req: Request) {
  const u = await currentUser();
  if (!u) return { res: json({ error: 'หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่', login: true }, 401) };
  const origin = req.headers.get('origin'), host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (origin && host && new URL(origin).host !== host) return { res: json({ error: 'bad origin' }, 403) };
  return { u };
}

export async function POST(req: Request) {
  const { u, res } = await guard(req); if (!u) return res;
  // any signed-in staff may upload (sales set their own profile photo); files are re-encoded and size-limited
  let form: FormData;
  try { form = await req.formData(); } catch { return json({ error: 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่' }, 400); }
  const files = form.getAll('file').filter((f): f is File => f instanceof File).slice(0, 20);
  if (!files.length) return json({ error: 'ไม่พบไฟล์' }, 400);
  const items = [], errors: string[] = [];
  for (const f of files) {
    try { items.push(mediaToClient(await saveUpload(f, str(form.get('dir'), 20), u.id))); }
    catch (e) { if (e instanceof UploadError) errors.push(e.message); else { console.error('[upload]', e); errors.push(`${f.name} อัปโหลดไม่สำเร็จ`); } }
  }
  return json({ items, errors }, items.length ? 200 : 400);
}

export async function PUT(req: Request) {
  const { u, res } = await guard(req); if (!u) return res;
  if (!can(u, 'content')) return json({ error: 'ไม่มีสิทธิ์แก้ไขคลังสื่อ' }, 403);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: 'ข้อมูลไม่ถูกต้อง' }, 400); }
  const url = str(b.url, 2000);
  if (!/^(\/|https:\/\/)[^\s"'<>]+$/.test(url)) return json({ error: 'URL รูปไม่ถูกต้อง' }, 400);
  const alt = (b.alt ?? {}) as Record<string, unknown>, focal = (b.focal ?? {}) as Record<string, unknown>;
  const pct = (v: unknown) => Math.max(0, Math.min(100, Math.round(Number(v) || 50)));
  const v = {
    name: str(b.name, 200) || url.split('/').pop()!.slice(0, 200), dir: (DIRS as readonly string[]).includes(str(b.dir)) ? str(b.dir) : 'new',
    alt: { th: str(alt.th, 300), en: str(alt.en, 300) }, tags: (Array.isArray(b.tags) ? b.tags : []).map(t => str(t, 40)).filter(Boolean).slice(0, 20),
    rights: RIGHTS.includes(str(b.rights)) ? str(b.rights) : 'unknown', credit: str(b.credit, 200), focal: { x: pct(focal.x), y: pct(focal.y) }, owner: str(b.owner, 200),
  };
  // details only: width/height/size stay as saveUpload measured them
  await db.insert(media).values({ url, ...v }).onConflictDoUpdate({ target: media.url, set: v });
  return json({ ok: true });
}

export async function DELETE(req: Request) {
  const { u, res } = await guard(req); if (!u) return res;
  if (!can(u, 'content')) return json({ error: 'ไม่มีสิทธิ์ลบรูป' }, 403);
  const url = str(new URL(req.url).searchParams.get('url'), 2000);
  const used = await mediaUsage(url);
  if (used) return json({ error: `ลบไม่ได้ · รูปนี้ยังใช้อยู่ ${used} ที่` }, 409);
  const [cur] = await db.select().from(media).where(eq(media.url, url));
  const row = await deleteMedia(url);
  if (row?.size != null) await audit({ id: u.id, role: u.role }, { action: 'delete', entity: 'media', ref: url, label: `ลบรูป ${cur?.name ?? url}` });
  return json({ ok: true });
}
