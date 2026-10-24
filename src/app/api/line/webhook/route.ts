import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leadActivities, leads, settings, users } from '@/db/schema';
import { audit } from '@/lib/audit';
import { replyLine, text, verifyLineSignature } from '@/lib/line';
import { setLeadStatus } from '@/lib/leads';

export const runtime = 'nodejs';

type Ev = { type: string; replyToken?: string; source: { type: string; userId?: string; groupId?: string }; message?: { type: string; text?: string }; postback?: { data: string } };

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyLineSignature(raw, req.headers.get('x-line-signature'))) return NextResponse.json({ ok: false }, { status: 401 });
  const { events = [] } = JSON.parse(raw) as { events: Ev[] };
  for (const ev of events) {
    try { await handle(ev); } catch (e) { console.error('[LINE webhook]', e); }
  }
  return NextResponse.json({ ok: true });
}

async function handle(ev: Ev) {
  const reply = (t: string) => ev.replyToken ? replyLine(ev.replyToken, [text(t)]) : undefined;
  const lineUserId = ev.source.userId;

  // bot added to the sales group → remember the group id for lead alerts
  if (ev.type === 'join' && ev.source.groupId) {
    await db.insert(settings).values({ key: 'line.groupId', value: ev.source.groupId }).onConflictDoUpdate({ target: settings.key, set: { value: ev.source.groupId } });
    await audit(null, { action: 'update', entity: 'settings', ref: 'line.groupId', label: 'เชื่อมกลุ่ม LINE ทีมขาย', changes: [{ f: 'LINE group', from: null, to: ev.source.groupId }] });
    return reply('เชื่อมกลุ่มนี้กับระบบลีดแล้ว ✅\nลีดที่ยังไม่มีผู้รับ และลีดที่รอเกินเวลา จะแจ้งในกลุ่มนี้');
  }

  // "LINK 123456" — sales links their LINE account (code from the profile menu in /admin)
  if (ev.type === 'message' && ev.message?.type === 'text' && lineUserId) {
    const m = ev.message.text?.trim().match(/^(?:link|เชื่อม)\s*(\d{6})$/i);
    if (m) {
      const [u] = await db.select().from(users).where(and(eq(users.lineLinkCode, m[1]), eq(users.active, true)));
      if (!u) return reply('รหัสไม่ถูกต้องหรือหมดอายุ · สร้างรหัสใหม่ได้ที่เมนูโปรไฟล์ (กดชื่อตัวเองมุมซ้ายล่าง) ในระบบหลังบ้าน');
      await db.update(users).set({ lineUserId: null }).where(eq(users.lineUserId, lineUserId));
      await db.update(users).set({ lineUserId, lineLinkCode: null }).where(eq(users.id, u.id));
      await audit({ id: u.id, role: u.role }, { action: 'update', entity: 'team', ref: u.id, label: u.name, changes: [{ f: 'LINE', from: 'ยังไม่เชื่อม', to: 'เชื่อมแล้ว' }] });
      return reply(`เชื่อมบัญชี LINE กับ ${u.name} แล้ว ✅\nลีดใหม่ที่มอบหมายให้คุณจะแจ้งที่นี่`);
    }
    return;
  }

  // "รับเรื่อง" button on a lead card
  if (ev.type === 'postback' && ev.postback?.data.startsWith('claim:') && lineUserId) {
    const [u] = await db.select().from(users).where(and(eq(users.lineUserId, lineUserId), eq(users.active, true)));
    if (!u) return reply('บัญชี LINE นี้ยังไม่ได้เชื่อมกับระบบ · พิมพ์ LINK ตามด้วยรหัส 6 หลักจากเมนูโปรไฟล์ในระบบหลังบ้าน');
    const [l] = await db.select().from(leads).where(eq(leads.id, ev.postback.data.slice(6)));
    if (!l) return reply('ไม่พบลีดนี้');
    if (l.status !== 'NEW' && l.assignedToId && l.assignedToId !== u.id) {
      const [owner] = await db.select({ name: users.name }).from(users).where(eq(users.id, l.assignedToId));
      return reply(`ลีด ${l.ref} ${owner?.name ?? 'คนอื่น'} รับเรื่องไปแล้ว`);
    }
    if (l.assignedToId !== u.id) {
      await db.update(leads).set({ assignedToId: u.id, updatedAt: new Date() }).where(eq(leads.id, l.id));
      await db.insert(leadActivities).values({ leadId: l.id, userId: u.id, type: 'assign', data: { via: 'line_claim' } });
      await audit({ id: u.id, role: u.role }, { action: 'assign', entity: 'lead', ref: l.ref, label: l.ref, changes: [{ f: 'มอบหมาย', from: l.assignedToId, to: u.name }], note: 'กดรับเรื่องจาก LINE' });
    }
    if (l.status === 'NEW') await setLeadStatus({ ...l, assignedToId: u.id }, 'CONTACTED', u);
    const mins = Math.round((Date.now() - +l.createdAt) / 60000);
    return reply(`รับเรื่อง ${l.ref} แล้ว ✅ (ตอบใน ${mins} นาที)\nติดต่อลูกค้าได้เลย`);
  }
}
