/* =====================================================================
   BILINGUAL CONTENT (TH / EN) – every customer-facing field is { th, en }
   ===================================================================== */
const LANGS = [['th', 'TH', 'ไทย'], ['en', 'EN', 'English']];
let REG = [];
const tr = (th = '', en = '') => ({ th, en });
const filled = o => !!(o && String(o.th || '').trim() && String(o.en || '').trim());
/* two inputs side by side; edits write straight into the {th,en} object */
function bi(label, o, { rows = 0, ph = '', hint = '' } = {}) {
  const i = REG.push(o) - 1;
  const one = ([k, code]) => { const v = o[k] || '', miss = !String(v).trim();
    const inp = rows ? `<textarea rows="${rows}" class="inp ${miss ? 'bi-miss' : ''}" placeholder="${miss ? (k === 'en' ? 'Not translated yet' : 'ยังไม่ได้แปล') : ''}" oninput="biSet(${i},'${k}',this)">${esc(v)}</textarea>`
      : `<input class="inp ${miss ? 'bi-miss' : ''}" value="${esc(v)}" placeholder="${miss ? (k === 'en' ? 'Not translated yet' : 'ยังไม่ได้แปล') : ph}" oninput="biSet(${i},'${k}',this)"/>`;
    return `<div class="relative"><span class="bi-tag">${code}</span>${inp}</div>`; };
  return `<div class="bi"><div class="flex items-center justify-between mb-1.5"><span class="lbl !mb-0">${label}</span>${hint ? `<span class="text-[10px] text-muted">${hint}</span>` : ''}</div><div class="grid md:grid-cols-2 gap-2">${LANGS.map(one).join('')}</div></div>`;
}
function biSet(i, k, el) { REG[i][k] = el.value; el.classList.toggle('bi-miss', !el.value.trim()); }

/* small Thai glossary for brochure terms — gives a first draft, staff review it */
const GLOSS = [[/Half Day( Mor| Aft)?/gi, (m, p) => 'ครึ่งวัน' + (p ? (/mor/i.test(p) ? ' (เช้า)' : ' (บ่าย)') : '')], [/Full Day/gi, 'เต็มวัน'], [/Sunset Cruise|Sunset/gi, 'ล่องเรือชมพระอาทิตย์ตก'], [/Over ?night/gi, 'ค้างคืน'], [/(\d+)\s*hrs?\.?/gi, '$1 ชม.'],
  [/^Captain,? Crew( and Hostess)?$/i, 'กัปตัน ลูกเรือ$1'], [/ and Hostess/i, ' และสจ๊วต'], [/^Snorkell?ing Gear$/i, 'อุปกรณ์ดำน้ำตื้น'], [/^Travel Insurance$/i, 'ประกันการเดินทาง'], [/^Vat 7%$/i, 'VAT 7%'], [/^Fuel$/i, 'น้ำมันเชื้อเพลิง'],
  [/^Water & Non alcohol drink$/i, 'น้ำดื่มและเครื่องดื่มไม่มีแอลกอฮอล์'], [/^Towel & Refreshing Towel$/i, 'ผ้าเช็ดตัวและผ้าเย็น'], [/^Snack & Fruit$/i, 'ขนมและผลไม้'], [/^Fresh Fruits?$/i, 'ผลไม้สด'], [/^Land transfer$/i, 'รถรับส่ง'], [/^Meals?$/i, 'อาหาร'],
  [/^Paddle Board x? ?(\d+)$/i, 'แพดเดิลบอร์ด $1 ลำ'], [/^JBL Speaker \/ Bluetooth$/i, 'ลำโพง JBL / บลูทูธ'], [/^Floating Pool$/i, 'สระลอยน้ำ'], [/^Dingy$/i, 'เรือเล็ก (Dinghy)'], [/^Alcoholic (Beverages?|drinks?)$/i, 'เครื่องดื่มแอลกอฮอล์'], [/Island Fee/i, 'ค่าธรรมเนียมเกาะ'], [/Marina Fee/i, 'ค่าธรรมเนียมท่าเรือ'], [/National Park Fee/i, 'ค่าอุทยานแห่งชาติ']];
const autoTh = s => { let o = s, hit = false; GLOSS.forEach(([re, to]) => { const n = o.replace(re, to); if (n !== o) { hit = true; o = n; } }); return hit ? o : ''; };

FLEET.forEach(b => {
  b.i18n = {
    name: tr(b.name, b.name), subtitle: tr('', b.subtitle),
    desc: tr(`${b.name} ${TYPE_TH[b.type]}ส่วนตัว รับได้สูงสุด ${b.pax || '-'} คน ออกจาก ${b.marinaP} รวมกัปตัน ลูกเรือ และประกันภัย`, `${b.name} is a private ${ { yacht: 'motor yacht', sail: 'sailing catamaran', power: 'power catamaran', speed: 'speedboat', longtail: 'long-tail boat' }[b.type] } for up to ${b.pax || '-'} guests, departing from ${b.marinaP}. Captain, crew and insurance included.`),
    programs: b.tables.map(t => t.rows.map(r => tr(autoTh(r[0]), r[0]))),
    includes: b.includes.map(x => tr(autoTh(x), x)), complimentary: b.complimentary.map(x => tr(autoTh(x), x)), not_included: b.not_included.map(x => tr(autoTh(x), x)),
    slots: b.time_slots.map(([k]) => tr(autoTh(k), k)), notes: tr('', b.notes.join('\n')),
    seoTitle: tr(`${b.name} เช่าเรือภูเก็ต – เริ่ม ${baht(b.from_)} | BTT`, `${b.name} Yacht Charter Phuket – from $${Math.round((b.from_ || 0) / 33.42).toLocaleString()} | BTT`),
    seoDesc: tr(`${b.name} ${TYPE_TH[b.type]} รับได้ ${b.pax || '-'} คน ออกจาก ${b.marinaP} ราคาเริ่มต้น ${baht(b.from_)} รวมกัปตันและประกัน`, `${b.name} for up to ${b.pax || '-'} guests from ${b.marinaP}. From $${Math.round((b.from_ || 0) / 33.42).toLocaleString()} incl. crew & insurance.`),
  };
  if (['leopard-90-ft', 'splo-74-ft', 'vtech-68-ft'].includes(b.slug)) { b.i18n.subtitle.th = b.subtitle; b.i18n.notes.th = 'ราคาพื้นฐานรองรับตามจำนวนคนที่ระบุ มีค่าใช้จ่ายเพิ่มสำหรับผู้โดยสารเกิน'; }
});
function boatI18nFields(b) { const i = b.i18n; return [i.name, i.subtitle, i.desc, ...i.programs.flat(), ...i.includes, ...i.complimentary, ...i.not_included, ...i.slots, i.notes, i.seoTitle, i.seoDesc]; }
function langPct(fields, k) { const f = fields.filter(Boolean); return Math.round(f.filter(o => String(o[k] || '').trim()).length / Math.max(1, f.length) * 100); }
const langBadge = (fields) => LANGS.map(([k, c]) => { const p = langPct(fields, k); return `<span class="lang-b ${p === 100 ? 'ok' : p >= 60 ? 'mid' : 'low'}" title="${c} ${p}%">${c} ${p}%</span>`; }).join('');

/* ---------- Boats list: add language column + filter ---------- */
BF.lang = '';
const _vBoats = vBoats;
vBoats = function () {
  _vBoats();
  const tbl = $('#view table'); if (!tbl) return;
  const ths = tbl.querySelectorAll('thead th'); ths[5].insertAdjacentHTML('afterend', '<th>ภาษา</th>');
  tbl.querySelectorAll('tbody tr').forEach(tr0 => { const s = tr0.querySelector('[onclick^="boatEdit"]').getAttribute('onclick').match(/'([^']+)'/)[1]; tr0.children[5].insertAdjacentHTML('afterend', `<td><div class="flex gap-1">${langBadge(boatI18nFields(bySlug(s)))}</div></td>`); });
  const bar = $('#view .card > div'); bar.querySelector('.lg\\:ml-auto').insertAdjacentHTML('afterbegin', `<button class="tab ${BF.lang ? 'on' : ''}" onclick="BF.lang=BF.lang?'':'th';vBoats()">ยังแปลไทยไม่ครบ</button>`);
  if (BF.lang) tbl.querySelectorAll('tbody tr').forEach(tr0 => { const s = tr0.querySelector('[onclick^="boatEdit"]').getAttribute('onclick').match(/'([^']+)'/)[1]; if (langPct(boatI18nFields(bySlug(s)), 'th') === 100) tr0.remove(); });
};

/* ---------- Boat edit: bilingual tabs ---------- */
const _vBoatEdit = vBoatEdit;
vBoatEdit = function (slug) {
  REG = [];
  const b = bySlug(slug); if (!b) return go('boats');
  if (!b.i18n) b.i18n = { name: tr(b.name, b.name), subtitle: tr(), desc: tr(), programs: b.tables.map(t => t.rows.map(() => tr())), includes: [], complimentary: [], not_included: [], slots: [], notes: tr(), seoTitle: tr(), seoDesc: tr() };
  if (!['info', 'incl', 'prices', 'seo'].includes(BE.tab)) return _vBoatEdit(slug), addLangBar(b);
  _vBoatEdit(slug);
  const i = b.i18n, box = $('#view .card .p-5');
  if (BE.tab === 'info') {
    box.insertAdjacentHTML('afterbegin', `<div class="grid gap-4 mb-7">${bi('ชื่อเรือ (แสดงบนเว็บ)', i.name)}${bi('รุ่น / คำโปรยสั้น', i.subtitle)}${bi('คำอธิบายเรือ', i.desc, { rows: 3, hint: 'ย่อหน้า "เกี่ยวกับเรือลำนี้"' })}</div><p class="font-medium mb-3">ข้อมูลพื้นฐาน <span class="text-muted font-normal">(ไม่ต้องแปล)</span></p>`);
    box.querySelectorAll(':scope > .grid.md\\:grid-cols-2 > label').forEach((l, k) => { if (k === 0 || k === 2) l.remove(); });
    const nt = box.querySelector(':scope > textarea'); nt.previousElementSibling.remove(); nt.outerHTML = `<div class="mt-7">${bi('หมายเหตุ / เงื่อนไข', i.notes, { rows: 4 })}</div>`;
  }
  if (BE.tab === 'incl') {
    const col = (k, t) => `<div class="rounded-xl ring-1 ring-line p-4"><p class="font-medium mb-3">${t}</p><div class="space-y-3">${i[k].map((o, n) => `<div class="flex gap-2 items-start"><div class="flex-1">${bi('', o)}</div><button class="btn btn-g !px-2 mt-6" onclick="bySlug('${slug}').i18n['${k}'].splice(${n},1);vBoatEdit('${slug}')"><i data-lucide="x" class="w-4 h-4"></i></button></div>`).join('')}</div><button class="btn btn-g mt-2" onclick="bySlug('${slug}').i18n['${k}'].push(tr());vBoatEdit('${slug}')"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่ม</button></div>`;
    box.innerHTML = `<div class="grid xl:grid-cols-3 gap-4">${col('includes', 'รวมในราคา')}${col('complimentary', 'ฟรี / แถม')}${col('not_included', 'ไม่รวม')}</div>
      <p class="font-medium mt-6 mb-3">รอบเวลา</p><div class="grid md:grid-cols-2 gap-3">${i.slots.map((o, n) => `<div class="rounded-xl ring-1 ring-line p-3">${bi(b.time_slots[n][1], o)}</div>`).join('') || '<p class="text-muted">ยังไม่มีรอบเวลา</p>'}</div>`;
  }
  if (BE.tab === 'prices') {
    box.querySelectorAll('table').forEach((tb, ti) => tb.querySelectorAll('tbody tr').forEach((row, ri) => { const o = i.programs[ti]?.[ri]; if (!o) return; row.children[0].innerHTML = `<div class="grid gap-1 min-w-[260px]"><div class="relative"><span class="bi-tag">TH</span><input class="inp !h-8 ${o.th ? '' : 'bi-miss'}" value="${esc(o.th)}" placeholder="ยังไม่ได้แปล" oninput="biSet(${REG.push(o) - 1},'th',this)"/></div><div class="relative"><span class="bi-tag">EN</span><input class="inp !h-8 ${o.en ? '' : 'bi-miss'}" value="${esc(o.en)}" oninput="biSet(${REG.indexOf(o)},'en',this)"/></div></div>`; }));
  }
  if (BE.tab === 'seo') {
    box.innerHTML = `<div class="grid gap-5 max-w-4xl"><div class="grid md:grid-cols-2 gap-2"><label><span class="lbl">URL ภาษาไทย</span><input class="inp" value="/yacht-charter/${slug}"/></label><label><span class="lbl">URL English</span><input class="inp" value="/en/yacht-charter/${slug}"/></label></div>
      ${bi('Title (≤ 60 ตัวอักษร)', i.seoTitle)}${bi('Meta description (≤ 160 ตัวอักษร)', i.seoDesc, { rows: 3 })}
      <div class="grid md:grid-cols-2 gap-3">${LANGS.map(([k, c]) => `<div><p class="lbl">ตัวอย่างบน Google · ${c}</p><div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] text-[#1e7a46]">boattripthailand.com › ${k === 'en' ? 'en › ' : ''}yacht-charter</p><p class="text-[16px] text-[#1a0dab] mt-1 leading-snug">${esc(i.seoTitle[k] || '—')}</p><p class="text-[12.5px] text-muted mt-1">${esc(i.seoDesc[k] || '—')}</p></div></div>`).join('')}</div>
      <p class="text-[12px] text-muted">ระบบใส่ hreflang th / en / x-default และ canonical ให้อัตโนมัติ</p></div>`;
  }
  addLangBar(b); icons();
};
function addLangBar(b) {
  const head0 = $('#view > div'); if (!head0 || $('#langBar')) return;
  const f = boatI18nFields(b), th = langPct(f, 'th'), en = langPct(f, 'en');
  head0.insertAdjacentHTML('afterend', `<div id="langBar" class="card p-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
    <i data-lucide="languages" class="w-5 h-5 text-maroon shrink-0"></i>
    <div class="flex-1 grid grid-cols-2 gap-4">${[['ไทย', th], ['English', en]].map(([l, p]) => `<div><div class="flex justify-between text-[12px]"><span>${l}</span><span class="tnum ${p === 100 ? 'text-[#1e7a46]' : 'text-muted'}">${p === 100 ? 'ครบ' : p + '%'}</span></div><div class="mt-1 h-1.5 rounded-full bg-sand overflow-hidden"><div class="h-full rounded-full ${p === 100 ? 'bg-[#1e7a46]' : 'bg-maroon'}" style="width:${p}%"></div></div></div>`).join('')}</div>
    <button class="btn btn-o" onclick="autoTranslate('${b.slug}')"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i>แปลช่องที่ว่างอัตโนมัติ</button></div>`);
}
function autoTranslate(slug) {
  const b = bySlug(slug); let n = 0;
  boatI18nFields(b).forEach(o => { if (!o) return; if (!o.th && o.en) { o.th = autoTh(o.en) || '[แปล] ' + o.en; n++; } if (!o.en && o.th) { o.en = '[EN] ' + o.th; n++; } });
  toast(`แปลอัตโนมัติ ${n} ช่อง · กรุณาตรวจทานก่อนเผยแพร่`); $('#langBar')?.remove(); vBoatEdit(slug);
}

/* ---------- Activities: bilingual edit ---------- */
ACTS.forEach(a => { a.i18n = { name: tr(a.th, a.en), loc: tr(a.loc, a.loc), desc: tr(a.desc?.th || '', a.desc?.en || '') }; });
const PDF_DESC = { 'Phuket FantaSea': "Phuket FantaSea is the island's biggest show, with trapeze artists, a cast of hundreds, performing elephants and one of the biggest buffets in Asia, set in a theme park with carnival games and shopping.",
  'Simon Cabaret': 'The unique and popular Simon Cabaret Show offers an evening of glamorous entertainment – musical themes, comedy and a visual spectacular, with photo moments with the stars.',
  'Siam Niramit Phuket': "A spectacular journey through Thailand's arts and culture with over 100 performers, dazzling costumes and stage effects, plus a traditional Thai village and authentic cuisine.",
  'Carnival Magic': "The world's first Thai carnival theme park – parades, glittering shows and over 40 million lights. A magical night of joy, culture and fantasy.",
  'Andamanda Water Park': "Phuket's biggest water park, inspired by Thai mythology and Andaman culture – thrilling slides, wave pools and relaxing lagoons for families and friends." };
/* show descriptions now come from the website data */
const _vActivities = vActivities;
vActivities = function () {
  _vActivities();
  const rows = $$('#view tbody tr'), list = ACTS.filter(a => !AF.cat || a.cat === AF.cat);
  $('#view thead tr').children[4].insertAdjacentHTML('afterend', '<th>ภาษา</th><th></th>');
  rows.forEach((r, n) => { const a = list[n], i = ACTS.indexOf(a); r.children[4].insertAdjacentHTML('afterend', `<td><div class="flex gap-1">${langBadge([a.i18n.name, a.i18n.loc, a.i18n.desc])}</div></td><td class="text-right"><button class="btn btn-g !px-2" onclick="actEdit(${i})" aria-label="edit"><i data-lucide="pencil" class="w-4 h-4"></i></button></td>`); });
  icons();
};
function actEdit(i) {
  REG = []; const a = ACTS[i];
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div><p class="text-[11px] text-muted">${ACAT[a.cat]}</p><p class="font-medium">${esc(a.i18n.name.th || a.i18n.name.en)}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 grid gap-4 content-start">${bi('ชื่อกิจกรรม', a.i18n.name)}${bi('สถานที่', a.i18n.loc)}${bi('รายละเอียด', a.i18n.desc, { rows: 4 })}
      <div class="grid grid-cols-2 gap-3"><label><span class="lbl">ราคา (บาท)</span><input class="inp" value="${a.price ? a.price.toLocaleString() : ''}" onchange="ACTS[${i}].price=+this.value.replace(/[^\\d]/g,'')||null"/></label><label><span class="lbl">ระยะเวลา</span><input class="inp" value="${esc(a.dur)}"/></label></div></div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeDrawer()">ยกเลิก</button><button class="btn btn-p" onclick="ACTS[${i}].th=ACTS[${i}].i18n.name.th;ACTS[${i}].en=ACTS[${i}].i18n.name.en;closeDrawer();vActivities();toast('บันทึกแล้ว')">บันทึก</button></div>`);
}

/* ---------- Website content: bilingual ---------- */
const WEB = {
  tab: 'hero',
  hero: { kicker: tr('Yacht Charter ภูเก็ต', 'Yacht Charter Phuket'), title: tr('ล่องทะเลอันดามัน', 'Sail the Andaman'), sub: tr('เรือส่วนตัว 70 ลำ · ภูเก็ต กระบี่ พังงา', '70 private boats · Phuket, Krabi, Phang Nga'),
    words: [tr('ในแบบของคุณ', 'your way'), tr('กับคนที่คุณรัก', 'with family'), tr('กับเพื่อนทั้งแก๊ง', 'with friends'), tr('แบบส่วนตัว', 'in private')], cta1: tr('ดูเรือทั้งหมด', 'Browse the fleet'), cta2: tr('ให้เราช่วยเลือก', 'Smart Match') },
  promo: { tag: tr('OVERNIGHT CHARTER', 'OVERNIGHT CHARTER'), title: tr('นอนกลางทะเล ตื่นมากับพระอาทิตย์ขึ้นที่อันดามัน', 'Sleep at sea, wake up to an Andaman sunrise'), sub: tr('แพ็กเกจ 2 วัน 1 คืน บนเรือยอชต์ VTECH 68 ฟุต รวมอาหารทุกมื้อ', '2-day, 1-night package on the VTECH 68 ft yacht, all meals included'), cta: tr('ดูแพ็กเกจ', 'View package') },
  faq: [[tr('Yacht charter ภูเก็ตราคาเท่าไหร่?', 'How much does a yacht charter in Phuket cost?'), tr('ราคาขึ้นกับขนาดเรือ เส้นทาง และฤดูกาล…', 'Prices depend on boat size, route and season…')],
    [tr('ราคา yacht charter รวมอะไรบ้าง?', 'What is included in a yacht charter?'), tr('โดยทั่วไปรวมกัปตันและลูกเรือ น้ำมัน…', 'Usually captain and crew, fuel…')],
    [tr('ช่วงไหนเหมาะกับการเช่าเรือยอชต์ในภูเก็ตที่สุด?', 'When is the best time for a yacht charter in Phuket?'), tr('High Season (พ.ย.–เม.ย.) ทะเลสงบ…', 'High Season (Nov–Apr) brings calm seas…')],
    [tr('เช่าเรือยอชต์ได้กี่คน?', 'How many guests can join?'), tr('ตั้งแต่ 2 คน ไปจนถึง 145 คน…', 'From 2 up to 145 guests…')],
    [tr('ต้องจองล่วงหน้ากี่วัน และยกเลิกได้ไหม?', ''), tr('แนะนำจองล่วงหน้า 3–7 วัน…', '')],
    [tr('ออกเรือจากท่าไหน?', 'Which pier do we depart from?'), tr('เรือของเราออกจาก Royal Phuket Marina…', 'Our boats depart from Royal Phuket Marina…')]],
  seo: { title: tr('Yacht Charter ภูเก็ต – เช่าเรือยอชต์ 70 ลำ | Boat Trip Thailand', 'Yacht Charter Phuket – 70 Private Boats | Boat Trip Thailand'), desc: tr('Yacht Charter ภูเก็ต เช่าเรือยอชต์ส่วนตัว คาตามารัน สปีดโบ๊ท 70 ลำ ไปพีพี อ่าวพังงา เกาะราชา…', 'Yacht charter in Phuket with 70 private yachts, catamarans and speedboats…') },
  pages: [['เกี่ยวกับเรา', '/about-us'], ['นโยบายความเป็นส่วนตัว', '/privacy-policy'], ['ข้อกำหนดและเงื่อนไข', '/terms-and-conditions'], ['การตั้งค่าคุกกี้', '/cookie-preferences'], ['คู่มือเช่าเรือ (SEO)', '/#guide']].map(([n, u], k) => ({ n, u, th: 100, en: k === 4 ? 70 : 100 })),
};
const webFields = () => [...Object.values(WEB.hero).flat(), ...Object.values(WEB.promo), ...WEB.faq.flat(), WEB.seo.title, WEB.seo.desc];
vContent = function () {
  REG = [];
  const tabs = [['hero', 'Hero หน้าแรก'], ['promo', 'แบนเนอร์โปรโมชั่น'], ['faq', 'FAQ'], ['pages', 'หน้าเพจ'], ['seo', 'SEO หน้าหลัก']];
  const H = WEB.hero; let body = '';
  if (WEB.tab === 'hero') body = `<div class="grid gap-4">${bi('ป้ายเล็กด้านบน', H.kicker)}${bi('หัวข้อหลัก', H.title)}
      <div><p class="lbl">คำที่หมุนเปลี่ยนตามสไลด์</p><div class="grid gap-2">${H.words.map((w, n) => `<div class="flex gap-2 items-start"><span class="w-6 h-9 grid place-items-center text-muted tnum">${n + 1}</span><div class="flex-1">${bi('', w)}</div><button class="btn btn-g !px-2" onclick="WEB.hero.words.splice(${n},1);vContent()"><i data-lucide="x" class="w-4 h-4"></i></button></div>`).join('')}</div><button class="btn btn-g mt-1" onclick="WEB.hero.words.push(tr());vContent()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มคำ</button></div>
      ${bi('คำอธิบาย', H.sub)}<div class="grid md:grid-cols-2 gap-4">${bi('ปุ่มหลัก', H.cta1)}${bi('ปุ่มรอง', H.cta2)}</div></div>
    <p class="font-medium mt-7 mb-3">สไลด์รูปเรือ <span class="text-muted font-normal">(ใช้ชื่อเรือตามภาษาที่ตั้งไว้ในหน้าเรือ)</span></p>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">${CONTENT.heroSlides.map((s, n) => `<div class="rounded-xl overflow-hidden ring-1 ring-line"><img src="${THUMBS[s]}" class="w-full aspect-[16/10] object-cover"/><div class="p-2 text-[12px] truncate">${n + 1}. ${bySlug(s).name}</div></div>`).join('')}</div>`;
  if (WEB.tab === 'promo') { const P = WEB.promo; body = `<div class="grid gap-4">${bi('ป้าย', P.tag)}${bi('หัวข้อ', P.title)}${bi('รายละเอียด', P.sub, { rows: 2 })}${bi('ข้อความปุ่ม', P.cta)}
      <div class="grid md:grid-cols-3 gap-3"><label><span class="lbl">เรือที่ลิงก์ไป</span><select class="inp">${FLEET.map(b => `<option ${b.slug === 'vtech-68-ft' ? 'selected' : ''}>${b.name}</option>`).join('')}</select></label><label><span class="lbl">เริ่มแสดง</span><input type="date" class="inp" value="${iso(TODAY)}"/></label><label><span class="lbl">สิ้นสุด</span><input type="date" class="inp" value="${iso(addDays(TODAY, 60))}"/></label></div></div>`; }
  if (WEB.tab === 'faq') body = `<div class="space-y-3">${WEB.faq.map(([q, a], n) => `<div class="rounded-xl ring-1 ring-line p-4 grid gap-3"><div class="flex items-center justify-between"><span class="text-[12px] text-muted">คำถามที่ ${n + 1}</span><div class="flex items-center gap-2">${langBadge([q, a])}<button class="btn btn-g !px-2" onclick="WEB.faq.splice(${n},1);vContent()"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div></div>${bi('คำถาม', q)}${bi('คำตอบ', a, { rows: 3 })}</div>`).join('')}<button class="btn btn-o" onclick="WEB.faq.push([tr(),tr()]);vContent()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มคำถาม</button></div><p class="text-[12px] text-muted mt-4">FAQ แต่ละภาษาส่งออกเป็น FAQPage schema ของหน้านั้นๆ อัตโนมัติ</p>`;
  if (WEB.tab === 'pages') body = `<div class="overflow-x-auto"><table class="tbl"><thead><tr><th>หน้า</th><th>URL</th><th>ภาษา</th><th></th></tr></thead><tbody>${WEB.pages.map(p => `<tr><td>${p.n}</td><td class="text-muted">${p.u} · /en${p.u}</td><td><div class="flex gap-1"><span class="lang-b ok">TH ${p.th}%</span><span class="lang-b ${p.en === 100 ? 'ok' : 'mid'}">EN ${p.en}%</span></div></td><td class="text-right"><button class="btn btn-g" onclick="toast('เปิดตัวแก้ไขหน้า (จำลอง)')"><i data-lucide="pencil" class="w-3.5 h-3.5"></i>แก้ไข</button></td></tr>`).join('')}</tbody></table></div>`;
  if (WEB.tab === 'seo') body = `<div class="grid gap-4 max-w-4xl">${bi('Title หน้าแรก', WEB.seo.title)}${bi('Meta description', WEB.seo.desc, { rows: 3 })}<label><span class="lbl">รูป OG (แชร์ลงโซเชียล) · ใช้ร่วมกันทั้ง 2 ภาษา</span><div class="flex gap-3 items-center"><img src="${THUMBS['leopard-90-ft']}" class="w-40 aspect-[1200/630] object-cover rounded-lg"/><button class="btn btn-o">เปลี่ยนรูป</button></div></label></div>`;
  const f = webFields();
  $('#view').innerHTML = `${head('เนื้อหาเว็บไซต์', 'ทุกข้อความมีช่องภาษาไทยและอังกฤษคู่กัน · ช่องที่ยังไม่แปลมีกรอบสีแดง', `<div class="flex items-center gap-1 mr-1">${langBadge(f)}</div><button class="btn btn-o" onclick="window.open('boattripthailand-mockup.html','_blank')"><i data-lucide="eye" class="w-3.5 h-3.5"></i>Preview</button><button class="btn btn-p" onclick="${langPct(f, 'en') < 100 || langPct(f, 'th') < 100 ? "toast('ยังมีช่องที่ไม่ได้แปล · ภาษานั้นจะแสดงข้อความภาษาไทยแทน')" : "toast('เผยแพร่แล้ว')"}"><i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>เผยแพร่</button>`)}
    <div class="card"><div class="px-3 pt-3 pb-3 flex gap-1 overflow-x-auto no-sb border-b border-line">${tabs.map(([k, l]) => `<button class="tab ${WEB.tab === k ? 'on' : ''}" onclick="WEB.tab='${k}';vContent()">${l}</button>`).join('')}</div><div class="p-5 fade">${body}</div></div>`;
  icons();
};

/* ---------- Settings: language card ---------- */
const _vSettings = vSettings;
vSettings = function () {
  _vSettings();
  $('#view .grid').insertAdjacentHTML('afterbegin', `<div class="card p-5"><p class="font-medium">ภาษาของเว็บไซต์</p><p class="text-[12px] text-muted mt-1">ทุกข้อความที่ลูกค้าเห็นเก็บเป็นคู่ ไทย / อังกฤษ</p>
    <div class="mt-4 space-y-2.5">${[['ไทย', 'th', '/', true, true], ['English', 'en', '/en/', true, false], ['中文', 'zh', '/zh/', false, false], ['Русский', 'ru', '/ru/', false, false]].map(([l, c, u, on, def]) => `<div class="flex items-center gap-3"><span class="w-10 text-[11px] text-muted uppercase">${c}</span><span class="flex-1">${l} <span class="text-muted text-[11px]">${u}</span>${def ? ' <span class="pill st-confirmed ml-1">ภาษาหลัก</span>' : ''}${!on ? ' <span class="text-[11px] text-muted">(เปิดใช้ภายหลังได้)</span>' : ''}</span><span class="tgl"><input type="checkbox" ${on ? 'checked' : ''} ${def ? 'disabled' : ''}/><span></span></span></div>`).join('')}</div>
    <div class="mt-4 grid gap-2.5"><label class="flex items-center justify-between gap-3"><span>ถ้าข้อความภาษาอังกฤษยังว่าง ให้แสดงภาษาไทยแทน</span><span class="tgl"><input type="checkbox" checked/><span></span></span></label><label class="flex items-center justify-between gap-3"><span>หน้าภาษาอังกฤษแสดงราคาเป็น USD</span><span class="tgl"><input type="checkbox" checked/><span></span></span></label></div></div>`);
  icons();
};

/* ---------- Dashboard: translation status card ---------- */
const _vDashboard = vDashboard;
vDashboard = function () {
  _vDashboard();
  const bf = FLEET.flatMap(boatI18nFields), af = ACTS.flatMap(a => [a.i18n.name, a.i18n.loc, a.i18n.desc]), wf = webFields();
  const row = (l, f, to) => `<li class="flex items-center gap-3 cursor-pointer" onclick="go('${to}')"><span class="flex-1">${l}</span>${langBadge(f)}</li>`;
  const last = $$('#view .grid.xl\\:grid-cols-3').pop().lastElementChild;
  last.insertAdjacentHTML('beforeend', `<p class="font-medium mt-6 flex items-center gap-2"><i data-lucide="languages" class="w-4 h-4 text-maroon"></i>สถานะการแปล</p><ul class="mt-3 space-y-2.5">${row('เรือ 70 ลำ', bf, 'boats')}${row('กิจกรรม', af, 'activities')}${row('เนื้อหาเว็บ', wf, 'content')}</ul>`);
  icons();
};
const OVR = { dashboard: vDashboard, boats: vBoats, activities: vActivities, content: vContent, settings: vSettings };
PAGES.forEach(p => { if (OVR[p[0]]) p[3] = OVR[p[0]]; });
