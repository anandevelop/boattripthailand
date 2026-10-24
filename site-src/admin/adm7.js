/* =====================================================================
   SHARE IMAGE (Open Graph) for boat pages – photo / auto card / upload
   ===================================================================== */
const OGV = { lang: 'th' };
const ogOf = b => b.og ??= { mode: 'card', pos: 'center', src: '', price: true, pax: true, t: tr(), d: tr() };
const usd = n => '$' + Math.round((n || 0) / 33.42).toLocaleString();
/* 1200×630 preview; the real site renders the same layout server-side (Next.js /og route) */
function ogHtml(b, k = 'th', round = '') {
  const o = ogOf(b), photo = o.mode === 'upload' && o.src ? o.src : THUMBS[b.slug], pos = { top: 'center top', center: 'center', bottom: 'center bottom' }[o.pos];
  const base = `<div class="og ${round}" style="container-type:inline-size">`;
  if (o.mode !== 'card') return base + `<img src="${photo}" style="object-position:${pos}"/></div>`;
  const logo = $('#side img')?.src || '';
  return base + `<img src="${THUMBS[b.slug]}" style="object-position:${pos}"/><div class="og-shade"></div>
    <div class="og-top"><img src="${logo}"/><span>BOAT TRIP <i>THAILAND</i></span></div>
    <div class="og-bot"><p class="og-k">${k === 'th' ? 'เช่าเรือส่วนตัว · ภูเก็ต' : 'Private charter · Phuket'}</p><p class="og-n">${esc(b.name)}</p>
      <div class="og-row">${o.price && b.from_ ? `<span class="og-p">${k === 'th' ? 'เริ่ม ' + baht(b.from_) : 'From ' + usd(b.from_)}</span>` : ''}${o.pax && b.pax ? `<span class="og-x">${b.pax} ${k === 'th' ? 'คน' : 'guests'}</span>` : ''}<span class="og-x">${TYPE_TH && k === 'th' ? TYPE_TH[b.type] || '' : ({ yacht: 'Yacht', sail: 'Sailing catamaran', power: 'Power catamaran', speed: 'Speedboat', longtail: 'Longtail' })[b.type] || ''}</span></div></div></div>`;
}
const ogTitle = (b, k) => ogOf(b).t[k] || b.i18n?.seoTitle[k] || b.name;
const ogDesc = (b, k) => ogOf(b).d[k] || b.i18n?.seoDesc[k] || '';
function ogPreviews(b) {
  const k = OGV.lang, t = esc(ogTitle(b, k)), d = esc(ogDesc(b, k)), url = `${SITE}${k === 'en' ? '/en' : ''}/yacht-charter/${b.slug}`;
  return `<div class="grid md:grid-cols-3 gap-3 items-start">
    <div><p class="lbl">Facebook</p><div class="rounded-xl overflow-hidden ring-1 ring-line bg-white">${ogHtml(b, k)}<div class="px-3 py-2.5 bg-[#f0f2f5]"><p class="text-[10.5px] text-[#65676b] uppercase">${SITE}</p><p class="text-[13.5px] font-medium leading-snug line-clamp-2 text-[#050505]">${t}</p></div></div></div>
    <div><p class="lbl">LINE</p><div class="rounded-2xl bg-[#8cabd9]/40 p-3"><div class="rounded-2xl overflow-hidden bg-white shadow-sm max-w-[260px]">${ogHtml(b, k)}<div class="p-2.5"><p class="text-[12.5px] font-medium leading-snug line-clamp-2">${t}</p><p class="text-[11px] text-muted line-clamp-2 mt-0.5">${d}</p><p class="text-[10px] text-muted mt-1">${SITE}</p></div></div></div></div>
    <div><p class="lbl">X / WhatsApp</p><div class="rounded-2xl overflow-hidden ring-1 ring-line bg-white relative">${ogHtml(b, k)}<span class="absolute right-2 bottom-2 text-[10.5px] bg-black/60 text-white px-1.5 rounded">${SITE}</span></div><p class="text-[11px] text-muted mt-1.5 truncate">${url}</p></div></div>`;
}
function ogSet(slug, o) { Object.assign(ogOf(bySlug(slug)), o); ogRefresh(slug); }
function ogRefresh(slug) { const b = bySlug(slug), el = $('#ogBox'); if (!el) return; el.outerHTML = ogSection(b); icons(); }
function ogUpload(slug, files) { readFiles(files, s => { ogSet(slug, { mode: 'upload', src: s[0] }); toast('อัปโหลดรูปแชร์แล้ว · ระบบจริงจะครอปเป็น 1200×630 ให้'); }); }
const optBi = (h, fb) => h.replace(/ bi-miss/g, '').replace('placeholder="ยังไม่ได้แปล"', `placeholder="${esc(fb?.th || '')}"`).replace('placeholder="Not translated yet"', `placeholder="${esc(fb?.en || '')}"`);
function ogSection(b) {
  const o = ogOf(b), s = b.slug;
  const opt = (m, ic, l, h) => `<button class="og-opt ${o.mode === m ? 'on' : ''}" onclick="${m === 'upload' && !o.src ? `this.nextElementSibling.click()` : `ogSet('${s}',{mode:'${m}'})`}"><i data-lucide="${ic}" class="w-4 h-4"></i><span class="text-left"><b class="font-medium block">${l}</b><span class="text-[11px] text-muted">${h}</span></span></button>${m === 'upload' ? `<input type="file" accept="image/*" class="hidden" onchange="ogUpload('${s}',this.files)"/>` : ''}`;
  return `<div id="ogBox" class="grid gap-4 pt-5 border-t border-line">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2"><div><p class="font-medium flex items-center gap-2"><i data-lucide="share-2" class="w-4 h-4 text-maroon"></i>ภาพหน้าปกสำหรับแชร์ (Open Graph)</p><p class="text-[12px] text-muted mt-0.5">แสดงเมื่อแชร์ลิงก์ใน LINE, Facebook, WhatsApp · ขนาด 1200×630</p></div>
      <div class="flex p-0.5 rounded-full bg-sand self-start">${LANGS.map(([c, C]) => `<button class="h-8 px-3 rounded-full text-[12px] ${OGV.lang === c ? 'bg-white shadow-sm' : 'text-muted'}" onclick="OGV.lang='${c}';ogRefresh('${s}')">${C}</button>`).join('')}</div></div>
    <div class="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-4 items-start">
      <div class="grid gap-2">
        ${opt('card', 'layout-template', 'การ์ดแชร์อัตโนมัติ', 'รูปเรือ + ชื่อ ราคา โลโก้ · แนะนำ')}${opt('photo', 'image', 'รูปหน้าปกเรือ', 'ใช้รูป Hero ของเรือตรงๆ')}${opt('upload', 'upload', o.src ? 'รูปที่อัปโหลด' : 'อัปโหลดรูปเอง', o.src ? 'กดเพื่อใช้รูปนี้' : 'JPG / PNG / WebP')}
        ${o.mode === 'upload' && o.src ? `<label class="btn btn-g justify-start cursor-pointer"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>เปลี่ยนรูป<input type="file" accept="image/*" class="hidden" onchange="ogUpload('${s}',this.files)"/></label>` : ''}
        <div class="rounded-xl bg-sand p-3 grid gap-2 mt-1"><p class="text-[11px] text-muted">ตำแหน่งครอปรูป</p><div class="flex gap-1">${[['top', 'บน'], ['center', 'กลาง'], ['bottom', 'ล่าง']].map(([p, l]) => `<button class="tab !h-7 ${o.pos === p ? 'on' : ''}" onclick="ogSet('${s}',{pos:'${p}'})">${l}</button>`).join('')}</div>
          ${o.mode === 'card' ? `<label class="flex items-center justify-between gap-3 text-[12.5px] pt-1"><span>แสดงราคาเริ่มต้น</span><span class="tgl"><input type="checkbox" ${o.price ? 'checked' : ''} onchange="ogSet('${s}',{price:this.checked})"/><span></span></span></label><label class="flex items-center justify-between gap-3 text-[12.5px]"><span>แสดงจำนวนคน</span><span class="tgl"><input type="checkbox" ${o.pax ? 'checked' : ''} onchange="ogSet('${s}',{pax:this.checked})"/><span></span></span></label>` : ''}</div>
      </div>
      <div class="min-w-0"><p class="lbl">ภาพที่จะใช้ · ${OGV.lang.toUpperCase()}</p><div class="rounded-xl overflow-hidden ring-1 ring-line">${ogHtml(b, OGV.lang)}</div>
        <p class="text-[11px] text-muted mt-1.5">${o.mode === 'card' ? 'การ์ดสร้างใหม่อัตโนมัติเมื่อแก้ชื่อเรือหรือราคา · มีทั้งเวอร์ชันไทยและอังกฤษ' : 'ใช้รูปเดียวกันทั้ง 2 ภาษา'}</p></div>
    </div>
    <div class="grid gap-3 bi-opt">${optBi(bi('หัวข้อตอนแชร์ (ไม่บังคับ · เว้นว่าง = ใช้ Title)', o.t), b.i18n?.seoTitle)}${optBi(bi('คำอธิบายตอนแชร์ (ไม่บังคับ · เว้นว่าง = ใช้ Meta description)', o.d, { rows: 2 }), b.i18n?.seoDesc)}</div>
    <div><p class="lbl !mb-2">ตัวอย่างตอนแชร์ · ${OGV.lang === 'th' ? 'ภาษาไทย' : 'English'}</p>${ogPreviews(b)}</div>
  </div>`;
}
const _vBoatEdit3 = vBoatEdit;
vBoatEdit = function (slug) {
  _vBoatEdit3(slug);
  if (BE.tab !== 'seo') return;
  const g = $('#view .grid.gap-5.max-w-4xl'), b = bySlug(slug); if (!g || !b) return;
  g.classList.remove('max-w-4xl'); g.insertAdjacentHTML('beforeend', ogSection(b)); icons();
};
/* SEO center: boats use their share image too */
const _seoPrev = seoPrev;
seoPrev = function () { _seoPrev(); const p = SE; if (p?.type !== 'boat') return; const b = bySlug(p.id.slice(2)), box = $('#sePrev').lastElementChild;
  box.innerHTML = `<p class="text-[10.5px] text-muted px-3.5 pt-3 mb-1.5">แชร์ใน LINE / Facebook</p>${ogHtml(b, 'th')}<div class="p-3 bg-[#f6f7f9]"><p class="text-[10.5px] text-muted uppercase">${SITE}</p><p class="text-[13px] font-medium line-clamp-1">${esc(ogTitle(b, 'th'))}</p></div><div class="px-3.5 py-2.5 border-t border-line"><button class="btn btn-o !h-8" onclick="closeDrawer();boatEdit('${b.slug}');BE.tab='seo';vBoatEdit('${b.slug}')">เปลี่ยนภาพแชร์</button></div>`; };


