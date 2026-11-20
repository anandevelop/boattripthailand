import 'server-only';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { aiRequests, apiTokens, boats, settings, users, type AiRequest, type User } from '@/db/schema';
import { audit } from './audit';
import { currentUser } from './auth';
import { randomToken, sha256 } from './crypto';
import { lineEnabled, pushLine, text } from './line';

/**
 * Who is calling an /api/admin route: a signed-in person (cookie) or an AI agent (API token, through /api/mcp).
 *
 * AI agents work with their user's permissions (usually the Bot role) and are NEVER allowed to delete on their own:
 * every delete and a few risky actions answer 409 "confirm_required" until a person confirms — a 6-digit code sent to
 * the Super Admins' LINE, or "ยืนยัน" in /admin → คำขอจาก AI. This is enforced here, on the server, not by the AI's prompt.
 */
export type ApiUser = User & { viaApi?: boolean; tokenName?: string };

/* ---------- tokens ---------- */
const TOKEN_PREFIX = 'btt_';
export async function createApiToken(userId: string, name: string, by: string) {
  const token = TOKEN_PREFIX + randomToken(30);
  const [row] = await db.insert(apiTokens).values({ userId, name: name.slice(0, 80) || 'AI', tokenHash: sha256(token), prefix: token.slice(0, 10), createdById: by }).returning();
  return { token, row };
}
export async function listApiTokens() {
  return db.select({ id: apiTokens.id, userId: apiTokens.userId, name: apiTokens.name, prefix: apiTokens.prefix, createdAt: apiTokens.createdAt, lastUsedAt: apiTokens.lastUsedAt, revokedAt: apiTokens.revokedAt, userName: users.name, role: users.role })
    .from(apiTokens).innerJoin(users, eq(users.id, apiTokens.userId)).orderBy(desc(apiTokens.createdAt));
}
export async function revokeApiToken(id: string) {
  const [row] = await db.update(apiTokens).set({ revokedAt: new Date() }).where(and(eq(apiTokens.id, id), isNull(apiTokens.revokedAt))).returning();
  return row ?? null;
}
/** Bearer token → its active user (null when unknown, revoked or the user is switched off) */
export async function tokenUser(token: string): Promise<ApiUser | null> {
  if (!token.startsWith(TOKEN_PREFIX) || token.length > 200) return null;
  const [r] = await db.select({ t: apiTokens, u: users }).from(apiTokens).innerJoin(users, eq(users.id, apiTokens.userId))
    .where(and(eq(apiTokens.tokenHash, sha256(token)), isNull(apiTokens.revokedAt)));
  if (!r || !r.u.active) return null;
  if (!r.t.lastUsedAt || Date.now() - +r.t.lastUsedAt > 60_000) await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, r.t.id));
  return { ...r.u, viaApi: true, tokenName: r.t.name };
}

/* ---------- in-process calls (MCP tools → /api/admin/*) ---------- */
// one secret per server process: the MCP route calls the admin API on 127.0.0.1 as the token's user
const G = globalThis as unknown as { __bttInternalKey?: Buffer };
const KEY = (G.__bttInternalKey ??= randomBytes(32));
const sign = (s: string) => createHmac('sha256', KEY).update(s).digest('base64url');
const sameSig = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function internalHeaders(userId: string, tokenName: string, confirmId?: string) {
  const at = String(Date.now()), base = `${userId}|${at}|${confirmId ?? ''}`;
  return { 'x-btt-as': `${userId}.${at}.${sign(base)}`, 'x-btt-agent': encodeURIComponent(tokenName.slice(0, 80)), ...(confirmId ? { 'x-btt-confirm': confirmId } : {}) };
}
async function internalUser(req: Request): Promise<{ user: ApiUser; confirmId: string | null } | null> {
  const h = req.headers.get('x-btt-as'); if (!h) return null;
  const [userId, at, sig] = h.split('.'); const confirmId = req.headers.get('x-btt-confirm');
  if (!userId || !at || !sig || Math.abs(Date.now() - Number(at)) > 60_000) return null;
  if (!sameSig(sig, sign(`${userId}|${at}|${confirmId ?? ''}`))) return null;
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u || !u.active) return null;
  let name = 'AI'; try { name = decodeURIComponent(req.headers.get('x-btt-agent') || 'AI'); } catch { /* keep */ }
  return { user: { ...u, viaApi: true, tokenName: name }, confirmId };
}
export const internalBase = () => `http://127.0.0.1:${process.env.PORT || 3000}`;

/* ---------- what needs a person's confirmation ---------- */
const actsCount = async () => { const [r] = await db.select().from(settings).where(eq(settings.key, 'site.activities')); return Array.isArray(r?.value) ? (r!.value as unknown[]).length : null; };
/** label of the risky action, or null when an AI may just do it */
export async function confirmNeeded(method: string, path: string, body: Record<string, unknown> | null): Promise<string | null> {
  const p = path.replace(/^\/api\/admin/, '').split('?')[0];
  if (method === 'DELETE') return 'ลบข้อมูล';
  if (/^\/redirects\/delete$/.test(p)) return 'ลบ redirect';
  if (/^\/posts\/trash/.test(p) || body?.permanent) return 'ลบถาวร';
  if (/^\/system\/(restore|upload)$/.test(p)) return 'กู้คืนข้อมูลสำรอง';
  if (p === '/settings/piers' && body?.reset === true) return 'ล้างหมุดท่าเรือ';
  if (/^\/settings\/mail/.test(p) && method !== 'GET' && !/test$/.test(p)) return 'เปลี่ยนการตั้งค่าอีเมล';
  if (/^\/analytics\/(google\/config|psi\/key)$/.test(p) || /^\/line\//.test(p) && method !== 'GET') return 'เปลี่ยน API key / การเชื่อมต่อ';
  if (p === '/settings/sitecfg' && method === 'PUT') return 'เปลี่ยนการตั้งค่าระบบ';
  const bm = method === 'PUT' && p.match(/^\/boats\/([a-z0-9-]+)$/);
  if (bm && body?.boat && typeof body.boat === 'object') {
    const imgs = (body.boat as { imgs?: unknown }).imgs;
    if (Array.isArray(imgs)) { const [b] = await db.select({ images: boats.images }).from(boats).where(eq(boats.slug, bm[1])); if (b && imgs.length < b.images.length) return 'เอารูปออกจากเรือ'; }
  }
  if (p === '/settings/activities' && method === 'PUT' && Array.isArray(body?.value)) {
    const before = await actsCount(); if (before != null && (body!.value as unknown[]).length < before) return 'ลบกิจกรรม';
  }
  return null;
}
/** never through the API, confirmed or not: the account itself, the team, LINE linking */
const API_NEVER = /^\/(me|users|logout)(\/|$)/;

const deny = (status: number, error: string, extra: Record<string, unknown> = {}) => Response.json({ error, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * The user behind an /api/admin request: cookie session, or (from /api/mcp) the API token's user.
 * For API calls it also applies the rules above; `res` is set when the request must stop.
 */
export async function apiUser(req: Request): Promise<{ user: ApiUser | null; res?: Response }> {
  const internal = req.headers.has('x-btt-as') ? await internalUser(req) : null;
  if (!internal) {
    if (req.headers.has('x-btt-as')) return { user: null, res: deny(401, 'invalid internal call') };
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      const u = await tokenUser(auth.slice(7).trim());
      if (!u) return { user: null, res: deny(401, 'API token ไม่ถูกต้องหรือถูกยกเลิกแล้ว') };
      return { user: u, ...(await apiRules(req, u, null)) };
    }
    return { user: await currentUser() };
  }
  return { user: internal.user, ...(await apiRules(req, internal.user, internal.confirmId)) };
}
async function apiRules(req: Request, u: ApiUser, confirmId: string | null): Promise<{ res?: Response }> {
  const url = new URL(req.url), path = url.pathname + url.search, method = req.method;
  if (API_NEVER.test(url.pathname.replace(/^\/api\/admin/, ''))) return { res: deny(403, 'AI ใช้ส่วนนี้ไม่ได้ (บัญชี ทีมงาน การเชื่อม LINE)') };
  let body: Record<string, unknown> | null = null;
  if (method !== 'GET' && (req.headers.get('content-type') || '').includes('json')) { try { body = await req.clone().json(); } catch { body = null; } }
  const what = await confirmNeeded(method, path, body);
  if (!what) return {};
  if (confirmId) {
    const [r] = await db.select().from(aiRequests).where(eq(aiRequests.id, confirmId));
    if (r && r.status === 'APPROVED' && r.userId === u.id && r.method === method && r.path === path) return {};
    return { res: deny(403, 'คำยืนยันไม่ถูกต้อง') };
  }
  return { res: deny(409, `ต้องให้คนยืนยันก่อน (${what}) · ใช้เครื่องมือ request_confirmation`, { confirm_required: true, action: what, method, path }) };
}

/* ---------- confirmation requests ---------- */
const CODE_MINUTES = 15, MAX_TRIES = 3;
const staffActor = (u: { id: string; role: User['role'] }) => ({ id: u.id, role: u.role });

/** AI asks to run a risky call. A 6-digit code goes to the Super Admins' LINE; the AI never sees it. */
export async function requestConfirmation(u: ApiUser, method: string, path: string, body: unknown, reason: string) {
  const what = await confirmNeeded(method, path, (body ?? null) as Record<string, unknown> | null);
  if (!what) return { needed: false as const };
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const label = `${what}: ${method} ${path.replace(/^\/api\/admin/, '')}`.slice(0, 300);
  const [row] = await db.insert(aiRequests).values({ userId: u.id, method, path, body: (body ?? null) as object, label, reason: reason.slice(0, 500), codeHash: sha256(code), expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000) }).returning();
  await audit(staffActor(u), { action: 'create', entity: 'ai_request', ref: row.id, label: `AI ขอยืนยัน · ${label}`, changes: [{ f: 'เหตุผล', from: null, to: reason.slice(0, 200) }] });
  const sent = await notifyOwners(`🔐 AI (${u.tokenName || u.name}) ขอ${what}\n${label}\nเหตุผล: ${reason || '-'}\n\nรหัสยืนยัน: ${code}\n(ใช้ได้ ${CODE_MINUTES} นาที · ถ้าไม่ได้สั่ง ไม่ต้องทำอะไร หรือกดปฏิเสธใน /admin → คำขอจาก AI)`);
  return { needed: true as const, id: row.id, label, sentToLine: sent, expiresAt: row.expiresAt.toISOString() };
}
async function notifyOwners(msg: string) {
  if (!lineEnabled()) return 0;
  const owners = await db.select({ line: users.lineUserId }).from(users).where(and(eq(users.role, 'SUPER_ADMIN'), eq(users.active, true), sql`${users.lineUserId} is not null`));
  let n = 0;
  for (const o of owners) { try { await pushLine(o.line!, [text(msg)]); n++; } catch (e) { console.error('[ai-confirm] LINE', e); } }
  return n;
}
/** run the stored call as its user, with the one-time confirmation */
async function execute(r: AiRequest) {
  await db.update(aiRequests).set({ status: 'APPROVED' }).where(eq(aiRequests.id, r.id));
  let status = 0, out: unknown = null;
  try {
    const res = await fetch(internalBase() + r.path, { method: r.method, headers: { 'content-type': 'application/json', ...internalHeaders(r.userId, 'AI (confirmed)', r.id) }, body: r.method === 'GET' || r.body == null ? undefined : JSON.stringify(r.body) });
    status = res.status; out = await res.json().catch(() => null);
  } catch (e) { out = { error: e instanceof Error ? e.message : String(e) }; }
  const ok = status >= 200 && status < 300;
  await db.update(aiRequests).set({ status: ok ? 'DONE' : 'FAILED', result: { status, out } as object, decidedAt: new Date() }).where(eq(aiRequests.id, r.id));
  return { ok, status, result: out };
}
/** the AI passes on the code the person read on LINE */
export async function confirmWithCode(u: ApiUser, id: string, code: string) {
  const [r] = await db.select().from(aiRequests).where(and(eq(aiRequests.id, id), eq(aiRequests.userId, u.id)));
  if (!r) return { ok: false, error: 'ไม่พบคำขอนี้' };
  if (r.status !== 'PENDING') return { ok: false, error: `คำขอนี้ ${r.status} แล้ว` };
  if (+r.expiresAt < Date.now()) { await db.update(aiRequests).set({ status: 'EXPIRED' }).where(eq(aiRequests.id, id)); return { ok: false, error: 'รหัสหมดอายุ · ขอใหม่' }; }
  if (sha256(String(code).trim()) !== r.codeHash) {
    const n = r.attempts + 1;
    await db.update(aiRequests).set({ attempts: n, ...(n >= MAX_TRIES ? { status: 'REJECTED', decidedBy: 'รหัสผิดเกิน 3 ครั้ง', decidedAt: new Date() } : {}) }).where(eq(aiRequests.id, id));
    return { ok: false, error: n >= MAX_TRIES ? 'รหัสผิดเกิน 3 ครั้ง · คำขอถูกยกเลิก' : 'รหัสไม่ถูกต้อง' };
  }
  await db.update(aiRequests).set({ decidedBy: 'รหัสจาก LINE' }).where(eq(aiRequests.id, id));
  const done = await execute(r);
  await audit(staffActor(u), { action: 'update', entity: 'ai_request', ref: id, label: `ยืนยันด้วยรหัสแล้ว · ${r.label}`, changes: [{ f: 'ผล', from: null, to: done.ok ? 'สำเร็จ' : `ไม่สำเร็จ (${done.status})` }] });
  return done;
}
/** a Super Admin approves or rejects in /admin */
export async function decideRequest(by: User, id: string, approve: boolean) {
  const [r] = await db.select().from(aiRequests).where(eq(aiRequests.id, id));
  if (!r || r.status !== 'PENDING') return { ok: false, error: 'คำขอนี้ไม่รออยู่แล้ว' };
  if (!approve) {
    await db.update(aiRequests).set({ status: 'REJECTED', decidedBy: by.name, decidedAt: new Date() }).where(eq(aiRequests.id, id));
    await audit(staffActor(by), { action: 'update', entity: 'ai_request', ref: id, label: `ปฏิเสธคำขอ AI · ${r.label}` });
    return { ok: true, status: 'REJECTED' };
  }
  await db.update(aiRequests).set({ decidedBy: by.name }).where(eq(aiRequests.id, id));
  const done = await execute(r);
  await audit(staffActor(by), { action: 'update', entity: 'ai_request', ref: id, label: `อนุมัติคำขอ AI · ${r.label}`, changes: [{ f: 'ผล', from: null, to: done.ok ? 'สำเร็จ' : `ไม่สำเร็จ (${done.status})` }] });
  return done;
}
export async function listRequests(limit = 50) {
  await db.update(aiRequests).set({ status: 'EXPIRED' }).where(and(eq(aiRequests.status, 'PENDING'), sql`${aiRequests.expiresAt} < now()`));
  return db.select({ r: aiRequests, userName: users.name }).from(aiRequests).innerJoin(users, eq(users.id, aiRequests.userId)).orderBy(desc(aiRequests.createdAt)).limit(limit);
}
export async function pendingFor(userId: string) {
  return db.select({ id: aiRequests.id, label: aiRequests.label, status: aiRequests.status, expiresAt: aiRequests.expiresAt, result: aiRequests.result }).from(aiRequests)
    .where(and(eq(aiRequests.userId, userId), gt(aiRequests.createdAt, new Date(Date.now() - 7 * 86_400_000)))).orderBy(desc(aiRequests.createdAt)).limit(20);
}
