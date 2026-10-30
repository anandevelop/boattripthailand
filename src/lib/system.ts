import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { verifyAuditChain } from './audit';
import { purgeExpiredSessions } from './auth-jobs';
import { checkSla } from './leads';
import { lineEnabled, pushLine, text } from './line';
import { maintenance } from './maintenance';
import { UPLOAD_DIR } from './media';
import { listTrash } from './post-trash';
import { publishDue } from './post-schedule';
import { clearSiteCache } from './site-render';

/**
 * /admin → ระบบ & สำรองข้อมูล.
 * - Scheduler: one in-process tick per minute (src/instrumentation-node.ts) runs the jobs that are due;
 *   /api/cron?key=CRON_SECRET runs the same tick from outside (a host cron job, or an uptime monitor).
 * - Backups: business data only (no users, sessions, audit log or media files) as gzipped JSON in
 *   UPLOAD_DIR/_backups (the persistent volume; /uploads only serves .webp, so these are never public).
 * - Alerts go to the sales LINE group (no e-mail/SMS service is set up).
 */
const JOBS_KEY = 'system.jobs', ALERTS_KEY = 'system.alerts', INDEX_KEY = 'system.backups';
export const BACKUP_DIR = path.join(UPLOAD_DIR, '_backups');
export const KEEP_DAYS = 30;
const KEEP_MIN = 3;

/* ---------- small settings helpers ---------- */
async function getSet<T>(key: string, def: T): Promise<T> {
  const [r] = await db.select().from(settings).where(eq(settings.key, key));
  return (r?.value as T) ?? def;
}
const putSet = (key: string, value: unknown) => db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });

/** Bangkok wall clock (UTC+7, no DST) */
const bkk = (d = new Date()) => new Date(d.getTime() + 7 * 3600_000);
const bkkDay = (d: Date) => bkk(d).toISOString().slice(0, 10);
const bkkHour = (d = new Date()) => bkk(d).getUTCHours() + bkk(d).getUTCMinutes() / 60;
const fmtSize = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1073741824).toFixed(2)} GB`;

/* ---------- backups ---------- */
/** Restore order (parents first). Users, sessions and the audit log are never part of a backup. */
const TABLES = ['boats', 'season_calendars', 'posts', 'redirects', 'settings', 'media', 'customers', 'leads', 'lead_activities', 'lead_deals', 'conversion_events', 'traffic_daily', 'traffic_hourly'];
/** columns that point at users: a restored row keeps them only when that user still exists */
const USER_REFS: Record<string, string[]> = { leads: ['assigned_to_id'], lead_activities: ['user_id'], media: ['uploaded_by_id'] };
const SKIP_KEYS = (k: string) => k.startsWith('system.');
export type BackupSource = 'auto' | 'manual' | 'pre-restore' | 'upload';
type IndexEntry = { by: string; src: BackupSource; rows: number; tables: number; at: string };
export type BackupFile = { file: string; size: number; at: string; src: BackupSource; by: string; rows: number | null };
type Dump = { app: 'btt'; v: 1; at: string; by: string; tables: Record<string, Record<string, unknown>[]> };

const FILE_RE = /^btt-\d{8}-\d{6}-(auto|manual|pre-restore|upload)\.json\.gz$/;
export const validFile = (f: string) => FILE_RE.test(f);
const fileName = (src: BackupSource, d = new Date()) => `btt-${bkk(d).toISOString().replace(/[-:T]/g, '').slice(0, 14).replace(/^(\d{8})/, '$1-')}-${src}.json.gz`;

async function existing() {
  const r = await db.execute(sql`select table_name from information_schema.tables where table_schema = 'public'`);
  return new Set((r.rows as { table_name: string }[]).map(x => x.table_name));
}

/** every business table as JSON rows (column names as in the database) */
export async function dumpData(by: string): Promise<Dump> {
  const have = await existing(), tables: Dump['tables'] = {};
  for (const t of TABLES) {
    if (!have.has(t)) continue;
    const r = await db.execute(sql`select coalesce(json_agg(x), '[]'::json) as j from ${sql.identifier(t)} x`);
    let rows = ((r.rows[0] as { j: Record<string, unknown>[] }).j) ?? [];
    if (t === 'settings') rows = rows.filter(x => !SKIP_KEYS(String(x.key)));
    tables[t] = rows;
  }
  return { app: 'btt', v: 1, at: new Date().toISOString(), by, tables };
}
const rowCount = (d: Dump) => Object.values(d.tables).reduce((s, r) => s + r.length, 0);
export const packDump = (d: Dump) => gzipSync(Buffer.from(JSON.stringify(d)), { level: 6 });

export async function createBackup(src: BackupSource, by: string) {
  await mkdir(BACKUP_DIR, { recursive: true });
  const d = await dumpData(by), file = fileName(src), buf = packDump(d);
  await writeFile(path.join(BACKUP_DIR, file), buf);
  const idx = await getSet<Record<string, IndexEntry>>(INDEX_KEY, {});
  idx[file] = { by, src, rows: rowCount(d), tables: Object.keys(d.tables).length, at: d.at };
  await putSet(INDEX_KEY, idx);
  await pruneBackups();
  return { file, size: buf.length, rows: rowCount(d) };
}

export async function listBackups(): Promise<BackupFile[]> {
  const files = await readdir(BACKUP_DIR).catch(() => [] as string[]);
  const idx = await getSet<Record<string, IndexEntry>>(INDEX_KEY, {});
  const out: BackupFile[] = [];
  for (const f of files.filter(validFile)) {
    const s = await stat(path.join(BACKUP_DIR, f)).catch(() => null);
    if (!s) continue;
    const m = idx[f];
    out.push({ file: f, size: s.size, at: m?.at ?? s.mtime.toISOString(), src: (m?.src ?? f.match(FILE_RE)![1]) as BackupSource, by: m?.by ?? '', rows: m?.rows ?? null });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

/** keep KEEP_DAYS days, but never fewer than the newest KEEP_MIN files */
async function pruneBackups() {
  const all = await listBackups(), cut = Date.now() - KEEP_DAYS * 86400_000;
  const gone = all.slice(KEEP_MIN).filter(b => new Date(b.at).getTime() < cut);
  for (const b of gone) await unlink(path.join(BACKUP_DIR, b.file)).catch(() => {});
  if (gone.length) {
    const idx = await getSet<Record<string, IndexEntry>>(INDEX_KEY, {});
    for (const b of gone) delete idx[b.file];
    await putSet(INDEX_KEY, idx);
  }
  return gone.length;
}

export async function readBackup(file: string) {
  if (!validFile(file)) return null;
  return readFile(path.join(BACKUP_DIR, file)).catch(() => null);
}

export class BackupError extends Error {}
/** gz or plain JSON → a checked dump */
export function parseDump(buf: Buffer): Dump {
  let raw: string;
  try { raw = (buf[0] === 0x1f && buf[1] === 0x8b ? gunzipSync(buf) : buf).toString('utf8'); } catch { throw new BackupError('ไฟล์เสียหรือไม่ใช่ไฟล์สำรอง (.json.gz)'); }
  let d: Dump;
  try { d = JSON.parse(raw); } catch { throw new BackupError('อ่านไฟล์ไม่ได้ · ต้องเป็นไฟล์สำรองจากระบบนี้'); }
  if (!d || d.app !== 'btt' || d.v !== 1 || typeof d.tables !== 'object' || !d.tables) throw new BackupError('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ Boat Trip Thailand');
  for (const [t, rows] of Object.entries(d.tables)) if (!TABLES.includes(t) || !Array.isArray(rows)) throw new BackupError(`ไฟล์มีตารางที่ไม่รู้จัก: ${t}`);
  if (!d.tables.boats?.length && !d.tables.posts?.length) throw new BackupError('ไฟล์ไม่มีข้อมูลเรือหรือบทความ · ไม่กู้คืนเพื่อกันข้อมูลหาย');
  return d;
}

/** keep an uploaded file next to the others so it can be restored (and downloaded again) */
export async function saveUpload(buf: Buffer, by: string) {
  const d = parseDump(buf);
  await mkdir(BACKUP_DIR, { recursive: true });
  const file = fileName('upload'), out = packDump(d);
  await writeFile(path.join(BACKUP_DIR, file), out);
  const idx = await getSet<Record<string, IndexEntry>>(INDEX_KEY, {});
  idx[file] = { by, src: 'upload', rows: rowCount(d), tables: Object.keys(d.tables).length, at: new Date().toISOString() };
  await putSet(INDEX_KEY, idx);
  return { file, size: out.length, rows: rowCount(d), from: d.at };
}

/**
 * Replace the business data with a backup, in one transaction. A safety backup of the current data is made first.
 * Users, sessions, the audit log and system.* settings stay as they are.
 */
export async function restoreBackup(file: string, by: string) {
  const buf = await readBackup(file);
  if (!buf) throw new BackupError('ไม่พบไฟล์สำรองนี้');
  const d = parseDump(buf);
  const safety = await createBackup('pre-restore', by);
  const have = await existing();
  const counts: Record<string, number> = {};
  await db.transaction(async tx => {
    const ids = new Set(((await tx.execute(sql`select id from users`)).rows as { id: string }[]).map(r => r.id));
    for (const t of [...TABLES].reverse()) {
      if (!have.has(t)) continue;
      if (t === 'settings') await tx.execute(sql`delete from settings where key not like 'system.%'`);
      else await tx.execute(sql`delete from ${sql.identifier(t)}`);
    }
    for (const t of TABLES) {
      let rows = d.tables[t];
      if (!rows || !have.has(t)) continue;
      if (t === 'settings') rows = rows.filter(x => !SKIP_KEYS(String(x.key)));
      const refs = USER_REFS[t];
      if (refs) rows = rows.map(r => { const c = { ...r }; for (const k of refs) if (c[k] != null && !ids.has(String(c[k]))) c[k] = null; return c; });
      for (let i = 0; i < rows.length; i += 1000) {
        const part = JSON.stringify(rows.slice(i, i + 1000));
        await tx.execute(sql`insert into ${sql.identifier(t)} overriding system value select * from json_populate_recordset(null::${sql.identifier(t)}, ${part}::json)`);
      }
      counts[t] = rows.length;
    }
    // serial / identity counters continue after the restored ids
    const seq = await tx.execute(sql`select table_name, column_name from information_schema.columns where table_schema = 'public' and (column_default like 'nextval%' or is_identity = 'YES')`);
    for (const r of seq.rows as { table_name: string; column_name: string }[]) {
      if (!TABLES.includes(r.table_name)) continue;
      await tx.execute(sql`select setval(pg_get_serial_sequence(${r.table_name}, ${r.column_name}), coalesce((select max(${sql.identifier(r.column_name)}) from ${sql.identifier(r.table_name)}), 0) + 1, false)`);
    }
  });
  clearSiteCache();
  return { counts, rows: Object.values(counts).reduce((a, b) => a + b, 0), from: d.at, safety: safety.file };
}

/* ---------- alerts (LINE group) ---------- */
export type AlertKind = 'down' | 'ttfb' | 'cron' | 'backup';
export type Alerts = { on: Record<AlertKind, boolean>; at?: string; by?: string };
const DEF_ALERTS: Alerts = { on: { down: true, ttfb: true, cron: true, backup: true } };
export const loadAlerts = async (): Promise<Alerts> => { const a = await getSet<Partial<Alerts>>(ALERTS_KEY, {}); return { ...DEF_ALERTS, ...a, on: { ...DEF_ALERTS.on, ...(a.on ?? {}) } }; };
export async function saveAlerts(on: Partial<Record<AlertKind, unknown>>, by: string) {
  const before = await loadAlerts();
  const after: Alerts = { on: { down: on.down === true, ttfb: on.ttfb === true, cron: on.cron === true, backup: on.backup === true }, at: new Date().toISOString(), by };
  await putSet(ALERTS_KEY, after);
  return { before, after };
}
async function groupId() {
  if (process.env.LINE_GROUP_ID) return process.env.LINE_GROUP_ID;
  return getSet<string | null>('line.groupId', null);
}
export async function alertChannel() { const g = lineEnabled() ? await groupId() : null; return { line: lineEnabled(), group: !!g }; }
const lastAlert = new Map<string, number>();
/** sends at most once per 30 min for the same problem; `force` for tests and recoveries */
export async function sendAlert(kind: AlertKind | 'test', msg: string, force = false) {
  if (kind !== 'test' && !(await loadAlerts()).on[kind]) return false;
  const k = kind + ':' + msg.slice(0, 40);
  if (!force && Date.now() - (lastAlert.get(k) ?? 0) < 30 * 60_000) return false;
  const g = lineEnabled() ? await groupId() : null;
  if (!g) return false;
  lastAlert.set(k, Date.now());
  await pushLine(g, [text(`⚠️ ระบบ Boat Trip Thailand\n${msg}\n${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`)]);
  return true;
}

/* ---------- web check (uptime + TTFB of the home page, measured from the server) ---------- */
type Sample = { at: number; ms: number; ok: boolean; status: number };
const G = globalThis as unknown as { __sys?: { samples: Sample[]; downSince: number | null; slowAlerted: boolean; downAlerted: boolean; running: Set<string>; state: Record<string, JobState> | null } };
const S = G.__sys ??= { samples: [], downSince: null, slowAlerted: false, downAlerted: false, running: new Set(), state: null };

async function webCheck() {
  if ((await maintenance()).on) return 'ปิดปรับปรุงอยู่ · ข้ามการวัด';
  const t0 = performance.now();
  let status = 0;
  try {
    const r = await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/`, { redirect: 'manual', cache: 'no-store', headers: { 'user-agent': 'btt-uptime/1', 'x-btt-check': '1' }, signal: AbortSignal.timeout(15_000) });
    status = r.status; await r.arrayBuffer().catch(() => null);
  } catch { status = 0; }
  const ms = Math.round(performance.now() - t0), ok = status > 0 && status < 500;
  S.samples.push({ at: Date.now(), ms, ok, status });
  S.samples = S.samples.filter(s => s.at > Date.now() - 24 * 3600_000).slice(-1440);
  // down: 2 failed checks in a row (≥ 2 minutes)
  if (!ok) {
    S.downSince ??= Date.now();
    if (!S.downAlerted && Date.now() - S.downSince >= 110_000) { S.downAlerted = true; await sendAlert('down', `หน้าแรกเปิดไม่ได้เกิน 2 นาที (${status || 'ไม่ตอบ'})`, true).catch(() => {}); }
  } else {
    if (S.downAlerted) await sendAlert('down', `หน้าแรกกลับมาเปิดได้แล้ว · ล่มประมาณ ${Math.round((Date.now() - (S.downSince ?? Date.now())) / 60_000)} นาที`, true).catch(() => {});
    S.downSince = null; S.downAlerted = false;
  }
  // slow: every check in the last 15 minutes over 1 s
  const win = S.samples.filter(s => s.at > Date.now() - 15 * 60_000 && s.ok);
  const slow = win.length >= 10 && win.every(s => s.ms > 1000);
  if (slow && !S.slowAlerted) { S.slowAlerted = true; await sendAlert('ttfb', `หน้าแรกโหลดช้าเกิน 1 วินาทีติดต่อกัน 15 นาที (ล่าสุด ${ms} ms)`, true).catch(() => {}); }
  if (!slow && S.slowAlerted && win.length && win.at(-1)!.ms < 1000) S.slowAlerted = false;
  if (!ok) throw new Error(`หน้าแรกตอบ ${status || 'ไม่ได้'} · ${ms} ms`);
  return `${ms} ms · HTTP ${status}`;
}

/* ---------- jobs ---------- */
type JobState = { at: string; ok: boolean; msg: string; ms: number; by?: string };
type Job = { id: string; name: string; every: string; due: (last: Date | null, now: Date) => boolean; run: () => Promise<string>; quiet?: boolean };
const daily = (hour: number) => (last: Date | null, now: Date) => bkkHour(now) >= hour && (!last || bkkDay(last) !== bkkDay(now));
const every = (ms: number) => (last: Date | null, now: Date) => !last || now.getTime() - last.getTime() >= ms - 5_000;

export const JOBS: Job[] = [
  { id: 'backup', name: 'สำรองข้อมูลอัตโนมัติ', every: 'ทุกวัน 03:00', due: daily(3), run: async () => { const r = await createBackup('auto', 'ระบบ'); return `${r.file} · ${fmtSize(r.size)} · ${r.rows.toLocaleString()} แถว`; } },
  { id: 'trash', name: 'ล้างถังขยะบทความเกิน 30 วัน', every: 'ทุกวัน 03:30', due: daily(3.5), run: async () => { const n = (await listTrash()).length; return `ในถังขยะ ${n} บทความ`; } },
  { id: 'audit', name: 'ตรวจสายบันทึกกิจกรรม', every: 'ทุกวัน 04:00', due: daily(4), run: async () => { const r = await verifyAuditChain(); if (r.bad.length) throw new Error(`พบ ${r.bad.length} รายการถูกแก้ย้อนหลัง จาก ${r.total}`); return `${r.total.toLocaleString()} รายการ · ไม่พบการแก้ไขย้อนหลัง`; } },
  { id: 'sessions', name: 'ล้างเซสชันที่หมดอายุ', every: 'ทุกชั่วโมง', due: every(3600_000), run: async () => { await purgeExpiredSessions(); return 'เรียบร้อย'; } },
  { id: 'publish', name: 'เผยแพร่บทความที่ตั้งเวลาไว้', every: 'ทุก 1 นาที', due: every(60_000), run: publishDue, quiet: true },
  { id: 'sla', name: 'เตือนลีดที่ยังไม่ตอบ (SLA)', every: 'ทุก 1 นาที', due: every(60_000), run: async () => { await checkSla(); return 'เรียบร้อย'; }, quiet: true },
  { id: 'web', name: 'วัดเว็บ (ออนไลน์ + เวลาโหลด)', every: 'ทุก 1 นาที', due: every(60_000), run: webCheck, quiet: true },
];

async function loadState() { return S.state ??= await getSet<Record<string, JobState>>(JOBS_KEY, {}); }
let lastSave = 0;
async function saveState(force: boolean) { if (!force && Date.now() - lastSave < 10 * 60_000) return; lastSave = Date.now(); await putSet(JOBS_KEY, S.state); }

export async function runJob(id: string, by?: string) {
  const job = JOBS.find(j => j.id === id);
  if (!job) throw new Error('ไม่พบงานนี้');
  if (S.running.has(id)) return { ...(await loadState())[id], running: true };
  S.running.add(id);
  const state = await loadState(), prev = state[id], t0 = Date.now();
  let r: JobState;
  try { r = { at: new Date().toISOString(), ok: true, msg: (await job.run()).slice(0, 300), ms: Date.now() - t0, ...(by ? { by } : {}) }; }
  catch (e) { r = { at: new Date().toISOString(), ok: false, msg: (e instanceof Error ? e.message : String(e)).slice(0, 300), ms: Date.now() - t0, ...(by ? { by } : {}) }; }
  finally { S.running.delete(id); }
  state[id] = r;
  await saveState(!job.quiet || !prev || prev.ok !== r.ok || !!by).catch(() => {});
  if (!r.ok && id !== 'web') {
    const kind: AlertKind = id === 'backup' ? 'backup' : 'cron';
    await sendAlert(kind, `${job.name} ล้มเหลว: ${r.msg}`).catch(() => {});
  }
  return r;
}

/** runs every job that is due; called each minute in-process and by /api/cron */
export async function tick(now = new Date()) {
  const state = await loadState().catch(() => ({} as Record<string, JobState>));
  const ran: string[] = [];
  for (const j of JOBS) {
    const last = state[j.id]?.at ? new Date(state[j.id].at) : null;
    if (j.due(last, now) && !S.running.has(j.id)) { ran.push(j.id); await runJob(j.id); }
  }
  return ran;
}

let started = false;
export function startJobs() {
  if (started) return; started = true;
  const go = () => { tick().catch(e => console.error('[jobs]', e)); };
  setTimeout(go, 20_000);
  setInterval(go, 60_000);
}

/* ---------- page data ---------- */
let upCache: { at: number; bytes: number; files: number } | null = null;
async function dirSize(dir: string, skip?: string): Promise<{ bytes: number; files: number }> {
  let bytes = 0, files = 0;
  const ents = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (p === skip) continue; const s = await dirSize(p, skip); bytes += s.bytes; files += s.files; }
    else if (e.isFile()) { const s = await stat(p).catch(() => null); if (s) { bytes += s.size; files++; } }
  }
  return { bytes, files };
}

export async function systemStatus() {
  const state = await loadState();
  const db0 = performance.now();
  const size = Number(((await db.execute(sql`select pg_database_size(current_database()) as n`)).rows[0] as { n: string }).n);
  const dbMs = Math.round(performance.now() - db0);
  if (!upCache || Date.now() - upCache.at > 10 * 60_000) upCache = { at: Date.now(), ...(await dirSize(UPLOAD_DIR, BACKUP_DIR)) };
  const backups = await listBackups();
  const ok = S.samples.filter(s => s.ok), hour = ok.filter(s => s.at > Date.now() - 3600_000);
  const day = S.samples.filter(s => s.at > Date.now() - 24 * 3600_000);
  const pg = ((await db.execute(sql`select version() as v`)).rows[0] as { v: string }).v.match(/PostgreSQL [\d.]+/)?.[0] ?? 'PostgreSQL';
  return {
    now: new Date().toISOString(),
    uptime: { sec: Math.round(process.uptime()), since: new Date(Date.now() - process.uptime() * 1000).toISOString(), node: process.version, memMb: Math.round(process.memoryUsage().rss / 1048576) },
    web: { last: S.samples.at(-1) ?? null, avgHour: hour.length ? Math.round(hour.reduce((s, x) => s + x.ms, 0) / hour.length) : null,
      upDay: day.length ? Math.round(day.filter(s => s.ok).length / day.length * 1000) / 10 : null, checks: day.length, spark: S.samples.slice(-60).map(s => s.ok ? s.ms : -1), down: !!S.downSince },
    db: { bytes: size, ms: dbMs, version: pg },
    media: { bytes: upCache.bytes, files: upCache.files },
    jobs: JOBS.map(j => ({ id: j.id, name: j.name, every: j.every, running: S.running.has(j.id), last: state[j.id] ?? null })),
    backups, keepDays: KEEP_DAYS, backupBytes: backups.reduce((s, b) => s + b.size, 0),
    alerts: await loadAlerts(), channel: await alertChannel(),
    cron: { secret: !!process.env.CRON_SECRET, jobsOff: process.env.DISABLE_JOBS === 'true' },
  };
}
export { fmtSize };
