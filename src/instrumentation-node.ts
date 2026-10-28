import { startJobs } from './lib/system';

/* scheduled jobs (backup, SLA alerts, session cleanup, web check …) — src/lib/system.ts · /admin → ระบบ & สำรองข้อมูล */
const g = globalThis as unknown as { __jobs?: boolean };
if (!g.__jobs && process.env.DISABLE_JOBS !== 'true') {
  g.__jobs = true;
  startJobs();
}
