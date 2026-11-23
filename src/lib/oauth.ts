import 'server-only';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { apiTokens, oauthClients, oauthCodes, oauthGrants, users, type User } from '@/db/schema';
import { audit } from './audit';
import { randomToken, sha256 } from './crypto';
import { appUrl } from './leads';
import { can } from './perms';

/**
 * OAuth 2.1 authorization server for the MCP endpoint (/api/mcp), so it can be added as a custom connector in claude.ai
 * or Cowork with one click — MCP authorization spec: protected resource metadata (RFC 9728), server metadata (RFC 8414),
 * dynamic client registration (RFC 7591) or client ID metadata documents, authorization code + PKCE S256, refresh tokens.
 *
 * Who the AI acts as: always a **Bot** account (no leads, customers, team or audit log — lib/perms.ts). A Super Admin
 * signs in to /admin and picks which Bot the app may use; a Bot account signing in can only connect itself.
 * Access tokens live 1 hour (api_tokens, same checks as tokens made in /admin), refresh tokens 30 days and rotate.
 * Revoking the connection in /admin → ทีมงาน & สิทธิ์ → AI & MCP stops every token it issued.
 */
export const ACCESS_SECONDS = 3600, REFRESH_DAYS = 30, CODE_MINUTES = 10;
export const SCOPE = 'mcp';
export const issuer = () => appUrl();
export const resourceUrl = () => `${issuer()}/api/mcp`;
export const resourceMetadataUrl = () => `${issuer()}/.well-known/oauth-protected-resource/api/mcp`;

export const protectedResourceMetadata = () => ({
  resource: resourceUrl(), authorization_servers: [issuer()], scopes_supported: [SCOPE], bearer_methods_supported: ['header'],
  resource_name: 'Boat Trip Thailand · หลังบ้าน (MCP)',
});
export const serverMetadata = () => ({
  issuer: issuer(),
  authorization_endpoint: `${issuer()}/api/oauth/authorize`,
  token_endpoint: `${issuer()}/api/oauth/token`,
  registration_endpoint: `${issuer()}/api/oauth/register`,
  revocation_endpoint: `${issuer()}/api/oauth/revoke`,
  response_types_supported: ['code'], response_modes_supported: ['query'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none'],
  revocation_endpoint_auth_methods_supported: ['none'],
  scopes_supported: [SCOPE],
  client_id_metadata_document_supported: true,
});

export class OAuthError extends Error { constructor(public code: string, msg: string, public status = 400) { super(msg); } }

/* ---------- clients ---------- */
/** https anywhere, or http on this computer only (Claude Code / Desktop callbacks) */
function okRedirect(u: string) {
  try { const x = new URL(u); if (x.hash) return false; return x.protocol === 'https:' || (x.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(x.hostname)); } catch { return false; }
}
export async function registerClient(b: Record<string, unknown>) {
  const uris = (Array.isArray(b.redirect_uris) ? b.redirect_uris : []).map(String).slice(0, 10);
  if (!uris.length || !uris.every(okRedirect)) throw new OAuthError('invalid_redirect_uri', 'redirect_uris must be https (or http://localhost)');
  const name = String(b.client_name || 'MCP client').replace(/[<>]/g, '').slice(0, 100);
  const id = 'c_' + randomToken(18);
  await db.insert(oauthClients).values({ id, name, redirectUris: uris, meta: { software_id: b.software_id ?? null, client_uri: b.client_uri ?? null } });
  return { client_id: id, client_id_issued_at: Math.floor(Date.now() / 1000), client_name: name, redirect_uris: uris, token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], scope: SCOPE };
}
/** a registered client, or a client ID metadata document (client_id is an https URL that describes the app) */
export async function clientOf(clientId: string) {
  const [c] = await db.select().from(oauthClients).where(eq(oauthClients.id, clientId));
  if (c) return c;
  if (!/^https:\/\/[^\s]+$/.test(clientId) || clientId.length > 500) return null;
  try {
    const res = await fetch(clientId, { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' }, redirect: 'error' });
    if (!res.ok) return null;
    const text = await res.text(); if (text.length > 20_000) return null;
    const m = JSON.parse(text) as Record<string, unknown>;
    if (m.client_id !== clientId) return null;
    const uris = (Array.isArray(m.redirect_uris) ? m.redirect_uris : []).map(String).filter(okRedirect).slice(0, 10);
    if (!uris.length) return null;
    const row = { id: clientId, name: String(m.client_name || new URL(clientId).host).replace(/[<>]/g, '').slice(0, 100), redirectUris: uris, meta: { cimd: true } };
    await db.insert(oauthClients).values(row).onConflictDoUpdate({ target: oauthClients.id, set: { name: row.name, redirectUris: uris } });
    return { ...row, createdAt: new Date() };
  } catch { return null; }
}

/** RFC 8252 §7.3: an app on this computer (Claude Code …) listens on whatever loopback port is free, so for
 *  http://localhost / 127.0.0.1 / [::1] the port may differ from the one registered; everything else must match exactly */
const LOOPBACK = ['localhost', '127.0.0.1', '[::1]'];
export function redirectAllowed(registered: string[], uri: string) {
  if (registered.includes(uri)) return true;
  let u: URL; try { u = new URL(uri); } catch { return false; }
  if (u.protocol !== 'http:' || !LOOPBACK.includes(u.hostname)) return false;
  return registered.some(r => { try { const x = new URL(r); return x.protocol === 'http:' && LOOPBACK.includes(x.hostname) && x.pathname === u.pathname && x.search === u.search; } catch { return false; } });
}

/* ---------- authorize ---------- */
export type AuthReq = { clientId: string; redirectUri: string; state: string; challenge: string; scope: string; resource: string };
export async function checkAuthReq(q: URLSearchParams): Promise<{ req: AuthReq; client: NonNullable<Awaited<ReturnType<typeof clientOf>>> }> {
  const clientId = q.get('client_id') || '', redirectUri = q.get('redirect_uri') || '';
  const client = clientId ? await clientOf(clientId) : null;
  if (!client) throw new OAuthError('invalid_client', 'ไม่รู้จักแอปนี้ (client_id)');
  if (!redirectAllowed(client.redirectUris, redirectUri)) throw new OAuthError('invalid_request', 'redirect_uri ไม่ตรงกับที่แอปลงทะเบียนไว้');
  // from here on errors go back to the app (redirect), the redirect_uri is trusted
  if (q.get('response_type') !== 'code') throw new OAuthError('unsupported_response_type', 'response_type must be code');
  const challenge = q.get('code_challenge') || '';
  if (q.get('code_challenge_method') !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(challenge)) throw new OAuthError('invalid_request', 'PKCE S256 required');
  const resource = q.get('resource') || resourceUrl();
  if (resource.replace(/\/$/, '') !== resourceUrl()) throw new OAuthError('invalid_target', 'unknown resource');
  return { req: { clientId, redirectUri, state: q.get('state') || '', challenge, scope: SCOPE, resource }, client };
}
/** the Bot accounts this person may connect: any Bot for someone who manages the team, only itself for a Bot */
export async function connectable(me: User) {
  const bots = await db.select().from(users).where(and(eq(users.role, 'BOT'), eq(users.active, true)));
  if (me.role === 'BOT') return bots.filter(b => b.id === me.id);
  return can(me, 'team') ? bots : [];
}
export async function approve(me: User, r: AuthReq, clientName: string, botId: string) {
  const ok = (await connectable(me)).find(b => b.id === botId);
  if (!ok) throw new OAuthError('access_denied', 'เลือกบัญชี Bot ไม่ได้');
  const [g] = await db.insert(oauthGrants).values({ clientId: r.clientId, clientName, userId: ok.id, approvedById: me.id }).returning();
  const code = randomToken(32);
  await db.insert(oauthCodes).values({ codeHash: sha256(code), clientId: r.clientId, grantId: g.id, redirectUri: r.redirectUri, challenge: r.challenge, expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000) });
  await audit({ id: me.id, role: me.role }, { action: 'create', entity: 'ai_token', ref: g.id, label: `อนุญาตแอป "${clientName}" เชื่อม MCP ในนาม ${ok.name}` });
  return code;
}
export function redirectWith(uri: string, params: Record<string, string>) {
  const u = new URL(uri); for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
  u.searchParams.set('iss', issuer());
  return u.toString();
}

/* ---------- token ---------- */
const b64url = (b: Buffer) => b.toString('base64url');
async function issue(grantId: string, userId: string, clientName: string) {
  const access = 'btt_' + randomToken(30), refresh = 'bttr_' + randomToken(32);
  await db.insert(apiTokens).values({ userId, name: `OAuth · ${clientName}`.slice(0, 80), tokenHash: sha256(access), prefix: access.slice(0, 10), grantId, expiresAt: new Date(Date.now() + ACCESS_SECONDS * 1000) });
  await db.update(oauthGrants).set({ refreshHash: sha256(refresh), refreshExpiresAt: new Date(Date.now() + REFRESH_DAYS * 86_400_000), lastUsedAt: new Date() }).where(eq(oauthGrants.id, grantId));
  return { access_token: access, token_type: 'Bearer', expires_in: ACCESS_SECONDS, refresh_token: refresh, scope: SCOPE };
}
export async function tokenGrant(f: URLSearchParams) {
  const type = f.get('grant_type'), clientId = f.get('client_id') || '';
  if (type === 'authorization_code') {
    const code = f.get('code') || '', verifier = f.get('code_verifier') || '';
    const [c] = await db.select().from(oauthCodes).where(eq(oauthCodes.codeHash, sha256(code)));
    if (!c || c.usedAt || +c.expiresAt < Date.now()) {
      if (c?.usedAt) await revokeGrant(c.grantId, null);   // a code used twice: someone copied it → the whole connection goes
      throw new OAuthError('invalid_grant', 'code ไม่ถูกต้องหรือหมดอายุ');
    }
    await db.update(oauthCodes).set({ usedAt: new Date() }).where(eq(oauthCodes.codeHash, c.codeHash));
    if (clientId && clientId !== c.clientId) throw new OAuthError('invalid_grant', 'client_id ไม่ตรง');
    if ((f.get('redirect_uri') || '') !== c.redirectUri) throw new OAuthError('invalid_grant', 'redirect_uri ไม่ตรง');
    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || b64url(createHash('sha256').update(verifier).digest()) !== c.challenge) throw new OAuthError('invalid_grant', 'PKCE ไม่ผ่าน');
    const [g] = await db.select().from(oauthGrants).where(and(eq(oauthGrants.id, c.grantId), isNull(oauthGrants.revokedAt)));
    if (!g) throw new OAuthError('invalid_grant', 'การเชื่อมต่อถูกยกเลิกแล้ว');
    return issue(g.id, g.userId, g.clientName);
  }
  if (type === 'refresh_token') {
    const rt = f.get('refresh_token') || '';
    const [g] = await db.select().from(oauthGrants).where(and(eq(oauthGrants.refreshHash, sha256(rt)), isNull(oauthGrants.revokedAt), gt(oauthGrants.refreshExpiresAt, new Date())));
    if (!g) throw new OAuthError('invalid_grant', 'refresh_token ไม่ถูกต้องหรือหมดอายุ');
    if (clientId && clientId !== g.clientId) throw new OAuthError('invalid_grant', 'client_id ไม่ตรง');
    const [u] = await db.select().from(users).where(eq(users.id, g.userId));
    if (!u || !u.active || u.role !== 'BOT') { await revokeGrant(g.id, null); throw new OAuthError('invalid_grant', 'บัญชีนี้ใช้ไม่ได้แล้ว'); }
    return issue(g.id, g.userId, g.clientName);   // rotation: the old refresh token stops working
  }
  throw new OAuthError('unsupported_grant_type', 'grant_type ไม่รองรับ');
}

/* ---------- revoke ---------- */
export async function revokeGrant(id: string, by: User | null) {
  const [g] = await db.update(oauthGrants).set({ revokedAt: new Date(), refreshHash: null }).where(and(eq(oauthGrants.id, id), isNull(oauthGrants.revokedAt))).returning();
  await db.update(apiTokens).set({ revokedAt: new Date() }).where(and(eq(apiTokens.grantId, id), isNull(apiTokens.revokedAt)));
  if (g && by) await audit({ id: by.id, role: by.role }, { action: 'update', entity: 'ai_token', ref: id, label: `ยกเลิกการเชื่อมต่อ "${g.clientName}"` });
  return g ?? null;
}
/** RFC 7009: the app signs out (access or refresh token) */
export async function revokeToken(token: string) {
  if (token.startsWith('bttr_')) { const [g] = await db.select({ id: oauthGrants.id }).from(oauthGrants).where(eq(oauthGrants.refreshHash, sha256(token))); if (g) await revokeGrant(g.id, null); return; }
  const [t] = await db.select({ id: apiTokens.id, grantId: apiTokens.grantId }).from(apiTokens).where(eq(apiTokens.tokenHash, sha256(token)));
  if (t?.grantId) await db.update(apiTokens).set({ revokedAt: new Date() }).where(eq(apiTokens.id, t.id));
}
export async function listGrants() {
  return db.select({ id: oauthGrants.id, clientName: oauthGrants.clientName, clientId: oauthGrants.clientId, userName: users.name, createdAt: oauthGrants.createdAt, lastUsedAt: oauthGrants.lastUsedAt, revokedAt: oauthGrants.revokedAt })
    .from(oauthGrants).innerJoin(users, eq(users.id, oauthGrants.userId)).orderBy(desc(oauthGrants.createdAt)).limit(100);
}

/* ---------- consent page CSRF ---------- */
const G = globalThis as unknown as { __bttOauthKey?: Buffer };
const KEY = (G.__bttOauthKey ??= randomBytes(32));
export const csrf = (userId: string, q: string) => createHmac('sha256', KEY).update(`${userId}|${q}`).digest('base64url');
