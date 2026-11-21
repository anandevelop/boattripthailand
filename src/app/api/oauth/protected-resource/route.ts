import { protectedResourceMetadata } from '@/lib/oauth';
import { CORS, preflight } from '../cors';

export const dynamic = 'force-dynamic';
/** RFC 9728 protected resource metadata for /api/mcp — served at /.well-known/oauth-protected-resource[/api/mcp] */
export async function GET() { return Response.json(protectedResourceMetadata(), { headers: { ...CORS, 'Cache-Control': 'public, max-age=3600' } }); }
export const OPTIONS = preflight;
