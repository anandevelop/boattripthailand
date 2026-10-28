import 'server-only';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { auditLogs, boats, customers, leadActivities, leads, media, posts, redirects, settings, users, type Boat, type Customer, type Lead, type Post, type User } from '@/db/schema';
import { dealsFor } from './lead-guard';
import { CONTACT_LABEL, STATUS_LABEL } from './lead-meta';
import { can, permsOf, ROLE_LABEL, type Perm } from './perms';
import { siteData } from './site-render';
import { mediaToClient } from './media';
import { homeContent } from './home';
import { activitiesContent } from './activities';
import { seoConfig } from './seo';
import { marketingConfig } from './marketing';
import { surchargeWarning, surchargeWarnings } from './surcharge';
import { appUrl } from './leads';

import { lineSaved, loadLineCfg } from './line-config';
/* ---------- vocabulary shared with the admin UI (mockup) ---------- */
export const ROLE_TO_CLIENT = { SUPER_ADMIN: 'super', ADMIN: 'admin', SALES: 'sales' } as const;
export const ROLE_FROM_CLIENT: Record<string, User['role']> = { super: 'SUPER_ADMIN', admin: 'ADMIN', sales: 'SALES' };
const P2C: Record<string, string> = { leads: 'bookings', leads_all: 'bookings_all' };
const C2P: Record<string, string> = { bookings: 'leads', bookings_all: 'leads_all' };
export const permsToClient = (p: string[]) => p.map(x => P2C[x] ?? x);
export const permsFromClient = (p: string[]) => [...new Set(p.map(x => C2P[x] ?? x))] as Perm[];
const STATUS_C = { NEW: 'new', CONTACTED: 'contacted', TALKING: 'talking', WON: 'won', LOST: 'lost' } as const;
export const STATUS_FROM_CLIENT: Record<string, Lead['status']> = { new: 'NEW', contacted: 'CONTACTED', talking: 'TALKING', won: 'WON', lost: 'LOST' };
const CONTACT_C: Record<string, string> = { web_form: 'ฟอร์มบนเว็บ', whatsapp: 'WhatsApp', line: 'LINE', phone: 'โทรศัพท์', email: 'อีเมล', walk_in: 'Walk-in' };
export const CONTACT_FROM_CLIENT: Record<string, string> = Object.fromEntries(Object.entries(CONTACT_C).map(([k, v]) => [v, k]));
const LANG_C: Record<string, string> = { th: 'ไทย', en: 'English', zh: '中文', ru: 'Русский' };
export const LANG_FROM_CLIENT: Record<string, string> = Object.fromEntries(Object.entries(LANG_C).map(([k, v]) => [v, k]));

const ava = (name: string) => { const c = (name || '?').trim().charAt(0).toUpperCase(); return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#f2e2e4"/><text x="48" y="60" font-family="Jost,sans-serif" font-size="40" text-anchor="middle" fill="#70000e">${c.replace(/[<&>]/g, '')}</text></svg>`); };
const isoDate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function userToClient(u: User) {
  const p = u.profile ?? {};
  return {
    id: u.id, name: u.name, full: p.full ?? '', email: u.email, tel: u.phone ?? '', telFmt: u.phone ?? '', wa: p.wa ?? '', line: p.line ?? '',
    roleKey: ROLE_TO_CLIENT[u.role], role: ROLE_LABEL[u.role], title: p.title ?? { th: ROLE_LABEL[u.role], en: ROLE_LABEL[u.role] },
    langs: u.languages.map(l => LANG_C[l] ?? l), showWeb: !!p.showWeb, leads: u.receivesLeads, active: u.active, online: false,
    perms: u.perms && u.perms.length ? permsToClient(u.perms) : null, bio: p.bio ?? { th: '', en: '' },
    lineLinked: !!u.lineUserId, totp: u.totpEnabled, lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  };
}
export const avatarOf = (u: User) => u.profile?.avatar || ava(u.name);
const DIAL: [string, string][] = [['66', '🇹🇭 TH'], ['44', '🇬🇧 UK'], ['49', '🇩🇪 DE'], ['33', '🇫🇷 FR'], ['39', '🇮🇹 IT'], ['46', '🇸🇪 SE'], ['47', '🇳🇴 NO'], ['45', '🇩🇰 DK'], ['31', '🇳🇱 NL'], ['41', '🇨🇭 CH'], ['7', '🇷🇺 RU'], ['86', '🇨🇳 CN'], ['82', '🇰🇷 KR'], ['81', '🇯🇵 JP'], ['91', '🇮🇳 IN'], ['61', '🇦🇺 AU'], ['65', '🇸🇬 SG'], ['60', '🇲🇾 MY'], ['971', '🇦🇪 AE'], ['1', '🇺🇸 US']];
const countryOf = (c: Customer) => c.country || (c.phoneNorm.length === 10 && c.phoneNorm.startsWith('0') ? '🇹🇭 TH' : DIAL.find(([d]) => c.phoneNorm.startsWith(d))?.[1] ?? '🌐');
export function customerToClient(c: Customer) {
  return { id: c.id, name: c.name, country: countryOf(c), phone: c.phone, email: c.email ?? '', channel: '', tags: [] as string[], consent: c.marketingConsent, lang: c.lang, countryRaw: c.country ?? '', notes: c.notes ?? '' };
}
type Act = typeof leadActivities.$inferSelect;
function actText(a: Act, names: Map<string, string>) {
  const d = (a.data ?? {}) as Record<string, string>;
  switch (a.type) {
    case 'contact': return `ติดต่อทาง ${CONTACT_LABEL[d.via] ?? d.via}`;
    case 'status': return `เปลี่ยนสถานะ ${STATUS_LABEL[d.from as Lead['status']] ?? d.from} → ${STATUS_LABEL[d.to as Lead['status']] ?? d.to}${d.lostReason ? ` (${d.lostReason})` : ''}`;
    case 'note': return `บันทึก: ${d.text}`;
    case 'assign': return `มอบหมายให้ ${d.to ?? ''}${d.via === 'line_claim' ? ' (รับเรื่องจาก LINE)' : ''}`;
    case 'followup': return `นัดติดตาม ${d.date ?? '—'}`;
    case 'resubmit': return 'ลูกค้าส่งคำขอซ้ำ';
    case 'outreach': return `ส่งข้อความการตลาด${d.seg ? ` “${d.seg}”` : ''} ทาง ${({ whatsapp: 'WhatsApp', email: 'อีเมล', copy: 'คัดลอกไปส่งเอง' } as Record<string, string>)[d.via] ?? d.via}`;
    case 'sla_alert': return `แจ้งเตือนเลยเวลาตอบ ${d.minutes ?? ''} นาที`;
    default: return a.type;
  }
}
export function leadToClient(l: Lead, acts: Act[], names: Map<string, string>, surcharge: string | null = null) {
/** security: free-text lead labels the admin prints as-is (rows saved before the form stripped markup) */
const P = (s: string | null | undefined) => (s ?? '').replace(/[<>"'`\\]/g, '');
  return {
    surcharge,
    id: l.ref, dbId: l.id, boat: P(l.boatSlug ?? l.item), item: P(l.item), prog: P(l.program), date: l.tripDate ?? '', guests: l.adults + l.children, adults: l.adults, children: l.children,
    status: STATUS_C[l.status], cust: l.customerId, sales: l.assignedToId ?? '', channel: CONTACT_C[l.contactVia] ?? l.contactVia, contact: CONTACT_C[l.contactVia] ?? l.contactVia,
    src: P(l.source), campaign: P(l.campaign), landing: l.landingPage ? (P(l.landingPage.split('?')[0]) || '/') : '—', clickId: l.gclid ? 'gclid' : l.fbclid ? 'fbclid' : '', viewed: (l.boatsViewed.length ? l.boatsViewed : l.boatSlug ? [l.boatSlug] : []).map(P),
    pages: l.pagesViewed ?? 0, returning: (l.visits ?? 1) > 1, device: l.device === 'mobile' ? 'มือถือ' : l.device === 'desktop' ? 'คอมพิวเตอร์' : (P(l.device) || '—'), lang: l.lang,
    created: isoDate(l.createdAt), createdAt: l.createdAt.toISOString(), reply: l.firstReplyAt ? Math.max(0, Math.round((+l.firstReplyAt - +l.createdAt) / 60000)) : null,
    next: l.nextFollowUp ?? '', lost: l.lostReason ?? '', slot: P(l.slot), pickup: '', note: l.internalNote ?? '', message: l.message ?? '', score: l.score, scoreReasons: l.scoreReasons ?? [],
    acts: acts.filter(a => a.type !== 'created').sort((a, b) => +a.createdAt - +b.createdAt).map(a => ({ ts: a.createdAt.toISOString(), uid: a.userId ?? '—', t: actText(a, names) })),
  };
}
export async function leadClientById(id: string) {
  const [l] = await db.select().from(leads).where(eq(leads.id, id));
  if (!l) return null;
  const acts = await db.select().from(leadActivities).where(eq(leadActivities.leadId, id));
  const [c] = await db.select().from(customers).where(eq(customers.id, l.customerId));
  return { lead: leadToClient(l, acts, new Map(), await surchargeWarning(l.boatSlug, l.tripDate)), customer: c ? customerToClient(c) : null };
}

export function auditToClient(r: typeof auditLogs.$inferSelect) {
  const ent = ({ lead: 'booking' } as Record<string, string>)[r.entity] ?? r.entity;
  return { id: r.id, ts: r.ts.toISOString(), uid: r.userId ?? '—', role: r.role ? (ROLE_TO_CLIENT as Record<string, string>)[r.role] ?? r.role : '', act: r.action, ent, ref: r.ref ?? '', label: r.label, changes: r.changes, note: r.note ?? '', ip: r.ip ?? '', dev: (r.userAgent ?? '').slice(0, 80), hash: r.hash.slice(0, 12), prev: r.prevHash.slice(0, 12), server: true };
}
export async function auditList(limit = 1500) {
  return (await db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(limit)).reverse().map(auditToClient);
}

export function postToClient(p: Post) {
  const has = (k: 'th' | 'en') => !!(p.title[k] && p.blocks[k]?.length);
  return { id: p.id, cat: p.category, status: p.published ? 'published' : 'draft', date: isoDate(p.date), author: '', cover: p.cover ?? '', boats: [] as string[], views: 0, tags: [] as string[],
    tr: { th: has('th') ? 'ok' : 'none', en: has('en') ? 'ok' : 'none' }, title: p.title, slug: { th: p.slugTh ?? '', en: p.slugEn ?? '' }, excerpt: p.excerpt, seoT: p.seoTitle, seoD: p.seoDesc,
    kw: { th: p.keywords?.split(', ')[0] ?? '', en: p.keywords?.split(', ')[1] ?? '' }, blocks: p.blocks, wp: { th: '', en: '' } };
}

export function boatToClient(b: Boat) {
  const d = b.data as Boat['data'] & { i18n?: unknown };
  return { slug: b.slug, title: b.name, subtitle: b.subtitle ?? '', type: b.type, ft: b.ft, pax: b.pax, from_: b.fromPrice, marina: b.marina ?? '', pattaya: /pattaya/i.test(b.marina ?? ''), pages: [], info: d.info ?? [], includes: d.includes ?? [], complimentary: d.complimentary ?? [], not_included: d.not_included ?? [], time_slots: d.time_slots ?? [], notes: d.notes ?? [], remarks: [], tables: d.tables ?? [],
    active: b.active, featured: b.featured, status: b.active ? 'live' : 'hidden', cal: b.calendarId ?? 'all', imgs: b.images, ...(d.i18n ? { i18n: d.i18n } : {}) };
}

/** connection status (no secrets) */
export async function systemStatus() {
  const [g] = await db.select().from(settings).where(eq(settings.key, 'line.groupId'));
  const has = (k: string) => !!process.env[k];
  return [
  await loadLineCfg(); const ls = lineSaved();
    ['LINE OA (Messaging API)', (has('LINE_CHANNEL_ACCESS_TOKEN') || !!ls.token) && (has('LINE_CHANNEL_SECRET') || !!ls.secret), `Webhook URL: ${appUrl()}/api/line/webhook`],
    ['กลุ่ม LINE ทีมขาย', !!(process.env.LINE_GROUP_ID || g), process.env.LINE_GROUP_ID || (g?.value as string) || 'เชิญบอท LINE OA เข้ากลุ่มทีมขาย ระบบจะจำกลุ่มให้อัตโนมัติ'],
    ['Meta Pixel (หน้าเว็บ)', has('NEXT_PUBLIC_META_PIXEL_ID'), 'NEXT_PUBLIC_META_PIXEL_ID'],
    ['Meta Conversions API', has('META_PIXEL_ID') && has('META_CAPI_TOKEN'), 'ส่ง Lead / QualifiedLead / Converted จากเซิร์ฟเวอร์'],
    ['Google Analytics 4', has('NEXT_PUBLIC_GA_ID'), 'NEXT_PUBLIC_GA_ID'],
  ] as [string, boolean, string][];
}

/** Everything the admin UI needs on load — scoped by the user's permissions on the server */
export async function leadsFor(me: User) {
  const all = can(me, 'leads_all');
  const team = await db.select({ id: users.id, name: users.name }).from(users);
  const names = new Map(team.map(u => [u.id, u.name]));
  const L = can(me, 'leads') ? await db.select().from(leads).where(all ? undefined : eq(leads.assignedToId, me.id)).orderBy(desc(leads.createdAt)) : [];
  const ids = L.map(l => l.id), custIds = [...new Set(L.map(l => l.customerId))];
  const [acts, custs] = await Promise.all([
    ids.length ? db.select().from(leadActivities).where(inArray(leadActivities.leadId, ids)) : [],
    custIds.length ? db.select().from(customers).where(inArray(customers.id, custIds)) : [],
  ]);
  const byLead = new Map<string, Act[]>(); for (const a of acts) (byLead.get(a.leadId) ?? byLead.set(a.leadId, []).get(a.leadId)!).push(a);
  const sur = await surchargeWarnings(L.map(l => ({ slug: l.boatSlug, date: l.tripDate })));
  return { leads: L.map(l => leadToClient(l, byLead.get(l.id) ?? [], names, sur.get(`${l.boatSlug}|${l.tripDate}`) ?? null)), customers: custs.map(customerToClient) };
}

export async function adminBoot(me: User) {
  const team = await db.select().from(users).orderBy(users.createdAt);
  const { leads: LC, customers: CC } = await leadsFor(me);
  const site = await siteData();
  const canContent = can(me, 'content');
  const P = canContent ? await db.select().from(posts) : [];
  const teamVisible = can(me, 'team') || can(me, 'leads_all') ? team : team.filter(u => u.id === me.id);
  const fleetRows = await db.select().from(boats).orderBy(boats.sortOrder), fleet = fleetRows.map(boatToClient);
  return {
    me: { ...userToClient(me), perms: permsToClient(permsOf(me)) },
    team: teamVisible.map(userToClient),
    teamImg: Object.fromEntries(team.map(u => [u.id, avatarOf(u)])),
    names: Object.fromEntries(team.map(u => [u.id, u.name])),
    leads: LC,
    deals: await dealsFor(LC.map(l => l.dbId)),
    customers: CC,
    audit: can(me, 'audit') ? await auditList() : [],
    fleet, extra: site.EXTRA,
    seasons: { ...(site.SEASONS as object), boats: Object.fromEntries(fleetRows.map(b => [b.slug, b.calendarId ?? 'all'])), colmap: Object.fromEntries(fleetRows.filter(b => b.data.colmap).map(b => [b.slug, b.data.colmap])) },
    thumbs: Object.fromEntries(fleet.map(b => [b.slug, b.imgs.find(u => u.endsWith('-a.webp')) || b.imgs[0] || ''])),
    bimg: site.BIMG, actimg: site.SHOWIMG,
    wp: { arts: P.map(postToClient), redir: can(me, 'seo') ? (await db.select().from(redirects)).map(r => ({ from: r.from, to: r.to, code: r.code, hits: r.hits, wp: 1 })) : [] },
    sitecfg: can(me, 'settings') ? ((await db.select().from(settings).where(eq(settings.key, 'admin.sitecfg')))[0]?.value ?? null) : null,
    sys: can(me, 'settings') ? await systemStatus() : null,
    myLine: { linked: !!me.lineUserId, code: me.lineLinkCode ?? null },
    home: canContent ? await homeContent() : null,
    acts: canContent ? await activitiesContent() : null,
    seo: can(me, 'seo') ? await seoConfig() : null,
    mkt: await marketingConfig(),   // message templates are used by sales in the lead drawer too
    media: (await db.select().from(media).orderBy(desc(media.createdAt))).map(mediaToClient),
  };
}
