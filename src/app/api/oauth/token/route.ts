import { OAuthError, tokenGrant } from '@/lib/oauth';
import { clientIp } from '@/lib/request';
import { rateLimit } from '@/lib/ratelimit';
import { formOf, oauthJson, preflight } from '../cors';

export const runtime = 'nodejs';
/** token endpoint: authorization_code (+ PKCE) and refresh_token (rotating) */
export async function POST(req: Request) {
  if (!rateLimit('oauth-token:' + (clientIp(req.headers) || '?'), 120, 3_600_000)) return oauthJson({ error: 'slow_down' }, 429);
  try { return oauthJson(await tokenGrant(await formOf(req))); }
  catch (e) {
    if (e instanceof OAuthError) return oauthJson({ error: e.code, error_description: e.message }, e.status);
    console.error('[oauth token]', e); return oauthJson({ error: 'server_error' }, 500);
  }
}
export const OPTIONS = preflight;
