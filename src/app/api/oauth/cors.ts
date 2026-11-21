/** OAuth endpoints are called by apps (claude.ai, Claude Code …), some from a browser: open CORS, never cached */
export const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version', 'Cache-Control': 'no-store' };
export const preflight = () => new Response(null, { status: 204, headers: CORS });
export const oauthJson = (d: unknown, status = 200) => Response.json(d, { status, headers: CORS });
/** form-encoded (RFC 6749) or JSON body → URLSearchParams */
export async function formOf(req: Request) {
  const t = req.headers.get('content-type') || '';
  if (t.includes('json')) { const j = (await req.json().catch(() => ({}))) as Record<string, unknown>; return new URLSearchParams(Object.entries(j).map(([k, v]) => [k, String(v ?? '')])); }
  return new URLSearchParams(await req.text());
}
