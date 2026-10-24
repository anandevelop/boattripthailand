/* =====================================================================
   LEADS — the website's job is to bring in leads; sales close deals
   offline (chat / phone). No payments, no booking totals in the admin.
   - lead pipeline (list + board), score, source & journey attribution
   - lead dashboard, follow-ups, SLA
   - "use every lead": segments → Meta / Google audiences, offline
     conversions back to ads, demand insights, message templates
   ===================================================================== */

/* ---------- pipeline ---------- */
Object.keys(STATUS).forEach(k => delete STATUS[k]);
Object.assign(STATUS, { new: ['ลีดใหม่', 'st-new'], contacted: ['ติดต่อแล้ว', 'st-quote'], talking: ['กำลังคุย', 'st-deposit'], won: ['ปิดการขาย', 'st-confirmed'], lost: ['ไม่สำเร็จ', 'st-cancel'] });
const OPEN_ST = ['new', 'contacted', 'talking'];
const SRC = { google: ['Google ค้นหา (SEO)', 'search', '#1a73e8'], gads: ['Google Ads', 'megaphone', '#e37400'], meta: ['Facebook / IG Ads', 'megaphone', '#1877f2'], social: ['Social (ไม่เสียเงิน)', 'instagram', '#c13584'], line: ['LINE OA', 'message-circle', '#06c755'], wa: ['WhatsApp โดยตรง', 'phone', '#25d366'], ref: ['ลูกค้าแนะนำ / Agent', 'handshake', '#8a5a00'], direct: ['เข้าเว็บโดยตรง', 'globe', '#6b5e60'] };
const LOST_R = ['วันที่ต้องการเรือเต็ม', 'ราคาเกินงบ', 'เลือกเจ้าอื่น', 'ติดต่อลูกค้าไม่ได้', 'เลื่อน / ยกเลิกแผนเที่ยว', 'สภาพอากาศ / มรสุม', 'อื่น ๆ'];
const CONTACT = ['ฟอร์มบนเว็บ', 'WhatsApp', 'LINE', 'โทรศัพท์', 'อีเมล'];
const CAMPAIGN = { gads: ['yacht-charter-phuket-th', 'yacht-charter-phuket-en', 'catamaran-phi-phi-en'], meta: ['retarget-boat-viewers-30d', 'lookalike-customers-1pct', 'new-year-charter'], social: ['ig-bio-link', 'fb-page-post'] };
const SCORE_T = { hot: ['ร้อน', '#b42318', '#fdecea'], warm: ['อุ่น', '#9a5b00', '#fff6e5'], cold: ['เย็น', '#3b6e8f', '#eaf2f7'] };

/* ---------- migrate sample bookings → sample leads ---------- */
(function migrate() {
  const map = { new: 'new', quote: 'contacted', deposit: 'talking', confirmed: 'won', done: 'won', cancel: 'lost' };
  const arts = (typeof ART !== 'undefined' ? ART : []).filter(a => a.slug?.th);
  const wsrc = ['google', 'google', 'google', 'gads', 'gads', 'meta', 'meta', 'meta', 'social', 'line', 'wa', 'wa', 'ref', 'direct'];
  // more sample customers + leads, spread over the last 12 weeks with a realistic close rate
  for (let i = 0; i < 48; i++) { const f = pick(FIRST), th = /[ก-๙]/.test(f), l = pick(LAST); CUSTOMERS.push({ id: 'C' + (1001 + CUSTOMERS.length), name: `${f} ${th ? pick(LAST.slice(12)) : (/[ก-๙]/.test(l) ? 'Smith' : l)}`, country: th ? '🇹🇭 TH' : pick(COUNTRY.slice(0, 10)), phone: th ? `08${Math.floor(rnd() * 9)}-${Math.floor(rnd() * 900 + 100)}-${Math.floor(rnd() * 9000 + 1000)}` : `+${pick(['44', '49', '39', '46', '82', '61', '33', '7', '86'])} ${Math.floor(rnd() * 900 + 100)} ${Math.floor(rnd() * 9000 + 1000)}`, email: rnd() < .8 ? `${(f.toLowerCase().replace(/[^a-z]/g, '') || 'guest')}${100 + i}@example.com` : '', channel: '', tags: [] }); }
  const pool0 = FLEET.filter(b => b.from_), sellers = TEAM.filter(t => ['kwang', 'save', 'prang'].includes(t.id)).map(t => t.id);
  while (BOOKINGS.length < 132) { const b = rnd() < .45 ? pick(pool0.filter(x => x.featured)) : pick(pool0); BOOKINGS.push({ id: 'BTT-' + Math.floor(rnd() * 1e9), boat: b.slug, prog: rnd() < .7 ? pick(progsOf(b).filter(p => p.price))?.label || '' : '', date: '', guests: 2, status: 'new', cust: '', sales: pick(sellers), channel: '', created: '', pickup: rnd() > .6 ? pick(['Kata Rocks', 'Amanpuri', 'Patong Hilton', 'Laguna Banyan Tree', 'Mövenpick Karon']) : '', note: '' }); }
  const used = new Set();
  BOOKINGS.forEach((l, i) => {
    const b = bySlug(l.boat);
    let cust = pick(CUSTOMERS); for (let k = 0; k < 6 && used.has(cust.id); k++) cust = pick(CUSTOMERS); used.add(cust.id); l.cust = cust.id; const c = cust;
    l.guests = Math.max(2, Math.min(b.pax || 12, Math.round(2 + rnd() ** 1.4 * ((b.pax || 12) - 2))));
    const age = Math.floor(rnd() ** 1.15 * 84), cd = addDays(TODAY, -age), lead = 3 + Math.floor(rnd() ** 1.3 * 70);
    l.date = iso(addDays(cd, lead)); l.created = iso(cd);
    const past = l.date < iso(TODAY), r = rnd();
    l.status = age <= 1 ? (r < .6 ? 'new' : 'contacted') : age <= 10 ? (past ? (r < .45 ? 'won' : 'lost') : r < .25 ? 'contacted' : r < .6 ? 'talking' : r < .8 ? 'won' : 'lost') : (past ? (r < .4 ? 'won' : 'lost') : r < .15 ? 'talking' : r < .52 ? 'won' : 'lost');
    l.id = 'LD-' + l.created.slice(2).replace(/-/g, '') + '-' + String(1000 + Math.floor(rnd() * 9000)); delete l.total; delete l.paid;
    l.src = pick(wsrc); l.campaign = CAMPAIGN[l.src] ? pick(CAMPAIGN[l.src]) : '';
    l.contact = l.src === 'wa' ? 'WhatsApp' : l.src === 'line' ? 'LINE' : rnd() < .78 ? 'ฟอร์มบนเว็บ' : pick(CONTACT);
    l.channel = l.contact; if (!c.channel) c.channel = l.contact;
    l.landing = l.src === 'google' && arts.length && rnd() < .55 ? '/blog/' + pick(arts).slug.th : rnd() < .6 ? '/yacht-charter/' + l.boat : '/';
    l.clickId = l.src === 'gads' ? 'gclid' : l.src === 'meta' ? 'fbclid' : '';
    const pool = FLEET.filter(x => x.type === b.type && x.slug !== l.boat);
    l.viewed = [l.boat, ...Array.from({ length: Math.floor(rnd() * 3) }, () => pick(pool.length ? pool : FLEET).slug)].filter((v, k, a) => a.indexOf(v) === k);
    l.pages = 2 + Math.floor(rnd() * 11); l.returning = rnd() < .3; l.device = rnd() < .72 ? 'มือถือ' : 'คอมพิวเตอร์';
    l.lang = /TH/.test(c.country) ? 'th' : 'en';
    if (l.status === 'new') { const d = new Date(Date.now() - (4 + Math.floor(rnd() ** 2 * 150)) * 60e3); l.created = iso(d); l.createdAt = d.toISOString(); }
    else { const d = new Date(l.created + 'T00:00:00'); const hr = [9, 10, 11, 13, 14, 16, 19, 20, 20, 21, 21, 22, 23, 8, 12, 18][Math.floor(rnd() * 16)]; d.setHours(hr, Math.floor(rnd() * 60)); if (d > new Date()) d.setTime(Date.now() - 3 * 3600e3); l.createdAt = d.toISOString(); l.created = iso(d); }
    l.reply = l.status === 'new' ? null : Math.round(2 + rnd() ** 2.2 * 160);
    l.next = ['contacted', 'talking'].includes(l.status) ? iso(addDays(TODAY, Math.floor(rnd() * 6) - 2)) : '';
    l.lost = l.status === 'lost' ? pick(['วันที่ต้องการเรือเต็ม', 'วันที่ต้องการเรือเต็ม', 'วันที่ต้องการเรือเต็ม', 'ราคาเกินงบ', 'ราคาเกินงบ', 'ราคาเกินงบ', 'เลือกเจ้าอื่น', 'เลือกเจ้าอื่น', 'ติดต่อลูกค้าไม่ได้', 'ติดต่อลูกค้าไม่ได้', 'เลื่อน / ยกเลิกแผนเที่ยว', 'สภาพอากาศ / มรสุม']) : '';
    l.slot = pick(['เช้า', 'บ่าย', 'ทั้งวัน', '']);
    l.acts = [];
  });
  // a few returning customers from last season (for the anniversary segment)
  BOOKINGS.filter(l => l.status === 'won').slice(0, 5).forEach((l, i) => { const x = { ...l, id: 'LD-' + (250000 + i), acts: [] }; const d = addDays(TODAY, -330 - i * 12); x.date = iso(d); x.created = iso(addDays(d, -20)); x.createdAt = new Date(x.created + 'T10:00:00').toISOString(); x.status = 'won'; x.next = ''; x.lost = ''; BOOKINGS.push(x); });
  BOOKINGS.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  CUSTOMERS.forEach(c => { c.consent = rnd() < .64; c.lang = /TH/.test(c.country) ? 'th' : 'en'; });
})();

/* ---------- helpers ---------- */
const leadAgeMin = l => Math.max(0, Math.round((Date.now() - new Date(l.createdAt)) / 60000));
const ago = m => m < 60 ? `${m} นาที` : m < 1440 ? `${Math.floor(m / 60)} ชม.` : `${Math.floor(m / 1440)} วัน`;
const median = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
function leadScore(l) {
  const r = [], d = (new Date(l.date + 'T00:00:00') - TODAY) / 864e5, c = custOf(l.cust);
  if (d >= 0 && d <= 21) r.push(['วันออกเรือภายใน 3 สัปดาห์', 25]); else if (d > 21 && d <= 90) r.push(['วางแผนล่วงหน้า 1–3 เดือน', 12]);
  if (l.guests >= 8) r.push([`กลุ่มใหญ่ ${l.guests} คน`, 12]);
  if ((l.pages || 0) >= 6) r.push([`ดูเว็บ ${l.pages} หน้า`, 12]);
  if ((l.viewed || []).length >= 2) r.push([`เทียบเรือ ${l.viewed.length} ลำ`, 8]);
  if (l.prog) r.push(['ระบุโปรแกรมที่ต้องการ', 10]);
  if (l.returning) r.push(['กลับมาเว็บซ้ำ', 8]);
  if (['ref', 'wa', 'line'].includes(l.src)) r.push(['ทักมาเอง / มีคนแนะนำ', 15]);
  if (c?.email && c?.phone) r.push(['ให้ทั้งเบอร์และอีเมล', 5]);
  if (BOOKINGS.some(x => x.cust === l.cust && x.id !== l.id && x.status === 'won')) r.push(['เคยเป็นลูกค้าแล้ว', 20]);
  const s = Math.min(100, sum(r.map(x => x[1]))); return { s, r, t: s >= 60 ? 'hot' : s >= 35 ? 'warm' : 'cold' };
}
const scorePill = l => { const { s, t } = leadScore(l); const [n, c, bg] = SCORE_T[t]; return `<span class="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[11px] tnum whitespace-nowrap" style="color:${c};background:${bg}"><i data-lucide="flame" class="w-3 h-3"></i>${n} ${s}</span>`; };
const srcPill = (k, small) => { const [n, i, c] = SRC[k] || SRC.direct; return `<span class="inline-flex items-center gap-1.5 ${small ? 'text-[11px]' : 'text-[12px]'} whitespace-nowrap"><i data-lucide="${i}" class="w-3.5 h-3.5 shrink-0" style="color:${c}"></i>${n}</span>`; };
const boatName = s => bySlug(s)?.name || s;

/* ---------- lead list / board ---------- */
Object.assign(BK, { view: 'list', src: '', score: '' });
vBookings = function () {
  const tabs = [['open', 'กำลังดำเนินการ'], ['all', 'ทั้งหมด'], ...Object.entries(STATUS).map(([k, v]) => [k, v[0]])];
  if (!tabs.some(t => t[0] === BK.tab)) BK.tab = 'open';
  const q = BK.q.toLowerCase();
  let list = BOOKINGS.filter(l => (BK.tab === 'all' || (BK.tab === 'open' ? OPEN_ST.includes(l.status) : l.status === BK.tab)) && (!BK.sales || l.sales === BK.sales) && (!BK.src || l.src === BK.src) && (!BK.score || leadScore(l).t === BK.score) &&
    (!q || (l.id + ' ' + custOf(l.cust).name + ' ' + custOf(l.cust).phone + ' ' + boatName(l.boat) + ' ' + l.prog + ' ' + (l.campaign || '')).toLowerCase().includes(q)));
  list = [...list].sort((a, b) => BK.sort === 'date' ? a.date.localeCompare(b.date) : BK.sort === 'score' ? leadScore(b).s - leadScore(a).s : BK.sort === 'next' ? (a.next || '9').localeCompare(b.next || '9') : b.createdAt.localeCompare(a.createdAt));
  const waiting = BOOKINGS.filter(l => l.status === 'new'), late = waiting.filter(l => leadAgeMin(l) > 30);
  const due = BOOKINGS.filter(l => l.next && l.next <= iso(TODAY) && OPEN_ST.includes(l.status));
  const cnt = k => k === 'all' ? BOOKINGS.length : k === 'open' ? BOOKINGS.filter(l => OPEN_ST.includes(l.status)).length : BOOKINGS.filter(l => l.status === k).length;
  const filters = `<div class="lg:ml-auto grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
      <input class="inp col-span-2 sm:!w-52" placeholder="ค้นหาชื่อ เบอร์ เรือ แคมเปญ" value="${esc(BK.q)}" oninput="BK.q=this.value;clearTimeout(window._bq);window._bq=setTimeout(()=>{vBookings();const i=$('#view input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"/>
      <select class="inp sm:!w-32" onchange="BK.sales=this.value;vBookings()"><option value="">เซลล์ทุกคน</option>${TEAM.filter(t => !t.deleted && ['super', 'admin', 'sales'].includes(t.roleKey)).map(t => `<option value="${t.id}" ${BK.sales === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select>
      <select class="inp sm:!w-40" onchange="BK.src=this.value;vBookings()"><option value="">ทุกแหล่งที่มา</option>${Object.entries(SRC).map(([k, [n]]) => `<option value="${k}" ${BK.src === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <select class="inp sm:!w-28" onchange="BK.score=this.value;vBookings()"><option value="">ทุกคะแนน</option>${Object.entries(SCORE_T).map(([k, [n]]) => `<option value="${k}" ${BK.score === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <select class="inp sm:!w-36" onchange="BK.sort=this.value;vBookings()">${[['created', 'ล่าสุดก่อน'], ['score', 'คะแนนสูงก่อน'], ['next', 'นัดติดตามใกล้สุด'], ['date', 'วันออกเรือ']].map(([k, l]) => `<option value="${k}" ${BK.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
    </div>`;
  const row = l => { const c = custOf(l.cust), s = teamOf(l.sales); return `<tr class="click" onclick="bookingDetail('${l.id}')">
      <td class="whitespace-nowrap"><p class="flex items-center gap-1.5">${esc(c.name)}${c.consent ? '' : ''}</p><p class="text-[11px] text-muted">${l.status === 'new' ? `<span class="${leadAgeMin(l) > 30 ? 'text-[#b42318]' : ''}">รอ ${ago(leadAgeMin(l))}</span>` : relTs(l.createdAt)} · ${c.country}</p></td>
      <td><div class="flex items-center gap-2.5">${thumb(l.boat, 'w-10 h-7')}<div class="min-w-0"><p class="truncate max-w-[170px]">${boatName(l.boat)}</p><p class="text-[11px] text-muted truncate max-w-[170px]">${esc(l.prog || 'ยังไม่เลือกโปรแกรม')}</p></div></div></td>
      <td class="whitespace-nowrap">${fmtD(l.date)}<p class="text-[11px] text-muted">${l.guests} คน</p></td>
      <td>${srcPill(l.src, 1)}<p class="text-[11px] text-muted truncate max-w-[150px]">${esc(l.campaign || l.contact)}</p></td>
      <td>${scorePill(l)}</td>
      <td><div class="flex items-center gap-1.5 whitespace-nowrap"><img src="${TEAM_IMG[s?.id]}" class="w-6 h-6 rounded-full object-cover"/>${s?.name || '-'}</div></td>
      <td>${pill(l.status)}${l.status === 'lost' ? `<p class="text-[11px] text-muted mt-0.5">${esc(l.lost)}</p>` : ''}</td>
      <td class="whitespace-nowrap">${l.next && OPEN_ST.includes(l.status) ? `<span class="${l.next < iso(TODAY) ? 'text-[#b42318]' : l.next === iso(TODAY) ? 'text-maroon' : 'text-muted'}">${l.next === iso(TODAY) ? 'วันนี้' : fmtD(l.next)}</span>` : '<span class="text-muted">—</span>'}</td></tr>`; };
  const board = () => `<div class="flex gap-3 overflow-x-auto no-sb p-3">${Object.entries(STATUS).map(([k, [n]]) => { const L = list.filter(l => l.status === k); return `<div class="w-[260px] shrink-0 rounded-2xl bg-sand/70 p-2" ondragover="event.preventDefault();this.classList.add('ring-2','ring-maroon')" ondragleave="this.classList.remove('ring-2','ring-maroon')" ondrop="this.classList.remove('ring-2','ring-maroon');setStatus(event.dataTransfer.getData('id'),'${k}')">
      <div class="flex items-center justify-between px-2 py-1.5">${pill(k)}<span class="text-[11px] text-muted tnum">${L.length}</span></div>
      <div class="space-y-2 mt-1 max-h-[64vh] overflow-y-auto">${L.slice(0, 40).map(l => { const c = custOf(l.cust); return `<div draggable="true" ondragstart="event.dataTransfer.setData('id','${l.id}')" onclick="bookingDetail('${l.id}')" class="rounded-xl bg-white ring-1 ring-line p-3 cursor-pointer hover:ring-maroon">
        <div class="flex items-start justify-between gap-2"><p class="text-[13px] leading-tight truncate">${esc(c.name)}</p>${scorePill(l)}</div>
        <p class="text-[11.5px] text-muted mt-1 truncate">${boatName(l.boat)} · ${fmtD(l.date)} · ${l.guests} คน</p>
        <div class="flex items-center justify-between mt-2">${srcPill(l.src, 1)}<img src="${TEAM_IMG[l.sales]}" class="w-5 h-5 rounded-full object-cover"/></div>
        ${l.status === 'new' ? `<p class="text-[11px] mt-1.5 ${leadAgeMin(l) > 30 ? 'text-[#b42318]' : 'text-muted'}">รอติดต่อ ${ago(leadAgeMin(l))}</p>` : l.next && OPEN_ST.includes(l.status) ? `<p class="text-[11px] mt-1.5 ${l.next < iso(TODAY) ? 'text-[#b42318]' : 'text-muted'}">ติดตาม ${l.next === iso(TODAY) ? 'วันนี้' : fmtD(l.next)}</p>` : ''}
      </div>`; }).join('') || '<p class="text-[11px] text-muted text-center py-6">ไม่มี</p>'}</div></div>`; }).join('')}</div>`;
  $('#view').innerHTML = `
    ${head('ลีด', `${BOOKINGS.length} รายการ · เว็บเก็บลีด เซลล์ติดต่อและปิดการขายเองทางแชท/โทร`, `<button class="btn btn-o" onclick="exportCsv()"><i data-lucide="download" class="w-3.5 h-3.5"></i>Export CSV</button><button class="btn btn-p" onclick="newBooking()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มลีด</button>`)}
    ${late.length || due.length ? `<div class="grid sm:grid-cols-2 gap-3 mb-4">${late.length ? `<button class="card p-3.5 flex items-center gap-3 text-left ring-1 ring-[#f3c7c2] bg-[#fff7f6]" onclick="BK.tab='new';BK.sort='created';vBookings()"><span class="w-9 h-9 rounded-full bg-[#fdecea] text-[#b42318] grid place-items-center"><i data-lucide="alarm-clock" class="w-4 h-4"></i></span><span><b class="font-medium">${late.length} ลีดรอเกิน 30 นาที</b><span class="block text-[12px] text-muted">ตอบเร็วใน 5 นาทีแรก โอกาสปิดสูงขึ้นมาก</span></span></button>` : ''}${due.length ? `<button class="card p-3.5 flex items-center gap-3 text-left" onclick="BK.tab='open';BK.sort='next';vBookings()"><span class="w-9 h-9 rounded-full bg-maroon-50 text-maroon grid place-items-center"><i data-lucide="bell-ring" class="w-4 h-4"></i></span><span><b class="font-medium">${due.length} ลีดถึงกำหนดติดตาม</b><span class="block text-[12px] text-muted">รวมที่เลยกำหนด</span></span></button>` : ''}</div>` : ''}
    <div class="card">
      <div class="p-3 flex flex-col lg:flex-row gap-2 lg:items-center border-b border-line">
        <div class="flex gap-1 items-center overflow-x-auto no-sb"><span class="inline-flex rounded-full bg-sand p-0.5 mr-1 shrink-0">${[['list', 'list'], ['board', 'kanban']].map(([k, i]) => `<button class="h-7 w-8 grid place-items-center rounded-full ${BK.view === k ? 'bg-white shadow-sm' : 'text-muted'}" onclick="BK.view='${k}';vBookings()" aria-label="${k}"><i data-lucide="${i}" class="w-3.5 h-3.5"></i></button>`).join('')}</span>${tabs.map(([k, l]) => `<button class="tab ${BK.tab === k ? 'on' : ''}" onclick="BK.tab='${k}';vBookings()">${l} <span class="opacity-60 tnum">${cnt(k)}</span></button>`).join('')}</div>
        ${filters}
      </div>
      ${BK.view === 'board' ? board() : `<div class="overflow-x-auto"><table class="tbl"><thead><tr><th>ลูกค้า</th><th>สนใจ</th><th>วันที่ต้องการ</th><th>แหล่งที่มา</th><th>คะแนน</th><th>เซลล์</th><th>สถานะ</th><th>ติดตาม</th></tr></thead><tbody>
        ${list.map(row).join('') || `<tr><td colspan="8" class="text-center text-muted py-12">ไม่พบลีด</td></tr>`}
      </tbody></table></div>`}
    </div>`;
  icons();
};

/* ---------- lead drawer ---------- */
const TPL = [
  { k: 'first', n: 'ทักครั้งแรก', th: 'สวัสดีค่ะคุณ{name} {me} จาก Boat Trip Thailand ค่ะ ได้รับคำขอเรื่อง {boat} วันที่ {date} {guests} ท่านแล้วนะคะ ขอเช็กคิวเรือแล้วจะส่งตัวเลือกให้ภายในไม่กี่นาทีค่ะ', en: 'Hi {name}, this is {me} from Boat Trip Thailand. Thanks for your request for {boat} on {date} for {guests} guests. I\'m checking availability now and will send you options in a few minutes.' },
  { k: 'options', n: 'ส่งตัวเลือกเรือ', th: 'คุณ{name} คะ วันที่ {date} มีเรือที่เหมาะกับ {guests} ท่านดังนี้ค่ะ: {boat} และเรือทางเลือก {alt} สนใจลำไหนแจ้งได้เลยนะคะ', en: 'Hi {name}, for {date} with {guests} guests we can offer {boat}, or alternatives: {alt}. Which one would you like?' },
  { k: 'follow', n: 'ติดตามผล', th: 'สวัสดีค่ะคุณ{name} ไม่ทราบว่าได้ตัดสินใจเรื่องทริปวันที่ {date} หรือยังคะ ถ้ามีคำถามเพิ่มเติม {me} ยินดีช่วยค่ะ', en: 'Hi {name}, just checking in about your trip on {date}. Happy to answer any questions!' },
  { k: 'full', n: 'วันเต็ม · เสนอทางเลือก', th: 'คุณ{name} คะ {boat} วันที่ {date} เต็มแล้วค่ะ แต่ยังมี {alt} ที่ขนาดใกล้เคียงกัน หรือถ้าเลื่อนวันได้ {boat} ยังว่างวันใกล้ ๆ ค่ะ', en: 'Hi {name}, {boat} is fully booked on {date}, but {alt} is a similar size and available — or {boat} is free on nearby dates if you are flexible.' },
];
function tplText(k, l) {
  const t = TPL.find(x => x.k === k), c = custOf(l.cust), lang = l.lang === 'th' ? 'th' : 'en', alt = altBoats(l).slice(0, 2).map(b => b.name).join(lang === 'th' ? ' หรือ ' : ' or ') || '—';
  return t[lang].replace(/\{name\}/g, c.name.split(' ')[0]).replace(/\{me\}/g, (teamOf(l.sales) || ME || {}).name || '').replace(/\{boat\}/g, boatName(l.boat)).replace(/\{date\}/g, fmtD(l.date)).replace(/\{guests\}/g, l.guests).replace(/\{alt\}/g, alt);
}
function altBoats(l) {
  const b = bySlug(l.boat), busy = new Set(BOOKINGS.filter(x => x.date === l.date && ['won', 'talking'].includes(x.status) && x.id !== l.id).map(x => x.boat));
  return FLEET.filter(x => x.active !== false && x.slug !== l.boat && x.type === b?.type && (x.pax || 99) >= l.guests && !busy.has(x.slug)).slice(0, 4);
}
function leadContact(id, via) {
  const l = BOOKINGS.find(x => x.id === id), c = custOf(l.cust), msg = encodeURIComponent(tplText(l.status === 'new' ? 'first' : 'follow', l)), ph = String(c.phone).replace(/[^\d]/g, '');
  const url = { WhatsApp: `https://wa.me/${ph}?text=${msg}`, LINE: `https://line.me/R/msg/text/?${msg}`, 'โทร': `tel:${ph}`, 'อีเมล': `mailto:${c.email}?subject=Boat%20Trip%20Thailand&body=${msg}` }[via];
  if (url) window.open(url, '_blank');
  l.acts.push({ ts: new Date().toISOString(), uid: ME?.id, t: `ติดต่อทาง ${via}` });
  if (l.status === 'new') { l.reply = leadAgeMin(l); setStatus(id, 'contacted'); toast(`บันทึกการติดต่อแล้ว · ตอบกลับใน ${ago(l.reply)}`); }
  else { if (typeof audit === 'function') audit('update', 'booking', id, `${id} · ${boatName(l.boat)}`, [{ f: 'การติดต่อ', from: '—', to: via }]); toast('บันทึกการติดต่อแล้ว'); }
  bookingDetail(id);
}
function leadSet(id, k, v) {
  const l = BOOKINGS.find(x => x.id === id), from = l[k]; l[k] = v;
  const F = { next: 'นัดติดตาม', lost: 'เหตุผลที่ไม่สำเร็จ', prog: 'โปรแกรม', date: 'วันที่ต้องการ', guests: 'จำนวนคน' };
  if (typeof audit === 'function' && String(from) !== String(v)) audit('update', 'booking', id, `${id} · ${boatName(l.boat)}`, [{ f: F[k] || k, from: k === 'next' || k === 'date' ? (from ? fmtD(from) : '—') : from || '—', to: k === 'next' || k === 'date' ? (v ? fmtD(v) : '—') : v || '—' }]);
  if (k === 'lost' && v && l.status !== 'lost') setStatus(id, 'lost'); else rerender();
  bookingDetail(id);
}
function leadCopyTpl(id, k) { const l = BOOKINGS.find(x => x.id === id), t = tplText(k, l); navigator.clipboard?.writeText(t).catch(() => { }); $('#tplOut').value = t; toast('คัดลอกข้อความแล้ว · วางในแชทได้เลย'); }
bookingDetail = function (id) {
  const l = BOOKINGS.find(x => x.id === id); if (!l) return;
  const c = custOf(l.cust), b = bySlug(l.boat), sc = leadScore(l), idx = ['new', 'contacted', 'talking', 'won'].indexOf(l.status), alt = altBoats(l);
  const history = BOOKINGS.filter(x => x.cust === l.cust && x.id !== l.id);
  openDrawer(`
    <div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div class="min-w-0"><p class="text-[11px] text-muted">ลีด ${l.id} · เข้ามา ${relTs(l.createdAt)}</p><p class="font-medium truncate">${esc(c.name)} <span class="text-muted font-normal text-[12px]">${c.country}</span></p></div><div class="flex items-center gap-2">${scorePill(l)}<button class="btn btn-g !px-2" onclick="closeDrawer()" aria-label="Close"><i data-lucide="x" class="w-5 h-5"></i></button></div></div>
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <div class="flex items-center gap-1">${['new', 'contacted', 'talking', 'won'].map((s, i) => `<div class="flex-1"><div class="h-1.5 rounded-full ${l.status === 'lost' ? 'bg-[#f3d6d8]' : i <= idx ? 'bg-maroon' : 'bg-sand-100'}"></div><p class="text-[10px] mt-1.5 ${i === idx ? 'text-ink' : 'text-muted'}">${STATUS[s][0]}</p></div>`).join('')}</div>
      ${l.status === 'new' ? `<div class="rounded-xl p-3 ${leadAgeMin(l) > 30 ? 'bg-[#fff7f6] ring-1 ring-[#f3c7c2] text-[#b42318]' : 'bg-sand'} text-[12.5px] flex items-center gap-2"><i data-lucide="alarm-clock" class="w-4 h-4 shrink-0"></i>รอติดต่อมา ${ago(leadAgeMin(l))} · กดช่องทางด้านล่าง ระบบจะบันทึกเวลาตอบกลับให้</div>` : ''}
      <div><p class="lbl">ติดต่อลูกค้า</p><div class="grid grid-cols-4 gap-2">${[['WhatsApp', 'message-circle'], ['LINE', 'message-square'], ['โทร', 'phone'], ['อีเมล', 'mail']].map(([v, i]) => `<button class="btn btn-o !h-11 flex-col !gap-0.5 !text-[11px]" onclick="leadContact('${l.id}','${v}')"><i data-lucide="${i}" class="w-4 h-4"></i>${v}</button>`).join('')}</div>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-[12.5px]"><div><dt class="lbl">โทร</dt><dd class="tnum">${c.phone}</dd></div><div><dt class="lbl">อีเมล</dt><dd class="break-all">${c.email || '—'}</dd></div><div><dt class="lbl">ภาษา</dt><dd>${l.lang === 'th' ? 'ไทย' : 'English'}</dd></div><div><dt class="lbl">รับข่าวสาร (PDPA)</dt><dd>${c.consent ? '<span class="text-[#1e7a46]">ยินยอม</span>' : '<span class="text-muted">ไม่ยินยอม</span>'}</dd></div></dl></div>
      <div><p class="lbl">สิ่งที่สนใจ</p><div class="flex gap-3 items-center p-3 rounded-xl bg-sand">${thumb(l.boat, 'w-20 h-14')}<div class="min-w-0"><p class="font-medium">${boatName(l.boat)}</p><p class="text-[12px] text-muted truncate">${esc(l.prog || 'ยังไม่เลือกโปรแกรม')}</p><p class="text-[12px] text-muted">${fmtD(l.date)} · ${l.guests} คน${l.slot ? ' · ' + l.slot : ''}${l.pickup ? ' · รับที่ ' + esc(l.pickup) : ''}</p></div></div>
        ${l.viewed?.length > 1 ? `<p class="text-[11px] text-muted mt-3 mb-1.5">เรือที่ลูกค้าดูในเว็บ</p><div class="flex flex-wrap gap-1.5">${l.viewed.map(s => `<span class="inline-flex items-center gap-1.5 h-7 pl-1 pr-2.5 rounded-full ring-1 ring-line text-[12px]">${thumb(s, 'w-5 h-5 !rounded-full')}${boatName(s)}</span>`).join('')}</div>` : ''}
        ${alt.length ? `<p class="text-[11px] text-muted mt-3 mb-1.5">เรือทางเลือกที่ยังว่างวันนั้น (ประเภทเดียวกัน รับได้ ${l.guests}+ คน)</p><div class="flex flex-wrap gap-1.5">${alt.map(x => `<a href="#/boats/${x.slug}" class="inline-flex items-center gap-1.5 h-7 pl-1 pr-2.5 rounded-full bg-[#eaf6ef] text-[#1e7a46] text-[12px]">${thumb(x.slug, 'w-5 h-5 !rounded-full')}${x.name}</a>`).join('')}</div>` : ''}</div>
      <div class="grid grid-cols-2 gap-3">
        <label><span class="lbl">สถานะ</span><select class="inp" onchange="setStatus('${l.id}',this.value)">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === l.status ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label>
        <label><span class="lbl">เซลล์ผู้ดูแล</span><select class="inp" onchange="BOOKINGS.find(x=>x.id==='${l.id}').sales=this.value;toast('มอบหมายเซลล์แล้ว')">${TEAM.filter(t => !t.deleted && ['super', 'admin', 'sales'].includes(t.roleKey)).map(t => `<option value="${t.id}" ${t.id === l.sales ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>
        ${OPEN_ST.includes(l.status) ? `<label><span class="lbl">นัดติดตามครั้งถัดไป</span><input type="date" class="inp" value="${l.next || ''}" onchange="leadSet('${l.id}','next',this.value)"/></label>` : ''}
        ${l.status === 'lost' || OPEN_ST.includes(l.status) ? `<label><span class="lbl">เหตุผลที่ไม่สำเร็จ</span><select class="inp" onchange="leadSet('${l.id}','lost',this.value)"><option value="">—</option>${LOST_R.map(r => `<option ${r === l.lost ? 'selected' : ''}>${r}</option>`).join('')}</select></label>` : ''}
      </div>
      <div><p class="lbl">ข้อความสำเร็จรูป (${l.lang === 'th' ? 'ไทย' : 'English'} ตามภาษาลูกค้า)</p><div class="flex flex-wrap gap-1.5">${TPL.map(t => `<button class="h-7 px-2.5 rounded-full ring-1 ring-line text-[12px] hover:ring-maroon" onclick="leadCopyTpl('${l.id}','${t.k}')">${t.n}</button>`).join('')}</div><textarea id="tplOut" class="inp mt-2 !text-[12px]" rows="3" readonly placeholder="กดเลือกข้อความ ระบบใส่ชื่อ เรือ วันที่ให้อัตโนมัติและคัดลอกให้"></textarea></div>
      <div><p class="lbl">ลีดมาจากไหน</p><div class="rounded-xl ring-1 ring-line p-3 space-y-2 text-[12.5px]">
        <div class="flex justify-between gap-3"><span class="text-muted">แหล่งที่มา</span>${srcPill(l.src)}</div>
        ${l.campaign ? `<div class="flex justify-between gap-3"><span class="text-muted">แคมเปญ</span><span class="font-mono text-[11.5px] truncate">${esc(l.campaign)}</span></div>` : ''}
        <div class="flex justify-between gap-3"><span class="text-muted">หน้าแรกที่เข้า</span><span class="truncate max-w-[60%] text-right">${esc(decodeURIComponent(l.landing))}</span></div>
        <div class="flex justify-between gap-3"><span class="text-muted">พฤติกรรม</span><span>${l.pages} หน้า · ${l.device}${l.returning ? ' · กลับมาซ้ำ' : ''}</span></div>
        <div class="flex justify-between gap-3"><span class="text-muted">ส่งคำขอผ่าน</span><span>${l.contact}</span></div>
        ${l.clickId ? `<div class="flex justify-between gap-3"><span class="text-muted">รหัสคลิกโฆษณา</span><span class="text-[#1e7a46]">${l.clickId} ✓ ส่งผลกลับโฆษณาได้</span></div>` : ''}
        ${l.reply != null ? `<div class="flex justify-between gap-3"><span class="text-muted">ตอบกลับครั้งแรก</span><span class="${l.reply > 30 ? 'text-[#b42318]' : 'text-[#1e7a46]'}">${ago(l.reply)}</span></div>` : ''}
      </div></div>
      <div><p class="lbl">ทำไมได้คะแนน ${sc.s}</p><ul class="grid gap-1 text-[12px]">${sc.r.map(([t, n]) => `<li class="flex justify-between"><span>${t}</span><span class="text-muted tnum">+${n}</span></li>`).join('') || '<li class="text-muted">ข้อมูลยังน้อย</li>'}</ul></div>
      ${history.length ? `<div><p class="lbl">ลีดอื่นของลูกค้าคนนี้ (${history.length})</p><ul class="space-y-1.5">${history.map(x => `<li class="flex items-center gap-2 text-[12px] cursor-pointer" onclick="bookingDetail('${x.id}')">${pill(x.status)}<span class="truncate">${boatName(x.boat)} · ${fmtD(x.date)}</span></li>`).join('')}</ul></div>` : ''}
      <label class="block"><span class="lbl">บันทึกภายใน</span><textarea class="inp" rows="3" placeholder="เช่น ลูกค้าอยากได้เรือที่มีห้องน้ำ งบประมาณ… มากับเด็ก 2 คน">${esc(l.note)}</textarea></label>
      <div><p class="lbl">ประวัติ</p><ol class="space-y-2 text-[12px]"><li class="flex gap-2"><span class="w-1.5 h-1.5 rounded-full bg-maroon mt-1.5 shrink-0"></span>${fmtTs(l.createdAt)} · เข้ามาจาก ${SRC[l.src][0]} ผ่าน${l.contact}</li>${l.acts.map(a => `<li class="flex gap-2"><span class="w-1.5 h-1.5 rounded-full bg-maroon mt-1.5 shrink-0"></span>${fmtTs(a.ts)} · ${userName(a.uid || '—')} ${esc(a.t)}</li>`).join('')}</ol></div>
    </div>
    <div class="p-4 border-t border-line flex gap-2 shrink-0">
      ${OPEN_ST.includes(l.status) ? `<button class="btn btn-o flex-1" onclick="leadAskLost('${l.id}')"><i data-lucide="x-circle" class="w-3.5 h-3.5"></i>ไม่สำเร็จ</button><button class="btn btn-p flex-1" onclick="setStatus('${l.id}','won');bookingDetail('${l.id}')"><i data-lucide="party-popper" class="w-3.5 h-3.5"></i>ปิดการขายได้</button>` : `<button class="btn btn-o flex-1" onclick="setStatus('${l.id}','talking');bookingDetail('${l.id}')"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>เปิดลีดอีกครั้ง</button>`}
    </div>`);
};
function leadAskLost(id) {
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">เหตุผลที่ไม่สำเร็จ</p><p class="text-[12px] text-muted mt-1">ใช้วิเคราะห์ว่าเสียลูกค้าเพราะอะไร และนำลีดกลับมาเสนอใหม่ภายหลัง</p></div>
    <div class="p-5 grid gap-2">${LOST_R.map(r => `<button class="text-left rounded-xl ring-1 ring-line p-3 hover:ring-maroon text-[13px]" onclick="closeModal();leadSet('${id}','lost','${r}')">${r}</button>`).join('')}</div>`);
}
setStatus = function (id, s) {
  const l = BOOKINGS.find(x => x.id === id); if (!l || !STATUS[s] || l.status === s) return;
  l.status = s; if (s === 'contacted' && l.reply == null) l.reply = leadAgeMin(l);
  if (!OPEN_ST.includes(s)) l.next = ''; else if (!l.next) l.next = iso(addDays(TODAY, 2));
  toast(s === 'won' ? 'ปิดการขายแล้ว · ส่งสัญญาณ “ลูกค้าจริง” กลับไป Meta / Google Ads (จำลอง)' : `เปลี่ยนสถานะเป็น "${STATUS[s][0]}" แล้ว`);
  if (s === 'lost' && !l.lost) setTimeout(() => leadAskLost(id), 50);
  rerender();
};
recordPay = function () { };

/* ---------- add lead (phone / walk-in / chat) ---------- */
newBooking = function (slug) {
  const boats = FLEET.filter(b => b.active !== false);
  openModal(`<div class="p-5 border-b border-line flex items-center justify-between"><div><p class="font-medium">เพิ่มลีด</p><p class="text-[12px] text-muted">สำหรับลูกค้าที่ทักแชทหรือโทรมาโดยตรง · ลีดจากเว็บเข้ามาเอง</p></div><button class="btn btn-g !px-2" onclick="closeModal()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <form id="nbF" class="p-5 grid grid-cols-2 gap-3" onsubmit="event.preventDefault();saveNew()">
      <label><span class="lbl">ชื่อลูกค้า *</span><input id="nbName" class="inp" required/></label>
      <label><span class="lbl">เบอร์ / WhatsApp *</span><input id="nbPhone" class="inp" inputmode="tel" required/></label>
      <label class="col-span-2"><span class="lbl">อีเมล</span><input id="nbEmail" type="email" class="inp"/></label>
      <label><span class="lbl">มาจาก</span><select id="nbSrc" class="inp">${Object.entries(SRC).map(([k, [n]]) => `<option value="${k}" ${k === 'wa' ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label><span class="lbl">ติดต่อผ่าน</span><select id="nbCh" class="inp">${CONTACT.map(c => `<option ${c === 'WhatsApp' ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="col-span-2"><span class="lbl">เรือที่สนใจ</span><select id="nbBoat" class="inp">${boats.map(b => `<option value="${b.slug}" ${b.slug === slug ? 'selected' : ''}>${b.name} · ${TYPE_TH[b.type]}</option>`).join('')}</select></label>
      <label><span class="lbl">วันที่ต้องการ</span><input id="nbDate" type="date" class="inp" value="${iso(addDays(TODAY, 14))}"/></label>
      <label><span class="lbl">จำนวนคน</span><input id="nbG" type="number" min="1" class="inp" value="8"/></label>
      <label><span class="lbl">เซลล์</span><select id="nbS" class="inp">${TEAM.filter(t => !t.deleted && ['super', 'admin', 'sales'].includes(t.roleKey)).map(t => `<option value="${t.id}" ${t.id === ME?.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>
      <label class="flex items-center gap-2 text-[12.5px] self-end pb-2"><input id="nbConsent" type="checkbox" class="accent-[#70000e] w-4 h-4"/>ลูกค้ายินยอมรับข่าวสาร</label>
      <label class="col-span-2"><span class="lbl">บันทึก</span><textarea id="nbNote" class="inp" rows="2"></textarea></label>
      <div class="col-span-2 flex justify-end gap-2 pt-1"><button type="button" class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p">บันทึกลีด</button></div>
    </form>`);
  setTimeout(() => $('#nbName')?.focus(), 30);
};
saveNew = function () {
  const ph = $('#nbPhone').value.trim(), digits = ph.replace(/\D/g, '');
  let c = CUSTOMERS.find(x => String(x.phone).replace(/\D/g, '') === digits);
  if (!c) { c = { id: 'C' + (1001 + CUSTOMERS.length), name: $('#nbName').value.trim(), country: /^(\+?66|0)/.test(ph) ? '🇹🇭 TH' : '🌐', phone: ph, email: $('#nbEmail').value.trim(), channel: $('#nbCh').value, tags: [], consent: $('#nbConsent').checked }; c.lang = /TH/.test(c.country) ? 'th' : 'en'; CUSTOMERS.push(c); }
  const now = new Date(), id = `LD-${iso(TODAY).slice(2).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
  BOOKINGS.unshift({ id, boat: $('#nbBoat').value, prog: '', date: $('#nbDate').value, guests: +$('#nbG').value || 1, status: 'contacted', cust: c.id, sales: $('#nbS').value, channel: $('#nbCh').value, contact: $('#nbCh').value, src: $('#nbSrc').value, campaign: '', landing: '—', viewed: [$('#nbBoat').value], pages: 0, device: '—', lang: c.lang, created: iso(TODAY), createdAt: now.toISOString(), reply: 0, next: iso(addDays(TODAY, 1)), lost: '', slot: '', pickup: '', note: $('#nbNote').value, acts: [], clickId: '' });
  closeModal(); toast('บันทึกลีด ' + id + ' แล้ว'); BK.tab = 'open'; go('bookings'); if (CUR === 'bookings') vBookings();
};
const leadCsvRows = L => [['lead_id', 'created', 'customer', 'phone', 'email', 'country', 'language', 'marketing_consent', 'boat', 'program', 'trip_date', 'guests', 'source', 'campaign', 'landing_page', 'contact_via', 'score', 'status', 'lost_reason', 'sales', 'first_reply_min', 'next_follow_up'],
  ...L.map(l => { const c = custOf(l.cust); return [l.id, l.createdAt, c.name, c.phone, c.email, c.country, l.lang, c.consent ? 'yes' : 'no', boatName(l.boat), l.prog, l.date, l.guests, SRC[l.src]?.[0], l.campaign, l.landing, l.contact, leadScore(l).s, STATUS[l.status][0], l.lost, teamOf(l.sales)?.name, l.reply ?? '', l.next]; })];
exportCsv = function () { const rows = leadCsvRows(BOOKINGS); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' })); a.download = 'btt-leads.csv'; a.click(); toast('ดาวน์โหลด CSV แล้ว'); };

/* ---------- dashboard ---------- */
vDashboard = function () {
  const now = TODAY, mS = iso(new Date(now.getFullYear(), now.getMonth(), 1)), pS = iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), pE = iso(addDays(new Date(now.getFullYear(), now.getMonth(), 1), -1));
  const dayOfM = now.getDate(), pSame = iso(new Date(now.getFullYear(), now.getMonth() - 1, dayOfM));
  const thisM = BOOKINGS.filter(l => l.created >= mS), lastM = BOOKINGS.filter(l => l.created >= pS && l.created <= pSame);
  const d90 = iso(addDays(now, -90)), closed = BOOKINGS.filter(l => l.created >= d90 && ['won', 'lost'].includes(l.status)), won = closed.filter(l => l.status === 'won');
  const waiting = BOOKINGS.filter(l => l.status === 'new').sort((a, b) => a.createdAt.localeCompare(b.createdAt)), late = waiting.filter(l => leadAgeMin(l) > 30);
  const due = BOOKINGS.filter(l => l.next && l.next <= iso(now) && OPEN_ST.includes(l.status)).sort((a, b) => a.next.localeCompare(b.next));
  const rep = median(BOOKINGS.filter(l => l.created >= iso(addDays(now, -30))).map(l => l.reply));
  const users30 = typeof SER !== 'undefined' ? sum(SER.users.slice(-30)) : 0, leads30 = BOOKINGS.filter(l => l.created >= iso(addDays(now, -30)) && l.contact === 'ฟอร์มบนเว็บ').length;
  const kpi = (ic, l, v, sub, tone = '') => `<div class="card p-5"><div class="flex items-center justify-between"><p class="text-muted text-[12px]">${l}</p><span class="w-8 h-8 rounded-full grid place-items-center ${tone || 'bg-sand text-ink'}"><i data-lucide="${ic}" class="w-4 h-4"></i></span></div><p class="text-2xl font-medium mt-2 tnum">${v}</p><p class="text-[11.5px] text-muted mt-1">${sub}</p></div>`;
  const diff = thisM.length - lastM.length;
  // 12 weeks
  const weeks = Array.from({ length: 12 }, (_, i) => { const e = addDays(now, -7 * (11 - i)), s = addDays(e, -6); const L = BOOKINGS.filter(l => l.created >= iso(s) && l.created <= iso(e)); return { s, n: L.length, w: L.filter(l => l.status === 'won').length }; });
  const wmax = Math.max(...weeks.map(w => w.n), 1);
  const bySrc = Object.keys(SRC).map(k => { const L = BOOKINGS.filter(l => l.src === k), cl = L.filter(l => ['won', 'lost'].includes(l.status)); return [k, L.length, pct(L.filter(l => l.status === 'won').length, cl.length)]; }).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  const smax = Math.max(...bySrc.map(x => x[1]), 1);
  const land = Object.entries(BOOKINGS.reduce((o, l) => { const k = l.landing.startsWith('/blog/') ? l.landing : l.landing.startsWith('/yacht-charter/') ? l.landing : l.landing; o[k] = (o[k] || 0) + 1; return o; }, {})).filter(([k]) => k !== '—').sort((a, b) => b[1] - a[1]).slice(0, 6);
  const landName = k => k === '/' ? 'หน้าแรก' : k.startsWith('/yacht-charter/') ? 'หน้าเรือ · ' + boatName(k.split('/').pop()) : k.startsWith('/blog/') ? 'บทความ · ' + decodeURIComponent(k.slice(6)).replace(/-/g, ' ') : k;
  const lostR = LOST_R.map(r => [r, BOOKINGS.filter(l => l.lost === r).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  const full = BOOKINGS.filter(l => l.lost === 'วันที่ต้องการเรือเต็ม').length;
  $('#view').innerHTML = `
    ${head(`สวัสดี คุณ${ME?.name || ''}`, `ภาพรวมลีด ณ ${fmtD(iso(now))} · เว็บหาลีด เซลล์ปิดการขาย`, `<button class="btn btn-o" onclick="go('audiences')"><i data-lucide="target" class="w-3.5 h-3.5"></i>ใช้ประโยชน์จากลีด</button><button class="btn btn-p" onclick="newBooking()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มลีด</button>`)}
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      ${kpi('inbox', 'ลีดเดือนนี้', thisM.length, `${diff >= 0 ? '▲' : '▼'} ${Math.abs(diff)} เทียบช่วงเดียวกันเดือนก่อน`, 'bg-maroon text-white')}
      ${kpi('alarm-clock', 'รอติดต่อ', waiting.length, late.length ? `<span class="text-[#b42318]">${late.length} รายรอเกิน 30 นาที</span>` : 'ตอบทันเวลาทั้งหมด')}
      ${kpi('trophy', 'อัตราปิดการขาย (90 วัน)', pct(won.length, closed.length) + '%', `${won.length} ปิดได้ จาก ${closed.length} ลีดที่จบแล้ว`)}
      ${kpi('timer', 'เวลาตอบกลับ (มัธยฐาน)', ago(rep), users30 ? `ผู้เข้าชม → ลีด ${(leads30 / users30 * 100).toFixed(1)}% (30 วัน)` : 'เป้าหมาย ไม่เกิน 15 นาที')}
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4 items-start">
      <div class="card p-5 xl:col-span-2 min-w-0">
        <div class="flex items-center justify-between"><p class="font-medium">ลีดรายสัปดาห์</p><span class="text-[11px] text-muted flex items-center gap-3"><span class="flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm bg-maroon inline-block"></i>ปิดได้</span><span class="flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm bg-maroon/20 inline-block"></i>ลีดทั้งหมด</span></span></div>
        <div class="mt-6 h-48 flex items-end gap-1.5 sm:gap-3">${weeks.map((w, wi) => `<div class="flex-1 min-w-0 flex flex-col items-center gap-1.5 h-full justify-end" title="${fmtD(iso(w.s))}: ${w.n} ลีด, ปิดได้ ${w.w}"><span class="text-[10px] text-muted tnum">${w.n || ''}</span><div class="w-full max-w-[40px] rounded-t-md bg-maroon/20 relative" style="height:${w.n / wmax * 100}%"><div class="absolute bottom-0 inset-x-0 rounded-t-md bg-maroon" style="height:${w.n ? w.w / w.n * 100 : 0}%"></div></div><span class="text-[9.5px] text-muted whitespace-nowrap ${wi % 2 ? 'invisible sm:visible' : ''}">${w.s.getDate()}/${w.s.getMonth() + 1}</span></div>`).join('')}</div>
      </div>
      <div class="card p-5">
        <p class="font-medium">ต้องทำตอนนี้</p>
        <ul class="mt-2 divide-y divide-line">
          ${waiting.slice(0, 4).map(l => `<li class="py-2.5 flex items-center gap-3 cursor-pointer" onclick="bookingDetail('${l.id}')"><span class="w-8 h-8 rounded-full ${leadAgeMin(l) > 30 ? 'bg-[#fdecea] text-[#b42318]' : 'bg-[#eef2ff] text-[#3b4bb5]'} grid place-items-center shrink-0"><i data-lucide="message-square" class="w-4 h-4"></i></span><div class="min-w-0 flex-1"><p class="truncate">${esc(custOf(l.cust).name)}</p><p class="text-[11px] text-muted truncate">ลีดใหม่ · ${boatName(l.boat)} · รอ ${ago(leadAgeMin(l))}</p></div>${scorePill(l)}</li>`).join('')}
          ${due.slice(0, 4).map(l => `<li class="py-2.5 flex items-center gap-3 cursor-pointer" onclick="bookingDetail('${l.id}')"><span class="w-8 h-8 rounded-full bg-maroon-50 text-maroon grid place-items-center shrink-0"><i data-lucide="bell-ring" class="w-4 h-4"></i></span><div class="min-w-0 flex-1"><p class="truncate">${esc(custOf(l.cust).name)}</p><p class="text-[11px] ${l.next < iso(now) ? 'text-[#b42318]' : 'text-muted'} truncate">ติดตาม${l.next < iso(now) ? 'เลยกำหนด ' + fmtD(l.next) : 'วันนี้'} · ${STATUS[l.status][0]}</p></div></li>`).join('')}
          ${!waiting.length && !due.length ? '<li class="py-6 text-center text-muted">ไม่มีงานค้าง</li>' : ''}
        </ul>
        <button class="btn btn-o w-full mt-3" onclick="BK.tab='open';BK.sort='next';go('bookings')">ดูลีดที่กำลังดำเนินการ</button>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4 items-start">
      <div class="card p-5"><p class="font-medium">ลีดมาจากไหน</p><p class="text-[11px] text-muted">จำนวนลีด · % ปิดได้</p>
        <div class="mt-4 space-y-3">${bySrc.map(([k, n, cv]) => `<div><div class="flex justify-between gap-2 text-[12px]">${srcPill(k, 1)}<span class="text-muted tnum">${n} · <b class="font-medium ${cv >= 35 ? 'text-[#1e7a46]' : 'text-ink'}">${cv}%</b></span></div><div class="mt-1.5 h-1.5 rounded-full bg-sand overflow-hidden"><div class="h-full rounded-full bg-maroon" style="width:${n / smax * 100}%"></div></div></div>`).join('')}</div></div>
      <div class="card p-5"><p class="font-medium">หน้าที่สร้างลีดได้มากสุด</p><p class="text-[11px] text-muted">หน้าแรกที่ลูกค้าเข้ามาก่อนส่งคำขอ</p>
        <ol class="mt-3 space-y-2.5">${land.map(([k, n], i) => `<li class="flex items-center gap-3 text-[12.5px]"><span class="w-5 text-muted tnum">${i + 1}</span><span class="flex-1 min-w-0 truncate">${esc(landName(k))}</span><span class="tnum text-muted">${n}</span></li>`).join('')}</ol>
        <p class="text-[11px] text-muted mt-4">บทความที่พาลีดเข้ามาได้ ควรทำเนื้อหาแนวเดียวกันเพิ่ม</p></div>
      <div class="card p-5"><p class="font-medium">ทำไมลีดไม่สำเร็จ</p>
        <div class="mt-4 space-y-3">${lostR.map(([r, n]) => `<div><div class="flex justify-between text-[12px]"><span>${r}</span><span class="text-muted tnum">${n}</span></div><div class="mt-1.5 h-1.5 rounded-full bg-sand overflow-hidden"><div class="h-full rounded-full bg-[#a3222c]" style="width:${n / Math.max(...lostR.map(x => x[1]), 1) * 100}%"></div></div></div>`).join('') || '<p class="text-muted text-[12px]">ยังไม่มีข้อมูล</p>'}</div>
        ${full ? `<div class="mt-4 rounded-xl bg-[#fbf6ef] p-3 text-[12px]"><b class="font-medium">${full} ลีดเสียเพราะเรือเต็ม</b> · ลูกค้าเหล่านี้ยังอยากไป ส่งข้อเสนอวันใหม่หรือเรือทางเลือกได้ <a class="text-maroon" href="#/audiences">ดูกลุ่มนี้ →</a></div>` : ''}</div>
    </div>`;
  icons();
};

/* ---------- calendar: interested dates & closed trips ---------- */
const _vCalendar19 = vCalendar;
vCalendar = function () {
  const B = BOOKINGS.slice(); BOOKINGS.length = 0; BOOKINGS.push(...B.filter(l => l.status !== 'lost'));
  try { _vCalendar19(); } finally { BOOKINGS.length = 0; BOOKINGS.push(...B); }
  const p = $('#view h2')?.nextElementSibling; if (p) p.textContent = 'วันที่ลูกค้าต้องการ และทริปที่ปิดการขายแล้ว · ใช้เช็กคิวเรือก่อนตอบลูกค้า';
};

/* ---------- customers ---------- */
vCustomers = function () {
  const st = c => { const L = BOOKINGS.filter(l => l.cust === c.id); return { n: L.length, w: L.filter(l => l.status === 'won').length, last: L.map(l => l.created).sort().pop(), src: L.map(l => l.src).pop() }; };
  const list = CUSTOMERS.filter(c => !CQ || (c.name + c.phone + c.email).toLowerCase().includes(CQ.toLowerCase())).map(c => ({ c, s: st(c) })).sort((a, b) => (b.s.last || '').localeCompare(a.s.last || ''));
  $('#view').innerHTML = `${head('ลูกค้า', `${CUSTOMERS.length} ราย · ยินยอมรับข่าวสาร ${CUSTOMERS.filter(c => c.consent).length} ราย`, `<input class="inp !w-64" placeholder="ค้นหาชื่อ เบอร์ อีเมล" value="${esc(CQ)}" oninput="CQ=this.value;clearTimeout(window._cq);window._cq=setTimeout(()=>{vCustomers();const i=$('#view input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"/>`)}
    <div class="card overflow-x-auto"><table class="tbl"><thead><tr><th>ลูกค้า</th><th>ติดต่อ</th><th>มาจาก</th><th>ลีด</th><th>ปิดได้</th><th>ล่าสุด</th><th>รับข่าวสาร</th></tr></thead><tbody>
      ${list.map(({ c, s }) => `<tr class="click" onclick="custDetail('${c.id}')"><td><div class="flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-sand grid place-items-center text-[12px]">${esc(c.name.slice(0, 1))}</span><div><p>${esc(c.name)} ${s.w ? '<span class="pill st-confirmed ml-1">ลูกค้า</span>' : ''}${c.tags.map(t => `<span class="pill st-new ml-1">${t}</span>`).join('')}</p><p class="text-[11px] text-muted">${c.country}</p></div></div></td>
        <td><p class="tnum">${c.phone}</p><p class="text-[11px] text-muted">${c.email}</p></td><td>${s.src ? srcPill(s.src, 1) : '—'}</td><td class="tnum">${s.n}</td><td class="tnum">${s.w}</td><td class="text-muted whitespace-nowrap">${s.last ? fmtD(s.last) : '—'}</td><td>${c.consent ? '<i data-lucide="check" class="w-4 h-4 text-[#1e7a46]"></i>' : '<span class="text-muted">—</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
  icons();
};
custDetail = function (id) {
  const c = custOf(id), L = BOOKINGS.filter(l => l.cust === id);
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line"><p class="font-medium">${esc(c.name)}</p><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 space-y-5"><dl class="grid grid-cols-2 gap-3"><div><dt class="lbl">ประเทศ</dt><dd>${c.country}</dd></div><div><dt class="lbl">ภาษา</dt><dd>${c.lang === 'th' ? 'ไทย' : 'English'}</dd></div><div><dt class="lbl">โทร</dt><dd class="tnum">${c.phone}</dd></div><div><dt class="lbl">อีเมล</dt><dd class="break-all">${c.email || '—'}</dd></div></dl>
    <label class="flex items-center justify-between rounded-xl ring-1 ring-line p-3"><span><span class="block text-[13px]">ยินยอมรับข่าวสารและโปรโมชัน</span><span class="block text-[11px] text-muted">ใช้ส่งข้อเสนอ และอัปโหลดเข้ากลุ่มโฆษณาได้เฉพาะคนที่ยินยอม (PDPA)</span></span><span class="tgl"><input type="checkbox" ${c.consent ? 'checked' : ''} onchange="custOf('${id}').consent=this.checked;toast(this.checked?'บันทึกความยินยอมแล้ว':'ถอนความยินยอมแล้ว · จะถูกนำออกจากกลุ่มโฆษณาในการซิงก์ครั้งถัดไป')"/><span></span></span></label>
    <div><p class="lbl">ลีดทั้งหมด (${L.length})</p><ul class="space-y-2">${L.map(l => `<li class="flex items-center gap-3 p-2 rounded-xl ring-1 ring-line cursor-pointer" onclick="bookingDetail('${l.id}')">${thumb(l.boat, 'w-12 h-9')}<div class="flex-1 min-w-0"><p class="truncate">${boatName(l.boat)}</p><p class="text-[11px] text-muted">${fmtD(l.date)} · ${l.guests} คน · ${SRC[l.src][0]}</p></div>${pill(l.status)}</li>`).join('')}</ul></div>
    <label class="block"><span class="lbl">บันทึกเกี่ยวกับลูกค้า</span><textarea class="inp" rows="3" placeholder="เช่น ชอบเรือใบ มากับครอบครัว แพ้กุ้ง…"></textarea></label></div>`);
};

/* ---------- team cards: leads instead of revenue ---------- */
const _vTeam19 = vTeam;
vTeam = function () {
  _vTeam19();
  const shown = TEAM.filter(t => !t.deleted);
  $$('#view .grid.md\\:grid-cols-3 > .card').forEach((card, i) => { const t = shown[i]; if (!t) return; const g = card.querySelector('.grid.grid-cols-2'); if (!g) return;
    const L = BOOKINGS.filter(l => l.sales === t.id), cl = L.filter(l => ['won', 'lost'].includes(l.status));
    g.innerHTML = [['ลีดทั้งหมด', L.length], ['กำลังดำเนินการ', L.filter(l => OPEN_ST.includes(l.status)).length], ['อัตราปิดการขาย', pct(L.filter(l => l.status === 'won').length, cl.length) + '%'], ['ตอบกลับ (มัธยฐาน)', L.length ? ago(median(L.map(l => l.reply))) : '—']].map(([k, v]) => `<div class="rounded-xl bg-sand p-3"><p class="text-[11px] text-muted">${k}</p><p class="font-medium tnum mt-1">${v}</p></div>`).join('');
  });
};

/* ---------- USE EVERY LEAD: segments · ad audiences · offline conversions · insights · templates ---------- */
const AU = { tab: 'seg', b: { status: '', src: '', type: '', lang: '', score: '', lost: '' }, sync: {}, conv: { lead: true, qualified: true, won: true } };
const monthsAgo = (d, a, b) => { const x = (TODAY - new Date(d + 'T00:00:00')) / (30.4 * 864e5); return x >= a && x <= b; };
const SEGS = [
  { k: 'won', n: 'ลูกค้าที่ปิดการขายได้', d: 'ใช้เป็นต้นแบบ Lookalike ให้ Meta / Google หาคนที่คล้ายลูกค้าจริง และตัดออกจากโฆษณาหาลูกค้าใหม่', i: 'trophy', f: l => l.status === 'won', act: 'Lookalike 1%' },
  { k: 'full', n: 'ไม่สำเร็จเพราะเรือเต็ม', d: 'ยังอยากไปอยู่ · เสนอวันใหม่หรือเรือทางเลือก โอกาสปิดสูงที่สุดในทุกกลุ่ม', i: 'calendar-x', f: l => l.lost === 'วันที่ต้องการเรือเต็ม', act: 'ส่งข้อเสนอ' },
  { k: 'price', n: 'ไม่สำเร็จเพราะราคาเกินงบ', d: 'เสนอเรือที่เล็กลง ช่วงโลว์ซีซั่น หรือแชร์ทริป', i: 'wallet', f: l => l.lost === 'ราคาเกินงบ', act: 'ส่งข้อเสนอ' },
  { k: 'stale', n: 'คุยค้างเกิน 7 วัน', d: 'ลีดที่ยังไม่ตัดสินใจ · ทักตามด้วยข้อความสั้น ๆ หรือยิงโฆษณารีมาร์เก็ต', i: 'hourglass', f: l => OPEN_ST.includes(l.status) && (TODAY - new Date(l.createdAt)) / 864e5 > 7, act: 'ติดตาม' },
  { k: 'anniv', n: 'ลูกค้าเก่า ครบรอบ 10–12 เดือน', d: 'ชวนกลับมาเที่ยวฤดูกาลเดิม · ลูกค้าเก่าปิดง่ายกว่าลูกค้าใหม่หลายเท่า', i: 'repeat', f: l => l.status === 'won' && monthsAgo(l.date, 9.5, 12.5), act: 'ชวนกลับมา' },
  { k: 'cat', n: 'สนใจเรือคาตามารัน', d: 'ทำแคมเปญเฉพาะประเภทเรือ · ส่งโปรเรือใบ/คาตามารันลำใหม่', i: 'sailboat', f: l => ['sail', 'power'].includes(bySlug(l.boat)?.type), act: 'แคมเปญ' },
  { k: 'en', n: 'ลีดต่างชาติ (EN)', d: 'แยกข้อความและโฆษณาภาษาอังกฤษ · ช่วง High Season ยิงโฆษณาต่างประเทศ', i: 'globe', f: l => l.lang === 'en', act: 'แคมเปญ' },
  { k: 'exclude', n: 'กำลังคุย + ปิดได้ใน 30 วัน (กลุ่มตัดออก)', d: 'ตัดออกจากโฆษณาหาลูกค้าใหม่ ไม่ต้องจ่ายเงินยิงคนที่คุยอยู่แล้ว', i: 'filter-x', f: l => ['talking', 'won'].includes(l.status) && (TODAY - new Date(l.createdAt)) / 864e5 <= 30, act: 'Exclusion' },
];
const segLeads = f => { const L = BOOKINGS.filter(f), ids = [...new Set(L.map(l => l.cust))]; return { L, ids, ok: ids.filter(id => custOf(id)?.consent) }; };
function vAudiences() {
  const tabs = [['seg', 'กลุ่มเป้าหมาย'], ['conv', 'ส่งผลกลับโฆษณา'], ['insight', 'ข้อมูลเชิงลึก'], ['tpl', 'ข้อความสำเร็จรูป']];
  let body = '';
  if (AU.tab === 'seg') {
    const B = AU.b, cf = l => (!B.status || l.status === B.status) && (!B.src || l.src === B.src) && (!B.type || bySlug(l.boat)?.type === B.type) && (!B.lang || l.lang === B.lang) && (!B.score || leadScore(l).t === B.score) && (!B.lost || l.lost === B.lost);
    const cs = segLeads(cf), sel = (k, opts, ph) => `<select class="inp flt" onchange="AU.b.${k}=this.value;vAudiences()"><option value="">${ph}</option>${opts.map(([v, l]) => `<option value="${v}" ${AU.b[k] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    body = `<div class="grid md:grid-cols-2 gap-4">${SEGS.map(s => { const r = segLeads(s.f), sy = AU.sync[s.k]; return `<div class="card p-4 flex flex-col"><div class="flex items-start gap-3"><span class="w-9 h-9 rounded-xl bg-maroon-50 text-maroon grid place-items-center shrink-0"><i data-lucide="${s.i}" class="w-4 h-4"></i></span><div class="min-w-0 flex-1"><p class="font-medium">${s.n}</p><p class="text-[12px] text-muted mt-0.5">${s.d}</p></div></div>
        <div class="flex items-end justify-between gap-3 mt-4"><div><p class="text-2xl tnum">${r.ids.length}</p><p class="text-[11px] text-muted">คน · ยินยอมรับข่าวสาร ${r.ok.length}</p></div>${sy ? `<p class="text-[11px] text-[#1e7a46] text-right">ซิงก์แล้ว ${sy}<br/>อัปเดตอัตโนมัติทุกวัน</p>` : ''}</div>
        <div class="flex flex-wrap gap-2 mt-4 pt-3 border-t border-line"><button class="btn btn-o !h-8" onclick="auSync('${s.k}','Meta')"><i data-lucide="share-2" class="w-3.5 h-3.5"></i>Meta</button><button class="btn btn-o !h-8" onclick="auSync('${s.k}','Google Ads')"><i data-lucide="share-2" class="w-3.5 h-3.5"></i>Google</button><button class="btn btn-o !h-8" onclick="auBroadcast('${s.k}')"><i data-lucide="send" class="w-3.5 h-3.5"></i>ส่งข้อความ</button><button class="btn btn-g !h-8" onclick="auList('${s.k}')">ดูรายชื่อ</button></div></div>`; }).join('')}</div>
      <div class="card p-4 mt-4"><p class="font-medium">สร้างกลุ่มเอง</p><p class="text-[12px] text-muted">เลือกเงื่อนไข ระบบนับคนให้ทันที</p>
        <div class="grid grid-cols-2 lg:grid-cols-6 gap-2 mt-3">${sel('status', Object.entries(STATUS).map(([k, v]) => [k, v[0]]), 'ทุกสถานะ')}${sel('src', Object.entries(SRC).map(([k, v]) => [k, v[0]]), 'ทุกแหล่งที่มา')}${sel('type', Object.entries(TYPE_TH), 'ทุกประเภทเรือ')}${sel('lang', [['th', 'ไทย'], ['en', 'English']], 'ทุกภาษา')}${sel('score', Object.entries(SCORE_T).map(([k, v]) => [k, v[0]]), 'ทุกคะแนน')}${sel('lost', LOST_R.map(r => [r, r]), 'เหตุผลไม่สำเร็จ')}</div>
        <div class="flex flex-wrap items-center gap-3 mt-4"><p><b class="text-xl tnum">${cs.ids.length}</b> <span class="text-muted text-[12px]">คน · ยินยอม ${cs.ok.length} · ${cs.L.length} ลีด</span></p><span class="flex-1"></span><button class="btn btn-o" onclick="auSync('custom','Meta')">ส่งไป Meta</button><button class="btn btn-o" onclick="auSync('custom','Google Ads')">ส่งไป Google</button><button class="btn btn-p" onclick="auCsv()"><i data-lucide="download" class="w-3.5 h-3.5"></i>Export</button></div></div>
      <p class="text-[11px] text-muted mt-3 flex gap-1.5"><i data-lucide="shield-check" class="w-3.5 h-3.5 shrink-0"></i>ส่งขึ้นแพลตฟอร์มโฆษณาเฉพาะคนที่ยินยอม · เบอร์และอีเมลถูกเข้ารหัส SHA-256 ก่อนส่ง · ใครถอนความยินยอม ระบบนำออกในการซิงก์ครั้งถัดไป</p>`;
  }
  if (AU.tab === 'conv') {
    const withId = BOOKINGS.filter(l => l.clickId), wonId = withId.filter(l => l.status === 'won');
    const ev = BOOKINGS.filter(l => l.clickId).slice(0, 10);
    body = `<div class="card p-5 bg-[#fbf6ef] ring-1 ring-[#efe2cc]"><p class="font-medium">ทำไมต้องส่งผลกลับ</p><p class="text-[12.5px] mt-1 text-ink/80">ถ้าโฆษณารู้แค่ว่า “มีคนกรอกฟอร์ม” มันจะหาคนที่ชอบกรอกฟอร์ม · ถ้าเราบอกกลับว่าลีดไหน <b>คุยจริง</b> และ <b>ปิดการขายได้</b> Meta และ Google จะเรียนรู้และหาคนที่มีแนวโน้มเป็นลูกค้าจริง ทำให้ต้นทุนต่อลูกค้าลดลง</p></div>
      <div class="grid md:grid-cols-3 gap-4 mt-4">${[['lead', 'ส่งคำขอ (Lead)', 'ทันทีที่ฟอร์มส่ง · ผ่าน Pixel + Conversions API'], ['qualified', 'คุยจริง (QualifiedLead)', 'เมื่อเซลล์เปลี่ยนสถานะเป็น “กำลังคุย”'], ['won', 'ปิดการขาย (Converted)', 'เมื่อเซลล์กด “ปิดการขายได้”']].map(([k, n, d]) => `<div class="card p-4"><div class="flex items-center justify-between"><p class="font-medium text-[13px]">${n}</p><span class="tgl"><input type="checkbox" ${AU.conv[k] ? 'checked' : ''} onchange="AU.conv.${k}=this.checked"/><span></span></span></div><p class="text-[12px] text-muted mt-1">${d}</p><p class="text-[11px] mt-3 flex gap-3"><span class="text-[#1877f2]">● Meta CAPI</span><span class="text-[#e37400]">● Google Ads</span></p></div>`).join('')}</div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">${[['ลีดที่มีรหัสคลิกโฆษณา', withId.length], ['จับคู่ได้ (Match rate)', pct(withId.length, BOOKINGS.filter(l => ['gads', 'meta'].includes(l.src)).length) + '%'], ['ปิดการขายจากโฆษณา', wonId.length], ['ส่งกลับล่าสุด', 'วันนี้ 06:00']].map(([l, v]) => `<div class="card p-4"><p class="text-[11px] text-muted">${l}</p><p class="text-xl tnum mt-1">${v}</p></div>`).join('')}</div>
      <div class="card mt-4 overflow-hidden"><p class="font-medium p-4 border-b border-line">เหตุการณ์ที่ส่งล่าสุด <span class="text-muted text-[11px] font-normal">(จำลอง)</span></p><div class="overflow-x-auto"><table class="tbl"><thead><tr><th>ลีด</th><th>เหตุการณ์</th><th>แพลตฟอร์ม</th><th>สถานะ</th></tr></thead><tbody>${ev.map(l => `<tr><td>${l.id}</td><td>${l.status === 'won' ? 'Converted' : l.status === 'talking' ? 'QualifiedLead' : 'Lead'}</td><td>${l.clickId === 'gclid' ? 'Google Ads' : 'Meta'}</td><td><span class="pill st-confirmed">ส่งสำเร็จ</span></td></tr>`).join('')}</tbody></table></div></div>
      <p class="text-[11px] text-muted mt-3">เชื่อมต่อจริงในหน้า วิเคราะห์เว็บไซต์ → Meta Pixel และ Google Ads · ระบบจริงส่งจากเซิร์ฟเวอร์ ไม่ส่งชื่อหรือเบอร์แบบไม่เข้ารหัส</p>`;
  }
  if (AU.tab === 'insight') {
    const fullBy = Object.entries(BOOKINGS.filter(l => l.lost === 'วันที่ต้องการเรือเต็ม').reduce((o, l) => { const t = TYPE_TH[bySlug(l.boat)?.type] || '-'; o[t] = (o[t] || 0) + 1; return o; }, {})).sort((a, b) => b[1] - a[1]);
    const hours = Array.from({ length: 24 }, (_, h) => BOOKINGS.filter(l => new Date(l.createdAt).getHours() === h).length), hmax = Math.max(...hours, 1);
    const lead = BOOKINGS.map(l => Math.round((new Date(l.date) - new Date(l.created)) / 864e5)).filter(x => x >= 0), lt = median(lead);
    const demand = Object.entries(BOOKINGS.reduce((o, l) => { o[l.boat] = o[l.boat] || [0, 0]; o[l.boat][0]++; if (l.status === 'won') o[l.boat][1]++; return o; }, {})).sort((a, b) => b[1][0] - a[1][0]).slice(0, 8);
    const grp = Object.entries(TYPE_TH).map(([k, n]) => { const L = BOOKINGS.filter(l => bySlug(l.boat)?.type === k); return [n, L.length ? Math.round(sum(L.map(l => l.guests)) / L.length) : 0, L.length]; }).filter(x => x[2]);
    const en = BOOKINGS.filter(l => l.lang === 'en').length;
    body = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card p-5"><p class="font-medium">ลีดเข้ามาช่วงเวลาไหน</p><p class="text-[11px] text-muted">จัดเวรเซลล์ให้ตรงช่วงที่ลีดเข้าเยอะ</p><div class="mt-5 h-32 flex items-end gap-[3px]">${hours.map((n, h) => `<div class="flex-1 rounded-t ${n === hmax ? 'bg-maroon' : 'bg-maroon/25'}" style="height:${n / hmax * 100}%" title="${h}:00 · ${n} ลีด"></div>`).join('')}</div><div class="flex justify-between text-[10px] text-muted mt-1"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div><p class="text-[12px] mt-3">ช่วงพีค <b class="font-medium">${hours.indexOf(hmax)}:00–${hours.indexOf(hmax) + 1}:00 น.</b></p></div>
      <div class="card p-5"><p class="font-medium">ถามล่วงหน้ากี่วันก่อนเที่ยว</p><p class="text-3xl tnum mt-3">${lt} <span class="text-[13px] text-muted">วัน (มัธยฐาน)</span></p><p class="text-[12px] text-muted mt-2">เริ่มยิงโฆษณาช่วงพีคล่วงหน้าอย่างน้อย ${Math.max(14, lt)} วัน เช่น ปีใหม่ควรเริ่มตั้งแต่ ${fmtD(iso(addDays(new Date(TODAY.getFullYear(), 11, 25), -Math.max(30, lt * 2))))}</p>
        <p class="font-medium mt-6">สัดส่วนภาษา</p><div class="mt-2 h-2.5 rounded-full bg-sand overflow-hidden flex"><div class="bg-maroon" style="width:${pct(BOOKINGS.length - en, BOOKINGS.length)}%"></div></div><p class="text-[12px] text-muted mt-1.5">ไทย ${pct(BOOKINGS.length - en, BOOKINGS.length)}% · English ${pct(en, BOOKINGS.length)}%</p></div>
      <div class="card p-5"><p class="font-medium">เรือที่ถูกถามมากที่สุด</p><p class="text-[11px] text-muted">จำนวนลีด · ปิดได้</p><ul class="mt-3 space-y-2.5">${demand.map(([s, [n, w]]) => `<li class="flex items-center gap-3">${thumb(s, 'w-10 h-8')}<span class="flex-1 min-w-0 truncate">${boatName(s)}</span><span class="tnum text-muted text-[12px]">${n} · <b class="font-medium text-ink">${w}</b></span></li>`).join('')}</ul></div>
      <div class="card p-5"><p class="font-medium">ความต้องการที่เรายังรับไม่ได้</p><p class="text-[11px] text-muted">ลีดที่เสียเพราะเรือเต็ม แยกตามประเภท → ควรหาเรือพาร์ทเนอร์เพิ่ม</p><ul class="mt-3 space-y-2">${fullBy.map(([t, n]) => `<li class="flex justify-between text-[12.5px]"><span>${t}</span><span class="tnum">${n} ลีด</span></li>`).join('') || '<li class="text-muted text-[12px]">ยังไม่มี</li>'}</ul>
        <p class="font-medium mt-6">ขนาดกลุ่มเฉลี่ย</p><ul class="mt-2 space-y-1.5">${grp.map(([n, g, c]) => `<li class="flex justify-between text-[12.5px]"><span>${n}</span><span class="tnum text-muted">${g} คน · ${c} ลีด</span></li>`).join('')}</ul></div>
    </div>`;
  }
  if (AU.tab === 'tpl') body = `<div class="grid lg:grid-cols-2 gap-4">${TPL.map((t, i) => `<div class="card p-4"><p class="font-medium">${t.n}</p><label class="block mt-3"><span class="lbl">ไทย</span><textarea class="inp !text-[12.5px]" rows="3" oninput="TPL[${i}].th=this.value">${esc(t.th)}</textarea></label><label class="block mt-2"><span class="lbl">English</span><textarea class="inp !text-[12.5px]" rows="3" oninput="TPL[${i}].en=this.value">${esc(t.en)}</textarea></label></div>`).join('')}</div><p class="text-[11px] text-muted mt-3">ตัวแปรที่ใช้ได้: {name} {me} {boat} {date} {guests} {alt} · เซลล์กดใช้จากหน้าลีด ระบบเติมข้อมูลและเลือกภาษาตามลูกค้าให้</p>`;
  $('#view').innerHTML = `${head('ใช้ประโยชน์จากลีด', 'ทุกลีดมีค่า แม้ยังไม่ปิด · แบ่งกลุ่ม ส่งให้โฆษณาเรียนรู้ ดึงลูกค้ากลับมา และหาโอกาสที่ยังพลาด')}
    <div class="flex gap-1 overflow-x-auto no-sb mb-4">${tabs.map(([k, l]) => `<button class="tab ${AU.tab === k ? 'on' : ''}" onclick="AU.tab='${k}';vAudiences()">${l}</button>`).join('')}</div>${body}`;
  icons();
}
const segByKey = k => k === 'custom' ? l => { const B = AU.b; return (!B.status || l.status === B.status) && (!B.src || l.src === B.src) && (!B.type || bySlug(l.boat)?.type === B.type) && (!B.lang || l.lang === B.lang) && (!B.score || leadScore(l).t === B.score) && (!B.lost || l.lost === B.lost); } : SEGS.find(s => s.k === k).f;
function auSync(k, p) { const r = segLeads(segByKey(k)); if (!r.ok.length) return toast('ไม่มีคนที่ยินยอมในกลุ่มนี้'); AU.sync[k] = `${p} · ${r.ok.length} คน`; if (typeof audit === 'function') audit('export', 'customer', k, `ส่งกลุ่ม “${(SEGS.find(s => s.k === k) || { n: 'กลุ่มที่สร้างเอง' }).n}” ไป ${p} (${r.ok.length} คน, เข้ารหัสแล้ว)`); toast(`ส่ง ${r.ok.length} คนไป ${p} แล้ว (จำลอง) · ตัดคนที่ไม่ยินยอม ${r.ids.length - r.ok.length} คน`); vAudiences(); }
function auBroadcast(k) { const s = SEGS.find(x => x.k === k), r = segLeads(s.f);
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">ส่งข้อความถึง “${s.n}”</p><p class="text-[12px] text-muted mt-1">ส่งได้ ${r.ok.length} คนที่ยินยอม · ช่องทางตามที่ลูกค้าติดต่อมา</p></div>
    <div class="p-5 grid gap-3"><label><span class="lbl">ช่องทาง</span><select class="inp"><option>LINE OA (Broadcast)</option><option>WhatsApp (Template message)</option><option>อีเมล</option></select></label><label><span class="lbl">ข้อความ</span><textarea class="inp" rows="4">${s.k === 'full' ? 'สวัสดีค่ะ ช่วงที่คุณเคยสอบถามเรือเต็มไป ตอนนี้มีคิวว่างและเรือลำใหม่ที่ขนาดใกล้เคียงกันแล้วค่ะ สนใจให้เช็กวันให้ไหมคะ' : s.k === 'anniv' ? 'ครบรอบ 1 ปีทริปทะเลของคุณแล้ว! ปีนี้อยากไปเกาะไหนดีคะ ทักมาให้เราช่วยจัดได้เลย' : 'สวัสดีค่ะ จาก Boat Trip Thailand มีทริปเรือที่น่าจะถูกใจคุณค่ะ'}</textarea></label>
    <p class="text-[11px] text-muted">ระบบจริงจะใส่ลิงก์ยกเลิกรับข่าวสารให้อัตโนมัติ</p></div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="closeModal();toast('ตั้งเวลาส่ง ${r.ok.length} ข้อความแล้ว (จำลอง)')">ส่ง</button></div>`); }
function auList(k) { const s = SEGS.find(x => x.k === k), r = segLeads(s.f);
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div><p class="text-[11px] text-muted">กลุ่มเป้าหมาย</p><p class="font-medium">${s.n}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-3"><ul class="divide-y divide-line">${r.L.map(l => { const c = custOf(l.cust); return `<li class="p-2.5 flex items-center gap-3 cursor-pointer hover:bg-sand rounded-xl" onclick="bookingDetail('${l.id}')"><div class="min-w-0 flex-1"><p class="truncate">${esc(c.name)} ${c.consent ? '' : '<span class="text-[10.5px] text-muted">· ไม่ยินยอม</span>'}</p><p class="text-[11px] text-muted truncate">${boatName(l.boat)} · ${fmtD(l.date)} · ${STATUS[l.status][0]}${l.lost ? ' · ' + l.lost : ''}</p></div>${scorePill(l)}</li>`; }).join('') || '<li class="p-6 text-center text-muted">ไม่มี</li>'}</ul></div>`); }
function auCsv() { const L = BOOKINGS.filter(segByKey('custom')).filter(l => custOf(l.cust)?.consent); const rows = leadCsvRows(L); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' })); a.download = 'btt-segment.csv'; a.click(); if (typeof audit === 'function') audit('export', 'customer', 'segment', `Export กลุ่มที่สร้างเอง ${L.length} ลีด (เฉพาะคนที่ยินยอม)`); toast(`ดาวน์โหลด ${L.length} รายการ (เฉพาะคนที่ยินยอม)`); }

/* ---------- nav ---------- */
PAGES.find(p => p[0] === 'bookings')[1] = 'ลีด'; PAGES.find(p => p[0] === 'bookings')[2] = 'inbox';
PAGES.find(p => p[0] === 'calendar')[1] = 'ปฏิทินเรือ';
PAGES.find(p => p[0] === 'dashboard')[3] = vDashboard; PAGES.find(p => p[0] === 'bookings')[3] = vBookings; PAGES.find(p => p[0] === 'calendar')[3] = vCalendar; PAGES.find(p => p[0] === 'customers')[3] = vCustomers; PAGES.find(p => p[0] === 'team')[3] = vTeam;
PAGES.splice(PAGES.findIndex(p => p[0] === 'customers') + 1, 0, ['audiences', 'ใช้ประโยชน์จากลีด', 'target', vAudiences]);
{ const i = PAGES.findIndex(p => p[0] === 'customers'), c = PAGES.splice(i, 2); PAGES.splice(PAGES.findIndex(p => p[0] === 'calendar') + 1, 0, ...c); }
$('#gq') && ($('#gq').placeholder = 'ค้นหาลีด ลูกค้า เรือ…');
{ const h = PAGES.find(p => p[0] === '—' && p[1] === 'ลูกค้า & ทีม'); if (h) h[1] = 'ทีม & ระบบ'; }
PAGES.find(p => p[0] === 'team')[1] = 'ทีมงาน & สิทธิ์';
{ const _vt = vTeam; vTeam = function () { _vt(); const h = $('#view h2'); if (h) h.textContent = 'ทีมงาน & สิทธิ์'; }; PAGES.find(p => p[0] === 'team')[3] = vTeam; }
