import { readFile } from 'node:fs/promises';
import { uploadPath } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Serves images uploaded from /admin. File names are unique, so they can be cached forever. AVIF twin when accepted. */
export async function GET(req: Request) {
  const file = uploadPath(new URL(req.url).pathname);
  if (!file || !file.endsWith('.webp')) return new Response('Not found', { status: 404 });
  try {
    // AVIF twin for browsers that accept it (same URL, ~40% lighter); Vary keeps caches honest
    const avif = /image\/avif/.test(req.headers.get('accept') || '') ? await readFile(file + '.avif').catch(() => null) : null;
    const data = avif ?? await readFile(file);
    return new Response(new Uint8Array(data), { headers: { 'Content-Type': avif ? 'image/avif' : 'image/webp', 'Vary': 'Accept', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
