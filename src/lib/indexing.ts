/**
 * Whether search engines may index this deployment.
 * The site is indexable only when APP_URL is the main domain (boattripthailand.com / www) and the request
 * did not come in on another host such as new.boattripthailand.com (the dev / staging copy).
 * SEO_NOINDEX=1 forces noindex, SEO_NOINDEX=0 forces index (overrides both checks).
 * In noindex mode every page and image gets `X-Robots-Tag: noindex, nofollow`, the HTML gets the same meta,
 * robots.txt drops the Sitemap line, and the admin refuses to send the sitemap to Google / IndexNow.
 */
const LIVE = new Set(['boattripthailand.com', 'www.boattripthailand.com']);
const hostOf = (u: string) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };

export function noindexSite(reqHost?: string | null): boolean {
  const f = (process.env.SEO_NOINDEX || '').trim().toLowerCase();
  if (f === '1' || f === 'true' || f === 'yes') return true;
  if (f === '0' || f === 'false' || f === 'no') return false;
  if (!LIVE.has(hostOf(process.env.APP_URL || 'https://boattripthailand.com'))) return true;
  const h = (reqHost || '').split(',')[0].trim().split(':')[0].toLowerCase();
  return /^new\./.test(h);   // the app also answering on new.* after the move: keep that copy out of the index
}
export const reqHost = (h: Headers) => h.get('x-forwarded-host') || h.get('host');
export const NOINDEX_MSG = 'เว็บนี้ตั้งเป็น noindex อยู่ (APP_URL ยังไม่ใช่ boattripthailand.com) · ส่ง sitemap ได้หลังย้ายโดเมน';
