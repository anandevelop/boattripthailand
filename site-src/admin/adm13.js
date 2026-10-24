/* =====================================================================
   MEDIA LIBRARY – one place for every image; pickers everywhere use it
   ===================================================================== */
const MDIR = [['all', 'ทั้งหมด', 'images'], ['boat', 'เรือ', 'sailboat'], ['act', 'กิจกรรม & ทัวร์', 'ticket'], ['blog', 'บทความ', 'newspaper'], ['brand', 'แบรนด์ & โฆษณา', 'megaphone'], ['new', 'อัปโหลดใหม่', 'upload']];
const MSMART = [['unused', 'ยังไม่ได้ใช้', 'circle-dashed'], ['noalt', 'ไม่มี Alt text', 'circle-alert'], ['norights', 'ยังไม่ยืนยันสิทธิ์โฆษณา', 'shield-alert']];
const RIGHTS = { own: ['ถ่ายเอง · ใช้ได้ทุกช่องทาง', 'ok'], ads: ['ได้รับอนุญาต · ใช้โฆษณาได้', 'ok'], web: ['ใช้บนเว็บได้ · ยังไม่ยืนยันโฆษณา', 'mid'], unknown: ['ยังไม่ทราบ · ต้องถามเจ้าของ', 'low'] };
const ML = { dir: 'all', smart: '', q: '', sort: 'new', view: 'grid', sel: new Set(), pick: null, multi: false };
let MEDIA = [], _mid = 0;
const mkMedia = (src, o) => ({ id: ++_mid, src, name: o.name, dir: o.dir, tags: o.tags || [], alt: o.alt || tr(), source: o.source || 'brochure', rights: o.rights || 'unknown', credit: o.credit || '', focal: { x: 50, y: 50 }, date: o.date || iso(addDays(TODAY, -Math.floor((_mid * 37) % 120))), owner: o.owner || '' });
(function seedMedia() {
  FLEET.forEach(b => THUMBS[b.slug] && MEDIA.push(mkMedia(THUMBS[b.slug], { name: `${b.slug}.webp`, dir: 'boat', tags: [TYPE_TH[b.type] || b.type, b.marinaP?.split(' ')[0]].filter(Boolean), alt: tr(`เรือ ${b.name} เช่าเรือส่วนตัวภูเก็ต`, `${b.name} private yacht charter in Phuket`), source: 'brochure', rights: 'unknown', credit: 'โบรชัวร์เจ้าของเรือ', owner: b.name })));
  const seen = new Set();
  ACTS.forEach(a => (a.imgs || []).forEach((s, n) => { if (seen.has(s)) return; seen.add(s);
    MEDIA.push(mkMedia(s, { name: `${slugify(a.en || a.th)}-${n + 1}.webp`, dir: 'act', tags: [ACAT[a.cat]].filter(Boolean), alt: n ? tr() : tr(a.th, a.en), source: 'supplier', rights: 'web', credit: a.op ? `ซัพพลายเออร์ · ${a.op}` : 'PDF ซัพพลายเออร์', owner: a.en })); }));
})();
const mById = id => MEDIA.find(m => m.id === +id);
function mUsage() {
  const U = new Map(), add = (src, l, g) => { if (!src) return; (U.get(src) || U.set(src, []).get(src)).push([l, g]); };
  FLEET.forEach(b => add(THUMBS[b.slug], `หน้าเรือ · ${b.name}`, `boatEdit('${b.slug}')`));
  (CONTENT.heroSlides || []).forEach(s => add(THUMBS[s], 'สไลด์ Hero หน้าแรก', `go('content')`));
  ART.forEach(a => { add(THUMBS[a.cover] || a.coverSrc, `ปกบทความ · ${a.title.th || a.title.en}`, `go('articles/${a.id}')`);
    Object.values(a.blocks || {}).flat().forEach(b => [b.src, ...(b.cells || []).map(c => c.src), ...(Array.isArray(b.cols) ? b.cols : []).map(c => c.src)].forEach(s => add(s, `ในบทความ · ${a.title.th || a.title.en}`, `go('articles/${a.id}')`))); });
  ACTS.forEach((a, i) => (a.imgs || []).forEach((s, n) => add(s, `${n ? 'แกลเลอรี' : 'รูปปก'} · ${a.th || a.en}`, `go('activities');setTimeout(()=>actEdit(${i}),60)`)));
  return U;
}
const kb = s => Math.round((s.length - 23) * .75 / 1024);
function mFilter(U) {
  const q = ML.q.toLowerCase();
  let L = MEDIA.filter(m => (ML.dir === 'all' || m.dir === ML.dir) && (!q || (m.name + ' ' + m.tags.join(' ') + ' ' + m.alt.th + ' ' + m.alt.en + ' ' + m.owner).toLowerCase().includes(q)));
  if (ML.smart === 'unused') L = L.filter(m => !U.get(m.src)); if (ML.smart === 'noalt') L = L.filter(m => !m.alt.th.trim() || !m.alt.en.trim()); if (ML.smart === 'norights') L = L.filter(m => !['own', 'ads'].includes(m.rights));
  return L.sort((a, b) => ML.sort === 'name' ? a.name.localeCompare(b.name) : ML.sort === 'size' ? kb(b.src) - kb(a.src) : b.date.localeCompare(a.date) || b.id - a.id);
}
function mTile(m, U, pick) {
  const u = (U.get(m.src) || []).length, noAlt = !m.alt.th.trim() || !m.alt.en.trim(), on = ML.sel.has(m.id);
  return `<div class="m-tile group ${on ? 'on' : ''}" onclick="${pick ? `mPickToggle(${m.id})` : `mDetail(${m.id})`}">
    <div class="relative aspect-square overflow-hidden rounded-[10px] bg-sand"><img loading="lazy" src="${m.src}" class="w-full h-full object-cover" style="object-position:${m.focal.x}% ${m.focal.y}%"/>
      <button class="m-chk" onclick="event.stopPropagation();${pick ? `mPickToggle(${m.id})` : `mSel(${m.id})`}" aria-label="select"><i data-lucide="check" class="w-3 h-3"></i></button>
      <div class="absolute left-1.5 bottom-1.5 flex gap-1">${u ? `<span class="m-b">ใช้ ${u}</span>` : '<span class="m-b !bg-white/90 !text-muted">ไม่ได้ใช้</span>'}${noAlt ? '<span class="m-b !bg-[#a3222c]">Alt</span>' : ''}${m.rights === 'unknown' ? '<span class="m-b !bg-[#b4501a]" title="ยังไม่ทราบสิทธิ์">©?</span>' : ''}</div></div>
    <p class="mt-1.5 text-[11.5px] truncate">${esc(m.name)}</p></div>`;
}
function vMedia() {
  const U = mUsage(), L = mFilter(U), tot = MEDIA.reduce((s, m) => s + kb(m.src), 0);
  const cnt = k => k === 'all' ? MEDIA.length : MEDIA.filter(m => m.dir === k).length;
  const sc = { unused: MEDIA.filter(m => !U.get(m.src)).length, noalt: MEDIA.filter(m => !m.alt.th.trim() || !m.alt.en.trim()).length, norights: MEDIA.filter(m => !['own', 'ads'].includes(m.rights)).length };
  $('#view').innerHTML = `${head('คลังสื่อ', 'รูปทุกรูปของเว็บอยู่ที่นี่ · อัปโหลดครั้งเดียว ใช้ได้ทุกหน้า', `<label class="btn btn-p cursor-pointer"><i data-lucide="upload" class="w-3.5 h-3.5"></i>อัปโหลด<input type="file" accept="image/*" multiple class="hidden" onchange="readFiles(this.files,mUpload)"/></label>`)}
    <div class="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start" ondragover="event.preventDefault();$('#mDrop').classList.remove('hidden')">
      <aside class="card p-2 lg:sticky lg:top-20">
        <p class="px-2.5 pt-2 pb-1 text-[10px] uppercase tracking-[.16em] text-muted">โฟลเดอร์</p>
        ${MDIR.map(([k, l, ic]) => `<button class="nav-i !h-9 ${ML.dir === k && !ML.smart ? 'on' : ''}" onclick="ML.dir='${k}';ML.smart='';ML.sel.clear();vMedia()"><i data-lucide="${ic}" class="w-4 h-4"></i>${l}<span class="ml-auto text-[11px] text-muted tnum">${cnt(k)}</span></button>`).join('')}
        <p class="px-2.5 pt-4 pb-1 text-[10px] uppercase tracking-[.16em] text-muted">ต้องจัดการ</p>
        ${MSMART.map(([k, l, ic]) => `<button class="nav-i !h-9 ${ML.smart === k ? 'on' : ''}" onclick="ML.smart='${k}';ML.dir='all';ML.sel.clear();vMedia()"><i data-lucide="${ic}" class="w-4 h-4"></i>${l}<span class="ml-auto text-[11px] tnum ${sc[k] ? 'text-[#a3222c]' : 'text-muted'}">${sc[k]}</span></button>`).join('')}
        <div class="px-2.5 pt-4 pb-2"><div class="flex justify-between text-[11px] text-muted"><span>พื้นที่ที่ใช้</span><span class="tnum">${(tot / 1024).toFixed(1)} MB</span></div><div class="mt-1 h-1.5 rounded-full bg-sand overflow-hidden"><div class="h-full bg-maroon rounded-full" style="width:${Math.min(100, tot / 1024 / 50 * 100)}%"></div></div><p class="text-[10.5px] text-muted mt-1">${MEDIA.length} ไฟล์ · ขนาดรูปย่อในตัวอย่าง</p></div>
      </aside>
      <div class="min-w-0">
        <div class="card p-3 flex flex-col md:flex-row md:items-center gap-2 mb-3">
          <label class="flex items-center gap-2 h-9 px-3 rounded-full bg-sand flex-1 min-w-0"><i data-lucide="search" class="w-4 h-4 text-muted shrink-0"></i><input class="bg-transparent w-full text-[13px]" placeholder="ค้นหาชื่อไฟล์ แท็ก Alt text ชื่อเรือ…" value="${esc(ML.q)}" onkeydown="if(event.key==='Enter'){ML.q=this.value;vMedia()}"/></label>
          <div class="flex items-center gap-2"><select class="inp !h-9 !w-auto" onchange="ML.sort=this.value;vMedia()">${[['new', 'ใหม่ล่าสุด'], ['name', 'ชื่อ A–Z'], ['size', 'ขนาดใหญ่สุด']].map(([v, l]) => `<option value="${v}" ${ML.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <div class="flex p-0.5 rounded-full bg-sand">${[['grid', 'layout-grid'], ['list', 'list']].map(([v, ic]) => `<button class="h-8 w-9 grid place-items-center rounded-full ${ML.view === v ? 'bg-white shadow-sm' : 'text-muted'}" onclick="ML.view='${v}';vMedia()"><i data-lucide="${ic}" class="w-4 h-4"></i></button>`).join('')}</div></div></div>
        ${ML.sel.size ? `<div class="rounded-xl bg-ink text-white px-4 py-2.5 mb-3 flex flex-wrap items-center gap-2 text-[12.5px]"><span>เลือก ${ML.sel.size} ไฟล์</span><span class="flex-1"></span>
          <select class="h-8 rounded-full bg-white/10 px-3 text-[12px]" onchange="if(this.value)mBulk('move',this.value)"><option value="">ย้ายไปโฟลเดอร์…</option>${MDIR.slice(1).map(([k, l]) => `<option value="${k}" class="text-ink">${l}</option>`).join('')}</select>
          <input class="h-8 rounded-full bg-white/10 px-3 text-[12px] w-32 placeholder:text-white/50" placeholder="+ แท็ก แล้วกด Enter" onkeydown="if(event.key==='Enter'&&this.value.trim())mBulk('tag',this.value.trim())"/>
          <select class="h-8 rounded-full bg-white/10 px-3 text-[12px]" onchange="if(this.value)mBulk('rights',this.value)"><option value="">ตั้งสิทธิ์การใช้…</option>${Object.entries(RIGHTS).map(([k, [l]]) => `<option value="${k}" class="text-ink">${l}</option>`).join('')}</select>
          <button class="h-8 px-3 rounded-full bg-white/10 hover:bg-[#a3222c]" onclick="mBulk('del')">ลบ</button><button class="h-8 px-3 rounded-full hover:bg-white/10" onclick="ML.sel.clear();vMedia()">ยกเลิก</button></div>` : ''}
        <div class="flex items-center justify-between mb-2 text-[12px] text-muted"><span>${L.length} ไฟล์${ML.smart ? ' · ' + MSMART.find(x => x[0] === ML.smart)[1] : ''}</span>${L.length ? `<button class="hover:text-ink" onclick="${L.length === ML.sel.size ? 'ML.sel.clear()' : `[${L.map(m => m.id).join(',')}].forEach(i=>ML.sel.add(i))`};vMedia()">${L.length === ML.sel.size ? 'ยกเลิกเลือก' : 'เลือกทั้งหมด'}</button>` : ''}</div>
        ${ML.view === 'grid' ? `<div class="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3">${L.map(m => mTile(m, U)).join('')}</div>`
          : `<div class="card overflow-x-auto"><table class="tbl min-w-[760px]"><thead><tr><th></th><th>ไฟล์</th><th>Alt text (TH)</th><th>ใช้งาน</th><th>สิทธิ์</th><th class="text-right">ขนาด</th></tr></thead><tbody>${L.map(m => { const u = U.get(m.src) || []; return `<tr class="click" onclick="mDetail(${m.id})"><td class="w-14"><img loading="lazy" src="${m.src}" class="w-12 h-9 rounded-md object-cover"/></td><td><p class="truncate max-w-[220px]">${esc(m.name)}</p><p class="text-[11px] text-muted">${MDIR.find(d => d[0] === m.dir)[1]} · ${fmtD(m.date)}</p></td><td class="${m.alt.th ? '' : 'text-[#a3222c]'} truncate max-w-[220px]">${esc(m.alt.th) || 'ยังไม่มี'}</td><td class="text-muted">${u.length ? u.length + ' ที่' : '—'}</td><td><span class="lang-b ${RIGHTS[m.rights][1]}">${RIGHTS[m.rights][0].split(' · ')[0]}</span></td><td class="text-right tnum">${kb(m.src)} KB</td></tr>`; }).join('')}</tbody></table></div>`}
        ${L.length ? '' : '<div class="card p-10 text-center text-muted">ไม่มีไฟล์ในมุมมองนี้</div>'}
      </div></div>
    <div id="mDrop" class="hidden fixed inset-0 z-[55] bg-maroon/80 text-white grid place-items-center text-xl" ondragover="event.preventDefault()" ondragleave="if(event.target===this)this.classList.add('hidden')" ondrop="event.preventDefault();this.classList.add('hidden');readFiles(event.dataTransfer.files,mUpload)"><div class="text-center"><i data-lucide="upload" class="w-10 h-10 mx-auto mb-3"></i>วางไฟล์เพื่ออัปโหลดเข้าคลังสื่อ</div></div>`;
  icons();
}
function mUpload(srcs, files) { const dir = ML.dir === 'all' ? 'new' : ML.dir; srcs.forEach((s, n) => MEDIA.push(mkMedia(s, { name: `upload-${Date.now().toString(36)}-${n + 1}.webp`, dir, source: 'own', rights: 'own', date: iso(TODAY) }))); toast(`อัปโหลด ${srcs.length} ไฟล์ · แปลงเป็น WebP และย่อหลายขนาดอัตโนมัติ (ระบบจริง)`); if (CUR === 'media') vMedia(); return MEDIA.slice(-srcs.length); }
function mSel(id) { ML.sel.has(id) ? ML.sel.delete(id) : ML.sel.add(id); vMedia(); }
function mBulk(op, v) {
  const U = mUsage(), ids = [...ML.sel];
  if (op === 'move') ids.forEach(i => mById(i).dir = v);
  if (op === 'tag') ids.forEach(i => { const m = mById(i); if (!m.tags.includes(v)) m.tags.push(v); });
  if (op === 'rights') ids.forEach(i => mById(i).rights = v);
  if (op === 'del') { const used = ids.filter(i => U.get(mById(i).src)); MEDIA = MEDIA.filter(m => !ids.includes(m.id) || used.includes(m.id)); toast(used.length ? `ลบ ${ids.length - used.length} ไฟล์ · ข้าม ${used.length} ไฟล์ที่ยังใช้งานอยู่` : `ลบ ${ids.length} ไฟล์แล้ว`); }
  else toast(`อัปเดต ${ids.length} ไฟล์แล้ว`);
  ML.sel.clear(); vMedia();
}
function mDetail(id) {
  REG = []; const m = mById(id), U = mUsage(), u = U.get(m.src) || [];
  const crop = (r, l) => `<div><div class="rounded-lg overflow-hidden bg-sand" style="aspect-ratio:${r}"><img src="${m.src}" class="w-full h-full object-cover m-crop" style="object-position:${m.focal.x}% ${m.focal.y}%"/></div><p class="text-[10.5px] text-muted mt-1 text-center">${l}</p></div>`;
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div class="min-w-0"><p class="text-[11px] text-muted">คลังสื่อ · ${MDIR.find(d => d[0] === m.dir)[1]}</p><p class="font-medium truncate">${esc(m.name)}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 grid gap-5 content-start">
      <div><div class="relative rounded-xl overflow-hidden bg-sand cursor-crosshair" onclick="mFocal(event,${m.id})"><img id="mBig" src="${m.src}" class="w-full block"/><span id="mDot" class="m-dot" style="left:${m.focal.x}%;top:${m.focal.y}%"></span></div>
        <p class="text-[11px] text-muted mt-1.5 flex items-center gap-1.5"><i data-lucide="crosshair" class="w-3.5 h-3.5"></i>คลิกบนรูปเพื่อตั้งจุดโฟกัส · ระบบครอปทุกขนาดโดยให้จุดนี้อยู่ในกรอบ</p>
        <div class="grid grid-cols-3 gap-2 mt-3 items-end">${crop('16/9', 'Hero 16:9')}${crop('4/3', 'การ์ด 4:3')}${crop('1.91/1', 'แชร์ 1200×630')}</div></div>
      ${bi('Alt text (อธิบายรูปสำหรับ SEO และผู้พิการทางสายตา)', m.alt, { hint: 'ใช้ทุกหน้าที่รูปนี้แสดง' })}
      <div class="grid sm:grid-cols-2 gap-3"><label><span class="lbl">ชื่อไฟล์ (ใช้ใน URL รูป)</span><input class="inp font-mono !text-[12px]" value="${esc(m.name)}" onchange="mById(${m.id}).name=slugify(this.value.replace(/\\.webp$/,''))+'.webp';this.value=mById(${m.id}).name"/></label>
        <label><span class="lbl">โฟลเดอร์</span><select class="inp" onchange="mById(${m.id}).dir=this.value">${MDIR.slice(1).map(([k, l]) => `<option value="${k}" ${m.dir === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <div><p class="lbl">แท็ก</p><div class="flex flex-wrap gap-1.5">${m.tags.map((t, n) => `<span class="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-sand text-[12px]">${esc(t)}<button onclick="mById(${m.id}).tags.splice(${n},1);mDetail(${m.id})" class="w-5 h-5 grid place-items-center rounded-full hover:bg-white"><i data-lucide="x" class="w-3 h-3"></i></button></span>`).join('')}<input class="h-7 px-2 text-[12px] w-28 rounded-full bg-transparent" placeholder="+ เพิ่มแท็ก" onkeydown="if(event.key==='Enter'&&this.value.trim()){mById(${m.id}).tags.push(this.value.trim());mDetail(${m.id})}"/></div></div>
      <div class="rounded-xl ring-1 ring-line p-4 grid gap-3"><p class="text-[12px] font-medium flex items-center gap-2"><i data-lucide="shield" class="w-4 h-4 text-maroon"></i>แหล่งที่มา & สิทธิ์การใช้</p>
        <label><span class="lbl">สิทธิ์</span><select class="inp" onchange="mById(${m.id}).rights=this.value;mDetail(${m.id})">${Object.entries(RIGHTS).map(([k, [l]]) => `<option value="${k}" ${m.rights === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label><span class="lbl">เครดิต / ที่มา</span><input class="inp" value="${esc(m.credit)}" placeholder="เช่น ถ่ายโดยทีม BTT, ได้รับจากเจ้าของเรือ" onchange="mById(${m.id}).credit=this.value"/></label>
        ${['own', 'ads'].includes(m.rights) ? '' : `<p class="text-[11.5px] text-[#7a4a00] bg-[#fff6e5] rounded-lg px-3 py-2">รูปนี้จะไม่ถูกส่งเข้าแคตตาล็อกโฆษณา Meta จนกว่าจะยืนยันสิทธิ์</p>`}</div>
      <div><p class="lbl">ใช้งานอยู่ ${u.length} ที่</p>${u.length ? `<ul class="grid gap-1">${u.map(([l, g]) => `<li><button class="w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-sand text-[12.5px]" onclick="closeDrawer();${g}"><i data-lucide="link" class="w-3.5 h-3.5 text-muted"></i><span class="flex-1 truncate">${esc(l)}</span><i data-lucide="arrow-right" class="w-3.5 h-3.5 text-muted"></i></button></li>`).join('')}</ul>` : '<p class="text-[12.5px] text-muted">ยังไม่ได้ใช้ในหน้าไหน · ลบได้</p>'}</div>
      <div class="grid grid-cols-2 gap-2 text-[12px] text-muted rounded-xl bg-sand p-3"><span>รูปแบบ</span><span class="text-ink text-right">WebP</span><span>ขนาดไฟล์</span><span class="text-ink text-right tnum">${kb(m.src)} KB</span><span>ความละเอียด</span><span id="mDim" class="text-ink text-right tnum">—</span><span>อัปโหลด</span><span class="text-ink text-right">${fmtD(m.date)}</span><span>เวอร์ชันที่ระบบสร้าง</span><span class="text-ink text-right">480 · 960 · 1600 px</span></div>
    </div>
    <div class="p-4 border-t border-line flex flex-wrap gap-2"><button class="btn btn-o" onclick="toast('คัดลอก URL แล้ว: https://cdn.${SITE}/media/'+mById(${m.id}).name)"><i data-lucide="copy" class="w-3.5 h-3.5"></i>คัดลอก URL</button>
      <label class="btn btn-o cursor-pointer"><i data-lucide="replace" class="w-3.5 h-3.5"></i>แทนที่ไฟล์<input type="file" accept="image/*" class="hidden" onchange="readFiles(this.files,s=>mReplace(${m.id},s[0]))"/></label>
      <span class="flex-1"></span><button class="btn btn-g ${u.length ? 'opacity-40 cursor-not-allowed' : 'text-[#a3222c]'}" onclick="${u.length ? `toast('ลบไม่ได้ · รูปนี้ยังใช้อยู่ ${u.length} ที่')` : `MEDIA=MEDIA.filter(x=>x.id!==${m.id});closeDrawer();vMedia();toast('ลบแล้ว')`}"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i>ลบ</button></div>`);
  const im = $('#mBig'); const setDim = () => $('#mDim') && ($('#mDim').textContent = `${im.naturalWidth} × ${im.naturalHeight}`); im.complete ? setDim() : im.onload = setDim;
}
function mFocal(e, id) { const m = mById(id), r = e.currentTarget.getBoundingClientRect(); m.focal = { x: Math.round((e.clientX - r.left) / r.width * 100), y: Math.round((e.clientY - r.top) / r.height * 100) }; $('#mDot').style.left = m.focal.x + '%'; $('#mDot').style.top = m.focal.y + '%'; $$('.m-crop').forEach(i => i.style.objectPosition = `${m.focal.x}% ${m.focal.y}%`); if (CUR === 'media') { const t = $$('#view .m-tile img')[0]; } }
/* replacing a file updates every place that uses it */
function mReplace(id, src) { const m = mById(id), old = m.src; m.src = src;
  FLEET.forEach(b => { if (THUMBS[b.slug] === old) THUMBS[b.slug] = src; });
  ACTS.forEach(a => a.imgs = (a.imgs || []).map(s => s === old ? src : s));
  ART.forEach(a => Object.values(a.blocks || {}).flat().forEach(b => { if (b.src === old) b.src = src; (b.cells || []).forEach(c => { if (c.src === old) c.src = src; }); (Array.isArray(b.cols) ? b.cols : []).forEach(c => { if (c.src === old) c.src = src; }); }));
  toast('แทนที่ไฟล์แล้ว · อัปเดตทุกหน้าที่ใช้รูปนี้'); mDetail(id); if (CUR === 'media') vMedia(); }

/* ---------- picker modal used by every image field ---------- */
function mediaPicker(cb, { multi = false, dir = 'all', title = 'เลือกรูปจากคลังสื่อ' } = {}) {
  ML.pick = cb; ML.multi = multi; ML.pdir = dir; ML.pq = ''; ML.psel = []; mPickRender(title); }
function mPickRender(title) {
  const U = mUsage(), q = (ML.pq || '').toLowerCase(), L = MEDIA.filter(m => (ML.pdir === 'all' || m.dir === ML.pdir) && (!q || (m.name + m.tags.join(' ') + m.alt.th + m.alt.en + m.owner).toLowerCase().includes(q))).sort((a, b) => b.id - a.id).slice(0, 120);
  openModal(`<div class="p-5"><div class="flex items-center justify-between"><p class="font-medium">${title || 'เลือกรูปจากคลังสื่อ'}</p><button class="btn btn-g !px-2" onclick="closeModal()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex flex-col sm:flex-row gap-2 mt-3"><label class="flex items-center gap-2 h-9 px-3 rounded-full bg-sand flex-1"><i data-lucide="search" class="w-4 h-4 text-muted"></i><input id="mpQ" class="bg-transparent w-full text-[13px]" placeholder="ค้นหา…" value="${esc(ML.pq || '')}" onkeydown="if(event.key==='Enter'){ML.pq=this.value;mPickRender()}"/></label>
      <select class="inp !h-9 sm:!w-44" onchange="ML.pdir=this.value;mPickRender()">${MDIR.map(([k, l]) => `<option value="${k}" ${ML.pdir === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <label class="btn btn-o !h-9 cursor-pointer"><i data-lucide="upload" class="w-3.5 h-3.5"></i>อัปโหลด<input type="file" accept="image/*" multiple class="hidden" onchange="readFiles(this.files,s=>{const ms=mUpload(s);ML.pdir='all';ML.psel=ML.multi?[...ML.psel,...ms.map(m=>m.id)]:[ms[0].id];mPickRender()})"/></label></div>
    <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3 max-h-[52vh] overflow-y-auto p-0.5">${L.map(m => `<button class="m-tile text-left ${ML.psel.includes(m.id) ? 'on' : ''}" onclick="mPickToggle(${m.id})"><div class="relative aspect-square rounded-[10px] overflow-hidden bg-sand"><img loading="lazy" src="${m.src}" class="w-full h-full object-cover"/><span class="m-chk"><i data-lucide="check" class="w-3 h-3"></i></span></div><p class="mt-1 text-[10.5px] truncate text-muted">${esc(m.name)}</p></button>`).join('')}</div>
    <div class="flex items-center justify-between mt-4"><span class="text-[12px] text-muted">${ML.multi ? 'เลือกได้หลายรูป' : 'เลือก 1 รูป'} · Alt text จากคลังจะติดไปกับรูปอัตโนมัติ</span><button class="btn btn-p" ${ML.psel.length ? '' : 'disabled style="opacity:.4"'} onclick="mPickDone()">ใช้ ${ML.psel.length || ''} รูป</button></div></div>`);
}
function mPickToggle(id) { if (!ML.pick) return mSel(id); const a = ML.psel, k = a.indexOf(id); if (ML.multi) k < 0 ? a.push(id) : a.splice(k, 1); else ML.psel = [id]; mPickRender(); }
function mPickDone() { const srcs = ML.psel.map(i => mById(i).src), cb = ML.pick; ML.pick = null; closeModal(); cb && cb(srcs); }
const mAltOf = src => (MEDIA.find(m => m.src === src) || {}).alt;

/* hook existing pickers → media library */
edPick = function (cb) { const multi = ED.multi; ED.multi = false; mediaPicker(cb, { multi, title: multi ? 'เลือกรูป (เลือกได้หลายรูป)' : 'เลือกรูป' }); };
artCover = function (id) { mediaPicker(s => { const a = artById(id), slug = Object.keys(THUMBS).find(k => THUMBS[k] === s[0]); if (slug) a.cover = slug; else { a.cover = '__c' + id; THUMBS[a.cover] = s[0]; } vArticleEdit(id); }, { title: 'เลือกรูปปกบทความ' }); };
const _actImgBox13 = actImgBox;
actImgBox = function (i) { return _actImgBox13(i).replace('<p class="text-[10.5px] text-muted mt-1.5">', `<button class="btn btn-o !h-8 mt-2" onclick="mediaPicker(s=>actImg(${i},'add',s),{multi:true,dir:'act',title:'เพิ่มรูปจากคลังสื่อ'})"><i data-lucide="images" class="w-3.5 h-3.5"></i>เลือกจากคลังสื่อ</button><p class="text-[10.5px] text-muted mt-1.5">`); };
/* new uploads from the activity drawer also land in the library */
const _actImg13 = actImg;
actImg = function (i, op, n, d) { if (op === 'add') n.forEach(s => { if (!MEDIA.some(m => m.src === s)) MEDIA.push(mkMedia(s, { name: `${slugify(ACTS[i].en || ACTS[i].th)}-${Date.now().toString(36)}.webp`, dir: 'act', source: 'own', rights: 'own', date: iso(TODAY), owner: ACTS[i].en })); }); return _actImg13(i, op, n, d); };
/* boat photos tab: link to library */
const _vBoatEdit13 = vBoatEdit;
vBoatEdit = function (slug) { _vBoatEdit13(slug); if (BE.tab !== 'photos') return; const box = $('#view .card .p-5') || $('#view .fade'); box?.insertAdjacentHTML('afterbegin', `<div class="rounded-xl bg-sand p-3 mb-4 flex flex-wrap items-center gap-3 text-[12.5px]"><i data-lucide="images" class="w-4 h-4 text-maroon"></i><span class="flex-1">รูปของเรือลำนี้อยู่ในคลังสื่อ · โฟลเดอร์ “เรือ” · Alt text และสิทธิ์การใช้แก้ได้ที่คลังสื่อ</span><button class="btn btn-o !h-8" onclick="ML.dir='boat';ML.q='${slug}';go('media')">เปิดคลังสื่อ</button></div>`); icons(); };
/* SEO audit: images without alt in the library */
PAGES.splice(PAGES.findIndex(p => p[0] === 'articles') + 1, 0, ['media', 'คลังสื่อ', 'images', vMedia]);


