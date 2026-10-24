import { eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { leads } from '@/db/schema';
import { currentUser } from '@/lib/auth';

/** Old / LINE-card links (/admin/leads/<id or ref>) → open the lead in the admin */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await currentUser())) return new Response(null, { status: 303, headers: { Location: '/admin/login' } });
  const [l] = await db.select({ ref: leads.ref }).from(leads).where(or(eq(leads.id, id), eq(leads.ref, id))).limit(1);
  return new Response(null, { status: 303, headers: { Location: l ? `/admin#/bookings/${encodeURIComponent(l.ref)}` : '/admin#/bookings' } });
}
