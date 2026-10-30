import { relations, sql } from 'drizzle-orm';
import { bigserial, boolean, date, doublePrecision, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID());
const now = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow();

export const roleEnum = pgEnum('role', ['SUPER_ADMIN', 'ADMIN', 'SALES']);
export const leadStatusEnum = pgEnum('lead_status', ['NEW', 'CONTACTED', 'TALKING', 'WON', 'LOST']);

/** Team members who can sign in to /admin */
export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: roleEnum('role').notNull().default('SALES'),
  /** per-user permission override; null = role defaults */
  perms: text('perms').array(),
  passwordHash: text('password_hash').notNull(),
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
  active: boolean('active').notNull().default(true),
  /** included in round-robin lead assignment */
  receivesLeads: boolean('receives_leads').notNull().default(true),
  languages: text('languages').array().notNull().default(sql`ARRAY['th']::text[]`),
  lineUserId: text('line_user_id').unique(),
  lineLinkCode: text('line_link_code').unique(),
  failedLogins: integer('failed_logins').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  /** bumped on role/permission change → existing sessions are revoked */
  sessionVersion: integer('session_version').notNull().default(1),
  /** public profile shown on the website team section + contact extras (title, bio, avatar, WhatsApp, LINE) */
  profile: jsonb('profile').$type<UserProfile>().notNull().default({}),
  createdAt: now('created_at'),
  updatedAt: now('updated_at'),
});

export type UserProfile = { full?: string; title?: { th: string; en: string }; bio?: { th: string; en: string }; wa?: string; line?: string; showWeb?: boolean; avatar?: string };

export const sessions = pgTable('sessions', {
  /** sha256 of the cookie token — the raw token is never stored */
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mfaVerified: boolean('mfa_verified').notNull().default(false),
  sessionVersion: integer('session_version').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: now('created_at'),
  lastSeenAt: now('last_seen_at'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, t => [index('sessions_user_idx').on(t.userId)]);

export const customers = pgTable('customers', {
  id: id(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  /** digits only — merges repeat customers */
  phoneNorm: text('phone_norm').notNull().unique(),
  email: text('email'),
  /** WhatsApp number when it differs from / is given besides `phone` (booking form, admin) */
  whatsapp: text('whatsapp'),
  country: text('country'),
  lang: text('lang').notNull().default('th'),
  marketingConsent: boolean('marketing_consent').notNull().default(false),
  consentAt: timestamp('consent_at', { withTimezone: true }),
  consentSource: text('consent_source'),
  notes: text('notes'),
  createdAt: now('created_at'),
  updatedAt: now('updated_at'),
});

export const leads = pgTable('leads', {
  id: id(),
  ref: text('ref').notNull().unique(),
  customerId: text('customer_id').notNull().references(() => customers.id),
  status: leadStatusEnum('status').notNull().default('NEW'),
  // what they want
  item: text('item'),
  boatSlug: text('boat_slug'),
  program: text('program'),
  tripDate: date('trip_date'),
  adults: integer('adults').notNull().default(2),
  children: integer('children').notNull().default(0),
  slot: text('slot'),
  message: text('message'),
  // where they came from
  source: text('source').notNull().default('direct'),
  medium: text('medium'),
  campaign: text('campaign'),
  content: text('content'),
  gclid: text('gclid'),
  fbclid: text('fbclid'),
  referrer: text('referrer'),
  landingPage: text('landing_page'),
  firstTouch: jsonb('first_touch'),
  pagesViewed: integer('pages_viewed'),
  visits: integer('visits'),
  boatsViewed: text('boats_viewed').array().notNull().default(sql`ARRAY[]::text[]`),
  device: text('device'),
  lang: text('lang').notNull().default('th'),
  contactVia: text('contact_via').notNull().default('web_form'),
  eventId: text('event_id'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  // sales work
  score: integer('score').notNull().default(0),
  scoreReasons: jsonb('score_reasons').$type<[string, number][]>(),
  assignedToId: text('assigned_to_id').references(() => users.id),
  firstReplyAt: timestamp('first_reply_at', { withTimezone: true }),
  nextFollowUp: date('next_follow_up'),
  lostReason: text('lost_reason'),
  wonAt: timestamp('won_at', { withTimezone: true }),
  internalNote: text('internal_note'),
  createdAt: now('created_at'),
  updatedAt: now('updated_at'),
}, t => [
  index('leads_status_created_idx').on(t.status, t.createdAt),
  index('leads_assigned_idx').on(t.assignedToId, t.status),
  index('leads_customer_idx').on(t.customerId),
]);

export const leadActivities = pgTable('lead_activities', {
  id: id(),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id),
  type: text('type').notNull(),
  data: jsonb('data'),
  createdAt: now('created_at'),
}, t => [index('lead_activities_lead_idx').on(t.leadId, t.createdAt)]);

/** Append-only — UPDATE/DELETE blocked by trigger (drizzle/0001_audit_append_only.sql) */
export const auditLogs = pgTable('audit_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  ts: now('ts'),
  userId: text('user_id'),
  role: text('role'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  ref: text('ref'),
  label: text('label').notNull(),
  changes: jsonb('changes').$type<AuditChange[]>().notNull().default([]),
  note: text('note'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  prevHash: text('prev_hash').notNull(),
  hash: text('hash').notNull(),
}, t => [index('audit_ts_idx').on(t.ts), index('audit_entity_idx').on(t.entity, t.ref), index('audit_user_idx').on(t.userId, t.ts)]);
export type AuditChange = { f: string; from: unknown; to: unknown };

export const boats = pgTable('boats', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  subtitle: text('subtitle'),
  type: text('type').notNull(),
  ft: doublePrecision('ft'),
  pax: integer('pax'),
  marina: text('marina'),
  featured: boolean('featured').notNull().default(false),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  fromPrice: integer('from_price'),
  calendarId: text('calendar_id'),
  data: jsonb('data').$type<BoatData>().notNull(),
  images: text('images').array().notNull().default(sql`ARRAY[]::text[]`),
  updatedAt: now('updated_at'),
});
export type PriceTable = { caption: string; columns: string[]; rows: string[][] };
export type BoatData = { colmap?: (string | null)[] | null; tables: PriceTable[]; includes: string[]; not_included: string[]; complimentary: string[]; time_slots: string[][]; notes: string[]; info: string[][] };

export const seasonCalendars = pgTable('season_calendars', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind').notNull().default('season'),
  ranges: jsonb('ranges').$type<Record<string, [string, string][]>>().notNull(),
  special: jsonb('special').$type<{ from: string; to: string; label?: string }[]>().notNull().default([]),
  /** surcharge added on special dates for all-year calendars (full day / any program) */
  add: integer('add').notNull().default(0),
  /** surcharge for half-day programs on special dates; 0 = same as `add` */
  addHalf: integer('add_half').notNull().default(0),
});

export const posts = pgTable('posts', {
  id: integer('id').primaryKey(),
  slugTh: text('slug_th').unique(),
  slugEn: text('slug_en').unique(),
  category: text('category').notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  cover: text('cover'),
  title: jsonb('title').$type<Bi>().notNull(),
  excerpt: jsonb('excerpt').$type<Bi>().notNull(),
  seoTitle: jsonb('seo_title').$type<Bi>().notNull(),
  seoDesc: jsonb('seo_desc').$type<Bi>().notNull(),
  keywords: text('keywords'),
  blocks: jsonb('blocks').$type<{ th: Block[]; en: Block[] }>().notNull(),
  published: boolean('published').notNull().default(true),
  // ตั้งเวลาเผยแพร่: set while the article waits (published = false); the 'publish' job flips it when the time comes
  publishAt: timestamp('publish_at', { withTimezone: true }),
  updatedAt: now('updated_at'),
});
export type Bi = { th: string; en: string };
export type Block = { t: string; html?: string; lv?: number; src?: string; alt?: string; cap?: string; w?: number; title?: string; items?: { q: string; a: string }[]; slug?: string; label?: string; [k: string]: unknown };

export const redirects = pgTable('redirects', {
  from: text('from').primaryKey(),
  to: text('to').notNull(),
  code: integer('code').notNull().default(301),
  hits: integer('hits').notNull().default(0),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
});

/**
 * Media library. One row per image URL: files uploaded through /admin (stored under UPLOAD_DIR,
 * served at /uploads/…, `size` set) and details staff added to images that shipped with the site.
 */
export const media = pgTable('media', {
  url: text('url').primaryKey(),
  name: text('name').notNull(),
  dir: text('dir').notNull().default('new'),
  alt: jsonb('alt').$type<Bi>().notNull().default({ th: '', en: '' }),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  rights: text('rights').notNull().default('unknown'),
  credit: text('credit').notNull().default(''),
  focal: jsonb('focal').$type<{ x: number; y: number }>().notNull().default({ x: 50, y: 50 }),
  owner: text('owner').notNull().default(''),
  width: integer('width'),
  height: integer('height'),
  size: integer('size'),
  uploadedById: text('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: now('created_at'),
});

export const usersRelations = relations(users, ({ many }) => ({ leads: many(leads), sessions: many(sessions) }));
export const leadsRelations = relations(leads, ({ one, many }) => ({
  customer: one(customers, { fields: [leads.customerId], references: [customers.id] }),
  assignedTo: one(users, { fields: [leads.assignedToId], references: [users.id] }),
  activities: many(leadActivities),
}));
export const customersRelations = relations(customers, ({ many }) => ({ leads: many(leads) }));
export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, { fields: [leadActivities.leadId], references: [leads.id] }),
  user: one(users, { fields: [leadActivities.userId], references: [users.id] }),
}));
export const sessionsRelations = relations(sessions, ({ one }) => ({ user: one(users, { fields: [sessions.userId], references: [users.id] }) }));

/**
 * First-party, cookieless page-view counts (/api/t). Aggregates only — no IP, no visitor id.
 * `path` is the page ("404:/old-url" for not-found hits); `sessions` counts the first view of a browser session.
 */
export const trafficDaily = pgTable('traffic_daily', {
  day: date('day').notNull(),
  path: text('path').notNull(),
  source: text('source').notNull(),
  device: text('device').notNull(),
  lang: text('lang').notNull(),
  views: integer('views').notNull().default(0),
  sessions: integer('sessions').notNull().default(0),
}, t => [primaryKey({ columns: [t.day, t.path, t.source, t.device, t.lang] }), index('traffic_daily_day').on(t.day)]);

/** Every conversion we tried to send back to an ad platform (Meta CAPI) — shown in ใช้ประโยชน์จากลีด → ส่งผลกลับโฆษณา */
export const conversionEvents = pgTable('conversion_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  leadId: text('lead_id'),
  event: text('event').notNull(),
  platform: text('platform').notNull(),
  /** sent · failed · skipped (not configured) · off (turned off in admin) */
  status: text('status').notNull(),
  detail: text('detail'),
  createdAt: now('created_at'),
}, t => [index('conversion_events_created').on(t.createdAt)]);

export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Boat = typeof boats.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Media = typeof media.$inferSelect;
