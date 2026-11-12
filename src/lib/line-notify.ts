import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

/** ตั้งค่า → LINE & แจ้งเตือน → "การแจ้งเตือนที่ส่ง": on/off for the lead messages. .env values are the defaults. */
export type LeadNotify = { newLead: boolean; dupLead: boolean; sla: boolean; slaMinutes: number; alwaysGroup: boolean; at?: string; by?: string };
const KEY = 'line.notify';
const envMins = () => { const n = Math.round(Number(process.env.LEAD_SLA_MINUTES || 15)); return n >= 1 && n <= 1440 ? n : 15; };
const defaults = (): LeadNotify => ({ newLead: true, dupLead: true, sla: true, slaMinutes: envMins(), alwaysGroup: process.env.LINE_ALWAYS_NOTIFY_GROUP === 'true' });

export async function loadLeadNotify(): Promise<LeadNotify> {
  const [r] = await db.select().from(settings).where(eq(settings.key, KEY));
  return { ...defaults(), ...((r?.value as Partial<LeadNotify>) ?? {}) };
}

export async function saveLeadNotify(b: Record<string, unknown>, by: string) {
  const before = await loadLeadNotify();
  const bool = (k: 'newLead' | 'dupLead' | 'sla' | 'alwaysGroup') => b[k] === undefined ? before[k] : b[k] === true;
  const m = Math.round(Number(b.slaMinutes));
  const after: LeadNotify = { newLead: bool('newLead'), dupLead: bool('dupLead'), sla: bool('sla'), alwaysGroup: bool('alwaysGroup'),
    slaMinutes: b.slaMinutes === undefined ? before.slaMinutes : m >= 5 && m <= 240 ? m : before.slaMinutes, at: new Date().toISOString(), by };
  await db.insert(settings).values({ key: KEY, value: after }).onConflictDoUpdate({ target: settings.key, set: { value: after } });
  return { before, after };
}
