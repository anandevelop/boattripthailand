import { and, desc, eq, inArray, isNotNull, isNull, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { customers, leads, users } from '@/db/schema';
import { audit } from '@/lib/audit';
import { currentUser } from '@/lib/auth';
import { CONTACT_LABEL, LEAD_STATUSES, OPEN_STATUSES, SOURCE_LABEL, STATUS_LABEL, type LeadStatus } from '@/lib/lead-meta';
import { can } from '@/lib/perms';

const cell = (x: unknown) => { const s = String(x ?? ''); return /^[=@\t\r]|^[+\-](?![\d\s().-]*$)/.test(s) ? "'" + s : s; };   // security: no spreadsheet formulas from customer input (phone numbers like +66… stay as they are)
const csv = (rows: unknown[][]) => '﻿' + rows.map(r => r.map(x => `"${cell(x).replace(/"/g, '""')}"`).join(',')).join('\r\n');

export async function GET(req: Request) {
  const u = await currentUser();
  if (!u) return new Response('Unauthorized', { status: 401 });
  if (!can(u, 'export')) { await audit({ id: u.id, role: u.role }, { action: 'denied', entity: 'auth', ref: 'export', label: 'พยายาม Export ลีด' }); return new Response('Forbidden', { status: 403 }); }
  const sp = new URL(req.url).searchParams, all = can(u, 'leads_all');
  const conds: (SQL | undefined)[] = [all ? (sp.get('sales') === 'none' ? isNull(leads.assignedToId) : sp.get('sales') ? eq(leads.assignedToId, sp.get('sales')!) : undefined) : eq(leads.assignedToId, u.id)];
  const tab = sp.get('tab');
  if (tab === 'open') conds.push(inArray(leads.status, OPEN_STATUSES)); else if (tab && LEAD_STATUSES.includes(tab as LeadStatus)) conds.push(eq(leads.status, tab as LeadStatus));
  if (sp.get('source')) conds.push(eq(leads.source, sp.get('source')!));

  // Google Ads offline conversion import (won leads that came from a Google ad click)
  if (sp.get('format') === 'gads') {
    const rows = await db.select().from(leads).where(and(...conds, eq(leads.status, 'WON'), isNotNull(leads.gclid))).orderBy(desc(leads.wonAt));
    const fmt = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19) + '+00:00';
    await audit({ id: u.id, role: u.role }, { action: 'export', entity: 'lead', ref: 'gads', label: `Export Google Ads offline conversions ${rows.length} แถว` });
    return new Response(csv([['Parameters:TimeZone=+00:00'], ['Google Click ID', 'Conversion Name', 'Conversion Time'], ...rows.map(l => [l.gclid, process.env.GADS_CONVERSION_NAME || 'Charter booked', fmt(l.wonAt ?? l.updatedAt)])]), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="google-ads-offline-conversions.csv"' } });
  }

  const rows = await db.select({ l: leads, c: customers, s: users.name }).from(leads).innerJoin(customers, eq(customers.id, leads.customerId)).leftJoin(users, eq(users.id, leads.assignedToId)).where(and(...conds)).orderBy(desc(leads.createdAt)).limit(20000);
  await audit({ id: u.id, role: u.role }, { action: 'export', entity: 'lead', ref: 'csv', label: `Export ลีด ${rows.length} รายการ` });
  const body = csv([['lead', 'created', 'customer', 'phone', 'email', 'language', 'marketing_consent', 'boat', 'program', 'trip_date', 'adults', 'children', 'source', 'campaign', 'landing_page', 'contact_via', 'score', 'status', 'lost_reason', 'sales', 'first_reply_min', 'next_follow_up'],
    ...rows.map(({ l, c, s }) => [l.ref, l.createdAt.toISOString(), c.name, c.phone, c.email, l.lang, c.marketingConsent ? 'yes' : 'no', l.boatSlug ?? l.item, l.program, l.tripDate, l.adults, l.children, SOURCE_LABEL[l.source] ?? l.source, l.campaign, l.landingPage, CONTACT_LABEL[l.contactVia] ?? l.contactVia, l.score, STATUS_LABEL[l.status], l.lostReason, s, l.firstReplyAt ? Math.round((+l.firstReplyAt - +l.createdAt) / 60000) : '', l.nextFollowUp])]);
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="btt-leads.csv"' } });
}
