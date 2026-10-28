import { indexNowKey } from '@/lib/sitemap-tools';

export const dynamic = 'force-dynamic';

/** IndexNow key file (Bing, Yandex, Naver …): proves the URLs we send belong to this site */
export async function GET() {
  return new Response(await indexNowKey(), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
