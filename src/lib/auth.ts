import 'server-only';
import bcrypt from 'bcryptjs';
import { and, eq, gt, lt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticator } from 'otplib';
import { db } from '@/db';
import { sessions, users, type User } from '@/db/schema';
import { audit } from './audit';
import { randomToken, sha256 } from './crypto';
import { can, MFA_ROLES, type Perm } from './perms';
import { clientInfo } from './request';

export const SESSION_COOKIE = 'btt_admin';
const SESSION_HOURS = 12;
const IDLE_MINUTES = 30;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

authenticator.options = { window: 1 };
let dummyHash: string | undefined;

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
export const newTotpSecret = () => authenticator.generateSecret();
export const totpUri = (email: string, secret: string) => authenticator.keyuri(email, 'Boat Trip Thailand', secret);
export const verifyTotp = (code: string, secret: string) => authenticator.verify({ token: code.replace(/\D/g, ''), secret });
export const needsMfa = (u: Pick<User, 'role'>) => MFA_ROLES.includes(u.role);

export function passwordProblem(pw: string) {
  if (pw.length < 10) return 'รหัสผ่านต้องยาวอย่างน้อย 10 ตัวอักษร';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'ต้องมีทั้งตัวอักษรและตัวเลข';
  return null;
}

export type LoginResult = { ok: true; mfa: 'verify' | 'setup' | null } | { ok: false; error: string };

/** Step 1: email + password. Generic error so attackers can't tell which accounts exist. */
export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  const info = await clientInfo();
  const generic = { ok: false as const, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  const [u] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
  if (!u || !u.active) {
    await bcrypt.compare(password, (dummyHash ??= bcrypt.hashSync('timing-equaliser', 12))); // equalise timing
    await audit(null, { action: 'login_fail', entity: 'auth', ref: email, label: `ไม่พบบัญชีหรือบัญชีถูกปิด · ${email}`, ...info });
    return generic;
  }
  if (u.lockedUntil && u.lockedUntil > new Date()) return { ok: false, error: `บัญชีถูกล็อกชั่วคราว ลองใหม่ใน ${Math.ceil((+u.lockedUntil - Date.now()) / 60000)} นาที` };
  if (!(await verifyPassword(password, u.passwordHash))) {
    const fails = u.failedLogins + 1, lock = fails >= MAX_FAILS;
    await db.update(users).set({ failedLogins: lock ? 0 : fails, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60000) : null }).where(eq(users.id, u.id));
    await audit({ id: u.id, role: u.role }, { action: lock ? 'locked' : 'login_fail', entity: 'auth', ref: u.email, label: lock ? `ผิดเกิน ${MAX_FAILS} ครั้ง · ล็อก ${LOCK_MINUTES} นาที` : 'รหัสผ่านไม่ถูกต้อง', ...info });
    return lock ? { ok: false, error: `ใส่ผิดเกิน ${MAX_FAILS} ครั้ง บัญชีถูกล็อก ${LOCK_MINUTES} นาที` } : generic;
  }
  await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, u.id));
  const mfa = needsMfa(u) || u.totpEnabled ? (u.totpEnabled ? 'verify' : 'setup') : null;
  await createSession(u, !mfa);
  if (!mfa) await onLoggedIn(u, 'เข้าระบบ');
  return { ok: true, mfa };
}

async function createSession(u: User, mfaVerified: boolean) {
  const token = randomToken(), info = await clientInfo();
  await db.insert(sessions).values({ id: sha256(token), userId: u.id, mfaVerified, sessionVersion: u.sessionVersion, ip: info.ip, userAgent: info.userAgent, expiresAt: new Date(Date.now() + SESSION_HOURS * 3600e3) });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_HOURS * 3600 });
}

async function onLoggedIn(u: User, label: string) {
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id));
  await audit({ id: u.id, role: u.role }, { action: 'login', entity: 'auth', label, ...(await clientInfo()) });
}

async function rawSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = sha256(token);
  const row = await db.query.sessions.findFirst({ where: and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())), with: { user: true } });
  if (!row) return null;
  const u = row.user;
  if (!u.active || row.sessionVersion !== u.sessionVersion) { await db.delete(sessions).where(eq(sessions.id, id)); return null; }
  if (Date.now() - +row.lastSeenAt > IDLE_MINUTES * 60000) {
    await db.delete(sessions).where(eq(sessions.id, id));
    await audit({ id: u.id, role: u.role }, { action: 'logout', entity: 'auth', label: `ไม่มีการใช้งาน ${IDLE_MINUTES} นาที · ออกจากระบบอัตโนมัติ` });
    return null;
  }
  if (Date.now() - +row.lastSeenAt > 60000) await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, id));
  return row;
}

/** Session waiting for the 2FA step */
export async function pendingMfaUser() {
  const s = await rawSession();
  return s && !s.mfaVerified ? s.user : null;
}

export async function completeMfa(code: string) {
  const s = await rawSession();
  if (!s || s.mfaVerified) return { ok: false, error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' };
  const secret = s.user.totpSecret;
  if (!secret || !verifyTotp(code, secret)) {
    await audit({ id: s.user.id, role: s.user.role }, { action: 'login_fail', entity: 'auth', ref: s.user.email, label: 'รหัส 2FA ไม่ถูกต้อง', ...(await clientInfo()) });
    return { ok: false, error: 'รหัสไม่ถูกต้องหรือหมดอายุ' };
  }
  if (!s.user.totpEnabled) {
    await db.update(users).set({ totpEnabled: true }).where(eq(users.id, s.user.id));
    await audit({ id: s.user.id, role: s.user.role }, { action: 'update', entity: 'team', ref: s.user.id, label: s.user.name, changes: [{ f: '2FA', from: 'ปิด', to: 'เปิด' }] });
  }
  await db.update(sessions).set({ mfaVerified: true }).where(eq(sessions.id, s.id));
  await onLoggedIn(s.user, 'เข้าระบบ (รหัสผ่าน + 2FA)');
  return { ok: true };
}

/** Secret for first-time 2FA setup (stored but not enabled until verified) */
export async function ensureTotpSecret(u: User) {
  if (u.totpSecret && !u.totpEnabled) return u.totpSecret;
  if (u.totpEnabled) return null;
  const secret = newTotpSecret();
  await db.update(users).set({ totpSecret: secret }).where(eq(users.id, u.id));
  return secret;
}

/** Current fully-authenticated user, or null */
export async function currentUser() {
  const s = await rawSession();
  return s && s.mfaVerified ? s.user : null;
}

/** Use at the top of every admin page and server action. */
export async function requireUser(perm?: Perm) {
  const u = await currentUser();
  if (!u) redirect('/admin/login');
  if (perm && !can(u, perm)) {
    await audit({ id: u.id, role: u.role }, { action: 'denied', entity: 'auth', ref: perm, label: `ไม่มีสิทธิ์ ${perm}`, ...(await clientInfo()) });
    redirect('/admin?denied=' + perm);
  }
  return u;
}

export async function logout(reason = 'ออกจากระบบ') {
  const jar = await cookies(), token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const s = await db.query.sessions.findFirst({ where: eq(sessions.id, sha256(token)), with: { user: true } });
    await db.delete(sessions).where(eq(sessions.id, sha256(token)));
    if (s) await audit({ id: s.user.id, role: s.user.role }, { action: 'logout', entity: 'auth', label: reason });
  }
  jar.delete(SESSION_COOKIE);
}

/** Revoke every session of a user (role change, deactivation, password reset) */
export async function revokeSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function purgeExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
