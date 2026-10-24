/* =====================================================================
   TEAM – add / edit / deactivate sales members
   ===================================================================== */
const ROLES = { super: ['Super Admin', 'ทำได้ทุกอย่าง รวมจัดการทีม สิทธิ์ผู้ใช้ และดูบันทึกกิจกรรม'], admin: ['Admin', 'ดูแลลีดทุกคน เรือ ราคา เนื้อหา SEO การตลาด และตั้งค่าเว็บ · จัดการทีมและสิทธิ์ไม่ได้'], sales: ['Sales', 'เห็นและจัดการเฉพาะลีดของตัวเอง'] };
const PERMS = [['bookings', 'การจอง & ลูกค้า'], ['boats', 'เรือ ราคา ฤดูกาล'], ['content', 'เนื้อหา บทความ คลังสื่อ'], ['seo', 'SEO & วิเคราะห์'], ['settings', 'ตั้งค่า & ทีม']];
const ROLE_PERMS = { super: ['bookings', 'boats', 'content', 'seo', 'settings'], admin: ['bookings', 'boats', 'content', 'seo', 'settings'], sales: ['bookings'], content: ['content', 'seo'], viewer: [] };
const LANG_OPT = ['ไทย', 'English', '中文', 'Русский'];
TEAM.forEach((t, i) => Object.assign(t, { full: t.full || '', roleKey: t.role.startsWith('Admin') ? 'super' : 'sales', email: `${t.id}@boattripthailand.com`, wa: t.tel, line: '', langs: i === 0 ? ['ไทย', 'English'] : ['ไทย', 'English'], showWeb: true, leads: true, active: true, perms: null, bio: tr('', ''), title: tr('ฝ่ายขาย', 'Sales') }));
const roleLabel = t => ({ super: 'Super Admin · ', admin: 'Admin · ' }[t.roleKey] || '') + (t.title?.en || ROLES[t.roleKey][0]);
const initialsAva = name => { const c = (name || '?').trim().charAt(0).toUpperCase(); return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#f2e2e4"/><text x="50%" y="54%" font-family="Arial" font-size="40" fill="#70000e" text-anchor="middle" dominant-baseline="middle">${c}</text></svg>`); };
const TE = { cur: null };
const _vTeam14 = vTeam;
vTeam = function () {
  _vTeam14();
  TEAM.forEach(t => t.role = roleLabel(t));
  $('#view h2').parentElement.parentElement.querySelector('.btn-p').setAttribute('onclick', 'teamEdit()');
  const cards = $$('#view .grid.md\\:grid-cols-3 > .card');
  cards.forEach((c, i) => { const t = TEAM[i]; if (!t) return;
    const nameP = c.querySelector('.flex-1 p'); nameP.innerHTML = `${esc(t.name)}${t.active ? '' : ' <span class="pill st-done ml-1">ปิดใช้งาน</span>'}${t.showWeb ? '' : ' <span class="text-[10.5px] text-muted">· ไม่แสดงบนเว็บ</span>'}`;
    c.querySelector('.flex-1 p + p').textContent = `${t.role} · ${t.tel}`;
    if (!t.active) c.classList.add('opacity-60');
    c.querySelector('button.btn-o').insertAdjacentHTML('beforebegin', '');
    c.querySelector('button.btn-o').outerHTML = `<div class="grid grid-cols-[1fr_auto] gap-2 mt-4"><button class="btn btn-o" onclick="BK.sales='${t.id}';BK.tab='all';go('bookings')">ดูงานของ ${esc(t.name)}</button><button class="btn btn-o !px-3" onclick="teamEdit('${t.id}')" aria-label="edit"><i data-lucide="pencil" class="w-3.5 h-3.5"></i>แก้ไข</button></div>`; });
  icons();
};
function teamEdit(id) {
  REG = [];
  const isNew = !id, t = isNew ? { id: 'u' + Date.now().toString(36), name: '', full: '', tel: '', wa: '', line: '', email: '', roleKey: 'sales', title: tr('ฝ่ายขาย', 'Sales'), langs: ['ไทย'], online: true, showWeb: true, leads: true, active: true, perms: null, bio: tr('', '') } : TEAM.find(x => x.id === id);
  TE.cur = JSON.parse(JSON.stringify(t)); TE.isNew = isNew; TE.ava = TEAM_IMG[t.id] || '';
  teamDraw(true);
}
function teamDraw(open) {
  const t = TE.cur, perms = t.perms || ROLE_PERMS[t.roleKey], open_ = BOOKINGS.filter(b => b.sales === t.id && ['new', 'contacted', 'talking'].includes(b.status)).length;
  const f = (k, l, ph = '', type = 'text') => `<label><span class="lbl">${l}</span><input type="${type}" class="inp" value="${esc(t[k] || '')}" placeholder="${ph}" oninput="TE.cur.${k}=this.value${k === 'name' ? ";if(!TE.ava||TE.ava.startsWith('data:image/svg'))$('#teAva').src=initialsAva(this.value)" : ''}"/></label>`;
  const tg = (k, l, h) => `<label class="flex items-start justify-between gap-3 py-1.5"><span>${l}${h ? `<span class="block text-[11px] text-muted">${h}</span>` : ''}</span><span class="tgl mt-0.5"><input type="checkbox" ${t[k] ? 'checked' : ''} onchange="TE.cur.${k}=this.checked"/><span></span></span></label>`;
  const html = `<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div><p class="text-[11px] text-muted">ทีมเซลล์</p><p class="font-medium">${TE.isNew ? 'เพิ่มสมาชิกใหม่' : 'แก้ไข · ' + esc(t.name)}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 grid gap-5 content-start">
      <div class="flex items-center gap-4"><img id="teAva" src="${TE.ava || initialsAva(t.name)}" class="w-20 h-20 rounded-full object-cover ring-1 ring-line"/>
        <div class="grid gap-2"><div class="flex flex-wrap gap-2"><label class="btn btn-o !h-8 cursor-pointer"><i data-lucide="upload" class="w-3.5 h-3.5"></i>อัปโหลดรูป<input type="file" accept="image/*" class="hidden" onchange="readFiles(this.files,s=>{TE.ava=s[0];$('#teAva').src=s[0]})"/></label><button class="btn btn-o !h-8" onclick="mediaPicker(s=>{TE.ava=s[0];teamDraw()},{title:'เลือกรูปโปรไฟล์'})"><i data-lucide="images" class="w-3.5 h-3.5"></i>คลังสื่อ</button></div><p class="text-[11px] text-muted">รูปนี้แสดงบนหน้าเว็บส่วน “ทีมของเรา” · แนะนำรูปหน้าตรง สี่เหลี่ยมจัตุรัส</p></div></div>
      <div class="grid sm:grid-cols-2 gap-3">${f('name', 'ชื่อเล่น (แสดงบนเว็บ)', 'เช่น Kwang')}${f('full', 'ชื่อ-นามสกุล', 'สำหรับภายใน')}</div>
      ${bi('ตำแหน่งที่แสดงบนเว็บ', t.title)}
      <div class="grid sm:grid-cols-2 gap-3">${f('tel', 'เบอร์โทร', '+66 8x xxx xxxx', 'tel')}${f('wa', 'WhatsApp', 'เบอร์ WhatsApp', 'tel')}${f('line', 'LINE ID', '@boattrip หรือ ID ส่วนตัว')}${f('email', 'อีเมล (ใช้เข้าสู่ระบบ)', 'name@boattripthailand.com', 'email')}</div>
      <div><p class="lbl">ภาษาที่สื่อสารได้</p><div class="flex flex-wrap gap-1.5">${LANG_OPT.map(l => `<button class="h-8 px-3 rounded-full text-[12.5px] ${t.langs.includes(l) ? 'bg-ink text-white' : 'ring-1 ring-line text-muted'}" onclick="const a=TE.cur.langs,k=a.indexOf('${l}');k<0?a.push('${l}'):a.splice(k,1);teamDraw()">${l}</button>`).join('')}</div><p class="text-[11px] text-muted mt-1.5">ใช้กระจายคำขอ เช่น ลูกค้าจากหน้า EN ส่งให้คนที่พูดอังกฤษได้</p></div>
      <div class="bi-opt">${optBi(bi('แนะนำตัวสั้นๆ (ไม่บังคับ)', t.bio, { rows: 2 }), { th: 'เช่น ดูแลลูกค้าเช่าเรือมา 8 ปี ถนัดทริปครอบครัว', en: 'e.g. 8 years helping families plan their day at sea' })}</div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium mb-2">บทบาท & สิทธิ์ในหลังบ้าน</p>
        <div class="grid sm:grid-cols-2 gap-2">${Object.entries(ROLES).map(([k, [l, d]]) => `<button class="text-left rounded-xl p-3 ${t.roleKey === k ? 'ring-2 ring-maroon bg-maroon-50' : 'ring-1 ring-line'}" onclick="TE.cur.roleKey='${k}';TE.cur.perms=null;teamDraw()"><p class="text-[13px] font-medium">${l}</p><p class="text-[11px] text-muted mt-0.5">${d}</p></button>`).join('')}</div>
        <div class="mt-3 grid gap-1">${PERMS.map(([k, l]) => `<label class="flex items-center gap-2.5 text-[12.5px] py-1"><input type="checkbox" class="accent-[#70000e] w-4 h-4" ${perms.includes(k) ? 'checked' : ''} onchange="const p=TE.cur.perms||[...ROLE_PERMS[TE.cur.roleKey]];this.checked?p.push('${k}'):p.splice(p.indexOf('${k}'),1);TE.cur.perms=p"/>${l}</label>`).join('')}</div></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium mb-1">การแสดงผล & คำขอจอง</p>${tg('showWeb', 'แสดงบนหน้าเว็บ', 'การ์ดทีมเซลล์ และปุ่มโทร/WhatsApp')}${tg('leads', 'รับคำขอจองใหม่', 'อยู่ในรอบกระจายคำขออัตโนมัติ')}${tg('online', 'ออนไลน์ตอนนี้')}${tg('active', 'เปิดใช้งานบัญชี', 'ปิด = เข้าสู่ระบบไม่ได้ ข้อมูลการจองเดิมยังอยู่')}</div>
      ${!TE.isNew ? `<div class="rounded-xl bg-sand p-4"><p class="text-[12px] font-medium">ลบสมาชิก</p><p class="text-[11.5px] text-muted mt-1">${open_ ? `มีงานค้าง ${open_} รายการ · ต้องโอนให้คนอื่นก่อน` : 'ไม่มีงานค้าง · ลบได้'} · แนะนำให้ปิดใช้งานแทนการลบ เพื่อเก็บประวัติการขาย</p>
        <div class="flex flex-wrap gap-2 mt-3">${open_ ? `<select id="teTo" class="inp !h-8 !w-auto">${TEAM.filter(x => x.id !== t.id && x.active).map(x => `<option value="${x.id}">โอนงานให้ ${esc(x.name)}</option>`).join('')}</select><button class="btn btn-o !h-8" onclick="teamTransfer()">โอนงาน</button>` : `<button class="btn btn-o !h-8 text-[#a3222c]" onclick="teamDelete()"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i>ลบสมาชิก</button>`}</div></div>` : ''}
    </div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeDrawer()">ยกเลิก</button><button class="btn btn-p" onclick="teamSave()">${TE.isNew ? 'เพิ่มและส่งคำเชิญ' : 'บันทึก'}</button></div>`;
  if (open) openDrawer(html); else { const sc = $('#drawer .overflow-y-auto')?.scrollTop || 0; $('#drawer').innerHTML = html; $('#drawer .overflow-y-auto').scrollTop = sc; icons(); }
}
function teamSave() {
  const t = TE.cur; if (!t.name.trim()) return toast('ใส่ชื่อเล่นก่อน'); if (!t.tel.trim()) return toast('ใส่เบอร์โทรก่อน');
  if (t.roleKey !== 'super' && TEAM.filter(x => x.roleKey === 'super' && x.active && x.id !== t.id).length === 0) return toast('ต้องมี Super Admin อย่างน้อย 1 คน');
  t.role = roleLabel(t); TEAM_IMG[t.id] = TE.ava || initialsAva(t.name);
  if (TE.isNew) { TEAM.push(t); toast(`เพิ่ม ${t.name} แล้ว · ส่งอีเมลเชิญเข้าระบบไปที่ ${t.email || '(ยังไม่มีอีเมล)'}`); }
  else { Object.assign(TEAM.find(x => x.id === t.id), t); toast('บันทึกแล้ว'); }
  closeDrawer(); vTeam();
}
function teamTransfer() { const to = $('#teTo').value, id = TE.cur.id; let n = 0; BOOKINGS.forEach(b => { if (b.sales === id && ['new', 'contacted', 'talking'].includes(b.status)) { b.sales = to; n++; } }); toast(`โอน ${n} งานให้ ${teamOf(to).name} แล้ว`); teamDraw(); }
function teamDelete() { const id = TE.cur.id; if (TEAM.find(x => x.id === id).roleKey === 'super' && TEAM.filter(x => x.roleKey === 'super').length < 2) return toast('ลบ Super Admin คนสุดท้ายไม่ได้');
  const i = TEAM.findIndex(x => x.id === id), name = TEAM[i].name; TEAM[i].active = false; TEAM[i].showWeb = false; TEAM[i].leads = false; TEAM[i].deleted = true; closeDrawer(); vTeam(); toast(`ลบ ${name} แล้ว · ประวัติการขายยังเก็บไว้`); }
/* deleted members hidden from the team grid */
const _vTeam14b = vTeam;
vTeam = function () { const keep = TEAM.slice(); const shown = keep.filter(t => !t.deleted); TEAM.length = 0; TEAM.push(...shown); try { _vTeam14b(); } finally { TEAM.length = 0; TEAM.push(...keep); } };
PAGES.find(p => p[0] === 'team')[3] = vTeam;


