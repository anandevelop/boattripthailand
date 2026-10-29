import 'server-only';
import { and, desc, eq, gte, inArray, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { conversionEvents, customers, leads, settings } from '@/db/schema';
import { sha256, sha256Lower } from './crypto';
import { pub } from './env';

/** ใช้ประโยชน์จากลีด — which conversions go back to the ad platforms, sales message templates */
export const MKT_KEY = 'marketing.config';
export type Tpl = { k: string; n: string; th: string; en: string };
export type MarketingConfig = { conv: { lead: boolean; qualified: boolean; won: boolean }; tpl: Tpl[] | null };
export const MKT_DEFAULT: MarketingConfig = { conv: { lead: true, qualified: true, won: true }, tpl: null };

const s = (v: unknown, max: number) => (typeof v === 'string' ? v : '').slice(0, max);
export function cleanMarketing(v: unknown): MarketingConfig {
  const o = (v ?? {}) as Record<string, unknown>, c = (o.conv ?? {}) as Record<string, unknown>;
  const tpl = Array.isArray(o.tpl) ? o.tpl.slice(0, 30).map(x => { const t = (x ?? {}) as Record<string, unknown>; return { k: s(t.k, 40), n: s(t.n, 80), th: s(t.th, 2000), en: s(t.en, 2000) }; }).filter(t => t.k && t.n) : null;
  return { conv: { lead: c.lead !== false, qualified: c.qualified !== false, won: c.won !== false }, tpl: tpl?.length ? tpl : null };
}
export async function marketingConfig(): Promise<MarketingConfig> {
  const [r] = await db.select().from(settings).where(eq(settings.key, MKT_KEY));
  return r ? cleanMarketing(r.value) : MKT_DEFAULT;
}

/** Meta wants digits with country code; Google wants E.164 (+…). Thai local numbers start with 0. */
export function phoneIntl(norm: string) {
  const d = norm.replace(/\D/g, '');
  if (!d) return null;
  const x = d.startsWith('00') ? d.slice(2) : d.startsWith('0') ? '66' + d.slice(1) : d;
  return x.length >= 8 && x.length <= 15 ? x : null;
}

/**
 * Customer list for a Meta Custom Audience or Google Customer Match upload.
 * Only customers who agreed to marketing; email and phone are normalised then SHA-256 hashed — nothing readable leaves.
 */
export async function audienceFile(ids: string[], platform: 'meta' | 'google') {
  const rows = ids.length ? await db.select().from(customers).where(and(inArray(customers.id, ids.slice(0, 20000)), eq(customers.marketingConsent, true))) : [];
  const out: string[][] = [];
  for (const c of rows) {
    const ph = phoneIntl(c.phoneNorm || c.phone), em = c.email && /@/.test(c.email) ? sha256Lower(c.email) : '';
    const phh = ph ? sha256(platform === 'google' ? '+' + ph : ph) : '';
    if (em || phh) out.push([em, phh]);
  }
  const head = platform === 'google' ? ['Email', 'Phone'] : ['email', 'phone'];
  return { csv: [head, ...out].map(r => r.join(',')).join('\n') + '\n', count: out.length, skipped: ids.length - out.length };
}

export async function logConversion(e: { leadId?: string | null; event: string; platform: string; status: string; detail?: string | null }) {
  try { await db.insert(conversionEvents).values({ leadId: e.leadId ?? null, event: e.event, platform: e.platform, status: e.status, detail: e.detail?.slice(0, 300) ?? null }); }
  catch (err) { console.error('[conversion log]', err); }
}

/** ส่งผลกลับโฆษณา tab: is Meta connected, how many went out, the latest events */
export async function conversionStatus() {
  const since = new Date(Date.now() - 30 * 864e5);
  const [recent, counts, gclidWon] = await Promise.all([
    db.select({ id: conversionEvents.id, ref: leads.ref, event: conversionEvents.event, platform: conversionEvents.platform, status: conversionEvents.status, detail: conversionEvents.detail, at: conversionEvents.createdAt })
      .from(conversionEvents).leftJoin(leads, eq(leads.id, conversionEvents.leadId)).orderBy(desc(conversionEvents.id)).limit(30),
    db.select({ status: conversionEvents.status, n: sql<number>`count(*)::int` }).from(conversionEvents).where(gte(conversionEvents.createdAt, since)).groupBy(conversionEvents.status),
    db.select({ n: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.status, 'WON'), isNotNull(leads.gclid), gte(leads.wonAt, new Date(Date.now() - 90 * 864e5)))),
  ]);
  return {
    meta: !!(process.env.META_PIXEL_ID && process.env.META_CAPI_TOKEN), test: !!process.env.META_TEST_EVENT_CODE,
    // /admin → วิเคราะห์เว็บไซต์ → Meta: what is configured (the pixel id is public — it is in every page's source)
    pixelId: pub('NEXT_PUBLIC_META_PIXEL_ID') || process.env.META_PIXEL_ID || null, capi: !!process.env.META_CAPI_TOKEN,
    counts: Object.fromEntries(counts.map(c => [c.status, c.n])), gclidWon: gclidWon[0]?.n ?? 0,
    recent: recent.map(r => ({ ...r, at: r.at.toISOString() })),
  };
}
