import 'server-only';

/**
 * "ออนไลน์ตอนนี้": who is on the public site right now, counted by the site itself.
 * Each open tab sends a small heartbeat every 30 s (random tab id, no cookie, no IP stored).
 * A tab counts as online while its last heartbeat is < 5 min old. Kept in memory only:
 * a restart / deploy starts from zero and open tabs reappear within 30 s.
 */
const WINDOW = 5 * 60_000;
type Tab = { at: number; p: string; s: string; d: string; l: string; b: string; f: boolean };
type State = { tabs: Map<string, Tab>; minutes: Map<number, Set<string>>; peak: { day: string; n: number; at: number } };
const G = globalThis as unknown as { __btt_live?: State };
const S: State = G.__btt_live ??= { tabs: new Map(), minutes: new Map(), peak: { day: '', n: 0, at: 0 } };

const thDay = (t: number) => new Date(t + 7 * 3600_000).toISOString().slice(0, 10);
const clean = (v: unknown, n: number) => (typeof v === 'string' ? v : '').slice(0, n);

function prune(now: number) {
  for (const [id, t] of S.tabs) if (now - t.at > WINDOW) S.tabs.delete(id);
  const oldest = Math.floor((now - 31 * 60_000) / 60_000);
  for (const m of S.minutes.keys()) if (m < oldest) S.minutes.delete(m);
}

export function liveBeat(b: Record<string, unknown>) {
  const id = clean(b.v, 40);
  if (!/^[a-z0-9]{8,40}$/i.test(id)) return;
  let p = clean(b.p, 200).split(/[?#]/)[0];
  if (!p.startsWith('/') || /^\/(admin|api|_next)(\/|$)/.test(p)) return;
  try { p = decodeURIComponent(p); } catch { /* keep */ }
  if (p.length > 1) p = p.replace(/\/+$/, '');
  const now = Date.now();
  if (!S.tabs.has(id) && S.tabs.size > 5000) return;   // flood guard
  S.tabs.set(id, { at: now, p, s: clean(b.s, 20) || 'other', d: ['mobile', 'tablet', 'desktop'].includes(String(b.d)) ? String(b.d) : 'desktop',
    l: b.l === 'en' ? 'en' : 'th', b: /^[a-z0-9-]{1,80}$/.test(String(b.b || '')) ? String(b.b) : '', f: b.f === true });
  const m = Math.floor(now / 60_000);
  (S.minutes.get(m) ?? S.minutes.set(m, new Set()).get(m)!).add(id);
  prune(now);
  const day = thDay(now), n = S.tabs.size;
  if (S.peak.day !== day) S.peak = { day, n: 0, at: 0 };
  if (n > S.peak.n) S.peak = { day, n, at: now };
}

const count = <K extends keyof Tab>(tabs: Tab[], k: K) => {
  const m = new Map<string, number>(); for (const t of tabs) m.set(String(t[k]), (m.get(String(t[k])) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, n }));
};

export function liveNow() {
  const now = Date.now(); prune(now);
  const tabs = [...S.tabs.values()];
  const m0 = Math.floor(now / 60_000);
  const minutes = Array.from({ length: 30 }, (_, i) => S.minutes.get(m0 - 29 + i)?.size ?? 0);
  const boats = new Map<string, { n: number; th: number; en: number; src: Map<string, number> }>();
  for (const t of tabs) if (t.b) {
    const x = boats.get(t.b) ?? { n: 0, th: 0, en: 0, src: new Map() };
    x.n++; x[t.l as 'th' | 'en']++; x.src.set(t.s, (x.src.get(t.s) ?? 0) + 1); boats.set(t.b, x);
  }
  const day = thDay(now);
  return {
    now: tabs.length, at: new Date(now).toISOString(), windowMin: WINDOW / 60_000,
    form: tabs.filter(t => t.f).length, onBoat: tabs.filter(t => t.b).length,
    minutes, peak: S.peak.day === day ? { n: S.peak.n, at: new Date(S.peak.at).toISOString() } : { n: tabs.length, at: new Date(now).toISOString() },
    pages: count(tabs, 'p').slice(0, 15).map(x => ({ path: x.key, n: x.n, form: tabs.filter(t => t.p === x.key && t.f).length })),
    boats: [...boats].sort((a, b) => b[1].n - a[1].n).slice(0, 10).map(([slug, x]) => ({ slug, n: x.n, th: x.th, en: x.en, src: [...x.src].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '' , form: tabs.filter(t => t.b === slug && t.f).length })),
    device: count(tabs, 'd'), source: count(tabs, 's'), lang: count(tabs, 'l'),
  };
}
