/**
 * Create (or reset) a team member from the command line — use this for the first Super Admin.
 *   npm run user:create -- --email anan@boattripthailand.com --name ANAN --role SUPER_ADMIN
 * Prints a one-time temporary password. 2FA is set up on first login (required for Super Admin / Admin).
 */
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { eq, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as s from '../src/db/schema';
import { stableStringify } from '../src/lib/crypto';

const arg = (k: string) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : undefined; };
const sha256 = (x: string) => createHash('sha256').update(x).digest('hex');

async function main() {
  const email = (arg('email') || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const name = arg('name') || process.env.ADMIN_NAME || email.split('@')[0];
  const role = (arg('role') || 'SUPER_ADMIN') as 'SUPER_ADMIN' | 'ADMIN' | 'SALES';
  if (!email || !['SUPER_ADMIN', 'ADMIN', 'SALES'].includes(role)) throw new Error('usage: --email you@x.com --name Name --role SUPER_ADMIN|ADMIN|SALES');
  const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pw = arg('password') || Array.from(randomBytes(14), b => c[b % c.length]).join('');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema: s });
  const hash = await bcrypt.hash(pw, 12);
  const [existing] = await db.select().from(s.users).where(eq(s.users.email, email));
  let u;
  if (existing) [u] = await db.update(s.users).set({ passwordHash: hash, role, name, active: true, failedLogins: 0, lockedUntil: null, sessionVersion: existing.sessionVersion + 1 }).where(eq(s.users.id, existing.id)).returning();
  else [u] = await db.insert(s.users).values({ email, name, role, passwordHash: hash, receivesLeads: role === 'SALES', languages: ['th', 'en'] }).returning();
  // audit (CLI actor)
  const [last] = await db.select({ hash: s.auditLogs.hash }).from(s.auditLogs).orderBy(desc(s.auditLogs.id)).limit(1);
  const row = { ts: new Date(), userId: null, role: 'cli', action: existing ? 'update' : 'create', entity: 'team', ref: u.id, label: `${name} (${role}) จาก command line`, changes: [{ f: 'บทบาท', from: existing?.role ?? null, to: role }], note: null, prevHash: last?.hash ?? '0'.repeat(64) };
  await db.insert(s.auditLogs).values({ ...row, hash: sha256(stableStringify([row.ts.toISOString(), row.userId, row.role, row.action, row.entity, row.ref, row.label, row.changes, row.note, row.prevHash])) });
  await pool.end();
  console.log(`\n✓ ${existing ? 'Reset' : 'Created'} ${role}: ${email}\n  Temporary password: ${pw}\n  (shown once — change it after first login)\n`);
}
main().catch(e => { console.error(e.message || e); process.exit(1); });
