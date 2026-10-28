import 'server-only';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import { conversionEvents, customers, leadActivities, leads, users, type Customer, type Lead, type User } from '@/db/schema';
import { audit } from './audit';
import { normPhone } from './leads';

/**
 * Three safeguards for the lead system (/admin → ลีด, ลูกค้า):
 *  1. no double booking — a boat can be WON once per date and time slot (checked under a lock)
 *  2. the deal — agreed price, deposit and payments, kept with the lead (table lead_deals) so later
 *     season price changes do not change what the customer agreed to
 *  3. customer records — edit, merge two records, and delete / anonymise on a PDPA request
 */
const actor = (u: User) => ({ id: u.id, role: u.role });

/* ---------------- 1. double booking ---------------- */
/** time slot → 'full' | 'am' | 'pm' | 'sunset' | the text itself. Empty or unknown slots count as the whole day. */
export function slotKind(slot: string | null, program: string | null) {
  const s = `${slot ?? ''} ${program ?? ''}`.toLowerCase();
  if (!s.trim()) return 'full';
  if (/full|ทั้งวัน|เต็มวัน|overnight|ค้างคืน|2\s*days|day trip/.test(s)) return 'full';
  if (/sunset|ตก|เย็น|evening|dinner|1[6-9][:.]\d\d/.test(s)) return 'sunset';
  if (/บ่าย|afternoon|\bpm\b|1[2-5][:.]\d\d/.test(s)) return 'pm';
  if (/เช้า|morning|\bam\b|0?[6-9][:.]\d\d|1[01][:.]\d\d/.test(s)) return 'am';
  if (/half|ครึ่ง/.test(s)) return 'half';   // half day without a time: clashes with any half day
  return 'full';
}
const clash = (a: string, b: string) => a === 'full' || b === 'full' || a === b || (a === 'half' && b !== 'sunset') || (b === 'half' && a !== 'sunset');

export class BookingConflict extends Error { constructor(msg: string, public other: { ref: string; sales: string | null }) { super(msg); } }
/** Run `fn` (the status change) only if no other WON lead holds this boat for an overlapping slot that day. */
export async function wonGuard<T>(l: Lead, fn: () => Promise<T>, force = false): Promise<T> {
  if (!l.boatSlug || !l.tripDate || force) return fn();
  return db.transaction(async tx => {
    // one change at a time per boat + day, so two sales closing at the same moment cannot both pass
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${'won:' + l.boatSlug + ':' + l.tripDate}))`);
    const others = await tx.select({ ref: leads.ref, slot: leads.slot, program: leads.program, sales: users.name }).from(leads).leftJoin(users, eq(users.id, leads.assignedToId))
      .where(and(eq(leads.boatSlug, l.boatSlug!), eq(leads.tripDate, l.tripDate!), eq(leads.status, 'WON'), ne(leads.id, l.id)));
    const mine = slotKind(l.slot, l.program), hit = others.find(o => clash(mine, slotKind(o.slot, o.program)));
    if (hit) throw new BookingConflict(`เรือลำนี้ถูกปิดการขายไปแล้วในวันและรอบเดียวกัน (${hit.ref}${hit.sales ? ' · ' + hit.sales : ''})`, { ref: hit.ref, sales: hit.sales });
    return fn();
  });
}

/* ---------------- 2. the deal ---------------- */
export type Payment = { id: string; at: string; amount: number; method: string; note: string; by: string };
export type Deal = { price: number | null; deposit: number | null; note: string; payments: Payment[]; paid: number; balance: number | null; updatedAt: string | null; updatedBy: string };
let ready: Promise<unknown> | null = null;
const ensure = () => ready ??= db.execute(sql`create table if not exists lead_deals (lead_id text primary key references leads(id) on delete cascade, price numeric(12,2), deposit numeric(12,2), note text not null default '', payments jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now(), updated_by text not null default '')`).catch(e => { ready = null; throw e; });
type Row = { lead_id: string; price: string | null; deposit: string | null; note: string; payments: Payment[]; updated_at: Date | string; updated_by: string };
const toDeal = (r?: Row): Deal => {
  const payments = r?.payments ?? [], paid = Math.round(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0) * 100) / 100, price = r?.price == null ? null : Number(r.price);
  return { price, deposit: r?.deposit == null ? null : Number(r.deposit), note: r?.note ?? '', payments, paid, balance: price == null ? null : Math.round((price - paid) * 100) / 100, updatedAt: r ? new Date(r.updated_at).toISOString() : null, updatedBy: r?.updated_by ?? '' };
};
export async function dealsFor(ids: string[]): Promise<Record<string, Deal>> {
  await ensure(); if (!ids.length) return {};
  const r = await db.execute(sql`select * from lead_deals where lead_id in ${sql`(${sql.join(ids.map(i => sql`${i}`), sql`, `)})`}`);
  return Object.fromEntries((r.rows as Row[]).map(x => [x.lead_id, toDeal(x)]));
}
const money = (v: unknown) => { if (v === null || v === '' || v === undefined) return null; const n = Number(String(v).replace(/[,\s฿]/g, '')); if (!Number.isFinite(n) || n < 0 || n > 100_000_000) throw new Error('จำนวนเงินไม่ถูกต้อง'); return Math.round(n * 100) / 100; };
const baht = (n: number | null) => n == null ? '—' : '฿' + n.toLocaleString('en-US');
/** op: set (price / deposit / note) · pay (add a payment) · unpay (remove one) */
export async function dealOp(l: Lead, u: User, b: Record<string, unknown>) {
  await ensure();
  const cur = (await dealsFor([l.id]))[l.id] ?? toDeal(), str = (v: unknown, m: number) => (typeof v === 'string' ? v : '').trim().slice(0, m);
  let { price, deposit, note, payments } = cur; const ch: { f: string; from: string | null; to: string | null }[] = [];
  if (b.op === 'set') {
    if ('price' in b) { const p = money(b.price); if (p !== price) ch.push({ f: 'ราคาที่ตกลง', from: baht(price), to: baht(p) }); price = p; }
    if ('deposit' in b) { const d = money(b.deposit); if (d !== deposit) ch.push({ f: 'มัดจำ', from: baht(deposit), to: baht(d) }); deposit = d; }
    if ('note' in b) { const n = str(b.note, 1000); if (n !== note) ch.push({ f: 'รายละเอียดราคา', from: note.slice(0, 120) || null, to: n.slice(0, 120) || null }); note = n; }
  } else if (b.op === 'pay') {
    const amount = money(b.amount); if (!amount) throw new Error('ใส่จำนวนเงินที่ได้รับ');
    const at = /^\d{4}-\d{2}-\d{2}$/.test(str(b.at, 10)) ? str(b.at, 10) : new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    const p: Payment = { id: crypto.randomUUID().slice(0, 8), at, amount, method: str(b.method, 40) || 'โอน', note: str(b.note, 200), by: u.name };
    payments = [...payments, p].slice(-100); ch.push({ f: 'รับชำระ', from: null, to: `${baht(amount)} · ${p.method} · ${at}${p.note ? ' · ' + p.note : ''}` });
  } else if (b.op === 'unpay') {
    const p = payments.find(x => x.id === str(b.id, 20)); if (!p) throw new Error('ไม่พบรายการชำระ');
    payments = payments.filter(x => x !== p); ch.push({ f: 'ลบรายการชำระ', from: `${baht(p.amount)} · ${p.method} · ${p.at}`, to: null });
  } else throw new Error('unknown op');
  if (!ch.length) return cur;
  await db.execute(sql`insert into lead_deals (lead_id, price, deposit, note, payments, updated_at, updated_by) values (${l.id}, ${price}, ${deposit}, ${note}, ${JSON.stringify(payments)}::jsonb, now(), ${u.name})
    on conflict (lead_id) do update set price = excluded.price, deposit = excluded.deposit, note = excluded.note, payments = excluded.payments, updated_at = now(), updated_by = excluded.updated_by`);
  await db.insert(leadActivities).values({ leadId: l.id, userId: u.id, type: 'deal', data: { text: ch.map(c => `${c.f}: ${c.to ?? 'ลบ'}`).join(' · ') } });
  await audit(actor(u), { action: 'update', entity: 'lead', ref: l.ref, label: l.ref, changes: ch });
  return (await dealsFor([l.id]))[l.id];
}

/* ---------------- 3. customer records ---------------- */
const ANON = 'ลบตามคำขอ (PDPA)';
/* customers.whatsapp was added by a later migration: written with plain SQL, only when the column exists */
let hasWa: Promise<boolean> | null = null;
const waCol = () => hasWa ??= db.execute(sql`select 1 from information_schema.columns where table_name = 'customers' and column_name = 'whatsapp'`).then(r => r.rows.length > 0).catch(() => false);
const waOf = (c: Customer) => ((c as Record<string, unknown>).whatsapp as string | null | undefined) ?? null;
async function setWa(id: string, v: string | null, tx: Pick<typeof db, 'execute'> = db) { if (await waCol()) await tx.execute(sql`update customers set whatsapp = ${v} where id = ${id}`); }
/** edit name / contact details; a phone that already belongs to another customer is refused (merge instead) */
export async function customerEdit(c: Customer, u: User, b: Record<string, unknown>) {
  const s = (v: unknown, m: number) => (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().slice(0, m);
  const v = { name: s(b.name, 120) || c.name, phone: s(b.phone, 40) || c.phone, email: s(b.email, 200).toLowerCase() || null, whatsapp: s(b.wa, 30) || null, country: s(b.country, 60) || null, lang: b.lang === 'en' ? 'en' : b.lang === 'th' ? 'th' : c.lang, notes: s(b.notes, 2000) || null };
  if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) throw new Error('อีเมลไม่ถูกต้อง');
  const phoneNorm = normPhone(v.phone); if (phoneNorm.length < 6) throw new Error('เบอร์โทรไม่ถูกต้อง');
  if (phoneNorm !== c.phoneNorm) { const [dup] = await db.select({ id: customers.id, name: customers.name }).from(customers).where(and(eq(customers.phoneNorm, phoneNorm), ne(customers.id, c.id))); if (dup) throw Object.assign(new Error(`เบอร์นี้เป็นของลูกค้า “${dup.name}” อยู่แล้ว · ใช้ “รวมลูกค้า” แทน`), { dup: dup.id }); }
  const F: Record<string, string> = { name: 'ชื่อ', phone: 'เบอร์โทร', email: 'อีเมล', whatsapp: 'WhatsApp', country: 'ประเทศ', lang: 'ภาษา', notes: 'บันทึก' };
  const old: Record<string, string | null> = { name: c.name, phone: c.phone, email: c.email, whatsapp: waOf(c), country: c.country, lang: c.lang, notes: c.notes };
  const ch = (Object.keys(F) as (keyof typeof v)[]).filter(k => (old[k] ?? null) !== (v[k] ?? null)).map(k => ({ f: F[k], from: k === 'notes' ? (c.notes ? '(เดิม)' : null) : old[k] ?? null, to: k === 'notes' ? (v.notes ? '(แก้ไข)' : null) : (v[k] as string | null) ?? null }));
  if (!ch.length) return c;
  const { whatsapp, ...rest } = v;
  await db.update(customers).set({ ...rest, phoneNorm, updatedAt: new Date() }).where(eq(customers.id, c.id));
  if (whatsapp !== waOf(c)) await setWa(c.id, whatsapp);
  const [row] = await db.select().from(customers).where(eq(customers.id, c.id));
  await audit(actor(u), { action: 'update', entity: 'customer', ref: c.id, label: v.name, changes: ch });
  return row;
}
/** move every lead of `from` onto `into`, fill `into`'s empty fields, delete `from` */
export async function customerMerge(into: Customer, from: Customer, u: User) {
  if (into.id === from.id) throw new Error('เลือกลูกค้าคนละรายการ');
  const wa = waOf(into) ?? waOf(from) ?? (from.phoneNorm !== into.phoneNorm ? from.phone : null);
  const fill = { email: into.email ?? from.email, country: into.country ?? from.country,
    notes: [into.notes, from.notes].filter(Boolean).join('\n') || null, marketingConsent: into.marketingConsent || from.marketingConsent, consentAt: into.consentAt ?? from.consentAt, consentSource: into.consentSource ?? from.consentSource };
  const moved = await db.transaction(async tx => {
    const m = await tx.update(leads).set({ customerId: into.id, updatedAt: new Date() }).where(eq(leads.customerId, from.id)).returning({ id: leads.id });
    await tx.update(customers).set({ ...fill, updatedAt: new Date() }).where(eq(customers.id, into.id));
    if (wa !== waOf(into)) await setWa(into.id, wa, tx);
    await tx.delete(customers).where(eq(customers.id, from.id));
    return m.length;
  });
  await audit(actor(u), { action: 'update', entity: 'customer', ref: into.id, label: into.name, changes: [{ f: 'รวมลูกค้า', from: `${from.name} · ${from.phone}`, to: `${into.name} · ${into.phone}` }, { f: 'ลีดที่ย้ายมา', from: null, to: String(moved) }] });
  const [row] = await db.select().from(customers).where(eq(customers.id, into.id));
  return { customer: row, moved };
}
/**
 * PDPA erasure. 'anonymise' keeps the booking records (dates, boats, amounts — needed for accounts and tax)
 * but removes everything that identifies the person; 'delete' removes the customer and all of their leads
 * (only when none was WON). The audit log keeps the event itself, as the record that the request was handled.
 */
export async function customerErase(c: Customer, u: User, mode: 'anonymise' | 'delete') {
  const L = await db.select({ id: leads.id, ref: leads.ref, status: leads.status }).from(leads).where(eq(leads.customerId, c.id)), ids = L.map(l => l.id);
  if (mode === 'delete' && L.some(l => l.status === 'WON')) throw new Error('ลูกค้ารายนี้มีการจองที่ปิดการขายแล้ว · ใช้ “ลบข้อมูลส่วนบุคคล” (เก็บสถิติการจองไว้) แทน');
  await db.transaction(async tx => {
    if (mode === 'delete') {
      if (ids.length) { await tx.delete(conversionEvents).where(inArray(conversionEvents.leadId, ids)); await tx.delete(leads).where(inArray(leads.id, ids)); }
      await tx.delete(customers).where(eq(customers.id, c.id));
    } else {
      if (ids.length) {
        await tx.update(leads).set({ message: null, internalNote: null, ip: null, userAgent: null, gclid: null, fbclid: null, referrer: null, landingPage: null, firstTouch: null, updatedAt: new Date() }).where(inArray(leads.id, ids));
        await tx.update(leadActivities).set({ data: sql`jsonb_build_object('erased', true)` }).where(and(inArray(leadActivities.leadId, ids), inArray(leadActivities.type, ['note', 'outreach', 'contact'])));
        await tx.delete(conversionEvents).where(inArray(conversionEvents.leadId, ids));
      }
      await setWa(c.id, null, tx);
      await tx.update(customers).set({ name: ANON, phone: '—', phoneNorm: 'erased-' + c.id, email: null, country: null, notes: null, marketingConsent: false, consentAt: null, consentSource: null, updatedAt: new Date() }).where(eq(customers.id, c.id));
    }
  });
  await audit(actor(u), { action: 'delete', entity: 'customer', ref: c.id, label: mode === 'delete' ? 'ลบลูกค้าตามคำขอ (PDPA)' : 'ลบข้อมูลส่วนบุคคลตามคำขอ (PDPA)', changes: [{ f: 'ข้อมูลลูกค้า', from: `ลีด ${L.length} รายการ`, to: mode === 'delete' ? 'ลบทั้งหมด' : 'ลบชื่อ เบอร์ อีเมล ข้อความ · เก็บสถิติการจอง' }] });
  return { leads: L.map(l => l.ref), mode };
}
