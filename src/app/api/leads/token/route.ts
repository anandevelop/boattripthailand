import { NextResponse } from 'next/server';
import { issueToken } from '@/lib/form-guard';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A booking form asks for this once the visitor starts filling it in; POST /api/leads needs it (lib/form-guard.ts). */
export async function GET(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!rateLimit('lead-token:' + ip, 40, 10 * 60_000)) return NextResponse.json({ k: '' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ k: issueToken() }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
