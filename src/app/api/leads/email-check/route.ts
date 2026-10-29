import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/ratelimit';
import { checkEmail } from '@/lib/spam';

export const runtime = 'nodejs';

/** Booking form: checks the email when the field loses focus. POST /api/leads checks it again. */
export async function GET(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit('email-check:' + ip, 30, 10 * 60_000)) return NextResponse.json({ ok: true });   // don't block the form, POST still checks
  const e = new URL(req.url).searchParams.get('e') || '';
  return NextResponse.json(await checkEmail(e), { headers: { 'Cache-Control': 'no-store' } });
}
