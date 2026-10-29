import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { uploadPath } from '@/lib/media';

export const runtime = 'nodejs';

/**
 * GET /api/line/img?src=/boats/leopard-90-ft-hero.webp → the same photo as a 4:3 JPEG.
 * LINE Flex cards only show JPEG/PNG and our photos are WebP. Public on purpose (LINE's servers fetch it),
 * but it only serves pictures that are already public on the site: /boats, /img and /uploads.
 */
const PUBLIC = path.resolve(process.cwd(), 'public');
const W = 1040, H = 780;
const cache = new Map<string, Buffer>();   // small in-memory cache; Cloudflare / LINE cache it too

function fileOf(src: string) {
  if (!/^\/(boats|img|uploads)\/[\w./-]+\.(webp|jpe?g|png|avif)$/i.test(src) || src.includes('..')) return null;
  if (src.startsWith('/uploads/')) return uploadPath(src);
  const p = path.resolve(PUBLIC, src.slice(1));
  return p.startsWith(PUBLIC + path.sep) ? p : null;
}

export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get('src') || '';
  const file = fileOf(src);
  if (!file) return new Response('not found', { status: 404 });
  let out = cache.get(src);
  if (!out) {
    try {
      out = await sharp(await readFile(file)).rotate().resize(W, H, { fit: 'cover', position: 'attention' }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    } catch { return new Response('not found', { status: 404 }); }
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
    cache.set(src, out);
  }
  return new Response(new Uint8Array(out), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400', 'X-Content-Type-Options': 'nosniff' } });
}
