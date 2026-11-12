import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { boats, customers, leadActivities, leads, settings } from '@/db/schema';
import { escHtml, loadMailCfg, mailLayout, mailReady, sendMail } from './mail';

/** contact details shown in emails / documents: /admin → ตั้งค่า (admin.sitecfg), with the official ones as defaults */
export async function contactInfo() {
  const [r] = await db.select().from(settings).where(eq(settings.key, 'admin.sitecfg'));
  const c = (r?.value ?? {}) as Record<string, unknown>, s = (k: string, d: string) => (typeof c[k] === 'string' && (c[k] as string).trim()) || d;
  const reg = (c.regAddr ?? c.address ?? {}) as Record<string, string>;
  return {
    phone: s('phone', '+66 61 172 5854'), wa: s('wa', '+66 61 172 5854'), email: s('email', 'boattripthailand@gmail.com'), line: s('line', '@boattripthailand'), lineUrl: s('lineUrl', 'https://lin.ee/kkzkoX7'),
    company: s('company', 'BOAT TRIP (THAILAND) CO.,LTD'), companyTh: s('companyTh', s('company', 'BOAT TRIP (THAILAND) CO.,LTD'))   /* the Thai name only when set in ตั้งค่า › บริษัท — never guessed */, tax: s('tax', ''), tat: s('tat', ''),
    addrTh: (reg.th || '').trim() || '79/29 หมู่ 4 ต.เกาะแก้ว อ.เมืองภูเก็ต จ.ภูเก็ต 83000', addrEn: (reg.en || '').trim() || '79/29 Moo 4, Koh Kaew, Muang Phuket, Phuket 83000',
  };
}
export const waLink = (n: string) => 'https://wa.me/' + n.replace(/\D/g, '');
const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const fmtDate = (iso: string | null | undefined, lang: 'th' | 'en') => { if (!iso) return ''; const d = new Date(iso + 'T00:00:00'); if (isNaN(+d)) return iso;
  return lang === 'th' ? `${d.getDate()} ${TH_M[d.getMonth()]} ${d.getFullYear() + 543}` : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };

/** "we got your request" — sent right after a booking request from the website, in the customer's language */
export async function sendLeadAck(leadId: string) {
  const cfg = await loadMailCfg();
  if (!cfg.ack || !(await mailReady())) return;
  const [l] = await db.select().from(leads).where(eq(leads.id, leadId)); if (!l) return;
  const [c] = await db.select().from(customers).where(eq(customers.id, l.customerId));
  if (!c?.email) return;
  const [b] = l.boatSlug ? await db.select({ name: boats.name }).from(boats).where(eq(boats.slug, l.boatSlug)) : [];
  const lang: 'th' | 'en' = l.lang === 'en' ? 'en' : 'th', T = (th: string, en: string) => lang === 'th' ? th : en, ci = await contactInfo();
  const guests = l.adults + l.children;
  const rows: [string, string][] = [[T('เลขที่คำขอ', 'Request no.'), l.ref], [T('เรือ', 'Boat'), b?.name ?? ''], [T('โปรแกรม', 'Program'), l.program ?? ''], [T('วันที่ต้องการ', 'Date'), fmtDate(l.tripDate, lang)], [T('รอบเวลา', 'Time'), l.slot ?? ''], [T('จำนวนคน', 'Guests'), guests ? String(guests) + T(' คน', '') : '']];
  const html = mailLayout({ lang, preheader: T(`ได้รับคำขอ ${l.ref} แล้ว ทีมขายจะติดต่อกลับเร็ว ๆ นี้`, `We received your request ${l.ref}. Our team will contact you shortly.`),
    title: T(`ขอบคุณ คุณ${c.name.replace(/^คุณ\s*/, '')} เราได้รับคำขอของคุณแล้ว`, `Thank you, ${c.name} — we received your request`),
    intro: T('ทีมขายจะตรวจสอบเรือว่างและส่งราคาให้คุณภายใน 30 นาที (09:00–21:00 น.) ทาง WhatsApp, LINE หรืออีเมล ยังไม่มีค่าใช้จ่ายใด ๆ จนกว่าจะยืนยันการจอง',
      'Our team will check availability and send you the price within 30 minutes (09:00–21:00 Thailand time) by WhatsApp, LINE or email. Nothing is charged until you confirm the booking.'),
    rows, after: T('ต้องการแก้ไขรายละเอียด หรือคุยกับทีมงานเลย กดปุ่มด้านล่างได้', 'Want to change something or talk to us now? Tap a button below.'),
    buttons: [{ label: 'WhatsApp', href: waLink(ci.wa), color: '#128c4a' }, { label: 'LINE', href: ci.lineUrl, color: '#06a64a' }, { label: T('โทร ', 'Call ') + ci.phone, href: 'tel:' + ci.phone.replace(/[^\d+]/g, '') }],
    footer: `${escHtml(lang === 'th' ? ci.companyTh : ci.company)}${ci.tat ? ' · TAT ' + escHtml(ci.tat) : ''}<br>${escHtml(lang === 'th' ? ci.addrTh : ci.addrEn)}<br>${T('อีเมลนี้ส่งอัตโนมัติจากการขอใบเสนอราคาที่ boattripthailand.com · ตอบกลับอีเมลนี้เพื่อคุยกับทีมงานได้', 'This email was sent automatically after your request on boattripthailand.com · reply to it to reach our team.')}` });
  const text = [T(`ได้รับคำขอ ${l.ref} แล้ว`, `We received your request ${l.ref}.`), ...rows.filter(r => r[1]).map(r => `${r[0]}: ${r[1]}`), `WhatsApp ${ci.wa} · LINE ${ci.line} · ${ci.phone}`].join('\n');
  try {
    const id = await sendMail({ to: c.email, subject: T(`ได้รับคำขอแล้ว ${l.ref} · Boat Trip Thailand`, `Request received ${l.ref} · Boat Trip Thailand`), html, text });
    await db.insert(leadActivities).values({ leadId: l.id, type: 'email', data: { kind: 'ack', to: c.email, ok: true, id } });
  } catch (e) {
    await db.insert(leadActivities).values({ leadId: l.id, type: 'email', data: { kind: 'ack', to: c.email, ok: false, error: e instanceof Error ? e.message : String(e) } });
  }
}
