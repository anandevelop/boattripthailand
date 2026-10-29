import 'server-only';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statfsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { googleStatus, loadGoogleCfg } from './google';
import { loadLineCfg, lineSaved } from './line-config';
import { lineEnabled } from './line';
import { UPLOAD_DIR } from './media';
import { GEMINI_MODEL, provider, usage } from './translate';

/**
 * /admin → ตั้งค่า → ระบบ: "เวอร์ชันและการเชื่อมต่อ" — what is running, where, and which services are connected.
 * Only states and versions: no key, token or password ever leaves the server.
 * Build metadata (commit, build time) comes from the Docker build args the deploy passes (APP_COMMIT…);
 * in local development it is read from git.
 */
const ROOT = process.cwd();
const readJson = (p: string) => { try { return JSON.parse(readFileSync(path.join(ROOT, p), 'utf8')) as Record<string, unknown>; } catch { return null; } };
const ver = (pkg: string) => (readJson(`node_modules/${pkg}/package.json`)?.version as string | undefined) ?? null;
const git = (...a: string[]) => { try { return execFileSync('git', a, { cwd: ROOT, timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null; } catch { return null; } };

let buildCache: { commit: string | null; time: string | null; msg: string | null; built: string | null; branch: string | null } | null = null;
function build() {
  if (buildCache) return buildCache;
  const commit = process.env.APP_COMMIT || null;
  buildCache = commit
    ? { commit, time: process.env.APP_COMMIT_TIME || null, msg: process.env.APP_COMMIT_MSG || null, built: process.env.APP_BUILD_TIME || null, branch: 'main' }
    : { commit: git('rev-parse', 'HEAD'), time: git('show', '-s', '--format=%cI', 'HEAD'), msg: git('show', '-s', '--format=%s', 'HEAD'), built: null, branch: git('rev-parse', '--abbrev-ref', 'HEAD') };
  return buildCache;
}
function repoUrl() {
  const r = (readJson('package.json')?.repository as string | { url?: string } | undefined);
  const u = (typeof r === 'string' ? r : r?.url) || process.env.APP_REPO_URL || git('remote', 'get-url', 'origin') || 'https://github.com/anandevelop/boattripthailand';
  return u.replace(/^git@github\.com:/, 'https://github.com/').replace(/^git\+/, '').replace(/\.git$/, '');
}
/** memory limit of the container (cgroup v2 / v1), null when unlimited */
function memLimit() {
  for (const f of ['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory/memory.limit_in_bytes']) {
    try { const v = readFileSync(f, 'utf8').trim(); const n = Number(v); if (v !== 'max' && n > 0 && n < os.totalmem() * 4 && n < 2 ** 60) return n; } catch { /* not in a container */ }
  }
  return null;
}
function disk(p: string) { try { const s = statfsSync(p); return { total: s.blocks * s.bsize, free: s.bavail * s.bsize }; } catch { return null; } }
const row = async <T>(q: ReturnType<typeof sql>) => ((await db.execute(q)).rows[0] ?? {}) as T;

export async function systemInfo(h: Headers) {
  const b = build(), pkg = readJson('package.json') ?? {};
  // database
  const t0 = performance.now();
  let dbInfo: Record<string, unknown> = { ok: false };
  try {
    await db.execute(sql`select 1`);
    const ms = Math.round((performance.now() - t0) * 10) / 10;
    const v = await row<{ v: string; size: string; started: string; tz: string; enc: string }>(sql`select version() as v, pg_database_size(current_database())::text as size, pg_postmaster_start_time()::text as started, current_setting('TimeZone') as tz, pg_encoding_to_char(encoding) as enc from pg_database where datname = current_database()`);
    const c = await row<{ used: string; max: string }>(sql`select (select count(*) from pg_stat_activity where datname = current_database())::text as used, current_setting('max_connections') as max`);
    const tb = await row<{ n: string }>(sql`select count(*)::text as n from information_schema.tables where table_schema = 'public'`);
    let mig: { applied: number; last: string | null } = { applied: 0, last: null };
    try { const m = await row<{ n: string; at: string | null }>(sql`select count(*)::text as n, max(created_at)::text as at from drizzle.__drizzle_migrations`); mig = { applied: Number(m.n), last: m.at }; } catch { /* first boot */ }
    const journal = ((readJson('drizzle/meta/_journal.json')?.entries as { tag: string; when: number }[] | undefined) ?? []);
    dbInfo = { ok: true, ms, version: v.v?.match(/PostgreSQL [\d.]+/)?.[0] ?? 'PostgreSQL', size: Number(v.size), started: v.started ? new Date(v.started).toISOString() : null,
      tz: v.tz, encoding: v.enc, conn: { used: Number(c.used), max: Number(c.max) }, tables: Number(tb.n),
      migrations: { applied: mig.applied, total: journal.length, lastTag: journal.at(-1)?.tag ?? null, lastAt: mig.last ? new Date(Number(mig.last) || mig.last).toISOString() : null } };
  } catch (e) { dbInfo = { ok: false, error: e instanceof Error ? e.message.slice(0, 160) : 'error' }; }

  // services (states only)
  await Promise.allSettled([loadLineCfg(), loadGoogleCfg()]);
  const g = googleStatus(), ls = lineSaved();
  let tr: Awaited<ReturnType<typeof usage>> | null = null; try { tr = await usage(); } catch { /* table not ready */ }
  const from = (env: boolean, admin: boolean) => (env ? '.env' : admin ? 'หลังบ้าน' : null);
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
  const services = [
    { k: 'line', name: 'LINE Messaging API', on: lineEnabled(), detail: lineEnabled() ? `ตั้งจาก ${from(!!process.env.LINE_CHANNEL_ACCESS_TOKEN, !!ls.token)}` : 'ยังไม่ได้ใส่ Channel access token' },
    { k: 'gemini', name: 'Gemini (แปลภาษา · AI alt · อ่าน PDF)', on: !!provider() && process.env.TRANSLATE_ENABLED !== 'false',
      detail: provider() ? `${GEMINI_MODEL}${tr ? ` · วันนี้ ${tr.reqsToday}/${tr.dailyReq} ครั้ง · เดือนนี้ ${tr.chars.toLocaleString()}/${tr.limit.toLocaleString()} ตัวอักษร` : ''}${process.env.TRANSLATE_ENABLED === 'false' ? ' · ปิดอยู่ (TRANSLATE_ENABLED=false)' : ''}` : 'ยังไม่ได้ใส่ GEMINI_API_KEY' },
    { k: 'ga', name: 'Google Analytics 4', on: g.ga.on, detail: g.ga.on ? `Property ${g.ga.property}` : !g.key ? 'ยังไม่มีกุญแจ service account' : 'ยังไม่ได้ใส่ Property ID' },
    { k: 'gsc', name: 'Google Search Console', on: g.gsc.on, detail: g.gsc.on ? String(g.gsc.site) : !g.key ? 'ยังไม่มีกุญแจ service account' : 'ยังไม่ได้ใส่พร็อพเพอร์ตี้' },
    { k: 'gsa', name: 'Google service account', on: g.key, detail: g.key ? `${g.email} · จาก${g.src.key === 'admin' ? 'หลังบ้าน' : ' .env'}` : 'ยังไม่ได้ใส่ไฟล์ JSON' },
    { k: 'ga4tag', name: 'GA4 บนหน้าเว็บ (gtag)', on: !!g.cfg.ga4Id, detail: g.cfg.ga4Id || 'ยังไม่ได้ใส่ Measurement ID' },
    { k: 'pixel', name: 'Meta Pixel', on: !!(process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID), detail: process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || 'ยังไม่ได้ใส่ Pixel ID' },
    { k: 'capi', name: 'Meta Conversions API', on: !!(process.env.META_CAPI_TOKEN && (process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID)), detail: process.env.META_CAPI_TOKEN ? (process.env.META_TEST_EVENT_CODE ? 'โหมดทดสอบ (META_TEST_EVENT_CODE)' : 'ส่งเหตุการณ์จริง') : 'ยังไม่ได้ใส่ META_CAPI_TOKEN' },
    { k: 'psi', name: 'PageSpeed Insights', on: true, detail: process.env.PAGESPEED_API_KEY ? 'ใช้คีย์ของเรา' : 'ไม่มีคีย์ · ใช้โควตาร่วม (ช้ากว่าได้)' },
    { k: 'cron', name: 'Cron ภายนอก', on: !!process.env.CRON_SECRET, opt: true, detail: process.env.CRON_SECRET ? 'ตั้ง CRON_SECRET แล้ว' : 'ไม่บังคับ · ระบบรันงานเองทุกนาที' },
  ];

  // network: how this request reached us
  const cf = !!h.get('cf-ray');
  const mem = process.memoryUsage(), lim = memLimit(), up = disk(UPLOAD_DIR);
  return {
    app: { name: String(pkg.name ?? 'boattripthailand'), version: String(pkg.version ?? '—'), env: process.env.NODE_ENV || 'development',
      commit: b.commit, short: b.commit?.slice(0, 7) ?? null, commitTime: b.time, commitMsg: b.msg, built: b.built, branch: b.branch, repo: repoUrl(),
      started: new Date(Date.now() - process.uptime() * 1000).toISOString(), uptime: Math.round(process.uptime()) },
    stack: [['Node.js', process.version], ['Next.js', ver('next')], ['React', ver('react')], ['Drizzle ORM', ver('drizzle-orm')], ['node-postgres', ver('pg')], ['sharp (รูปภาพ)', ver('sharp')], ['TypeScript', ver('typescript')]].filter(x => x[1]),
    server: { host: os.hostname(), platform: `${os.type()} ${os.release()} · ${process.arch}`, docker: existsSync('/.dockerenv'),
      cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model?.replace(/\s+/g, ' ').trim() ?? null, load: os.loadavg().map(x => Math.round(x * 100) / 100),
      mem: { rss: mem.rss, heap: mem.heapUsed, heapTotal: mem.heapTotal, limit: lim, hostTotal: os.totalmem(), hostFree: os.freemem() },
      disk: up, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, now: new Date().toISOString(), osUptime: Math.round(os.uptime()) },
    db: dbInfo,
    net: { appUrl: appUrl || null, https: appUrl.startsWith('https://'), cloudflare: cf, cfRay: h.get('cf-ray') || null, country: h.get('cf-ipcountry') || null },
    services,
  };
}
