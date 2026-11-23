import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { UPLOAD_DIR, uploadPath } from '@/lib/media';

export const runtime = 'nodejs';

/**
 * /r/<width>/<boats|img|brand|uploads>/<file>  →  the same photo, resized to <width> px, as WebP.
 * Cards and thumbnails use this instead of the 1920 px originals (a 300 px card does not need a 200 KB photo).
 * Only pictures that are already public are served; widths are fixed so the cache stays small.
 * Resized files are kept on the uploads volume (UPLOAD_DIR/_cache/r), so a deploy does not throw them away and the
 * first crawl after it does not resize every photo again; Cloudflare and browsers cache them too.
 */
const WIDTHS = new Set([160, 320, 480, 640, 768, 1280, 1600]);   // 480 / 640: srcset steps for cards (public/site/fleet.js fxSrcset)
const PUBLIC = path.resolve(process.cwd(), 'public');
const CACHE = path.join(UPLOAD_DIR, '_cache', 'r');
const busy = new Map<string, Promise<Buffer>>();

/* file names may be Thai (or any language): letters, combining marks (Thai vowels and tone marks) and digits are fine */
const SAFE = /^(boats|img|brand|uploads)\/[\p{L}\p{M}\p{N}_ .,()+~'-]+(\/[\p{L}\p{M}\p{N}_ .,()+~'-]+)*\.(webp|jpe?g|png|avif)$/iu;
const dec = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
function fileOf(rel: string) {
  if (!SAFE.test(rel) || rel.split('/').some(x => x === '..' || x === '.')) return null;
  if (rel.startsWith('uploads/')) return uploadPath('/' + rel);
  const p = path.resolve(PUBLIC, rel);
  return p.startsWith(PUBLIC + path.sep) ? p : null;
}

export async function GET(req: Request, ctx: { params: Promise<{ w: string; path: string[] }> }) {
  const { w: ws, path: parts } = await ctx.params;
  const w = Number(ws), rel = (parts ?? []).map(dec).join('/').normalize('NFC');
  const file = WIDTHS.has(w) ? fileOf(rel) : null;
  if (!file) return new Response('not found', { status: 404 });
  let st, f = file;
  try { st = await stat(f); }
  catch {   // a file saved from a Mac can carry the decomposed (NFD) form of the same Thai name
    f = file.normalize('NFD'); try { st = await stat(f); } catch { return new Response('not found', { status: 404 }); }
  }
  const q = w <= 480 ? 68 : 72;   // WebP quality: small cards a bit lower, nobody sees the difference at that size
  const key = createHash('sha1').update(`${rel}|${st.size}|${st.mtimeMs}|${w}|q${q}`).digest('hex');
  const out = path.join(CACHE, key.slice(0, 2), key + '.webp');
  let buf = await readFile(out).catch(() => null);
  if (!buf) {
    let job = busy.get(key);
    if (!job) {
      job = (async () => {
        const b = await sharp(await readFile(f), { failOn: 'none' }).rotate()
          .resize({ width: w, height: w * 2, fit: 'inside', withoutEnlargement: true }).webp({ quality: q, effort: 4 }).toBuffer();
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
