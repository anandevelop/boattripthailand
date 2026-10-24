/** Shared lead constants — safe to import from client components */
export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'TALKING', 'WON', 'LOST'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const OPEN_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'TALKING'];
export const STATUS_LABEL: Record<LeadStatus, string> = { NEW: 'ลีดใหม่', CONTACTED: 'ติดต่อแล้ว', TALKING: 'กำลังคุย', WON: 'ปิดการขาย', LOST: 'ไม่สำเร็จ' };
export const STATUS_STYLE: Record<LeadStatus, string> = { NEW: 'bg-[#eef2ff] text-[#3b4bb5]', CONTACTED: 'bg-[#fff6e5] text-[#9a5b00]', TALKING: 'bg-[#fff1e8] text-[#b4501a]', WON: 'bg-[#eaf6ef] text-[#1e7a46]', LOST: 'bg-[#fbecec] text-[#a3222c]' };

export const SOURCE_LABEL: Record<string, string> = { google: 'Google ค้นหา (SEO)', gads: 'Google Ads', meta: 'Facebook / IG Ads', social: 'Social (ไม่เสียเงิน)', line: 'LINE OA', wa: 'WhatsApp โดยตรง', phone: 'โทรศัพท์', ref: 'ลูกค้าแนะนำ / Agent', other: 'เว็บไซต์อื่น', direct: 'เข้าเว็บโดยตรง' };
export const CONTACT_LABEL: Record<string, string> = { web_form: 'ฟอร์มบนเว็บ', whatsapp: 'WhatsApp', line: 'LINE', phone: 'โทรศัพท์', email: 'อีเมล', walk_in: 'Walk-in' };
export const LOST_REASONS = ['วันที่ต้องการเรือเต็ม', 'ราคาเกินงบ', 'เลือกเจ้าอื่น', 'ติดต่อลูกค้าไม่ได้', 'เลื่อน / ยกเลิกแผนเที่ยว', 'สภาพอากาศ / มรสุม', 'อื่น ๆ'];

/** Map raw attribution (utm_source / referrer host / click id) to our source keys */
export function sourceKey(raw?: string | null, medium?: string | null, gclid?: string | null, fbclid?: string | null) {
  const s = (raw || '').toLowerCase(), m = (medium || '').toLowerCase();
  if (gclid || s === 'google_ads' || (s.includes('google') && /cpc|paid|ppc/.test(m))) return 'gads';
  if (s === 'meta_ads' || ((/facebook|instagram|meta|fb|ig/.test(s)) && /cpc|paid|ads?/.test(m))) return 'meta';
  if (fbclid) return 'meta';
  if (/google|bing|yahoo|duckduckgo|yandex|baidu/.test(s)) return 'google';
  if (/facebook|instagram|tiktok|youtube|twitter|x\.com|t\.co|pinterest/.test(s)) return 'social';
  if (/line/.test(s)) return 'line';
  if (/whatsapp|wa\.me/.test(s)) return 'wa';
  if (/ref|agent|partner/.test(s)) return 'ref';
  if (!s || s === 'direct') return 'direct';
  return SOURCE_LABEL[s] ? s : 'other';
}

export const SCORE_LABEL = (s: number) => s >= 60 ? { key: 'hot', th: 'ร้อน', cls: 'bg-[#fdecea] text-[#b42318]' } : s >= 35 ? { key: 'warm', th: 'อุ่น', cls: 'bg-[#fff6e5] text-[#9a5b00]' } : { key: 'cold', th: 'เย็น', cls: 'bg-[#eaf2f7] text-[#3b6e8f]' };

export function scoreLead(x: { tripDate: string | null; adults: number; children: number; pagesViewed: number | null; boatsViewed: string[]; program: string | null; returning: boolean; source: string; hasEmail: boolean; wonBefore: boolean }) {
  const r: [string, number][] = [];
  if (x.tripDate) { const d = (new Date(x.tripDate + 'T00:00:00').getTime() - Date.now()) / 864e5; if (d >= -1 && d <= 21) r.push(['วันออกเรือภายใน 3 สัปดาห์', 25]); else if (d > 21 && d <= 90) r.push(['วางแผนล่วงหน้า 1–3 เดือน', 12]); }
  const g = x.adults + x.children; if (g >= 8) r.push([`กลุ่มใหญ่ ${g} คน`, 12]);
  if ((x.pagesViewed ?? 0) >= 6) r.push([`ดูเว็บ ${x.pagesViewed} หน้า`, 12]);
  if (x.boatsViewed.length >= 2) r.push([`เทียบเรือ ${x.boatsViewed.length} ลำ`, 8]);
  if (x.program) r.push(['ระบุโปรแกรมที่ต้องการ', 10]);
  if (x.returning) r.push(['กลับมาเว็บซ้ำ', 8]);
  if (['ref', 'wa', 'line', 'phone'].includes(x.source)) r.push(['ทักมาเอง / มีคนแนะนำ', 15]);
  if (x.hasEmail) r.push(['ให้อีเมลด้วย', 5]);
  if (x.wonBefore) r.push(['เคยเป็นลูกค้าแล้ว', 20]);
  return { score: Math.min(100, r.reduce((s, [, n]) => s + n, 0)), reasons: r };
}
