/* =====================================================================
   SERVER BRIDGE — the approved admin design, wired to the real system.
   Every change goes to /api/admin/* (session + permission + audit on the
   server). The page only keeps what the server sent back.
   ===================================================================== */
let AUDIT_DIRTY = false, DRAWER_LEAD = null;
async function api(method, path, body) {
  const r = await fetch('/api/admin/' + path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch (e) { }
  if (r.status === 401) { location.href = '/admin/login?next=' + encodeURIComponent(location.hash || ''); throw new Error('login'); }
  if (!r.ok) { const e = new Error(j.error || 'บันทึกไม่สำเร็จ กรุณาลองใหม่'); e.status = r.status; throw e; }
  return j;
}
function toastErr(m) { toast(m); const t = $('#toast > div'); t.classList.add('!bg-[#b42318]'); clearTimeout(toastErr.t); toastErr.t = setTimeout(() => t.classList.remove('!bg-[#b42318]'), 2600); }
const fail = e => { if (e && e.message !== 'login') toastErr(e.message || 'บันทึกไม่สำเร็จ'); };

/* audit entries are written by the server; the browser only reports what only it can see */
audit = function (act, ent, ref, label, changes = []) {
  AUDIT_DIRTY = true;
  if (act === 'export' || act === 'denied') api('POST', 'audit/client', { act, ent, ref: String(ref ?? ''), label, changes: (changes || []).map(c => ({ f: c.f, from: c.from, to: c.to })) }).catch(() => { });
  return null;
};
Object.assign(ACT, { mfa: ['ยืนยัน 2FA', 'shield-check', '#1e7a46'] });
const actPillSafe = e => { if (!ACT[e.act]) ACT[e.act] = [e.act, 'dot', '#6b5e60']; };
AUDIT.forEach(actPillSafe);

/* ---------- leads ---------- */
function syncLead(r) {
  if (!r || !r.lead) return;
  const i = BOOKINGS.findIndex(x => x.dbId === r.lead.dbId);
  if (i >= 0) BOOKINGS[i] = r.lead; else BOOKINGS.unshift(r.lead);
  if (r.customer) { const j = CUSTOMERS.findIndex(c => c.id === r.customer.id); if (j >= 0) CUSTOMERS[j] = r.customer; else CUSTOMERS.push(r.customer); }
  AUDIT_DIRTY = true;
  const open = $('#drawer').classList.contains('open') && DRAWER_LEAD === r.lead.id, sc = $('#drawer .overflow-y-auto')?.scrollTop || 0;
  rerender();
  if (open) { bookingDetail(r.lead.id); const d = $('#drawer .overflow-y-auto'); if (d) d.scrollTop = sc; }
}
function leadApi(id, op, body, msg) {
  return api('POST', `leads/${encodeURIComponent(id)}/${op}`, body)
    .then(r => { syncLead(r); if (msg) toast(msg); return r; })
    .catch(e => { fail(e); rerender(); if (DRAWER_LEAD === id && $('#drawer').classList.contains('open')) bookingDetail(id); });
}
const _bookingDetail20 = bookingDetail;
bookingDetail = function (id) {
  DRAWER_LEAD = id; _bookingDetail20(id);
  const l = BOOKINGS.find(x => x.id === id), c = l && custOf(l.cust), d = $('#drawer');
  if (!l || !c || !d.classList.contains('open')) return;
  const tpl = d.querySelector('#tplOut'); if (tpl) tpl.removeAttribute('onchange');
  const note = [...d.querySelectorAll('textarea')].find(x => !x.readOnly); if (note) note.setAttribute('onchange', `bkNote('${l.id}',this.value)`);
  // PDPA consent: sales can record a verbal / chat consent (or a withdrawal)
  const dd = [...d.querySelectorAll('dt.lbl')].find(x => x.textContent.startsWith('รับข่าวสาร'))?.nextElementSibling;
  if (dd) dd.insertAdjacentHTML('beforeend', ` <button class="text-[11px] text-maroon underline underline-offset-2 ml-1" onclick="leadApi('${l.id}','consent',{on:${!c.consent}},'${c.consent ? 'บันทึกการถอนความยินยอมแล้ว' : 'บันทึกความยินยอมแล้ว'}')">${c.consent ? 'ลูกค้าขอถอน' : 'ลูกค้ายินยอมแล้ว'}</button>`);
  if (l.message) { const t = [...d.querySelectorAll('p.lbl')].find(x => x.textContent === 'สิ่งที่สนใจ'); t?.parentElement.insertAdjacentHTML('beforeend', `<p class="text-[11px] text-muted mt-3 mb-1">ข้อความจากลูกค้า</p><p class="rounded-xl ring-1 ring-line p-3 text-[12.5px] whitespace-pre-line">${esc(l.message)}</p>`); }
  icons();
};
const _closeDrawer20 = closeDrawer;
closeDrawer = function () { DRAWER_LEAD = null; _closeDrawer20(); };

setStatus = function (id, s) {
  const l = BOOKINGS.find(x => x.id === id); if (!l || !STATUS[s] || l.status === s) return;
  if (!can('bookings_all') && !ownB(l)) return toast('ไม่มีสิทธิ์แก้ลีดนี้');
  if (s === 'lost' && !l.lost) { rerender(); return leadAskLost(id); }
  leadApi(id, 'status', { status: s, next: OPEN_ST.includes(s) && !l.next ? iso(addDays(TODAY, 2)) : '' },
    s === 'won' ? 'ปิดการขายแล้ว · ส่งผลกลับไปโฆษณาให้อัตโนมัติ (ถ้าเชื่อมต่อแล้ว)' : `เปลี่ยนสถานะเป็น "${STATUS[s][0]}" แล้ว`);
};
leadSet = function (id, k, v) {
  if (k === 'next') return leadApi(id, 'followup', { date: v }, v ? 'บันทึกนัดติดตามแล้ว' : 'ล้างนัดติดตามแล้ว');
  if (k === 'lost') return leadApi(id, 'lost', { lost: v }, v ? 'บันทึกเหตุผลแล้ว' : 'ล้างเหตุผลแล้ว');
};
leadContact = function (id, via) {
  const l = BOOKINGS.find(x => x.id === id), c = custOf(l.cust), msg = encodeURIComponent(tplText(l.status === 'new' ? 'first' : 'follow', l)), ph = String(c.phone).replace(/[^\d]/g, '');
  const url = { WhatsApp: `https://wa.me/${ph}?text=${msg}`, LINE: `https://line.me/R/msg/text/?${msg}`, 'โทร': `tel:+${ph}`, 'อีเมล': c.email ? `mailto:${c.email}?subject=Boat%20Trip%20Thailand&body=${msg}` : '' }[via];
  if (url) window.open(url, '_blank', 'noopener');
  leadApi(id, 'contact', { via }, l.status === 'new' ? `บันทึกการติดต่อแล้ว · ตอบกลับใน ${ago(leadAgeMin(l))}` : 'บันทึกการติดต่อแล้ว');
};
bkAssign = function (id, v) { if (!can('bookings_all')) return toast('ไม่มีสิทธิ์'); leadApi(id, 'assign', { to: v }, 'มอบหมายเซลล์แล้ว'); };
bkNote = function (id, v) { leadApi(id, 'note', { note: v }, 'บันทึกแล้ว'); };
saveNew = function () {
  const phone = $('#nbPhone').value.trim();
  const body = { name: $('#nbName').value.trim(), phone, email: $('#nbEmail').value.trim(), src: $('#nbSrc').value, contact: $('#nbCh').value, boat: $('#nbBoat').value, date: $('#nbDate').value, guests: +$('#nbG').value || 1, sales: $('#nbS').value, consent: $('#nbConsent').checked, note: $('#nbNote').value, lang: /^(\+?66|0)/.test(phone) ? 'th' : 'en' };
  const btn = $('#nbF button.btn-p'); if (btn) btn.disabled = true;
  api('POST', 'leads', body).then(r => {
    closeModal(); syncLead(r);
    toast(r.duplicate ? `ลูกค้ารายนี้มีลีดเปิดอยู่แล้ว (${r.lead.id}) · บันทึกเป็นการส่งซ้ำ` : 'บันทึกลีด ' + r.lead.id + ' แล้ว');
    BK.tab = 'open'; go('bookings'); if (CUR === 'bookings') vBookings();
  }).catch(e => { if (btn) btn.disabled = false; fail(e); });
};
exportCsv = function () {
  if (!can('export')) return toast('ไม่มีสิทธิ์ Export');
  const p = new URLSearchParams(); if (BK.tab === 'open') p.set('tab', 'open'); else if (STATUS[BK.tab]) p.set('tab', BK.tab.toUpperCase());
  if (BK.sales && can('bookings_all')) p.set('sales', BK.sales); if (BK.src) p.set('source', BK.src);
  location.href = '/admin/leads/export?' + p; AUDIT_DIRTY = true; toast('กำลังดาวน์โหลด · บันทึกใน Audit log');
};
function exportGads() { if (!can('export')) return toast('ไม่มีสิทธิ์ Export'); location.href = '/admin/leads/export?format=gads'; AUDIT_DIRTY = true; }

/* new leads arrive while the page is open */
let _poll = 0;
async function pollLeads() {
  if (document.hidden || !can('bookings') || $('#modal').classList.contains('flex')) return;
  try {
    const r = await api('GET', 'leads'), known = new Set(BOOKINGS.map(l => l.dbId)), fresh = r.leads.filter(l => !known.has(l.dbId));
    const before = JSON.stringify(BOOKINGS);
    BOOKINGS.length = 0; BOOKINGS.push(...r.leads); CUSTOMERS.length = 0; CUSTOMERS.push(...r.customers);
    if (JSON.stringify(BOOKINGS) === before) return;
    const sc = $('#drawer .overflow-y-auto')?.scrollTop || 0, focused = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && $('#view').contains(document.activeElement);
    if (!focused && ['dashboard', 'bookings', 'calendar', 'customers'].includes(CUR)) rerender(); else paintBell();
    if (DRAWER_LEAD && $('#drawer').classList.contains('open') && !$('#drawer').contains(document.activeElement)) { bookingDetail(DRAWER_LEAD); const d = $('#drawer .overflow-y-auto'); if (d) d.scrollTop = sc; }
    if (fresh.length) toast(`มีลีดใหม่ ${fresh.length} รายการ`);
  } catch (e) { }
}
function paintBell() {
  const n = BOOKINGS.filter(l => l.status === 'new' && (can('bookings_all') || ownB(l))).length, b = $('header button[aria-label="Notifications"]');
  if (!b) return; b.setAttribute('onclick', "BK.tab='new';go('bookings');if(CUR==='bookings')vBookings()"); b.title = n ? `ลีดใหม่รอติดต่อ ${n} รายการ` : 'ไม่มีลีดใหม่';
  b.querySelector('span')?.classList.toggle('hidden', !n);
}

/* ---------- team ---------- */
function upsertTeam(r) {
  const u = r.user, i = TEAM.findIndex(t => t.id === u.id);
  if (i >= 0) Object.assign(TEAM[i], u); else TEAM.push(u);
  TEAM_IMG[u.id] = r.img || initialsAva(u.name); BOOT.names[u.id] = u.name;
  if (u.id === ME.id) { Object.assign(ME, { ...u, perms: ME.perms }); paintMe(); }
}
function showTempPw(u, pw, isNew) {
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">${isNew ? 'สร้างบัญชี ' + esc(u.name) + ' แล้ว' : 'ตั้งรหัสผ่านชั่วคราวให้ ' + esc(u.name)}</p><p class="text-[12px] text-muted mt-1">รหัสนี้แสดงครั้งเดียว · ส่งให้เจ้าตัวทางช่องทางส่วนตัว แล้วให้เปลี่ยนรหัสที่เมนูโปรไฟล์หลังเข้าระบบ${['super', 'admin'].includes(u.roleKey) ? ' · บทบาทนี้ต้องตั้ง 2FA ตอนเข้าระบบครั้งแรก' : ''}</p></div>
    <div class="p-5 grid gap-3"><div class="rounded-xl bg-sand p-3 text-[12.5px] grid gap-1"><p class="flex justify-between gap-3"><span class="text-muted">อีเมล</span><span class="break-all">${esc(u.email)}</span></p><p class="flex justify-between gap-3"><span class="text-muted">รหัสผ่านชั่วคราว</span><span id="tmpPw" class="font-mono text-[14px] select-all">${esc(pw)}</span></p><p class="flex justify-between gap-3"><span class="text-muted">เข้าระบบที่</span><span>${location.origin}/admin</span></p></div>
    <button class="btn btn-p" onclick="navigator.clipboard?.writeText('อีเมล: ${esc(u.email)}\\nรหัสผ่านชั่วคราว: ${esc(pw)}\\nเข้าระบบ: ${location.origin}/admin').then(()=>toast('คัดลอกแล้ว'))"><i data-lucide="copy" class="w-3.5 h-3.5"></i>คัดลอกข้อมูลเข้าระบบ</button></div>
    <div class="p-4 border-t border-line flex justify-end"><button class="btn btn-o" onclick="closeModal()">ปิด</button></div>`);
}
teamSave = function () {
  if (!can('team')) return toast('ไม่มีสิทธิ์ · เฉพาะ Super Admin');
  const t = TE.cur, isNew = TE.isNew;
  if (!t.name.trim()) return toast('ใส่ชื่อเล่นก่อน');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t.email || '')) return toast('ใส่อีเมลที่ใช้เข้าสู่ระบบ');
  api(isNew ? 'POST' : 'PUT', isNew ? 'users' : 'users/' + t.id, { t, ava: TE.ava && !TE.ava.startsWith('data:image/svg') ? TE.ava : '' }).then(r => {
    upsertTeam(r); AUDIT_DIRTY = true; closeDrawer(); vTeam();
    if (r.tempPassword) showTempPw(r.user, r.tempPassword, isNew); else toast(r.relogin ? 'บันทึกแล้ว · สิทธิ์ของคุณเปลี่ยน กรุณาเข้าระบบใหม่' : 'บันทึกแล้ว');
    if (r.relogin) setTimeout(() => { location.href = '/admin/login'; }, 1500);
  }).catch(fail);
};
teamDelete = function () {
  if (!can('team')) return toast('ไม่มีสิทธิ์');
  const id = TE.cur.id;
  api('POST', `users/${id}/deactivate`).then(r => { upsertTeam(r); AUDIT_DIRTY = true; closeDrawer(); vTeam(); toast(`ปิดบัญชี ${r.user.name} แล้ว · เข้าระบบไม่ได้ ประวัติงานยังเก็บไว้`); }).catch(fail);
};
teamTransfer = function () {
  const to = $('#teTo')?.value, id = TE.cur.id; if (!to) return;
  api('POST', `users/${id}/transfer`, { to }).then(r => { const m = new Set(r.moved); BOOKINGS.forEach(l => { if (m.has(l.dbId)) l.sales = to; }); AUDIT_DIRTY = true; toast(`โอน ${r.moved.length} งานให้ ${teamOf(to)?.name || ''} แล้ว`); teamDraw(); }).catch(fail);
};
function teamReset(id) {
  const reset2fa = !!$('#teR2')?.checked;
  api('POST', `users/${id}/reset`, { reset2fa }).then(r => { closeDrawer(); AUDIT_DIRTY = true; showTempPw(r.user, r.tempPassword, false); }).catch(fail);
}
const _teamDraw20 = teamDraw;
teamDraw = function (open) {
  _teamDraw20(open);
  const d = $('#drawer'), t = TE.cur;
  d.querySelector('button.btn-p')?.replaceChildren(document.createTextNode(TE.isNew ? 'สร้างบัญชี' : 'บันทึก'));
  [...d.querySelectorAll('.tgl input')].find(x => /online/.test(x.getAttribute('onchange') || ''))?.closest('label')?.remove();
  const del = [...d.querySelectorAll('p.text-\\[12px\\].font-medium')].find(p => p.textContent === 'ลบสมาชิก');
  if (del) { del.textContent = 'ปิดบัญชี'; const b = del.parentElement.querySelector('button[onclick="teamDelete()"]'); if (b) b.lastChild.textContent = 'ปิดบัญชี (เข้าระบบไม่ได้)'; }
  if (!TE.isNew && can('team')) {
    const box = d.querySelector('.flex-1.overflow-y-auto');
    box?.insertAdjacentHTML('beforeend', `<div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium">ความปลอดภัยของบัญชี</p>
      <p class="text-[11.5px] text-muted mt-1">${t.totp ? '2FA เปิดอยู่' : ['super', 'admin'].includes(t.roleKey) ? '2FA ยังไม่ได้ตั้ง (ต้องตั้งตอนเข้าระบบครั้งถัดไป)' : 'ไม่บังคับ 2FA สำหรับ Sales'} · LINE ${t.lineLinked ? 'เชื่อมแล้ว' : 'ยังไม่เชื่อม'}${t.lastLoginAt ? ' · เข้าระบบล่าสุด ' + relTs(t.lastLoginAt) : ' · ยังไม่เคยเข้าระบบ'}</p>
      <div class="flex flex-wrap items-center gap-3 mt-3"><button class="btn btn-o !h-8" onclick="teamReset('${t.id}')"><i data-lucide="key-round" class="w-3.5 h-3.5"></i>ตั้งรหัสผ่านชั่วคราว</button>${t.totp ? `<label class="flex items-center gap-2 text-[12px]"><input id="teR2" type="checkbox" class="accent-[#70000e] w-4 h-4"/>ให้ตั้ง 2FA ใหม่ด้วย (มือถือหาย)</label>` : ''}</div>
      <p class="text-[11px] text-muted mt-2">ตั้งรหัสใหม่ = ออกจากระบบทุกอุปกรณ์ของผู้ใช้นี้ทันที</p></div>`);
    icons();
  }
};

{ const _vt = vTeam; vTeam = function () {
  _vt(); const v = $('#view');
  v.querySelectorAll('.tgl input[onchange*="online"]').forEach(i => i.closest('label')?.remove());
  const sub = v.querySelector('h2 + p'); if (sub) sub.textContent = 'ลีดใหม่กระจายให้อัตโนมัติ · เปิด/ปิดการรับลีด บทบาท และสิทธิ์ ได้ที่ปุ่ม แก้ไข';
  const card = [...v.querySelectorAll('.card')].find(c => c.querySelector('p.font-medium')?.textContent === 'การกระจายคำขอ');
  if (card) card.innerHTML = `<p class="font-medium">การกระจายลีดใหม่</p><ul class="mt-3 space-y-2 text-[12.5px]">
    <li class="flex gap-2"><i data-lucide="repeat" class="w-4 h-4 text-maroon shrink-0 mt-0.5"></i>วนตามลำดับ (round-robin) เฉพาะคนที่เปิด “รับคำขอจองใหม่” และพูดภาษาเดียวกับลูกค้า</li>
    <li class="flex gap-2"><i data-lucide="message-circle" class="w-4 h-4 text-maroon shrink-0 mt-0.5"></i>ส่งการ์ดลีดเข้า LINE ของเซลล์ที่ได้รับ (ต้องเชื่อม LINE ที่เมนูโปรไฟล์ของแต่ละคน) พร้อมปุ่ม “รับเรื่อง”</li>
    <li class="flex gap-2"><i data-lucide="alarm-clock" class="w-4 h-4 text-maroon shrink-0 mt-0.5"></i>ถ้าไม่มีใครติดต่อลูกค้าใน 15 นาที แจ้งเตือนเข้ากลุ่ม LINE ทีมขาย</li></ul>`;
  icons();
}; PAGES.find(p => p[0] === 'team')[3] = vTeam; }

/* ---------- my profile: password + LINE ---------- */
mePanel = function () {
  const P = permsOf(ME), mins = Math.max(0, IDLE_MIN - Math.floor((Date.now() - lastAct) / 60000)), L = BOOT.myLine || {};
  openModal(`<div class="p-5 border-b border-line flex items-center gap-3"><img src="${TEAM_IMG[ME.id] || initialsAva(ME.name)}" class="w-11 h-11 rounded-full object-cover"/><div class="min-w-0 flex-1"><p class="font-medium">${esc(ME.name)}</p><p class="text-[12px] text-muted">${esc(ME.email)} · ${ROLES[ME.roleKey][0]}</p></div><button class="btn btn-g !px-2" onclick="closeModal()" aria-label="Close"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="p-5 space-y-5">
      <div><p class="lbl">แจ้งเตือนลีดทาง LINE</p>${L.linked ? `<div class="flex items-center justify-between gap-3 rounded-xl bg-[#eaf6ef] text-[#1e7a46] p-3 text-[12.5px]"><span class="flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4"></i>เชื่อม LINE แล้ว · ลีดใหม่ส่งเข้า LINE ของคุณ</span><button class="text-[11px] underline" onclick="meLineUnlink()">ยกเลิก</button></div>`
        : `<div class="rounded-xl ring-1 ring-line p-3 text-[12.5px] grid gap-2"><p>1. เพิ่มเพื่อน LINE OA ของบริษัท · 2. ส่งข้อความ <b class="font-mono">LINK ${L.code || '······'}</b> ในแชท</p>${L.code ? `<p class="text-[11px] text-muted">ส่งแล้วกด “ตรวจสอบ” · รหัสใช้ได้ครั้งเดียว</p><div class="flex gap-2"><button class="btn btn-o !h-8" onclick="meLineCheck()">ตรวจสอบ</button><button class="btn btn-g !h-8" onclick="meLineCode()">ขอรหัสใหม่</button></div>` : `<button class="btn btn-o !h-8 justify-self-start" onclick="meLineCode()"><i data-lucide="link" class="w-3.5 h-3.5"></i>สร้างรหัสเชื่อม LINE</button>`}</div>`}</div>
      <form class="grid gap-2" onsubmit="event.preventDefault();mePassword(this)"><p class="lbl">เปลี่ยนรหัสผ่าน</p>
        <input name="current" type="password" class="inp" placeholder="รหัสผ่านปัจจุบัน" autocomplete="current-password" required/>
        <div class="grid grid-cols-2 gap-2"><input name="password" type="password" class="inp" placeholder="รหัสใหม่ (12 ตัวขึ้นไป)" autocomplete="new-password" required/><input name="password2" type="password" class="inp" placeholder="ยืนยันรหัสใหม่" autocomplete="new-password" required/></div>
        <button class="btn btn-o justify-self-start !h-8">บันทึกรหัสใหม่</button></form>
      <div><p class="lbl">สิทธิ์ของคุณ</p><div class="grid gap-1">${PERMS.map(([k, l]) => `<p class="flex items-center gap-2 text-[12.5px] ${P.includes(k) ? '' : 'text-muted line-through decoration-[#d9cfcf]'}"><i data-lucide="${P.includes(k) ? 'check' : 'x'}" class="w-3.5 h-3.5 ${P.includes(k) ? 'text-[#1e7a46]' : 'text-[#c9bfbf]'}"></i>${l}</p>`).join('')}</div></div>
      <div class="rounded-xl bg-sand p-3 text-[12px] grid gap-1"><p class="flex justify-between"><span class="text-muted">อุปกรณ์</span><span>${DEVICE}</span></p><p class="flex justify-between"><span class="text-muted">หมดเวลาถ้าไม่ใช้งานใน</span><span>${mins} นาที</span></p></div>
      <p class="text-[11px] text-muted">ต้องการสิทธิ์เพิ่ม ติดต่อ Super Admin · ทุกการเปลี่ยนสิทธิ์ถูกบันทึกไว้</p></div>
    <div class="p-4 border-t border-line flex gap-2"><button class="btn btn-p flex-1" onclick="closeModal();logout()"><i data-lucide="log-out" class="w-3.5 h-3.5"></i>ออกจากระบบ</button></div>`);
};
function mePassword(f) {
  if (f.password.value !== f.password2.value) return toastErr('รหัสใหม่ไม่ตรงกัน');
  api('POST', 'me/password', { current: f.current.value, password: f.password.value }).then(() => { f.reset(); toast('เปลี่ยนรหัสผ่านแล้ว'); AUDIT_DIRTY = true; }).catch(fail);
}
function meLineCode() { api('POST', 'me/line-code').then(r => { BOOT.myLine = { linked: false, code: r.code }; mePanel(); }).catch(fail); }
function meLineCheck() { api('GET', 'me/line').then(r => { BOOT.myLine = r; mePanel(); toast(r.linked ? 'เชื่อม LINE แล้ว' : 'ยังไม่พบข้อความ LINK ลองอีกครั้ง'); }).catch(fail); }
function meLineUnlink() { api('POST', 'me/line-unlink').then(() => { BOOT.myLine = { linked: false, code: null }; mePanel(); toast('ยกเลิกการเชื่อม LINE แล้ว'); }).catch(fail); }

logout = function (reason) {
  if (!ME) return;
  try { flushBoat(); boatTick(true); } catch (e) { }
  ME = null;
  api('POST', 'logout', { reason: reason || '' }).catch(() => { }).finally(() => { location.href = '/admin/login' + (reason === 'timeout' ? '?timeout=1' : ''); });
};

/* ---------- boats: anything changed in the list syncs at once; the open editor syncs on บันทึก / leaving ---------- */
const boatPayload = b => ({ slug: b.slug, name: b.title && b.name === niceTitle(b.title) ? b.title : b.name, subtitle: b.subtitle, type: b.type, ft: b.ft, pax: b.pax, marinaP: b.marinaP, marina: b.marina, from_: b.from_, active: b.active, featured: b.featured, status: b.status,
  cal: SZ.boats[b.slug] || null, colmap: (SZ.colmap || {})[b.slug] ?? null, imgs: (b.imgs || []).filter(u => !/^data:/.test(u)), tables: b.tables, includes: b.includes, not_included: b.not_included, complimentary: b.complimentary, notes: b.notes, info: b.info, time_slots: b.time_slots, i18n: b.i18n || null });
const BSYNC = new Map(), BFLY = new Set(), RENAMED = {};
FLEET.forEach(b => BSYNC.set(b.slug, JSON.stringify(boatPayload(b))));
function pushBoat(b, k, note) {
  if (BFLY.has(b.slug)) return; BFLY.add(b.slug);
  const slug = b.slug, old = RENAMED[slug];
  if ((b.imgs || []).some(u => /^data:/.test(u))) toast('รูปที่อัปโหลดจากเครื่องยังไม่ถูกเก็บถาวร · ใช้รูปจากคลังสื่อ');
  return api('PUT', 'boats/' + encodeURIComponent(slug), { boat: boatPayload(b), oldSlug: old, note }).then(r => {
    BSYNC.set(slug, k); if (old) { BSYNC.delete(old); delete RENAMED[slug]; }
    AUDIT_DIRTY = true; if (r.changes) toast(`บันทึก ${b.name} แล้ว · หน้าเว็บอัปเดตทันที`);
  }).catch(e => { BSYNC.set(slug, k); fail(e); }).finally(() => BFLY.delete(slug));
}
function boatTick(force, only) {
  if (!ME || !can('boats')) return;
  const editing = CUR === 'boats' ? (location.hash.split('/')[2] || '') : '';
  for (const b of FLEET) {
    if (only && b.slug !== only) continue;
    if (!force && editing && decodeURIComponent(editing) === b.slug) continue;
    const k = JSON.stringify(boatPayload(b)); if (BSYNC.get(b.slug) !== k) pushBoat(b, k);
  }
}
setInterval(() => boatTick(false), 1500);
{ const _bs = boatSave; boatSave = function (slug) { _bs(slug); boatTick(true, bySlug(slug) ? slug : undefined); }; }
{ const _bd = boatDel; boatDel = function (slug, ...r) { _bd(slug, ...r); if (!bySlug(slug) && BSYNC.has(slug)) api('DELETE', 'boats/' + encodeURIComponent(slug)).then(() => { BSYNC.delete(slug); AUDIT_DIRTY = true; }).catch(fail); }; }
{ const _br = boatRename; boatRename = function (old, val) { const b = bySlug(old); _br(old, val); if (b && b.slug !== old) { if (BSYNC.has(old)) { RENAMED[b.slug] = old; BSYNC.set(b.slug, BSYNC.get(old)); } boatTick(true, b.slug); } }; }

/* ---------- season calendars ---------- */
{ const _sz = szSave; szSave = function () { const c = SZV.edit; _sz(); if (c) api('PUT', 'seasons/' + encodeURIComponent(c.id), { cal: c }).then(() => { AUDIT_DIRTY = true; toast('บันทึกแล้ว · หน้าเว็บใช้ช่วงวันที่ใหม่ทันที'); }).catch(fail); }; }

/* ---------- articles: autosave a few seconds after typing stops ---------- */
const coverUrl = a => THUMBS[a.cover] || (/^(\/|https:)/.test(a.cover || '') ? a.cover : '');
const blocksFor = (a, k) => { const B = a.blocks?.[k]; return B && B.length ? B : (a.body?.[k] && typeof parseBlocks === 'function' ? parseBlocks(a.body[k]) : []); };
const postPayload = a => ({ id: a.id, cat: a.cat, status: a.status, date: a.date, cover: coverUrl(a), title: a.title, slug: a.slug, excerpt: a.excerpt, seoT: a.seoT, seoD: a.seoD, kw: a.kw, blocks: { th: blocksFor(a, 'th'), en: blocksFor(a, 'en') } });
const ASYNC = new Map(), ASEEN = new Map(), AFLY = new Set();
const allArts = () => (typeof ART_ALL !== 'undefined' && ART_ALL.length ? ART_ALL : ART);
allArts().forEach(a => ASYNC.set(a.id, JSON.stringify(postPayload(a))));
function pushArt(a, k, explicit) {
  if (AFLY.has(a.id)) return; AFLY.add(a.id);
  const ind = $('#artSaveInd'); if (ind) ind.textContent = 'กำลังบันทึก…';
  return api('PUT', 'posts/' + a.id, { post: postPayload(a), explicit }).then(() => { ASYNC.set(a.id, k); AUDIT_DIRTY = true; const i = $('#artSaveInd'); if (i) i.textContent = 'บันทึกแล้ว ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); })
    .catch(e => { ASYNC.set(a.id, k); fail(e); const i = $('#artSaveInd'); if (i) i.textContent = 'บันทึกไม่สำเร็จ'; }).finally(() => AFLY.delete(a.id));
}
function artTick(full) {
  if (!ME || !can('content')) return;
  const list = full ? allArts() : allArts().filter(a => a.id === AE.id);
  for (const a of list) {
    const k = JSON.stringify(postPayload(a)); if (ASYNC.get(a.id) === k) { ASEEN.delete(a.id); continue; }
    if (full || ASEEN.get(a.id) === k) pushArt(a, k); else ASEEN.set(a.id, k);   // unchanged for one tick → save
  }
}
setInterval(() => artTick(false), 2000);
setInterval(() => artTick(true), 15000);
{ const _ap = artPublish; artPublish = function (id) { _ap(id); const a = artById(id); if (a) { if (a.status === 'scheduled') toast('ตั้งเวลาเผยแพร่ยังไม่รองรับ · บทความจะแสดงเมื่อกดเผยแพร่ในวันนั้น'); pushArt(a, JSON.stringify(postPayload(a)), true); } }; }
{ const _ve = vArticleEdit; vArticleEdit = function (id) { _ve(id); const h = $('#view h2'); if (h && can('content')) h.insertAdjacentHTML('afterend', '<p id="artSaveInd" class="text-[11px] text-muted mt-1">บันทึกอัตโนมัติ</p>'); }; }

/* ---------- site settings ---------- */
if (BOOT.sitecfg) Object.assign(SITECFG, BOOT.sitecfg, { tab: SITECFG.tab });
{ const _cs = cfgSave; cfgSave = function () { const before = clone(CFGSNAP || {}); _cs(); const { tab, ...value } = SITECFG;
  const ch = jdiff(before, clone(SITECFG)).filter(c => !c.f.startsWith('tab')).slice(0, 30).map(c => ({ f: CFG_F[c.f.split(/[.[]/)[0]] || c.f, from: /^data:/.test(String(c.from)) ? '(รูปเดิม)' : typeof c.from === 'object' ? '(เดิม)' : c.from, to: /^data:/.test(String(c.to)) ? '(รูปใหม่)' : typeof c.to === 'object' ? '(ใหม่)' : c.to }));
  api('PUT', 'settings/sitecfg', { value, changes: ch }).then(() => { AUDIT_DIRTY = true; toast('บันทึกการตั้งค่าแล้ว · หน้าเว็บยังใช้ข้อมูลติดต่อเดิมจนกว่าจะเชื่อมในขั้นถัดไป'); }).catch(fail); }; }

/* ---------- audit log: always the server's copy ---------- */
function refreshAudit() { return api('GET', 'audit').then(r => { AUDIT.length = 0; AUDIT.push(...r.audit); AUDIT.forEach(actPillSafe); AUDIT_DIRTY = false; }); }
{ const _va = vAudit; vAudit = function () { _va(); if (AUDIT_DIRTY && can('audit')) refreshAudit().then(() => { if (CUR === 'audit') _va(); }).catch(() => { }); };
  PAGES.find(p => p[0] === 'audit')[3] = vAudit; }
audVerify = function () { toast('กำลังตรวจสอบสายบันทึก…'); api('POST', 'audit/verify').then(r => { AUDIT_DIRTY = true; toast(r.bad.length ? `พบ ${r.bad.length} รายการที่ไม่ตรง hash · แจ้งผู้ดูแลระบบ` : `ตรวจแล้ว ${r.total} รายการ · ไม่มีการแก้ไขย้อนหลัง`); }).catch(fail); };

/* ---------- pages not connected yet: say so plainly ---------- */
const NOT_LIVE = {
  activities: 'หน้านี้ยังเป็นตัวอย่าง · การแก้ไขกิจกรรมยังไม่บันทึกลงระบบ (หน้าเว็บใช้ข้อมูลชุดเดิม)',
  content: 'หน้านี้ยังเป็นตัวอย่าง · การแก้ไขเนื้อหาหน้าแรกยังไม่บันทึกลงระบบ',
  media: 'คลังสื่อยังเป็นตัวอย่าง · รูปที่อัปโหลดยังไม่ถูกเก็บถาวร',
  seo: 'ศูนย์ SEO ยังเป็นตัวอย่าง · redirect ด้านล่างเป็นของจริงจากระบบ แต่การแก้ไขในหน้านี้ยังไม่บันทึก',
  analytics: 'ตัวเลขในหน้านี้เป็นข้อมูลตัวอย่าง · ยังไม่ได้เชื่อม Google Analytics / Search Console',
  audiences: 'กลุ่มเป้าหมายคำนวณจากลีดจริง · การส่งไป Meta / Google และ LINE broadcast ยังเป็นการจำลอง',
  meta: 'หน้านี้ยังเป็นตัวอย่าง · ตั้งค่า Pixel / Conversions API ในไฟล์ .env บนเซิร์ฟเวอร์',
};
const _route20 = route;
route = function () {
  _route20();
  if (!ME) return;
  const [p, arg] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');
  if (NOT_LIVE[p] && !$('#nlBar')) $('#view').insertAdjacentHTML('afterbegin', `<div id="nlBar" class="mb-4 rounded-xl bg-[#fff8e6] ring-1 ring-[#f3e3b8] px-4 py-2.5 text-[12px] text-[#7a5a00] flex items-center gap-2"><i data-lucide="info" class="w-4 h-4 shrink-0"></i>${NOT_LIVE[p]}</div>`);
  if (p === 'settings' && BOOT.sys && !$('#sysCard')) $('#view').insertAdjacentHTML('beforeend', `<div id="sysCard" class="card mt-5"><div class="p-5 border-b border-line"><p class="font-medium">การเชื่อมต่อ</p><p class="text-[12px] text-muted mt-1">ตั้งค่าในไฟล์ .env บนเซิร์ฟเวอร์ แล้วรีสตาร์ต · ค่าลับไม่แสดงในหน้านี้</p></div><div class="divide-y divide-line">${BOOT.sys.map(([n, ok, d]) => `<div class="p-4 flex items-start gap-3"><span class="mt-0.5 w-5 h-5 rounded-full grid place-items-center text-white shrink-0 ${ok ? 'bg-[#1e7a46]' : 'bg-[#c9bfbf]'}"><i data-lucide="${ok ? 'check' : 'minus'}" class="w-3 h-3"></i></span><div class="min-w-0"><p>${esc(n)}</p><p class="text-[11.5px] text-muted break-all">${esc(d)}</p></div></div>`).join('')}</div></div>`);
  if (p === 'bookings' && can('export')) $('#view button[onclick="exportCsv()"]')?.insertAdjacentHTML('beforebegin', '<button class="btn btn-o" onclick="exportGads()" title="ลีดที่ปิดการขายได้และมาจากการคลิกโฆษณา Google · นำเข้าใน Google Ads → Conversions → Uploads"><i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>ไฟล์ Google Ads</button>');
  if (p === 'bookings' && arg && !$('#drawer').classList.contains('open')) { const ref = decodeURIComponent(arg); history.replaceState(null, '', '#/bookings'); if (BOOKINGS.some(l => l.id === ref)) bookingDetail(ref); else toast('ไม่พบลีดนี้ หรือไม่ได้อยู่ในความดูแลของคุณ'); }
  paintBell(); icons();
};
rerender = function () { route(); };
PAGES.forEach(p => { if (p[0] === 'bookings') p[1] = 'ลีด'; });

/* ---------- start: the server already checked the session ---------- */
(function start() {
  const me = Object.assign({}, TEAM.find(t => t.id === BOOT.me.id) || BOOT.me, { perms: BOOT.me.perms });
  finishLogin(me, '', { t: Date.now() });
  setInterval(pollLeads, 45000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pollLeads(); });
  window.addEventListener('beforeunload', e => { boatTick(true); artTick(true); if (BFLY.size || AFLY.size) { e.preventDefault(); e.returnValue = ''; } });
})();
