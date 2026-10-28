import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createLead, sourceKey } from '@/lib/leads';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const str = (max: number) => z.string().trim().max(max).optional().nullable();
const Body = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(40).regex(/^[+\d\s().\-@a-zA-Z_]+$/),
  email: z.string().trim().email().max(160).optional().or(z.literal('')).nullable(),
  item: str(160), program: str(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).nullable(),
  adults: z.coerce.number().int().min(0).max(500).optional(), children: z.coerce.number().int().min(0).max(200).optional(),
  slot: str(40), message: str(2000), lang: z.enum(['th', 'en']).optional(), marketing_consent: z.boolean().optional(),
  /** honeypot — real people never fill it */
  website: z.string().max(0).optional().or(z.literal('')),
  /** ms since the form was shown — bots submit instantly */
  t: z.coerce.number().optional(),
  context: z.object({
    source: str(200), medium: str(100), campaign: str(200), content: str(200), gclid: str(300), fbclid: str(300), referrer: str(500), landing_page: str(500), current_page: str(500),
    first_touch: z.any().optional(), pages_viewed: z.coerce.number().int().min(0).max(10000).optional(), visits: z.coerce.number().int().min(0).max(10000).optional(), returning: z.boolean().optional(),
    boats_viewed: z.array(z.string().max(80)).max(20).optional(), device: str(20), event_id: str(80),
  }).partial().optional(),
});

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit('lead:' + ip, 6, 10 * 60_000)) return NextResponse.json({ ok: false, error: 'too_many_requests' }, { status: 429 });
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }); }
  const p = Body.safeParse(raw);
  if (!p.success) return NextResponse.json({ ok: false, error: 'invalid', fields: p.error.flatten().fieldErrors }, { status: 422 });
  const b = p.data;
  // silently accept bots so they don't retry, but don't create anything
  if (b.website || (b.t !== undefined && b.t < 2500)) return NextResponse.json({ ok: true });
  // security: these are shown as plain labels in the admin — strip markup characters (names / messages are escaped where shown)
  const plain = <T extends string | null | undefined>(v: T) => (typeof v === 'string' ? v.replace(/[<>"'`\\]/g, '').trim() : v) as T;
  b.item = plain(b.item); b.program = plain(b.program); b.slot = plain(b.slot);
  if (b.context) { const c = b.context as Record<string, unknown>; for (const k of Object.keys(c)) if (typeof c[k] === 'string') c[k] = plain(c[k] as string); if (b.context.boats_viewed) b.context.boats_viewed = b.context.boats_viewed.map(x => plain(x)); }
  const c = b.context ?? {};
  const ctx = { ...c, source: sourceKey(c.source, c.medium, c.gclid, c.fbclid) } as NonNullable<Parameters<typeof createLead>[0]['ctx']>;
  try {
    const r = await createLead({ name: b.name, phone: b.phone, email: b.email || null, item: b.item, program: b.program, date: b.date || null, adults: b.adults, children: b.children, slot: b.slot, message: b.message, lang: b.lang, marketingConsent: b.marketing_consent, ctx, ip, userAgent: req.headers.get('user-agent') });
    return NextResponse.json({ ok: true, ref: r.lead.ref });
  } catch (e) {
    console.error('[lead]', e);
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 });
  }
}
