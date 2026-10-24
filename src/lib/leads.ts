import 'server-only';
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { boats, customers, leadActivities, leads, settings, users, type Lead, type User } from '@/db/schema';
import { audit } from './audit';
import { randomDigits } from './crypto';
import { leadCard, lineEnabled, pushLine, text } from './line';
import { marketingConfig } from './marketing';
import { sendMetaEvent } from './meta';
import { can } from './perms';
import { SCORE_LABEL, SOURCE_LABEL, STATUS_LABEL, scoreLead, type LeadStatus } from './lead-meta';
import { surchargeWarning } from './surcharge';

export * from './lead-meta';

export const appUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
export const normPhone = (p: string) => { let d = p.replace(/\D/g, ''); if (d.startsWith('0') && d.length === 10) d = '66' + d.slice(1); return d; };
const ymd = (d = new Date()) => d.toISOString().slice(2, 10).replace(/-/g, '');

export type LeadInput = {
  name: string; phone: string; email?: string | null; item?: string | null; program?: string | null; date?: string | null; adults?: number; children?: number; slot?: string | null; message?: string | null;
  marketingConsent?: boolean; lang?: string; contactVia?: string;
  ctx?: { source?: string; medium?: string; campaign?: string; content?: string; gclid?: string; fbclid?: string; referrer?: string; landing_page?: string; first_touch?: unknown; pages_viewed?: number; visits?: number; returning?: boolean; boats_viewed?: string[]; device?: string; event_id?: string; current_page?: string };
  ip?: string | null; userAgent?: string | null;
};

/** Pick the next sales person: active, receives leads, speaks the customer's language when possible. */
async function nextAssignee(lang: string, tx: typeof db) {
  const pool = await tx.select().from(users).where(and(eq(users.active, true), eq(users.receivesLeads, true))).orderBy(asc(users.createdAt));
  if (!pool.length) return null;
  const langMatch = pool.filter(u => u.languages.includes(lang));
  const candidates = langMatch.length ? langMatch : pool;
  const [st] = await tx.select().from(settings).where(eq(settings.key, 'rr.last'));
  const last = (st?.value as string) ?? '';
  const i = candidates.findIndex(u => u.id === last);
  const pick = candidates[(i + 1) % candidates.length];
  await tx.insert(settings).values({ key: 'rr.last', value: pick.id }).onConflictDoUpdate({ target: settings.key, set: { value: pick.id } });
  return pick;
}

/** Create (or merge) a lead from the website / chat / manual entry, assign it and notify sales. */
export async function createLead(input: LeadInput, actor?: User) {
  const phoneNorm = normPhone(input.phone);
  const c = input.ctx ?? {};
  const boatSlug = input.item?.startsWith('boat:') ? input.item.slice(5) : null;
  const lang = input.lang === 'en' ? 'en' : 'th';

  const result = await db.transaction(async t => {
    const tx = t as unknown as typeof db;
    await tx.execute(sql`select pg_advisory_xact_lock(777001)`);
    // customer: merge by phone
    let [cust] = await tx.select().from(customers).where(eq(customers.phoneNorm, phoneNorm));
    const consent = !!input.marketingConsent;
    if (!cust) {
      [cust] = await tx.insert(customers).values({ name: input.name.trim(), phone: input.phone.trim(), phoneNorm, email: input.email || null, lang, marketingConsent: consent, consentAt: consent ? new Date() : null, consentSource: consent ? 'web_form' : null }).returning();
    } else {
      await tx.update(customers).set({ email: cust.email || input.email || null, ...(consent && !cust.marketingConsent ? { marketingConsent: true, consentAt: new Date(), consentSource: 'web_form' } : {}), updatedAt: new Date() }).where(eq(customers.id, cust.id));
    }
    // duplicate within 24h for the same item → add to the existing lead instead of a new one
    const [dupe] = await tx.select().from(leads).where(and(eq(leads.customerId, cust.id), gte(leads.createdAt, new Date(Date.now() - 864e5)), inArray(leads.status, ['NEW', 'CONTACTED', 'TALKING']))).orderBy(desc(leads.createdAt)).limit(1);
    if (dupe && (dupe.item ?? '') === (input.item ?? '')) {
      await tx.insert(leadActivities).values({ leadId: dupe.id, type: 'resubmit', data: { message: input.message, date: input.date, adults: input.adults } });
      return { lead: dupe, customer: cust, duplicate: true, assignee: dupe.assignedToId ? (await tx.select().from(users).where(eq(users.id, dupe.assignedToId)))[0] ?? null : null };
    }
    const wonBefore = (await tx.select({ n: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.customerId, cust.id), eq(leads.status, 'WON'))))[0].n > 0;
    const sc = scoreLead({ tripDate: input.date ?? null, adults: input.adults ?? 2, children: input.children ?? 0, pagesViewed: c.pages_viewed ?? null, boatsViewed: c.boats_viewed ?? [], program: input.program ?? null, returning: !!c.returning, source: c.source ?? 'direct', hasEmail: !!input.email, wonBefore });
    const assignee = actor && actor.role === 'SALES' ? actor : await nextAssignee(lang, tx);
    let ref = `LD-${ymd()}-${randomDigits(4)}`;
    while ((await tx.select({ id: leads.id }).from(leads).where(eq(leads.ref, ref))).length) ref = `LD-${ymd()}-${randomDigits(4)}`;
    const [lead] = await tx.insert(leads).values({
      ref, customerId: cust.id, item: input.item || null, boatSlug, program: input.program || null, tripDate: input.date || null, adults: input.adults ?? 2, children: input.children ?? 0, slot: input.slot || null, message: input.message || null,
      source: c.source || 'direct', medium: c.medium || null, campaign: c.campaign || null, content: c.content || null, gclid: c.gclid || null, fbclid: c.fbclid || null, referrer: c.referrer || null, landingPage: c.landing_page || null,
      firstTouch: c.first_touch ?? null, pagesViewed: c.pages_viewed ?? null, visits: c.visits ?? null, boatsViewed: (c.boats_viewed ?? []).slice(0, 10), device: c.device || null, lang, contactVia: input.contactVia || 'web_form', eventId: c.event_id || null,
      ip: input.ip ?? null, userAgent: input.userAgent ?? null, score: sc.score, scoreReasons: sc.reasons, assignedToId: assignee?.id ?? null,
      status: actor ? 'CONTACTED' : 'NEW', firstReplyAt: actor ? new Date() : null,
    }).returning();
    await tx.insert(leadActivities).values({ leadId: lead.id, userId: actor?.id ?? null, type: 'created', data: { via: lead.contactVia, source: lead.source, assignedTo: assignee?.name ?? null } });
    await audit(actor ? { id: actor.id, role: actor.role } : null, { action: 'create', entity: 'lead', ref: lead.ref, label: `${lead.ref} · ${cust.name}`, changes: [{ f: 'แหล่งที่มา', from: null, to: SOURCE_LABEL[lead.source] ?? lead.source }, { f: 'มอบหมาย', from: null, to: assignee?.name ?? 'ยังไม่มี' }], ip: input.ip, userAgent: input.userAgent }, tx);
    return { lead, customer: cust, duplicate: false, assignee };
  });

  // side effects outside the transaction
  void notifyNewLead(result.lead, result.customer, result.assignee, result.duplicate).catch(e => console.error('[notify]', e));
  if (!result.duplicate && !actor && (await marketingConfig()).conv.lead) void sendMetaEvent({ name: 'Lead', leadId: result.lead.id, eventId: c.event_id, email: input.email, phone: input.phone, fbclid: c.fbclid, ip: input.ip, userAgent: input.userAgent, url: c.current_page ? appUrl() + c.current_page : undefined, custom: { content_name: input.item ?? undefined, lead_source: c.source } });
  return result;
}

async function boatName(slug: string | null) {
  if (!slug) return null;
  const [b] = await db.select({ name: boats.name }).from(boats).where(eq(boats.slug, slug));
  return b?.name ?? slug;
}

export async function leadCardFor(l: Lead, cust: { name: string; phone: string }, title?: string) {
  const boat = (await boatName(l.boatSlug)) ?? (l.item?.split(':')[1] ?? 'ยังไม่ระบุ');
  const sur = await surchargeWarning(l.boatSlug, l.tripDate);   // holiday surcharge: sales confirm the price with the owner
  const date = (l.tripDate ? new Date(l.tripDate + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-') + (sur ? ` · ⚠️ ${sur}` : '');
  const first = cust.name.split(' ')[0];
  const waText = l.lang === 'en' ? `Hi ${first}, this is Boat Trip Thailand. Thanks for your request for ${boat}${l.tripDate ? ' on ' + l.tripDate : ''}. Let me check availability for you.` : `สวัสดีค่ะคุณ${first} จาก Boat Trip Thailand ได้รับคำขอเรื่อง ${boat}${l.tripDate ? ' วันที่ ' + date : ''} แล้วนะคะ ขอเช็กคิวเรือให้สักครู่ค่ะ`;
  return leadCard({ id: l.id, ref: l.ref, name: cust.name, phone: cust.phone, boat: boat + (l.program ? ` · ${l.program}` : ''), date, guests: `${l.adults} ผู้ใหญ่${l.children ? ` + ${l.children} เด็ก` : ''}`, source: (SOURCE_LABEL[l.source] ?? l.source) + (l.campaign ? ` · ${l.campaign}` : ''), score: l.score, scoreLabel: SCORE_LABEL(l.score).th, message: l.message, lang: l.lang }, { title, appUrl: appUrl(), waText });
}

export async function lineGroupId() {
  if (process.env.LINE_GROUP_ID) return process.env.LINE_GROUP_ID;
  const [s] = await db.select().from(settings).where(eq(settings.key, 'line.groupId'));
  return (s?.value as string) || null;
}

async function notifyNewLead(l: Lead, cust: { name: string; phone: string }, assignee: User | null, duplicate: boolean) {
  if (!lineEnabled()) return;
  const card = await leadCardFor(l, cust, duplicate ? 'ลูกค้าส่งคำขอซ้ำ' : assignee ? `ลีดใหม่ของ ${assignee.name} · ตอบภายใน 15 นาที` : 'ลีดใหม่ · ยังไม่มีผู้รับ');
  const group = await lineGroupId();
  if (assignee?.lineUserId) await pushLine(assignee.lineUserId, [card]);
  if (group && (!assignee?.lineUserId || process.env.LINE_ALWAYS_NOTIFY_GROUP === 'true')) await pushLine(group, [card]);
}

/** Leads not contacted within SLA → alert the group (and admins) once. Called every minute by instrumentation. */
export async function checkSla() {
  const mins = Number(process.env.LEAD_SLA_MINUTES || 15);
  const late = await db.query.leads.findMany({ where: and(eq(leads.status, 'NEW'), sql`${leads.createdAt} < now() - (${mins} || ' minutes')::interval`, sql`not exists (select 1 from lead_activities a where a.lead_id = ${leads.id} and a.type = 'sla_alert')`), with: { customer: true, assignedTo: true }, limit: 20 });
  if (!late.length) return 0;
  const group = await lineGroupId();
  const admins = await db.select().from(users).where(and(eq(users.active, true), inArray(users.role, ['SUPER_ADMIN', 'ADMIN'])));
  for (const l of late) {
    await db.insert(leadActivities).values({ leadId: l.id, type: 'sla_alert', data: { minutes: mins } });
    if (!lineEnabled()) continue;
    const msg = text(`⏰ ลีด ${l.ref} (${l.customer.name}) รอเกิน ${mins} นาทีแล้ว${l.assignedTo ? ` · ผู้รับ: ${l.assignedTo.name}` : ''}\nใครว่างกด "รับเรื่อง" ได้เลย`);
    const card = await leadCardFor(l, l.customer, `เลยเวลาตอบ ${mins} นาที`);
    if (group) await pushLine(group, [msg, card]);
    else for (const a of admins) if (a.lineUserId) await pushLine(a.lineUserId, [msg, card]);
  }
  return late.length;
}

/** Status change with validation, activity, audit and ad-platform feedback */
export async function setLeadStatus(lead: Lead, status: LeadStatus, actor: User, extra: { lostReason?: string } = {}) {
  if (lead.status === status) return lead;
  if (status === 'LOST' && !extra.lostReason && !lead.lostReason) throw new Error('ต้องระบุเหตุผลที่ไม่สำเร็จ');
  const patch: Partial<Lead> = { status, updatedAt: new Date() };
  if (lead.status === 'NEW' && !lead.firstReplyAt) patch.firstReplyAt = new Date();
  if (status === 'WON') patch.wonAt = new Date();
  if (status === 'LOST') patch.lostReason = extra.lostReason ?? lead.lostReason;
  if (status === 'WON' || status === 'LOST') patch.nextFollowUp = null;
  const [u] = await db.update(leads).set(patch).where(eq(leads.id, lead.id)).returning();
  await db.insert(leadActivities).values({ leadId: lead.id, userId: actor.id, type: 'status', data: { from: lead.status, to: status, lostReason: patch.lostReason ?? null } });
  await audit({ id: actor.id, role: actor.role }, { action: 'status', entity: 'lead', ref: lead.ref, label: lead.ref, changes: [{ f: 'สถานะ', from: STATUS_LABEL[lead.status], to: STATUS_LABEL[status] }, ...(status === 'LOST' ? [{ f: 'เหตุผล', from: null, to: patch.lostReason }] : [])] });
  if ((status === 'TALKING' || status === 'WON') && (await marketingConfig()).conv[status === 'WON' ? 'won' : 'qualified']) {
    const [cust] = await db.select().from(customers).where(eq(customers.id, lead.customerId));
    void sendMetaEvent({ name: status === 'WON' ? 'Converted' : 'QualifiedLead', leadId: lead.id, eventId: `${lead.id}.${status}`, email: cust?.email, phone: cust?.phone, fbclid: lead.fbclid, actionSource: 'system_generated', custom: { lead_event_source: 'Boat Trip Admin', event_source: 'crm' } });
  }
  return u;
}

/** Row-level access: sales only see leads assigned to them */
export const canSeeLead = (u: User, l: Pick<Lead, 'assignedToId'>) => can(u, 'leads_all') || l.assignedToId === u.id;
