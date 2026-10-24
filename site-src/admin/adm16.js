/* =====================================================================
   BOATS CRUD – add (modal + template), duplicate, delete/hide, bulk,
   bound editor fields, photo gallery from media library, editable price tables
   ===================================================================== */
const BSEL = new Set();
const MARINAS = ['Royal Phuket Marina (RPM)', 'Ao Po Grand Marina', 'Chalong Pier Phuket', 'Boat Lagoon Phuket', 'ONE°15 Marina Panwa Phuket', 'Coco Pier Panwa Phuket', 'Nakalay Pier (Kalim) Phuket'];
FLEET.forEach(b => { b.imgs ??= THUMBS[b.slug] ? [THUMBS[b.slug]] : []; b.status ??= b.active ? 'live' : 'hidden'; });
const bookingsOf = slug => BOOKINGS.filter(x => x.boat === slug);
const uniqSlug = base => { let s = slugify(base) || 'boat', n = 1, o = s; while (bySlug(s)) s = `${o}-${++n}`; return s; };
const ST_B = { live: ['แสดงบนเว็บ', 'st-confirmed'], hidden: ['ซ่อน', 'st-done'], draft: ['ฉบับร่าง', 'st-quote'] };

/* ---------- list ---------- */
const _vBoats16 = vBoats;
vBoats = function () {
  _vBoats16();
  const q = BF.q.toLowerCase(), list = FLEET.filter(b => (!BF.type || b.type === BF.type) && (!q || (b.name + ' ' + b.marinaP + ' ' + b.subtitle).toLowerCase().includes(q)));
  $('#view h2').parentElement.parentElement.querySelector('.btn-p')?.setAttribute('onclick', 'boatNew()');
  const sub = $('#view h2 + p'); if (sub) sub.textContent = `${FLEET.length} ลำ · แสดงบนเว็บ ${FLEET.filter(b => b.active).length} · ซ่อน ${FLEET.filter(b => !b.active && b.status !== 'draft').length} · ฉบับร่าง ${FLEET.filter(b => b.status === 'draft').length}`;
  const tbl = $('#view table.tbl');
  if (tbl) {
    const hr = tbl.querySelector('thead tr'); hr.insertAdjacentHTML('afterbegin', `<th class="w-8"><input type="checkbox" class="accent-[#70000e] w-4 h-4" ${list.length && list.every(b => BSEL.has(b.slug)) ? 'checked' : ''} onchange="${list.map(b => `'${b.slug}'`).join(',') ? `[${list.map(b => `'${b.slug}'`).join(',')}].forEach(s=>this.checked?BSEL.add(s):BSEL.delete(s));vBoats()` : ''}"/></th>`);
    tbl.querySelectorAll('tbody tr').forEach((r, n) => { const b = list[n]; if (!b) return;
      r.insertAdjacentHTML('afterbegin', `<td><input type="checkbox" class="accent-[#70000e] w-4 h-4" ${BSEL.has(b.slug) ? 'checked' : ''} onchange="this.checked?BSEL.add('${b.slug}'):BSEL.delete('${b.slug}');vBoats()"/></td>`);
      if (b.status === 'draft') r.children[1].querySelector('p')?.insertAdjacentHTML('beforeend', ' <span class="pill st-quote ml-1">ร่าง</span>');
      const last = r.lastElementChild; last.innerHTML = `<div class="flex justify-end gap-0.5"><button class="btn btn-g !px-2" title="แก้ไข" onclick="boatEdit('${b.slug}')"><i data-lucide="pencil" class="w-4 h-4"></i></button><button class="btn btn-g !px-2" title="ทำสำเนา" onclick="boatDup('${b.slug}')"><i data-lucide="copy" class="w-4 h-4"></i></button><button class="btn btn-g !px-2 hover:!text-[#a3222c]" title="ลบ" onclick="boatDel('${b.slug}')"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`; });
    tbl.querySelectorAll('tbody input[type=checkbox][onchange*=".active="]').forEach(cb => cb.setAttribute('onchange', cb.getAttribute('onchange').replace(/bySlug\('([^']+)'\)\.active=this\.checked;/, (m, sl) => `${m}bySlug('${sl}').status=this.checked?'live':'hidden';`)));
  }
  if (BSEL.size) $('#view .card').insertAdjacentHTML('afterbegin', `<div class="m-3 rounded-xl bg-ink text-white px-4 py-2.5 flex flex-wrap items-center gap-2 text-[12.5px]"><span>เลือก ${BSEL.size} ลำ</span><span class="flex-1"></span>
    <button class="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20" onclick="boatBulk('show')">แสดงบนเว็บ</button><button class="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20" onclick="boatBulk('hide')">ซ่อน</button>
    <select class="h-8 rounded-full bg-white/10 px-3" onchange="if(this.value)boatBulk('marina',this.value)"><option value="">ย้ายท่าเรือ…</option>${MARINAS.map(m => `<option class="text-ink">${m}</option>`).join('')}</select>
    <button class="h-8 px-3 rounded-full bg-white/10 hover:bg-[#a3222c]" onclick="boatBulk('del')">ลบ</button><button class="h-8 px-3 rounded-full hover:bg-white/10" onclick="BSEL.clear();vBoats()">ยกเลิก</button></div>`);
  icons();
};
function boatBulk(op, v) {
  const S = [...BSEL]; let skip = 0;
  if (op === 'show') S.forEach(s => { const b = bySlug(s); b.active = true; b.status = 'live'; });
  if (op === 'hide') S.forEach(s => { const b = bySlug(s); b.active = false; b.status = 'hidden'; });
  if (op === 'marina') S.forEach(s => { const b = bySlug(s); b.marinaP = v; b.marina = v; });
  if (op === 'del') { if (!confirmBox(`ลบ ${S.length} ลำ?`)) return; S.forEach(s => bookingsOf(s).length ? skip++ : boatRemove(s)); }
  toast(op === 'del' ? `ลบ ${S.length - skip} ลำ${skip ? ` · ข้าม ${skip} ลำที่มีการจองอยู่ (ซ่อนแทนได้)` : ''}` : `อัปเดต ${S.length} ลำแล้ว`); BSEL.clear(); vBoats();
}
const confirmBox = () => true; /* real system: confirm dialog; mockup keeps flow simple */

/* ---------- add ---------- */
function boatNew() {
  openModal(`<div class="p-5 grid gap-3"><div class="flex items-center justify-between"><p class="font-medium">เพิ่มเรือใหม่</p><button class="btn btn-g !px-2" onclick="closeModal()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <label><span class="lbl">ชื่อเรือ *</span><input id="nbName" class="inp" placeholder="เช่น Sunseeker 75 ft" oninput="$('#nbSlug').value=slugify(this.value)"/></label>
    <div class="grid grid-cols-2 gap-3"><label><span class="lbl">ประเภท</span><select id="nbType" class="inp">${Object.entries(TYPE_TH).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label><label><span class="lbl">ท่าเรือ</span><select id="nbMarina" class="inp">${MARINAS.map(m => `<option>${m}</option>`).join('')}</select></label>
      <label><span class="lbl">ความยาว (ft)</span><input id="nbFt" type="number" class="inp"/></label><label><span class="lbl">จำนวนคนสูงสุด</span><input id="nbPax" type="number" class="inp"/></label></div>
    <label><span class="lbl">URL</span><div class="flex items-center rounded-[10px] ring-1 ring-inset ring-[rgb(35_20_22/.12)] bg-sand/50"><span class="pl-3 text-muted text-[12px] whitespace-nowrap">/yacht-charter/</span><input id="nbSlug" class="inp !shadow-none !bg-transparent !pl-1 font-mono !text-[12.5px]"/></div></label>
    <label><span class="lbl">เริ่มจาก</span><select id="nbTpl" class="inp"><option value="">ตารางราคาเปล่า (Low / High / Peak)</option><option value="__half">ตารางเปล่า (ครึ่งวัน / เต็มวัน)</option>${FLEET.slice(0, 70).map(b => `<option value="${b.slug}">คัดลอกโปรแกรม & เงื่อนไขจาก ${esc(b.name)}</option>`).join('')}</select></label>
    <p class="text-[11px] text-muted">เรือใหม่จะเป็น “ฉบับร่าง” ยังไม่แสดงบนเว็บจนกว่าจะกดเผยแพร่</p>
    <div class="flex justify-end gap-2 mt-1"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="boatCreate()">สร้างและแก้ไขต่อ</button></div></div>`);
  setTimeout(() => $('#nbName')?.focus(), 50);
}
function boatCreate() {
  const name = $('#nbName').value.trim(); if (!name) return toast('ใส่ชื่อเรือก่อน');
  const slug = uniqSlug($('#nbSlug').value || name), tpl = $('#nbTpl').value, src = tpl && tpl !== '__half' ? bySlug(tpl) : null, mar = $('#nbMarina').value;
  const tables = src ? JSON.parse(JSON.stringify(src.tables)) : [{ caption: '', columns: tpl === '__half' ? ['Program', 'Half Day', 'Full Day'] : ['Program', 'Low Season', 'High Season', 'Peak Season'], rows: [['', '', '', ''].slice(0, tpl === '__half' ? 3 : 4)] }];
  const b = { slug, title: name.toUpperCase(), name, subtitle: '', type: $('#nbType').value, ft: +$('#nbFt').value || null, pax: +$('#nbPax').value || null, from_: null, marina: mar, marinaP: mar, info: [['Boat Name', name], ['Size', ($('#nbFt').value || '') + ' ft.'], ['Capacity', ($('#nbPax').value || '') + ' passengers']],
    includes: src ? [...src.includes] : [], complimentary: src ? [...src.complimentary] : [], not_included: src ? [...src.not_included] : [], time_slots: src ? JSON.parse(JSON.stringify(src.time_slots)) : [], notes: src ? [...src.notes] : [], remarks: [], tables, active: false, status: 'draft', featured: false, imgs: [] };
  if (src && src.i18n) { b.i18n = JSON.parse(JSON.stringify(src.i18n)); b.i18n.name = tr(name, name); b.i18n.subtitle = tr(); b.i18n.desc = tr(); b.i18n.seoTitle = tr(); b.i18n.seoDesc = tr(); }
  else b.i18n = { name: tr(name, name), subtitle: tr(), desc: tr(), programs: b.tables.map(t => t.rows.map(r => tr(autoTh(r[0] || '') || '', r[0] || ''))), includes: [], complimentary: [], not_included: [], slots: [], notes: tr(), seoTitle: tr(), seoDesc: tr() };
  FLEET.unshift(b); if (src && SZ.boats[src.slug]) SZ.boats[slug] = SZ.boats[src.slug];
  closeModal(); toast(`สร้าง ${name} แล้ว · เพิ่มรูปและราคาต่อได้เลย`); BE.slug = slug; BE.tab = 'info'; go('boats/' + slug);
}
/* ---------- duplicate / delete ---------- */
function boatDup(slug) {
  const s = bySlug(slug), c = JSON.parse(JSON.stringify(s)); c.slug = uniqSlug(s.slug + '-copy'); c.name = s.name + ' (สำเนา)'; c.title = c.name.toUpperCase(); c.active = false; c.status = 'draft'; c.featured = false;
  if (c.i18n) { c.i18n.name.th += ' (สำเนา)'; c.i18n.name.en += ' (copy)'; }
  FLEET.splice(FLEET.indexOf(s) + 1, 0, c); THUMBS[c.slug] = THUMBS[s.slug]; if (SZ.boats[s.slug]) SZ.boats[c.slug] = SZ.boats[s.slug];
  toast(`ทำสำเนาเป็น “${c.name}” แล้ว · ตั้งเป็นฉบับร่าง`); CUR === 'boats' && location.hash.split('/')[2] ? go('boats/' + c.slug) : vBoats();
}
function boatRemove(slug) { const i = FLEET.findIndex(b => b.slug === slug); if (i >= 0) FLEET.splice(i, 1); delete SZ.boats[slug]; BSEL.delete(slug); }
function boatDel(slug) {
  const b = bySlug(slug), bk = bookingsOf(slug), up = bk.filter(x => !['lost'].includes(x.status));
  openModal(`<div class="p-5 grid gap-3"><div class="flex items-start gap-3"><span class="w-10 h-10 rounded-full bg-[#fbecec] grid place-items-center shrink-0"><i data-lucide="trash-2" class="w-5 h-5 text-[#a3222c]"></i></span><div><p class="font-medium">ลบ ${esc(b.name)}?</p>
      <p class="text-[12.5px] text-muted mt-1">${bk.length ? `เรือลำนี้มีลีด ${bk.length} รายการ${up.length ? ` (กำลังดำเนินการ ${up.length})` : ''} · ลบไม่ได้เพื่อเก็บประวัติ แนะนำให้ “ซ่อนจากเว็บ” แทน` : 'ข้อมูลเรือ ราคา และ SEO จะถูกลบ · ระบบตั้ง redirect 301 จาก URL เดิมไปหน้ารวมเรือให้อัตโนมัติ เพื่อไม่ให้อันดับ Google หาย'}</p></div></div>
    <div class="flex justify-end gap-2 mt-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button>${b.active ? `<button class="btn btn-o" onclick="bySlug('${slug}').active=false;bySlug('${slug}').status='hidden';closeModal();toast('ซ่อนจากเว็บแล้ว');route()">ซ่อนจากเว็บ</button>` : ''}
      ${bk.length ? '' : `<button class="btn !bg-[#a3222c] text-white" onclick="REDIR.unshift({from:'/yacht-charter/${slug}',to:'/yacht-charter',code:301,hits:0});boatRemove('${slug}');closeModal();toast('ลบเรือแล้ว · ตั้ง redirect 301 ให้แล้ว');go('boats');vBoats()">ลบถาวร</button>`}</div></div>`);
}

/* ---------- editor ---------- */
const _vBoatEdit16 = vBoatEdit;
vBoatEdit = function (slug) {
  const b = bySlug(slug); if (!b) return go('boats');
  _vBoatEdit16(slug);
  /* header: status, duplicate, delete, publish */
  const hd = $('#view > div.flex.items-center.gap-3.mb-5'), right = hd?.querySelector('.ml-auto');
  if (right) { right.querySelector('label')?.remove(); hd.classList.add('flex-wrap'); right.classList.add('flex-wrap','gap-2'); right.classList.remove('gap-3');
    right.insertAdjacentHTML('afterbegin', `<select class="inp !h-9 !w-auto" onchange="const b=bySlug('${slug}');b.status=this.value;b.active=this.value==='live';toast(ST_B[this.value][0])">${Object.entries(ST_B).map(([k, [l]]) => `<option value="${k}" ${b.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="btn btn-o !px-2.5" title="ทำสำเนา" onclick="boatDup('${slug}')"><i data-lucide="copy" class="w-4 h-4"></i></button><button class="btn btn-o !px-2.5 hover:!text-[#a3222c]" title="ลบ" onclick="boatDel('${slug}')"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`);
    const save = right.querySelector('.btn-p'); save.setAttribute('onclick', `boatSave('${slug}')`); if (b.status === 'draft') save.innerHTML = '<i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>เผยแพร่'; }
  const box = $('#view .card .p-5') || $('#view .fade');
  if (BE.tab === 'info' && box) {
    const lab = t => [...box.querySelectorAll('label')].find(l => l.querySelector('.lbl')?.textContent.startsWith(t));
    const ft = lab('ความยาว'); ft?.querySelector('input')?.setAttribute('oninput', `bySlug('${slug}').ft=+this.value||null`);
    const mr = lab('ท่าเรือ'), sel = mr?.querySelector('select');
    if (sel) { if (b.marinaP && !MARINAS.some(m => m.toLowerCase() === b.marinaP.toLowerCase())) sel.insertAdjacentHTML('afterbegin', `<option selected>${esc(b.marinaP)}</option>`); sel.insertAdjacentHTML('beforeend', '<option value="__other">อื่นๆ (พิมพ์เอง)…</option>');
      sel.setAttribute('onchange', `if(this.value==='__other'){const v=prompt('ชื่อท่าเรือ');if(v){bySlug('${slug}').marinaP=bySlug('${slug}').marina=v;}vBoatEdit('${slug}');return}bySlug('${slug}').marinaP=bySlug('${slug}').marina=this.value`); }
    box.querySelectorAll('.rounded-xl.ring-1.divide-y > div.grid').forEach((row, i) => { const [k, v] = row.querySelectorAll('input'); k?.setAttribute('oninput', `bySlug('${slug}').info[${i}][0]=this.value`); v?.setAttribute('oninput', `bySlug('${slug}').info[${i}][1]=this.value`); });
    const nt = [...box.querySelectorAll('textarea')].find(t => !t.closest('.bi')); nt?.setAttribute('oninput', `bySlug('${slug}').notes=this.value.split('\\n').filter(Boolean)`);
    box.insertAdjacentHTML('afterbegin', `<div class="grid sm:grid-cols-2 gap-3 mb-5"><label><span class="lbl">URL ของหน้าเรือ</span><div class="flex items-center rounded-[10px] ring-1 ring-inset ring-[rgb(35_20_22/.12)] bg-sand/50"><span class="pl-3 text-muted text-[12px] whitespace-nowrap">/yacht-charter/</span><input class="inp !shadow-none !bg-transparent !pl-1 font-mono !text-[12.5px]" value="${esc(slug)}" onchange="boatRename('${slug}',this.value)"/></div></label>
      <label class="flex items-end gap-3"><span class="flex-1"><span class="lbl">ราคาเริ่มต้น (บาท)</span><input class="inp tnum" value="${b.from_ ? b.from_.toLocaleString('en-US') : ''}" placeholder="คำนวณจากตารางราคา" onchange="bySlug('${slug}').from_=+this.value.replace(/[^\\d]/g,'')||null"/></span><label class="flex items-center gap-2 h-9 text-[12.5px] whitespace-nowrap"><span class="tgl"><input type="checkbox" ${b.featured ? 'checked' : ''} onchange="bySlug('${slug}').featured=this.checked"/><span></span></span>เรือแนะนำ</label></label></div>`);
  }
  if (BE.tab === 'photos' && box) { box.innerHTML = boatImgBox(slug); }
  if (BE.tab === 'prices' && box) {
    b.tables.forEach((t, ti) => { const card = box.querySelectorAll('.rounded-xl.ring-1.ring-line.overflow-hidden.mb-5')[ti]; if (!card) return;
      const cap = card.querySelector('input.bg-transparent'); cap?.setAttribute('oninput', `bySlug('${slug}').tables[${ti}].caption=this.value`);
      card.querySelector('.bg-sand')?.insertAdjacentHTML('beforeend', `<div class="flex gap-1"><button class="btn btn-g !h-7" onclick="boatCol('${slug}',${ti},'add')"><i data-lucide="columns-2" class="w-3.5 h-3.5"></i>เพิ่มคอลัมน์</button><button class="btn btn-g !h-7 !px-2" title="ทำสำเนาตาราง" onclick="const b=bySlug('${slug}');b.tables.splice(${ti + 1},0,JSON.parse(JSON.stringify(b.tables[${ti}])));vBoatEdit('${slug}')"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button><button class="btn btn-g !h-7 !px-2 hover:!text-[#a3222c]" title="ลบตาราง" onclick="if(bySlug('${slug}').tables.length<2)return toast('ต้องมีตารางราคาอย่างน้อย 1 ตาราง');bySlug('${slug}').tables.splice(${ti},1);vBoatEdit('${slug}')"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button></div>`);
      card.querySelectorAll('thead th').forEach((th, ci) => { if (!ci || ci >= t.columns.length) return; th.innerHTML = `<div class="flex items-center justify-end gap-1"><input class="edit-cell !w-36 !min-w-0 !text-right !font-medium !text-[11px] uppercase" value="${esc(t.columns[ci])}" oninput="bySlug('${slug}').tables[${ti}].columns[${ci}]=this.value"/>${t.columns.length > 2 ? `<button class="text-muted hover:text-[#a3222c]" title="ลบคอลัมน์" onclick="boatCol('${slug}',${ti},'del',${ci})"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>` : ''}</div>`; });
      const addBtn = [...card.querySelectorAll('.bg-sand button')].find(x => x.textContent.includes('เพิ่มโปรแกรม'));
      addBtn?.setAttribute('onclick', `boatAddRow('${slug}',${ti})`);
      card.querySelectorAll('tbody tr').forEach((tr_, ri) => tr_.querySelectorAll('input.edit-cell, input.inp').forEach((inp, k) => {
        const isName = !!inp.closest('td:first-child'), empty = !inp.value.trim();
        if (isName) inp.placeholder = inp.closest('.relative')?.querySelector('.bi-tag')?.textContent === 'EN' ? 'Program name, e.g. Full Day · Phi Phi' : 'ชื่อโปรแกรม เช่น เต็มวัน · พีพี';
        else inp.placeholder = 'ใส่ราคา';
        if (empty) inp.classList.add('need-fill');
        inp.addEventListener('input', () => inp.classList.toggle('need-fill', !inp.value.trim()));
      }));
    });
    box.insertAdjacentHTML('afterbegin', `<div class="flex flex-wrap items-center justify-between gap-2 mb-4"><p class="text-[12px] text-muted">แก้ชื่อคอลัมน์ได้ (เช่น Low Season / Half Day) · ระบบจับคู่คอลัมน์กับฤดูกาลให้ด้านบน</p><button class="btn btn-o !h-8" onclick="const b=bySlug('${slug}');b.tables.push({caption:'',columns:[...b.tables[0].columns],rows:[b.tables[0].columns.map(()=>'')]});vBoatEdit('${slug}')"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มตารางราคา</button></div>`);
  }
  if (BE.focusRow && BE.tab === 'prices') { const [ti, ri] = BE.focusRow; BE.focusRow = null; const row = $$('#view .rounded-xl.ring-1.ring-line.overflow-hidden.mb-5')[ti]?.querySelectorAll('tbody tr')[ri];
    if (row) { row.classList.add('row-new'); row.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => row.querySelector('input')?.focus(), 250); } }
  icons();
};
function boatAddRow(slug, ti) { const b = bySlug(slug), t = b.tables[ti]; t.rows.push(t.columns.map(() => ''));
  if (b.i18n) { b.i18n.programs[ti] ??= t.rows.slice(0, -1).map(r => tr(r[0], r[0])); b.i18n.programs[ti].push(tr()); }
  BE.focusRow = [ti, t.rows.length - 1]; vBoatEdit(slug); }
function boatCol(slug, ti, op, ci) { const t = bySlug(slug).tables[ti];
  if (op === 'add') { t.columns.push('New column'); t.rows.forEach(r => r.push('')); (SZ.colmap || {})[slug]?.push?.(null); }
  if (op === 'del') { t.columns.splice(ci, 1); t.rows.forEach(r => r.splice(ci, 1)); if (SZ.colmap?.[slug]) delete SZ.colmap[slug]; }
  vBoatEdit(slug); }
function boatRename(old, val) { const s = slugify(val); if (!s || s === old) return; if (bySlug(s)) return toast('URL นี้มีเรือใช้แล้ว');
  const b = bySlug(old); b.slug = s; THUMBS[s] = THUMBS[old]; if (SZ.boats[old]) { SZ.boats[s] = SZ.boats[old]; delete SZ.boats[old]; } BOOKINGS.forEach(x => { if (x.boat === old) x.boat = s; });
  REDIR.unshift({ from: '/yacht-charter/' + old, to: '/yacht-charter/' + s, code: 301, hits: 0 }); toast('เปลี่ยน URL แล้ว · ตั้ง redirect 301 จาก URL เดิมให้อัตโนมัติ'); history.replaceState(null, '', '#/boats/' + s); vBoatEdit(s); }
function boatSave(slug) { const b = bySlug(slug), miss = [];
  if (!b.name.trim()) miss.push('ชื่อเรือ'); if (!b.imgs.length) miss.push('รูปภาพ'); if (!b.tables.some(t => t.rows.some(r => r.slice(1).some(c => priceNum(c))))) miss.push('ราคาอย่างน้อย 1 โปรแกรม');
  if (b.status === 'draft') { if (miss.length) return toast('ยังเผยแพร่ไม่ได้ · ขาด ' + miss.join(', ')); b.status = 'live'; b.active = true; toast('เผยแพร่แล้ว · หน้าเรือขึ้นบนเว็บ'); return vBoatEdit(slug); }
  toast('บันทึกข้อมูลเรือแล้ว · หน้าเว็บอัปเดตทันที' + (miss.length ? ' (ยังขาด ' + miss.join(', ') + ')' : '')); }
/* photos */
function boatImgBox(slug) {
  const b = bySlug(slug), I = b.imgs;
  return `<div id="bImgs"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><p class="text-[12px] text-muted">รูปแรก = หน้าปก (Hero และการ์ดเรือ) · ชี้ที่รูปเพื่อตั้งปก เรียงลำดับ หรือนำออก</p>
    <div class="flex gap-2"><button class="btn btn-o !h-8" onclick="mediaPicker(s=>boatImg('${slug}','add',s),{multi:true,dir:'boat',title:'เลือกรูปเรือจากคลังสื่อ'})"><i data-lucide="images" class="w-3.5 h-3.5"></i>เลือกจากคลังสื่อ</button><label class="btn btn-p !h-8 cursor-pointer"><i data-lucide="upload" class="w-3.5 h-3.5"></i>อัปโหลด<input type="file" accept="image/*" multiple class="hidden" onchange="readFiles(this.files,s=>{s.forEach(x=>MEDIA.push(mkMedia(x,{name:'${slug}-'+Date.now().toString(36)+'.webp',dir:'boat',source:'own',rights:'own',date:iso(TODAY),owner:bySlug('${slug}').name})));boatImg('${slug}','add',s)})"/></label></div></div>
    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3" ondragover="event.preventDefault()" ondrop="event.preventDefault();readFiles(event.dataTransfer.files,s=>boatImg('${slug}','add',s))">${I.map((s, n) => `<div class="group relative rounded-xl overflow-hidden ring-1 ${n ? 'ring-line' : 'ring-2 ring-maroon'}"><img src="${s}" class="w-full aspect-[4/3] object-cover"/>${n ? '' : '<span class="absolute top-2 left-2 pill bg-white/90 text-ink">หน้าปก</span>'}
      <div class="absolute inset-x-0 bottom-0 p-1.5 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/50">${n ? `<button class="w-7 h-7 grid place-items-center rounded-lg bg-white/90" title="ตั้งเป็นหน้าปก" onclick="boatImg('${slug}','cover',${n})"><i data-lucide="star" class="w-3.5 h-3.5"></i></button><button class="w-7 h-7 grid place-items-center rounded-lg bg-white/90" onclick="boatImg('${slug}','move',${n},-1)"><i data-lucide="chevron-left" class="w-3.5 h-3.5"></i></button>` : ''}${n < I.length - 1 ? `<button class="w-7 h-7 grid place-items-center rounded-lg bg-white/90" onclick="boatImg('${slug}','move',${n},1)"><i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></button>` : ''}<button class="w-7 h-7 grid place-items-center rounded-lg bg-white/90 text-[#a3222c]" title="นำออก (ไฟล์ยังอยู่ในคลังสื่อ)" onclick="boatImg('${slug}','del',${n})"><i data-lucide="x" class="w-3.5 h-3.5"></i></button></div></div>`).join('')}
      <label class="rounded-xl aspect-[4/3] grid place-items-center text-center text-[12px] text-muted cursor-pointer border-2 border-dashed border-[#e2d8d8] hover:border-maroon hover:text-maroon"><span><i data-lucide="image-plus" class="w-6 h-6 mx-auto mb-1"></i>เพิ่มรูป<br><span class="text-[10.5px]">หรือลากไฟล์มาวาง</span></span><input type="file" accept="image/*" multiple class="hidden" onchange="readFiles(this.files,s=>boatImg('${slug}','add',s))"/></label></div>
    ${I.length ? '' : '<p class="text-[12px] text-[#a3222c] mt-3">ยังไม่มีรูป · ต้องมีอย่างน้อย 1 รูปจึงจะเผยแพร่ได้</p>'}
    <p class="text-[11px] text-muted mt-3">แนะนำแนวนอน 2000px ขึ้นไป · Alt text และสิทธิ์การใช้รูปแก้ที่คลังสื่อ · ระบบย่อเป็น WebP อัตโนมัติ</p></div>`;
}
function boatImg(slug, op, n, d) { const b = bySlug(slug), I = b.imgs;
  if (op === 'add') { n.forEach(s => !I.includes(s) && I.push(s)); toast(`เพิ่ม ${n.length} รูปแล้ว`); }
  if (op === 'del') I.splice(n, 1); if (op === 'cover') I.unshift(I.splice(n, 1)[0]); if (op === 'move') I.splice(n + d, 0, I.splice(n, 1)[0]);
  if (I[0]) THUMBS[slug] = I[0]; $('#bImgs').outerHTML = boatImgBox(slug); icons(); }
/* boat images count in media usage */
const _mUsage16 = mUsage;
mUsage = function () { const U = _mUsage16(); FLEET.forEach(b => (b.imgs || []).slice(1).forEach(s => { (U.get(s) || U.set(s, []).get(s)).push([`แกลเลอรีเรือ · ${b.name}`, `boatEdit('${b.slug}');BE.tab='photos'`]); })); return U; };
boatEdit = function (slug) { if (slug === undefined) return boatNew(); BE.slug = slug; BE.tab = 'info'; location.hash = '#/boats/' + slug; };
PAGES.find(p => p[0] === 'boats')[3] = vBoats;


/* article FAQ → FAQPage JSON-LD + SEO check */
const artFaqs = a => Object.values(a.blocks || {}).length ? (a.blocks.th || []).concat([]).filter(b => b.t === 'faq').flatMap(b => b.items).filter(x => txtOf(x.q) && txtOf(x.a)) : [];
const _seoJsonLd16 = seoJsonLd;
seoJsonLd = function () { const r = _seoJsonLd16(); const v = SEOV.prev; if (!v.startsWith('a-')) return r; const a = artById(+v.slice(2)), f = artFaqs(a); return f.length ? [r, { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: f.map(x => ({ '@type': 'Question', name: txtOf(x.q), acceptedAnswer: { '@type': 'Answer', text: txtOf(x.a) } })) }] : r; };
(function seedFaq() { const a = artById(1); if (!a) return; [['th', [['เช่าเรือยอชต์ภูเก็ตต้องจองล่วงหน้ากี่วัน?', 'แนะนำ 3–7 วัน และช่วง High Season หรือวันหยุดยาวควรจองล่วงหน้า 2–4 สัปดาห์'], ['ราคารวมค่าอุทยานแล้วหรือยัง?', 'ส่วนใหญ่ยังไม่รวม ค่าอุทยานแห่งชาติจ่ายตามจริงต่อคน ทีมงานจะแจ้งยอดก่อนยืนยัน'], ['ถ้าฝนตกหรือคลื่นแรงต้องทำอย่างไร?', 'กัปตันจะประเมินความปลอดภัย หากออกเรือไม่ได้ เลื่อนวันหรือขอคืนเงินได้ตามเงื่อนไข']]], ['en', [['How far in advance should I book a yacht in Phuket?', 'We recommend 3–7 days, or 2–4 weeks ahead in high season and holidays.'], ['Are national park fees included?', 'Usually not. Park fees are paid per person at cost; we confirm the total before you book.'], ['What happens if the weather is bad?', 'The captain decides based on safety. If the trip cannot go ahead you can reschedule or get a refund per our terms.']]]].forEach(([k, qs]) => { const B = blocksOf(a, k); B.splice(B.length - 1, 0, { t: 'faq', title: k === 'th' ? 'คำถามที่พบบ่อย' : 'Frequently asked questions', items: qs.map(([q, an]) => ({ q, a: an })) }); a.body[k] = blocksHtml(B); }); })();


