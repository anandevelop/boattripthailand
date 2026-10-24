/* =====================================================================
   META PIXEL + CONVERSIONS API – setup, event map, catalog feed, audiences
   ===================================================================== */
const MP = { on: false, id: '', capi: '', test: '', verify: '', adv: true, consent: true, capiOn: true, sub: 'setup' };
const MP_EVENTS = [
  ['PageView', 'ทุกหน้า (รวมเปลี่ยนหน้าแบบไม่โหลดใหม่)', '—', true],
  ['ViewContent', 'เปิดหน้าเรือ / เปิดรายละเอียดกิจกรรม', 'content_ids, content_type, value, currency', true],
  ['Search', 'กดค้นหาจากหน้าแรก', 'search_string, num_guests', true],
  ['AddToWishlist', 'กดหัวใจบันทึกเรือ', 'content_ids', true],
  ['InitiateCheckout', 'กดปุ่มจอง / เลือกโปรแกรม', 'content_ids, content_name', true],
  ['Lead', 'ส่งฟอร์มขอใบเสนอราคา', 'content_ids, value, currency, num_guests', true],
  ['Contact', 'กด WhatsApp / LINE / โทร', 'method', true],
  ['Purchase', 'ยืนยันการจองในหลังบ้าน (ส่งจากเซิร์ฟเวอร์)', 'value, currency, content_ids', true],
].map(([e, w, p, on]) => ({ e, w, p, on }));
const mpCount = (k, f) => Math.round(sum(win('sessions')) * f);
function metaBody() {
  const sub = [['setup', 'ตั้งค่า'], ['events', 'Events'], ['catalog', 'แคตตาล็อกสินค้า'], ['audiences', 'กลุ่มเป้าหมาย'], ['utm', 'ลิงก์โฆษณา (UTM)']];
  const tg = (k, l, h) => `<label class="flex items-start justify-between gap-3 py-2"><span>${l}${h ? `<span class="block text-[11px] text-muted">${h}</span>` : ''}</span><span class="tgl mt-0.5"><input type="checkbox" ${MP[k] ? 'checked' : ''} onchange="MP.${k}=this.checked"/><span></span></span></label>`;
  let b = '';
  if (MP.sub === 'setup') b = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
    <div class="card p-5 grid gap-3"><p class="font-medium flex items-center gap-2"><i data-lucide="megaphone" class="w-4 h-4 text-maroon"></i>Meta Pixel (บนเบราว์เซอร์)</p>
      <label><span class="lbl">Pixel ID / Dataset ID</span><input class="inp font-mono" placeholder="เช่น 1234567890123456" value="${esc(MP.id)}" oninput="MP.id=this.value.replace(/\\D/g,'');SSET.pixel=MP.id"/></label>
      <label><span class="lbl">ยืนยันโดเมน (meta tag จาก Business Settings)</span><input class="inp font-mono" placeholder="facebook-domain-verification=…" value="${esc(MP.verify)}" oninput="MP.verify=this.value"/></label>
      ${tg('consent', 'โหลด Pixel หลังลูกค้ายอมรับคุกกี้การตลาดเท่านั้น', 'ตาม PDPA · ถ้าปิด ระบบจะไม่โหลด Pixel เลยจนกว่าลูกค้ากดยอมรับ')}
      ${tg('adv', 'Advanced Matching', 'ส่งอีเมล/เบอร์โทรจากฟอร์มแบบเข้ารหัส SHA-256 ช่วยให้ Meta จับคู่ลูกค้าได้แม่นขึ้น')}
      <button class="btn btn-p justify-self-start" onclick="MP.on=!!MP.id||true;toast(MP.id?'เชื่อมต่อ Pixel แล้ว (จำลอง)':'ใส่ Pixel ID ก่อน');vAnalytics()">${MP.on ? 'บันทึก' : 'เชื่อมต่อ'}</button></div>
    <div class="card p-5 grid gap-3"><p class="font-medium flex items-center gap-2"><i data-lucide="server-cog" class="w-4 h-4 text-maroon"></i>Conversions API (จากเซิร์ฟเวอร์)</p>
      <p class="text-[12px] text-muted -mt-1">ส่ง event ซ้ำจากเซิร์ฟเวอร์ ช่วยให้นับครบแม้ลูกค้าใช้ iPhone / บล็อกโฆษณา · ระบบส่ง event_id เดียวกัน Meta จึงไม่นับซ้ำ</p>
      ${tg('capiOn', 'เปิดใช้ Conversions API')}
      <label><span class="lbl">Access Token (เก็บบนเซิร์ฟเวอร์ ไม่แสดงบนหน้าเว็บ)</span><input type="password" class="inp font-mono" placeholder="EAAG…" value="${esc(MP.capi)}" oninput="MP.capi=this.value"/></label>
      <label><span class="lbl">Test Event Code (ใช้ตอนทดสอบเท่านั้น)</span><input class="inp font-mono" placeholder="TEST12345" value="${esc(MP.test)}" oninput="MP.test=this.value"/></label>
      <button class="btn btn-o justify-self-start" onclick="toast('ส่ง Test Event แล้ว (จำลอง) · ดูผลใน Events Manager › Test events')"><i data-lucide="flask-conical" class="w-3.5 h-3.5"></i>ส่ง Test Event</button></div>
    <div class="card p-5 xl:col-span-2"><p class="font-medium">สถานะ <span class="text-[11px] text-muted font-normal">ตัวอย่าง · ${GA.days} วัน</span></p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">${[['Event ที่รับ', nf(mpCount('', 5.2))], ['ส่งจากเซิร์ฟเวอร์ (CAPI)', '38%'], ['Event Match Quality · Lead', '7.8 / 10'], ['ไม่นับซ้ำ (dedup)', '99.2%']].map(([l, v]) => `<div class="rounded-xl bg-sand p-3"><p class="text-[11.5px] text-muted">${l}</p><p class="text-[20px] font-medium tnum mt-0.5">${v}</p></div>`).join('')}</div>
      <p class="text-[11px] text-muted mt-3">หลังติดตั้ง ให้ตั้ง 8 event ใน Events Manager และเลือก Lead เป็นเป้าหมายหลักของแคมเปญ</p></div></div>`;
  if (MP.sub === 'events') b = `<div class="card overflow-hidden"><div class="px-5 pt-4 pb-2 flex flex-wrap items-center justify-between gap-2"><div><p class="font-medium">Event ที่ส่งไป Meta</p><p class="text-[11.5px] text-muted">หน้าเว็บส่ง event เหล่านี้อัตโนมัติ · ตัวเลขเป็นตัวอย่าง ${GA.days} วัน</p></div><span class="text-[11px] text-muted">Pixel + CAPI ใช้ event_id เดียวกัน</span></div>
    <div class="overflow-x-auto"><table class="tbl min-w-[760px]"><thead><tr><th>Event</th><th>เกิดเมื่อ</th><th>ข้อมูลที่ส่ง</th><th class="text-right">จำนวน</th><th>ส่งทาง</th><th>เปิดใช้</th></tr></thead><tbody>
    ${MP_EVENTS.map((x, n) => { const f = [5.2, 2.1, .4, .08, .22, .018, .05, .006][n]; return `<tr><td class="font-mono text-[12.5px]">${x.e}</td><td>${x.w}</td><td class="text-[11.5px] text-muted font-mono">${x.p}</td><td class="text-right tnum">${nf(mpCount('', f))}</td><td><div class="flex gap-1">${x.e === 'Purchase' ? '' : '<span class="lang-b ok">Pixel</span>'}<span class="lang-b ${MP.capiOn ? 'ok' : 'low'}">CAPI</span></div></td><td><label class="tgl"><input type="checkbox" ${x.on ? 'checked' : ''} onchange="MP_EVENTS[${n}].on=this.checked"/><span></span></label></td></tr>`; }).join('')}</tbody></table></div>
    <div class="px-5 py-4 border-t border-line grid lg:grid-cols-2 gap-3"><div><p class="lbl">ตัวอย่างโค้ดที่หน้าเรือส่ง</p><pre class="p-3.5 rounded-xl bg-[#1d1416] text-[#f1e6e6] text-[11px] leading-relaxed overflow-auto whitespace-pre-wrap break-all">${esc(`fbq('track', 'ViewContent', {
  content_ids: ['leopard-90-ft'],
  content_type: 'product',
  value: ${bySlug('leopard-90-ft')?.from_ || 0}, currency: 'THB'
}, { eventID: 'ViewContent.lx3k9.a8f2c' });`)}</pre></div>
      <div><p class="lbl">ส่งผลลีดกลับจากหลังบ้าน (เมื่อเซลล์กด “ปิดการขายได้”)</p><pre class="p-3.5 rounded-xl bg-[#1d1416] text-[#f1e6e6] text-[11px] leading-relaxed overflow-auto whitespace-pre-wrap break-all">${esc(`POST https://graph.facebook.com/v21.0/{PIXEL_ID}/events
{ "data": [{ "event_name": "Converted", "action_source": "system_generated",
  "event_time": 1760950000,
  "user_data": { "em": ["<sha256 email>"], "ph": ["<sha256 phone>"], "lead_id": "<fb lead id>" },
  "custom_data": { "event_source": "crm",
                   "lead_event_source": "Boat Trip Admin" } }] }`)}</pre></div></div></div>`;
  if (MP.sub === 'catalog') { const rows = FLEET.filter(x => x.active && x.from_).slice(0, 6);
    b = `<div class="card overflow-hidden"><div class="px-5 pt-4 pb-3 flex flex-col lg:flex-row lg:items-center gap-3"><div class="flex-1"><p class="font-medium">แคตตาล็อกสินค้าสำหรับโฆษณาแบบไดนามิก</p><p class="text-[11.5px] text-muted mt-0.5">Meta ใช้ไฟล์นี้แสดงโฆษณาเรือลำที่ลูกค้าเคยดู (Advantage+ catalog ads) · อัปเดตอัตโนมัติทุกวันจากข้อมูลเรือในระบบ</p></div>
      <div class="flex items-center gap-2 rounded-xl bg-sand px-3 h-10 min-w-0"><i data-lucide="link" class="w-4 h-4 text-muted shrink-0"></i><span class="font-mono text-[12px] truncate">https://${SITE}/feeds/meta-catalog.csv</span><button class="btn btn-g !h-7 !px-2" onclick="toast('คัดลอกลิงก์แล้ว')"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button></div></div>
      <div class="grid grid-cols-3 gap-3 px-5 pb-3">${[['เรือในแคตตาล็อก', FLEET.filter(x => x.active && x.from_).length], ['กิจกรรม', ACTS.filter(a => a.active !== false && a.imgs?.length).length], ['ไม่ผ่าน (ไม่มีราคา/รูป)', FLEET.filter(x => !x.from_).length + ACTS.filter(a => !a.imgs?.length).length]].map(([l, v]) => `<div class="rounded-xl ring-1 ring-line p-3"><p class="text-[11.5px] text-muted">${l}</p><p class="text-[20px] font-medium tnum">${v}</p></div>`).join('')}</div>
      <div class="overflow-x-auto"><table class="tbl min-w-[880px]"><thead><tr><th>id</th><th>title</th><th>price</th><th>availability</th><th>image_link</th><th>link</th><th>custom_label_0</th></tr></thead><tbody>
      ${rows.map(x => `<tr><td class="font-mono text-[12px]">${x.slug}</td><td>${esc(x.name)}</td><td class="tnum whitespace-nowrap">${(x.from_ || 0).toLocaleString()}.00 THB</td><td>in stock</td><td><img src="${THUMBS[x.slug]}" class="w-12 h-8 rounded object-cover"/></td><td class="text-[11.5px] text-muted font-mono truncate max-w-[220px]">${SITE}/yacht-charter/${x.slug}</td><td class="text-muted">${TYPE_TH[x.type] || x.type}</td></tr>`).join('')}</tbody></table></div>
      <p class="text-[11px] text-muted px-5 py-3 border-t border-line">มีทั้งไฟล์ภาษาไทย (THB) และอังกฤษ (USD) · ราคาใช้ราคาเริ่มต้นของฤดูปัจจุบัน · content_ids ใน event ตรงกับ id ในแคตตาล็อก</p></div>`; }
  if (MP.sub === 'audiences') b = `<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">${[['ดูหน้าเรือแต่ยังไม่ติดต่อ', 'ViewContent ใน 30 วัน และไม่มี Lead / Contact', 'รีมาร์เก็ตติ้งด้วยโฆษณาเรือลำที่เคยดู', .46], ['กดจองแต่ไม่ส่งฟอร์ม', 'InitiateCheckout ใน 14 วัน ไม่มี Lead', 'ข้อเสนอพิเศษ / ทักแชท', .14], ['สนใจเรือยอชต์ใหญ่', 'ViewContent content_category = yacht, value ≥ 100,000', 'โฆษณาเรือหรู ปาร์ตี้ งานบริษัท', .09], ['ผู้เข้าชมหน้าภาษาอังกฤษ', 'URL มี /en/ ใน 60 วัน', 'แคมเปญนักท่องเที่ยวต่างชาติ', .59], ['ลูกค้าที่จองแล้ว', 'Purchase ใน 180 วัน', 'ยกเว้นออกจากแคมเปญหาลูกค้าใหม่ · ใช้ทำ Lookalike', .004], ['Lookalike 1% · ไทย / ออสเตรเลีย / UK', 'สร้างจากกลุ่มลูกค้าที่จองแล้ว', 'หาลูกค้าใหม่ที่คล้ายลูกค้าจริง', 0]].map(([t, r, u, f]) => `<div class="card p-4"><p class="font-medium">${t}</p><p class="text-[11.5px] text-muted mt-1 font-mono">${r}</p><p class="text-[12.5px] mt-2">${u}</p><div class="flex items-center justify-between mt-3"><span class="text-[11.5px] text-muted">${f ? 'ประมาณ ' + nf(sum(win('users')) * f) + ' คน (ตัวอย่าง)' : 'สร้างใน Ads Manager'}</span><button class="btn btn-o !h-8" onclick="toast('คัดลอกเงื่อนไขแล้ว · นำไปสร้างใน Ads Manager')">คัดลอกเงื่อนไข</button></div></div>`).join('')}</div>
    <p class="text-[11px] text-muted mt-3">กลุ่มเป้าหมายสร้างใน Meta Ads Manager โดยใช้ event จาก Pixel · หน้านี้ใช้เป็นคู่มือให้ทีมโฆษณา</p>`;
  if (MP.sub === 'utm') b = `<div class="card p-5 grid gap-3 max-w-3xl">${[['dest', 'หน้าปลายทาง', `https://${SITE}/yacht-charter/leopard-90-ft`], ['src', 'utm_source', 'facebook'], ['med', 'utm_medium', 'paid_social'], ['cmp', 'utm_campaign', 'overnight_high_season'], ['cnt', 'utm_content', 'video_15s']].map(([k, l, v]) => `<label><span class="lbl">${l}</span><input id="utm_${k}" class="inp font-mono !text-[12.5px]" value="${v}" oninput="mpUtm()"/></label>`).join('')}
    <div><p class="lbl">ลิงก์สำหรับใส่ในโฆษณา</p><div class="flex gap-2"><input id="utmOut" readonly class="inp font-mono !text-[12px] bg-sand"/><button class="btn btn-p" onclick="toast('คัดลอกลิงก์แล้ว')"><i data-lucide="copy" class="w-3.5 h-3.5"></i>คัดลอก</button></div></div>
    <p class="text-[11px] text-muted">GA4 จะแยกยอดลีดตามแคมเปญให้ในแท็บ Google Analytics · Meta ใส่พารามิเตอร์ fbclid ให้เองอัตโนมัติ</p></div>`;
  setTimeout(() => window.mpUtm && $('#utmOut') && mpUtm(), 0);
  return `<div class="flex gap-1 overflow-x-auto no-sb mb-4">${sub.map(([k, l]) => `<button class="h-8 px-3 rounded-full text-[12.5px] whitespace-nowrap ${MP.sub === k ? 'bg-maroon text-white' : 'text-muted hover:bg-white'}" onclick="MP.sub='${k}';vAnalytics()">${l}</button>`).join('')}</div>${b}`;
}
function mpUtm() { const g = k => encodeURIComponent($('#utm_' + k).value.trim()); $('#utmOut').value = `${$('#utm_dest').value.trim()}?utm_source=${g('src')}&utm_medium=${g('med')}&utm_campaign=${g('cmp')}&utm_content=${g('cnt')}`; }
/* booking status → confirmed sends Purchase via CAPI (simulated) */
const _setStatus12 = typeof setStatus === 'function' ? setStatus : null;
if (_setStatus12) setStatus = function (id, st) { const r = _setStatus12.apply(this, arguments); if (st === 'confirmed' && MP.capiOn) setTimeout(() => toast('ส่ง Purchase ไป Meta Conversions API แล้ว (จำลอง)'), 900); return r; };


