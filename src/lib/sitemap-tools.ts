import 'server-only';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';
import sitemap from '@/app/sitemap';
import { gscSubmitSitemap } from './google';
import { SITE } from './i18n';

/**
 * /admin → ศูนย์ SEO → Sitemap & Index: what /sitemap.xml lists right now, and sending it to search engines —
 * Google through the Search Console API, Bing (and the other IndexNow engines) through IndexNow.
 */
const SUBMIT_KEY = 'seo.submit', INDEXNOW_KEY = 'seo.indexnow';
type Sent = { at: string; ok: boolean; msg: string; n?: number };
export type SubmitLog = { google?: Sent; bing?: Sent };

async function getSetting<T>(key: string): Promise<T | null> { const [r] = await db.select().from(settings).where(eq(settings.key, key)); return (r?.value as T) ?? null; }
async function setSetting(key: string, value: unknown) { await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } }); }

/** URL counts by section, image entries and hreflang pairs of the live sitemap */
export async function sitemapStats() {
  const list = await sitemap(), path = (u: string) => u.slice(SITE.length).replace(/^\/en(?=\/|$)/, '') || '/';
  const by = { pages: 0, boats: 0, blog: 0 }; let images = 0;
  for (const e of list) { const p = path(e.url); if (p.startsWith('/yacht-charter/')) by.boats++; else if (p.startsWith('/blog/')) by.blog++; else by.pages++; images += (e.images?.length ?? 0); }
  return { total: list.length, ...by, images, url: SITE + '/sitemap.xml', log: (await getSetting<SubmitLog>(SUBMIT_KEY)) ?? {} };
}
/** the IndexNow key (made on first use); served at /indexnow.txt */
export async function indexNowKey() {
  const k = await getSetting<{ key: string }>(INDEXNOW_KEY);
  if (k?.key) return k.key;
  const key = randomBytes(16).toString('hex'); await setSetting(INDEXNOW_KEY, { key }); return key;
}
async function log(to: 'google' | 'bing', s: Sent) { const L = (await getSetting<SubmitLog>(SUBMIT_KEY)) ?? {}; L[to] = s; await setSetting(SUBMIT_KEY, L); return L; }

export async function submitSitemap(to: 'google' | 'bing'): Promise<{ ok: boolean; msg: string; log: SubmitLog }> {
  const at = new Date().toISOString();
  try {
    if (to === 'google') {
      await gscSubmitSitemap(SITE + '/sitemap.xml');
      const msg = 'ส่ง sitemap ให้ Google แล้ว · Google จะอ่านภายในไม่กี่ชั่วโมงถึงไม่กี่วัน';
      return { ok: true, msg, log: await log('google', { at, ok: true, msg }) };
    }
    const urls = (await sitemap()).map(e => e.url).slice(0, 10_000), key = await indexNowKey();
    const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation: SITE + '/indexnow.txt', urlList: urls }) });
    if (r.ok) { const msg = `ส่ง ${urls.length} URL ให้ Bing / IndexNow แล้ว`; return { ok: true, msg, log: await log('bing', { at, ok: true, msg, n: urls.length }) }; }
    const msg = r.status === 403 ? 'IndexNow ยังอ่านไฟล์กุญแจ /indexnow.txt ไม่ได้ · ต้องเปิดเว็บด้วยโดเมนจริงก่อน' : r.status === 422 ? 'URL ใน sitemap ไม่ตรงกับโดเมนของเว็บ (APP_URL)' : r.status === 429 ? 'ส่งถี่เกินไป · ลองใหม่ภายหลัง' : `ส่งไม่สำเร็จ (HTTP ${r.status})`;
    return { ok: false, msg, log: await log('bing', { at, ok: false, msg }) };
  } catch (e) {
    const raw = e instanceof Error ? e.message : '', msg = /fetch failed|timeout|aborted/i.test(raw) ? `เชื่อมต่อ ${to === 'google' ? 'Google' : 'api.indexnow.org'} ไม่ได้ · ตรวจอินเทอร์เน็ตของเซิร์ฟเวอร์แล้วลองใหม่` : raw || 'ส่งไม่สำเร็จ';
    return { ok: false, msg, log: await log(to, { at, ok: false, msg }) };
  }
}
