import { readFile } from 'node:fs/promises';
import { uploadPath } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Serves images uploaded from /admin. File names are unique, so they can be cached forever. */
export async function GET(req: Request) {
  const file = uploadPath(new URL(req.url).pathname);
  if (!file || !file.endsWith('.webp')) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(file);
    return new Response(new Uint8Array(data), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
