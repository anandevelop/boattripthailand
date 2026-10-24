import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { sessions, settings, users } from '@/db/schema';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { sha256 } from './crypto';

/**
 * โหมดปิดปรับปรุง (/admin → ตั้งค่า → ระบบ). Read by the middleware for every public page:
 * visitors get a 503 page with the contact channels; signed-in staff (valid, 2FA-verified session) see the site as usual.
 * The setting is cached for 10 s, so switching it on/off takes effect within ~10 s.
 */
type L = { th?: string; en?: string };
export type Maint = { on: boolean; msg: L; name: string; phone: string; wa: string; line: string; lineUrl: string; email: string; address: L };

/** official contacts, used until they are saved in /admin → ตั้งค่า */
const DEF: Record<string, string> = { phone: '+66 61 172 5854', wa: '+66 61 172 5854', line: '@boattripthailand', lineUrl: 'https://lin.ee/kkzkoX7', email: 'boattripthailand@gmail.com' };

let cache: { at: number; v: Maint } | null = null;
export async function maintenance(): Promise<Maint> {
  if (cache && Date.now() - cache.at < 10_000) return cache.v;
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, 'admin.sitecfg'));
    const c = (row?.value ?? {}) as Record<string, unknown>, s = (k: string) => (typeof c[k] === 'string' ? (c[k] as string) : DEF[k] ?? '');
    const name = c.name && typeof c.name === 'object' ? ((c.name as L).en || (c.name as L).th || '') : s('name');
    cache = { at: Date.now(), v: { on: c.maint === true, msg: (c.maintMsg ?? {}) as L, name: name || 'Boat Trip Thailand', phone: s('phone'), wa: s('wa'), line: s('line'), lineUrl: s('lineUrl'), email: s('email'),
      address: c.address && typeof c.address === 'object' ? (c.address as L) : { th: '79/29 หมู่ 4 ต.เกาะแก้ว อ.เมืองภูเก็ต จ.ภูเก็ต 83000', en: '79/29 Moo 4, Koh Kaew, Muang Phuket, Phuket 83000' } } };
  } catch (e) {
    console.error('[maintenance]', e);
    cache = { at: Date.now(), v: cache?.v ?? { on: false, msg: {}, name: 'Boat Trip Thailand', phone: '', wa: '', line: '', lineUrl: '', email: '', address: {} } };
  }
  return cache.v;
}

/** true when the admin cookie belongs to a live, 2FA-verified session of an active user */
export async function isStaff(token: string | undefined) {
  if (!token) return false;
  try {
    const [r] = await db.select({ ok: users.active, v: users.sessionVersion, sv: sessions.sessionVersion }).from(sessions).innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, sha256(token)), eq(sessions.mfaVerified, true), gt(sessions.expiresAt, new Date())));
    return !!r && r.ok && r.v === r.sv;
  } catch { return false; }
}

const esc = (s: string) => s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
/* ---------- the page visitors see ---------- */
const HERO = ['leopard-90-ft', 'the-origin-90-ft', 'splo-74-ft', 'siam-princess-70-ft', 'lobster-78-ft'];
let heroes: string[] | null = null;
const heroImgs = () => heroes ??= HERO.map(s => `/boats/${s}-hero.webp`).filter(u => { try { return existsSync(join(process.cwd(), 'public', u)); } catch { return false; } }).slice(0, 4);
const I = (d: string) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  line: I('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>'),
  wa: I('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  phone: I('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  mail: I('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  globe: I('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  pin: I('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
};

export function maintenancePage(m: Maint, en: boolean) {
  const t = (th: string, e: string) => (en ? e : th);
  const msg = (en ? m.msg.en || m.msg.th : m.msg.th || m.msg.en) || t('ขณะนี้เว็บไซต์กำลังปรับปรุง กรุณาติดต่อเราทาง LINE หรือโทร', 'We are updating the website. Please contact us via LINE or phone.');
  const digits = (p: string) => p.replace(/[^\d+]/g, '');
  const ch = [
    m.lineUrl && { h: m.lineUrl, k: 'line', l: 'LINE', v: m.line, main: true },
    m.wa && { h: `https://wa.me/${digits(m.wa).replace(/^\+/, '')}`, k: 'wa', l: 'WhatsApp', v: m.wa },
    m.phone && { h: `tel:${digits(m.phone)}`, k: 'phone', l: t('โทร', 'Call'), v: m.phone },
    m.email && { h: `mailto:${m.email}`, k: 'mail', l: t('อีเมล', 'Email'), v: m.email },
  ].filter(Boolean) as { h: string; k: keyof typeof IC; l: string; v: string; main?: boolean }[];
  const imgs = heroImgs(), addr = (en ? m.address.en || m.address.th : m.address.th || m.address.en) || '';
  const n = Math.max(1, imgs.length), cyc = n * 7;
  return `<!doctype html><html lang="${en ? 'en' : 'th'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex"><meta name="theme-color" content="#3a0007">
<title>${esc(m.name)} · ${t('กำลังปรับปรุงเว็บไซต์', 'Updating our website')}</title><link rel="icon" href="/icon.png">
${imgs[0] ? `<link rel="preload" as="image" href="${imgs[0]}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=IBM+Plex+Sans+Thai:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root{--m:#70000e;--m9:#3a0007;--ink:#231416;--glass:rgb(255 255 255/.12);--edge:rgb(255 255 255/.28)}
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{min-height:100svh;display:flex;flex-direction:column;color:#fff;background:var(--m9);font:16px/1.6 Jost,"IBM Plex Sans Thai",system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.bg{position:fixed;inset:0;overflow:hidden;z-index:0}
.bg img{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;opacity:0;animation:show ${cyc}s infinite,drift ${cyc}s infinite linear;filter:saturate(1.05)}
${imgs.map((_, i) => `.bg img:nth-child(${i + 1}){animation-delay:${i * 7}s}`).join('')}
${n === 1 ? '.bg img{opacity:1;animation:drift 30s infinite alternate linear}' : ''}
@keyframes show{0%{opacity:0}${(100 / n * .18).toFixed(1)}%{opacity:1}${(100 / n).toFixed(1)}%{opacity:1}${(100 / n * 1.18).toFixed(1)}%{opacity:0}100%{opacity:0}}
@keyframes drift{0%{transform:scale(1) translate3d(0,0,0)}100%{transform:scale(1.12) translate3d(-2%,-1%,0)}}
.bg::after{content:"";position:absolute;inset:0;background:
  radial-gradient(120% 80% at 50% 110%,rgb(58 0 7/.92) 10%,transparent 60%),
  linear-gradient(180deg,rgb(35 20 22/.55),rgb(58 0 7/.35) 40%,rgb(58 0 7/.85))}
.grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.07;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
header,main,footer{position:relative;z-index:2}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:max(20px,env(safe-area-inset-top)) clamp(16px,4vw,40px) 0}
.brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-weight:500;letter-spacing:.02em}
.brand img{width:36px;height:36px}
.pill{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;background:var(--glass);-webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);box-shadow:inset 0 1px 0 rgb(255 255 255/.35),inset 0 0 0 1px var(--edge);color:#fff;text-decoration:none;font-size:13px;transition:background .3s}
.pill:hover{background:rgb(255 255 255/.2)}
.pill svg{width:16px;height:16px}
main{flex:1;display:grid;place-items:center;padding:20px clamp(16px,4vw,40px) 72px}
.card{width:min(560px,100%);padding:clamp(28px,5vw,44px);border-radius:32px;text-align:center;background:linear-gradient(160deg,rgb(255 255 255/.16),rgb(255 255 255/.06));
  -webkit-backdrop-filter:blur(26px) saturate(180%);backdrop-filter:blur(26px) saturate(180%);
  box-shadow:0 30px 80px -20px rgb(20 0 4/.6),inset 0 1px 0 rgb(255 255 255/.45),inset 0 0 0 1px rgb(255 255 255/.22);animation:rise 1s cubic-bezier(.2,.8,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(24px) scale(.98)}to{opacity:1;transform:none}}
.mark{position:relative;width:88px;height:88px;margin:0 auto 16px;display:grid;place-items:center}
.mark img{width:58px;height:58px;filter:drop-shadow(0 6px 18px rgb(0 0 0/.35))}
.mark svg{position:absolute;inset:0;width:100%;height:100%;animation:spin 40s linear infinite}
.mark .sonar{position:absolute;inset:14px;border-radius:50%;border:1px solid rgb(255 255 255/.5);animation:sonar 3.2s cubic-bezier(.2,.6,.3,1) infinite}
.mark .sonar.b{animation-delay:1.6s}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes sonar{0%{transform:scale(.7);opacity:.8}100%{transform:scale(1.7);opacity:0}}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;padding:6px 14px;border-radius:999px;background:rgb(255 255 255/.1);box-shadow:inset 0 0 0 1px rgb(255 255 255/.2)}
.dot{width:7px;height:7px;border-radius:50%;background:#ffb4bd;box-shadow:0 0 0 0 rgb(255 180 189/.7);animation:pulse 2s infinite}
@keyframes pulse{70%{box-shadow:0 0 0 8px rgb(255 180 189/0)}100%{box-shadow:0 0 0 0 rgb(255 180 189/0)}}
h1{font-weight:500;font-size:clamp(28px,5.2vw,40px);line-height:1.2;margin:16px 0 10px}
html[lang=en] h1{letter-spacing:-.01em}
h1 em{font-style:normal;background:linear-gradient(90deg,#fff,#ffd5da 50%,#fff);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sheen 6s ease-in-out infinite}
@keyframes sheen{50%{background-position:100% 0}}
.msg{color:rgb(255 255 255/.82);font-weight:300;font-size:clamp(15px,2.2vw,17px);max-width:40ch;margin:0 auto}
.voyage{margin:22px auto 24px;max-width:320px}
html[lang=en] .eyebrow,html[lang=en] .voyage small{letter-spacing:.14em;text-transform:uppercase;font-size:11.5px}
.track{position:relative;height:3px;border-radius:3px;background:rgb(255 255 255/.18);overflow:hidden}
.track i{position:absolute;inset:0 auto 0 0;width:38%;border-radius:3px;background:linear-gradient(90deg,transparent,#fff);animation:sail 2.6s cubic-bezier(.6,0,.4,1) infinite}
@keyframes sail{0%{transform:translateX(-100%)}100%{transform:translateX(270%)}}
.voyage small{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:rgb(255 255 255/.6)}
.cta{display:grid;gap:10px}
.btn{display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:18px;color:#fff;text-decoration:none;text-align:left;background:rgb(255 255 255/.08);box-shadow:inset 0 0 0 1px rgb(255 255 255/.18);transition:transform .25s,background .25s,box-shadow .25s}
.btn:hover{transform:translateY(-2px);background:rgb(255 255 255/.16);box-shadow:inset 0 0 0 1px rgb(255 255 255/.35)}
.btn .ic{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgb(255 255 255/.12)}
.btn b{display:block;font-weight:500;font-size:15px}.btn span{font-size:13px;color:rgb(255 255 255/.7)}
.btn .go{margin-left:auto;opacity:.6;transition:transform .25s,opacity .25s}.btn:hover .go{transform:translateX(4px);opacity:1}
.btn.main{background:#fff;color:var(--m);box-shadow:0 12px 30px -10px rgb(0 0 0/.45)}
.btn.main span{color:rgb(112 0 14/.7)}.btn.main .ic{background:var(--m);color:#fff}
.btn.main:hover{background:#fff;box-shadow:0 18px 40px -12px rgb(0 0 0/.55)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grid2 a:last-child:nth-child(odd){grid-column:1/-1}
@media (max-width:480px){.grid2{grid-template-columns:1fr}.btn .x{display:none}}
.btn .x{font-style:normal}
footer{padding:0 clamp(16px,4vw,40px) max(18px,env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center;font-size:12px;color:rgb(255 255 255/.65)}
footer span{display:inline-flex;align-items:center;gap:6px}footer svg{width:14px;height:14px}
.sea{position:fixed;left:0;right:0;bottom:0;height:110px;z-index:1;pointer-events:none}
.sea svg{position:absolute;bottom:0;width:200%;height:100%}
.sea .w1{animation:wave 18s linear infinite;opacity:.14}.sea .w2{animation:wave 12s linear infinite reverse;opacity:.12}.sea .w3{animation:wave 26s linear infinite;opacity:.6}
@keyframes wave{to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.bg img:first-child{opacity:1}}
</style></head><body>
<div class="bg" aria-hidden="true">${imgs.map((u, i) => `<img src="${u}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>`).join('')}</div>
<div class="grain" aria-hidden="true"></div>
<div class="sea" aria-hidden="true">
${[['w1', 'rgb(255 255 255)', 70], ['w2', 'rgb(255 213 218)', 55], ['w3', 'rgb(58 0 7)', 38]].map(([c, f, h]) => `<svg class="${c}" viewBox="0 0 2880 150" preserveAspectRatio="none"><path fill="${f}" d="M0 ${150 - +h} ${Array.from({ length: 8 }, (_, i) => `Q ${i * 360 + 180} ${150 - +h - 26 * (i % 2 ? -1 : 1)} ${(i + 1) * 360} ${150 - +h}`).join(' ')} V150 H0Z"/></svg>`).join('')}
</div>
<header><a class="brand" href="${en ? '/en' : '/'}"><img src="/brand/logo-white.png" alt="">${esc(m.name)}</a>
<a class="pill" href="${en ? '/' : '/en'}" hreflang="${en ? 'th' : 'en'}">${IC.globe}${en ? 'ภาษาไทย' : 'English'}</a></header>
<main><section class="card">
<div class="mark" aria-hidden="true"><span class="sonar"></span><span class="sonar b"></span>
<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="none" stroke="rgb(255 255 255/.35)" stroke-width=".8" stroke-dasharray="1 4.2"/>${['N', 'E', 'S', 'W'].map((d, i) => `<text x="50" y="7.5" fill="rgb(255 255 255/.75)" font-size="6" text-anchor="middle" font-family="Jost" transform="rotate(${i * 90} 50 50)">${d}</text>`).join('')}</svg>
<img src="/brand/logo-white.png" alt=""></div>
<span class="eyebrow"><span class="dot"></span>${t('ปิดปรับปรุงชั่วคราว', 'Temporarily docked')}</span>
<h1>${t('เรากำลังเตรียมเรือ<br><em>ให้พร้อมออกทะเล</em>', 'We\'re getting the fleet<br><em>ready to set sail</em>')}</h1>
<p class="msg">${esc(msg)}</p>
<div class="voyage" aria-hidden="true"><div class="track"><i></i></div><small><span>${t('ภูเก็ต', 'Phuket')}</span><span>${t('ทะเลอันดามัน', 'Andaman Sea')}</span></small></div>
<div class="cta">${ch.filter(c => c.main).map(c => `<a class="btn main" href="${esc(c.h)}" rel="noopener"><span class="ic">${IC[c.k]}</span><div><b>${t('แชทกับเราทาง', 'Chat with us on')} ${c.l}</b><span>${esc(c.v)}<i class="x"> · ${t('ตอบไวทุกวัน', 'quick replies daily')}</i></span></div><span class="go">${IC.arrow}</span></a>`).join('')}
<div class="grid2">${ch.filter(c => !c.main).map(c => `<a class="btn" href="${esc(c.h)}" rel="noopener"><span class="ic">${IC[c.k]}</span><div><b>${c.l}</b><span>${esc(c.v)}</span></div></a>`).join('')}</div></div>
</section></main>
<footer><span>© ${new Date().getFullYear()} ${esc(m.name)}</span>${addr ? `<span>${IC.pin}${esc(addr)}</span>` : ''}</footer>
</body></html>`;
}
