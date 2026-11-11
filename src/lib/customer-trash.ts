import 'server-only';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { customers, leads, type Customer, type User } from '@/db/schema';
import { audit } from './audit';
import { customerErase } from './lead-guard';

/**
 * Trash for customers (/admin → ลูกค้า → ถังขยะ).
 * "ลบ" moves a customer here first: the row and their leads stay in the database, but they are hidden from the
 * customer list and the lead board. Restore puts everything back; "ลบถาวร" deletes the customer and their leads
 * (lead-guard customerErase 'delete'). After TRASH_DAYS a customer is deleted for good automatically.
 * A customer with a WON lead (a booking that happened — needed for accounts) can't be trashed: use the PDPA erase.
 * A trashed customer who sends a new booking request comes back on their own (lib/leads.ts createLead).
 */
export const CUST_TRASH_DAYS = 30;
const actor = (u: User) => ({ id: u.id, role: u.role });
const leadCount = async (id: string) => (await db.select({ n: sql<number>`count(*)::int` }).from(leads).where(eq(leads.customerId, id)))[0]?.n ?? 0;

export async function trashCustomer(c: Customer, u: User) {
  if (c.trash) return c;
  const [won] = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.customerId, c.id), eq(leads.status, 'WON'))).limit(1);
  if (won) throw new Error('ลูกค้ารายนี้มีการจองที่ปิดการขายแล้ว ลบไม่ได้ · ถ้าลูกค้าขอให้ลบข้อมูล ใช้ “ลบข้อมูลส่วนบุคคล (PDPA)”');
  const n = await leadCount(c.id);
  const [row] = await db.update(customers).set({ trash: { at: new Date().toISOString(), by: u.id, byName: u.name, leads: n } }).where(eq(customers.id, c.id)).returning();
  await audit(actor(u), { action: 'delete', entity: 'customer', ref: c.id, label: c.name, changes: [{ f: 'ลูกค้า', from: `${c.name} · ${c.phone}`, to: `ถังขยะ (ลีด ${n} รายการ)` }] });
  return row;
}

export async function restoreCustomer(c: Customer, u: User) {
  const [row] = await db.update(customers).set({ trash: null, updatedAt: new Date() }).where(eq(customers.id, c.id)).returning();
  await audit(actor(u), { action: 'update', entity: 'customer', ref: c.id, label: c.name, changes: [{ f: 'ลูกค้า', from: 'ถังขยะ', to: 'กู้คืนแล้ว' }] });
  return row;
}

/** for good: the customer and every lead of theirs */
export async function purgeCustomer(c: Customer, u: User) {
  if (!c.trash) throw new Error('ย้ายลูกค้าไปถังขยะก่อน แล้วจึงลบถาวร');
  return customerErase(c, u, 'delete', `ลบถาวรจากถังขยะ · ${c.name}`);
}

/** customers in the trash, newest first; those older than CUST_TRASH_DAYS are deleted for good first */
export async function customerTrash(system: User | null) {
  const rows = await db.select().from(customers).where(isNotNull(customers.trash));
  const cut = Date.now() - CUST_TRASH_DAYS * 864e5, out: Customer[] = [];
  for (const c of rows) {
    if (Date.parse(c.trash!.at) < cut && system) { try { await customerErase(c, system, 'delete', `ลบถาวรอัตโนมัติ (อยู่ในถังขยะครบ ${CUST_TRASH_DAYS} วัน) · ${c.name}`); continue; } catch { /* a lead was WON since: keep it listed */ } }
    out.push(c);
  }
  return out.sort((a, b) => b.trash!.at.localeCompare(a.trash!.at)).map(c => ({
    id: c.id, name: c.name, phone: c.phone, email: c.email ?? '', at: c.trash!.at, byName: c.trash!.byName, leads: c.trash!.leads,
    days: Math.max(0, CUST_TRASH_DAYS - Math.floor((Date.now() - Date.parse(c.trash!.at)) / 864e5)),
  }));
}
