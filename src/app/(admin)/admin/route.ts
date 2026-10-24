import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { adminBoot } from '@/lib/admin-boot';
import { currentUser } from '@/lib/auth';

/**
 * /admin — the approved admin design (site/admin-shell.html + public/admin-app/app.js).
 * The server checks the session, then ships only the data this user may see (window.__BOOT__).
 * Navigation inside the admin uses #/page links; every change goes through /api/admin/*.
 */
export const dynamic = 'force-dynamic';
let shell: { html: string; v: string } | null = null;
function loadShell() {
  const app = path.join(process.cwd(), 'public/admin-app/app.js'), v = String(Math.floor(statSync(app).mtimeMs));
  if (!shell || shell.v !== v) shell = { html: readFileSync(path.join(process.cwd(), 'site/admin-shell.html'), 'utf8').replaceAll('__V__', v), v };
  return shell.html;
}

export async function GET() {
  const me = await currentUser();
  if (!me) return new Response(null, { status: 303, headers: { Location: '/admin/login', 'Cache-Control': 'no-store' } });
  const boot = JSON.stringify(await adminBoot(me)).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16));
  return new Response(loadShell().replace('/*BOOT_JSON*/null', () => boot), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff' },
  });
}
