import { NextResponse } from 'next/server';
import { postBody } from '@/lib/site-render';

export const runtime = 'nodejs';
export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  const p = Number.isInteger(id) ? await postBody(id) : null;
  if (!p) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(p, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
