/* =====================================================================
   BLOCK EDITOR for articles – text, headings, images (resize/align/ratio),
   image grid (rows × columns, spans), columns layout, boat card, button…
   Each language keeps its own block list; body HTML is generated from it.
   ===================================================================== */
const ED = { mode: 'edit', dev: 'desk', sel: -1, hist: [], fut: [], at: null, cb: null, multi: false, drag: null };
const txtOf = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
const RATIOS = [['auto', 'อัตโนมัติ'], ['16/9', '16:9'], ['4/3', '4:3'], ['1/1', '1:1'], ['3/4', '3:4']];
const COLS_TPL = { '1-1': '1fr 1fr', '1-2': '1fr 2fr', '2-1': '2fr 1fr', '1-1-1': '1fr 1fr 1fr', '1-1-1-1': '1fr 1fr 1fr 1fr' };
const BTYPES = [
  ['p', 'ย่อหน้า', 'pilcrow'], ['h2', 'หัวข้อ H2', 'heading-2'], ['h3', 'หัวข้อ H3', 'heading-3'], ['h4', 'หัวข้อ H4', 'heading-4'], ['h5', 'หัวข้อ H5', 'heading-5'], ['quote', 'คำพูด', 'quote'], ['faq', 'คำถามที่พบบ่อย (FAQ)', 'message-circle-question'],
  ['img', 'รูปภาพ', 'image'], ['grid', 'กริดรูป', 'layout-grid'], ['cols', 'คอลัมน์', 'columns-2'], ['boat', 'การ์ดเรือ', 'sailboat'],
  ['btn', 'ปุ่ม', 'mouse-pointer-click'], ['hr', 'เส้นคั่น', 'separator-horizontal'], ['space', 'ช่องว่าง', 'unfold-vertical'],
];
function newBlock(t, src) {
  const s = src || THUMBS[pick(FLEET).slug];
  return ({
    p: { t: 'p', html: '' }, h2: { t: 'h', lv: 2, html: '' }, h3: { t: 'h', lv: 3, html: '' }, h4: { t: 'h', lv: 4, html: '' }, h5: { t: 'h', lv: 5, html: '' }, faq: { t: 'faq', title: '', items: [{ q: '', a: '' }, { q: '', a: '' }] }, quote: { t: 'quote', html: '' },
    img: { t: 'img', src: s, w: 100, align: 'c', ratio: 'auto', cap: '', alt: '' },
    grid: { t: 'grid', cols: 3, rowH: 200, gap: 8, cells: [0, 1, 2, 3, 4, 5].map(n => ({ src: THUMBS[FLEET[(n * 7 + 3) % FLEET.length].slug], cs: 1, rs: 1 })) },
    cols: { t: 'cols', tpl: '1-1', va: 'c', gap: 24, cols: [{ k: 'img', src: s }, { k: 'txt', html: '' }] },
    boat: { t: 'boat', slug: FLEET[0].slug }, btn: { t: 'btn', label: AE.lang === 'th' ? 'ดูเรือและจองเลย' : 'View boats & book', href: 'fleet', style: 'solid', align: 'c' },
    hr: { t: 'hr' }, space: { t: 'space', h: 32 },
  })[t];
}
function parseBlocks(html) {
  const d = document.createElement('div'); d.innerHTML = html || ''; const out = [];
  [...d.childNodes].forEach(n => {
    if (n.nodeType === 3) { if (n.textContent.trim()) out.push({ t: 'p', html: esc(n.textContent) }); return; }
    if (n.nodeType !== 1) return; const tg = n.tagName.toLowerCase();
    if (/^h[2-5]$/.test(tg)) out.push({ t: 'h', lv: +tg[1], html: n.innerHTML });
    else if (n.classList.contains('b-faq')) out.push({ t: 'faq', title: n.querySelector('.b-faq-t')?.innerHTML || '', items: [...n.querySelectorAll('details')].map(d => ({ q: d.querySelector('summary')?.innerHTML || '', a: d.querySelector('div')?.innerHTML || '' })) });
    else if (tg === 'blockquote') out.push({ t: 'quote', html: n.innerHTML });
    else if (tg === 'figure') out.push({ t: 'img', src: n.querySelector('img')?.getAttribute('src'), w: 100, align: 'c', ratio: 'auto', cap: n.querySelector('figcaption')?.innerHTML || '', alt: '' });
    else if (n.classList.contains('boat-embed')) out.push({ t: 'boat', slug: n.dataset.boat });
    else if (tg === 'p') out.push({ t: 'p', html: n.innerHTML });
    else out.push({ t: 'p', html: n.outerHTML });
  });
  return out;
}
function blocksOf(a, k) {
  a.blocks ??= {};
  if (!a.blocks[k] || (!a.blocks[k].length && txtOf(a.body[k]))) a.blocks[k] = parseBlocks(a.body[k]);
  return a.blocks[k];
}
/* demo layout blocks for the first sample article */
function seedDemo() {
  const a = artById(1); if (!a) return;
  ['th', 'en'].forEach(k => {
    const B = blocksOf(a, k);
    B.splice(1, 0, { t: 'img', src: THUMBS['leopard-90-ft'], w: 100, align: 'c', ratio: '16/9', cap: k === 'th' ? 'ตัวอย่างรูปเต็มความกว้าง' : 'Full-width image example', alt: '' });
    B.splice(4, 0, { t: 'grid', cols: 3, rowH: 170, gap: 8, cells: [{ src: THUMBS['splo-74-ft'], cs: 2, rs: 2 }, { src: THUMBS['vtech-68-ft'], cs: 1, rs: 1 }, { src: THUMBS['cognac-75-ft'], cs: 1, rs: 1 }, { src: THUMBS['the-origin-90-ft'], cs: 1, rs: 1 }, { src: THUMBS['siam-princess-70-ft'], cs: 1, rs: 1 }, { src: THUMBS[FLEET[9].slug], cs: 1, rs: 1 }] });
    B.splice(7, 0, { t: 'cols', tpl: '1-1', va: 'c', gap: 24, cols: [{ k: 'img', src: THUMBS['vtech-68-ft'] }, { k: 'txt', html: k === 'th' ? '<h3>เรือคาตามารัน</h3><p>ดาดฟ้ากว้าง นิ่ง เหมาะกับครอบครัวและกลุ่มใหญ่ (ตัวอย่างเลย์เอาต์รูป + ข้อความ)</p>' : '<h3>Catamarans</h3><p>Wide, stable decks for families and larger groups (image + text layout example).</p>' }] });
    B.push({ t: 'btn', label: k === 'th' ? 'ดูเรือทั้งหมดและจอง' : 'Browse boats & book', href: 'fleet', style: 'solid', align: 'c' });
    a.body[k] = blocksHtml(B);
  });
}

/* ---------- static HTML (preview + what the website renders) ---------- */
const hasBlockTag = h => /<(p|ul|ol|div|h\d|blockquote)\b/i.test(h || '');
const imgTag = (src, alt, st = '') => src ? `<img src="${src}" alt="${esc(alt || '')}" style="${st}"/>` : '';
function blockHtml(b) {
  switch (b.t) {
    case 'p': return hasBlockTag(b.html) ? b.html : `<p>${b.html || ''}</p>`;
    case 'h': return `<h${b.lv}>${b.html || ''}</h${b.lv}>`;
    case 'faq': return `<div class="b-faq">${b.title ? `<h2 class="b-faq-t">${b.title}</h2>` : ''}${b.items.filter(x => txtOf(x.q)).map((x, n) => `<details${n ? '' : ' open'}><summary>${x.q}</summary><div>${x.a || ''}</div></details>`).join('')}</div>`;
    case 'quote': return `<blockquote>${b.html || ''}</blockquote>`;
    case 'img': return `<figure class="b-img al-${b.align}" style="width:${b.w}%">${imgTag(b.src, b.alt, b.ratio !== 'auto' ? `aspect-ratio:${b.ratio};object-fit:cover` : '')}${b.cap ? `<figcaption>${b.cap}</figcaption>` : ''}</figure>`;
    case 'grid': return `<div class="b-grid" style="grid-template-columns:repeat(${b.cols},1fr);grid-auto-rows:${b.rowH}px;gap:${b.gap}px">${b.cells.filter(c => c.src).map(c => `<figure style="grid-column:span ${Math.min(c.cs, b.cols)};grid-row:span ${c.rs}">${imgTag(c.src, c.alt)}</figure>`).join('')}</div>`;
    case 'cols': return `<div class="b-cols" style="grid-template-columns:${COLS_TPL[b.tpl]};gap:${b.gap}px;align-items:${b.va === 't' ? 'start' : 'center'}">${b.cols.map(c => `<div>${c.k === 'img' ? imgTag(c.src, c.alt, 'width:100%;border-radius:12px') : (c.html || '')}</div>`).join('')}</div>`;
    case 'boat': { const x = bySlug(b.slug); return x ? `<div class="boat-embed" data-boat="${b.slug}"><img src="${THUMBS[b.slug]}"/><div><b>${esc(x.name)}</b><span>${x.pax ? x.pax + (AE.lang === 'th' ? ' คน · ' : ' guests · ') : ''}${AE.lang === 'th' ? 'ดูรายละเอียดเรือ' : 'View boat'} →</span></div></div>` : ''; }
    case 'btn': return `<div class="b-btn" style="text-align:${{ l: 'left', c: 'center', r: 'right' }[b.align]}"><a class="${b.style}">${esc(b.label)}</a></div>`;
    case 'hr': return '<hr/>';
    case 'space': return `<div style="height:${b.h}px"></div>`;
  }
  return '';
}
const blocksHtml = B => B.map(blockHtml).join('');

/* ---------- state helpers ---------- */
const curA = () => artById(AE.id);
const curB = () => blocksOf(curA(), AE.lang);
function edSave() { const a = curA(), k = AE.lang; a.body[k] = blocksHtml(curB()); artTouch(a, k); const w = $('#artWords'); if (w) w.textContent = `อ่านประมาณ ${readMin(a, k)} นาที · ${curB().length} บล็อก`; }
function edSnap() { ED.hist.push(JSON.stringify(curB())); if (ED.hist.length > 60) ED.hist.shift(); ED.fut = []; edHistBtns(); }
function edHistBtns() { const u = $('#edUndo'), r = $('#edRedo'); if (u) u.disabled = !ED.hist.length; if (r) r.disabled = !ED.fut.length; }
function edSetBlocks(B) { curA().blocks[AE.lang] = B; edSave(); edRender(); }
function edUndo() { if (!ED.hist.length) return; ED.fut.push(JSON.stringify(curB())); edSetBlocks(JSON.parse(ED.hist.pop())); }
function edRedo() { if (!ED.fut.length) return; ED.hist.push(JSON.stringify(curB())); edSetBlocks(JSON.parse(ED.fut.pop())); }
function edDo(fn, sel) { edSnap(); fn(curB()); if (sel !== undefined) ED.sel = sel; edSave(); edRender(); }

/* ---------- editor card ---------- */
function edCard(a, k) {
  blocksOf(a, k);
  const seg = (on, fn, ic, l) => `<button class="h-7 px-2.5 rounded-full text-[12px] inline-flex items-center gap-1.5 ${on ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'}" onclick="${fn}"><i data-lucide="${ic}" class="w-3.5 h-3.5"></i>${l}</button>`;
  const q = (t, ic, tip) => `<button class="btn btn-g !px-2 !h-8" title="${tip}" onclick="edInsert('${t}')"><i data-lucide="${ic}" class="w-4 h-4"></i></button>`;
  return `<div class="card">
    <div id="edTop" class="px-2 py-1.5 border-b border-line flex flex-wrap items-center gap-1 sticky top-16 z-20 bg-white rounded-t-[16px]">
      <div class="flex p-0.5 rounded-full bg-sand">${seg(ED.mode === 'edit', "ED.mode='edit';edRender()", 'pencil', 'แก้ไข')}${seg(ED.mode === 'preview', "ED.mode='preview';ED.sel=-1;edRender()", 'eye', 'ดูตัวอย่าง')}</div>
      ${ED.mode === 'edit' ? `<span class="w-px h-5 bg-line mx-1"></span>
      <button id="edUndo" class="btn btn-g !px-2 !h-8 disabled:opacity-30" title="ย้อนกลับ (Ctrl+Z)" onclick="edUndo()"><i data-lucide="undo-2" class="w-4 h-4"></i></button><button id="edRedo" class="btn btn-g !px-2 !h-8 disabled:opacity-30" title="ทำซ้ำ" onclick="edRedo()"><i data-lucide="redo-2" class="w-4 h-4"></i></button>
      <span class="w-px h-5 bg-line mx-1"></span>
      <button class="btn btn-o !h-8" onclick="edMenu(null,this)"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มบล็อก</button>
      ${q('img', 'image', 'รูปภาพ')}${q('grid', 'layout-grid', 'กริดรูป')}${q('cols', 'columns-2', 'คอลัมน์')}${q('boat', 'sailboat', 'การ์ดเรือ')}${q('btn', 'mouse-pointer-click', 'ปุ่ม')}`
      : `<span class="w-px h-5 bg-line mx-1"></span><div class="flex p-0.5 rounded-full bg-sand">${seg(ED.dev === 'desk', "ED.dev='desk';edRender()", 'monitor', 'คอม')}${seg(ED.dev === 'mob', "ED.dev='mob';edRender()", 'smartphone', 'มือถือ')}</div>`}
      <span id="artWords" class="ml-auto text-[11px] text-muted pr-2 hidden sm:inline">อ่านประมาณ ${readMin(a, k)} นาที · ${a.blocks[k].length} บล็อก</span>
    </div>
    <div id="edWrap">${edInner()}</div>
  </div>`;
}
function edInner() {
  const a = curA(), k = AE.lang, B = curB();
  if (ED.mode === 'preview') return `<div class="bg-sand/60 p-4 sm:p-8 rounded-b-[16px]"><article class="art-view ${ED.dev} mx-auto bg-white rounded-2xl shadow-sm ${ED.dev === 'mob' ? 'max-w-[390px]' : 'max-w-[780px]'}">
      ${imgTag(THUMBS[a.cover], '', 'width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px 16px 0 0')}
      <div class="${ED.dev === 'mob' ? 'p-5' : 'p-10'}"><p class="text-[12px] text-maroon tracking-wide">${ACAT_A[a.cat]}</p><h1 class="${ED.dev === 'mob' ? 'text-[24px]' : 'text-[32px]'} leading-tight font-medium mt-2">${esc(a.title[k]) || '<span class="text-muted">ยังไม่มีชื่อเรื่อง</span>'}</h1>
      <p class="text-muted mt-3 text-[15px]">${esc(a.excerpt[k])}</p><div class="art-body !p-0 mt-6">${blocksHtml(B) || '<p class="text-muted">ยังไม่มีเนื้อหา</p>'}</div></div></article>
      <p class="text-center text-[11px] text-muted mt-3">ตัวอย่างการแสดงผล${ED.dev === 'mob' ? ' · บนมือถือ กริดรูปเหลือ 2 คอลัมน์ และคอลัมน์เรียงต่อกันลงมา' : ''}</p></div>`;
  return `<div id="edCanvas" class="ed-canvas art-body" onclick="if(event.target===this)edSel(-1)" ondragover="edOver(event,-1)" ondrop="edDrop(event,-1)">
    ${B.map((b, i) => edBlock(b, i)).join('')}
    <button class="ed-add" onclick="edMenu(${B.length},this)"><i data-lucide="plus" class="w-4 h-4"></i>${B.length ? 'เพิ่มบล็อก' : 'เริ่มเขียน · คลิกเพื่อเลือกบล็อก หรือกด / ในย่อหน้าว่าง'}</button>
  </div>`;
}
function edRender() {
  const w = $('#edWrap'); if (!w) return;
  const top = $('#edTop').parentElement; top.outerHTML = edCard(curA(), AE.lang);
  icons(); edHistBtns(); edPostRender();
}
function edPostRender() {
  $$('.ed-txt').forEach(el => { if (!el.innerHTML.trim()) el.innerHTML = ''; });
  const s = $(`.blk[data-i="${ED.sel}"]`); if (s) s.classList.add('on');
}

/* one block in edit mode */
function edBlock(b, i) {
  const ib = (ic, fn, tip, on) => `<button class="eb ${on ? 'on' : ''}" title="${tip}" onmousedown="event.preventDefault()" onclick="event.stopPropagation();${fn}"><i data-lucide="${ic}" class="w-[15px] h-[15px]"></i></button>`;
  const tb = (l, fn, on, tip = '') => `<button class="eb !w-auto px-2 text-[11.5px] ${on ? 'on' : ''}" title="${tip}" onmousedown="event.preventDefault()" onclick="event.stopPropagation();${fn}">${l}</button>`;
  const sep = '<span class="eb-sep"></span>';
  const fmt = (c, v) => `document.execCommand('${c}',false,${v ? `'${v}'` : 'null'})`;
  let bar = '', body = '';
  const ph = { p: AE.lang === 'th' ? 'พิมพ์ข้อความ… หรือกด / เพื่อเลือกบล็อก' : 'Type… or press / for blocks', h: AE.lang === 'th' ? 'หัวข้อ' : 'Heading', quote: AE.lang === 'th' ? 'คำพูด / ข้อความเน้น' : 'Quote' };
  const txtEd = (tag, html, cls = '') => `<${tag} class="ed-txt ${cls}" contenteditable="true" data-ph="${ph[b.t]}" onfocus="edFocus(${i})" oninput="curB()[${i}].html=this.innerHTML;edSave()" onkeydown="edKey(event,${i},this)">${html || ''}</${tag}>`;
  if (b.t === 'p' || b.t === 'h' || b.t === 'quote') {
    const cur = b.t === 'h' ? 'h' + b.lv : b.t;
    bar = [['p', 'ย่อหน้า'], ['h2', 'H2'], ['h3', 'H3'], ['h4', 'H4'], ['h5', 'H5'], ['quote', 'คำพูด']].map(([t, l]) => tb(l, `edType(${i},'${t}')`, cur === t)).join('') + sep
      + ib('bold', fmt('bold'), 'ตัวหนา') + ib('italic', fmt('italic'), 'ตัวเอียง') + ib('link', `edLink()`, 'ใส่ลิงก์')
      + (b.t === 'p' ? ib('list', fmt('insertUnorderedList'), 'รายการ') + ib('list-ordered', fmt('insertOrderedList'), 'รายการตัวเลข') : '');
    body = b.t === 'h' ? txtEd('h' + b.lv, b.html) : b.t === 'quote' ? txtEd('blockquote', b.html) : txtEd('div', b.html, 'ed-p');
  }
  if (b.t === 'faq') {
    const th = AE.lang === 'th';
    bar = tb('<i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มคำถาม', `edDo(B=>B[${i}].items.push({q:'',a:''}),${i})`, false) + `<span class="eb-l">${b.items.filter(x => txtOf(x.q) && txtOf(x.a)).length}/${b.items.length} ข้อครบ</span>`;
    body = `<div class="ed-faq"><div class="ed-txt ed-faq-t" contenteditable="true" data-ph="${th ? 'หัวข้อส่วน FAQ (ไม่บังคับ) เช่น คำถามที่พบบ่อย' : 'Section title (optional), e.g. Frequently asked questions'}" onfocus="edFocus(${i})" oninput="curB()[${i}].title=this.innerHTML;edSave()">${b.title || ''}</div>
      ${b.items.map((x, n) => `<div class="ed-faq-i"><span class="ed-faq-n">${n + 1}</span><div class="min-w-0 flex-1">
        <div class="ed-txt ed-faq-q ${txtOf(x.q) ? '' : 'need-fill'}" contenteditable="true" data-ph="${th ? 'คำถาม เช่น ราคาเช่าเรือรวมอะไรบ้าง?' : 'Question, e.g. What does the charter price include?'}" onfocus="edFocus(${i})" oninput="curB()[${i}].items[${n}].q=this.innerHTML;this.classList.toggle('need-fill',!this.textContent.trim());edSave()">${x.q}</div>
        <div class="ed-txt ed-faq-a ${txtOf(x.a) ? '' : 'need-fill'}" contenteditable="true" data-ph="${th ? 'คำตอบ' : 'Answer'}" onfocus="edFocus(${i})" oninput="curB()[${i}].items[${n}].a=this.innerHTML;this.classList.toggle('need-fill',!this.textContent.trim());edSave()">${x.a}</div></div>
        <div class="ed-faq-act">${n ? ib('arrow-up', `edDo(B=>B[${i}].items.splice(${n - 1},0,B[${i}].items.splice(${n},1)[0]),${i})`, 'เลื่อนขึ้น') : ''}${ib('x', `edDo(B=>B[${i}].items.splice(${n},1),${i})`, 'ลบคำถาม')}</div></div>`).join('')}
      <button class="ed-faq-add" onclick="event.stopPropagation();edDo(B=>B[${i}].items.push({q:'',a:''}),${i})"><i data-lucide="plus" class="w-3.5 h-3.5"></i>${th ? 'เพิ่มคำถาม' : 'Add question'}</button>
      <p class="text-[10.5px] text-muted mt-2 flex items-center gap-1.5"><i data-lucide="search" class="w-3 h-3"></i>ส่งเป็น FAQPage schema ให้ Google อัตโนมัติ · แสดงบนเว็บแบบกดเปิด-ปิด</p></div>`;
  }
  if (b.t === 'img') {
    bar = `<span class="eb-l">กว้าง</span>` + [25, 33, 50, 75, 100].map(w => tb(w + '%', `edUp(${i},{w:${w}})`, b.w === w)).join('') + sep
      + ib('align-left', `edUp(${i},{align:'l'})`, 'ชิดซ้าย', b.align === 'l') + ib('align-center', `edUp(${i},{align:'c'})`, 'กึ่งกลาง', b.align === 'c') + ib('align-right', `edUp(${i},{align:'r'})`, 'ชิดขวา', b.align === 'r') + sep
      + `<select class="eb-sel" onclick="event.stopPropagation()" onchange="edUp(${i},{ratio:this.value})">${RATIOS.map(([v, l]) => `<option value="${v}" ${b.ratio === v ? 'selected' : ''}>สัดส่วน ${l}</option>`).join('')}</select>`
      + sep + tb('<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>เปลี่ยนรูป', `edPick(s=>edUp(${i},{src:s[0]}))`, false)
      + `<input class="eb-in" placeholder="Alt text (${AE.lang.toUpperCase()})" value="${esc(b.alt)}" onclick="event.stopPropagation()" onchange="curB()[${i}].alt=this.value;edSave()"/>`;
    body = `<figure class="b-img al-${b.align}" style="width:${b.w}%" ondragover="edFileOver(event)" ondrop="edFileDrop(event,s=>edUp(${i},{src:s[0]}))">
        <div class="relative group/img">${imgTag(b.src, b.alt, b.ratio !== 'auto' ? `aspect-ratio:${b.ratio};object-fit:cover` : '')}
          <span class="rs-h" title="ลากเพื่อปรับขนาด" onpointerdown="edResize(event,${i})"></span><span class="rs-w">${b.w}%</span>
          <button class="img-x" title="ลบรูป" onclick="event.stopPropagation();edDel(${i})"><i data-lucide="x" class="w-3.5 h-3.5"></i></button></div>
        <figcaption class="ed-txt" contenteditable="true" data-ph="${AE.lang === 'th' ? 'เพิ่มคำบรรยายรูป (ไม่ใส่ก็ได้)' : 'Add a caption (optional)'}" onfocus="edFocus(${i})" oninput="curB()[${i}].cap=this.innerHTML;edSave()">${b.cap || ''}</figcaption></figure>`;
  }
  if (b.t === 'grid') {
    const rows = Math.max(1, Math.ceil(b.cells.length / b.cols));
    bar = `<span class="eb-l">คอลัมน์</span>${ib('minus', `edGrid(${i},'c',-1)`, 'ลดคอลัมน์')}<span class="eb-n">${b.cols}</span>${ib('plus', `edGrid(${i},'c',1)`, 'เพิ่มคอลัมน์')}${sep}
      <span class="eb-l">แถว</span>${ib('minus', `edGrid(${i},'r',-1)`, 'ลดแถว')}<span class="eb-n">${rows}</span>${ib('plus', `edGrid(${i},'r',1)`, 'เพิ่มแถว')}${sep}
      <select class="eb-sel" onclick="event.stopPropagation()" onchange="edUp(${i},{rowH:+this.value})">${[...new Set([120, 160, 200, 240, 300, 360, b.rowH])].sort((x, y) => x - y).map(h => `<option value="${h}" ${b.rowH === h ? 'selected' : ''}>สูงแถว ${h}px</option>`).join('')}</select>
      <select class="eb-sel" onclick="event.stopPropagation()" onchange="edUp(${i},{gap:+this.value})">${[0, 4, 8, 16, 24].map(g => `<option value="${g}" ${b.gap === g ? 'selected' : ''}>ระยะห่าง ${g}px</option>`).join('')}</select>${sep}
      ${tb('<i data-lucide="image-plus" class="w-3.5 h-3.5"></i>เพิ่มรูป', `ED.multi=true;edPick(s=>edDo(B=>s.forEach(x=>B[${i}].cells.push({src:x,cs:1,rs:1}))))`, false)}`;
    body = `<div class="b-grid ed-grid" style="grid-template-columns:repeat(${b.cols},1fr);grid-auto-rows:${b.rowH}px;gap:${b.gap}px">${b.cells.map((c, n) => `
      <figure class="cell ${c.src ? '' : 'empty'}" style="grid-column:span ${Math.min(c.cs, b.cols)};grid-row:span ${c.rs}" ondragover="edFileOver(event)" ondrop="edFileDrop(event,s=>edCell(${i},${n},{src:s[0]}))">
        ${c.src ? imgTag(c.src, c.alt) + `<div class="cell-bar">${ib('chevron-left', `edCellMove(${i},${n},-1)`, 'ย้ายซ้าย')}${ib('chevron-right', `edCellMove(${i},${n},1)`, 'ย้ายขวา')}${ib('move-horizontal', `edCell(${i},${n},{cs:${c.cs >= b.cols ? 1 : c.cs + 1}})`, 'กว้าง ' + c.cs + ' ช่อง (คลิกเพื่อขยาย)')}${ib('move-vertical', `edCell(${i},${n},{rs:${c.rs >= 3 ? 1 : c.rs + 1}})`, 'สูง ' + c.rs + ' แถว (คลิกเพื่อขยาย)')}${ib('refresh-cw', `edPick(s=>edCell(${i},${n},{src:s[0]}))`, 'เปลี่ยนรูป')}${ib('trash-2', `edDo(B=>B[${i}].cells.splice(${n},1))`, 'ลบรูป')}</div>${c.cs > 1 || c.rs > 1 ? `<span class="cell-span">${c.cs}×${c.rs}</span>` : ''}`
        : `<button class="cell-add" onclick="event.stopPropagation();edPick(s=>edCell(${i},${n},{src:s[0]}))"><i data-lucide="image-plus" class="w-5 h-5"></i>เพิ่มรูป</button><button class="cell-x" onclick="event.stopPropagation();edDo(B=>B[${i}].cells.splice(${n},1))"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>`}
      </figure>`).join('')}</div>`;
  }
  if (b.t === 'cols') {
    bar = `<span class="eb-l">เลย์เอาต์</span>` + Object.keys(COLS_TPL).map(t => tb(`<span class="tpl">${t.split('-').map(x => `<i style="flex:${x}"></i>`).join('')}</span>`, `edColsTpl(${i},'${t}')`, b.tpl === t, t.replace(/-/g, ':'))).join('') + sep
      + tb('บน', `edUp(${i},{va:'t'})`, b.va === 't', 'จัดชิดบน') + tb('กลาง', `edUp(${i},{va:'c'})`, b.va === 'c', 'จัดกึ่งกลางแนวตั้ง') + sep
      + `<select class="eb-sel" onclick="event.stopPropagation()" onchange="edUp(${i},{gap:+this.value})">${[12, 24, 40].map(g => `<option value="${g}" ${b.gap === g ? 'selected' : ''}>ระยะห่าง ${g}px</option>`).join('')}</select>`;
    body = `<div class="b-cols ed-cols" style="grid-template-columns:${COLS_TPL[b.tpl]};gap:${b.gap}px;align-items:${b.va === 't' ? 'start' : 'center'}">${b.cols.map((c, n) => `
      <div class="col">
        <div class="col-bar">${tb('ข้อความ', `edCol(${i},${n},{k:'txt'})`, c.k === 'txt')}${tb('รูป', `edCol(${i},${n},{k:'img',src:'${''}'})`, c.k === 'img')}${n ? ib('chevron-left', `edColMove(${i},${n},-1)`, 'สลับไปซ้าย') : ''}</div>
        ${c.k === 'img' ? (c.src ? `<div class="relative" ondragover="edFileOver(event)" ondrop="edFileDrop(event,s=>edCol(${i},${n},{src:s[0]}))">${imgTag(c.src, c.alt, 'width:100%;border-radius:12px')}<button class="img-x" style="opacity:1" title="เปลี่ยนรูป" onclick="event.stopPropagation();edPick(s=>edCol(${i},${n},{src:s[0]}))"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i></button></div>`
          : `<button class="cell-add !static !h-40 w-full rounded-xl" onclick="event.stopPropagation();edPick(s=>edCol(${i},${n},{src:s[0]}))" ondragover="edFileOver(event)" ondrop="edFileDrop(event,s=>edCol(${i},${n},{src:s[0]}))"><i data-lucide="image-plus" class="w-5 h-5"></i>เพิ่มรูป</button>`)
          : `<div class="ed-txt ed-p" contenteditable="true" data-ph="${AE.lang === 'th' ? 'พิมพ์ข้อความในคอลัมน์…' : 'Column text…'}" onfocus="edFocus(${i})" oninput="curB()[${i}].cols[${n}].html=this.innerHTML;edSave()">${c.html || ''}</div>`}
      </div>`).join('')}</div>`;
  }
  if (b.t === 'boat') { bar = `<select class="eb-sel !max-w-[260px]" onclick="event.stopPropagation()" onchange="edUp(${i},{slug:this.value})">${FLEET.map(x => `<option value="${x.slug}" ${x.slug === b.slug ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`; body = blockHtml(b); }
  if (b.t === 'btn') {
    bar = `<input class="eb-in !w-44" value="${esc(b.label)}" onclick="event.stopPropagation()" oninput="curB()[${i}].label=this.value;this.closest('.blk').querySelector('.b-btn a').textContent=this.value;edSave()"/>
      <select class="eb-sel" onclick="event.stopPropagation()" onchange="edUp(${i},{href:this.value})">${[['fleet', 'ลิงก์: หน้ารวมเรือ'], ['wa', 'ลิงก์: WhatsApp'], ['line', 'ลิงก์: LINE'], ['contact', 'ลิงก์: ติดต่อเรา']].map(([v, l]) => `<option value="${v}" ${b.href === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${sep}
      ${tb('ทึบ', `edUp(${i},{style:'solid'})`, b.style === 'solid')}${tb('เส้น', `edUp(${i},{style:'line'})`, b.style === 'line')}${sep}
      ${ib('align-left', `edUp(${i},{align:'l'})`, 'ชิดซ้าย', b.align === 'l')}${ib('align-center', `edUp(${i},{align:'c'})`, 'กึ่งกลาง', b.align === 'c')}${ib('align-right', `edUp(${i},{align:'r'})`, 'ชิดขวา', b.align === 'r')}`;
    body = blockHtml(b);
  }
  if (b.t === 'hr') body = '<hr/>';
  if (b.t === 'space') { bar = `<span class="eb-l">ความสูง</span><input type="range" min="8" max="160" step="8" value="${b.h}" onclick="event.stopPropagation()" oninput="curB()[${i}].h=+this.value;this.nextElementSibling.textContent=this.value+'px';this.closest('.blk').querySelector('.sp').style.height=this.value+'px';edSave()"/><span class="eb-n !w-auto">${b.h}px</span>`; body = `<div class="sp" style="height:${b.h}px"></div>`; }
  const name = { p: 'ย่อหน้า', h: 'หัวข้อ H' + b.lv, quote: 'คำพูด', faq: 'FAQ', img: 'รูปภาพ', grid: 'กริดรูป', cols: 'คอลัมน์', boat: 'การ์ดเรือ', btn: 'ปุ่ม', hr: 'เส้นคั่น', space: 'ช่องว่าง' }[b.t];
  return `<div class="blk blk-${b.t}" data-i="${i}" onmousedown="edSel(${i})" ondragover="edOver(event,${i})" ondragleave="this.classList.remove('drop-b','drop-a')" ondrop="edDrop(event,${i})">
    <div class="blk-side"><button class="blk-plus" title="เพิ่มบล็อกด้านล่าง" onclick="event.stopPropagation();edMenu(${i + 1},this)"><i data-lucide="plus" class="w-4 h-4"></i></button><span class="blk-grip" draggable="true" title="ลากเพื่อย้าย" ondragstart="edDragStart(event,${i})" ondragend="edDragEnd()"><i data-lucide="grip-vertical" class="w-4 h-4"></i></span></div>
    <div class="blk-bar" onmousedown="event.stopPropagation()"><span class="eb-name">${name}</span>${bar ? sep + bar : ''}<span class="flex-1"></span>${ib('arrow-up', `edMove(${i},-1)`, 'เลื่อนขึ้น')}${ib('arrow-down', `edMove(${i},1)`, 'เลื่อนลง')}${ib('copy', `edDup(${i})`, 'ทำสำเนา')}${ib('trash-2', `edDel(${i})`, 'ลบบล็อก')}</div>
    ${body}</div>`;
}

/* ---------- block operations ---------- */
function edSel(i) { if (ED.sel === i) return; ED.sel = i; $$('.blk.on').forEach(e => e.classList.remove('on')); if (i >= 0) $(`.blk[data-i="${i}"]`)?.classList.add('on'); }
let _focusSnap = -2;
function edFocus(i) { edSel(i); if (_focusSnap !== i) { edSnap(); _focusSnap = i; } }
function edUp(i, o) { edDo(B => Object.assign(B[i], o), i); }
function edMove(i, d) { const j = i + d; if (j < 0 || j >= curB().length) return; edDo(B => B.splice(j, 0, B.splice(i, 1)[0]), j); }
function edDup(i) { edDo(B => B.splice(i + 1, 0, JSON.parse(JSON.stringify(B[i]))), i + 1); toast('ทำสำเนาบล็อกแล้ว'); }
function edDel(i) { edDo(B => B.splice(i, 1), -1); toast('ลบแล้ว · กด ย้อนกลับ เพื่อเอาคืน'); }
function edType(i, t) { edDo(B => { const h = B[i].html; B[i] = Object.assign(newBlock(t), { html: h.replace(/<\/?(ul|ol|li|p|div|h\d)[^>]*>/g, ' ').trim() }); }, i); edFocusBlock(i); }
function edInsert(t, at) {
  if (at == null) at = ED.sel >= 0 ? ED.sel + 1 : curB().length;
  const go = src => { edDo(B => B.splice(at, 0, newBlock(t, src)), at); edFocusBlock(at); $(`.blk[data-i="${at}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  if (t === 'img') return edPick(s => go(s[0]));
  go();
}
function edFocusBlock(i) { setTimeout(() => { const el = $(`.blk[data-i="${i}"] .ed-txt`); if (el) { el.focus(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } }, 30); }
function edKey(e, i, el) {
  if (e.key === '/' && !el.textContent.trim()) { e.preventDefault(); edMenu(i, el, true); return; }
  if (e.key === 'Backspace' && !el.textContent.trim() && !el.querySelector('img') && curB().length > 1) { e.preventDefault(); edDo(B => B.splice(i, 1), Math.max(0, i - 1)); edFocusBlock(Math.max(0, i - 1)); return; }
  if (e.key === 'Enter' && !e.shiftKey && curB()[i].t !== 'p') { e.preventDefault(); edDo(B => B.splice(i + 1, 0, newBlock('p')), i + 1); edFocusBlock(i + 1); }
}
function edLink() { const u = prompt('ใส่ลิงก์ (URL)', 'https://'); if (u) document.execCommand('createLink', false, u); }
function edGrid(i, w, d) {
  edDo(B => { const g = B[i];
    if (w === 'c') { g.cols = Math.min(6, Math.max(1, g.cols + d)); }
    else { const rows = Math.max(1, Math.ceil(g.cells.length / g.cols)) + d; if (rows < 1) return; const n = rows * g.cols;
      while (g.cells.length < n) g.cells.push({ src: '', cs: 1, rs: 1 }); while (g.cells.length > n) g.cells.pop(); }
  }, i);
}
function edCell(i, n, o) { edDo(B => Object.assign(B[i].cells[n], o), i); }
function edCellMove(i, n, d) { const c = curB()[i].cells, j = n + d; if (j < 0 || j >= c.length) return; edDo(B => B[i].cells.splice(j, 0, B[i].cells.splice(n, 1)[0]), i); }
function edCol(i, n, o) { edDo(B => { const c = B[i].cols[n]; Object.assign(c, o); if (o.k === 'txt') c.html ??= ''; }, i); }
function edColMove(i, n, d) { edDo(B => B[i].cols.splice(n + d, 0, B[i].cols.splice(n, 1)[0]), i); }
function edColsTpl(i, t) { edDo(B => { const b = B[i], n = t.split('-').length; b.tpl = t; while (b.cols.length < n) b.cols.push({ k: 'txt', html: '' }); b.cols.length = n; }, i); }

/* ---------- drag to reorder ---------- */
function edDragStart(e, i) { ED.drag = i; const blk = e.target.closest('.blk'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'blk'); try { e.dataTransfer.setDragImage(blk, 24, 20); } catch (x) { } setTimeout(() => blk.classList.add('dragging'), 0); }
function edDragEnd() { ED.drag = null; $$('.blk').forEach(b => b.classList.remove('dragging', 'drop-b', 'drop-a')); }
function edOver(e, i) {
  const files = e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  if (ED.drag == null && !files) return; e.preventDefault(); if (i < 0) return; e.stopPropagation();
  const el = e.currentTarget, r = el.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
  $$('.blk').forEach(b => b !== el && b.classList.remove('drop-b', 'drop-a')); el.classList.toggle('drop-a', after); el.classList.toggle('drop-b', !after);
}
function edDrop(e, i) {
  e.preventDefault(); e.stopPropagation();
  let to = curB().length;
  if (i >= 0) { const r = e.currentTarget.getBoundingClientRect(); to = e.clientY > r.top + r.height / 2 ? i + 1 : i; }
  if (e.dataTransfer.files?.length) { readFiles(e.dataTransfer.files, s => edDo(B => B.splice(to, 0, ...s.map(x => newBlock('img', x))), to)); edDragEnd(); return; }
  const from = ED.drag; edDragEnd(); if (from == null || to === from || to === from + 1) return;
  edDo(B => { const [m] = B.splice(from, 1); B.splice(to > from ? to - 1 : to, 0, m); }, to > from ? to - 1 : to);
}
function edFileOver(e) { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); e.stopPropagation(); } }
function edFileDrop(e, cb) { if (!e.dataTransfer.files?.length) return; e.preventDefault(); e.stopPropagation(); readFiles(e.dataTransfer.files, cb); }
function readFiles(fl, cb) {
  const fs = [...fl].filter(f => /^image\//.test(f.type)); if (!fs.length) return toast('รองรับเฉพาะไฟล์รูปภาพ');
  Promise.all(fs.map(f => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); }))).then(cb);
}

/* ---------- resize image by dragging the handle ---------- */
function edResize(e, i) {
  e.preventDefault(); e.stopPropagation();
  const fig = e.target.closest('figure'), cont = fig.parentElement.getBoundingClientRect().width, b = curB()[i], badge = fig.querySelector('.rs-w');
  const fr = fig.getBoundingClientRect(), x0 = e.clientX, w0 = fr.width, k = b.align === 'c' ? 2 : b.align === 'r' ? -1 : 1;
  fig.classList.add('sizing'); edSnap();
  const mv = ev => { let w = Math.round((w0 + (ev.clientX - x0) * k) / cont * 100 / 5) * 5; w = Math.max(15, Math.min(100, w)); b.w = w; fig.style.width = w + '%'; badge.textContent = w + '%'; };
  const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); fig.classList.remove('sizing'); edSave(); edRender(); };
  addEventListener('pointermove', mv); addEventListener('pointerup', up);
}

/* ---------- block menu ---------- */
function edMenu(at, el, replace) {
  edCloseMenu(); const r = el.getBoundingClientRect();
  const m = document.createElement('div'); m.id = 'edMenu'; m.className = 'ed-menu fade';
  m.innerHTML = `<p class="px-2 pt-1 pb-2 text-[11px] text-muted">เพิ่มบล็อก</p><div class="grid grid-cols-2 gap-0.5">${BTYPES.map(([t, l, ic]) => `<button onclick="edCloseMenu();${replace ? `edDo(B=>B.splice(${at},1),-1);` : ''}edInsert('${t}',${at == null ? 'null' : at})"><i data-lucide="${ic}" class="w-4 h-4 text-maroon"></i>${l}</button>`).join('')}</div>`;
  document.body.appendChild(m);
  const top = Math.min(r.bottom + 6, innerHeight - m.offsetHeight - 10), left = Math.min(r.left, innerWidth - m.offsetWidth - 10);
  m.style.top = Math.max(10, top) + 'px'; m.style.left = Math.max(10, left) + 'px'; icons();
  setTimeout(() => addEventListener('mousedown', edMenuOut), 0);
}
function edMenuOut(e) { if (!e.target.closest('#edMenu')) edCloseMenu(); }
function edCloseMenu() { $('#edMenu')?.remove(); removeEventListener('mousedown', edMenuOut); }

/* ---------- image picker: library or upload ---------- */
function edPick(cb) {
  ED.cb = cb; const multi = ED.multi; ED.multi = false; ED.pickSel = [];
  openModal(`<div class="p-5"><div class="flex items-center justify-between"><p class="font-medium">${multi ? 'เลือกรูป (เลือกได้หลายรูป)' : 'เลือกรูป'}</p><button class="btn btn-g !px-2" onclick="closeModal()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <label class="mt-4 flex flex-col items-center justify-center gap-1.5 h-28 rounded-xl border border-dashed border-[#d9cfcf] bg-sand/50 text-muted cursor-pointer hover:border-maroon hover:text-maroon" ondragover="event.preventDefault()" ondrop="event.preventDefault();readFiles(event.dataTransfer.files,s=>{closeModal();ED.cb(s)})">
      <i data-lucide="upload" class="w-5 h-5"></i><span class="text-[13px]">อัปโหลดจากเครื่อง หรือลากไฟล์มาวาง</span><span class="text-[11px]">JPG, PNG, WebP · ระบบจริงจะย่อและแปลงเป็น WebP ให้อัตโนมัติ</span>
      <input type="file" accept="image/*" ${multi ? 'multiple' : ''} class="hidden" onchange="readFiles(this.files,s=>{closeModal();ED.cb(s)})"/></label>
    <p class="text-[12px] text-muted mt-4 mb-2">หรือเลือกจากคลังรูปเรือ</p>
    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[46vh] overflow-y-auto">${FLEET.slice(0, 40).map(b => `<button class="pk relative rounded-lg overflow-hidden ring-1 ring-line hover:ring-maroon" onclick="${multi ? `this.classList.toggle('on');const x='${b.slug}',a=ED.pickSel,k=a.indexOf(x);k<0?a.push(x):a.splice(k,1);$('#pkN').textContent=a.length` : `closeModal();ED.cb([THUMBS['${b.slug}']])`}"><img src="${THUMBS[b.slug]}" class="w-full aspect-[4/3] object-cover"/><span class="pk-c"><i data-lucide="check" class="w-3 h-3"></i></span></button>`).join('')}</div>
    ${multi ? `<div class="flex justify-end mt-4"><button class="btn btn-p" onclick="closeModal();ED.cb(ED.pickSel.map(s=>THUMBS[s]))">เพิ่ม <span id="pkN">0</span> รูป</button></div>` : ''}</div>`);
}

/* ---------- hook into article editor & translation flow ---------- */
const _vArticleEdit = vArticleEdit;
vArticleEdit = function (id) { if (AE.id !== +id || ED.lang !== AE.lang) { ED.hist = []; ED.fut = []; ED.sel = -1; ED.lang = AE.lang; _focusSnap = -2; } _vArticleEdit(id); edHistBtns(); edPostRender(); };
const _artTranslate = artTranslate;
artTranslate = function (id) {
  const a = artById(id); a.blocks ??= {};
  const src = a.tr.th === 'orig' || a.tr.th === 'ok' ? 'th' : 'en', to = src === 'th' ? 'en' : 'th', wasEmpty = !txtOf(a.body[to]);
  if (a.blocks[src]) a.body[src] = blocksHtml(a.blocks[src]);
  _artTranslate(id);
  if (wasEmpty && a.blocks[src]) { a.blocks[to] = [{ t: 'p', html: `<i>${to === 'en' ? 'Machine translation – please review before publishing.' : 'คำแปลจากเครื่อง – กรุณาตรวจทานก่อนเผยแพร่'}</i>` }, ...JSON.parse(JSON.stringify(a.blocks[src]))]; a.body[to] = blocksHtml(a.blocks[to]); vArticleEdit(id); }
};
const _artApprove = artApprove;
artApprove = function (id) { const a = artById(id), B = blocksOf(a, AE.lang); if (B[0] && /Machine translation|คำแปลจากเครื่อง/.test(B[0].html || '')) B.shift(); a.body[AE.lang] = blocksHtml(B); _artApprove(id); };
readMin; /* body HTML is regenerated from blocks, so reading time keeps working */
document.addEventListener('keydown', e => { if (CUR !== 'articles' || !$('#edCanvas')) return; const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z' && !document.activeElement?.isContentEditable) { e.preventDefault(); e.shiftKey ? edRedo() : edUndo(); }
  if (e.key === 'Delete' && ED.sel >= 0 && !document.activeElement?.isContentEditable && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) edDel(ED.sel); });
try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { }

