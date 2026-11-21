import { OAuthError, registerClient } from '@/lib/oauth';
import { clientIp } from '@/lib/request';
import { rateLimit } from '@/lib/ratelimit';
import { oauthJson, preflight } from '../cors';

export const runtime = 'nodejs';
/** RFC 7591 dynamic client registration (public clients: no secret, PKCE) */
export async function POST(req: Request) {
  if (!rateLimit('oauth-reg:' + (clientIp(req.headers) || '?'), 20, 3_600_000)) return oauthJson({ error: 'slow_down' }, 429);
  let b: Record<string, unknown>; try { b = await req.json(); } catch { return oauthJson({ error: 'invalid_client_metadata' }, 400); }
  try { return oauthJson(await registerClient(b), 201); }
  catch (e) { return oauthJson({ error: e instanceof OAuthError ? e.code : 'invalid_client_metadata', error_description: e instanceof Error ? e.message : '' }, 400); }
}
export const OPTIONS = preflight;
