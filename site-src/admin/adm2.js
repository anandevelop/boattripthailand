/* =====================================================================
   BOATS · ACTIVITIES · CONTENT · CUSTOMERS · TEAM · SETTINGS · ROUTER
   ===================================================================== */
const BF = { q: '', type: '', view: 'table' };
function vBoats() {
  const q = BF.q.toLowerCase();
  const list = FLEET.filter(b => (!BF.type || b.type === BF.type) && (!q || (b.name + ' ' + b.marinaP + ' ' + b.subtitle).toLowerCase().includes(q)));
  $('#view').innerHTML = `
    ${head('จัดการเรือ', `${FLEET.length} ลำ · เปิดแสดง ${FLEET.filter(b => b.active).length} ลำ`, `<button class="btn btn-o" onclick="toast('นำเข้าข้อมูลจากโบรชัวร์ PDF (จำลอง)')"><i data-lucide="file-up" class="w-3.5 h-3.5"></i>นำเข้า PDF</button><button class="btn btn-p" onclick="boatEdit()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มเรือ</button>`)}
    <div class="card">
      <div class="p-3 flex flex-col lg:flex-row gap-2 lg:items-center border-b border-line">
        <div class="flex gap-1 overflow-x-auto no-sb">${[['', 'ทั้งหมด'], ...Object.entries(TYPE_TH)].map(([k, l]) => `<button class="tab ${BF.type === k ? 'on' : ''}" onclick="BF.type='${k}';vBoats()">${l} <span class="opacity-60">${k ? FLEET.filter(b => b.type === k).length : FLEET.length}</span></button>`).join('')}</div>
        <div class="lg:ml-auto flex gap-2"><input class="inp flex-1 sm:!w-60" placeholder="ค้นหาชื่อเรือ ท่าเรือ" value="${esc(BF.q)}" oninput="BF.q=this.value;clearTimeout(window._bf);window._bf=setTimeout(()=>{vBoats();const i=$('#view input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"/>
          <div class="flex p-0.5 rounded-full bg-sand">${[['table', 'list'], ['grid', 'layout-grid']].map(([k, ic]) => `<button class="w-8 h-8 grid place-items-center rounded-full ${BF.view === k ? 'bg-white shadow-sm' : 'text-muted'}" onclick="BF.view='${k}';vBoats()" aria-label="${k}"><i data-lucide="${ic}" class="w-4 h-4"></i></button>`).join('')}</div></div>
      </div>
      ${BF.view === 'table' ? `<div class="overflow-x-auto"><table class="tbl"><thead><tr><th>เรือ</th><th>ประเภท</th><th>ท่าเรือ</th><th>ความจุ</th><th>โปรแกรม</th><th class="text-right">เริ่มต้น</th><th>แนะนำ</th><th>แสดงบนเว็บ</th><th></th></tr></thead><tbody>
        ${list.map(b => `<tr><td><div class="flex items-center gap-3 cursor-pointer" onclick="boatEdit('${b.slug}')">${thumb(b.slug, 'w-14 h-10')}<div class="min-w-0"><p class="truncate max-w-[200px] hover:text-maroon">${b.name}</p><p class="text-[11px] text-muted">${b.ft ? b.ft + ' ft · ' : ''}${esc(b.subtitle)}</p></div></div></td>
          <td class="text-muted whitespace-nowrap">${TYPE_TH[b.type]}</td><td class="text-muted truncate max-w-[180px]">${b.marinaP}</td><td class="tnum whitespace-nowrap">${b.pax || '—'} คน</td><td class="tnum">${progsOf(b).length}</td><td class="text-right tnum">${baht(b.from_)}</td>
          <td><button onclick="event.stopPropagation();bySlug('${b.slug}').featured=!bySlug('${b.slug}').featured;vBoats()" class="w-8 h-8 grid place-items-center rounded-full hover:bg-sand" aria-label="featured"><i data-lucide="star" class="w-4 h-4 ${b.featured ? 'text-maroon fill-maroon' : 'text-muted'}"></i></button></td>
          <td><label class="tgl"><input type="checkbox" ${b.active ? 'checked' : ''} onchange="bySlug('${b.slug}').active=this.checked;toast(this.checked?'เปิดแสดงบนเว็บ':'ซ่อนจากเว็บแล้ว')"/><span></span></label></td>
          <td class="text-right"><button class="btn btn-g !px-2" onclick="boatEdit('${b.slug}')" aria-label="edit"><i data-lucide="pencil" class="w-4 h-4"></i></button></td></tr>`).join('')}
      </tbody></table></div>`
      : `<div class="p-4 grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">${list.map(b => `<button class="text-left rounded-xl ring-1 ring-line overflow-hidden hover:ring-maroon/40 transition" onclick="boatEdit('${b.slug}')"><img src="${THUMBS[b.slug]}" class="w-full aspect-[16/10] object-cover"/><div class="p-3"><div class="flex justify-between gap-2"><p class="font-medium truncate">${b.name}</p>${b.active ? '' : '<span class="pill st-done">ซ่อน</span>'}</div><p class="text-[11px] text-muted mt-0.5">${TYPE_TH[b.type]} · ${b.pax || '—'} คน</p><p class="mt-2 tnum">${baht(b.from_)}</p></div></button>`).join('')}</div>`}
    </div>`;
  icons();
}
const BE = { slug: null, tab: 'info' };
function boatEdit(slug) {
  if (slug === undefined) { slug = 'new-boat-' + Date.now(); FLEET.unshift({ slug, title: 'NEW BOAT', name: 'เรือลำใหม่', subtitle: '', type: 'yacht', ft: null, pax: null, from_: null, marina: '', marinaP: '', info: [], includes: [], complimentary: [], not_included: [], time_slots: [], notes: [], remarks: [], tables: [{ caption: '', columns: ['Program', 'Low Season', 'High Season'], rows: [['Half Day 4 hrs.', '', '']] }], active: false, featured: false }); }
  BE.slug = slug; BE.tab = 'info'; location.hash = '#/boats/' + slug;
}
function vBoatEdit(slug) {
  const b = bySlug(slug); if (!b) return go('boats');
  const tabs = [['info', 'ข้อมูลเรือ'], ['photos', 'รูปภาพ'], ['prices', 'โปรแกรม & ราคา'], ['incl', 'รวม / ไม่รวม'], ['seo', 'SEO']];
  let body = '';
  if (BE.tab === 'info') body = `<div class="grid md:grid-cols-2 gap-4">
      <label><span class="lbl">ชื่อเรือ</span><input class="inp" value="${esc(b.name)}" oninput="bySlug('${slug}').name=this.value"/></label>
      <label><span class="lbl">ประเภท</span><select class="inp" onchange="bySlug('${slug}').type=this.value">${Object.entries(TYPE_TH).map(([k, v]) => `<option value="${k}" ${b.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label><span class="lbl">รุ่น / คำอธิบายสั้น</span><input class="inp" value="${esc(b.subtitle)}" oninput="bySlug('${slug}').subtitle=this.value"/></label>
      <label><span class="lbl">ท่าเรือ</span><select class="inp">${['Royal Phuket Marina (RPM)', 'Ao Po Grand Marina', 'Chalong Pier Phuket', 'Boat Lagoon Phuket', 'ONE°15 Marina Panwa Phuket', 'Coco Pier Panwa Phuket', 'Nakalay Pier (Kalim) Phuket', 'Phuket'].map(m => `<option ${b.marinaP.toLowerCase() === m.toLowerCase() ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
      <label><span class="lbl">ความยาว (ft)</span><input class="inp" type="number" value="${b.ft ?? ''}"/></label>
      <label><span class="lbl">จำนวนคนสูงสุด</span><input class="inp" type="number" value="${b.pax ?? ''}" oninput="bySlug('${slug}').pax=+this.value"/></label>
    </div>
    <p class="font-medium mt-7 mb-3">สเปคเรือ <span class="text-muted font-normal">(แสดงในตาราง "ข้อมูลเรือ" บนเว็บ)</span></p>
    <div class="rounded-xl ring-1 ring-line divide-y divide-line">${b.info.map(([k, v], i) => `<div class="grid grid-cols-[1fr_1.4fr_auto] gap-2 p-2 items-center"><input class="inp !h-8 !shadow-none" value="${esc(k)}"/><input class="inp !h-8" value="${esc(v)}"/><button class="btn btn-g !px-2" onclick="bySlug('${slug}').info.splice(${i},1);vBoatEdit('${slug}')"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`).join('')}
      <div class="p-2"><button class="btn btn-g" onclick="bySlug('${slug}').info.push(['',''])&&vBoatEdit('${slug}')"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มรายการ</button></div></div>
    <p class="font-medium mt-7 mb-3">หมายเหตุ / เงื่อนไข</p>
    <textarea class="inp" rows="4">${esc(b.notes.join('\n'))}</textarea>`;
  if (BE.tab === 'photos') body = `<div class="grid grid-cols-2 md:grid-cols-4 gap-3">${['หน้าปก (Hero)', 'รูป 2', 'รูป 3'].map((l, i) => `<div class="relative rounded-xl overflow-hidden ring-1 ring-line group"><img src="${THUMBS[slug] || ''}" class="w-full aspect-[4/3] object-cover ${i ? 'opacity-90' : ''}"/><span class="absolute top-2 left-2 pill bg-white/90 text-ink">${l}</span><div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition grid place-items-center"><div class="flex gap-2"><button class="btn btn-o !h-8">แทนที่</button><button class="btn btn-o !h-8 !px-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div></div></div>`).join('')}
      <button class="rounded-xl border-2 border-dashed border-sand-200 aspect-[4/3] grid place-items-center text-muted hover:border-maroon/40 hover:text-maroon" onclick="toast('อัปโหลดรูป (จำลอง) · แนะนำกว้าง 2000px ขึ้นไป')"><span class="text-center"><i data-lucide="image-plus" class="w-6 h-6 mx-auto"></i><span class="block mt-2 text-[12px]">อัปโหลดรูป</span></span></button></div>
      <p class="text-[12px] text-muted mt-4">ลากเพื่อเรียงลำดับ · รูปแรกเป็นหน้าปก · แนะนำ 2000px ขึ้นไป อัตราส่วน 4:3 หรือ 16:9 · ระบบจะย่อและแปลงเป็น WebP อัตโนมัติ</p>`;
  if (BE.tab === 'prices') body = `${b.tables.map((t, ti) => `<div class="rounded-xl ring-1 ring-line overflow-hidden mb-5">
      <div class="px-4 py-2.5 bg-sand flex items-center justify-between"><input class="bg-transparent font-medium" value="${esc(t.caption || 'ตารางราคา ' + (ti + 1))}"/><button class="btn btn-g !h-7" onclick="bySlug('${slug}').tables[${ti}].rows.push([''].concat(bySlug('${slug}').tables[${ti}].columns.slice(1).map(()=>'')));vBoatEdit('${slug}')"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มโปรแกรม</button></div>
      <div class="overflow-x-auto"><table class="tbl"><thead><tr>${t.columns.map((c, ci) => `<th class="${ci ? 'text-right' : ''}">${esc(c || 'Program')}</th>`).join('')}<th></th></tr></thead><tbody>
        ${t.rows.map((r, ri) => `<tr>${r.map((c, ci) => ci === 0 ? `<td><input class="edit-cell !text-left min-w-[240px]" value="${esc(c)}" oninput="bySlug('${slug}').tables[${ti}].rows[${ri}][0]=this.value"/></td>` : `<td><input class="edit-cell" value="${priceNum(c) ? priceNum(c).toLocaleString('en-US') : esc(c)}" onchange="const n=+this.value.replace(/[^\\d]/g,'');bySlug('${slug}').tables[${ti}].rows[${ri}][${ci}]=n?n.toLocaleString('en-US')+' THB':this.value;this.value=n?n.toLocaleString('en-US'):this.value;toast('บันทึกราคาแล้ว')"/></td>`).join('')}<td class="text-right"><button class="btn btn-g !px-2" onclick="bySlug('${slug}').tables[${ti}].rows.splice(${ri},1);vBoatEdit('${slug}')"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`).join('')}
      </tbody></table></div></div>`).join('')}
      <div class="grid md:grid-cols-3 gap-4">
        <label><span class="lbl">ราคาพื้นฐานรวมได้ถึง (คน)</span><input class="inp" type="number" value="${(b.notes.join(' ').match(/from the (\d+)/i) || [0, ''])[1] - 1 || ''}"/></label>
        <label><span class="lbl">ค่าคนเพิ่ม / คน (บาท)</span><input class="inp" value="${(b.notes.join(' ').match(/extra charge of (?:net )?([\d,]+)/i) || [0, ''])[1]}"/></label>
        <label><span class="lbl">ราคาเริ่มต้นที่แสดงบนการ์ด</span><input class="inp" value="${b.from_ ? b.from_.toLocaleString('en-US') : ''}" onchange="bySlug('${slug}').from_=+this.value.replace(/[^\\d]/g,'')||null"/></label>
      </div>
      <p class="text-[12px] text-muted mt-3">คอลัมน์ฤดูกาล (Low / High / Peak) ผูกกับช่วงวันที่ในเมนู "ฤดูกาลราคา" · หน้าเว็บจะเลือกราคาตามวันที่ลูกค้าเลือกให้อัตโนมัติ</p>`;
  if (BE.tab === 'incl') { const lst = (k, t) => `<div class="rounded-xl ring-1 ring-line p-4"><p class="font-medium mb-3">${t}</p>${(b[k] || []).map((x, i) => `<div class="flex gap-2 mb-2"><input class="inp !h-8" value="${esc(x)}"/><button class="btn btn-g !px-2" onclick="bySlug('${slug}')['${k}'].splice(${i},1);vBoatEdit('${slug}')"><i data-lucide="x" class="w-4 h-4"></i></button></div>`).join('')}<button class="btn btn-g" onclick="(bySlug('${slug}')['${k}']=bySlug('${slug}')['${k}']||[]).push('');vBoatEdit('${slug}')"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่ม</button></div>`;
    body = `<div class="grid md:grid-cols-3 gap-4">${lst('includes', 'รวมในราคา')}${lst('complimentary', 'ฟรี / แถม')}${lst('not_included', 'ไม่รวม')}</div>
      <p class="font-medium mt-6 mb-3">รอบเวลา</p><div class="rounded-xl ring-1 ring-line divide-y divide-line">${b.time_slots.map(([k, v]) => `<div class="grid grid-cols-2 gap-2 p-2"><input class="inp !h-8" value="${esc(k)}"/><input class="inp !h-8" value="${esc(v)}"/></div>`).join('') || '<p class="p-3 text-muted">ยังไม่มีรอบเวลา</p>'}</div>`; }
  if (BE.tab === 'seo') { const t = `${b.name} เช่าเรือ Phuket – เริ่ม ${baht(b.from_)} | BTT`, d = `${b.name} ${TYPE_TH[b.type]} รับได้ ${b.pax || '-'} คน ออกจาก ${b.marinaP} ราคาเริ่มต้น ${baht(b.from_)} รวมกัปตันและประกัน`;
    body = `<div class="grid gap-4 max-w-2xl"><label><span class="lbl">URL</span><div class="flex items-center"><span class="text-muted pr-1">boattripthailand.com/yacht-charter/</span><input class="inp" value="${slug}"/></div></label>
      <label><span class="lbl">Title <span class="tnum">(${t.length}/60)</span></span><input class="inp" value="${esc(t)}"/></label>
      <label><span class="lbl">Meta description <span class="tnum">(${d.length}/160)</span></span><textarea class="inp" rows="3">${esc(d)}</textarea></label>
      <div><p class="lbl">ตัวอย่างบน Google</p><div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] text-[#1e7a46]">boattripthailand.com › yacht-charter › ${slug}</p><p class="text-[17px] text-[#1a0dab] mt-1 leading-snug">${esc(t)}</p><p class="text-[13px] text-muted mt-1">${esc(d)}</p></div></div></div>`; }
  $('#view').innerHTML = `
    <div class="flex items-center gap-3 mb-5"><button class="btn btn-o !px-2" onclick="go('boats')" aria-label="back"><i data-lucide="arrow-left" class="w-4 h-4"></i></button>${thumb(slug, 'w-14 h-10')}<div class="min-w-0"><h2 class="text-xl font-medium truncate">${esc(b.name)}</h2><p class="text-muted">${TYPE_TH[b.type]} · ${b.marinaP || 'ยังไม่ระบุท่าเรือ'}</p></div>
      <div class="ml-auto flex items-center gap-3"><label class="flex items-center gap-2 text-muted"><span class="hidden sm:inline">แสดงบนเว็บ</span><span class="tgl"><input type="checkbox" ${b.active ? 'checked' : ''} onchange="bySlug('${slug}').active=this.checked"/><span></span></span></label>
      <a class="btn btn-o hidden sm:inline-flex" href="boattripthailand-mockup.html#/boat/${slug}" target="_blank"><i data-lucide="eye" class="w-3.5 h-3.5"></i>ดูหน้าเรือ</a><button class="btn btn-p" onclick="toast('บันทึกข้อมูลเรือแล้ว · หน้าเว็บอัปเดตทันที (ISR)')"><i data-lucide="save" class="w-3.5 h-3.5"></i>บันทึก</button></div></div>
    <div class="card"><div class="px-3 pt-3 flex gap-1 overflow-x-auto no-sb border-b border-line pb-3">${tabs.map(([k, l]) => `<button class="tab ${BE.tab === k ? 'on' : ''}" onclick="BE.tab='${k}';vBoatEdit('${slug}')">${l}</button>`).join('')}</div><div class="p-5 fade">${body}</div></div>`;
  icons();
}

/* ---------- Activities ---------- */
const ACTS = __ACTS__;
const ACAT = { show: 'Show in Phuket', city: 'City Tour', activity: 'Activity', seatour: 'Sea Tour', tourth: 'ทัวร์ทะเล', water: 'กิจกรรมทางน้ำ', outdoor: 'กิจกรรมเอาท์ดอร์', stay: 'ที่พัก', spa: 'นวดสปา', animal: 'เกี่ยวกับสัตว์', lounge: 'Lounge', food: 'ร้านอาหาร' };
ACTS.forEach(a => a.active = true);
/* the 5 shows from “Show in Phuket.pdf” are already in ACTS (from the website data) */
const AF = { cat: '' };
function vActivities() {
  const list = ACTS.filter(a => !AF.cat || a.cat === AF.cat);
  $('#view').innerHTML = `
    ${head('กิจกรรม & ทัวร์', `${ACTS.length} รายการ · ${ACTS.filter(a => !a.price).length} รายการยังไม่มีราคา (หน้าเว็บแสดง “สอบถามราคา”)`, `<button class="btn btn-p" onclick="toast('เพิ่มกิจกรรม (จำลอง)')"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มกิจกรรม</button>`)}
    <div class="card"><div class="p-3 flex gap-1 overflow-x-auto no-sb border-b border-line">${[['', 'ทั้งหมด'], ...Object.entries(ACAT)].map(([k, l]) => `<button class="tab ${AF.cat === k ? 'on' : ''}" onclick="AF.cat='${k}';vActivities()">${l}</button>`).join('')}</div>
    <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>ชื่อกิจกรรม</th><th>หมวด</th><th>สถานที่</th><th>ระยะเวลา</th><th class="text-right">ราคา (บาท)</th><th>แสดงบนเว็บ</th></tr></thead><tbody>
      ${list.map(a => { const i = ACTS.indexOf(a); return `<tr><td><p>${esc(a.th)}</p><p class="text-[11px] text-muted">${esc(a.en)}${a.src ? ' · <span class="text-maroon">ใหม่จาก PDF</span>' : ''}</p></td><td class="text-muted">${ACAT[a.cat]}</td><td class="text-muted">${a.loc}</td><td class="text-muted">${a.dur}</td>
        <td class="text-right w-36"><input class="edit-cell ${a.price ? '' : '!shadow-[inset_0_0_0_1px_#e9b9bd]'}" placeholder="ใส่ราคา" value="${a.price ? a.price.toLocaleString('en-US') : ''}" onchange="ACTS[${i}].price=+this.value.replace(/[^\\d]/g,'')||null;toast('บันทึกราคาแล้ว')"/></td>
        <td><label class="tgl"><input type="checkbox" ${a.active ? 'checked' : ''} onchange="if(this.checked&&!ACTS[${i}].price){this.checked=false;toast('ใส่ราคาก่อนเปิดแสดง');return}ACTS[${i}].active=this.checked"/><span></span></label></td></tr>`; }).join('')}
    </tbody></table></div></div>`;
  icons();
}

/* ---------- Website content ---------- */
const CONTENT = { tab: 'hero', heroWords: ['ในแบบของคุณ', 'กับคนที่คุณรัก', 'กับเพื่อนทั้งแก๊ง', 'แบบส่วนตัว'], heroSlides: ['leopard-90-ft', 'splo-74-ft', 'siam-princess-70-ft', 'the-origin-90-ft', 'lobster-78-ft', 'vtech-68-ft'],
  faq: [['Yacht charter ภูเก็ตราคาเท่าไหร่?', 'ราคาขึ้นกับขนาดเรือ เส้นทาง และฤดูกาล…'], ['ราคา yacht charter รวมอะไรบ้าง?', 'โดยทั่วไปรวมกัปตันและลูกเรือ น้ำมัน…'], ['ช่วงไหนเหมาะกับการเช่าเรือยอชต์ในภูเก็ตที่สุด?', 'High Season (พ.ย.–เม.ย.) ทะเลสงบ…'], ['เช่าเรือยอชต์ได้กี่คน?', 'ตั้งแต่ 2 คน ไปจนถึง 145 คน…'], ['ต้องจองล่วงหน้ากี่วัน และยกเลิกได้ไหม?', 'แนะนำจองล่วงหน้า 3–7 วัน…'], ['ออกเรือจากท่าไหน?', 'เรือของเราออกจาก Royal Phuket Marina…']] };
function vContent() {
  const tabs = [['hero', 'Hero หน้าแรก'], ['promo', 'แบนเนอร์โปรโมชั่น'], ['faq', 'FAQ'], ['seo', 'SEO หน้าหลัก']];
  let body = '';
  if (CONTENT.tab === 'hero') body = `<div class="grid md:grid-cols-2 gap-4"><label><span class="lbl">ป้ายเล็กด้านบน</span><input class="inp" value="Yacht Charter ภูเก็ต"/></label><label><span class="lbl">หัวข้อหลัก</span><input class="inp" value="ล่องทะเลอันดามัน"/></label>
      <label class="md:col-span-2"><span class="lbl">คำที่หมุนเปลี่ยนตามสไลด์ (คั่นด้วย ,)</span><input class="inp" value="${CONTENT.heroWords.join(', ')}"/></label><label class="md:col-span-2"><span class="lbl">คำอธิบาย</span><input class="inp" value="เรือส่วนตัว 70 ลำ · ภูเก็ต กระบี่ พังงา"/></label></div>
      <p class="font-medium mt-6 mb-3">สไลด์รูปเรือ <span class="text-muted font-normal">(ลากเพื่อเรียงลำดับ)</span></p>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">${CONTENT.heroSlides.map((s, i) => `<div class="rounded-xl overflow-hidden ring-1 ring-line"><img src="${THUMBS[s]}" class="w-full aspect-[16/10] object-cover"/><div class="p-2 flex items-center justify-between"><span class="text-[12px] truncate">${i + 1}. ${bySlug(s).name}</span><button class="text-muted hover:text-maroon" onclick="CONTENT.heroSlides.splice(${i},1);vContent()"><i data-lucide="x" class="w-3.5 h-3.5"></i></button></div></div>`).join('')}
      <button class="rounded-xl border-2 border-dashed border-sand-200 grid place-items-center text-muted hover:text-maroon min-h-[120px]" onclick="CONTENT.heroSlides.push(FLEET.find(b=>!CONTENT.heroSlides.includes(b.slug)).slug);vContent()"><i data-lucide="plus" class="w-5 h-5"></i></button></div>`;
  if (CONTENT.tab === 'promo') body = `<div class="grid md:grid-cols-[1fr_320px] gap-6"><div class="grid gap-4"><label><span class="lbl">ป้าย</span><input class="inp" value="OVERNIGHT CHARTER"/></label><label><span class="lbl">หัวข้อ</span><input class="inp" value="นอนกลางทะเล ตื่นมากับพระอาทิตย์ขึ้นที่อันดามัน"/></label><label><span class="lbl">รายละเอียด</span><textarea class="inp" rows="3">แพ็กเกจ 2 วัน 1 คืน บนเรือยอชต์ VTECH 68 ฟุต รวมอาหารทุกมื้อ</textarea></label>
      <div class="grid grid-cols-2 gap-3"><label><span class="lbl">เรือที่ลิงก์ไป</span><select class="inp">${FLEET.map(b => `<option ${b.slug === 'vtech-68-ft' ? 'selected' : ''}>${b.name}</option>`).join('')}</select></label><label><span class="lbl">ราคาที่แสดง</span><input class="inp" value="375,000"/></label></div>
      <div class="grid grid-cols-2 gap-3"><label><span class="lbl">เริ่มแสดง</span><input type="date" class="inp" value="${iso(TODAY)}"/></label><label><span class="lbl">สิ้นสุด</span><input type="date" class="inp" value="${iso(addDays(TODAY, 60))}"/></label></div></div>
      <div><p class="lbl">ตัวอย่าง</p><div class="rounded-xl overflow-hidden bg-maroon text-white"><img src="${THUMBS['vtech-68-ft']}" class="w-full aspect-[16/9] object-cover"/><div class="p-4"><p class="text-[10px] tracking-widest opacity-80">OVERNIGHT CHARTER</p><p class="mt-1">นอนกลางทะเล ตื่นมากับพระอาทิตย์ขึ้นที่อันดามัน</p><p class="mt-2 text-[12px] opacity-80">เริ่มต้น ฿375,000</p></div></div></div></div>`;
  if (CONTENT.tab === 'faq') body = `<div class="space-y-3">${CONTENT.faq.map(([q, a], i) => `<div class="rounded-xl ring-1 ring-line p-3 grid gap-2"><div class="flex gap-2 items-center"><i data-lucide="grip-vertical" class="w-4 h-4 text-muted cursor-grab"></i><input class="inp !h-8 font-medium" value="${esc(q)}"/><button class="btn btn-g !px-2" onclick="CONTENT.faq.splice(${i},1);vContent()"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div><textarea class="inp" rows="2">${esc(a)}</textarea></div>`).join('')}<button class="btn btn-o" onclick="CONTENT.faq.push(['',''] );vContent()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มคำถาม</button></div><p class="text-[12px] text-muted mt-4">FAQ ส่งออกเป็น FAQPage schema ให้ Google อัตโนมัติ</p>`;
  if (CONTENT.tab === 'seo') body = `<div class="grid gap-4 max-w-2xl"><label><span class="lbl">Title หน้าแรก (TH)</span><input class="inp" value="Yacht Charter ภูเก็ต – เช่าเรือยอชต์ 70 ลำ | Boat Trip Thailand"/></label><label><span class="lbl">Title หน้าแรก (EN)</span><input class="inp" value="Yacht Charter Phuket – 70 Private Boats | Boat Trip Thailand"/></label><label><span class="lbl">Meta description (TH)</span><textarea class="inp" rows="3">Yacht Charter ภูเก็ต เช่าเรือยอชต์ส่วนตัว คาตามารัน สปีดโบ๊ท 70 ลำ ไปพีพี อ่าวพังงา เกาะราชา…</textarea></label><label><span class="lbl">รูป OG (แชร์ลงโซเชียล)</span><div class="flex gap-3 items-center"><img src="${THUMBS['leopard-90-ft']}" class="w-40 aspect-[1200/630] object-cover rounded-lg"/><button class="btn btn-o">เปลี่ยนรูป</button></div></label></div>`;
  $('#view').innerHTML = `${head('เนื้อหาเว็บไซต์', 'แก้ไขข้อความ รูป และ SEO โดยไม่ต้องแก้โค้ด', `<button class="btn btn-o" onclick="window.open('boattripthailand-mockup.html','_blank')"><i data-lucide="eye" class="w-3.5 h-3.5"></i>Preview</button><button class="btn btn-p" onclick="toast('เผยแพร่การเปลี่ยนแปลงแล้ว')"><i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>เผยแพร่</button>`)}
    <div class="card"><div class="px-3 pt-3 pb-3 flex gap-1 overflow-x-auto no-sb border-b border-line">${tabs.map(([k, l]) => `<button class="tab ${CONTENT.tab === k ? 'on' : ''}" onclick="CONTENT.tab='${k}';vContent()">${l}</button>`).join('')}</div><div class="p-5 fade">${body}</div></div>`;
  icons();
}

/* ---------- Customers ---------- */
let CQ = '';
function vCustomers() {
  const stats = c => { const bs = BOOKINGS.filter(b => b.cust === c.id && b.status !== 'cancel'); return { n: bs.length, spend: bs.reduce((s, b) => s + b.total, 0), last: bs.map(b => b.date).sort().pop() }; };
  const list = CUSTOMERS.filter(c => !CQ || (c.name + c.phone + c.email).toLowerCase().includes(CQ.toLowerCase())).map(c => ({ c, s: stats(c) })).sort((a, b) => b.s.spend - a.s.spend);
  $('#view').innerHTML = `${head('ลูกค้า', `${CUSTOMERS.length} ราย`, `<input class="inp !w-64" placeholder="ค้นหาชื่อ เบอร์ อีเมล" value="${esc(CQ)}" oninput="CQ=this.value;clearTimeout(window._cq);window._cq=setTimeout(()=>{vCustomers();const i=$('#view input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"/>`)}
    <div class="card overflow-x-auto"><table class="tbl"><thead><tr><th>ลูกค้า</th><th>ติดต่อ</th><th>ช่องทางแรก</th><th>จำนวนทริป</th><th>ทริปล่าสุด</th><th class="text-right">ยอดรวม</th></tr></thead><tbody>
      ${list.map(({ c, s }) => `<tr class="click" onclick="custDetail('${c.id}')"><td><div class="flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-sand grid place-items-center text-[12px]">${esc(c.name.slice(0, 1))}</span><div><p>${esc(c.name)} ${c.tags.map(t => `<span class="pill ${t === 'VIP' ? 'st-deposit' : 'st-new'} ml-1">${t}</span>`).join('')}</p><p class="text-[11px] text-muted">${c.country} · ${c.id}</p></div></div></td>
        <td><p class="tnum">${c.phone}</p><p class="text-[11px] text-muted">${c.email}</p></td><td class="text-muted">${c.channel}</td><td class="tnum">${s.n}</td><td class="text-muted">${s.last ? fmtD(s.last) : '—'}</td><td class="text-right tnum">${baht(s.spend)}</td></tr>`).join('')}
    </tbody></table></div>`;
  icons();
}
function custDetail(id) { const c = custOf(id), bs = BOOKINGS.filter(b => b.cust === id);
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line"><p class="font-medium">${esc(c.name)}</p><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 space-y-5"><dl class="grid grid-cols-2 gap-3"><div><dt class="lbl">ประเทศ</dt><dd>${c.country}</dd></div><div><dt class="lbl">ช่องทาง</dt><dd>${c.channel}</dd></div><div><dt class="lbl">โทร</dt><dd class="tnum">${c.phone}</dd></div><div><dt class="lbl">อีเมล</dt><dd class="break-all">${c.email}</dd></div></dl>
    <div><p class="lbl">ประวัติการจอง (${bs.length})</p><ul class="space-y-2">${bs.map(b => `<li class="flex items-center gap-3 p-2 rounded-xl ring-1 ring-line cursor-pointer" onclick="bookingDetail('${b.id}')">${thumb(b.boat, 'w-12 h-9')}<div class="flex-1 min-w-0"><p class="truncate">${bySlug(b.boat).name}</p><p class="text-[11px] text-muted">${fmtD(b.date)} · ${b.guests} คน</p></div>${pill(b.status)}</li>`).join('') || '<li class="text-muted">ยังไม่มีการจอง</li>'}</ul></div>
    <label class="block"><span class="lbl">บันทึกเกี่ยวกับลูกค้า</span><textarea class="inp" rows="3" placeholder="เช่น ชอบเรือใบ แพ้กุ้ง…"></textarea></label></div>`); }

/* ---------- Team ---------- */
function vTeam() {
  const st = t => { const bs = BOOKINGS.filter(b => b.sales === t.id && b.status !== 'cancel'); return { n: bs.length, rev: bs.reduce((s, b) => s + b.total, 0), open: bs.filter(b => ['new', 'quote', 'deposit'].includes(b.status)).length, conv: Math.round(bs.filter(b => ['confirmed', 'done'].includes(b.status)).length / Math.max(1, bs.length) * 100) }; };
  $('#view').innerHTML = `${head('ทีมเซลล์', 'สถานะออนไลน์แสดงบนหน้าเว็บ · คำขอใหม่กระจายให้เซลล์ที่ออนไลน์อัตโนมัติ', `<button class="btn btn-p" onclick="toast('เชิญสมาชิกใหม่ (จำลอง)')"><i data-lucide="user-plus" class="w-3.5 h-3.5"></i>เพิ่มสมาชิก</button>`)}
    <div class="grid md:grid-cols-3 gap-4">${TEAM.map((t, i) => { const s = st(t); return `<div class="card p-5"><div class="flex items-center gap-3"><img src="${TEAM_IMG[t.id]}" class="w-12 h-12 rounded-full object-cover"/><div class="flex-1"><p class="font-medium">${t.name}</p><p class="text-[11px] text-muted">${t.role} · ${t.tel}</p></div><label class="flex items-center gap-2 text-[11px] text-muted">${t.online ? 'ออนไลน์' : 'ออฟไลน์'}<span class="tgl"><input type="checkbox" ${t.online ? 'checked' : ''} onchange="TEAM[${i}].online=this.checked;vTeam()"/><span></span></span></label></div>
      <div class="grid grid-cols-2 gap-3 mt-5"><div class="rounded-xl bg-sand p-3"><p class="text-[11px] text-muted">ยอดจอง</p><p class="font-medium tnum mt-1">${baht(s.rev)}</p></div><div class="rounded-xl bg-sand p-3"><p class="text-[11px] text-muted">ทริป</p><p class="font-medium tnum mt-1">${s.n}</p></div><div class="rounded-xl bg-sand p-3"><p class="text-[11px] text-muted">งานค้าง</p><p class="font-medium tnum mt-1">${s.open}</p></div><div class="rounded-xl bg-sand p-3"><p class="text-[11px] text-muted">ปิดการขาย</p><p class="font-medium tnum mt-1">${s.conv}%</p></div></div>
      <button class="btn btn-o w-full mt-4" onclick="BK.sales='${t.id}';BK.tab='all';go('bookings')">ดูงานของ ${t.name}</button></div>`; }).join('')}</div>
    <div class="card p-5 mt-4 max-w-2xl"><p class="font-medium">การกระจายคำขอ</p><div class="mt-3 space-y-3">${[['วนตามลำดับ (Round-robin) เฉพาะคนที่ออนไลน์', true], ['ส่งแจ้งเตือน LINE / WhatsApp เมื่อมีคำขอใหม่', true], ['ถ้าไม่ตอบใน 30 นาที ส่งต่อให้คนถัดไป', false]].map(([l, on]) => `<label class="flex items-center justify-between gap-3"><span>${l}</span><span class="tgl"><input type="checkbox" ${on ? 'checked' : ''}/><span></span></span></label>`).join('')}</div></div>`;
  icons();
}

/* ---------- Settings ---------- */
const SET = { fx: 33.42, deposit: 50, balanceHrs: 24, card: 3.5, amex: 4.76, low: ['05-01', '10-31'], high: ['11-01', '04-30'], peak: ['12-20', '01-10'] };
function vSettings() {
  $('#view').innerHTML = `${head('ตั้งค่า', 'ค่าที่ใช้คำนวณราคาและเงื่อนไขบนหน้าเว็บ', `<button class="btn btn-p" onclick="toast('บันทึกการตั้งค่าแล้ว')"><i data-lucide="save" class="w-3.5 h-3.5"></i>บันทึก</button>`)}
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div class="card p-5"><p class="font-medium">สกุลเงิน</p><p class="text-[12px] text-muted mt-1">หน้าเว็บภาษาอังกฤษแสดงราคาเป็น USD โดยแปลงจากราคาบาท</p>
        <div class="grid grid-cols-2 gap-3 mt-4"><label><span class="lbl">1 USD = ? THB</span><input class="inp tnum" value="${SET.fx}" oninput="SET.fx=+this.value;$('#fxEx').textContent='฿16,000 ≈ $'+Math.round(16000/SET.fx).toLocaleString()"/></label><label><span class="lbl">อัปเดตอัตโนมัติ</span><select class="inp"><option>ทุกวัน 09:00 (Wise mid-market)</option><option>ตั้งเอง</option></select></label></div>
        <p id="fxEx" class="text-[12px] text-muted mt-2">฿16,000 ≈ $${Math.round(16000 / SET.fx)}</p></div>
      <div class="card p-5"><p class="font-medium">ฤดูกาล</p><p class="text-[12px] text-muted mt-1">ใช้เลือกคอลัมน์ราคาอัตโนมัติตามวันที่ลูกค้าเลือก</p>
        <div class="mt-4 space-y-3">${[['low', 'Low Season'], ['high', 'High Season'], ['peak', 'Peak Season (ปีใหม่)']].map(([k, l]) => `<div class="grid grid-cols-[1fr_110px_110px] gap-2 items-center"><span>${l}</span><input class="inp tnum" value="${SET[k][0]}"/><input class="inp tnum" value="${SET[k][1]}"/></div>`).join('')}</div></div>
      <div class="card p-5"><p class="font-medium">การชำระเงิน</p>
        <div class="grid grid-cols-2 gap-3 mt-4"><label><span class="lbl">มัดจำ (%)</span><input class="inp" value="${SET.deposit}"/></label><label><span class="lbl">ชำระส่วนที่เหลือก่อนออกเรือ (ชม.)</span><input class="inp" value="${SET.balanceHrs}"/></label><label><span class="lbl">ค่าธรรมเนียม Visa/Master (%)</span><input class="inp" value="${SET.card}"/></label><label><span class="lbl">ค่าธรรมเนียม AMEX/UnionPay (%)</span><input class="inp" value="${SET.amex}"/></label></div>
        <div class="mt-4 rounded-xl bg-sand p-3 text-[12px]"><p class="text-muted">บัญชีรับโอน</p><p class="mt-1">KASIKORN BANK · 213-1-65737-7 · Boat Trip (Thailand) Co., Ltd.</p></div></div>
      <div class="card p-5"><p class="font-medium">นโยบายยกเลิก</p>
        <div class="mt-4 space-y-2">${[['น้อยกว่า 48 ชม.', 30], ['น้อยกว่า 24 ชม.', 50], ['น้อยกว่า 12 ชม. / ไม่มา', 100]].map(([l, v]) => `<div class="grid grid-cols-[1fr_100px] gap-2 items-center"><span>${l}</span><div class="relative"><input class="inp pr-8 tnum" value="${v}"/><span class="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span></div></div>`).join('')}</div></div>
      <div class="card p-5 xl:col-span-2"><div class="flex items-center justify-between"><p class="font-medium">ผู้ใช้งาน & สิทธิ์</p><button class="btn btn-o" onclick="toast('เชิญผู้ใช้ (จำลอง)')"><i data-lucide="user-plus" class="w-3.5 h-3.5"></i>เชิญ</button></div>
        <div class="overflow-x-auto mt-3"><table class="tbl"><thead><tr><th>ชื่อ</th><th>สิทธิ์</th><th>การจอง</th><th>เรือ & ราคา</th><th>เนื้อหาเว็บ</th><th>ตั้งค่า</th></tr></thead><tbody>
          ${[['Kwang', 'Admin', 1, 1, 1, 1], ['Save', 'Sales', 1, 0, 0, 0], ['Prang', 'Sales', 1, 0, 0, 0], ['Marketing', 'Editor', 0, 0, 1, 0]].map(r => `<tr><td>${r[0]}</td><td><span class="pill ${r[1] === 'Admin' ? 'st-deposit' : r[1] === 'Editor' ? 'st-new' : 'st-confirmed'}">${r[1]}</span></td>${r.slice(2).map(v => `<td><i data-lucide="${v ? 'check' : 'minus'}" class="w-4 h-4 ${v ? 'text-maroon' : 'text-sand-200'}"></i></td>`).join('')}</tr>`).join('')}
        </tbody></table></div></div>
    </div>`;
  icons();
}

/* =====================================================================
   ROUTER / NAV
   ===================================================================== */
const PAGES = [
  ['dashboard', 'แดชบอร์ด', 'layout-dashboard', vDashboard], ['bookings', 'การจอง', 'inbox', vBookings], ['calendar', 'ปฏิทินเรือ', 'calendar-days', vCalendar],
  ['—', 'สินค้า'], ['boats', 'เรือ & ราคา', 'sailboat', vBoats], ['activities', 'กิจกรรม & ทัวร์', 'ticket', vActivities], ['content', 'เนื้อหาเว็บไซต์', 'layout-template', vContent],
  ['—', 'ลูกค้า & ทีม'], ['customers', 'ลูกค้า', 'users', vCustomers], ['team', 'ทีมเซลล์', 'headset', vTeam], ['settings', 'ตั้งค่า', 'settings', vSettings],
];
let CUR = 'dashboard';
function go(p) { location.hash = '#/' + p; }
function rerender() { route(); }
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'dashboard', [p, arg] = h.split('/');
  CUR = PAGES.find(x => x[0] === p) ? p : 'dashboard';
  const pg = PAGES.find(x => x[0] === CUR);
  const newCnt = BOOKINGS.filter(b => b.status === 'new').length;
  $('#nav').innerHTML = PAGES.map(x => x[0] === '—' ? `<p class="px-3 pt-5 pb-1.5 text-[10px] uppercase tracking-[.16em] text-muted">${x[1]}</p>` : `<a href="#/${x[0]}" class="nav-i ${x[0] === CUR ? 'on' : ''}"><i data-lucide="${x[2]}" class="w-[18px] h-[18px]"></i>${x[1]}${x[0] === 'bookings' && newCnt ? `<span class="cnt">${newCnt}</span>` : ''}</a>`).join('');
  $('#pageTitle').textContent = pg[1]; $('#crumb').textContent = 'Boat Trip Thailand · ระบบหลังบ้าน';
  if (CUR === 'boats' && arg) { $('#pageTitle').textContent = 'แก้ไขเรือ'; vBoatEdit(arg); } else pg[3]();
  toggleSide(false); icons();
}
window.addEventListener('hashchange', () => { closeDrawer(); route(); scrollTo(0, 0); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeModal(); } });
$('#gq').addEventListener('keydown', e => { if (e.key === 'Enter') { BK.q = e.target.value; BK.tab = 'all'; go('bookings'); if (CUR === 'bookings') vBookings(); } });
$('#meAva').src = TEAM_IMG.kwang;
route();
