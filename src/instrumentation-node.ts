import { loadLineCfg } from './lib/line-config';
import { startJobs } from './lib/system';

/* scheduled jobs (backup, SLA alerts, session cleanup, web check …) — src/lib/system.ts · /admin → ระบบ & สำรองข้อมูล */
const g = globalThis as unknown as { __jobs?: boolean };
if (!g.__jobs && process.env.DISABLE_JOBS !== 'true') {
  g.__jobs = true;
  startJobs();
  void loadLineCfg();   // LINE keys saved in the admin
}

/*
 * After a start: render every sitemap URL once, one after another, so the first crawler burst hits a warm page cache
 * (src/lib/site-render.ts). Plain HTTP to this server — same middleware and route as a visitor; real requests go in between.
 */
if (!(globalThis as { __warm?: boolean }).__warm && process.env.NODE_ENV === 'production' && process.env.SSR_WARM !== 'false') {
  (globalThis as { __warm?: boolean }).__warm = true;
  const base = `http://127.0.0.1:${process.env.PORT || 3000}`, headers = { 'user-agent': 'BTT-warm' };
  setTimeout(async () => {
    try {
      const xml = await (await fetch(base + '/sitemap.xml', { headers })).text();
      const urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => { try { const u = new URL(m[1].replace(/&amp;/g, '&')); return u.pathname + u.search; } catch { return ''; } }).filter(Boolean))];
      const t0 = Date.now();
      for (const u of urls) {
        try { await (await fetch(base + u, { headers })).arrayBuffer(); } catch { /* next */ }
        await new Promise(r => setTimeout(r, 40));
      }
      console.log(`[ssr] warmed ${urls.length} pages in ${Math.round((Date.now() - t0) / 1000)}s`);
    } catch (e) { console.error('[ssr] warm', e); }
  }, 8000);
}
