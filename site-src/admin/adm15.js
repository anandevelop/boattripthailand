/* =====================================================================
   SITE SETTINGS – brand (logo / favicon), contact, address, social,
   company & licence, notifications, maintenance; plus existing booking & language settings
   ===================================================================== */
const SITECFG = {
  tab: 'brand',
  name: tr('Boat Trip Thailand', 'Boat Trip Thailand'), tagline: tr('เช่าเรือยอชต์ส่วนตัว ภูเก็ต', 'Private yacht charter in Phuket'),
  logo: '', logoDark: '', favicon: '', ogDefault: '', color: '#70000e',
  phone: '+66 61 172 5854', email: 'booking@boattripthailand.com', wa: '+66 61 172 5854', line: '@boattripthailand', lineUrl: 'https://line.me/R/ti/p/@boattripthailand',
  address: tr('ภูเก็ต ประเทศไทย', 'Phuket, Thailand'), map: '', hours: tr('ทุกวัน 08:00–20:00', 'Daily 08:00–20:00'),
  marinas: ['Royal Phuket Marina', 'Ao Po Grand Marina', 'Chalong Pier', 'Boat Lagoon', 'ONE°15 Panwa'],
  social: [
    { k: 'facebook', l: 'Facebook', icon: 'facebook', url: 'https://facebook.com/boattripthailand', on: true },
    { k: 'instagram', l: 'Instagram', icon: 'instagram', url: 'https://instagram.com/boattripthailand', on: true },
    { k: 'youtube', l: 'YouTube', icon: 'youtube', url: '', on: true },
    { k: 'tiktok', l: 'TikTok', icon: 'music-2', url: '', on: true },
    { k: 'line', l: 'LINE', icon: 'message-circle', url: 'https://line.me/R/ti/p/@boattripthailand', on: true },
    { k: 'whatsapp', l: 'WhatsApp', icon: 'phone', url: 'https://wa.me/66611725854', on: false },
    { k: 'x', l: 'X / Twitter', icon: 'twitter', url: '', on: false },
  ],
  company: 'Boat Trip (Thailand) Co., Ltd.', companyTh: 'บริษัท โบ๊ท ทริป (ประเทศไทย) จำกัด', tax: '', tat: '34/03754', regAddr: tr('', ''),
  notify: { emails: 'booking@boattripthailand.com', line: true, wa: false, daily: true },
  maint: false, maintMsg: tr('ขณะนี้เว็บไซต์กำลังปรับปรุง กรุณาติดต่อเราทาง LINE หรือโทร', 'We are updating the website. Please contact us via LINE or phone.'),
  copyright: tr('© 2026 Boat Trip Thailand สงวนลิขสิทธิ์', '© 2026 Boat Trip Thailand. All rights reserved.'),
};
const ICON_OPTS = ['facebook', 'instagram', 'youtube', 'music-2', 'message-circle', 'phone', 'send', 'twitter', 'linkedin', 'globe', 'mail', 'link-2'];
const CFG_TABS = [['brand', 'แบรนด์ & โลโก้', 'palette'], ['contact', 'ข้อมูลติดต่อ & ที่อยู่', 'map-pin'], ['social', 'โซเชียลมีเดีย', 'share-2'], ['company', 'บริษัท & ใบอนุญาต', 'file-badge'], ['booking', 'สกุลเงินที่แสดง', 'coins'], ['lang', 'ภาษา', 'languages'], ['notify', 'แจ้งเตือน', 'bell'], ['system', 'ระบบ', 'wrench']];
(() => { const L = $('#side img')?.src || ''; SITECFG.logo = L; SITECFG.logoDark = L; SITECFG.favicon = $('link[rel=icon]')?.href || L; SITECFG.ogDefault = THUMBS['leopard-90-ft']; })();
const cfgIn = (k, l, ph = '', type = 'text', mono = false) => `<label><span class="lbl">${l}</span><input type="${type}" class="inp ${mono ? 'font-mono !text-[12.5px]' : ''}" value="${esc(SITECFG[k] || '')}" placeholder="${ph}" oninput="SITECFG.${k}=this.value;cfgPreview()"/></label>`;
function imgSlot(k, l, hint, { bg = '#fff', ratio = 'aspect-[3/1]', fit = 'object-contain' } = {}) {
  return `<div><p class="lbl">${l}</p><div class="flex items-center gap-3"><div class="w-40 ${ratio} rounded-xl ring-1 ring-line grid place-items-center overflow-hidden shrink-0" style="background:${bg}"><img src="${SITECFG[k]}" class="${fit.includes('cover') ? fit : fit}" style="${fit.includes('cover') ? '' : `height:${ratio.includes('square') ? 56 : 40}px;width:auto;max-width:85%`}"/></div>
    <div class="grid gap-1.5"><div class="flex flex-wrap gap-1.5"><label class="btn btn-o !h-8 cursor-pointer"><i data-lucide="upload" class="w-3.5 h-3.5"></i>อัปโหลด<input type="file" accept="image/*,.svg,.ico" class="hidden" onchange="readFiles(this.files,s=>{SITECFG.${k}=s[0];vSettings()})"/></label><button class="btn btn-o !h-8" onclick="mediaPicker(s=>{SITECFG.${k}=s[0];vSettings()},{title:'เลือกจากคลังสื่อ'})"><i data-lucide="images" class="w-3.5 h-3.5"></i>คลังสื่อ</button></div><p class="text-[11px] text-muted">${hint}</p></div></div></div>`;
}
function footerPreview() {
  const C = SITECFG, soc = C.social.filter(s => s.on);
  return `<div id="cfgFoot" class="rounded-2xl p-6 text-[#f2e7e8]" style="background:#3a0007">
    <div class="flex items-center gap-2.5 mb-5"><img src="${C.logoDark}" class="w-9 h-9 object-contain"/><div class="leading-none"><p class="text-[13px] tracking-wide text-white">${esc(C.name.en).toUpperCase()}</p><p class="text-[10px] opacity-60 mt-1">${esc(C.tagline.th)}</p></div></div>
    <ul class="grid gap-3 text-[14px]"><li class="flex gap-3"><i data-lucide="phone" class="w-4 h-4 mt-0.5 shrink-0"></i>${esc(C.phone)}</li><li class="flex gap-3"><i data-lucide="mail" class="w-4 h-4 mt-0.5 shrink-0"></i>${esc(C.email)}</li>
      ${C.address.th ? `<li class="flex gap-3"><i data-lucide="map-pin" class="w-4 h-4 mt-0.5 shrink-0"></i>${esc(C.address.th)}</li>` : ''}
      <li class="flex gap-3"><i data-lucide="anchor" class="w-4 h-4 mt-0.5 shrink-0"></i>${C.marinas.map(esc).join(' · ')}</li>
      ${C.hours.th ? `<li class="flex gap-3"><i data-lucide="clock" class="w-4 h-4 mt-0.5 shrink-0"></i>${esc(C.hours.th)}</li>` : ''}</ul>
    <div class="flex flex-wrap gap-2 mt-5">${soc.map(s => `<span class="w-10 h-10 rounded-full bg-white/10 grid place-items-center ${s.url ? '' : 'opacity-40'}" title="${s.l}${s.url ? '' : ' (ยังไม่มีลิงก์)'}"><i data-lucide="${s.icon}" class="w-4 h-4"></i></span>`).join('')}</div>
    <p class="text-[11px] opacity-50 mt-5 pt-4 border-t border-white/10">${esc(C.copyright.th)} · ${esc(C.company)} · TAT ${esc(C.tat)}</p></div>`;
}
function cfgPreview() { const el = $('#cfgFoot'); if (el) { el.outerHTML = footerPreview(); icons(); } }
const _vSettingsOld = vSettings;
let _bookingHTML = '', _langHTML = '';
function grabOld() { _vSettingsOld(); const g = $('#view .grid'); const cards = [...g.children]; _langHTML = cards[0]?.outerHTML || ''; _bookingHTML = cards.slice(1).filter(c => !/^\s*(ฤดูกาล|ผู้ใช้งาน|การชำระเงิน|นโยบายยกเลิก)/.test(c.textContent)).map(c => c.outerHTML).join('')
  + `<div class="card p-5"><p class="font-medium">ย้ายไปเมนูอื่นแล้ว</p><div class="grid gap-2 mt-3"><button class="nav-i !h-10 ring-1 ring-line" onclick="go('seasons')"><i data-lucide="calendar-range" class="w-4 h-4"></i>ช่วงวันที่ Low / High / Peak → ฤดูกาลราคา</button><button class="nav-i !h-10 ring-1 ring-line" onclick="go('team')"><i data-lucide="headset" class="w-4 h-4"></i>ผู้ใช้งาน & สิทธิ์ → ทีมเซลล์</button></div></div>`; }
vSettings = function () {
  REG = []; const C = SITECFG, t = C.tab;
  if (t === 'booking' || t === 'lang') grabOld();
  let body = '';
  if (t === 'brand') body = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start"><div class="card p-5 grid gap-5">
      ${bi('ชื่อเว็บไซต์', C.name)}${bi('สโลแกน (ใต้โลโก้ / ในผลค้นหา)', C.tagline)}
      ${imgSlot('logo', 'โลโก้ (พื้นสว่าง · Navbar)', 'PNG/SVG พื้นใส · สูงอย่างน้อย 120px')}
      ${imgSlot('logoDark', 'โลโก้ (พื้นเข้ม · Footer)', 'ใช้เวอร์ชันสีขาวถ้ามี', { bg: '#3a0007' })}
      <div class="grid sm:grid-cols-2 gap-4">${imgSlot('favicon', 'ไอคอนเว็บ (Favicon)', 'สี่เหลี่ยมจัตุรัส 512×512 · ระบบสร้าง .ico และ Apple touch icon ให้', { ratio: 'aspect-square !w-20', fit: 'object-contain' })}
        <div><p class="lbl">ตัวอย่างบนแท็บเบราว์เซอร์</p><div class="rounded-t-xl bg-[#dee1e6] px-2 pt-2"><div class="bg-white rounded-t-lg px-3 h-9 flex items-center gap-2 text-[12px] max-w-[220px]"><img src="${C.favicon}" class="w-4 h-4 object-contain"/><span class="truncate">${esc(C.name.th)}</span><span class="ml-auto text-muted">×</span></div></div></div></div>
      ${imgSlot('ogDefault', 'รูปแชร์เริ่มต้น (OG)', 'ใช้เมื่อหน้านั้นไม่มีรูปแชร์ของตัวเอง · 1200×630', { ratio: 'aspect-[1.91/1]', fit: 'object-cover !max-w-full !max-h-full w-full h-full' })}
      <label><span class="lbl">สีหลักของแบรนด์</span><div class="flex items-center gap-2"><input type="color" value="${C.color}" class="w-10 h-10 rounded-lg ring-1 ring-line p-0.5" oninput="SITECFG.color=this.value;this.nextElementSibling.value=this.value"/><input class="inp font-mono !w-32" value="${C.color}" oninput="SITECFG.color=this.value"/><span class="text-[11px] text-muted">ใช้กับปุ่ม ลิงก์ และไฮไลต์บนเว็บ</span></div></label></div>
    <div class="grid gap-4 xl:sticky xl:top-20"><div class="card p-5"><p class="font-medium mb-3">ตัวอย่าง Navbar</p><div class="rounded-xl ring-1 ring-line px-4 h-14 flex items-center gap-2.5 bg-white"><img src="${C.logo}" class="w-8 h-8 object-contain"/><div class="leading-none"><p class="text-[12.5px] tracking-wide">${esc(C.name.en).toUpperCase().replace(' THAILAND', '')}</p><p class="text-[8.5px] tracking-[.3em] text-muted mt-1">THAILAND</p></div><span class="ml-auto h-8 px-4 rounded-full text-white text-[12px] grid place-items-center" style="background:${C.color}">จองเลย</span></div></div>
      <div class="card p-5"><p class="font-medium mb-3">ตัวอย่าง Footer</p>${footerPreview()}</div></div></div>`;
  if (t === 'contact') body = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start"><div class="card p-5 grid gap-4">
      <div class="grid sm:grid-cols-2 gap-3">${cfgIn('phone', 'เบอร์โทรหลัก', '+66…', 'tel')}${cfgIn('email', 'อีเมลรับการจอง', '', 'email')}${cfgIn('wa', 'WhatsApp', '+66…', 'tel')}${cfgIn('line', 'LINE Official Account', '@…')}</div>
      ${cfgIn('lineUrl', 'ลิงก์ LINE (เพิ่มเพื่อน)', 'https://line.me/R/ti/p/@…', 'url', true)}
      ${bi('ที่อยู่ (แสดงบนเว็บ)', C.address, { rows: 2 })}
      ${cfgIn('map', 'ลิงก์ Google Maps', 'https://maps.app.goo.gl/…', 'url', true)}
      ${bi('เวลาทำการ', C.hours)}
      <div><p class="lbl">ท่าเรือ / จุดขึ้นเรือ (แสดงใน Footer)</p><div class="grid gap-1.5">${C.marinas.map((m, i) => `<div class="flex gap-1.5"><span class="w-9 h-9 grid place-items-center text-muted"><i data-lucide="anchor" class="w-4 h-4"></i></span><input class="inp" value="${esc(m)}" oninput="SITECFG.marinas[${i}]=this.value;cfgPreview()"/>${i ? `<button class="btn btn-g !px-2" onclick="SITECFG.marinas.splice(${i - 1},0,SITECFG.marinas.splice(${i},1)[0]);vSettings()" title="เลื่อนขึ้น"><i data-lucide="arrow-up" class="w-4 h-4"></i></button>` : '<span class="w-9"></span>'}<button class="btn btn-g !px-2" onclick="SITECFG.marinas.splice(${i},1);vSettings()"><i data-lucide="x" class="w-4 h-4"></i></button></div>`).join('')}</div><button class="btn btn-g mt-1" onclick="SITECFG.marinas.push('');vSettings()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มท่าเรือ</button></div>
      <p class="text-[11px] text-muted">ข้อมูลนี้ใช้ทั้ง Footer หน้าติดต่อ ปุ่มลอย WhatsApp/LINE และ Schema (LocalBusiness) อัตโนมัติ</p></div>
    <div class="xl:sticky xl:top-20"><div class="card p-5"><p class="font-medium mb-3">ตัวอย่าง Footer</p>${footerPreview()}</div></div></div>`;
  if (t === 'social') body = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start"><div class="card overflow-hidden"><div class="px-5 pt-4 pb-2"><p class="font-medium">ลิงก์โซเชียล</p><p class="text-[11.5px] text-muted">เปลี่ยนไอคอน ลิงก์ ลำดับ และเปิด/ปิดการแสดงผล</p></div>
      <div class="divide-y divide-line">${C.social.map((s, i) => `<div class="px-5 py-3 grid grid-cols-[auto_1fr_auto] gap-3 items-center">
        <div class="flex flex-col">${i ? `<button class="text-muted hover:text-ink" onclick="SITECFG.social.splice(${i - 1},0,SITECFG.social.splice(${i},1)[0]);vSettings()"><i data-lucide="chevron-up" class="w-4 h-4"></i></button>` : '<span class="h-4"></span>'}${i < C.social.length - 1 ? `<button class="text-muted hover:text-ink" onclick="SITECFG.social.splice(${i + 1},0,SITECFG.social.splice(${i},1)[0]);vSettings()"><i data-lucide="chevron-down" class="w-4 h-4"></i></button>` : ''}</div>
        <div class="grid gap-2 min-w-0"><div class="flex items-center gap-2"><button class="w-9 h-9 rounded-full bg-sand grid place-items-center shrink-0" onclick="cfgIcon(${i},this)" title="เปลี่ยนไอคอน"><i data-lucide="${s.icon}" class="w-4 h-4"></i></button><input class="inp !h-9 !w-36" value="${esc(s.l)}" oninput="SITECFG.social[${i}].l=this.value"/>${s.url ? '' : '<span class="text-[11px] text-[#b4501a]">ยังไม่มีลิงก์</span>'}</div>
          <input class="inp font-mono !text-[12px]" placeholder="https://…" value="${esc(s.url)}" onchange="SITECFG.social[${i}].url=this.value;vSettings()"/></div>
        <div class="flex items-center gap-1"><span class="tgl"><input type="checkbox" ${s.on ? 'checked' : ''} onchange="SITECFG.social[${i}].on=this.checked;cfgPreview()"/><span></span></span><button class="btn btn-g !px-1.5" onclick="SITECFG.social.splice(${i},1);vSettings()"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div></div>`).join('')}</div>
      <div class="px-5 py-3 border-t border-line"><button class="btn btn-o !h-8" onclick="SITECFG.social.push({k:'c'+Date.now(),l:'ช่องทางใหม่',icon:'link-2',url:'',on:true});vSettings()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มช่องทาง</button></div></div>
    <div class="xl:sticky xl:top-20"><div class="card p-5"><p class="font-medium mb-3">ตัวอย่าง Footer</p>${footerPreview()}<p class="text-[11px] text-muted mt-3">ไอคอนจางคือช่องทางที่เปิดไว้แต่ยังไม่ใส่ลิงก์ · บนเว็บจริงจะซ่อนให้อัตโนมัติ</p></div></div></div>`;
  if (t === 'company') body = `<div class="card p-5 grid gap-4 max-w-3xl"><div class="grid sm:grid-cols-2 gap-3">${cfgIn('companyTh', 'ชื่อบริษัท (ไทย)')}${cfgIn('company', 'ชื่อบริษัท (อังกฤษ)')}${cfgIn('tax', 'เลขประจำตัวผู้เสียภาษี', '13 หลัก', 'text', true)}${cfgIn('tat', 'ใบอนุญาตธุรกิจนำเที่ยว (ททท.)', '34/xxxxx', 'text', true)}</div>
      ${bi('ที่อยู่จดทะเบียน (ใช้ในใบเสร็จ/ใบเสนอราคา)', C.regAddr, { rows: 2 })}${bi('ข้อความลิขสิทธิ์ท้ายเว็บ', C.copyright)}
      <p class="text-[11px] text-muted">ใช้ในหน้า Privacy / Terms ใบเสนอราคา ใบเสร็จ และป้าย “TAT” บนหน้าเว็บ</p></div>`;
  if (t === 'booking') body = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">${_bookingHTML}</div>`;
  if (t === 'lang') body = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">${_langHTML}</div>`;
  if (t === 'notify') body = `<div class="card p-5 grid gap-4 max-w-3xl"><label><span class="lbl">อีเมลที่รับแจ้งเตือนคำขอจองใหม่ (คั่นด้วย ,)</span><input class="inp" value="${esc(C.notify.emails)}" oninput="SITECFG.notify.emails=this.value"/></label>
      ${[['line', 'แจ้งเตือนเข้า LINE กลุ่มทีมขาย', 'ผ่าน LINE Messaging API'], ['wa', 'แจ้งเตือน WhatsApp ถึงเซลล์ที่ได้รับงาน'], ['daily', 'สรุปยอดประจำวันทางอีเมล ทุก 08:00']].map(([k, l, h]) => `<label class="flex items-start justify-between gap-3"><span>${l}${h ? `<span class="block text-[11px] text-muted">${h}</span>` : ''}</span><span class="tgl"><input type="checkbox" ${C.notify[k] ? 'checked' : ''} onchange="SITECFG.notify.${k}=this.checked"/><span></span></span></label>`).join('')}
      <button class="btn btn-o justify-self-start" onclick="toast('ส่งแจ้งเตือนทดสอบแล้ว (จำลอง)')"><i data-lucide="send" class="w-3.5 h-3.5"></i>ส่งทดสอบ</button></div>`;
  if (t === 'system') body = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      <div class="card p-5 grid gap-3"><label class="flex items-start justify-between gap-3"><span><b class="font-medium">โหมดปิดปรับปรุง</b><span class="block text-[11px] text-muted">ลูกค้าเห็นหน้าแจ้งปรับปรุงพร้อมช่องทางติดต่อ · แอดมินที่ล็อกอินยังเห็นเว็บปกติ</span></span><span class="tgl"><input type="checkbox" ${C.maint ? 'checked' : ''} onchange="SITECFG.maint=this.checked;toast(this.checked?'เปิดโหมดปิดปรับปรุงแล้ว (จำลอง)':'เว็บกลับมาออนไลน์')"/><span></span></span></label>${bi('ข้อความที่แสดง', C.maintMsg, { rows: 2 })}</div>
      <div class="card p-5 grid gap-2"><p class="font-medium">ข้อมูลระบบ</p>${[['โดเมน', SITE], ['เวอร์ชัน', 'Next.js 15 · mockup v2'], ['สำรองข้อมูลล่าสุด', fmtD(iso(TODAY)) + ' 03:00'], ['CDN รูปภาพ', 'cdn.' + SITE]].map(([a, b]) => `<div class="flex justify-between text-[12.5px] py-1 border-b border-line last:border-0"><span class="text-muted">${a}</span><span class="font-mono text-[12px]">${b}</span></div>`).join('')}
        <div class="flex flex-wrap gap-2 mt-2"><button class="btn btn-o !h-8" onclick="toast('ล้างแคชหน้าเว็บแล้ว (จำลอง)')"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>ล้างแคชเว็บ</button><button class="btn btn-o !h-8" onclick="toast('กำลังสำรองข้อมูล (จำลอง)')"><i data-lucide="download" class="w-3.5 h-3.5"></i>สำรองข้อมูลตอนนี้</button></div></div></div>`;
  $('#view').innerHTML = `${head('ตั้งค่า', 'ข้อมูลเว็บไซต์ แบรนด์ ช่องทางติดต่อ และค่าระบบ', `<button class="btn btn-p" onclick="cfgSave()"><i data-lucide="save" class="w-3.5 h-3.5"></i>บันทึก</button>`)}
    <div class="grid lg:grid-cols-[210px_minmax(0,1fr)] gap-4 items-start"><nav class="card p-2 flex lg:flex-col gap-0.5 overflow-x-auto no-sb lg:sticky lg:top-20">${CFG_TABS.map(([k, l, ic]) => `<button class="nav-i !h-9 !w-auto lg:!w-full whitespace-nowrap ${t === k ? 'on' : ''}" onclick="SITECFG.tab='${k}';vSettings()"><i data-lucide="${ic}" class="w-4 h-4"></i>${l}</button>`).join('')}</nav><div class="min-w-0 fade">${body}</div></div>`;
  icons();
};
function cfgIcon(i, el) {
  edCloseMenu?.(); const r = el.getBoundingClientRect(), m = document.createElement('div'); m.id = 'edMenu'; m.className = 'ed-menu fade'; m.style.width = '232px';
  m.innerHTML = `<p class="px-2 pt-1 pb-2 text-[11px] text-muted">เลือกไอคอน</p><div class="grid grid-cols-6 gap-1">${ICON_OPTS.map(ic => `<button class="!h-9 !p-0 justify-center ${SITECFG.social[i].icon === ic ? 'bg-sand' : ''}" onclick="SITECFG.social[${i}].icon='${ic}';edCloseMenu();vSettings()"><i data-lucide="${ic}" class="w-4 h-4"></i></button>`).join('')}</div>`;
  document.body.appendChild(m); m.style.top = (r.bottom + 6) + 'px'; m.style.left = Math.min(r.left, innerWidth - 250) + 'px'; icons(); setTimeout(() => addEventListener('mousedown', edMenuOut), 0);
}
function cfgSave() { const C = SITECFG; $('#side img').src = C.logo; $$('link[rel=icon]').forEach(l => l.href = C.favicon); SET.companyName = C.company; toast('บันทึกการตั้งค่าแล้ว · หน้าเว็บอัปเดตโลโก้ ไอคอน และข้อมูลติดต่อ'); }
PAGES.find(p => p[0] === 'settings')[3] = vSettings;


