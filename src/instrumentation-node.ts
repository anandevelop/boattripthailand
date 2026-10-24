import { purgeExpiredSessions } from './lib/auth-jobs';
import { checkSla } from './lib/leads';

const g = globalThis as unknown as { __jobs?: boolean };
if (!g.__jobs && process.env.DISABLE_JOBS !== 'true') {
  g.__jobs = true;
  setInterval(() => { checkSla().catch(e => console.error('[sla]', e)); }, 60_000);
  setInterval(() => { purgeExpiredSessions().catch(() => {}); }, 3600_000);
}
