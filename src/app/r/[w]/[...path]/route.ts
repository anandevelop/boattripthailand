import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { uploadPath } from '@/lib/media';

export const runtime = 'nodejs';

/**
 * /r/<width>/<boats|img|brand|uploads>/<file>  →  the same photo, resized to <width> px, as WebP.
 * Cards and thumbnails use this instead of the 1920 px originals (a 300 px card does not need a 200 KB photo).
 * Only pictures that are already public are served; widths are fixed so the cache stays small.
 * Resized files are kept in the container's temp folder; Cloudflare and browsers cache them too.
 */
const WIDTHS = new Set([160, 320, 768, 1280, 1600]);
const PUBLIC = path.resolve(process.cwd(), 'public');
const CACHE = path.join(os.tmpdir(), 'btt-r');
const busy = new Map<string, Promise<Buffer>>();

function fileOf(rel: string) {
  if (!/^(boats|img|brand|uploads)\/[\w./-]+\.(webp|jpe?g|png|avif)$/i.test(rel) || rel.includes('..')) return null;
  if (rel.startsWith('uploads/')) return uploadPath('/' + rel);
  const p = path.resolve(PUBLIC, rel);
  return p.startsWith(PUBLIC + path.sep) ? p : null;
}

export async function GET(req: Request, ctx: { params: Promise<{ w: string; path: string[] }> }) {
  const { w: ws, path: parts } = await ctx.params;
  const w = Number(ws), rel = (parts ?? []).map(decodeURIComponent).join('/');
  const file = WIDTHS.has(w) ? fileOf(rel) : null;
  if (!file) return new Response('not found', { status: 404 });
  let st; try { st = await stat(file); } catch { return new Response('not found', { status: 404 }); }
  const key = createHash('sha1').update(`${rel}|${st.size}|${st.mtimeMs}|${w}`).digest('hex');
  const out = path.join(CACHE, key.slice(0, 2), key + '.webp');
  let buf = await readFile(out).catch(() => null);
  if (!buf) {
    let job = busy.get(key);
    if (!job) {
      job = (async () => {
        const b = await sharp(await readFile(file), { failOn: 'none' }).rotate()
          .resize({ width: w, height: w * 2, fit: 'inside', withoutEnlargement: true }).webp({ quality: w <= 320 ? 70 : 74, effort: 4 }).toBuffer();
        try {   // the disk copy is only a cache: a read-only / full disk must not break the picture
          await mkdir(path.dirname(out), { recursive: true });
          const tmp = out + '.' + process.pid + '.tmp'; await writeFile(tmp, b); await rename(tmp, out);
        } catch { /* serve from memory this time */ }
        return b;
      })().finally(() => busy.delete(key));
      busy.set(key, job);
    }
    try { buf = await job; } catch { return new Response('not found', { status: 404 }); }
  }
  // URLs from the site carry ?v=<content hash> (boats) or are unique upload names → safe to cache for a year
  const versioned = new URL(req.url).searchParams.has('v') || rel.startsWith('uploads/');
  return new Response(new Uint8Array(buf), { headers: {
    'Content-Type': 'image/webp', 'X-Content-Type-Options': 'nosniff',
    'Cache-Control': versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=86400, stale-while-revalidate=604800',
  } });
}
