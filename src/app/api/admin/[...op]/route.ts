import { and, eq, inArray, ne } from 'drizzle-orm';
import { db } from '@/db';
import { boats, customers, leadActivities, leads, posts, redirects, seasonCalendars, settings, users, type Boat, type Lead, type User } from '@/db/schema';
import { adminBoot, leadsFor, auditList, boatToClient, CONTACT_FROM_CLIENT, LANG_FROM_CLIENT, leadClientById, permsFromClient, postToClient, ROLE_FROM_CLIENT, STATUS_FROM_CLIENT, userToClient, avatarOf } from '@/lib/admin-boot';
import { audit, verifyAuditChain } from '@/lib/audit';
import { currentUser, hashPassword, logout, passwordProblem, revokeSessions, verifyPassword } from '@/lib/auth';
import { randomDigits, tempPassword } from '@/lib/crypto';
import { canSeeLead, createLead, LOST_REASONS, setLeadStatus } from '@/lib/leads';
import { can, ROLE_LABEL, ROLE_PERMS, type Perm } from '@/lib/perms';
import { clientInfo } from '@/lib/request';
import { clearSiteCache } from '@/lib/site-render';
import { cleanHome, HOME_KEY } from '@/lib/home';
import { ACTS_KEY, cleanActivities } from '@/lib/activities';
import { cleanSeo, SEO_KEY } from '@/lib/seo';
import { analyticsData } from '@/lib/analytics';
import { googleData } from '@/lib/google';
import { pageSpeed } from '@/lib/pagespeed';
import { cleanKwRows, kwImport, kwStore } from '@/lib/seo-keywords';
import { deleteDraft, listDrafts, QuotaError, saveDraft, translate, usage as trUsage } from '@/lib/translate';
import { audienceFile, cleanMarketing, conversionStatus, MKT_KEY } from '@/lib/marketing';

/**
 * JSON API behind the admin UI (/admin). Every call: session → permission → row-level scope → write → audit.
 * The browser never decides what a user may see or change.
 */
class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }
const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
const actor = (u: User) => ({ id: u.id, role: u.role });
const str = (v: unknown, max = 500) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, max);

async function need(u: User, p: Perm) {
  if (can(u, p)) return;
  await audit(actor(u), { action: 'denied', entity: 'auth', ref: p, label: `ไม่มีสิทธิ์ ${p}`, ...(await clientInfo()) });
  throw new HttpError(403, 'ไม่มีสิทธิ์ทำรายการนี้');
}
async function leadByRef(u: User, ref: string) {
  const [l] = await db.select().from(leads).where(eq(leads.ref, ref));
  if (!l) throw new HttpError(404, 'ไม่พบลีด');
  if (!canSeeLead(u, l)) {
    await audit(actor(u), { action: 'denied', entity: 'lead', ref: l.ref, label: `พยายามแก้ลีด ${l.ref} ของคนอื่น`, ...(await clientInfo()) });
    throw new HttpError(403, 'ลีดนี้เป็นของเซลล์อื่น');
  }
  return l;
}
const leadOut = async (id: string) => json(await leadClientById(id));

/* ---------------- leads ---------------- */
async function leadOp(u: User, ref: string, op: string, b: Record<string, unknown>) {
  await need(u, 'leads');
  const l = await leadByRef(u, ref);
  const touch = (patch: Partial<Lead>) => db.update(leads).set({ ...patch, updatedAt: new Date() }).where(eq(leads.id, l.id));
  switch (op) {
    case 'status': {
      const s = STATUS_FROM_CLIENT[str(b.status)]; if (!s) throw new HttpError(400, 'สถานะไม่ถูกต้อง');
      const reason = str(b.lost) || undefined;
      if (reason && !LOST_REASONS.includes(reason)) throw new HttpError(400, 'เหตุผลไม่ถูกต้อง');
      if (s === 'LOST' && !reason && !l.lostReason) throw new HttpError(400, 'ต้องระบุเหตุผลที่ไม่สำเร็จ');
      await setLeadStatus(l, s, u, { lostReason: reason });
      if (['NEW', 'CONTACTED', 'TALKING'].includes(s) && !l.nextFollowUp && b.next) await touch({ nextFollowUp: str(b.next, 10) });
      break;
    }
    case 'lost': {
      const reason = str(b.lost);
      if (reason && !LOST_REASONS.includes(reason)) throw new HttpError(400, 'เหตุผลไม่ถูกต้อง');
      if (reason && ['NEW', 'CONTACTED', 'TALKING'].includes(l.status)) await setLeadStatus(l, 'LOST', u, { lostReason: reason });
      else if (reason !== (l.lostReason ?? '')) {
        await touch({ lostReason: reason || null });
        await audit(actor(u), { action: 'update', entity: 'lead', ref: l.ref, label: l.ref, changes: [{ f: 'เหตุผลที่ไม่สำเร็จ', from: l.lostReason, to: reason || null }] });
      }
      break;
    }
    case 'followup': {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(str(b.date)) ? str(b.date) : null;
      if (date === l.nextFollowUp) break;
      await touch({ nextFollowUp: date });
      await db.insert(leadActivities).values({ leadId: l.id, userId: u.id, type: 'followup', data: { date } });
      await audit(actor(u), { action: 'update', entity: 'lead', ref: l.ref, label: l.ref, changes: [{ f: 'นัดติดตาม', from: l.nextFollowUp, to: date }] });
      break;
    }
    case 'outreach': {
      // marketing message sent from ใช้ประโยชน์จากลีด — only to customers who agreed to receive news
      const [c] = await db.select().from(customers).where(eq(customers.id, l.customerId));
      if (!c?.marketingConsent) throw new HttpError(400, 'ลูกค้ารายนี้ไม่ได้ยินยอมรับข่าวสาร');
      const via = ['whatsapp', 'email', 'copy'].includes(str(b.via)) ? str(b.via) : 'copy';
      await db.insert(leadActivities).values({ leadId: l.id, userId: u.id, type: 'outreach', data: { via, seg: str(b.seg, 120) } });
      break;
    }
    case 'note': {
      const note = str(b.note, 5000);
      if (note === (l.internalNote ?? '')) break;
      await touch({ internalNote: note || null });
      await audit(actor(u), { action: 'update', entity: 'lead', ref: l.ref, label: l.ref, changes: [{ f: 'บันทึกภายใน', from: (l.internalNote ?? '').slice(0, 200) || null, to: note.slice(0, 200) || null }] });
      break;
    }
    case 'contact': {
      const via = ({ WhatsApp: 'whatsapp', LINE: 'line', 'โทร': 'phone', 'อีเมล': 'email' } as Record<string, string>)[str(b.via)] ?? CONTACT_FROM_CLIENT[str(b.via)] ?? 'phone';
      await db.insert(leadActivities).values({ leadId: l.id, userId: u.id, type: 'contact', data: { via } });
      if (l.status === 'NEW') await setLeadStatus(l, 'CONTACTED', u);
      break;
    }
    case 'assign': {
      await need(u, 'leads_all');
      const to = str(b.to);
      const [target] = await db.select().from(users).where(and(eq(users.id, to), eq(users.active, true)));
      if (!target) throw new HttpError(400, 'ไม่พบผู้ใช้');
      if (l.assignedToId === to) break;
      const [prev] = l.assignedToId ? await db.select({ name: users.name }).from(users).where(eq(users.id, l.assignedToId)) : [];
      await touch({ assignedToId: to });
      await db.insert(leadActivities).values({ leadId: l.id, userId: u.id, type: 'assign', data: { to: target.name } });
      await audit(actor(u), { action: 'assign', entity: 'lead', ref: l.ref, label: l.ref, changes: [{ f: 'เซลล์ผู้ดูแล', from: prev?.name ?? null, to: target.name }] });
      break;
    }
    case 'consent': {
      const on = !!b.on;
      const [c] = await db.select().from(customers).where(eq(customers.id, l.customerId));
      if (c && c.marketingConsent !== on) {
        await db.update(customers).set({ marketingConsent: on, consentAt: on ? new Date() : null, consentSource: on ? 'sales_recorded' : null, updatedAt: new Date() }).where(eq(customers.id, c.id));
        await audit(actor(u), { action: 'update', entity: 'customer', ref: c.id, label: c.name, changes: [{ f: 'ยินยอมรับข่าวสาร', from: c.marketingConsent, to: on }] });
      }
      break;
    }
    default: throw new HttpError(404, 'unknown op');
  }
  return leadOut(l.id);
}

async function newLead(u: User, b: Record<string, unknown>) {
  await need(u, 'leads');
  const name = str(b.name, 120), phone = str(b.phone, 40);
  if (!name || phone.replace(/\D/g, '').length < 6) throw new HttpError(400, 'ใส่ชื่อและเบอร์ติดต่อ');
  const boat = str(b.boat, 120), guests = Math.max(1, Math.min(200, Number(b.guests) || 2));
  const r = await createLead({
    name, phone, email: str(b.email, 200) || null, item: boat ? 'boat:' + boat : null, date: /^\d{4}-\d{2}-\d{2}$/.test(str(b.date)) ? str(b.date) : null, adults: guests,
    message: str(b.note, 2000) || null, marketingConsent: !!b.consent, lang: str(b.lang) === 'en' ? 'en' : 'th', contactVia: CONTACT_FROM_CLIENT[str(b.contact)] ?? 'whatsapp', ctx: { source: str(b.src, 20) || 'wa' },
    ...(await clientInfo()),
  }, u);
  const l = r.lead;
  if (str(b.note) && !r.duplicate) await db.update(leads).set({ internalNote: str(b.note, 5000) }).where(eq(leads.id, l.id));
  const sales = str(b.sales);
  if (sales && sales !== l.assignedToId && can(u, 'leads_all')) await leadOp(u, l.ref, 'assign', { to: sales });
  return json({ ...(await leadClientById(l.id)), duplicate: r.duplicate });
}

/* ---------------- team ---------------- */
async function superAdminsLeft(excludeId: string) {
  return (await db.select({ id: users.id }).from(users).where(and(eq(users.role, 'SUPER_ADMIN'), eq(users.active, true), ne(users.id, excludeId)))).length;
}
const isImg = (s: string) => /^(\/|https:\/\/)[^\s"'<>]+$/.test(s) || (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length < 400_000);
function teamFields(b: Record<string, unknown>, cur?: User) {
  const t = (b.t ?? {}) as Record<string, unknown>;
  const role = ROLE_FROM_CLIENT[str(t.roleKey)];
  if (!role) throw new HttpError(400, 'บทบาทไม่ถูกต้อง');
  const langs = (Array.isArray(t.langs) ? t.langs : []).map(x => LANG_FROM_CLIENT[str(x)] ?? str(x)).filter(x => ['th', 'en', 'zh', 'ru'].includes(x));
  const bi = (v: unknown) => { const o = (v ?? {}) as Record<string, unknown>; return { th: str(o.th, 600), en: str(o.en, 600) }; };
  let perms: Perm[] | null = Array.isArray(t.perms) ? permsFromClient(t.perms.map(x => str(x))).filter(p => (ROLE_PERMS.SUPER_ADMIN as string[]).includes(p)) : null;
  if (perms && JSON.stringify([...perms].sort()) === JSON.stringify([...ROLE_PERMS[role]].sort())) perms = null;
  const avatar = str(b.ava, 400_000);
  const profile = { ...(cur?.profile ?? {}), full: str(t.full, 120), title: bi(t.title), bio: bi(t.bio), wa: str(t.wa, 40), line: str(t.line, 60), showWeb: !!t.showWeb, ...(avatar && !avatar.startsWith('data:image/svg') && isImg(avatar) ? { avatar } : {}) };
  return { name: str(t.name, 80), email: str(t.email, 200).toLowerCase(), phone: str(t.tel, 40) || null, role, perms, active: t.active !== false, receivesLeads: !!t.leads, languages: langs.length ? langs : ['th'], profile };
}
const userOut = (u: User, extra: Record<string, unknown> = {}) => json({ user: userToClient(u), img: avatarOf(u), ...extra });

async function teamOp(me: User, id: string | undefined, op: string, b: Record<string, unknown>) {
  await need(me, 'team');
  const info = await clientInfo();
  if (!id) { // create
    const f = teamFields(b);
    if (!f.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) throw new HttpError(400, 'ใส่ชื่อและอีเมลให้ถูกต้อง');
    if (f.role === 'SUPER_ADMIN' && me.role !== 'SUPER_ADMIN') throw new HttpError(403, 'เฉพาะ Super Admin ที่ตั้ง Super Admin ได้');
    if ((await db.select({ id: users.id }).from(users).where(eq(users.email, f.email))).length) throw new HttpError(400, 'อีเมลนี้มีในระบบแล้ว');
    const pw = tempPassword();
    const [u] = await db.insert(users).values({ ...f, passwordHash: await hashPassword(pw) }).returning();
    await audit(actor(me), { action: 'create', entity: 'team', ref: u.id, label: `${u.name} <${u.email}>`, changes: [{ f: 'บทบาท', from: null, to: ROLE_LABEL[u.role] }], ...info });
    return userOut(u, { tempPassword: pw });
  }
  const [u] = await db.select().from(users).where(eq(users.id, id));
  if (!u) throw new HttpError(404, 'ไม่พบผู้ใช้');
  if (u.role === 'SUPER_ADMIN' && me.role !== 'SUPER_ADMIN') throw new HttpError(403, 'ไม่มีสิทธิ์แก้ Super Admin');
  if (op === 'reset') {
    const pw = tempPassword(), reset2fa = !!b.reset2fa;
    await db.update(users).set({ passwordHash: await hashPassword(pw), sessionVersion: u.sessionVersion + 1, failedLogins: 0, lockedUntil: null, ...(reset2fa ? { totpEnabled: false, totpSecret: null } : {}) }).where(eq(users.id, id));
    await revokeSessions(id);
    await audit(actor(me), { action: 'update', entity: 'team', ref: id, label: u.name, changes: [{ f: 'รหัสผ่าน', from: '•••', to: 'ตั้งใหม่ (ชั่วคราว)' }, ...(reset2fa ? [{ f: '2FA', from: 'เปิด', to: 'ต้องตั้งใหม่' }] : [])], ...info });
    return userOut(u, { tempPassword: pw });
  }
  if (op === 'transfer') {
    const to = str(b.to);
    const [target] = await db.select().from(users).where(and(eq(users.id, to), eq(users.active, true)));
    if (!target) throw new HttpError(400, 'ไม่พบผู้รับงาน');
    const moved = await db.update(leads).set({ assignedToId: to, updatedAt: new Date() }).where(and(eq(leads.assignedToId, id), inArray(leads.status, ['NEW', 'CONTACTED', 'TALKING']))).returning({ id: leads.id });
    if (moved.length) {
      await db.insert(leadActivities).values(moved.map(m => ({ leadId: m.id, userId: me.id, type: 'assign', data: { to: target.name } })));
      await audit(actor(me), { action: 'assign', entity: 'team', ref: id, label: u.name, changes: [{ f: 'โอนงานค้าง', from: `${moved.length} งาน`, to: target.name }], ...info });
    }
    return json({ moved: moved.map(m => m.id), to });
  }
  if (op === 'deactivate') {
    if (u.role === 'SUPER_ADMIN' && (await superAdminsLeft(u.id)) === 0) throw new HttpError(400, 'ต้องมี Super Admin ที่ใช้งานอยู่อย่างน้อย 1 คน');
    const open = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.assignedToId, id), inArray(leads.status, ['NEW', 'CONTACTED', 'TALKING'])));
    if (open.length) throw new HttpError(400, `มีงานค้าง ${open.length} รายการ · โอนให้คนอื่นก่อน`);
    const [n] = await db.update(users).set({ active: false, receivesLeads: false, profile: { ...u.profile, showWeb: false }, sessionVersion: u.sessionVersion + 1, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    await revokeSessions(id);
    await audit(actor(me), { action: 'delete', entity: 'team', ref: id, label: u.name, changes: [{ f: 'สถานะบัญชี', from: 'ใช้งาน', to: 'ปิด (เข้าระบบไม่ได้)' }], note: 'เซสชันทั้งหมดของผู้ใช้ถูกยกเลิก · ประวัติงานยังเก็บไว้', ...info });
    return userOut(n);
  }
  // update
  const f = teamFields(b, u);
  if (!f.name) throw new HttpError(400, 'ใส่ชื่อก่อน');
  if ((f.role === 'SUPER_ADMIN' || u.role === 'SUPER_ADMIN') && f.role !== u.role && me.role !== 'SUPER_ADMIN') throw new HttpError(403, 'เฉพาะ Super Admin ที่เปลี่ยนบทบาท Super Admin ได้');
  if (u.role === 'SUPER_ADMIN' && (f.role !== 'SUPER_ADMIN' || !f.active) && (await superAdminsLeft(u.id)) === 0) throw new HttpError(400, 'ต้องมี Super Admin ที่ใช้งานอยู่อย่างน้อย 1 คน');
  if (f.email !== u.email) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) throw new HttpError(400, 'อีเมลไม่ถูกต้อง');
    if ((await db.select({ id: users.id }).from(users).where(and(eq(users.email, f.email), ne(users.id, id)))).length) throw new HttpError(400, 'อีเมลนี้มีในระบบแล้ว');
  }
  const securityChange = f.role !== u.role || JSON.stringify(f.perms) !== JSON.stringify(u.perms?.length ? u.perms : null) || f.active !== u.active || f.email !== u.email;
  const [n] = await db.update(users).set({ ...f, updatedAt: new Date(), ...(securityChange ? { sessionVersion: u.sessionVersion + 1 } : {}) }).where(eq(users.id, id)).returning();
  if (securityChange) await revokeSessions(id);
  const pl = (p: string[] | null, r: User['role']) => (p?.length ? p : ROLE_PERMS[r]).join(', ');
  const changes = [
    ...(u.name !== n.name ? [{ f: 'ชื่อ', from: u.name, to: n.name }] : []),
    ...(u.email !== n.email ? [{ f: 'อีเมล', from: u.email, to: n.email }] : []),
    ...((u.phone ?? '') !== (n.phone ?? '') ? [{ f: 'เบอร์โทร', from: u.phone, to: n.phone }] : []),
    ...(u.role !== n.role ? [{ f: 'บทบาท', from: ROLE_LABEL[u.role], to: ROLE_LABEL[n.role] }] : []),
    ...(pl(u.perms, u.role) !== pl(n.perms, n.role) ? [{ f: 'สิทธิ์', from: pl(u.perms, u.role), to: pl(n.perms, n.role) }] : []),
    ...(u.active !== n.active ? [{ f: 'สถานะบัญชี', from: u.active ? 'ใช้งาน' : 'ปิด', to: n.active ? 'ใช้งาน' : 'ปิด' }] : []),
    ...(u.receivesLeads !== n.receivesLeads ? [{ f: 'รับลีดอัตโนมัติ', from: u.receivesLeads, to: n.receivesLeads }] : []),
    ...(u.languages.join() !== n.languages.join() ? [{ f: 'ภาษา', from: u.languages.join(', '), to: n.languages.join(', ') }] : []),
    ...(JSON.stringify(u.profile ?? {}) !== JSON.stringify(n.profile ?? {}) ? [{ f: 'โปรไฟล์บนเว็บ', from: '—', to: 'แก้ไขแล้ว' }] : []),
  ];
  if (changes.length) await audit(actor(me), { action: securityChange ? 'role' : 'update', entity: 'team', ref: id, label: n.name, changes, note: securityChange ? 'ยกเลิกเซสชันเดิมทั้งหมด สิทธิ์ใหม่มีผลทันที' : null, ...info });
  return userOut(n, { relogin: id === me.id && securityChange });
}

/* ---------------- boats / seasons / posts ---------------- */
const BOAT_LABEL: Record<string, string> = { name: 'ชื่อเรือ', subtitle: 'คำโปรย', type: 'ประเภทเรือ', ft: 'ความยาว (ฟุต)', pax: 'จำนวนคนสูงสุด', marina: 'ท่าเรือ', featured: 'เรือแนะนำ', active: 'แสดงบนเว็บ', fromPrice: 'ราคาเริ่มต้น', calendarId: 'ปฏิทินฤดูกาล', images: 'จำนวนรูป' };
function priceChanges(before: Boat['data'], after: Boat['data']) {
  const out: { f: string; from: unknown; to: unknown; kind?: string }[] = [];
  const A = after.tables ?? [], B = before.tables ?? [];
  for (let t = 0; t < Math.max(A.length, B.length); t++) {
    const a = A[t], b = B[t];
    if (!a || !b) { out.push({ f: `ตารางราคา ${t + 1}`, from: b ? b.caption || 'มี' : null, to: a ? a.caption || 'เพิ่ม' : 'ลบ', kind: 'price' }); continue; }
    for (let r = 0; r < Math.max(a.rows.length, b.rows.length); r++) for (let c = 0; c < Math.max(a.rows[r]?.length ?? 0, b.rows[r]?.length ?? 0); c++) {
      const x = b.rows[r]?.[c] ?? null, y = a.rows[r]?.[c] ?? null;
      if (x !== y) out.push({ f: `${a.rows[r]?.[0] ?? b.rows[r]?.[0] ?? 'แถว ' + (r + 1)}${c ? ' · ' + (a.columns[c] ?? b.columns[c] ?? 'คอลัมน์ ' + c) : ''}`, from: x, to: y, kind: c ? 'price' : undefined });
    }
  }
  for (const k of ['includes', 'not_included', 'complimentary', 'notes', 'time_slots', 'info'] as const) if (JSON.stringify(before[k] ?? []) !== JSON.stringify(after[k] ?? [])) out.push({ f: { includes: 'รวมในราคา', not_included: 'ไม่รวมในราคา', complimentary: 'ของแถม', notes: 'หมายเหตุ', time_slots: 'รอบเวลา', info: 'ข้อมูลเรือ' }[k], from: `${(before[k] ?? []).length} รายการ`, to: `${(after[k] ?? []).length} รายการ` });
  if (JSON.stringify(before.colmap ?? null) !== JSON.stringify(after.colmap ?? null)) out.push({ f: 'จับคู่คอลัมน์ราคากับฤดู', from: JSON.stringify(before.colmap ?? null), to: JSON.stringify(after.colmap ?? null) });
  return out.slice(0, 80);
}
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const strArr = (v: unknown, max = 600) => arr(v).map(x => str(x, max)).filter(Boolean).slice(0, 80);
function boatFromClient(c: Record<string, unknown>, cur?: Boat) {
  const slug = str(c.slug, 120).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,118}$/.test(slug)) throw new HttpError(400, 'slug ใช้ได้เฉพาะ a-z 0-9 และ -');
  const tables = arr(c.tables).slice(0, 12).map(t => { const o = (t ?? {}) as Record<string, unknown>; return { caption: str(o.caption, 200), columns: strArr(o.columns, 120), rows: arr(o.rows).slice(0, 60).map(r => arr(r).slice(0, 12).map(x => str(x, 200))) }; });
  const data: Boat['data'] & Record<string, unknown> = {
    ...(cur?.data ?? {}), tables, includes: strArr(c.includes), not_included: strArr(c.not_included), complimentary: strArr(c.complimentary), notes: strArr(c.notes),
    time_slots: arr(c.time_slots).slice(0, 20).map(r => arr(r).slice(0, 6).map(x => str(x, 120))), info: arr(c.info).slice(0, 40).map(r => arr(r).slice(0, 4).map(x => str(x, 300))),
    colmap: Array.isArray(c.colmap) ? c.colmap.slice(0, 12).map(x => (x == null ? null : str(x, 20))) : null,
  };
  if (c.i18n && typeof c.i18n === 'object' && JSON.stringify(c.i18n).length < 200_000) data.i18n = c.i18n;
  if (c.status) data.status = str(c.status, 20);
  const images = strArr(c.imgs, 2000).filter(u => /^(\/|https:\/\/)/.test(u)).slice(0, 40);
  const num = (v: unknown) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
  return { slug, name: str(c.name || c.title, 120) || slug, subtitle: str(c.subtitle, 300) || null, type: str(c.type, 20) || 'yacht', ft: num(c.ft), pax: num(c.pax) == null ? null : Math.round(num(c.pax)!), marina: str(c.marinaP || c.marina, 200) || null,
    featured: !!c.featured, active: c.active !== false && str(c.status) !== 'draft' && str(c.status) !== 'hidden', fromPrice: num(c.from_) == null ? null : Math.round(num(c.from_)!), calendarId: str(c.cal, 60) || null, data, images };
}
async function boatOp(u: User, slug: string, method: string, b: Record<string, unknown>) {
  await need(u, 'boats');
  const info = await clientInfo();
  const [cur] = await db.select().from(boats).where(eq(boats.slug, slug));
  if (method === 'DELETE') {
    if (!cur) return json({ ok: true, redirects: [] });
    // boats with leads are kept for the sales history → hide instead
    const used = await db.select({ id: leads.id }).from(leads).where(eq(leads.boatSlug, slug));
    if (used.length) throw new HttpError(409, `เรือลำนี้มีลีด ${used.length} รายการ · ลบไม่ได้เพื่อเก็บประวัติ ใช้ “ซ่อนจากเว็บ” แทน`);
    // keep Google rankings: 301 the boat page (TH + EN) → the fleet page, and repoint older redirects so there is never a chain
    const made: { from: string; to: string; code: number }[] = [];
    await db.transaction(async tx => {
      for (const pre of ['', '/en']) {
        const from = `${pre}/yacht-charter/${slug}`, to = `${pre}/yacht-charter`;
        const old = await tx.update(redirects).set({ to, code: 301 }).where(eq(redirects.to, from)).returning();
        made.push(...old.map(r => ({ from: r.from, to: r.to, code: r.code })));
        await tx.insert(redirects).values({ from, to, code: 301 }).onConflictDoUpdate({ target: redirects.from, set: { to, code: 301 } });
        made.push({ from, to, code: 301 });
      }
      await tx.delete(boats).where(eq(boats.slug, slug));
    });
    await audit(actor(u), { action: 'delete', entity: 'boat', ref: slug, label: cur.name, ...info,
      changes: [{ f: 'เรือ', from: `${cur.name} (${cur.active ? 'แสดงบนเว็บ' : 'ซ่อน'})`, to: null }, { f: 'Redirect', from: null, to: `/yacht-charter/${slug} → /yacht-charter (301)` }] });
    clearSiteCache();
    return json({ ok: true, redirects: made });
  }
  const oldSlug = str(b.oldSlug, 120);
  const [prev] = !cur && oldSlug ? await db.select().from(boats).where(eq(boats.slug, oldSlug)) : [];
  const base = cur ?? prev;
  const v = boatFromClient({ ...(b.boat as Record<string, unknown>), slug }, base);
  if (!base) {
    const [{ n }] = await db.select({ n: boats.sortOrder }).from(boats).orderBy(boats.sortOrder).limit(1).then(r => r.length ? r : [{ n: 0 }]);
    const [row] = await db.insert(boats).values({ ...v, sortOrder: (n ?? 0) - 1 }).returning();
    await audit(actor(u), { action: 'create', entity: 'boat', ref: slug, label: row.name, changes: [{ f: 'สถานะ', from: null, to: row.active ? 'แสดงบนเว็บ' : 'ซ่อน / ฉบับร่าง' }], ...info });
    clearSiteCache();
    return json({ boat: boatToClient(row) });
  }
  const changes = [
    ...(prev ? [{ f: 'URL (slug)', from: prev.slug, to: slug }] : []),
    ...Object.keys(BOAT_LABEL).filter(k => k !== 'images' && JSON.stringify(base[k as keyof Boat] ?? null) !== JSON.stringify(v[k as keyof typeof v] ?? null)).map(k => ({ f: BOAT_LABEL[k], from: base[k as keyof Boat] ?? null, to: v[k as keyof typeof v] ?? null, ...(k === 'fromPrice' ? { kind: 'price' } : {}) })),
    ...(base.images.join() !== v.images.join() ? [{ f: 'รูปภาพ', from: `${base.images.length} รูป`, to: `${v.images.length} รูป` }] : []),
    ...priceChanges(base.data, v.data),
  ];
  let row: Boat;
  if (prev) {
    if ((await db.select({ s: boats.slug }).from(boats).where(eq(boats.slug, slug))).length) throw new HttpError(400, 'slug นี้มีเรือลำอื่นใช้แล้ว');
    [row] = await db.update(boats).set({ ...v, updatedAt: new Date() }).where(eq(boats.slug, prev.slug)).returning();
    await db.update(leads).set({ boatSlug: slug }).where(eq(leads.boatSlug, prev.slug));
    // keep old links working: 301 old → new, and repoint older redirects so there is never a chain
    for (const pre of ['', '/en']) {
      const from = `${pre}/yacht-charter/${prev.slug}`, to = `${pre}/yacht-charter/${slug}`;
      await db.update(redirects).set({ to }).where(eq(redirects.to, from));
      await db.insert(redirects).values({ from, to, code: 301 }).onConflictDoUpdate({ target: redirects.from, set: { to } });
      await db.delete(redirects).where(eq(redirects.from, to));
    }
  } else [row] = await db.update(boats).set({ ...v, updatedAt: new Date() }).where(eq(boats.slug, slug)).returning();
  if (changes.length) { await audit(actor(u), { action: 'update', entity: 'boat', ref: slug, label: row.name, changes, note: str(b.note, 200) || null, ...info }); clearSiteCache(); }
  return json({ boat: boatToClient(row), changes: changes.length });
}

async function seasonOp(u: User, id: string, method: string, b: Record<string, unknown>) {
  await need(u, 'boats');
  if (!/^[\w-]{1,60}$/.test(id)) throw new HttpError(400, 'รหัสปฏิทินไม่ถูกต้อง');
  const [cur] = await db.select().from(seasonCalendars).where(eq(seasonCalendars.id, id));
  if (method === 'DELETE') {
    if (cur) { await db.delete(seasonCalendars).where(eq(seasonCalendars.id, id)); await db.update(boats).set({ calendarId: null }).where(eq(boats.calendarId, id)); await audit(actor(u), { action: 'delete', entity: 'season', ref: id, label: cur.name }); clearSiteCache(); }
    return json({ ok: true });
  }
  const c = (b.cal ?? {}) as Record<string, unknown>;
  const md = (x: unknown) => /^\d{2}-\d{2}$/.test(str(x)) ? str(x) : null;
  // special dates may repeat every year (MM-DD) or be one-off (YYYY-MM-DD, e.g. Chinese New Year)
  const day = (x: unknown) => /^(\d{4}-)?\d{2}-\d{2}$/.test(str(x)) ? str(x) : null;
  const ranges: Record<string, [string, string][]> = {};
  for (const [k, v] of Object.entries((c.ranges ?? {}) as Record<string, unknown>)) if (/^\w{1,20}$/.test(k)) ranges[k] = arr(v).map(r => [md(arr(r)[0]), md(arr(r)[1])]).filter((r): r is [string, string] => !!r[0] && !!r[1]).slice(0, 20);
  const special = arr(c.special).slice(0, 60).map(s => { const o = (s ?? {}) as Record<string, unknown>; return { from: day(o.from) ?? '', to: day(o.to) ?? '', label: str(o.label, 80) }; }).filter(s => s.from && s.to && s.from.length === s.to.length);
  const v = { id, name: str(c.name, 80) || id, kind: str(c.kind) === 'season' ? 'season' : 'allyear', ranges, special, add: Math.max(0, Math.round(Number(c.add) || 0)), addHalf: Math.max(0, Math.round(Number(c.addHalf) || 0)) };
  if (cur) await db.update(seasonCalendars).set(v).where(eq(seasonCalendars.id, id)); else await db.insert(seasonCalendars).values(v);
  const ch = cur ? (['name', 'ranges', 'special', 'add', 'addHalf'] as const).filter(k => JSON.stringify(cur[k]) !== JSON.stringify(v[k])).map(k => ({ f: { name: 'ชื่อปฏิทิน', ranges: 'ช่วงวันที่ของแต่ละฤดู', special: 'วันพิเศษ', add: 'บวกเพิ่มวันพิเศษ', addHalf: 'บวกเพิ่มวันพิเศษ (Half day)' }[k], from: k === 'name' || k === 'add' || k === 'addHalf' ? cur[k] : JSON.stringify(cur[k]), to: k === 'name' || k === 'add' || k === 'addHalf' ? v[k] : JSON.stringify(v[k]), kind: k === 'add' || k === 'addHalf' ? 'price' : undefined })) : [{ f: 'ปฏิทิน', from: null, to: v.name }];
  // boat ↔ calendar assignment sent along with the calendar
  const assign = (b.boats ?? {}) as Record<string, string>;
  for (const [slug, cal] of Object.entries(assign).slice(0, 200)) await db.update(boats).set({ calendarId: str(cal, 60) || null }).where(and(eq(boats.slug, slug), ne(boats.calendarId, str(cal, 60) || '__none__')));
  if (ch.length) await audit(actor(u), { action: cur ? 'update' : 'create', entity: 'season', ref: id, label: v.name, changes: ch });
  clearSiteCache();
  return json({ ok: true });
}

async function postOp(u: User, id: number, b: Record<string, unknown>) {
  await need(u, 'content');
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'รหัสบทความไม่ถูกต้อง');
  const a = (b.post ?? {}) as Record<string, unknown>;
  const bi = (v: unknown, max = 2000) => { const o = (v ?? {}) as Record<string, unknown>; return { th: str(o.th, max), en: str(o.en, max) }; };
  const slug = bi(a.slug, 300), title = bi(a.title, 300);
  const blocks = (a.blocks ?? {}) as Record<string, unknown>;
  const v = {
    id, slugTh: slug.th || null, slugEn: slug.en || null, category: str(a.cat, 40) || 'guide', date: new Date((/^\d{4}-\d{2}-\d{2}$/.test(str(a.date)) ? str(a.date) : new Date().toISOString().slice(0, 10)) + 'T03:00:00Z'),
    cover: /^(\/|https:\/\/)/.test(str(a.cover, 2000)) ? str(a.cover, 2000) : null, title, excerpt: bi(a.excerpt, 1000), seoTitle: bi(a.seoT, 200), seoDesc: bi(a.seoD, 400),
    keywords: [str((a.kw as Record<string, unknown>)?.th, 120), str((a.kw as Record<string, unknown>)?.en, 120)].join(', '),
    blocks: { th: arr(blocks.th).slice(0, 400), en: arr(blocks.en).slice(0, 400) } as Exclude<typeof posts.$inferInsert['blocks'], undefined>,
    published: str(a.status) === 'published',
  };
  if (JSON.stringify(v.blocks).length > 2_000_000) throw new HttpError(400, 'บทความใหญ่เกินไป (รูปที่อัปโหลดต้องอยู่ในคลังสื่อ)');
  for (const k of ['slugTh', 'slugEn'] as const) if (v[k]) { const [dup] = await db.select({ id: posts.id }).from(posts).where(and(eq(posts[k], v[k]!), ne(posts.id, id))); if (dup) throw new HttpError(400, `URL "${v[k]}" ซ้ำกับบทความอื่น`); }
  const [cur] = await db.select().from(posts).where(eq(posts.id, id));
  const [row] = cur ? await db.update(posts).set({ ...v, updatedAt: new Date() }).where(eq(posts.id, id)).returning() : await db.insert(posts).values(v).returning();
  const ch = !cur ? [{ f: 'บทความ', from: null, to: title.th || title.en }] : [
    ...(cur.published !== v.published ? [{ f: 'สถานะ', from: cur.published ? 'เผยแพร่' : 'ร่าง', to: v.published ? 'เผยแพร่' : 'ร่าง' }] : []),
    ...(JSON.stringify(cur.title) !== JSON.stringify(title) ? [{ f: 'ชื่อเรื่อง', from: cur.title.th || cur.title.en, to: title.th || title.en }] : []),
    ...(cur.slugTh !== v.slugTh || cur.slugEn !== v.slugEn ? [{ f: 'URL', from: `${cur.slugTh ?? ''} / ${cur.slugEn ?? ''}`, to: `${v.slugTh ?? ''} / ${v.slugEn ?? ''}` }] : []),
    ...(JSON.stringify(cur.blocks) !== JSON.stringify(v.blocks) ? [{ f: 'เนื้อหา', from: '—', to: 'แก้ไขแล้ว' }] : []),
    ...(JSON.stringify([cur.seoTitle, cur.seoDesc]) !== JSON.stringify([v.seoTitle, v.seoDesc]) ? [{ f: 'SEO title / description', from: '—', to: 'แก้ไขแล้ว' }] : []),
  ];
  // content edits are autosaved: only log a new entry when something other than body text changed, or on publish state change
  const significant = ch.filter(c => c.f !== 'เนื้อหา');
  if (significant.length || b.explicit) await audit(actor(u), { action: !cur ? 'create' : cur.published !== v.published && v.published ? 'publish' : 'update', entity: 'article', ref: String(id), label: title.th || title.en || `#${id}`, changes: ch });
  if (cur?.published || v.published) clearSiteCache();
  return json({ post: postToClient(row) });
}

/* ---------------- router ---------------- */
async function handle(req: Request, params: Promise<{ op: string[] }>) {
  const { op } = await params;
  const [a, b0, c0] = op, method = req.method;
  const me = await currentUser();
  if (!me) return json({ error: 'หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่', login: true }, 401);
  let body: Record<string, unknown> = {};
  if (method !== 'GET') {
    // same-origin only (cookies are SameSite=Lax; this blocks cross-site form posts too)
    const origin = req.headers.get('origin'), host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (origin && host && new URL(origin).host !== host) return json({ error: 'bad origin' }, 403);
    try { body = (await req.json()) ?? {}; } catch { body = {}; }
  }
  try {
    if (a === 'boot' && method === 'GET') return json(await adminBoot(me));
    if (a === 'translate') {   // auto-translate (Google) with a monthly character cap — src/lib/translate.ts
      if (!can(me, 'content') && !can(me, 'boats')) throw new HttpError(403, 'ไม่มีสิทธิ์ใช้ระบบแปล');
      if (!b0 && method === 'GET') return json(await trUsage());
      if (b0 === 'drafts' && !c0 && method === 'GET') return json({ drafts: await listDrafts() });
      if (b0 === 'drafts' && method === 'POST') {
        const id = str(body.id, 20), lang = str(body.lang, 5);
        if (!/^\d+$/.test(id) || !/^(th|en|ru|zh)$/.test(lang)) throw new HttpError(400, 'ข้อมูลไม่ถูกต้อง');
        if (c0 === 'delete') await deleteDraft('article', id, lang);
        else { if (JSON.stringify(body.value ?? null).length > 1_500_000) throw new HttpError(400, 'ใหญ่เกินไป'); await saveDraft('article', id, lang, body.value ?? {}); }
        return json({ ok: true });
      }
      if (!b0 && method === 'POST') {
        const texts = Array.isArray(body.texts) ? body.texts.map(t => (typeof t === 'string' ? t : '')).slice(0, 3000) : [];
        const from = str(body.from, 5), to = str(body.to, 5), what = str(body.what, 120) || 'แปลอัตโนมัติ';
        if (!/^(th|en|ru|zh)$/.test(from) || !/^(th|en|ru|zh)$/.test(to) || from === to) throw new HttpError(400, 'ภาษาไม่ถูกต้อง');
        if (texts.join('').length > 150_000) throw new HttpError(400, 'ข้อความยาวเกินไปสำหรับการแปลครั้งเดียว');
        try {
          const r = await translate(texts, from, to, { html: body.html === true, user: me.name, what });
          if (r.chars) await audit(actor(me), { action: 'update', entity: 'translate', ref: what, label: `แปลอัตโนมัติ ${from.toUpperCase()} → ${to.toUpperCase()} · ${what}`, changes: [{ f: 'ตัวอักษรที่ใช้', from: null, to: r.chars.toLocaleString() }] });
          return json({ out: r.out, chars: r.chars, usage: await trUsage() });
        } catch (e) {
          if (e instanceof QuotaError) throw new HttpError(429, e.message);
          throw new HttpError(502, 'แปลไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e)));
        }
      }
    }
    if (a === 'analytics' && b0 === 'pagespeed' && method === 'GET') { await need(me, 'seo'); const q = new URL(req.url).searchParams; return json(await pageSpeed(q.get('strategy') === 'desktop' ? 'desktop' : 'mobile', q.get('refresh') === '1')); }
    if (a === 'analytics' && b0 === 'google' && method === 'GET') { await need(me, 'seo'); const q = new URL(req.url).searchParams, d = Number(q.get('days')); return json(await googleData([1, 7, 28, 90].includes(d) ? d : 1, q.get('refresh') === '1')); }
    if (a === 'analytics' && method === 'GET') { await need(me, 'seo'); const d = Number(new URL(req.url).searchParams.get('days')); return json(await analyticsData([1, 7, 28, 90].includes(d) ? d : 1)); }
    if (a === 'leads' && !b0 && method === 'GET') { await need(me, 'leads'); return json(await leadsFor(me)); }
    if (a === 'audit' && !b0 && method === 'GET') { await need(me, 'audit'); return json({ audit: await auditList() }); }
    if (a === 'audit' && b0 === 'verify') { await need(me, 'audit'); const r = await verifyAuditChain(); await audit(actor(me), { action: 'update', entity: 'auth', ref: 'audit', label: `ตรวจสอบสายบันทึก ${r.total} รายการ · ${r.bad.length ? 'พบ ' + r.bad.length + ' รายการไม่ตรง' : 'ไม่พบการแก้ไขย้อนหลัง'}` }); return json(r); }
    if (a === 'audit' && b0 === 'client' && method === 'POST') {
      // a few events only the browser knows about (client-side exports, denied clicks)
      const act = str(body.act, 20); if (!['export', 'denied'].includes(act)) throw new HttpError(400, 'bad event');
      await audit(actor(me), { action: act, entity: str(body.ent, 20) || 'auth', ref: str(body.ref, 120) || null, label: str(body.label, 300) || act, changes: arr(body.changes).slice(0, 10).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { f: str(o.f, 80), from: str(o.from, 200), to: str(o.to, 200) }; }), note: 'บันทึกจากหน้าจอผู้ใช้', ...(await clientInfo()) });
      return json({ ok: true });
    }
    if (a === 'logout' && method === 'POST') { await logout(str(body.reason) === 'timeout' ? 'ไม่มีการใช้งาน 30 นาที · ออกจากระบบอัตโนมัติ' : 'ออกจากระบบ'); return json({ ok: true }); }
    if (a === 'leads' && !b0 && method === 'POST') return await newLead(me, body);
    if (a === 'leads' && b0 && c0 && method === 'POST') return await leadOp(me, decodeURIComponent(b0), c0, body);
    if (a === 'users') {
      if (!b0 && method === 'POST') return await teamOp(me, undefined, 'create', body);
      if (b0 && (method === 'PUT' || method === 'POST')) return await teamOp(me, b0, c0 ?? 'update', body);
    }
    if (a === 'boats' && b0 && (method === 'PUT' || method === 'DELETE')) return await boatOp(me, decodeURIComponent(b0), method, body);
    if (a === 'seasons' && b0 && (method === 'PUT' || method === 'DELETE')) return await seasonOp(me, b0, method, body);
    if (a === 'posts' && b0 && method === 'PUT') return await postOp(me, Number(b0), body);
    if (a === 'settings' && b0 === 'seo' && method === 'PUT') {
      // SEO centre: page meta, robots/canonical, robots.txt, llms.txt, sitemap, verification codes
      await need(me, 'seo');
      const v = cleanSeo(body.value);
      await db.insert(settings).values({ key: SEO_KEY, value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } });
      clearSiteCache();
      const changes = arr(body.changes).slice(0, 30).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { f: str(o.f, 120), from: str(o.from, 300), to: str(o.to, 300) }; });
      if (changes.length) await audit(actor(me), { action: 'update', entity: 'settings', ref: 'seo', label: 'ตั้งค่า SEO', changes });
      return json({ seo: v });
    }
    if (a === 'redirects' && (b0 === 'save' || b0 === 'delete') && method === 'POST') {
      // stored like the WordPress import: decoded path, no trailing slash — the form middleware looks up
      await need(me, 'seo');
      const path = (x: unknown) => { let p = str(x, 500).replace(/^https?:\/\/[^/]+/i, ''); try { p = decodeURIComponent(p); } catch { /* keep */ } p = p.split('#')[0].split('?')[0].replace(/\/+$/, ''); return p.startsWith('/') ? p : p ? '/' + p : '/'; };
      const from = path(body.from);
      if (from === '/' || from.startsWith('/admin') || from.startsWith('/api')) throw new HttpError(400, 'URL เดิมไม่ถูกต้อง');
      const [cur] = await db.select().from(redirects).where(eq(redirects.from, from));
      if (b0 === 'delete') {
        if (cur) { await db.delete(redirects).where(eq(redirects.from, from)); await audit(actor(me), { action: 'delete', entity: 'redirect', ref: from, label: `ลบ redirect ${from}`, changes: [{ f: from, from: `${cur.code} → ${cur.to}`, to: null }] }); }
        return json({ ok: true });
      }
      const code = [301, 302, 410].includes(Number(body.code)) ? Number(body.code) : 301;
      const toRaw = str(body.to, 1000), to = code === 410 ? '' : /^https:\/\//.test(toRaw) ? toRaw : path(toRaw);
      if (code !== 410 && (!to || to === from)) throw new HttpError(400, 'ใส่ URL ปลายทาง');
      await db.insert(redirects).values({ from, to, code }).onConflictDoUpdate({ target: redirects.from, set: { to, code } });
      await audit(actor(me), { action: cur ? 'update' : 'create', entity: 'redirect', ref: from, label: `redirect ${from}`, changes: [{ f: from, from: cur ? `${cur.code} → ${cur.to}` : null, to: code === 410 ? '410 (ลบแล้ว)' : `${code} → ${to}` }] });
      return json({ redirect: { from, to, code, hits: cur?.hits ?? 0 } });
    }
    if (a === 'marketing') {
      // ใช้ประโยชน์จากลีด: conversion log, consent-only hashed audience files
      if (b0 === 'status' && method === 'GET') { await need(me, 'marketing'); return json(await conversionStatus()); }
      if (b0 === 'audience' && method === 'POST') {
        await need(me, 'marketing'); await need(me, 'export');
        const platform = body.platform === 'google' ? 'google' : 'meta', ids = arr(body.ids).map(x => str(x, 64)).filter(Boolean);
        const r = await audienceFile(ids, platform);
        await audit(actor(me), { action: 'export', entity: 'customer', ref: str(body.seg, 40) || 'segment', label: `ไฟล์กลุ่มเป้าหมาย “${str(body.label, 120) || 'กลุ่มที่สร้างเอง'}” สำหรับ ${platform === 'google' ? 'Google Customer Match' : 'Meta Custom Audience'} · ${r.count} คน (เข้ารหัส SHA-256, เฉพาะคนที่ยินยอม)`, ...(await clientInfo()) });
        return json(r);
      }
    }
    if (a === 'settings' && b0 === 'marketing' && method === 'PUT') {
      await need(me, 'marketing');
      const v = cleanMarketing(body.value);
      await db.insert(settings).values({ key: MKT_KEY, value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } });
      const changes = arr(body.changes).slice(0, 30).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { f: str(o.f, 120), from: str(o.from, 300), to: str(o.to, 300) }; });
      if (changes.length) await audit(actor(me), { action: 'update', entity: 'settings', ref: 'marketing', label: str(body.label, 200) || 'ตั้งค่าใช้ประโยชน์จากลีด', changes });
      return json({ mkt: v });
    }
    if (a === 'settings' && b0 === 'activities' && method === 'PUT') {
      // activities & tours — live on the public site immediately
      await need(me, 'content');
      let v; try { v = cleanActivities(body.value); } catch { throw new HttpError(400, 'ข้อมูลกิจกรรมไม่ถูกต้อง'); }
      if (JSON.stringify(v).length > 1_500_000) throw new HttpError(400, 'ข้อมูลกิจกรรมใหญ่เกินไป');
      await db.insert(settings).values({ key: ACTS_KEY, value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } });
      clearSiteCache();
    }
    if (a === 'settings' && b0 === 'keywords' && method === 'GET') { await need(me, 'seo'); return json(await kwStore()); }
    if (a === 'settings' && b0 === 'keywords' && method === 'PUT') {
      // ศูนย์ SEO → คีย์เวิร์ด: rankings from a Search Console export (Queries.csv)
      await need(me, 'seo');
      const rows = cleanKwRows(body.rows); if (!rows.length) throw new HttpError(400, 'ไม่พบคีย์เวิร์ดในไฟล์');
      const file = str(body.file, 120), v = await kwImport(rows, file, me.name);
      await audit(actor(me), { action: 'update', entity: 'settings', ref: 'seo-keywords', label: 'นำเข้าอันดับคีย์เวิร์ด', changes: [{ f: 'คีย์เวิร์ด', from: v.prev ? `${v.prev.rows.length} คำ` : null, to: `${rows.length} คำ${file ? ` (${file})` : ''}` }] });
      return json(v);
      const changes = arr(body.changes).slice(0, 30).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { f: str(o.f, 120), from: str(o.from, 300), to: str(o.to, 300) }; });
      if (changes.length) await audit(actor(me), { action: 'update', entity: 'settings', ref: 'activities', label: str(body.label, 200) || 'แก้ไขกิจกรรม & ทัวร์', changes });
      return json({ acts: v });
    }
    if (a === 'settings' && b0 === 'home' && method === 'PUT') {
      // homepage content (เนื้อหาเว็บไซต์) — goes live on the public site immediately
      await need(me, 'content');
      const v = cleanHome(body.value);
      await db.insert(settings).values({ key: HOME_KEY, value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } });
      clearSiteCache();
      const changes = arr(body.changes).slice(0, 30).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { f: str(o.f, 80), from: str(o.from, 300), to: str(o.to, 300) }; });
      await audit(actor(me), { action: 'update', entity: 'settings', ref: 'home', label: 'เผยแพร่เนื้อหาหน้าแรก', changes: changes.length ? changes : [{ f: 'เนื้อหาหน้าแรก', from: null, to: 'เผยแพร่แล้ว' }] });
      return json({ home: v });
    }
    if (a === 'settings' && b0 === 'sitecfg' && method === 'PUT') {
      await need(me, 'settings');
      const v = body.value; if (!v || typeof v !== 'object' || JSON.stringify(v).length > 600_000) throw new HttpError(400, 'ข้อมูลไม่ถูกต้อง');
      const [cur] = await db.select().from(settings).where(eq(settings.key, 'admin.sitecfg'));
      await db.insert(settings).values({ key: 'admin.sitecfg', value: v }).onConflictDoUpdate({ target: settings.key, set: { value: v } });
      clearSiteCache();   // contact & brand details show on the public site
      const changes = arr(body.changes).slice(0, 30).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { f: str(o.f, 80), from: str(o.from, 300), to: str(o.to, 300) }; });
      await audit(actor(me), { action: 'update', entity: 'settings', ref: 'site', label: 'ตั้งค่าเว็บไซต์', changes: changes.length ? changes : [{ f: 'ตั้งค่า', from: cur ? 'เดิม' : null, to: 'บันทึกแล้ว' }] });
      return json({ ok: true });
    }
    if (a === 'me') {
      if (b0 === 'password' && method === 'POST') {
        if (!(await verifyPassword(str(body.current, 200), me.passwordHash))) throw new HttpError(400, 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
        const pw = str(body.password, 200), p = passwordProblem(pw); if (p) throw new HttpError(400, p);
        await db.update(users).set({ passwordHash: await hashPassword(pw), updatedAt: new Date() }).where(eq(users.id, me.id));
        await audit(actor(me), { action: 'update', entity: 'team', ref: me.id, label: me.name, changes: [{ f: 'รหัสผ่าน', from: '•••', to: 'เปลี่ยนแล้ว' }], ...(await clientInfo()) });
        return json({ ok: true });
      }
      if (b0 === 'line-code' && method === 'POST') {
        let code = randomDigits(6);
        while ((await db.select({ id: users.id }).from(users).where(eq(users.lineLinkCode, code))).length) code = randomDigits(6);
        await db.update(users).set({ lineLinkCode: code }).where(eq(users.id, me.id));
        return json({ code });
      }
      if (b0 === 'line-unlink' && method === 'POST') {
        await db.update(users).set({ lineUserId: null, lineLinkCode: null }).where(eq(users.id, me.id));
        await audit(actor(me), { action: 'update', entity: 'team', ref: me.id, label: me.name, changes: [{ f: 'LINE', from: 'เชื่อมแล้ว', to: 'ยกเลิก' }] });
        return json({ ok: true });
      }
      if (b0 === 'line' && method === 'GET') { const [u] = await db.select({ l: users.lineUserId, c: users.lineLinkCode }).from(users).where(eq(users.id, me.id)); return json({ linked: !!u?.l, code: u?.c ?? null }); }
    }
    return json({ error: 'not found' }, 404);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error('[admin api]', e);
    return json({ error: e instanceof Error && /ต้องระบุ/.test(e.message) ? e.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, 500);
  }
}
type Ctx = { params: Promise<{ op: string[] }> };
export const GET = (req: Request, ctx: Ctx) => handle(req, ctx.params);
export const POST = (req: Request, ctx: Ctx) => handle(req, ctx.params);
export const PUT = (req: Request, ctx: Ctx) => handle(req, ctx.params);
export const DELETE = (req: Request, ctx: Ctx) => handle(req, ctx.params);
export const dynamic = 'force-dynamic';
