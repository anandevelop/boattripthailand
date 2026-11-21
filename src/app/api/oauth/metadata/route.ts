import { serverMetadata } from '@/lib/oauth';
import { CORS, preflight } from '../cors';

export const dynamic = 'force-dynamic';
/** RFC 8414 authorization server metadata — served at /.well-known/oauth-authorization-server (next.config.mjs rewrite) */
export async function GET() { return Response.json(serverMetadata(), { headers: { ...CORS, 'Cache-Control': 'public, max-age=3600' } }); }
export const OPTIONS = preflight;
