import { revokeToken } from '@/lib/oauth';
import { CORS, formOf, preflight } from '../cors';

export const runtime = 'nodejs';
/** RFC 7009: always 200, whatever the token was */
export async function POST(req: Request) {
  const t = (await formOf(req)).get('token') || '';
  if (t) await revokeToken(t).catch(() => {});
  return new Response(null, { status: 200, headers: CORS });
}
export const OPTIONS = preflight;
