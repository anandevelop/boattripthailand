import { NextResponse } from 'next/server';
import { z } from 'zod';
import { contactKey, createLead, sourceKey } from '@/lib/leads';
import { rateLimit } from '@/lib/ratelimit';
import { checkEmail, hasLink } from '@/lib/spam';
import { checkToken, spamReasons, turnstileOk, turnstileOn } from '@/lib/form-guard';

export const runtime = 'nodejs';

const str = (max: number) => z.string().trim().max(max).optional().nullable();
const Body = z.object({
  name: z.string().trim().min(1).max(120),
  // a phone number, a LINE ID, or (when the guest chose to be contacted by email) the email address
  phone: z.string().trim().min(3).max(160).regex(/^[+\d\s().\-@a-zA-Z_]+$/),
  email: z.string().trim().email().max(160).optional().or(z.literal('')).nullable(),
  whatsapp: z.string().trim().max(30).regex(/^\+?[\d\s().-]*$/).refine(v => !v || v.replace(/\D/g, '').length >= 7).optional().nullable(),
  item: str(160), program: str(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).nullable(),
  adults: z.coerce.number().int().min(0).max(500).optional(), children: z.coerce.number().int().min(0).max(200).optional(),
  slot: str(40), message: str(2000), lang: z.enum(['th', 'en']).optional(), marketing_consent: z.boolean().optional(),
  /** honeypot — real people never fill it */
  website: z.string().max(500).optional().nullable(),   // any value → silently dropped below
  /** ms since the form was shown — bots submit instantly */
  t: z.coerce.number().optional(),
  /** signed one-time form token (GET /api/leads/token) and the Cloudflare Turnstile token when Turnstile is on */
  k: z.string().max(200).optional().nullable(), cf: z.string().max(4096).optional().nullable(),
  context: z.object({
    source: str(200), medium: str(100), campaign: str(200), content: str(200), gclid: str(300), fbclid: str(300), referrer: str(500), landing_page: str(500), current_page: str(500),
    first_touch: z.any().optional(), pages_viewed: z.coerce.number().int().min(0).max(10000).optional(), visits: z.coerce.number().int().min(0).max(10000).optional(), returning: z.boolean().optional(),
    boats_viewed: z.array(z.string().max(80)).max(20).optional(), device: str(20), event_id: str(80),
  }).partial().optional(),
});

/** a request was sent from another site (a form or script elsewhere posting here) */
function crossSite(req: Request) {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return true;
  const o = req.headers.get('origin'); if (!o) return false;
  let h = ''; try { h = new URL(o).host; } catch { return true; }
  const own = new Set([req.headers.get('host'), req.headers.get('x-forwarded-host')].filter(Boolean) as string[]);
  try { own.add(new URL(process.env.APP_URL || '').host); } catch { /* not set */ }
  return !own.has(h);
}
const recent = new Map<string, number>();   // same person, same trip, a few minutes apart = one lead
const silent = (why: string, ip: string) => { console.warn('[lead] dropped', why, ip); return NextResponse.json({ ok: true }); };   // bots get "ok" so they don't retry

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  if (crossSite(req)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  if (!(req.headers.get('content-type') || '').includes('application/json')) return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 415 });
  // per visitor: 6 in 10 minutes, 20 a day · whole site: 80 in 10 minutes (a flood from many addresses)
  if (!rateLimit('lead:' + ip, 6, 10 * 60_000) || !rateLimit('lead-day:' + ip, 20, 24 * 3600e3)) return NextResponse.json({ ok: false, error: 'too_many_requests' }, { status: 429 });
  if (!rateLimit('lead-all', 80, 10 * 60_000)) return NextResponse.json({ ok: false, error: 'too_many_requests' }, { status: 429 });
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }); }
  const p = Body.safeParse(raw);
  if (!p.success) return NextResponse.json({ ok: false, error: 'invalid', fields: p.error.flatten().fieldErrors }, { status: 422 });
  const b = p.data;
  // security: these are shown as plain labels in the admin — strip markup characters (names / messages are escaped where shown)
  const plain = <T extends string | null | undefined>(v: T) => (typeof v === 'string' ? v.replace(/[<>"'`\\]/g, '').trim() : v) as T;
  b.item = plain(b.item); b.program = plain(b.program); b.slot = plain(b.slot);
  if (b.context) { const c = b.context as Record<string, unknown>; for (const k of Object.keys(c)) if (typeof c[k] === 'string') c[k] = plain(c[k] as string); if (b.context.boats_viewed) b.context.boats_viewed = b.context.boats_viewed.map(x => plain(x)); }
  // silently accept bots so they don't retry, but don't create anything
  if (b.website) return silent('honeypot', ip);
  if (b.t !== undefined && b.t < 2500) return silent('fast-form', ip);
  // the signed form token: needs JavaScript, ≥ 3 s old, used once. A missing / spent one → the form fetches a new one and resends once
  const tk = checkToken(b.k);
  if (tk === 'fast') return silent('fast-token', ip);
  if (tk !== 'ok') return NextResponse.json({ ok: false, error: 'token', why: tk }, { status: 422 });
  if (turnstileOn()) { const ok = await turnstileOk(b.cf, ip); if (ok === false) return NextResponse.json({ ok: false, error: 'captcha' }, { status: 422 }); }
  const spam = spamReasons(b);
  if (spam.length) return silent('content:' + spam.join(','), ip);
  // no links in anything a person types (the email field is checked as an address below)
  const linked = (['name', 'phone', 'whatsapp', 'item', 'program', 'slot', 'message'] as const).filter(k => hasLink(b[k], k !== 'phone'));
  if (linked.length) return NextResponse.json({ ok: false, error: 'invalid', fields: Object.fromEntries(linked.map(k => [k, ['link']])) }, { status: 422 });
  if (b.email) { const ec = await checkEmail(b.email); if (!ec.ok) return NextResponse.json({ ok: false, error: 'invalid', fields: { email: [ec.reason] } }, { status: 422 }); }
  // one person: 5 requests an hour; the same trip sent twice within 10 minutes is the same lead
  const who = contactKey(b.email && !/\d{6,}/.test(b.phone) ? b.email : b.phone);
  const dup = `${who}|${b.item ?? ''}|${b.date ?? ''}|${b.program ?? ''}`, seen = recent.get(dup);
  if (seen && Date.now() - seen < 10 * 60_000) return NextResponse.json({ ok: true });
  if (!rateLimit('lead-who:' + who, 5, 60 * 60_000)) return NextResponse.json({ ok: false, error: 'too_many_requests' }, { status: 429 });
  const c = b.context ?? {};
  const ctx = { ...c, source: sourceKey(c.source, c.medium, c.gclid, c.fbclid) } as NonNullable<Parameters<typeof createLead>[0]['ctx']>;
  try {
    const r = await createLead({ name: b.name, phone: b.phone, email: b.email || null, whatsapp: b.whatsapp || null, item: b.item, program: b.program, date: b.date || null, adults: b.adults, children: b.children, slot: b.slot, message: b.message, lang: b.lang, marketingConsent: b.marketing_consent, ctx, ip, userAgent: req.headers.get('user-agent') });
    recent.set(dup, Date.now()); if (recent.size > 5000) for (const [k2, t2] of recent) if (Date.now() - t2 > 10 * 60_000) recent.delete(k2);
    return NextResponse.json({ ok: true, ref: r.lead.ref });
  } catch (e) {
    console.error('[lead]', e);
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 });
  }
}
