import { cookies } from 'next/headers';
import { currentUser } from '@/lib/auth';
import { approve, checkAuthReq, connectable, csrf, OAuthError, redirectWith } from '@/lib/oauth';
import { ROLE_LABEL } from '@/lib/perms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * OAuth consent page: a person signed in to /admin allows an app (claude.ai, Cowork, Claude Code …) to use the MCP
 * tools as a Bot account. Not signed in → /admin/login, then back here (cookie btt_oauth_next, read by the login actions).
 */
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const page = (body: string, status = 200) => new Response(`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>เชื่อมต่อ AI · Boat Trip Thailand</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5efe9;font:15px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif;color:#231416}.c{background:#fff;max-width:440px;width:calc(100% - 32px);border-radius:20px;padding:28px;box-shadow:0 10px 40px rgb(35 20 22/.1)}h1{font-size:19px;margin:0 0 6px}p{margin:8px 0;color:#5b4a4c}.k{font-size:12px;letter-spacing:.15em;text-transform:uppercase;color:#70000e;margin:0 0 10px}ul{padding-left:18px;color:#5b4a4c;margin:10px 0}li{margin:4px 0}select{width:100%;height:42px;border-radius:10px;border:1px solid #ddd;padding:0 10px;font:inherit;margin:6px 0 14px}.b{display:flex;gap:10px;margin-top:18px}button{flex:1;height:44px;border-radius:999px;border:0;font:inherit;cursor:pointer}.y{background:#70000e;color:#fff}.n{background:#f1eae6;color:#231416}.e{color:#b42318}small{color:#8a7a7c}</style></head><body><div class="c">${body}</div></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex' } });
const fail = (msg: string, status = 400) => page(`<p class="k">Boat Trip Thailand</p><h1>เชื่อมต่อไม่ได้</h1><p class="e">${esc(msg)}</p>`, status);

async function prepare(req: Request, q: URLSearchParams) {
  try { return await checkAuthReq(q); }
  catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    // errors before the redirect_uri is trusted are shown here; later ones go back to the app
    if (e instanceof OAuthError && !['invalid_client', 'invalid_request'].includes(e.code) || (e instanceof OAuthError && e.code === 'invalid_request' && /PKCE/.test(m))) {
      const r = q.get('redirect_uri'); if (r) return Response.redirect(redirectWith(r, { error: (e as OAuthError).code, error_description: m, state: q.get('state') || '' }), 302);
    }
    return fail(m);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url), q = url.searchParams;
  const p = await prepare(req, q); if (p instanceof Response) return p;
  const me = await currentUser();
  if (!me) {
    (await cookies()).set('btt_oauth_next', url.pathname + url.search, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 15 * 60 });
    return Response.redirect(new URL('/admin/login', url), 302);
  }
  const bots = await connectable(me);
  if (!bots.length) return fail(me.role === 'SUPER_ADMIN' || me.role === 'ADMIN' ? 'ยังไม่มีบัญชีบทบาท Bot · สร้างก่อนที่ ทีมงาน & สิทธิ์ → เพิ่มสมาชิก → บทบาท Bot' : 'บัญชีนี้อนุญาตการเชื่อมต่อไม่ได้ · ให้ Super Admin เข้าสู่ระบบแล้วอนุญาต', 403);
  const host = new URL(p.req.redirectUri).host, qs = url.search.slice(1);
  return page(`<p class="k">Boat Trip Thailand · หลังบ้าน</p><h1>อนุญาตให้ “${esc(p.client.name)}” เข้าระบบหลังบ้าน?</h1>
    <p>แอปจาก <b>${esc(host)}</b> จะใช้เครื่องมือ MCP ในนามบัญชี Bot ที่เลือก</p>
    <ul><li>ดูและแก้ข้อมูลในหลังบ้านตามสิทธิ์ของบัญชี Bot (รวมลีดและข้อมูลลูกค้า)</li><li><b>จัดการทีม & สิทธิ์ไม่ได้</b></li><li><b>ลบเองไม่ได้</b> · ทุกการลบต้องใช้รหัสจาก LINE ของคุณ</li></ul>
    <form method="post"><input type="hidden" name="q" value="${esc(qs)}"><input type="hidden" name="t" value="${csrf(me.id, qs)}">
      <label><small>ใช้บัญชี</small><select name="bot">${bots.map(b => `<option value="${esc(b.id)}">${esc(b.name)} · ${ROLE_LABEL[b.role]}</option>`).join('')}</select></label>
      <div class="b"><button class="n" name="go" value="no">ไม่อนุญาต</button><button class="y" name="go" value="yes">อนุญาต</button></div></form>
    <p><small>เข้าสู่ระบบเป็น ${esc(me.name)} · ยกเลิกการเชื่อมต่อได้ทุกเมื่อที่ ทีมงาน & สิทธิ์ → AI & MCP</small></p>`);
}

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return fail('หมดเวลาเข้าระบบ · เริ่มเชื่อมต่อใหม่จากแอป', 401);
  const f = new URLSearchParams(await req.text()), qs = f.get('q') || '';
  if (f.get('t') !== csrf(me.id, qs)) return fail('ฟอร์มหมดอายุ · เริ่มใหม่จากแอป', 403);
  const q = new URLSearchParams(qs);
  const p = await prepare(req, q); if (p instanceof Response) return p;
  if (f.get('go') !== 'yes') return Response.redirect(redirectWith(p.req.redirectUri, { error: 'access_denied', state: p.req.state }), 303);
  try {
    const code = await approve(me, p.req, p.client.name, f.get('bot') || '');
    return Response.redirect(redirectWith(p.req.redirectUri, { code, state: p.req.state }), 303);
  } catch (e) { return fail(e instanceof Error ? e.message : 'อนุญาตไม่สำเร็จ'); }
}
