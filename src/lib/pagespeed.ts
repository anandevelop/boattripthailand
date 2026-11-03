import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { boats as boatsT, posts as postsT, settings } from '@/db/schema';
import { SITE } from './i18n';
import { lineEnabled, pushLine, text } from './line';

/**
 * /admin → SEO → PageSpeed: Google PageSpeed Insights (free API, no billing) for any page of the site.
 * - Field data = real Chrome users (CrUX, 28 days) when Google has enough traffic; lab data = Lighthouse.
 * - Results and a 90-day history live in the settings table (system.psi.* · not part of backups/restores).
 * - A daily run at 06:00 Bangkok checks the key pages and sends a LINE alert when the mobile score drops.
 * Google now allows (almost) no calls without a key: set PAGESPEED_API_KEY (free, Google Cloud → APIs → PageSpeed Insights API).
 */
type Cat = 'ok' | 'mid' | 'low';
type Metric = { v: number; cat: Cat };
type Strategy = 'mobile' | 'desktop';
const rate = (v: number, good: number, poor: number): Metric => ({ v, cat: v <= good ? 'ok' : v <= poor ? 'mid' : 'low' });

export type PsiResult = {
  url: string; path: string; strategy: Strategy; at: string; build: string | null; by?: string;
  scores: { perf: number; a11y: number; bp: number; seo: number };
  field: { scope: 'page' | 'origin'; pass: boolean | null; lcp: Metric | null; inp: Metric | null; cls: Metric | null } | null;
  lab: { fcp: Metric; lcp: Metric; tbt: Metric; cls: Metric; si: Metric };
  opps: { id: string; title: string; desc: string; display: string; ms: number; items: number }[];
  passed: number;
};
export type PsiHist = { p: string; s: Strategy; at: string; perf: number; a11y: number; bp: number; seo: number; lcp: number; cls: number; b: string | null };
export type PsiCfg = { threshold: number; alerts: boolean; daily: boolean; at?: string; by?: string };

const LAST_KEY = 'system.psi.last', HIST_KEY = 'system.psi.hist', CFG_KEY = 'system.psi.cfg';
const DEF_CFG: PsiCfg = { threshold: 80, alerts: true, daily: true };

async function getSet<T>(key: string, def: T): Promise<T> {
  const [r] = await db.select().from(settings).where(eq(settings.key, key));
  return (r?.value as T) ?? def;
}
const putSet = (key: string, value: unknown) => db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });

/** PageSpeed cannot reach localhost, so a dev setup measures the live domain */
export const psiBase = () => (/localhost|127\.0\.0\.1/.test(SITE) ? 'https://new.boattripthailand.com' : SITE);

/** a path or a full URL of this site → its path; anything else is refused */
export function psiPath(input: string): string | null {
  const s = String(input || '').trim();
  if (!s) return null;
  try {
    const u = new URL(s, psiBase() + '/');
    const ok = [new URL(psiBase()).host, new URL(SITE).host].includes(u.host);
    if (!ok || !/^https?:$/.test(u.protocol)) return null;
    return (u.pathname.replace(/\/+$/, '') || '/') + u.search;
  } catch { return null; }
}

/** the key pages checked by "ตรวจทั้งหมด" and by the daily run */
export async function psiPages() {
  // plain queries (not the cached site-data helpers): this also runs from the scheduler, outside a request
  const [boats, posts] = await Promise.all([
    db.select({ slug: boatsT.slug, name: boatsT.name }).from(boatsT).where(eq(boatsT.active, true)).orderBy(boatsT.sortOrder).catch(() => []),
    db.select({ slugTh: postsT.slugTh }).from(postsT).where(and(eq(postsT.published, true), sql`${postsT.slugTh} <> ''`, sql`jsonb_array_length(${postsT.blocks}->'th') > 0`)).orderBy(desc(postsT.date)).limit(1).catch(() => []),
  ]);
  const boat = boats.find(b => b.slug === 'leopard-90-ft') ?? boats[0];
  const post = posts[0];
  return [
    { path: '/', name: 'หน้าแรก' },
    { path: '/yacht-charter', name: 'เรือทั้งหมด' },
    ...(boat ? [{ path: `/yacht-charter/${boat.slug}`, name: `หน้าเรือ · ${boat.name}` }] : []),
    { path: '/destinations', name: 'ปลายทาง' },
    { path: '/destinations/phi-phi', name: 'เกาะพีพี' },
    { path: '/tours', name: 'ทัวร์ & กิจกรรม' },
    { path: '/blog', name: 'บทความ' },
    ...(post ? [{ path: `/blog/${encodeURIComponent(post.slugTh!)}`, name: 'บทความล่าสุด' }] : []),
  ];
}

let buildId: string | null | undefined;
async function build() {
  if (buildId === undefined) buildId = (await readFile(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').catch(() => '')).trim() || null;
  return buildId;
}

const plain = (s: string) => String(s || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`/g, '').split(/(?<=[.。])\s/)[0].slice(0, 220);

/** one Lighthouse run (all 4 categories, Thai texts) */
export async function psiRun(p: string, strategy: Strategy, by?: string): Promise<PsiResult> {
  const url = psiBase() + p;
  const q = new URLSearchParams({ url, strategy, locale: 'th' });
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) q.append('category', c);
  if (process.env.PAGESPEED_API_KEY) q.set('key', process.env.PAGESPEED_API_KEY);
  const r = await fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + q, { signal: AbortSignal.timeout(120_000), cache: 'no-store' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m: string = j?.error?.message || `PageSpeed ${r.status}`;
    if (r.status === 429 || /quota/i.test(m)) throw new Error(process.env.PAGESPEED_API_KEY ? 'โควตา PageSpeed วันนี้หมดแล้ว · ลองใหม่พรุ่งนี้' : 'Google ไม่ให้ตรวจโดยไม่มีคีย์ · ใส่ PAGESPEED_API_KEY (ฟรี) ใน .env');
    throw new Error(m);
  }
  const L = j.lighthouseResult ?? {}, A: Record<string, any> = L.audits ?? {}, C: Record<string, any> = L.categories ?? {};
  const sc = (k: string) => Math.round((C[k]?.score ?? 0) * 100);

  // field: the page itself when Google has enough visits, otherwise the whole site (origin)
  const le = j.loadingExperience?.metrics && j.loadingExperience.id && !j.loadingExperience.origin_fallback ? j.loadingExperience : null;
  const src = le ?? (j.originLoadingExperience?.metrics ? j.originLoadingExperience : null);
  const fp = (k: string) => src?.metrics?.[k]?.percentile as number | undefined;
  const field = src && fp('LARGEST_CONTENTFUL_PAINT_MS') !== undefined ? {
    scope: (le ? 'page' : 'origin') as 'page' | 'origin',
    pass: null as boolean | null,
    lcp: rate(fp('LARGEST_CONTENTFUL_PAINT_MS')!, 2500, 4000),
    inp: fp('INTERACTION_TO_NEXT_PAINT') !== undefined ? rate(fp('INTERACTION_TO_NEXT_PAINT')!, 200, 500) : null,
    cls: fp('CUMULATIVE_LAYOUT_SHIFT_SCORE') !== undefined ? rate(fp('CUMULATIVE_LAYOUT_SHIFT_SCORE')! / 100, 0.1, 0.25) : null,
  } : null;
  if (field) field.pass = [field.lcp, field.inp, field.cls].every(m => !m || m.cat === 'ok');

  const n = (k: string) => Number(A[k]?.numericValue ?? 0);
  const lab = {
    fcp: rate(n('first-contentful-paint'), 1800, 3000), lcp: rate(n('largest-contentful-paint'), 2500, 4000),
    tbt: rate(n('total-blocking-time'), 200, 600), cls: rate(n('cumulative-layout-shift'), 0.1, 0.25), si: rate(n('speed-index'), 3400, 5800),
  };

  // what to fix first: failing performance audits with time savings (Lighthouse "insights" when present, else opportunities/diagnostics)
  const refs: { id: string; group?: string }[] = C.performance?.auditRefs ?? [];
  const bad = refs.filter(x => x.group !== 'metrics' && A[x.id] && A[x.id].score !== null && A[x.id].score < 0.9 && !['notApplicable', 'informative', 'manual'].includes(A[x.id].scoreDisplayMode));
  const ins = bad.filter(x => /-insight$/.test(x.id));
  const seen = new Set<string>();
  const opps = (ins.length ? ins : bad).map(x => {
    const a = A[x.id], ms = Number(a.details?.overallSavingsMs ?? a.metricSavings?.LCP ?? a.metricSavings?.FCP ?? a.metricSavings?.TBT ?? 0);
    return { id: x.id, title: String(a.title ?? x.id), desc: plain(a.description), display: String(a.displayValue ?? ''), ms: Math.round(ms), items: Array.isArray(a.details?.items) ? a.details.items.length : 0 };
  }).filter(o => !seen.has(o.title) && seen.add(o.title)).sort((a, b) => b.ms - a.ms).slice(0, 8);
  const passed = Object.values(C).reduce((s: number, c: any) => s + (c.auditRefs ?? []).filter((x: { id: string }) => A[x.id]?.score === 1).length, 0);

  const res: PsiResult = { url, path: p, strategy, at: new Date().toISOString(), build: await build(), ...(by ? { by } : {}),
    scores: { perf: sc('performance'), a11y: sc('accessibility'), bp: sc('best-practices'), seo: sc('seo') }, field, lab, opps, passed };
  await save(res);
  return res;
}

let lock: Promise<unknown> = Promise.resolve();
/** results are written one at a time so parallel runs never overwrite each other */
function save(r: PsiResult) {
  const job = lock.then(async () => {
    const last = await getSet<Record<string, PsiResult>>(LAST_KEY, {});
    last[`${r.strategy}|${r.path}`] = r;
    await putSet(LAST_KEY, last);
    const cut = Date.now() - 90 * 86400_000;
    const hist = (await getSet<PsiHist[]>(HIST_KEY, [])).filter(h => new Date(h.at).getTime() > cut);
    hist.push({ p: r.path, s: r.strategy, at: r.at, ...r.scores, lcp: Math.round(r.lab.lcp.v), cls: Math.round(r.lab.cls.v * 1000) / 1000, b: r.build });
    await putSet(HIST_KEY, hist.slice(-4000));
  });
  lock = job.catch(() => {});
  return job;
}

export const psiCfg = async (): Promise<PsiCfg> => ({ ...DEF_CFG, ...(await getSet<Partial<PsiCfg>>(CFG_KEY, {})) });
export async function savePsiCfg(b: Record<string, unknown>, by: string) {
  const before = await psiCfg();
  const t = Math.round(Number(b.threshold));
  const after: PsiCfg = { threshold: t >= 10 && t <= 100 ? t : before.threshold, alerts: b.alerts === undefined ? before.alerts : b.alerts === true, daily: b.daily === undefined ? before.daily : b.daily === true, at: new Date().toISOString(), by };
  await putSet(CFG_KEY, after);
  return { before, after };
}

/* ---------- run all key pages (in the background · button "ตรวจทั้งหมด" and the 06:00 run) ---------- */
type Batch = { busy: boolean; total: number; done: number; now: string[]; errors: string[]; at: string | null; by: string | null };
const G = globalThis as unknown as { __psi?: Batch };
const B = G.__psi ??= { busy: false, total: 0, done: 0, now: [], errors: [], at: null, by: null };
export const psiBatch = () => ({ ...B });

export function psiRunAll(by: string, paths?: string[]) {
  if (B.busy) return false;
  Object.assign(B, { busy: true, total: 0, done: 0, now: [], errors: [], at: new Date().toISOString(), by });
  (async () => {
    const pages = paths?.length ? paths : (await psiPages()).map(p => p.path);
    const todo = pages.flatMap(p => (['mobile', 'desktop'] as const).map(s => [p, s] as const));
    B.total = todo.length;
    // 2 at a time: fast enough, and well inside the free quota (25,000 a day)
    const worker = async () => {
      for (let t = todo.shift(); t; t = todo.shift()) {
        const k = `${t[1] === 'mobile' ? 'มือถือ' : 'คอม'} ${t[0]}`;
        B.now.push(k);
        try { await psiRun(t[0], t[1], by); } catch (e) { B.errors.push(`${k}: ${e instanceof Error ? e.message : e}`); }
        B.now = B.now.filter(x => x !== k); B.done++;
        if (B.errors.length && /คีย์|โควตา/.test(B.errors.at(-1)!)) todo.length = 0; // no key / quota → stop early
      }
    };
    await Promise.all([worker(), worker()]);
    await psiAlert(pages).catch(e => console.error('[psi alert]', e));
  })().catch(e => B.errors.push(String(e))).finally(() => { B.busy = false; B.now = []; });
  return true;
}

/** LINE alert when a key page's mobile score is under the threshold, or its real-user Core Web Vitals fail */
async function psiAlert(pages: string[]) {
  const cfg = await psiCfg();
  if (!cfg.alerts || !lineEnabled()) return;
  const g = process.env.LINE_GROUP_ID || await getSet<string | null>('line.groupId', null);
  if (!g) return;
  const last = await getSet<Record<string, PsiResult>>(LAST_KEY, {}), since = B.at ?? '';
  const bad = pages.map(p => last[`mobile|${p}`]).filter(r => r && r.at >= since && (r.scores.perf < cfg.threshold || r.field?.pass === false && r.field.scope === 'page'));
  if (!bad.length) return;
  const lines = bad.map(r => `• ${r.path} · ${r.scores.perf}/100${r.field?.pass === false ? ' · Core Web Vitals ไม่ผ่าน' : ''}${r.opps[0] ? `\n  ควรแก้: ${r.opps[0].title}` : ''}`);
  await pushLine(g, [text(`🐢 เว็บช้าลง (PageSpeed มือถือ ต่ำกว่า ${cfg.threshold})\n${lines.join('\n')}\nดูรายละเอียด: ${SITE}/admin#/seo\n${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`)]);
}

/** daily job (system.ts): starts the background run and returns at once */
export async function psiDaily() {
  if (!(await psiCfg()).daily) return 'ปิดการตรวจอัตโนมัติอยู่';
  if (!process.env.PAGESPEED_API_KEY) return 'ข้าม · ยังไม่ได้ใส่ PAGESPEED_API_KEY';
  return psiRunAll('ระบบ') ? 'เริ่มตรวจหน้าสำคัญทั้งหมด (มือถือ + คอม)' : 'กำลังตรวจอยู่แล้ว';
}

/** everything the PageSpeed tab needs */
export async function psiState() {
  const [last, hist, cfg, pages] = await Promise.all([getSet<Record<string, PsiResult>>(LAST_KEY, {}), getSet<PsiHist[]>(HIST_KEY, []), psiCfg(), psiPages()]);
  const cut = Date.now() - 31 * 86400_000;
  return { base: psiBase(), pages, last, hist: hist.filter(h => new Date(h.at).getTime() > cut), cfg, batch: psiBatch(), key: !!process.env.PAGESPEED_API_KEY, line: lineEnabled() };
}

/* ---------- SEO → ภาพรวม card (home page, cached 24 h) · kept for the existing card ---------- */
const cache = new Map<string, { at: number; v: unknown }>();
export async function pageSpeed(strategy: Strategy = 'mobile', refresh = false) {
  const c = cache.get(strategy);
  if (c && !refresh && Date.now() - c.at < 24 * 3600_000) return c.v;
  const url = psiBase() + '/';
  try {
    let r: PsiResult | undefined = (await getSet<Record<string, PsiResult>>(LAST_KEY, {}))[`${strategy}|/`];
    if (!r || refresh || Date.now() - new Date(r.at).getTime() > 24 * 3600_000) r = await psiRun('/', strategy);
    const v = { url, strategy, at: r.at, score: r.scores.perf, field: r.field && r.field.lcp ? { lcp: r.field.lcp, inp: r.field.inp, cls: r.field.cls } : null, lab: { lcp: r.lab.lcp, tbt: r.lab.tbt, cls: r.lab.cls } };
    cache.set(strategy, { at: Date.now(), v });
    return v;
  } catch (e) { return { url, strategy, error: e instanceof Error ? e.message : String(e) }; }
}
