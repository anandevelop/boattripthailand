/** Seasonal pricing engine (port of the mockup engine). Pure functions — usable on server and client. */
export type Calendar = { id: string; name: string; kind: string; ranges: Record<string, [string, string][]>; special: { from: string; to: string; label?: string }[]; add: number; addHalf?: number };
export type SeasonKey = 'low' | 'high' | 'peak' | 'special' | 'all';
export const SEASON_LABEL: Record<SeasonKey, { th: string; en: string }> = { low: { th: 'Low Season', en: 'Low Season' }, high: { th: 'High Season', en: 'High Season' }, peak: { th: 'Peak Season', en: 'Peak Season' }, special: { th: 'ช่วงพิเศษ', en: 'Special dates' }, all: { th: 'ราคาทั้งปี', en: 'All year' } };
type Table = { caption: string; columns: string[]; rows: string[][] };
type BoatLike = { slug: string; data: { tables: Table[]; colmap?: (string | null)[] | null } };

/** A price cell starts with the amount ("24,500 THB"); text that merely mentions one ("1-7pax; Extra charge …/1000 THB") is not a price. */
export const priceNum = (v: string | undefined | null) => { const m = String(v || '').replace(/\s/g, '').match(/^([\d,]{4,})T?HB/i); return m ? +m[1].replace(/,/g, '') : 0; };
const mdIn = (md: string, a: string, b: string) => a <= b ? md >= a && md <= b : md >= a || md <= b;
const rIn = (iso: string, f: string, t: string) => f.length > 5 ? iso >= f && iso <= t : mdIn(iso.slice(5), f, t);
export const specialAt = (cal: Calendar, iso: string) => (cal.special || []).find(s => rIn(iso, s.from, s.to)) || null;
export function baseSeason(cal: Calendar, iso: string): SeasonKey | null { if (cal.kind !== 'season') return 'all'; for (const k of ['peak', 'high', 'low'] as const) if ((cal.ranges[k] || []).some(([f, t]) => rIn(iso, f, t))) return k; return null; }
export function colKey(h: string): SeasonKey | null { h = (h || '').toLowerCase(); if (/peak/.test(h)) return 'peak'; if (/high/.test(h)) return 'high'; if (/low/.test(h)) return 'low'; if (/except/.test(h)) return 'all'; if (/special|surcharge/.test(h)) return 'special'; if (/all years?/.test(h)) return 'all'; return null; }
export const tableKeys = (b: BoatLike, tb: Table) => tb.columns.map((c, i) => (i ? (b.data.colmap ? (b.data.colmap[i] as SeasonKey | null) : colKey(c)) : null));
/** Half-day program? The column header decides ("Half Day Morning" / "Fullday 9 hrs."), else the program name, else the table caption. */
export const isHalfDay = (tb: Table, ci: number, row?: string[]) => { const h = tb.columns[ci] || ''; if (/half/i.test(h)) return true; if (/full/i.test(h)) return false; return /half/i.test(row?.[0] || '') || /half/i.test(tb.caption || ''); };
/** Holiday surcharge for one price cell: `addHalf` for half-day programs when set, otherwise `add`. */
export const surchargeFor = (v: { add: number; addHalf: number }, tb: Table, ci: number, row?: string[]) => (!v.add ? 0 : v.addHalf && isHalfDay(tb, ci, row) ? v.addHalf : v.add);
const isSeasonTable = (ks: (SeasonKey | null)[]) => (ks.some(k => k && k !== 'all') && ks.filter(Boolean).length > 1) || ks.some(k => k === 'special');
const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const todayISO = () => iso(new Date());

export function seasonView(b: BoatLike, cal: Calendar, date: string) {
  const base = baseSeason(cal, date), sp = specialAt(cal, date);
  const hasSpecialCol = b.data.tables.some(tb => tableKeys(b, tb).includes('special'));
  let key: SeasonKey | null = sp && hasSpecialCol ? 'special' : base;
  if (!key) { const d = new Date(date + 'T00:00:00'); for (let i = 1; i < 370 && !key; i++) key = baseSeason(cal, iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i))); }
  return { base, sp, key: key ?? 'all', add: sp && cal.add ? cal.add : 0, addHalf: sp && cal.add ? cal.addHalf || 0 : 0 };
}

/** Rows with the single price that applies on `date` (season tables) or all prices (flat tables) */
export function pricesOn(b: BoatLike, cal: Calendar, date: string) {
  const v = seasonView(b, cal, date);
  return b.data.tables.map(tb => {
    const ks = tableKeys(b, tb);
    if (!isSeasonTable(ks)) return { caption: tb.caption, season: null as SeasonKey | null, columns: tb.columns, rows: tb.rows.map(r => ({ program: r[0], prices: r.slice(1).map((c, i) => { const n = priceNum(c); return n ? n + surchargeFor(v, tb, i + 1, r) : null; }), raw: r.slice(1) })) };
    let ci = ks.indexOf(v.key); if (ci < 0 && v.key === 'special') ci = ks.indexOf(v.base as SeasonKey);
    return { caption: tb.caption, season: v.key, columns: ['Program', tb.columns[ci] ?? ''], rows: tb.rows.map(r => ({ program: r[0], prices: [ci > 0 ? priceNum(r[ci]) || null : null], raw: [ci > 0 ? r[ci] : ''] })) };
  });
}

export function fromPriceOn(b: BoatLike, cal: Calendar, date = todayISO()) {
  const nums = pricesOn(b, cal, date).flatMap(t => t.rows.flatMap(r => r.prices.filter((n): n is number => !!n)));
  return nums.length ? Math.min(...nums) : null;
}

/** Is `date` inside a holiday / surcharge period for this boat? Used to warn sales on new leads. */
export function surchargeOn(b: BoatLike, cal: Calendar, date: string) {
  const sp = specialAt(cal, date);
  if (!sp) return null;
  const specialCol = b.data.tables.some(tb => tableKeys(b, tb).includes('special'));
  if (!cal.add && !specialCol) return null;
  const hasHalf = b.data.tables.some(tb => tb.columns.some((_, ci) => ci > 0 && tb.rows.some(r => priceNum(r[ci]) && isHalfDay(tb, ci, r))));
  const amount = !cal.add ? 'ใช้ราคาช่วงพิเศษในตาราง' : cal.addHalf && hasHalf && cal.addHalf !== cal.add ? `+${cal.addHalf.toLocaleString('en-US')} บาท (Half day) / +${cal.add.toLocaleString('en-US')} บาท (Full day)` : `+${cal.add.toLocaleString('en-US')} บาท`;
  return { label: sp.label || 'ช่วงพิเศษ', from: sp.from, to: sp.to, text: `${sp.label || 'ช่วงพิเศษ'} · ${amount}` };
}
