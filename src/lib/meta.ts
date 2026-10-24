import 'server-only';
import { sha256, sha256Lower } from './crypto';
import { logConversion } from './marketing';

/** Meta Conversions API — server-side events, deduplicated with the browser Pixel via event_id */
export async function sendMetaEvent(ev: { name: string; eventId?: string | null; email?: string | null; phone?: string | null; fbclid?: string | null; ip?: string | null; userAgent?: string | null; url?: string | null; createdAt?: Date; custom?: Record<string, unknown>; actionSource?: 'website' | 'system_generated'; leadId?: string | null }) {
  const log = (status: string, detail?: string | null) => logConversion({ leadId: ev.leadId, event: ev.name, platform: 'meta', status, detail });
  const pixel = process.env.META_PIXEL_ID, tokenV = process.env.META_CAPI_TOKEN;
  if (!pixel || !tokenV) { await log('skipped', 'ยังไม่ได้ตั้งค่า META_PIXEL_ID / META_CAPI_TOKEN'); return { skipped: true }; }
  const ph = ev.phone ? ev.phone.replace(/\D/g, '').replace(/^0/, '66') : null;
  const t = Math.floor(+(ev.createdAt ?? new Date()) / 1000);
  const body = { data: [{ event_name: ev.name, event_time: t, event_id: ev.eventId ?? undefined, action_source: ev.actionSource ?? 'website', event_source_url: ev.url ?? undefined,
    user_data: { em: ev.email ? [sha256Lower(ev.email)] : undefined, ph: ph ? [sha256(ph)] : undefined, fbc: ev.fbclid ? `fb.1.${t * 1000}.${ev.fbclid}` : undefined, client_ip_address: ev.ip ?? undefined, client_user_agent: ev.userAgent ?? undefined },
    custom_data: ev.custom }], ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}) };
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${tokenV}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const t = await r.text().catch(() => ''); console.error('[Meta CAPI]', r.status, t); await log('failed', `HTTP ${r.status} ${t}`); }
    else await log('sent', [ev.email && 'อีเมล', ph && 'เบอร์', ev.fbclid && 'fbclid'].filter(Boolean).join(' · ') || null);
    return { ok: r.ok };
  } catch (e) { console.error('[Meta CAPI]', e); await log('failed', String(e)); return { ok: false }; }
}
