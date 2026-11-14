import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

/**
 * /admin → เรือ & ราคา → ท่าเรือ: the pin of each pier (boat page map, navigate button, taxi card, drive times).
 * Built-in list = PIERS in public/site/fleet.js (kept in step with DEFAULT_PIERS below). Pins set in the admin are
 * stored in settings 'site.piers' as { [c]: { ll, at, by } } and reach the site as window.__PIERS__.
 * A pin set here counts as checked (ok: true): navigation goes to the coordinates, not a name search.
 */
export const PIERS_KEY = 'site.piers';
export type Pier = { c: string; n: string; th: string; ll: [number, number]; ok: boolean };
type Saved = Record<string, { ll: [number, number]; at: string; by: string }>;

export const DEFAULT_PIERS: Pier[] = [
  { c: 'Chalong Pier', n: 'Chalong Pier', th: 'ท่าเทียบเรืออ่าวฉลอง', ll: [7.8215, 98.3608], ok: false },
  { c: 'Royal Phuket Marina', n: 'Royal Phuket Marina', th: 'รอยัล ภูเก็ต มารีน่า', ll: [7.96658, 98.3915], ok: true },
  { c: 'Boat Lagoon', n: 'Boat Lagoon Phuket', th: 'โบ๊ทลากูน ภูเก็ต', ll: [7.96667, 98.38667], ok: true },
  { c: 'Ao Po Grand Marina', n: 'Ao Po Grand Marina', th: 'อ่าวปอ แกรนด์ มารีน่า', ll: [8.06939, 98.44461], ok: true },
  { c: 'ONE°15 Marina Panwa', n: 'ONE°15 Marina Panwa', th: 'วันฟิฟทีน มารีน่า พันวา', ll: [7.8085, 98.4085], ok: false },
  { c: 'Coco Pier Panwa', n: 'Coco Pier Panwa', th: 'ท่าเรือโคโค่ พันวา', ll: [7.803, 98.404], ok: false },
  { c: 'Nakalay Pier (Kalim)', n: 'Nakalay Pier (Kalim)', th: 'ท่าเรือนาคาเล (กะหลิม)', ll: [7.9118, 98.2925], ok: false },
];

async function saved(): Promise<Saved> {
  const [r] = await db.select().from(settings).where(eq(settings.key, PIERS_KEY));
  return (r?.value as Saved) ?? {};
}

/** for the site bundle: only the pins set in the admin */
export async function pierPins() {
  const s = await saved();
  return Object.fromEntries(Object.entries(s).filter(([c]) => DEFAULT_PIERS.some(p => p.c === c)).map(([c, v]) => [c, v.ll]));
}

/** for the admin: every pier with its current pin, where it came from, and when it was set */
export async function piersAdmin() {
  const s = await saved();
  return DEFAULT_PIERS.map(p => { const v = s[p.c]; return { ...p, ll: v?.ll ?? p.ll, ok: v ? true : p.ok, set: v ? { at: v.at, by: v.by } : null, def: p.ll }; });
}

const inThailand = (lat: number, lng: number) => lat > 5 && lat < 21 && lng > 97 && lng < 106;
/** "7.82, 98.36" · a Google / Apple Maps link with the coordinates in it · a maps.app.goo.gl short link (followed once) */
export async function parsePin(input: string): Promise<[number, number] | null> {
  let s = String(input || '').trim().slice(0, 2000);
  if (/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//.test(s)) {
    try {
      const r = await fetch(s, { redirect: 'manual', signal: AbortSignal.timeout(8000) });
      s = r.headers.get('location') ?? s;
      if (/^https:\/\/(maps\.app\.goo\.gl|goo\.gl)/.test(s)) { const r2 = await fetch(s, { redirect: 'manual', signal: AbortSignal.timeout(8000) }); s = r2.headers.get('location') ?? s; }
    } catch { /* fall through: try the text as it is */ }
  }
  try { s = decodeURIComponent(s); } catch { /* keep */ }
  const pats = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /[?&](?:q|ll|daddr|destination|query|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /^\s*\(?(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\)?\s*$/];
  for (const re of pats) { const m = s.match(re); if (m) { const lat = +(+m[1]).toFixed(6), lng = +(+m[2]).toFixed(6); if (inThailand(lat, lng)) return [lat, lng]; } }
  return null;
}

/** set (ll) or clear (null → back to the built-in pin) one pier */
export async function savePier(c: string, ll: [number, number] | null, by: string) {
  if (!DEFAULT_PIERS.some(p => p.c === c)) throw new Error('ไม่พบท่าเรือนี้');
  const s = await saved(), before = s[c]?.ll ?? null;
  if (ll) s[c] = { ll, at: new Date().toISOString(), by }; else delete s[c];
  await db.insert(settings).values({ key: PIERS_KEY, value: s }).onConflictDoUpdate({ target: settings.key, set: { value: s } });
  return { before, after: ll };
}
