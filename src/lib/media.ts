import 'server-only';
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { eq, sql } from 'drizzle-orm';
import sharp, { type OutputInfo } from 'sharp';
import { db } from '@/db';
import { boats, media, posts, settings, users, type Media } from '@/db/schema';

/**
 * Files uploaded from /admin. Every image is re-encoded to WebP (max 2000px, EXIF rotation applied,
 * metadata stripped) so phone photos load fast and nothing but pixels reaches the server.
 * An AVIF twin (<file>.avif, ~40% lighter) is written next to it; the uploads route sends it to browsers that accept AVIF.
 * Stored in UPLOAD_DIR (a Docker volume) and served by src/app/uploads/[...file]/route.ts.
 */
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const DIRS = ['boat', 'act', 'blog', 'brand', 'team', 'new'] as const;
const MAX_SIDE = 2000;

const slug = (s: string) => s.normalize('NFKD').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'image';

export class UploadError extends Error {}

/** /uploads/2026/10/x.webp → absolute path inside UPLOAD_DIR, or null if it would escape it */
export function uploadPath(url: string) {
  if (!url.startsWith('/uploads/')) return null;
  let rel = url.slice('/uploads/'.length); try { rel = decodeURIComponent(rel); } catch { return null; }
  const p = path.resolve(UPLOAD_DIR, rel);
  return p.startsWith(UPLOAD_DIR + path.sep) ? p : null;
}

export async function saveUpload(file: File, dir: string, userId: string): Promise<Media> {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`ไฟล์ ${file.name} ใหญ่เกิน 20 MB`);
  const input = Buffer.from(await file.arrayBuffer());
  let out: { data: Buffer; info: OutputInfo };
  try {
    const meta = await sharp(input).metadata();
    // SVG can carry scripts; only raster formats are accepted
    if (!meta.format || !['jpeg', 'png', 'webp', 'gif', 'avif', 'heif', 'tiff'].includes(meta.format)) throw new Error('format');
    out = await sharp(input).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, effort: 5, smartSubsample: true }).toBuffer({ resolveWithObject: true });
  } catch {
    throw new UploadError(`${file.name} ไม่ใช่ไฟล์รูปที่รองรับ (JPG, PNG, WebP, GIF, AVIF, HEIC)`);
  }
  const d = new Date(), sub = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const fname = `${slug(file.name)}-${randomBytes(4).toString('hex')}.webp`;
  await mkdir(path.join(UPLOAD_DIR, sub), { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, sub, fname), out.data);
  // lighter AVIF twin; skipped when it would not be smaller (the route then serves the WebP)
  try { const av = await sharp(out.data).avif({ quality: 52, effort: 4 }).toBuffer(); if (av.length < out.data.length * .9) await writeFile(path.join(UPLOAD_DIR, sub, fname + '.avif'), av); } catch { /* WebP alone is fine */ }
  const [row] = await db.insert(media).values({
    url: `/uploads/${sub}/${fname}`, name: fname, dir: (DIRS as readonly string[]).includes(dir) ? dir : 'new',
    rights: 'own', width: out.info.width, height: out.info.height, size: out.data.length, uploadedById: userId,
  }).returning();
  return row;
}

/** Where an image is still used on the site — a file is never deleted while something points at it. */
export async function mediaUsage(url: string) {
  const like = `%${url.replace(/[\\%_]/g, '\\$&')}%`;
  const [b, p, s, u] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(boats).where(sql`${url} = any(${boats.images})`),
    db.select({ n: sql<number>`count(*)::int` }).from(posts).where(sql`${posts.cover} = ${url} or ${posts.blocks}::text like ${like}`),
    db.select({ n: sql<number>`count(*)::int` }).from(settings).where(sql`${settings.value}::text like ${like}`),
    db.select({ n: sql<number>`count(*)::int` }).from(users).where(sql`${users.profile}->>'avatar' = ${url}`),
  ]);
  return b[0].n + p[0].n + s[0].n + u[0].n;
}

export async function deleteMedia(url: string) {
  const [row] = await db.delete(media).where(eq(media.url, url)).returning();
  // only files we stored ourselves (size is set by saveUpload); images that shipped with the site stay in /public
  const file = uploadPath(url);
  if (row?.size != null && file) { await unlink(file).catch(() => {}); await unlink(file + '.avif').catch(() => {}); }
  return row ?? null;
}

export const mediaToClient = (m: Media) => ({
  src: m.url, name: m.name, dir: m.dir, alt: m.alt, tags: m.tags, rights: m.rights, credit: m.credit, focal: m.focal, owner: m.owner,
  w: m.width, h: m.height, size: m.size, date: m.createdAt.toISOString().slice(0, 10), uploaded: m.url.startsWith('/uploads/'),
});
