import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

/**
 * Activities & tours (/admin → กิจกรรม & ทัวร์). data/activities.json holds the original list from the approved
 * mockup; once staff save, settings 'site.activities' replaces it. `pic` is each activity's id (and the photo
 * folder prefix in public/img/acts); `imgs` set in admin win over those folder photos; `active: false` hides it.
 */
export const ACTS_KEY = 'site.activities';
export const ACT_CATS = ['show', 'city', 'activity', 'seatour', 'tourth', 'water', 'outdoor', 'stay', 'spa', 'animal', 'lounge', 'food'] as const;
type Bi = { th: string; en: string };
export type Activity = {
  cat: string; pic: string; th: string; en: string; loc: string; locTh?: string; dur: string; durTh?: string; price: number | null;
  tag?: Bi; desc?: Bi; kw?: string[]; itin?: Bi[]; facts?: Bi[]; op?: string; marina?: string; progs?: unknown; rates?: unknown;
  imgs?: string[]; active?: boolean;
};

export const ACTS_DEFAULT: Activity[] = JSON.parse(readFileSync(path.join(process.cwd(), 'data/activities.json'), 'utf8'));

const s = (v: unknown, max: number) => (typeof v === 'string' ? v : '').trim().slice(0, max);
const bi = (v: unknown, max: number): Bi | undefined => { if (!v || typeof v !== 'object') return undefined; const o = v as Record<string, unknown>; const r = { th: s(o.th, max), en: s(o.en, max) }; return r.th || r.en ? r : undefined; };
const biList = (v: unknown, n: number, max: number) => (Array.isArray(v) ? v.map(x => bi(x, max)).filter((x): x is Bi => !!x).slice(0, n) : undefined);
// nested tables (programs / seasonal rates) are only shown, never executed: keep them as plain JSON within a size cap
const json = (v: unknown, max: number) => (v && typeof v === 'object' && JSON.stringify(v).length <= max ? JSON.parse(JSON.stringify(v)) : undefined);

export function cleanActivities(v: unknown): Activity[] {
  if (!Array.isArray(v)) throw new Error('bad list');
  const seen = new Set<string>(), out: Activity[] = [];
  for (const raw of v.slice(0, 300)) {
    const a = (raw ?? {}) as Record<string, unknown>;
    const pic = s(a.pic, 60).toLowerCase();
    if (!/^[a-z0-9-]{1,60}$/.test(pic) || seen.has(pic)) continue;
    seen.add(pic);
    const price = Number(a.price);
    const item: Activity = {
      cat: (ACT_CATS as readonly string[]).includes(s(a.cat, 20)) ? s(a.cat, 20) : 'activity', pic,
      th: s(a.th, 160) || s(a.en, 160) || pic, en: s(a.en, 160) || s(a.th, 160) || pic,
      loc: s(a.loc, 120), locTh: s(a.locTh, 120) || undefined, dur: s(a.dur, 80), durTh: s(a.durTh, 80) || undefined,
      price: Number.isFinite(price) && price > 0 ? Math.round(price) : null,
      tag: bi(a.tag, 300), desc: bi(a.desc, 5000), kw: Array.isArray(a.kw) ? a.kw.map(x => s(x, 40)).filter(Boolean).slice(0, 20) : undefined,
      itin: biList(a.itin, 40, 300), facts: biList(a.facts, 40, 400), op: s(a.op, 160) || undefined, marina: s(a.marina, 160) || undefined,
      progs: json(a.progs, 30_000), rates: json(a.rates, 30_000),
      imgs: Array.isArray(a.imgs) ? a.imgs.map(x => s(x, 2000)).filter(u => /^(\/[^/]|https:\/\/)[^\s"'<>]*$/.test(u)).slice(0, 30) : undefined,
      active: a.active === false ? false : undefined,
    };
    out.push(JSON.parse(JSON.stringify(item)));   // drop undefined keys
  }
  return out;
}

export async function activitiesContent(): Promise<Activity[]> {
  const [row] = await db.select().from(settings).where(eq(settings.key, ACTS_KEY));
  return row ? (row.value as Activity[]) : ACTS_DEFAULT;
}
