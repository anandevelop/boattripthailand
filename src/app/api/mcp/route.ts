import { tokenUser } from '@/lib/api-auth';
import { MCP_INSTRUCTIONS, runTool, toolsFor } from '@/lib/mcp';
import { resourceMetadataUrl } from '@/lib/oauth';
import { CORS } from '../oauth/cors';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * MCP server (Model Context Protocol, Streamable HTTP, stateless JSON responses) for AI agents.
 * Auth: `Authorization: Bearer btt_…` — a token made in /admin → ทีมงาน & สิทธิ์ → AI & MCP, or an OAuth access token
 * (claude.ai / Cowork custom connector: discovery via the 401's resource_metadata → lib/oauth.ts).
 * Tools: lib/mcp.ts · rules (no deletes without a person's code): lib/api-auth.ts
 */
const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
const H = { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id' };
const err = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const u = auth.startsWith('Bearer ') ? await tokenUser(auth.slice(7).trim()) : null;
  if (!u) return Response.json(err(null, -32001, 'ต้องใช้ API token (Authorization: Bearer btt_…) ที่สร้างใน /admin → ทีมงาน & สิทธิ์ → AI'), { status: 401, headers: { ...H, ...CORS, 'WWW-Authenticate': `Bearer resource_metadata="${resourceMetadataUrl()}", scope="mcp"` } });
  if (!rateLimit('mcp:' + u.id, 600, 60 * 60_000)) return Response.json(err(null, -32002, 'เรียกถี่เกินไป (600 ครั้ง/ชั่วโมง)'), { status: 429, headers: H });
  let msg: Rpc | Rpc[];
  try { msg = await req.json(); } catch { return Response.json(err(null, -32700, 'Parse error'), { status: 400, headers: H }); }
  const batch = Array.isArray(msg), list = (batch ? msg : [msg]) as Rpc[];
  const out = (await Promise.all(list.map(m => handle(u, m)))).filter(Boolean);
  if (!out.length) return new Response(null, { status: 202, headers: H });
  return Response.json(batch ? out : out[0], { headers: H });
}

async function handle(u: NonNullable<Awaited<ReturnType<typeof tokenUser>>>, m: Rpc) {
  if (!m || typeof m.method !== 'string') return err(m?.id, -32600, 'Invalid request');
  if (m.id === undefined || m.id === null) return null;   // notification (notifications/initialized …): no answer
  const ok = (result: unknown) => ({ jsonrpc: '2.0', id: m.id, result });
  switch (m.method) {
    case 'initialize': {
      const asked = String(m.params?.protocolVersion || '');
      return ok({ protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0], capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'boattripthailand-admin', title: 'Boat Trip Thailand · หลังบ้าน', version: '1.0.0' }, instructions: MCP_INSTRUCTIONS });
    }
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: toolsFor(u).map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema, annotations: { destructiveHint: false, readOnlyHint: /^(whoami|list_|get_|analytics|job_status|system_status)/.test(t.name) } })) });
    case 'tools/call': {
      const name = String(m.params?.name || ''), args = (m.params?.arguments ?? {}) as Record<string, unknown>;
      const r = await runTool(u, name, args);
      if (r.isError) return ok({ content: [{ type: 'text', text: r.text }], isError: true });
      const text = JSON.stringify(r.data, null, 1);
      return ok({ content: [{ type: 'text', text: text.length > 200_000 ? text.slice(0, 200_000) + '\n…(ตัดเหลือ 200,000 ตัวอักษร)' : text }], ...(r.data && typeof r.data === 'object' && !Array.isArray(r.data) ? { structuredContent: r.data } : {}) });
    }
    case 'resources/list': return ok({ resources: [] });
    case 'prompts/list': return ok({ prompts: [] });
    default: return err(m.id, -32601, `Method not found: ${m.method}`);
  }
}

export async function GET() { return new Response('MCP endpoint · POST JSON-RPC with Authorization: Bearer <token>', { status: 405, headers: { ...H, Allow: 'POST' } }); }
export async function DELETE() { return new Response(null, { status: 405, headers: { ...H, Allow: 'POST' } }); }

export async function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
