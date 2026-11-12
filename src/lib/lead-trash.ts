import 'server-only';
import { eq, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { boats, customers, leads, type Lead, type User } from '@/db/schema';
import { audit } from './audit';

/**
 * Trash for leads (/admin → ลีด → ถังขยะ). "ลบ" hides the lead from the board, the dashboard and the SLA reminder;
 * restore puts it back; "ลบถาวร" deletes the lead and its activity history. After LEAD_TRASH_DAYS it is deleted automatically.
 * A WON lead (a booking that happened — needed for accounts) can't be binned: change its status first.
 * Only admins with "ดูลีดทั้งหมด" (leads_all) can bin, restore or delete leads.
 */
export const LEAD_TRASH_DAYS = 30;
const actor = (u: User) => ({ id: u.id, role: u.role });
const custName = async (l: Lead) => (await db.select({ name: customers.name }).from(customers).where(eq(customers.id, l.customerId)))[0]?.name ?? '';

export async function trashLead(l: Lead, u: User) {
  if (l.trash) return l;
  if (l.status === 'WON') throw new Error('ลีดนี้ปิดการขายแล้ว ลบไม่ได้ · ถ้าลูกค้ายกเลิก ให้เปลี่ยนสถานะก่อน');
  const [row] = await db.update(leads).set({ trash: { at: new Date().toISOString(), by: u.id, byName: u.name } }).where(eq(leads.id, l.id)).returning();
  await audit(actor(u), { action: 'delete', entity: 'lead', ref: l.ref, label: l.ref, changes: [{ f: 'ลีด', from: `${l.ref} · ${await custName(l)}`, to: 'ถังขยะ' }] });
  return row;
}

export async function restoreLead(l: Lead, u: User) {
  const [row] = await db.update(leads).set({ trash: null, updatedAt: new Date() }).where(eq(leads.id, l.id)).returning();
  await audit(actor(u), { action: 'update', entity: 'lead', ref: l.ref, label: l.ref, changes: [{ f: 'ลีด', from: 'ถังขยะ', to: 'กู้คืนแล้ว' }] });
  return row;
}

/** for good: the lead and its activities (lead_activities cascade). The customer stays. */
export async function purgeLead(l: Lead, u: User, why = 'ลบถาวรจากถังขยะ') {
  if (!l.trash) throw new Error('ย้ายลีดไปถังขยะก่อน แล้วจึงลบถาวร');
  const name = await custName(l);
  await db.delete(leads).where(eq(leads.id, l.id));
  await audit(actor(u), { action: 'delete', entity: 'lead', ref: l.ref, label: l.ref, changes: [{ f: 'ลีด', from: `${l.ref} · ${name}`, to: why }] });
}

/** leads in the trash, newest first; those older than LEAD_TRASH_DAYS are deleted for good first */
export async function leadTrash(system: User | null) {
  const rows = await db.select({ l: leads, name: customers.name, phone: customers.phone, boat: boats.name }).from(leads)
    .innerJoin(customers, eq(customers.id, leads.customerId)).leftJoin(boats, eq(boats.slug, leads.boatSlug)).where(isNotNull(leads.trash));
  const cut = Date.now() - LEAD_TRASH_DAYS * 864e5, out: typeof rows = [];
  for (const r of rows) {
    if (Date.parse(r.l.trash!.at) < cut && system) { try { await purgeLead(r.l, system, `ลบถาวรอัตโนมัติ (อยู่ในถังขยะครบ ${LEAD_TRASH_DAYS} วัน)`); continue; } catch (e) { console.error('[lead trash]', e); } }
    out.push(r);
  }
  return out.sort((a, b) => b.l.trash!.at.localeCompare(a.l.trash!.at)).map(({ l, name, phone, boat }) => ({
    ref: l.ref, name, phone, item: boat ?? l.item ?? '', date: l.tripDate ?? '', status: l.status, at: l.trash!.at, byName: l.trash!.byName,
    days: Math.max(0, LEAD_TRASH_DAYS - Math.floor((Date.now() - Date.parse(l.trash!.at)) / 864e5)),
  }));
}
