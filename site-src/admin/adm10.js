/* =====================================================================
   ACTIVITY PHOTOS: cover + gallery shown on the website card & detail
   ===================================================================== */
ACTS.forEach(a => { a.imgs = a.pic && ACTIMG[a.pic] ? ACTIMG[a.pic].slice() : []; });
const actThumb = (a, cls = 'w-14 h-10') => a.imgs.length ? `<img src="${a.imgs[0]}" class="${cls} rounded-lg object-cover shrink-0"/>` : `<span class="${cls} rounded-lg bg-sand grid place-items-center shrink-0 ring-1 ring-inset ring-[#e9b9bd]" title="ยังไม่มีรูป"><i data-lucide="image-off" class="w-4 h-4 text-[#c47a82]"></i></span>`;
const _vActivities10 = vActivities;
vActivities = function () {
  _vActivities10();
  const list = ACTS.filter(a => !AF.cat || a.cat === AF.cat), noImg = ACTS.filter(a => !a.imgs.length).length;
  $$('#view tbody tr').forEach((r, n) => { const a = list[n], i = ACTS.indexOf(a), td = r.children[0];
    td.innerHTML = `<div class="flex items-center gap-3 min-w-[260px]"><button onclick="actEdit(${i})" class="relative" title="จัดการรูป">${actThumb(a)}${a.imgs.length > 1 ? `<span class="absolute -bottom-1 -right-1 text-[9.5px] leading-4 px-1 rounded bg-ink text-white tnum">${a.imgs.length}</span>` : ''}</button><div class="min-w-0">${td.innerHTML}</div></div>`; });
  const sub = $('#view h2 + p'); if (sub && noImg) sub.insertAdjacentHTML('beforeend', ` · <span class="text-[#a3222c]">${noImg} รายการยังไม่มีรูป</span>`);
  $$('#view tbody input[type=checkbox]').forEach(cb => cb.setAttribute('onchange', cb.getAttribute('onchange').replace(/if\(this\.checked&&!ACTS\[\d+\]\.price\)\{[^}]*\}/, '')));
  icons();
};
function actImgBox(i) {
  const a = ACTS[i], I = a.imgs;
  return `<div id="actImgs"><div class="flex items-center justify-between mb-1.5"><span class="lbl !mb-0">รูปภาพ · ${I.length} รูป</span><span class="text-[10.5px] text-muted">รูปแรก = รูปปกบนการ์ดหน้าเว็บ</span></div>
    ${I.length ? `<div class="relative rounded-xl overflow-hidden ring-1 ring-line"><img src="${I[0]}" class="w-full aspect-[4/3] object-cover"/><span class="absolute top-2 left-2 pill bg-white/90 text-ink">รูปปก</span></div>` : `<div class="rounded-xl aspect-[4/3] bg-sand grid place-items-center text-center text-muted text-[12px] ring-1 ring-inset ring-[#e9b9bd]"><div><i data-lucide="image-off" class="w-6 h-6 mx-auto mb-1 text-[#c47a82]"></i>ยังไม่มีรูป · หน้าเว็บจะแสดงพื้นหลังสีตามหมวดแทน</div></div>`}
    <div class="grid grid-cols-4 gap-2 mt-2">${I.map((s, n) => `<div class="group relative rounded-lg overflow-hidden ring-1 ${n ? 'ring-line' : 'ring-maroon ring-2'}"><img src="${s}" class="w-full aspect-square object-cover"/>
      <div class="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-end justify-center gap-0.5 p-1">
        ${n ? `<button class="w-6 h-6 grid place-items-center rounded bg-white/90" title="ตั้งเป็นรูปปก" onclick="actImg(${i},'cover',${n})"><i data-lucide="star" class="w-3 h-3"></i></button><button class="w-6 h-6 grid place-items-center rounded bg-white/90" title="เลื่อนซ้าย" onclick="actImg(${i},'move',${n},-1)"><i data-lucide="chevron-left" class="w-3 h-3"></i></button>` : ''}
        ${n < I.length - 1 ? `<button class="w-6 h-6 grid place-items-center rounded bg-white/90" title="เลื่อนขวา" onclick="actImg(${i},'move',${n},1)"><i data-lucide="chevron-right" class="w-3 h-3"></i></button>` : ''}
        <button class="w-6 h-6 grid place-items-center rounded bg-white/90 text-[#a3222c]" title="ลบรูป" onclick="actImg(${i},'del',${n})"><i data-lucide="trash-2" class="w-3 h-3"></i></button></div></div>`).join('')}
      <label class="rounded-lg aspect-square grid place-items-center text-center text-[11px] text-muted cursor-pointer border border-dashed border-[#d9cfcf] hover:border-maroon hover:text-maroon" ondragover="event.preventDefault()" ondrop="event.preventDefault();readFiles(event.dataTransfer.files,s=>actImg(${i},'add',s))"><span><i data-lucide="image-plus" class="w-5 h-5 mx-auto mb-0.5"></i>เพิ่มรูป</span><input type="file" accept="image/*" multiple class="hidden" onchange="readFiles(this.files,s=>actImg(${i},'add',s))"/></label></div>
    <p class="text-[10.5px] text-muted mt-1.5">ลากไฟล์มาวางได้ · แนะนำแนวนอน 1600×1200 · ระบบจริงย่อและแปลงเป็น WebP อัตโนมัติ · ชี้ที่รูปเพื่อตั้งปก เรียงลำดับ หรือลบ</p></div>`;
}
function actImg(i, op, n, d) {
  const I = ACTS[i].imgs;
  if (op === 'add') { I.push(...n); toast(`เพิ่ม ${n.length} รูปแล้ว`); }
  if (op === 'del') { I.splice(n, 1); toast('ลบรูปแล้ว'); }
  if (op === 'cover') { I.unshift(I.splice(n, 1)[0]); toast('ตั้งเป็นรูปปกแล้ว'); }
  if (op === 'move') { const j = n + d; I.splice(j, 0, I.splice(n, 1)[0]); }
  $('#actImgs').outerHTML = actImgBox(i); icons();
  if (CUR === 'activities' && $('#view tbody')) { const sc = $('#drawer .overflow-y-auto')?.scrollTop; vActivities(); }
}
const _actEdit10 = actEdit;
actEdit = function (i) { _actEdit10(i); $('#drawer .overflow-y-auto').insertAdjacentHTML('afterbegin', actImgBox(i)); icons(); };
PAGES.find(p => p[0] === 'activities')[3] = vActivities;


