/* =====================================================================
   AUTH · ROLE-BASED ACCESS (RBAC) · AUDIT LOG
   - login + 2FA (admin) + lockout + idle timeout
   - permissions enforced on every page, drawer, export
   - append-only audit log with before → after diffs, hash-chained
   NOTE: in production these checks run on the server (API + DB);
   the UI only mirrors them.
   ===================================================================== */
const DEMO_PW = 'demo1234', DEMO_OTP = '246810';
const SESSION_IP = '171.97.12.40';
const DEVICE = (() => { const u = navigator.userAgent; const b = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : /Firefox\//.test(u) ? 'Firefox' : 'Browser'; const o = /iPhone|iPad/.test(u) ? 'iOS' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'macOS' : /Win/.test(u) ? 'Windows' : 'Linux'; return `${b} · ${o}`; })();

/* ---------- demo users for the other roles ---------- */
[['anan', 'ANAN', 'super', tr('ผู้ดูแลระบบ', 'System owner'), '#70000e'], ['mint', 'Mint', 'admin', tr('การตลาด', 'Marketing'), '#3b6e8f']].forEach(([id, name, roleKey, title]) => {
  if (TEAM.find(t => t.id === id)) return;
  const t = { id, name, full: '', tel: id === 'anan' ? '' : '+66 80 000 0001', telFmt: '', wa: '', line: '', email: id + '@boattripthailand.com', roleKey, title, langs: ['ไทย'], online: false, showWeb: false, leads: false, active: true, perms: null, bio: tr('', ''), demo: true };
  t.role = roleLabel(t); TEAM.push(t); TEAM_IMG[id] = initialsAva(name);
});

/* ---------- permissions ---------- */
PERMS.length = 0;
PERMS.push(['bookings', 'ลีด & ลูกค้า (เฉพาะของตัวเอง)'], ['bookings_all', 'เห็นลีดของทุกคน'], ['boats', 'เรือ ราคา ฤดูกาล กิจกรรม'], ['marketing', 'ใช้ประโยชน์จากลีด (กลุ่มเป้าหมาย โฆษณา)'],
  ['content', 'เนื้อหา บทความ คลังสื่อ'], ['seo', 'SEO & วิเคราะห์'], ['export', 'Export ข้อมูล (CSV)'], ['settings', 'ตั้งค่าเว็บไซต์'], ['team', 'จัดการทีม & สิทธิ์ผู้ใช้'], ['audit', 'ดูบันทึกกิจกรรม']);
Object.keys(ROLE_PERMS).forEach(k => delete ROLE_PERMS[k]);
Object.assign(ROLE_PERMS, { super: PERMS.map(p => p[0]), admin: PERMS.map(p => p[0]).filter(k => !['team', 'audit'].includes(k)), sales: ['bookings'] });
ROLES.sales[1] = 'เห็นและจัดการเฉพาะลีดของตัวเอง · ไม่เห็นลีดของคนอื่น';
let ME = null;
const permsOf = u => u ? (u.perms || ROLE_PERMS[u.roleKey] || []) : [];
const can = k => permsOf(ME).includes(k);
const isRO = () => false;
const PAGE_PERM = { dashboard: 'bookings', bookings: 'bookings', calendar: 'bookings', customers: 'bookings', audiences: 'marketing', boats: 'boats', seasons: 'boats', activities: 'boats', content: 'content', articles: 'content', media: 'content', seo: 'seo', analytics: 'seo', team: 'team', settings: 'settings', audit: 'audit' };
const canPage = p => !PAGE_PERM[p] || can(PAGE_PERM[p]);
const firstPage = () => PAGES.find(x => x[0] !== '—' && canPage(x[0]))?.[0];
const ownB = b => b.sales === ME?.id;

/* ---------- audit log (append-only, hash chained) ---------- */
const AUDIT = []; let _ah = '00000000';
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
function audit(act, ent, ref, label, changes = [], o = {}) {
  const e = { id: AUDIT.length + 1, ts: o.ts || new Date().toISOString(), uid: o.uid || ME?.id || '—', role: o.role || ME?.roleKey || '', act, ent, ref, label, changes, note: o.note || '', ip: o.ip || SESSION_IP, dev: o.dev || DEVICE, sample: !!o.sample };
  e.prev = _ah; e.hash = fnv(JSON.stringify(e)); _ah = e.hash; AUDIT.push(e); return e;
}
const ACT = { login: ['เข้าระบบ', 'log-in', '#1e7a46'], logout: ['ออกจากระบบ', 'log-out', '#6b5e60'], login_fail: ['เข้าระบบไม่สำเร็จ', 'shield-alert', '#b42318'], locked: ['ล็อกบัญชีชั่วคราว', 'lock', '#b42318'], denied: ['ถูกปฏิเสธสิทธิ์', 'ban', '#b42318'],
  create: ['สร้าง', 'plus', '#1e7a46'], update: ['แก้ไข', 'pencil', '#70000e'], delete: ['ลบ', 'trash-2', '#b42318'], status: ['เปลี่ยนสถานะ', 'git-commit-horizontal', '#8a5a00'], payment: ['รับเงิน', 'banknote', '#1e7a46'], assign: ['มอบหมายเซลล์', 'user-round-check', '#8a5a00'], export: ['Export', 'download', '#3b6e8f'], publish: ['เผยแพร่', 'send', '#1e7a46'], role: ['เปลี่ยนสิทธิ์', 'key-round', '#70000e'] };
const ENT = { booking: 'ลีด', boat: 'เรือ & ราคา', season: 'ฤดูกาล', team: 'ทีม & สิทธิ์', settings: 'ตั้งค่า', article: 'บทความ', auth: 'ความปลอดภัย', customer: 'ลูกค้า' };
const AUD_GROUP = { all: ['ทั้งหมด', () => true], price: ['ราคาเรือ', e => e.changes.some(c => c.kind === 'price')], booking: ['ลีด', e => e.ent === 'booking'], boat: ['เรือ & ฤดูกาล', e => ['boat', 'season'].includes(e.ent)], content: ['เนื้อหา & ตั้งค่า', e => ['article', 'settings'].includes(e.ent)], team: ['ทีม & สิทธิ์', e => e.ent === 'team'], security: ['ความปลอดภัย', e => e.ent === 'auth' || e.act === 'export'] };

/* ---------- diff helpers ---------- */
function jdiff(a, b, path = '', out = []) {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object') { new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k => jdiff(a[k], b[k], path + (Array.isArray(a) ? `[${k}]` : (path ? '.' : '') + k), out)); }
  else out.push({ f: path, from: a ?? '', to: b ?? '' });
  return out;
}
const clone = o => JSON.parse(JSON.stringify(o ?? null));
const BOAT_F = { name: 'ชื่อเรือ', pax: 'จำนวนคนสูงสุด', type: 'ประเภทเรือ', marinaP: 'ท่าเรือ', active: 'แสดงบนเว็บ', status: 'สถานะ', imgs: 'จำนวนรูป', includes: 'รวมในราคา', not_included: 'ไม่รวมในราคา', complimentary: 'ของแถม', notes: 'หมายเหตุ', cal: 'ปฏิทินฤดูกาล' };
const snapBoat = b => ({ name: b.name, pax: b.pax, type: b.type, marinaP: b.marinaP, active: b.active, status: b.status, imgs: (b.imgs || []).length, cal: b.cal || '', tables: clone(b.tables), includes: clone(b.includes), not_included: clone(b.not_included), complimentary: clone(b.complimentary), notes: clone(b.notes) });
function boatChanges(b, before, after) {
  return jdiff(before, after).map(c => {
    let m;
    if ((m = c.f.match(/^tables\[(\d+)\]\.rows\[(\d+)\]\[(\d+)\]$/))) { const t = b.tables[+m[1]] || {}, row = (t.rows || [])[+m[2]] || []; return +m[3] === 0 ? { ...c, f: 'ชื่อโปรแกรม' } : { ...c, f: `ราคาขาย · ${row[0] || 'โปรแกรม ' + (+m[2] + 1)} · ${(t.columns || [])[+m[3]] || ''}`, kind: 'price' }; }
    if ((m = c.f.match(/^tables\[(\d+)\]\.columns\[(\d+)\]$/))) return { ...c, f: 'ชื่อคอลัมน์ราคา' };
    if ((m = c.f.match(/^tables\[(\d+)\]\.rows(\[(\d+)\])?$/))) return { ...c, f: 'แถวโปรแกรม', from: c.from ? (Array.isArray(c.from) ? c.from[0] : c.from) : '—', to: c.to ? (Array.isArray(c.to) ? c.to[0] : c.to) : 'ลบแล้ว' };
    const k = c.f.split(/[.[]/)[0]; return { ...c, f: BOAT_F[k] || c.f };
  }).map(c => typeof c.from === 'object' || typeof c.to === 'object' ? { ...c, from: c.from ? '(ข้อมูลเดิม)' : '—', to: c.to ? '(ข้อมูลใหม่)' : '—' } : c);
}

/* ---------- sample audit history (labelled) ---------- */
(function seedAudit() {
  const at = (d, h, m) => { const x = addDays(TODAY, -d); x.setHours(h, m, 0, 0); return x.toISOString(); };
  const S = { sample: true };
  const b1 = FLEET.find(b => b.featured && b.tables?.[0]?.rows?.[0]?.[2]) || FLEET.find(b => b.tables?.[0]?.rows?.[0]?.[1]);
  const t0 = b1.tables[0], r0 = t0.rows[0], cur = priceNum(r0[2] || r0[1]), ci = r0[2] ? 2 : 1;
  const bkS = BOOKINGS.find(b => b.sales === 'save' && b.status === 'won'), bkP = BOOKINGS.find(b => b.sales === 'prang' && ['contacted', 'talking'].includes(b.status));
  const cal = (typeof SZ !== 'undefined' ? SZ.calendars : [])[0];
  audit('login', 'auth', '', 'เข้าระบบ (รหัสผ่าน + 2FA)', [], { ...S, uid: 'kwang', role: 'super', ts: at(9, 9, 2) });
  audit('update', 'boat', b1.slug, b1.name, [{ f: `ราคาขาย · ${r0[0]} · ${t0.columns[ci]}`, from: (cur - 5000).toLocaleString('en-US') + ' THB', to: r0[ci], kind: 'price' }], { ...S, uid: 'kwang', role: 'super', ts: at(9, 9, 18), note: 'ปรับราคาตามโบรชัวร์ใหม่ 2026/27' });
  ['admin@boattripthailand.com', 'admin@boattripthailand.com', 'info@boattripthailand.com', 'admin@boattripthailand.com', 'admin@boattripthailand.com'].forEach((em, i) => audit('login_fail', 'auth', em, 'รหัสผ่านไม่ถูกต้อง · ' + em, [], { ...S, uid: '—', role: '', ts: at(8, 2, 11 + i), ip: '185.220.101.4', dev: 'python-requests' }));
  audit('locked', 'auth', 'admin@boattripthailand.com', 'ผิดเกิน 5 ครั้ง · ล็อก IP 185.220.101.4 15 นาที', [], { ...S, uid: '—', role: '', ts: at(8, 2, 16), ip: '185.220.101.4', dev: 'python-requests' });
  audit('login', 'auth', '', 'เข้าระบบ', [], { ...S, uid: 'prang', role: 'sales', ts: at(7, 10, 5), dev: 'Safari · iOS' });
  if (bkP) audit('status', 'booking', bkP.id, `${bkP.id} · ${bySlug(bkP.boat).name}`, [{ f: 'สถานะ', from: STATUS.new[0], to: STATUS.contacted[0] }], { ...S, uid: 'prang', role: 'sales', ts: at(7, 10, 22), dev: 'Safari · iOS' });
  if (cal) audit('update', 'season', cal.id, cal.name, [{ f: 'Peak Season ช่วงที่ 1 · เริ่ม', from: '12-15', to: (cal.ranges?.peak?.[0]?.[0]) || '12-20' }], { ...S, uid: 'kwang', role: 'super', ts: at(6, 14, 40) });
  audit('denied', 'auth', 'boats', 'พยายามเปิดหน้า "เรือ & ราคา"', [], { ...S, uid: 'save', role: 'sales', ts: at(5, 11, 3) });
  audit('denied', 'auth', 'leads', 'เรียก API ลีดของเซลล์อื่น /api/leads?sales=prang', [], { ...S, uid: 'save', role: 'sales', ts: at(5, 11, 4), note: 'API ตอบ 403 · Sales เห็นเฉพาะลีดของตัวเอง' });
  const a1 = (typeof ART !== 'undefined' ? ART : [])[0]; if (a1) audit('publish', 'article', a1.id, a1.title?.th || a1.title?.en || 'บทความ', [{ f: 'สถานะ', from: 'ฉบับร่าง', to: 'เผยแพร่ (TH, EN)' }], { ...S, uid: 'mint', role: 'admin', ts: at(4, 16, 12) });
  audit('role', 'team', 'prang', 'Prang', [{ f: 'สิทธิ์', from: 'การจอง', to: 'การจอง, Export ข้อมูล' }], { ...S, uid: 'kwang', role: 'super', ts: at(3, 9, 30) });
  audit('role', 'team', 'prang', 'Prang', [{ f: 'สิทธิ์', from: 'การจอง, Export ข้อมูล', to: 'การจอง' }], { ...S, uid: 'kwang', role: 'super', ts: at(3, 17, 45), note: 'ให้สิทธิ์ชั่วคราวเพื่อส่งรายงาน' });
  if (bkS) audit('status', 'booking', bkS.id, `${bkS.id} · ${bySlug(bkS.boat).name}`, [{ f: 'สถานะ', from: STATUS.talking[0], to: STATUS.won[0] }], { ...S, uid: 'save', role: 'sales', ts: at(2, 13, 8) });
  audit('export', 'booking', 'csv', `Export ลีด ${BOOKINGS.length} รายการ`, [], { ...S, uid: 'kwang', role: 'super', ts: at(1, 18, 2) });
  audit('update', 'settings', 'contact', 'ข้อมูลติดต่อ', [{ f: 'อีเมลรับการจอง', from: 'info@boattripthailand.com', to: 'booking@boattripthailand.com' }], { ...S, uid: 'kwang', role: 'super', ts: at(0, 8, 50) });
})();

/* ---------- session ---------- */
const SESS_KEY = 'btt_admin_sess', IDLE_MIN = 30;
const FAILS = {};
const sGet = () => { try { return JSON.parse(sessionStorage.getItem(SESS_KEY) || 'null'); } catch (e) { return null; } };
const sSet = v => { try { v ? sessionStorage.setItem(SESS_KEY, JSON.stringify(v)) : sessionStorage.removeItem(SESS_KEY); } catch (e) { } };
let lastAct = Date.now(), loginAt = null;
['click', 'keydown', 'pointermove'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
setInterval(() => { if (ME && Date.now() - lastAct > IDLE_MIN * 60000) logout('timeout'); }, 30000);

const LG = { step: 'pw', email: '', err: '', user: null };
function showLogin() {
  closeDrawer(); closeModal();
  let el = $('#login'); if (!el) { el = document.createElement('div'); el.id = 'login'; el.className = 'fixed inset-0 z-[80] bg-[#faf7f5] overflow-y-auto'; document.body.appendChild(el); }
  el.classList.remove('hidden'); document.body.classList.add('overflow-hidden');
  const demo = TEAM.filter(t => t.active && !t.deleted && ['anan', 'kwang', 'mint', 'save', 'prang'].includes(t.id));
  const lock = FAILS[LG.email]?.until > Date.now();
  el.innerHTML = `<div class="min-h-full grid lg:grid-cols-[1fr_440px]">
    <div class="hidden lg:flex flex-col justify-between p-12 bg-maroon text-white relative overflow-hidden"><div class="flex items-center gap-3"><img src="${$('#side img').src}" class="w-10 h-10 object-contain bg-white rounded-xl p-1"/><p class="tracking-[.25em] text-[12px]">BOAT TRIP · ADMIN</p></div>
      <div class="max-w-md"><p class="text-[28px] leading-tight">ระบบหลังบ้าน<br/>Boat Trip Thailand</p><ul class="mt-6 space-y-3 text-[13px] text-white/80">${[['shield-check', 'สิทธิ์ตามบทบาท บังคับใช้ทุกหน้าและทุก API'], ['inbox', 'Sales เห็นเฉพาะลีดและลูกค้าของตัวเอง'], ['history', 'บันทึกทุกการแก้ไข ใคร แก้อะไร เมื่อไร'], ['smartphone', 'Super Admin และ Admin ต้องยืนยัน 2 ขั้นตอน (2FA)']].map(([i, l]) => `<li class="flex gap-3 items-center"><i data-lucide="${i}" class="w-4 h-4 shrink-0"></i>${l}</li>`).join('')}</ul></div>
      <p class="text-[11px] text-white/50">Mockup · ระบบจริงตรวจสิทธิ์ที่เซิร์ฟเวอร์ทุกครั้ง</p></div>
    <div class="flex flex-col justify-center p-6 sm:p-10 bg-white min-h-screen lg:min-h-0">
      <div class="w-full max-w-sm mx-auto">
        <div class="lg:hidden flex items-center gap-2.5 mb-8"><img src="${$('#side img').src}" class="w-9 h-9 object-contain"/><div class="leading-none"><p class="text-[13px] font-medium tracking-wide">BOAT TRIP</p><p class="text-[9px] tracking-[.3em] text-muted mt-1">ADMIN</p></div></div>
        ${LG.step === 'pw' ? `
        <h1 class="text-[22px] font-medium">เข้าสู่ระบบ</h1><p class="text-muted mt-1">ใช้อีเมลทีมงาน @boattripthailand.com</p>
        <form class="mt-6 grid gap-3" onsubmit="event.preventDefault();doLogin()">
          <label><span class="lbl">อีเมล</span><input id="lgEmail" type="email" class="inp" autocomplete="username" value="${esc(LG.email)}" required/></label>
          <label><span class="lbl flex justify-between">รหัสผ่าน<a href="javascript:void 0" class="text-maroon" onclick="lgForgot()">ลืมรหัสผ่าน?</a></span><input id="lgPw" type="password" class="inp" autocomplete="current-password" required/></label>
          ${LG.err ? `<p class="text-[12px] text-[#b42318] flex items-start gap-1.5" role="alert"><i data-lucide="alert-circle" class="w-3.5 h-3.5 mt-0.5 shrink-0"></i>${LG.err}</p>` : ''}
          <button class="btn btn-p !h-11 mt-1" ${lock ? 'disabled' : ''}>เข้าสู่ระบบ</button>
        </form>
        <div class="mt-8 rounded-2xl bg-sand p-4"><p class="text-[11px] uppercase tracking-[.14em] text-muted">บัญชีทดลอง (เฉพาะ mockup)</p><p class="text-[11px] text-muted mt-1">รหัสผ่าน <b class="tnum text-ink">${DEMO_PW}</b> · กดเพื่อกรอกอัตโนมัติ</p>
          <div class="mt-3 grid gap-1.5">${demo.map(t => `<button type="button" class="flex items-center gap-2.5 p-2 rounded-xl bg-white ring-1 ring-line hover:ring-maroon text-left" onclick="$('#lgEmail').value='${t.email}';$('#lgPw').value='${DEMO_PW}';$('#lgPw').focus()"><img src="${TEAM_IMG[t.id]}" class="w-7 h-7 rounded-full object-cover"/><span class="min-w-0 flex-1"><span class="block text-[13px] leading-tight">${t.name} <span class="text-muted">· ${ROLES[t.roleKey][0]}</span></span><span class="block text-[11px] text-muted truncate">${ROLES[t.roleKey][1]}</span></span></button>`).join('')}</div></div>`
        : `
        <button class="btn btn-g !px-2 -ml-2 mb-4" onclick="LG.step='pw';LG.err='';showLogin()"><i data-lucide="arrow-left" class="w-4 h-4"></i>กลับ</button>
        <div class="w-12 h-12 rounded-2xl bg-maroon-50 grid place-items-center text-maroon"><i data-lucide="smartphone" class="w-6 h-6"></i></div>
        <h1 class="text-[22px] font-medium mt-4">ยืนยันตัวตน 2 ขั้นตอน</h1><p class="text-muted mt-1">ใส่รหัส 6 หลักจากแอป Authenticator ของ ${esc(LG.user.name)}</p>
        <form class="mt-6 grid gap-3" onsubmit="event.preventDefault();doOtp()">
          <input id="lgOtp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" class="inp !h-12 text-center text-[22px] tracking-[.5em] tnum" placeholder="••••••" required/>
          ${LG.err ? `<p class="text-[12px] text-[#b42318]" role="alert">${LG.err}</p>` : ''}
          <button class="btn btn-p !h-11">ยืนยัน</button>
        </form>
        <p class="text-[11px] text-muted mt-4">รหัสทดลอง: <b class="tnum text-ink">${DEMO_OTP}</b></p>`}
      </div>
    </div></div>`;
  icons(); setTimeout(() => (LG.step === 'pw' ? (LG.email ? $('#lgPw') : $('#lgEmail')) : $('#lgOtp'))?.focus(), 30);
}
function lgForgot() { const em = $('#lgEmail').value.trim(); toast(em ? `ถ้ามีบัญชีนี้ ระบบจะส่งลิงก์ตั้งรหัสใหม่ไปที่ ${em} (จำลอง)` : 'กรอกอีเมลก่อน'); }
function doLogin() {
  const em = $('#lgEmail').value.trim().toLowerCase(), pw = $('#lgPw').value; LG.email = em;
  const F = FAILS[em] ??= { n: 0, until: 0 };
  if (F.until > Date.now()) { LG.err = `บัญชีนี้ถูกล็อกชั่วคราว ลองใหม่ใน ${Math.ceil((F.until - Date.now()) / 60000)} นาที`; return showLogin(); }
  const u = TEAM.find(t => (t.email || '').toLowerCase() === em && t.active && !t.deleted);
  if (!u || pw !== DEMO_PW) {
    F.n++; audit('login_fail', 'auth', em, (u ? 'รหัสผ่านไม่ถูกต้อง · ' : 'ไม่พบบัญชีหรือบัญชีถูกปิด · ') + em, [], { uid: u?.id || '—', role: u?.roleKey || '' });
    if (F.n >= 5) { F.until = Date.now() + 15 * 60000; F.n = 0; audit('locked', 'auth', em, 'ผิดเกิน 5 ครั้ง · ล็อก 15 นาที', [], { uid: u?.id || '—', role: u?.roleKey || '' }); LG.err = 'ใส่ผิดเกิน 5 ครั้ง บัญชีถูกล็อก 15 นาที'; }
    else LG.err = `อีเมลหรือรหัสผ่านไม่ถูกต้อง (เหลือ ${5 - F.n} ครั้ง)`;
    return showLogin();
  }
  F.n = 0; LG.err = '';
  if (['super', 'admin'].includes(u.roleKey) || u.mfa) { LG.step = 'otp'; LG.user = u; return showLogin(); }
  finishLogin(u, 'เข้าระบบ');
}
function doOtp() { if ($('#lgOtp').value.replace(/\D/g, '') !== DEMO_OTP) { LG.err = 'รหัสไม่ถูกต้องหรือหมดอายุ'; audit('login_fail', 'auth', LG.user.email, 'รหัส 2FA ไม่ถูกต้อง', [], { uid: LG.user.id, role: LG.user.roleKey }); return showLogin(); } finishLogin(LG.user, 'เข้าระบบ (รหัสผ่าน + 2FA)'); }
function finishLogin(u, label, restore) {
  ME = u; loginAt = restore?.t || Date.now(); lastAct = Date.now(); LG.step = 'pw'; LG.err = ''; LG.user = null;
  sSet({ uid: u.id, t: loginAt });
  if (!restore) audit('login', 'auth', '', label);
  $('#login')?.classList.add('hidden'); document.body.classList.remove('overflow-hidden');
  const p = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/')[0];
  if (!canPage(p) || !PAGES.find(x => x[0] === p)) history.replaceState(null, '', '#/' + firstPage());
  route(); if (!restore) toast(`สวัสดี ${u.name} · สิทธิ์ ${ROLES[u.roleKey][0]}`);
}
function logout(reason) {
  if (!ME) return; flushBoat(); audit('logout', 'auth', '', reason === 'timeout' ? `ไม่มีการใช้งาน ${IDLE_MIN} นาที · ออกจากระบบอัตโนมัติ` : 'ออกจากระบบ');
  LG.email = ME.email; ME = null; sSet(null); document.body.classList.remove('ro'); showLogin(); if (reason === 'timeout') toast('ออกจากระบบอัตโนมัติเพราะไม่มีการใช้งาน');
}

/* ---------- sidebar user card ---------- */
function paintMe() {
  const card = $('#side .border-t > div'); if (!card || !ME) return;
  card.innerHTML = `<button class="flex items-center gap-2.5 min-w-0 flex-1 text-left" onclick="mePanel()"><img src="${TEAM_IMG[ME.id] || initialsAva(ME.name)}" alt="" class="w-8 h-8 rounded-full object-cover"/><span class="min-w-0"><span class="block text-[13px] leading-tight truncate">${esc(ME.name)}</span><span class="block text-[11px] text-muted truncate">${ROLES[ME.roleKey][0]}${isRO() ? ' · ดูอย่างเดียว' : ''}</span></span></button><button class="btn btn-g !px-1.5 !h-8" onclick="logout()" aria-label="ออกจากระบบ" title="ออกจากระบบ"><i data-lucide="log-out" class="w-4 h-4 text-muted"></i></button>`;
  icons();
}
function mePanel() {
  const P = permsOf(ME), mins = Math.max(0, IDLE_MIN - Math.floor((Date.now() - lastAct) / 60000));
  openModal(`<div class="p-5 border-b border-line flex items-center gap-3"><img src="${TEAM_IMG[ME.id]}" class="w-11 h-11 rounded-full object-cover"/><div class="min-w-0 flex-1"><p class="font-medium">${esc(ME.name)}</p><p class="text-[12px] text-muted">${ME.email} · ${ROLES[ME.roleKey][0]}</p></div><button class="btn btn-g !px-2" onclick="closeModal()" aria-label="Close"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="p-5 space-y-4"><div><p class="lbl">สิทธิ์ของคุณ</p><div class="grid gap-1">${PERMS.map(([k, l]) => `<p class="flex items-center gap-2 text-[12.5px] ${P.includes(k) ? '' : 'text-muted line-through decoration-[#d9cfcf]'}"><i data-lucide="${P.includes(k) ? 'check' : 'x'}" class="w-3.5 h-3.5 ${P.includes(k) ? 'text-[#1e7a46]' : 'text-[#c9bfbf]'}"></i>${l}</p>`).join('')}</div></div>
      <div class="rounded-xl bg-sand p-3 text-[12px] grid gap-1"><p class="flex justify-between"><span class="text-muted">เข้าระบบเมื่อ</span><span>${new Date(loginAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</span></p><p class="flex justify-between"><span class="text-muted">อุปกรณ์</span><span>${DEVICE}</span></p><p class="flex justify-between"><span class="text-muted">หมดเวลาถ้าไม่ใช้งานใน</span><span>${mins} นาที</span></p></div>
      <p class="text-[11px] text-muted">ต้องการสิทธิ์เพิ่ม ติดต่อ Admin · ทุกการเปลี่ยนสิทธิ์ถูกบันทึกไว้</p></div>
    <div class="p-4 border-t border-line flex gap-2"><button class="btn btn-o flex-1" onclick="closeModal();logout()"><i data-lucide="repeat" class="w-3.5 h-3.5"></i>สลับบัญชี (เดโม)</button><button class="btn btn-p flex-1" onclick="closeModal();logout()"><i data-lucide="log-out" class="w-3.5 h-3.5"></i>ออกจากระบบ</button></div>`);
}

/* ---------- 403 ---------- */
function v403() {
  $('#view').innerHTML = `<div class="card max-w-lg mx-auto mt-10 p-8 text-center"><div class="w-14 h-14 mx-auto rounded-2xl bg-maroon-50 grid place-items-center text-maroon"><i data-lucide="lock-keyhole" class="w-7 h-7"></i></div>
    <p class="text-lg font-medium mt-4">ไม่มีสิทธิ์เข้าหน้านี้</p><p class="text-muted mt-1">บทบาท ${ROLES[ME.roleKey][0]} เข้าหน้านี้ไม่ได้ · ระบบบันทึกการพยายามเข้าถึงไว้แล้ว</p>
    <a href="#/${firstPage()}" class="btn btn-p mt-6 inline-flex">กลับหน้าที่ใช้ได้</a></div>`;
  icons();
}

/* ---------- scope: sales see only their own work ---------- */
const HID_CUST = { id: '_HID', name: 'ไม่ว่าง · งานของเซลล์อื่น', country: '', phone: '—', email: '', channel: '', tags: [] };
function scoped(fn, mode = 'own') {
  return function (...a) {
    if (!ME || can('bookings_all')) return fn.apply(this, a);
    const B = BOOKINGS.slice(), C = CUSTOMERS.slice();
    const vis = mode === 'cal' ? B.map(b => ownB(b) ? b : { ...b, cust: '_HID', note: '', pickup: '', channel: '—', _hid: 1 }) : B.filter(ownB);
    BOOKINGS.length = 0; BOOKINGS.push(...vis);
    if (mode === 'cust') { const ids = new Set(vis.map(b => b.cust)); CUSTOMERS.length = 0; CUSTOMERS.push(...C.filter(c => ids.has(c.id))); }
    if (mode === 'cal') CUSTOMERS.push(HID_CUST);
    try { return fn.apply(this, a); } finally { BOOKINGS.length = 0; BOOKINGS.push(...B); CUSTOMERS.length = 0; CUSTOMERS.push(...C); }
  };
}

/* ---------- bookings ---------- */
const _vBookings18 = scoped(vBookings);
vBookings = function () {
  _vBookings18();
  const v = $('#view');
  v.querySelectorAll('.card > .border-b input, .card > .border-b select').forEach(x => x.classList.add('flt'));
  if (!can('bookings_all')) {
    const h2 = v.querySelector('h2'); if (h2) h2.innerHTML = 'ลีดของฉัน <span class="ml-2 align-middle pill bg-sand text-muted !text-[11px]"><i data-lucide="lock" class="w-3 h-3 inline -mt-0.5"></i> เห็นเฉพาะงานที่คุณดูแล</span>';
    v.querySelector('select[onchange^="BK.sales"]')?.remove();
  }
  if (!can('export')) v.querySelector('button[onclick="exportCsv()"]')?.remove();
  icons();
};
const _bookingDetail18 = bookingDetail;
bookingDetail = function (id) {
  const b = BOOKINGS.find(x => x.id === id); if (!b) return;
  if (!can('bookings_all') && !ownB(b)) { audit('denied', 'auth', id, `พยายามเปิดลีด ${id} ของ ${teamOf(b.sales)?.name || '-'}`); return toast('ไม่มีสิทธิ์ดูลีดนี้ · เป็นของเซลล์อื่น'); }
  _bookingDetail18(id);
  const d = $('#drawer');
  const sel = d.querySelector('select[onchange*=".sales="]');
  if (sel) { if (can('bookings_all') && !isRO()) sel.setAttribute('onchange', `bkAssign('${id}',this.value)`); else { sel.disabled = true; sel.closest('label')?.insertAdjacentHTML('beforeend', '<span class="text-[10px] text-muted">เปลี่ยนเซลล์ได้เฉพาะ Admin</span>'); } }
  const ta = d.querySelector('textarea'); if (ta) ta.setAttribute('onchange', `bkNote('${id}',this.value)`);
  const hist = [...d.querySelectorAll('p.lbl')].find(p => p.textContent === 'ประวัติ')?.nextElementSibling;
  const ev = AUDIT.filter(e => e.ent === 'booking' && e.ref === id);
  if (hist && ev.length) hist.insertAdjacentHTML('beforeend', ev.map(e => `<li class="flex gap-2"><span class="w-1.5 h-1.5 rounded-full bg-maroon mt-1.5 shrink-0"></span><span>${fmtTs(e.ts)} · <b class="font-medium">${userName(e.uid)}</b> ${ACT[e.act][0]} ${e.changes.map(c => `${c.f}: ${maskV(c, c.from)} → ${maskV(c, c.to)}`).join(', ')}</span></li>`).join(''));
  icons();
};
function bkChange(id, act, f, from, to, o = {}) { const b = BOOKINGS.find(x => x.id === id); if (String(from) === String(to)) return; audit(act, 'booking', id, `${id} · ${bySlug(b.boat)?.name || ''}`, [{ f, from, to, ...o }]); }
function bkAssign(id, v) { if (!can('bookings_all')) return toast('ไม่มีสิทธิ์'); const b = BOOKINGS.find(x => x.id === id), from = teamOf(b.sales)?.name; b.sales = v; bkChange(id, 'assign', 'เซลล์ผู้ดูแล', from, teamOf(v)?.name); toast('มอบหมายเซลล์แล้ว'); }
function bkNote(id, v) { const b = BOOKINGS.find(x => x.id === id), from = b.note || ''; b.note = v; bkChange(id, 'update', 'บันทึกภายใน', from || '—', v || '—'); toast('บันทึกแล้ว'); }
const _setStatus18 = setStatus;
setStatus = function (id, s) { const b = BOOKINGS.find(x => x.id === id); if (!b || isRO() || (!can('bookings_all') && !ownB(b))) return toast('ไม่มีสิทธิ์แก้ลีดนี้'); const from = b.status; _setStatus18(id, s); if (from !== b.status) bkChange(id, 'status', 'สถานะ', STATUS[from][0], STATUS[b.status][0]); };
const _newBooking18 = newBooking;
newBooking = function (slug) { if (isRO()) return toast('โหมดดูอย่างเดียว'); _newBooking18(slug); if (!can('bookings_all')) { const s = $('#nbS'); if (s) { s.value = ME.id; s.disabled = true; } } };
const _saveNew18 = saveNew;
saveNew = function () { const n = BOOKINGS.length; _saveNew18(); if (BOOKINGS.length > n) { const b = BOOKINGS[0]; if (!can('bookings_all')) b.sales = ME.id; audit('create', 'booking', b.id, `${b.id} · ${bySlug(b.boat)?.name || ''}`, [{ f: 'ลูกค้า', from: '—', to: custOf(b.cust)?.name }, { f: 'เรือที่สนใจ', from: '—', to: bySlug(b.boat)?.name }, { f: 'แหล่งที่มา', from: '—', to: SRC[b.src]?.[0] }]); } };
const _exportCsv18 = exportCsv;
exportCsv = function () {
  if (!can('export')) { audit('denied', 'auth', 'export', 'พยายาม Export ลีด'); return toast('ไม่มีสิทธิ์ Export'); }
  const B = BOOKINGS.slice(), vis = can('bookings_all') ? B : B.filter(ownB);
  const rows = leadCsvRows(vis);
  const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'btt-leads.csv'; a.click();
  audit('export', 'booking', 'csv', `Export ลีด ${vis.length} รายการ`); toast('ดาวน์โหลด CSV แล้ว · บันทึกใน Audit log');
};
const _vCalendar18 = scoped(vCalendar, 'cal');
vCalendar = function () { _vCalendar18(); if (!can('bookings_all')) $('#view h2')?.insertAdjacentHTML('beforeend', ' <span class="ml-2 align-middle pill bg-sand text-muted !text-[11px]">ลีดของเซลล์อื่นแสดงเป็น “ไม่ว่าง”</span>'); };
const _vCustomers18 = scoped(vCustomers, 'cust');
vCustomers = function () { _vCustomers18(); if (!can('bookings_all')) { const h2 = $('#view h2'); if (h2) h2.textContent = 'ลูกค้าของฉัน'; } };
const _custDetail18 = scoped(custDetail, 'cust');
custDetail = function (id) { if (!can('bookings_all') && !BOOKINGS.some(b => b.cust === id && ownB(b))) { audit('denied', 'auth', id, `พยายามเปิดข้อมูลลูกค้า ${id}`); return toast('ไม่มีสิทธิ์ดูลูกค้ารายนี้'); } _custDetail18(id); };
const _vDash18 = scoped(PAGES.find(p => p[0] === 'dashboard')[3]);
vDashboard = function () {
  _vDash18();
  const v = $('#view'); if (!can('bookings_all')) { const h2 = v.querySelector('h2'); if (h2) h2.textContent = `แดชบอร์ดของ ${ME.name}`; }
  icons();
};
PAGES.find(p => p[0] === 'dashboard')[3] = vDashboard; PAGES.find(p => p[0] === 'bookings')[3] = vBookings; PAGES.find(p => p[0] === 'calendar')[3] = vCalendar; PAGES.find(p => p[0] === 'customers')[3] = vCustomers;

/* ---------- boat editor: history tab, change tracking ---------- */
let BSNAP = null;
function commitBoat(slug, note) {
  if (!BSNAP || BSNAP.slug !== slug) return 0; const b = bySlug(slug); if (!b) { BSNAP = null; return 0; }
  const after = snapBoat(b), ch = boatChanges(b, BSNAP.data, after);
  if (ch.length) audit(BSNAP.isNew ? 'create' : 'update', 'boat', slug, b.name || slug, ch, { note });
  BSNAP = { slug, data: after }; return ch.length;
}
function flushBoat() { if (BSNAP) { commitBoat(BSNAP.slug, 'บันทึกอัตโนมัติเมื่อออกจากหน้าแก้ไข'); } }
const _vBoatEdit18 = vBoatEdit;
vBoatEdit = function (slug) {
  const b = bySlug(slug); if (!b) return _vBoatEdit18(slug);
  if (!BSNAP || BSNAP.slug !== slug) { flushBoat(); BSNAP = { slug, data: snapBoat(b) }; }
  const myTab = BE.tab === 'history' ? 'history' : null;
  _vBoatEdit18(slug);
  const card = [...$$('#view .card')].find(c => c.querySelector('.tab')), bar = card?.querySelector('.tab')?.parentElement; if (!bar) return;
  if (myTab) bar.querySelectorAll('.tab.on').forEach(x => x.classList.remove('on'));
  bar.insertAdjacentHTML('beforeend', `<button class="tab ${myTab === 'history' ? 'on' : ''}" onclick="BE.tab='history';vBoatEdit('${slug}')">ประวัติการแก้ไข</button>`);
  const body = card.querySelector('.p-5') || bar.nextElementSibling;
  if (myTab === 'history') { commitBoat(slug); body.innerHTML = auditMini(e => e.ent === 'boat' && e.ref === slug, 'ยังไม่มีการแก้ไขเรือลำนี้'); }
  icons();
};
if (typeof boatSave === 'function') { const _boatSave18 = boatSave; boatSave = function (slug) { if (isRO()) return toast('โหมดดูอย่างเดียว'); _boatSave18(slug); const n = commitBoat(slug, 'กดบันทึก'); if (n) toast(`บันทึกแล้ว · เก็บ ${n} การเปลี่ยนแปลงใน Audit log`); }; }
if (typeof boatDel === 'function') { const _boatDel18 = boatDel; boatDel = function (slug, ...r) { const b = bySlug(slug); const nm = b?.name; _boatDel18(slug, ...r); if (!bySlug(slug)) { audit('delete', 'boat', slug, nm || slug); if (BSNAP?.slug === slug) BSNAP = null; } }; }
if (typeof boatCreate === 'function') { const _boatCreate18 = boatCreate; boatCreate = function (...a) { const n = FLEET.length; const r = _boatCreate18(...a); if (FLEET.length > n) { const b = FLEET[FLEET.length - 1]; audit('create', 'boat', b.slug, b.name || b.slug, [{ f: 'สถานะ', from: '—', to: 'ฉบับร่าง' }]); BSNAP = { slug: b.slug, data: snapBoat(b) }; } return r; }; }

/* ---------- seasons / team / settings / articles ---------- */
if (typeof szSave === 'function') { const _szSave18 = szSave; szSave = function () {
  if (isRO()) return toast('โหมดดูอย่างเดียว');
  const before = SZV.orig ? clone(calById(SZV.orig)) : null, after = clone(SZV.edit); _szSave18();
  const ch = before ? jdiff(before, after).map(c => { const m = c.f.match(/^ranges\.(\w+)\[(\d+)\]\[(\d)\]$/); return m ? { ...c, f: `${SKEY[m[1]]?.th || m[1]} ช่วงที่ ${+m[2] + 1} · ${m[3] === '0' ? 'เริ่ม' : 'สิ้นสุด'}` } : { ...c, f: c.f.startsWith('ranges') ? 'ช่วงวันที่' : c.f.startsWith('special') ? 'วันพิเศษ' : c.f === 'name' ? 'ชื่อปฏิทิน' : c.f }; }).map(c => typeof c.from === 'object' || typeof c.to === 'object' ? { ...c, from: c.from ? JSON.stringify(c.from) : '—', to: c.to ? JSON.stringify(c.to) : 'ลบแล้ว' } : c) : [{ f: 'ปฏิทิน', from: '—', to: after.name }];
  if (ch.length) audit(before ? 'update' : 'create', 'season', after.id, after.name, ch);
}; }
const _teamSave18 = teamSave;
teamSave = function () {
  if (!can('team')) return toast('ไม่มีสิทธิ์ · เฉพาะ Super Admin');
  const t = TE.cur, old = TE.isNew ? null : clone(TEAM.find(x => x.id === t.id)), wasNew = TE.isNew; _teamSave18();
  const now = TEAM.find(x => x.id === t.id); if (!now || (old && JSON.stringify(old) === JSON.stringify(now))) return;
  const pl = u => permsOf(u).map(k => PERMS.find(p => p[0] === k)?.[1].replace(/ \(.*\)/, '') || k).join(', ') || '—';
  const ch = [];
  if (!old) ch.push({ f: 'บทบาท', from: '—', to: ROLES[now.roleKey][0] }, { f: 'อีเมล', from: '—', to: now.email || '—' });
  else {
    if (old.roleKey !== now.roleKey) ch.push({ f: 'บทบาท', from: ROLES[old.roleKey][0], to: ROLES[now.roleKey][0] });
    if (pl(old) !== pl(now)) ch.push({ f: 'สิทธิ์', from: pl(old), to: pl(now) });
    if (old.active !== now.active) ch.push({ f: 'สถานะบัญชี', from: old.active ? 'ใช้งาน' : 'ปิด', to: now.active ? 'ใช้งาน' : 'ปิด' });
    [['name', 'ชื่อ'], ['tel', 'เบอร์โทร'], ['email', 'อีเมล']].forEach(([k, l]) => { if ((old[k] || '') !== (now[k] || '')) ch.push({ f: l, from: old[k] || '—', to: now[k] || '—' }); });
  }
  if (ch.length) audit(wasNew ? 'create' : ch.some(c => ['บทบาท', 'สิทธิ์', 'สถานะบัญชี'].includes(c.f)) ? 'role' : 'update', 'team', now.id, now.name, ch, { note: ch.some(c => ['บทบาท', 'สิทธิ์'].includes(c.f)) ? 'สิทธิ์ใหม่มีผลทันทีกับทุกเซสชันของผู้ใช้' : '' });
  if (now.id === ME.id) { ME = now; route(); }
};
const _teamDelete18 = teamDelete;
teamDelete = function () { if (!can('team')) return toast('ไม่มีสิทธิ์'); const id = TE.cur.id; _teamDelete18(); const t = TEAM.find(x => x.id === id); if (t?.deleted) audit('delete', 'team', id, t.name, [{ f: 'สถานะบัญชี', from: 'ใช้งาน', to: 'ลบ (ปิดการเข้าระบบ)' }], { note: 'เซสชันทั้งหมดของผู้ใช้ถูกยกเลิก' }); };
const _teamTransfer18 = teamTransfer;
teamTransfer = function () { const to = $('#teTo')?.value, id = TE.cur.id, ids = BOOKINGS.filter(b => b.sales === id && ['new', 'contacted', 'talking'].includes(b.status)).map(b => b.id); _teamTransfer18(); if (ids.length) audit('assign', 'team', id, TEAM.find(x => x.id === id)?.name, [{ f: 'โอนงานค้าง', from: `${ids.length} งาน`, to: teamOf(to)?.name || to }]); };
let CFGSNAP = null;
const _vSettings18 = vSettings;
vSettings = function () { if (!CFGSNAP) CFGSNAP = clone(SITECFG); _vSettings18(); };
PAGES.find(p => p[0] === 'settings')[3] = vSettings;
const CFG_F = { company: 'ชื่อบริษัท', phone: 'เบอร์โทร', email: 'อีเมล', address: 'ที่อยู่', logo: 'โลโก้', favicon: 'ไอคอนเว็บ', tat: 'เลขใบอนุญาต ททท.', line: 'LINE', wa: 'WhatsApp' };
const _cfgSave18 = cfgSave;
cfgSave = function () {
  if (!can('settings') || isRO()) return toast('ไม่มีสิทธิ์'); _cfgSave18();
  const now = clone(SITECFG), ch = jdiff(CFGSNAP || {}, now).map(c => { const k = c.f.split(/[.[]/)[0]; const img = /^data:/.test(String(c.from)) || /^data:/.test(String(c.to)); return { f: CFG_F[k] || c.f, from: img ? '(รูปเดิม)' : typeof c.from === 'object' ? '(เดิม)' : c.from || '—', to: img ? '(รูปใหม่)' : typeof c.to === 'object' ? '(ใหม่)' : c.to || '—' }; });
  if (ch.length) audit('update', 'settings', 'site', 'ตั้งค่าเว็บไซต์', ch); CFGSNAP = now;
};
if (typeof artPublish === 'function') { const _artPublish18 = artPublish; artPublish = function (id) { const a = artById(id), st = a?.status; _artPublish18(id); if (a && a.status !== st) audit('publish', 'article', a.id, a.title?.th || a.title?.en || 'บทความ', [{ f: 'สถานะ', from: st || '—', to: a.status }]); }; }

/* ---------- audit page ---------- */
const AV = { g: 'all', u: '', q: '', days: 30, shown: 40 };
const userName = id => id === '—' ? 'ไม่ระบุตัวตน' : TEAM.find(t => t.id === id)?.name || id;
const fmtTs = s => new Date(s).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const relTs = s => { const m = Math.round((Date.now() - new Date(s)) / 60000); return m < 1 ? 'เมื่อสักครู่' : m < 60 ? `${m} นาทีที่แล้ว` : m < 1440 ? `${Math.round(m / 60)} ชม.ที่แล้ว` : `${Math.round(m / 1440)} วันที่แล้ว`; };
const maskV = (c, v) => esc(String(v ?? ''));
const actPill = e => `<span class="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] whitespace-nowrap" style="color:${ACT[e.act][2]};background:${ACT[e.act][2]}14"><i data-lucide="${ACT[e.act][1]}" class="w-3 h-3"></i>${ACT[e.act][0]}</span>`;
const chHtml = (e, max = 99) => e.changes.slice(0, max).map(c => `<p class="text-[12px] leading-snug"><span class="text-muted">${esc(c.f)}${c.sens ? ' <i data-lucide="lock" class="w-3 h-3 inline -mt-0.5"></i>' : ''}:</span> <span class="line-through decoration-[#c9a3a7] text-muted">${maskV(c, c.from)}</span> <i data-lucide="arrow-right" class="w-3 h-3 inline -mt-0.5 text-muted"></i> <span class="${c.kind === 'price' || c.sens ? 'text-maroon font-medium' : ''}">${maskV(c, c.to)}</span></p>`).join('') + (e.changes.length > max ? `<p class="text-[11px] text-muted">+ อีก ${e.changes.length - max} รายการ</p>` : '');
function audList() {
  const q = AV.q.toLowerCase(), from = Date.now() - AV.days * 864e5;
  return AUDIT.filter(e => AUD_GROUP[AV.g][1](e) && (!AV.u || e.uid === AV.u) && (!AV.days || new Date(e.ts) >= from) && (!q || (e.label + ' ' + userName(e.uid) + ' ' + e.ref + ' ' + e.changes.map(c => c.f + ' ' + (c.sens && !can('cost') ? '' : c.from + ' ' + c.to)).join(' ')).toLowerCase().includes(q))).slice().reverse();
}
function auditMini(pred, empty) {
  const L = AUDIT.filter(pred).slice().reverse();
  return L.length ? `<ol class="space-y-3">${L.map(e => `<li class="flex gap-3"><img src="${TEAM_IMG[e.uid] || initialsAva('?')}" class="w-8 h-8 rounded-full object-cover shrink-0"/><div class="min-w-0 flex-1"><p class="text-[13px]"><b class="font-medium">${userName(e.uid)}</b> ${actPill(e)} <span class="text-muted text-[12px]">${fmtTs(e.ts)}${e.sample ? ' · ตัวอย่าง' : ''}</span></p><div class="mt-1">${chHtml(e)}</div>${e.note ? `<p class="text-[11px] text-muted mt-1">หมายเหตุ: ${esc(e.note)}</p>` : ''}</div></li>`).join('')}</ol>` : `<p class="text-muted text-center py-10">${empty}</p>`;
}
function vAudit() {
  const L = audList(), wk = Date.now() - 7 * 864e5, W = AUDIT.filter(e => new Date(e.ts) >= wk);
  const kpi = [['แก้ราคาเรือ (7 วัน)', W.filter(AUD_GROUP.price[1]).length, 'tag'], ['เข้าระบบไม่สำเร็จ (7 วัน)', W.filter(e => e.act === 'login_fail').length, 'shield-alert'], ['ถูกปฏิเสธสิทธิ์ (7 วัน)', W.filter(e => e.act === 'denied').length, 'ban'], ['ผู้ใช้ที่ active (7 วัน)', new Set(W.filter(e => e.act === 'login').map(e => e.uid)).size, 'users']];
  const users = [...new Set(AUDIT.map(e => e.uid))];
  $('#view').innerHTML = `${head('บันทึกกิจกรรม', 'ใคร แก้อะไร เมื่อไร · บันทึกแบบเพิ่มอย่างเดียว แก้ไขหรือลบไม่ได้ แม้แต่ Admin · เก็บ 2 ปี', `<button class="btn btn-o" onclick="audVerify()"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i>ตรวจความถูกต้อง</button>${can('export') ? `<button class="btn btn-o" onclick="audCsv()"><i data-lucide="download" class="w-3.5 h-3.5"></i>Export CSV</button>` : ''}`)}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">${kpi.map(([l, n, i]) => `<div class="card p-4"><p class="text-[11px] text-muted flex items-center gap-1.5"><i data-lucide="${i}" class="w-3.5 h-3.5"></i>${l}</p><p class="text-2xl mt-1 tnum">${n}</p></div>`).join('')}</div>
    <div class="card">
      <div class="p-3 flex flex-col lg:flex-row gap-2 lg:items-center border-b border-line">
        <div class="flex gap-1 overflow-x-auto no-sb">${Object.entries(AUD_GROUP).map(([k, [l, f]]) => `<button class="tab ${AV.g === k ? 'on' : ''}" onclick="AV.g='${k}';AV.shown=40;vAudit()">${l} <span class="opacity-60 tnum">${AUDIT.filter(f).length}</span></button>`).join('')}</div>
        <div class="lg:ml-auto grid grid-cols-2 sm:flex gap-2">
          <input class="inp flt col-span-2 sm:!w-52" placeholder="ค้นหา เรือ เลขจอง ฟิลด์…" value="${esc(AV.q)}" oninput="AV.q=this.value;clearTimeout(window._aq);window._aq=setTimeout(()=>{vAudit();const i=$('#view input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"/>
          <select class="inp flt sm:!w-36" onchange="AV.u=this.value;vAudit()"><option value="">ทุกคน</option>${users.map(u => `<option value="${u}" ${AV.u === u ? 'selected' : ''}>${userName(u)}</option>`).join('')}</select>
          <select class="inp flt sm:!w-32" onchange="AV.days=+this.value;vAudit()">${[[1, 'วันนี้'], [7, '7 วัน'], [30, '30 วัน'], [0, 'ทั้งหมด']].map(([d, l]) => `<option value="${d}" ${AV.days === d ? 'selected' : ''}>${l}</option>`).join('')}</select>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>เวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>รายการ</th><th class="min-w-[280px]">เปลี่ยนแปลง (ก่อน → หลัง)</th></tr></thead><tbody>
        ${L.slice(0, AV.shown).map(e => `<tr class="click" onclick="audDetail(${e.id})"><td class="whitespace-nowrap"><p>${relTs(e.ts)}</p><p class="text-[11px] text-muted">${fmtTs(e.ts)}</p></td>
          <td><div class="flex items-center gap-2 whitespace-nowrap"><img src="${TEAM_IMG[e.uid] || initialsAva('?')}" class="w-6 h-6 rounded-full object-cover"/><div><p>${userName(e.uid)}</p><p class="text-[11px] text-muted">${e.role ? ROLES[e.role]?.[0] : e.ip}</p></div></div></td>
          <td>${actPill(e)}</td>
          <td><p class="text-[11px] text-muted">${ENT[e.ent] || e.ent}${e.sample ? ' · <span class="text-[#8a5a00]">ตัวอย่าง</span>' : ''}</p><p class="truncate max-w-[220px]">${esc(e.label)}</p></td>
          <td>${e.changes.length ? chHtml(e, 2) : `<span class="text-muted text-[12px]">${esc(e.note || '—')}</span>`}</td></tr>`).join('') || `<tr><td colspan="5" class="text-center text-muted py-12">ไม่พบรายการ</td></tr>`}
      </tbody></table></div>
      ${L.length > AV.shown ? `<button class="w-full py-3 border-t border-line text-[12px] text-maroon" onclick="AV.shown+=40;vAudit()">แสดงเพิ่ม (${L.length - AV.shown})</button>` : ''}
    </div>
    <p class="text-[11px] text-muted mt-3">รายการที่มีป้าย “ตัวอย่าง” เป็นข้อมูลจำลองเพื่อแสดงหน้าตา · รายการอื่นเกิดจากการใช้งานจริงในเซสชันนี้</p>`;
  icons();
}
function audDetail(id) {
  const e = AUDIT.find(x => x.id === id);
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div><p class="text-[11px] text-muted">บันทึก #${e.id}${e.sample ? ' · ตัวอย่าง' : ''}</p><p class="font-medium">${ACT[e.act][0]} · ${ENT[e.ent] || e.ent}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()" aria-label="Close"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <div class="flex items-center gap-3"><img src="${TEAM_IMG[e.uid] || initialsAva('?')}" class="w-10 h-10 rounded-full object-cover"/><div><p class="font-medium">${userName(e.uid)} <span class="text-muted font-normal">${e.role ? '· ' + ROLES[e.role]?.[0] : ''}</span></p><p class="text-[12px] text-muted">${new Date(e.ts).toLocaleString('th-TH', { dateStyle: 'full', timeStyle: 'medium' })}</p></div></div>
      <div><p class="lbl">รายการ</p><p>${esc(e.label)}</p>${e.ent === 'boat' && bySlug(e.ref) ? `<a class="text-maroon text-[12px]" href="#/boats/${e.ref}">เปิดหน้าเรือ →</a>` : ''}${e.ent === 'booking' && BOOKINGS.find(b => b.id === e.ref) ? `<a class="text-maroon text-[12px]" href="javascript:void 0" onclick="bookingDetail('${e.ref}')">เปิดการจอง →</a>` : ''}</div>
      ${e.changes.length ? `<div><p class="lbl">การเปลี่ยนแปลง</p><div class="rounded-xl ring-1 ring-line overflow-hidden"><table class="tbl"><thead><tr><th>ฟิลด์</th><th>ก่อน</th><th>หลัง</th></tr></thead><tbody>${e.changes.map(c => `<tr><td class="text-muted">${esc(c.f)}${c.sens ? ' <i data-lucide="lock" class="w-3 h-3 inline -mt-0.5"></i>' : ''}</td><td class="line-through decoration-[#c9a3a7] text-muted">${maskV(c, c.from)}</td><td class="${c.kind === 'price' || c.sens ? 'text-maroon font-medium' : ''}">${maskV(c, c.to)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      ${e.note ? `<div class="p-3 rounded-xl bg-sand text-[12.5px]">${esc(e.note)}</div>` : ''}
      <dl class="grid grid-cols-2 gap-3 text-[12px]"><div><dt class="lbl">IP</dt><dd class="tnum">${e.ip}${e.sample ? '' : ' (จำลอง)'}</dd></div><div><dt class="lbl">อุปกรณ์</dt><dd>${esc(e.dev)}</dd></div><div><dt class="lbl">Hash</dt><dd class="font-mono">${e.hash}</dd></div><div><dt class="lbl">Hash ก่อนหน้า</dt><dd class="font-mono">${e.prev}</dd></div></dl>
      <p class="text-[11px] text-muted flex gap-1.5"><i data-lucide="lock" class="w-3.5 h-3.5 shrink-0"></i>บันทึกนี้แก้ไขหรือลบไม่ได้ · แต่ละรายการผูก hash กับรายการก่อนหน้า ถ้ามีใครแก้ฐานข้อมูลโดยตรง การตรวจความถูกต้องจะเจอทันที</p>
    </div>`);
}
function audVerify() { let p = '00000000', bad = 0; AUDIT.forEach(e => { const { hash, ...r } = e; if (r.prev !== p || fnv(JSON.stringify(r)) !== hash) bad++; p = hash; }); toast(bad ? `พบ ${bad} รายการที่ไม่ตรง hash` : `ตรวจแล้ว ${AUDIT.length} รายการ · ไม่มีการแก้ไขย้อนหลัง`); }
function audCsv() {
  const rows = [['id', 'time', 'user', 'role', 'action', 'entity', 'ref', 'label', 'field', 'from', 'to', 'ip', 'device', 'hash'], ...audList().flatMap(e => (e.changes.length ? e.changes : [{ f: '', from: '', to: '' }]).map(c => [e.id, e.ts, userName(e.uid), e.role, e.act, e.ent, e.ref, e.label, c.f, c.sens && !can('cost') ? '***' : c.from, c.sens && !can('cost') ? '***' : c.to, e.ip, e.dev, e.hash]))];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' })); a.download = 'btt-audit-log.csv'; a.click();
  audit('export', 'auth', 'audit', `Export Audit log ${rows.length - 1} แถว`); toast('ดาวน์โหลดแล้ว');
}
PAGES.splice(PAGES.findIndex(p => p[0] === 'team') + 1, 0, ['audit', 'บันทึกกิจกรรม', 'history', vAudit]);

/* ---------- team page: role matrix + enforcement notes ---------- */
const _vTeam18 = vTeam;
vTeam = function () {
  _vTeam18();
  const lastLogin = id => { const e = [...AUDIT].reverse().find(x => x.uid === id && x.act === 'login'); return e ? relTs(e.ts) : 'ยังไม่เคย'; };
  $('#view').insertAdjacentHTML('beforeend', `<div class="grid xl:grid-cols-[1fr_380px] gap-5 mt-6">
    <div class="card overflow-hidden"><div class="p-4 border-b border-line flex items-center justify-between gap-3"><div><p class="font-medium">สิทธิ์ตามบทบาท</p><p class="text-[12px] text-muted">บังคับใช้ทุกหน้า ทุกปุ่ม และทุก API · ปรับรายคนได้ในหน้าแก้ไขสมาชิก</p></div></div>
      <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>สิทธิ์</th>${Object.entries(ROLES).map(([k, [l]]) => `<th class="text-center">${l}</th>`).join('')}</tr></thead><tbody>
        ${PERMS.map(([k, l]) => `<tr><td>${l}</td>${Object.keys(ROLES).map(r => `<td class="text-center">${ROLE_PERMS[r].includes(k) ? '<i data-lucide="check" class="w-4 h-4 inline text-[#1e7a46]"></i>' : '<span class="text-[#d6cccc]">—</span>'}</td>`).join('')}</tr>`).join('')}
        <tr><td>ยืนยัน 2 ขั้นตอน (2FA)</td>${Object.keys(ROLES).map(r => `<td class="text-center text-[11px] ${r !== 'sales' ? 'text-maroon' : 'text-muted'}">${r !== 'sales' ? 'บังคับ' : 'ไม่บังคับ'}</td>`).join('')}</tr>
      </tbody></table></div></div>
    <div class="space-y-5">
      <div class="card p-4"><p class="font-medium mb-3">เข้าระบบล่าสุด</p><div class="space-y-2.5">${TEAM.filter(t => !t.deleted).map(t => `<div class="flex items-center gap-2.5"><img src="${TEAM_IMG[t.id]}" class="w-7 h-7 rounded-full object-cover"/><div class="min-w-0 flex-1"><p class="text-[13px] leading-tight">${t.name} <span class="text-muted text-[11px]">· ${ROLES[t.roleKey][0]}</span></p><p class="text-[11px] text-muted">${t.id === ME?.id ? 'ออนไลน์อยู่ · ' + DEVICE : lastLogin(t.id)}</p></div>${t.active ? '' : '<span class="pill bg-sand text-muted">ปิด</span>'}</div>`).join('')}</div>
        ${can('audit') ? '<a href="#/audit" class="btn btn-o w-full mt-4">ดูบันทึกกิจกรรมทั้งหมด</a>' : ''}</div>
      <div class="card p-4 text-[12px] space-y-2"><p class="font-medium text-[13px]">ระบบจริงบังคับใช้ที่เซิร์ฟเวอร์</p>${['ทุก API ตรวจ session + สิทธิ์ก่อนอ่าน/เขียน · ไม่พึ่งการซ่อนปุ่มในหน้าจอ', 'Sales: query ลีดกรอง <code>sales_id = ผู้ใช้</code> ที่ฐานข้อมูล', 'เบอร์และอีเมลลูกค้าเห็นเฉพาะเซลล์เจ้าของลีดและ Admin', 'บันทึก audit ใน transaction เดียวกับการแก้ไข · ตาราง append-only', 'เปลี่ยนสิทธิ์หรือปิดบัญชี = ยกเลิกเซสชันเดิมทันที'].map(x => `<p class="flex gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-[#1e7a46] shrink-0 mt-0.5"></i><span>${x}</span></p>`).join('')}</div>
    </div></div>`);
  icons();
};
PAGES.find(p => p[0] === 'team')[3] = vTeam;

/* ---------- router guard ---------- */
const _route18 = route;
route = function () {
  if (!ME) return showLogin();
  const h = location.hash.replace(/^#\/?/, '') || 'dashboard', [p, arg] = h.split('/'), known = PAGES.find(x => x[0] === p);
  if (!(p === 'boats' && arg)) flushBoat();
  if (!known && !canPage('dashboard')) history.replaceState(null, '', '#/' + firstPage());
  document.body.classList.toggle('ro', isRO());
  if (known && !canPage(p)) {
    audit('denied', 'auth', p, `พยายามเปิดหน้า "${known[1]}"`);
    const f = known[3], fb = vBoatEdit; known[3] = v403; vBoatEdit = v403;
    try { _route18(); } finally { known[3] = f; vBoatEdit = fb; }
  } else _route18();
  $$('#nav a.nav-i').forEach(a => { if (!canPage(a.getAttribute('href').replace('#/', ''))) a.remove(); });
  $$('#nav > p').forEach(x => { if (!x.nextElementSibling || x.nextElementSibling.tagName === 'P') x.remove(); });
  { const bd = $('#nav a[href="#/bookings"] span'); if (bd && !can('bookings_all')) { const n = BOOKINGS.filter(b => ownB(b) && b.status === 'new').length; n ? bd.textContent = n : bd.remove(); } }
  $('#roBar')?.remove(); if (isRO()) $('#view').insertAdjacentHTML('afterbegin', '<div id="roBar" class="mb-4 rounded-xl bg-sand px-4 py-2.5 text-[12px] text-muted flex items-center gap-2"><i data-lucide="eye" class="w-4 h-4"></i>โหมดดูอย่างเดียว · บทบาท Viewer แก้ไขข้อมูลไม่ได้</div>');
  paintMe(); icons();
};
rerender = function () { route(); };

/* read-only styling */
(function () { const s = document.createElement('style'); s.textContent = `body.ro #view :is(input,select,textarea,.edit-cell):not(.flt), body.ro #drawer :is(input,select,textarea){pointer-events:none;background:#f7f4f2!important;color:#6b5e60}
  body.ro #view .btn-p, body.ro #drawer .btn-p, body.ro #view .tgl, body.ro #view [onclick*="Del"], body.ro #view [onclick*="remove"], body.ro #view [contenteditable]{pointer-events:none;opacity:.45}
  body.ro #view [contenteditable]{opacity:1}`; document.head.appendChild(s); })();

/* restore session (same tab) or show login */
(function () { const s = sGet(), u = s && TEAM.find(t => t.id === s.uid && t.active && !t.deleted); if (u && Date.now() - s.t < 12 * 3600e3) finishLogin(u, '', s); else showLogin(); })();
