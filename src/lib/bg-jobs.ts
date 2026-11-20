import 'server-only';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { and, asc, eq, lt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { bgJobs, boats, media, posts, users, type BgJob } from '@/db/schema';
import { audit } from './audit';
import { boatsFromPdf, PDF_MAX } from './boat-pdf';
import { DIRS, MAX_UPLOAD_BYTES, saveUpload } from './media';
import { writeAlts } from './media-alt';
import { clearSiteCache } from './site-render';

/**
 * Background jobs for AI agents (MCP): the tool answers with a job id at once, the work runs here, one or two at a time
 * so photo encoding never makes the site slow. Jobs live in the database (bg_jobs): a deploy or restart picks them up again.
 *
 *  image     { url | data (base64), name?, dir?, alt?: {th,en}, autoAlt?, boat?: slug, cover?: postId }
 *            → download → re-encode WebP + AVIF (lib/media saveUpload) → alt text by AI → media library → boat gallery / article cover
 *  brochure  { url | data } → Gemini reads the PDF (lib/boat-pdf) → boats to review (nothing is saved)
 */
export type JobKind = 'image' | 'brochure';
const MAX_RUNNING = 2, MAX_ATTEMPTS = 3;

export async function enqueue(kind: JobKind, input: Record<string, unknown>, userId: string) {
  const [row] = await db.insert(bgJobs).values({ kind, input, userId }).returning();
  kick();
  return row;
}
export async function jobOf(id: string, userId?: string) {
  const [j] = await db.select().from(bgJobs).where(userId ? and(eq(bgJobs.id, id), eq(bgJobs.userId, userId)) : eq(bgJobs.id, id));
  return j ?? null;
}
export const jobToClient = (j: BgJob) => ({ id: j.id, kind: j.kind, status: j.status, step: j.step, result: j.result, error: j.error, attempts: j.attempts, created: j.createdAt.toISOString(), updated: j.updatedAt.toISOString() });

/* ---------- worker ---------- */
const G = globalThis as unknown as { __bgJobs?: { running: number; timer?: NodeJS.Timeout } };
const W = (G.__bgJobs ??= { running: 0 });
export function startBgJobs() {
  if (W.timer) return;
  // jobs left RUNNING by a restart go back to the queue
  void db.update(bgJobs).set({ status: 'QUEUED', step: 'ทำต่อหลังรีสตาร์ต' }).where(eq(bgJobs.status, 'RUNNING')).catch(() => {});
  W.timer = setInterval(kick, 5000);
  W.timer.unref?.();
}
function kick() { while (W.running < MAX_RUNNING) { W.running++; void next().then(did => { W.running--; if (did) setImmediate(kick); }, () => { W.running--; }); } }
/** runs one queued job · false when there was none */
async function next(): Promise<boolean> {
  // claim one queued job (FOR UPDATE SKIP LOCKED: two workers never take the same job)
  const r = await db.execute(sql`update bg_jobs set status = 'RUNNING', attempts = attempts + 1, updated_at = now()
    where id = (select id from bg_jobs where status = 'QUEUED' order by created_at limit 1 for update skip locked) returning id`).catch(() => null);
  const id = (r?.rows[0] as { id?: string } | undefined)?.id;
  if (!id) return false;
  const job = await jobOf(id); if (!job) return false;
  const step = (s: string) => db.update(bgJobs).set({ step: s, updatedAt: new Date() }).where(eq(bgJobs.id, id));
  try {
    const result = job.kind === 'image' ? await runImage(job, step) : job.kind === 'brochure' ? await runBrochure(job, step) : (() => { throw new JobError('ไม่รู้จักงานนี้'); })();
    await db.update(bgJobs).set({ status: 'DONE', step: 'เสร็จ', result: result as object, error: null, updatedAt: new Date() }).where(eq(bgJobs.id, id));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e), final = e instanceof JobError || job.attempts >= MAX_ATTEMPTS;
    await db.update(bgJobs).set({ status: final ? 'FAILED' : 'QUEUED', error: msg.slice(0, 500), updatedAt: new Date() }).where(eq(bgJobs.id, id));
    if (!(e instanceof JobError)) console.error('[bg-job]', job.kind, id, e);
  }
  return true;
}
/** keep the table small: finished jobs older than 30 days go */
export const purgeOldJobs = () => db.delete(bgJobs).where(and(sql`${bgJobs.status} in ('DONE','FAILED')`, lt(bgJobs.updatedAt, new Date(Date.now() - 30 * 86_400_000))));
class JobError extends Error {}

/* ---------- download (public https only: no internal addresses) ---------- */
const PRIVATE = /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd]|fe80|::ffff:(10|127|192\.168|169\.254)\.)/i;
async function download(input: Record<string, unknown>, max: number, accept: RegExp): Promise<{ buf: Buffer; type: string; name: string }> {
  const name = String(input.name || '').slice(0, 120);
  if (typeof input.data === 'string' && input.data) {
    const m = input.data.match(/^data:([\w/+.-]+);base64,(.*)$/s), raw = m ? m[2] : input.data;
    const buf = Buffer.from(raw, 'base64'); if (!buf.length) throw new JobError('ข้อมูลไฟล์ว่าง');
    if (buf.length > max) throw new JobError(`ไฟล์ใหญ่เกิน ${Math.round(max / 1048576)} MB`);
    return { buf, type: m?.[1] || '', name: name || 'upload' };
  }
  let u: URL; try { u = new URL(String(input.url || '')); } catch { throw new JobError('URL ไม่ถูกต้อง'); }
  if (u.protocol !== 'https:') throw new JobError('รับเฉพาะลิงก์ https');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  const addrs = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map(a => a.address);
  if (!addrs.length || addrs.some(a => PRIVATE.test(a))) throw new JobError('ดาวน์โหลดจากที่อยู่นี้ไม่ได้');
  const res = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(60_000), headers: { 'user-agent': 'BoatTripThailand-Admin/1.0' } });
  if (!res.ok) throw new JobError(`ดาวน์โหลดไม่สำเร็จ (${res.status})`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim();
  if (type && !accept.test(type)) throw new JobError(`ไฟล์ไม่ใช่ชนิดที่รับ (${type})`);
  if (Number(res.headers.get('content-length') || 0) > max) throw new JobError(`ไฟล์ใหญ่เกิน ${Math.round(max / 1048576)} MB`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > max) throw new JobError(`ไฟล์ใหญ่เกิน ${Math.round(max / 1048576)} MB`);
  return { buf, type, name: name || decodeURIComponent(u.pathname.split('/').pop() || 'image') };
}

/* ---------- image ---------- */
async function runImage(job: BgJob, step: (s: string) => unknown) {
  const i = job.input as Record<string, unknown>;
  const [u] = job.userId ? await db.select().from(users).where(eq(users.id, job.userId)) : [];
  if (!u) throw new JobError('ไม่พบผู้ใช้ที่สั่งงาน');
  await step('ดาวน์โหลดรูป');
  const f = await download(i, MAX_UPLOAD_BYTES, /^image\//);
  await step('ย่อและแปลงรูป (WebP / AVIF)');
  const dir = (DIRS as readonly string[]).includes(String(i.dir)) ? String(i.dir) : i.boat ? 'boat' : i.cover ? 'blog' : 'new';
  let row;
  try { row = await saveUpload(new File([new Uint8Array(f.buf)], f.name, { type: f.type || 'image/jpeg' }), dir, u.id); }
  catch (e) { throw new JobError(e instanceof Error ? e.message : 'แปลงรูปไม่สำเร็จ'); }
  const out: Record<string, unknown> = { url: row.url, width: row.width, height: row.height, size: row.size };
  // alt text: given, or written by AI (best effort: a quota or AI error never fails the upload)
  const given = (i.alt ?? {}) as { th?: string; en?: string };
  let alt = { th: String(given.th || '').slice(0, 300), en: String(given.en || '').slice(0, 300) };
  if ((!alt.th || !alt.en) && i.autoAlt !== false) {
    await step('เขียน alt text ด้วย AI');
    try { const r = await writeAlts([{ url: row.url, name: f.name, dir, owner: String(i.boat || ''), th: alt.th, en: alt.en }], u.name); const a = r.items[0]; if (a) alt = { th: alt.th || a.th, en: alt.en || a.en }; }
    catch (e) { out.altError = e instanceof Error ? e.message : String(e); }
  }
  if (alt.th || alt.en) { await db.update(media).set({ alt }).where(eq(media.url, row.url)); out.alt = alt; }
  if (i.boat) {
    await step('ใส่ในแกลเลอรีเรือ');
    const slug = String(i.boat);
    const [b] = await db.select().from(boats).where(eq(boats.slug, slug));
    if (!b) throw new JobError(`อัปโหลดแล้ว (${row.url}) แต่ไม่พบเรือ ${slug}`);
    const images = i.asCover ? [row.url, ...b.images] : [...b.images, row.url];
    await db.update(boats).set({ images: images.slice(0, 40), updatedAt: new Date() }).where(eq(boats.slug, slug));
    clearSiteCache(); out.boat = slug;
    await audit({ id: u.id, role: u.role }, { action: 'update', entity: 'boat', ref: slug, label: `${b.name} · เพิ่มรูป (AI)`, changes: [{ f: 'รูปภาพ', from: `${b.images.length} รูป`, to: `${images.length} รูป` }] });
  }
  if (i.cover) {
    await step('ตั้งเป็นรูปหน้าปกบทความ');
    const id = Number(i.cover);
    const [p] = await db.update(posts).set({ cover: row.url, updatedAt: new Date() }).where(eq(posts.id, id)).returning({ id: posts.id, title: posts.title, published: posts.published });
    if (!p) throw new JobError(`อัปโหลดแล้ว (${row.url}) แต่ไม่พบบทความ ${id}`);
    if (p.published) clearSiteCache(); out.cover = id;
    await audit({ id: u.id, role: u.role }, { action: 'update', entity: 'article', ref: String(id), label: `${p.title.th || p.title.en} · รูปหน้าปก (AI)` });
  }
  return out;
}

/* ---------- brochure PDF ---------- */
async function runBrochure(job: BgJob, step: (s: string) => unknown) {
  const i = job.input as Record<string, unknown>;
  const [u] = job.userId ? await db.select().from(users).where(eq(users.id, job.userId)) : [];
  if (!u) throw new JobError('ไม่พบผู้ใช้ที่สั่งงาน');
  await step('ดาวน์โหลด PDF');
  const f = await download(i, PDF_MAX, /pdf|octet-stream/);
  await step('AI อ่านโบรชัวร์ (1–2 นาที)');
  try { return await boatsFromPdf(new File([new Uint8Array(f.buf)], f.name.endsWith('.pdf') ? f.name : f.name + '.pdf', { type: 'application/pdf' }), u.name); }
  catch (e) { throw new JobError(e instanceof Error ? e.message : 'อ่าน PDF ไม่สำเร็จ'); }
}

export const queueSize = async () => (await db.select({ n: sql<number>`count(*)::int` }).from(bgJobs).where(eq(bgJobs.status, 'QUEUED')))[0].n;
export const recentJobs = (userId: string) => db.select().from(bgJobs).where(eq(bgJobs.userId, userId)).orderBy(asc(bgJobs.createdAt)).limit(50);
