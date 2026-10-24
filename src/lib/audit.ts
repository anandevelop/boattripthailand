import { desc, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { db } from '@/db';
import { auditLogs, type AuditChange } from '@/db/schema';
import { sha256, stableStringify } from './crypto';

type Actor = { id: string; role: string } | null;
export type AuditInput = { action: string; entity: string; ref?: string | null; label: string; changes?: AuditChange[]; note?: string | null; ip?: string | null; userAgent?: string | null };

/** Canonical string that the hash covers (keep stable — used by verifyAuditChain) */
const canon = (r: { ts: Date; userId: string | null; role: string | null; action: string; entity: string; ref: string | null; label: string; changes: unknown; note: string | null; prevHash: string }) =>
  stableStringify([r.ts.toISOString(), r.userId, r.role, r.action, r.entity, r.ref, r.label, r.changes, r.note, r.prevHash]);

/**
 * Append an entry to the hash-chained audit log.
 * Serialised with a transaction-level advisory lock so the chain never forks.
 */
export async function audit(actor: Actor, a: AuditInput, tx?: typeof db) {
  if (a.ip === undefined) { try { const h = await headers(); a = { ...a, ip: (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip'), userAgent: a.userAgent ?? h.get('user-agent') }; } catch { /* outside a request (jobs, scripts) */ } }
  const run = async (t: typeof db) => {
    await t.execute(sql`select pg_advisory_xact_lock(424242)`);
    const [last] = await t.select({ hash: auditLogs.hash }).from(auditLogs).orderBy(desc(auditLogs.id)).limit(1);
    const row = { ts: new Date(), userId: actor?.id ?? null, role: actor?.role ?? null, action: a.action, entity: a.entity, ref: a.ref ?? null, label: a.label, changes: JSON.parse(JSON.stringify(a.changes ?? [])) as AuditChange[], note: a.note ?? null, prevHash: last?.hash ?? '0'.repeat(64) };
    await t.insert(auditLogs).values({ ...row, ip: a.ip ?? null, userAgent: a.userAgent ?? null, hash: sha256(canon(row)) });
  };
  return tx ? run(tx) : db.transaction(t => run(t as unknown as typeof db));
}

export async function verifyAuditChain() {
  const rows = await db.select().from(auditLogs).orderBy(auditLogs.id);
  let prev = '0'.repeat(64);
  const bad: number[] = [];
  for (const r of rows) {
    if (r.prevHash !== prev || sha256(canon({ ...r, changes: r.changes })) !== r.hash) bad.push(r.id);
    prev = r.hash;
  }
  return { total: rows.length, bad };
}

/** before → after diff for flat objects */
export function diff(before: Record<string, unknown>, after: Record<string, unknown>, labels: Record<string, string> = {}): AuditChange[] {
  return Object.keys(after).filter(k => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null)).map(k => ({ f: labels[k] ?? k, from: before[k] ?? null, to: after[k] ?? null }));
}
