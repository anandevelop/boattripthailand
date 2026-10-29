/* data for the signed-in user — sent by the server, already scoped by role */
const BOOT = window.__BOOT__;
window.FLEET = BOOT.fleet; window.THUMBS = BOOT.thumbs; /* team photo for <img src>: no id / unknown id (lead not assigned yet, removed user) → dashed "nobody" circle, not a broken image */
const NOBODY_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#f4eeec" stroke="#c9bcbd" stroke-dasharray="2.5 2"/><circle cx="12" cy="9.5" r="3.2" fill="none" stroke="#a0928f" stroke-width="1.4"/><path d="M6.8 18.2c1-2.6 3-3.9 5.2-3.9s4.2 1.3 5.2 3.9" fill="none" stroke="#a0928f" stroke-width="1.4" stroke-linecap="round"/></svg>');
window.TEAM_IMG = BOOT.teamImg;
const teamImg = id => TEAM_IMG[id] || NOBODY_IMG;
// a team photo whose file is gone (404) → the same circle instead of a broken image
addEventListener('error', e => { const i = e.target; if (i?.tagName === 'IMG' && i.src !== NOBODY_IMG && (i.id === 'meAva' || Object.values(TEAM_IMG).includes(i.getAttribute('src')))) i.src = NOBODY_IMG; }, true); window.SEASONS = BOOT.seasons; window.ACTIMG = BOOT.actimg; window.WPDATA = BOOT.wp;
/* =====================================================================
   BTT ADMIN – mockup (vanilla JS) · data, utils, dashboard, bookings, calendar
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const baht = n => n == null ? '—' : '฿' + Math.round(n).toLocaleString('en-US');
const icons = () => window.lucide && lucide.createIcons();
function toast(m) { $('#toastT').textContent = m; const t = $('#toast'); t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2400); }
let rs = 20261019; const rnd = () => { rs |= 0; rs = rs + 0x6D2B79F5 | 0; let t = Math.imul(rs ^ rs >>> 15, 1 | rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];
const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const fmtD = s => { if (!s) return '—'; const d = new Date(s + 'T00:00:00'); return `${d.getDate()} ${TH_M[d.getMonth()]} ${String(d.getFullYear() + 543).slice(2)}`; };
const niceTitle = t => t.split(' ').map(w => /^ft$/i.test(w) ? 'ft' : /^[\d.]+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
/* a price cell starts with the amount ("24,500 THB"); text that merely mentions one ("1-7pax; Extra charge …/1000 THB") is not a price */
const priceNum = v => { const m = String(v || '').replace(/\s/g, '').match(/^([\d,]{4,})T?HB/i); return m ? +m[1].replace(/,/g, '') : null; };
const TYPE_TH = { yacht: 'เรือยอชต์', sail: 'เรือใบคาตามารัน', power: 'พาวเวอร์คาตามารัน', speed: 'สปีดโบ๊ท', longtail: 'เรือหางยาว' };
const prettyMarina = s => (s || '').toLowerCase().replace(/(^|[\s(\/-])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bRpm\b/, 'RPM').replace(/Puhket/, 'Phuket').replace('One°15', 'ONE°15').replace('Marine Panwa', 'Marina Panwa');
FLEET.forEach(b => { b.name = niceTitle(b.title); b.marinaP = prettyMarina(b.marina); if (b.active == null) b.active = true; b.featured = !!b.featured; });
const bySlug = s => FLEET.find(b => b.slug === s);
const progsOf = b => { const out = []; b.tables.forEach((t, ti) => t.rows.forEach((r, ri) => out.push({ ti, ri, label: r[0], price: r.slice(1).map(priceNum).find(Boolean) }))); return out; };

/* ---------- Team & sample data ---------- */
const TEAM = BOOT.team;
const STATUS = {
  new: ['ใหม่', 'st-new'], quote: ['ส่งใบเสนอราคา', 'st-quote'], deposit: ['รอมัดจำ', 'st-deposit'],
  confirmed: ['ยืนยันแล้ว', 'st-confirmed'], done: ['เสร็จสิ้น', 'st-done'], cancel: ['ยกเลิก', 'st-cancel'],
};
const CHANNELS = ['เว็บไซต์', 'WhatsApp', 'LINE', 'โทรศัพท์', 'Agent'];
const FIRST = ['Emma', 'Liam', 'Sophie', 'Noah', 'Olivia', 'Lucas', 'Mia', 'Daniel', 'Chloe', 'Max', 'Anna', 'Ivan', 'Yuki', 'Wei', 'Hannah', 'Oscar', 'สมชาย', 'กมลวรรณ', 'ปิยะพงษ์', 'ณัฐธิดา', 'ธนกร', 'พิมพ์ชนก', 'วรวุฒิ', 'อรอุมา'];
const LAST = ['Müller', 'Smith', 'Rossi', 'Johansson', 'Kim', 'Ivanova', 'Tanaka', 'Chen', 'Dubois', 'Brown', 'Novak', 'García', 'ใจดี', 'ศรีสุข', 'วงศ์ไทย', 'ทองมา', 'แก้วประเสริฐ', 'สุวรรณ'];
const COUNTRY = ['🇩🇪 DE', '🇬🇧 UK', '🇮🇹 IT', '🇸🇪 SE', '🇰🇷 KR', '🇷🇺 RU', '🇯🇵 JP', '🇨🇳 CN', '🇫🇷 FR', '🇦🇺 AU', '🇹🇭 TH', '🇹🇭 TH', '🇹🇭 TH'];
const CUSTOMERS = BOOT.customers;
const BOOKINGS = BOOT.leads;
const custOf = id => CUSTOMERS.find(c => c.id === id);
const teamOf = id => TEAM.find(t => t.id === id);
const pill = s => `<span class="pill ${STATUS[s][1]}">${STATUS[s][0]}</span>`;
const thumb = (slug, cls = 'w-12 h-9') => THUMBS[slug] ? `<img src="${THUMBS[slug]}" alt="" class="${cls} rounded-lg object-cover bg-sand shrink-0"/>` : `<span class="${cls} rounded-lg bg-sand shrink-0 grid place-items-center ring-1 ring-inset ring-[#e9b9bd]" title="ยังไม่มีรูป"><i data-lucide="image-off" class="w-4 h-4 text-[#c47a82]"></i></span>`;

/* ---------- Shell helpers ---------- */
function openDrawer(html) { $('#drawer').innerHTML = html; $('#drawer').classList.add('open'); $('#drawerMask').classList.remove('hidden'); icons(); }
function closeDrawer() { $('#drawer').classList.remove('open'); $('#drawerMask').classList.add('hidden'); }
function openModal(html) { $('#modalBox').innerHTML = html; $('#modal').classList.remove('hidden'); $('#modal').classList.add('flex'); icons(); }
function closeModal() { $('#modal').classList.add('hidden'); $('#modal').classList.remove('flex'); }
function toggleSide(on) { $('#side').classList.toggle('-translate-x-full', !on); $('#sideMask').classList.toggle('hidden', !on); }
const head = (title, sub, actions = '') => `<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5"><div><h2 class="text-xl font-medium">${title}</h2>${sub ? `<p class="text-muted mt-1">${sub}</p>` : ''}</div><div class="flex flex-wrap gap-2">${actions}</div></div>`;

/* =====================================================================
   DASHBOARD
   ===================================================================== */
function vDashboard() {
  const mStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), mEnd = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);
  const inMonth = b => { const d = new Date(b.date + 'T00:00:00'); return d >= mStart && d <= mEnd; };
  const live = BOOKINGS.filter(b => b.status !== 'cancel');
  const mb = live.filter(inMonth), rev = mb.reduce((s, b) => s + b.total, 0);
  const pendingDep = BOOKINGS.filter(b => b.status === 'deposit'), newOnes = BOOKINGS.filter(b => b.status === 'new' || b.status === 'quote');
  const upcoming = live.filter(b => b.date >= iso(TODAY) && b.date <= iso(addDays(TODAY, 7))).sort((a, b) => a.date.localeCompare(b.date));
  const kpi = (ic, l, v, sub, tone = '') => `<div class="card p-5"><div class="flex items-center justify-between"><p class="text-muted text-[12px]">${l}</p><span class="w-8 h-8 rounded-full grid place-items-center ${tone || 'bg-sand text-ink'}"><i data-lucide="${ic}" class="w-4 h-4"></i></span></div><p class="text-2xl font-medium mt-3 tnum">${v}</p><p class="text-[11px] text-muted mt-1">${sub}</p></div>`;
  // 6-month revenue
  const months = Array.from({ length: 6 }, (_, i) => new Date(TODAY.getFullYear(), TODAY.getMonth() - 3 + i, 1));
  const mrev = months.map(m => live.filter(b => { const d = new Date(b.date + 'T00:00:00'); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); }).reduce((s, b) => s + b.total, 0));
  const max = Math.max(...mrev, 1);
  const byType = Object.keys(TYPE_TH).map(t => [t, live.filter(b => bySlug(b.boat).type === t).length]);
  const topBoats = Object.entries(live.reduce((o, b) => (o[b.boat] = (o[b.boat] || 0) + b.total, o), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totT = byType.reduce((s, x) => s + x[1], 0) || 1;
  $('#view').innerHTML = `
    ${head(`สวัสดีครับ คุณ Kwang`, `ภาพรวมวันที่ ${fmtD(iso(TODAY))}`, `<button class="btn btn-o" onclick="go('calendar')"><i data-lucide="calendar" class="w-3.5 h-3.5"></i>ปฏิทินเรือ</button><button class="btn btn-p" onclick="newBooking()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>สร้างการจอง</button>`)}
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      ${kpi('wallet', 'ยอดจองเดือนนี้', baht(rev), `${mb.length} ทริป · ไม่รวมที่ยกเลิก`, 'bg-maroon text-white')}
      ${kpi('inbox', 'คำขอใหม่ / รอตอบ', newOnes.length, 'ควรตอบภายใน 30 นาที')}
      ${kpi('hourglass', 'รอชำระมัดจำ', pendingDep.length, baht(pendingDep.reduce((s, b) => s + b.total * .5, 0)) + ' ค้างรับ')}
      ${kpi('sailboat', 'ทริป 7 วันข้างหน้า', upcoming.length, `${new Set(upcoming.map(b => b.boat)).size} ลำที่ต้องเตรียม`)}
    </div>
    <div class="grid xl:grid-cols-3 gap-4 mt-4 items-start">
      <div class="card p-5 xl:col-span-2">
        <div class="flex items-center justify-between"><p class="font-medium">ยอดจองรายเดือน</p><span class="text-[11px] text-muted">ตามวันออกเรือ · บาท</span></div>
        <div class="mt-6 h-52 flex items-end gap-3 sm:gap-6">
          ${mrev.map((v, i) => `<div class="flex-1 flex flex-col items-center gap-2 h-full justify-end"><span class="text-[11px] text-muted tnum">${v ? (v / 1000).toFixed(0) + 'k' : '–'}</span><div class="bar w-full max-w-[56px] rounded-t-lg ${months[i].getMonth() === TODAY.getMonth() ? 'bg-maroon' : 'bg-maroon/20'}" style="height:${Math.max(3, v / max * 100)}%"></div><span class="text-[11px] ${months[i].getMonth() === TODAY.getMonth() ? 'text-ink font-medium' : 'text-muted'}">${TH_M[months[i].getMonth()]}</span></div>`).join('')}
        </div>
      </div>
      <div class="card p-5">
        <p class="font-medium">สัดส่วนตามประเภทเรือ</p>
        <div class="mt-5 space-y-3.5">${byType.map(([t, n]) => `<div><div class="flex justify-between text-[12px]"><span>${TYPE_TH[t]}</span><span class="text-muted tnum">${n} · ${Math.round(n / totT * 100)}%</span></div><div class="mt-1.5 h-1.5 rounded-full bg-sand overflow-hidden"><div class="h-full rounded-full bg-maroon" style="width:${n / totT * 100}%"></div></div></div>`).join('')}</div>
        <p class="font-medium mt-7">เรือทำยอดสูงสุด</p>
        <ul class="mt-3 space-y-2.5">${topBoats.map(([s, v], i) => `<li class="flex items-center gap-3">${thumb(s, 'w-10 h-8')}<span class="flex-1 min-w-0 truncate">${bySlug(s).name}</span><span class="text-muted tnum">${baht(v)}</span></li>`).join('')}</ul>
      </div>
    </div>
    <div class="grid xl:grid-cols-3 gap-4 mt-4">
      <div class="card xl:col-span-2 overflow-hidden">
        <div class="px-5 pt-5 pb-3 flex items-center justify-between"><p class="font-medium">ทริปที่กำลังจะออก (7 วัน)</p><button class="btn btn-g" onclick="go('bookings')">ดูทั้งหมด <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></button></div>
        <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>วันที่</th><th>เรือ</th><th>ลูกค้า</th><th>คน</th><th>สถานะ</th><th class="text-right">ยอด</th></tr></thead><tbody>
          ${upcoming.slice(0, 8).map(b => `<tr class="click" onclick="bookingDetail('${b.id}')"><td class="whitespace-nowrap">${fmtD(b.date)}</td><td><div class="flex items-center gap-2.5">${thumb(b.boat, 'w-10 h-7')}<span class="truncate max-w-[160px]">${bySlug(b.boat).name}</span></div></td><td class="truncate max-w-[140px]">${esc(custOf(b.cust).name)}</td><td class="tnum">${b.guests}</td><td>${pill(b.status)}</td><td class="text-right tnum">${baht(b.total)}</td></tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted py-8">ไม่มีทริปใน 7 วันนี้</td></tr>`}
        </tbody></table></div>
      </div>
      <div class="card p-5">
        <p class="font-medium">ต้องจัดการ</p>
        <ul class="mt-3 divide-y divide-line">
          ${newOnes.slice(0, 4).map(b => `<li class="py-3 flex items-start gap-3 cursor-pointer" onclick="bookingDetail('${b.id}')"><span class="w-8 h-8 rounded-full bg-[#eef2ff] text-[#3b4bb5] grid place-items-center shrink-0"><i data-lucide="message-square" class="w-4 h-4"></i></span><div class="min-w-0 flex-1"><p class="truncate">${esc(custOf(b.cust).name)} · ${bySlug(b.boat).name}</p><p class="text-[11px] text-muted">${STATUS[b.status][0]} · ${b.channel} · ${fmtD(b.date)}</p></div></li>`).join('')}
          ${pendingDep.slice(0, 3).map(b => `<li class="py-3 flex items-start gap-3 cursor-pointer" onclick="bookingDetail('${b.id}')"><span class="w-8 h-8 rounded-full bg-[#fff1e8] text-[#b4501a] grid place-items-center shrink-0"><i data-lucide="banknote" class="w-4 h-4"></i></span><div class="min-w-0 flex-1"><p class="truncate">รอมัดจำ ${baht(b.total / 2)}</p><p class="text-[11px] text-muted">${esc(custOf(b.cust).name)} · ${b.id}</p></div></li>`).join('')}
        </ul>
      </div>
    </div>`;
}

/* =====================================================================
   BOOKINGS
   ===================================================================== */
const BK = { tab: 'all', q: '', sales: '', sort: 'created' };
function vBookings() {
  const tabs = [['all', 'ทั้งหมด'], ...Object.entries(STATUS).map(([k, v]) => [k, v[0]])];
  const q = BK.q.toLowerCase();
  let list = BOOKINGS.filter(b => (BK.tab === 'all' || b.status === BK.tab) && (!BK.sales || b.sales === BK.sales) &&
    (!q || (b.id + ' ' + custOf(b.cust).name + ' ' + bySlug(b.boat).name + ' ' + b.prog).toLowerCase().includes(q)));
  list = [...list].sort((a, b) => BK.sort === 'date' ? a.date.localeCompare(b.date) : b.created.localeCompare(a.created));
  $('#view').innerHTML = `
    ${head('การจอง', `${BOOKINGS.length} รายการ · ${BOOKINGS.filter(b => b.status === 'new').length} รายการใหม่`, `<button class="btn btn-o" onclick="exportCsv()"><i data-lucide="download" class="w-3.5 h-3.5"></i>Export CSV</button><button class="btn btn-p" onclick="newBooking()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>สร้างการจอง</button>`)}
    <div class="card">
      <div class="p-3 flex flex-col lg:flex-row gap-2 lg:items-center border-b border-line">
        <div class="flex gap-1 overflow-x-auto no-sb">${tabs.map(([k, l]) => `<button class="tab ${BK.tab === k ? 'on' : ''}" onclick="BK.tab='${k}';vBookings()">${l} <span class="opacity-60 tnum">${k === 'all' ? BOOKINGS.length : BOOKINGS.filter(b => b.status === k).length}</span></button>`).join('')}</div>
        <div class="lg:ml-auto grid grid-cols-2 sm:flex gap-2">
          <input class="inp col-span-2 sm:!w-56" placeholder="ค้นหาเลขจอง ลูกค้า เรือ" value="${esc(BK.q)}" oninput="BK.q=this.value;clearTimeout(window._bq);window._bq=setTimeout(()=>{vBookings();const i=$('#view input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"/>
          <select class="inp sm:!w-36" onchange="BK.sales=this.value;vBookings()"><option value="">เซลล์ทุกคน</option>${TEAM.map(t => `<option value="${t.id}" ${BK.sales === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select>
          <select class="inp sm:!w-40" onchange="BK.sort=this.value;vBookings()"><option value="created" ${BK.sort === 'created' ? 'selected' : ''}>ล่าสุดก่อน</option><option value="date" ${BK.sort === 'date' ? 'selected' : ''}>ตามวันออกเรือ</option></select>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>เลขที่จอง</th><th>ลูกค้า</th><th>เรือ / โปรแกรม</th><th>วันออกเรือ</th><th>คน</th><th>ช่องทาง</th><th>เซลล์</th><th>สถานะ</th><th class="text-right">ยอด / ชำระแล้ว</th></tr></thead><tbody>
        ${list.map(b => { const c = custOf(b.cust), s = teamOf(b.sales); return `<tr class="click" onclick="bookingDetail('${b.id}')">
          <td class="whitespace-nowrap"><p class="tnum">${b.id}</p><p class="text-[11px] text-muted">สร้าง ${fmtD(b.created)}</p></td>
          <td><p class="truncate max-w-[150px]">${esc(c.name)}</p><p class="text-[11px] text-muted">${c.country}</p></td>
          <td><div class="flex items-center gap-2.5">${thumb(b.boat, 'w-10 h-7')}<div class="min-w-0"><p class="truncate max-w-[180px]">${bySlug(b.boat).name}</p><p class="text-[11px] text-muted truncate max-w-[180px]">${esc(b.prog)}</p></div></div></td>
          <td class="whitespace-nowrap">${fmtD(b.date)}</td><td class="tnum">${b.guests}</td><td class="text-muted">${b.channel}</td>
          <td><div class="flex items-center gap-1.5"><img src="${teamImg(s.id)}" class="w-6 h-6 rounded-full object-cover"/>${s.name}</div></td>
          <td>${pill(b.status)}</td>
          <td class="text-right whitespace-nowrap"><p class="tnum">${baht(b.total)}</p><p class="text-[11px] tnum ${b.paid >= b.total ? 'text-[#1e7a46]' : 'text-muted'}">${b.paid >= b.total ? 'ชำระครบ' : b.paid ? 'มัดจำ ' + baht(b.paid) : 'ยังไม่ชำระ'}</p></td></tr>`; }).join('') || `<tr><td colspan="9" class="text-center text-muted py-12">ไม่พบการจอง</td></tr>`}
      </tbody></table></div>
    </div>`;
  icons();
}
function bookingDetail(id) {
  const b = BOOKINGS.find(x => x.id === id), c = custOf(b.cust), boat = bySlug(b.boat);
  const flow = ['new', 'quote', 'deposit', 'confirmed', 'done'], idx = flow.indexOf(b.status);
  openDrawer(`
    <div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div><p class="text-[11px] text-muted">การจอง</p><p class="font-medium tnum">${b.id}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()" aria-label="Close"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <div class="flex items-center gap-1">${flow.map((s, i) => `<div class="flex-1"><div class="h-1.5 rounded-full ${b.status === 'cancel' ? 'bg-[#f3d6d8]' : i <= idx ? 'bg-maroon' : 'bg-sand-100'}"></div><p class="text-[10px] mt-1.5 ${i === idx ? 'text-ink' : 'text-muted'}">${STATUS[s][0]}</p></div>`).join('')}</div>
      <div class="flex gap-3 items-center p-3 rounded-xl bg-sand">${thumb(b.boat, 'w-20 h-14')}<div class="min-w-0"><p class="font-medium">${boat.name}</p><p class="text-[12px] text-muted truncate">${esc(b.prog)}</p><p class="text-[12px] text-muted">${boat.marinaP}</p></div></div>
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3">
        <div><dt class="lbl">วันออกเรือ</dt><dd>${fmtD(b.date)}</dd></div><div><dt class="lbl">จำนวนคน</dt><dd>${b.guests} คน</dd></div>
        <div><dt class="lbl">ลูกค้า</dt><dd>${esc(c.name)} ${c.country}</dd></div><div><dt class="lbl">ติดต่อ</dt><dd class="tnum">${c.phone}</dd></div>
        <div><dt class="lbl">ช่องทาง</dt><dd>${b.channel}</dd></div><div><dt class="lbl">รับที่</dt><dd>${b.pickup || '—'}</dd></div>
      </dl>
      ${b.note ? `<div class="p-3 rounded-xl bg-[#fff8e6] text-[12.5px]"><i data-lucide="sticky-note" class="w-3.5 h-3.5 inline -mt-0.5 mr-1"></i>${esc(b.note)}</div>` : ''}
      <div class="rounded-xl ring-1 ring-line p-4 space-y-2">
        <div class="flex justify-between"><span class="text-muted">ราคาเช่าเรือ</span><span class="tnum">${baht(b.total)}</span></div>
        <div class="flex justify-between"><span class="text-muted">มัดจำ 50%</span><span class="tnum">${baht(b.total / 2)}</span></div>
        <div class="flex justify-between"><span class="text-muted">ชำระแล้ว</span><span class="tnum">${baht(b.paid)}</span></div>
        <div class="flex justify-between pt-2 border-t border-line font-medium"><span>คงค้าง</span><span class="tnum">${baht(b.total - b.paid)}</span></div>
        <div class="flex gap-2 pt-2">${b.paid < b.total ? `<button class="btn btn-o flex-1" onclick="recordPay('${b.id}')"><i data-lucide="banknote" class="w-3.5 h-3.5"></i>บันทึกรับเงิน</button>` : ''}<button class="btn btn-o flex-1" onclick="toast('ส่งลิงก์ชำระเงินทาง WhatsApp แล้ว (จำลอง)')"><i data-lucide="link" class="w-3.5 h-3.5"></i>ส่งลิงก์ชำระ</button></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label><span class="lbl">สถานะ</span><select class="inp" onchange="setStatus('${b.id}',this.value)">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === b.status ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label>
        <label><span class="lbl">เซลล์ผู้ดูแล</span><select class="inp" onchange="BOOKINGS.find(x=>x.id==='${b.id}').sales=this.value;toast('มอบหมายเซลล์แล้ว')">${TEAM.map(t => `<option value="${t.id}" ${t.id === b.sales ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>
      </div>
      <label class="block"><span class="lbl">บันทึกภายใน</span><textarea class="inp" rows="3" placeholder="เช่น ลูกค้าขอเปลี่ยนเวลา…">${esc(b.note)}</textarea></label>
      <div><p class="lbl">ประวัติ</p><ol class="space-y-2 text-[12px]"><li class="flex gap-2"><span class="w-1.5 h-1.5 rounded-full bg-maroon mt-1.5"></span>${fmtD(b.created)} · สร้างจาก${b.channel}</li>${idx >= 1 ? `<li class="flex gap-2"><span class="w-1.5 h-1.5 rounded-full bg-maroon mt-1.5"></span>ส่งใบเสนอราคาโดย ${teamOf(b.sales).name}</li>` : ''}${idx >= 3 ? `<li class="flex gap-2"><span class="w-1.5 h-1.5 rounded-full bg-maroon mt-1.5"></span>รับมัดจำแล้ว · ยืนยันคิวเรือกับเจ้าของ</li>` : ''}</ol></div>
    </div>
    <div class="p-4 border-t border-line flex gap-2 shrink-0">
      <a class="btn btn-o flex-1" href="https://wa.me/" target="_blank"><i data-lucide="message-circle" class="w-3.5 h-3.5"></i>WhatsApp</a>
      <button class="btn btn-o flex-1" onclick="toast('สร้างใบยืนยัน PDF แล้ว (จำลอง)')"><i data-lucide="file-text" class="w-3.5 h-3.5"></i>ใบยืนยัน</button>
      ${b.status !== 'confirmed' && b.status !== 'done' && b.status !== 'cancel' ? `<button class="btn btn-p flex-1" onclick="setStatus('${b.id}','confirmed');bookingDetail('${b.id}')">ยืนยันการจอง</button>` : ''}
    </div>`);
}
function setStatus(id, s) { const b = BOOKINGS.find(x => x.id === id); b.status = s; if (s === 'confirmed' && !b.paid) b.paid = b.total / 2; toast(`เปลี่ยนสถานะเป็น "${STATUS[s][0]}" แล้ว`); rerender(); }
function recordPay(id) { const b = BOOKINGS.find(x => x.id === id); b.paid = b.paid ? b.total : b.total / 2; if (b.status === 'deposit' || b.status === 'quote' || b.status === 'new') b.status = 'confirmed'; toast('บันทึกรับเงินแล้ว'); bookingDetail(id); rerender(); }
function exportCsv() {
  const rows = [['id', 'customer', 'boat', 'program', 'date', 'guests', 'total', 'paid', 'status', 'sales', 'channel'], ...BOOKINGS.map(b => [b.id, custOf(b.cust).name, bySlug(b.boat).name, b.prog, b.date, b.guests, b.total, b.paid, b.status, b.sales, b.channel])];
  const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'btt-bookings.csv'; a.click(); toast('ดาวน์โหลด CSV แล้ว');
}
function newBooking(slug) {
  const boats = FLEET.filter(b => b.active);
  openModal(`<div class="p-5 border-b border-line flex items-center justify-between"><p class="font-medium">สร้างการจองใหม่</p><button class="btn btn-g !px-2" onclick="closeModal()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <form id="nbF" class="p-5 grid grid-cols-2 gap-3" onsubmit="event.preventDefault();saveNew()">
      <label class="col-span-2"><span class="lbl">เรือ</span><select id="nbBoat" class="inp" onchange="nbProgs()">${boats.map(b => `<option value="${b.slug}" ${b.slug === slug ? 'selected' : ''}>${b.name} · ${TYPE_TH[b.type]}</option>`).join('')}</select></label>
      <label class="col-span-2"><span class="lbl">โปรแกรม</span><select id="nbProg" class="inp" onchange="nbCalc()"></select></label>
      <label><span class="lbl">วันออกเรือ</span><input id="nbDate" type="date" class="inp" value="${iso(addDays(TODAY, 7))}" required/></label>
      <label><span class="lbl">จำนวนคน</span><input id="nbG" type="number" min="1" class="inp" value="8" oninput="nbCalc()"/></label>
      <label class="col-span-2"><span class="lbl">ลูกค้า</span><select id="nbCust" class="inp">${CUSTOMERS.map(c => `<option value="${c.id}">${esc(c.name)} · ${c.phone}</option>`).join('')}</select></label>
      <label><span class="lbl">ช่องทาง</span><select id="nbCh" class="inp">${CHANNELS.map(c => `<option>${c}</option>`).join('')}</select></label>
      <label><span class="lbl">เซลล์</span><select id="nbS" class="inp">${TEAM.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></label>
      <div class="col-span-2 p-3 rounded-xl bg-sand flex justify-between items-center"><span class="text-muted">ยอดรวม (คำนวณจากราคาโปรแกรม)</span><span id="nbTot" class="text-lg font-medium tnum"></span></div>
      <div class="col-span-2 flex justify-end gap-2 pt-1"><button type="button" class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p">บันทึกการจอง</button></div>
    </form>`);
  nbProgs();
}
function nbProgs() { const b = bySlug($('#nbBoat').value); $('#nbProg').innerHTML = progsOf(b).filter(p => p.price).map((p, i) => `<option value="${i}">${esc(p.label)} · ${baht(p.price)}</option>`).join(''); nbCalc(); }
function nbCalc() { const b = bySlug($('#nbBoat').value), p = progsOf(b).filter(p => p.price)[+$('#nbProg').value || 0]; const g = +$('#nbG').value || 1;
  const m = b.notes.join(' ').match(/extra charge of (?:net )?([\d,]+)\s*THB[^.]*?from the (\d+)/i); const extra = m && g >= +m[2] ? (g - +m[2] + 1) * +m[1].replace(/,/g, '') : 0;
  window._nbT = (p?.price || 0) + extra; $('#nbTot').textContent = baht(window._nbT) + (extra ? ` (รวมค่าคนเพิ่ม ${baht(extra)})` : ''); }
function saveNew() { const b = bySlug($('#nbBoat').value), p = progsOf(b).filter(p => p.price)[+$('#nbProg').value || 0];
  const id = `BTT-${iso(TODAY).slice(2).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
  BOOKINGS.unshift({ id, boat: b.slug, prog: p.label, date: $('#nbDate').value, guests: +$('#nbG').value, total: window._nbT, paid: 0, status: 'new', cust: $('#nbCust').value, sales: $('#nbS').value, channel: $('#nbCh').value, created: iso(TODAY), pickup: '', note: '' });
  closeModal(); toast('สร้างการจอง ' + id + ' แล้ว'); go('bookings'); }

/* =====================================================================
   CALENDAR
   ===================================================================== */
const CAL = { y: TODAY.getFullYear(), m: TODAY.getMonth(), boat: '' };
function vCalendar() {
  const first = new Date(CAL.y, CAL.m, 1), days = new Date(CAL.y, CAL.m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
  const list = BOOKINGS.filter(b => b.status !== 'cancel' && (!CAL.boat || b.boat === CAL.boat));
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<div class="cal-day bg-sand/40"></div>');
  for (let d = 1; d <= days; d++) {
    const ds = iso(new Date(CAL.y, CAL.m, d)), items = list.filter(b => b.date === ds), isT = ds === iso(TODAY);
    cells.push(`<div class="cal-day ${isT ? 'bg-maroon-50/60' : ''}"><p class="text-[11px] ${isT ? 'text-maroon font-medium' : 'text-muted'}">${d}</p>${items.slice(0, 3).map(b => `<button class="cal-chip ${STATUS[b.status][1]}" onclick="bookingDetail('${b.id}')">${bySlug(b.boat).name}</button>`).join('')}${items.length > 3 ? `<p class="text-[10px] text-muted mt-1">+${items.length - 3} รายการ</p>` : ''}</div>`);
  }
  const busy = FLEET.filter(b => list.some(x => x.boat === b.slug)).map(b => [b, list.filter(x => x.boat === b.slug && x.date.startsWith(`${CAL.y}-${String(CAL.m + 1).padStart(2, '0')}`)).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  $('#view').innerHTML = `
    ${head('ปฏิทินเรือ', 'ดูคิวเรือรายวัน กดรายการเพื่อเปิดการจอง', `<select class="inp !w-56" onchange="CAL.boat=this.value;vCalendar()"><option value="">เรือทุกลำ</option>${FLEET.map(b => `<option value="${b.slug}" ${CAL.boat === b.slug ? 'selected' : ''}>${b.name}</option>`).join('')}</select>`)}
    <div class="grid xl:grid-cols-[1fr_280px] gap-4">
      <div class="card overflow-hidden">
        <div class="px-4 h-14 flex items-center justify-between border-b border-line">
          <button class="btn btn-g !px-2" onclick="CAL.m--;if(CAL.m<0){CAL.m=11;CAL.y--};vCalendar()"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
          <p class="font-medium">${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][CAL.m]} ${CAL.y + 543}</p>
          <button class="btn btn-g !px-2" onclick="CAL.m++;if(CAL.m>11){CAL.m=0;CAL.y++};vCalendar()"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
        </div>
        <div class="grid grid-cols-7 text-[11px] text-muted border-b border-line">${['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map(d => `<div class="px-2 py-2">${d}</div>`).join('')}</div>
        <div class="grid grid-cols-7">${cells.join('')}</div>
      </div>
      <div class="space-y-4">
        <div class="card p-4"><p class="font-medium">สถานะ</p><div class="mt-3 flex flex-wrap gap-1.5">${Object.keys(STATUS).filter(k => k !== 'cancel').map(pill).join('')}</div></div>
        <div class="card p-4"><p class="font-medium">เรือที่มีคิวเดือนนี้</p><ul class="mt-3 space-y-2.5">${busy.map(([b, n]) => `<li class="flex items-center gap-2.5 cursor-pointer" onclick="CAL.boat='${b.slug}';vCalendar()">${thumb(b.slug, 'w-10 h-7')}<span class="flex-1 truncate">${b.name}</span><span class="text-muted tnum">${n} ทริป</span></li>`).join('') || '<li class="text-muted">ยังไม่มีคิว</li>'}</ul></div>
      </div>
    </div>`;
  icons();
}

/* =====================================================================
   BOATS · ACTIVITIES · CONTENT · CUSTOMERS · TEAM · SETTINGS · ROUTER
   ===================================================================== */
const BF = { q: '', type: '', view: 'table' };
function vBoats() {
  const q = BF.q.toLowerCase();
  const list = FLEET.filter(b => (!BF.type || b.type === BF.type) && (!q || (b.name + ' ' + b.marinaP + ' ' + b.subtitle).toLowerCase().includes(q)));
  $('#view').innerHTML = `
    ${head('จัดการเรือ', `${FLEET.length} ลำ · เปิดแสดง ${FLEET.filter(b => b.active).length} ลำ`, `<button class="btn btn-o" onclick="boatPdf()"><i data-lucide="file-up" class="w-3.5 h-3.5"></i>นำเข้า PDF</button><button class="btn btn-p" onclick="boatEdit()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มเรือ</button>`)}
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
      <label><span class="lbl">Meta title</span><input class="inp" value="${esc(t)}"/>${lenMeter(t, 't')}</label>
      <label><span class="lbl">Meta description</span><textarea class="inp" rows="3">${esc(d)}</textarea>${lenMeter(d, 'd')}</label>
      <div><p class="lbl">ตัวอย่างบน Google</p><div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] text-[#1e7a46]">boattripthailand.com › yacht-charter › ${slug}</p><p class="text-[17px] text-[#1a0dab] mt-1 leading-snug">${esc(t)}</p><p class="text-[13px] text-muted mt-1">${esc(d)}</p></div></div></div>`; }
  $('#view').innerHTML = `
    <div class="flex items-center gap-3 mb-5"><button class="btn btn-o !px-2" onclick="go('boats')" aria-label="back"><i data-lucide="arrow-left" class="w-4 h-4"></i></button>${thumb(slug, 'w-14 h-10')}<div class="min-w-0"><h2 class="text-xl font-medium truncate">${esc(b.name)}</h2><p class="text-muted">${TYPE_TH[b.type]} · ${b.marinaP || 'ยังไม่ระบุท่าเรือ'}</p></div>
      <div class="ml-auto flex items-center gap-3"><label class="flex items-center gap-2 text-muted"><span class="hidden sm:inline">แสดงบนเว็บ</span><span class="tgl"><input type="checkbox" ${b.active ? 'checked' : ''} onchange="bySlug('${slug}').active=this.checked"/><span></span></span></label>
      <a class="btn btn-o hidden sm:inline-flex" href="/yacht-charter/${encodeURIComponent(slug)}" target="_blank"><i data-lucide="eye" class="w-3.5 h-3.5"></i>ดูหน้าเรือ</a><button class="btn btn-p" onclick="toast('บันทึกข้อมูลเรือแล้ว · หน้าเว็บอัปเดตทันที (ISR)')"><i data-lucide="save" class="w-3.5 h-3.5"></i>บันทึก</button></div></div>
    <div class="tabbar flex gap-1 overflow-x-auto no-sb mb-4">${tabs.map(([k, l]) => `<button class="tab ${BE.tab === k ? 'on' : ''}" onclick="BE.tab='${k}';vBoatEdit('${slug}')">${l}</button>`).join('')}</div><div class="card"><div class="p-5 fade">${body}</div></div>`;
  icons();
}

/* ---------- Activities ---------- */
/* activities & tours come from the server (data/activities.json or what staff saved); edits autosave */
const ACTS = (BOOT.acts || []).map(a => ({ ...a, active: a.active !== false }));
const ACAT = { show: 'Show in Phuket', city: 'City Tour', activity: 'Activity', seatour: 'Sea Tour', tourth: 'ทัวร์ทะเล', water: 'กิจกรรมทางน้ำ', outdoor: 'กิจกรรมเอาท์ดอร์', stay: 'ที่พัก', spa: 'นวดสปา', animal: 'เกี่ยวกับสัตว์', lounge: 'Lounge', food: 'ร้านอาหาร' };
ACTS.forEach(a => a.active = true);
/* the 5 shows from “Show in Phuket.pdf” are already in ACTS (from the website data) */
const AF = { cat: '' };
function vActivities() {
  const list = ACTS.filter(a => !AF.cat || a.cat === AF.cat);
  $('#view').innerHTML = `
    ${head('กิจกรรม & ทัวร์', `${ACTS.length} รายการ · ${ACTS.filter(a => !a.price).length} รายการยังไม่มีราคา (หน้าเว็บแสดง “สอบถามราคา”)`, `<button class="btn btn-p" onclick="actNew()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มกิจกรรม</button>`)}
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
  if (CONTENT.tab === 'seo') body = `<div class="grid gap-4 max-w-2xl"><label><span class="lbl">Title หน้าแรก (TH)</span><input class="inp" value="Yacht Charter ภูเก็ต – เช่าเรือยอชต์ 70 ลำ | Boat Trip Thailand"/>${lenMeter('Yacht Charter ภูเก็ต – เช่าเรือยอชต์ 70 ลำ | Boat Trip Thailand', 't')}</label><label><span class="lbl">Title หน้าแรก (EN)</span><input class="inp" value="Yacht Charter Phuket – 70 Private Boats | Boat Trip Thailand"/>${lenMeter('Yacht Charter Phuket – 70 Private Boats | Boat Trip Thailand', 't')}</label><label><span class="lbl">Meta description (TH)</span><textarea class="inp" rows="3">Yacht Charter ภูเก็ต เช่าเรือยอชต์ส่วนตัว คาตามารัน สปีดโบ๊ท 70 ลำ ไปพีพี อ่าวพังงา เกาะราชา…</textarea>${lenMeter('Yacht Charter ภูเก็ต เช่าเรือยอชต์ส่วนตัว คาตามารัน สปีดโบ๊ท 70 ลำ ไปพีพี อ่าวพังงา เกาะราชา…', 'd')}</label><label><span class="lbl">รูป OG (แชร์ลงโซเชียล)</span><div class="flex gap-3 items-center"><img src="${THUMBS['leopard-90-ft']}" class="w-40 aspect-[1200/630] object-cover rounded-lg"/><button class="btn btn-o">เปลี่ยนรูป</button></div></label></div>`;
  $('#view').innerHTML = `${head('เนื้อหาเว็บไซต์', 'แก้ไขข้อความ รูป และ SEO โดยไม่ต้องแก้โค้ด', `<button class="btn btn-o" onclick="window.open('/','_blank')"><i data-lucide="eye" class="w-3.5 h-3.5"></i>Preview</button><button class="btn btn-p" onclick="toast('เผยแพร่การเปลี่ยนแปลงแล้ว')"><i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>เผยแพร่</button>`)}
    <div class="tabbar flex gap-1 overflow-x-auto no-sb mb-4">${tabs.map(([k, l]) => `<button class="tab ${CONTENT.tab === k ? 'on' : ''}" onclick="CONTENT.tab='${k}';vContent()">${l}</button>`).join('')}</div><div class="card"><div class="p-5 fade">${body}</div></div>`;
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
    <div class="grid md:grid-cols-3 gap-4">${TEAM.map((t, i) => { const s = st(t); return `<div class="card p-5"><div class="flex items-center gap-3"><img src="${teamImg(t.id)}" class="w-12 h-12 rounded-full object-cover"/><div class="flex-1"><p class="font-medium">${t.name}</p><p class="text-[11px] text-muted">${t.role} · ${t.tel}</p></div><label class="flex items-center gap-2 text-[11px] text-muted">${t.online ? 'ออนไลน์' : 'ออฟไลน์'}<span class="tgl"><input type="checkbox" ${t.online ? 'checked' : ''} onchange="TEAM[${i}].online=this.checked;vTeam()"/><span></span></span></label></div>
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
  $('#nav').innerHTML = PAGES.map(x => x[0] === '—' ? `<p class="px-3 pt-5 pb-1.5 text-[11px] font-medium tracking-[.02em] text-muted">${x[1]}</p>` : `<a href="#/${x[0]}" class="nav-i ${x[0] === CUR ? 'on' : ''}"><i data-lucide="${x[2]}" class="w-[18px] h-[18px]"></i>${x[1]}${x[0] === 'bookings' && newCnt ? `<span class="cnt">${newCnt}</span>` : ''}</a>`).join('');
  $('#pageTitle').textContent = pg[1]; $('#crumb').textContent = 'Boat Trip Thailand · ระบบหลังบ้าน';
  if (CUR === 'boats' && arg) { $('#pageTitle').textContent = 'แก้ไขเรือ'; vBoatEdit(arg); } else pg[3]();
  toggleSide(false); icons();
}
window.addEventListener('hashchange', () => { closeDrawer(); route(); scrollTo(0, 0); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeModal(); } });
$('#gq').addEventListener('keydown', e => { if (e.key === 'Enter') { BK.q = e.target.value; BK.tab = 'all'; go('bookings'); if (CUR === 'bookings') vBookings(); } });
$('#meAva').src = TEAM_IMG[BOOT.me.id] || '';

/* =====================================================================
   BILINGUAL CONTENT (TH / EN) – every customer-facing field is { th, en }
   ===================================================================== */
const LANGS = [['th', 'TH', 'ไทย'], ['en', 'EN', 'English']];
let REG = [];
const tr = (th = '', en = '') => ({ th, en });
const filled = o => !!(o && String(o.th || '').trim() && String(o.en || '').trim());
/* two inputs side by side; edits write straight into the {th,en} object */
function bi(label, o, { rows = 0, ph = '', hint = '', len = '' } = {}) {
  const i = REG.push(o) - 1;
  const one = ([k, code]) => { const v = o[k] || '', miss = !String(v).trim();
    const inp = rows ? `<textarea rows="${rows}" class="inp ${miss ? 'bi-miss' : ''}" placeholder="${miss ? (k === 'en' ? 'Not translated yet' : 'ยังไม่ได้แปล') : ''}" oninput="biSet(${i},'${k}',this)">${esc(v)}</textarea>`
      : `<input class="inp ${miss ? 'bi-miss' : ''}" value="${esc(v)}" placeholder="${miss ? (k === 'en' ? 'Not translated yet' : 'ยังไม่ได้แปล') : ph}" oninput="biSet(${i},'${k}',this)"/>`;
    return `<div class="relative"><span class="bi-tag">${code}</span>${inp}${len ? lenMeter(v, len) : ''}</div>`; };
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
  const saved = b.i18n;   // translations already stored on the server win over the generated drafts below
  b.i18n = {
    name: tr(b.name, b.name), subtitle: tr('', b.subtitle),
    desc: tr(`${b.name} ${TYPE_TH[b.type]}ส่วนตัว รับได้สูงสุด ${b.pax || '-'} คน ออกจาก ${b.marinaP} รวมกัปตัน ลูกเรือ และประกันภัย`, `${b.name} is a private ${ { yacht: 'motor yacht', sail: 'sailing catamaran', power: 'power catamaran', speed: 'speedboat', longtail: 'long-tail boat' }[b.type] } for up to ${b.pax || '-'} guests, departing from ${b.marinaP}. Captain, crew and insurance included.`),
    programs: b.tables.map(t => t.rows.map(r => tr(autoTh(r[0]), r[0]))),
    includes: b.includes.map(x => tr(autoTh(x), x)), complimentary: b.complimentary.map(x => tr(autoTh(x), x)), not_included: b.not_included.map(x => tr(autoTh(x), x)),
    slots: b.time_slots.map(([k]) => tr(autoTh(k), k)), notes: tr('', b.notes.join('\n')),
    seoTitle: tr(`${b.name} เช่าเรือภูเก็ต – เริ่ม ${baht(b.from_)} | BTT`, `${b.name} Yacht Charter Phuket – from $${Math.round((b.from_ || 0) / 33.42).toLocaleString()} | BTT`),
    seoDesc: tr(`${b.name} ${TYPE_TH[b.type]} รับได้ ${b.pax || '-'} คน ออกจาก ${b.marinaP} ราคาเริ่มต้น ${baht(b.from_)} รวมกัปตันและประกัน`, `${b.name} for up to ${b.pax || '-'} guests from ${b.marinaP}. From $${Math.round((b.from_ || 0) / 33.42).toLocaleString()} incl. crew & insurance.`),
  };
  if (saved) { Object.assign(b.i18n, saved); return; }
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
      ${bi('Meta title', i.seoTitle, { len: 't' })}${bi('Meta description', i.seoDesc, { rows: 3, len: 'd' })}
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
    <div class="flex-1 grid grid-cols-2 gap-4">${[['ไทย', th], ['English', en]].map(([l, p]) => `<div><div class="flex justify-between text-[12px]"><span>${l}</span><span class="tnum ${p === 100 ? 'text-[#1e7a46]' : 'text-muted'}">${p === 100 ? 'ครบ' : p + '%'}</span></div><div class="mt-1 h-1.5 rounded-full bg-sand overflow-hidden"><div class="h-full rounded-full ${p === 100 ? 'bg-[#1e7a46]' : 'bg-maroon'}" style="width:${p}%"></div></div></div>`).join('')}</div></div>`);
}
function autoTranslate(slug) {
  const b = bySlug(slug); let n = 0;
  boatI18nFields(b).forEach(o => { if (!o) return; if (!o.th && o.en) { o.th = autoTh(o.en) || '[แปล] ' + o.en; n++; } if (!o.en && o.th) { o.en = '[EN] ' + o.th; n++; } });
  toast(`แปลอัตโนมัติ ${n} ช่อง · กรุณาตรวจทานก่อนเผยแพร่`); $('#langBar')?.remove(); vBoatEdit(slug);
}

/* ---------- Activities: bilingual edit ---------- */
ACTS.forEach(a => { a.i18n = { name: tr(a.th, a.en), loc: tr(a.locTh || a.loc, a.loc), dur: tr(a.durTh || a.dur, a.dur), desc: tr(a.desc?.th || '', a.desc?.en || '') }; });
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
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div class="min-w-0"><p class="text-[11px] text-muted">${ACAT[a.cat]}</p><p class="font-medium truncate">${esc(a.i18n.name.th || a.i18n.name.en)}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 grid gap-4 content-start">
      <div class="grid grid-cols-2 gap-3"><label><span class="lbl">หมวด</span><select class="inp" onchange="ACTS[${i}].cat=this.value">${Object.entries(ACAT).map(([k, l]) => `<option value="${k}" ${a.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="flex items-end gap-2 pb-2 text-[13px]"><span class="tgl"><input type="checkbox" ${a.active ? 'checked' : ''} onchange="ACTS[${i}].active=this.checked"/><span></span></span>แสดงบนเว็บ</label></div>
      ${bi('ชื่อกิจกรรม', a.i18n.name)}${bi('สถานที่', a.i18n.loc)}${bi('ระยะเวลา', a.i18n.dur, { ph: 'เช่น 3 ชม. / Evening' })}${bi('รายละเอียด', a.i18n.desc, { rows: 4, hint: 'ไม่มีรายละเอียด = การ์ดกดแล้วเปิดฟอร์มจองเลย' })}
      <label><span class="lbl">ราคาเริ่มต้น (บาท · เว้นว่าง = หน้าเว็บแสดง "สอบถามราคา")</span><input class="inp tnum" value="${a.price ? a.price.toLocaleString('en-US') : ''}" onchange="ACTS[${i}].price=+this.value.replace(/[^\\d]/g,'')||null"/></label></div>
    <div class="p-4 border-t border-line flex gap-2"><button class="btn btn-g text-[#a3222c]" onclick="actDel(${i})"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i>ลบกิจกรรม</button><span class="flex-1"></span><button class="btn btn-p" onclick="closeDrawer();vActivities()">เสร็จ</button></div>`);
}
function actDel(i) { const a = ACTS[i]; if (!confirm(`ลบ “${a.i18n.name.th || a.i18n.name.en}” ออกจากเว็บไซต์?`)) return; ACTS.splice(i, 1); closeDrawer(); vActivities(); toast('ลบกิจกรรมแล้ว'); }
function actNew() {
  const a = { cat: AF.cat || 'activity', pic: 'act-' + Date.now().toString(36), th: 'กิจกรรมใหม่', en: 'New activity', loc: '', dur: '', price: null, active: false, imgs: [] };
  a.i18n = { name: tr(a.th, a.en), loc: tr(), dur: tr(), desc: tr() };
  ACTS.unshift(a); vActivities(); actEdit(0); toast('เพิ่มกิจกรรมแล้ว · ยังไม่แสดงบนเว็บจนกว่าจะเปิด');
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
const webFields = () => [...Object.values(WEB.hero).flat(), ...Object.values(WEB.promo).filter(o => o && typeof o === 'object'), ...WEB.faq.flat(), WEB.seo.title, WEB.seo.desc];
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
  if (WEB.tab === 'seo') body = `<div class="grid gap-4 max-w-4xl">${bi('Meta title หน้าแรก', WEB.seo.title, { len: 't' })}${bi('Meta description', WEB.seo.desc, { rows: 3, len: 'd' })}<label><span class="lbl">รูป OG (แชร์ลงโซเชียล) · ใช้ร่วมกันทั้ง 2 ภาษา</span><div class="flex gap-3 items-center"><img src="${THUMBS['leopard-90-ft']}" class="w-40 aspect-[1200/630] object-cover rounded-lg"/><button class="btn btn-o">เปลี่ยนรูป</button></div></label></div>`;
  const f = webFields();
  $('#view').innerHTML = `${head('เนื้อหาเว็บไซต์', 'ทุกข้อความมีช่องภาษาไทยและอังกฤษคู่กัน · ช่องที่ยังไม่แปลมีกรอบสีแดง', `<div class="flex items-center gap-1 mr-1">${langBadge(f)}</div><button class="btn btn-o" onclick="window.open('/','_blank')"><i data-lucide="eye" class="w-3.5 h-3.5"></i>Preview</button><button class="btn btn-p" onclick="${langPct(f, 'en') < 100 || langPct(f, 'th') < 100 ? "toast('ยังมีช่องที่ไม่ได้แปล · ภาษานั้นจะแสดงข้อความภาษาไทยแทน')" : "toast('เผยแพร่แล้ว')"}"><i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>เผยแพร่</button>`)}
    <div class="tabbar flex gap-1 overflow-x-auto no-sb mb-4">${tabs.map(([k, l]) => `<button class="tab ${WEB.tab === k ? 'on' : ''}" onclick="WEB.tab='${k}';vContent()">${l}</button>`).join('')}</div><div class="card"><div class="p-5 fade">${body}</div></div>`;
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

/* =====================================================================
   ARTICLES / BLOG – bilingual (TH / EN) with translation review workflow
   ===================================================================== */
const ACAT_A = { guide: 'คู่มือเช่าเรือ', route: 'เส้นทาง & เกาะ', boat: 'ประเภทเรือ', event: 'งานอีเวนต์บนเรือ', news: 'ข่าว & โปรโมชัน' };
const ART_ST = { draft: ['ร่าง', 'st-done'], review: ['รอตรวจ', 'st-quote'], scheduled: ['ตั้งเวลา', 'st-new'], published: ['เผยแพร่แล้ว', 'st-confirmed'] };
/* translation state of a language: orig = written by staff, ok = translated & reviewed, mt = machine translation waiting review, none = empty */
const TRS = { orig: ['ต้นฉบับ', 'ok'], ok: ['แปลแล้ว', 'ok'], mt: ['รอตรวจ', 'mid'], none: ['ยังไม่มี', 'low'] };
const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9ก-๙\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 70);
const L1 = (th, en) => ({ th, en });

const ART = [
  { id: 1, cat: 'guide', status: 'published', date: iso(addDays(TODAY, -21)), author: 'kwang', cover: 'leopard-90-ft', boats: ['leopard-90-ft', 'vtech-68-ft', 'splo-74-ft'], views: 1840, tags: ['yacht charter', 'phuket'],
    tr: { th: 'orig', en: 'ok' },
    title: L1('เช่าเรือยอชต์ภูเก็ต ต้องรู้อะไรบ้างก่อนจอง', 'Phuket Yacht Charter: What to Know Before You Book'),
    slug: L1('เช่าเรือยอชต์ภูเก็ต-ก่อนจอง', 'phuket-yacht-charter-guide'),
    excerpt: L1('เลือกขนาดเรือ เส้นทาง และช่วงเวลาให้เหมาะกับกลุ่มของคุณ พร้อมสิ่งที่รวมและไม่รวมในราคา', 'How to pick the right boat size, route and season for your group, plus what is and isn\'t included in the price.'),
    body: L1('<p>การเช่าเรือยอชต์ส่วนตัวในภูเก็ตเริ่มจากคำถามง่ายๆ 3 ข้อ: ไปกี่คน อยากไปที่ไหน และอยากใช้เวลาบนเรือนานแค่ไหน</p><h2>1. เลือกขนาดเรือตามจำนวนคน</h2><p>เรือแต่ละลำมีจำนวนผู้โดยสารสูงสุดตามใบอนุญาต ถ้ามากับครอบครัวเล็กๆ เรือคาตามารันขนาดกลางก็เพียงพอ ถ้าเป็นงานบริษัทควรดูเรือที่มีดาดฟ้ากว้าง</p><h2>2. เลือกเส้นทาง</h2><p>เส้นทางยอดนิยมคือ เกาะพีพี อ่าวพังงา และเกาะราชา ระยะทางจะกำหนดว่าควรจองแบบครึ่งวันหรือเต็มวัน</p><h2>3. ดูสิ่งที่รวมในราคา</h2><ul><li>กัปตันและลูกเรือ</li><li>น้ำมันตามเส้นทางที่กำหนด</li><li>อุปกรณ์ดำน้ำตื้น</li></ul><p>ค่าอุทยานแห่งชาติและค่าเครื่องดื่มบางรายการอาจไม่รวม ควรถามเซลล์ก่อนยืนยันการจอง</p>',
      '<p>Chartering a private yacht in Phuket starts with three simple questions: how many guests, where you want to go, and how long you want to spend on board.</p><h2>1. Match the boat to your group</h2><p>Every boat has a licensed maximum number of guests. A mid-size catamaran is plenty for a small family, while a company outing is better on a boat with a wide deck.</p><h2>2. Choose a route</h2><p>The most popular routes are Phi Phi, Phang Nga Bay and Racha Island. Distance decides whether a half-day or full-day charter makes sense.</p><h2>3. Check what is included</h2><ul><li>Captain and crew</li><li>Fuel for the agreed route</li><li>Snorkeling gear</li></ul><p>National park fees and some drinks may not be included, so check with our sales team before you confirm.</p>'),
    seoT: L1('เช่าเรือยอชต์ภูเก็ต ต้องรู้อะไรก่อนจอง | Boat Trip Thailand', 'Phuket Yacht Charter Guide: Before You Book | Boat Trip Thailand'),
    seoD: L1('คู่มือเช่าเรือยอชต์ภูเก็ต เลือกขนาดเรือ เส้นทาง และดูสิ่งที่รวมในราคาก่อนจอง', 'A practical guide to chartering a yacht in Phuket: boat size, routes and what the price includes.'), kw: L1('เช่าเรือยอชต์ภูเก็ต', 'phuket yacht charter') },
  { id: 2, cat: 'route', status: 'published', date: iso(addDays(TODAY, -12)), author: 'save', cover: 'splo-74-ft', boats: ['splo-74-ft', 'cognac-75-ft'], views: 960, tags: ['phi phi', 'racha'],
    tr: { th: 'orig', en: 'mt' },
    title: L1('เกาะใกล้ภูเก็ตที่ไปกับเรือส่วนตัวได้ใน 1 วัน', '[Machine] Islands near Phuket you can visit by private boat in 1 day'),
    slug: L1('เกาะใกล้ภูเก็ต-1-วัน', 'islands-near-phuket-day-trip'),
    excerpt: L1('รวมเกาะที่ออกเช้ากลับเย็นได้สบาย พร้อมเวลาเดินทางโดยประมาณ', '[Machine] A collection of islands that can comfortably go in the morning and return in the evening, with approximate travel times.'),
    body: L1('<p>ถ้ามีเวลาแค่ 1 วัน เรือส่วนตัวช่วยให้แวะได้หลายจุดโดยไม่ต้องรอใคร</p><h2>เกาะพีพี</h2><p>อ่าวมาหยา อ่าวปิเละ และจุดดำน้ำตื้นรอบเกาะ</p><h2>เกาะราชา</h2><p>น้ำใส หาดทรายขาว เหมาะกับครอบครัว</p><h2>เกาะไข่</h2><p>ใกล้ที่สุด เหมาะกับทริปครึ่งวัน</p>',
      '<p>[Machine translation – please review] If you only have 1 day, a private boat helps you stop at many points without waiting for anyone.</p><h2>Phi Phi Island</h2><p>Maya Bay, Pileh Bay and snorkeling points around the island.</p><h2>Racha Island</h2><p>Clear water, white sand beach, suitable for families.</p><h2>Khai Island</h2><p>The closest, suitable for half-day trips.</p>'),
    seoT: L1('เกาะใกล้ภูเก็ต ไปกับเรือส่วนตัว 1 วัน | Boat Trip Thailand', ''), seoD: L1('รวมเกาะใกล้ภูเก็ตที่ไปกลับได้ใน 1 วันด้วยเรือส่วนตัว พีพี ราชา เกาะไข่', ''), kw: L1('เกาะใกล้ภูเก็ต', 'islands near phuket') },
  { id: 3, cat: 'route', status: 'scheduled', date: iso(addDays(TODAY, 4)), author: 'kwang', cover: 'the-origin-90-ft', boats: ['the-origin-90-ft'], views: 0, tags: ['phi phi', 'phang nga'],
    tr: { th: 'orig', en: 'none' },
    title: L1('พีพี หรือ อ่าวพังงา เลือกเส้นทางไหนดี', ''), slug: L1('พีพี-หรือ-อ่าวพังงา', ''),
    excerpt: L1('เปรียบเทียบ 2 เส้นทางยอดนิยม ทั้งวิว ระยะเวลา และกิจกรรมที่ทำได้', ''),
    body: L1('<p>ทั้งสองเส้นทางสวยคนละแบบ พีพีเด่นเรื่องน้ำทะเลและการดำน้ำ ส่วนอ่าวพังงาเด่นเรื่องเขาหินปูนและพายเรือคายัค</p><h2>เหมาะกับใคร</h2><p>…</p>', ''),
    seoT: L1('พีพี หรือ อ่าวพังงา เลือกเส้นทางเรือไหนดี', ''), seoD: L1('', ''), kw: L1('ทริปเกาะพีพี', '') },
  { id: 4, cat: 'boat', status: 'draft', date: iso(TODAY), author: 'prang', cover: 'siam-princess-70-ft', boats: [], views: 0, tags: ['catamaran'],
    tr: { th: 'orig', en: 'none' },
    title: L1('คาตามารัน สปีดโบ๊ท หรือเรือยอชต์ ต่างกันอย่างไร', ''), slug: L1('คาตามารัน-สปีดโบ๊ท-เรือยอชต์', ''),
    excerpt: L1('', ''), body: L1('<h2>คาตามารัน</h2><p>…</p><h2>สปีดโบ๊ท</h2><p>…</p>', ''), seoT: L1('', ''), seoD: L1('', ''), kw: L1('', '') },
  { id: 5, cat: 'event', status: 'review', date: iso(addDays(TODAY, -2)), author: 'save', cover: 'cognac-75-ft', boats: ['cognac-75-ft', 'leopard-90-ft'], views: 0, tags: ['party', 'wedding'],
    tr: { th: 'orig', en: 'none' },
    title: L1('เช็กลิสต์จัดปาร์ตี้บนเรือยอชต์ภูเก็ต', ''), slug: L1('ปาร์ตี้บนเรือยอชต์ภูเก็ต', ''),
    excerpt: L1('วันเกิด ขอแต่งงาน หรืองานบริษัท เตรียมอะไรบ้างให้ครบ', ''),
    body: L1('<p>ก่อนจองเรือสำหรับงานเลี้ยง ควรสรุปจำนวนแขก งบประมาณ และธีมงานให้ชัด</p><ul><li>อาหารและเครื่องดื่ม</li><li>เครื่องเสียง</li><li>ตกแต่งเรือ</li></ul>', ''),
    seoT: L1('จัดปาร์ตี้บนเรือยอชต์ภูเก็ต เช็กลิสต์ครบ', ''), seoD: L1('', ''), kw: L1('ปาร์ตี้บนเรือ ภูเก็ต', '') },
  { id: 6, cat: 'guide', status: 'published', date: iso(addDays(TODAY, -40)), author: 'kwang', cover: 'vtech-68-ft', boats: ['vtech-68-ft'], views: 2310, tags: ['season', 'weather'],
    tr: { th: 'none', en: 'orig' },
    title: L1('', 'Best Time for a Boat Trip in Phuket: Andaman Seasons Explained'), slug: L1('', 'best-time-boat-trip-phuket'),
    excerpt: L1('', 'High season, green season and what each means for your day at sea.'),
    body: L1('', '<p>The Andaman coast has two main seasons. High season usually brings calmer seas, while green season can still have great days between showers.</p><h2>High season</h2><p>…</p><h2>Green season</h2><p>…</p>'),
    seoT: L1('', 'Best Time for a Boat Trip in Phuket | Boat Trip Thailand'), seoD: L1('', 'When to book a boat trip in Phuket: Andaman high season vs green season explained.'), kw: L1('', 'best time phuket boat trip') },
];
const AFL = { tab: 'all', cat: '', q: '', noEn: false };
const AE = { lang: 'th' };
const artById = id => ART.find(a => a.id === +id);
const trBadge = a => LANGS.map(([k, c]) => { const [l, cls] = TRS[a.tr[k]]; return `<span class="lang-b ${cls}" title="${c} · ${l}">${c} · ${l}</span>`; }).join('');
const readMin = (a, k) => { const t = (a.body[k] || '').replace(/<[^>]+>/g, ' '); return k === 'th' ? Math.max(1, Math.round(t.replace(/\s/g, '').length / 500)) : Math.max(1, Math.round(t.split(/\s+/).filter(Boolean).length / 220)); };

function vArticles() {
  const arg = location.hash.split('/')[2];
  if (arg) return vArticleEdit(arg);
  const cnt = k => ART.filter(a => k === 'all' || a.status === k).length;
  let rows = ART.filter(a => (AFL.tab === 'all' || a.status === AFL.tab) && (!AFL.cat || a.cat === AFL.cat) && (!AFL.noEn || a.tr.en === 'none' || a.tr.en === 'mt' || a.tr.th === 'none' || a.tr.th === 'mt')
    && (!AFL.q || (a.title.th + ' ' + a.title.en + ' ' + a.tags.join(' ')).toLowerCase().includes(AFL.q.toLowerCase()))).sort((x, y) => y.date.localeCompare(x.date));
  const pend = ART.filter(a => a.tr.en !== 'orig' && a.tr.en !== 'ok' || a.tr.th !== 'orig' && a.tr.th !== 'ok').length;
  const stat = (l, v, s) => `<div class="card p-4"><p class="text-[12px] text-muted">${l}</p><p class="text-[22px] font-medium mt-1 tnum">${v}</p>${s ? `<p class="text-[11px] text-muted mt-0.5">${s}</p>` : ''}</div>`;
  $('#view').innerHTML = `${head('บทความ', 'เขียนบทความ ไทย / อังกฤษ แยกกันได้ · ใช้ทำ SEO และลิงก์ไปหน้าเรือ · บทความในหน้านี้เป็นตัวอย่าง', `<button class="btn btn-p" onclick="newArticle()"><i data-lucide="pen-line" class="w-3.5 h-3.5"></i>เขียนบทความใหม่</button>`)}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">${stat('บทความทั้งหมด', ART.length)}${stat('เผยแพร่แล้ว', cnt('published'))}${stat('ยอดอ่าน 30 วัน', ART.reduce((s, a) => s + a.views, 0).toLocaleString(), 'ตัวเลขตัวอย่าง')}${stat('รอแปล / รอตรวจคำแปล', pend)}</div>
    <div class="card">
      <div class="p-3 flex flex-col lg:flex-row lg:items-center gap-2 border-b border-line">
        <div class="flex gap-1 overflow-x-auto no-sb">${[['all', 'ทั้งหมด'], ['published', 'เผยแพร่แล้ว'], ['scheduled', 'ตั้งเวลา'], ['review', 'รอตรวจ'], ['draft', 'ร่าง']].map(([k, l]) => `<button class="tab ${AFL.tab === k ? 'on' : ''}" onclick="AFL.tab='${k}';vArticles()">${l} <span class="opacity-60 tnum">${cnt(k)}</span></button>`).join('')}</div>
        <div class="lg:ml-auto grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-center">
          <input class="inp" placeholder="ค้นหาชื่อบทความ แท็ก…" value="${esc(AFL.q)}" onkeydown="if(event.key==='Enter'){AFL.q=this.value;vArticles()}"/>
          <select class="inp" onchange="AFL.cat=this.value;vArticles()"><option value="">ทุกหมวด</option>${Object.entries(ACAT_A).map(([k, l]) => `<option value="${k}" ${AFL.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <label class="flex items-center gap-2 text-[12px] text-muted whitespace-nowrap"><span class="tgl"><input type="checkbox" ${AFL.noEn ? 'checked' : ''} onchange="AFL.noEn=this.checked;vArticles()"/><span></span></span>ยังแปลไม่ครบ</label>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="tbl min-w-[860px]"><thead><tr><th>บทความ</th><th>หมวด</th><th>ภาษา</th><th>สถานะ</th><th>ผู้เขียน</th><th>วันที่</th><th class="text-right">ยอดอ่าน</th></tr></thead><tbody>
      ${rows.map(a => { const t = a.title.th || a.title.en, au = TEAM.find(x => x.id === a.author) || { name: a.wpAuthor || 'ทีม Boat Trip Thailand' };
        return `<tr class="click" onclick="go('articles/${a.id}')"><td><div class="flex items-center gap-3 min-w-[280px]"><img src="${THUMBS[a.cover]}" class="w-16 h-11 rounded-lg object-cover shrink-0"/><div class="min-w-0"><p class="truncate max-w-[340px]">${esc(t)}</p><p class="text-[11px] text-muted truncate max-w-[340px]">${a.title.th && a.title.en ? esc(a.title.en) : (a.title.th ? 'ยังไม่มีชื่อภาษาอังกฤษ' : 'ยังไม่มีชื่อภาษาไทย')}</p></div></div></td>
          <td class="text-muted whitespace-nowrap">${ACAT_A[a.cat]}</td><td><div class="flex gap-1">${trBadge(a)}</div></td><td><span class="pill ${ART_ST[a.status][1]}">${ART_ST[a.status][0]}</span></td>
          <td><div class="flex items-center gap-2"><img src="${TEAM_IMG[a.author] || initialsAva(au.name)}" class="w-6 h-6 rounded-full object-cover"/>${au.name}</div></td><td class="text-muted whitespace-nowrap">${fmtD(a.date)}</td><td class="text-right tnum">${a.views ? a.views.toLocaleString() : '—'}</td></tr>`; }).join('') || `<tr><td colspan="7" class="text-center text-muted py-10">ไม่พบบทความ</td></tr>`}
      </tbody></table></div>
    </div>`;
  icons();
}

function newArticle() {
  const id = Math.max(...ART.map(a => a.id)) + 1;
  ART.push({ id, cat: 'guide', status: 'draft', date: iso(TODAY), author: 'kwang', cover: FLEET[0].slug, boats: [], views: 0, tags: [], tr: { th: 'none', en: 'none' },
    title: L1('', ''), slug: L1('', ''), excerpt: L1('', ''), body: L1('', ''), seoT: L1('', ''), seoD: L1('', ''), kw: L1('', '') });
  AE.lang = 'th'; go('articles/' + id);
}

/* refresh translation state after editing a language */
function artTouch(a, k) {
  const has = !!(a.title[k].trim() && a.body[k].replace(/<[^>]+>/g, '').trim());
  if (!has) a.tr[k] = 'none'; else if (a.tr[k] === 'none') a.tr[k] = (['orig', 'ok'].includes(a.tr[k === 'th' ? 'en' : 'th']) ? 'ok' : 'orig');
  const o = $('#artTr'); if (o) o.innerHTML = trBadge(a);
}
function artSet(id, f, k, el) { const a = artById(id); a[f][k] = el.value; if (f === 'title' && !a.slugLock?.[k]) { a.slug[k] = slugify(el.value); const s = $('#artSlug'); if (s) s.value = a.slug[k]; } artTouch(a, k); artSeoPrev(a); if (f === 'excerpt') artCount(); }
function artCount() { $$('.cnt-t').forEach(el => { const inp = document.getElementById(el.dataset.for), max = +el.dataset.max, n = inp.value.length; el.textContent = `${n}/${max}`; el.className = 'cnt-t text-[10px] tnum ' + (n > max ? 'text-[#a3222c]' : 'text-muted'); }); }
function artSeoPrev(a) {
  const k = AE.lang, el = $('#artPrev'); if (!el) return;
  const t = a.seoT[k] || a.title[k] || (k === 'th' ? 'ชื่อบทความ' : 'Article title'), d = a.seoD[k] || a.excerpt[k] || '';
  el.innerHTML = `<p class="text-[11px] text-[#4d5156] truncate">boattripthailand.com${k === 'en' ? '/en' : ''}/blog/${esc(a.slug[k] || '…')}</p><p class="text-[15px] text-[#1a0dab] leading-snug mt-0.5 line-clamp-1">${esc(t)}</p><p class="text-[12px] text-[#4d5156] mt-0.5 line-clamp-2">${esc(d)}</p>`;
}
function artCmd(c, v) { document.execCommand(c, false, v); $('#artBody').focus(); artBodySync(); }
function artBodySync() { const a = artById(AE.id); a.body[AE.lang] = $('#artBody').innerHTML; artTouch(a, AE.lang); const w = $('#artWords'); if (w) w.textContent = `อ่านประมาณ ${readMin(a, AE.lang)} นาที`; }
function artEmbed(slug) {
  if (!slug) return; const b = bySlug(slug); $('#artBody').focus();
  document.execCommand('insertHTML', false, `<div class="boat-embed" contenteditable="false" data-boat="${slug}"><img src="${THUMBS[slug]}"/><div><b>${esc(b.name)}</b><span>${b.pax ? b.pax + ' ' + (AE.lang === 'th' ? 'คน' : 'guests') + ' · ' : ''}${AE.lang === 'th' ? 'ดูรายละเอียดเรือ' : 'View boat'} →</span></div></div><p><br></p>`);
  artBodySync(); toast('แทรกการ์ดเรือแล้ว');
}
function artImg() { const s = pick(FLEET).slug; $('#artBody').focus(); document.execCommand('insertHTML', false, `<figure><img src="${THUMBS[s]}"/><figcaption>${AE.lang === 'th' ? 'คำบรรยายรูป' : 'Caption'}</figcaption></figure><p><br></p>`); artBodySync(); }

function artTranslate(id) {
  const a = artById(id), from = a.tr.th === 'orig' || a.tr.th === 'ok' ? 'th' : 'en', to = from === 'th' ? 'en' : 'th';
  if (!a.title[from]) return toast('ยังไม่มีต้นฉบับให้แปล');
  const tag = to === 'en' ? '[Machine] ' : '[แปลจากเครื่อง] ';
  ['title', 'excerpt', 'seoT', 'seoD', 'kw'].forEach(f => { if (!a[f][to] && a[f][from]) a[f][to] = (f === 'kw' ? '' : tag) + a[f][from]; });
  if (!a.body[to].replace(/<[^>]+>/g, '').trim()) a.body[to] = `<p><i>${to === 'en' ? 'Machine translation – please review before publishing.' : 'คำแปลจากเครื่อง – กรุณาตรวจทานก่อนเผยแพร่'}</i></p>` + a.body[from];
  if (!a.slug[to]) a.slug[to] = to === 'en' ? 'article-' + a.id : slugify(a.title[to]);
  a.tr[to] = 'mt'; AE.lang = to; toast(`แปลเป็น${to === 'en' ? 'ภาษาอังกฤษ' : 'ภาษาไทย'}แล้ว (จำลอง) · สถานะ “รอตรวจ”`); vArticleEdit(id);
}
function artApprove(id) { const a = artById(id); a.tr[AE.lang] = 'ok'; ['title', 'excerpt', 'seoT', 'seoD'].forEach(f => a[f][AE.lang] = a[f][AE.lang].replace(/^\[(Machine|แปลจากเครื่อง)\]\s*/, '')); a.body[AE.lang] = a.body[AE.lang].replace(/^<p><i>[^<]*<\/i><\/p>/, ''); toast('อนุมัติคำแปลแล้ว'); vArticleEdit(id); }
function artPublish(id) {
  const a = artById(id), live = LANGS.filter(([k]) => ['orig', 'ok'].includes(a.tr[k])).map(x => x[1]);
  if (!live.length) return toast('ยังไม่มีภาษาไหนพร้อมเผยแพร่');
  a.status = a.date > iso(TODAY) ? 'scheduled' : 'published'; a.views = a.views || 0;
  toast(`${a.status === 'scheduled' ? 'ตั้งเวลาเผยแพร่' : 'เผยแพร่แล้ว'} · ภาษา ${live.join(' + ')}${live.length < 2 ? ' (อีกภาษาจะยังไม่แสดงบนเว็บ)' : ''}`); vArticleEdit(id);
}
function artCover(id) {
  openModal(`<div class="p-5"><div class="flex items-center justify-between"><p class="font-medium">เลือกรูปปก</p><button class="btn btn-g !px-2" onclick="closeModal()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <p class="text-[12px] text-muted mt-1">เลือกจากคลังรูปเรือ หรืออัปโหลดรูปใหม่ (แนะนำ 1600×900)</p>
    <div class="grid grid-cols-3 gap-2 mt-4">${FLEET.slice(0, 24).map(b => `<button onclick="artById(${id}).cover='${b.slug}';closeModal();vArticleEdit(${id})" class="rounded-lg overflow-hidden ring-1 ring-line hover:ring-maroon"><img src="${THUMBS[b.slug]}" class="w-full aspect-[16/10] object-cover"/></button>`).join('')}</div>
    <button class="btn btn-o w-full mt-4"><i data-lucide="upload" class="w-3.5 h-3.5"></i>อัปโหลดรูป</button></div>`);
}

function vArticleEdit(id) {
  const a = artById(id); if (!a) return go('articles');
  AE.id = a.id; const k = AE.lang, other = k === 'th' ? 'en' : 'th', Lname = { th: 'ไทย', en: 'อังกฤษ' };
  $('#pageTitle').textContent = 'แก้ไขบทความ';
  const st = a.tr[k], mt = st === 'mt', empty = st === 'none';
  const field = (f, label, { rows = 0, max = 0, len = '', idx = '' } = {}) => {
    const v = a[f][k] || '', inId = `af_${f}`;
    const inp = rows ? `<textarea id="${inId}" rows="${rows}" class="inp" oninput="artSet(${a.id},'${f}','${k}',this)">${esc(v)}</textarea>` : `<input id="${inId}" class="inp" value="${esc(v)}" oninput="artSet(${a.id},'${f}','${k}',this)"/>`;
    return `<label class="block"><span class="flex justify-between"><span class="lbl">${label}</span>${max ? `<span class="cnt-t" data-for="${inId}" data-max="${max}"></span>` : ''}</span>${inp}${len ? lenMeter(v, len) : ''}</label>`;
  };
  const tbtn = (ic, c, v, tip) => `<button type="button" class="btn btn-g !px-2 !h-8" title="${tip}" onmousedown="event.preventDefault();artCmd('${c}'${v ? `,'${v}'` : ''})"><i data-lucide="${ic}" class="w-4 h-4"></i></button>`;
  const au = TEAM.find(x => x.id === a.author) || { name: a.wpAuthor || 'ทีม Boat Trip Thailand' };
  $('#view').innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      <button class="btn btn-g !px-2 self-start" onclick="go('articles')"><i data-lucide="arrow-left" class="w-4 h-4"></i>บทความทั้งหมด</button>
      <div class="sm:ml-auto flex flex-wrap items-center gap-2"><span class="pill ${ART_ST[a.status][1]}">${ART_ST[a.status][0]}</span>
        <button class="btn btn-o" onclick="artPreview(${a.id},'${k}')"><i data-lucide="eye" class="w-3.5 h-3.5"></i>Preview ${k.toUpperCase()}</button>
        <button class="btn btn-o" onclick="toast('บันทึกร่างแล้ว')">บันทึกร่าง</button>
        <button class="btn btn-p" onclick="artPublish(${a.id})"><i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>${a.status === 'published' ? 'อัปเดต' : 'เผยแพร่'}</button></div>
    </div>
    <div class="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
      <div class="grid gap-4 min-w-0">
        <div class="card p-2 flex flex-wrap items-center gap-2">
          <div class="flex gap-1">${LANGS.map(([c, C, l]) => `<button class="tab ${k === c ? 'on' : ''}" onclick="AE.lang='${c}';vArticleEdit(${a.id})">${C} · ${l}</button>`).join('')}</div>
          <div id="artTr" class="flex gap-1 ml-1">${trBadge(a)}</div>${typeof trBtn === 'function' ? trBtn(a) : ''}
        </div>
        ${mt ? `<div class="rounded-xl bg-[#fff6e5] text-[#7a4a00] p-3.5 flex flex-col sm:flex-row sm:items-center gap-3"><i data-lucide="bot" class="w-5 h-5 shrink-0"></i><p class="flex-1 text-[12.5px]">ภาษา${Lname[k]}เป็นคำแปลจากเครื่อง ต้องให้ทีมตรวจก่อน · ระหว่างนี้หน้า ${k.toUpperCase()} จะยังไม่แสดงบนเว็บ</p><button class="btn btn-p" onclick="artApprove(${a.id})"><i data-lucide="check" class="w-3.5 h-3.5"></i>ตรวจแล้ว อนุมัติ</button></div>` : ''}
        ${empty && a.title[other] ? `<div class="rounded-xl bg-sand p-3.5 flex flex-col sm:flex-row sm:items-center gap-3"><i data-lucide="languages" class="w-5 h-5 text-maroon shrink-0"></i><p class="flex-1 text-[12.5px]">ยังไม่มีเวอร์ชันภาษา${Lname[k]} · เขียนเองได้เลย หรือกดแปลอัตโนมัติจากภาษา${Lname[other]}แล้วค่อยตรวจ</p></div>` : ''}
        <div class="card p-5 grid gap-4">
          <label class="block"><span class="lbl">ชื่อบทความ (${k.toUpperCase()})</span><input class="inp !h-12 !text-[18px] font-medium" value="${esc(a.title[k])}" placeholder="${k === 'th' ? 'เขียนชื่อบทความ…' : 'Article title…'}" oninput="artSet(${a.id},'title','${k}',this)"/></label>
          <label class="block"><span class="lbl">URL</span><div class="flex items-center rounded-[10px] ring-1 ring-inset ring-[rgb(35_20_22/.12)] bg-sand/50"><span class="pl-3 text-muted text-[12px] whitespace-nowrap">/${k === 'en' ? 'en/' : ''}blog/</span><input id="artSlug" class="inp !shadow-none !bg-transparent !pl-1" value="${esc(a.slug[k])}" oninput="(artById(${a.id}).slugLock??={})['${k}']=1;artById(${a.id}).slug['${k}']=this.value;artSeoPrev(artById(${a.id}))"/></div></label>
          ${field('excerpt', 'คำโปรย (แสดงในหน้ารวมบทความ)', { rows: 2, max: 200 })}
        </div>
        ${edCard(a, k)}
        <div class="card p-5 grid gap-4">
          <p class="font-medium flex items-center gap-2"><i data-lucide="search" class="w-4 h-4 text-maroon"></i>SEO · ${Lname[k]}</p>
          ${field('kw', 'คีย์เวิร์ดหลัก')}${field('seoT', 'Meta title', { len: 't' })}${field('seoD', 'Meta description', { rows: 2, len: 'd' })}
          <div><p class="lbl">ตัวอย่างบน Google</p><div id="artPrev" class="rounded-xl ring-1 ring-line p-4 bg-white"></div></div>
          <p class="text-[11px] text-muted">ระบบใส่ hreflang ให้หน้า TH และ EN ชี้หากันอัตโนมัติ เมื่อทั้ง 2 ภาษาเผยแพร่แล้ว</p>
        </div>
      </div>
      <div class="grid gap-4">
        <div class="card p-5 grid gap-3">
          <p class="font-medium">การเผยแพร่</p>
          <label><span class="lbl">สถานะ</span><select class="inp" onchange="artById(${a.id}).status=this.value;vArticleEdit(${a.id})">${Object.entries(ART_ST).map(([s, [l]]) => `<option value="${s}" ${a.status === s ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label><span class="lbl">วันที่เผยแพร่</span><input type="date" class="inp" value="${a.date}" onchange="artById(${a.id}).date=this.value"/></label>
          <label><span class="lbl">ผู้เขียน</span><select class="inp" onchange="artById(${a.id}).author=this.value">${TEAM.map(t => `<option value="${t.id}" ${t.id === a.author ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>
          <div class="rounded-xl bg-sand p-3 text-[12px] grid gap-1.5">${LANGS.map(([c, C, l]) => { const live = ['orig', 'ok'].includes(a.tr[c]); return `<div class="flex items-center gap-2"><i data-lucide="${live ? 'circle-check' : 'circle-dashed'}" class="w-3.5 h-3.5 ${live ? 'text-[#1e7a46]' : 'text-muted'}"></i>${l}: ${live ? 'พร้อมแสดงบนเว็บ' : a.tr[c] === 'mt' ? 'รอตรวจคำแปล' : 'ยังไม่มีเนื้อหา'}</div>`; }).join('')}</div>
        </div>
        <div class="card p-5"><div class="flex items-center justify-between"><p class="font-medium">รูปปก</p><button class="btn btn-g !h-7" onclick="artCover(${a.id})">เปลี่ยน</button></div><img src="${THUMBS[a.cover]}" class="mt-3 w-full aspect-[16/9] object-cover rounded-xl"/><p class="text-[11px] text-muted mt-2">ใช้รูปเดียวกันทั้ง 2 ภาษา · Alt text แยกตามภาษา</p>
          <div class="mt-2 relative"><span class="bi-tag">${k.toUpperCase()}</span><input class="inp !pl-10" placeholder="${k === 'th' ? 'คำอธิบายรูป' : 'Image alt text'}"/></div></div>
        <div class="card p-5 grid gap-3">
          <label><span class="lbl">หมวดหมู่</span><select class="inp" onchange="artById(${a.id}).cat=this.value">${Object.entries(ACAT_A).map(([c, l]) => `<option value="${c}" ${a.cat === c ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <div><p class="lbl">แท็ก</p><div class="flex flex-wrap gap-1.5">${a.tags.map((t, n) => `<span class="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-sand text-[12px]">${esc(t)}<button onclick="artById(${a.id}).tags.splice(${n},1);vArticleEdit(${a.id})" class="w-5 h-5 grid place-items-center rounded-full hover:bg-white"><i data-lucide="x" class="w-3 h-3"></i></button></span>`).join('')}<input class="h-7 px-2 text-[12px] w-24 rounded-full bg-transparent" placeholder="+ เพิ่มแท็ก" onkeydown="if(event.key==='Enter'&&this.value.trim()){artById(${a.id}).tags.push(this.value.trim());vArticleEdit(${a.id})}"/></div></div>
        </div>
        <div class="card p-5"><p class="font-medium">เรือที่เกี่ยวข้อง</p><p class="text-[11px] text-muted mt-1">แสดงท้ายบทความ ลิงก์ไปหน้าเรือ</p>
          <div class="mt-3 grid gap-2">${a.boats.map((s, n) => `<div class="flex items-center gap-2.5"><img src="${THUMBS[s]}" class="w-12 h-8 rounded-md object-cover"/><span class="flex-1 truncate">${esc(bySlug(s).name)}</span><button class="btn btn-g !px-1.5 !h-7" onclick="artById(${a.id}).boats.splice(${n},1);vArticleEdit(${a.id})"><i data-lucide="x" class="w-3.5 h-3.5"></i></button></div>`).join('')}</div>
          <select class="inp mt-3" onchange="if(this.value){artById(${a.id}).boats.push(this.value);vArticleEdit(${a.id})}"><option value="">+ เพิ่มเรือ</option>${FLEET.filter(b => !a.boats.includes(b.slug)).map(b => `<option value="${b.slug}">${esc(b.name)}</option>`).join('')}</select></div>
        <div class="card p-5 text-[12px] text-muted grid gap-1"><p class="text-ink font-medium text-[13px] mb-1">ประวัติ</p><p>${au.name} สร้างบทความ · ${fmtD(a.date)}</p>${a.tr.en === 'mt' || a.tr.th === 'mt' ? '<p>แปลอัตโนมัติ · รอตรวจ</p>' : ''}${a.status === 'published' ? `<p>เผยแพร่ · ${fmtD(a.date)}</p>` : ''}</div>
      </div>
    </div>`;
  artSeoPrev(a); artCount(); icons();
}

/* ---------- register page + dashboard row ---------- */
PAGES.splice(PAGES.findIndex(p => p[0] === 'content') + 1, 0, ['articles', 'บทความ', 'newspaper', vArticles]);
const _vDash2 = PAGES.find(p => p[0] === 'dashboard')[3];
PAGES.find(p => p[0] === 'dashboard')[3] = function () {
  _vDash2();
  const ul = $$('#view ul').pop(); if (!ul) return;
  const live = k => ART.filter(a => ['orig', 'ok'].includes(a.tr[k])).length;
  ul.insertAdjacentHTML('beforeend', `<li class="flex items-center gap-3 cursor-pointer" onclick="go('articles')"><span class="flex-1">บทความ ${ART.length} เรื่อง</span>${LANGS.map(([k, c]) => { const p = Math.round(live(k) / ART.length * 100); return `<span class="lang-b ${p === 100 ? 'ok' : p >= 60 ? 'mid' : 'low'}">${c} ${p}%</span>`; }).join('')}</li>`);
};

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


/* =====================================================================
   SEO CENTER – audit, meta manager, keywords, redirects, schema,
   sitemap & robots, global settings. Works on the real TH/EN data above.
   ===================================================================== */
const thLen = s => String(s || '').replace(/[ัิ-ฺ็-๎]/g, '').length; /* Thai marks take no width */
/* length bar under Meta title / description: amber = too short, green = ideal, red = too long.
   Put it right after the input — the document 'input' listener below keeps it live. */
const SEO_LEN = { t: [30, 60], d: [120, 160] };
function lenMeter(v, kind) {
  const [min, max] = SEO_LEN[kind], n = thLen(v), c = n > max ? '#a3222c' : n >= min ? '#1e7a46' : '#e0a64b';
  return `<div class="len-m mt-1.5" data-k="${kind}"><div class="h-1 rounded-full bg-sand overflow-hidden"><div class="h-full rounded-full" style="width:${Math.min(100, n / max * 100)}%;background:${c}"></div></div>
    <div class="flex justify-between mt-1 text-[10.5px] text-muted"><span>ความยาวที่เหมาะสม ${min}–${max} ตัวอักษร</span><span class="tnum" style="color:${n > max ? c : ''}">${n}</span></div></div>`;
}
document.addEventListener('input', e => { const m = e.target.nextElementSibling; if (m?.classList.contains('len-m')) m.outerHTML = lenMeter(e.target.value, m.dataset.k); });
const SITE = 'boattripthailand.com';
const SX = {}; /* per-page overrides: robots, canonical, og, schema */
const sx = id => SX[id] ??= { index: true, follow: true, canon: '', ogT: tr(), schema: '' };
const STATIC_SEO = {
  fleet: { t: tr('เช่าเรือยอชต์ภูเก็ต 70 ลำ เทียบราคา เลือกเรือ | Boat Trip Thailand', 'Phuket Yacht Charter – Compare 70 Boats | Boat Trip Thailand'), d: tr('รวมเรือยอชต์ คาตามารัน สปีดโบ๊ท ให้เช่าในภูเก็ต กรองตามจำนวนคน งบ และเส้นทาง พร้อมราคาเริ่มต้นทุกลำ', 'Browse yachts, catamarans and speedboats for charter in Phuket. Filter by group size, budget and route with starting prices for every boat.') },
  activities: { t: tr('กิจกรรม ทัวร์ และโชว์ในภูเก็ต | Boat Trip Thailand', ''), d: tr('รวมกิจกรรม ทัวร์ทะเล และโชว์ในภูเก็ต จองพร้อมเช่าเรือได้ในที่เดียว', '') },
  blog: { t: tr('บทความ คู่มือเช่าเรือ และเส้นทางเกาะ | Boat Trip Thailand', 'Boat Trip Guides & Island Routes | Boat Trip Thailand'), d: tr('คู่มือเช่าเรือยอชต์ภูเก็ต เส้นทางเกาะ และไอเดียจัดงานบนเรือ', 'Phuket yacht charter guides, island routes and ideas for events at sea.') },
  about: { t: tr('เกี่ยวกับเรา | Boat Trip Thailand', 'About Us | Boat Trip Thailand'), d: tr('', '') },
  privacy: { t: tr('นโยบายความเป็นส่วนตัว | Boat Trip Thailand', 'Privacy Policy | Boat Trip Thailand'), d: tr('', '') },
  terms: { t: tr('ข้อกำหนดและเงื่อนไข | Boat Trip Thailand', 'Terms & Conditions | Boat Trip Thailand'), d: tr('', '') },
  cookies: { t: tr('การตั้งค่าคุกกี้ | Boat Trip Thailand', 'Cookie Preferences | Boat Trip Thailand'), d: tr('', '') },
};
['privacy', 'terms', 'cookies'].forEach(k => SX['s-' + k] = { index: false, follow: true, canon: '', ogT: tr(), schema: '' });
const ST = { home: 'หน้าแรก', page: 'หน้าเพจ', boat: 'เรือ', article: 'บทความ', act: 'กิจกรรม' };
function seoPages() {
  const P = [], st = (id, name, path, o, schema) => P.push({ id: 's-' + id, type: id === 'home' ? 'home' : 'page', name, url: tr(path, '/en' + (path === '/' ? '' : path)), t: o.t, d: o.d, schema, go: id === 'home' ? "go('content');WEB.tab='seo';vContent()" : '' });
  st('home', 'หน้าแรก', '/', { t: WEB.seo.title, d: WEB.seo.desc }, 'Organization + WebSite');
  st('fleet', 'เรือทั้งหมด', '/yacht-charter', STATIC_SEO.fleet, 'CollectionPage');
  st('blog', 'บทความ', '/blog', STATIC_SEO.blog, 'Blog');
  st('about', 'เกี่ยวกับเรา', '/about-us', STATIC_SEO.about, 'AboutPage');
  st('privacy', 'นโยบายความเป็นส่วนตัว', '/privacy-policy', STATIC_SEO.privacy, 'WebPage');
  st('terms', 'ข้อกำหนดและเงื่อนไข', '/terms-and-conditions', STATIC_SEO.terms, 'WebPage');
  st('cookies', 'การตั้งค่าคุกกี้', '/cookie-preferences', STATIC_SEO.cookies, 'WebPage');
  FLEET.forEach(b => { const i = b.i18n; if (!i) return; P.push({ id: 'b-' + b.slug, type: 'boat', name: b.name, url: tr('/yacht-charter/' + b.slug, '/en/yacht-charter/' + b.slug), t: i.seoTitle, d: i.seoDesc, schema: 'Product + Offer', img: THUMBS[b.slug], go: `boatEdit('${b.slug}');BE.tab='seo';vBoatEdit('${b.slug}')`, hidden: !b.active }); });
  ART.forEach(a => P.push({ id: 'a-' + a.id, type: 'article', name: a.title.th || a.title.en, url: tr(a.slug.th ? '/blog/' + a.slug.th : '', a.slug.en ? '/en/blog/' + a.slug.en : ''), t: a.seoT, d: a.seoD, kw: a.kw, schema: 'BlogPosting', img: THUMBS[a.cover], art: a, go: `go('articles/${a.id}')`, draft: a.status !== 'published' && a.status !== 'scheduled' }));
  return P;
}
/* ---------- audit rules ---------- */
const ISSUE_L = { t_miss: 'ไม่มี Title', t_long: 'Title ยาวเกิน 60 ตัวอักษร', t_short: 'Title สั้นเกินไป', d_miss: 'ไม่มี Meta description', d_long: 'Description ยาวเกิน 160 ตัวอักษร', d_short: 'Description สั้นเกินไป', dup: 'Title ซ้ำกับหน้าอื่น', kw: 'คีย์เวิร์ดหลักไม่อยู่ใน Title', alt: 'รูปไม่มี Alt text', h2: 'ยังไม่มีหัวข้อ H2', link: 'ยังไม่มีลิงก์ไปหน้าเรือ', thin: 'เนื้อหาน้อยเกินไป', hreflang: 'มีแค่ภาษาเดียว (hreflang ไม่ครบคู่)', noindex: 'ตั้งเป็น noindex' };
const LV = { err: ['ต้องแก้', 'low', 'circle-alert'], warn: ['ควรแก้', 'mid', 'triangle-alert'], note: ['แนะนำ', 'ok', 'info'] };
function pageIssues(p, all) {
  const out = [], add = (lv, k, msg, lang) => out.push({ lv, k, msg, lang });
  const s = sx(p.id), langs = p.type === 'article' ? LANGS.filter(([k]) => ['orig', 'ok', 'mt'].includes(p.art.tr[k])) : LANGS;
  if (p.type === 'article' && langs.length < 2) add('warn', 'hreflang', 'มีแค่ภาษาเดียว · hreflang ไม่ครบคู่');
  langs.forEach(([k, C]) => {
    const t = p.t[k] || '', d = p.d[k] || '', tl = thLen(t), dl = thLen(d);
    if (!t.trim()) add('err', 't_miss', `ไม่มี Title`, C); else if (tl > 60) add('warn', 't_long', `Title ยาว ${tl} ตัวอักษร (เกิน 60)`, C); else if (tl < 25) add('note', 't_short', `Title สั้น ${tl} ตัวอักษร`, C);
    if (!d.trim()) add('err', 'd_miss', `ไม่มี Meta description`, C); else if (dl > 160) add('warn', 'd_long', `Description ยาว ${dl} ตัวอักษร (เกิน 160)`, C); else if (dl < 70) add('note', 'd_short', `Description สั้น ${dl} ตัวอักษร`, C);
    if (t.trim() && all && all.some(o => o !== p && (o.t[k] || '').trim() === t.trim())) add('err', 'dup', 'Title ซ้ำกับหน้าอื่น', C);
    if (p.kw && p.kw[k] && t && !t.toLowerCase().includes(p.kw[k].toLowerCase())) add('note', 'kw', `คีย์เวิร์ด “${p.kw[k]}” ไม่อยู่ใน Title`, C);
    if (p.type === 'article') { const B = blocksOf(p.art, k); const miss = B.reduce((n, b) => n + (b.t === 'img' && !b.alt ? 1 : 0) + (b.t === 'grid' ? b.cells.filter(c => c.src && !c.alt).length : 0) + (b.t === 'cols' ? b.cols.filter(c => c.k === 'img' && c.src && !c.alt).length : 0), 0);
      if (miss) add('warn', 'alt', `รูปไม่มี Alt text ${miss} รูป`, C);
      if (!B.some(b => b.t === 'h' && b.lv === 2)) add('note', 'h2', 'ยังไม่มีหัวข้อ H2', C);
      if (!B.some(b => b.t === 'boat') && !p.art.boats.length) add('note', 'link', 'ยังไม่มีลิงก์ไปหน้าเรือ (internal link)', C);
      const len = k === 'th' ? txtOf(p.art.body[k]).replace(/\s/g, '').length : txtOf(p.art.body[k]).split(/\s+/).length;
      if (len < (k === 'th' ? 800 : 300)) add('warn', 'thin', `เนื้อหาน้อย (${len} ${k === 'th' ? 'ตัวอักษร' : 'คำ'})`, C);
    }
  });
  if (!s.index && (p.type === 'boat' || p.type === 'article' || p.type === 'home')) add('warn', 'noindex', 'ตั้งเป็น noindex · Google จะไม่แสดงหน้านี้');
  return out;
}
const scoreOf = iss => Math.max(0, 100 - iss.reduce((n, i) => n + ({ err: 18, warn: 7, note: 2 }[i.lv]), 0));
const scoreCls = s => s >= 85 ? 'ok' : s >= 60 ? 'mid' : 'low';
function auditAll() { const P = seoPages().filter(p => !p.draft && !p.hidden); P.forEach(p => { p.iss = pageIssues(p, P); p.score = scoreOf(p.iss); }); return P; }

/* ---------- sample data (clearly labelled) ---------- */
const GSC = { on: false, days: Array.from({ length: 28 }, (_, i) => Math.round(60 + 25 * Math.sin(i / 3) + i * 2.2 + rnd() * 18)) };
const KW = [
  ['yacht charter phuket', 'en', '/en/', 7, 2], ['เช่าเรือยอชต์ภูเก็ต', 'th', '/', 4, 1], ['phuket yacht charter', 'en', '/en/blog/phuket-yacht-charter-guide', 12, -3],
  ['เช่าเรือภูเก็ต', 'th', '/yacht-charter', 9, 0], ['catamaran charter phuket', 'en', '/en/yacht-charter', 15, 4], ['เกาะใกล้ภูเก็ต', 'th', '/blog/เกาะใกล้ภูเก็ต-1-วัน', 18, 6],
  ['private boat phi phi', 'en', '/en/yacht-charter', 24, -2], ['ทริปเกาะพีพี เรือส่วนตัว', 'th', '/blog/พีพี-หรือ-อ่าวพังงา', null, 0],
].map(([q, l, url, pos, ch]) => ({ q, l, url, pos, ch }));
const REDIR = [
  { from: '/boat/leopard-90-ft/', to: '/yacht-charter/leopard-90-ft', code: 301, hits: 38 },
  { from: '/yacht/splo-74-ft/', to: '/yacht-charter/splo-74-ft', code: 301, hits: 21 },
  { from: '/category/yacht/', to: '/yacht-charter', code: 301, hits: 64 },
  { from: '/contact-us/', to: '/about-us', code: 301, hits: 12 },
];
const LOG404 = [];   // filled from /api/admin/analytics (real 404 hits)
const SCHEMA_ORG = { name: 'Boat Trip Thailand', type: 'TravelAgency', phone: TEAM[0].tel, email: '', street: '', city: 'Phuket', zip: '', lat: '', lng: '', hours: '08:00–20:00', social: ['', '', ''], logo: true, rating: false };
const ROBOTS = { txt: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /*?q=\n\nSitemap: https://${SITE}/sitemap.xml`, ai: { GPTBot: true, ClaudeBot: true, PerplexityBot: true, 'Google-Extended': true, CCBot: false }, llms: true };
const SMAP = { pages: true, boats: true, blog: true, activities: true, images: true, hreflang: true };
const SSET = { sep: '|', site: tr('Boat Trip Thailand', 'Boat Trip Thailand'), tpl: { boat: tr('%name% เช่าเรือภูเก็ต เริ่ม %price% %sep% %site%', '%name% Yacht Charter Phuket from %price% %sep% %site%'), article: tr('%title% %sep% %site%', '%title% %sep% %site%'), act: tr('%name% ภูเก็ต %sep% %site%', '%name% Phuket %sep% %site%') }, gsc: '', bing: '', ga4: '', gtm: '', pixel: '', slash: false, lower: true, canon: true, noSearch: true, crumbs: true };
const SEOV = { tab: 'overview', type: '', issue: '', lang: 'th', q: '', page: 0, prev: 'b-leopard-90-ft' };

/* ---------- main view ---------- */
function vSeo() {
  const tabs = [['overview', 'ภาพรวม', 'gauge'], ['pages', 'Meta ทุกหน้า', 'file-text'], ['keywords', 'คีย์เวิร์ด', 'tag'], ['redirects', 'Redirect & 404', 'shuffle'], ['schema', 'Schema', 'code'], ['sitemap', 'Sitemap & Robots', 'network'], ['settings', 'ตั้งค่า SEO', 'settings-2']];
  const P = auditAll();
  $('#view').innerHTML = `${head('SEO', 'ตรวจและจัดการ SEO ทุกหน้า ทั้งภาษาไทยและอังกฤษ · ปัญหาคำนวณจากข้อมูลจริงในระบบ · ตัวเลขจาก Google ดึงจาก Search Console', `<button class="btn btn-o" onclick="toast('ตรวจทั้งเว็บใหม่แล้ว · ${P.length} หน้า');vSeo()"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>ตรวจใหม่</button>`)}
    <div class="tabbar flex gap-1 overflow-x-auto no-sb mb-4">${tabs.map(([k, l, ic]) => `<button class="tab inline-flex items-center gap-1.5 ${SEOV.tab === k ? 'on' : ''}" onclick="SEOV.tab='${k}';vSeo()"><i data-lucide="${ic}" class="w-3.5 h-3.5"></i>${l}</button>`).join('')}</div><div class="card">
    <div id="seoBody" class="p-4 sm:p-5 fade">${({ overview: seoOverview, pages: seoPagesTab, keywords: seoKw, redirects: seoRedir, schema: seoSchema, sitemap: seoSitemap, settings: seoSettings })[SEOV.tab](P)}</div></div>`;
  icons();
}
const ring = (v, size = 120) => { const r = size / 2 - 8, c = 2 * Math.PI * r, col = v >= 85 ? '#1e7a46' : v >= 60 ? '#b4501a' : '#a3222c';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="shrink-0"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#f1eaea" stroke-width="8"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c * v / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="50%" text-anchor="middle" dy=".35em" font-size="${size / 4}" fill="#231416" font-family="Jost">${v}</text></svg>`; };

function seoOverview(P) {
  const avg = Math.round(P.reduce((s, p) => s + p.score, 0) / P.length), all = P.flatMap(p => p.iss.map(i => ({ ...i, p })));
  const cnt = lv => all.filter(i => i.lv === lv).length;
  const groups = {}; all.forEach(i => { const g = groups[i.k] ??= { lv: i.lv, msg: ISSUE_L[i.k], n: 0, pages: new Set() }; g.n++; g.pages.add(i.p.id); });
  const top = Object.entries(groups).sort((a, b) => ({ err: 0, warn: 1, note: 2 }[a[1].lv] - { err: 0, warn: 1, note: 2 }[b[1].lv]) || b[1].n - a[1].n);
  const idx = P.filter(p => sx(p.id).index && !p.hidden).length;
  const max = Math.max(...GSC.days), sum = GSC.days.reduce((a, b) => a + b, 0);
  const gsc = GSC.on ? `<div class="flex items-center justify-between"><p class="font-medium">Google Search Console · 28 วัน</p><span class="text-[11px] text-muted">ตัวเลขตัวอย่าง</span></div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">${[['คลิก', sum.toLocaleString()], ['การแสดงผล', (sum * 27).toLocaleString()], ['CTR เฉลี่ย', (100 / 27).toFixed(1) + '%'], ['อันดับเฉลี่ย', '14.2']].map(([l, v]) => `<div><p class="text-[11px] text-muted">${l}</p><p class="text-[20px] font-medium tnum">${v}</p></div>`).join('')}</div>
      <div class="relative mt-4"><div class="flex items-end gap-[2px] h-28 border-b border-line" onmouseleave="$('#gscTip').classList.add('hidden')">${GSC.days.map((v, i) => `<div class="flex-1 h-full flex items-end group cursor-default" onmouseenter="const t=$('#gscTip');t.classList.remove('hidden');t.style.left=(${i}/28*100)+'%';t.innerHTML='${fmtD(iso(addDays(TODAY, i - 27)))} · <b>${v}</b> คลิก'"><div class="w-full rounded-t-[4px] bg-maroon/80 group-hover:bg-maroon" style="height:${v / max * 100}%"></div></div>`).join('')}</div>
        <div id="gscTip" class="hidden absolute -top-7 bg-ink text-white text-[11px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none"></div>
        <div class="flex justify-between text-[10.5px] text-muted mt-1"><span>${fmtD(iso(addDays(TODAY, -27)))}</span><span>วันนี้</span></div></div>`
    : `<div class="flex flex-col sm:flex-row sm:items-center gap-4"><div class="w-11 h-11 rounded-xl bg-sand grid place-items-center shrink-0"><i data-lucide="plug" class="w-5 h-5 text-maroon"></i></div><div class="flex-1"><p class="font-medium">เชื่อม Google Search Console</p><p class="text-[12px] text-muted mt-0.5">ดูคลิก การแสดงผล อันดับคีย์เวิร์ด และหน้าที่ Google ยังไม่ index</p></div><button class="btn btn-p" onclick="GSC.on=true;vSeo();toast('เชื่อมต่อแล้ว (จำลอง) · แสดงข้อมูลตัวอย่าง')">เชื่อมต่อ</button></div>`;
  return `<div class="grid xl:grid-cols-3 gap-4 items-start">
    <div class="xl:col-span-2 grid gap-4">
      <div class="rounded-2xl ring-1 ring-line p-5 flex flex-col sm:flex-row sm:items-center gap-5">${ring(avg)}
        <div class="flex-1"><p class="text-[17px] font-medium">คะแนน SEO ทั้งเว็บ</p><p class="text-muted text-[12px] mt-0.5">ตรวจ ${P.length} หน้าที่แสดงบนเว็บ (ไม่รวมฉบับร่างและหน้าที่ซ่อน) · ${idx} หน้าเปิดให้ Google index</p>
          <div class="grid grid-cols-3 gap-2 mt-4">${['err', 'warn', 'note'].map(lv => `<button class="rounded-xl bg-sand p-3 text-left hover:ring-1 hover:ring-line" onclick="SEOV.tab='pages';SEOV.issue='${lv}';vSeo()"><span class="lang-b ${LV[lv][1]}">${LV[lv][0]}</span><p class="text-[22px] font-medium tnum mt-1.5">${cnt(lv)}</p></button>`).join('')}</div></div></div>
      <div class="rounded-2xl ring-1 ring-line p-5">${gsc}</div>
      <div class="rounded-2xl ring-1 ring-line"><p class="font-medium px-5 pt-4 pb-2">ปัญหาที่พบ เรียงตามความสำคัญ</p>
        <ul>${top.map(([k, g]) => `<li class="flex items-center gap-3 px-5 py-3 border-t border-line"><i data-lucide="${LV[g.lv][2]}" class="w-4 h-4 shrink-0 ${g.lv === 'err' ? 'text-[#a3222c]' : g.lv === 'warn' ? 'text-[#b4501a]' : 'text-muted'}"></i><span class="flex-1">${g.msg}</span><span class="text-muted text-[12px] tnum whitespace-nowrap">${g.pages.size} หน้า</span><button class="btn btn-g !h-8" onclick="SEOV.tab='pages';SEOV.issue='${k}';vSeo()">ดู<i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></button></li>`).join('') || '<li class="px-5 py-6 text-muted border-t border-line">ไม่พบปัญหา</li>'}</ul></div>
    </div>
    <div class="grid gap-4">
      <div class="rounded-2xl ring-1 ring-line p-5"><p class="font-medium">คะแนนตามประเภทหน้า</p><ul class="mt-3 space-y-3">${Object.entries(ST).map(([t, l]) => { const g = P.filter(p => p.type === t); if (!g.length) return ''; const s = Math.round(g.reduce((a, p) => a + p.score, 0) / g.length); return `<li class="cursor-pointer" onclick="SEOV.tab='pages';SEOV.type='${t}';SEOV.issue='';vSeo()"><div class="flex justify-between text-[12.5px]"><span>${l} <span class="text-muted">· ${g.length}</span></span><span class="tnum">${s}</span></div><div class="mt-1 h-1.5 rounded-full bg-sand overflow-hidden"><div class="h-full rounded-full ${s >= 85 ? 'bg-[#1e7a46]' : s >= 60 ? 'bg-[#b4501a]' : 'bg-[#a3222c]'}" style="width:${s}%"></div></div></li>`; }).join('')}</ul></div>
      <div class="rounded-2xl ring-1 ring-line p-5"><div class="flex justify-between"><p class="font-medium">Core Web Vitals</p><span class="text-[11px] text-muted">ตัวอย่าง</span></div>
        <div class="mt-3 grid gap-2.5">${[['LCP', '2.1 วินาที', 'ok', 'โหลดภาพหลัก'], ['INP', '160 ms', 'ok', 'ตอบสนองการกด'], ['CLS', '0.12', 'mid', 'หน้าขยับระหว่างโหลด']].map(([k, v, c, l]) => `<div class="flex items-center gap-3"><span class="w-10 text-[12px] font-medium">${k}</span><span class="flex-1 text-[12px] text-muted">${l}</span><span class="lang-b ${c}">${v}</span></div>`).join('')}</div>
        <p class="text-[11px] text-muted mt-3">ระบบจริงดึงจาก PageSpeed Insights API ทุกสัปดาห์</p></div>
      <div class="rounded-2xl ring-1 ring-line p-5"><p class="font-medium">ทางลัด</p><div class="grid gap-1 mt-2">${[['redirects', 'shuffle', `404 ที่ยังไม่มี redirect · ${LOG404.length}`], ['sitemap', 'network', 'Sitemap & robots.txt'], ['schema', 'code', 'ข้อมูลธุรกิจ (Schema)']].map(([t, ic, l]) => `<button class="nav-i !h-9" onclick="SEOV.tab='${t}';vSeo()"><i data-lucide="${ic}" class="w-4 h-4"></i>${l}</button>`).join('')}</div></div>
    </div></div>`;
}

function seoPagesTab(P) {
  const k = SEOV.lang;
  let rows = P.filter(p => (!SEOV.type || p.type === SEOV.type) && (!SEOV.q || (p.name + p.url.th + p.url.en).toLowerCase().includes(SEOV.q.toLowerCase())));
  if (SEOV.issue) rows = rows.filter(p => p.iss.some(i => i.lv === SEOV.issue || i.k === SEOV.issue));
  rows.sort((a, b) => a.score - b.score);
  const per = 20, pages = Math.max(1, Math.ceil(rows.length / per)); SEOV.page = Math.min(SEOV.page, pages - 1);
  const view = rows.slice(SEOV.page * per, SEOV.page * per + per);
  const len = (s, max, min) => { const n = thLen(s); return `<span class="lang-b ${!n ? 'low' : n > max ? 'mid' : n < min ? 'mid' : 'ok'} tnum">${n || '—'}</span>`; };
  const issueOpts = [['', 'ทุกสถานะ'], ['err', 'มีจุดต้องแก้'], ['warn', 'มีจุดควรแก้'], ['t_miss', 'ไม่มี Title'], ['t_long', 'Title ยาวเกิน'], ['d_miss', 'ไม่มี Description'], ['d_long', 'Description ยาวเกิน'], ['dup', 'Title ซ้ำ'], ['alt', 'รูปไม่มี Alt'], ['hreflang', 'มีภาษาเดียว'], ['noindex', 'noindex']];
  return `<div class="flex flex-col lg:flex-row lg:items-center gap-2 mb-3">
      <div class="flex gap-1 overflow-x-auto no-sb">${[['', 'ทั้งหมด'], ...Object.entries(ST)].map(([t, l]) => `<button class="tab ${SEOV.type === t ? 'on' : ''}" onclick="SEOV.type='${t}';SEOV.page=0;vSeo()">${l}</button>`).join('')}</div>
      <div class="lg:ml-auto grid grid-cols-1 sm:grid-cols-[1fr_170px_auto] gap-2 items-center">
        <input class="inp" placeholder="ค้นหาหน้า หรือ URL…" value="${esc(SEOV.q)}" onkeydown="if(event.key==='Enter'){SEOV.q=this.value;SEOV.page=0;vSeo()}"/>
        <select class="inp" onchange="SEOV.issue=this.value;SEOV.page=0;vSeo()">${issueOpts.map(([v, l]) => `<option value="${v}" ${SEOV.issue === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <div class="flex p-0.5 rounded-full bg-sand">${LANGS.map(([c, C]) => `<button class="h-8 px-3 rounded-full text-[12px] ${k === c ? 'bg-white shadow-sm' : 'text-muted'}" onclick="SEOV.lang='${c}';vSeo()">${C}</button>`).join('')}</div></div></div>
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl bg-sand p-3 mb-3 text-[12.5px]"><i data-lucide="zap" class="w-4 h-4 text-maroon shrink-0"></i><span class="flex-1">หน้าที่ยังไม่มี Title สร้างให้อัตโนมัติจาก “รูปแบบ Title” ในแท็บตั้งค่าได้ · Description ควรเขียนเองให้น่าคลิก</span><button class="btn btn-o !h-8" onclick="seoBulkTitle()">เติม Title ที่ว่างอัตโนมัติ</button></div>
    <div class="overflow-x-auto rounded-xl ring-1 ring-line"><table class="tbl min-w-[980px]"><thead><tr><th>หน้า</th><th>ประเภท</th><th>Title (${k.toUpperCase()})</th><th class="text-center">ยาว</th><th class="text-center">Desc</th><th>Index</th><th>ปัญหา</th><th class="text-center">คะแนน</th><th></th></tr></thead><tbody>
    ${view.map(p => { const s = sx(p.id), e = p.iss.filter(i => i.lv === 'err').length, w = p.iss.filter(i => i.lv === 'warn').length;
      return `<tr class="click" onclick="seoEdit('${p.id}')"><td><div class="flex items-center gap-2.5 min-w-[200px]">${p.img ? `<img src="${p.img}" class="w-10 h-7 rounded object-cover"/>` : `<span class="w-10 h-7 rounded bg-sand grid place-items-center"><i data-lucide="file-text" class="w-3.5 h-3.5 text-muted"></i></span>`}<div class="min-w-0"><p class="truncate max-w-[220px]">${esc(p.name)}${p.hidden ? ' <span class="text-[10.5px] text-muted">(ซ่อน)</span>' : ''}</p><p class="text-[11px] text-muted truncate max-w-[220px]">${esc(p.url[k] || '—')}</p></div></div></td>
        <td class="text-muted whitespace-nowrap">${ST[p.type]}</td><td><p class="truncate max-w-[300px] ${p.t[k] ? '' : 'text-muted'}">${esc(p.t[k] || 'ยังไม่มี')}</p></td>
        <td class="text-center">${len(p.t[k], 60, 25)}</td><td class="text-center">${len(p.d[k], 160, 70)}</td>
        <td>${s.index ? '<span class="text-[#1e7a46] text-[12px]">index</span>' : '<span class="text-muted text-[12px]">noindex</span>'}</td>
        <td class="whitespace-nowrap">${e ? `<span class="lang-b low">${e} ต้องแก้</span> ` : ''}${w ? `<span class="lang-b mid">${w} ควรแก้</span>` : ''}${!e && !w ? '<span class="text-muted text-[12px]">—</span>' : ''}</td>
        <td class="text-center"><span class="lang-b ${scoreCls(p.score)} tnum">${p.score}</span></td><td class="text-right"><i data-lucide="pencil" class="w-4 h-4 text-muted inline"></i></td></tr>`; }).join('') || '<tr><td colspan="9" class="text-center text-muted py-10">ไม่พบหน้าที่ตรงเงื่อนไข</td></tr>'}
    </tbody></table></div>
    <div class="flex items-center justify-between mt-3 text-[12px] text-muted"><span>${rows.length} หน้า · ความยาวนับแบบไม่รวมสระบน/ล่างของภาษาไทย</span>${pages > 1 ? `<div class="flex items-center gap-1"><button class="btn btn-g !h-8 !px-2" ${SEOV.page ? '' : 'disabled'} onclick="SEOV.page--;vSeo()"><i data-lucide="chevron-left" class="w-4 h-4"></i></button><span class="tnum">${SEOV.page + 1} / ${pages}</span><button class="btn btn-g !h-8 !px-2" ${SEOV.page < pages - 1 ? '' : 'disabled'} onclick="SEOV.page++;vSeo()"><i data-lucide="chevron-right" class="w-4 h-4"></i></button></div>` : ''}</div>`;
}

/* drawer: edit one page's SEO (writes straight into the page's own {th,en} fields) */
function seoField(label, o, k, max, rows, id) {
  const v = o[k] || '', n = thLen(v);
  const inp = rows ? `<textarea rows="${rows}" class="inp" oninput="seoIn(this,${max},'${id}','${k}')">${esc(v)}</textarea>` : `<input class="inp" value="${esc(v)}" oninput="seoIn(this,${max},'${id}','${k}')"/>`;
  return `<label class="block" data-o><span class="lbl">${label}</span>${inp}${lenMeter(v, max === 60 ? 't' : 'd')}</label>`;
}
let SE = null;
function seoIn(el, max, id, k) {
  const p = SE, isT = el.closest('label').querySelector('.lbl').textContent.startsWith('Title');
  (isT ? p.t : p.d)[k] = el.value;
  seoPrev();
}
function seoPrev() {
  const p = SE; $('#sePrev').innerHTML = LANGS.map(([k, C]) => `<div class="rounded-xl ring-1 ring-line p-3.5"><p class="text-[10.5px] text-muted mb-1.5">Google · ${C}</p><p class="text-[11px] text-[#4d5156] truncate">${SITE}${esc(p.url[k] || '')}</p><p class="text-[15px] text-[#1a0dab] leading-snug mt-0.5 line-clamp-1">${esc(p.t[k] || '—')}</p><p class="text-[12px] text-[#4d5156] mt-0.5 line-clamp-2">${esc(p.d[k] || '—')}</p></div>`).join('')
    + `<div class="rounded-xl ring-1 ring-line overflow-hidden"><p class="text-[10.5px] text-muted px-3.5 pt-3 mb-1.5">แชร์ใน LINE / Facebook</p>${p.img ? `<img src="${p.img}" class="w-full aspect-[1200/630] object-cover"/>` : `<div class="w-full aspect-[1200/630] bg-sand grid place-items-center text-[11px] text-muted">ใช้รูป OG เริ่มต้นของเว็บ</div>`}<div class="p-3 bg-[#f6f7f9]"><p class="text-[10.5px] text-muted uppercase">${SITE}</p><p class="text-[13px] font-medium line-clamp-1">${esc(sx(p.id).ogT.th || p.t.th || '')}</p></div></div>`;
}
function seoEdit(id) {
  REG = []; const P = auditAll(), p = P.find(x => x.id === id); SE = p; const s = sx(id);
  const tog = (key, l, h) => `<label class="flex items-center justify-between gap-3 py-1.5"><span>${l}${h ? `<span class="block text-[11px] text-muted">${h}</span>` : ''}</span><span class="tgl"><input type="checkbox" ${s[key] ? 'checked' : ''} onchange="sx('${id}').${key}=this.checked"/><span></span></span></label>`;
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div class="min-w-0"><p class="text-[11px] text-muted">${ST[p.type]} · SEO</p><p class="font-medium truncate">${esc(p.name)}</p></div><div class="flex items-center gap-2"><span class="lang-b ${scoreCls(p.score)}">คะแนน ${p.score}</span><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div></div>
    <div class="flex-1 overflow-y-auto p-5 grid gap-5 content-start">
      ${p.iss.length ? `<div class="rounded-xl bg-sand p-3.5"><p class="text-[12px] font-medium mb-2">สิ่งที่ควรแก้</p><ul class="grid gap-1.5 text-[12.5px]">${p.iss.map(i => `<li class="flex items-start gap-2"><i data-lucide="${LV[i.lv][2]}" class="w-3.5 h-3.5 mt-0.5 shrink-0 ${i.lv === 'err' ? 'text-[#a3222c]' : i.lv === 'warn' ? 'text-[#b4501a]' : 'text-muted'}"></i><span>${i.lang ? `<b class="font-medium">${i.lang}</b> · ` : ''}${i.msg}</span></li>`).join('')}</ul></div>` : '<div class="rounded-xl bg-[#eaf6ef] text-[#1e7a46] p-3.5 text-[12.5px] flex items-center gap-2"><i data-lucide="circle-check" class="w-4 h-4"></i>หน้านี้ผ่านการตรวจทั้งหมด</div>'}
      <div class="grid gap-3">${LANGS.map(([k, C, L]) => `<div class="grid gap-3 rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium">${L}</p><p class="text-[11px] text-muted -mt-2 truncate">${SITE}${esc(p.url[k] || '— ยังไม่มีหน้าภาษานี้')}</p>${seoField('Title', p.t, k, 60, 0, id)}${seoField('Meta description', p.d, k, 160, 2, id)}</div>`).join('')}</div>
      <div><p class="lbl">ตัวอย่างการแสดงผล</p><div id="sePrev" class="grid gap-2.5"></div></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium mb-1">การ index</p>${tog('index', 'ให้ Google index หน้านี้', 'ปิด = ใส่ noindex')}${tog('follow', 'ให้ติดตามลิงก์ในหน้านี้', 'ปิด = nofollow')}
        <label class="block mt-2"><span class="lbl">Canonical URL (เว้นว่าง = ใช้ URL ของหน้านี้เอง)</span><input class="inp" placeholder="https://${SITE}${esc(p.url.th)}" value="${esc(s.canon)}" onchange="sx('${id}').canon=this.value"/></label></div>
      <div class="rounded-xl ring-1 ring-line p-4 grid gap-3"><p class="text-[12px] font-medium">โซเชียล (Open Graph)</p>${bi('OG title (เว้นว่าง = ใช้ Title)', s.ogT)}<p class="text-[11px] text-muted">รูป OG ใช้รูปปก/รูปเรือของหน้านี้อัตโนมัติ ขนาด 1200×630</p></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium">Structured data</p><p class="text-[12.5px] mt-1">${p.schema} <span class="text-muted">· สร้างอัตโนมัติจากข้อมูลหน้า</span></p>${p.go ? `<button class="btn btn-o mt-3" onclick="closeDrawer();${p.go}"><i data-lucide="external-link" class="w-3.5 h-3.5"></i>ไปหน้าแก้ไขเนื้อหา</button>` : ''}</div>
    </div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeDrawer()">ปิด</button><button class="btn btn-p" onclick="seoSaveDrawer()">บันทึก</button></div>`);
  seoPrev();
}

function seoKw() {
  const P = seoPages(), kwUse = {};
  P.forEach(p => p.kw && LANGS.forEach(([k]) => { const w = (p.kw[k] || '').trim().toLowerCase(); if (w) (kwUse[w] ??= []).push(p.name); }));
  const cannib = Object.entries(kwUse).filter(([, v]) => v.length > 1);
  return `<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3"><p class="text-[12px] text-muted">ติดตามอันดับคีย์เวิร์ดสำคัญ · อันดับเป็นตัวอย่าง ระบบจริงดึงจาก Search Console ทุกวัน</p><button class="btn btn-p" onclick="seoAddKw()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มคีย์เวิร์ด</button></div>
    ${cannib.length ? `<div class="rounded-xl bg-[#fff6e5] text-[#7a4a00] p-3.5 mb-3 text-[12.5px]"><b class="font-medium">คีย์เวิร์ดชนกัน:</b> ${cannib.map(([w, v]) => `“${esc(w)}” ใช้ใน ${v.length} หน้า (${v.map(esc).join(', ')})`).join(' · ')} · ควรให้ 1 คีย์เวิร์ดหลักต่อ 1 หน้า</div>` : ''}
    <div class="overflow-x-auto rounded-xl ring-1 ring-line"><table class="tbl min-w-[720px]"><thead><tr><th>คีย์เวิร์ด</th><th>ภาษา</th><th>หน้าเป้าหมาย</th><th class="text-center">อันดับ</th><th class="text-center">7 วัน</th><th></th></tr></thead><tbody>
    ${KW.map((w, n) => `<tr><td>${esc(w.q)}</td><td><span class="lang-b ok">${w.l.toUpperCase()}</span></td><td class="text-muted truncate max-w-[280px]">${esc(w.url)}</td>
      <td class="text-center tnum">${w.pos ?? '<span class="text-muted">ยังไม่ติด 100</span>'}</td>
      <td class="text-center tnum">${w.ch > 0 ? `<span class="text-[#1e7a46] inline-flex items-center gap-0.5"><i data-lucide="trending-up" class="w-3.5 h-3.5"></i>${w.ch}</span>` : w.ch < 0 ? `<span class="text-[#a3222c] inline-flex items-center gap-0.5"><i data-lucide="trending-down" class="w-3.5 h-3.5"></i>${-w.ch}</span>` : '<span class="text-muted">—</span>'}</td>
      <td class="text-right"><button class="btn btn-g !px-2" onclick="KW.splice(${n},1);vSeo()"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`).join('')}</tbody></table></div>`;
}
function seoAddKw() {
  const P = seoPages().filter(p => !p.draft);
  openModal(`<div class="p-5 grid gap-3"><p class="font-medium">เพิ่มคีย์เวิร์ดที่ต้องการติดตาม</p>
    <label><span class="lbl">คีย์เวิร์ด</span><input id="kwQ" class="inp" placeholder="เช่น เช่าเรือยอชต์ภูเก็ต ราคา"/></label>
    <div class="grid grid-cols-2 gap-3"><label><span class="lbl">ภาษา</span><select id="kwL" class="inp"><option value="th">ไทย</option><option value="en">English</option></select></label>
    <label><span class="lbl">หน้าเป้าหมาย</span><select id="kwU" class="inp">${P.map(p => `<option value="${esc(p.url.th)}">${esc(p.name)}</option>`).join('')}</select></label></div>
    <div class="flex justify-end gap-2 mt-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="if($('#kwQ').value.trim()){const l=$('#kwL').value;KW.unshift({q:$('#kwQ').value.trim(),l,url:(l==='en'?'/en':'')+$('#kwU').value,pos:null,ch:0});closeModal();vSeo();toast('เพิ่มคีย์เวิร์ดแล้ว · อันดับจะอัปเดตพรุ่งนี้')}">เพิ่ม</button></div></div>`);
}

const guessTarget = u => { const m = u.match(/(?:boat|yacht)\/([a-z0-9-]+)/); if (m && bySlug(m[1])) return (u.startsWith('/en/') || /lang=en/.test(u) ? '/en' : '') + '/yacht-charter/' + m[1]; if (/pattaya/.test(u)) return '/yacht-charter'; if (/tag|category/.test(u)) return '/blog'; return ''; };
function seoRedir() {
  return `<div class="rounded-xl bg-sand p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3"><i data-lucide="shuffle" class="w-5 h-5 text-maroon shrink-0"></i><div class="flex-1"><p class="font-medium">ย้ายจาก WordPress</p><p class="text-[12px] text-muted mt-0.5">นำเข้า sitemap เดิม แล้วระบบจับคู่ URL เก่ากับหน้าใหม่ให้อัตโนมัติ เพื่อไม่ให้อันดับ Google หาย</p></div><button class="btn btn-o" onclick="toast('นำเข้า sitemap เดิม (จำลอง)')"><i data-lucide="download" class="w-3.5 h-3.5"></i>นำเข้า sitemap / CSV</button></div>
    <div class="grid xl:grid-cols-[1.4fr_1fr] gap-4 items-start">
    <div class="rounded-xl ring-1 ring-line min-w-0"><div class="flex items-center justify-between px-4 py-3"><p class="font-medium">Redirect <span class="text-muted font-normal">· ${REDIR.length}</span></p><button class="btn btn-p !h-8" onclick="seoAddRedir('','')"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่ม</button></div>
      <div class="overflow-x-auto"><table class="tbl min-w-[560px]"><thead><tr><th>URL เดิม</th><th></th><th>ไปที่</th><th>ชนิด</th><th class="text-right">ครั้ง</th><th></th></tr></thead><tbody>
      ${REDIR.map((r, n) => `<tr><td class="text-muted truncate max-w-[200px]">${esc(r.from)}</td><td><i data-lucide="arrow-right" class="w-3.5 h-3.5 text-muted"></i></td><td class="truncate max-w-[200px]">${esc(r.to)}</td><td><span class="lang-b ok">${r.code}</span></td><td class="text-right tnum">${r.hits}</td><td class="text-right"><button class="btn btn-g !px-2" onclick="seoDelRedir(${n})"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`).join('')}</tbody></table></div>
      <p class="text-[11px] text-muted px-4 py-3">ตัวอย่าง URL รูปแบบ WordPress · ระบบจริงใช้ URL จาก sitemap เดิมของเว็บ</p></div>
    <div class="rounded-xl ring-1 ring-line min-w-0"><div class="px-4 py-3"><p class="font-medium">หน้า 404 ที่มีคนเข้า</p><p class="text-[11px] text-muted">ข้อมูลตัวอย่าง · 30 วัน</p></div>
      <ul>${LOG404.map((x, n) => { const g = guessTarget(x.u); return `<li class="px-4 py-2.5 border-t border-line flex items-center gap-2"><div class="min-w-0 flex-1"><p class="truncate text-[12.5px]">${esc(x.u)}</p><p class="text-[11px] text-muted">${x.h} ครั้ง${g ? ` · แนะนำ → ${esc(g)}` : ''}</p></div><button class="btn btn-o !h-8 shrink-0" onclick="seoAddRedir('${esc(x.u)}','${esc(g)}',${n})">สร้าง redirect</button></li>`; }).join('') || '<li class="px-4 py-6 text-muted border-t border-line">ไม่มี 404 แล้ว</li>'}</ul></div></div>`;
}
function seoAddRedir(from, to, n) {
  openModal(`<div class="p-5 grid gap-3"><p class="font-medium">เพิ่ม Redirect</p>
    <label><span class="lbl">URL เดิม</span><input id="rF" class="inp" value="${from}" placeholder="/old-page/"/></label>
    <label><span class="lbl">ไปที่</span><input id="rT" class="inp" value="${to}" placeholder="/yacht-charter/..."/></label>
    <label><span class="lbl">ชนิด</span><select id="rC" class="inp"><option value="301">301 · ย้ายถาวร (แนะนำ)</option><option value="302">302 · ชั่วคราว</option><option value="410">410 · ลบแล้ว</option></select></label>
    <div class="flex justify-end gap-2 mt-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="seoSaveRedir(${n != null ? n : 'null'})">บันทึก</button></div></div>`);
}

function seoJsonLd() {
  const o = SCHEMA_ORG, v = SEOV.prev, base = `https://${SITE}`;
  if (v === 'org') return { '@context': 'https://schema.org', '@type': o.type, name: o.name, url: base, logo: base + '/logo.png', telephone: o.phone, ...(o.email && { email: o.email }), address: { '@type': 'PostalAddress', ...(o.street && { streetAddress: o.street }), addressLocality: o.city, addressCountry: 'TH', ...(o.zip && { postalCode: o.zip }) }, ...(o.lat && { geo: { '@type': 'GeoCoordinates', latitude: o.lat, longitude: o.lng } }), openingHours: o.hours, ...(o.social.filter(Boolean).length && { sameAs: o.social.filter(Boolean) }) };
  if (v.startsWith('b-')) { const b = bySlug(v.slice(2)); return { '@context': 'https://schema.org', '@type': 'Product', name: b.name, description: b.i18n?.seoDesc.en || '', image: base + `/images/${b.slug}.webp`, brand: { '@type': 'Brand', name: o.name }, offers: { '@type': 'Offer', priceCurrency: 'THB', price: b.from_ || undefined, availability: 'https://schema.org/InStock', url: base + '/yacht-charter/' + b.slug } }; }
  if (v.startsWith('a-')) { const a = artById(+v.slice(2)); return { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: a.title.th || a.title.en, description: a.seoD.th || a.seoD.en, image: base + '/images/blog-' + a.id + '.webp', datePublished: a.date, author: { '@type': 'Person', name: TEAM.find(t => t.id === a.author).name }, publisher: { '@type': 'Organization', name: o.name }, inLanguage: a.title.th ? 'th' : 'en' }; }
  if (v === 'faq') return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: WEB.faq.filter(([q, a]) => q.th && a.th).map(([q, a]) => ({ '@type': 'Question', name: q.th, acceptedAnswer: { '@type': 'Answer', text: a.th } })) };
}
function seoSchema() {
  const o = SCHEMA_ORG, f = (k, l, ph = '') => `<label><span class="lbl">${l}</span><input class="inp" value="${esc(o[k])}" placeholder="${ph}" oninput="SCHEMA_ORG.${k}=this.value;$('#ldOut').textContent=JSON.stringify(seoJsonLd(),null,2)"/></label>`;
  return `<div class="grid xl:grid-cols-2 gap-4 items-start">
    <div class="grid gap-4">
      <div class="rounded-xl ring-1 ring-line p-4 grid gap-3"><p class="font-medium flex items-center gap-2"><i data-lucide="building-2" class="w-4 h-4 text-maroon"></i>ข้อมูลธุรกิจ (ใช้ทุกหน้า)</p>
        <div class="grid sm:grid-cols-2 gap-3">${f('name', 'ชื่อธุรกิจ')}<label><span class="lbl">ประเภท</span><select class="inp" onchange="SCHEMA_ORG.type=this.value;$('#ldOut').textContent=JSON.stringify(seoJsonLd(),null,2)">${['TravelAgency', 'LocalBusiness', 'Organization'].map(t => `<option ${o.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>${f('phone', 'โทรศัพท์')}${f('email', 'อีเมล', 'ยังไม่ได้กรอก')}${f('street', 'ที่อยู่', 'ยังไม่ได้กรอก')}${f('city', 'เมือง')}${f('lat', 'Latitude', 'เช่น 7.88')}${f('lng', 'Longitude', 'เช่น 98.39')}${f('hours', 'เวลาทำการ')}</div>
        <div><p class="lbl">โซเชียล (sameAs)</p><div class="grid gap-2">${['Facebook', 'Instagram', 'YouTube'].map((s, n) => `<input class="inp" placeholder="ลิงก์ ${s}" value="${esc(o.social[n])}" oninput="SCHEMA_ORG.social[${n}]=this.value;$('#ldOut').textContent=JSON.stringify(seoJsonLd(),null,2)"/>`).join('')}</div></div></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="font-medium">Schema อัตโนมัติตามประเภทหน้า</p><div class="mt-2 grid gap-1">${[['หน้าแรก', 'Organization + WebSite + SearchAction', true], ['หน้าเรือ', 'Product + Offer (ราคาเริ่มต้น)', true], ['บทความ', 'BlogPosting', true], ['FAQ', 'FAQPage', true], ['ทุกหน้า', 'BreadcrumbList', true], ['กิจกรรม', 'TouristTrip', true]].map(([a, b, on]) => `<label class="flex items-center gap-3 py-1.5"><span class="w-20 text-muted text-[12px]">${a}</span><span class="flex-1">${b}</span><span class="tgl"><input type="checkbox" ${on ? 'checked' : ''}/><span></span></span></label>`).join('')}
        <label class="flex items-center gap-3 py-1.5 border-t border-line mt-1 pt-3"><span class="flex-1">คะแนนรีวิว (AggregateRating)<span class="block text-[11px] text-muted">เปิดได้เมื่อมีรีวิวจริงจากลูกค้าในระบบเท่านั้น · Google ลงโทษรีวิวที่สร้างขึ้นเอง</span></span><span class="tgl"><input type="checkbox" disabled/><span></span></span></label></div></div>
    </div>
    <div class="rounded-xl ring-1 ring-line overflow-hidden xl:sticky xl:top-20"><div class="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-line"><p class="font-medium flex-1">JSON-LD ที่จะใส่ในหน้า</p><select class="inp !h-8 !w-auto !text-[12px]" onchange="SEOV.prev=this.value;$('#ldOut').textContent=JSON.stringify(seoJsonLd(),null,2)">${[['org', 'ข้อมูลธุรกิจ'], ['b-leopard-90-ft', 'หน้าเรือ: Leopard 90 ft'], ['b-vtech-68-ft', 'หน้าเรือ: Vtech 68 ft'], ['a-1', 'บทความ: ' + ART[0].title.th.slice(0, 24) + '…'], ['faq', 'FAQ หน้าแรก']].map(([v, l]) => `<option value="${v}" ${SEOV.prev === v ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="btn btn-o !h-8" onclick="toast('ผ่านการตรวจ Rich Results (จำลอง)')">ทดสอบ</button></div>
      <pre id="ldOut" class="p-4 whitespace-pre-wrap break-words text-[11.5px] leading-relaxed bg-[#1d1416] text-[#f1e6e6] overflow-auto max-h-[560px]">${esc(JSON.stringify(seoJsonLd(), null, 2))}</pre></div></div>`;
}

function seoSitemap() {
  const P = seoPages().filter(p => !p.draft && !p.hidden && sx(p.id).index);
  const n = t => P.filter(p => t.includes(p.type)).length * (SMAP.hreflang ? 2 : 1);
  const maps = [['pages', 'sitemap-pages.xml', 'หน้าหลัก', n(['home', 'page'])], ['boats', 'sitemap-boats.xml', 'เรือ', n(['boat'])], ['blog', 'sitemap-blog.xml', 'บทความ', n(['article'])]];
  return `<div class="grid xl:grid-cols-2 gap-4 items-start">
    <div class="rounded-xl ring-1 ring-line"><div class="px-4 py-3 flex items-center justify-between"><div><p class="font-medium">Sitemap</p><p class="text-[11px] text-muted">${SITE}/sitemap.xml · อัปเดตอัตโนมัติเมื่อแก้เนื้อหา</p></div><button class="btn btn-o !h-8" onclick="navigator.clipboard?.writeText(location.origin+'/sitemap.xml');window.open('https://search.google.com/search-console/sitemaps','_blank');toast('คัดลอก URL sitemap แล้ว · วางในหน้า Sitemaps ของ Search Console')">ส่งให้ Google</button></div>
      ${maps.map(([k, f, l, c]) => `<div class="flex items-center gap-3 px-4 py-3 border-t border-line"><i data-lucide="file-code-2" class="w-4 h-4 text-muted"></i><div class="flex-1 min-w-0"><p class="truncate">${f}</p><p class="text-[11px] text-muted">${l} · ${c} URL</p></div><button class="btn btn-g !h-8" onclick="seoXml('${k}')">ดู XML</button><span class="tgl"><input type="checkbox" ${SMAP[k] ? 'checked' : ''} onchange="SMAP.${k}=this.checked"/><span></span></span></div>`).join('')}
      <div class="px-4 py-3 border-t border-line grid gap-2"><label class="flex items-center justify-between gap-3"><span>ใส่ hreflang th / en / x-default</span><span class="tgl"><input type="checkbox" ${SMAP.hreflang ? 'checked' : ''} onchange="SMAP.hreflang=this.checked;vSeo()"/><span></span></span></label><label class="flex items-center justify-between gap-3"><span>ใส่รูปภาพใน sitemap (Image sitemap)</span><span class="tgl"><input type="checkbox" ${SMAP.images ? 'checked' : ''}/><span></span></span></label>
      <p class="text-[11px] text-muted">หน้าที่ซ่อน, noindex และบทความฉบับร่าง จะไม่อยู่ใน sitemap</p></div></div>
    <div class="grid gap-4">
      <div class="rounded-xl ring-1 ring-line p-4"><div class="flex items-center justify-between"><p class="font-medium">robots.txt</p><button class="btn btn-g !h-8" onclick="ROBOTS.txt=$('#rbT').value;toast('บันทึกแล้ว · /robots.txt อัปเดตภายในไม่กี่วินาที')">บันทึก</button></div>
        <textarea id="rbT" rows="8" class="inp mt-2 font-mono !text-[12px]">${esc(ROBOTS.txt)}</textarea></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="font-medium flex items-center gap-2"><i data-lucide="bot" class="w-4 h-4 text-maroon"></i>AI crawlers</p><p class="text-[11px] text-muted mt-0.5">อนุญาตให้ AI อ่านเว็บ ช่วยให้ ChatGPT, Claude, Perplexity แนะนำเรือของเราได้</p>
        <div class="mt-2 grid gap-1">${Object.keys(ROBOTS.ai).map(b => `<label class="flex items-center justify-between gap-3 py-1"><span class="font-mono text-[12px]">${b}</span><span class="tgl"><input type="checkbox" ${ROBOTS.ai[b] ? 'checked' : ''} onchange="ROBOTS.ai['${b}']=this.checked"/><span></span></span></label>`).join('')}
        <label class="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-line"><span>สร้างไฟล์ /llms.txt <span class="block text-[11px] text-muted">สรุปเว็บ เรือ และราคาให้ AI อ่านง่าย</span></span><span class="tgl"><input type="checkbox" ${ROBOTS.llms ? 'checked' : ''} onchange="ROBOTS.llms=this.checked"/><span></span></span></label></div></div>
    </div></div>`;
}
function seoXml(k) {
  const P = seoPages().filter(p => !p.draft && !p.hidden && sx(p.id).index && ({ pages: ['home', 'page'], boats: ['boat'], blog: ['article'], activities: ['act'] })[k].includes(p.type)).slice(0, 3);
  const x = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` + P.map(p => `  <url>\n    <loc>https://${SITE}${p.url.th}</loc>\n    <lastmod>${iso(TODAY)}</lastmod>\n` + (SMAP.hreflang ? `    <xhtml:link rel="alternate" hreflang="th" href="https://${SITE}${p.url.th}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="https://${SITE}${p.url.en}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="https://${SITE}${p.url.th}"/>\n` : '') + `  </url>`).join('\n') + `\n  <!-- … -->\n</urlset>`;
  openModal(`<div class="p-5"><div class="flex items-center justify-between mb-3"><p class="font-medium">sitemap-${k}.xml (บางส่วน)</p><button class="btn btn-g !px-2" onclick="closeModal()"><i data-lucide="x" class="w-5 h-5"></i></button></div><pre class="p-4 rounded-xl text-[11px] leading-relaxed bg-[#1d1416] text-[#f1e6e6] overflow-auto max-h-[60vh]">${esc(x)}</pre></div>`);
}

function seoSettings() {
  const S = SSET, b = FLEET[0], fill = (t, k, key) => t.replace('%name%', key === 'act' ? (ACTS[0][k] || ACTS[0].th) : b.name).replace('%title%', ART[0].title[k] || ART[0].title.th).replace('%price%', k === 'th' ? baht(b.from_) : '$' + Math.round((b.from_ || 0) / 33.42).toLocaleString()).replace(/%sep%/g, S.sep).replace('%site%', S.site[k]);
  const tplRow = (key, l) => `<div class="grid gap-2"><p class="lbl !mb-0">${l}</p>${LANGS.map(([k, C]) => `<div class="grid sm:grid-cols-[1fr_1fr] gap-2 items-center"><div class="relative"><span class="bi-tag">${C}</span><input class="inp !pl-10 font-mono !text-[12px]" value="${esc(S.tpl[key][k])}" oninput="SSET.tpl.${key}.${k}=this.value;this.parentElement.nextElementSibling.textContent=seoFill(this.value,'${k}','${key}')"/></div><p class="text-[12px] text-[#1a0dab] truncate">${esc(fill(S.tpl[key][k], k, key))}</p></div>`).join('')}</div>`;
  const tg = (k, l, h) => `<label class="flex items-center justify-between gap-3 py-1.5"><span>${l}${h ? `<span class="block text-[11px] text-muted">${h}</span>` : ''}</span><span class="tgl"><input type="checkbox" ${S[k] ? 'checked' : ''} onchange="SSET.${k}=this.checked"/><span></span></span></label>`;
  const id = (k, l, ph) => `<label><span class="lbl">${l}</span><input class="inp font-mono !text-[12px]" placeholder="${ph}" value="${esc(S[k])}" onchange="SSET.${k}=this.value"/></label>`;
  return `<div class="grid xl:grid-cols-2 gap-4 items-start">
    <div class="rounded-xl ring-1 ring-line p-4 grid gap-4"><div class="flex items-center justify-between"><p class="font-medium">รูปแบบ Title อัตโนมัติ</p><label class="flex items-center gap-2 text-[12px]"><span class="text-muted">ตัวคั่น</span><select class="inp !h-8 !w-16" onchange="SSET.sep=this.value;vSeo()">${['|', '–', '·', '»'].map(s => `<option ${S.sep === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
      ${tplRow('boat', 'หน้าเรือ')}${tplRow('article', 'บทความ')}${tplRow('act', 'กิจกรรม')}
      <p class="text-[11px] text-muted">ตัวแปร: <span class="font-mono">%name% %title% %price% %sep% %site%</span> · ใช้เมื่อหน้านั้นไม่ได้ตั้ง Title เอง</p></div>
    <div class="grid gap-4">
      <div class="rounded-xl ring-1 ring-line p-4 grid gap-3"><p class="font-medium">ยืนยันเว็บ & ติดตามผล</p><div class="grid sm:grid-cols-2 gap-3">${id('gsc', 'Google Search Console', 'google-site-verification=…')}${id('bing', 'Bing Webmaster', 'msvalidate.01=…')}${id('ga4', 'Google Analytics 4', 'G-XXXXXXX')}${id('gtm', 'Google Tag Manager', 'GTM-XXXXXX')}${id('pixel', 'Meta Pixel', '123456789')}</div>
        <p class="text-[11px] text-muted">สคริปต์ติดตามโหลดหลังผู้ใช้ยอมรับคุกกี้เท่านั้น (ตาม PDPA)</p></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="font-medium mb-1">URL & เทคนิค</p>${tg('canon', 'ใส่ canonical อัตโนมัติทุกหน้า')}${tg('lower', 'บังคับ URL ตัวพิมพ์เล็ก', 'redirect /Yacht → /yacht อัตโนมัติ')}${tg('slash', 'ลงท้าย URL ด้วย /')}${tg('noSearch', 'noindex หน้าผลค้นหาและหน้าที่มีตัวกรอง', 'กันหน้าซ้ำจาก ?q= และ ?type=')}${tg('crumbs', 'แสดง breadcrumb + schema')}</div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="font-medium mb-1">รูปภาพ</p><label class="flex items-center justify-between gap-3 py-1.5"><span>แปลงเป็น WebP และย่อขนาดอัตโนมัติ</span><span class="tgl"><input type="checkbox" checked/><span></span></span></label><label class="flex items-center justify-between gap-3 py-1.5"><span>Lazy-load รูปที่อยู่ด้านล่าง</span><span class="tgl"><input type="checkbox" checked/><span></span></span></label><label class="flex items-center justify-between gap-3 py-1.5"><span>เตือนเมื่อรูปไม่มี Alt text ก่อนเผยแพร่</span><span class="tgl"><input type="checkbox" checked/><span></span></span></label></div>
    </div></div>`;
}
function seoBulkTitle() {
  let n = 0; const fill = (tpl, name, k, price) => tpl.replace('%name%', name).replace('%title%', name).replace('%price%', price || '').replace(/%sep%/g, SSET.sep).replace('%site%', SSET.site[k]).replace(/\s+/g, ' ').trim();
  seoPages().filter(p => !p.draft && !p.hidden).forEach(p => LANGS.forEach(([k]) => { if ((p.t[k] || '').trim()) return;
    const tpl = SSET.tpl[p.type === 'boat' ? 'boat' : p.type === 'article' ? 'article' : 'act'][k], nm = p.type === 'act' ? (k === 'en' ? ACTS[+p.id.slice(2)].en : ACTS[+p.id.slice(2)].th) || p.name : p.type === 'article' ? (p.art.title[k] || '') : p.name;
    if (!nm || p.type === 'page' || p.type === 'home') return;
    const b = p.type === 'boat' ? bySlug(p.id.slice(2)) : null;
    p.t[k] = fill(tpl, nm, k, b ? (k === 'th' ? baht(b.from_) : '$' + Math.round((b.from_ || 0) / 33.42).toLocaleString()) : ''); n++; }));
  toast(n ? `เติม Title ${n} ช่องจากรูปแบบที่ตั้งไว้ · Description ต้องเขียนเอง` : 'ไม่มี Title ที่ว่างแล้ว'); vSeo();
}
function seoFill(t, k, key) { const b = FLEET[0]; return t.replace('%name%', key === 'act' ? (ACTS[0][k] || ACTS[0].th) : b.name).replace('%title%', ART[0].title[k] || ART[0].title.th).replace('%price%', k === 'th' ? baht(b.from_) : '$' + Math.round((b.from_ || 0) / 33.42).toLocaleString()).replace(/%sep%/g, SSET.sep).replace('%site%', SSET.site[k]); }

/* ---------- SEO checklist inside the article editor ---------- */
function artSeoChecks() {
  const a = curA(); if (!a) return; const el = $('#artChecks'); if (!el) return;
  const k = AE.lang, kw = (a.kw[k] || '').toLowerCase().trim(), B = blocksOf(a, k), t = a.seoT[k] || a.title[k] || '', d = a.seoD[k] || a.excerpt[k] || '';
  const body = txtOf(a.body[k]).toLowerCase(), first = txtOf((B.find(b => b.t === 'p') || {}).html).toLowerCase(), len = k === 'th' ? body.replace(/\s/g, '').length : body.split(/\s+/).filter(Boolean).length;
  const imgs = B.flatMap(b => b.t === 'img' ? [b] : b.t === 'grid' ? b.cells.filter(c => c.src) : b.t === 'cols' ? b.cols.filter(c => c.k === 'img' && c.src) : []), noAlt = imgs.filter(x => !x.alt).length;
  const C = [
    [!!kw, 'ตั้งคีย์เวิร์ดหลักแล้ว'], [kw && t.toLowerCase().includes(kw), 'คีย์เวิร์ดอยู่ใน Title'], [kw && first.includes(kw), 'คีย์เวิร์ดอยู่ในย่อหน้าแรก'],
    [kw && B.some(b => b.t === 'h' && txtOf(b.html).toLowerCase().includes(kw)), 'คีย์เวิร์ดอยู่ในหัวข้อ H2/H3 อย่างน้อย 1 จุด'], [kw && (a.slug[k] || '').toLowerCase().includes(kw.replace(/\s+/g, '-')), 'คีย์เวิร์ดอยู่ใน URL'],
    [thLen(t) >= 25 && thLen(t) <= 60, `ความยาว Title 25–60 (ตอนนี้ ${thLen(t)})`], [thLen(d) >= 70 && thLen(d) <= 160, `ความยาว Description 70–160 (ตอนนี้ ${thLen(d)})`],
    [len >= (k === 'th' ? 800 : 300), `ความยาวเนื้อหา ${k === 'th' ? '≥ 800 ตัวอักษร' : '≥ 300 คำ'} (ตอนนี้ ${len})`], [B.some(b => b.t === 'h' && b.lv === 2), 'มีหัวข้อ H2 แบ่งเนื้อหา'],
    [imgs.length > 0, 'มีรูปประกอบ'], [imgs.length > 0 && !noAlt, noAlt ? `รูปไม่มี Alt text ${noAlt} รูป` : 'รูปทุกรูปมี Alt text'], [B.some(b => b.t === 'boat' || b.t === 'btn') || a.boats.length > 0, 'มีลิงก์ไปหน้าเรือ / ปุ่มจอง'],
  ];
  const ok = C.filter(c => c[0]).length, sc = Math.round(ok / C.length * 100);
  el.innerHTML = `<div class="flex items-center gap-3 mb-2">${ring(sc, 56)}<div><p class="font-medium">คะแนน SEO ของบทความ</p><p class="text-[11px] text-muted">ผ่าน ${ok}/${C.length} ข้อ · ${k.toUpperCase()}</p></div></div><ul class="grid gap-1.5 text-[12.5px]">${C.map(([p, l]) => `<li class="flex items-start gap-2"><i data-lucide="${p ? 'circle-check' : 'circle-dashed'}" class="w-3.5 h-3.5 mt-0.5 shrink-0 ${p ? 'text-[#1e7a46]' : 'text-[#b4501a]'}"></i><span class="${p ? 'text-muted' : ''}">${l}</span></li>`).join('')}</ul>`;
  icons();
}
const _vArticleEdit2 = vArticleEdit;
vArticleEdit = function (id) { _vArticleEdit2(id); const prev = $('#artPrev'); if (prev && !$('#artChecks')) { prev.parentElement.insertAdjacentHTML('afterend', '<div id="artChecks" class="rounded-xl bg-sand/60 p-4"></div>'); } artSeoChecks(); };
const _artSeoPrev = artSeoPrev; artSeoPrev = function (a) { _artSeoPrev(a); clearTimeout(artSeoPrev.t); artSeoPrev.t = setTimeout(artSeoChecks, 250); };
const _edSave = edSave; edSave = function () { _edSave(); clearTimeout(edSave.t); edSave.t = setTimeout(artSeoChecks, 400); };

/* ---------- register ---------- */
PAGES.splice(PAGES.findIndex(p => p[0] === 'articles') + 1, 0, ['seo', 'SEO', 'search-check', vSeo]);


/* =====================================================================
   SHARE IMAGE (Open Graph) for boat pages – photo / auto card / upload
   ===================================================================== */
const OGV = { lang: 'th' };
const ogOf = b => b.og ??= { mode: 'card', pos: 'center', src: '', price: true, pax: true, t: tr(), d: tr() };
const usd = n => '$' + Math.round((n || 0) / 33.42).toLocaleString();
/* 1200×630 preview; the real site renders the same layout server-side (Next.js /og route) */
function ogHtml(b, k = 'th', round = '') {
  const hero = b.imgs?.[0] || THUMBS[b.slug];   // the boat's cover = its first photo (THUMBS prefers the '-a' shot for list thumbnails)
  const o = ogOf(b), photo = o.mode === 'upload' && o.src ? o.src : hero, pos = { top: 'center top', center: 'center', bottom: 'center bottom' }[o.pos];
  const base = `<div class="og ${round}" style="container-type:inline-size">`;
  if (o.mode !== 'card') return base + `<img src="${photo}" style="object-position:${pos}"/></div>`;
  const logo = $('#side img')?.src || '';
  return base + `<img src="${hero}" style="object-position:${pos}"/><div class="og-shade"></div>
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



/* =====================================================================
   SEASON CALENDARS – date ranges per season, used by the website to show
   only the price that applies on the guest's date
   ===================================================================== */
/* ---------- Season calendars (set in admin → ฤดูกาลราคา) ---------- */
const SZ = window.SEASONS;
const SKEY = { low: { th: 'Low Season', en: 'Low Season' }, high: { th: 'High Season', en: 'High Season' }, peak: { th: 'Peak Season', en: 'Peak Season' }, special: { th: 'ช่วงพิเศษ', en: 'Special dates' }, all: { th: 'ราคาทั้งปี', en: 'All year' } };
const SORDER = ['low', 'high', 'peak', 'special', 'all'];
const SCOL = { low: '#e3c3c7', high: '#a33a47', peak: '#3a0007', special: '#c98a1d', all: '#d9cfcf', gap: '#ffffff' };
const M_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'], M_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const isoOf = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const todayISO = () => isoOf(new Date());
const calById = id => SZ.calendars.find(c => c.id === id) || SZ.calendars.find(c => c.id === 'all');
const calOf = slug => calById(SZ.boats[slug] || 'all');
const mdIn = (md, a, b) => a <= b ? (md >= a && md <= b) : (md >= a || md <= b);
const rIn = (iso, f, t) => f.length > 5 ? (iso >= f && iso <= t) : mdIn(iso.slice(5), f, t);
const specialAt = (cal, iso) => (cal.special || []).find(s => rIn(iso, s.from, s.to)) || null;
function baseSeason(cal, iso) { if (cal.kind !== 'season') return 'all'; for (const k of ['peak', 'high', 'low']) if ((cal.ranges[k] || []).some(([f, t]) => rIn(iso, f, t))) return k; return null; }
function colKey(h) { h = (h || '').toLowerCase(); if (/peak/.test(h)) return 'peak'; if (/high/.test(h)) return 'high'; if (/low/.test(h)) return 'low'; if (/except/.test(h)) return 'all'; if (/special|surcharge/.test(h)) return 'special'; if (/all years?/.test(h)) return 'all'; return null; }
function tableKeys(slug, tb) { const ov = (SZ.colmap || {})[slug]; return tb.columns.map((c, i) => i ? (ov ? ov[i] : colKey(c)) : null); }
const isSeasonTable = ks => ks.some(k => k && k !== 'all') && ks.filter(Boolean).length > 1 || ks.some(k => k === 'special');
/* which key to show for a boat on a date */
function seasonView(b, iso) {
  const cal = calOf(b.slug), base = baseSeason(cal, iso), sp = specialAt(cal, iso);
  const hasSpecialCol = b.tables.some(tb => tableKeys(b.slug, tb).includes('special'));
  const key = sp && hasSpecialCol ? 'special' : base;
  return { cal, base, sp, key, add: sp && cal.add ? cal.add : 0, addHalf: sp && cal.add ? cal.addHalf || 0 : 0 };
}
/* half-day surcharge rules — same as src/lib/season.ts and the public site */
const isHalfDay = (tb, ci, r) => { const h = tb.columns[ci] || ''; if (/half/i.test(h)) return true; if (/full/i.test(h)) return false; return /half/i.test((r && r[0]) || '') || /half/i.test(tb.caption || ''); };
const szAdd = (v, tb, ci, r) => !v || !v.add ? 0 : v.addHalf && isHalfDay(tb, ci, r) ? v.addHalf : v.add;
function colFor(b, tb, key, base) { const ks = tableKeys(b.slug, tb); let ci = ks.indexOf(key); if (ci < 0 && key === 'special') ci = ks.indexOf(base); if (ci < 0 && key !== 'all') ci = -1; return ci; }
function boatKeys(b) { const s = new Set(); b.tables.forEach(tb => { const ks = tableKeys(b.slug, tb); if (isSeasonTable(ks)) ks.forEach(k => k && s.add(k)); }); return SORDER.filter(k => s.has(k)); }
const fmtMD = (s, lang) => { const p = s.split('-'), y = p.length === 3 ? p[0] : null, m = +p[p.length - 2], d = +p[p.length - 1]; return `${d} ${(lang === 'en' ? M_EN : M_TH)[m - 1]}${y ? ' ' + (lang === 'en' ? y : String(+y + 543).slice(2)) : ''}`; };
function rangeText(cal, key, lang = 'th') {
  if (key === 'special') return (cal.special || []).map(s => `${fmtMD(s.from, lang)}–${fmtMD(s.to, lang)}`).join(', ');
  if (key === 'all') return lang === 'en' ? 'All year' : 'ทั้งปี';
  return (cal.ranges?.[key] || []).map(([f, t]) => `${fmtMD(f, lang)}–${fmtMD(t, lang)}`).join(', ');
}
function nextSeason(cal, iso) { const d = new Date(iso + 'T00:00:00'); for (let i = 1; i < 370; i++) { const x = isoOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)), k = baseSeason(cal, x); if (k) return { key: k, from: x }; } return null; }
/* minimum price for the season that applies today (falls back to the brochure minimum) */
function nowFrom(b, iso = todayISO()) {
  const v = seasonView(b, iso), nums = [];
  if (!v.key && boatKeys(b).length) { const nx = nextSeason(v.cal, iso); if (nx) v.key = v.base = nx.key; }
  b.tables.forEach(tb => { const ks = tableKeys(b.slug, tb);
    if (!isSeasonTable(ks)) tb.rows.forEach(r => r.slice(1).forEach((c, i) => { const n = priceNum(c); if (n) nums.push(n + szAdd(v, tb, i + 1, r)); }));
    else { const ci = colFor(b, tb, v.key, v.base); if (ci > 0) tb.rows.forEach(r => { const n = priceNum(r[ci]); if (n) nums.push(n); }); } });
  return nums.length ? Math.min(...nums) : null;
}
/* colour strip for a calendar year (hard-stop gradient) */
function stripBg(cal, year) {
  const stops = [], days = (new Date(year, 11, 31) - new Date(year, 0, 1)) / 864e5 + 1; let prev = null, start = 0;
  for (let i = 0; i < days; i++) { const iso = isoOf(new Date(year, 0, 1 + i)), sp = specialAt(cal, iso); const k = sp ? 'special' : (baseSeason(cal, iso) || 'gap');
    if (k !== prev) { if (prev) stops.push(`${SCOL[prev]} ${(start / days * 100).toFixed(2)}% ${(i / days * 100).toFixed(2)}%`); prev = k; start = i; } }
  stops.push(`${SCOL[prev]} ${(start / days * 100).toFixed(2)}% 100%`);
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}
function stripKeys(cal, year) { const s = new Set(); for (let i = 0; i < 366; i++) { const d = new Date(year, 0, 1 + i); if (d.getFullYear() !== year) break; const iso = isoOf(d); s.add(specialAt(cal, iso) ? 'special' : (baseSeason(cal, iso) || 'gap')); } return [...SORDER, 'gap'].filter(k => s.has(k)); }
function stripHTML(cal, iso, lang = 'th', opts = {}) {
  const y = +(iso || todayISO()).slice(0, 4), d0 = new Date(y, 0, 1), dd = new Date((iso || todayISO()) + 'T00:00:00'), pos = ((dd - d0) / 864e5) / ((new Date(y, 11, 31) - d0) / 864e5 + 1) * 100;
  const lab = k => k === 'gap' ? (lang === 'en' ? 'No rate listed' : 'ไม่มีราคาในเอกสาร') : SKEY[k][lang];
  return `<div class="sz-strip-wrap"><div class="sz-strip" style="background:${stripBg(cal, y)}">${opts.marker === false ? '' : `<span class="sz-now" style="left:${pos}%"></span>`}</div>
    <div class="sz-months">${(lang === 'en' ? M_EN : M_TH).map(m => `<span>${m}</span>`).join('')}</div>
    ${opts.legend === false ? '' : `<div class="sz-legend">${stripKeys(cal, y).map(k => `<span><i style="background:${SCOL[k]}"${k === 'gap' ? ' class="gap"' : ''}></i>${lab(k)}</span>`).join('')}</div>`}</div>`;
}
const SZ_CSS = `.sz-strip-wrap{min-width:0}.sz-strip{position:relative;height:10px;border-radius:99px;box-shadow:inset 0 0 0 1px rgb(35 20 22/.1)}
.sz-now{position:absolute;top:-4px;bottom:-4px;width:2px;margin-left:-1px;border-radius:2px;background:#231416;box-shadow:0 0 0 2px #fff}
.sz-months{display:grid;grid-template-columns:repeat(12,1fr);margin-top:5px;font-size:10px;color:#8a7a7c}.sz-months span{text-align:left;padding-left:2px}
.sz-legend{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:8px;font-size:11px;color:#6b5e60}.sz-legend span{display:inline-flex;align-items:center;gap:5px}
.sz-legend i{display:inline-block;width:12px;height:8px;border-radius:3px}.sz-legend i.gap{box-shadow:inset 0 0 0 1px #c47a82}`;
(() => { const s = document.createElement('style'); s.textContent = SZ_CSS; document.head.appendChild(s); })();

const SZV = { edit: null };
const MDS = (md, th = true) => fmtMD(md, th ? 'th' : 'en');
function gapRanges(cal, year) {
  if (cal.kind !== 'season') return [];
  const out = []; let st = null;
  for (let i = 0; i < 366; i++) { const d = new Date(year, 0, 1 + i); if (d.getFullYear() !== year) break; const iso = isoOf(d), gap = !baseSeason(cal, iso);
    if (gap && !st) st = iso; if (!gap && st) { out.push([st, isoOf(new Date(year, 0, i))]); st = null; } }
  if (st) out.push([st, `${year}-12-31`]);
  return out;
}
const rTxt = ([a, b]) => a === b ? MDS(a.slice(5)) : `${MDS(a.slice(5))}–${MDS(b.slice(5))}`;
function calIssues(cal) {
  const y = TODAY.getFullYear(), out = [], today = iso(TODAY);
  const g = gapRanges(cal, y); if (g.length) out.push(['err', `มีช่วงวันที่ไม่มีราคา: ${g.map(rTxt).join(', ')}`, 'gap']);
  if (cal.kind === 'season' && !(cal.ranges.low || []).length) out.push(['warn', 'ไม่มีราคา Low Season · ช่วงนั้นหน้าเว็บแสดง “สอบถามราคา” และราคาฤดูถัดไป', 'nolow']);
  const old = (cal.special || []).filter(s => s.to.length > 5 && s.to < today); if (old.length) out.push(['err', `ช่วงพิเศษหมดอายุแล้ว ${old.length} ช่วง (${old.map(s => s.label).join(', ')}) · ต้องใส่วันที่ปี ${y + 543 - (TODAY.getMonth() < 6 ? 1 : 0)}/${String(y + 544).slice(2)}`, 'old']);
  if (cal.kind === 'season') { const ov = []; for (let i = 0; i < 365; i++) { const d = isoOf(new Date(y, 0, 1 + i)); if ((cal.ranges.peak || []).some(([f, t]) => rIn(d, f, t)) && (cal.ranges.high || []).some(([f, t]) => rIn(d, f, t))) ov.push(d); }
    if (ov.length && (cal.ranges.high || []).length > 1) out.push(['note', `High กับ Peak ซ้อนกัน ${ov.length} วัน · ระบบใช้ราคา Peak`, 'ov']); }
  if (/หมายเหตุ/.test(cal.src || '')) out.push(['note', 'หัวตารางในโบรชัวร์ไม่ระบุวัน · ช่วงเดือนอ่านจากหมายเหตุของเรือ ควรยืนยันกับเจ้าของเรือ', 'infer']);
  return out;
}
const boatsIn = id => FLEET.filter(b => (SZ.boats[b.slug] || 'all') === id);
const curKeyLabel = cal => { const t = iso(TODAY), sp = specialAt(cal, t), k = baseSeason(cal, t); return sp ? `ช่วงพิเศษ · ${sp.label}` : k ? SKEY[k].th : '<span class="text-[#a3222c]">ไม่มีราคา</span>'; };
const LEG = `<div class="sz-legend !mt-0">${['low', 'high', 'peak', 'special', 'all'].map(k => `<span><i style="background:${SCOL[k]}"></i>${SKEY[k].th}</span>`).join('')}<span><i class="gap" style="background:#fff"></i>ไม่มีราคาในเอกสาร</span><span><i style="background:#231416;width:2px"></i>วันนี้</span></div>`;

function vSeasons() {
  const cals = SZ.calendars, issues = cals.flatMap(c => calIssues(c).map(i => ({ c, i })));
  const nSeason = FLEET.filter(b => calOf(b.slug).kind === 'season').length;
  $('#view').innerHTML = `${head('ฤดูกาลราคา', 'ตั้งช่วงวันที่ของแต่ละฤดู · หน้าเว็บแสดงเฉพาะราคาของวันที่ลูกค้าเลือก (หรือวันนี้)', `<button class="btn btn-p" onclick="szNew()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>สร้างปฏิทินใหม่</button>`)}
    <div class="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
      <div class="card">
        <div class="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p class="font-medium">ปฏิทินราคา ${cals.length} แบบ</p><p class="text-[12px] text-muted mt-0.5">เรือแต่ละลำผูกกับ 1 ปฏิทิน · แก้ปฏิทินเดียว ใช้กับเรือทุกลำในกลุ่ม</p></div>${LEG}</div>
        ${cals.map(c => { const bs = boatsIn(c.id), iss = calIssues(c), e = iss.filter(x => x[0] === 'err').length;
          return `<button class="w-full text-left px-5 py-4 border-b border-line last:border-0 hover:bg-[#fcfafa] grid md:grid-cols-[230px_minmax(0,1fr)] gap-3 md:gap-6 items-center" onclick="szEdit('${c.id}')">
            <div class="min-w-0"><div class="flex items-center gap-2"><p class="font-medium truncate">${esc(c.name)}</p>${e ? `<span class="lang-b low">${e} ต้องแก้</span>` : ''}</div>
              <p class="text-[11.5px] text-muted mt-0.5">${c.kind === 'season' ? 'แยกราคาตามฤดู' : c.add ? `ราคาเดียว + ${c.addHalf && c.addHalf !== c.add ? `${baht(c.addHalf)} (Half) / ${baht(c.add)} (Full)` : baht(c.add)} ช่วงพิเศษ` : c.special ? 'ราคาเดียว + คอลัมน์ช่วงพิเศษ' : 'ราคาเดียวทั้งปี'} · ${bs.length} ลำ</p>
              <div class="flex items-center gap-1 mt-2">${bs.slice(0, 5).map(b => `<img src="${THUMBS[b.slug]}" title="${esc(b.name)}" class="w-7 h-5 rounded object-cover"/>`).join('')}${bs.length > 5 ? `<span class="text-[11px] text-muted ml-1">+${bs.length - 5}</span>` : ''}</div></div>
            <div class="min-w-0"><div class="flex justify-between text-[11.5px] mb-1.5"><span class="text-muted truncate">${c.kind === 'season' ? ['low', 'high', 'peak'].filter(k => (c.ranges[k] || []).length).map(k => `${SKEY[k].th.replace(' Season', '')} ${rangeText(c, k)}`).join(' · ') : (c.special ? 'พิเศษ ' + rangeText(c, 'special') : 'ทั้งปี')}</span><span class="shrink-0 ml-3">วันนี้: ${curKeyLabel(c)}</span></div>${stripHTML(c, iso(TODAY), 'th', { legend: false })}</div></button>`; }).join('')}
      </div>
      <div class="grid gap-4">
        <div class="card p-5"><p class="font-medium flex items-center gap-2"><i data-lucide="file-search" class="w-4 h-4 text-maroon"></i>ผลตรวจจากโบรชัวร์ 70 ลำ</p>
          <ul class="mt-3 grid gap-2 text-[12.5px]">
            <li class="flex gap-2"><i data-lucide="info" class="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted"></i><span>ช่วงเวลา<b class="font-medium">ไม่ตรงกันทุกลำ</b> · มีราคาแยกฤดู ${nSeason} ลำ (${cals.filter(c => c.kind === 'season').length} แบบ) ส่วนอีก ${FLEET.length - nSeason} ลำใช้ราคาเดียวทั้งปี</span></li>
            ${issues.map(({ c, i }) => `<li class="flex gap-2 cursor-pointer hover:text-maroon" onclick="szEdit('${c.id}')"><i data-lucide="${LV[i[0]][2]}" class="w-3.5 h-3.5 mt-0.5 shrink-0 ${i[0] === 'err' ? 'text-[#a3222c]' : i[0] === 'warn' ? 'text-[#b4501a]' : 'text-muted'}"></i><span><b class="font-medium">${esc(c.name)}</b> (${boatsIn(c.id).length} ลำ) · ${i[1]}</span></li>`).join('')}
          </ul></div>
        <div class="card p-5 text-[12.5px] text-muted grid gap-2"><p class="text-ink font-medium text-[13px]">หน้าเว็บทำงานอย่างไร</p>
          <p>1. ลูกค้าเปิดหน้าเรือ ระบบดูวันนี้ (หรือวันที่ลูกค้าเลือก) แล้วแสดงเฉพาะคอลัมน์ราคาของฤดูนั้น</p><p>2. ลูกค้ากดดูฤดูอื่นได้ด้วยปุ่ม Low / High / Peak</p><p>3. ราคา “เริ่มต้น” บนการ์ดเรือ ใช้ราคาฤดูปัจจุบัน</p><p>4. ถ้าวันที่ตกช่องว่าง จะขึ้น “สอบถามราคา” และแสดงราคาฤดูถัดไป</p><p>5. ลำดับเมื่อช่วงซ้อนกัน: ช่วงพิเศษ › Peak › High › Low</p></div>
      </div></div>`;
  icons();
}

/* ---------- editor ---------- */
const MONTHS_O = n => TH_M.map((m, i) => `<option value="${i + 1}" ${i + 1 === n ? 'selected' : ''}>${m}</option>`).join('');
const mdPick = (v, on) => { const [m, d] = v.split('-').map(Number); return `<span class="inline-flex gap-1"><input type="number" min="1" max="31" value="${d}" class="inp !w-14 !px-2 text-center" onchange="${on}(this,'d')"/><select class="inp !w-[78px] !pr-6 !pl-2" onchange="${on}(this,'m')">${MONTHS_O(m)}</select></span>`; };
function szSetMD(path, el, part) { const [k, i, j] = path.split('.'), r = SZV.edit.ranges[k][+i]; const [m, d] = r[+j].split('-'); const v = +el.value; r[+j] = part === 'd' ? `${m}-${String(Math.min(31, Math.max(1, v))).padStart(2, '0')}` : `${String(v).padStart(2, '0')}-${d}`; szDraw(); }
function szEdit(id) { SZV.edit = JSON.parse(JSON.stringify(calById(id))); SZV.orig = id; szDraw(true); }
function szNew() { SZV.edit = { id: 'c' + Date.now().toString(36), name: 'ปฏิทินใหม่', kind: 'season', ranges: { low: [['05-01', '10-31']], high: [['11-01', '04-30']], peak: [['12-20', '01-10']] }, special: [] }; SZV.orig = null; szDraw(true); }
function szDraw(open) {
  const c = SZV.edit, iss = calIssues(c), bs = SZV.orig ? boatsIn(SZV.orig) : [];
  const ranges = k => `<div class="rounded-xl ring-1 ring-line p-3"><div class="flex items-center justify-between mb-2"><span class="flex items-center gap-2 font-medium text-[13px]"><i class="inline-block w-3 h-3 rounded" style="background:${SCOL[k]}"></i>${SKEY[k].th}</span><button class="btn btn-g !h-7" onclick="(SZV.edit.ranges.${k}??=[]).push(['01-01','01-31']);szDraw()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มช่วง</button></div>
    ${(c.ranges[k] || []).map((r, i) => `<div class="flex flex-wrap items-center gap-2 py-1">${mdPick(r[0], `szSetMD.bind(null,'${k}.${i}.0')`)}<span class="text-muted">ถึง</span>${mdPick(r[1], `szSetMD.bind(null,'${k}.${i}.1')`)}<button class="btn btn-g !px-1.5 !h-8 ml-auto" onclick="SZV.edit.ranges.${k}.splice(${i},1);szDraw()"><i data-lucide="x" class="w-4 h-4"></i></button></div>`).join('') || '<p class="text-[12px] text-muted">ไม่มีราคาฤดูนี้</p>'}</div>`;
  const sp = (c.special || []).map((s, i) => { const rec = s.from.length === 5, y = TODAY.getFullYear();
    return `<div class="rounded-xl ring-1 ring-line p-3 grid gap-2"><div class="flex gap-2"><input class="inp" value="${esc(s.label)}" placeholder="ชื่อช่วง เช่น ตรุษจีน" onchange="SZV.edit.special[${i}].label=this.value"/><button class="btn btn-g !px-1.5" onclick="SZV.edit.special.splice(${i},1);szDraw()"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>
      <div class="flex flex-wrap items-center gap-2">${rec ? `${mdPick(s.from, `szSp.bind(null,${i},'from')`)}<span class="text-muted">ถึง</span>${mdPick(s.to, `szSp.bind(null,${i},'to')`)}` : `<input type="date" class="inp !w-auto ${s.to < iso(TODAY) ? 'bi-miss' : ''}" value="${s.from}" onchange="SZV.edit.special[${i}].from=this.value;szDraw()"/><span class="text-muted">ถึง</span><input type="date" class="inp !w-auto ${s.to < iso(TODAY) ? 'bi-miss' : ''}" value="${s.to}" onchange="SZV.edit.special[${i}].to=this.value;szDraw()"/>`}
        <label class="flex items-center gap-2 text-[12px] ml-auto"><span class="tgl"><input type="checkbox" ${rec ? 'checked' : ''} onchange="const s=SZV.edit.special[${i}];if(this.checked){s.from=s.from.slice(5);s.to=s.to.slice(5)}else{s.from=${y}+'-'+s.from;s.to=(s.to<s.from?${y + 1}:${y})+'-'+s.to}szDraw()"/><span></span></span>ซ้ำทุกปี</label></div>
      ${!rec && s.to < iso(TODAY) ? `<p class="text-[11.5px] text-[#a3222c]">หมดอายุแล้ว · ใส่วันที่ของปีนี้</p>` : ''}</div>`; }).join('');
  const html = `<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div class="min-w-0"><p class="text-[11px] text-muted">ปฏิทินราคา</p><p class="font-medium truncate">${esc(c.name)}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 grid gap-4 content-start">
      <div class="grid grid-cols-[1fr_auto] gap-2"><label><span class="lbl">ชื่อปฏิทิน</span><input class="inp" value="${esc(c.name)}" onchange="SZV.edit.name=this.value"/></label><label><span class="lbl">รูปแบบราคา</span><select class="inp !w-auto" onchange="SZV.edit.kind=this.value;SZV.edit.ranges??={};szDraw()"><option value="season" ${c.kind === 'season' ? 'selected' : ''}>แยกตามฤดู</option><option value="allyear" ${c.kind !== 'season' ? 'selected' : ''}>ราคาเดียวทั้งปี</option></select></label></div>
      <div class="rounded-xl bg-sand/70 p-4">${stripHTML(c, iso(TODAY))}</div>
      ${iss.length ? `<ul class="grid gap-1.5 text-[12.5px]">${iss.map(i => `<li class="flex gap-2"><i data-lucide="${LV[i[0]][2]}" class="w-3.5 h-3.5 mt-0.5 shrink-0 ${i[0] === 'err' ? 'text-[#a3222c]' : i[0] === 'warn' ? 'text-[#b4501a]' : 'text-muted'}"></i><span class="flex-1">${i[1]}</span>${i[2] === 'gap' && (c.ranges.low || []).length === 1 ? `<button class="text-maroon text-[12px] whitespace-nowrap underline" onclick="szFillGap()">ขยาย Low ให้เต็ม</button>` : ''}</li>`).join('')}</ul>` : '<p class="text-[12.5px] text-[#1e7a46] flex items-center gap-2"><i data-lucide="circle-check" class="w-4 h-4"></i>ครอบคลุมทั้งปี ไม่มีช่องว่าง</p>'}
      ${c.kind === 'season' ? ['low', 'high', 'peak'].map(ranges).join('') : `<div class="grid sm:grid-cols-2 gap-3"><label class="block"><span class="lbl">บวกเพิ่มช่วงพิเศษ · Full day / ทุกโปรแกรม (บาท)</span><input class="inp" type="number" value="${c.add || ''}" placeholder="เว้นว่างถ้ามีคอลัมน์ราคาพิเศษในตาราง" onchange="SZV.edit.add=+this.value||0;szDraw()"/></label><label class="block"><span class="lbl">บวกเพิ่มช่วงพิเศษ · Half day (บาท)</span><input class="inp" type="number" value="${c.addHalf || ''}" placeholder="เว้นว่าง = เท่ากับ Full day" onchange="SZV.edit.addHalf=+this.value||0;szDraw()"/></label></div><p class="text-[11px] text-muted -mt-2">ระบบดูว่าเป็น Half day จากหัวคอลัมน์ราคา (เช่น “Half Day Morning”) ถ้าไม่มี ดูจากชื่อโปรแกรม</p>`}
      <div><div class="flex items-center justify-between mb-2"><p class="font-medium text-[13px]">ช่วงพิเศษ / Surcharge</p><button class="btn btn-g !h-7" onclick="(SZV.edit.special??=[]).push({label:'',from:'${iso(TODAY)}',to:'${iso(addDays(TODAY, 7))}'});szDraw()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มช่วง</button></div><div class="grid gap-2">${sp || '<p class="text-[12px] text-muted">ไม่มี</p>'}</div><p class="text-[11px] text-muted mt-2">ใช้กับเทศกาล เช่น ตรุษจีน วันชาติจีน ปีใหม่ · ระบบใช้ราคาช่วงพิเศษก่อนราคาฤดู</p></div>
      ${c.src ? `<div class="rounded-xl bg-sand p-3 text-[12px]"><p class="text-muted">ข้อความในโบรชัวร์</p><p class="mt-1 font-mono text-[11.5px]">${esc(c.src)}</p></div>` : ''}
      <div><p class="font-medium text-[13px] mb-2">เรือที่ใช้ปฏิทินนี้ · ${bs.length} ลำ</p><div class="flex flex-wrap gap-1.5">${bs.map(b => `<span class="inline-flex items-center gap-1.5 h-7 pl-1 pr-2.5 rounded-full bg-sand text-[12px]"><img src="${THUMBS[b.slug]}" class="w-5 h-5 rounded-full object-cover"/>${esc(b.name)}</span>`).join('')}</div>
        <select class="inp mt-2" onchange="if(this.value){SZ.boats[this.value]=SZV.orig||SZV.edit.id;toast('ย้ายเรือมาใช้ปฏิทินนี้แล้ว');szDraw()}"><option value="">+ ย้ายเรือลำอื่นมาใช้ปฏิทินนี้</option>${FLEET.filter(b => (SZ.boats[b.slug] || 'all') !== (SZV.orig || SZV.edit.id)).map(b => `<option value="${b.slug}">${esc(b.name)} · ตอนนี้: ${esc(calOf(b.slug).name)}</option>`).join('')}</select></div>
    </div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeDrawer()">ยกเลิก</button><button class="btn btn-p" onclick="szSave()">บันทึก</button></div>`;
  if (open) openDrawer(html); else { const sc = $('#drawer .overflow-y-auto')?.scrollTop || 0; $('#drawer').innerHTML = html; $('#drawer .overflow-y-auto').scrollTop = sc; icons(); }
}
function szSp(i, f, el, part) { const s = SZV.edit.special[i]; const [m, d] = s[f].split('-'); const v = +el.value; s[f] = part === 'd' ? `${m}-${String(v).padStart(2, '0')}` : `${String(v).padStart(2, '0')}-${d}`; szDraw(); }
function szFillGap() { const c = SZV.edit, H = (c.ranges.high || []).map(r => r[0]).sort(), hs = H.find(x => x > '04-30') || '11-01', he = (c.ranges.high || []).map(r => r[1]).filter(x => x < '07-01').sort().pop() || '04-30';
  const nx = d => { const x = new Date(2026, +d.slice(0, 2) - 1, +d.slice(3) + 1); return isoOf(x).slice(5); }, pv = d => { const x = new Date(2026, +d.slice(0, 2) - 1, +d.slice(3) - 1); return isoOf(x).slice(5); };
  c.ranges.low = [[nx(he), pv(hs)]]; toast(`Low Season = ${MDS(c.ranges.low[0][0])}–${MDS(c.ranges.low[0][1])}`); szDraw(); }
function szSave() { const c = SZV.edit, i = SZ.calendars.findIndex(x => x.id === (SZV.orig || c.id)); if (i >= 0) SZ.calendars[i] = c; else SZ.calendars.push(c); FLEET.forEach(b => { b.szNow = seasonView(b, iso(TODAY)); }); closeDrawer(); vSeasons(); toast('บันทึกแล้ว · หน้าเว็บใช้ช่วงวันที่ใหม่ทันที'); }

/* ---------- boat editor → prices tab: calendar + column mapping ---------- */
const _vBoatEdit4 = vBoatEdit;
vBoatEdit = function (slug) {
  _vBoatEdit4(slug);
  if (BE.tab !== 'prices') return;
  const b = bySlug(slug), first = $('#view .rounded-xl.ring-1.ring-line.overflow-hidden.mb-5'); if (!first) return;
  const cal = calOf(slug), keys = ['', 'low', 'high', 'peak', 'special', 'all'], kl = { '': 'ไม่ใช่ฤดู', low: 'Low', high: 'High', peak: 'Peak', special: 'ช่วงพิเศษ', all: 'ทั้งปี' };
  first.insertAdjacentHTML('beforebegin', `<div class="rounded-xl ring-1 ring-line p-4 mb-5 grid gap-4">
    <div class="flex flex-col sm:flex-row sm:items-end gap-3"><label class="flex-1"><span class="lbl">ปฏิทินราคา (ช่วงวันที่ของแต่ละฤดู)</span><select class="inp" onchange="SZ.boats['${slug}']=this.value;vBoatEdit('${slug}');toast('เปลี่ยนปฏิทินราคาแล้ว')">${SZ.calendars.map(c => `<option value="${c.id}" ${c.id === cal.id ? 'selected' : ''}>${esc(c.name)} · ${boatsIn(c.id).length} ลำ</option>`).join('')}</select></label><button class="btn btn-o" onclick="go('seasons');setTimeout(()=>szEdit('${cal.id}'),50)"><i data-lucide="calendar-range" class="w-3.5 h-3.5"></i>แก้ช่วงวันที่</button></div>
    ${stripHTML(cal, iso(TODAY))}
    <div><p class="lbl">คอลัมน์ราคาในตาราง → ฤดู</p><div class="grid gap-2">${b.tables.map((tb, ti) => { const ks = tableKeys(slug, tb); return `<div class="flex flex-wrap items-center gap-2 text-[12px]"><span class="text-muted w-16">ตาราง ${ti + 1}</span>${tb.columns.slice(1).map((c, ci) => `<label class="inline-flex items-center gap-1.5 rounded-lg bg-sand pl-2.5 pr-1 py-1"><span class="truncate max-w-[180px]" title="${esc(c)}">${esc(c)}</span><select class="eb-sel !h-6 !bg-white" onchange="const m=(SZ.colmap??={})['${slug}']??=bySlug('${slug}').tables[${ti}].columns.map((x,i)=>i?colKey(x):null);m[${ci + 1}]=this.value||null;toast('บันทึกการจับคู่คอลัมน์แล้ว')">${keys.map(k => `<option value="${k}" ${(ks[ci + 1] || '') === k ? 'selected' : ''}>${kl[k]}</option>`).join('')}</select></label>`).join('')}</div>`; }).join('')}</div>
      <p class="text-[11px] text-muted mt-2">ระบบจับคู่จากหัวตารางในโบรชัวร์อัตโนมัติ · คอลัมน์ “ไม่ใช่ฤดู” (เช่น ครึ่งวัน/เต็มวัน, จำนวนคน) จะแสดงทุกคอลัมน์ตามเดิม</p></div></div>`);
  icons();
};

PAGES.splice(PAGES.findIndex(p => p[0] === 'boats') + 1, 0, ['seasons', 'ฤดูกาลราคา', 'calendar-range', vSeasons]);



/* =====================================================================
   HOME SEO: live Google preview (TH/EN, desktop/mobile) + SEO score
   ===================================================================== */
WEB.seo.kw ??= tr('yacht charter ภูเก็ต', 'yacht charter phuket');
const HS = { dev: 'desk' };
const favSrc = () => $('link[rel=icon]')?.href || '';
function homeChecks(k) {
  const S = WEB.seo, t = (S.title[k] || '').trim(), d = (S.desc[k] || '').trim(), kw = (S.kw[k] || '').trim().toLowerCase();
  const tl = thLen(t), dl = thLen(d), h1 = [WEB.hero.title[k], ...WEB.hero.words.map(w => w[k])].join(' ').toLowerCase();
  const faqOk = WEB.faq.filter(([q, a]) => (q[k] || '').trim() && (a[k] || '').trim()).length;
  return [
    ['t', !!t, 'มี Title', 'ยังไม่มี Title', 18],
    ['tl', tl >= 30 && tl <= 60, `ความยาว Title ${tl} ตัวอักษร (เหมาะสม 30–60)`, `Title ยาว ${tl} ตัวอักษร · ควรอยู่ระหว่าง 30–60 ไม่งั้น Google จะตัดคำ`, 10],
    ['tk', kw && t.toLowerCase().includes(kw), `คีย์เวิร์ด “${S.kw[k]}” อยู่ใน Title`, `คีย์เวิร์ด “${S.kw[k] || '-'}” ไม่อยู่ใน Title`, 12],
    ['tb', /boat trip thailand/i.test(t), 'มีชื่อแบรนด์ใน Title', 'ควรใส่ชื่อแบรนด์ท้าย Title', 5],
    ['d', !!d, 'มี Meta description', 'ยังไม่มี Meta description', 14],
    ['dl', dl >= 120 && dl <= 160, `ความยาว Description ${dl} ตัวอักษร (เหมาะสม 120–160)`, `Description ${dl} ตัวอักษร · ควรเขียน 120–160 ให้เต็มพื้นที่บน Google`, 8],
    ['dt', d && !/(\.\.\.|…)$/.test(d), 'Description เขียนจบประโยค', 'Description ยังลงท้ายด้วย “…” เหมือนข้อความไม่จบ', 6],
    ['dk', kw && d.toLowerCase().includes(kw.split(' ')[0]), 'คีย์เวิร์ดอยู่ใน Description', 'ควรมีคีย์เวิร์ดใน Description', 6],
    ['h1', kw && kw.split(' ').some(w => w.length > 3 && h1.includes(w)), 'หัวข้อ H1 (Hero) เกี่ยวกับคีย์เวิร์ด', `หัวข้อ H1 “${WEB.hero.title[k]}” ไม่มีคีย์เวิร์ด · แนะนำเพิ่มคำว่า yacht / เช่าเรือ`, 8],
    ['og', true, 'มีรูป OG สำหรับแชร์ (1200×630)', '', 4],
    ['faq', faqOk >= 4 && faqOk === WEB.faq.length, `FAQ ครบ ${faqOk} ข้อ · ได้ FAQ rich result`, `FAQ ภาษานี้ครบ ${faqOk}/${WEB.faq.length} ข้อ · แปลให้ครบเพื่อ rich result`, 5],
    ['hl', !!(S.title.th && S.title.en), 'มีทั้งหน้า TH และ EN · hreflang ครบคู่', 'ยังไม่มีอีกภาษา · hreflang ไม่ครบ', 4],
  ].map(([id, ok, good, bad, w]) => ({ id, ok, msg: ok ? good : bad, w }));
}
const homeScore = c => Math.round(c.filter(x => x.ok).reduce((a, x) => a + x.w, 0) / c.reduce((a, x) => a + x.w, 0) * 100);
function gResult(k) {
  const S = WEB.seo, t = S.title[k] || (k === 'en' ? 'Untitled' : 'ไม่มีชื่อ'), d = S.desc[k] || '', mob = HS.dev === 'mob', path = k === 'en' ? ' › en' : '';
  return `<div class="g-res ${mob ? 'mob' : ''}">
    <div class="flex items-center gap-2.5"><span class="g-fav"><img src="${favSrc()}" alt=""/></span><div class="min-w-0 leading-tight"><p class="text-[14px] text-[#202124] truncate">Boat Trip Thailand</p><p class="text-[12px] text-[#4d5156] truncate">https://${SITE}${path}</p></div><span class="ml-1 text-[#70757a]">⋮</span></div>
    <p class="g-t">${esc(t)}</p>
    <p class="g-d">${esc(d)}</p>
    <div class="g-links">${(k === 'en' ? ['Browse the fleet', 'Things to do', 'About us', 'Blog'] : ['เรือทั้งหมด', 'กิจกรรม & ทัวร์', 'เกี่ยวกับเรา', 'บทความ']).map(x => `<span>${x}</span>`).join('')}</div></div>`;
}
function homeSeoBox() {
  const lang = [['th', 'ภาษาไทย'], ['en', 'English']];
  const seg = (on, fn, l) => `<button class="h-8 px-3 rounded-full text-[12px] ${on ? 'bg-white shadow-sm text-ink' : 'text-muted'}" onclick="${fn}">${l}</button>`;
  return `<div id="homeSeo" class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start mt-6 pt-6 border-t border-line">
    <div class="min-w-0"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><p class="font-medium flex items-center gap-2"><i data-lucide="search" class="w-4 h-4 text-maroon"></i>ตัวอย่างบน Google</p>
      <div class="flex p-0.5 rounded-full bg-sand">${seg(HS.dev === 'desk', "HS.dev='desk';homeSeoRefresh()", 'คอมพิวเตอร์')}${seg(HS.dev === 'mob', "HS.dev='mob';homeSeoRefresh()", 'มือถือ')}</div></div>
      <div class="grid grid-cols-1 gap-3">${lang.map(([k, l]) => `<div class="min-w-0 overflow-hidden rounded-2xl ring-1 ring-line bg-white p-4 sm:p-5"><p class="text-[11px] text-muted mb-3 flex items-center gap-2"><span class="lang-b ok">${k.toUpperCase()}</span>${l} · ค้นหา “${esc(WEB.seo.kw[k])}”</p>${gResult(k)}</div>`).join('')}</div>
      <p class="text-[11px] text-muted mt-2">ตัวอย่างโดยประมาณ · Google อาจเลือกแสดงข้อความอื่นจากหน้าเว็บ และลิงก์ย่อย (sitelinks) จะขึ้นเมื่อเว็บมีคนค้นหาชื่อแบรนด์มากพอ</p></div>
    <div class="grid gap-4">${lang.map(([k, l]) => { const c = homeChecks(k), sc = homeScore(c);
      return `<div class="rounded-2xl ring-1 ring-line p-4"><div class="flex items-center gap-3">${ring(sc, 64)}<div><p class="font-medium">คะแนน SEO หน้าแรก · ${k.toUpperCase()}</p><p class="text-[11px] text-muted">ผ่าน ${c.filter(x => x.ok).length}/${c.length} ข้อ</p></div></div>
        <ul class="mt-3 grid gap-1.5 text-[12.5px]">${c.sort((a, b) => a.ok - b.ok).map(x => `<li class="flex items-start gap-2"><i data-lucide="${x.ok ? 'circle-check' : 'circle-alert'}" class="w-3.5 h-3.5 mt-0.5 shrink-0 ${x.ok ? 'text-[#1e7a46]' : 'text-[#b4501a]'}"></i><span class="${x.ok ? 'text-muted' : ''}">${x.msg}</span></li>`).join('')}</ul></div>`; }).join('')}</div>
  </div>`;
}
function homeSeoRefresh() { const el = $('#homeSeo'); if (!el) return; el.outerHTML = homeSeoBox(); icons(); }
const _vContent9 = vContent;
vContent = function () {
  _vContent9();
  if (WEB.tab !== 'seo') return;
  const g = $('#view .fade > .grid'); if (!g) return;
  g.insertAdjacentHTML('afterbegin', bi('คีย์เวิร์ดหลักของหน้าแรก', WEB.seo.kw, { hint: 'ใช้ตรวจคะแนน SEO' }));
  g.classList.remove('max-w-4xl');
  g.insertAdjacentHTML('afterend', homeSeoBox()); icons();
};
const _biSet9 = biSet;
biSet = function (i, k, el) { _biSet9(i, k, el); if (WEB.tab === 'seo' && $('#homeSeo')) { clearTimeout(biSet.t); biSet.t = setTimeout(homeSeoRefresh, 200); } };
PAGES.find(p => p[0] === 'content')[3] = vContent;



/* =====================================================================
   ACTIVITY PHOTOS: cover + gallery shown on the website card & detail
   ===================================================================== */
ACTS.forEach(a => { a.imgs = a.imgs && a.imgs.length ? a.imgs.slice() : a.pic && ACTIMG[a.pic] ? ACTIMG[a.pic].slice() : []; });
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



/* =====================================================================
   ANALYTICS – Google Analytics 4 (Data API) + Search Console (Search Analytics API)
   Mockup: numbers are generated sample data; real system calls the APIs server-side.
   ===================================================================== */
const GA = { tab: 'overview', days: 1, cmp: true, gaOn: false, gscOn: false, prop: '', site: 'sc-domain:boattripthailand.com', qLang: '' };
let _ars = 7341; const arnd = () => { _ars = (_ars * 16807) % 2147483647; return (_ars - 1) / 2147483646; };
/* 180 days of daily series (oldest → today) */
const SER = (() => { const out = { users: [], sessions: [], conv: [], clicks: [], impr: [], pos: [] };
  for (let i = 179; i >= 0; i--) { const d = addDays(TODAY, -i), m = d.getMonth(), wk = d.getDay(), season = (m >= 10 || m <= 3) ? 1.35 : 0.85, grow = 1 + (179 - i) / 400, wkf = wk === 0 || wk === 6 ? 1.18 : 1;
    const u = Math.round((210 + arnd() * 70) * season * grow * wkf); out.users.push(u); out.sessions.push(Math.round(u * (1.28 + arnd() * .12)));
    out.conv.push(Math.round(u * (0.018 + arnd() * .012))); const c = Math.round(u * (0.42 + arnd() * .08)); out.clicks.push(c); out.impr.push(Math.round(c * (22 + arnd() * 8))); out.pos.push(+(16 - (179 - i) / 60 + arnd() * 2).toFixed(1)); }
  return out; })();
const win = (k, off = 0) => SER[k].slice(SER[k].length - GA.days * (off + 1), SER[k].length - GA.days * off);
const sum = a => a.reduce((x, y) => x + y, 0), avg = a => sum(a) / a.length;
const nf = n => Math.round(n).toLocaleString('en-US');
const delta = (c, p, inv) => { const d = p ? (c - p) / p * 100 : 0, good = inv ? d < 0 : d > 0; return GA.cmp ? `<span class="text-[11.5px] tnum ${Math.abs(d) < .5 ? 'text-muted' : good ? 'text-[#1e7a46]' : 'text-[#a3222c]'}">${d > 0 ? '▲' : d < 0 ? '▼' : ''} ${Math.abs(d).toFixed(1)}%</span>` : ''; };
const kpi = (l, v, d, sub) => `<div class="card p-4"><p class="text-[12px] text-muted">${l}</p><p class="text-[24px] font-medium tnum mt-1 leading-none">${v}</p><div class="mt-2 flex items-center gap-2">${d}${sub ? `<span class="text-[11px] text-muted">${sub}</span>` : ''}</div></div>`;

/* single-axis line chart with optional previous-period line and hover tooltip */
let CH = 0;
function lineChart(cur, prev, { h = 180, fmt = nf, label = '', invert = false, end, labels } = {}) {
  if (cur.length < 2) { cur = [cur[0] ?? 0, cur[0] ?? 0]; if (prev) prev = [prev[0] ?? 0, prev[0] ?? 0]; labels = undefined; }   // a single point (24 h without hourly data) → flat line, not NaN
  const id = 'ch' + (++CH), W = 800, n = cur.length, all = cur.concat(GA.cmp && prev ? prev : []);
  let lo = Math.min(...all), hi = Math.max(...all); if (invert) [lo, hi] = [lo - 1, hi + 1]; else { lo = 0; hi = hi * 1.1 || 1; }   // all-zero data (no visitors yet) → flat line instead of NaN
  const x = i => i / (n - 1) * W, y = v => invert ? (v - lo) / (hi - lo) * (h - 24) + 8 : h - 20 - (v - lo) / (hi - lo) * (h - 32);
  const path = a => a.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const ticks = [0, .5, 1].map(f => invert ? lo + (hi - lo) * f : lo + (hi - lo) * f);
  const dates = cur.map((_, i) => addDays(end || TODAY, i - n + 1));   // `end`: last day of the series (Search Console lags ~3 days)
  // `labels`: hour keys "YYYY-MM-DDTHH" for the 24-hour range → "14:00" on the axis, "27 ต.ค. 14:00" in the tooltip
  const ax = i => labels ? labels[i].slice(11) + ':00' : fmtD(iso(dates[i])), tip = i => labels ? fmtD(labels[i].slice(0, 10)) + ' ' + labels[i].slice(11) + ':00' : fmtD(iso(dates[i]));
  CHD[id] = { cur, prev, fmt, label, dates, n, tip };
  return `<div class="relative" id="${id}"><svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" class="w-full block" style="height:${h}px" onmousemove="chHover(event,'${id}')" onmouseleave="chLeave('${id}')">
      ${ticks.map(t => `<line x1="0" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="#f1eaea" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('')}
      ${GA.cmp && prev ? `<path d="${path(prev)}" fill="none" stroke="#c9bcbd" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>` : ''}
      <path d="${path(cur)}L${W},${invert ? 0 : h - 20}L0,${invert ? 0 : h - 20}Z" fill="#70000e" opacity=".06"/>
      <path d="${path(cur)}" fill="none" stroke="#70000e" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      <line class="ch-x" x1="0" x2="0" y1="0" y2="${h - 20}" stroke="#231416" stroke-width="1" opacity="0" vector-effect="non-scaling-stroke"/></svg>
    <div class="absolute left-0 top-0 text-[10px] text-muted tnum">${fmt(invert ? lo : hi)}</div>
    <div class="flex justify-between text-[10.5px] text-muted mt-1 tnum"><span>${ax(0)}</span><span>${ax(Math.floor(n / 2))}</span><span>${ax(n - 1)}</span></div>
    <div class="ch-tip hidden absolute z-10 pointer-events-none bg-ink text-white text-[11.5px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg"></div></div>`;
}
const CHD = {};
function chHover(e, id) { const d = CHD[id], box = $('#' + id), r = box.getBoundingClientRect(), f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), i = Math.round(f * (d.n - 1));
  const ln = box.querySelector('.ch-x'), X = i / (d.n - 1) * 800; ln.setAttribute('x1', X); ln.setAttribute('x2', X); ln.setAttribute('opacity', .25);
  const t = box.querySelector('.ch-tip'); t.classList.remove('hidden'); t.innerHTML = `${d.tip(i)} · <b class="font-medium">${d.fmt(d.cur[i])}</b> ${d.label}${GA.cmp && d.prev ? `<span class="opacity-60"> · ก่อนหน้า ${d.fmt(d.prev[i])}</span>` : ''}`;
  t.style.left = Math.min(r.width - t.offsetWidth, Math.max(0, f * r.width - t.offsetWidth / 2)) + 'px'; t.style.top = '-6px'; }
function chLeave(id) { const b = $('#' + id); b.querySelector('.ch-tip').classList.add('hidden'); b.querySelector('.ch-x').setAttribute('opacity', 0); }
const legend = () => GA.cmp ? `<div class="flex items-center gap-4 text-[11px] text-muted"><span class="flex items-center gap-1.5"><i class="inline-block w-4 h-0.5 bg-maroon"></i>${GA.days === 1 ? '24 ชม.' : GA.days + ' วัน'}ล่าสุด</span><span class="flex items-center gap-1.5"><i class="inline-block w-4 border-t border-dashed border-[#b8aaac]"></i>${GA.days === 1 ? '24 ชม.' : GA.days + ' วัน'}ก่อนหน้า</span></div>` : '';
const bars = (rows, { fmt = nf, total } = {}) => { const mx = Math.max(...rows.map(r => r[1])), t = total || sum(rows.map(r => r[1]));
  return `<ul class="grid gap-2.5">${rows.map(([l, v, sub]) => `<li><div class="flex justify-between gap-3 text-[12.5px]"><span class="truncate">${l}${sub ? ` <span class="text-muted">${sub}</span>` : ''}</span><span class="tnum shrink-0">${fmt(v)} <span class="text-muted">${(v / t * 100).toFixed(0)}%</span></span></div><div class="mt-1 h-1.5 rounded-full bg-sand overflow-hidden"><div class="h-full rounded-full bg-maroon" style="width:${v / mx * 100}%"></div></div></li>`).join('')}</ul>`; };

/* sample dimension tables (scaled to the selected range) */
function gaPages(tot) {
  const P = [['/', 'หน้าแรก', .24], ['/yacht-charter', 'เรือทั้งหมด', .14], ...['leopard-90-ft', 'vtech-68-ft', 'splo-74-ft', 'siam-princess-70-ft', 'the-origin-90-ft', 'cognac-75-ft'].map((s, i) => ['/yacht-charter/' + s, bySlug(s)?.name || s, .07 - i * .009]), ['/blog/เช่าเรือยอชต์ภูเก็ต-ก่อนจอง', 'บทความ: ก่อนจองเรือยอชต์', .04], ['/activities', 'กิจกรรม & ทัวร์', .035], ['/en/', 'Home (EN)', .06]];
  return P.map(([u, n, f], i) => ({ u, n, v: Math.round(tot * f * 1.6), eng: 40 + ((i * 37) % 70), conv: Math.round(tot * f * .03) }));
}
const QUERIES = [['เช่าเรือยอชต์ภูเก็ต', 'th', 4.2, .072], ['yacht charter phuket', 'en', 7.8, .041], ['เช่าเรือ ภูเก็ต', 'th', 6.1, .055], ['phuket yacht charter price', 'en', 9.4, .029], ['catamaran charter phuket', 'en', 12.6, .018], ['เช่าเรือไปพีพี', 'th', 8.3, .047], ['boat trip thailand', 'en', 1.2, .41], ['private boat phi phi', 'en', 14.8, .012], ['เช่าสปีดโบ๊ท ภูเก็ต', 'th', 10.9, .022], ['เกาะใกล้ภูเก็ต', 'th', 18.5, .006], ['leopard 90 yacht phuket', 'en', 3.1, .12], ['ล่องเรือซันเซ็ต ภูเก็ต', 'th', 11.7, .02]];
function gscQueries(tot) { const r = gscQ0(tot), f = sum(win('clicks')) * .8 / sum(r.map(x => x.clk)); r.forEach(x => { x.clk = Math.round(x.clk * f); x.ctr = x.clk / x.imp; }); return r; }
function gscQ0(tot) { const wsum = sum(QUERIES.map((q, i) => 1 / (i + 1.5))); return QUERIES.map(([q, l, pos, ctr], i) => { const imp = Math.round(tot * .85 * (1 / (i + 1.5)) / wsum); return { q, l, pos, ctr, imp, clk: Math.round(imp * ctr) }; }); }

function vAnalytics() {
  CH = 0; const D = GA.days, users = win('users'), pu = win('users', 1), ses = win('sessions'), ps = win('sessions', 1), cv = win('conv'), pc = win('conv', 1), ck = win('clicks'), pk = win('clicks', 1), im = win('impr'), pi = win('impr', 1), po = win('pos'), pp = win('pos', 1);
  const tabs = [['overview', 'ภาพรวม', 'layout-dashboard'], ['ga', 'Google Analytics', 'chart-line'], ['gsc', 'Search Console', 'search'], ['meta', 'Meta Pixel · โฆษณา', 'megaphone'], ['api', 'เชื่อมต่อ API', 'key-round']];
  const conn = (on, name, idv, ic) => `<div class="flex items-center gap-3 rounded-xl ring-1 ring-line px-3.5 py-2.5 bg-white"><i data-lucide="${ic}" class="w-4 h-4 ${on ? 'text-[#1e7a46]' : 'text-muted'}"></i><div class="min-w-0"><p class="text-[12.5px] font-medium">${name}</p><p class="text-[11px] ${on ? 'text-[#1e7a46]' : 'text-muted'} truncate">${on ? 'เชื่อมต่อแล้ว · ' + idv : 'ยังไม่เชื่อมต่อ · แสดงข้อมูลตัวอย่าง'}</p></div><button class="btn btn-g !h-7 ml-auto" onclick="GA.tab='api';vAnalytics()">${on ? 'ตั้งค่า' : 'เชื่อมต่อ'}</button></div>`;
  let body = '';
  if (GA.tab === 'overview') body = `
    <div class="grid grid-cols-2 xl:grid-cols-5 gap-3">${kpi('ผู้ใช้งาน', nf(sum(users)), delta(sum(users), sum(pu)), 'GA4')}${kpi('เซสชัน', nf(sum(ses)), delta(sum(ses), sum(ps)), 'GA4')}${kpi('ลีด / คำขอจอง', nf(sum(cv)), delta(sum(cv), sum(pc)), 'ฟอร์ม + แชท')}${kpi('คลิกจาก Google', nf(sum(ck)), delta(sum(ck), sum(pk)), 'Search Console')}${kpi('อันดับเฉลี่ย', avg(po).toFixed(1), delta(avg(po), avg(pp), true), 'ยิ่งน้อยยิ่งดี')}</div>
    <div class="grid xl:grid-cols-2 gap-4 mt-4 items-start">
      <div class="card p-5"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><p class="font-medium">ผู้ใช้งานต่อวัน</p>${legend()}</div>${lineChart(users, pu, { label: 'ผู้ใช้' })}</div>
      <div class="card p-5"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><p class="font-medium">คลิกจาก Google ต่อวัน</p>${legend()}</div>${lineChart(ck, pk, { label: 'คลิก' })}</div></div>
    <div class="grid xl:grid-cols-3 gap-4 mt-4 items-start">
      <div class="card p-5"><p class="font-medium mb-3">เส้นทางสู่การจอง</p>${(() => { const t = sum(ses), st = [['เข้าเว็บ', t], ['ดูหน้าเรือ', t * .46], ['เลือกโปรแกรม / วันที่', t * .14], ['กดจอง / แชท / โทร', sum(cv)]]; return `<ul class="grid gap-2">${st.map(([l, v], i) => `<li><div class="flex justify-between text-[12.5px]"><span>${l}</span><span class="tnum">${nf(v)} <span class="text-muted">${i ? (v / st[i - 1][1] * 100).toFixed(0) + '%' : ''}</span></span></div><div class="mt-1 h-6 rounded-md bg-sand overflow-hidden"><div class="h-full rounded-md bg-maroon" style="width:${Math.max(3, v / t * 100)}%;opacity:${1 - i * .18}"></div></div></li>`).join('')}</ul>`; })()}<p class="text-[11px] text-muted mt-3">อัตราแปลงรวม ${(sum(cv) / sum(ses) * 100).toFixed(2)}%</p></div>
      <div class="card p-5"><p class="font-medium mb-3">ช่องทางที่ลูกค้ามา</p>${bars([['Organic Search', sum(ses) * .44], ['Direct', sum(ses) * .21], ['Social', sum(ses) * .16], ['Paid Search', sum(ses) * .11], ['Referral', sum(ses) * .05], ['Email', sum(ses) * .03]])}</div>
      <div class="card p-5"><p class="font-medium mb-3">ช่องทางติดต่อ (Events)</p>${bars([['WhatsApp', sum(cv) * .41, 'whatsapp_click'], ['ฟอร์มขอใบเสนอราคา', sum(cv) * .27, 'booking_submit'], ['LINE', sum(cv) * .19, 'line_click'], ['โทร', sum(cv) * .13, 'phone_click']])}</div></div>`;
  if (GA.tab === 'ga') { const pg = gaPages(sum(ses)), t = sum(ses);
    body = `<div class="grid grid-cols-2 xl:grid-cols-4 gap-3">${kpi('ผู้ใช้งาน', nf(sum(users)), delta(sum(users), sum(pu)))}${kpi('เซสชัน', nf(t), delta(t, sum(ps)))}${kpi('เวลาใช้งานเฉลี่ย', '1:52', delta(112, 104))}${kpi('อัตราแปลง', (sum(cv) / t * 100).toFixed(2) + '%', delta(sum(cv) / t, sum(pc) / sum(ps)))}</div>
    <div class="card p-5 mt-4"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><p class="font-medium">เซสชันต่อวัน</p>${legend()}</div>${lineChart(ses, ps, { label: 'เซสชัน', h: 200 })}</div>
    <div class="grid xl:grid-cols-3 gap-4 mt-4 items-start">
      <div class="card xl:col-span-2 overflow-hidden"><p class="font-medium px-5 pt-4 pb-2">หน้าที่มีคนดูมากที่สุด</p><div class="overflow-x-auto"><table class="tbl min-w-[560px]"><thead><tr><th>หน้า</th><th class="text-right">การดู</th><th class="text-right">เวลาเฉลี่ย (วิ)</th><th class="text-right">ลีด</th></tr></thead><tbody>${pg.sort((a, b) => b.v - a.v).map(p => `<tr><td><p class="truncate max-w-[300px]">${esc(p.n)}</p><p class="text-[11px] text-muted truncate max-w-[300px]">${esc(p.u)}</p></td><td class="text-right tnum">${nf(p.v)}</td><td class="text-right tnum">${p.eng}</td><td class="text-right tnum">${nf(p.conv)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="grid gap-4"><div class="card p-5"><p class="font-medium mb-3">อุปกรณ์</p>${bars([['มือถือ', t * .71], ['คอมพิวเตอร์', t * .25], ['แท็บเล็ต', t * .04]])}</div>
        <div class="card p-5"><p class="font-medium mb-3">ประเทศ</p>${bars([['ไทย', t * .38], ['จีน', t * .12], ['สหราชอาณาจักร', t * .09], ['ออสเตรเลีย', t * .08], ['รัสเซีย', t * .08], ['อินเดีย', t * .07], ['อื่นๆ', t * .18]])}</div>
        <div class="card p-5"><p class="font-medium mb-3">ภาษาหน้าเว็บ</p>${bars([['ไทย /', t * .41], ['English /en/', t * .59]])}</div></div></div>`; }
  if (GA.tab === 'gsc') { const qs = gscQueries(sum(im)).filter(q => !GA.qLang || q.l === GA.qLang), opp = gscQueries(sum(im)).filter(q => q.pos > 4 && q.pos <= 20 && q.imp > 300).sort((a, b) => b.imp - a.imp).slice(0, 4);
    body = `<div class="grid grid-cols-2 xl:grid-cols-4 gap-3">${kpi('คลิก', nf(sum(ck)), delta(sum(ck), sum(pk)))}${kpi('การแสดงผล', nf(sum(im)), delta(sum(im), sum(pi)))}${kpi('CTR เฉลี่ย', (sum(ck) / sum(im) * 100).toFixed(2) + '%', delta(sum(ck) / sum(im), sum(pk) / sum(pi)))}${kpi('อันดับเฉลี่ย', avg(po).toFixed(1), delta(avg(po), avg(pp), true), 'ยิ่งน้อยยิ่งดี')}</div>
    <div class="grid xl:grid-cols-2 gap-4 mt-4 items-start">
      <div class="card p-5"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><p class="font-medium">คลิกต่อวัน</p>${legend()}</div>${lineChart(ck, pk, { label: 'คลิก' })}</div>
      <div class="card p-5"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><p class="font-medium">อันดับเฉลี่ยต่อวัน <span class="text-[11px] text-muted font-normal">(บนสุด = อันดับดีกว่า)</span></p>${legend()}</div>${lineChart(po, pp, { label: '', fmt: v => (+v).toFixed(1), invert: true })}</div></div>
    <div class="grid xl:grid-cols-3 gap-4 mt-4 items-start">
      <div class="card xl:col-span-2 overflow-hidden"><div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-2"><p class="font-medium">คำค้นหาที่พาคนมาเว็บ</p><div class="flex p-0.5 rounded-full bg-sand">${[['', 'ทั้งหมด'], ['th', 'TH'], ['en', 'EN']].map(([k, l]) => `<button class="h-7 px-3 rounded-full text-[12px] ${GA.qLang === k ? 'bg-white shadow-sm' : 'text-muted'}" onclick="GA.qLang='${k}';vAnalytics()">${l}</button>`).join('')}</div></div>
        <div class="overflow-x-auto"><table class="tbl min-w-[620px]"><thead><tr><th>คำค้นหา</th><th class="text-right">คลิก</th><th class="text-right">การแสดงผล</th><th class="text-right">CTR</th><th class="text-right">อันดับ</th></tr></thead><tbody>${qs.map(q => `<tr><td><span class="lang-b ok mr-1.5">${q.l.toUpperCase()}</span>${esc(q.q)}</td><td class="text-right tnum">${nf(q.clk)}</td><td class="text-right tnum">${nf(q.imp)}</td><td class="text-right tnum">${(q.ctr * 100).toFixed(1)}%</td><td class="text-right tnum"><span class="lang-b ${q.pos <= 3 ? 'ok' : q.pos <= 10 ? 'mid' : 'low'}">${q.pos.toFixed(1)}</span></td></tr>`).join('')}</tbody></table></div></div>
      <div class="grid gap-4"><div class="card p-5"><p class="font-medium flex items-center gap-2"><i data-lucide="target" class="w-4 h-4 text-maroon"></i>โอกาสเพิ่มคลิก</p><p class="text-[11.5px] text-muted mt-1">คำที่คนเห็นเยอะแต่ยังอยู่หน้า 1 ล่าง–หน้า 2 · ปรับ Title หรือเขียนบทความเพิ่มจะได้คลิกมากขึ้น</p>
        <ul class="mt-3 grid gap-2.5">${opp.map(q => `<li class="rounded-xl bg-sand p-3"><p class="text-[13px]">${esc(q.q)}</p><p class="text-[11.5px] text-muted mt-0.5 tnum">อันดับ ${q.pos.toFixed(1)} · เห็น ${nf(q.imp)} ครั้ง · CTR ${(q.ctr * 100).toFixed(1)}%</p><button class="text-[12px] text-maroon mt-1.5" onclick="newArticle()">เขียนบทความสำหรับคำนี้ →</button></li>`).join('')}</ul></div>
        <div class="card p-5"><p class="font-medium mb-3">สถานะการ index</p>${bars([['ติด index แล้ว', 172], ['ถูกพบ ยังไม่ index', 9], ['ถูกตัดออก (noindex / redirect)', 14]], { fmt: v => nf(v) + ' หน้า' })}<button class="btn btn-o !h-8 mt-3" onclick="go('seo')">ไปหน้า SEO</button></div></div></div>`; }
  if (GA.tab === 'meta') body = metaBody();
  if (GA.tab === 'api') body = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      <div class="card p-5 grid gap-4"><div class="flex items-center gap-2"><i data-lucide="chart-line" class="w-5 h-5 text-maroon"></i><p class="font-medium">Google Analytics 4 · Data API</p>${GA.gaOn ? '<span class="pill st-confirmed ml-auto">เชื่อมต่อแล้ว</span>' : ''}</div>
        <label><span class="lbl">GA4 Property ID (ตัวเลข ไม่ใช่ G-XXXX)</span><input class="inp font-mono" placeholder="เช่น 412345678" value="${esc(GA.prop)}" oninput="GA.prop=this.value"/></label>
        <label><span class="lbl">Measurement ID (ติดตั้งบนหน้าเว็บ)</span><input class="inp font-mono" placeholder="G-XXXXXXXXXX" value="${esc(SSET.ga4)}" oninput="SSET.ga4=this.value"/></label>
        <button class="btn btn-p justify-self-start" onclick="GA.gaOn=true;toast('เชื่อมต่อ GA4 แล้ว (จำลอง)');vAnalytics()">${GA.gaOn ? 'ทดสอบการเชื่อมต่อ' : 'เชื่อมต่อ'}</button></div>
      <div class="card p-5 grid gap-4"><div class="flex items-center gap-2"><i data-lucide="search" class="w-5 h-5 text-maroon"></i><p class="font-medium">Search Console · Search Analytics API</p>${GA.gscOn ? '<span class="pill st-confirmed ml-auto">เชื่อมต่อแล้ว</span>' : ''}</div>
        <label><span class="lbl">Property</span><input class="inp font-mono" value="${esc(GA.site)}" oninput="GA.site=this.value"/></label>
        <label><span class="lbl">รหัสยืนยันเว็บ (meta tag)</span><input class="inp font-mono" placeholder="google-site-verification=…" value="${esc(SSET.gsc)}" oninput="SSET.gsc=this.value"/></label>
        <button class="btn btn-p justify-self-start" onclick="GA.gscOn=true;toast('เชื่อมต่อ Search Console แล้ว (จำลอง)');vAnalytics()">${GA.gscOn ? 'ทดสอบการเชื่อมต่อ' : 'เชื่อมต่อ'}</button></div>
      <div class="card p-5 xl:col-span-2 min-w-0"><p class="font-medium">ระบบจริงทำงานอย่างไร</p>
        <ol class="mt-3 grid md:grid-cols-2 xl:grid-cols-4 gap-3 text-[12.5px]">${[['1. Service Account', 'สร้างใน Google Cloud เปิด Analytics Data API และ Search Console API แล้วเพิ่มอีเมล service account เป็นผู้ใช้ (Viewer) ใน GA4 และ Search Console'], ['2. เก็บกุญแจบนเซิร์ฟเวอร์', 'ไฟล์กุญแจเก็บเป็น environment variable ของ Next.js เท่านั้น ไม่ส่งไปที่เบราว์เซอร์'], ['3. ดึงข้อมูลทุกคืน', 'Cron (เช่น Vercel Cron) เรียก API วันละครั้ง เก็บผลลงฐานข้อมูล หน้าหลังบ้านอ่านจากฐานข้อมูล จึงเร็วและไม่ชนโควตา'], ['4. ข้อมูลล่าช้า', 'Search Console มีข้อมูลช้าประมาณ 2–3 วัน · GA4 ย้อนหลังได้ทันที แต่ตัวเลขวันนี้ยังไม่นิ่ง']].map(([t, d]) => `<li class="rounded-xl bg-sand p-3.5"><p class="font-medium">${t}</p><p class="text-muted mt-1">${d}</p></li>`).join('')}</ol>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-4">
          <div><p class="lbl">GA4 · runReport</p><pre class="p-3.5 rounded-xl bg-[#1d1416] text-[#f1e6e6] text-[11px] leading-relaxed overflow-auto whitespace-pre-wrap break-all">${esc(`POST https://analyticsdata.googleapis.com/v1beta/properties/${GA.prop || '{PROPERTY_ID}'}:runReport
{
  "dateRanges": [{ "startDate": "${GA.days}daysAgo", "endDate": "today" }],
  "dimensions": [{ "name": "date" }, { "name": "sessionDefaultChannelGroup" }],
  "metrics": [{ "name": "activeUsers" }, { "name": "sessions" },
              { "name": "keyEvents" }]
}`)}</pre></div>
          <div><p class="lbl">Search Console · searchanalytics.query</p><pre class="p-3.5 rounded-xl bg-[#1d1416] text-[#f1e6e6] text-[11px] leading-relaxed overflow-auto whitespace-pre-wrap break-all">${esc(`POST https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GA.site)}/searchAnalytics/query
{
  "startDate": "${iso(addDays(TODAY, -GA.days - 2))}",
  "endDate": "${iso(addDays(TODAY, -3))}",
  "dimensions": ["query", "page"],
  "rowLimit": 1000
}`)}</pre></div></div>
        <p class="text-[11px] text-muted mt-3">ต้องตั้ง Key event ใน GA4 ให้ตรงกับปุ่มบนเว็บ: booking_submit, whatsapp_click, line_click, phone_click · ระบบจะส่ง event เหล่านี้หลังลูกค้ายอมรับคุกกี้ (PDPA)</p></div></div>`;
  $('#view').innerHTML = `${head('วิเคราะห์เว็บไซต์', 'ข้อมูลจาก Google Analytics 4, Google Search Console และ Meta Pixel', `<div class="flex p-0.5 rounded-full bg-white ring-1 ring-line">${[1, 7, 28, 90].map(d => `<button class="h-8 px-3 rounded-full text-[12px] ${GA.days === d ? 'bg-ink text-white' : 'text-muted'}" onclick="GA.days=${d};vAnalytics()">${d === 1 ? '24 ชม.' : d + ' วัน'}</button>`).join('')}</div><label class="flex items-center gap-2 text-[12px] text-muted"><span class="tgl"><input type="checkbox" ${GA.cmp ? 'checked' : ''} onchange="GA.cmp=this.checked;vAnalytics()"/><span></span></span>เทียบช่วงก่อนหน้า</label><button class="btn btn-o" onclick="toast('ส่งออกรายงาน (จำลอง)')"><i data-lucide="download" class="w-3.5 h-3.5"></i>ส่งออก</button>`)}
    <div class="rounded-xl bg-[#fff8e6] text-[#7a4a00] text-[12px] px-4 py-2.5 mb-4 flex items-start gap-2"><i data-lucide="info" class="w-4 h-4 shrink-0 mt-px"></i>ตัวเลขทั้งหมดในหน้านี้เป็นข้อมูลตัวอย่าง เพื่อให้เห็นหน้าตารายงาน · เมื่อเชื่อม API ในระบบจริงจะแสดงข้อมูลจริงของเว็บ</div>
    <div class="grid md:grid-cols-3 gap-3 mb-4">${conn(GA.gaOn, 'Google Analytics 4', GA.prop || 'Property', 'chart-line')}${conn(GA.gscOn, 'Google Search Console', GA.site, 'search')}${conn(MP.on, 'Meta Pixel + Conversions API', MP.id || 'Pixel', 'megaphone').replace(`GA.tab='api'`, `GA.tab='meta'`)}</div>
    <div class="tabbar flex gap-1 overflow-x-auto no-sb mb-4">${tabs.map(([k, l, ic]) => `<button class="tab inline-flex items-center gap-1.5 ${GA.tab === k ? 'on' : ''}" onclick="GA.tab='${k}';vAnalytics()"><i data-lucide="${ic}" class="w-3.5 h-3.5"></i>${l}</button>`).join('')}</div>
    <div class="fade">${body}</div>`;
  icons();
}
PAGES.splice(PAGES.findIndex(p => p[0] === 'seo') + 1, 0, ['analytics', 'วิเคราะห์เว็บไซต์', 'chart-line', vAnalytics]);
/* SEO overview "connect GSC" card → go to analytics */
const _seoOverview11 = seoOverview;
seoOverview = function (P) { return _seoOverview11(P).replace(`GSC.on=true;vSeo();toast('เชื่อมต่อแล้ว (จำลอง) · แสดงข้อมูลตัวอย่าง')`, `GA.tab='api';go('analytics')`); };
/* dashboard: small web-traffic card */
const _vDash11 = PAGES.find(p => p[0] === 'dashboard')[3];
PAGES.find(p => p[0] === 'dashboard')[3] = function () { _vDash11(); dashTraffic(); icons(); };   // real numbers: see dashTraffic()



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
const MSIZE = {};   // bytes per uploaded URL, from the server
const kb = s => MSIZE[s] != null ? Math.round(MSIZE[s] / 1024) : /^data:/.test(s) ? Math.round((s.length - 23) * .75 / 1024) : 0;
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



/* =====================================================================
   TEAM – add / edit / deactivate sales members
   ===================================================================== */
const ROLES = { super: ['Super Admin', 'ทำได้ทุกอย่าง รวมจัดการทีม สิทธิ์ผู้ใช้ และดูบันทึกกิจกรรม'], admin: ['Admin', 'ดูแลลีดทุกคน เรือ ราคา เนื้อหา SEO การตลาด และตั้งค่าเว็บ · จัดการทีมและสิทธิ์ไม่ได้'], sales: ['Sales', 'เห็นและจัดการเฉพาะลีดของตัวเอง'] };
const PERMS = [['bookings', 'การจอง & ลูกค้า'], ['boats', 'เรือ ราคา ฤดูกาล'], ['content', 'เนื้อหา บทความ คลังสื่อ'], ['seo', 'SEO & วิเคราะห์'], ['settings', 'ตั้งค่า & ทีม']];
const ROLE_PERMS = { super: ['bookings', 'boats', 'content', 'seo', 'settings'], admin: ['bookings', 'boats', 'content', 'seo', 'settings'], sales: ['bookings'], content: ['content', 'seo'], viewer: [] };
const LANG_OPT = ['ไทย', 'English', '中文', 'Русский'];
TEAM.forEach(t => { t.full ??= ''; t.wa ??= ''; t.line ??= ''; t.langs ??= ['ไทย']; t.showWeb ??= false; t.leads ??= true; t.active ??= true; t.perms ??= null; t.bio ??= tr('', ''); t.title ??= tr('ฝ่ายขาย', 'Sales'); });
const roleLabel = t => ({ super: 'Super Admin · ', admin: 'Admin · ' }[t.roleKey] || '') + (t.title?.en || ROLES[t.roleKey][0]);
const initialsAva = name => { const c = (name || '?').trim().charAt(0).toUpperCase(); return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#f2e2e4"/><text x="50%" y="54%" font-family="Arial" font-size="40" fill="#70000e" text-anchor="middle" dominant-baseline="middle">${c}</text></svg>`); };
const TE = { cur: null };
const _vTeam14 = vTeam;
vTeam = function () {
  _vTeam14();
  TEAM.forEach(t => t.role = roleLabel(t));
  $('#view h2').parentElement.parentElement.querySelector('.btn-p').setAttribute('onclick', 'teamEdit()');
  const cards = $$('#view .grid.md\\:grid-cols-3 > .card');
  cards.forEach((c, i) => { const t = TEAM[i]; if (!t) return;
    const nameP = c.querySelector('.flex-1 p'); nameP.innerHTML = `${esc(t.name)}${t.active ? '' : ' <span class="pill st-done ml-1">ปิดใช้งาน</span>'}${t.showWeb ? '' : ' <span class="text-[10.5px] text-muted">· ไม่แสดงบนเว็บ</span>'}`;
    c.querySelector('.flex-1 p + p').textContent = `${t.role} · ${t.tel}`;
    if (!t.active) c.classList.add('opacity-60');
    c.querySelector('button.btn-o').insertAdjacentHTML('beforebegin', '');
    c.querySelector('button.btn-o').outerHTML = `<div class="grid grid-cols-[1fr_auto] gap-2 mt-4"><button class="btn btn-o" onclick="BK.sales='${t.id}';BK.tab='all';go('bookings')">ดูงานของ ${esc(t.name)}</button><button class="btn btn-o !px-3" onclick="teamEdit('${t.id}')" aria-label="edit"><i data-lucide="pencil" class="w-3.5 h-3.5"></i>แก้ไข</button></div>`; });
  icons();
};
function teamEdit(id) {
  REG = [];
  const isNew = !id, t = isNew ? { id: 'u' + Date.now().toString(36), name: '', full: '', tel: '', wa: '', line: '', email: '', roleKey: 'sales', title: tr('ฝ่ายขาย', 'Sales'), langs: ['ไทย'], online: true, showWeb: true, leads: true, active: true, perms: null, bio: tr('', '') } : TEAM.find(x => x.id === id);
  TE.cur = JSON.parse(JSON.stringify(t)); TE.isNew = isNew; TE.ava = TEAM_IMG[t.id] || '';
  teamDraw(true);
}
function teamDraw(open) {
  const t = TE.cur, perms = t.perms || ROLE_PERMS[t.roleKey], open_ = BOOKINGS.filter(b => b.sales === t.id && ['new', 'contacted', 'talking'].includes(b.status)).length;
  const f = (k, l, ph = '', type = 'text') => `<label><span class="lbl">${l}</span><input type="${type}" class="inp" value="${esc(t[k] || '')}" placeholder="${ph}" oninput="TE.cur.${k}=this.value${k === 'name' ? ";if(!TE.ava||TE.ava.startsWith('data:image/svg'))$('#teAva').src=initialsAva(this.value)" : ''}"/></label>`;
  const tg = (k, l, h) => `<label class="flex items-start justify-between gap-3 py-1.5"><span>${l}${h ? `<span class="block text-[11px] text-muted">${h}</span>` : ''}</span><span class="tgl mt-0.5"><input type="checkbox" ${t[k] ? 'checked' : ''} onchange="TE.cur.${k}=this.checked"/><span></span></span></label>`;
  const html = `<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div><p class="text-[11px] text-muted">ทีมเซลล์</p><p class="font-medium">${TE.isNew ? 'เพิ่มสมาชิกใหม่' : 'แก้ไข · ' + esc(t.name)}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 grid gap-5 content-start">
      <div class="flex items-center gap-4"><img id="teAva" src="${TE.ava || initialsAva(t.name)}" class="w-20 h-20 rounded-full object-cover ring-1 ring-line"/>
        <div class="grid gap-2"><div class="flex flex-wrap gap-2"><label class="btn btn-o !h-8 cursor-pointer"><i data-lucide="upload" class="w-3.5 h-3.5"></i>อัปโหลดรูป<input type="file" accept="image/*" class="hidden" onchange="readFiles(this.files,s=>{TE.ava=s[0];$('#teAva').src=s[0]})"/></label><button class="btn btn-o !h-8" onclick="mediaPicker(s=>{TE.ava=s[0];teamDraw()},{title:'เลือกรูปโปรไฟล์'})"><i data-lucide="images" class="w-3.5 h-3.5"></i>คลังสื่อ</button></div><p class="text-[11px] text-muted">รูปนี้แสดงบนหน้าเว็บส่วน “ทีมของเรา” · แนะนำรูปหน้าตรง สี่เหลี่ยมจัตุรัส</p></div></div>
      <div class="grid sm:grid-cols-2 gap-3">${f('name', 'ชื่อเล่น (แสดงบนเว็บ)', 'เช่น Kwang')}${f('full', 'ชื่อ-นามสกุล', 'สำหรับภายใน')}</div>
      ${bi('ตำแหน่งที่แสดงบนเว็บ', t.title)}
      <div class="grid sm:grid-cols-2 gap-3">${f('tel', 'เบอร์โทร', '+66 8x xxx xxxx', 'tel')}${f('wa', 'WhatsApp', 'เบอร์ WhatsApp', 'tel')}${f('line', 'LINE ID', '@boattrip หรือ ID ส่วนตัว')}${f('email', 'อีเมล (ใช้เข้าสู่ระบบ)', 'name@boattripthailand.com', 'email')}</div>
      <div><p class="lbl">ภาษาที่สื่อสารได้</p><div class="flex flex-wrap gap-1.5">${LANG_OPT.map(l => `<button class="h-8 px-3 rounded-full text-[12.5px] ${t.langs.includes(l) ? 'bg-ink text-white' : 'ring-1 ring-line text-muted'}" onclick="const a=TE.cur.langs,k=a.indexOf('${l}');k<0?a.push('${l}'):a.splice(k,1);teamDraw()">${l}</button>`).join('')}</div><p class="text-[11px] text-muted mt-1.5">ใช้กระจายคำขอ เช่น ลูกค้าจากหน้า EN ส่งให้คนที่พูดอังกฤษได้</p></div>
      <div class="bi-opt">${optBi(bi('แนะนำตัวสั้นๆ (ไม่บังคับ)', t.bio, { rows: 2 }), { th: 'เช่น ดูแลลูกค้าเช่าเรือมา 8 ปี ถนัดทริปครอบครัว', en: 'e.g. 8 years helping families plan their day at sea' })}</div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium mb-2">บทบาท & สิทธิ์ในหลังบ้าน</p>
        <div class="grid sm:grid-cols-2 gap-2">${Object.entries(ROLES).map(([k, [l, d]]) => `<button class="text-left rounded-xl p-3 ${t.roleKey === k ? 'ring-2 ring-maroon bg-maroon-50' : 'ring-1 ring-line'}" onclick="TE.cur.roleKey='${k}';TE.cur.perms=null;teamDraw()"><p class="text-[13px] font-medium">${l}</p><p class="text-[11px] text-muted mt-0.5">${d}</p></button>`).join('')}</div>
        <div class="mt-3 grid gap-1">${PERMS.map(([k, l]) => `<label class="flex items-center gap-2.5 text-[12.5px] py-1"><input type="checkbox" class="accent-[#70000e] w-4 h-4" ${perms.includes(k) ? 'checked' : ''} onchange="const p=TE.cur.perms||[...ROLE_PERMS[TE.cur.roleKey]];this.checked?p.push('${k}'):p.splice(p.indexOf('${k}'),1);TE.cur.perms=p"/>${l}</label>`).join('')}</div></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium mb-1">การแสดงผล & คำขอจอง</p>${tg('showWeb', 'แสดงบนหน้าเว็บ', 'การ์ดทีมเซลล์ และปุ่มโทร/WhatsApp')}${tg('leads', 'รับคำขอจองใหม่', 'อยู่ในรอบกระจายคำขออัตโนมัติ')}${tg('online', 'ออนไลน์ตอนนี้')}${tg('active', 'เปิดใช้งานบัญชี', 'ปิด = เข้าสู่ระบบไม่ได้ ข้อมูลการจองเดิมยังอยู่')}</div>
      ${!TE.isNew ? `<div class="rounded-xl bg-sand p-4"><p class="text-[12px] font-medium">ลบสมาชิก</p><p class="text-[11.5px] text-muted mt-1">${open_ ? `มีงานค้าง ${open_} รายการ · ต้องโอนให้คนอื่นก่อน` : 'ไม่มีงานค้าง · ลบได้'} · แนะนำให้ปิดใช้งานแทนการลบ เพื่อเก็บประวัติการขาย</p>
        <div class="flex flex-wrap gap-2 mt-3">${open_ ? `<select id="teTo" class="inp !h-8 !w-auto">${TEAM.filter(x => x.id !== t.id && x.active).map(x => `<option value="${x.id}">โอนงานให้ ${esc(x.name)}</option>`).join('')}</select><button class="btn btn-o !h-8" onclick="teamTransfer()">โอนงาน</button>` : `<button class="btn btn-o !h-8 text-[#a3222c]" onclick="teamDelete()"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i>ลบสมาชิก</button>`}</div></div>` : ''}
    </div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeDrawer()">ยกเลิก</button><button class="btn btn-p" onclick="teamSave()">${TE.isNew ? 'เพิ่มและส่งคำเชิญ' : 'บันทึก'}</button></div>`;
  if (open) openDrawer(html); else { const sc = $('#drawer .overflow-y-auto')?.scrollTop || 0; $('#drawer').innerHTML = html; $('#drawer .overflow-y-auto').scrollTop = sc; icons(); }
}
function teamSave() {
  const t = TE.cur; if (!t.name.trim()) return toast('ใส่ชื่อเล่นก่อน'); if (!t.tel.trim()) return toast('ใส่เบอร์โทรก่อน');
  if (t.roleKey !== 'super' && TEAM.filter(x => x.roleKey === 'super' && x.active && x.id !== t.id).length === 0) return toast('ต้องมี Super Admin อย่างน้อย 1 คน');
  t.role = roleLabel(t); TEAM_IMG[t.id] = TE.ava || initialsAva(t.name);
  if (TE.isNew) { TEAM.push(t); toast(`เพิ่ม ${t.name} แล้ว · ส่งอีเมลเชิญเข้าระบบไปที่ ${t.email || '(ยังไม่มีอีเมล)'}`); }
  else { Object.assign(TEAM.find(x => x.id === t.id), t); toast('บันทึกแล้ว'); }
  closeDrawer(); vTeam();
}
function teamTransfer() { const to = $('#teTo').value, id = TE.cur.id; let n = 0; BOOKINGS.forEach(b => { if (b.sales === id && ['new', 'contacted', 'talking'].includes(b.status)) { b.sales = to; n++; } }); toast(`โอน ${n} งานให้ ${teamOf(to).name} แล้ว`); teamDraw(); }
function teamDelete() { const id = TE.cur.id; if (TEAM.find(x => x.id === id).roleKey === 'super' && TEAM.filter(x => x.roleKey === 'super').length < 2) return toast('ลบ Super Admin คนสุดท้ายไม่ได้');
  const i = TEAM.findIndex(x => x.id === id), name = TEAM[i].name; TEAM[i].active = false; TEAM[i].showWeb = false; TEAM[i].leads = false; TEAM[i].deleted = true; closeDrawer(); vTeam(); toast(`ลบ ${name} แล้ว · ประวัติการขายยังเก็บไว้`); }
/* deleted members hidden from the team grid */
const _vTeam14b = vTeam;
vTeam = function () { const keep = TEAM.slice(); const shown = keep.filter(t => !t.deleted); TEAM.length = 0; TEAM.push(...shown); try { _vTeam14b(); } finally { TEAM.length = 0; TEAM.push(...keep); } };
PAGES.find(p => p[0] === 'team')[3] = vTeam;



/* =====================================================================
   SITE SETTINGS – brand (logo / favicon), contact, address, social,
   company & licence, notifications, maintenance; plus existing booking & language settings
   ===================================================================== */
const SITECFG = {
  tab: 'brand',
  name: tr('Boat Trip Thailand', 'Boat Trip Thailand'), tagline: tr('เช่าเรือยอชต์ส่วนตัว ภูเก็ต', 'Private yacht charter in Phuket'),
  logo: '', logoDark: '', favicon: '', ogDefault: '', color: '#70000e',
  phone: '+66 61 172 5854', email: 'boattripthailand@gmail.com', wa: '+66 61 172 5854', line: '@boattripthailand', lineUrl: 'https://lin.ee/kkzkoX7',
  address: tr('79/29 หมู่ 4 ต.เกาะแก้ว อ.เมืองภูเก็ต จ.ภูเก็ต 83000', '79/29 Moo 4, Koh Kaew, Muang Phuket, Phuket 83000'), map: 'https://maps.app.goo.gl/82Rp4Z99B1Jj5WNTA', hours: tr('ทุกวัน 08:00–20:00', 'Daily 08:00–20:00'),
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
const ICON_OPTS = ['facebook', 'instagram', 'youtube', 'tiktok', 'line', 'whatsapp', 'messenger', 'x', 'telegram', 'linkedin', 'pinterest', 'tripadvisor', 'googlemaps', 'phone', 'mail', 'globe', 'message-circle', 'link-2'];
/* official brand marks (Simple Icons, CC0) for the social links; anything else stays a lucide icon */
const SOC_BRAND = {"facebook":"M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z","instagram":"M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077","youtube":"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z","tiktok":"M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z","line":"M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314","whatsapp":"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z","messenger":"M.001 11.639C.001 4.949 5.241 0 12.001 0S24 4.95 24 11.639c0 6.689-5.24 11.638-12 11.638-1.21 0-2.38-.16-3.47-.46a.96.96 0 00-.64.05l-2.39 1.05a.96.96 0 01-1.35-.85l-.07-2.14a.97.97 0 00-.32-.68A11.39 11.389 0 01.002 11.64zm8.32-2.19l-3.52 5.6c-.35.53.32 1.139.82.75l3.79-2.87c.26-.2.6-.2.87 0l2.8 2.1c.84.63 2.04.4 2.6-.48l3.52-5.6c.35-.53-.32-1.13-.82-.75l-3.79 2.87c-.25.2-.6.2-.86 0l-2.8-2.1a1.8 1.8 0 00-2.61.48z","x":"M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z","telegram":"M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z","linkedin":"M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z","pinterest":"M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z","googlemaps":"M19.527 4.799c1.212 2.608.937 5.678-.405 8.173-1.101 2.047-2.744 3.74-4.098 5.614-.619.858-1.244 1.75-1.669 2.727-.141.325-.263.658-.383.992-.121.333-.224.673-.34 1.008-.109.314-.236.684-.627.687h-.007c-.466-.001-.579-.53-.695-.887-.284-.874-.581-1.713-1.019-2.525-.51-.944-1.145-1.817-1.79-2.671L19.527 4.799zM8.545 7.705l-3.959 4.707c.724 1.54 1.821 2.863 2.871 4.18.247.31.494.622.737.936l4.984-5.925-.029.01c-1.741.601-3.691-.291-4.392-1.987a3.377 3.377 0 0 1-.209-.716c-.063-.437-.077-.761-.004-1.198l.001-.007zM5.492 3.149l-.003.004c-1.947 2.466-2.281 5.88-1.117 8.77l4.785-5.689-.058-.05-3.607-3.035zM14.661.436l-3.838 4.563a.295.295 0 0 1 .027-.01c1.6-.551 3.403.15 4.22 1.626.176.319.323.683.377 1.045.068.446.085.773.012 1.22l-.003.016 3.836-4.561A8.382 8.382 0 0 0 14.67.439l-.009-.003zM9.466 5.868L14.162.285l-.047-.012A8.31 8.31 0 0 0 11.986 0a8.439 8.439 0 0 0-6.169 2.766l-.016.018 3.665 3.084z","tripadvisor":"M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.972 5.972 0 0 0 4.072 1.598 6 6 0 0 0 6-5.998 5.982 5.982 0 0 0-1.957-4.432L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM12 6.255c1.531 0 3.063.303 4.504.903C13.943 8.138 12 10.43 12 13.1c0-2.671-1.942-4.962-4.504-5.942A11.72 11.72 0 0 1 12 6.256zM6.002 9.157a4.059 4.059 0 1 1 0 8.118 4.059 4.059 0 0 1 0-8.118zm11.992.002a4.057 4.057 0 1 1 .003 8.115 4.057 4.057 0 0 1-.003-8.115zm-11.992 1.93a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256zm11.992 0a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256z"};
const SOC_OLD = { 'music-2': 'tiktok', twitter: 'x', send: 'telegram' };   // icons saved before the brand marks
const socIco = (ic, cls = 'w-4 h-4') => { const k = SOC_OLD[ic] || ic; return SOC_BRAND[k] ? `<svg viewBox="0 0 24 24" class="${cls} shrink-0" fill="currentColor" role="img" aria-label="${k}"><path d="${SOC_BRAND[k]}"/></svg>` : `<i data-lucide="${ic}" class="${cls}"></i>`; };
/* links saved with the old generic icons get their brand's mark (LINE was a chat bubble, WhatsApp a phone, …) */
function socMigrate() { (SITECFG.social || []).forEach(s => { const k = s.k === 'twitter' ? 'x' : s.k; if (SOC_BRAND[k] && ['facebook', 'instagram', 'youtube', 'music-2', 'message-circle', 'phone', 'twitter', 'send', 'linkedin', 'link-2'].includes(s.icon)) s.icon = k; else if (SOC_OLD[s.icon]) s.icon = SOC_OLD[s.icon]; }); }

const CFG_TABS = [['brand', 'แบรนด์ & โลโก้', 'palette'], ['contact', 'ข้อมูลติดต่อ & ที่อยู่', 'map-pin'], ['social', 'โซเชียลมีเดีย', 'share-2'], ['company', 'บริษัท & ใบอนุญาต', 'file-badge'], ['booking', 'สกุลเงินที่แสดง', 'coins'], ['lang', 'ภาษา', 'languages'], ['notify', 'แจ้งเตือน', 'bell'], ['system', 'ระบบ', 'wrench']];
(() => { const L = $('#side img')?.src || ''; SITECFG.logo = L; SITECFG.logoDark = L; SITECFG.favicon = $('link[rel=icon]')?.href || L; SITECFG.ogDefault = THUMBS['leopard-90-ft']; })();
const cfgIn = (k, l, ph = '', type = 'text', mono = false) => `<label><span class="lbl">${l}</span><input type="${type}" class="inp ${mono ? 'font-mono !text-[12.5px]' : ''}" value="${esc(SITECFG[k] || '')}" placeholder="${ph}" oninput="SITECFG.${k}=this.value;cfgPreview()"/></label>`;
function imgSlot(k, l, hint, { bg = '#fff', ratio = 'aspect-[3/1]', fit = 'object-contain' } = {}) {
  return `<div><p class="lbl">${l}</p><div class="flex items-center gap-3"><div class="w-40 ${ratio} rounded-xl ring-1 ring-line grid place-items-center overflow-hidden shrink-0" style="background:${bg}"><img src="${SITECFG[k]}" class="${fit.includes('cover') ? fit : fit}" style="${fit.includes('cover') ? '' : `height:${ratio.includes('square') ? 56 : 40}px;width:auto;max-width:85%`}"/></div>
    <div class="grid gap-1.5"><div class="flex flex-wrap gap-1.5"><label class="btn btn-o !h-8 cursor-pointer"><i data-lucide="upload" class="w-3.5 h-3.5"></i>อัปโหลด<input type="file" accept="image/*,.svg,.ico" class="hidden" onchange="readFiles(this.files,s=>{SITECFG.${k}=s[0];vSettings()})"/></label><button class="btn btn-o !h-8" onclick="mediaPicker(s=>{SITECFG.${k}=s[0];vSettings()},{title:'เลือกจากคลังสื่อ'})"><i data-lucide="images" class="w-3.5 h-3.5"></i>คลังสื่อ</button></div><p class="text-[11px] text-muted">${hint}</p></div></div></div>`;
}
/* ---------- ตั้งค่า → แบรนด์ & โลโก้ (Liquid Glass layout: settings left, one live preview right) ---------- */
function brandTile(k, l, hint, kind) {
  const src = SITECFG[k] || '';
  const bg = kind === 'dark' ? 'background:#3a0007' : kind === 'cover' ? 'background:#e9e4e3' : kind === 'icon' ? 'background:repeating-conic-gradient(rgb(35 20 22 / .05) 0 25%, transparent 0 50%) 0 0/14px 14px, rgb(255 255 255 / .7)' : 'background:#fff';
  const img = !src ? `<span class="text-[11px] text-muted">ยังไม่มีรูป</span>` : kind === 'cover' ? `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover"/>` : `<img src="${src}" alt="" style="height:${kind === 'icon' ? 56 : 46}px;width:auto;max-width:80%;object-fit:contain${kind === 'icon' ? ';filter:drop-shadow(0 6px 10px rgb(58 0 7 / .18))' : ''}"/>`;
  return `<div class="min-w-0 rounded-2xl p-2.5" style="background:rgb(255 255 255 / .5);box-shadow:inset 0 0 0 1px rgb(35 20 22 / .07), inset 0 1px 0 #fff">
    <div class="rounded-xl overflow-hidden grid place-items-center" style="height:118px;${bg};box-shadow:inset 0 0 0 1px rgb(35 20 22 / .06)">${img}</div>
    <div class="px-1 pt-2.5"><p class="text-[13px] font-medium">${l}</p><p class="text-[11px] text-muted mt-0.5" style="min-height:2.6em">${hint}</p>
      <div class="flex gap-1.5 mt-2"><label class="btn btn-o !h-8 !text-[12px] flex-1 justify-center cursor-pointer"><i data-lucide="upload" class="w-3.5 h-3.5"></i>อัปโหลด<input type="file" accept="image/*,.svg,.ico" class="hidden" onchange="readFiles(this.files,s=>{SITECFG.${k}=s[0];vSettings()})"/></label><button class="btn btn-o !h-8 !text-[12px] flex-1 justify-center" onclick="mediaPicker(s=>{SITECFG.${k}=s[0];vSettings()},{title:'เลือกจากคลังสื่อ'})"><i data-lucide="images" class="w-3.5 h-3.5"></i>คลังสื่อ</button></div></div></div>`;
}
const brandSec = (icon, title, sub, inner) => `<div class="card p-5 min-w-0"><div class="flex items-start gap-3 mb-4"><span class="w-9 h-9 rounded-xl grid place-items-center shrink-0" style="background:rgb(112 0 14 / .08);color:#70000e"><i data-lucide="${icon}" class="w-4 h-4"></i></span><div><p class="font-medium">${title}</p><p class="text-[11.5px] text-muted">${sub}</p></div></div>${inner}</div>`;
function brandColor(v) {
  if (!/^#[0-9a-f]{6}$/i.test(v)) return;
  SITECFG.color = v;
  $$('[data-bc]').forEach(e => { e.style[e.dataset.bc] = v; });
  const a = $('#bcPick'), b = $('#bcHex'); if (a && a.value !== v) a.value = v; if (b && document.activeElement !== b) b.value = v;
}
function brandBody() {
  const C = SITECFG, host = (typeof SITE === 'string' && SITE) || 'boattripthailand.com';
  const SW = ['#e1d7cb', '#000000', '#1450ff', '#70000e'];   // CI palette
  const name = esc(C.name.th || C.name.en || 'Boat Trip Thailand'), nameEn = esc(C.name.en || 'Boat Trip Thailand');
  const left = `<div class="grid gap-4 min-w-0">
    ${brandSec('type', 'ชื่อ & สโลแกน', 'แสดงที่โลโก้ แท็บเบราว์เซอร์ และผลค้นหา Google', `<div class="grid gap-4">${bi('ชื่อเว็บไซต์', C.name)}${bi('สโลแกน (ใต้โลโก้ / ในผลค้นหา)', C.tagline)}</div>`)}
    ${brandSec('image', 'โลโก้ & ไอคอน', 'PNG / SVG พื้นใส · เปลี่ยนแล้วกดบันทึกด้านบน', `<div class="grid sm:grid-cols-2 gap-3">
      ${brandTile('logo', 'โลโก้ · พื้นสว่าง', 'Navbar และเอกสาร · สูงอย่างน้อย 120px', 'light')}
      ${brandTile('logoDark', 'โลโก้ · พื้นเข้ม', 'ใช้บนพื้นหลังสีเข้ม · ใช้เวอร์ชันสีขาวถ้ามี', 'dark')}
      ${brandTile('favicon', 'ไอคอนเว็บ (Favicon)', 'จัตุรัส 512×512 · ระบบสร้าง .ico และ Apple touch icon ให้', 'icon')}
      ${brandTile('ogDefault', 'รูปแชร์เริ่มต้น (OG)', '1200×630 · ใช้เมื่อหน้านั้นไม่มีรูปแชร์ของตัวเอง', 'cover')}</div>`)}
    ${brandSec('palette', 'สีหลักของแบรนด์', 'ใช้กับปุ่ม ลิงก์ และไฮไลต์บนเว็บ', `<div class="flex flex-wrap items-center gap-3">
      <label class="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 cursor-pointer" style="box-shadow:inset 0 0 0 1px rgb(35 20 22 / .12), 0 6px 14px -8px rgb(58 0 7 / .5)"><span class="absolute inset-0" data-bc="background" style="background:${C.color}"></span><input id="bcPick" type="color" value="${C.color}" class="absolute inset-0 opacity-0 cursor-pointer" oninput="brandColor(this.value)"/></label>
      <input id="bcHex" class="inp font-mono" style="width:120px" value="${esc(C.color)}" oninput="brandColor(this.value.trim())"/>
      <div class="flex gap-1.5">${SW.map(c => `<button class="w-7 h-7 rounded-full" title="${c}" style="background:${c};box-shadow:inset 0 0 0 2px rgb(255 255 255 / .7), 0 0 0 1px rgb(35 20 22 / .18)${C.color.toLowerCase() === c ? ', 0 0 0 3px #fff, 0 0 0 4.5px ' + c : ''}" onclick="brandColor('${c}');vSettings()"></button>`).join('')}</div></div>
      <div class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-line"><span class="h-9 px-4 rounded-full text-white text-[12.5px] grid place-items-center" data-bc="background" style="background:${C.color}">จองเลย</span><span class="h-9 px-4 rounded-full text-[12.5px] grid place-items-center" data-bc="color" style="color:${C.color};box-shadow:inset 0 0 0 1px currentColor">ดูเรือทั้งหมด</span><span class="text-[12.5px] underline underline-offset-2" data-bc="color" style="color:${C.color}">ลิงก์ในบทความ</span></div>`)}
  </div>`;
  const right = `<div class="min-w-0 xl:sticky xl:top-20"><div class="card p-5 grid gap-5">
    <div class="flex items-center justify-between"><p class="font-medium">ตัวอย่างบนเว็บ</p><span class="text-[11px] text-muted">อัปเดตทันทีที่เปลี่ยน · ยังไม่บันทึก</span></div>
    <div><p class="lbl">แท็บเบราว์เซอร์ & Navbar</p><div class="rounded-2xl overflow-hidden" style="box-shadow:0 0 0 1px rgb(35 20 22 / .08), 0 14px 30px -22px rgb(58 0 7 / .45)">
      <div class="px-2.5 pt-2 flex items-end gap-2" style="background:#e4e1e1"><span class="flex gap-1.5 pb-3 pl-1">${['#ff5f57', '#febc2e', '#28c840'].map(c => `<span class="w-2.5 h-2.5 rounded-full" style="background:${c}"></span>`).join('')}</span>
        <div class="bg-white rounded-t-lg px-3 h-8 flex items-center gap-2 text-[12px] min-w-0" style="width:210px"><img src="${C.favicon}" alt="" class="w-4 h-4 object-contain shrink-0"/><span class="truncate">${name}</span><span class="ml-auto text-muted">×</span></div></div>
      <div class="bg-white px-3 h-8 flex items-center text-[11px] text-muted border-b border-line"><i data-lucide="lock" class="w-3 h-3 mr-1.5"></i>${esc(host)}</div>
      <div style="padding:14px 14px 18px;background:linear-gradient(180deg,#f4efee,#ece6e5)"><div class="flex items-center gap-3" style="height:62px;padding:0 18px 0 14px;border-radius:26px;background:rgb(255 255 255 / .78);box-shadow:0 14px 30px -18px rgb(35 20 22 / .35), inset 0 1px 0 #fff, inset 0 0 0 1px rgb(255 255 255 / .6);-webkit-backdrop-filter:blur(22px) saturate(1.8);backdrop-filter:blur(22px) saturate(1.8)">
        <img src="${C.logo}" alt="" class="object-contain shrink-0" style="width:42px;height:42px"/>
        <div class="leading-none min-w-0"><p class="font-medium" style="font-size:15px;letter-spacing:.02em;color:#231416">${nameEn.toUpperCase().replace(/\s*THAILAND$/, '')}</p><p style="font-size:9px;letter-spacing:.32em;color:#6b5e60;margin-top:4px">THAILAND</p></div>
        <div class="ml-auto flex items-center shrink-0" style="gap:18px;color:#231416"><i data-lucide="search" class="w-[18px] h-[18px]" style="width:19px;height:19px"></i><i data-lucide="heart" style="width:19px;height:19px"></i><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg></div></div></div></div></div>
    <div><p class="lbl">เมื่อแชร์ลิงก์ (LINE / Facebook)</p><div class="rounded-2xl overflow-hidden bg-white flex items-stretch" style="box-shadow:0 0 0 1px rgb(35 20 22 / .08)"><div class="shrink-0" style="width:42%;aspect-ratio:1.91/1;background:#e9e4e3">${C.ogDefault ? `<img src="${C.ogDefault}" alt="" style="width:100%;height:100%;object-fit:cover"/>` : ''}</div>
      <div class="px-4 py-3 min-w-0 flex flex-col justify-center"><p class="text-[10.5px] text-muted uppercase tracking-wide truncate">${esc(host)}</p><p class="text-[13.5px] font-medium mt-0.5" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${nameEn} · ${esc(C.tagline.en || C.tagline.th || '')}</p><p class="text-[11.5px] text-muted mt-0.5 truncate">${esc(C.tagline.th || '')}</p></div></div></div>
    <div><p class="lbl">Footer · ติดต่อเรา</p>${footerPreview()}</div>
  </div></div>`;
  return `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">${left}${right}</div>`;
}
function footerPreview() {
  /* the ติดต่อเรา block of the public footer: light glass, icon tiles, social buttons */
  const C = SITECFG, soc = C.social.filter(s => s.on), M = '#70000e', MUTED = '#6b5e60';
  const tile = ic => `<span class="shrink-0 grid place-items-center" style="width:32px;height:32px;border-radius:11px;background:rgb(255 255 255 / .75);color:${M};box-shadow:inset 0 0 0 1px rgb(255 255 255 / .9), 0 6px 16px -10px rgb(58 0 7 / .5)">${ic === 'line' ? socIco('line', 'w-4 h-4') : `<i data-lucide="${ic}" class="w-4 h-4"></i>`}</span>`;
  const row = (ic, t, muted) => t ? `<li class="flex items-center gap-3">${tile(ic)}<span class="min-w-0" style="color:${muted ? MUTED : '#231416'}">${t}</span></li>` : '';
  return `<div id="cfgFoot" style="border-radius:26px;padding:24px 26px;background:rgb(255 255 255 / .58);color:#231416;box-shadow:0 30px 80px -40px rgb(58 0 7 / .45), 0 2px 10px -6px rgb(35 20 22 / .1), inset 0 1px 0 rgb(255 255 255 / .95), inset 0 0 0 1px rgb(255 255 255 / .55), 0 0 0 1px rgb(35 20 22 / .05);-webkit-backdrop-filter:blur(26px) saturate(1.85);backdrop-filter:blur(26px) saturate(1.85)">
    <p style="color:${M};font-size:11px;letter-spacing:.18em;font-weight:500;margin-bottom:14px">ติดต่อเรา</p>
    <ul class="grid" style="font-size:13.5px;row-gap:12px">${row('phone', esc(C.phone))}${row('mail', esc(C.email))}${row('line', C.line ? 'LINE ' + esc(C.line) : '')}${row('map-pin', esc(C.address.th || ''))}${row('anchor', C.marinas.map(esc).join(' · '), true)}</ul>
    <div class="flex flex-wrap gap-2" style="margin-top:16px">${soc.map(s => `<span class="w-10 h-10 rounded-full grid place-items-center ${s.url ? '' : 'opacity-40'}" title="${s.l}${s.url ? '' : ' (ยังไม่มีลิงก์)'}" style="background:rgb(255 255 255 / .7);color:${M};box-shadow:inset 0 0 0 1px rgb(255 255 255 / .9), 0 8px 18px -12px rgb(58 0 7 / .55)">${socIco(s.icon)}</span>`).join('')}</div></div>`;
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
  if (t === 'brand') body = brandBody();
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
        <div class="grid gap-2 min-w-0"><div class="flex items-center gap-2"><button class="w-9 h-9 rounded-full bg-sand grid place-items-center shrink-0" onclick="cfgIcon(${i},this)" title="เปลี่ยนไอคอน">${socIco(s.icon)}</button><input class="inp !h-9 !w-36" value="${esc(s.l)}" oninput="SITECFG.social[${i}].l=this.value"/>${s.url ? '' : '<span class="text-[11px] text-[#b4501a]">ยังไม่มีลิงก์</span>'}</div>
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
    <nav class="tabbar flex gap-1 overflow-x-auto no-sb mb-4">${CFG_TABS.map(([k, l]) => `<button class="tab ${t === k ? 'on' : ''}" onclick="SITECFG.tab='${k}';vSettings()">${l}</button>`).join('')}</nav><div class="min-w-0 fade">${body}</div>`;
  icons();
};
function cfgIcon(i, el) {
  edCloseMenu?.(); const r = el.getBoundingClientRect(), m = document.createElement('div'); m.id = 'edMenu'; m.className = 'ed-menu fade'; m.style.width = '232px';
  m.innerHTML = `<p class="px-2 pt-1 pb-2 text-[11px] text-muted">เลือกไอคอน</p><div class="grid grid-cols-6 gap-1">${ICON_OPTS.map(ic => `<button class="!h-9 !p-0 justify-center ${SITECFG.social[i].icon === ic ? 'bg-sand' : ''}" onclick="SITECFG.social[${i}].icon='${ic}';edCloseMenu();vSettings()" title="${ic}">${socIco(ic)}</button>`).join('')}</div>`;
  document.body.appendChild(m); m.style.top = (r.bottom + 6) + 'px'; m.style.left = Math.min(r.left, innerWidth - 250) + 'px'; icons(); setTimeout(() => addEventListener('mousedown', edMenuOut), 0);
}
function cfgSave() { const C = SITECFG; $('#side img').src = C.logo; $$('link[rel=icon]').forEach(l => l.href = C.favicon); SET.companyName = C.company; toast('บันทึกการตั้งค่าแล้ว · หน้าเว็บอัปเดตโลโก้ ไอคอน และข้อมูลติดต่อ'); }
PAGES.find(p => p[0] === 'settings')[3] = vSettings;



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
      ${bk.length ? '' : `<button class="btn !bg-[#a3222c] text-white" onclick="boatRemove('${slug}');closeModal();toast('ลบเรือแล้ว · ตั้ง redirect 301 ให้แล้ว');go('boats');vBoats()">ลบถาวร</button>`}</div></div>`);
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



/* =====================================================================
   WORDPRESS IMPORT – real articles from boattripthailand.WordPress.2026-10-20.xml
   ===================================================================== */
const WP = window.WPDATA || { arts: [], redir: [] };
(function importWP() {
  ART.length = 0; REDIR.length = 0;
  WP.arts.forEach(w => {
    const a = { ...w, cover: '__wp' + w.id, blocks: { th: w.blocks.th, en: w.blocks.en }, body: { th: '', en: '' }, imported: true };
    THUMBS[a.cover] = w.cover || THUMBS['leopard-90-ft'];
    ['th', 'en'].forEach(k => { a.body[k] = blocksHtml(a.blocks[k]); });
    ART.push(a);
    if (w.cover && !MEDIA.some(m => m.src === w.cover)) MEDIA.push(mkMedia(w.cover, { name: decodeURIComponent(w.cover.split('/').pop()), dir: 'blog', tags: [ACAT_A[w.cat]], alt: tr(w.title.th, w.title.en), source: 'own', rights: 'own', credit: 'WordPress เดิม', date: w.date, owner: w.title.en || w.title.th }));
  });
  WP.redir.forEach(r => REDIR.push({ ...r, from: decodeURI(r.from) }));
})();
/* remote WordPress images: fall back when offline */
document.addEventListener('error', e => { const t = e.target; if (t.tagName === 'IMG' && /^https:\/\/boattripthailand\.com/.test(t.src) && !t.dataset.fb) { t.dataset.fb = 1; t.title = 'รูปจากเว็บเดิม (โหลดไม่ได้ขณะออฟไลน์)'; t.src = THUMBS['leopard-90-ft']; } }, true);
/* articles list: import banner + pagination */
const AP = { page: 0, per: 25 };
const _vArticles17 = vArticles;
vArticles = function () {
  const arg = location.hash.split('/')[2]; if (arg) return vArticleEdit(arg);
  const all = ART.slice(); let rows = null;
  /* run original with a paged view of the filtered list */
  const f = all.filter(a => (AFL.tab === 'all' || a.status === AFL.tab) && (!AFL.cat || a.cat === AFL.cat) && (!AFL.noEn || a.tr.en === 'none' || a.tr.en === 'mt' || a.tr.th === 'none' || a.tr.th === 'mt') && (!AFL.q || (a.title.th + ' ' + a.title.en + ' ' + a.tags.join(' ')).toLowerCase().includes(AFL.q.toLowerCase()))).sort((x, y) => y.date.localeCompare(x.date));
  const pages = Math.max(1, Math.ceil(f.length / AP.per)); AP.page = Math.min(AP.page, pages - 1);
  const keep = new Set(f.slice(AP.page * AP.per, AP.page * AP.per + AP.per));
  const counts = k => all.filter(a => k === 'all' || a.status === k).length;
  ART.length = 0; ART.push(...all.filter(a => keep.has(a)));
  try { _vArticles17(); } finally { ART.length = 0; ART.push(...all); }
  /* fix counts/stats that were computed on the page subset */
  $$('#view .tab').forEach(t => { const m = t.getAttribute('onclick').match(/AFL\.tab='(\w+)'/); if (m) t.querySelector('span').textContent = counts(m[1]); t.setAttribute('onclick', t.getAttribute('onclick').replace('vArticles()', 'AP.page=0;vArticles()')); });
  const st = $$('#view .grid.grid-cols-2 .card p.text-\\[22px\\]'); if (st[0]) { st[0].textContent = all.length; st[1].textContent = counts('published'); st[2].textContent = '—'; st[3].textContent = all.filter(a => !['orig', 'ok'].includes(a.tr.th) || !['orig', 'ok'].includes(a.tr.en)).length; }
  const sub = $('#view h2 + p'); if (sub) sub.textContent = 'เขียนบทความ ไทย / อังกฤษ แยกกันได้ · ใช้ทำ SEO และลิงก์ไปหน้าเรือ · บทความจริงนำเข้าจากเว็บ WordPress เดิม';
  const v = $$('#view .grid.grid-cols-2 .card')[2]; if (v) v.querySelector('p.text-\\[11px\\]').textContent = 'เชื่อม GA4 เพื่อดูยอดอ่าน';
  $('#view .grid.grid-cols-2')?.insertAdjacentHTML('beforebegin', `<div class="rounded-xl bg-[#eaf6ef] text-[#1e5c37] text-[12.5px] px-4 py-3 mb-4 flex flex-wrap items-center gap-2"><i data-lucide="circle-check" class="w-4 h-4"></i>นำเข้าจาก WordPress แล้ว ${all.length} บทความ (${WP.arts.reduce((n, a) => n + (a.title.th ? 1 : 0) + (a.title.en ? 1 : 0), 0)} โพสต์ จับคู่ไทย/อังกฤษให้แล้ว) · รวม Title / Meta description / คีย์เวิร์ดจาก Yoast · ตั้ง redirect 301 จาก URL เดิมให้ ${WP.redir.length} รายการ<span class="flex-1"></span><button class="underline" onclick="SEOV.tab='redirects';go('seo')">ดู redirect</button></div>`);
  $('#view table.tbl')?.closest('.overflow-x-auto')?.insertAdjacentHTML('afterend', `<div class="flex items-center justify-between px-4 py-3 border-t border-line text-[12px] text-muted"><span>${f.length} บทความ · หน้า ${AP.page + 1}/${pages}</span><div class="flex gap-1"><button class="btn btn-g !h-8 !px-2" ${AP.page ? '' : 'disabled style="opacity:.3"'} onclick="AP.page--;vArticles()"><i data-lucide="chevron-left" class="w-4 h-4"></i></button><button class="btn btn-g !h-8 !px-2" ${AP.page < pages - 1 ? '' : 'disabled style="opacity:.3"'} onclick="AP.page++;vArticles()"><i data-lucide="chevron-right" class="w-4 h-4"></i></button></div></div>`);
  const q = $('#view input[placeholder^="ค้นหาชื่อบทความ"]'); q?.setAttribute('onkeydown', "if(event.key==='Enter'){AFL.q=this.value;AP.page=0;vArticles()}");
  icons();
};
/* editor: show where the article came from */
const _vArticleEdit17 = vArticleEdit;
vArticleEdit = function (id) { _vArticleEdit17(id); const a = artById(id); if (!a?.wp) return; const side = $('#view .grid.gap-4 > .card.p-5.text-\\[12px\\]');
  side?.insertAdjacentHTML('beforeend', `<p class="mt-2 pt-2 border-t border-line">นำเข้าจาก WordPress · ผู้เขียนเดิม: ${esc(a.wpAuthor)}</p>${['th', 'en'].filter(k => a.wp[k]).map(k => `<p class="font-mono text-[10.5px] break-all">${decodeURI(a.wp[k])} → ${k === 'en' ? '/en' : ''}/blog/${esc(a.slug[k])}</p>`).join('')}`); };
/* redirects tab: collapse the long WordPress list */
const _seoRedir17 = seoRedir; let REDALL = false;
seoRedir = function (P) { const all = REDIR.slice(), wp = all.filter(r => r.wp).length; if (!REDALL && all.length > 30) { REDIR.length = 0; REDIR.push(...all.slice(0, 30)); }
  let h; try { h = _seoRedir17(P); } finally { REDIR.length = 0; REDIR.push(...all); }
  return h.replace('<p class="font-medium">Redirect <span class="text-muted font-normal">· ' + Math.min(all.length, REDALL ? all.length : 30) + '</span></p>', `<p class="font-medium">Redirect <span class="text-muted font-normal">· ${all.length} (จาก WordPress ${wp})</span></p>`)
    .replace('<p class="text-[11px] text-muted px-4 py-3">', `${all.length > 30 ? `<button class="w-full py-2.5 border-t border-line text-[12px] text-maroon" onclick="REDALL=!REDALL;vSeo()">${REDALL ? 'แสดงน้อยลง' : `ดูทั้งหมด ${all.length} รายการ`}</button>` : ''}<p class="text-[11px] text-muted px-4 py-3">`); };
PAGES.find(p => p[0] === 'articles')[3] = vArticles;

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
const SRC = { google: ['Google ค้นหา (SEO)', 'search', '#1a73e8'], gads: ['Google Ads', 'megaphone', '#e37400'], meta: ['Facebook / IG Ads', 'megaphone', '#1877f2'], social: ['Social (ไม่เสียเงิน)', 'instagram', '#c13584'], line: ['LINE OA', 'message-circle', '#06c755'], wa: ['WhatsApp โดยตรง', 'phone', '#25d366'], ref: ['ลูกค้าแนะนำ / Agent', 'handshake', '#8a5a00'], direct: ['เข้าเว็บโดยตรง', 'globe', '#6b5e60'], phone: ['โทรศัพท์', 'phone-call', '#6b5e60'], other: ['เว็บไซต์อื่น', 'link', '#6b5e60'] };
const LOST_R = ['วันที่ต้องการเรือเต็ม', 'ราคาเกินงบ', 'เลือกเจ้าอื่น', 'ติดต่อลูกค้าไม่ได้', 'เลื่อน / ยกเลิกแผนเที่ยว', 'สภาพอากาศ / มรสุม', 'อื่น ๆ'];
const CONTACT = ['ฟอร์มบนเว็บ', 'WhatsApp', 'LINE', 'โทรศัพท์', 'อีเมล'];
const CAMPAIGN = { gads: ['yacht-charter-phuket-th', 'yacht-charter-phuket-en', 'catamaran-phi-phi-en'], meta: ['retarget-boat-viewers-30d', 'lookalike-customers-1pct', 'new-year-charter'], social: ['ig-bio-link', 'fb-page-post'] };
const SCORE_T = { hot: ['ร้อน', '#b42318', '#fdecea'], warm: ['อุ่น', '#9a5b00', '#fff6e5'], cold: ['เย็น', '#3b6e8f', '#eaf2f7'] };

/* ---------- migrate sample bookings → sample leads ---------- */
(function migrate() { if (window.__BOOT__) return;
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
  if (typeof l.score === 'number') { const s = l.score; return { s, r: l.scoreReasons || [], t: s >= 60 ? 'hot' : s >= 35 ? 'warm' : 'cold' }; }
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
const boatName = s => bySlug(s)?.name || (s && s.startsWith('act:') ? 'กิจกรรม · ' + s.slice(4) : s) || 'ยังไม่ระบุเรือ';

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
      <td><div class="flex items-center gap-1.5 whitespace-nowrap"><img src="${teamImg(s?.id)}" alt="" class="w-6 h-6 rounded-full object-cover"/>${s ? esc(s.name) : '<span class="text-muted">ยังไม่มีผู้รับ</span>'}</div></td>
      <td>${pill(l.status)}${l.status === 'lost' ? `<p class="text-[11px] text-muted mt-0.5">${esc(l.lost)}</p>` : ''}</td>
      <td class="whitespace-nowrap">${l.next && OPEN_ST.includes(l.status) ? `<span class="${l.next < iso(TODAY) ? 'text-[#b42318]' : l.next === iso(TODAY) ? 'text-maroon' : 'text-muted'}">${l.next === iso(TODAY) ? 'วันนี้' : fmtD(l.next)}</span>` : '<span class="text-muted">—</span>'}</td></tr>`; };
  const board = () => `<div class="flex gap-3 overflow-x-auto no-sb p-3">${Object.entries(STATUS).map(([k, [n]]) => { const L = list.filter(l => l.status === k); return `<div class="w-[260px] shrink-0 rounded-2xl bg-sand/70 p-2" ondragover="event.preventDefault();this.classList.add('ring-2','ring-maroon')" ondragleave="this.classList.remove('ring-2','ring-maroon')" ondrop="this.classList.remove('ring-2','ring-maroon');setStatus(event.dataTransfer.getData('id'),'${k}')">
      <div class="flex items-center justify-between px-2 py-1.5">${pill(k)}<span class="text-[11px] text-muted tnum">${L.length}</span></div>
      <div class="space-y-2 mt-1 max-h-[64vh] overflow-y-auto">${L.slice(0, 40).map(l => { const c = custOf(l.cust); return `<div draggable="true" ondragstart="event.dataTransfer.setData('id','${l.id}')" onclick="bookingDetail('${l.id}')" class="rounded-xl bg-white ring-1 ring-line p-3 cursor-pointer hover:ring-maroon">
        <div class="flex items-start justify-between gap-2"><p class="text-[13px] leading-tight truncate">${esc(c.name)}</p>${scorePill(l)}</div>
        <p class="text-[11.5px] text-muted mt-1 truncate">${boatName(l.boat)} · ${fmtD(l.date)} · ${l.guests} คน</p>
        <div class="flex items-center justify-between mt-2">${srcPill(l.src, 1)}<img src="${teamImg(l.sales)}" class="w-5 h-5 rounded-full object-cover"/></div>
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
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-[12.5px]"><div><dt class="lbl">โทร</dt><dd class="tnum">${c.phone}</dd></div><div><dt class="lbl">WhatsApp</dt><dd class="tnum">${c.wa ? `<a class="text-maroon hover:underline" href="https://wa.me/${phoneIntl(c.wa) || c.wa.replace(/\D/g, '')}" target="_blank" rel="noopener">${esc(c.wa)}</a>` : '—'}</dd></div><div><dt class="lbl">อีเมล</dt><dd class="break-all">${c.email || '—'}</dd></div><div><dt class="lbl">ภาษา</dt><dd>${l.lang === 'th' ? 'ไทย' : 'English'}</dd></div><div><dt class="lbl">รับข่าวสาร (PDPA)</dt><dd>${c.consent ? '<span class="text-[#1e7a46]">ยินยอม</span>' : '<span class="text-muted">ไม่ยินยอม</span>'}</dd></div></dl></div>
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
    <form id="nbF" class="nb-form" onsubmit="event.preventDefault();saveNew()">
      <fieldset class="nb-sec"><legend><i data-lucide="user-round"></i>ลูกค้า</legend>
        <label><span class="lbl">ชื่อลูกค้า *</span><input id="nbName" class="inp" required placeholder="ชื่อ หรือชื่อในแชท"/></label>
        <label><span class="lbl">เบอร์โทร *</span><input id="nbPhone" class="inp" inputmode="tel" required placeholder="+66 8x xxx xxxx"/></label>
        <label><span class="lbl">WhatsApp</span><input id="nbWa" class="inp" inputmode="tel" placeholder="ถ้าเป็นคนละเบอร์กับเบอร์โทร"/></label>
        <label><span class="lbl">อีเมล</span><input id="nbEmail" type="email" class="inp" placeholder="name@email.com"/></label>
        <label><span class="lbl">มาจาก</span><select id="nbSrc" class="inp">${Object.entries(SRC).map(([k, [n]]) => `<option value="${k}" ${k === 'wa' ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label><span class="lbl">ติดต่อผ่าน</span><select id="nbCh" class="inp">${CONTACT.map(c => `<option ${c === 'WhatsApp' ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      </fieldset>
      <fieldset class="nb-sec"><legend><i data-lucide="sailboat"></i>ทริป</legend>
        <label class="nb-wide"><span class="lbl">เรือที่สนใจ</span><select id="nbBoat" class="inp">${boats.map(b => `<option value="${b.slug}" ${b.slug === slug ? 'selected' : ''}>${b.name} · ${TYPE_TH[b.type]}</option>`).join('')}</select></label>
        <label><span class="lbl">วันที่ต้องการ</span><input id="nbDate" type="date" class="inp" value="${iso(addDays(TODAY, 14))}"/></label>
        <label><span class="lbl">จำนวนคน</span><input id="nbG" type="number" min="1" class="inp" value="8"/></label>
      </fieldset>
      <fieldset class="nb-sec"><legend><i data-lucide="headset"></i>การดูแล</legend>
        <label class="nb-wide"><span class="lbl">เซลล์ผู้ดูแล</span><select id="nbS" class="inp">${TEAM.filter(t => !t.deleted && ['super', 'admin', 'sales'].includes(t.roleKey)).map(t => `<option value="${t.id}" ${t.id === ME?.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>
        <label class="nb-wide"><span class="lbl">บันทึก</span><textarea id="nbNote" class="inp" rows="2" placeholder="รายละเอียดที่คุยไว้ เช่น งบ โอกาสพิเศษ รับที่โรงแรม"></textarea></label>
        <label class="nb-wide nb-consent"><span><b>ลูกค้ายินยอมรับข่าวสาร</b><small>ถามลูกค้าก่อนเปิด · ใช้ส่งโปรโมชันได้เฉพาะคนที่ยินยอม (PDPA)</small></span><span class="tgl"><input id="nbConsent" type="checkbox"/><span></span></span></label>
      </fieldset>
      <div class="nb-foot"><button type="button" class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p"><i data-lucide="check" class="w-4 h-4"></i>บันทึกลีด</button></div>
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
  const users30 = 0 /* needs GA4 — sample traffic is not mixed with real leads */, leads30 = BOOKINGS.filter(l => l.created >= iso(addDays(now, -30)) && l.contact === 'ฟอร์มบนเว็บ').length;
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
  const list = CUSTOMERS.filter(c => !CQ || (c.name + c.phone + (c.wa || '') + c.email).toLowerCase().includes(CQ.toLowerCase())).map(c => ({ c, s: st(c) })).sort((a, b) => (b.s.last || '').localeCompare(a.s.last || ''));
  $('#view').innerHTML = `${head('ลูกค้า', `${CUSTOMERS.length} ราย · ยินยอมรับข่าวสาร ${CUSTOMERS.filter(c => c.consent).length} ราย`, `<input class="inp !w-64" placeholder="ค้นหาชื่อ เบอร์ อีเมล" value="${esc(CQ)}" oninput="CQ=this.value;clearTimeout(window._cq);window._cq=setTimeout(()=>{vCustomers();const i=$('#view input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"/>`)}
    <div class="card overflow-x-auto"><table class="tbl"><thead><tr><th>ลูกค้า</th><th>ติดต่อ</th><th>มาจาก</th><th>ลีด</th><th>ปิดได้</th><th>ล่าสุด</th><th>รับข่าวสาร</th></tr></thead><tbody>
      ${list.map(({ c, s }) => `<tr class="click" onclick="custDetail('${c.id}')"><td><div class="flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-sand grid place-items-center text-[12px]">${esc(c.name.slice(0, 1))}</span><div><p>${esc(c.name)} ${s.w ? '<span class="pill st-confirmed ml-1">ลูกค้า</span>' : ''}${c.tags.map(t => `<span class="pill st-new ml-1">${t}</span>`).join('')}</p><p class="text-[11px] text-muted">${c.country}</p></div></div></td>
        <td><p class="tnum">${c.phone}</p>${c.wa && c.wa.replace(/\D/g, '') !== String(c.phone).replace(/\D/g, '') ? `<p class="text-[11px] text-muted tnum">WhatsApp ${esc(c.wa)}</p>` : ''}<p class="text-[11px] text-muted">${c.email}</p></td><td>${s.src ? srcPill(s.src, 1) : '—'}</td><td class="tnum">${s.n}</td><td class="tnum">${s.w}</td><td class="text-muted whitespace-nowrap">${s.last ? fmtD(s.last) : '—'}</td><td>${c.consent ? '<i data-lucide="check" class="w-4 h-4 text-[#1e7a46]"></i>' : '<span class="text-muted">—</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
  icons();
};
custDetail = function (id) {
  const c = custOf(id), L = BOOKINGS.filter(l => l.cust === id);
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line"><p class="font-medium">${esc(c.name)}</p><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 space-y-5"><dl class="grid grid-cols-2 gap-3"><div><dt class="lbl">ประเทศ</dt><dd>${c.country}</dd></div><div><dt class="lbl">ภาษา</dt><dd>${c.lang === 'th' ? 'ไทย' : 'English'}</dd></div><div><dt class="lbl">โทร</dt><dd class="tnum">${c.phone}</dd></div><div><dt class="lbl">WhatsApp</dt><dd class="tnum">${c.wa ? `<a class="text-maroon hover:underline" href="https://wa.me/${phoneIntl(c.wa) || c.wa.replace(/\D/g, '')}" target="_blank" rel="noopener">${esc(c.wa)}</a>` : '—'}</dd></div><div><dt class="lbl">อีเมล</dt><dd class="break-all">${c.email || '—'}</dd></div></dl>
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
        <div class="flex items-end justify-between gap-3 mt-4"><div><p class="text-2xl tnum">${r.ids.length}</p><p class="text-[11px] text-muted">คน · ยินยอมรับข่าวสาร ${r.ok.length}</p></div>${sy ? `<p class="text-[11px] text-[#1e7a46] text-right">ดาวน์โหลดไฟล์แล้ว<br/>${sy}</p>` : ''}</div>
        <div class="flex flex-wrap gap-2 mt-4 pt-3 border-t border-line"><button class="btn btn-o !h-8" onclick="auSync('${s.k}','Meta')" title="ไฟล์ Custom Audience (เข้ารหัสแล้ว)"><i data-lucide="download" class="w-3.5 h-3.5"></i>Meta</button><button class="btn btn-o !h-8" onclick="auSync('${s.k}','Google Ads')" title="ไฟล์ Customer Match (เข้ารหัสแล้ว)"><i data-lucide="download" class="w-3.5 h-3.5"></i>Google</button><button class="btn btn-o !h-8" onclick="auBroadcast('${s.k}')"><i data-lucide="send" class="w-3.5 h-3.5"></i>ส่งข้อความ</button><button class="btn btn-g !h-8" onclick="auList('${s.k}')">ดูรายชื่อ</button></div></div>`; }).join('')}</div>
      <div class="card p-4 mt-4"><p class="font-medium">สร้างกลุ่มเอง</p><p class="text-[12px] text-muted">เลือกเงื่อนไข ระบบนับคนให้ทันที</p>
        <div class="grid grid-cols-2 lg:grid-cols-6 gap-2 mt-3">${sel('status', Object.entries(STATUS).map(([k, v]) => [k, v[0]]), 'ทุกสถานะ')}${sel('src', Object.entries(SRC).map(([k, v]) => [k, v[0]]), 'ทุกแหล่งที่มา')}${sel('type', Object.entries(TYPE_TH), 'ทุกประเภทเรือ')}${sel('lang', [['th', 'ไทย'], ['en', 'English']], 'ทุกภาษา')}${sel('score', Object.entries(SCORE_T).map(([k, v]) => [k, v[0]]), 'ทุกคะแนน')}${sel('lost', LOST_R.map(r => [r, r]), 'เหตุผลไม่สำเร็จ')}</div>
        <div class="flex flex-wrap items-center gap-3 mt-4"><p><b class="text-xl tnum">${cs.ids.length}</b> <span class="text-muted text-[12px]">คน · ยินยอม ${cs.ok.length} · ${cs.L.length} ลีด</span></p><span class="flex-1"></span><button class="btn btn-o" onclick="auBroadcast('custom')"><i data-lucide="send" class="w-3.5 h-3.5"></i>ส่งข้อความ</button><button class="btn btn-o" onclick="auSync('custom','Meta')">ไฟล์ Meta</button><button class="btn btn-o" onclick="auSync('custom','Google Ads')">ไฟล์ Google</button><button class="btn btn-p" onclick="auCsv()"><i data-lucide="download" class="w-3.5 h-3.5"></i>Export</button></div></div>
      <p class="text-[11px] text-muted mt-3 flex gap-1.5"><i data-lucide="shield-check" class="w-3.5 h-3.5 shrink-0"></i>ไฟล์ Meta / Google มีเฉพาะคนที่ยินยอมรับข่าวสาร · เบอร์และอีเมลเข้ารหัส SHA-256 บนเซิร์ฟเวอร์ ไม่มีชื่อหรือเบอร์ที่อ่านได้ · ใครถอนความยินยอมจะไม่อยู่ในไฟล์ครั้งถัดไป (อัปโหลดไฟล์ใหม่แทนรายชื่อเดิม)</p>`;
  }
  if (AU.tab === 'conv') body = auConvBody();
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
    <div class="tabbar flex gap-1 overflow-x-auto no-sb mb-4">${tabs.map(([k, l]) => `<button class="tab ${AU.tab === k ? 'on' : ''}" onclick="AU.tab='${k}';vAudiences()">${l}</button>`).join('')}</div>${body}`;
  icons();
}
const segByKey = k => k === 'custom' ? l => { const B = AU.b; return (!B.status || l.status === B.status) && (!B.src || l.src === B.src) && (!B.type || bySlug(l.boat)?.type === B.type) && (!B.lang || l.lang === B.lang) && (!B.score || leadScore(l).t === B.score) && (!B.lost || l.lost === B.lost); } : SEGS.find(s => s.k === k).f;
function auSync(k, p) {
  if (!can('export')) return toast('ต้องมีสิทธิ์ Export'); const r = segLeads(segByKey(k)); if (!r.ok.length) return toast('ไม่มีคนที่ยินยอมในกลุ่มนี้');
  const plat = p === 'Meta' ? 'meta' : 'google', n = (SEGS.find(s => s.k === k) || { n: 'กลุ่มที่สร้างเอง' }).n;
  api('POST', 'marketing/audience', { ids: r.ok, platform: plat, seg: k, label: n }).then(d => {
    if (!d.count) return toast('ไม่มีเบอร์หรืออีเมลที่ใช้ได้ในกลุ่มนี้');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([d.csv], { type: 'text/csv' })); a.download = `btt-${k}-${plat}-${iso(TODAY)}.csv`; a.click();
    AU.sync[k] = `${p} · ${d.count} คน`; AUDIT_DIRTY = true; vAudiences();
    openModal(`<div class="p-5 border-b border-line"><p class="font-medium">ดาวน์โหลดไฟล์ “${esc(n)}” แล้ว · ${d.count} คน</p><p class="text-[12px] text-muted mt-1">ตัดคนที่ไม่ยินยอม ${r.ids.length - r.ok.length} คน${d.skipped ? ` · ไม่มีเบอร์/อีเมลที่ใช้ได้ ${d.skipped} คน` : ''} · เบอร์และอีเมลเข้ารหัส SHA-256 แล้ว</p></div>
      <div class="p-5 text-[13px] space-y-2">${plat === 'meta' ? `<p class="font-medium">อัปโหลดเข้า Meta</p><ol class="list-decimal pl-5 space-y-1 text-ink/80"><li>Meta Ads Manager → <b>Audiences</b> → Create audience → <b>Custom audience</b></li><li>เลือก <b>Customer list</b> → อัปโหลดไฟล์นี้ (คอลัมน์ email, phone)</li><li>ตั้งชื่อตามกลุ่ม แล้วใช้สร้าง Lookalike หรือใส่เป็น Exclusion ในแคมเปญ</li></ol>` : `<p class="font-medium">อัปโหลดเข้า Google Ads</p><ol class="list-decimal pl-5 space-y-1 text-ink/80"><li>Google Ads → Tools → <b>Audience manager</b> → + → <b>Customer list</b></li><li>เลือก “Upload hashed data” → อัปโหลดไฟล์นี้ (คอลัมน์ Email, Phone)</li><li>ใช้ในแคมเปญ Search / PMax เป็น audience signal หรือ exclusion</li></ol>`}
        <p class="text-[11.5px] text-muted pt-1">รายชื่อในแพลตฟอร์มไม่อัปเดตเอง · อัปโหลดไฟล์ใหม่ทับรายชื่อเดิมเดือนละครั้ง หรือเมื่อมีคนถอนความยินยอม</p></div>
      <div class="p-4 border-t border-line flex justify-end"><button class="btn btn-p" onclick="closeModal()">เข้าใจแล้ว</button></div>`);
  }).catch(fail);
}
/* message a segment one by one: WhatsApp link with the text filled in, email, or copy for LINE — only customers who agreed */
const phoneIntl = p => { const d = String(p || '').replace(/\D/g, ''), x = d.startsWith('00') ? d.slice(2) : d.startsWith('0') ? '66' + d.slice(1) : d; return x.length >= 8 && x.length <= 15 ? x : ''; };
const AU_MSG = {
  full: ['สวัสดีค่ะคุณ{name} ช่วงที่คุณเคยสอบถาม {boat} เต็มไป ตอนนี้มีคิวว่างและเรือขนาดใกล้เคียงกันแล้วค่ะ สนใจให้เช็กวันให้ไหมคะ', 'Hi {name}, {boat} was fully booked when you asked — we now have open dates and similar boats. Shall we check a date for you?'],
  price: ['สวัสดีค่ะคุณ{name} มีเรือขนาดเล็กลงและราคาช่วงโลว์ซีซั่นที่น่าจะเข้างบมากขึ้นค่ะ ให้ส่งตัวเลือกให้ไหมคะ', 'Hi {name}, we have smaller boats and low-season prices that may fit your budget better. Shall we send you some options?'],
  stale: ['สวัสดีค่ะคุณ{name} ไม่ทราบว่าได้ตัดสินใจเรื่องทริป {boat} หรือยังคะ มีคำถามเพิ่มเติมทักมาได้เลยค่ะ', 'Hi {name}, just checking in about your {boat} trip. Happy to answer any questions!'],
  anniv: ['สวัสดีค่ะคุณ{name} ครบรอบ 1 ปีทริปทะเลของคุณแล้ว! ปีนี้อยากไปเกาะไหนดีคะ ทักมาให้เราช่วยจัดได้เลย', 'Hi {name}, it has been a year since your boat trip with us! Where would you like to go this season?'],
  _: ['สวัสดีค่ะคุณ{name} จาก Boat Trip Thailand มีทริปเรือที่น่าจะถูกใจคุณค่ะ', 'Hi {name}, this is Boat Trip Thailand — we have a boat trip you might like.'],
};
const AU_STOP = ['\n\n(ไม่ต้องการรับข่าวสาร ตอบกลับ “ยกเลิก” ได้เลยค่ะ)', '\n\n(Reply STOP to opt out.)'];
let AUB = null;
function auBroadcast(k) {
  const s = SEGS.find(x => x.k === k) || { k: 'custom', n: 'กลุ่มที่สร้างเอง' }, r = segLeads(segByKey(k));
  const m = AU_MSG[k] || AU_MSG._;
  AUB = { k, n: s.n, th: m[0], en: m[1], done: new Set(),
    rows: r.ok.map(id => { const c = custOf(id), L = r.L.filter(l => l.cust === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); return { c, l: L[0] }; }).filter(x => x.c && x.l) };
  auBRender();
}
function auBText(x) { const en = x.l.lang !== 'th', t = (en ? AUB.en : AUB.th) + AU_STOP[en ? 1 : 0];
  return t.replace(/\{name\}/g, (x.c.name || '').split(' ')[0]).replace(/\{boat\}/g, x.l.boat ? boatName(x.l.boat) : (en ? 'the boat' : 'เรือ')).replace(/\{date\}/g, x.l.date ? fmtD(x.l.date) : ''); }
function auBRender() {
  const B = AUB; if (!B) return;
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">ส่งข้อความถึง “${esc(B.n)}”</p><p class="text-[12px] text-muted mt-1">${B.rows.length} คนที่ยินยอมรับข่าวสาร · กดส่งทีละคน ระบบเติมชื่อและเรือให้ และบันทึกลงประวัติลีด</p></div>
    <div class="p-5 grid sm:grid-cols-2 gap-3"><label><span class="lbl">ข้อความภาษาไทย</span><textarea class="inp !text-[12.5px]" rows="4" oninput="AUB.th=this.value">${esc(B.th)}</textarea></label><label><span class="lbl">English</span><textarea class="inp !text-[12.5px]" rows="4" oninput="AUB.en=this.value">${esc(B.en)}</textarea></label>
      <p class="sm:col-span-2 text-[11px] text-muted -mt-1">ตัวแปร: {name} {boat} {date} · ระบบต่อท้ายวิธียกเลิกรับข่าวสารให้ทุกข้อความ · ภาษาตามที่ลูกค้าติดต่อมา</p></div>
    <ul class="max-h-[46vh] overflow-y-auto border-t border-line divide-y divide-line">${B.rows.map((x, i) => { const ph = phoneIntl(x.c.wa || x.c.phone), done = B.done.has(i); return `<li class="px-5 py-2.5 flex items-center gap-3"><div class="min-w-0 flex-1"><p class="truncate">${done ? '<i data-lucide="check" class="w-3.5 h-3.5 inline text-[#1e7a46]"></i> ' : ''}${esc(x.c.name)} <span class="text-[11px] text-muted">${x.l.lang === 'th' ? 'TH' : 'EN'}</span></p><p class="text-[11px] text-muted truncate">${esc(x.c.phone || '')}${x.c.email ? ' · ' + esc(x.c.email) : ''} · ${x.l.boat ? boatName(x.l.boat) : '—'}</p></div>
      ${ph ? `<button class="btn btn-o !h-8" onclick="auBSend(${i},'whatsapp')">WhatsApp</button>` : ''}${x.c.email ? `<button class="btn btn-o !h-8" onclick="auBSend(${i},'email')">อีเมล</button>` : ''}<button class="btn btn-g !h-8" title="คัดลอกไปส่งทาง LINE หรือช่องทางอื่น" onclick="auBSend(${i},'copy')"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button></li>`; }).join('') || '<li class="p-6 text-center text-muted">ไม่มีคนที่ยินยอมในกลุ่มนี้</li>'}</ul>
    <div class="p-4 border-t border-line flex items-center justify-between gap-2"><p class="text-[12px] text-muted">ส่งแล้ว ${B.done.size} / ${B.rows.length}</p><button class="btn btn-p" onclick="closeModal()">เสร็จ</button></div>`);
  icons();
}
function auBSend(i, via) {
  const x = AUB.rows[i], t = auBText(x);
  if (via === 'whatsapp') window.open(`https://wa.me/${phoneIntl(x.c.wa || x.c.phone)}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  else if (via === 'email') location.href = `mailto:${encodeURIComponent(x.c.email)}?subject=${encodeURIComponent('Boat Trip Thailand')}&body=${encodeURIComponent(t)}`;
  else navigator.clipboard?.writeText(t).then(() => toast('คัดลอกข้อความแล้ว'), () => toast('คัดลอกไม่สำเร็จ'));
  api('POST', `leads/${encodeURIComponent(x.l.id)}/outreach`, { via, seg: AUB.n }).then(d => { if (d?.lead) { const j = BOOKINGS.findIndex(l => l.dbId === d.lead.dbId); if (j >= 0) BOOKINGS[j] = d.lead; } AUDIT_DIRTY = true; }).catch(fail);
  AUB.done.add(i); auBRender();
}
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

/* =====================================================================
   AUTH · ROLE-BASED ACCESS (RBAC) · AUDIT LOG
   - login + 2FA (admin) + lockout + idle timeout
   - permissions enforced on every page, drawer, export
   - append-only audit log with before → after diffs, hash-chained
   NOTE: in production these checks run on the server (API + DB);
   the UI only mirrors them.
   ===================================================================== */
const DEMO_PW = 'demo1234', DEMO_OTP = '246810';
const SESSION_IP = '171.97.12.40';
const DEVICE = (() => { const u = navigator.userAgent; const b = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : /Firefox\//.test(u) ? 'Firefox' : 'Browser'; const o = /iPhone|iPad/.test(u) ? 'iOS' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'macOS' : /Win/.test(u) ? 'Windows' : 'Linux'; return `${b} · ${o}`; })();

/* ---------- permissions ---------- */
PERMS.length = 0;
PERMS.push(['bookings', 'ลีด & ลูกค้า (เฉพาะของตัวเอง)'], ['bookings_all', 'เห็นลีดของทุกคน'], ['boats', 'เรือ ราคา ฤดูกาล กิจกรรม'], ['marketing', 'ใช้ประโยชน์จากลีด (กลุ่มเป้าหมาย โฆษณา)'],
  ['content', 'เนื้อหา บทความ คลังสื่อ'], ['seo', 'SEO & วิเคราะห์'], ['export', 'Export ข้อมูล (CSV)'], ['settings', 'ตั้งค่าเว็บไซต์'], ['team', 'จัดการทีม & สิทธิ์ผู้ใช้'], ['audit', 'ดูบันทึกกิจกรรม']);
Object.keys(ROLE_PERMS).forEach(k => delete ROLE_PERMS[k]);
Object.assign(ROLE_PERMS, { super: PERMS.map(p => p[0]), admin: PERMS.map(p => p[0]).filter(k => !['team', 'audit'].includes(k)), sales: ['bookings'] });
ROLES.sales[1] = 'เห็นและจัดการเฉพาะลีดของตัวเอง · ไม่เห็นลีดของคนอื่น';
let ME = null;
const permsOf = u => u ? (u.perms || ROLE_PERMS[u.roleKey] || []) : [];
const can = k => permsOf(ME).includes(k);
const isRO = () => false;
const PAGE_PERM = { dashboard: 'bookings', bookings: 'bookings', calendar: 'bookings', customers: 'bookings', audiences: 'marketing', boats: 'boats', seasons: 'boats', activities: 'boats', content: 'content', articles: 'content', media: 'content', seo: 'seo', analytics: 'seo', team: 'team', settings: 'settings', audit: 'audit' };
const canPage = p => !PAGE_PERM[p] || can(PAGE_PERM[p]);
const firstPage = () => PAGES.find(x => x[0] !== '—' && canPage(x[0]))?.[0];
const ownB = b => b.sales === ME?.id;

/* ---------- audit log (append-only, hash chained) ---------- */
const AUDIT = BOOT.audit; let _ah = '00000000';
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
function audit(act, ent, ref, label, changes = [], o = {}) {
  const e = { id: AUDIT.length + 1, ts: o.ts || new Date().toISOString(), uid: o.uid || ME?.id || '—', role: o.role || ME?.roleKey || '', act, ent, ref, label, changes, note: o.note || '', ip: o.ip || SESSION_IP, dev: o.dev || DEVICE, sample: !!o.sample };
  e.prev = _ah; e.hash = fnv(JSON.stringify(e)); _ah = e.hash; AUDIT.push(e); return e;
}
const ACT = { login: ['เข้าระบบ', 'log-in', '#1e7a46'], logout: ['ออกจากระบบ', 'log-out', '#6b5e60'], login_fail: ['เข้าระบบไม่สำเร็จ', 'shield-alert', '#b42318'], locked: ['ล็อกบัญชีชั่วคราว', 'lock', '#b42318'], denied: ['ถูกปฏิเสธสิทธิ์', 'ban', '#b42318'],
  create: ['สร้าง', 'plus', '#1e7a46'], update: ['แก้ไข', 'pencil', '#70000e'], delete: ['ลบ', 'trash-2', '#b42318'], status: ['เปลี่ยนสถานะ', 'git-commit-horizontal', '#8a5a00'], payment: ['รับเงิน', 'banknote', '#1e7a46'], assign: ['มอบหมายเซลล์', 'user-round-check', '#8a5a00'], export: ['Export', 'download', '#3b6e8f'], publish: ['เผยแพร่', 'send', '#1e7a46'], role: ['เปลี่ยนสิทธิ์', 'key-round', '#70000e'] };
const ENT = { booking: 'ลีด', boat: 'เรือ & ราคา', season: 'ฤดูกาล', team: 'ทีม & สิทธิ์', settings: 'ตั้งค่า', article: 'บทความ', auth: 'ความปลอดภัย', customer: 'ลูกค้า' };
const AUD_GROUP = { all: ['ทั้งหมด', () => true], price: ['ราคาเรือ', e => e.changes.some(c => c.kind === 'price')], booking: ['ลีด', e => e.ent === 'booking'], boat: ['เรือ & ฤดูกาล', e => ['boat', 'season'].includes(e.ent)], content: ['เนื้อหา & ตั้งค่า', e => ['article', 'settings'].includes(e.ent)], team: ['ทีม & สิทธิ์', e => e.ent === 'team'], security: ['ความปลอดภัย', e => e.ent === 'auth' || e.act === 'export'] };

/* ---------- diff helpers ---------- */
function jdiff(a, b, path = '', out = []) {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object') { new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k => jdiff(a[k], b[k], path + (Array.isArray(a) ? `[${k}]` : (path ? '.' : '') + k), out)); }
  else out.push({ f: path, from: a ?? '', to: b ?? '' });
  return out;
}
const clone = o => JSON.parse(JSON.stringify(o ?? null));
const BOAT_F = { name: 'ชื่อเรือ', pax: 'จำนวนคนสูงสุด', type: 'ประเภทเรือ', marinaP: 'ท่าเรือ', active: 'แสดงบนเว็บ', status: 'สถานะ', imgs: 'จำนวนรูป', includes: 'รวมในราคา', not_included: 'ไม่รวมในราคา', complimentary: 'ของแถม', notes: 'หมายเหตุ', cal: 'ปฏิทินฤดูกาล' };
const snapBoat = b => ({ name: b.name, pax: b.pax, type: b.type, marinaP: b.marinaP, active: b.active, status: b.status, imgs: (b.imgs || []).length, cal: b.cal || '', tables: clone(b.tables), includes: clone(b.includes), not_included: clone(b.not_included), complimentary: clone(b.complimentary), notes: clone(b.notes) });
function boatChanges(b, before, after) {
  return jdiff(before, after).map(c => {
    let m;
    if ((m = c.f.match(/^tables\[(\d+)\]\.rows\[(\d+)\]\[(\d+)\]$/))) { const t = b.tables[+m[1]] || {}, row = (t.rows || [])[+m[2]] || []; return +m[3] === 0 ? { ...c, f: 'ชื่อโปรแกรม' } : { ...c, f: `ราคาขาย · ${row[0] || 'โปรแกรม ' + (+m[2] + 1)} · ${(t.columns || [])[+m[3]] || ''}`, kind: 'price' }; }
    if ((m = c.f.match(/^tables\[(\d+)\]\.columns\[(\d+)\]$/))) return { ...c, f: 'ชื่อคอลัมน์ราคา' };
    if ((m = c.f.match(/^tables\[(\d+)\]\.rows(\[(\d+)\])?$/))) return { ...c, f: 'แถวโปรแกรม', from: c.from ? (Array.isArray(c.from) ? c.from[0] : c.from) : '—', to: c.to ? (Array.isArray(c.to) ? c.to[0] : c.to) : 'ลบแล้ว' };
    const k = c.f.split(/[.[]/)[0]; return { ...c, f: BOAT_F[k] || c.f };
  }).map(c => typeof c.from === 'object' || typeof c.to === 'object' ? { ...c, from: c.from ? '(ข้อมูลเดิม)' : '—', to: c.to ? '(ข้อมูลใหม่)' : '—' } : c);
}

/* ---------- sample audit history (labelled) ---------- */
/* ---------- session ---------- */
const SESS_KEY = 'btt_admin_sess', IDLE_MIN = 30;
const FAILS = {};
const sGet = () => { try { return JSON.parse(sessionStorage.getItem(SESS_KEY) || 'null'); } catch (e) { return null; } };
const sSet = v => { try { v ? sessionStorage.setItem(SESS_KEY, JSON.stringify(v)) : sessionStorage.removeItem(SESS_KEY); } catch (e) { } };
let lastAct = Date.now(), loginAt = null;
['click', 'keydown', 'pointermove'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
setInterval(() => { if (ME && Date.now() - lastAct > IDLE_MIN * 60000) logout('timeout'); }, 30000);

const LG = { step: 'pw', email: '', err: '', user: null };
function showLogin() {
  closeDrawer(); closeModal();
  let el = $('#login'); if (!el) { el = document.createElement('div'); el.id = 'login'; el.className = 'fixed inset-0 z-[80] bg-[#faf7f5] overflow-y-auto'; document.body.appendChild(el); }
  el.classList.remove('hidden'); document.body.classList.add('overflow-hidden');
  const demo = TEAM.filter(t => t.active && !t.deleted && ['anan', 'kwang', 'mint', 'save', 'prang'].includes(t.id));
  const lock = FAILS[LG.email]?.until > Date.now();
  el.innerHTML = `<div class="min-h-full grid lg:grid-cols-[1fr_440px]">
    <div class="hidden lg:flex flex-col justify-between p-12 bg-maroon text-white relative overflow-hidden"><div class="flex items-center gap-3"><img src="${$('#side img').src}" class="w-10 h-10 object-contain bg-white rounded-xl p-1"/><p class="tracking-[.25em] text-[12px]">BOAT TRIP · ADMIN</p></div>
      <div class="max-w-md"><p class="text-[28px] leading-tight">ระบบหลังบ้าน<br/>Boat Trip Thailand</p><ul class="mt-6 space-y-3 text-[13px] text-white/80">${[['shield-check', 'สิทธิ์ตามบทบาท บังคับใช้ทุกหน้าและทุก API'], ['inbox', 'Sales เห็นเฉพาะลีดและลูกค้าของตัวเอง'], ['history', 'บันทึกทุกการแก้ไข ใคร แก้อะไร เมื่อไร'], ['smartphone', 'Super Admin และ Admin ต้องยืนยัน 2 ขั้นตอน (2FA)']].map(([i, l]) => `<li class="flex gap-3 items-center"><i data-lucide="${i}" class="w-4 h-4 shrink-0"></i>${l}</li>`).join('')}</ul></div>
      <p class="text-[11px] text-white/50">Mockup · ระบบจริงตรวจสิทธิ์ที่เซิร์ฟเวอร์ทุกครั้ง</p></div>
    <div class="flex flex-col justify-center p-6 sm:p-10 bg-white min-h-screen lg:min-h-0">
      <div class="w-full max-w-sm mx-auto">
        <div class="lg:hidden flex items-center gap-2.5 mb-8"><img src="${$('#side img').src}" class="w-9 h-9 object-contain"/><div class="leading-none"><p class="text-[13px] font-medium tracking-wide">BOAT TRIP</p><p class="text-[9px] tracking-[.3em] text-muted mt-1">ADMIN</p></div></div>
        ${LG.step === 'pw' ? `
        <h1 class="text-[22px] font-medium">เข้าสู่ระบบ</h1><p class="text-muted mt-1">ใช้อีเมลทีมงาน @boattripthailand.com</p>
        <form class="mt-6 grid gap-3" onsubmit="event.preventDefault();doLogin()">
          <label><span class="lbl">อีเมล</span><input id="lgEmail" type="email" class="inp" autocomplete="username" value="${esc(LG.email)}" required/></label>
          <label><span class="lbl flex justify-between">รหัสผ่าน<a href="javascript:void 0" class="text-maroon" onclick="lgForgot()">ลืมรหัสผ่าน?</a></span><input id="lgPw" type="password" class="inp" autocomplete="current-password" required/></label>
          ${LG.err ? `<p class="text-[12px] text-[#b42318] flex items-start gap-1.5" role="alert"><i data-lucide="alert-circle" class="w-3.5 h-3.5 mt-0.5 shrink-0"></i>${LG.err}</p>` : ''}
          <button class="btn btn-p !h-11 mt-1" ${lock ? 'disabled' : ''}>เข้าสู่ระบบ</button>
        </form>
        <div class="mt-8 rounded-2xl bg-sand p-4"><p class="text-[11px] uppercase tracking-[.14em] text-muted">บัญชีทดลอง (เฉพาะ mockup)</p><p class="text-[11px] text-muted mt-1">รหัสผ่าน <b class="tnum text-ink">${DEMO_PW}</b> · กดเพื่อกรอกอัตโนมัติ</p>
          <div class="mt-3 grid gap-1.5">${demo.map(t => `<button type="button" class="flex items-center gap-2.5 p-2 rounded-xl bg-white ring-1 ring-line hover:ring-maroon text-left" onclick="$('#lgEmail').value='${t.email}';$('#lgPw').value='${DEMO_PW}';$('#lgPw').focus()"><img src="${teamImg(t.id)}" class="w-7 h-7 rounded-full object-cover"/><span class="min-w-0 flex-1"><span class="block text-[13px] leading-tight">${t.name} <span class="text-muted">· ${ROLES[t.roleKey][0]}</span></span><span class="block text-[11px] text-muted truncate">${ROLES[t.roleKey][1]}</span></span></button>`).join('')}</div></div>`
        : `
        <button class="btn btn-g !px-2 -ml-2 mb-4" onclick="LG.step='pw';LG.err='';showLogin()"><i data-lucide="arrow-left" class="w-4 h-4"></i>กลับ</button>
        <div class="w-12 h-12 rounded-2xl bg-maroon-50 grid place-items-center text-maroon"><i data-lucide="smartphone" class="w-6 h-6"></i></div>
        <h1 class="text-[22px] font-medium mt-4">ยืนยันตัวตน 2 ขั้นตอน</h1><p class="text-muted mt-1">ใส่รหัส 6 หลักจากแอป Authenticator ของ ${esc(LG.user.name)}</p>
        <form class="mt-6 grid gap-3" onsubmit="event.preventDefault();doOtp()">
          <input id="lgOtp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" class="inp !h-12 text-center text-[22px] tracking-[.5em] tnum" placeholder="••••••" required/>
          ${LG.err ? `<p class="text-[12px] text-[#b42318]" role="alert">${LG.err}</p>` : ''}
          <button class="btn btn-p !h-11">ยืนยัน</button>
        </form>
        <p class="text-[11px] text-muted mt-4">รหัสทดลอง: <b class="tnum text-ink">${DEMO_OTP}</b></p>`}
      </div>
    </div></div>`;
  icons(); setTimeout(() => (LG.step === 'pw' ? (LG.email ? $('#lgPw') : $('#lgEmail')) : $('#lgOtp'))?.focus(), 30);
}
function lgForgot() { const em = $('#lgEmail').value.trim(); toast(em ? `ถ้ามีบัญชีนี้ ระบบจะส่งลิงก์ตั้งรหัสใหม่ไปที่ ${em} (จำลอง)` : 'กรอกอีเมลก่อน'); }
function doLogin() {
  const em = $('#lgEmail').value.trim().toLowerCase(), pw = $('#lgPw').value; LG.email = em;
  const F = FAILS[em] ??= { n: 0, until: 0 };
  if (F.until > Date.now()) { LG.err = `บัญชีนี้ถูกล็อกชั่วคราว ลองใหม่ใน ${Math.ceil((F.until - Date.now()) / 60000)} นาที`; return showLogin(); }
  const u = TEAM.find(t => (t.email || '').toLowerCase() === em && t.active && !t.deleted);
  if (!u || pw !== DEMO_PW) {
    F.n++; audit('login_fail', 'auth', em, (u ? 'รหัสผ่านไม่ถูกต้อง · ' : 'ไม่พบบัญชีหรือบัญชีถูกปิด · ') + em, [], { uid: u?.id || '—', role: u?.roleKey || '' });
    if (F.n >= 5) { F.until = Date.now() + 15 * 60000; F.n = 0; audit('locked', 'auth', em, 'ผิดเกิน 5 ครั้ง · ล็อก 15 นาที', [], { uid: u?.id || '—', role: u?.roleKey || '' }); LG.err = 'ใส่ผิดเกิน 5 ครั้ง บัญชีถูกล็อก 15 นาที'; }
    else LG.err = `อีเมลหรือรหัสผ่านไม่ถูกต้อง (เหลือ ${5 - F.n} ครั้ง)`;
    return showLogin();
  }
  F.n = 0; LG.err = '';
  if (['super', 'admin'].includes(u.roleKey) || u.mfa) { LG.step = 'otp'; LG.user = u; return showLogin(); }
  finishLogin(u, 'เข้าระบบ');
}
function doOtp() { if ($('#lgOtp').value.replace(/\D/g, '') !== DEMO_OTP) { LG.err = 'รหัสไม่ถูกต้องหรือหมดอายุ'; audit('login_fail', 'auth', LG.user.email, 'รหัส 2FA ไม่ถูกต้อง', [], { uid: LG.user.id, role: LG.user.roleKey }); return showLogin(); } finishLogin(LG.user, 'เข้าระบบ (รหัสผ่าน + 2FA)'); }
function finishLogin(u, label, restore) {
  ME = u; loginAt = restore?.t || Date.now(); lastAct = Date.now(); LG.step = 'pw'; LG.err = ''; LG.user = null;
  sSet({ uid: u.id, t: loginAt });
  if (!restore) audit('login', 'auth', '', label);
  $('#login')?.classList.add('hidden'); document.body.classList.remove('overflow-hidden');
  const p = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/')[0];
  if (!canPage(p) || !PAGES.find(x => x[0] === p)) history.replaceState(null, '', '#/' + firstPage());
  route(); if (!restore) toast(`สวัสดี ${u.name} · สิทธิ์ ${ROLES[u.roleKey][0]}`);
}
function logout(reason) {
  if (!ME) return; flushBoat(); audit('logout', 'auth', '', reason === 'timeout' ? `ไม่มีการใช้งาน ${IDLE_MIN} นาที · ออกจากระบบอัตโนมัติ` : 'ออกจากระบบ');
  LG.email = ME.email; ME = null; sSet(null); document.body.classList.remove('ro'); showLogin(); if (reason === 'timeout') toast('ออกจากระบบอัตโนมัติเพราะไม่มีการใช้งาน');
}

/* ---------- sidebar user card ---------- */
function paintMe() {
  const card = $('#side .border-t > div'); if (!card || !ME) return;
  card.innerHTML = `<button class="flex items-center gap-2.5 min-w-0 flex-1 text-left" onclick="mePanel()"><img src="${TEAM_IMG[ME.id] || initialsAva(ME.name)}" alt="" class="w-8 h-8 rounded-full object-cover"/><span class="min-w-0"><span class="block text-[13px] leading-tight truncate">${esc(ME.name)}</span><span class="block text-[11px] text-muted truncate">${ROLES[ME.roleKey][0]}${isRO() ? ' · ดูอย่างเดียว' : ''}</span></span></button><button class="btn btn-g !px-1.5 !h-8" onclick="logout()" aria-label="ออกจากระบบ" title="ออกจากระบบ"><i data-lucide="log-out" class="w-4 h-4 text-muted"></i></button>`;
  icons();
}
function mePanel() {
  const P = permsOf(ME), mins = Math.max(0, IDLE_MIN - Math.floor((Date.now() - lastAct) / 60000));
  openModal(`<div class="p-5 border-b border-line flex items-center gap-3"><img src="${teamImg(ME.id)}" class="w-11 h-11 rounded-full object-cover"/><div class="min-w-0 flex-1"><p class="font-medium">${esc(ME.name)}</p><p class="text-[12px] text-muted">${ME.email} · ${ROLES[ME.roleKey][0]}</p></div><button class="btn btn-g !px-2" onclick="closeModal()" aria-label="Close"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="p-5 space-y-4"><div><p class="lbl">สิทธิ์ของคุณ</p><div class="grid gap-1">${PERMS.map(([k, l]) => `<p class="flex items-center gap-2 text-[12.5px] ${P.includes(k) ? '' : 'text-muted line-through decoration-[#d9cfcf]'}"><i data-lucide="${P.includes(k) ? 'check' : 'x'}" class="w-3.5 h-3.5 ${P.includes(k) ? 'text-[#1e7a46]' : 'text-[#c9bfbf]'}"></i>${l}</p>`).join('')}</div></div>
      <div class="rounded-xl bg-sand p-3 text-[12px] grid gap-1"><p class="flex justify-between"><span class="text-muted">เข้าระบบเมื่อ</span><span>${new Date(loginAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</span></p><p class="flex justify-between"><span class="text-muted">อุปกรณ์</span><span>${DEVICE}</span></p><p class="flex justify-between"><span class="text-muted">หมดเวลาถ้าไม่ใช้งานใน</span><span>${mins} นาที</span></p></div>
      <p class="text-[11px] text-muted">ต้องการสิทธิ์เพิ่ม ติดต่อ Admin · ทุกการเปลี่ยนสิทธิ์ถูกบันทึกไว้</p></div>
    <div class="p-4 border-t border-line flex gap-2"><button class="btn btn-o flex-1" onclick="closeModal();logout()"><i data-lucide="repeat" class="w-3.5 h-3.5"></i>สลับบัญชี (เดโม)</button><button class="btn btn-p flex-1" onclick="closeModal();logout()"><i data-lucide="log-out" class="w-3.5 h-3.5"></i>ออกจากระบบ</button></div>`);
}

/* ---------- 403 ---------- */
function v403() {
  $('#view').innerHTML = `<div class="card max-w-lg mx-auto mt-10 p-8 text-center"><div class="w-14 h-14 mx-auto rounded-2xl bg-maroon-50 grid place-items-center text-maroon"><i data-lucide="lock-keyhole" class="w-7 h-7"></i></div>
    <p class="text-lg font-medium mt-4">ไม่มีสิทธิ์เข้าหน้านี้</p><p class="text-muted mt-1">บทบาท ${ROLES[ME.roleKey][0]} เข้าหน้านี้ไม่ได้ · ระบบบันทึกการพยายามเข้าถึงไว้แล้ว</p>
    <a href="#/${firstPage()}" class="btn btn-p mt-6 inline-flex">กลับหน้าที่ใช้ได้</a></div>`;
  icons();
}

/* ---------- scope: sales see only their own work ---------- */
const HID_CUST = { id: '_HID', name: 'ไม่ว่าง · งานของเซลล์อื่น', country: '', phone: '—', email: '', channel: '', tags: [] };
function scoped(fn, mode = 'own') {
  return function (...a) {
    if (!ME || can('bookings_all')) return fn.apply(this, a);
    const B = BOOKINGS.slice(), C = CUSTOMERS.slice();
    const vis = mode === 'cal' ? B.map(b => ownB(b) ? b : { ...b, cust: '_HID', note: '', pickup: '', channel: '—', _hid: 1 }) : B.filter(ownB);
    BOOKINGS.length = 0; BOOKINGS.push(...vis);
    if (mode === 'cust') { const ids = new Set(vis.map(b => b.cust)); CUSTOMERS.length = 0; CUSTOMERS.push(...C.filter(c => ids.has(c.id))); }
    if (mode === 'cal') CUSTOMERS.push(HID_CUST);
    try { return fn.apply(this, a); } finally { BOOKINGS.length = 0; BOOKINGS.push(...B); CUSTOMERS.length = 0; CUSTOMERS.push(...C); }
  };
}

/* ---------- bookings ---------- */
const _vBookings18 = scoped(vBookings);
vBookings = function () {
  _vBookings18();
  const v = $('#view');
  v.querySelectorAll('.card > .border-b input, .card > .border-b select').forEach(x => x.classList.add('flt'));
  if (!can('bookings_all')) {
    const h2 = v.querySelector('h2'); if (h2) h2.innerHTML = 'ลีดของฉัน <span class="ml-2 align-middle pill bg-sand text-muted !text-[11px]"><i data-lucide="lock" class="w-3 h-3 inline -mt-0.5"></i> เห็นเฉพาะงานที่คุณดูแล</span>';
    v.querySelector('select[onchange^="BK.sales"]')?.remove();
  }
  if (!can('export')) v.querySelector('button[onclick="exportCsv()"]')?.remove();
  icons();
};
const _bookingDetail18 = bookingDetail;
bookingDetail = function (id) {
  const b = BOOKINGS.find(x => x.id === id); if (!b) return;
  if (!can('bookings_all') && !ownB(b)) { audit('denied', 'auth', id, `พยายามเปิดลีด ${id} ของ ${teamOf(b.sales)?.name || '-'}`); return toast('ไม่มีสิทธิ์ดูลีดนี้ · เป็นของเซลล์อื่น'); }
  _bookingDetail18(id);
  const d = $('#drawer');
  const sel = d.querySelector('select[onchange*=".sales="]');
  if (sel) { if (can('bookings_all') && !isRO()) sel.setAttribute('onchange', `bkAssign('${id}',this.value)`); else { sel.disabled = true; sel.closest('label')?.insertAdjacentHTML('beforeend', '<span class="text-[10px] text-muted">เปลี่ยนเซลล์ได้เฉพาะ Admin</span>'); } }
  const ta = d.querySelector('textarea'); if (ta) ta.setAttribute('onchange', `bkNote('${id}',this.value)`);
  const hist = [...d.querySelectorAll('p.lbl')].find(p => p.textContent === 'ประวัติ')?.nextElementSibling;
  const ev = [];
  if (hist && ev.length) hist.insertAdjacentHTML('beforeend', ev.map(e => `<li class="flex gap-2"><span class="w-1.5 h-1.5 rounded-full bg-maroon mt-1.5 shrink-0"></span><span>${fmtTs(e.ts)} · <b class="font-medium">${userName(e.uid)}</b> ${ACT[e.act][0]} ${e.changes.map(c => `${c.f}: ${maskV(c, c.from)} → ${maskV(c, c.to)}`).join(', ')}</span></li>`).join(''));
  icons();
};
function bkChange(id, act, f, from, to, o = {}) { const b = BOOKINGS.find(x => x.id === id); if (String(from) === String(to)) return; audit(act, 'booking', id, `${id} · ${bySlug(b.boat)?.name || ''}`, [{ f, from, to, ...o }]); }
function bkAssign(id, v) { if (!can('bookings_all')) return toast('ไม่มีสิทธิ์'); const b = BOOKINGS.find(x => x.id === id), from = teamOf(b.sales)?.name; b.sales = v; bkChange(id, 'assign', 'เซลล์ผู้ดูแล', from, teamOf(v)?.name); toast('มอบหมายเซลล์แล้ว'); }
function bkNote(id, v) { const b = BOOKINGS.find(x => x.id === id), from = b.note || ''; b.note = v; bkChange(id, 'update', 'บันทึกภายใน', from || '—', v || '—'); toast('บันทึกแล้ว'); }
const _setStatus18 = setStatus;
setStatus = function (id, s) { const b = BOOKINGS.find(x => x.id === id); if (!b || isRO() || (!can('bookings_all') && !ownB(b))) return toast('ไม่มีสิทธิ์แก้ลีดนี้'); const from = b.status; _setStatus18(id, s); if (from !== b.status) bkChange(id, 'status', 'สถานะ', STATUS[from][0], STATUS[b.status][0]); };
const _newBooking18 = newBooking;
newBooking = function (slug) { if (isRO()) return toast('โหมดดูอย่างเดียว'); _newBooking18(slug); if (!can('bookings_all')) { const s = $('#nbS'); if (s) { s.value = ME.id; s.disabled = true; } } };
const _saveNew18 = saveNew;
saveNew = function () { const n = BOOKINGS.length; _saveNew18(); if (BOOKINGS.length > n) { const b = BOOKINGS[0]; if (!can('bookings_all')) b.sales = ME.id; audit('create', 'booking', b.id, `${b.id} · ${bySlug(b.boat)?.name || ''}`, [{ f: 'ลูกค้า', from: '—', to: custOf(b.cust)?.name }, { f: 'เรือที่สนใจ', from: '—', to: bySlug(b.boat)?.name }, { f: 'แหล่งที่มา', from: '—', to: SRC[b.src]?.[0] }]); } };
const _exportCsv18 = exportCsv;
exportCsv = function () {
  if (!can('export')) { audit('denied', 'auth', 'export', 'พยายาม Export ลีด'); return toast('ไม่มีสิทธิ์ Export'); }
  const B = BOOKINGS.slice(), vis = can('bookings_all') ? B : B.filter(ownB);
  const rows = leadCsvRows(vis);
  const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'btt-leads.csv'; a.click();
  audit('export', 'booking', 'csv', `Export ลีด ${vis.length} รายการ`); toast('ดาวน์โหลด CSV แล้ว · บันทึกใน Audit log');
};
const _vCalendar18 = scoped(vCalendar, 'cal');
vCalendar = function () { _vCalendar18(); if (!can('bookings_all')) $('#view h2')?.insertAdjacentHTML('beforeend', ' <span class="ml-2 align-middle pill bg-sand text-muted !text-[11px]">ลีดของเซลล์อื่นแสดงเป็น “ไม่ว่าง”</span>'); };
const _vCustomers18 = scoped(vCustomers, 'cust');
vCustomers = function () { _vCustomers18(); if (!can('bookings_all')) { const h2 = $('#view h2'); if (h2) h2.textContent = 'ลูกค้าของฉัน'; } };
const _custDetail18 = scoped(custDetail, 'cust');
custDetail = function (id) { if (!can('bookings_all') && !BOOKINGS.some(b => b.cust === id && ownB(b))) { audit('denied', 'auth', id, `พยายามเปิดข้อมูลลูกค้า ${id}`); return toast('ไม่มีสิทธิ์ดูลูกค้ารายนี้'); } _custDetail18(id); };
const _vDash18 = scoped(PAGES.find(p => p[0] === 'dashboard')[3]);
vDashboard = function () {
  _vDash18();
  const v = $('#view'); if (!can('bookings_all')) { const h2 = v.querySelector('h2'); if (h2) h2.textContent = `แดชบอร์ดของ ${ME.name}`; }
  icons();
};
PAGES.find(p => p[0] === 'dashboard')[3] = vDashboard; PAGES.find(p => p[0] === 'bookings')[3] = vBookings; PAGES.find(p => p[0] === 'calendar')[3] = vCalendar; PAGES.find(p => p[0] === 'customers')[3] = vCustomers;

/* ---------- boat editor: history tab, change tracking ---------- */
let BSNAP = null;
function commitBoat(slug, note) {
  if (!BSNAP || BSNAP.slug !== slug) return 0; const b = bySlug(slug); if (!b) { BSNAP = null; return 0; }
  const after = snapBoat(b), ch = boatChanges(b, BSNAP.data, after);
  if (ch.length) audit(BSNAP.isNew ? 'create' : 'update', 'boat', slug, b.name || slug, ch, { note });
  BSNAP = { slug, data: after }; return ch.length;
}
function flushBoat() { if (BSNAP) { commitBoat(BSNAP.slug, 'บันทึกอัตโนมัติเมื่อออกจากหน้าแก้ไข'); } }
const _vBoatEdit18 = vBoatEdit;
vBoatEdit = function (slug) {
  const b = bySlug(slug); if (!b) return _vBoatEdit18(slug);
  if (!BSNAP || BSNAP.slug !== slug) { flushBoat(); BSNAP = { slug, data: snapBoat(b) }; }
  const myTab = BE.tab === 'history' ? 'history' : null;
  _vBoatEdit18(slug);
  const tb = $('#view .tabbar'), card = tb ? tb.nextElementSibling : [...$$('#view .card')].find(c => c.querySelector('.tab')), bar = tb || card?.querySelector('.tab')?.parentElement; if (!bar || !card) return;
  if (myTab) bar.querySelectorAll('.tab.on').forEach(x => x.classList.remove('on'));
  bar.insertAdjacentHTML('beforeend', `<button class="tab ${myTab === 'history' ? 'on' : ''}" onclick="BE.tab='history';vBoatEdit('${slug}')">ประวัติการแก้ไข</button>`);
  const body = card.querySelector('.p-5') || bar.nextElementSibling;
  if (myTab === 'history') { commitBoat(slug); body.innerHTML = auditMini(e => e.ent === 'boat' && e.ref === slug, 'ยังไม่มีการแก้ไขเรือลำนี้'); }
  icons();
};
if (typeof boatSave === 'function') { const _boatSave18 = boatSave; boatSave = function (slug) { if (isRO()) return toast('โหมดดูอย่างเดียว'); _boatSave18(slug); const n = commitBoat(slug, 'กดบันทึก'); if (n) toast(`บันทึกแล้ว · เก็บ ${n} การเปลี่ยนแปลงใน Audit log`); }; }
if (typeof boatDel === 'function') { const _boatDel18 = boatDel; boatDel = function (slug, ...r) { const b = bySlug(slug); const nm = b?.name; _boatDel18(slug, ...r); if (!bySlug(slug)) { audit('delete', 'boat', slug, nm || slug); if (BSNAP?.slug === slug) BSNAP = null; } }; }
if (typeof boatCreate === 'function') { const _boatCreate18 = boatCreate; boatCreate = function (...a) { const n = FLEET.length; const r = _boatCreate18(...a); if (FLEET.length > n) { const b = FLEET[FLEET.length - 1]; audit('create', 'boat', b.slug, b.name || b.slug, [{ f: 'สถานะ', from: '—', to: 'ฉบับร่าง' }]); BSNAP = { slug: b.slug, data: snapBoat(b) }; } return r; }; }

/* ---------- seasons / team / settings / articles ---------- */
if (typeof szSave === 'function') { const _szSave18 = szSave; szSave = function () {
  if (isRO()) return toast('โหมดดูอย่างเดียว');
  const before = SZV.orig ? clone(calById(SZV.orig)) : null, after = clone(SZV.edit); _szSave18();
  const ch = before ? jdiff(before, after).map(c => { const m = c.f.match(/^ranges\.(\w+)\[(\d+)\]\[(\d)\]$/); return m ? { ...c, f: `${SKEY[m[1]]?.th || m[1]} ช่วงที่ ${+m[2] + 1} · ${m[3] === '0' ? 'เริ่ม' : 'สิ้นสุด'}` } : { ...c, f: c.f.startsWith('ranges') ? 'ช่วงวันที่' : c.f.startsWith('special') ? 'วันพิเศษ' : c.f === 'name' ? 'ชื่อปฏิทิน' : c.f }; }).map(c => typeof c.from === 'object' || typeof c.to === 'object' ? { ...c, from: c.from ? JSON.stringify(c.from) : '—', to: c.to ? JSON.stringify(c.to) : 'ลบแล้ว' } : c) : [{ f: 'ปฏิทิน', from: '—', to: after.name }];
  if (ch.length) audit(before ? 'update' : 'create', 'season', after.id, after.name, ch);
}; }
const _teamSave18 = teamSave;
teamSave = function () {
  if (!can('team')) return toast('ไม่มีสิทธิ์ · เฉพาะ Super Admin');
  const t = TE.cur, old = TE.isNew ? null : clone(TEAM.find(x => x.id === t.id)), wasNew = TE.isNew; _teamSave18();
  const now = TEAM.find(x => x.id === t.id); if (!now || (old && JSON.stringify(old) === JSON.stringify(now))) return;
  const pl = u => permsOf(u).map(k => PERMS.find(p => p[0] === k)?.[1].replace(/ \(.*\)/, '') || k).join(', ') || '—';
  const ch = [];
  if (!old) ch.push({ f: 'บทบาท', from: '—', to: ROLES[now.roleKey][0] }, { f: 'อีเมล', from: '—', to: now.email || '—' });
  else {
    if (old.roleKey !== now.roleKey) ch.push({ f: 'บทบาท', from: ROLES[old.roleKey][0], to: ROLES[now.roleKey][0] });
    if (pl(old) !== pl(now)) ch.push({ f: 'สิทธิ์', from: pl(old), to: pl(now) });
    if (old.active !== now.active) ch.push({ f: 'สถานะบัญชี', from: old.active ? 'ใช้งาน' : 'ปิด', to: now.active ? 'ใช้งาน' : 'ปิด' });
    [['name', 'ชื่อ'], ['tel', 'เบอร์โทร'], ['email', 'อีเมล']].forEach(([k, l]) => { if ((old[k] || '') !== (now[k] || '')) ch.push({ f: l, from: old[k] || '—', to: now[k] || '—' }); });
  }
  if (ch.length) audit(wasNew ? 'create' : ch.some(c => ['บทบาท', 'สิทธิ์', 'สถานะบัญชี'].includes(c.f)) ? 'role' : 'update', 'team', now.id, now.name, ch, { note: ch.some(c => ['บทบาท', 'สิทธิ์'].includes(c.f)) ? 'สิทธิ์ใหม่มีผลทันทีกับทุกเซสชันของผู้ใช้' : '' });
  if (now.id === ME.id) { ME = now; route(); }
};
const _teamDelete18 = teamDelete;
teamDelete = function () { if (!can('team')) return toast('ไม่มีสิทธิ์'); const id = TE.cur.id; _teamDelete18(); const t = TEAM.find(x => x.id === id); if (t?.deleted) audit('delete', 'team', id, t.name, [{ f: 'สถานะบัญชี', from: 'ใช้งาน', to: 'ลบ (ปิดการเข้าระบบ)' }], { note: 'เซสชันทั้งหมดของผู้ใช้ถูกยกเลิก' }); };
const _teamTransfer18 = teamTransfer;
teamTransfer = function () { const to = $('#teTo')?.value, id = TE.cur.id, ids = BOOKINGS.filter(b => b.sales === id && ['new', 'contacted', 'talking'].includes(b.status)).map(b => b.id); _teamTransfer18(); if (ids.length) audit('assign', 'team', id, TEAM.find(x => x.id === id)?.name, [{ f: 'โอนงานค้าง', from: `${ids.length} งาน`, to: teamOf(to)?.name || to }]); };
let CFGSNAP = null;
const _vSettings18 = vSettings;
vSettings = function () { if (!CFGSNAP) CFGSNAP = clone(SITECFG); _vSettings18(); };
PAGES.find(p => p[0] === 'settings')[3] = vSettings;
const CFG_F = { company: 'ชื่อบริษัท', phone: 'เบอร์โทร', email: 'อีเมล', address: 'ที่อยู่', logo: 'โลโก้', favicon: 'ไอคอนเว็บ', tat: 'เลขใบอนุญาต ททท.', line: 'LINE', wa: 'WhatsApp' };
const _cfgSave18 = cfgSave;
cfgSave = function () {
  if (!can('settings') || isRO()) return toast('ไม่มีสิทธิ์'); _cfgSave18();
  const now = clone(SITECFG), ch = jdiff(CFGSNAP || {}, now).map(c => { const k = c.f.split(/[.[]/)[0]; const img = /^data:/.test(String(c.from)) || /^data:/.test(String(c.to)); return { f: CFG_F[k] || c.f, from: img ? '(รูปเดิม)' : typeof c.from === 'object' ? '(เดิม)' : c.from || '—', to: img ? '(รูปใหม่)' : typeof c.to === 'object' ? '(ใหม่)' : c.to || '—' }; });
  if (ch.length) audit('update', 'settings', 'site', 'ตั้งค่าเว็บไซต์', ch); CFGSNAP = now;
};
if (typeof artPublish === 'function') { const _artPublish18 = artPublish; artPublish = function (id) { const a = artById(id), st = a?.status; _artPublish18(id); if (a && a.status !== st) audit('publish', 'article', a.id, a.title?.th || a.title?.en || 'บทความ', [{ f: 'สถานะ', from: st || '—', to: a.status }]); }; }

/* ---------- audit page ---------- */
const AV = { g: 'all', u: '', q: '', days: 30, shown: 40 };
const userName = id => id === '—' ? 'ระบบ / ไม่ระบุตัวตน' : TEAM.find(t => t.id === id)?.name || (BOOT.names || {})[id] || id;
const fmtTs = s => new Date(s).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const relTs = s => { const m = Math.round((Date.now() - new Date(s)) / 60000); return m < 1 ? 'เมื่อสักครู่' : m < 60 ? `${m} นาทีที่แล้ว` : m < 1440 ? `${Math.round(m / 60)} ชม.ที่แล้ว` : `${Math.round(m / 1440)} วันที่แล้ว`; };
const maskV = (c, v) => esc(String(v ?? ''));
const actPill = e => `<span class="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] whitespace-nowrap" style="color:${ACT[e.act][2]};background:${ACT[e.act][2]}14"><i data-lucide="${ACT[e.act][1]}" class="w-3 h-3"></i>${ACT[e.act][0]}</span>`;
const chHtml = (e, max = 99) => e.changes.slice(0, max).map(c => `<p class="text-[12px] leading-snug"><span class="text-muted">${esc(c.f)}${c.sens ? ' <i data-lucide="lock" class="w-3 h-3 inline -mt-0.5"></i>' : ''}:</span> <span class="line-through decoration-[#c9a3a7] text-muted">${maskV(c, c.from)}</span> <i data-lucide="arrow-right" class="w-3 h-3 inline -mt-0.5 text-muted"></i> <span class="${c.kind === 'price' || c.sens ? 'text-maroon font-medium' : ''}">${maskV(c, c.to)}</span></p>`).join('') + (e.changes.length > max ? `<p class="text-[11px] text-muted">+ อีก ${e.changes.length - max} รายการ</p>` : '');
function audList() {
  const q = AV.q.toLowerCase(), from = Date.now() - AV.days * 864e5;
  return AUDIT.filter(e => AUD_GROUP[AV.g][1](e) && (!AV.u || e.uid === AV.u) && (!AV.days || new Date(e.ts) >= from) && (!q || (e.label + ' ' + userName(e.uid) + ' ' + e.ref + ' ' + e.changes.map(c => c.f + ' ' + (c.sens && !can('cost') ? '' : c.from + ' ' + c.to)).join(' ')).toLowerCase().includes(q))).slice().reverse();
}
function auditMini(pred, empty) {
  const L = AUDIT.filter(pred).slice().reverse();
  return L.length ? `<ol class="space-y-3">${L.map(e => `<li class="flex gap-3"><img src="${TEAM_IMG[e.uid] || initialsAva('?')}" class="w-8 h-8 rounded-full object-cover shrink-0"/><div class="min-w-0 flex-1"><p class="text-[13px]"><b class="font-medium">${userName(e.uid)}</b> ${actPill(e)} <span class="text-muted text-[12px]">${fmtTs(e.ts)}${e.sample ? ' · ตัวอย่าง' : ''}</span></p><div class="mt-1">${chHtml(e)}</div>${e.note ? `<p class="text-[11px] text-muted mt-1">หมายเหตุ: ${esc(e.note)}</p>` : ''}</div></li>`).join('')}</ol>` : `<p class="text-muted text-center py-10">${empty}</p>`;
}
function vAudit() {
  const L = audList(), wk = Date.now() - 7 * 864e5, W = AUDIT.filter(e => new Date(e.ts) >= wk);
  const kpi = [['แก้ราคาเรือ (7 วัน)', W.filter(AUD_GROUP.price[1]).length, 'tag'], ['เข้าระบบไม่สำเร็จ (7 วัน)', W.filter(e => e.act === 'login_fail').length, 'shield-alert'], ['ถูกปฏิเสธสิทธิ์ (7 วัน)', W.filter(e => e.act === 'denied').length, 'ban'], ['ผู้ใช้ที่ active (7 วัน)', new Set(W.filter(e => e.act === 'login').map(e => e.uid)).size, 'users']];
  const users = [...new Set(AUDIT.map(e => e.uid))];
  $('#view').innerHTML = `${head('บันทึกกิจกรรม', 'ใคร แก้อะไร เมื่อไร · บันทึกแบบเพิ่มอย่างเดียว แก้ไขหรือลบไม่ได้ แม้แต่ Admin · เก็บ 2 ปี', `<button class="btn btn-o" onclick="audVerify()"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i>ตรวจความถูกต้อง</button>${can('export') ? `<button class="btn btn-o" onclick="audCsv()"><i data-lucide="download" class="w-3.5 h-3.5"></i>Export CSV</button>` : ''}`)}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">${kpi.map(([l, n, i]) => `<div class="card p-4"><p class="text-[11px] text-muted flex items-center gap-1.5"><i data-lucide="${i}" class="w-3.5 h-3.5"></i>${l}</p><p class="text-2xl mt-1 tnum">${n}</p></div>`).join('')}</div>
    <div class="card">
      <div class="p-3 flex flex-col lg:flex-row gap-2 lg:items-center border-b border-line">
        <div class="flex gap-1 overflow-x-auto no-sb">${Object.entries(AUD_GROUP).map(([k, [l, f]]) => `<button class="tab ${AV.g === k ? 'on' : ''}" onclick="AV.g='${k}';AV.shown=40;vAudit()">${l} <span class="opacity-60 tnum">${AUDIT.filter(f).length}</span></button>`).join('')}</div>
        <div class="lg:ml-auto grid grid-cols-2 sm:flex gap-2">
          <input class="inp flt col-span-2 sm:!w-52" placeholder="ค้นหา เรือ เลขจอง ฟิลด์…" value="${esc(AV.q)}" oninput="AV.q=this.value;clearTimeout(window._aq);window._aq=setTimeout(()=>{vAudit();const i=$('#view input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"/>
          <select class="inp flt sm:!w-36" onchange="AV.u=this.value;vAudit()"><option value="">ทุกคน</option>${users.map(u => `<option value="${u}" ${AV.u === u ? 'selected' : ''}>${userName(u)}</option>`).join('')}</select>
          <select class="inp flt sm:!w-32" onchange="AV.days=+this.value;vAudit()">${[[1, 'วันนี้'], [7, '7 วัน'], [30, '30 วัน'], [0, 'ทั้งหมด']].map(([d, l]) => `<option value="${d}" ${AV.days === d ? 'selected' : ''}>${l}</option>`).join('')}</select>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>เวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>รายการ</th><th class="min-w-[280px]">เปลี่ยนแปลง (ก่อน → หลัง)</th><th class="whitespace-nowrap">IP · อุปกรณ์</th></tr></thead><tbody>
        ${L.slice(0, AV.shown).map(e => `<tr class="click" onclick="audDetail(${e.id})"><td class="whitespace-nowrap"><p>${relTs(e.ts)}</p><p class="text-[11px] text-muted">${fmtTs(e.ts)}</p></td>
          <td><div class="flex items-center gap-2 whitespace-nowrap"><img src="${TEAM_IMG[e.uid] || initialsAva('?')}" class="w-6 h-6 rounded-full object-cover"/><div><p>${userName(e.uid)}</p><p class="text-[11px] text-muted">${e.role ? ROLES[e.role]?.[0] : e.ip}</p></div></div></td>
          <td>${actPill(e)}</td>
          <td><p class="text-[11px] text-muted">${ENT[e.ent] || e.ent}${e.sample ? ' · <span class="text-[#8a5a00]">ตัวอย่าง</span>' : ''}</p><p class="truncate max-w-[220px]">${esc(e.label)}</p></td>
          <td>${e.changes.length ? chHtml(e, 2) : `<span class="text-muted text-[12px]">${esc(e.note || '—')}</span>`}</td>
          <td class="whitespace-nowrap">${e.ip || e.devS || e.dev ? `<p class="tnum">${esc(e.ip || '—')}</p><p class="text-[11px] text-muted" title="${esc(e.dev || '')}">${esc(e.devS || (e.dev ? e.dev.slice(0, 40) : 'ระบบ'))}</p>` : '<span class="text-muted text-[12px]">ระบบ</span>'}</td></tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted py-12">ไม่พบรายการ</td></tr>`}
      </tbody></table></div>
      ${L.length > AV.shown ? `<button class="w-full py-3 border-t border-line text-[12px] text-maroon" onclick="AV.shown+=40;vAudit()">แสดงเพิ่ม (${L.length - AV.shown})</button>` : ''}
    </div>
    <p class="text-[11px] text-muted mt-3">ทุกรายการบันทึกโดยเซิร์ฟเวอร์ (เวลา ผู้ใช้ IP อุปกรณ์) · แก้ไขหรือลบไม่ได้แม้แต่ผู้ดูแลระบบ</p>`;
  icons();
}
function audDetail(id) {
  const e = AUDIT.find(x => x.id === id);
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div><p class="text-[11px] text-muted">บันทึก #${e.id}${e.sample ? ' · ตัวอย่าง' : ''}</p><p class="font-medium">${ACT[e.act][0]} · ${ENT[e.ent] || e.ent}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()" aria-label="Close"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="flex-1 overflow-y-auto p-5 space-y-5">
      <div class="flex items-center gap-3"><img src="${TEAM_IMG[e.uid] || initialsAva('?')}" class="w-10 h-10 rounded-full object-cover"/><div><p class="font-medium">${userName(e.uid)} <span class="text-muted font-normal">${e.role ? '· ' + ROLES[e.role]?.[0] : ''}</span></p><p class="text-[12px] text-muted">${new Date(e.ts).toLocaleString('th-TH', { dateStyle: 'full', timeStyle: 'medium' })}</p></div></div>
      <div><p class="lbl">รายการ</p><p>${esc(e.label)}</p>${e.ent === 'boat' && bySlug(e.ref) ? `<a class="text-maroon text-[12px]" href="#/boats/${e.ref}">เปิดหน้าเรือ →</a>` : ''}${e.ent === 'booking' && BOOKINGS.find(b => b.id === e.ref) ? `<a class="text-maroon text-[12px]" href="javascript:void 0" onclick="bookingDetail('${e.ref}')">เปิดการจอง →</a>` : ''}</div>
      ${e.changes.length ? `<div><p class="lbl">การเปลี่ยนแปลง</p><div class="rounded-xl ring-1 ring-line overflow-hidden"><table class="tbl"><thead><tr><th>ฟิลด์</th><th>ก่อน</th><th>หลัง</th></tr></thead><tbody>${e.changes.map(c => `<tr><td class="text-muted">${esc(c.f)}${c.sens ? ' <i data-lucide="lock" class="w-3 h-3 inline -mt-0.5"></i>' : ''}</td><td class="line-through decoration-[#c9a3a7] text-muted">${maskV(c, c.from)}</td><td class="${c.kind === 'price' || c.sens ? 'text-maroon font-medium' : ''}">${maskV(c, c.to)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      ${e.note ? `<div class="p-3 rounded-xl bg-sand text-[12.5px]">${esc(e.note)}</div>` : ''}
      <dl class="grid grid-cols-2 gap-3 text-[12px]"><div><dt class="lbl">IP</dt><dd class="tnum">${esc(e.ip || '—')}</dd></div><div><dt class="lbl">อุปกรณ์</dt><dd>${e.devS ? `<b class="font-medium">${esc(e.devS)}</b><br/>` : ''}<span class="text-muted break-all">${esc(e.dev)}</span></dd></div><div><dt class="lbl">Hash</dt><dd class="font-mono">${e.hash}</dd></div><div><dt class="lbl">Hash ก่อนหน้า</dt><dd class="font-mono">${e.prev}</dd></div></dl>
      <p class="text-[11px] text-muted flex gap-1.5"><i data-lucide="lock" class="w-3.5 h-3.5 shrink-0"></i>บันทึกนี้แก้ไขหรือลบไม่ได้ · แต่ละรายการผูก hash กับรายการก่อนหน้า ถ้ามีใครแก้ฐานข้อมูลโดยตรง การตรวจความถูกต้องจะเจอทันที</p>
    </div>`);
}
function audVerify() { let p = '00000000', bad = 0; AUDIT.forEach(e => { const { hash, ...r } = e; if (r.prev !== p || fnv(JSON.stringify(r)) !== hash) bad++; p = hash; }); toast(bad ? `พบ ${bad} รายการที่ไม่ตรง hash` : `ตรวจแล้ว ${AUDIT.length} รายการ · ไม่มีการแก้ไขย้อนหลัง`); }
function audCsv() {
  const rows = [['id', 'time', 'user', 'role', 'action', 'entity', 'ref', 'label', 'field', 'from', 'to', 'ip', 'device', 'hash'], ...audList().flatMap(e => (e.changes.length ? e.changes : [{ f: '', from: '', to: '' }]).map(c => [e.id, e.ts, userName(e.uid), e.role, e.act, e.ent, e.ref, e.label, c.f, c.sens && !can('cost') ? '***' : c.from, c.sens && !can('cost') ? '***' : c.to, e.ip, e.dev, e.hash]))];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' })); a.download = 'btt-audit-log.csv'; a.click();
  audit('export', 'auth', 'audit', `Export Audit log ${rows.length - 1} แถว`); toast('ดาวน์โหลดแล้ว');
}
PAGES.splice(PAGES.findIndex(p => p[0] === 'team') + 1, 0, ['audit', 'บันทึกกิจกรรม', 'history', vAudit]);

/* ---------- team page: role matrix + enforcement notes ---------- */
const _vTeam18 = vTeam;
vTeam = function () {
  _vTeam18();
  const lastLogin = id => { const e = [...AUDIT].reverse().find(x => x.uid === id && x.act === 'login'); return e ? relTs(e.ts) : 'ยังไม่เคย'; };
  $('#view').insertAdjacentHTML('beforeend', `<div class="grid xl:grid-cols-[1fr_380px] gap-5 mt-6">
    <div class="card overflow-hidden"><div class="p-4 border-b border-line flex items-center justify-between gap-3"><div><p class="font-medium">สิทธิ์ตามบทบาท</p><p class="text-[12px] text-muted">บังคับใช้ทุกหน้า ทุกปุ่ม และทุก API · ปรับรายคนได้ในหน้าแก้ไขสมาชิก</p></div></div>
      <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>สิทธิ์</th>${Object.entries(ROLES).map(([k, [l]]) => `<th class="text-center">${l}</th>`).join('')}</tr></thead><tbody>
        ${PERMS.map(([k, l]) => `<tr><td>${l}</td>${Object.keys(ROLES).map(r => `<td class="text-center">${ROLE_PERMS[r].includes(k) ? '<i data-lucide="check" class="w-4 h-4 inline text-[#1e7a46]"></i>' : '<span class="text-[#d6cccc]">—</span>'}</td>`).join('')}</tr>`).join('')}
        <tr><td>ยืนยัน 2 ขั้นตอน (2FA)</td>${Object.keys(ROLES).map(r => `<td class="text-center text-[11px] text-maroon">บังคับ</td>`).join('')}</tr>
      </tbody></table></div></div>
    <div class="space-y-5">
      <div class="card p-4"><p class="font-medium mb-3">เข้าระบบล่าสุด</p><div class="space-y-2.5">${TEAM.filter(t => !t.deleted).map(t => `<div class="flex items-center gap-2.5"><img src="${teamImg(t.id)}" class="w-7 h-7 rounded-full object-cover"/><div class="min-w-0 flex-1"><p class="text-[13px] leading-tight">${t.name} <span class="text-muted text-[11px]">· ${ROLES[t.roleKey][0]}</span></p><p class="text-[11px] text-muted">${t.id === ME?.id ? 'ออนไลน์อยู่ · ' + DEVICE : lastLogin(t.id)}</p></div>${t.active ? '' : '<span class="pill bg-sand text-muted">ปิด</span>'}</div>`).join('')}</div>
        ${can('audit') ? '<a href="#/audit" class="btn btn-o w-full mt-4">ดูบันทึกกิจกรรมทั้งหมด</a>' : ''}</div>
      <div class="card p-4 text-[12px] space-y-2"><p class="font-medium text-[13px]">ระบบจริงบังคับใช้ที่เซิร์ฟเวอร์</p>${['ทุก API ตรวจ session + สิทธิ์ก่อนอ่าน/เขียน · ไม่พึ่งการซ่อนปุ่มในหน้าจอ', 'Sales: query ลีดกรอง <code>sales_id = ผู้ใช้</code> ที่ฐานข้อมูล', 'เบอร์และอีเมลลูกค้าเห็นเฉพาะเซลล์เจ้าของลีดและ Admin', 'บันทึก audit ใน transaction เดียวกับการแก้ไข · ตาราง append-only', 'เปลี่ยนสิทธิ์หรือปิดบัญชี = ยกเลิกเซสชันเดิมทันที'].map(x => `<p class="flex gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-[#1e7a46] shrink-0 mt-0.5"></i><span>${x}</span></p>`).join('')}</div>
    </div></div>`);
  icons();
};
PAGES.find(p => p[0] === 'team')[3] = vTeam;

/* ---------- router guard ---------- */
const _route18 = route;
route = function () {
  if (!ME) return showLogin();
  const h = location.hash.replace(/^#\/?/, '') || 'dashboard', [p, arg] = h.split('/'), known = PAGES.find(x => x[0] === p);
  if (!(p === 'boats' && arg)) flushBoat();
  if (!known && !canPage('dashboard')) history.replaceState(null, '', '#/' + firstPage());
  document.body.classList.toggle('ro', isRO());
  if (known && !canPage(p)) {
    audit('denied', 'auth', p, `พยายามเปิดหน้า "${known[1]}"`);
    const f = known[3], fb = vBoatEdit; known[3] = v403; vBoatEdit = v403;
    try { _route18(); } finally { known[3] = f; vBoatEdit = fb; }
  } else _route18();
  $$('#nav a.nav-i').forEach(a => { if (!canPage(a.getAttribute('href').replace('#/', ''))) a.remove(); });
  $$('#nav > p').forEach(x => { if (!x.nextElementSibling || x.nextElementSibling.tagName === 'P') x.remove(); });
  { const bd = $('#nav a[href="#/bookings"] span'); if (bd && !can('bookings_all')) { const n = BOOKINGS.filter(b => ownB(b) && b.status === 'new').length; n ? bd.textContent = n : bd.remove(); } }
  $('#roBar')?.remove(); if (isRO()) $('#view').insertAdjacentHTML('afterbegin', '<div id="roBar" class="mb-4 rounded-xl bg-sand px-4 py-2.5 text-[12px] text-muted flex items-center gap-2"><i data-lucide="eye" class="w-4 h-4"></i>โหมดดูอย่างเดียว · บทบาท Viewer แก้ไขข้อมูลไม่ได้</div>');
  paintMe(); icons();
};
rerender = function () { route(); };

/* read-only styling */
(function () { const s = document.createElement('style'); s.textContent = `body.ro #view :is(input,select,textarea,.edit-cell):not(.flt), body.ro #drawer :is(input,select,textarea){pointer-events:none;background:#f7f4f2!important;color:#6b5e60}
  body.ro #view .btn-p, body.ro #drawer .btn-p, body.ro #view .tgl, body.ro #view [onclick*="Del"], body.ro #view [onclick*="remove"], body.ro #view [contenteditable]{pointer-events:none;opacity:.45}
  body.ro #view [contenteditable]{opacity:1}`; document.head.appendChild(s); })();


showLogin = function () { location.href = '/admin/login'; };
/* =====================================================================
   SERVER BRIDGE — the approved admin design, wired to the real system.
   Every change goes to /api/admin/* (session + permission + audit on the
   server). The page only keeps what the server sent back.
   ===================================================================== */
let AUDIT_DIRTY = false, DRAWER_LEAD = null;
async function api(method, path, body) {
  const r = await fetch('/api/admin/' + path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch (e) { }
  if (r.status === 401) { location.href = '/admin/login?next=' + encodeURIComponent(location.hash || ''); throw new Error('login'); }
  if (!r.ok) { const e = new Error(j.error || 'บันทึกไม่สำเร็จ กรุณาลองใหม่'); e.status = r.status; throw e; }
  return j;
}
function toastErr(m) { toast(m); const t = $('#toast > div'); t.classList.add('!bg-[#b42318]'); clearTimeout(toastErr.t); toastErr.t = setTimeout(() => t.classList.remove('!bg-[#b42318]'), 2600); }
const fail = e => { if (e && e.message !== 'login') toastErr(e.message || 'บันทึกไม่สำเร็จ'); };

/* audit entries are written by the server; the browser only reports what only it can see */
audit = function (act, ent, ref, label, changes = []) {
  AUDIT_DIRTY = true;
  if (act === 'export' || act === 'denied') api('POST', 'audit/client', { act, ent, ref: String(ref ?? ''), label, changes: (changes || []).map(c => ({ f: c.f, from: c.from, to: c.to })) }).catch(() => { });
  return null;
};
Object.assign(ACT, { mfa: ['ยืนยัน 2FA', 'shield-check', '#1e7a46'] });
const actPillSafe = e => { if (!ACT[e.act]) ACT[e.act] = [e.act, 'dot', '#6b5e60']; };
AUDIT.forEach(actPillSafe);

/* ---------- leads ---------- */
function syncLead(r) {
  if (!r || !r.lead) return;
  const i = BOOKINGS.findIndex(x => x.dbId === r.lead.dbId);
  if (i >= 0) BOOKINGS[i] = r.lead; else BOOKINGS.unshift(r.lead);
  if (r.customer) { const j = CUSTOMERS.findIndex(c => c.id === r.customer.id); if (j >= 0) CUSTOMERS[j] = r.customer; else CUSTOMERS.push(r.customer); }
  AUDIT_DIRTY = true;
  const open = $('#drawer').classList.contains('open') && DRAWER_LEAD === r.lead.id, sc = $('#drawer .overflow-y-auto')?.scrollTop || 0;
  rerender();
  if (open) { bookingDetail(r.lead.id); const d = $('#drawer .overflow-y-auto'); if (d) d.scrollTop = sc; }
}
function leadApi(id, op, body, msg) {
  return api('POST', `leads/${encodeURIComponent(id)}/${op}`, body)
    .then(r => { syncLead(r); if (msg) toast(msg); return r; })
    .catch(e => { fail(e); rerender(); if (DRAWER_LEAD === id && $('#drawer').classList.contains('open')) bookingDetail(id); });
}
const _bookingDetail20 = bookingDetail;
bookingDetail = function (id) {
  DRAWER_LEAD = id; _bookingDetail20(id);
  const l = BOOKINGS.find(x => x.id === id), c = l && custOf(l.cust), d = $('#drawer');
  if (!l || !c || !d.classList.contains('open')) return;
  const tpl = d.querySelector('#tplOut'); if (tpl) tpl.removeAttribute('onchange');
  if (l.surcharge) d.querySelector('.overflow-y-auto')?.insertAdjacentHTML('afterbegin', `<div class="rounded-xl bg-[#fff6e5] ring-1 ring-[#f3dcb0] text-[#7a4a00] px-3.5 py-2.5 text-[12.5px] flex gap-2 mb-4"><i data-lucide="calendar-plus" class="w-4 h-4 shrink-0 mt-0.5"></i><span>วันออกเรือตรงช่วงเทศกาล · ${esc(l.surcharge)}<br><span class="text-[11.5px]">ยืนยันราคากับเจ้าของเรือก่อนส่งใบเสนอราคา</span></span></div>`);
  const note = [...d.querySelectorAll('textarea')].find(x => !x.readOnly); if (note) note.setAttribute('onchange', `bkNote('${l.id}',this.value)`);
  // PDPA consent: sales can record a verbal / chat consent (or a withdrawal)
  const dd = [...d.querySelectorAll('dt.lbl')].find(x => x.textContent.startsWith('รับข่าวสาร'))?.nextElementSibling;
  if (dd) dd.insertAdjacentHTML('beforeend', ` <button class="text-[11px] text-maroon underline underline-offset-2 ml-1" onclick="leadApi('${l.id}','consent',{on:${!c.consent}},'${c.consent ? 'บันทึกการถอนความยินยอมแล้ว' : 'บันทึกความยินยอมแล้ว'}')">${c.consent ? 'ลูกค้าขอถอน' : 'ลูกค้ายินยอมแล้ว'}</button>`);
  if (l.message) { const t = [...d.querySelectorAll('p.lbl')].find(x => x.textContent === 'สิ่งที่สนใจ'); t?.parentElement.insertAdjacentHTML('beforeend', `<p class="text-[11px] text-muted mt-3 mb-1">ข้อความจากลูกค้า</p><p class="rounded-xl ring-1 ring-line p-3 text-[12.5px] whitespace-pre-line">${esc(l.message)}</p>`); }
  icons();
};
const _closeDrawer20 = closeDrawer;
closeDrawer = function () { DRAWER_LEAD = null; _closeDrawer20(); };

setStatus = function (id, s) {
  const l = BOOKINGS.find(x => x.id === id); if (!l || !STATUS[s] || l.status === s) return;
  if (!can('bookings_all') && !ownB(l)) return toast('ไม่มีสิทธิ์แก้ลีดนี้');
  if (s === 'lost' && !l.lost) { rerender(); return leadAskLost(id); }
  leadApi(id, 'status', { status: s, next: OPEN_ST.includes(s) && !l.next ? iso(addDays(TODAY, 2)) : '' },
    s === 'won' ? 'ปิดการขายแล้ว · ส่งผลกลับไปโฆษณาให้อัตโนมัติ (ถ้าเชื่อมต่อแล้ว)' : `เปลี่ยนสถานะเป็น "${STATUS[s][0]}" แล้ว`);
};
leadSet = function (id, k, v) {
  if (k === 'next') return leadApi(id, 'followup', { date: v }, v ? 'บันทึกนัดติดตามแล้ว' : 'ล้างนัดติดตามแล้ว');
  if (k === 'lost') return leadApi(id, 'lost', { lost: v }, v ? 'บันทึกเหตุผลแล้ว' : 'ล้างเหตุผลแล้ว');
};
leadContact = function (id, via) {
  const l = BOOKINGS.find(x => x.id === id), c = custOf(l.cust), msg = encodeURIComponent(tplText(l.status === 'new' ? 'first' : 'follow', l)), ph = String(c.phone).replace(/[^\d]/g, '');
  const wa = phoneIntl(c.wa || c.phone) || ph;
  const url = { WhatsApp: `https://wa.me/${wa}?text=${msg}`, LINE: `https://line.me/R/msg/text/?${msg}`, 'โทร': `tel:+${ph}`, 'อีเมล': c.email ? `mailto:${c.email}?subject=Boat%20Trip%20Thailand&body=${msg}` : '' }[via];
  if (url) window.open(url, '_blank', 'noopener');
  leadApi(id, 'contact', { via }, l.status === 'new' ? `บันทึกการติดต่อแล้ว · ตอบกลับใน ${ago(leadAgeMin(l))}` : 'บันทึกการติดต่อแล้ว');
};
bkAssign = function (id, v) { if (!can('bookings_all')) return toast('ไม่มีสิทธิ์'); leadApi(id, 'assign', { to: v }, 'มอบหมายเซลล์แล้ว'); };
bkNote = function (id, v) { leadApi(id, 'note', { note: v }, 'บันทึกแล้ว'); };
saveNew = function () {
  const phone = $('#nbPhone').value.trim();
  const body = { name: $('#nbName').value.trim(), phone, whatsapp: $('#nbWa')?.value.trim() || '', email: $('#nbEmail').value.trim(), src: $('#nbSrc').value, contact: $('#nbCh').value, boat: $('#nbBoat').value, date: $('#nbDate').value, guests: +$('#nbG').value || 1, sales: $('#nbS').value, consent: $('#nbConsent').checked, note: $('#nbNote').value, lang: /^(\+?66|0)/.test(phone) ? 'th' : 'en' };
  const btn = $('#nbF button.btn-p'); if (btn) btn.disabled = true;
  api('POST', 'leads', body).then(r => {
    closeModal(); syncLead(r);
    toast(r.duplicate ? `ลูกค้ารายนี้มีลีดเปิดอยู่แล้ว (${r.lead.id}) · บันทึกเป็นการส่งซ้ำ` : 'บันทึกลีด ' + r.lead.id + ' แล้ว');
    BK.tab = 'open'; go('bookings'); if (CUR === 'bookings') vBookings();
  }).catch(e => { if (btn) btn.disabled = false; fail(e); });
};
exportCsv = function () {
  if (!can('export')) return toast('ไม่มีสิทธิ์ Export');
  const p = new URLSearchParams(); if (BK.tab === 'open') p.set('tab', 'open'); else if (STATUS[BK.tab]) p.set('tab', BK.tab.toUpperCase());
  if (BK.sales && can('bookings_all')) p.set('sales', BK.sales); if (BK.src) p.set('source', BK.src);
  location.href = '/admin/leads/export?' + p; AUDIT_DIRTY = true; toast('กำลังดาวน์โหลด · บันทึกใน Audit log');
};
function exportGads() { if (!can('export')) return toast('ไม่มีสิทธิ์ Export'); location.href = '/admin/leads/export?format=gads'; AUDIT_DIRTY = true; }

/* new leads arrive while the page is open */
let _poll = 0;
async function pollLeads() {
  if (document.hidden || !can('bookings') || $('#modal').classList.contains('flex')) return;
  try {
    const r = await api('GET', 'leads'), known = new Set(BOOKINGS.map(l => l.dbId)), fresh = r.leads.filter(l => !known.has(l.dbId));
    const before = JSON.stringify(BOOKINGS);
    BOOKINGS.length = 0; BOOKINGS.push(...r.leads); CUSTOMERS.length = 0; CUSTOMERS.push(...r.customers);
    if (JSON.stringify(BOOKINGS) === before) return;
    const sc = $('#drawer .overflow-y-auto')?.scrollTop || 0, focused = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && $('#view').contains(document.activeElement);
    if (!focused && ['dashboard', 'bookings', 'calendar', 'customers'].includes(CUR)) rerender(); else paintBell();
    if (DRAWER_LEAD && $('#drawer').classList.contains('open') && !$('#drawer').contains(document.activeElement)) { bookingDetail(DRAWER_LEAD); const d = $('#drawer .overflow-y-auto'); if (d) d.scrollTop = sc; }
    if (fresh.length) toast(`มีลีดใหม่ ${fresh.length} รายการ`);
  } catch (e) { }
}
function paintBell() {
  const n = BOOKINGS.filter(l => l.status === 'new' && (can('bookings_all') || ownB(l))).length, b = $('header button[aria-label="Notifications"]');
  if (!b) return; b.setAttribute('onclick', "BK.tab='new';go('bookings');if(CUR==='bookings')vBookings()"); b.title = n ? `ลีดใหม่รอติดต่อ ${n} รายการ` : 'ไม่มีลีดใหม่';
  b.querySelector('span')?.classList.toggle('hidden', !n);
}

/* ---------- team ---------- */
function upsertTeam(r) {
  const u = r.user, i = TEAM.findIndex(t => t.id === u.id);
  if (i >= 0) Object.assign(TEAM[i], u); else TEAM.push(u);
  TEAM_IMG[u.id] = r.img || initialsAva(u.name); BOOT.names[u.id] = u.name;
  if (u.id === ME.id) { Object.assign(ME, { ...u, perms: ME.perms }); paintMe(); }
}
function showTempPw(u, pw, isNew) {
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">${isNew ? 'สร้างบัญชี ' + esc(u.name) + ' แล้ว' : 'ตั้งรหัสผ่านชั่วคราวให้ ' + esc(u.name)}</p><p class="text-[12px] text-muted mt-1">รหัสนี้แสดงครั้งเดียว · ส่งให้เจ้าตัวทางช่องทางส่วนตัว แล้วให้เปลี่ยนรหัสที่เมนูโปรไฟล์หลังเข้าระบบ${['super', 'admin'].includes(u.roleKey) ? ' · บทบาทนี้ต้องตั้ง 2FA ตอนเข้าระบบครั้งแรก' : ''}</p></div>
    <div class="p-5 grid gap-3"><div class="rounded-xl bg-sand p-3 text-[12.5px] grid gap-1"><p class="flex justify-between gap-3"><span class="text-muted">อีเมล</span><span class="break-all">${esc(u.email)}</span></p><p class="flex justify-between gap-3"><span class="text-muted">รหัสผ่านชั่วคราว</span><span id="tmpPw" class="font-mono text-[14px] select-all">${esc(pw)}</span></p><p class="flex justify-between gap-3"><span class="text-muted">เข้าระบบที่</span><span>${location.origin}/admin</span></p></div>
    <button class="btn btn-p" onclick="navigator.clipboard?.writeText('อีเมล: ${esc(u.email)}\\nรหัสผ่านชั่วคราว: ${esc(pw)}\\nเข้าระบบ: ${location.origin}/admin').then(()=>toast('คัดลอกแล้ว'))"><i data-lucide="copy" class="w-3.5 h-3.5"></i>คัดลอกข้อมูลเข้าระบบ</button></div>
    <div class="p-4 border-t border-line flex justify-end"><button class="btn btn-o" onclick="closeModal()">ปิด</button></div>`);
}
teamSave = function () {
  if (!can('team')) return toast('ไม่มีสิทธิ์ · เฉพาะ Super Admin');
  const t = TE.cur, isNew = TE.isNew;
  if (!t.name.trim()) return toast('ใส่ชื่อเล่นก่อน');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t.email || '')) return toast('ใส่อีเมลที่ใช้เข้าสู่ระบบ');
  api(isNew ? 'POST' : 'PUT', isNew ? 'users' : 'users/' + t.id, { t, ava: TE.ava && !TE.ava.startsWith('data:image/svg') ? TE.ava : '' }).then(r => {
    upsertTeam(r); AUDIT_DIRTY = true; closeDrawer(); vTeam();
    if (r.tempPassword) showTempPw(r.user, r.tempPassword, isNew); else toast(r.relogin ? 'บันทึกแล้ว · สิทธิ์ของคุณเปลี่ยน กรุณาเข้าระบบใหม่' : 'บันทึกแล้ว');
    if (r.relogin) setTimeout(() => { location.href = '/admin/login'; }, 1500);
  }).catch(fail);
};
teamDelete = function () {
  if (!can('team')) return toast('ไม่มีสิทธิ์');
  const id = TE.cur.id;
  api('POST', `users/${id}/deactivate`).then(r => { upsertTeam(r); AUDIT_DIRTY = true; closeDrawer(); vTeam(); toast(`ปิดบัญชี ${r.user.name} แล้ว · เข้าระบบไม่ได้ ประวัติงานยังเก็บไว้`); }).catch(fail);
};
teamTransfer = function () {
  const to = $('#teTo')?.value, id = TE.cur.id; if (!to) return;
  api('POST', `users/${id}/transfer`, { to }).then(r => { const m = new Set(r.moved); BOOKINGS.forEach(l => { if (m.has(l.dbId)) l.sales = to; }); AUDIT_DIRTY = true; toast(`โอน ${r.moved.length} งานให้ ${teamOf(to)?.name || ''} แล้ว`); teamDraw(); }).catch(fail);
};
function teamReset(id) {
  const reset2fa = !!$('#teR2')?.checked;
  api('POST', `users/${id}/reset`, { reset2fa }).then(r => { closeDrawer(); AUDIT_DIRTY = true; showTempPw(r.user, r.tempPassword, false); }).catch(fail);
}
const _teamDraw20 = teamDraw;
teamDraw = function (open) {
  _teamDraw20(open);
  const d = $('#drawer'), t = TE.cur;
  d.querySelector('button.btn-p')?.replaceChildren(document.createTextNode(TE.isNew ? 'สร้างบัญชี' : 'บันทึก'));
  [...d.querySelectorAll('.tgl input')].find(x => /online/.test(x.getAttribute('onchange') || ''))?.closest('label')?.remove();
  const del = [...d.querySelectorAll('p.text-\\[12px\\].font-medium')].find(p => p.textContent === 'ลบสมาชิก');
  if (del) { del.textContent = 'ปิดบัญชี'; const b = del.parentElement.querySelector('button[onclick="teamDelete()"]'); if (b) b.lastChild.textContent = 'ปิดบัญชี (เข้าระบบไม่ได้)'; }
  if (!TE.isNew && can('team')) {
    const box = d.querySelector('.flex-1.overflow-y-auto');
    box?.insertAdjacentHTML('beforeend', `<div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium">ความปลอดภัยของบัญชี</p>
      <p class="text-[11.5px] text-muted mt-1">${t.totp ? '2FA เปิดอยู่' : '2FA ยังไม่ได้ตั้ง (ต้องตั้งตอนเข้าระบบครั้งถัดไป)'} · LINE ${t.lineLinked ? 'เชื่อมแล้ว' : 'ยังไม่เชื่อม'}${t.lastLoginAt ? ' · เข้าระบบล่าสุด ' + relTs(t.lastLoginAt) : ' · ยังไม่เคยเข้าระบบ'}</p>
      <div class="flex flex-wrap items-center gap-3 mt-3"><button class="btn btn-o !h-8" onclick="teamReset('${t.id}')"><i data-lucide="key-round" class="w-3.5 h-3.5"></i>ตั้งรหัสผ่านชั่วคราว</button>${t.totp ? `<label class="flex items-center gap-2 text-[12px]"><input id="teR2" type="checkbox" class="accent-[#70000e] w-4 h-4"/>ให้ตั้ง 2FA ใหม่ด้วย (มือถือหาย)</label>` : ''}</div>
      <p class="text-[11px] text-muted mt-2">ตั้งรหัสใหม่ = ออกจากระบบทุกอุปกรณ์ของผู้ใช้นี้ทันที</p></div>`);
    icons();
  }
};

{ const _vt = vTeam; vTeam = function () {
  _vt(); const v = $('#view');
  v.querySelectorAll('.tgl input[onchange*="online"]').forEach(i => i.closest('label')?.remove());
  const sub = v.querySelector('h2 + p'); if (sub) sub.textContent = 'ลีดใหม่กระจายให้อัตโนมัติ · เปิด/ปิดการรับลีด บทบาท และสิทธิ์ ได้ที่ปุ่ม แก้ไข';
  const card = [...v.querySelectorAll('.card')].find(c => c.querySelector('p.font-medium')?.textContent === 'การกระจายคำขอ');
  if (card) card.innerHTML = `<p class="font-medium">การกระจายลีดใหม่</p><ul class="mt-3 space-y-2 text-[12.5px]">
    <li class="flex gap-2"><i data-lucide="repeat" class="w-4 h-4 text-maroon shrink-0 mt-0.5"></i>วนตามลำดับ (round-robin) เฉพาะคนที่เปิด “รับคำขอจองใหม่” และพูดภาษาเดียวกับลูกค้า</li>
    <li class="flex gap-2"><i data-lucide="message-circle" class="w-4 h-4 text-maroon shrink-0 mt-0.5"></i>ส่งการ์ดลีดเข้า LINE ของเซลล์ที่ได้รับ (ต้องเชื่อม LINE ที่เมนูโปรไฟล์ของแต่ละคน) พร้อมปุ่ม “รับเรื่อง”</li>
    <li class="flex gap-2"><i data-lucide="alarm-clock" class="w-4 h-4 text-maroon shrink-0 mt-0.5"></i>ถ้าไม่มีใครติดต่อลูกค้าใน 15 นาที แจ้งเตือนเข้ากลุ่ม LINE ทีมขาย</li></ul>`;
  icons();
}; PAGES.find(p => p[0] === 'team')[3] = vTeam; }

/* ---------- my profile: password + LINE ---------- */
mePanel = function () {
  const P = permsOf(ME), mins = Math.max(0, IDLE_MIN - Math.floor((Date.now() - lastAct) / 60000)), L = BOOT.myLine || {};
  openModal(`<div class="p-5 border-b border-line flex items-center gap-3"><img src="${TEAM_IMG[ME.id] || initialsAva(ME.name)}" class="w-11 h-11 rounded-full object-cover"/><div class="min-w-0 flex-1"><p class="font-medium">${esc(ME.name)}</p><p class="text-[12px] text-muted">${esc(ME.email)} · ${ROLES[ME.roleKey][0]}</p></div><button class="btn btn-g !px-2" onclick="closeModal()" aria-label="Close"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="p-5 space-y-5">
      <div><p class="lbl">แจ้งเตือนลีดทาง LINE</p>${L.linked ? `<div class="flex items-center justify-between gap-3 rounded-xl bg-[#eaf6ef] text-[#1e7a46] p-3 text-[12.5px]"><span class="flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4"></i>เชื่อม LINE แล้ว · ลีดใหม่ส่งเข้า LINE ของคุณ</span><button class="text-[11px] underline" onclick="meLineUnlink()">ยกเลิก</button></div>`
        : `<div class="rounded-xl ring-1 ring-line p-3 text-[12.5px] grid gap-2"><p>1. เพิ่มเพื่อน LINE OA ของบริษัท · 2. ส่งข้อความ <b class="font-mono">LINK ${L.code || '······'}</b> ในแชท</p>${L.code ? `<p class="text-[11px] text-muted">ส่งแล้วกด “ตรวจสอบ” · รหัสใช้ได้ครั้งเดียว</p><div class="flex gap-2"><button class="btn btn-o !h-8" onclick="meLineCheck()">ตรวจสอบ</button><button class="btn btn-g !h-8" onclick="meLineCode()">ขอรหัสใหม่</button></div>` : `<button class="btn btn-o !h-8 justify-self-start" onclick="meLineCode()"><i data-lucide="link" class="w-3.5 h-3.5"></i>สร้างรหัสเชื่อม LINE</button>`}</div>`}</div>
      <form class="grid gap-2" onsubmit="event.preventDefault();mePassword(this)"><p class="lbl">เปลี่ยนรหัสผ่าน</p>
        <input name="current" type="password" class="inp" placeholder="รหัสผ่านปัจจุบัน" autocomplete="current-password" required/>
        <div class="grid grid-cols-2 gap-2"><input name="password" type="password" class="inp" placeholder="รหัสใหม่ (12 ตัวขึ้นไป)" autocomplete="new-password" required/><input name="password2" type="password" class="inp" placeholder="ยืนยันรหัสใหม่" autocomplete="new-password" required/></div>
        <button class="btn btn-o justify-self-start !h-8">บันทึกรหัสใหม่</button></form>
      <div><p class="lbl">สิทธิ์ของคุณ</p><div class="grid gap-1">${PERMS.map(([k, l]) => `<p class="flex items-center gap-2 text-[12.5px] ${P.includes(k) ? '' : 'text-muted line-through decoration-[#d9cfcf]'}"><i data-lucide="${P.includes(k) ? 'check' : 'x'}" class="w-3.5 h-3.5 ${P.includes(k) ? 'text-[#1e7a46]' : 'text-[#c9bfbf]'}"></i>${l}</p>`).join('')}</div></div>
      <div class="rounded-xl bg-sand p-3 text-[12px] grid gap-1"><p class="flex justify-between"><span class="text-muted">อุปกรณ์</span><span>${DEVICE}</span></p><p class="flex justify-between"><span class="text-muted">หมดเวลาถ้าไม่ใช้งานใน</span><span>${mins} นาที</span></p></div>
      <p class="text-[11px] text-muted">ต้องการสิทธิ์เพิ่ม ติดต่อ Super Admin · ทุกการเปลี่ยนสิทธิ์ถูกบันทึกไว้</p></div>
    <div class="p-4 border-t border-line flex gap-2"><button class="btn btn-p flex-1" onclick="closeModal();logout()"><i data-lucide="log-out" class="w-3.5 h-3.5"></i>ออกจากระบบ</button></div>`);
};
function mePassword(f) {
  if (f.password.value !== f.password2.value) return toastErr('รหัสใหม่ไม่ตรงกัน');
  api('POST', 'me/password', { current: f.current.value, password: f.password.value }).then(() => { f.reset(); toast('เปลี่ยนรหัสผ่านแล้ว'); AUDIT_DIRTY = true; }).catch(fail);
}
function meLineCode() { api('POST', 'me/line-code').then(r => { BOOT.myLine = { linked: false, code: r.code }; mePanel(); }).catch(fail); }
function meLineCheck() { api('GET', 'me/line').then(r => { BOOT.myLine = r; mePanel(); toast(r.linked ? 'เชื่อม LINE แล้ว' : 'ยังไม่พบข้อความ LINK ลองอีกครั้ง'); }).catch(fail); }
function meLineUnlink() { api('POST', 'me/line-unlink').then(() => { BOOT.myLine = { linked: false, code: null }; mePanel(); toast('ยกเลิกการเชื่อม LINE แล้ว'); }).catch(fail); }

logout = function (reason) {
  if (!ME) return;
  try { flushBoat(); boatTick(true); } catch (e) { }
  ME = null;
  api('POST', 'logout', { reason: reason || '' }).catch(() => { }).finally(() => { location.href = '/admin/login' + (reason === 'timeout' ? '?timeout=1' : ''); });
};

/* ---------- boats: anything changed in the list syncs at once; the open editor syncs on บันทึก / leaving ---------- */
const boatPayload = b => ({ slug: b.slug, name: b.title && b.name === niceTitle(b.title) ? b.title : b.name, subtitle: b.subtitle, type: b.type, ft: b.ft, pax: b.pax, marinaP: b.marinaP, marina: b.marina, from_: b.from_, active: b.active, featured: b.featured, status: b.status,
  cal: SZ.boats[b.slug] || null, colmap: (SZ.colmap || {})[b.slug] ?? null, imgs: (b.imgs || []).filter(u => !/^data:/.test(u)), tables: b.tables, includes: b.includes, not_included: b.not_included, complimentary: b.complimentary, notes: b.notes, info: b.info, time_slots: b.time_slots, i18n: b.i18n || null });
const BSYNC = new Map(), BFLY = new Set(), RENAMED = {};
FLEET.forEach(b => BSYNC.set(b.slug, JSON.stringify(boatPayload(b))));
function pushBoat(b, k, note) {
  if (BFLY.has(b.slug)) return; BFLY.add(b.slug);
  const slug = b.slug, old = RENAMED[slug];
  if ((b.imgs || []).some(u => /^data:/.test(u))) toast('รูปที่อัปโหลดจากเครื่องยังไม่ถูกเก็บถาวร · ใช้รูปจากคลังสื่อ');
  return api('PUT', 'boats/' + encodeURIComponent(slug), { boat: boatPayload(b), oldSlug: old, note }).then(r => {
    BSYNC.set(slug, k); if (old) { BSYNC.delete(old); delete RENAMED[slug]; }
    AUDIT_DIRTY = true; if (r.changes) toast(`บันทึก ${b.name} แล้ว · หน้าเว็บอัปเดตทันที`);
  }).catch(e => { BSYNC.set(slug, k); fail(e); }).finally(() => BFLY.delete(slug));
}
function boatTick(force, only) {
  if (!ME || !can('boats')) return;
  const editing = CUR === 'boats' ? (location.hash.split('/')[2] || '') : '';
  for (const b of FLEET) {
    if (only && b.slug !== only) continue;
    if (!force && editing && decodeURIComponent(editing) === b.slug) continue;
    const k = JSON.stringify(boatPayload(b)); if (BSYNC.get(b.slug) !== k) pushBoat(b, k);
  }
}
setInterval(() => boatTick(false), 1500);
{ const _bs = boatSave; boatSave = function (slug) { _bs(slug); boatTick(true, bySlug(slug) ? slug : undefined); }; }
/* delete = remove from the list right away, then delete on the server (also makes the 301 redirects); put it back if the server refuses */
{ const _rm = boatRemove; boatRemove = function (slug) {
  const i = FLEET.findIndex(b => b.slug === slug); if (i < 0) return; const b = FLEET[i], cal = SZ.boats[slug];
  _rm(slug); if (BSNAP && BSNAP.slug === slug) BSNAP = null;
  if (!BSYNC.has(slug)) return;   // never saved on the server
  BSYNC.delete(slug);
  api('DELETE', 'boats/' + encodeURIComponent(slug)).then(r => {
    (r.redirects || []).forEach(x => { const k = REDIR.findIndex(y => y.from === x.from); if (k >= 0) REDIR.splice(k, 1); REDIR.unshift(Object.assign({ hits: 0 }, x)); });
    AUDIT_DIRTY = true;
  }).catch(e => {
    if (!bySlug(slug)) FLEET.splice(Math.min(i, FLEET.length), 0, b);
    if (cal) SZ.boats[slug] = cal; BSYNC.set(slug, JSON.stringify(boatPayload(b)));
    fail(e); if (CUR === 'boats') route();
  });
}; }
{ const _bb = boatBulk; boatBulk = function (op, v) {
  if (op !== 'del' || v === '__ok') return _bb(op, v);
  const S = [...BSEL].map(bySlug).filter(Boolean), keep = S.filter(b => bookingsOf(b.slug).length);
  openModal(`<div class="p-5 grid gap-3"><p class="font-medium">ลบเรือ ${S.length - keep.length} ลำถาวร?</p>
    <p class="text-[12.5px] text-muted">${esc(S.filter(b => !keep.includes(b)).map(b => b.name).join(', ')) || '—'}</p>
    ${keep.length ? `<p class="text-[12.5px] text-[#a3222c]">ข้าม ${keep.length} ลำที่มีลีด (${esc(keep.map(b => b.name).join(', '))}) · ใช้ “ซ่อนจากเว็บ” แทน</p>` : ''}
    <p class="text-[11.5px] text-muted">ข้อมูลเรือ ราคา และ SEO จะถูกลบ · ระบบตั้ง redirect 301 จาก URL เดิมไปหน้ารวมเรือให้อัตโนมัติ</p>
    <div class="flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button>${S.length > keep.length ? `<button class="btn !bg-[#a3222c] text-white" onclick="closeModal();boatBulk('del','__ok')">ลบถาวร</button>` : ''}</div></div>`);
}; }

/* ---------- นำเข้าเรือจากโบรชัวร์ PDF (Gemini อ่านไฟล์ → ตรวจ → สร้างเป็นฉบับร่าง) ---------- */
let BPDF = [], BPDF_FILE = '';
function boatPdf() {
  if (!can('boats')) return toast('ไม่มีสิทธิ์จัดการเรือ');
  trUsage(true).catch(() => null).then(u => {
    openModal(`<div class="p-5 grid gap-4"><div class="flex items-center justify-between"><p class="font-medium">นำเข้าเรือจากโบรชัวร์ PDF</p><button class="btn btn-g !px-2" onclick="closeModal()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
      <p class="text-[12.5px] text-muted">เลือกไฟล์ PDF ของซัพพลายเออร์ (ไม่เกิน 14 MB) · Gemini จะอ่านชื่อเรือ สเปก ตารางราคา สิ่งที่รวม/ไม่รวม แล้วให้ตรวจก่อน · เรือที่สร้างจะเป็น “ฉบับร่าง” ยังไม่แสดงบนเว็บ</p>
      <label class="grid place-items-center gap-2 rounded-xl border border-dashed border-[rgb(35_20_22/.25)] bg-sand/50 p-6 cursor-pointer text-[13px]"><i data-lucide="file-up" class="w-6 h-6 text-maroon"></i><span id="bpName">คลิกเพื่อเลือกไฟล์ PDF</span><input id="bpFile" type="file" accept="application/pdf,.pdf" class="hidden" onchange="$('#bpName').textContent=this.files[0]?.name||'คลิกเพื่อเลือกไฟล์ PDF'"/></label>
      ${u ? trMeter(u) : ''}
      <p class="text-[11.5px] text-muted">ใช้โควตา Gemini 1 ครั้ง + ~10,000 ตัวอักษร (ฟรี) · ยังไม่ดึงรูปจาก PDF ให้ เพิ่มรูปจากคลังสื่อภายหลัง · ตัวเลขจาก AI ต้องตรวจกับ PDF ทุกครั้ง</p>
      ${u && !u.enabled ? '<p class="text-[12.5px] text-[#a3222c]">ยังไม่ได้เชื่อม Gemini (GEMINI_API_KEY) จึงอ่าน PDF ไม่ได้</p>' : ''}
      <div class="flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button id="bpGo" class="btn btn-p" ${u && !u.enabled ? 'disabled' : ''} onclick="boatPdfRead()"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i>อ่าน PDF</button></div></div>`);
    icons();
  });
}
async function boatPdfRead() {
  const f = $('#bpFile')?.files?.[0]; if (!f) return toast('เลือกไฟล์ PDF ก่อน');
  if (f.size > 14 * 1048576) return toastErr('ไฟล์ใหญ่เกิน 14 MB');
  const go = $('#bpGo'); go.disabled = true; go.innerHTML = '<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i>กำลังอ่าน… (อาจใช้ 1–2 นาที)'; icons();
  const fd = new FormData(); fd.append('file', f);
  try {
    const r = await fetch('/api/admin/boats-pdf', { method: 'POST', body: fd, credentials: 'same-origin' });
    let j = {}; try { j = await r.json(); } catch (e) { }
    if (r.status === 401) { location.href = '/admin/login?next=' + encodeURIComponent(location.hash || ''); return; }
    if (!r.ok) throw new Error(j.error || 'อ่าน PDF ไม่สำเร็จ');
    TRU.at = 0; AUDIT_DIRTY = true;
    if (!j.boats.length) { closeModal(); return toastErr('ไม่พบข้อมูลเรือในไฟล์นี้ (ไม่เสียโควตา)'); }
    BPDF = j.boats.map(b => Object.assign(b, { _on: !FLEET.some(x => slugify(x.name) === slugify(b.name)) }));
    boatPdfReview(f.name);
  } catch (e) { fail(e); go.disabled = false; go.innerHTML = '<i data-lucide="sparkles" class="w-3.5 h-3.5"></i>อ่าน PDF'; icons(); }
}
function boatPdfReview(file = BPDF_FILE) {
  BPDF_FILE = file;
  const n = BPDF.filter(b => b._on).length;
  openModal(`<div class="flex flex-col max-h-[86vh]"><div class="p-5 pb-3"><p class="font-medium">พบเรือ ${BPDF.length} ลำใน ${esc(file || 'PDF')}</p><p class="text-[12px] text-muted mt-1">ติ๊กเลือกลำที่จะสร้าง · ตรวจชื่อ ขนาด และราคาให้ตรงกับ PDF · แก้ละเอียดต่อได้ในหน้าแก้ไขเรือ</p></div>
    <div class="px-5 overflow-y-auto grid gap-2.5">${BPDF.map((b, i) => { const dup = FLEET.find(x => slugify(x.name) === slugify(b.name)); const rows = b.tables.reduce((k, t) => k + t.rows.length, 0);
      return `<div class="card p-3.5 ${b._on ? '' : 'opacity-60'}"><label class="flex items-start gap-3"><input type="checkbox" class="accent-[#70000e] w-4 h-4 mt-1" ${b._on ? 'checked' : ''} onchange="BPDF[${i}]._on=this.checked;boatPdfReview()"/>
        <div class="flex-1 grid gap-2"><div class="grid sm:grid-cols-[2fr_1.4fr_.8fr_.8fr] gap-2">
          <input class="inp" value="${esc(b.name)}" oninput="BPDF[${i}].name=this.value" title="ชื่อเรือ"/>
          <select class="inp" onchange="BPDF[${i}].type=this.value">${Object.entries(TYPE_TH).map(([k, v]) => `<option value="${k}" ${k === b.type ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <input class="inp" type="number" value="${b.ft ?? ''}" placeholder="ft" oninput="BPDF[${i}].ft=+this.value||null" title="ความยาว (ft)"/>
          <input class="inp" type="number" value="${b.pax ?? ''}" placeholder="คน" oninput="BPDF[${i}].pax=+this.value||null" title="จำนวนคนสูงสุด"/></div>
          <p class="text-[11.5px] text-muted">${esc(b.marina || 'ไม่ระบุท่าเรือ')} · เริ่ม ${b.from_ ? nf(b.from_) + ' THB' : '—'} · ราคา ${rows} โปรแกรม${b.tables.length > 1 ? ` (${b.tables.length} ตาราง)` : ''} · รวม ${b.includes.length} · ไม่รวม ${b.not_included.length} · สเปก ${b.info.length} รายการ</p>
          ${b.tables[0] ? `<p class="text-[11px] text-muted truncate">${esc(b.tables[0].columns.join(' | '))} → ${esc((b.tables[0].rows[0] || []).join(' | '))}</p>` : '<p class="text-[11.5px] text-[#b26a00]">ไม่พบตารางราคา</p>'}
          ${dup ? `<p class="text-[11.5px] text-[#a3222c]">มีเรือชื่อนี้อยู่แล้ว (${esc(dup.name)}) · ถ้าเลือก จะสร้างเป็นอีกลำ</p>` : ''}</div></label></div>`; }).join('')}</div>
    <div class="p-5 pt-3 flex justify-end gap-2 border-t border-[rgb(35_20_22/.08)] mt-3"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" ${n ? '' : 'disabled'} onclick="boatPdfCreate()">สร้างเป็นฉบับร่าง (${n} ลำ)</button></div></div>`);
  $('#modalBox').style.maxWidth = '820px'; icons();
}
{ const _cm = closeModal; closeModal = function () { _cm(); $('#modalBox').style.maxWidth = ''; }; }
function boatPdfCreate() {
  const pick = BPDF.filter(b => b._on && b.name.trim()); if (!pick.length) return;
  const marina = m => MARINAS.find(x => m && (x.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(x.split(' (')[0].toLowerCase()))) || m || MARINAS[0];
  pick.forEach(p => {
    const name = p.name.trim(), slug = uniqSlug(name), mar = marina(p.marina);
    const tables = p.tables.length ? p.tables : [{ caption: '', columns: ['Program', 'Low Season', 'High Season', 'Peak Season'], rows: [['', '', '', '']] }];
    const b = { slug, title: name.toUpperCase(), name, subtitle: p.subtitle || '', type: p.type, ft: p.ft, pax: p.pax, from_: p.from_, marina: mar, marinaP: mar,
      info: p.info.length ? p.info : [['Boat Name', name], ['Size', (p.ft || '') + ' ft.'], ['Capacity', (p.pax || '') + ' passengers']],
      includes: p.includes, complimentary: p.complimentary, not_included: p.not_included, time_slots: p.time_slots, notes: p.notes, remarks: [], tables, active: false, status: 'draft', featured: false, imgs: [] };
    b.i18n = { name: tr(name, name), subtitle: tr(), desc: tr(), programs: tables.map(t => t.rows.map(r => tr(autoTh(r[0] || '') || '', r[0] || ''))), includes: [], complimentary: [], not_included: [], slots: [], notes: tr(), seoTitle: tr(), seoDesc: tr() };
    FLEET.unshift(b);
  });
  closeModal(); BPDF = []; boatTick(true);
  toast(`สร้างฉบับร่าง ${pick.length} ลำแล้ว · เพิ่มรูปและตรวจราคาก่อนเผยแพร่`); go('boats'); vBoats();
}
{ const _br = boatRename; boatRename = function (old, val) { const b = bySlug(old); _br(old, val); if (b && b.slug !== old) { if (BSYNC.has(old)) { RENAMED[b.slug] = old; BSYNC.set(b.slug, BSYNC.get(old)); } boatTick(true, b.slug); } }; }

/* ---------- season calendars ---------- */
{ const _sz = szSave; szSave = function () { const c = SZV.edit; _sz(); if (c) api('PUT', 'seasons/' + encodeURIComponent(c.id), { cal: c }).then(() => { AUDIT_DIRTY = true; toast('บันทึกแล้ว · หน้าเว็บใช้ช่วงวันที่ใหม่ทันที'); }).catch(fail); }; }

/* ---------- articles: autosave a few seconds after typing stops ---------- */
const coverUrl = a => THUMBS[a.cover] || (/^(\/|https:)/.test(a.cover || '') ? a.cover : '');
const blocksFor = (a, k) => { const B = a.blocks?.[k]; return B && B.length ? B : (a.body?.[k] && typeof parseBlocks === 'function' ? parseBlocks(a.body[k]) : []); };
const postPayload = a => trHold(a, { id: a.id, cat: a.cat, status: a.status, date: a.date, cover: coverUrl(a), title: a.title, slug: a.slug, excerpt: a.excerpt, seoT: a.seoT, seoD: a.seoD, kw: a.kw, blocks: { th: blocksFor(a, 'th'), en: blocksFor(a, 'en') } });   // trHold: machine-translation drafts are not published
const ASYNC = new Map(), ASEEN = new Map(), AFLY = new Set();
const allArts = () => (typeof ART_ALL !== 'undefined' && ART_ALL.length ? ART_ALL : ART);
allArts().forEach(a => ASYNC.set(a.id, JSON.stringify(postPayload(a))));
function pushArt(a, k, explicit) {
  if (AFLY.has(a.id)) return; AFLY.add(a.id);
  const ind = $('#artSaveInd'); if (ind) ind.textContent = 'กำลังบันทึก…';
  return api('PUT', 'posts/' + a.id, { post: postPayload(a), explicit }).then(() => { ASYNC.set(a.id, k); AUDIT_DIRTY = true; const i = $('#artSaveInd'); if (i) i.textContent = 'บันทึกแล้ว ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); })
    .catch(e => { ASYNC.set(a.id, k); fail(e); const i = $('#artSaveInd'); if (i) i.textContent = 'บันทึกไม่สำเร็จ'; }).finally(() => AFLY.delete(a.id));
}
function artTick(full) {
  if (!ME || !can('content')) return;
  const list = full ? allArts() : allArts().filter(a => a.id === AE.id);
  for (const a of list) {
    const k = JSON.stringify(postPayload(a)); if (ASYNC.get(a.id) === k) { ASEEN.delete(a.id); continue; }
    if (full || ASEEN.get(a.id) === k) pushArt(a, k); else ASEEN.set(a.id, k);   // unchanged for one tick → save
  }
}
/* Preview TH/EN: save what is on screen first, then open the article at its real URL with ?preview=<id>
   (the server shows drafts there to staff with content permission only) */
function artPreview(id, k) {
  const a = artById(id); if (!a) return;
  const w = window.open('', '_blank');   // open now, inside the click, so popup blockers allow it
  const url = `${k === 'en' ? '/en' : ''}/blog/${encodeURIComponent(a.slug?.[k] || 'preview-' + id)}?preview=${id}`, key = JSON.stringify(postPayload(a));
  const wait = !can('content') || ASYNC.get(id) === key ? Promise.resolve()
    : AFLY.has(id) ? new Promise(r => setTimeout(r, 1500)) : pushArt(a, key);
  Promise.resolve(wait).finally(() => { if (w) w.location.href = url; else location.href = url; });
}
setInterval(() => artTick(false), 2000);
setInterval(() => artTick(true), 15000);
{ const _ap = artPublish; artPublish = function (id) { _ap(id); const a = artById(id); if (a) { if (a.status === 'scheduled') toast('ตั้งเวลาเผยแพร่ยังไม่รองรับ · บทความจะแสดงเมื่อกดเผยแพร่ในวันนั้น'); pushArt(a, JSON.stringify(postPayload(a)), true); } }; }
{ const _ve = vArticleEdit; vArticleEdit = function (id) { _ve(id); const h = $('#view h2'); if (h && can('content')) h.insertAdjacentHTML('afterend', '<p id="artSaveInd" class="text-[11px] text-muted mt-1">บันทึกอัตโนมัติ</p>');
  if (can('content')) $(`#view button[onclick^="artPreview(${+id},"]`)?.insertAdjacentHTML('beforebegin', `<button class="btn btn-g !px-2 text-[#b42318]" title="ย้ายไปถังขยะ" onclick="artDel(${+id})"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`); icons(); }; }
/* delete an article: a live one sends its URLs (and old WordPress links to it) to the blog list, or answers 410 */
function artDel(id) {
  const a = artById(id); if (!a || !can('content')) return;
  const live = a.status === 'published', t = a.title.th || a.title.en || 'บทความไม่มีชื่อ';
  const urls = [a.slug.th && `/blog/${a.slug.th}`, a.slug.en && `/en/blog/${a.slug.en}`].filter(Boolean);
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">ย้ายบทความไปถังขยะ?</p><p class="text-[12.5px] mt-1">${esc(t)}</p><p class="text-[12px] text-muted mt-1">ทั้งภาษาไทยและอังกฤษ · กู้คืนได้ที่แท็บถังขยะภายใน 30 วัน จากนั้นจะถูกลบถาวรอัตโนมัติ</p></div>
    <div class="p-5 grid gap-2 text-[12.5px]">${live ? `<p class="lbl">บทความนี้เผยแพร่อยู่ · ระหว่างอยู่ในถังขยะ คนที่เข้าลิงก์เดิมจะ…</p>
      <label class="flex gap-2.5 items-start p-3 rounded-xl ring-1 ring-line cursor-pointer"><input type="radio" name="artDelMode" value="blog" checked class="mt-0.5"/><span><b class="font-medium">ไปหน้ารวมบทความ (301)</b> · แนะนำ<br/><span class="text-muted text-[11.5px]">เก็บคะแนน SEO และลิงก์จากเว็บอื่นไว้</span></span></label>
      <label class="flex gap-2.5 items-start p-3 rounded-xl ring-1 ring-line cursor-pointer"><input type="radio" name="artDelMode" value="gone" class="mt-0.5"/><span><b class="font-medium">แจ้งว่าลบแล้ว (410)</b><br/><span class="text-muted text-[11.5px]">ให้ Google เอาออกจากผลค้นหาเร็วที่สุด</span></span></label>
      <p class="text-[11px] text-muted font-mono break-all">${urls.map(esc).join('<br/>')}</p>` : '<p class="text-muted">บทความนี้ยังไม่เผยแพร่ ไม่มีผลกับหน้าเว็บ</p>'}</div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button id="artDelGo" class="btn btn-p !bg-[#b42318]" onclick="artDelGo(${+id})"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i>ย้ายไปถังขยะ</button></div>`);
  icons();
}
function artDelGo(id) {
  if (AFLY.has(id)) return toast('กำลังบันทึกบทความอยู่ ลองใหม่อีกครั้ง');
  const mode = $('input[name="artDelMode"]:checked')?.value || 'blog', b = $('#artDelGo'); if (b) b.disabled = true;
  const drop = () => { for (const L of [ART, typeof ART_ALL !== 'undefined' ? ART_ALL : []]) { const i = L.findIndex(x => x.id === id); if (i >= 0) L.splice(i, 1); } ASYNC.delete(id); ASEEN.delete(id); };
  const a = artById(id);
  api('DELETE', 'posts/' + id, { mode }).then(r => {
    drop(); AUDIT_DIRTY = true; if (r.trash && a && typeof TRASH !== 'undefined' && TRASH.list) TRASH.list.unshift({ ...a, cover: coverUrl(a), trash: r.trash });
    for (const x of r.redirects || []) { const i = REDIR.findIndex(y => y.from === x.from); if (i >= 0) Object.assign(REDIR[i], x); else REDIR.unshift({ ...x, hits: 0 }); }
    closeModal(); go('articles'); setTimeout(() => { if (CUR === 'articles' && !location.hash.split('/')[2]) vArticles(); }, 0); toast(r.redirects?.length ? `ย้ายไปถังขยะแล้ว · ลิงก์เดิม ${r.redirects.length} URL ${mode === 'gone' ? 'ตอบ 410' : 'ไปหน้ารวมบทความ'} (มีผลภายใน 5 นาที)` : 'ย้ายไปถังขยะแล้ว · กู้คืนได้ภายใน 30 วัน');
  }).catch(e => { if (e.status === 404) { drop(); closeModal(); go('articles'); toast('ลบบทความแล้ว'); } else { fail(e); if (b) b.disabled = false; } });
}
{ const _vl = vArticles; vArticles = function () { _vl(); if (location.hash.split('/')[2] || !can('content')) return;
  $('#view table.tbl thead tr')?.insertAdjacentHTML('beforeend', '<th></th>');
  $$('#view table.tbl tbody tr.click').forEach(tr => { const id = +(tr.getAttribute('onclick').match(/articles\/(\d+)/) || [])[1]; if (id) tr.insertAdjacentHTML('beforeend', `<td class="text-right"><button class="btn btn-g !px-2 !h-8 text-muted hover:text-[#b42318]" title="ย้ายไปถังขยะ" onclick="event.stopPropagation();artDel(${id})"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>`); });
  icons(); }; PAGES.find(p => p[0] === 'articles')[3] = vArticles; }

/* ---------- articles: ถังขยะ — a deleted article waits here (TRASH.days, 30) before it is deleted for good ---------- */
const TRASH = { list: null, loading: false, days: 30 };
function trashLoad(force) {
  if (!can('content') || TRASH.loading || (TRASH.list && !force)) return; TRASH.loading = true;
  api('GET', 'posts/trash').then(r => { TRASH.list = r.trash || []; TRASH.days = r.days || 30; if (CUR === 'articles' && !location.hash.split('/')[2]) vArticles(); })
    .catch(() => { TRASH.list ??= []; }).finally(() => { TRASH.loading = false; });
}
const trLeft = a => Math.max(0, TRASH.days - Math.floor((Date.now() - new Date(a.trash.at)) / 864e5));
function trashHTML() {
  const L = (TRASH.list || []).filter(a => (!AFL.cat || a.cat === AFL.cat) && (!AFL.q || (a.title.th + ' ' + a.title.en).toLowerCase().includes(AFL.q.toLowerCase())));
  const when = s => { const d = new Date(s); return fmtD(iso(d)) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); };
  return `<div class="px-4 py-3 border-b border-line flex flex-wrap items-center gap-2 text-[12px] text-muted"><i data-lucide="info" class="w-4 h-4"></i>
      <span class="flex-1 min-w-[240px]">บทความในถังขยะไม่แสดงบนเว็บ และจะถูกลบถาวรอัตโนมัติเมื่อครบ ${TRASH.days} วัน · ลิงก์เดิมยัง redirect ตามที่เลือกตอนลบ · กู้คืนแล้วทุกอย่างกลับเหมือนเดิม</span>
      ${TRASH.list?.length ? `<button class="btn btn-o !h-8 text-[#b42318]" onclick="trashEmpty()"><i data-lucide="trash" class="w-3.5 h-3.5"></i>ล้างถังขยะ</button>` : ''}</div>
    <div class="overflow-x-auto"><table class="tbl min-w-[860px]" id="trashTbl"><thead><tr><th>บทความ</th><th>หมวด</th><th>สถานะก่อนลบ</th><th>ลบโดย</th><th>ลบเมื่อ</th><th>ลบถาวรใน</th><th></th></tr></thead><tbody>
    ${!TRASH.list ? '<tr><td colspan="7" class="text-center text-muted py-10">กำลังโหลด…</td></tr>' : L.map(a => { const t = a.title.th || a.title.en || 'บทความไม่มีชื่อ', d = trLeft(a), st = a.trash.published ? 'published' : 'draft';
      return `<tr><td><div class="flex items-center gap-3 min-w-[280px]">${coverUrl(a) ? `<img src="${esc(coverUrl(a))}" class="w-16 h-11 rounded-lg object-cover shrink-0 opacity-70"/>` : '<span class="w-16 h-11 rounded-lg bg-sand shrink-0"></span>'}<div class="min-w-0"><p class="truncate max-w-[340px]">${esc(t)}</p><p class="text-[11px] text-muted truncate max-w-[340px]">${a.title.th && a.title.en ? esc(a.title.en) : ''}</p></div></div></td>
        <td class="text-muted whitespace-nowrap">${ACAT_A[a.cat] || esc(a.cat)}</td><td><span class="pill ${ART_ST[st][1]}">${ART_ST[st][0]}</span>${a.trash.published ? `<p class="text-[10.5px] text-muted mt-1">ลิงก์เดิม → ${a.trash.mode === 'gone' ? '410' : 'หน้ารวมบทความ'}</p>` : ''}</td>
        <td class="whitespace-nowrap">${esc(a.trash.name || '—')}</td><td class="text-muted whitespace-nowrap">${when(a.trash.at)}</td>
        <td class="whitespace-nowrap tnum ${d <= 3 ? 'text-[#b42318]' : 'text-muted'}">${d ? d + ' วัน' : 'วันนี้'}</td>
        <td class="text-right whitespace-nowrap"><button class="btn btn-o !h-8" onclick="trashRestore(${+a.id})"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>กู้คืน</button>
          <button class="btn btn-g !px-2 !h-8 text-muted hover:text-[#b42318]" title="ลบถาวร" onclick="trashPurge(${+a.id})"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`; }).join('') || `<tr><td colspan="7" class="text-center text-muted py-12"><i data-lucide="trash-2" class="w-6 h-6 mx-auto mb-2 opacity-40"></i>${TRASH.list.length ? 'ไม่พบบทความที่ค้นหาในถังขยะ' : 'ถังขยะว่าง'}</td></tr>`}
    </tbody></table></div>`;
}
{ const _vt = vArticles; vArticles = function () {
  if (location.hash.split('/')[2] || !can('content')) return _vt();
  const inT = AFL.tab === 'trash'; if (inT) AFL.tab = 'all';
  try { _vt(); } finally { if (inT) AFL.tab = 'trash'; }
  trashLoad();
  const bar = $('#view .card .flex.gap-1.overflow-x-auto');
  if (bar) { if (inT) bar.querySelector('.tab.on')?.classList.remove('on');
    bar.insertAdjacentHTML('beforeend', `<button class="tab ${inT ? 'on' : ''}" onclick="AFL.tab='trash';AP.page=0;vArticles()"><i data-lucide="trash-2" class="w-3.5 h-3.5 inline-block -mt-0.5"></i> ถังขยะ <span class="opacity-60 tnum">${TRASH.list ? TRASH.list.length : (WP.trashN ?? '…')}</span></button>`); }
  if (inT) { const t = $('#view table.tbl')?.closest('.overflow-x-auto'); if (t) { let n = t.nextElementSibling; while (n) { const x = n.nextElementSibling; n.remove(); n = x; } t.outerHTML = trashHTML(); } }
  icons(); }; PAGES.find(p => p[0] === 'articles')[3] = vArticles; }
function trashRestore(id) {
  const a = TRASH.list?.find(x => x.id === id); if (!a) return;
  api('POST', `posts/${id}/restore`).then(r => {
    const w = r.post, n = { ...w, cover: '__wp' + w.id, blocks: { th: w.blocks.th, en: w.blocks.en }, body: { th: blocksHtml(w.blocks.th), en: blocksHtml(w.blocks.en) }, imported: true };
    THUMBS[n.cover] = w.cover || THUMBS['leopard-90-ft'];
    ART.push(n); if (typeof ART_ALL !== 'undefined' && ART_ALL !== ART && ART_ALL.length) ART_ALL.push(n);
    ASYNC.set(n.id, JSON.stringify(postPayload(n)));
    for (const x of r.redir || []) { const i = REDIR.findIndex(y => y.from === x.from); if (x.created) { if (i >= 0) REDIR.splice(i, 1); } else if (i >= 0) Object.assign(REDIR[i], { to: x.to, code: x.code }); }
    TRASH.list.splice(TRASH.list.indexOf(a), 1); AUDIT_DIRTY = true; vArticles();
    toast(`กู้คืนแล้ว · ${n.status === 'published' ? 'กลับมาแสดงบนเว็บ (มีผลภายใน 5 นาที)' : 'อยู่ในแท็บร่าง'}`);
  }).catch(e => { if (e.status === 404) { TRASH.list.splice(TRASH.list.indexOf(a), 1); vArticles(); } fail(e); });
}
function trashPurge(id) {
  const a = TRASH.list?.find(x => x.id === id); if (!a) return;
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">ลบบทความถาวร?</p><p class="text-[12.5px] mt-1">${esc(a.title.th || a.title.en || 'บทความไม่มีชื่อ')}</p><p class="text-[12px] text-muted mt-1">ลบทั้งภาษาไทยและอังกฤษ · กู้คืนไม่ได้อีก · ลิงก์เดิมยัง redirect ตามเดิม</p></div>
    <div class="p-4 flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button id="trPurgeGo" class="btn btn-p !bg-[#b42318]" onclick="trashPurgeGo([${+id}])"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i>ลบถาวร</button></div>`);
}
function trashEmpty() {
  const n = TRASH.list?.length; if (!n) return;
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">ล้างถังขยะ?</p><p class="text-[12.5px] mt-1">ลบถาวร ${n} บทความ · กู้คืนไม่ได้อีก</p></div>
    <div class="p-4 flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button id="trPurgeGo" class="btn btn-p !bg-[#b42318]" onclick="trashPurgeGo(TRASH.list.map(a => a.id))"><i data-lucide="trash" class="w-3.5 h-3.5"></i>ลบถาวรทั้งหมด</button></div>`);
}
async function trashPurgeGo(ids) {
  const b = $('#trPurgeGo'); if (b) b.disabled = true; let ok = 0;
  for (const id of ids) {
    try { await api('DELETE', 'posts/' + id, { permanent: true }); ok++; } catch (e) { if (e.status !== 404) { fail(e); break; } }
    const i = TRASH.list.findIndex(x => x.id === id); if (i >= 0) TRASH.list.splice(i, 1);
  }
  AUDIT_DIRTY = true; closeModal(); vArticles(); if (ok) toast(`ลบถาวรแล้ว ${ok} บทความ`);
}
/* a new article never takes the id of one in the trash */
{ const _na = newArticle; newArticle = function () {
  const hi = Math.max(0, WP.maxId || 0, ...(TRASH.list || []).map(a => a.id));
  if (hi <= Math.max(0, ...ART.map(a => a.id))) return _na();
  const ph = { id: hi, _ph: 1 }; ART.push(ph); try { _na(); } finally { const i = ART.indexOf(ph); if (i >= 0) ART.splice(i, 1); } }; }

/* =====================================================================
   ศูนย์ SEO — header (รายงาน / สแกนเว็บ), summary cards on "Meta ทุกหน้า", and แก้ไขอัตโนมัติ:
   Title / Description rewritten from the site's own data (boat name, type, guests, marina, price;
   article title, excerpt and text). Nothing is sent to an AI service. Every change is shown first and can be
   unticked; the pages then save themselves the usual way (boats / articles autosave, page meta via settings/seo).
   ===================================================================== */
const SEO_FIXABLE = ['t_miss', 't_long', 't_short', 'dup', 'd_miss', 'd_long', 'd_short', 'd_dup'];
/* duplicate descriptions count too (Google tends to rewrite them) */
{ const _pi = pageIssues; pageIssues = function (p, all) {
  const out = _pi(p, all);
  if (all) {
    const langs = p.type === 'article' ? LANGS.filter(([k]) => ['orig', 'ok', 'mt'].includes(p.art.tr[k])) : LANGS;
    langs.forEach(([k, C]) => { const d = (p.d[k] || '').trim(); if (d && all.some(o => o !== p && (o.d[k] || '').trim() === d)) out.push({ lv: 'warn', k: 'd_dup', msg: 'Description ซ้ำกับหน้าอื่น', lang: C }); });
  }
  return out;
}; }
ISSUE_L.d_dup = 'Description ซ้ำกับหน้าอื่น';
const SEO_TYPE_EN = { yacht: 'yacht', sail: 'sailing catamaran', power: 'power catamaran', speed: 'speedboat', longtail: 'longtail boat' };
const seoOk = (s, kind) => { const n = thLen(s), [min, max] = SEO_LEN[kind]; return n >= min && n <= max; };
const seoClean = s => String(s || '').replace(/\s+/g, ' ').trim();
/** longest prefix of `s` that ends at a space (or sentence end) and fits `max`; '' when no clean cut exists above `min` */
function seoCut(s, max, min, ell = '…') {
  s = seoClean(s); if (thLen(s) <= max) return s;
  let best = '';
  for (let i = 0; i < s.length; i++) if (s[i] === ' ' || /[.!?。]/.test(s[i])) { const c = s.slice(0, s[i] === ' ' ? i : i + 1).replace(/[,;:–—-]\s*$/, '').trim(); if (thLen(c) + ell.length <= max) best = c; else break; }
  return thLen(best) >= min ? best.replace(/[.!?]$/, '') + ell : '';
}
/** add parts in order while they fit `max`; the first part is required */
const seoBuild = (parts, max) => parts.filter(Boolean).reduce((s, p, i) => !i ? p : thLen(s + ' ' + p) <= max ? s + ' ' + p : s, '');
const seoMarina = b => String(b.marina || '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+Phuket$/i, '').trim();
const seoUsd = n => '$' + Math.round((n || 0) / 33.42).toLocaleString('en-US');
function seoTitleFor(p, k) {
  const site = SSET.site[k], sep = SSET.sep;
  if (p.type === 'boat') {
    const b = bySlug(p.id.slice(2)); if (!b) return '';
    const price = b.from_ ? (k === 'th' ? baht(b.from_) : seoUsd(b.from_)) : '';
    const tpl = seoClean(SSET.tpl.boat[k].replace('%name%', b.name).replace('%price%', price).replace(/%sep%/g, sep).replace('%site%', site).replace(/(เริ่ม|from)\s*(\||$)/i, '$2'));
    const c = k === 'th' ? [tpl, `${b.name} เช่าเรือยอชต์ภูเก็ต ${sep} ${site}`, `${b.name} เช่า${TYPE_TH[b.type] || 'เรือ'}ส่วนตัว ภูเก็ต`, `${b.name} เช่าเรือภูเก็ต`]
      : [tpl, `${b.name} Yacht Charter Phuket ${sep} ${site}`, `${b.name} Private Charter Phuket`, `${b.name} Phuket Charter`];
    return c.find(t => seoOk(t, 't')) || '';
  }
  if (p.type === 'article') {
    const base = seoClean(p.art.title[k]); if (!base) return '';
    // too long: keep the part before a natural break (":", "–", "|", "?"), never cut a sentence in the middle
    const head = (base.match(/^(.+?[?？])\s/) || base.match(/^(.+?)\s*[:：–—|]\s/) || [])[1]?.trim();
    const c = [`${base} ${sep} ${site}`, base, head && `${head} ${sep} ${site}`, head].filter(Boolean);
    return c.find(t => seoOk(t, 't')) || '';
  }
  if (p.type === 'page') { const t = `${p.name === 'บทความ' && k === 'en' ? 'Blog' : p.name} ${sep} ${site}`; return k === 'th' && seoOk(t, 't') ? t : ''; }
  return '';
}
function seoDescFor(p, k) {
  if (p.type === 'boat') {
    const b = bySlug(p.id.slice(2)); if (!b) return '';
    const m = seoMarina(b);
    if (k === 'th') return seoBuild([`เช่า${TYPE_TH[b.type] || 'เรือ'} ${b.name} ส่วนตัวในภูเก็ต`, b.pax && `รับได้สูงสุด ${b.pax} คน`, m && `ออกจาก ${m}`, b.from_ && `ราคาเริ่มต้น ${baht(b.from_)}`, 'พร้อมกัปตันและลูกเรือ', 'เลือกได้ทั้งครึ่งวัน เต็มวัน และทริปชมพระอาทิตย์ตก', 'จองง่าย ตอบไวทุกวัน'], 160);
    return seoBuild([`Charter the ${b.name}, a private ${SEO_TYPE_EN[b.type] || 'boat'} in Phuket${b.pax ? ` for up to ${b.pax} guests` : ''}.`, m && `Departs from ${m}.`, b.from_ && `From ${seoUsd(b.from_)} with captain and crew.`, 'Half-day, full-day and sunset trips.', 'Quick replies every day.'], 160);
  }
  if (p.type === 'article') {
    const a = p.art, paras = blocksOf(a, k).filter(x => x.t === 'p').map(x => txtOf(x.html)).filter(t => t && !/Machine translation|คำแปลจากเครื่อง/.test(t));
    let s = seoClean([a.excerpt?.[k], ...paras].filter(Boolean).join(' '));
    if (!s) return '';
    if (thLen(s) > 160) s = seoCut(s, 160, 110);
    if (s && thLen(s) < 120) s = seoBuild([s, k === 'th' ? 'อ่านเคล็ดลับเช่าเรือยอชต์ภูเก็ตจาก Boat Trip Thailand' : 'Phuket yacht charter tips from Boat Trip Thailand.'], 160);
    return s;
  }
  return '';
}
/** proposed changes for the pages (only fields with a fixable issue, only results that pass the checks themselves) */
function seoProposals(P, only) {
  const out = [], may = p => p.type === 'boat' ? can('boats') : p.type === 'article' ? can('content') : p.type === 'page' ? can('seo') : false;
  const taken = { t: { th: new Map(), en: new Map() }, d: { th: new Map(), en: new Map() } };
  P.forEach(p => LANGS.forEach(([k]) => { for (const f of ['t', 'd']) { const v = seoClean(p[f][k]); if (v) taken[f][k].set(v, (taken[f][k].get(v) || 0) + 1); } }));
  let manual = 0;
  for (const p of P) {
    if (only && p.id !== only) continue;
    for (const [k, C] of LANGS) {
      const iss = p.iss.filter(i => i.lang === C && SEO_FIXABLE.includes(i.k)); if (!iss.length) continue;
      if (!may(p) || p.type === 'home') { manual += iss.length; continue; }
      for (const f of ['t', 'd']) {
        if (!iss.some(i => i.k.startsWith(f + '_') || (f === 't' && i.k === 'dup'))) continue;
        const old = seoClean(p[f][k]), nv = seoClean(f === 't' ? seoTitleFor(p, k) : seoDescFor(p, k));
        if (!nv || nv === old || !seoOk(nv, f) || (taken[f][k].get(nv) || 0) > 0) { manual++; continue; }
        taken[f][k].set(nv, 1); if (old) taken[f][k].set(old, (taken[f][k].get(old) || 1) - 1);
        out.push({ p, k, C, f, old, nv, why: iss.filter(i => f === 't' ? i.k.startsWith('t_') || i.k === 'dup' : i.k.startsWith('d_')).map(i => ISSUE_L[i.k] || i.msg) });
      }
    }
  }
  return { list: out, manual };
}
let SEOFIX = null;
function seoAutoFix() {
  const P = auditAll(), r = seoProposals(P); SEOFIX = r.list.map(x => ({ ...x, on: true }));
  if (!SEOFIX.length) return toast(r.manual ? `ไม่มีรายการที่ระบบแก้ให้ได้ · อีก ${r.manual} รายการต้องแก้เอง` : 'Title / Description ทุกหน้าผ่านแล้ว');
  const L = n => `<span class="lang-b ${seoOk(n.v, n.f) ? 'ok' : n.v ? 'mid' : 'low'} tnum">${thLen(n.v) || '—'}</span>`;
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium flex items-center gap-2"><i data-lucide="wand-sparkles" class="w-4 h-4 text-maroon"></i>แก้ไขอัตโนมัติ · ${SEOFIX.length} รายการ</p>
      <p class="text-[12px] text-muted mt-1">เขียนใหม่จากข้อมูลในระบบ (ชื่อเรือ ประเภท จำนวนคน ท่าเรือ ราคา · ชื่อและเนื้อหาบทความ) ให้ยาวพอดีและไม่ซ้ำกัน · เอาเครื่องหมายออกได้ถ้าไม่ต้องการ${r.manual ? ` · อีก ${r.manual} รายการต้องแก้เอง (เช่น ชื่อบทความภาษาไทยที่ยาวเกิน ตัดเองจะเสียความหมาย)` : ''}</p>
      <label class="flex items-center gap-2 text-[12.5px] mt-3"><input type="checkbox" checked onchange="SEOFIX.forEach(x=>x.on=this.checked);$$('#seoFixList input').forEach(i=>i.checked=this.checked);seoFixN()"/>เลือกทั้งหมด</label></div>
    <div id="seoFixList" class="max-h-[58vh] overflow-y-auto divide-y divide-[rgb(35_20_22/.06)]">${SEOFIX.map((x, i) => `<label class="flex gap-3 px-5 py-3 cursor-pointer hover:bg-[#fbf8f7]"><input type="checkbox" checked class="mt-1 shrink-0" onchange="SEOFIX[${i}].on=this.checked;seoFixN()"/>
      <span class="min-w-0 flex-1"><span class="flex flex-wrap items-center gap-1.5 text-[12px]"><b class="font-medium truncate max-w-[300px]">${esc(x.p.name)}</b><span class="lang-b">${x.C}</span><span class="text-muted">${x.f === 't' ? 'Title' : 'Description'} · ${x.why.map(esc).join(', ')}</span></span>
        ${x.old ? `<span class="flex items-start gap-2 mt-1.5 text-[12px] text-muted"><span class="line-through flex-1 min-w-0 break-words">${esc(x.old)}</span>${L({ v: x.old, f: x.f })}</span>` : '<span class="block mt-1.5 text-[12px] text-muted">(ว่าง)</span>'}
        <span class="flex items-start gap-2 mt-1 text-[12.5px]"><span class="flex-1 min-w-0 break-words">${esc(x.nv)}</span>${L({ v: x.nv, f: x.f })}</span></span></label>`).join('')}</div>
    <div class="p-4 border-t border-line flex items-center justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button id="seoFixGo" class="btn btn-p" onclick="seoFixApply()"><i data-lucide="check" class="w-3.5 h-3.5"></i>แก้ไข <span>${SEOFIX.length}</span> รายการ</button></div>`);
  $('#modalBox').style.maxWidth = '760px'; icons();
}
function seoFixN() { const n = SEOFIX.filter(x => x.on).length, b = $('#seoFixGo'); if (b) { b.disabled = !n; b.querySelector('span').textContent = n; } }
function seoFixApply() {
  const pick = (SEOFIX || []).filter(x => x.on); if (!pick.length) return;
  pick.forEach(x => { x.p[x.f][x.k] = x.nv; });
  SEOFIX = null; closeModal();
  // save now: boats / articles push their own records, page meta goes with settings/seo
  try { boatTick(true); } catch (e) { } try { artTick(true); } catch (e) { } try { seoTick(); } catch (e) { }
  AUDIT_DIRTY = true; vSeo(); toast(`แก้ไขแล้ว ${pick.length} รายการ · หน้าเว็บอัปเดตภายในไม่กี่นาที`);
}
/* one page, inside the SEO drawer */
function seoAutoOne(id) {
  const P = auditAll(), r = seoProposals(P, id);
  if (!r.list.length) return toast(r.manual ? 'หน้านี้ต้องแก้เอง · ระบบเขียนให้ไม่ได้โดยไม่เสียความหมาย' : 'หน้านี้ผ่านแล้ว');
  r.list.forEach(x => { x.p[x.f][x.k] = x.nv; });
  try { boatTick(true); } catch (e) { } try { artTick(true); } catch (e) { } try { seoTick(); } catch (e) { }
  seoEdit(id); toast(`แก้ให้ ${r.list.length} ช่อง · ตรวจและแก้ต่อได้เลย`);
}
{ const _se = seoEdit; seoEdit = function (id) { _se(id); const x = $('#drawer .h-16 .flex.items-center.gap-2'); if (x && SE && SE.iss.some(i => SEO_FIXABLE.includes(i.k))) x.insertAdjacentHTML('afterbegin', `<button class="btn btn-o !h-8" onclick="seoAutoOne('${id}')"><i data-lucide="wand-sparkles" class="w-3.5 h-3.5"></i>แก้อัตโนมัติ</button>`); icons(); }; }
/* รายงาน: every page with its meta, lengths, score and issues (CSV, opens in Excel / Google Sheets) */
function seoReport() {
  const P = auditAll(), rows = [['หน้า', 'ประเภท', 'URL TH', 'URL EN', 'Title TH', 'ยาว', 'Title EN', 'ยาว', 'Description TH', 'ยาว', 'Description EN', 'ยาว', 'Index', 'คะแนน', 'ปัญหา']];
  P.sort((a, b) => a.score - b.score).forEach(p => rows.push([p.name, ST[p.type], p.url.th, p.url.en, p.t.th, thLen(p.t.th), p.t.en, thLen(p.t.en), p.d.th, thLen(p.d.th), p.d.en, thLen(p.d.en), sx(p.id).index ? 'index' : 'noindex', p.score, p.iss.map(i => (i.lang ? i.lang + ': ' : '') + i.msg).join(' · ')]));
  const csv = '﻿' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `seo-report-${iso(TODAY)}.csv`; a.click();
  toast(`ดาวน์โหลดรายงาน ${P.length} หน้าแล้ว`);
}
function seoScan() { const b = $('#seoScanBtn'); b?.classList.add('opacity-60'); setTimeout(() => { vSeo(); const P = auditAll(), e = P.filter(p => p.iss.some(i => i.lv === 'err')).length; toast(`สแกนแล้ว ${P.length} หน้า · ${e ? e + ' หน้ามีจุดต้องแก้' : 'ไม่มีจุดต้องแก้'}`); }, 250); }
function seoCards(P) {
  const ix = P.filter(p => sx(p.id).index).length, meta = P.filter(p => p.iss.some(i => SEO_FIXABLE.includes(i.k) && i.k !== 'd_miss')).length;
  const dupT = P.filter(p => p.iss.some(i => i.k === 'dup')).length, dupD = P.filter(p => p.iss.some(i => i.k === 'd_dup')).length, auto = P.filter(p => p.iss.some(i => i.k === 'd_miss')).length;
  const card = (l, v, s, ic, f, tone) => `<button class="card p-5 text-left grid gap-1 hover:ring-1 hover:ring-[rgb(112_0_14/.18)] transition" ${f !== null ? `onclick="SEOV.issue='${f}';SEOV.page=0;vSeo()"` : ''}><span class="flex items-start justify-between gap-2"><span class="text-[12.5px] text-muted">${l}</span><span class="w-9 h-9 -mt-1 -mr-1 rounded-full bg-white grid place-items-center shadow-[0_4px_14px_-8px_rgb(58_0_7/.45)] ${tone || ''}"><i data-lucide="${ic}" class="w-4 h-4"></i></span></span><span class="text-[26px] font-medium tnum leading-tight mt-2">${v}</span><span class="text-[12px] text-muted">${s}</span></button>`;
  return `<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">${card('หน้าที่ให้ Google เก็บ', ix, `จากทั้งหมด ${P.length} หน้า`, 'file-text', null)}${card('หน้าที่มีปัญหา', meta, 'ความยาวไม่พอดี หรือซ้ำกับหน้าอื่น', 'triangle-alert', 'warn', meta ? 'text-[#b4501a]' : '')}${card('Title / Description ซ้ำ', `${dupT} / ${dupD}`, 'Google อาจเขียนใหม่เอง', 'copy', dupT ? 'dup' : 'd_dup')}${card('Description อัตโนมัติ', auto, 'เขียนเองช่วยให้คนกดมากกว่า', 'pencil', 'd_miss')}</div>`;
}
{ const _vs = vSeo; vSeo = function () {
  _vs();
  const h = $('#view h2'); if (h) h.textContent = 'ศูนย์ SEO';
  const gsc = typeof GG !== 'undefined' && GG.st?.gsc?.on, sub = $('#view h2 + p'); if (sub) sub.textContent = gsc ? 'ข้อมูลจาก Google Search Console · เชื่อมต่อแล้ว' : 'ข้อมูลจาก Google Search Console · ยังไม่ได้นำเข้า (แท็บ คีย์เวิร์ด)';
  const act = h?.closest('.mb-5')?.querySelector('.flex.flex-wrap.gap-2');
  if (act) act.innerHTML = `<button class="btn btn-o" onclick="seoReport()"><i data-lucide="download" class="w-3.5 h-3.5"></i>รายงาน</button><button id="seoScanBtn" class="btn btn-p" onclick="seoScan()"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>สแกนเว็บ</button>`;
  $$('#view .tabbar .tab > i, #view .tabbar .tab > svg').forEach(x => x.remove());
  if (SEOV.tab === 'pages') {
    const P = auditAll(), r = seoProposals(P);
    $('#view .tabbar')?.insertAdjacentHTML('afterend', seoCards(P));
    const old = [...$$('#seoBody button')].find(b => b.textContent.includes('เติม Title ที่ว่างอัตโนมัติ'))?.parentElement;
    if (old) old.outerHTML = `<div class="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl bg-sand p-3 mb-3 text-[12.5px]"><i data-lucide="wand-sparkles" class="w-4 h-4 text-maroon shrink-0"></i>
      <span class="flex-1">${r.list.length ? `ระบบแก้ให้ได้ <b class="font-medium">${r.list.length} รายการ</b> · Title / Description ที่ว่าง ยาว สั้น หรือซ้ำ เขียนใหม่จากข้อมูลเรือและบทความ ดูก่อนแก้ทุกครั้ง` : 'ไม่มีรายการที่ระบบแก้ให้ได้'}${r.manual ? ` · ต้องแก้เอง ${r.manual} รายการ` : ''}</span>
      ${r.list.length ? `<button class="btn btn-p !h-8" onclick="seoAutoFix()"><i data-lucide="wand-sparkles" class="w-3.5 h-3.5"></i>แก้ไขอัตโนมัติ</button>` : ''}</div>`;
    const sel = $('#seoBody select'); if (sel && !sel.querySelector('option[value="d_dup"]')) { sel.insertAdjacentHTML('beforeend', `<option value="d_dup" ${SEOV.issue === 'd_dup' ? 'selected' : ''}>Description ซ้ำ</option>`); }
  }
  icons();
}; PAGES.find(p => p[0] === 'seo')[3] = vSeo; }

/* ---------- ระบบ & สำรองข้อมูล: server status, scheduled jobs, backup files, alerts (src/lib/system.ts) ---------- */
const SYS = { d: null, loading: false, busy: {}, err: '', alerts: null, t: 0 };
const sysSize = n => n == null ? '—' : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1073741824).toFixed(2)} GB`;
const sysDur = s => { const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d} วัน ${h} ชม.` : h ? `${h} ชม. ${m} นาที` : `${m} นาที`; };
const sysTs = s => new Date(s).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
const SYS_SRC = { auto: ['อัตโนมัติ', '#eef2ff', '#3b4bb5'], manual: ['สำรองเอง', '#eaf6ef', '#1e7a46'], 'pre-restore': ['ก่อนกู้คืน', '#fff6e5', '#9a5b00'], upload: ['อัปโหลด', '#f1f0f0', '#5d5557'] };
const sysOn = () => CUR === 'settings' && SITECFG.tab === 'system' && !!$('#sysHost');
const sysHead = acts => `<div class="flex flex-wrap items-end justify-between gap-2 mb-3"><div><p class="font-medium">สถานะเซิร์ฟเวอร์ & สำรองข้อมูล</p><p class="text-[11.5px] text-muted">สถานะเว็บ งานอัตโนมัติ และไฟล์สำรอง</p></div><div class="flex flex-wrap gap-2">${acts}</div></div>`;
const sysPill = (l, bg, fg) => `<span class="pill" style="background:${bg};color:${fg}">${l}</span>`;
function sysLoad(quiet) {
  if (SYS.loading) return; SYS.loading = true;
  api('GET', 'system').then(d => { SYS.d = d; SYS.err = ''; if (!SYS.alerts) SYS.alerts = { ...d.alerts.on }; })
    .catch(e => { SYS.err = e.message; if (!quiet) fail(e); })
    .finally(() => { SYS.loading = false; if (sysOn()) vSystem(); });
}
function sysSpark(v) {
  if (!v || v.length < 2) return '';
  const W = 120, H = 28, ok = v.filter(x => x >= 0), max = Math.max(1000, ...ok), step = W / (v.length - 1);
  const pts = v.map((x, i) => `${(i * step).toFixed(1)},${x < 0 ? H : (H - 2 - (x / max) * (H - 4)).toFixed(1)}`).join(' ');
  const y1 = (H - 2 - (1000 / max) * (H - 4)).toFixed(1);
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block;overflow:visible" aria-hidden="true"><line x1="0" x2="${W}" y1="${y1}" y2="${y1}" stroke="#a3222c" stroke-width="1" stroke-dasharray="2 3" opacity=".35"/><polyline points="${pts}" fill="none" stroke="#70000e" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>${v.map((x, i) => x < 0 ? `<circle cx="${(i * step).toFixed(1)}" cy="${H}" r="2" fill="#a3222c"/>` : '').join('')}</svg>`;
}
function vSystem() {
  const host = $('#sysHost'); if (!host) return;
  const d = SYS.d;
  const acts = `<button class="btn btn-o" onclick="sysLoad()" ${SYS.loading ? 'disabled' : ''}><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>โหลดใหม่</button><button class="btn btn-p" ${SYS.busy.backup || isRO() ? 'disabled' : ''} onclick="sysBackup()"><i data-lucide="database-backup" class="w-3.5 h-3.5"></i>${SYS.busy.backup ? 'กำลังสำรอง…' : 'สำรองตอนนี้'}</button>`;
  if (!d) { host.innerHTML = sysHead(acts) + `<div class="card p-10 text-center text-muted">${SYS.err ? esc(SYS.err) : 'กำลังโหลด…'}</div>`; icons(); if (!SYS.err) sysLoad(); return; }
  const w = d.web, last = w.last, ms = last?.ok ? last.ms : null;
  const tone = ms == null ? '#a3222c' : ms < 600 ? '#1e7a46' : ms < 1000 ? '#9a5b00' : '#a3222c';
  const lastB = d.backups[0], ago = lastB ? relTs(lastB.at) : 'ยังไม่มี';
  const yes = (on, l, sub) => `<li class="flex items-start gap-2"><i data-lucide="${on ? 'circle-check' : 'circle-alert'}" class="w-4 h-4 shrink-0 mt-0.5" style="color:${on ? '#1e7a46' : '#9a5b00'}"></i><span class="min-w-0"><span>${l}</span>${sub ? `<span class="block text-[11px] text-muted">${sub}</span>` : ''}</span></li>`;
  const kpi = (icon, l, big, sub, extra = '') => `<div class="card p-4 min-w-0"><p class="text-[11px] text-muted flex items-center gap-1.5"><i data-lucide="${icon}" class="w-3.5 h-3.5"></i>${l}</p><div class="flex items-end justify-between gap-2 mt-1"><p class="text-2xl tnum">${big}</p>${extra}</div><p class="text-[11.5px] text-muted mt-1">${sub}</p></div>`;
  const jobRow = j => { const L = j.last, st = j.running ? sysPill('กำลังรัน', '#eef2ff', '#3b4bb5') : !L ? sysPill('ยังไม่เคยรัน', '#f1f0f0', '#5d5557') : L.ok ? sysPill('สำเร็จ', '#eaf6ef', '#1e7a46') : sysPill('ล้มเหลว', '#fbecec', '#a3222c');
    return `<tr><td style="min-width:240px"><p>${esc(j.name)}</p>${L ? `<p class="text-[11px] ${L.ok ? 'text-muted' : ''}" style="word-break:break-all;${L.ok ? '' : 'color:#a3222c'}">${esc(L.msg)}</p>` : ''}</td><td class="whitespace-nowrap text-muted">${esc(j.every)}</td>
      <td class="whitespace-nowrap">${L ? `<p>${relTs(L.at)}</p><p class="text-[11px] text-muted">${sysTs(L.at)} · ${L.ms < 1000 ? L.ms + ' ms' : (L.ms / 1000).toFixed(1) + ' วิ'}${L.by ? ' · ' + esc(L.by) : ''}</p>` : '<span class="text-muted">—</span>'}</td><td>${st}</td>
      <td class="text-right"><button class="btn btn-o !h-8 !text-[12px]" ${SYS.busy['j:' + j.id] || j.running || isRO() ? 'disabled' : ''} onclick="sysRun('${j.id}')"><i data-lucide="play" class="w-3 h-3"></i>${SYS.busy['j:' + j.id] ? 'กำลังรัน…' : 'รันตอนนี้'}</button></td></tr>`; };
  const bRow = b => { const s = SYS_SRC[b.src] || SYS_SRC.upload;
    return `<li class="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 border-b border-line last:border-0 min-w-0"><i data-lucide="archive" class="w-4 h-4 text-muted shrink-0"></i>
      <div class="flex-1 min-w-[180px]"><p class="tnum">${sysTs(b.at)} <span class="text-muted text-[11px]">· ${relTs(b.at)}</span></p><p class="text-[11px] text-muted truncate">${sysSize(b.size)}${b.rows != null ? ` · ${b.rows.toLocaleString()} แถว` : ''}${b.by ? ` · ${esc(b.by)}` : ''}</p></div>
      ${sysPill(s[0], s[1], s[2])}
      <div class="flex gap-1.5 ml-auto">${d.can.download ? `<a class="btn btn-g !h-8 !px-2" title="ดาวน์โหลด" aria-label="ดาวน์โหลด" href="/api/admin/system/backup/${encodeURIComponent(b.file)}" download><i data-lucide="download" class="w-4 h-4"></i></a>` : ''}${d.can.restore ? `<button class="btn btn-o !h-8 !text-[12px]" ${SYS.busy.restore || isRO() ? 'disabled' : ''} onclick="sysRestore('${b.file}')"><i data-lucide="rotate-ccw" class="w-3 h-3"></i>กู้คืน</button>` : ''}</div></li>`; };
  const A = SYS.alerts || d.alerts.on, ch = d.channel;
  const AL = [['down', 'เว็บล่มเกิน 2 นาที', 'หน้าแรกเปิดไม่ได้ 2 ครั้งติดกัน (วัดทุกนาที) · แจ้งอีกครั้งเมื่อกลับมา'], ['ttfb', 'TTFB เกิน 1 วินาที ติดต่อกัน 15 นาที', 'หน้าแรกตอบช้าทุกครั้งตลอด 15 นาที'], ['cron', 'งานอัตโนมัติล้มเหลว', 'เช่น ตรวจสายบันทึกกิจกรรมไม่ผ่าน ล้างเซสชันไม่ได้'], ['backup', 'สำรองข้อมูลล้มเหลว', 'สำรองรายวันตอน 03:00 ไม่สำเร็จ']];
  const dirty = Object.keys(A).some(k => A[k] !== d.alerts.on[k]);
  host.innerHTML = `${sysHead(acts)}
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
      ${kpi('server', 'เซิร์ฟเวอร์ทำงานต่อเนื่อง', sysDur(d.uptime.sec), `เริ่ม ${sysTs(d.uptime.since)} · Node ${esc(d.uptime.node)} · RAM ${d.uptime.memMb} MB`)}
      ${kpi('gauge', 'เวลาโหลดหน้าแรก (TTFB)', `<span style="color:${tone}">${ms == null ? (last ? 'ล่ม' : '—') : ms.toLocaleString() + ' <span class="text-[13px]">ms</span>'}</span>`, last ? `เฉลี่ย 1 ชม. ${w.avgHour ?? '—'} ms · ออนไลน์ ${w.upDay ?? '—'}% ใน 24 ชม. · วัดจากเซิร์ฟเวอร์` : 'รอการวัดครั้งแรก (ทุก 1 นาที)', sysSpark(w.spark))}
      ${kpi('database', 'ฐานข้อมูล', sysSize(d.db.bytes), `สำรองล่าสุด ${ago} · ${esc(d.db.version)} · รูปภาพ ${sysSize(d.media.bytes)} (${d.media.files.toLocaleString()} ไฟล์)`)}
      <div class="card p-4 min-w-0"><p class="text-[11px] text-muted flex items-center gap-1.5"><i data-lucide="plug" class="w-3.5 h-3.5"></i>การเชื่อมต่อ</p><ul class="grid gap-1.5 mt-2 text-[12.5px]">
        ${yes(ch.line, 'LINE OA', ch.line ? '' : 'ตั้งค่า › LINE & แจ้งเตือน')}${yes(ch.group, 'กลุ่ม LINE ทีมขาย (รับแจ้งเตือน)', ch.group ? '' : 'เชิญบอท LINE OA เข้ากลุ่มทีมขาย')}${yes(d.cron.secret, 'Cron ภายนอก', d.cron.secret ? 'ตั้ง CRON_SECRET แล้ว' : 'ไม่บังคับ · ระบบรันงานเองทุกนาที')}</ul></div>
    </div>
    <div class="card mb-4 min-w-0"><div class="p-4 pb-3 flex flex-wrap items-center justify-between gap-2"><div><p class="font-medium">งานอัตโนมัติ (Cron)</p><p class="text-[11.5px] text-muted">เวลาไทย · ถ้าเซิร์ฟเวอร์ปิดอยู่ตอนถึงเวลา งานรายวันจะรันทันทีเมื่อเปิดกลับมา</p></div>${d.cron.jobsOff ? sysPill('ปิดงานอัตโนมัติอยู่ (DISABLE_JOBS)', '#fbecec', '#a3222c') : ''}</div>
      <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>งาน</th><th>รอบ</th><th>รันล่าสุด</th><th>สถานะ</th><th></th></tr></thead><tbody>${d.jobs.map(jobRow).join('')}</tbody></table></div>
      <p class="text-[11px] text-muted px-4 py-3 border-t border-line">เรียกจากภายนอกได้ด้วย <span class="font-mono">/api/cron?key=CRON_SECRET</span> (รันงานที่ถึงเวลา) หรือ <span class="font-mono">&amp;job=backup</span> (รันงานเดียว) · ตั้ง CRON_SECRET (ยาว 16 ตัวขึ้นไป) ใน .env ก่อน${d.cron.secret ? ' · <span style="color:#1e7a46">ตั้งแล้ว</span>' : ' · <span>ยังไม่ได้ตั้ง (ปิดอยู่)</span>'}</p></div>
    <div class="gap-4 items-start" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))">
      <div class="card p-4 min-w-0"><div class="flex flex-wrap items-center justify-between gap-2"><div><p class="font-medium">ไฟล์สำรอง</p><p class="text-[11.5px] text-muted">${d.backups.length} ไฟล์ · รวม ${sysSize(d.backupBytes)} · เก็บ ${d.keepDays} วัน</p></div>
        <div class="flex flex-wrap gap-2">${d.can.download ? `<a class="btn btn-o !h-9" href="/api/admin/system/export" download><i data-lucide="hard-drive-download" class="w-3.5 h-3.5"></i>ดาวน์โหลดข้อมูลทั้งหมด</a>` : ''}${d.can.restore && !isRO() ? `<label class="btn btn-o !h-9 cursor-pointer"><i data-lucide="upload" class="w-3.5 h-3.5"></i>${SYS.busy.upload ? 'กำลังอัปโหลด…' : 'กู้คืนจากไฟล์'}<input type="file" accept=".gz,.json,application/gzip,application/json" class="hidden" onchange="sysUpload(this.files)"/></label>` : ''}</div></div>
        <ul class="mt-2" style="max-height:440px;overflow-y:auto">${d.backups.map(bRow).join('') || '<li class="py-8 text-center text-muted">ยังไม่มีไฟล์สำรอง · กด “สำรองตอนนี้”</li>'}</ul>
        <div class="rounded-xl bg-sand p-3 mt-3 text-[11.5px] text-muted grid gap-1">
          <p>• เก็บไฟล์ ${d.keepDays} วัน (อย่างน้อย 3 ไฟล์ล่าสุดเสมอ) · ไฟล์อยู่บนเซิร์ฟเวอร์เครื่องเดียวกับเว็บ ควรดาวน์โหลดเก็บไว้นอกเซิร์ฟเวอร์เป็นประจำ</p>
          <p>• สำรองเฉพาะข้อมูล (เรือ ราคา บทความ ลีด ลูกค้า ตั้งค่า สถิติ) <b class="font-medium">ไม่รวมไฟล์รูป</b> ในคลังสื่อ — รูปอยู่ในโฟลเดอร์ uploads ต้องสำรองแยก</p>
          <p>• ไม่รวมบัญชีผู้ใช้ รหัสผ่าน และบันทึกกิจกรรม · กู้คืนแล้วทีมยังเข้าระบบได้ตามเดิม และระบบสำรองข้อมูลปัจจุบันไว้ให้ก่อนทุกครั้ง</p>
          ${!d.can.restore ? '<p>• กู้คืนได้เฉพาะ Super Admin</p>' : ''}</div></div>
      <div class="card p-4 min-w-0"><p class="font-medium flex items-center gap-1.5"><i data-lucide="bell-ring" class="w-4 h-4"></i>แจ้งเตือนเมื่อมีปัญหา</p>
        <div class="grid gap-3 mt-3">${AL.map(([k, l, sub]) => `<label class="flex items-start justify-between gap-3"><span class="min-w-0"><span class="block">${l}</span><span class="block text-[11px] text-muted">${sub}</span></span><span class="tgl shrink-0"><input type="checkbox" ${A[k] ? 'checked' : ''} ${isRO() ? 'disabled' : ''} onchange="SYS.alerts.${k}=this.checked;vSystem()"/><span></span></span></label>`).join('')}</div>
        <div class="rounded-xl ${ch.group ? 'bg-sand' : ''} p-3 mt-4 text-[12px]" style="${ch.group ? '' : 'background:#fff6e5;color:#9a5b00'}">${ch.group ? '<i data-lucide="circle-check" class="w-3.5 h-3.5 inline -mt-0.5" style="color:#1e7a46"></i> ส่งเข้ากลุ่ม LINE ทีมขาย' : 'ยังส่งไม่ได้ · ' + (ch.line ? 'เชิญบอท LINE OA เข้ากลุ่มทีมขายก่อน' : 'ต้องเชื่อม LINE ก่อน ที่แท็บ LINE & แจ้งเตือน')}</div>
        <div class="flex flex-wrap justify-end gap-2 mt-3"><button class="btn btn-o !h-9" ${!ch.group || SYS.busy.test ? 'disabled' : ''} onclick="sysTest()"><i data-lucide="send" class="w-3.5 h-3.5"></i>ส่งทดสอบ</button><button class="btn btn-p !h-9" ${!dirty || SYS.busy.alerts || isRO() ? 'disabled' : ''} onclick="sysAlerts()"><i data-lucide="check" class="w-3.5 h-3.5"></i>บันทึก</button></div>
        <p class="text-[11px] text-muted mt-3">อีเมล / SMS ต้องใช้บริการส่งภายนอก (เช่น SMTP, SMS gateway) ซึ่งยังไม่ได้ตั้ง จึงแจ้งผ่าน LINE แทน · ถ้าเซิร์ฟเวอร์ดับทั้งเครื่อง ระบบในเครื่องแจ้งเองไม่ได้ แนะนำใช้บริการวัดเว็บภายนอกแบบฟรี (เช่น UptimeRobot) เรียก <span class="font-mono">/api/health</span> ร่วมด้วย</p>
        ${d.alerts.at ? `<p class="text-[11px] text-muted mt-1">แก้ล่าสุด ${sysTs(d.alerts.at)} โดย ${esc(d.alerts.by || '')}</p>` : ''}</div>
    </div>`;
  icons();
  clearTimeout(SYS.t); SYS.t = setTimeout(() => { if (sysOn() && !document.hidden) sysLoad(true); }, 60_000);
}
function sysBusy(k, p) { SYS.busy[k] = true; vSystem(); return p.finally(() => { SYS.busy[k] = false; if (sysOn()) vSystem(); }); }
function sysBackup() { sysBusy('backup', api('POST', 'system/backup').then(r => { SYS.d = { ...r.status, can: SYS.d.can }; AUDIT_DIRTY = true; toast('สำรองข้อมูลแล้ว · ' + r.file); }).catch(fail)); }
function sysRun(id) { sysBusy('j:' + id, api('POST', 'system/run', { job: id }).then(r => { SYS.d = { ...r.status, can: SYS.d.can }; AUDIT_DIRTY = true; r.result.ok ? toast('สำเร็จ · ' + r.result.msg) : toastErr('ล้มเหลว · ' + r.result.msg); }).catch(fail)); }
function sysAlerts() { sysBusy('alerts', api('PUT', 'system/alerts', { on: SYS.alerts }).then(r => { SYS.d = { ...r.status, can: SYS.d.can }; SYS.alerts = { ...r.status.alerts.on }; AUDIT_DIRTY = true; toast('บันทึกการแจ้งเตือนแล้ว'); }).catch(fail)); }
function sysTest() { sysBusy('test', api('POST', 'system/alerts/test').then(() => toast('ส่งข้อความทดสอบเข้ากลุ่ม LINE แล้ว')).catch(fail)); }
function sysRestore(file, note) {
  const b = SYS.d.backups.find(x => x.file === file);
  const v = prompt(`${note ? note + '\n\n' : ''}กู้คืนข้อมูลจากไฟล์ ${b ? sysTs(b.at) : file}?\n\nข้อมูลเรือ ราคา บทความ ลีด ลูกค้า และตั้งค่า จะถูกแทนที่ด้วยข้อมูลในไฟล์นี้ (ระบบสำรองข้อมูลปัจจุบันไว้ให้ก่อน)\nบัญชีผู้ใช้และบันทึกกิจกรรมไม่เปลี่ยน\n\nพิมพ์คำว่า กู้คืน เพื่อยืนยัน`);
  if (v == null) return;
  if (v.trim() !== 'กู้คืน') return toastErr('ยกเลิก · ต้องพิมพ์คำว่า กู้คืน');
  toast('กำลังกู้คืน…');
  sysBusy('restore', api('POST', 'system/restore', { file, confirm: 'กู้คืน' }).then(r => { toast(`กู้คืนแล้ว ${r.rows.toLocaleString()} แถว · กำลังโหลดหลังบ้านใหม่`); setTimeout(() => location.reload(), 1200); }).catch(fail));
}
function sysUpload(files) {
  const f = files?.[0]; if (!f) return;
  if (f.size > 300 * 1048576) return toastErr('ไฟล์ใหญ่เกิน 300 MB');
  sysBusy('upload', fetch('/api/admin/system/upload', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/octet-stream' }, body: f })
    .then(async r => { const j = await r.json().catch(() => ({})); if (r.status === 401) { location.href = '/admin/login'; throw new Error('login'); } if (!r.ok) throw new Error(j.error || 'อัปโหลดไม่สำเร็จ'); return j; })
    .then(r => { SYS.d = { ...r.status, can: SYS.d.can }; AUDIT_DIRTY = true; vSystem(); setTimeout(() => sysRestore(r.file, `อัปโหลดแล้ว: ${r.rows.toLocaleString()} แถว · สำรองเมื่อ ${sysTs(r.from)}`), 50); }).catch(fail));
}
/* lives in ตั้งค่า → ระบบ & สำรองข้อมูล; #/system still opens it */
PAGES.push(['system', 'ระบบ & สำรองข้อมูล', 'server', () => { SITECFG.tab = 'system'; history.replaceState(null, '', '#/settings'); route(); }]);
{ const t = CFG_TABS.find(x => x[0] === 'system'); if (t) t[1] = 'ระบบ & สำรองข้อมูล'; }
{ const _vs = vSettings; vSettings = function () {
  _vs(); if (SITECFG.tab !== 'system') return;
  const f = $('#view .fade'); if (!f) return;
  [...f.querySelectorAll('.card')].filter(c => /ข้อมูลระบบ/.test(c.querySelector('p')?.textContent || '')).forEach(c => c.remove());   // placeholder card → the real status below
  f.insertAdjacentHTML('beforeend', '<div id="sysHost" class="mt-5"></div>'); vSystem();
}; PAGES.find(p => p[0] === 'settings')[3] = vSettings; }
/* ---------- merged menus: ฤดูกาลราคา → tab of เรือ & ราคา · ระบบ & สำรองข้อมูล → tab of ตั้งค่า ---------- */
const NAV_MERGED = { seasons: 'boats', system: 'settings' };
const boatTabs = cur => `<div class="tabbar flex gap-1 overflow-x-auto no-sb mb-4">${[['boats', 'เรือทั้งหมด', 'sailboat'], ['seasons', 'ฤดูกาลราคา', 'calendar-range']].filter(([k]) => canPage(k)).map(([k, l, ic]) => `<button class="tab inline-flex items-center gap-1.5 ${cur === k ? 'on' : ''}" onclick="go('${k}')"><i data-lucide="${ic}" class="w-3.5 h-3.5"></i>${l}</button>`).join('')}</div>`;
const addBoatTabs = k => { const h = $('#view > div'); if (h && !$('#view > .tabbar')) { h.insertAdjacentHTML('afterend', boatTabs(k)); icons(); } };
{ const _b = vBoats; vBoats = function () { _b(); addBoatTabs('boats'); }; PAGES.find(p => p[0] === 'boats')[3] = vBoats; }
{ const _s = vSeasons; vSeasons = function () { _s(); addBoatTabs('seasons'); }; PAGES.find(p => p[0] === 'seasons')[3] = vSeasons; }
{ const _r = route; route = function () {
  _r();
  for (const [k, parent] of Object.entries(NAV_MERGED)) { $$(`#nav a[href="#/${k}"]`).forEach(a => a.remove()); if (CUR === k) $(`#nav a[href="#/${parent}"]`)?.classList.add('on'); }
  if (CUR === 'seasons') $('#pageTitle').textContent = 'เรือ & ราคา';
}; }
PAGE_PERM.system = 'settings';

/* ---------- ตั้งค่า → LINE & แจ้งเตือน: LINE Messaging API keys (encrypted on the server; .env still wins), webhook, sales group, quota ---------- */
const LN = { st: null, loading: false, test: null, busy: {}, err: '' };
const lnOn = () => CUR === 'settings' && SITECFG.tab === 'notify' && !!$('#lnHost');
function lnLoad(refresh) {
  if (LN.loading) return; LN.loading = true;
  api('GET', 'line' + (refresh ? '?refresh=1' : '')).then(r => { LN.st = r.status; LN.err = ''; }).catch(e => { LN.err = e.message; fail(e); })
    .finally(() => { LN.loading = false; if (lnOn()) lnRender(); });
}
function lnBusy(k, p) { LN.busy[k] = true; lnRender(); return p.finally(() => { LN.busy[k] = false; if (lnOn()) lnRender(); }); }
const lnPill = (ok, yes, no) => `<span class="pill" style="background:${ok ? '#eaf6ef' : '#fff6e5'};color:${ok ? '#1e7a46' : '#9a5b00'}">${ok ? yes : no}</span>`;
function lnRender() {
  const host = $('#lnHost'); if (!host) return;
  const S = LN.st;
  if (!S) { host.innerHTML = `<div class="card p-10 text-center text-muted">${LN.err ? esc(LN.err) : 'กำลังโหลด…'}</div>`; if (!LN.err) lnLoad(); return; }
  const ro = isRO(), envS = S.secret.src === 'env', envT = S.token.src === 'env', bot = S.bot && !S.bot.error ? S.bot : null;
  const connected = !!bot && !!S.secret.src;
  const T = LN.test, step = x => `<li class="flex items-start gap-2 text-[12.5px]"><i data-lucide="${x.ok ? 'circle-check' : 'circle-x'}" class="w-4 h-4 shrink-0 mt-0.5" style="color:${x.ok ? '#1e7a46' : '#a3222c'}"></i><span><b class="font-medium">${esc(x.step)}</b> · <span class="${x.ok ? 'text-muted' : ''}" style="${x.ok ? '' : 'color:#a3222c'}">${esc(x.msg)}</span></span></li>`;
  const ph = (f, env, envName) => env ? `ตั้งใน .env บนเซิร์ฟเวอร์ (${envName}) · ใช้ค่านั้นก่อน` : f.src ? `บันทึกแล้ว ••••${esc(f.tail)} · วางค่าใหม่เพื่อเปลี่ยน` : '';
  const ep = S.endpoint, q = S.quota, pct = q && q.limit ? Math.min(100, Math.round((q.used || 0) / q.limit * 100)) : null;
  const ic = (n, c = '#70000e') => `<span class="w-9 h-9 rounded-xl grid place-items-center shrink-0" style="background:rgb(112 0 14 / .08);color:${c}"><i data-lucide="${n}" class="w-4 h-4"></i></span>`;
  const sec = (icon, title, sub, inner, right = '') => `<div class="card p-5 min-w-0"><div class="flex items-start gap-3 mb-4">${ic(icon)}<div class="flex-1 min-w-0"><p class="font-medium">${title}</p>${sub ? `<p class="text-[11.5px] text-muted">${sub}</p>` : ''}</div>${right}</div>${inner}</div>`;
  const left = `<div class="grid gap-4 min-w-0">
    <div class="card p-5 min-w-0"><div class="flex items-center gap-3">
      ${bot?.pic ? `<img src="${esc(bot.pic)}" alt="" class="w-12 h-12 rounded-full object-cover shrink-0" style="box-shadow:0 0 0 2px #fff, 0 6px 14px -8px rgb(58 0 7 / .5)"/>` : `<span class="w-12 h-12 rounded-full grid place-items-center shrink-0" style="background:#06c755;color:#fff">${socIco('line', 'w-6 h-6')}</span>`}
      <div class="flex-1 min-w-0"><p class="font-medium truncate">${bot ? esc(bot.name || '') : 'LINE Messaging API'}</p><p class="text-[11.5px] text-muted truncate">${bot ? esc(bot.basicId || '') + ' · บอท LINE OA ของร้าน' : S.bot?.error ? esc(S.bot.error) : 'ยังไม่ได้เชื่อม · ใส่ Channel secret และ Channel access token ด้านล่าง'}</p></div>
      ${lnPill(connected, 'เชื่อมแล้ว', 'ยังไม่เชื่อม')}<button class="btn btn-g !h-8 !px-2" title="ตรวจสถานะใหม่" onclick="lnLoad(true)" ${LN.loading ? 'disabled' : ''}><i data-lucide="rotate-ccw" class="w-4 h-4"></i></button></div></div>
    ${sec('key-round', 'กุญแจ Channel', 'จาก LINE Developers Console · เก็บแบบเข้ารหัสบนเซิร์ฟเวอร์ ไม่ส่งกลับมาที่เบราว์เซอร์อีก', `<div class="grid gap-4">
      <label class="grid gap-1.5"><span class="lbl !mb-0">Channel secret <span class="text-muted font-normal">(แท็บ Basic settings)</span></span><input id="lnSecret" type="password" autocomplete="off" spellcheck="false" class="inp font-mono" ${envS || ro ? 'disabled' : ''} placeholder="${ph(S.secret, envS, 'LINE_CHANNEL_SECRET') || 'ตัวอักษร 32 ตัว'}"/></label>
      <label class="grid gap-1.5"><span class="lbl !mb-0">Channel access token (long-lived) <span class="text-muted font-normal">(แท็บ Messaging API › Issue)</span></span><textarea id="lnToken" rows="3" autocomplete="off" spellcheck="false" class="inp font-mono !text-[12px]" style="-webkit-text-security:disc" ${envT || ro ? 'disabled' : ''} placeholder="${ph(S.token, envT, 'LINE_CHANNEL_ACCESS_TOKEN') || 'วาง token ทั้งหมด'}"></textarea></label>
      ${T ? `<ul class="grid gap-1.5 rounded-xl bg-sand p-3">${T.map(step).join('')}</ul>` : ''}
      <div class="flex flex-wrap items-center gap-2">${(S.secret.src === 'saved' || S.token.src === 'saved') && !ro ? `<button class="btn btn-g !h-9 text-muted" onclick="lnRemove()"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i>ลบที่บันทึกไว้</button>` : ''}
        <span class="ml-auto"></span><button class="btn btn-o !h-9" ${LN.busy.test ? 'disabled' : ''} onclick="lnTest()"><i data-lucide="zap" class="w-3.5 h-3.5"></i>${LN.busy.test ? 'กำลังทดสอบ…' : 'ทดสอบการเชื่อมต่อ'}</button>${envS && envT ? '' : `<button class="btn btn-p !h-9" ${LN.busy.save || ro ? 'disabled' : ''} onclick="lnSave()"><i data-lucide="check" class="w-3.5 h-3.5"></i>${LN.busy.save ? 'กำลังบันทึก…' : 'บันทึก'}</button>`}</div></div>`)}
    ${sec('webhook', 'Webhook', 'ให้ LINE ส่งข้อความ ปุ่ม “รับเรื่อง” และการเชิญเข้ากลุ่มมาที่เว็บ', `<div class="flex items-center gap-2 rounded-xl bg-sand px-3 h-10 min-w-0"><span class="font-mono text-[12px] truncate flex-1">${esc(S.webhook)}</span><button class="text-muted hover:text-maroon shrink-0" title="คัดลอก" onclick="navigator.clipboard?.writeText(${esc(JSON.stringify(S.webhook))}).then(()=>toast('คัดลอก Webhook URL แล้ว'))"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button></div>
      <div class="flex flex-wrap items-center gap-2 mt-3 text-[12px]">${!S.https ? `<span style="color:#9a5b00">APP_URL ยังไม่ใช่ https โดเมนจริง · LINE ส่งเข้า localhost ไม่ได้ ตั้งเมื่อขึ้นเซิร์ฟเวอร์จริง</span>` : ep ? `${lnPill(ep.match, 'URL ตรงกับ LINE', ep.url ? 'URL ใน LINE ไม่ตรง' : 'ยังไม่ได้ตั้งใน LINE')} ${lnPill(ep.active, 'เปิด Use webhook แล้ว', 'ยังไม่เปิด Use webhook')}` : '<span class="text-muted">เชื่อม Token ก่อนจึงตรวจได้</span>'}
        <span class="ml-auto"></span>${bot && S.https && !(ep?.match) && !ro ? `<button class="btn btn-o !h-8 !text-[12px]" ${LN.busy.wh ? 'disabled' : ''} onclick="lnWebhook()"><i data-lucide="link" class="w-3.5 h-3.5"></i>ตั้ง Webhook ให้อัตโนมัติ</button>` : ''}</div>
      ${ep && ep.match && !ep.active ? '<p class="text-[11.5px] text-muted mt-2">เปิดสวิตช์ “Use webhook” เองใน LINE Developers › Messaging API (LINE ไม่ให้เปิดผ่านระบบ)</p>' : ''}`)}
  </div>`;
  const right = `<div class="grid gap-4 min-w-0">
    ${sec('users', 'กลุ่ม LINE ทีมขาย', 'รับลีดใหม่ ลีดที่ยังไม่มีคนตอบ และแจ้งเตือนระบบ', `${S.group.id ? `<div class="flex items-center gap-3 rounded-xl bg-sand px-3 py-2.5"><i data-lucide="circle-check" class="w-4 h-4 shrink-0" style="color:#1e7a46"></i><div class="min-w-0 flex-1"><p class="truncate">${esc(S.group.name || 'กลุ่มทีมขาย')}</p><p class="text-[11px] text-muted font-mono">${esc(S.group.id)}${S.group.src === 'env' ? ' · ตั้งใน .env' : ''}</p></div></div>`
      : `<ol class="grid gap-1.5 text-[12.5px] list-decimal pl-5"><li>LINE OA Manager › ตั้งค่า › ตอบกลับ → เปิด “อนุญาตให้บอทเข้าร่วมกลุ่ม”</li><li>เชิญบอทเข้ากลุ่ม LINE ของทีมขาย</li><li>บอทตอบในกลุ่มว่า “เชื่อมแล้ว” และระบบจะจำกลุ่มให้เอง</li></ol>`}
      <div class="flex justify-end mt-3"><button class="btn btn-o !h-9" ${!S.group.id || !bot || LN.busy.push ? 'disabled' : ''} onclick="lnPush()"><i data-lucide="send" class="w-3.5 h-3.5"></i>${LN.busy.push ? 'กำลังส่ง…' : 'ส่งข้อความทดสอบเข้ากลุ่ม'}</button></div>`)}
    ${sec('gauge', 'โควตาข้อความเดือนนี้', 'นับเฉพาะข้อความที่ระบบส่งเอง (push) · การตอบกลับในแชตไม่นับ', q ? `<div class="flex items-end justify-between"><p class="text-2xl tnum">${(q.used ?? 0).toLocaleString()}<span class="text-[13px] text-muted"> / ${q.limit == null ? 'ไม่จำกัด' : q.limit.toLocaleString()}</span></p>${pct != null ? `<span class="text-[12px] ${pct >= 80 ? '' : 'text-muted'}" style="${pct >= 80 ? 'color:#a3222c' : ''}">${pct}%</span>` : ''}</div>
      ${pct != null ? `<div class="h-2 rounded-full mt-2 overflow-hidden" style="background:rgb(35 20 22 / .08)"><div class="h-full rounded-full" style="width:${pct}%;background:${pct >= 80 ? '#a3222c' : '#70000e'}"></div></div>` : ''}
      <p class="text-[11px] text-muted mt-3">แพ็กเกจฟรี: เมื่อครบโควตา LINE จะหยุดส่งจนถึงเดือนถัดไป ไม่ตัดเงินเอง · มีค่าใช้จ่ายเฉพาะเมื่ออัปเกรดแพ็กเกจเองใน LINE OA Manager</p>` : '<p class="text-[12px] text-muted">เชื่อม Token ก่อนจึงดูโควตาได้</p>')}
    <div class="card p-5 min-w-0"><p class="font-medium">วิธีเชื่อม (ฟรี)</p><ol class="grid gap-2 mt-3 text-[12.5px] list-decimal pl-5">
      <li>เปิด <a class="text-maroon" href="https://developers.line.biz/console/" target="_blank" rel="noopener">developers.line.biz/console</a> → เลือก Provider → channel แบบ Messaging API ของ LINE OA ร้าน</li>
      <li>แท็บ Basic settings → คัดลอก <b class="font-medium">Channel secret</b></li><li>แท็บ Messaging API → Channel access token (long-lived) → Issue → คัดลอก</li>
      <li>วางทั้งสองช่อง → บันทึก → ทดสอบการเชื่อมต่อ</li><li>กด “ตั้ง Webhook ให้อัตโนมัติ” แล้วเปิด <b class="font-medium">Use webhook</b> ใน LINE Developers</li><li>เชิญบอทเข้ากลุ่มทีมขาย → ส่งข้อความทดสอบ</li></ol>
      <p class="text-[11px] text-muted mt-4">ตั้งผ่าน .env ได้ด้วย LINE_CHANNEL_SECRET · LINE_CHANNEL_ACCESS_TOKEN · LINE_GROUP_ID — ค่าใน .env ใช้ก่อนค่าที่บันทึกในหน้านี้${S.savedAt ? ` · บันทึกล่าสุด ${new Date(S.savedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })} โดย ${esc(S.savedBy || '')}` : ''}</p></div>
  </div>`;
  host.innerHTML = `<div class="gap-4 items-start" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))">${left}${right}</div>`;
  icons();
}
function lnSave() {
  const s = $('#lnSecret'), t = $('#lnToken'), body = {};
  if (s && !s.disabled && s.value.trim()) body.secret = s.value.trim();
  if (t && !t.disabled && t.value.trim()) body.token = t.value.trim();
  if (!Object.keys(body).length) return toastErr('วาง Channel secret หรือ Channel access token ก่อน');
  lnBusy('save', api('PUT', 'line/config', body).then(r => { LN.st = r.status; AUDIT_DIRTY = true; toast('บันทึกแล้ว · กำลังทดสอบ…'); setTimeout(lnTest, 50); }).catch(fail));
}
function lnRemove() {
  if (!confirm('ลบกุญแจ LINE ที่บันทึกไว้? (ลีดใหม่และการแจ้งเตือนจะไม่ส่งเข้า LINE จนกว่าจะใส่ใหม่)')) return;
  lnBusy('save', api('PUT', 'line/config', { secret: null, token: null }).then(r => { LN.st = r.status; LN.test = null; AUDIT_DIRTY = true; toast('ลบกุญแจ LINE แล้ว'); }).catch(fail));
}
function lnTest() { LN.test = null; lnBusy('test', api('POST', 'line/test').then(r => { LN.test = r.steps; LN.st = r.status; toast(r.steps.every(x => x.ok) ? 'เชื่อม LINE ครบแล้ว' : 'ยังเชื่อมไม่ครบ · ดูรายละเอียด'); }).catch(fail)); }
function lnWebhook() { lnBusy('wh', api('POST', 'line/webhook').then(r => { LN.st = r.status; AUDIT_DIRTY = true; toast('ตั้ง Webhook ใน LINE แล้ว · อย่าลืมเปิด Use webhook'); }).catch(fail)); }
function lnPush() { lnBusy('push', api('POST', 'line/push').then(() => toast('ส่งข้อความทดสอบเข้ากลุ่มแล้ว')).catch(fail)); }
{ const t = CFG_TABS.find(x => x[0] === 'notify'); if (t) t[1] = 'LINE & แจ้งเตือน'; }
{ const _vs = vSettings; vSettings = function () {
  _vs(); if (SITECFG.tab !== 'notify') return;
  const f = $('#view .fade'); if (!f) return;
  f.innerHTML = '<div id="lnHost"></div>'; lnRender();
  $('#view button[onclick="cfgSave()"]')?.classList.add('hidden');   // this tab saves through its own buttons
}; PAGES.find(p => p[0] === 'settings')[3] = vSettings; }

/* ---------- Liquid Glass v2 · page details (styles in glass2.css) ---------- */
/* page name on <body> so glass2.css can style one page without new markup */
{ const _r = route; route = function () { _r(); document.body.dataset.page = CUR; }; }

/* tabs: a white thumb slides from the last tab to the new one (works across re-renders) */
const TABPOS = new Map();
function tabThumbs() {
  const bars = new Set([...document.querySelectorAll('#view .tab, #drawer .tab, #modalBox .tab')].map(t => t.parentElement));
  let i = 0;
  for (const bar of bars) {
    const on = [...bar.children].find(x => x.classList?.contains('tab') && x.classList.contains('on'));
    const key = (document.body.dataset.page || '') + ':' + (i++) + ':' + bar.children.length;
    let th = [...bar.children].find(x => x.classList?.contains('tthumb'));
    if (!on) { th?.remove(); continue; }
    bar.classList.add('ttrack');
    const pos = { l: on.offsetLeft, t: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight };
    if (!pos.w) continue;
    if (!th) {
      th = document.createElement('span'); th.className = 'tthumb'; th.setAttribute('aria-hidden', 'true'); bar.prepend(th);
      const prev = TABPOS.get(key);
      if (prev) { th.style.transition = 'none'; Object.assign(th.style, { left: prev.l + 'px', top: prev.t + 'px', width: prev.w + 'px', height: prev.h + 'px' }); void th.offsetWidth; th.style.transition = ''; }
    }
    Object.assign(th.style, { left: pos.l + 'px', top: pos.t + 'px', width: pos.w + 'px', height: pos.h + 'px' });
    TABPOS.set(key, pos);
  }
}
{ let q = 0; const run = () => { q = 0; try { tabThumbs(); } catch (e) { } };
  const mo = new MutationObserver(() => { if (!q) q = requestAnimationFrame(run); });
  ['#view', '#drawer', '#modalBox'].forEach(s => { const el = document.querySelector(s); if (el) mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); });
  window.addEventListener('resize', () => { if (!q) q = requestAnimationFrame(run); }); }

/* ---------- แดชบอร์ด: sparkline in "ลีดเดือนนี้" + เรือที่ถูกถามมากสุด ---------- */
function sparkSvg(vals, color = '#70000e') {
  const W = 96, H = 34, max = Math.max(1, ...vals), st = W / Math.max(1, vals.length - 1);
  const pts = vals.map((v, i) => [(i * st).toFixed(1), (H - 3 - v / max * (H - 8)).toFixed(1)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><linearGradient id="spg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${line} L${W} ${H} L0 ${H}Z" fill="url(#spg)"/><path d="${line}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
{ const _vd = vDashboard; vDashboard = function () {
  _vd();
  const v = $('#view'); if (!v) return;
  // weekly leads, last 10 weeks, on the first KPI card
  const k1 = v.querySelector('.grid .card'); const now = Date.now(), wk = 7 * 864e5;
  if (k1 && !k1.querySelector('.spark')) {
    const w = Array.from({ length: 10 }, (_, i) => BOOKINGS.filter(b => { const t = +new Date(b.createdAt || b.created); return t > now - (10 - i) * wk && t <= now - (9 - i) * wk; }).length);
    k1.classList.add('kpi-spark'); k1.insertAdjacentHTML('beforeend', sparkSvg(w));
  }
  // most asked boats (30 days)
  // under the weekly chart (fills the space next to "ต้องทำตอนนี้")
  const chart = [...v.querySelectorAll(':scope > .grid > .card.xl\\:col-span-2')][0];
  let host = null;
  if (chart) { host = document.createElement('div'); host.className = 'grid gap-4 xl:col-span-2 items-start min-w-0'; chart.classList.remove('xl:col-span-2'); chart.before(host); host.append(chart); }
  else { const grids = [...v.children].filter(x => x.classList.contains('grid')); host = grids[grids.length - 1]; }
  const last = host;
  if (last && !$('#topBoats')) {
    const m = new Map();
    BOOKINGS.filter(b => now - +new Date(b.createdAt || b.created) < 30 * 864e5).forEach(b => { const bt = bySlug(b.boat); if (bt) m.set(bt.slug, (m.get(bt.slug) || 0) + 1); });
    const top = [...m].sort((a, b) => b[1] - a[1]).slice(0, 5);
    last.insertAdjacentHTML('beforeend', `<div class="card p-5" id="topBoats"><p class="font-medium">เรือที่ถูกถามมากสุด</p><p class="text-[11.5px] text-muted">30 วัน · นับจากลีดที่ระบุเรือ</p>
      <div class="tb-grid mt-3">${top.map(([s, n]) => { const b = bySlug(s); return `<a href="#/boats/${s}" class="tb-row"><img src="${esc(THUMBS?.[s] || b.imgs?.[0] || '')}" alt=""/><span class="min-w-0 flex-1"><b>${esc(b.name || s)}</b><small>${b.from_ ? 'เริ่ม ฿' + Number(b.from_).toLocaleString() : esc(TYPE_TH?.[b.type] || '')}</small></span><span class="text-right"><b class="tnum">${n}</b><small>ลีด</small></span></a>`; }).join('') || '<p class="text-[12.5px] text-muted py-6 text-center">ยังไม่มีลีดที่ระบุเรือใน 30 วัน</p>'}</div></div>`);
  }
  icons();
}; PAGES.find(p => p[0] === 'dashboard')[3] = vDashboard; }

/* รายละเอียดลีด: 5-step progress — ลีดใหม่ · ติดต่อแล้ว · กำลังคุย · มัดจำแล้ว · ปิดการขาย
   "มัดจำแล้ว" comes from the deal payments (ราคาที่ตกลง & การชำระเงิน), so the lead statuses stay as they are */
function leadSteps(id) {
  const l = BOOKINGS.find(b => b.id === id); if (!l) return;
  const row = [...document.querySelectorAll('#drawer .flex.items-center.gap-1')].find(r => r.querySelector('.h-1\\.5')); if (!row) return;
  let d = null; try { d = DEALS[l.dbId] || null; } catch (e) { }
  const paid = !!d && d.paid > 0 && (!d.deposit || d.paid >= d.deposit);
  const S = [['new', 'ลีดใหม่'], ['contacted', 'ติดต่อแล้ว'], ['talking', 'กำลังคุย'], ['deposit', 'มัดจำแล้ว'], ['won', 'ปิดการขาย']];
  const idx = l.status === 'won' ? 4 : paid ? 3 : Math.max(0, ['new', 'contacted', 'talking'].indexOf(l.status));
  const lost = l.status === 'lost';
  row.classList.add('lead-steps'); row.classList.replace('items-center', 'items-start');
  row.innerHTML = S.map(([k, t], i) => `<div class="flex-1"><div class="h-1.5 rounded-full ${lost ? 'bg-[#f3d6d8]' : i <= idx ? 'bg-maroon' : 'bg-sand-100'}"></div><p class="text-[10px] mt-1.5 ${!lost && i === idx ? 'text-ink' : 'text-muted'}">${t}${k === 'deposit' && paid && d?.paid ? ` <span class="tnum">฿${Number(d.paid).toLocaleString()}</span>` : ''}</p></div>`).join('');
}
{ const _bd = bookingDetail; bookingDetail = function (id) { _bd(id); try { leadSteps(id); } catch (e) { } }; }

/* ---------- sidebar groups: แดชบอร์ด · งานขาย · สินค้า & ราคา · เว็บไซต์ · การตลาด · ทีม & ระบบ ---------- */
{ const G = [[null, ['dashboard']], ['งานขาย', ['bookings', 'calendar', 'customers']], ['สินค้า & ราคา', ['boats', 'seasons', 'activities']],
    ['เว็บไซต์', ['content', 'articles', 'media']], ['การตลาด', ['seo', 'analytics', 'audiences']], ['ทีม & ระบบ', ['team', 'audit', 'settings', 'system']]];
  const pg = PAGES.filter(p => p[0] !== '—'), byK = new Map(pg.map(p => [p[0], p])), used = new Set(), out = [];
  for (const [h, ks] of G) { const items = ks.map(k => byK.get(k)).filter(Boolean); if (!items.length) continue; if (h) out.push(['—', h]); items.forEach(p => { out.push(p); used.add(p); }); }
  out.push(...pg.filter(p => !used.has(p)));   // a page added later and not grouped yet: at the end, under ทีม & ระบบ
  PAGES.length = 0; PAGES.push(...out); }

/* ---------- site settings ---------- */
if (BOOT.sitecfg) Object.assign(SITECFG, BOOT.sitecfg, { tab: SITECFG.tab });
socMigrate();
{ const _cs = cfgSave; cfgSave = function () { const before = clone(CFGSNAP || {}); _cs(); const { tab, ...value } = SITECFG;
  const ch = jdiff(before, clone(SITECFG)).filter(c => !c.f.startsWith('tab')).slice(0, 30).map(c => ({ f: CFG_F[c.f.split(/[.[]/)[0]] || c.f, from: /^data:/.test(String(c.from)) ? '(รูปเดิม)' : typeof c.from === 'object' ? '(เดิม)' : c.from, to: /^data:/.test(String(c.to)) ? '(รูปใหม่)' : typeof c.to === 'object' ? '(ใหม่)' : c.to }));
  api('PUT', 'settings/sitecfg', { value, changes: ch }).then(() => { AUDIT_DIRTY = true; toast('บันทึกการตั้งค่าแล้ว · หน้าเว็บยังใช้ข้อมูลติดต่อเดิมจนกว่าจะเชื่อมในขั้นถัดไป'); }).catch(fail); }; }

/* ---------- audit log: always the server's copy ---------- */
function refreshAudit() { return api('GET', 'audit').then(r => { AUDIT.length = 0; AUDIT.push(...r.audit); AUDIT.forEach(actPillSafe); AUDIT_DIRTY = false; }); }
{ const _va = vAudit; vAudit = function () { _va(); if (AUDIT_DIRTY && can('audit')) refreshAudit().then(() => { if (CUR === 'audit') _va(); }).catch(() => { }); };
  PAGES.find(p => p[0] === 'audit')[3] = vAudit; }
audVerify = function () { toast('กำลังตรวจสอบสายบันทึก…'); api('POST', 'audit/verify').then(r => { AUDIT_DIRTY = true; toast(r.bad.length ? `พบ ${r.bad.length} รายการที่ไม่ตรง hash · แจ้งผู้ดูแลระบบ` : `ตรวจแล้ว ${r.total} รายการ · ไม่มีการแก้ไขย้อนหลัง`); }).catch(fail); };

/* ---------- pages not connected yet: say so plainly ---------- */
/* ---------- media library: real uploads (/api/admin/media) + details saved a few seconds after editing ---------- */
const MSNAP = new Map(), MOBJ = new Map();   // src → last saved details / item (to restore if a delete is refused)
const mKey = m => JSON.stringify([m.name, m.dir, m.alt, m.tags, m.rights, m.credit, m.focal, m.owner]);
function mFromServer(r) {
  MSIZE[r.src] = r.size;
  let m = MEDIA.find(x => x.src === r.src);
  const d = { name: r.name, dir: r.dir, alt: r.alt, tags: r.tags, rights: r.rights, credit: r.credit, owner: r.owner, date: r.date, source: r.uploaded ? 'own' : undefined };
  if (m) Object.assign(m, d, { focal: r.focal }); else { m = mkMedia(r.src, d); m.focal = r.focal; MEDIA.push(m); }
  MSNAP.set(m.src, mKey(m)); MOBJ.set(m.src, m);
  return m;
}
MEDIA.forEach(m => { MSNAP.set(m.src, mKey(m)); MOBJ.set(m.src, m); });
(BOOT.media || []).forEach(mFromServer);

/* which library folder an upload lands in, from the page it was made on */
const upDir = () => ({ boats: 'boat', seasons: 'boat', articles: 'blog', activities: 'act', team: 'team', settings: 'brand' })[CUR] || (CUR === 'media' && ML.dir !== 'all' ? ML.dir : 'new');
readFiles = function (fl, cb) {
  const fs = [...fl].filter(f => /^image\//.test(f.type) || /\.(heic|heif|avif)$/i.test(f.name)); if (!fs.length) return toast('รองรับเฉพาะไฟล์รูปภาพ');
  const dir = upDir(), chunks = []; for (let i = 0; i < fs.length; i += 10) chunks.push(fs.slice(i, i + 10));
  toast(`กำลังอัปโหลด ${fs.length} รูป…`);
  (async () => {
    const got = [];
    for (const c of chunks) {
      const fd = new FormData(); c.forEach(f => fd.append('file', f)); fd.append('dir', dir);
      const r = await fetch('/api/admin/media', { method: 'POST', body: fd, credentials: 'same-origin' });
      if (r.status === 401) { location.href = '/admin/login'; return; }
      const j = await r.json().catch(() => ({}));
      if (j.errors?.length) toastErr(j.errors.join(' · ')); else if (!r.ok) toastErr(j.error || 'อัปโหลดไม่สำเร็จ');
      (j.items || []).forEach(it => got.push(mFromServer(it).src));
    }
    if (got.length) cb(got);
  })().catch(() => toastErr('อัปโหลดไม่สำเร็จ · ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'));
};
mUpload = function (srcs) {
  const ms = srcs.map(s => MEDIA.find(m => m.src === s)).filter(Boolean);
  toast(`อัปโหลด ${ms.length} รูปแล้ว · แปลงเป็น WebP และย่อขนาดให้อัตโนมัติ`);
  if (CUR === 'media' && !ML.pick) vMedia();
  return ms;
};
/* replacing a file: the upload already added the new image, merge it into the item being replaced */
{ const _mr = mReplace; mReplace = function (id, src) {
  const old = mById(id)?.src; MEDIA = MEDIA.filter(x => !(x.src === src && x.id !== +id));
  _mr(id, src); if (old) { MSNAP.delete(old); MOBJ.delete(old); } MSNAP.set(src, ''); MOBJ.set(src, mById(id));
}; }
{ const _md = mDetail; mDetail = function (id) {
  _md(id); const m = mById(id), b = [...$$('#drawer button')].find(x => x.textContent.includes('คัดลอก URL'));
  if (b && m) { b.removeAttribute('onclick'); b.onclick = () => navigator.clipboard.writeText(new URL(m.src, location.origin).href).then(() => toast('คัดลอก URL แล้ว')); }
}; }
function mTick() {
  if (!ME || !can('content')) return;
  const live = new Set();
  for (const m of MEDIA) {
    live.add(m.src); const k = mKey(m);
    if (!MSNAP.has(m.src)) { MSNAP.set(m.src, k); MOBJ.set(m.src, m); continue; }   // shipped with the site, nothing edited yet
    if (MSNAP.get(m.src) === k) continue;
    MSNAP.set(m.src, k);
    api('PUT', 'media', { url: m.src, name: m.name, dir: m.dir, alt: m.alt, tags: m.tags, rights: m.rights, credit: m.credit, focal: m.focal, owner: m.owner }).catch(e => { MSNAP.delete(m.src); fail(e); });
  }
  for (const src of [...MSNAP.keys()]) if (!live.has(src)) {
    const m = MOBJ.get(src); MSNAP.delete(src); MOBJ.delete(src);
    api('DELETE', 'media?url=' + encodeURIComponent(src)).then(() => { AUDIT_DIRTY = true; }).catch(e => { fail(e); if (m && !MEDIA.includes(m)) { MEDIA.push(m); MSNAP.set(src, mKey(m)); MOBJ.set(src, m); if (CUR === 'media') vMedia(); } });
  }
}
setInterval(mTick, 3000);

/* ---------- homepage content (เนื้อหาเว็บไซต์): edits stay here until เผยแพร่, then go live at once ---------- */
const homeVal = () => clone({ hero: WEB.hero, promo: WEB.promo, faq: WEB.faq, seo: WEB.seo });
let HOMESNAP = null;
if (BOOT.home) { const h = clone(BOOT.home); Object.assign(WEB, { hero: h.hero, promo: h.promo, faq: h.faq, seo: h.seo }); HOMESNAP = JSON.stringify(homeVal()); }
const homeDirty = () => HOMESNAP != null && JSON.stringify(homeVal()) !== HOMESNAP;
function homePublish() {
  if (!can('content')) return toast('ไม่มีสิทธิ์เผยแพร่เนื้อหา');
  const before = JSON.parse(HOMESNAP || '{}'), v = homeVal(), f = webFields(), miss = langPct(f, 'en') < 100 || langPct(f, 'th') < 100;
  const L = { hero: 'Hero หน้าแรก', promo: 'แบนเนอร์โปรโมชั่น', faq: 'FAQ', seo: 'SEO หน้าหลัก' };
  const changes = Object.keys(L).filter(k => JSON.stringify(before[k]) !== JSON.stringify(v[k])).map(k => ({ f: L[k], from: '—', to: 'แก้ไขแล้ว' }));
  api('PUT', 'settings/home', { value: v, changes }).then(r => {
    Object.assign(WEB, clone(r.home)); HOMESNAP = JSON.stringify(homeVal()); AUDIT_DIRTY = true;
    toast(miss ? 'เผยแพร่แล้ว · ช่องที่ยังไม่แปลจะแสดงภาษาไทยแทน' : 'เผยแพร่แล้ว · หน้าแรกอัปเดตทันที'); if (CUR === 'content') vContent();
  }).catch(fail);
}
{ const _vc = vContent; vContent = function () {
  _vc(); if (!HOMESNAP) return;
  const pub = [...$$('#view button.btn-p')].find(b => b.textContent.includes('เผยแพร่'));
  if (pub) { pub.setAttribute('onclick', 'homePublish()'); pub.insertAdjacentHTML('beforebegin', '<span id="homeDirty" class="hidden text-[11.5px] text-[#b4501a] mr-1">มีการแก้ไขที่ยังไม่เผยแพร่</span>'); }
  const box = $('#view .fade');
  if (['hero', 'faq', 'seo'].includes(WEB.tab)) box?.insertAdjacentHTML('afterbegin', `<p class="text-[12px] text-muted mb-4">ใส่ <code>{boats}</code> = จำนวนเรือบนเว็บ · <code>{from}</code> = ราคาเริ่มต้นต่ำสุด · <code>{from:yacht}</code> <code>{from:sail}</code> <code>{from:speed}</code> = ราคาเริ่มต้นตามประเภทเรือ · <code>{maxpax}</code> = จำนวนคนสูงสุด · ใช้ได้ทุกช่องในหน้านี้ และอัปเดตตามข้อมูลเรือเอง</p>`);
  if (WEB.tab === 'promo') {
    const P = WEB.promo, sel = box?.querySelector('select'), [d1, d2] = box ? [...box.querySelectorAll('input[type=date]')] : [];
    if (sel) { sel.innerHTML = FLEET.map(b => `<option value="${b.slug}" ${b.slug === P.boat ? 'selected' : ''}>${esc(b.name)}</option>`).join(''); sel.onchange = () => { P.boat = sel.value; }; }
    if (d1) { d1.value = P.start || ''; d1.onchange = () => { P.start = d1.value; }; }
    if (d2) { d2.value = P.end || ''; d2.onchange = () => { P.end = d2.value; };
      d2.closest('.grid')?.insertAdjacentHTML('afterend', `<div class="grid md:grid-cols-3 gap-3 mt-1"><label><span class="lbl">ราคาที่แสดง (บาท)</span><input id="promoPriceIn" class="inp tnum" value="${P.price || ''}" placeholder="เว้นว่าง = ราคาเริ่มต้นของเรือ"/></label><p class="md:col-span-2 text-[12px] text-muted self-end pb-2">วันที่เว้นว่าง = แสดงตลอด · นอกช่วงวันที่ แบนเนอร์จะซ่อนจากหน้าแรกเอง</p></div>`);
      const pi = $('#promoPriceIn'); pi.oninput = () => { const n = +pi.value.replace(/[^\d]/g, ''); P.price = n || null; }; }
  }
  if (WEB.tab === 'pages') box?.insertAdjacentHTML('afterbegin', '<p class="text-[12px] text-[#7a5a00] bg-[#fff8e6] rounded-lg px-3 py-2 mb-3">เนื้อหาของหน้าเหล่านี้ยังแก้จากหลังบ้านไม่ได้ · ปุ่มแก้ไขยังเป็นการจำลอง</p>');
  if (WEB.tab === 'seo') { const b = [...(box?.querySelectorAll('button') || [])].find(x => x.textContent.trim() === 'เปลี่ยนรูป'); if (b) b.outerHTML = '<span class="text-[12px] text-muted">รูปแชร์ของหน้าแรกยังเปลี่ยนจากหน้านี้ไม่ได้</span>'; }
  icons();
}; PAGES.find(p => p[0] === 'content')[3] = vContent; }
setInterval(() => { const d = $('#homeDirty'); if (d) d.classList.toggle('hidden', !homeDirty()); }, 800);
window.addEventListener('beforeunload', e => { if (homeDirty()) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- activities & tours: autosave to /api/admin/settings/activities ---------- */
const actData = a => { const { i18n: I, ...r } = a; return { ...r, th: I.name.th, en: I.name.en, loc: I.loc.en || I.loc.th, locTh: I.loc.th, dur: I.dur.en || I.dur.th, durTh: I.dur.th, desc: (I.desc.th || I.desc.en) ? { th: I.desc.th, en: I.desc.en } : undefined, active: a.active !== false }; };
let ACTSNAP = BOOT.acts ? JSON.stringify(ACTS.map(actData)) : null, ACTFLY = false;
function actTick() {
  if (!ACTSNAP || ACTFLY || !can('content')) return;
  const cur = ACTS.map(actData), k = JSON.stringify(cur); if (k === ACTSNAP) return;
  const before = new Map(JSON.parse(ACTSNAP).map(a => [a.pic, a])), now = new Map(cur.map(a => [a.pic, a])), L = { th: 'ชื่อ', en: 'ชื่อ (EN)', price: 'ราคา', active: 'แสดงบนเว็บ', imgs: 'รูป', cat: 'หมวด', loc: 'สถานที่', locTh: 'สถานที่', dur: 'ระยะเวลา', durTh: 'ระยะเวลา', desc: 'รายละเอียด' };
  const changes = [];
  for (const [pic, a] of now) { const b = before.get(pic); if (!b) { changes.push({ f: 'เพิ่มกิจกรรม', from: '', to: a.th }); continue; }
    const fs = [...new Set(Object.keys(L).filter(f => JSON.stringify(a[f]) !== JSON.stringify(b[f])).map(f => L[f]))];
    if (fs.length) changes.push({ f: a.th, from: fs.join(', '), to: 'แก้ไขแล้ว' }); }
  for (const [pic, b] of before) if (!now.has(pic)) changes.push({ f: 'ลบกิจกรรม', from: b.th, to: '' });
  ACTFLY = true;
  api('PUT', 'settings/activities', { value: cur, changes, label: changes.length === 1 ? `กิจกรรม · ${changes[0].f}` : `แก้ไขกิจกรรม ${changes.length} รายการ` })
    .then(() => { ACTSNAP = k; AUDIT_DIRTY = true; if (CUR === 'activities') { const t = $('#actSaved'); if (t) t.textContent = 'บันทึกแล้ว · หน้าเว็บอัปเดตแล้ว'; } })
    .catch(fail).finally(() => { ACTFLY = false; });
}
setInterval(actTick, 2500);
{ const _va = vActivities; vActivities = function () { _va(); $('#view h2')?.insertAdjacentHTML('afterend', '<p id="actSaved" class="text-[11px] text-muted mt-1">บันทึกอัตโนมัติ</p>'); }; PAGES.find(p => p[0] === 'activities')[3] = vActivities; }
window.addEventListener('beforeunload', e => { if (ACTSNAP && JSON.stringify(ACTS.map(actData)) !== ACTSNAP) { actTick(); e.preventDefault(); e.returnValue = ''; } });

/* ---------- SEO centre: settings saved to /api/admin/settings/seo, redirects to /api/admin/redirects ---------- */
/* fixed pages: the titles the public site uses today, so nothing changes until someone edits them */
Object.assign(STATIC_SEO, {
  fleet: { t: tr('เรือทั้งหมด – Yacht Charter ภูเก็ต | BTT', 'All Boats – Yacht Charter Phuket | BTT'), d: clone(WEB.seo.desc) },
  blog: { t: tr('บทความ คู่มือเช่าเรือยอชต์ภูเก็ต & เส้นทางเกาะ | Boat Trip Thailand', 'Phuket Yacht Charter Guides & Island Routes | Boat Trip Thailand'), d: tr('รวมบทความเช่าเรือยอชต์ภูเก็ต ราคา เส้นทางเกาะ ช่วงเวลาที่ดีที่สุด และไอเดียจัดทริปบนเรือ', 'Phuket yacht charter guides: prices, island routes, best time to go and ideas for your day at sea.') },
  about: { t: tr('เกี่ยวกับเรา – Boat Trip Thailand | Yacht Charter ภูเก็ต', 'About Us – Boat Trip Thailand | Yacht Charter Phuket'), d: tr(`รู้จัก Boat Trip Thailand ผู้ให้บริการ yacht charter ภูเก็ต เรือส่วนตัว ${FLEET.length} ลำ ใบอนุญาต ททท. 34/03754 ราคาโปร่งใส ทีมงานตอบไวทุกวัน`, `Meet Boat Trip Thailand, a TAT-licensed (34/03754) yacht charter company in Phuket with ${FLEET.length} private boats, transparent pricing and a fast, friendly team.`) },
  privacy: { t: tr('นโยบายความเป็นส่วนตัว | Boat Trip Thailand', 'Privacy Policy | Boat Trip Thailand'), d: tr('นโยบายความเป็นส่วนตัวของ Boat Trip Thailand ตาม PDPA: ข้อมูลที่เก็บ วัตถุประสงค์ การเปิดเผย และสิทธิของคุณ', 'Boat Trip Thailand privacy policy under the PDPA: what we collect, why, who we share it with and your rights.') },
  terms: { t: tr('ข้อกำหนดและเงื่อนไข | Boat Trip Thailand', 'Terms & Conditions | Boat Trip Thailand'), d: tr('เงื่อนไขการจองเรือ การชำระเงิน การยกเลิก กฎบนเรือ และความรับผิดของ Boat Trip Thailand', 'Booking, payment, cancellation, on-board rules and liability terms for Boat Trip Thailand charters.') },
  cookies: { t: tr('การตั้งค่าคุกกี้ | Boat Trip Thailand', 'Cookie Preferences | Boat Trip Thailand'), d: tr('เลือกประเภทคุกกี้ที่อนุญาตบนเว็บไซต์ Boat Trip Thailand', 'Choose which cookies you allow on the Boat Trip Thailand website.') },
});
delete STATIC_SEO.activities;
const STATIC_DEF = clone(STATIC_SEO);
if (BOOT.seo) { const c = BOOT.seo;
  Object.keys(SX).forEach(k => delete SX[k]);
  Object.entries(c.sx || {}).forEach(([id, x]) => { SX[id] = { index: x.index !== false, follow: x.follow !== false, canon: x.canon || '', ogT: x.ogT || tr(), schema: '' }; });
  Object.entries(c.pages || {}).forEach(([id, p]) => { const k = id.slice(2); if (STATIC_SEO[k]) STATIC_SEO[k] = { t: p.t, d: p.d }; });
  Object.assign(ROBOTS, { txt: c.robots.txt, ai: { ...c.robots.ai }, llms: c.robots.llms });
  Object.assign(SMAP, c.smap);
  const merge = (a, b) => { for (const [k, v] of Object.entries(b || {})) a[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' ? merge(a[k], v) : v; return a; };
  merge(SSET, c.sset);
}
const seoVal = () => ({
  pages: Object.fromEntries(Object.entries(STATIC_SEO).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(STATIC_DEF[k])).map(([k, v]) => ['s-' + k, v])),
  sx: Object.fromEntries(Object.entries(SX).map(([id, x]) => [id, { index: x.index !== false, follow: x.follow !== false, canon: (x.canon || '').trim(), ogT: x.ogT || tr() }])
    .filter(([, x]) => !x.index || !x.follow || x.canon || x.ogT.th || x.ogT.en)),   // pages left at the default are not stored
  robots: { txt: ROBOTS.txt, ai: ROBOTS.ai, llms: ROBOTS.llms }, smap: { hreflang: SMAP.hreflang, pages: SMAP.pages !== false, boats: SMAP.boats !== false, blog: SMAP.blog !== false, images: SMAP.images !== false }, sset: SSET,
});
let SEOSNAP = BOOT.seo ? JSON.stringify(seoVal()) : null, SEOFLY = false;
function seoTick() {
  if (!SEOSNAP || SEOFLY || !can('seo')) return;
  const v = seoVal(), k = JSON.stringify(v); if (k === SEOSNAP) return;
  const b = JSON.parse(SEOSNAP), L = { pages: 'Meta หน้าเพจ', sx: 'index / canonical รายหน้า', robots: 'robots.txt / AI crawlers / llms.txt', smap: 'Sitemap', sset: 'ตั้งค่า SEO' };
  const changes = Object.keys(L).filter(x => JSON.stringify(b[x]) !== JSON.stringify(v[x])).map(x => ({ f: L[x], from: '—', to: 'แก้ไขแล้ว' }));
  SEOFLY = true;
  api('PUT', 'settings/seo', { value: v, changes }).then(() => { SEOSNAP = k; AUDIT_DIRTY = true; }).catch(fail).finally(() => { SEOFLY = false; });
}
setInterval(seoTick, 2500);
window.addEventListener('beforeunload', e => { if (SEOSNAP && JSON.stringify(seoVal()) !== SEOSNAP) { seoTick(); e.preventDefault(); e.returnValue = ''; } });
/* page drawer: boats & articles autosave with their own record; the homepage is published from here */
function seoSaveDrawer() { const id = SE?.id; closeDrawer(); vSeo();
  if (id === 's-home' && typeof homeDirty === 'function' && homeDirty()) return homePublish();
  toast(id?.startsWith('b-') || id?.startsWith('a-') ? 'บันทึกแล้ว · หน้าเว็บอัปเดตอัตโนมัติ' : 'บันทึกแล้ว · หน้าเว็บอัปเดตภายในไม่กี่วินาที'); }
function seoSaveRedir(n404) {
  const from = $('#rF').value.trim(), to = $('#rT').value.trim(), code = +$('#rC').value; if (!from) return toast('ใส่ URL เดิม');
  api('POST', 'redirects/save', { from, to, code }).then(r => { const i = REDIR.findIndex(x => x.from === r.redirect.from); if (i >= 0) REDIR.splice(i, 1); REDIR.unshift(r.redirect);
    if (n404 != null) LOG404.splice(n404, 1); AUDIT_DIRTY = true; closeModal(); vSeo(); toast('บันทึก redirect แล้ว · มีผลภายใน 5 นาที'); }).catch(fail);
}
function seoDelRedir(n) { const r = REDIR[n]; if (!r || !confirm(`ลบ redirect ${r.from} ?`)) return;
  api('POST', 'redirects/delete', { from: r.from }).then(() => { REDIR.splice(REDIR.indexOf(r), 1); AUDIT_DIRTY = true; vSeo(); toast('ลบ redirect แล้ว · มีผลภายใน 5 นาที'); }).catch(fail); }

/* ---------- วิเคราะห์เว็บไซต์ → ข้อมูลจริง: first-party counter (/api/t) + real leads ---------- */
const AN = { data: null, at: 0, days: 0, loading: false };
function anLoad() {
  if (AN.loading) return; AN.loading = true;
  api('GET', 'analytics?days=' + GA.days).then(d => { AN.data = d; AN.at = Date.now(); AN.days = GA.days; }).catch(fail)
    .finally(() => { AN.loading = false; if (CUR === 'analytics' && GA.tab === 'site') vAnalytics(); });
}
/* traffic source → the lead source keys used on leads (sourceKey in src/lib/lead-meta.ts) */
const AN_SRC = { direct: 'direct', google: 'google', bing: 'google', 'google-ads': 'gads', 'facebook-ads': 'meta', facebook: 'social', instagram: 'social', tiktok: 'social', youtube: 'social', line: 'line', ai: 'other', email: 'other', referral: 'other', other: 'other' };
const AN_SRC_L = { google: 'Google ค้นหา', gads: 'Google Ads', meta: 'Facebook / IG Ads', social: 'Social (ไม่เสียเงิน)', line: 'LINE', direct: 'เข้าเว็บโดยตรง', other: 'เว็บอื่น / AI / อีเมล', wa: 'WhatsApp โดยตรง', phone: 'โทรศัพท์', ref: 'ลูกค้าแนะนำ / Agent' };
const AN_DEV = { mobile: 'มือถือ', tablet: 'แท็บเล็ต', desktop: 'คอมพิวเตอร์' };
function anPageName(p) {
  const en = p.startsWith('/en/') || p === '/en', q = en ? p.slice(3) || '/' : p, sfx = en ? ' · EN' : '';
  const fixed = { '/': 'หน้าแรก', '/yacht-charter': 'เรือทั้งหมด', '/blog': 'บทความทั้งหมด', '/destinations': 'จุดหมาย', '/about-us': 'เกี่ยวกับเรา', '/privacy-policy': 'นโยบายความเป็นส่วนตัว', '/terms-and-conditions': 'ข้อกำหนด', '/cookie-preferences': 'ตั้งค่าคุกกี้' };
  if (fixed[q]) return fixed[q] + sfx;
  if (q.startsWith('/yacht-charter/')) { const b = bySlug(q.slice(15)); return (b ? b.name : q.slice(15)) + sfx; }
  if (q.startsWith('/blog/')) { const s = q.slice(6), a = ART.find(x => x.slug.th === s || x.slug.en === s); return (a ? a.title.th || a.title.en : s) + sfx; }
  return p;
}
function anBody() {
  if (!AN.data || AN.days !== GA.days || Date.now() - AN.at > 60_000) anLoad();
  const D = AN.data;
  if (!D || D.days !== GA.days) return '<div class="card p-10 text-center text-muted">กำลังโหลดข้อมูล…</div>';
  const cur = D.cur.map(x => x.sessions), prev = D.prev.map(x => x.sessions), views = sum(D.cur.map(x => x.views)), pviews = sum(D.prev.map(x => x.views));
  const S = sum(cur), PS = sum(prev);
  const fromIso = iso(addDays(TODAY, -GA.days + 1)), pfIso = iso(addDays(TODAY, -2 * GA.days + 1));
  const L = BOOKINGS.filter(l => l.created >= fromIso), PL = BOOKINGS.filter(l => l.created >= pfIso && l.created < fromIso);
  const won = L.filter(l => l.status === 'won').length, pwon = PL.filter(l => l.status === 'won').length;
  const cr = S ? L.length / S * 100 : 0, pcr = PS ? PL.length / PS * 100 : 0;
  const pct = (n, t) => t ? (n / t * 100).toFixed(n / t < .1 ? 1 : 0) + '%' : '—';
  const dl = (c, p, inv) => p ? delta(c, p, inv) : (GA.cmp ? '<span class="text-[11.5px] text-muted">ช่วงก่อนหน้าไม่มีข้อมูล</span>' : '');   // no comparison without a previous period
  // sources: sessions from the counter, leads from the CRM
  const src = {}; D.bySource.forEach(r => { const k = AN_SRC[r.source] || 'other'; (src[k] ??= { s: 0, l: 0, w: 0 }).s += r.sessions; });
  L.forEach(l => { const k = AN_SRC_L[l.src] ? l.src : 'other'; (src[k] ??= { s: 0, l: 0, w: 0 }).l++; if (l.status === 'won') src[k].w++; });
  const srcRows = Object.entries(src).sort((a, b) => b[1].s - a[1].s || b[1].l - a[1].l);
  const bar = (n, t) => `<span class="block h-1.5 mt-1 rounded-full bg-sand overflow-hidden"><span class="block h-full bg-maroon rounded-full" style="width:${t ? Math.max(2, n / t * 100) : 0}%"></span></span>`;
  const maxP = Math.max(1, ...D.byPath.map(r => r.views));
  const boats = D.byBoat.map(r => ({ ...r, b: bySlug(r.slug), leads: L.filter(l => l.boat === r.slug).length })).filter(r => r.b);
  BOOKINGS.forEach(l => { if (l.created >= fromIso && l.boat && !boats.some(r => r.slug === l.boat) && bySlug(l.boat)) boats.push({ slug: l.boat, views: 0, b: bySlug(l.boat), leads: L.filter(x => x.boat === l.boat).length }); });
  boats.sort((a, b) => b.views - a.views || b.leads - a.leads);
  const devT = sum(D.byDevice.map(r => r.sessions)) || 1, langT = sum(D.byLang.map(r => r.sessions)) || 1;
  const empty = !S && !views;
  return `${empty ? `<div class="rounded-xl bg-sand px-4 py-3 mb-4 text-[12.5px]">ยังไม่มีผู้เข้าชมในช่วงนี้ · ระบบเริ่มนับเมื่อหน้าเว็บเวอร์ชันนี้ขึ้น production แล้ว ตัวเลขจะเริ่มขึ้นภายในไม่กี่นาทีหลังมีคนเข้าเว็บ</div>` : ''}
    <div class="grid grid-cols-2 xl:grid-cols-5 gap-3">${kpi('เซสชัน', nf(S), dl(S, PS), 'นับเองแบบไม่ใช้คุกกี้')}${kpi('เพจวิว', nf(views), dl(views, pviews), S ? (views / S).toFixed(1) + ' หน้า / เซสชัน' : '')}${kpi('ลีด / คำขอจอง', nf(L.length), dl(L.length, PL.length), 'จากระบบลีด')}${kpi('อัตราแปลงเป็นลีด', S ? cr.toFixed(1) + '%' : '—', dl(cr, pcr), 'ลีด ÷ เซสชัน')}${kpi('ปิดการขายได้', nf(won), dl(won, pwon), L.length ? pct(won, L.length) + ' ของลีด' : '')}</div>
    <div class="card p-5 mt-4"><div class="flex items-center justify-between mb-3"><p class="font-medium">เซสชันรายวัน</p><span class="text-[11.5px] text-muted">${GA.cmp ? 'เส้นประ = ช่วงก่อนหน้า' : ''}</span></div>${lineChart(cur, prev, { label: 'เซสชัน', labels: D.cur[0]?.h ? D.cur.map(x => x.h) : undefined })}</div>
    <div class="grid xl:grid-cols-2 gap-4 mt-4 items-start">
      <div class="card overflow-hidden"><div class="p-4 border-b border-line"><p class="font-medium">แหล่งที่มา → ลีด → ปิดการขาย</p><p class="text-[11.5px] text-muted mt-0.5">ช่องทางไหนพาคนเข้าเว็บแล้วกลายเป็นลูกค้า</p></div>
        <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>แหล่งที่มา</th><th class="text-right">เซสชัน</th><th class="text-right">ลีด</th><th class="text-right">อัตราแปลง</th><th class="text-right">ปิดได้</th></tr></thead><tbody>
        ${srcRows.map(([k, v]) => `<tr><td>${AN_SRC_L[k] || k}</td><td class="text-right tnum">${v.s ? nf(v.s) : '—'}</td><td class="text-right tnum">${v.l}</td><td class="text-right tnum">${v.s ? pct(v.l, v.s) : '—'}</td><td class="text-right tnum">${v.w}</td></tr>`).join('') || '<tr><td colspan="5" class="text-muted">ยังไม่มีข้อมูล</td></tr>'}
        </tbody></table></div><p class="text-[11px] text-muted px-4 py-2.5">WhatsApp / โทร / แนะนำ เป็นลีดที่เซลล์บันทึกเอง จึงไม่มีจำนวนเซสชัน</p></div>
      <div class="card overflow-hidden"><div class="p-4 border-b border-line"><p class="font-medium">หน้าที่มีคนดูมากที่สุด</p></div>
        <ul>${D.byPath.slice(0, 15).map(r => `<li class="px-4 py-2.5 border-t border-line first:border-0"><div class="flex items-center justify-between gap-3 text-[12.5px]"><span class="truncate" title="${esc(r.path)}">${esc(anPageName(r.path))}</span><span class="tnum text-muted shrink-0">${nf(r.views)}</span></div>${bar(r.views, maxP)}</li>`).join('') || '<li class="px-4 py-3 text-muted">ยังไม่มีข้อมูล</li>'}</ul></div>
      <div class="card overflow-hidden"><div class="p-4 border-b border-line"><p class="font-medium">เรือที่คนสนใจ</p><p class="text-[11.5px] text-muted mt-0.5">ยอดเข้าชมหน้าเรือ เทียบกับลีดที่ขอเรือลำนั้น</p></div>
        <div class="overflow-x-auto"><table class="tbl"><thead><tr><th>เรือ</th><th class="text-right">เข้าชม</th><th class="text-right">ลีด</th><th class="text-right">อัตราแปลง</th></tr></thead><tbody>
        ${boats.slice(0, 15).map(r => `<tr class="click" onclick="boatEdit('${r.slug}')"><td>${esc(r.b.name)}</td><td class="text-right tnum">${nf(r.views)}</td><td class="text-right tnum">${r.leads}</td><td class="text-right tnum">${r.views ? pct(r.leads, r.views) : '—'}</td></tr>`).join('') || '<tr><td colspan="4" class="text-muted">ยังไม่มีข้อมูล</td></tr>'}
        </tbody></table></div></div>
      <div class="card p-4 grid sm:grid-cols-2 gap-5"><div><p class="font-medium mb-2">อุปกรณ์</p>${D.byDevice.map(r => `<div class="text-[12.5px] mb-2"><div class="flex justify-between"><span>${AN_DEV[r.device] || r.device}</span><span class="tnum text-muted">${pct(r.sessions, devT)}</span></div>${bar(r.sessions, devT)}</div>`).join('') || '<p class="text-muted text-[12.5px]">ยังไม่มีข้อมูล</p>'}</div>
        <div><p class="font-medium mb-2">ภาษา</p>${D.byLang.map(r => `<div class="text-[12.5px] mb-2"><div class="flex justify-between"><span>${r.lang === 'en' ? 'English' : 'ไทย'}</span><span class="tnum text-muted">${pct(r.sessions, langT)}</span></div>${bar(r.sessions, langT)}</div>`).join('') || '<p class="text-muted text-[12.5px]">ยังไม่มีข้อมูล</p>'}</div></div>
    </div>
    ${D.notFound.length ? `<div class="card overflow-hidden mt-4"><div class="p-4 border-b border-line flex items-center justify-between"><div><p class="font-medium">หน้า 404 ที่มีคนเข้า · 90 วัน</p><p class="text-[11.5px] text-muted mt-0.5">ลิงก์เสียที่ควรทำ redirect</p></div><button class="btn btn-o !h-8" onclick="SEOV.tab='redirects';go('seo')">ไปที่ Redirect</button></div><ul>${D.notFound.slice(0, 10).map(r => `<li class="px-4 py-2.5 border-t border-line first:border-0 flex justify-between gap-3 text-[12.5px]"><span class="truncate">${esc(r.path)}</span><span class="tnum text-muted">${nf(r.views)} ครั้ง</span></li>`).join('')}</ul></div>` : ''}
    <p class="text-[11px] text-muted mt-4">นับจากเว็บไซต์เองตั้งแต่ ${D.since ? fmtD(D.since) : 'วันนี้'} · ไม่ใช้คุกกี้และไม่เก็บข้อมูลส่วนบุคคล (เก็บแค่ยอดรวมรายวันของแต่ละหน้า แหล่งที่มา อุปกรณ์ และภาษา) · ไม่นับบอทและการเปิดหน้า preview</p>`;
}
function anCsv() {
  const D = AN.data; if (!D) return;
  const rows = [['หน้า', 'ชื่อ', 'เพจวิว', 'เซสชัน'], ...D.byPath.map(r => [r.path, anPageName(r.path), r.views, r.sessions]), [], ['แหล่งที่มา', '', 'เพจวิว', 'เซสชัน'], ...D.bySource.map(r => [r.source, '', r.views, r.sessions])];
  const csv = '﻿' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `traffic-${GA.days}d-${iso(TODAY)}.csv`; a.click();
  audit('export', 'auth', 'analytics', `ส่งออกรายงานผู้เข้าชม ${GA.days} วัน`);
}
GA.tab = 'site';
/* SEO → Redirect: the "404 with visitors" list comes from the real counter */
let NF_LOADED = false;
{ const _sr = seoRedir; seoRedir = function (P) {
  if (!NF_LOADED && can('seo')) { NF_LOADED = true; api('GET', 'analytics?days=90').then(d => { LOG404.length = 0; LOG404.push(...d.notFound.map(r => ({ u: r.path, h: r.views }))); if (CUR === 'seo' && SEOV.tab === 'redirects') vSeo(); }).catch(() => {}); }
  return _sr(P).replace('ข้อมูลตัวอย่าง · 30 วัน', 'ข้อมูลจริงจากเว็บไซต์ · 90 วัน').replace('<ul></ul>', '<p class="px-4 py-3 text-[12px] text-muted border-t border-line">ยังไม่มีคนเข้าหน้าที่ไม่มีอยู่</p>');
}; }
{ const _va = vAnalytics; vAnalytics = function () {
  const site = GA.tab === 'site'; if (site) GA.tab = 'overview';
  try { _va(); } finally { if (site) GA.tab = 'site'; }
  const bar = $('#view .flex.gap-1.overflow-x-auto');   // the main tab bar (the Meta tab has its own sub-tabs further down)
  if (bar) { if (site) bar.querySelector('.tab.on')?.classList.remove('on'); bar.insertAdjacentHTML('afterbegin', `<button class="tab inline-flex items-center gap-1.5 ${site ? 'on' : ''}" onclick="GA.tab='site';vAnalytics()"><i data-lucide="activity" class="w-3.5 h-3.5"></i>ข้อมูลจริง</button>`); }
  const note = [...$$('#view .rounded-xl')].find(x => x.textContent.includes('ตัวเลขทั้งหมดในหน้านี้เป็นข้อมูลตัวอย่าง'));
  if (note) note.lastChild.textContent = site ? 'แท็บนี้เป็นข้อมูลจริง: ผู้เข้าชมนับจากเว็บไซต์เอง ลีดและการปิดการขายมาจากระบบลีด · แท็บ Google Analytics / Search Console / Meta ยังเป็นข้อมูลตัวอย่างจนกว่าจะเชื่อม API' : 'แท็บนี้เป็นข้อมูลตัวอย่าง จนกว่าจะเชื่อม API ของ Google / Meta · ข้อมูลจริงอยู่ในแท็บ “ข้อมูลจริง”';
  const exp = [...$$('#view button')].find(b => b.textContent.trim() === 'ส่งออก'); if (exp) exp.setAttribute('onclick', site ? 'anCsv()' : "toast('ส่งออกได้เฉพาะแท็บข้อมูลจริง')");
  if (site) { const f = $('#view .fade'); if (f) f.innerHTML = anBody(); }
  icons();
}; PAGES.find(p => p[0] === 'analytics')[3] = vAnalytics; }

/* ---------- วิเคราะห์เว็บไซต์ → Google Analytics 4 + Search Console: ข้อมูลจริงจาก /api/admin/analytics/google ---------- */
const GG = { d: {}, loading: {}, st: null };
function ggLoad(refresh) {
  const k = GA.days; if (GG.loading[k]) return; GG.loading[k] = true;
  api('GET', `analytics/google?days=${k}${refresh ? '&refresh=1' : ''}`).then(d => { GG.d[k] = { ...d, t: Date.now() }; GG.st = d.status; if (refresh) toast('โหลดข้อมูลใหม่จาก Google แล้ว'); })
    .catch(e => { GG.failAt = Date.now(); fail(e); }).finally(() => { GG.loading[k] = false; if (CUR === 'analytics') vAnalytics(); });
}
const ggTh = s => /[\u0E00-\u0E7F]/.test(s);
const ggDur = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const ggPct = (n, d = 1) => (n * 100).toFixed(d) + '%';
const ggBars = (rows, o) => { const r = rows.filter(x => x[1] > 0); return r.length ? bars(r, o) : '<p class="text-[12px] text-muted">ยังไม่มีข้อมูลในช่วงนี้</p>'; };
const ggEnd = S => new Date(S.range.endDate + 'T00:00:00');
const ggPath = u => { try { return decodeURIComponent(new URL(u).pathname); } catch { return u; } };
/** fill days without a position (no impressions) with the previous day's value so the chart does not drop to 0 */
const ggPos = a => { let last = a.find(x => x.position)?.position || 0; return a.map(x => (last = x.position || last)); };
function ggErr(e, what) {
  const hint = e.code === 'forbidden' ? `เพิ่มอีเมล <b class="font-mono">${esc(GG.st?.email || '')}</b> เป็นผู้ใช้ใน ${what === 'ga' ? 'GA4 (Admin → Property access management → Viewer)' : 'Search Console (Settings → Users and permissions → Restricted)'} แล้วกด “โหลดใหม่”`
    : e.code === 'not_found' ? (what === 'ga' ? 'ตรวจ GA4_PROPERTY_ID ใน .env (ต้องเป็นตัวเลข ไม่ใช่ G-XXXX)' : 'ตรวจ GSC_SITE_URL ใน .env ให้ตรงกับ property ใน Search Console เช่น sc-domain:boattripthailand.com')
    : e.code === 'auth' || e.code === 'no_key' ? 'ตรวจกุญแจ service account ใน .env (GOOGLE_SERVICE_ACCOUNT_JSON)' : 'ลองกด “โหลดใหม่” อีกครั้ง ถ้ายังไม่ได้ให้ดู log ของเซิร์ฟเวอร์';
  return `<div class="card p-6"><p class="font-medium text-[#a3222c] flex items-center gap-2"><i data-lucide="alert-triangle" class="w-4 h-4"></i>ดึงข้อมูลจาก ${what === 'ga' ? 'Google Analytics' : 'Search Console'} ไม่สำเร็จ</p>
    <p class="text-[12.5px] mt-2">${esc(e.error)}</p><p class="text-[12.5px] text-muted mt-2">${hint}</p><button class="btn btn-o !h-8 mt-4" onclick="ggLoad(true)"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>โหลดใหม่</button></div>`;
}
function ggSetup() {
  const s = GG.st || { key: false, email: null, ga: { on: false }, gsc: { on: false } };
  const row = (ok, t, d) => `<li class="flex gap-3"><i data-lucide="${ok ? 'check-circle-2' : 'circle'}" class="w-4 h-4 shrink-0 mt-0.5 ${ok ? 'text-[#1e7a46]' : 'text-muted'}"></i><div><p class="text-[13px] font-medium">${t}</p><p class="text-[12px] text-muted mt-0.5">${d}</p></div></li>`;
  const env = `# Google Analytics 4 + Search Console (อ่านอย่างเดียว)\nGOOGLE_SERVICE_ACCOUNT_JSON=<ผลจาก: base64 -i ไฟล์กุญแจ.json | tr -d '\\n'>\nGA4_PROPERTY_ID=<ตัวเลข property เช่น 412345678>\nGSC_SITE_URL=sc-domain:boattripthailand.com`;
  return `<div class="grid xl:grid-cols-2 gap-4 items-start">
    <div class="card p-5"><p class="font-medium">สถานะการเชื่อมต่อ</p><ul class="grid gap-3 mt-4">
      ${row(s.key, 'กุญแจ service account', s.key ? `ใช้บัญชี <span class="font-mono">${esc(s.email)}</span>` : 'ยังไม่ได้ใส่ GOOGLE_SERVICE_ACCOUNT_JSON ใน .env')}
      ${row(s.ga.on, 'Google Analytics 4', s.ga.on ? 'Property ' + esc(s.ga.property) : 'ยังไม่ได้ใส่ GA4_PROPERTY_ID')}
      ${row(s.gsc.on, 'Search Console', s.gsc.on ? esc(s.gsc.site) : 'ยังไม่ได้ใส่ GSC_SITE_URL')}</ul>
      ${s.ga.on || s.gsc.on ? '<button class="btn btn-o !h-8 mt-4" onclick="ggLoad(true)"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>โหลดข้อมูลใหม่จาก Google</button>' : ''}
      <p class="text-[11.5px] text-muted mt-4">ข้อมูลเก็บไว้ 30 นาทีแล้วค่อยดึงใหม่ · Search Console มีข้อมูลช้ากว่าจริงประมาณ 3 วัน</p></div>
    <div class="card p-5"><p class="font-medium">วิธีเชื่อมต่อ (ทำครั้งเดียว)</p><ol class="grid gap-2.5 mt-3 text-[12.5px] list-decimal pl-5">
      <li>Google Cloud → เปิด <b>Google Analytics Data API</b> และ <b>Google Search Console API</b></li>
      <li>สร้าง Service account → Keys → Add key → JSON (ดาวน์โหลดไฟล์กุญแจ เก็บเป็นความลับ)</li>
      <li>GA4 → Admin → Property access management → เพิ่มอีเมล service account เป็น <b>Viewer</b></li>
      <li>Search Console → Settings → Users and permissions → เพิ่มอีเมลเดียวกัน แบบ <b>Restricted</b></li>
      <li>ใส่ 3 บรรทัดด้านล่างใน <span class="font-mono">.env</span> บนเซิร์ฟเวอร์ แล้วรีสตาร์ต (<span class="font-mono">docker compose up -d</span>)</li></ol>
      <pre class="p-3.5 mt-3 rounded-xl bg-[#1d1416] text-[#f1e6e6] text-[11px] leading-relaxed overflow-auto whitespace-pre-wrap break-all">${esc(env)}</pre>
      <p class="text-[11px] text-muted mt-3">กุญแจอยู่บนเซิร์ฟเวอร์เท่านั้น ไม่ถูกส่งมาที่เบราว์เซอร์ · ระบบขอสิทธิ์อ่านอย่างเดียว</p></div></div>`;
}
function ggGa(G) {
  const T = G.totals, cur = G.cur.map(x => x.sessions), prev = G.prev.map(x => x.sessions), t = T.cur.sessions;
  const cr = o => o.sessions ? o.keyEvents / o.sessions : 0;
  const DEV = { mobile: 'มือถือ', desktop: 'คอมพิวเตอร์', tablet: 'แท็บเล็ต' }, EV = { booking_submit: 'ฟอร์มขอใบเสนอราคา', whatsapp_click: 'WhatsApp', line_click: 'LINE', phone_click: 'โทร' };
  return `<div class="grid grid-cols-2 xl:grid-cols-4 gap-3">${kpi('ผู้ใช้งาน', nf(T.cur.users), delta(T.cur.users, T.prev.users))}${kpi('เซสชัน', nf(t), delta(t, T.prev.sessions))}${kpi('เวลาใช้งานเฉลี่ย', ggDur(T.cur.avgDur), delta(T.cur.avgDur, T.prev.avgDur), 'นาที:วินาที ต่อเซสชัน')}${kpi('อัตราแปลง', ggPct(cr(T.cur), 2), delta(cr(T.cur), cr(T.prev)), nf(T.cur.keyEvents) + ' key events')}</div>
    <div class="card p-5 mt-4"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><p class="font-medium">เซสชันต่อวัน</p>${legend()}</div>${lineChart(cur, prev, { label: 'เซสชัน', h: 200, labels: G.cur[0]?.h ? G.cur.map(x => x.h) : undefined })}</div>
    <div class="grid xl:grid-cols-3 gap-4 mt-4 items-start">
      <div class="card xl:col-span-2 overflow-hidden"><p class="font-medium px-5 pt-4 pb-2">หน้าที่มีคนดูมากที่สุด</p><div class="overflow-x-auto"><table class="tbl min-w-[560px]"><thead><tr><th>หน้า</th><th class="text-right">การดู</th><th class="text-right">เวลาเฉลี่ย (วิ)</th><th class="text-right">Key events</th></tr></thead><tbody>
        ${G.pages.map(p => `<tr><td><p class="truncate max-w-[300px]">${esc(anPageName(p.path))}</p><p class="text-[11px] text-muted truncate max-w-[300px]">${esc(p.path)}</p></td><td class="text-right tnum">${nf(p.views)}</td><td class="text-right tnum">${Math.round(p.eng)}</td><td class="text-right tnum">${nf(p.keyEvents)}</td></tr>`).join('') || '<tr><td colspan="4" class="text-muted">ยังไม่มีข้อมูลในช่วงนี้</td></tr>'}</tbody></table></div></div>
      <div class="grid gap-4"><div class="card p-5"><p class="font-medium mb-3">ช่องทางที่ลูกค้ามา</p>${ggBars(G.channels.map(r => [esc(r.name), r.sessions]))}</div>
        <div class="card p-5"><p class="font-medium mb-3">ช่องทางติดต่อ (Key events)</p>${ggBars(G.events.map(r => [EV[r.name] || r.name, r.count, r.name]))}</div>
        <div class="card p-5"><p class="font-medium mb-3">อุปกรณ์</p>${ggBars(G.devices.map(r => [DEV[r.name] || esc(r.name), r.sessions]))}</div>
        <div class="card p-5"><p class="font-medium mb-3">ประเทศ</p>${ggBars(G.countries.map(r => [esc(r.name), r.sessions]))}</div></div></div>`;
}
function ggGsc(S) {
  const T = S.totals, ck = S.cur.map(x => x.clicks), pk = S.prev.map(x => x.clicks);
  const qs = S.queries.filter(q => !GA.qLang || (GA.qLang === 'th') === ggTh(q.q)).slice(0, 30);
  const opp = S.queries.filter(q => q.position > 4 && q.position <= 20 && q.impressions >= 30).sort((a, b) => b.impressions - a.impressions).slice(0, 4);
  return `<div class="grid grid-cols-2 xl:grid-cols-4 gap-3">${kpi('คลิก', nf(T.cur.clicks), delta(T.cur.clicks, T.prev.clicks))}${kpi('การแสดงผล', nf(T.cur.impressions), delta(T.cur.impressions, T.prev.impressions))}${kpi('CTR เฉลี่ย', ggPct(T.cur.ctr, 2), delta(T.cur.ctr, T.prev.ctr))}${kpi('อันดับเฉลี่ย', T.cur.position ? T.cur.position.toFixed(1) : '—', delta(T.cur.position, T.prev.position, true), 'ยิ่งน้อยยิ่งดี')}</div>
    <div class="grid xl:grid-cols-2 gap-4 mt-4 items-start">
      <div class="card p-5"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><p class="font-medium">คลิกต่อวัน</p>${legend()}</div>${lineChart(ck, pk, { label: 'คลิก', end: ggEnd(S), labels: S.cur[0]?.h ? S.cur.map(x => x.h) : undefined })}</div>
      <div class="card p-5"><div class="flex flex-wrap items-center justify-between gap-2 mb-3"><p class="font-medium">อันดับเฉลี่ยต่อวัน <span class="text-[11px] text-muted font-normal">(บนสุด = อันดับดีกว่า)</span></p>${legend()}</div>${lineChart(ggPos(S.cur), ggPos(S.prev), { label: '', fmt: v => (+v).toFixed(1), invert: true, end: ggEnd(S), labels: S.cur[0]?.h ? S.cur.map(x => x.h) : undefined })}</div></div>
    <div class="grid xl:grid-cols-3 gap-4 mt-4 items-start">
      <div class="card xl:col-span-2 overflow-hidden"><div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-2"><p class="font-medium">คำค้นหาที่พาคนมาเว็บ</p><div class="flex p-0.5 rounded-full bg-sand">${[['', 'ทั้งหมด'], ['th', 'TH'], ['en', 'EN']].map(([k, l]) => `<button class="h-7 px-3 rounded-full text-[12px] ${GA.qLang === k ? 'bg-white shadow-sm' : 'text-muted'}" onclick="GA.qLang='${k}';vAnalytics()">${l}</button>`).join('')}</div></div>
        <div class="overflow-x-auto"><table class="tbl min-w-[620px]"><thead><tr><th>คำค้นหา</th><th class="text-right">คลิก</th><th class="text-right">การแสดงผล</th><th class="text-right">CTR</th><th class="text-right">อันดับ</th></tr></thead><tbody>
        ${qs.map(q => `<tr><td><span class="lang-b ok mr-1.5">${ggTh(q.q) ? 'TH' : 'EN'}</span>${esc(q.q)}</td><td class="text-right tnum">${nf(q.clicks)}</td><td class="text-right tnum">${nf(q.impressions)}</td><td class="text-right tnum">${ggPct(q.ctr)}</td><td class="text-right tnum">${q.position.toFixed(1)}</td></tr>`).join('') || '<tr><td colspan="5" class="text-muted">ยังไม่มีข้อมูลในช่วงนี้</td></tr>'}</tbody></table></div>
        <p class="text-[11px] text-muted px-5 py-2.5">${fmtD(S.range.startDate)} – ${fmtD(S.range.endDate)} · Google ไม่แสดงคำค้นหาที่มีคนค้นน้อยมาก (เพื่อความเป็นส่วนตัว)</p></div>
      <div class="grid gap-4"><div class="card p-5"><p class="font-medium flex items-center gap-2"><i data-lucide="target" class="w-4 h-4 text-maroon"></i>โอกาสเพิ่มคลิก</p><p class="text-[11.5px] text-muted mt-1">คำที่คนเห็นเยอะแต่ยังอยู่อันดับ 5–20 · ปรับ Title หรือเขียนบทความเพิ่มจะได้คลิกมากขึ้น</p>
        <ul class="mt-3 grid gap-2.5">${opp.map(q => `<li class="rounded-xl bg-sand p-3"><p class="text-[13px]">${esc(q.q)}</p><p class="text-[11.5px] text-muted mt-0.5 tnum">อันดับ ${q.position.toFixed(1)} · เห็น ${nf(q.impressions)} ครั้ง · CTR ${ggPct(q.ctr)}</p><button class="text-[12px] text-maroon mt-1.5" onclick="newArticle()">เขียนบทความสำหรับคำนี้ →</button></li>`).join('') || '<li class="text-[12px] text-muted">ยังไม่มีคำที่เข้าเงื่อนไข</li>'}</ul></div>
        <div class="card p-5"><p class="font-medium mb-3">หน้าที่ได้คลิกจาก Google มากที่สุด</p>${ggBars(S.pages.map(p => [esc(anPageName(ggPath(p.page))), p.clicks, 'อันดับ ' + p.position.toFixed(1)]))}</div></div></div>`;
}
function ggBody() {
  const s = GG.st, D = GG.d[GA.days];
  if (GA.tab === 'api') return ggSetup();
  const which = GA.tab, on = s && (which === 'ga' ? s.ga.on : s.gsc.on);
  if (!D) return GG.loading[GA.days] ? '<div class="card p-10 text-center text-muted">กำลังโหลดข้อมูลจาก Google…</div>' : ggErr({ error: 'ติดต่อเซิร์ฟเวอร์ไม่สำเร็จ', code: 'api' }, which);
  if (!on) return `<div class="card p-6 mb-4"><p class="font-medium">ยังไม่ได้เชื่อม ${which === 'ga' ? 'Google Analytics 4' : 'Search Console'}</p><p class="text-[12.5px] text-muted mt-1">ระหว่างนี้ดูผู้เข้าชมจริงได้ที่แท็บ “ข้อมูลจริง” (ระบบนับเอง)</p></div>${ggSetup()}`;
  const X = which === 'ga' ? D.ga : D.gsc;
  if (!X || X.error) return ggErr(X || { error: 'ไม่มีข้อมูล', code: 'api' }, which);
  return which === 'ga' ? ggGa(X) : ggGsc(X);
}
{ const _va2 = vAnalytics; vAnalytics = function () {
  if (GA.tab === 'overview') GA.tab = 'site';
  const D = GG.d[GA.days];
  const retry = !GG.failAt || Date.now() - GG.failAt > 60_000;
  if (retry && (!GG.st || ((GA.tab === 'ga' || GA.tab === 'gsc') && (!D || Date.now() - D.t > 10 * 60_000)))) ggLoad();
  if (GG.st) Object.assign(GA, { gaOn: GG.st.ga.on, prop: GG.st.ga.property || '', gscOn: GG.st.gsc.on, site: GG.st.gsc.site || GA.site });
  _va2();
  [...$$('#view .tab')].find(b => (b.getAttribute('onclick') || '').includes("GA.tab='overview'"))?.remove();
  $$('#view p').forEach(p => { if (p.textContent.includes('แสดงข้อมูลตัวอย่าง')) p.textContent = /Meta/.test(p.parentElement?.textContent || '') && typeof MS !== 'undefined' && MS.d?.pixelId ? 'เชื่อมต่อแล้ว · Pixel ' + MS.d.pixelId : 'ยังไม่เชื่อมต่อ'; });
  const note = [...$$('#view .rounded-xl')].find(x => x.className.includes('fff8e6'));
  if (note) { const msg = { site: 'แท็บนี้เป็นข้อมูลจริง: ผู้เข้าชมนับจากเว็บไซต์เอง ลีดและการปิดการขายมาจากระบบลีด' }[GA.tab];
    if (msg) note.lastChild.textContent = msg; else note.remove(); }
  if (['ga', 'gsc', 'api'].includes(GA.tab)) { const f = $('#view .fade'); if (f) f.innerHTML = ggBody(); }
  if (GA.days === 1) {   // 24-hour range: the charts are hourly
    $$('#view .card p.font-medium').forEach(p => { const n = p.firstChild; if (n && n.nodeType === 3) n.textContent = n.textContent.replace(/(ต่อวัน|รายวัน)/, 'รายชั่วโมง'); });
    const S = GG.d[1]?.gsc;
    if (GA.tab === 'gsc' && S?.hourly && S.lagHours) { const c = $('#view .fade .grid.xl\\:grid-cols-2'); c?.insertAdjacentHTML('beforebegin', `<p class="text-[11.5px] text-muted mt-3">Search Console มีข้อมูลรายชั่วโมงช้ากว่าจริงประมาณ ${S.lagHours} ชม. · กราฟแสดง 24 ชม. ล่าสุดที่ Google มีข้อมูล</p>`); }
  }
  icons();
}; PAGES.find(p => p[0] === 'analytics')[3] = vAnalytics; }

/* =====================================================================
   ข้อมูลจริงแทนข้อมูลตัวอย่างที่เหลือ: แดชบอร์ด (ผู้เข้าชม), SEO (ภาพรวม Search Console + อันดับคีย์เวิร์ด), Meta
   ===================================================================== */
/** Google data for a range, shared with วิเคราะห์เว็บไซต์ (GG); calls `then` after it arrives */
function ggGet(days, then) {
  const D = GG.d[days];
  if (D && Date.now() - D.t < 10 * 60_000) return D;
  if (!GG.loading[days] && (!GG.failAt || Date.now() - GG.failAt > 60_000)) { GG.loading[days] = true;
    api('GET', 'analytics/google?days=' + days).then(d => { GG.d[days] = { ...d, t: Date.now() }; GG.st = d.status; })
      .catch(() => { GG.failAt = Date.now(); }).finally(() => { GG.loading[days] = false; then && then(); }); }
  return D || null;
}
const ggOk = x => x && !x.error;

/* ---------- แดชบอร์ด → ผู้เข้าชมเว็บ 7 วัน (ตัวนับของเว็บเอง + คลิกจาก Google) ---------- */
const DT = { d: null, at: 0, loading: false };
function dashTraffic() {
  if (!can('seo')) return;
  // sits under "ต้องทำตอนนี้" on the dashboard (that card has room below its list)
  const box = [...$$('#view .card')].find(c => c.textContent.includes('ต้องทำตอนนี้')); if (!box) return;
  const again = () => { if (CUR === 'dashboard') { $('#dashTr')?.remove(); dashTraffic(); icons(); } };
  if (!DT.loading && (!DT.d || Date.now() - DT.at > 5 * 60_000)) { DT.loading = true;
    api('GET', 'analytics?days=7').then(d => { DT.d = d; DT.at = Date.now(); }).catch(() => {}).finally(() => { DT.loading = false; again(); }); }
  const g = ggGet(7, again)?.gsc, D = DT.d;
  const s = D ? sum(D.cur.map(x => x.sessions)) : 0, ps = D ? sum(D.prev.map(x => x.sessions)) : 0, v = D ? sum(D.cur.map(x => x.views)) : 0;
  const ch = ps ? Math.round((s - ps) / ps * 100) : null;
  box.insertAdjacentHTML('beforeend', `<div id="dashTr" class="border-t border-line mt-5 pt-1"><p class="font-medium mt-4 flex items-center gap-2"><i data-lucide="chart-line" class="w-4 h-4 text-maroon"></i>ผู้เข้าชมเว็บ 7 วัน</p>
    <div class="mt-3 flex items-end justify-between gap-3 cursor-pointer" onclick="GA.tab='site';go('analytics')">${!D ? '<p class="text-[12px] text-muted">กำลังโหลด…</p>' : `<div><p class="text-[22px] font-medium tnum leading-none">${nf(s)}</p>
      <p class="text-[11.5px] text-muted mt-1">เซสชัน · ${nf(v)} เพจวิว${ggOk(g) ? ` · ${nf(g.totals.cur.clicks)} คลิกจาก Google` : ''}</p></div>
      ${ch === null ? '<span class="text-[11.5px] text-muted whitespace-nowrap">ยังไม่มีข้อมูลเทียบ</span>' : `<span class="text-[12px] tnum ${ch >= 0 ? 'text-[#1e7a46]' : 'text-[#a3222c]'}">${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch)}%</span>`}`}</div></div>`);
}

{ const _dash = PAGES.find(p => p[0] === 'dashboard')[3]; PAGES.find(p => p[0] === 'dashboard')[3] = function () { _dash.apply(this, arguments); dashTraffic(); icons(); }; }

/* ---------- SEO → ภาพรวม: การ์ด Search Console ใช้ข้อมูลจริง 28 วัน ---------- */
{ const _so = seoOverview; seoOverview = function (P) {
  GSC.on = false;   // the original card only knows sample numbers; it is replaced below
  const html = _so(P), S = ggGet(28, () => { if (CUR === 'seo' && SEOV.tab === 'overview') vSeo(); })?.gsc;
  if (!ggOk(S)) return html;
  const T = S.totals.cur, c = S.cur.map(x => x.clicks), mx = Math.max(1, ...c);
  const card = `<div class="flex items-center justify-between"><p class="font-medium">Google Search Console · 28 วัน</p><span class="text-[11px] text-muted">ข้อมูลจริง · ถึง ${fmtD(S.range.endDate)}</span></div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">${[['คลิก', nf(T.clicks)], ['การแสดงผล', nf(T.impressions)], ['CTR เฉลี่ย', ggPct(T.ctr)], ['อันดับเฉลี่ย', T.position ? T.position.toFixed(1) : '—']].map(([l, v]) => `<div><p class="text-[11px] text-muted">${l}</p><p class="text-[20px] font-medium tnum">${v}</p></div>`).join('')}</div>
    <div class="flex items-end gap-[2px] h-28 border-b border-line mt-4">${S.cur.map(x => `<div class="flex-1 h-full flex items-end" title="${fmtD(x.date)} · ${x.clicks} คลิก"><div class="w-full rounded-t-[4px] bg-maroon/80" style="height:${x.clicks / mx * 100}%"></div></div>`).join('')}</div>
    <div class="flex justify-between text-[10.5px] text-muted mt-1"><span>${fmtD(S.cur[0]?.date)}</span><button class="text-maroon" onclick="GA.tab='gsc';go('analytics')">ดูรายละเอียด →</button><span>${fmtD(S.range.endDate)}</span></div>`;
  return html.replace(/<div class="flex flex-col sm:flex-row sm:items-center gap-4"><div class="w-11 h-11 rounded-xl bg-sand grid place-items-center shrink-0"><i data-lucide="plug"[\s\S]*?<\/button><\/div>/, card);
}; }

/* ---------- SEO → ภาพรวม: Core Web Vitals จริงจาก PageSpeed Insights (/api/admin/analytics/pagespeed) ---------- */
const PSI = { d: null, loading: false };
function psiLoad(refresh) {
  if (PSI.loading) return; PSI.loading = true; if (refresh) vSeo();
  api('GET', 'analytics/pagespeed' + (refresh ? '?refresh=1' : '')).then(d => { PSI.d = d; }).catch(e => { PSI.d = { error: e.message }; })
    .finally(() => { PSI.loading = false; if (CUR === 'seo' && SEOV.tab === 'overview') vSeo(); });
}
function psiCard() {
  if (!PSI.d && !PSI.loading) psiLoad();
  const D = PSI.d, head = `<div class="flex justify-between items-center"><p class="font-medium">Core Web Vitals</p><button class="text-[11px] text-maroon disabled:text-muted" ${PSI.loading ? 'disabled' : ''} onclick="psiLoad(true)">${PSI.loading ? 'กำลังตรวจ… (~30 วินาที)' : 'ตรวจใหม่'}</button></div>`;
  if (!D || PSI.loading && !D) return `<div class="rounded-2xl ring-1 ring-line p-5">${head}<p class="text-[12px] text-muted mt-3">กำลังตรวจความเร็วหน้าแรกด้วย PageSpeed Insights…</p></div>`;
  if (D.error) return `<div class="rounded-2xl ring-1 ring-line p-5">${head}<p class="text-[12px] text-[#a3222c] mt-3">ตรวจไม่สำเร็จ: ${esc(D.error)}</p><p class="text-[11px] text-muted mt-1">ลองกด “ตรวจใหม่” ภายหลัง · ถ้าตรวจบ่อยควรใส่ PAGESPEED_API_KEY ใน .env</p></div>`;
  const f = D.field, fmtMs = m => m.v >= 1000 ? (m.v / 1000).toFixed(1) + ' วินาที' : Math.round(m.v) + ' ms';
  const rows = f ? [['LCP', f.lcp, 'โหลดภาพหลัก', fmtMs], ['INP', f.inp, 'ตอบสนองการกด', fmtMs], ['CLS', f.cls, 'หน้าขยับระหว่างโหลด', m => m.v.toFixed(2)]]
    : [['LCP', D.lab.lcp, 'โหลดภาพหลัก', fmtMs], ['TBT', D.lab.tbt, 'หน้าค้างระหว่างโหลด', fmtMs], ['CLS', D.lab.cls, 'หน้าขยับระหว่างโหลด', m => m.v.toFixed(2)]];
  return `<div class="rounded-2xl ring-1 ring-line p-5">${head}
    <div class="mt-3 grid gap-2.5">${rows.filter(r => r[1]).map(([k, m, l, fm]) => `<div class="flex items-center gap-3"><span class="w-10 text-[12px] font-medium">${k}</span><span class="flex-1 text-[12px] text-muted">${l}</span><span class="lang-b ${m.cat}">${fm(m)}</span></div>`).join('')}</div>
    <p class="text-[11px] text-muted mt-3">${f ? 'จากผู้ใช้ Chrome จริง 28 วัน' : 'ผลทดสอบ (lab) · Google ยังมีข้อมูลผู้ใช้จริงไม่พอ'} · มือถือ · คะแนน ${D.score}/100 · ${esc(D.url.replace(/^https?:\/\//, ''))} · ${new Date(D.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</p></div>`;
}
{ const _so2 = seoOverview; seoOverview = function (P) {
  return _so2(P).replace(/<div class="rounded-2xl ring-1 ring-line p-5"><div class="flex justify-between"><p class="font-medium">Core Web Vitals<\/p>[\s\S]*?ระบบจริงดึงจาก PageSpeed Insights API ทุกสัปดาห์<\/p><\/div>/, () => psiCard());
}; }

/* ---------- SEO → คีย์เวิร์ด: อันดับจริงจาก Search Console · คีย์เวิร์ดที่ติดตามบันทึกใน ตั้งค่า SEO (SSET.kwTrack) ---------- */
KW.length = 0;
(Array.isArray(SSET.kwTrack) ? SSET.kwTrack : []).forEach(k => k && k.q && KW.push({ q: String(k.q), l: k.l === 'en' ? 'en' : 'th', url: String(k.url || ''), pos: null, ch: 0 }));
const KWV = { all: false };
seoKw = function () {
  const nv = KW.map(({ q, l, url }) => ({ q, l, url }));
  if (JSON.stringify(nv) !== JSON.stringify(SSET.kwTrack || [])) SSET.kwTrack = nv;   // autosaved with the SEO settings
  const S = ggGet(28, () => { if (CUR === 'seo' && SEOV.tab === 'keywords') vSeo(); })?.gsc, on = ggOk(S), loading = !S && GG.loading[28];
  const pos = q => { const r = on && S.qpos[q.trim().toLowerCase()]; return r ? { p: r[0], imp: r[1], clk: r[2], prev: S.qprev[q.trim().toLowerCase()] ?? null } : null; };
  const cell = r => !on ? '<span class="text-muted">—</span>' : r ? `${r.p.toFixed(1)}` : '<span class="text-muted text-[11.5px]">ยังไม่ติดอันดับ</span>';
  const chg = r => { if (!r || r.prev == null) return '<span class="text-muted">—</span>'; const d = Math.round((r.prev - r.p) * 10) / 10;
    return d > 0 ? `<span class="text-[#1e7a46] inline-flex items-center gap-0.5"><i data-lucide="trending-up" class="w-3.5 h-3.5"></i>${d}</span>` : d < 0 ? `<span class="text-[#a3222c] inline-flex items-center gap-0.5"><i data-lucide="trending-down" class="w-3.5 h-3.5"></i>${-d}</span>` : '<span class="text-muted">0</span>'; };
  const P = seoPages(), kwUse = {}, mine = [];
  P.forEach(p => p.kw && LANGS.forEach(([k]) => { const w = (p.kw[k] || '').trim(); if (!w) return; (kwUse[w.toLowerCase()] ??= []).push(p.name); mine.push({ q: w, l: k, url: p.url[k], name: p.name }); }));
  const cannib = Object.entries(kwUse).filter(([, v]) => v.length > 1);
  const rows = mine.map(m => ({ ...m, r: pos(m.q) })).sort((a, b) => (b.r ? b.r.imp : -1) - (a.r ? a.r.imp : -1));
  const shown = KWV.all ? rows : rows.slice(0, 30);
  const sugg = on ? Object.entries(S.qpos).filter(([q]) => !KW.some(k => k.q.toLowerCase() === q)).sort((a, b) => b[1][1] - a[1][1]).slice(0, 8) : [];
  const note = loading ? 'กำลังโหลดอันดับจาก Search Console…' : on ? `อันดับเฉลี่ยจาก Search Console ${fmtD(S.range.startDate)} – ${fmtD(S.range.endDate)} · เทียบ 28 วันก่อนหน้า` : 'เชื่อม Search Console ที่ วิเคราะห์เว็บไซต์ → เชื่อมต่อ API เพื่อดูอันดับจริง';
  const head = '<thead><tr><th>คีย์เวิร์ด</th><th>ภาษา</th><th>หน้าเป้าหมาย</th><th class="text-right">การแสดงผล</th><th class="text-center">อันดับ</th><th class="text-center">เทียบช่วงก่อน</th><th></th></tr></thead>';
  return `<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3"><p class="text-[12px] text-muted">${note}</p><button class="btn btn-p" onclick="seoAddKw()"><i data-lucide="plus" class="w-4 h-4"></i>เพิ่มคีย์เวิร์ด</button></div>
    ${cannib.length ? `<div class="rounded-xl bg-[#fff6e5] text-[#7a4a00] p-3.5 mb-3 text-[12.5px]"><b class="font-medium">คีย์เวิร์ดชนกัน:</b> ${cannib.map(([w, v]) => `“${esc(w)}” ใช้ใน ${v.length} หน้า (${v.map(esc).join(', ')})`).join(' · ')} · ควรให้ 1 คีย์เวิร์ดหลักต่อ 1 หน้า</div>` : ''}
    <p class="font-medium mb-2">คีย์เวิร์ดที่ติดตาม</p>
    <div class="overflow-x-auto rounded-xl ring-1 ring-line"><table class="tbl min-w-[760px]">${head}<tbody>
    ${KW.map((w, n) => { const r = pos(w.q); return `<tr><td>${esc(w.q)}</td><td><span class="lang-b ok">${w.l.toUpperCase()}</span></td><td class="text-muted truncate max-w-[260px]">${esc(w.url) || '—'}</td><td class="text-right tnum">${r ? nf(r.imp) : '—'}</td><td class="text-center tnum">${cell(r)}</td><td class="text-center tnum">${chg(r)}</td>
      <td class="text-right"><button class="btn btn-g !px-2" title="เลิกติดตาม" onclick="KW.splice(${n},1);vSeo()"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`; }).join('') || '<tr><td colspan="7" class="text-muted">ยังไม่ได้เลือกคีย์เวิร์ดที่จะติดตาม · กด “เพิ่มคีย์เวิร์ด” หรือเลือกจากคำที่คนค้นจริงด้านล่าง</td></tr>'}</tbody></table></div>
    ${sugg.length ? `<div class="mt-3 flex flex-wrap items-center gap-2 text-[12px]"><span class="text-muted">คำที่คนค้นแล้วเจอเว็บเรามากที่สุด:</span>${sugg.map(([q, r]) => `<button class="h-7 px-2.5 rounded-full bg-sand hover:bg-maroon-50 inline-flex items-center gap-1" onclick="KW.push({q:${esc(JSON.stringify(q))},l:'${ggTh(q) ? 'th' : 'en'}',url:'',pos:null,ch:0});vSeo()"><i data-lucide="plus" class="w-3 h-3"></i>${esc(q)} <span class="text-muted tnum">#${r[0].toFixed(0)}</span></button>`).join('')}</div>` : ''}
    <p class="font-medium mt-6 mb-2">คีย์เวิร์ดหลักของแต่ละหน้า <span class="text-[11.5px] text-muted font-normal">(ตั้งในหน้าแก้ไขบทความ / เรือ · ${rows.length} รายการ)</span></p>
    <div class="overflow-x-auto rounded-xl ring-1 ring-line"><table class="tbl min-w-[760px]">${head}<tbody>
    ${shown.map(m => `<tr><td>${esc(m.q)}</td><td><span class="lang-b ok">${m.l.toUpperCase()}</span></td><td class="text-muted truncate max-w-[260px]" title="${esc(m.url)}">${esc(m.name)}</td><td class="text-right tnum">${m.r ? nf(m.r.imp) : '—'}</td><td class="text-center tnum">${cell(m.r)}</td><td class="text-center tnum">${chg(m.r)}</td><td></td></tr>`).join('') || '<tr><td colspan="7" class="text-muted">ยังไม่มีหน้าที่ตั้งคีย์เวิร์ดหลัก</td></tr>'}</tbody></table></div>
    ${rows.length > 30 ? `<button class="btn btn-o !h-8 mt-3" onclick="KWV.all=!KWV.all;vSeo()">${KWV.all ? 'แสดงน้อยลง' : `แสดงทั้งหมด ${rows.length} รายการ`}</button>` : ''}`;
};

/* ---------- ศูนย์ SEO → คีย์เวิร์ด: summary cards + one rankings table ----------
   Source: the Search Console API when it is connected (28 days, compared with the 28 days before),
   otherwise the last Queries.csv imported from Search Console (compared with the import before it). */
const KWI = { d: null, loading: false, f: '', q: '', sort: 'imp', dir: -1, page: 0 };
function kwiLoad() {
  if (KWI.loading || KWI.d || !can('seo')) return; KWI.loading = true;
  api('GET', 'settings/keywords').then(d => { KWI.d = d; }).catch(() => { KWI.d = { cur: null, prev: null }; })
    .finally(() => { KWI.loading = false; if (CUR === 'seo' && SEOV.tab === 'keywords') vSeo(); });
}
/** Search Console "Queries.csv" (any export language): query, clicks, impressions, CTR, position */
function kwParseCsv(text) {
  const rows = [], lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  const split = l => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map(s => s.trim()); };
  const h = split(lines[0] || '').map(s => s.toLowerCase());
  const col = (re, d) => { const i = h.findIndex(x => re.test(x)); return i >= 0 ? i : d; };
  const iq = col(/quer|คำค้น|search/, 0), ic = col(/click|คลิก/, 1), ii = col(/impr|การแสดงผล/, 2), it = col(/ctr/, 3), ip = col(/posi|ตำแหน่ง|อันดับ/, 4);
  if (h.length < 4 || !/[a-zก-๙]/i.test(h[iq] || '')) return { rows, bad: true };
  const n = s => Number(String(s || '').replace(/[%\s]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.')) || 0;
  for (const l of lines.slice(1)) { const c = split(l); if (!c[iq]) continue;
    const ctr = n(c[it]); rows.push({ q: c[iq], clicks: Math.round(n(c[ic])), imp: Math.round(n(c[ii])), ctr: /%/.test(c[it] || '') || ctr > 1 ? ctr / 100 : ctr, pos: n(c[ip]) }); }
  return { rows, bad: !rows.length };
}
function kwImportFile(files) {
  const f = files?.[0]; if (!f) return;
  if (/\.zip$/i.test(f.name)) return toast('แตกไฟล์ .zip ก่อน แล้วเลือกไฟล์ Queries.csv (หรือ “คำค้นหา.csv”)');
  f.text().then(t => {
    const r = kwParseCsv(t); if (r.bad) return toastErr('อ่านไฟล์ไม่ได้ · ใช้ไฟล์ Queries.csv จาก Search Console → ผลการค้นหา → ส่งออก');
    toast(`กำลังนำเข้า ${r.rows.length} คีย์เวิร์ด…`);
    api('PUT', 'settings/keywords', { rows: r.rows, file: f.name }).then(d => { KWI.d = d; KWI.page = 0; AUDIT_DIRTY = true; vSeo(); toast(`นำเข้าแล้ว ${d.cur.rows.length} คีย์เวิร์ด${d.prev ? ' · เทียบกับครั้งก่อนให้แล้ว' : ''}`); }).catch(fail);
  });
}
function kwData() {
  const S = typeof ggGet === 'function' ? ggGet(28, () => { if (CUR === 'seo' && SEOV.tab === 'keywords') vSeo(); })?.gsc : null;
  if (ggOk(S) && Object.keys(S.qpos || {}).length) {
    const rows = Object.entries(S.qpos).map(([q, [pos, imp, clicks]]) => ({ q, pos, imp, clicks, ctr: imp ? clicks / imp : 0, prev: S.qprev[q] ?? null }));
    return { rows, src: `Search Console · ${fmtD(S.range.startDate)} – ${fmtD(S.range.endDate)}`, cmp: 'เทียบ 28 วันก่อน', api: true };
  }
  kwiLoad(); const D = KWI.d;
  if (!D?.cur) return { rows: [], src: KWI.loading || !D ? 'กำลังโหลด…' : '', cmp: '', none: !!D };
  const pm = new Map((D.prev?.rows || []).map(r => [r.q.toLowerCase(), r.pos]));
  return { rows: D.cur.rows.map(r => ({ ...r, prev: D.prev ? pm.get(r.q.toLowerCase()) ?? null : undefined })), src: `นำเข้าจาก Search Console · ${esc(D.cur.file || 'CSV')} · ${fmtD(iso(new Date(D.cur.at)))}`, cmp: D.prev ? `เทียบไฟล์ ${fmtD(iso(new Date(D.prev.at)))}` : 'นำเข้าครั้งแรก' };
}
seoKw = function () {
  const K = kwData(), R = K.rows, top3 = R.filter(r => r.pos && r.pos <= 3.5).length, p1 = R.filter(r => r.pos && r.pos <= 10.5).length, p2 = R.filter(r => r.pos > 10.5 && r.pos <= 20.5).length;
  // the page that targets the query: a page whose main keyword is the query, or a tracked keyword's page
  const tgt = {}; seoPages().forEach(p => p.kw && LANGS.forEach(([k]) => { const w = (p.kw[k] || '').trim().toLowerCase(); if (w && p.url[k]) tgt[w] ??= p.url[k]; }));
  KW.forEach(w => { if (w.url) tgt[w.q.toLowerCase()] ??= w.url; });
  const card = (l, v, s, ic, f) => `<button class="card p-5 text-left grid gap-1 ${KWI.f === f && f ? 'ring-2 ring-maroon' : ''}" onclick="KWI.f=KWI.f==='${f}'?'':'${f}';KWI.page=0;vSeo()"><span class="flex items-start justify-between gap-2"><span class="text-[12.5px] text-muted">${l}</span><span class="w-9 h-9 rounded-full bg-white grid place-items-center shrink-0" style="margin:-4px -4px 0 0;box-shadow:0 4px 14px -8px rgb(58 0 7/.45)"><i data-lucide="${ic}" class="w-4 h-4"></i></span></span><span class="text-[24px] font-medium tnum leading-tight mt-2">${nf(v)}</span><span class="text-[12px] text-muted">${s}</span></button>`;
  const cards = `<div data-kwcards class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">${card('คีย์เวิร์ดที่ติดตาม', R.length, K.api ? 'จาก Search Console 28 วัน' : 'นำเข้าจาก Search Console', 'search', '')}${card('ติด Top 3', top3, R.length ? `${Math.round(top3 / R.length * 100)}% ของทั้งหมด` : '&nbsp;', 'trending-up', 'top3')}${card('ติดหน้าแรก', p1, 'อันดับ 1–10', 'chart-column', 'p1')}${card('อันดับ 11–20', p2, 'ดันขึ้นหน้าแรกได้', 'sparkles', 'p2')}</div>`;
  let L = R.filter(r => KWI.f === 'top3' ? r.pos <= 3.5 : KWI.f === 'p1' ? r.pos <= 10.5 : KWI.f === 'p2' ? r.pos > 10.5 && r.pos <= 20.5 : true).filter(r => !KWI.q || r.q.toLowerCase().includes(KWI.q.toLowerCase()));
  const sk = KWI.sort, chg = r => r.prev == null ? null : r.prev - r.pos;
  L.sort((a, b) => KWI.dir * ((sk === 'q' ? a.q.localeCompare(b.q, 'th') : sk === 'chg' ? (chg(a) ?? -999) - (chg(b) ?? -999) : (a[sk] || 0) - (b[sk] || 0))) || b.imp - a.imp);
  const per = 50, pages = Math.max(1, Math.ceil(L.length / per)); KWI.page = Math.min(KWI.page, pages - 1); const view = L.slice(KWI.page * per, KWI.page * per + per);
  const th = (k, l, cls = '') => `<th class="${cls} cursor-pointer select-none whitespace-nowrap" onclick="KWI.dir=KWI.sort==='${k}'?-KWI.dir:${k === 'q' || k === 'pos' ? 1 : -1};KWI.sort='${k}';vSeo()">${l}${KWI.sort === k ? (KWI.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`;
  const posB = p => !p ? '—' : `<span class="lang-b ${p <= 3.5 ? 'ok' : p <= 10.5 ? 'ok' : p <= 20.5 ? 'mid' : ''} tnum">${p.toFixed(1)}</span>`;
  const chB = r => { if (r.prev === undefined) return '<span class="text-muted">—</span>'; if (r.prev === null) return '<span class="lang-b">ใหม่</span>'; const d = Math.round((r.prev - r.pos) * 10) / 10;
    return d > 0 ? `<span class="text-[#1e7a46] inline-flex items-center gap-0.5 tnum"><i data-lucide="trending-up" class="w-3.5 h-3.5"></i>${d}</span>` : d < 0 ? `<span class="text-[#a3222c] inline-flex items-center gap-0.5 tnum"><i data-lucide="trending-down" class="w-3.5 h-3.5"></i>${-d}</span>` : '<span class="text-muted">0</span>'; };
  const empty = K.none ? 'ยังไม่มีข้อมูล · กด “นำเข้า CSV” แล้วเลือกไฟล์ Queries.csv จาก Search Console' : K.src === 'กำลังโหลด…' ? 'กำลังโหลด…' : 'ไม่พบคีย์เวิร์ดที่ตรงเงื่อนไข';
  return `${cards}<div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3"><div><p class="font-medium">อันดับคีย์เวิร์ด${KWI.f ? ` <span class="text-muted font-normal text-[12.5px]">· ${{ top3: 'ติด Top 3', p1: 'ติดหน้าแรก', p2: 'อันดับ 11–20' }[KWI.f]} <button class="text-maroon" onclick="KWI.f='';vSeo()">ดูทั้งหมด</button></span>` : ''}</p>${K.src && K.src !== 'กำลังโหลด…' ? `<p class="text-[11.5px] text-muted mt-0.5">${K.src}${K.cmp ? ' · ' + K.cmp : ''}</p>` : ''}</div>
      <div class="flex flex-wrap items-center gap-2">${R.length ? `<input class="inp !h-9" style="width:200px" placeholder="ค้นหาคีย์เวิร์ด…" value="${esc(KWI.q)}" onkeydown="if(event.key==='Enter'){KWI.q=this.value;KWI.page=0;vSeo()}"/>` : ''}
        <label class="btn btn-o cursor-pointer" title="Search Console → ผลการค้นหา → ส่งออก → ดาวน์โหลด CSV · แตกไฟล์แล้วเลือก Queries.csv"><i data-lucide="upload" class="w-3.5 h-3.5"></i>นำเข้า CSV<input type="file" accept=".csv,text/csv" class="hidden" onchange="kwImportFile(this.files);this.value=''"/></label></div></div>
    <div class="overflow-x-auto"><table class="tbl min-w-[860px]"><thead><tr>${th('q', 'คีย์เวิร์ด')}${th('pos', 'อันดับ', 'text-center')}${th('chg', 'เทียบครั้งก่อน', 'text-center')}${th('imp', 'แสดงผล', 'text-right')}${th('clicks', 'คลิก', 'text-right')}${th('ctr', 'CTR', 'text-right')}<th>URL</th></tr></thead><tbody>
    ${view.map(r => { const u = tgt[r.q.toLowerCase()]; return `<tr><td><span class="lang-b mr-1.5">${ggTh(r.q) ? 'TH' : 'EN'}</span>${esc(r.q)}</td><td class="text-center">${posB(r.pos)}</td><td class="text-center">${chB(r)}</td><td class="text-right tnum">${nf(r.imp)}</td><td class="text-right tnum">${nf(r.clicks)}</td><td class="text-right tnum">${(r.ctr * 100).toFixed(1)}%</td>
      <td class="text-muted truncate max-w-[260px]">${u ? `<a class="hover:text-maroon" href="https://${SITE}${esc(u)}" target="_blank" rel="noopener">${esc(decodeURI(u))}</a>` : '—'}</td></tr>`; }).join('') || `<tr><td colspan="7" class="text-center text-muted py-14">${empty}</td></tr>`}
    </tbody></table></div>
    ${pages > 1 ? `<div class="flex items-center justify-between px-5 py-3 border-t border-line text-[12px] text-muted"><span>${L.length} คีย์เวิร์ด</span><div class="flex items-center gap-1"><button class="btn btn-g !h-8 !px-2" ${KWI.page ? '' : 'disabled'} onclick="KWI.page--;vSeo()"><i data-lucide="chevron-left" class="w-4 h-4"></i></button><span class="tnum">${KWI.page + 1} / ${pages}</span><button class="btn btn-g !h-8 !px-2" ${KWI.page < pages - 1 ? '' : 'disabled'} onclick="KWI.page++;vSeo()"><i data-lucide="chevron-right" class="w-4 h-4"></i></button></div></div>` : ''}`;
};
/* the cards sit between the tabs and the table card, and the table runs edge to edge (like Meta ทุกหน้า) */
{ const _vk = vSeo; vSeo = function () {
  _vk();
  const gsc = typeof GG !== 'undefined' && GG.st?.gsc?.on, sub = $('#view h2 + p');
  if (sub && !gsc && KWI.d?.cur) sub.textContent = `ข้อมูลจาก Google Search Console · นำเข้าล่าสุด ${fmtD(iso(new Date(KWI.d.cur.at)))} (${nf(KWI.d.cur.rows.length)} คีย์เวิร์ด)`;
  if (SEOV.tab !== 'keywords') return;
  const c = $('#seoBody [data-kwcards]'), b = $('#seoBody'); if (c) $('#view .tabbar')?.insertAdjacentElement('afterend', c);
  if (b) { b.classList.remove('p-4', 'sm:p-5'); b.classList.add('p-0'); }
  icons();
}; PAGES.find(p => p[0] === 'seo')[3] = vSeo; }

/* =====================================================================
   ศูนย์ SEO → ตรวจสุขภาพ: one pass over everything the site publishes (articles TH/EN, boats, page meta,
   redirects, 404 hits, robots.txt, sitemap, schema, speed) → a list of problems by severity, each with
   the pages it affects and a way to open them. Runs in the browser on the same data the site is built from.
   ===================================================================== */
const SHX = { at: 0, nf: null, nfLoading: false, open: null };
const SHX_LV = { crit: ['ร้ายแรง', '#a3222c', '#fdecec'], warn: ['ควรแก้', '#9a5b00', '#fff4e0'], tip: ['แนะนำ', '#6b5e60', '#f3eeee'] };
const HS_STATIC = ['/', '/yacht-charter', '/blog', '/destinations', '/about-us', '/privacy-policy', '/terms-and-conditions', '/cookie-preferences', '/contact'];
function hsNfLoad() {
  if (SHX.nf || SHX.nfLoading || !can('seo')) return; SHX.nfLoading = true;
  api('GET', 'analytics?days=90').then(d => { SHX.nf = d.notFound || []; }).catch(() => { SHX.nf = []; })
    .finally(() => { SHX.nfLoading = false; if (CUR === 'seo' && SEOV.tab === 'health') vSeo(); });
}
/** internal link target → 'ok' | 'redirect' | 'hidden' | 'broken' | null (not a page link) */
function hsLink(href) {
  let u = String(href || '').trim();
  if (!u || /^(mailto|tel|javascript|#)/i.test(u)) return null;
  const m = u.match(/^https?:\/\/(?:www\.)?boattripthailand\.com(\/.*)?$/i); if (/^https?:/i.test(u) && !m) return null; if (m) u = m[1] || '/';
  if (!u.startsWith('/')) return null;
  let p = u.split(/[?#]/)[0]; try { p = decodeURIComponent(p); } catch (e) { }
  if (/^\/(uploads|img|boats|site|admin|api|_next)\//.test(p) || /\.[a-z0-9]{2,5}$/i.test(p)) return null;
  const q = p.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  if (HS_STATIC.includes(q) || q.startsWith('/destinations/')) return 'ok';
  if (q.startsWith('/yacht-charter/')) { const b = bySlug(q.slice(15)); return b ? (b.active ? 'ok' : 'hidden') : REDIR.some(r => r.from === p.replace(/\/+$/, '')) ? 'redirect' : 'broken'; }
  if (q.startsWith('/blog/')) { const s = q.slice(6), a = ART.find(x => x.slug.th === s || x.slug.en === s); return a ? (a.status === 'published' ? 'ok' : 'hidden') : REDIR.some(r => r.from === p.replace(/\/+$/, '')) ? 'redirect' : 'broken'; }
  return REDIR.some(r => r.from === p.replace(/\/+$/, '')) ? 'redirect' : 'broken';
}
const hsHrefs = html => [...String(html || '').matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map(m => m[1].replace(/&amp;/g, '&'));
/** every link, image and heading of one article language */
function hsScanArt(a, k) {
  const B = blocksOf(a, k), links = [], imgs = [], heads = [], text = [];
  for (const b of B) {
    const html = [b.html, ...(b.items || []).flatMap(x => [x.q, x.a]), ...(b.cols || []).map(c => c.html)].filter(Boolean).join(' ');
    hsHrefs(html).forEach(h => links.push(h));
    if (b.t === 'boat' && b.slug) links.push('/yacht-charter/' + b.slug);
    if (b.t === 'btn' && /^(\/|https?:)/.test(b.href || '')) links.push(b.href);
    if (b.t === 'img' && b.src) imgs.push(b.alt);
    if (b.t === 'grid') (b.cells || []).filter(c => c.src).forEach(c => imgs.push(c.alt));
    if (b.t === 'cols') (b.cols || []).filter(c => c.k === 'img' && c.src).forEach(c => imgs.push(c.alt));
    if (b.t === 'h') heads.push(+b.lv || 2);
    if (b.t === 'p' || b.t === 'quote') text.push(txtOf(b.html));
  }
  return { B, links, imgs, heads, text, faq: B.some(b => b.t === 'faq' && (b.items || []).some(x => txtOf(x.q))) };
}
function seoHealth() {
  const C = {}, add = (k, lv, l, impact, it, fix) => { (C[k] ??= { k, lv, l, impact, items: [], fix }).items.push(it); };
  const def = (k, lv, l, impact, fix) => { C[k] ??= { k, lv, l, impact, items: [], fix }; };
  const artIt = (a, k, sub) => ({ name: a.title[k] || a.title.th || a.title.en || 'บทความไม่มีชื่อ', sub: (k ? k.toUpperCase() + ' · ' : '') + (sub || ''), go: `closeDrawer();go('articles/${a.id}')` });
  const boatIt = (b, sub) => ({ name: b.name, sub: sub || '', go: `closeDrawer();boatEdit('${b.slug}')` });
  // checks that always show (passed or not), so the list doubles as a checklist
  [['link_broken', 'crit', 'มีลิงก์ภายในเสีย (ชี้ไปหน้าที่ไม่มี)', 'ผู้อ่านเจอหน้า 404 · Google เสียเวลาเก็บข้อมูล'], ['dup_title', 'crit', 'Title ซ้ำกันหลายหน้า', 'Google ไม่รู้ว่าหน้าไหนควรขึ้น · แย่งอันดับกันเอง', "closeDrawer();SEOV.tab='pages';SEOV.issue='dup';vSeo()"],
   ['no_title', 'crit', 'หน้าไม่มี Title', 'Google ตั้งชื่อหน้าให้เอง มักไม่ตรงคำค้น', "closeDrawer();SEOV.tab='pages';SEOV.issue='t_miss';vSeo()"],
   ['auto_title', 'warn', 'บทความยังไม่ได้ตั้ง SEO Title', 'เว็บใช้ “ชื่อบทความ | Boat Trip Thailand” แทน ซึ่งมักยาวเกินจนถูกตัด · ใช้ แก้ไขอัตโนมัติ ในแท็บ Meta ทุกหน้าได้', "closeDrawer();SEOV.tab='pages';SEOV.type='article';SEOV.issue='t_miss';vSeo()"], ['boat_noimg', 'crit', 'เรือที่แสดงบนเว็บแต่ไม่มีรูป', 'ลูกค้าไม่กด · การ์ดเรือและรูปแชร์ว่าง'],
   ['noindex', 'warn', 'หน้าสำคัญตั้งเป็น noindex', 'หน้านี้จะไม่ขึ้นใน Google เลย'], ['link_redirect', 'warn', 'ลิงก์ภายในผ่าน redirect', 'ช้าลงหนึ่งจังหวะ · ควรชี้ไป URL ใหม่ตรงๆ'], ['link_hidden', 'warn', 'ลิงก์ไปเรือหรือบทความที่ซ่อนอยู่', 'คนกดแล้วเจอหน้าที่ไม่ได้เผยแพร่'],
   ['kw_title', 'warn', 'คีย์เวิร์ดไม่อยู่ในหัวข้อ', 'อันดับต่ำกว่าที่ควร'], ['alt', 'warn', 'รูปในบทความไม่มี Alt text', 'Google Images หาไม่เจอ · ผู้พิการทางสายตาไม่รู้ว่ารูปคืออะไร'], ['thin', 'warn', 'เนื้อหาน้อยเกินไป', 'Google มองว่าไม่ช่วยตอบคำถาม · อันดับไม่ขึ้น'],
   ['mt', 'warn', 'คำแปลจากเครื่องยังไม่ได้ตรวจ', 'ยังไม่แสดงบนเว็บ · อีกภาษาจึงไม่มีหน้า'], ['no_desc', 'warn', 'ไม่มี Meta description', 'เว็บใช้คำโปรยหรือข้อความในหน้าแทน · เขียนเองช่วยให้คนกดมากกว่า', "closeDrawer();SEOV.tab='pages';SEOV.issue='d_miss';vSeo()"],
   ['meta_len', 'warn', 'Title / Description ยาวไม่พอดี', 'ถูกตัดในผลค้นหา หรือสั้นจนไม่ดึงดูด', "closeDrawer();SEOV.tab='pages';SEOV.issue='warn';vSeo()"], ['no_cover', 'warn', 'บทความไม่มีรูปปก', 'แชร์ใน LINE / Facebook แล้วไม่มีรูป'],
   ['boat_desc', 'warn', 'คำอธิบายเรือสั้นหรือว่าง', 'หน้าเรือบาง · Google ไม่รู้ว่าเรือดีอย่างไร · ควรมีอย่างน้อย 120 ตัวอักษรต่อภาษา'], ['boat_price', 'warn', 'เรือไม่มีราคาเริ่มต้น', 'ไม่มีราคาในผลค้นหา (Product schema)'], ['nf', 'warn', 'มีคนเข้า URL ที่ไม่มีอยู่ (404) และยังไม่มี redirect', 'เสียลูกค้าและคะแนนจากลิงก์เดิม', "closeDrawer();SEOV.tab='redirects';vSeo()"],
   ['redir_bad', 'warn', 'Redirect ต่อกันเป็นทอด หรือชี้ไปหน้าที่ไม่มี', 'ช้า · Google อาจหยุดตามก่อนถึงหน้าจริง', "closeDrawer();SEOV.tab='redirects';vSeo()"], ['h1', 'warn', 'มีหัวข้อ H1 ซ้ำในเนื้อหา', 'หน้ามี H1 จากชื่อบทความอยู่แล้ว · โครงหน้าสับสน'],
   ['faq', 'tip', 'ไม่มี FAQ', 'เสีย FAQ rich result / AI Search'], ['orphan', 'tip', 'ไม่มีลิงก์ภายในชี้มา', 'Google หาเจอยาก · คนอ่านไม่เจอบทความนี้'], ['no_out', 'tip', 'บทความไม่มีลิงก์ไปหน้าเรือ', 'คนอ่านจบแล้วไม่ได้ไปดูเรือ · เสียโอกาสได้ลีด'],
   ['kw_none', 'tip', 'ยังไม่ได้ตั้งคีย์เวิร์ดหลัก', 'ระบบตรวจไม่ได้ว่าหน้านี้ตั้งใจติดคำไหน'], ['kw_first', 'tip', 'คีย์เวิร์ดไม่อยู่ในย่อหน้าแรก', 'Google และ AI ใช้ย่อหน้าแรกสรุปว่าหน้านี้พูดเรื่องอะไร'], ['h2', 'tip', 'ไม่มีหัวข้อ H2 หรือหัวข้อข้ามระดับ', 'อ่านยาก · Google แบ่งเนื้อหาไม่ได้'],
   ['one_lang', 'tip', 'บทความมีภาษาเดียว', 'ลูกค้าต่างชาติ (หรือคนไทย) ค้นไม่เจอ'], ['old', 'tip', 'เนื้อหาเก่าเกิน 18 เดือน', 'ราคาและข้อมูลอาจไม่ตรง · Google ชอบเนื้อหาที่อัปเดต'], ['boat_few', 'tip', 'เรือมีรูปน้อยกว่า 5 รูป', 'ลูกค้าตัดสินใจยาก'],
   ['boat_alt', 'tip', 'รูปเรือไม่มี Alt text', 'Google Images หาไม่เจอ'], ['boat_orphan', 'tip', 'ไม่มีบทความลิงก์ไปเรือลำนี้', 'หน้าเรือได้คะแนนจากลิงก์ภายในน้อย'], ['boat_marina', 'tip', 'เรือยังไม่ได้ระบุท่าเรือ', 'แผนที่และเวลาเดินทางในหน้าเรือไม่แสดง'],
   ['slug', 'tip', 'URL ยาวเกิน 75 ตัวอักษร', 'ถูกตัดในผลค้นหา · แชร์แล้วดูไม่สวย'], ['robots', 'crit', 'robots.txt ปิดทั้งเว็บ', 'Google เก็บหน้าเว็บไม่ได้เลย', "closeDrawer();SEOV.tab='sitemap';vSeo()"], ['ai_block', 'tip', 'ปิดไม่ให้ AI บางตัวอ่านเว็บ', 'ไม่ถูกแนะนำใน ChatGPT / Claude / Perplexity', "closeDrawer();SEOV.tab='sitemap';vSeo()"],
   ['hreflang', 'tip', 'Sitemap ไม่มี hreflang', 'Google อาจแสดงหน้าผิดภาษา', "closeDrawer();SEOV.tab='sitemap';vSeo()"], ['schema', 'tip', 'ข้อมูลบริษัท (Schema) ไม่ครบ', 'ไม่ขึ้นการ์ดธุรกิจ · ความน่าเชื่อถือใน Google ลดลง', "closeDrawer();SEOV.tab='schema';vSeo()"],
   ['speed', 'warn', 'หน้าแรกโหลดช้า (PageSpeed)', 'คนกดออกก่อนหน้าโหลดเสร็จ · Core Web Vitals มีผลกับอันดับ', "closeDrawer();SEOV.tab='overview';vSeo()"],
  ].forEach(([k, lv, l, im, fix]) => def(k, lv, l, im, fix));

  // ---------- articles ----------
  const pub = ART.filter(a => a.status === 'published'), inbound = new Map(), boatIn = new Map();
  const scans = pub.map(a => ({ a, L: LANGS.filter(([k]) => ['orig', 'ok'].includes(a.tr[k]) && (a.title[k] || blocksOf(a, k).length)).map(([k]) => [k, hsScanArt(a, k)]) }));
  for (const { a, L } of scans) for (const [k, s] of L) for (const h of s.links) {
    let p = h.replace(/^https?:\/\/(?:www\.)?boattripthailand\.com/i, '').split(/[?#]/)[0]; try { p = decodeURIComponent(p); } catch (e) { }
    const q = p.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '');
    if (q.startsWith('/blog/')) { const t = ART.find(x => x.slug.th === q.slice(6) || x.slug.en === q.slice(6)); if (t && t !== a) inbound.set(t.id, (inbound.get(t.id) || 0) + 1); }
    if (q.startsWith('/yacht-charter/')) boatIn.set(q.slice(15), (boatIn.get(q.slice(15)) || 0) + 1);
  }
  const old = addDays(TODAY, -548);
  for (const { a, L } of scans) {
    const cov = /^__wp/.test(a.cover || '') ? (WP.arts.find(x => x.id === a.id)?.cover || '') : coverUrl(a);
    if (!cov) add('no_cover', 'warn', '', '', artIt(a, '', 'ไม่มีรูปปก'));
    const langs = LANGS.filter(([k]) => ['orig', 'ok', 'mt'].includes(a.tr[k]));
    if (langs.length < 2) add('one_lang', 'tip', '', '', artIt(a, '', `มีแค่${a.tr.th === 'none' ? 'ภาษาอังกฤษ' : 'ภาษาไทย'}`));
    LANGS.forEach(([k]) => { if (a.tr[k] === 'mt') add('mt', 'warn', '', '', artIt(a, k, 'รอตรวจคำแปล')); });
    if (a.date && new Date(a.date) < old) add('old', 'tip', '', '', artIt(a, '', 'เผยแพร่ ' + fmtD(a.date)));
    if (!inbound.get(a.id)) add('orphan', 'tip', '', '', artIt(a, '', 'ไม่มีบทความอื่นลิงก์มา'));
    for (const [k, s] of L) {
      const bad = s.links.map(h => [h, hsLink(h)]);
      bad.filter(x => x[1] === 'broken').forEach(([h]) => add('link_broken', 'crit', '', '', artIt(a, k, h)));
      bad.filter(x => x[1] === 'redirect').forEach(([h]) => add('link_redirect', 'warn', '', '', artIt(a, k, `${h} → ${REDIR.find(r => r.from === h.split(/[?#]/)[0].replace(/\/+$/, ''))?.to || '?'}`)));
      bad.filter(x => x[1] === 'hidden').forEach(([h]) => add('link_hidden', 'warn', '', '', artIt(a, k, h)));
      if (!s.links.some(h => /yacht-charter\/[^/]+/.test(h))) add('no_out', 'tip', '', '', artIt(a, k, 'ไม่มีการ์ดเรือหรือลิงก์ไปเรือ'));
      const miss = s.imgs.filter(x => !String(x || '').trim()).length; if (miss) add('alt', 'warn', '', '', artIt(a, k, `${miss} รูป`));
      if (!s.faq) add('faq', 'tip', '', '', artIt(a, k, 'ไม่มีบล็อกคำถามที่พบบ่อย'));
      if (s.heads.includes(1)) add('h1', 'warn', '', '', artIt(a, k, `H1 ${s.heads.filter(x => x === 1).length} หัวข้อ`));
      const jump = s.heads.some((h, i) => i ? h - s.heads[i - 1] > 1 : h > 2);
      if (!s.heads.includes(2) || jump) add('h2', 'tip', '', '', artIt(a, k, !s.heads.includes(2) ? 'ไม่มี H2' : 'หัวข้อข้ามระดับ (เช่น H2 → H4)'));
      const body = s.text.join(' '), len = k === 'th' ? body.replace(/\s/g, '').length : body.split(/\s+/).filter(Boolean).length;
      if (len < (k === 'th' ? 800 : 300)) add('thin', 'warn', '', '', artIt(a, k, `${nf(len)} ${k === 'th' ? 'ตัวอักษร' : 'คำ'} · ควรมีอย่างน้อย ${k === 'th' ? '800 ตัวอักษร' : '300 คำ'}`));
      const kw = (a.kw?.[k] || '').trim().toLowerCase();
      if (!kw) add('kw_none', 'tip', '', '', artIt(a, k, ''));
      else {
        if (!(a.seoT?.[k] || a.title[k] || '').toLowerCase().includes(kw)) add('kw_title', 'warn', '', '', artIt(a, k, `“${a.kw[k]}” ไม่อยู่ใน Title`));
        if (!(s.text[0] || '').toLowerCase().includes(kw) && !(a.excerpt?.[k] || '').toLowerCase().includes(kw)) add('kw_first', 'tip', '', '', artIt(a, k, `“${a.kw[k]}”`));
      }
      const sl = a.slug[k] || ''; if (thLen(sl) > 75) add('slug', 'tip', '', '', artIt(a, k, `/${sl.length > 60 ? sl.slice(0, 60) + '…' : sl} (${thLen(sl)})`));
    }
  }
  // ---------- boats ----------
  const live = FLEET.filter(b => b.active);
  for (const b of live) {
    const I = b.imgs || [];
    if (!I.length) add('boat_noimg', 'crit', '', '', boatIt(b, 'ไม่มีรูป'));
    else if (I.length < 5) add('boat_few', 'tip', '', '', boatIt(b, `${I.length} รูป`));
    const noAlt = I.filter(s => { const m = MEDIA.find(x => x.src === s); return m && !(m.alt?.th || '').trim() && !(m.alt?.en || '').trim(); }).length;
    if (noAlt) add('boat_alt', 'tip', '', '', boatIt(b, `${noAlt} รูป · แก้ที่คลังสื่อ`));
    LANGS.forEach(([k, C]) => { if (thLen(b.i18n?.desc?.[k] || '') < 120) add('boat_desc', 'warn', '', '', boatIt(b, `${C} · ${thLen(b.i18n?.desc?.[k] || '') ? 'สั้นเกินไป' : 'ว่าง'}`)); });
    if (!b.from_) add('boat_price', 'warn', '', '', boatIt(b, 'ไม่มีราคาเริ่มต้น'));
    if (!String(b.marina || '').trim()) add('boat_marina', 'tip', '', '', boatIt(b, ''));
    if (!boatIn.get(b.slug)) add('boat_orphan', 'tip', '', '', boatIt(b, 'ยังไม่มีบทความลิงก์มา'));
  }
  // ---------- page meta (same rules as Meta ทุกหน้า) ----------
  const P = auditAll(), pIt = p => ({ name: p.name, sub: ST[p.type], go: `closeDrawer();seoEdit('${p.id}')` });
  for (const p of P) {
    const iss = p.iss, langs = k => [...new Set(iss.filter(i => i.k === k).map(i => i.lang))].join('/');
    if (iss.some(i => i.k === 'dup')) add('dup_title', 'crit', '', '', { ...pIt(p), sub: `${ST[p.type]} · ${langs('dup')}` });
    if (iss.some(i => i.k === 't_miss')) add(p.type === 'article' ? 'auto_title' : 'no_title', '', '', '', { ...pIt(p), sub: `${ST[p.type]} · ${langs('t_miss')}` });
    if (iss.some(i => i.k === 'd_miss')) add('no_desc', 'warn', '', '', { ...pIt(p), sub: `${ST[p.type]} · ${langs('d_miss')}` });
    const ln = iss.filter(i => ['t_long', 't_short', 'd_long', 'd_short', 'd_dup'].includes(i.k)); if (ln.length) add('meta_len', 'warn', '', '', { ...pIt(p), sub: ln.map(i => `${i.lang} ${ISSUE_L[i.k] || i.msg}`).join(' · ') });
    if (!sx(p.id).index && ['boat', 'article', 'home'].includes(p.type)) add('noindex', 'warn', '', '', pIt(p));
  }
  // ---------- redirects & 404 ----------
  hsNfLoad();
  (SHX.nf || []).filter(r => !REDIR.some(x => x.from === r.path.replace(/\/+$/, ''))).forEach(r => add('nf', 'warn', '', '', { name: r.path, sub: `${nf(r.views)} ครั้งใน 90 วัน`, go: `closeDrawer();SEOV.tab='redirects';vSeo();seoAddRedir(${esc(JSON.stringify(r.path))},'')` }));
  const froms = new Map(REDIR.map(r => [r.from, r]));
  for (const r of REDIR) {
    if (!r.to) continue;
    const t = r.to.replace(/^https?:\/\/(?:www\.)?boattripthailand\.com/i, '').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    if (froms.has(t)) add('redir_bad', 'warn', '', '', { name: r.from, sub: `ต่อกันเป็นทอด: → ${t} → ${froms.get(t).to || '410'}`, go: `closeDrawer();SEOV.tab='redirects';vSeo()` });
    else if (t.startsWith('/') && hsLink(t) === 'broken') add('redir_bad', 'warn', '', '', { name: r.from, sub: `ชี้ไป ${t} ซึ่งไม่มีอยู่`, go: `closeDrawer();SEOV.tab='redirects';vSeo()` });
  }
  // ---------- site-wide ----------
  const rb = String(ROBOTS.txt || ''), star = rb.split(/\n(?=user-agent)/i).find(g => /user-agent:\s*\*/i.test(g)) || '';
  if (/^\s*disallow:\s*\/\s*$/im.test(star)) add('robots', 'crit', '', '', { name: 'robots.txt', sub: 'มี “Disallow: /” สำหรับทุก bot', go: C.robots.fix });
  const offAi = Object.entries(ROBOTS.ai || {}).filter(([, v]) => !v).map(([k]) => k); if (offAi.length) add('ai_block', 'tip', '', '', { name: offAi.join(', '), sub: 'ปิดอยู่ใน robots.txt', go: C.ai_block.fix });
  if (!SMAP.hreflang) add('hreflang', 'tip', '', '', { name: 'sitemap.xml', sub: 'ปิด hreflang อยู่', go: C.hreflang.fix });
  const so = typeof SCHEMA_ORG !== 'undefined' ? SCHEMA_ORG : {}, miss = [['phone', 'เบอร์โทร'], ['street', 'ที่อยู่'], ['lat', 'พิกัด'], ['hours', 'เวลาทำการ']].filter(([k]) => !String(so[k] || '').trim()).map(([, l]) => l);
  if (miss.length) add('schema', 'tip', '', '', { name: 'Organization / TravelAgency', sub: 'ยังไม่มี: ' + miss.join(', '), go: C.schema.fix });
  if (typeof PSI !== 'undefined' && PSI.d && !PSI.d.error && PSI.d.score < 90) { C.speed.lv = PSI.d.score < 50 ? 'warn' : 'tip'; add('speed', C.speed.lv, '', '', { name: 'หน้าแรก · มือถือ', sub: `คะแนน PageSpeed ${PSI.d.score}/100`, go: C.speed.fix }); }
  const list = Object.values(C), w = { crit: 12, warn: 5, tip: 1.5 };
  const score = Math.max(0, Math.round(100 - list.filter(c => c.items.length).reduce((s, c) => s + w[c.lv] * Math.min(1, .4 + c.items.length / 20), 0)));
  return { list, score, pages: pub.length + live.length + P.filter(p => p.type === 'page' || p.type === 'home').length };
}
function seoHealthTab() {
  const H = seoHealth(); SHX.res = H; SHX.at = Date.now();
  const bad = H.list.filter(c => c.items.length).sort((a, b) => ({ crit: 0, warn: 1, tip: 2 }[a.lv] - { crit: 0, warn: 1, tip: 2 }[b.lv]) || b.items.length - a.items.length), ok = H.list.filter(c => !c.items.length);
  const n = lv => bad.filter(c => c.lv === lv), cnt = lv => n(lv).reduce((s, c) => s + c.items.length, 0);
  const pill = lv => `<span class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] whitespace-nowrap" style="color:${SHX_LV[lv][1]};background:${SHX_LV[lv][2]}"><i style="width:6px;height:6px;border-radius:9px;background:currentColor;display:inline-block"></i>${SHX_LV[lv][0]}</span>`;
  const card = (l, v, s, ic, col) => `<div class="card p-5 grid gap-1"><span class="flex items-start justify-between gap-2"><span class="text-[12.5px] text-muted">${l}</span><span class="w-9 h-9 rounded-full bg-white grid place-items-center shrink-0" style="margin:-4px -4px 0 0;box-shadow:0 4px 14px -8px rgb(58 0 7/.45);color:${col || 'inherit'}"><i data-lucide="${ic}" class="w-4 h-4"></i></span></span><span class="text-[24px] font-medium tnum leading-tight mt-2" style="color:${col || 'inherit'}">${v}</span><span class="text-[12px] text-muted">${s}</span></div>`;
  const sc = H.score, scol = sc >= 85 ? '#1e7a46' : sc >= 60 ? '#9a5b00' : '#a3222c';
  const when = new Date(SHX.at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<div data-kwcards class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">${card('คะแนนสุขภาพ SEO', `${sc}<span class="text-[14px] text-muted"> /100</span>`, `ตรวจ ${nf(H.pages)} หน้า · ${H.list.length} หัวข้อ`, 'heart-pulse', scol)}${card('ร้ายแรง', n('crit').length, `${nf(cnt('crit'))} จุด · ควรแก้ทันที`, 'octagon-alert', n('crit').length ? '#a3222c' : '')}${card('ควรแก้', n('warn').length, `${nf(cnt('warn'))} จุด`, 'triangle-alert', n('warn').length ? '#9a5b00' : '')}${card('แนะนำ', n('tip').length, `${nf(cnt('tip'))} จุด · ทำแล้วดีขึ้น`, 'lightbulb', '')}</div>
    <div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3"><p class="font-medium">ปัญหาที่พบ <span class="text-muted font-normal">(สแกนล่าสุด ${when})</span></p>${SHX.nfLoading ? '<span class="text-[11.5px] text-muted">กำลังโหลดหน้า 404 จากผู้เข้าชมจริง…</span>' : ''}</div>
    <div class="overflow-x-auto"><table class="tbl min-w-[860px]"><thead><tr><th>ปัญหา</th><th>ระดับ</th><th class="text-right">จำนวน</th><th>ผลกระทบ</th><th></th></tr></thead><tbody>
    ${bad.map(c => `<tr class="click" onclick="seoHealthOpen('${c.k}')"><td class="min-w-[260px]">${esc(c.l)}</td><td>${pill(c.lv)}</td><td class="text-right tnum">${nf(c.items.length)}</td><td class="text-muted">${esc(c.impact)}</td><td class="text-right"><button class="btn btn-o !h-8" onclick="event.stopPropagation();seoHealthOpen('${c.k}')">ดูรายการ</button></td></tr>`).join('') || '<tr><td colspan="5" class="text-center py-12 text-[#1e7a46]">ไม่พบปัญหา · เว็บผ่านการตรวจทุกหัวข้อ</td></tr>'}
    </tbody></table></div>
    ${ok.length ? `<details class="border-t border-line"><summary class="px-5 py-3 cursor-pointer text-[12.5px] text-muted select-none">ผ่านแล้ว ${ok.length} หัวข้อ</summary><ul class="px-5 pb-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2 text-[12.5px]">${ok.map(c => `<li class="flex items-center gap-2"><i data-lucide="circle-check" class="w-4 h-4 shrink-0" style="color:#1e7a46"></i>${esc(c.l.replace(/^มี/, ''))}</li>`).join('')}</ul></details>` : ''}`;
}
function seoHealthOpen(k) {
  const c = SHX.res?.list.find(x => x.k === k); if (!c) return;
  const max = 300, L = c.items.slice(0, max);
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div class="min-w-0"><p class="text-[11px] text-muted">ตรวจสุขภาพ · ${SHX_LV[c.lv][0]} · ${nf(c.items.length)} รายการ</p><p class="font-medium truncate">${esc(c.l)}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <div class="px-5 py-3 border-b border-line text-[12.5px] text-muted flex items-start gap-2"><i data-lucide="info" class="w-4 h-4 shrink-0 mt-0.5"></i><span class="flex-1">${esc(c.impact)}</span>${c.fix ? `<button class="btn btn-o !h-8 shrink-0" onclick="${c.fix}">ไปแก้ที่นี่</button>` : ''}</div>
    <div class="flex-1 overflow-y-auto divide-y" style="border-color:rgb(35 20 22/.06)">${L.map(it => `<button class="w-full text-left px-5 py-3 flex items-center gap-3" style="border-color:rgb(35 20 22/.06)" onclick="${it.go}"><span class="min-w-0 flex-1"><span class="block text-[13px] truncate">${esc(it.name)}</span>${it.sub ? `<span class="block text-[11.5px] text-muted break-all">${esc(it.sub)}</span>` : ''}</span><i data-lucide="chevron-right" class="w-4 h-4 text-muted shrink-0"></i></button>`).join('')}
      ${c.items.length > max ? `<p class="px-5 py-3 text-[12px] text-muted">และอีก ${nf(c.items.length - max)} รายการ · ดาวน์โหลดทั้งหมดได้จากปุ่ม “รายงาน”</p>` : ''}</div>`);
}
/* the tab: added to the bar after คีย์เวิร์ด; the body replaces the card content like the other tabs */
{ const _vh = vSeo; vSeo = function () {
  const on = SEOV.tab === 'health'; if (on) SEOV.tab = 'schema';
  try { _vh(); } finally { if (on) SEOV.tab = 'health'; }
  const bar = $('#view .tabbar'); if (!bar) return;
  if (on) bar.querySelector('.tab.on')?.classList.remove('on');
  const kw = [...bar.querySelectorAll('.tab')].find(t => (t.getAttribute('onclick') || '').includes("'keywords'"));
  (kw || bar.lastElementChild).insertAdjacentHTML('afterend', `<button class="tab ${on ? 'on' : ''}" onclick="SEOV.tab='health';vSeo()">ตรวจสุขภาพ</button>`);
  if (on) { const b = $('#seoBody'); if (b) { b.classList.remove('p-4', 'sm:p-5'); b.classList.add('p-0'); b.innerHTML = seoHealthTab(); const c = b.querySelector('[data-kwcards]'); if (c) bar.insertAdjacentElement('afterend', c); } }
  icons();
}; PAGES.find(p => p[0] === 'seo')[3] = vSeo; }
/* รายงาน on this tab: every problem with every affected page */
{ const _sr = seoReport; seoReport = function () {
  if (SEOV.tab !== 'health') return _sr();
  const H = SHX.res || seoHealth(), rows = [['ปัญหา', 'ระดับ', 'ผลกระทบ', 'หน้า', 'รายละเอียด']];
  H.list.filter(c => c.items.length).forEach(c => c.items.forEach(it => rows.push([c.l, SHX_LV[c.lv][0], c.impact, it.name, it.sub])));
  const csv = '﻿' + rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `seo-health-${iso(TODAY)}.csv`; a.click();
  toast(`ดาวน์โหลดรายงาน ${rows.length - 1} รายการแล้ว`);
}; }

/* ---------- ศูนย์ SEO → Sitemap & Index: live sitemap counts, real section switches, sending to Google / Bing,
   robots.txt, AI crawlers and llms.txt (saved with the SEO settings) ---------- */
const SMX = { d: null, loading: false, busy: '' };
function smxLoad(force) {
  if (SMX.loading || (SMX.d && !force) || !can('seo')) return; SMX.loading = true;
  api('GET', 'seo/sitemap').then(d => { SMX.d = d; }).catch(e => { SMX.d = { error: e.message }; })
    .finally(() => { SMX.loading = false; if (CUR === 'seo' && SEOV.tab === 'sitemap') vSeo(); });
}
/* the sitemap follows the SEO settings: save first, then count again */
function smxSet(k, v) { SMAP[k] = v; try { seoTick(); } catch (e) { } setTimeout(() => smxLoad(true), 2000); vSeo(); }
function smxSubmit(to) {
  if (SMX.busy) return; SMX.busy = to; vSeo();
  api('POST', 'seo/submit', { to }).then(r => { if (SMX.d && !SMX.d.error) SMX.d.log = r.log; AUDIT_DIRTY = true; (r.ok ? toast : toastErr)(r.msg); })
    .catch(fail).finally(() => { SMX.busy = ''; vSeo(); });
}
function smxRobotsSave() { const v = $('#rbT')?.value ?? ROBOTS.txt; ROBOTS.txt = v; try { seoTick(); } catch (e) { } toast('บันทึก robots.txt แล้ว · มีผลภายใน 5 นาที'); }
function smxList(kind) {
  const P = seoPages(), items = kind === 'noindex' ? P.filter(p => !p.hidden && !p.draft && !sx(p.id).index) : [...ART.filter(a => a.status !== 'published').map(a => ({ name: a.title.th || a.title.en || 'บทความไม่มีชื่อ', sub: 'บทความ · ' + (ART_ST[a.status]?.[0] || a.status), go: `closeDrawer();go('articles/${a.id}')` })),
    ...FLEET.filter(b => !b.active).map(b => ({ name: b.name, sub: 'เรือ · ซ่อนอยู่', go: `closeDrawer();boatEdit('${b.slug}')` }))];
  const L = kind === 'noindex' ? items.map(p => ({ name: p.name, sub: ST[p.type] + ' · ' + (p.url.th || p.url.en), go: `closeDrawer();seoEdit('${p.id}')`, id: p.id })) : items;
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div><p class="text-[11px] text-muted">Sitemap & Index · ${L.length} รายการ</p><p class="font-medium">${kind === 'noindex' ? 'หน้าที่ตั้ง noindex' : 'ยังไม่เผยแพร่'}</p></div><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div>
    <p class="px-5 py-3 border-b border-line text-[12.5px] text-muted">${kind === 'noindex' ? 'หน้าเหล่านี้ไม่อยู่ใน sitemap และบอก Google ว่าไม่ต้องเก็บ · เปิดให้เก็บได้จากปุ่มด้านขวา' : 'บทความฉบับร่าง รอตรวจ ตั้งเวลา และเรือที่ซ่อน จะเข้า sitemap เองเมื่อเผยแพร่'}</p>
    <div class="flex-1 overflow-y-auto">${L.map(it => `<div class="flex items-center gap-3 px-5 py-3 border-b border-line"><button class="min-w-0 flex-1 text-left" onclick="${it.go}"><span class="block text-[13px] truncate">${esc(it.name)}</span><span class="block text-[11.5px] text-muted truncate">${esc(it.sub)}</span></button>${it.id ? `<button class="btn btn-o !h-8 shrink-0" onclick="sx('${it.id}').index=true;try{seoTick()}catch(e){};smxLoad(true);smxList('noindex');vSeo();toast('เปิดให้ Google เก็บแล้ว')">เปิดให้เก็บ</button>` : ''}</div>`).join('') || '<p class="px-5 py-10 text-center text-muted">ไม่มีรายการ</p>'}</div>`);
}
seoSitemap = function () {
  smxLoad(); const D = SMX.d && !SMX.d.error ? SMX.d : null, err = SMX.d?.error;
  const unpub = ART.filter(a => a.status !== 'published').length + FLEET.filter(b => !b.active).length;
  const noix = seoPages().filter(p => !p.hidden && !p.draft && !sx(p.id).index).length;
  const L = D?.log || {}, last = [L.google, L.bing].filter(x => x?.ok).sort((a, b) => b.at.localeCompare(a.at))[0];
  const ago = s => { const m = Math.round((Date.now() - new Date(s)) / 60000); return m < 1 ? 'เมื่อสักครู่' : m < 60 ? m + ' นาทีที่แล้ว' : m < 1440 ? Math.round(m / 60) + ' ชม.ที่แล้ว' : fmtD(iso(new Date(s))); };
  const card = (l, v, s, ic, on) => `<${on ? `button onclick="${on}"` : 'div'} class="card p-5 text-left grid gap-1"><span class="flex items-start justify-between gap-2"><span class="text-[12.5px] text-muted">${l}</span><span class="w-9 h-9 rounded-full bg-white grid place-items-center shrink-0" style="margin:-4px -4px 0 0;box-shadow:0 4px 14px -8px rgb(58 0 7/.45)"><i data-lucide="${ic}" class="w-4 h-4"></i></span></span><span class="text-[24px] font-medium tnum leading-tight mt-2">${v}</span><span class="text-[12px] text-muted">${s}</span></${on ? 'button' : 'div'}>`;
  const cards = `<div data-kwcards class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">${card('URL ใน Sitemap', D ? nf(D.total) : '…', 'หน้าที่เปิดให้ Google เก็บ', 'check', '')}${card('ยังไม่เผยแพร่', nf(unpub), 'ร่าง / รอตรวจ / ตั้งเวลา / เรือที่ซ่อน', 'clock', "smxList('draft')")}${card('noindex', nf(noix), 'หน้าที่ตั้งไม่ให้ Google เก็บ', 'ban', "smxList('noindex')")}${card('ส่ง Sitemap', last ? ago(last.at) : '—', last ? (last === L.google ? 'Google' : 'Bing / IndexNow') + (L.google?.ok && L.bing?.ok ? ' · ส่งครบทั้งสองที่' : '') : 'ยังไม่เคยส่ง', 'globe', '')}</div>`;
  const row = (k, f, l, c) => `<div class="flex items-center gap-3 border-t border-line" style="padding:14px 20px"><i data-lucide="file-code-2" class="w-5 h-5 text-muted shrink-0"></i><div class="flex-1 min-w-0"><p class="truncate">${f}</p><p class="text-[11.5px] text-muted">${l} · ${c}</p></div><a class="text-[12px] text-muted hover:text-maroon whitespace-nowrap" href="/sitemap.xml" target="_blank" rel="noopener">ดู XML</a><span class="tgl"><input type="checkbox" ${SMAP[k] !== false ? 'checked' : ''} onchange="smxSet('${k}',this.checked)"/><span></span></span></div>`;
  const cnt = (n, u = 'URL') => D ? `${nf(n)} ${u}` : '…';
  const sent = x => x ? `<span class="block text-[10.5px] ${x.ok ? 'text-muted' : 'text-[#a3222c]'}">${x.ok ? 'ส่งล่าสุด ' + ago(x.at) : 'ไม่สำเร็จ'}</span>` : '';
  const gscOn = typeof GG !== 'undefined' && GG.st?.gsc?.on;
  const host = D ? D.url.replace(/^https?:\/\//, '') : SITE + '/sitemap.xml';
  return `${cards}<div class="grid xl:grid-cols-2 gap-4 items-start">
    <div class="card overflow-hidden"><div class="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3"><div class="min-w-0"><p class="font-medium">Sitemap</p><p class="text-[11.5px] text-muted mt-0.5 break-all">${esc(host)} · อัปเดตอัตโนมัติเมื่อแก้เนื้อหา</p></div>
        <div class="flex gap-2 shrink-0"><button class="btn btn-o !h-9 text-left" ${SMX.busy ? 'disabled' : ''} onclick="smxSubmit('bing')" title="ส่งทุก URL ให้ Bing, Yandex, Naver ผ่าน IndexNow · ไม่ต้องมีบัญชี"><span>${SMX.busy === 'bing' ? 'กำลังส่ง…' : 'IndexNow (Bing)'}${sent(L.bing)}</span></button>
          <button class="btn btn-o !h-9 text-left" ${SMX.busy ? 'disabled' : ''} onclick="${gscOn ? "smxSubmit('google')" : "toast('เชื่อม Search Console ก่อน (วิเคราะห์เว็บไซต์ → เชื่อมต่อ API) หรือส่งเองที่ search.google.com/search-console → Sitemaps')"}"><span>${SMX.busy === 'google' ? 'กำลังส่ง…' : 'ส่งให้ Google'}${sent(L.google)}</span></button></div></div>
      ${err ? `<p class="px-5 py-3 border-t border-line text-[12px] text-[#a3222c]">นับ URL ไม่สำเร็จ: ${esc(err)}</p>` : ''}
      ${row('pages', 'หน้าหลัก & จุดหมาย', 'หน้าแรก เรือทั้งหมด บทความ เกี่ยวกับเรา ติดต่อ เกาะ', cnt(D?.pages))}${row('boats', 'หน้าเรือ', 'เรือที่แสดงบนเว็บทุกลำ', cnt(D?.boats))}${row('blog', 'บทความ', 'บทความที่เผยแพร่ ทั้งไทยและอังกฤษ', cnt(D?.blog))}${row('images', 'รูปภาพ', 'รูปเรือ + รูปปกบทความ (Google Images)', cnt(D?.images, 'รูป'))}
      <label class="flex items-center gap-3 border-t border-line" style="padding:14px 20px"><i data-lucide="languages" class="w-5 h-5 text-muted shrink-0"></i><span class="flex-1"><span class="block">hreflang th / en</span><span class="block text-[11.5px] text-muted">บอก Google ว่าหน้าไทยและอังกฤษเป็นคู่กัน</span></span><span class="tgl"><input type="checkbox" ${SMAP.hreflang ? 'checked' : ''} onchange="smxSet('hreflang',this.checked)"/><span></span></span></label>
      <p class="px-5 py-3 border-t border-line text-[11.5px] text-muted">หน้าที่ซ่อน, noindex และบทความฉบับร่าง จะไม่อยู่ใน sitemap · ปิดหมวดไหน URL หมวดนั้นจะหายจาก sitemap.xml (หน้ายังเปิดได้ตามปกติ)</p></div>
    <div class="grid gap-4">
      <div class="card p-5"><div class="flex items-center justify-between"><p class="font-medium">robots.txt</p><button class="btn btn-g !h-8" onclick="smxRobotsSave()">บันทึก</button></div>
        <textarea id="rbT" rows="9" class="inp mt-3 font-mono !text-[12.5px] leading-relaxed">${esc(ROBOTS.txt)}</textarea>
        <div class="flex items-center justify-between mt-2 text-[11.5px] text-muted"><span>ระบบเติมบรรทัด Sitemap และบล็อก AI ที่ปิดไว้ให้เอง</span><a class="hover:text-maroon inline-flex items-center gap-1" href="/robots.txt" target="_blank" rel="noopener">ดู /robots.txt<i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i></a></div></div>
      <div class="card p-5"><p class="font-medium flex items-center gap-2"><i data-lucide="bot" class="w-4 h-4 text-maroon"></i>AI crawlers</p><p class="text-[11.5px] text-muted mt-0.5">อนุญาตให้ AI อ่านเว็บ ช่วยให้ ChatGPT, Claude, Perplexity แนะนำเรือและบทความของเราได้</p>
        <div class="mt-3 grid gap-1">${Object.keys(ROBOTS.ai).map(b => `<label class="flex items-center justify-between gap-3 py-1.5"><span class="font-mono text-[13px]">${b}</span><span class="tgl"><input type="checkbox" ${ROBOTS.ai[b] ? 'checked' : ''} onchange="ROBOTS.ai['${b}']=this.checked;try{seoTick()}catch(e){}"/><span></span></span></label>`).join('')}
        <label class="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-line"><span>สร้างไฟล์ /llms.txt <span class="block text-[11.5px] text-muted">สรุปเว็บ เรือ และบทความหลักให้ AI อ่านง่าย · <a class="hover:text-maroon" href="/llms.txt" target="_blank" rel="noopener" onclick="event.stopPropagation()">ดูไฟล์</a></span></span><span class="tgl"><input type="checkbox" ${ROBOTS.llms ? 'checked' : ''} onchange="ROBOTS.llms=this.checked;try{seoTick()}catch(e){}"/><span></span></span></label></div></div>
    </div></div>`;
};
/* tab label + cards above the content, like the other SEO tabs */
{ const _vm = vSeo; vSeo = function () {
  _vm();
  const t = [...$$('#view .tabbar .tab')].find(x => (x.getAttribute('onclick') || '').includes("'sitemap'")); if (t) t.textContent = 'Sitemap & Index';
  if (SEOV.tab === 'sitemap') { const c = $('#seoBody [data-kwcards]'), body = $('#seoBody'); if (c) $('#view .tabbar')?.insertAdjacentElement('afterend', c);
    // the boxes are cards of their own: no card around them
    if (body) { body.classList.remove('p-4', 'sm:p-5'); body.classList.add('p-0'); const w = body.parentElement; if (w?.classList.contains('card')) w.classList.remove('card'); } }
  icons();
}; PAGES.find(p => p[0] === 'seo')[3] = vSeo; }

/* =====================================================================
   ศูนย์ SEO → ลิงก์ภายใน: broken links and links through a redirect (fixed in one click), and suggestions —
   boat names, other articles' main keywords and "เช่าเรือยอชต์ / yacht charter" found in the text of an
   article that does not link there yet. "ใส่ลิงก์" wraps the first mention in the paragraph with a link;
   the article then saves itself. Skipped suggestions are remembered with the SEO settings.
   ===================================================================== */
const LNK = { page: 0, per: 30, q: '' };
const lnkSkip = () => (SSET.lnkSkip ??= []);
/* the html-bearing fields of one block: [get, set] pairs */
function lnkFields(b) {
  const F = [];
  if (typeof b.html === 'string' && ['p', 'h', 'quote'].includes(b.t)) F.push([() => b.html, v => { b.html = v; }]);
  if (b.t === 'faq') (b.items || []).forEach(x => F.push([() => x.a || '', v => { x.a = v; }]));
  if (b.t === 'cols') (b.cols || []).filter(c => c.k !== 'img').forEach(c => F.push([() => c.html || '', v => { c.html = v; }]));
  return F;
}
const lnkArts = () => ART.filter(a => a.status === 'published').flatMap(a => LANGS.filter(([k]) => ['orig', 'ok'].includes(a.tr[k])).map(([k]) => [a, k]));
const lnkUrl = (k, p) => (k === 'en' ? '/en' : '') + p;
function lnkSave(a, k) { a.body[k] = blocksHtml(blocksOf(a, k)); try { artTick(true); } catch (e) { } AUDIT_DIRTY = true; }
/** every internal link in published articles, with its status */
function lnkScan() {
  const out = [];
  for (const [a, k] of lnkArts()) blocksOf(a, k).forEach((b, bi) => {
    const hs = [];
    lnkFields(b).forEach(([g]) => hsHrefs(g()).forEach(h => hs.push(h)));
    if (b.t === 'boat' && b.slug) hs.push('/yacht-charter/' + b.slug);
    if (b.t === 'btn' && /^(\/|https?:)/.test(b.href || '')) hs.push(b.href);
    hs.forEach(h => { const st = hsLink(h); if (st) out.push({ a, k, bi, h, st, card: b.t === 'boat' }); });
  });
  return out;
}
const lnkTarget = h => { const p = h.replace(/^https?:\/\/(?:www\.)?boattripthailand\.com/i, '').split(/[?#]/)[0].replace(/\/+$/, ''); let d = p; try { d = decodeURI(p); } catch (e) { } const r = REDIR.find(x => x.from === d || x.from === p); return r ? (r.to || '') : ''; };
/* follow redirects (A → B → C) to the final URL */
const lnkFinal = h => { let t = lnkTarget(h), n = 0; while (t && n++ < 5) { const nx = lnkTarget(t); if (!nx) break; t = nx; } return t; };
function lnkFixRedirect(id, k, h) {
  const a = artById(id), to = lnkFinal(h); if (!a || !to) return toast('ไม่พบปลายทางของ redirect');
  let n = 0; const esc2 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), re = new RegExp(`href\\s*=\\s*(["'])${esc2(h)}\\1`, 'g');
  blocksOf(a, k).forEach(b => { lnkFields(b).forEach(([g, s]) => { const v = g(), nv = v.replace(re, () => { n++; return `href="${to}"`; }); if (nv !== v) s(nv); }); if (b.t === 'btn' && b.href === h) { b.href = to; n++; } });
  if (!n) return toast('ไม่พบลิงก์นี้ในบทความแล้ว');
  lnkSave(a, k); vSeo(); toast(`แก้ ${n} ลิงก์ให้ชี้ไป ${to} โดยตรงแล้ว`);
}
function lnkFixAllRedirects() {
  const L = lnkScan().filter(x => x.st === 'redirect' && lnkFinal(x.h)); if (!L.length) return;
  const seen = new Set(); L.forEach(x => { const key = x.a.id + '|' + x.k + '|' + x.h; if (seen.has(key)) return; seen.add(key);
    const to = lnkFinal(x.h), re = new RegExp(`href\\s*=\\s*(["'])${x.h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g');
    blocksOf(x.a, x.k).forEach(b => { lnkFields(b).forEach(([g, s]) => { const v = g(), nv = v.replace(re, `href="${to}"`); if (nv !== v) s(nv); }); if (b.t === 'btn' && b.href === x.h) b.href = to; });
    x.a.body[x.k] = blocksHtml(blocksOf(x.a, x.k)); });
  try { artTick(true); } catch (e) { } AUDIT_DIRTY = true; vSeo(); toast(`แก้ลิงก์ที่ผ่าน redirect แล้ว ${L.length} ลิงก์`);
}
/* where a phrase can be linked: outside tags and outside existing links; EN on word boundaries */
function lnkFind(html, term, k) {
  const parts = String(html || '').split(/(<[^>]+>)/); let inA = 0, off = 0;
  const re = k === 'en' ? new RegExp(`(^|[^\\p{L}\\p{N}])(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=$|[^\\p{L}\\p{N}])`, 'iu') : null;
  for (const s of parts) {
    if (s.startsWith('<')) { if (/^<a[\s>]/i.test(s)) inA++; else if (/^<\/a>/i.test(s)) inA = Math.max(0, inA - 1); }
    else if (!inA) { let i = -1, len = term.length; if (re) { const m = s.match(re); if (m) { i = m.index + m[1].length; len = m[2].length; } } else i = s.indexOf(term); if (i >= 0) return { at: off + i, len }; }
    off += s.length;
  }
  return null;
}
/** suggested links: [{ a, k, bi, fi, text, url, key, kind }] */
function lnkSuggest() {
  const T = { th: [], en: [] };
  FLEET.filter(b => b.active).forEach(b => { const n = String(b.name || '').trim(), short = n.replace(/\s*(ft|feet|m)\.?$/i, '').trim();   // "Leopard 90 ft" → "Leopard 90" (keeps the number: a bare "Silver" would match the word)
    LANGS.forEach(([k]) => { const url = lnkUrl(k, '/yacht-charter/' + b.slug); if (n.length >= 5) T[k].push({ term: n, url, kind: 'เรือ', name: n }); if (short !== n && /\d/.test(short) && short.length >= 6) T[k].push({ term: short, url, kind: 'เรือ', name: n }); }); });
  ART.filter(a => a.status === 'published').forEach(a => LANGS.forEach(([k]) => { const w = String(a.kw?.[k] || '').trim(); if (thLen(w) >= 4 && a.slug[k]) T[k].push({ term: w, url: lnkUrl(k, '/blog/' + a.slug[k]), kind: 'บทความ', name: a.title[k] || a.title.th, id: a.id }); }));
  T.th.push({ term: 'เช่าเรือยอชต์ภูเก็ต', url: '/yacht-charter', kind: 'หน้าเรือทั้งหมด', name: 'เรือทั้งหมด' }, { term: 'เช่าเรือยอชต์', url: '/yacht-charter', kind: 'หน้าเรือทั้งหมด', name: 'เรือทั้งหมด' });
  T.en.push({ term: 'Phuket yacht charter', url: '/en/yacht-charter', kind: 'หน้าเรือทั้งหมด', name: 'All boats' }, { term: 'yacht charter', url: '/en/yacht-charter', kind: 'หน้าเรือทั้งหมด', name: 'All boats' });
  LANGS.forEach(([k]) => T[k].sort((x, y) => y.term.length - x.term.length));
  const skip = new Set(lnkSkip()), out = [];
  for (const [a, k] of lnkArts()) {
    const B = blocksOf(a, k), have = new Set();
    B.forEach(b => { lnkFields(b).forEach(([g]) => hsHrefs(g()).forEach(h => have.add(h.replace(/^https?:\/\/(?:www\.)?boattripthailand\.com/i, '').replace(/\/+$/, '')))); if (b.t === 'boat') have.add(lnkUrl(k, '/yacht-charter/' + b.slug)); });
    const own = lnkUrl(k, '/blog/' + (a.slug[k] || '')); let n = 0;
    // quick test on the article's plain text before looking inside each paragraph
    const plain = B.filter(b => b.t === 'p' || b.t === 'quote').map(b => txtOf(b.html)).join(' ').toLowerCase();
    const usedUrl = new Set();
    for (const t of T[k]) {
      if (n >= 5) break;
      if (t.url === own || t.id === a.id || have.has(t.url) || usedUrl.has(t.url)) continue;
      if (!plain.includes(t.low ??= t.term.toLowerCase())) continue;
      const key = `${a.id}|${k}|${t.url}`; if (skip.has(key)) continue;
      let hit = null;
      for (let bi = 0; bi < B.length && !hit; bi++) { if (B[bi].t !== 'p' && B[bi].t !== 'quote') continue; const F = lnkFields(B[bi]); for (let fi = 0; fi < F.length && !hit; fi++) { const f = lnkFind(F[fi][0](), t.term, k); if (f) hit = { bi, fi, text: F[fi][0]().slice(f.at, f.at + f.len), at: f.at }; } }
      if (hit) { out.push({ a, k, ...hit, url: t.url, key, kind: t.kind, name: t.name }); usedUrl.add(t.url); n++; }
    }
  }
  return out;
}
function lnkApply(key) {
  const s = (LNK.sugg || []).find(x => x.key === key); if (!s) return;
  if (!lnkInsert(s)) return toast('ข้อความนี้เปลี่ยนไปแล้ว · สแกนใหม่อีกครั้ง');
  lnkSave(s.a, s.k); vSeo(); toast(`ใส่ลิงก์ “${s.text}” → ${s.url} แล้ว`);
}
function lnkInsert(s) {
  const F = lnkFields(blocksOf(s.a, s.k)[s.bi] || {})[s.fi]; if (!F) return false;
  const html = F[0](), f = lnkFind(html, s.text, s.k); if (!f) return false;
  F[1](html.slice(0, f.at) + `<a href="${s.url}">${html.slice(f.at, f.at + f.len)}</a>` + html.slice(f.at + f.len));
  return true;
}
function lnkSkipOne(key) { const L = lnkSkip(); if (!L.includes(key)) L.push(key); if (L.length > 600) L.splice(0, L.length - 600); try { seoTick(); } catch (e) { } vSeo(); }
function lnkApplyAll() {
  const L = LNK.sugg || []; if (!L.length) return;
  openModal(`<div class="p-5 grid gap-2"><p class="font-medium">ใส่ลิงก์ทั้งหมด ${nf(L.length)} รายการ?</p><p class="text-[12.5px] text-muted">ใส่ลิงก์ที่คำแรกที่เจอในย่อหน้าของแต่ละบทความ · บทความบันทึกเองและขึ้นเว็บภายในไม่กี่นาที · แก้หรือลบลิงก์ได้ในหน้าแก้ไขบทความ</p>
    <div class="flex justify-end gap-2 mt-3"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="closeModal();lnkApplyAllGo()">ใส่ลิงก์</button></div></div>`);
}
function lnkApplyAllGo() {
  const done = new Set(); let n = 0;
  for (const s of LNK.sugg || []) if (lnkInsert(s)) { n++; done.add(s.a.id + '|' + s.k); }
  done.forEach(x => { const [id, k] = x.split('|'); const a = artById(+id); if (a) a.body[k] = blocksHtml(blocksOf(a, k)); });
  try { artTick(true); } catch (e) { } AUDIT_DIRTY = true; vSeo(); toast(`ใส่ลิงก์แล้ว ${n} รายการ ใน ${done.size} บทความ`);
}
function seoLinksTab() {
  const S = lnkScan(), broken = S.filter(x => x.st === 'broken'), redir = S.filter(x => x.st === 'redirect'), hidden = S.filter(x => x.st === 'hidden');
  const inb = new Map(); S.forEach(x => { if (x.st !== 'ok') return; const q = x.h.replace(/^https?:\/\/(?:www\.)?boattripthailand\.com/i, '').replace(/^\/en(?=\/)/, '').split(/[?#]/)[0].replace(/\/+$/, ''); if (q.startsWith('/blog/')) { let s = q.slice(6); try { s = decodeURIComponent(s); } catch (e) { } const t = ART.find(a => a.slug.th === s || a.slug.en === s); if (t && t !== x.a) inb.set(t.id, 1); } });
  const orphans = ART.filter(a => a.status === 'published' && !inb.has(a.id)).length;
  const sugg = LNK.sugg = lnkSuggest().filter(s => !LNK.q || (s.a.title[s.k] + ' ' + s.text + ' ' + s.url).toLowerCase().includes(LNK.q.toLowerCase()));
  const card = (l, v, s, ic, col) => `<div class="card p-5 grid gap-1"><span class="flex items-start justify-between gap-2"><span class="text-[12.5px] text-muted">${l}</span><span class="w-9 h-9 rounded-full bg-white grid place-items-center shrink-0" style="margin:-4px -4px 0 0;box-shadow:0 4px 14px -8px rgb(58 0 7/.45);color:${col || 'inherit'}"><i data-lucide="${ic}" class="w-4 h-4"></i></span></span><span class="text-[24px] font-medium tnum leading-tight mt-2" style="color:${col || 'inherit'}">${nf(v)}</span><span class="text-[12px] text-muted">${s}</span></div>`;
  const cards = `<div data-kwcards class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">${card('ลิงก์ภายในทั้งหมด', S.length, `ใน ${nf(new Set(S.map(x => x.a.id)).size)} บทความ`, 'link', '')}${card('ลิงก์เสีย', broken.length, 'ชี้ไปหน้าที่ไม่มี · ผู้อ่านเจอ 404', 'unlink', broken.length ? '#a3222c' : '')}${card('ผ่าน redirect', redir.length + hidden.length, `${hidden.length ? hidden.length + ' ลิงก์ไปหน้าที่ซ่อน · ' : ''}ควรชี้ไป URL ใหม่ตรงๆ`, 'route', redir.length ? '#9a5b00' : '')}${card('บทความไม่มีลิงก์ชี้มา', orphans, 'Google หาเจอยาก', 'unlink-2', '')}</div>`;
  const nm = x => esc(x.a.title[x.k] || x.a.title.th || x.a.title.en || 'บทความไม่มีชื่อ');
  const mono = h => `<span class="font-mono text-[12.5px] break-all" style="color:#a3222c">${esc((() => { try { return decodeURI(h); } catch (e) { return h; } })())}</span>`;
  const bad = [...broken.map(x => ({ ...x, why: x.card ? 'การ์ดเรือ · เรือถูกลบแล้ว' : 'หน้าไม่มีอยู่' })), ...hidden.map(x => ({ ...x, why: 'หน้านี้ซ่อนอยู่ / ยังไม่เผยแพร่' }))];
  const box1 = bad.length ? `<div class="card overflow-hidden mb-4"><p class="font-medium px-5 pt-4 pb-3">ลิงก์ภายในเสีย ${nf(bad.length)} ลิงก์ <span class="text-muted font-normal">(ชี้ไปหน้าที่ไม่มี · ผู้อ่านจะเจอหน้า 404)</span></p>
    <div class="overflow-x-auto"><table class="tbl min-w-[760px]"><thead><tr><th>ในบทความ</th><th>ลิงก์ที่เสีย</th><th>สาเหตุ</th><th></th></tr></thead><tbody>
    ${bad.map(x => `<tr><td><span class="lang-b mr-1.5">${x.k.toUpperCase()}</span>${nm(x)}</td><td>${mono(x.h)}</td><td class="text-muted text-[12px]">${x.why}</td><td class="text-right"><button class="btn btn-o !h-8" onclick="AE.lang='${x.k}';go('articles/${x.a.id}')">แก้บทความ</button></td></tr>`).join('')}</tbody></table></div></div>` : '';
  const box2 = redir.length ? `<div class="card overflow-hidden mb-4"><div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3"><p class="font-medium">ลิงก์ที่ผ่าน redirect ${nf(redir.length)} ลิงก์ <span class="text-muted font-normal">(ลิงก์ URL เก่าจาก WordPress · ช้าลงหนึ่งจังหวะ)</span></p><button class="btn btn-p !h-8" onclick="lnkFixAllRedirects()"><i data-lucide="wand-sparkles" class="w-3.5 h-3.5"></i>แก้ทั้งหมด</button></div>
    <div class="overflow-x-auto"><table class="tbl min-w-[760px]"><thead><tr><th>ในบทความ</th><th>ลิงก์เดิม</th><th>ไปที่</th><th></th></tr></thead><tbody>
    ${redir.slice(0, 100).map(x => `<tr><td><span class="lang-b mr-1.5">${x.k.toUpperCase()}</span>${nm(x)}</td><td class="font-mono text-[12px] text-muted break-all">${esc(x.h)}</td><td class="font-mono text-[12px] break-all">${esc(lnkFinal(x.h) || '410 (ลบแล้ว)')}</td><td class="text-right whitespace-nowrap">${lnkFinal(x.h) ? `<button class="btn btn-o !h-8" onclick='lnkFixRedirect(${x.a.id},"${x.k}",${esc(JSON.stringify(x.h))})'>แก้ให้</button>` : `<button class="btn btn-o !h-8" onclick="AE.lang='${x.k}';go('articles/${x.a.id}')">แก้บทความ</button>`}</td></tr>`).join('')}</tbody></table></div></div>` : '';
  const pages = Math.max(1, Math.ceil(sugg.length / LNK.per)); LNK.page = Math.min(LNK.page, pages - 1); const view = sugg.slice(LNK.page * LNK.per, LNK.page * LNK.per + LNK.per);
  const box3 = `<div class="card overflow-hidden"><div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3"><div><p class="font-medium">คำแนะนำลิงก์ภายใน <span class="text-muted font-normal">(จับคู่จากชื่อเรือ คีย์เวิร์ดหลักของบทความ และหน้าเรือทั้งหมด)</span></p><p class="text-[11.5px] text-muted mt-0.5">ใส่ลิงก์ที่คำแรกที่เจอในย่อหน้า · บทความละไม่เกิน 5 ลิงก์ · ไม่แนะนำหน้าที่บทความลิงก์อยู่แล้ว</p></div>
      <div class="flex flex-wrap items-center gap-2"><input class="inp !h-9" style="width:200px" placeholder="ค้นหาบทความ / คำ…" value="${esc(LNK.q)}" onkeydown="if(event.key==='Enter'){LNK.q=this.value;LNK.page=0;vSeo()}"/>${sugg.length ? `<button class="btn btn-p !h-9" onclick="lnkApplyAll()"><i data-lucide="link" class="w-3.5 h-3.5"></i>ใส่ทั้งหมด ${nf(sugg.length)}</button>` : ''}</div></div>
    <div class="overflow-x-auto"><table class="tbl min-w-[900px]"><thead><tr><th>ในบทความ</th><th>ข้อความลิงก์</th><th>ลิงก์ไปที่</th><th></th></tr></thead><tbody>
    ${view.map(s => `<tr><td><span class="lang-b mr-1.5">${s.k.toUpperCase()}</span>${nm(s)}</td><td><mark style="background:#fff3b8;color:inherit;padding:1px 4px;border-radius:4px">${esc(s.text)}</mark></td><td><p class="text-[12.5px] truncate max-w-[300px]">${esc(s.name || '')}</p><p class="text-[11px] text-muted font-mono truncate max-w-[300px]">${esc((() => { try { return decodeURI(s.url); } catch (e) { return s.url; } })())}</p></td>
      <td class="text-right whitespace-nowrap"><button class="btn btn-p !h-8" onclick="lnkApply('${s.key}')">ใส่ลิงก์</button> <button class="btn btn-g !h-8 text-muted" onclick="lnkSkipOne('${s.key}')">ข้าม</button></td></tr>`).join('') || '<tr><td colspan="4" class="text-center text-muted py-12">ไม่มีคำแนะนำเพิ่ม · บทความลิงก์ถึงกันครบแล้ว</td></tr>'}</tbody></table></div>
    ${pages > 1 ? `<div class="flex items-center justify-between px-5 py-3 border-t border-line text-[12px] text-muted"><span>${nf(sugg.length)} คำแนะนำ${lnkSkip().length ? ` · ข้ามไว้ ${nf(lnkSkip().length)} <button class="text-maroon" onclick="SSET.lnkSkip=[];try{seoTick()}catch(e){};vSeo()">แสดงอีกครั้ง</button>` : ''}</span><div class="flex items-center gap-1"><button class="btn btn-g !h-8 !px-2" ${LNK.page ? '' : 'disabled'} onclick="LNK.page--;vSeo()"><i data-lucide="chevron-left" class="w-4 h-4"></i></button><span class="tnum">${LNK.page + 1} / ${pages}</span><button class="btn btn-g !h-8 !px-2" ${LNK.page < pages - 1 ? '' : 'disabled'} onclick="LNK.page++;vSeo()"><i data-lucide="chevron-right" class="w-4 h-4"></i></button></div></div>` : ''}</div>`;
  return cards + box1 + box2 + box3;
}
{ const _vl = vSeo; vSeo = function () {
  const on = SEOV.tab === 'links'; if (on) SEOV.tab = 'schema';
  try { _vl(); } finally { if (on) SEOV.tab = 'links'; }
  const bar = $('#view .tabbar'); if (!bar) return;
  if (on) bar.querySelector('.tab.on')?.classList.remove('on');
  const sm = [...bar.querySelectorAll('.tab')].find(t => (t.getAttribute('onclick') || '').includes("'sitemap'"));
  (sm || bar.lastElementChild).insertAdjacentHTML('afterend', `<button class="tab ${on ? 'on' : ''}" onclick="SEOV.tab='links';vSeo()">ลิงก์ภายใน</button>`);
  // order: ภาพรวม · Meta ทุกหน้า · คีย์เวิร์ด · ตรวจสุขภาพ · Sitemap & Index · ลิงก์ภายใน · Schema · Redirect & 404 · ตั้งค่า
  const ORDER = ['overview', 'pages', 'keywords', 'health', 'sitemap', 'links', 'schema', 'redirects', 'settings'], key = t => (t.getAttribute('onclick') || '').match(/SEOV\.tab='(\w+)'/)?.[1];
  [...bar.querySelectorAll('.tab')].sort((x, y) => (ORDER.indexOf(key(x)) + 1 || 99) - (ORDER.indexOf(key(y)) + 1 || 99)).forEach(t => bar.appendChild(t));
  if (on) { const b = $('#seoBody'); if (b) { b.classList.remove('p-4', 'sm:p-5'); b.classList.add('p-0'); b.innerHTML = seoLinksTab(); const c = b.querySelector('[data-kwcards]'); if (c) bar.insertAdjacentElement('afterend', c); const w = b.parentElement; if (w?.classList.contains('card')) w.classList.remove('card'); } }
  icons();
}; PAGES.find(p => p[0] === 'seo')[3] = vSeo; }

/* =====================================================================
   ศูนย์ SEO → AI Search: the questions customers ask AI (Google AI Overview, ChatGPT, Perplexity) and whether
   the answer cites us. Checked by hand — each cell opens the question in that AI — so there is no API cost.
   Stored in settings (seo.ai) through /api/admin/settings/aisearch.
   ===================================================================== */
const AIS = { d: null, loading: false, q: '' };
const AI_ENG = [['g', 'Google AI Overview', q => 'https://www.google.com/search?q=' + encodeURIComponent(q)], ['c', 'ChatGPT', q => 'https://chatgpt.com/?q=' + encodeURIComponent(q)], ['p', 'Perplexity', q => 'https://www.perplexity.ai/search?q=' + encodeURIComponent(q)]];
const AI_RES = { cited: ['อ้างอิงเรา', '#1e7a46', '#e8f5ec'], mention: ['กล่าวถึง', '#9a5b00', '#fff4e0'], no: ['ไม่เจอเรา', '#6b5e60', '#f3eeee'] };
const AI_FREQ = { weekly: ['สัปดาห์ละครั้ง (วันจันทร์)', 7, 4], biweekly: ['ทุก 2 สัปดาห์', 14, 2], monthly: ['เดือนละครั้ง', 30, 1] };
function aisLoad() {
  if (AIS.loading || AIS.d || !can('seo')) return; AIS.loading = true;
  api('GET', 'settings/aisearch').then(d => { AIS.d = d; }).catch(() => { AIS.d = { cfg: { freq: 'weekly', n: 30 }, qs: [] }; })
    .finally(() => { AIS.loading = false; if (CUR === 'seo' && SEOV.tab === 'ai') vSeo(); });
}
function aisSave(note) { api('PUT', 'settings/aisearch', { value: AIS.d, note: note || '' }).then(d => { AIS.d = d; AUDIT_DIRTY = !!note || AUDIT_DIRTY; if (CUR === 'seo' && SEOV.tab === 'ai') vSeo(); }).catch(fail); }
const aisDue = q => { const days = AI_FREQ[AIS.d.cfg.freq][1], last = AI_ENG.map(([e]) => q.checks[e]?.at).filter(Boolean).sort().pop(); return !last || (Date.now() - new Date(last)) / 864e5 >= days; };
/* questions worth asking: the keywords people really search (imported from Search Console), then articles' main keywords */
function aisIdeas() {
  const have = new Set((AIS.d?.qs || []).map(q => q.q.toLowerCase())), out = [], add = (q, lang, why) => { q = String(q || '').trim(); if (q && !have.has(q.toLowerCase()) && !out.some(x => x.q.toLowerCase() === q.toLowerCase())) out.push({ q, lang, why }); };
  [['เช่าเรือยอชต์ภูเก็ต ที่ไหนดี', 'th'], ['บริษัทเช่าเรือยอชต์ส่วนตัว ภูเก็ต แนะนำ', 'th'], ['เช่าเรือไปเกาะพีพีแบบส่วนตัว ราคาเท่าไหร่', 'th'], ['best yacht charter company in Phuket', 'en'], ['private boat to Phi Phi from Phuket — which company?', 'en'], ['catamaran charter Phuket recommendation', 'en']].forEach(([q, l]) => add(q, l, 'คำถามเลือกบริษัท'));
  (KWI.d?.cur?.rows || []).slice().sort((a, b) => b.imp - a.imp).slice(0, 40).forEach(r => add(r.q, ggTh(r.q) ? 'th' : 'en', `คนค้นใน Google ${nf(r.imp)} ครั้ง`));
  ART.filter(a => a.status === 'published').forEach(a => LANGS.forEach(([k]) => { if (a.kw?.[k]) add(a.kw[k], k, 'คีย์เวิร์ดของบทความ'); }));
  return out.slice(0, 80);
}
function aisAdd() {
  const I = aisIdeas();
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">เพิ่มคำถามที่ติดตาม</p><p class="text-[12px] text-muted mt-1">พิมพ์คำถามที่ลูกค้าน่าจะถาม AI หรือเลือกจากคีย์เวิร์ดที่มีอยู่</p>
      <div class="flex gap-2 mt-3"><input id="aisNew" class="inp flex-1" placeholder="เช่น เช่าเรือยอชต์ภูเก็ต ที่ไหนดี" onkeydown="if(event.key==='Enter')aisAddGo()"/><button class="btn btn-p" onclick="aisAddGo()">เพิ่ม</button></div></div>
    ${I.length ? `<div class="px-5 pt-3 pb-1 flex items-center justify-between text-[12px]"><span class="text-muted">แนะนำ ${I.length} คำถาม</span><label class="flex items-center gap-2"><input type="checkbox" onchange="$$('#aisIdeas input').forEach(i=>i.checked=this.checked)"/>เลือกทั้งหมด</label></div>
    <div id="aisIdeas" class="overflow-y-auto divide-y" style="max-height:46vh;border-color:rgb(35 20 22/.06)">${I.map((x, i) => `<label class="flex items-center gap-3 px-5 py-2.5 cursor-pointer" style="border-color:rgb(35 20 22/.06)"><input type="checkbox" value="${i}"/><span class="lang-b">${x.lang.toUpperCase()}</span><span class="flex-1 min-w-0 truncate text-[13px]">${esc(x.q)}</span><span class="text-[11px] text-muted whitespace-nowrap">${esc(x.why)}</span></label>`).join('')}</div>` : ''}
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ปิด</button>${I.length ? `<button class="btn btn-p" onclick="aisAddGo()">เพิ่มที่เลือก</button>` : ''}</div>`);
  AIS.ideas = I; $('#modalBox').style.maxWidth = '680px'; setTimeout(() => $('#aisNew')?.focus(), 50);
}
function aisAddGo() {
  const t = $('#aisNew')?.value.trim(), pick = [...$$('#aisIdeas input:checked')].map(i => AIS.ideas[+i.value]);
  const add = [...(t ? [{ q: t, lang: ggTh(t) ? 'th' : 'en' }] : []), ...pick].filter(x => !AIS.d.qs.some(q => q.q.toLowerCase() === x.q.toLowerCase()));
  if (!add.length) return toast('ไม่มีคำถามใหม่');
  add.forEach(x => AIS.d.qs.push({ id: Math.random().toString(36).slice(2, 10), q: x.q, lang: x.lang, at: iso(TODAY), checks: {} }));
  closeModal(); aisSave(`เพิ่มคำถาม ${add.length} ข้อ`); toast(`เพิ่ม ${add.length} คำถามแล้ว`);
}
/* record what each AI answered for one question */
function aisRecord(id) {
  const Q = AIS.d.qs, q = id ? Q.find(x => x.id === id) : null;
  const seg = e => { const c = q?.checks[e]; return `<div class="flex flex-wrap gap-1" data-e="${e}">${[...Object.entries(AI_RES), ['', ['ไม่ได้ตรวจ']]].map(([r, [l]]) => `<button type="button" class="h-8 px-3 rounded-full text-[12px] ring-1 ring-line ${(c?.r || '') === r ? 'bg-ink text-white' : 'bg-white'}" data-r="${r}" onclick="this.parentElement.querySelectorAll('button').forEach(b=>{b.classList.remove('bg-ink','text-white');b.classList.add('bg-white')});this.classList.add('bg-ink','text-white');this.classList.remove('bg-white')">${l}</button>`).join('')}</div>`; };
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">บันทึกผลการตรวจ</p><p class="text-[12px] text-muted mt-1">ถาม AI แต่ละตัว แล้วดูว่าคำตอบลิงก์ไปเว็บเรา (อ้างอิง) แค่พูดชื่อเรา (กล่าวถึง) หรือไม่มีเราเลย</p></div>
    <div class="p-5 grid gap-4">
      <label class="grid gap-1.5"><span class="lbl !mb-0">คำถาม</span>${q ? `<p class="text-[13.5px]">${esc(q.q)}</p>` : `<select id="aisQ" class="inp">${Q.map(x => `<option value="${x.id}">${esc(x.q)}</option>`).join('')}</select>`}</label>
      ${AI_ENG.map(([e, l, u]) => `<div class="grid gap-2"><div class="flex items-center justify-between"><span class="text-[13px] font-medium">${l}</span><a class="text-[12px] text-maroon inline-flex items-center gap-1" target="_blank" rel="noopener" href="${u(q?.q || '')}" ${q ? '' : `onclick="this.href=(${u.toString()})(AIS.d.qs.find(x=>x.id===$('#aisQ').value).q)"`}>ถาม ${l.split(' ')[0]}<i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i></a></div>${seg(e)}
        <input class="inp !h-9" data-u="${e}" placeholder="ลิงก์ที่ AI อ้างอิง (ถ้ามี)" value="${esc(q?.checks[e]?.url || '')}"/></div>`).join('')}
    </div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="aisRecordGo(${q ? `'${q.id}'` : `$('#aisQ').value`})">บันทึก</button></div>`);
  $('#modalBox').style.maxWidth = '560px'; icons();
}
function aisRecordGo(id) {
  const q = AIS.d.qs.find(x => x.id === id); if (!q) return; let n = 0;
  AI_ENG.forEach(([e]) => { const r = $(`#modalBox [data-e="${e}"] .bg-ink`)?.dataset.r || '', url = $(`#modalBox [data-u="${e}"]`)?.value.trim() || '';
    if (!r) return; const old = q.checks[e]; n++;
    q.checks[e] = { r, at: iso(TODAY), url: /^https?:\/\//.test(url) ? url : '', hist: [...(old?.hist || []), ...(old ? [[old.at, old.r]] : [])].slice(-8) }; });
  closeModal(); if (!n) return toast('ยังไม่ได้เลือกผลของระบบไหนเลย');
  aisSave(`บันทึกผล “${q.q.slice(0, 60)}” ${n} ระบบ`); toast('บันทึกผลแล้ว');
}
function aisDel(id) { const i = AIS.d.qs.findIndex(x => x.id === id); if (i < 0 || !confirm('เลิกติดตามคำถามนี้?')) return; AIS.d.qs.splice(i, 1); aisSave('เลิกติดตามคำถาม 1 ข้อ'); }
function seoAiTab() {
  aisLoad(); try { kwiLoad(); } catch (e) { } const D = AIS.d;
  if (!D) return '<div class="card p-10 text-center text-muted">กำลังโหลด…</div>';
  const Q = D.qs, latest = Q.flatMap(q => AI_ENG.map(([e]) => q.checks[e]).filter(Boolean));
  const citedQ = Q.filter(q => AI_ENG.some(([e]) => q.checks[e]?.r === 'cited')).length, checkedQ = Q.filter(q => AI_ENG.some(([e]) => q.checks[e])).length;
  const rate = latest.length ? Math.round(latest.filter(c => c.r === 'cited').length / latest.length * 100) : null;
  const blocked = Object.entries(ROBOTS.ai || {}).filter(([, v]) => !v).map(([k]) => k);
  const card = (l, v, s, ic, col) => `<div class="card p-5 grid gap-1"><span class="flex items-start justify-between gap-2"><span class="text-[12.5px] text-muted">${l}</span><span class="w-9 h-9 rounded-full bg-white grid place-items-center shrink-0" style="margin:-4px -4px 0 0;box-shadow:0 4px 14px -8px rgb(58 0 7/.45)"><i data-lucide="${ic}" class="w-4 h-4"></i></span></span><span class="text-[24px] font-medium tnum leading-tight mt-2" style="color:${col || 'inherit'}">${v}</span><span class="text-[12px] text-muted">${s}</span></div>`;
  const cards = `<div data-kwcards class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">${card('คำถามที่ AI อ้างอิงเรา', nf(citedQ), `จาก ${nf(Q.length)} คำถาม (อย่างน้อย 1 ระบบ)`, 'bot', citedQ ? '#1e7a46' : '')}${card('คำถามที่ติดตาม', nf(Q.length), checkedQ ? `ตรวจแล้ว ${nf(checkedQ)} · ถึงรอบ ${nf(Q.filter(aisDue).length)}` : 'ยังไม่ได้บันทึกผล', 'search', '')}${card('อัตราถูกอ้างอิง', rate === null ? '—' : rate + '%', 'นับผลตรวจล่าสุดของแต่ละระบบ', 'trending-up', '')}${card('llms.txt', ROBOTS.llms ? 'เปิดใช้' : 'ปิดอยู่', blocked.length ? `ปิด AI ${blocked.length} ตัวใน robots.txt` : '/llms.txt · AI อ่านเว็บได้ทุกตัว', 'file-text', ROBOTS.llms && !blocked.length ? '' : '#9a5b00')}</div>`;
  const cell = (q, e, u) => { const c = q.checks[e], R = c && AI_RES[c.r], prev = c?.hist?.length ? c.hist[c.hist.length - 1][1] : null;
    const tr = c && prev && prev !== c.r ? (c.r === 'cited' || (c.r === 'mention' && prev === 'no') ? '<span style="color:#1e7a46">▲</span>' : '<span style="color:#a3222c">▼</span>') : '';
    return `<td><div class="flex items-center gap-2">${R ? `<button class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] whitespace-nowrap" style="color:${R[1]};background:${R[2]}" onclick="aisRecord('${q.id}')" title="ตรวจ ${fmtD(c.at)}${c.url ? ' · ' + esc(c.url) : ''}">${R[0]} ${tr}</button>` : `<button class="text-[12px] text-muted hover:text-maroon" onclick="aisRecord('${q.id}')">ยังไม่ตรวจ</button>`}
      <a class="text-muted hover:text-maroon" target="_blank" rel="noopener" href="${u(q.q)}" title="ถามคำถามนี้"><i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i></a></div>${c ? `<p class="text-[10.5px] text-muted mt-0.5">${fmtD(c.at)}</p>` : ''}</td>`; };
  const L = Q.filter(q => !AIS.q || q.q.toLowerCase().includes(AIS.q.toLowerCase())).sort((a, b) => (aisDue(b) - aisDue(a)) || a.q.localeCompare(b.q, 'th'));
  const F = AI_FREQ[D.cfg.freq], perMonth = D.cfg.n * 3 * F[2];
  return `${cards}<div class="card overflow-hidden mb-4"><div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3"><div><p class="font-medium">คำถาม “ที่ไหนดี” ที่ AI อ้างอิงเรา</p><p class="text-[11.5px] text-muted mt-0.5">กดลูกศรเพื่อถาม AI ตัวนั้น แล้วกดผลเพื่อบันทึก · คำถามที่ถึงรอบตรวจอยู่บนสุด</p></div>
      <div class="flex flex-wrap items-center gap-2">${Q.length ? `<input class="inp !h-9" style="width:190px" placeholder="ค้นหาคำถาม…" value="${esc(AIS.q)}" onkeydown="if(event.key==='Enter'){AIS.q=this.value;vSeo()}"/>` : ''}<button class="btn btn-o !h-9" onclick="aisAdd()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มคำถาม</button>${Q.length ? `<button class="btn btn-p !h-9" onclick="aisRecord('')"><i data-lucide="plus" class="w-3.5 h-3.5"></i>บันทึกผลการตรวจ</button>` : ''}</div></div>
    <div class="overflow-x-auto"><table class="tbl min-w-[900px]"><thead><tr><th>คำถาม</th>${AI_ENG.map(([, l]) => `<th>${l}</th>`).join('')}<th></th></tr></thead><tbody>
    ${L.map(q => `<tr><td class="min-w-[260px]"><span class="lang-b mr-1.5">${q.lang.toUpperCase()}</span>${esc(q.q)}${aisDue(q) && AI_ENG.some(([e]) => q.checks[e]) ? ' <span class="lang-b mid">ถึงรอบ</span>' : ''}</td>${AI_ENG.map(([e, , u]) => cell(q, e, u)).join('')}<td class="text-right"><button class="btn btn-g !px-2 !h-8 text-muted" title="เลิกติดตาม" onclick="aisDel('${q.id}')"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`).join('') || `<tr><td colspan="5" class="text-center text-muted py-14">ยังไม่มีคำถาม · กด “เพิ่มคำถาม” แล้วเลือกจากคีย์เวิร์ดที่คนค้นจริง หรือพิมพ์คำถามเอง</td></tr>`}</tbody></table></div></div>
    <div class="grid xl:grid-cols-2 gap-4 items-start">
      <div class="card p-5 grid gap-3"><p class="font-medium">ควบคุมค่าใช้จ่าย</p>
        <label class="grid gap-1.5"><span class="lbl !mb-0">รอบตรวจ</span><select class="inp" onchange="AIS.d.cfg.freq=this.value;aisSave()">${Object.entries(AI_FREQ).map(([k, [l]]) => `<option value="${k}" ${D.cfg.freq === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="grid gap-1.5"><span class="lbl !mb-0">จำนวนคำถามต่อรอบ</span><select class="inp" onchange="AIS.d.cfg.n=+this.value;aisSave()">${[10, 20, 30, 50].map(n => `<option value="${n}" ${D.cfg.n === n ? 'selected' : ''}>${n} คำถาม${n === 30 ? ' (คีย์เวิร์ดสำคัญ Top 30)' : ''}</option>`).join('')}</select></label>
        <p class="text-[11.5px] text-muted">ประมาณ ${D.cfg.n} คำถาม × 3 ระบบ × ${F[2]} รอบ/เดือน = ${nf(perMonth)} ครั้ง/เดือน · ตรวจเองฟรี ไม่ใช้ API · ถึงรอบแล้ว ${nf(Q.filter(aisDue).length)} คำถาม</p></div>
      <div class="card p-5"><p class="font-medium">ทำให้ AI อ้างอิงเรามากขึ้น</p>
        <ul class="mt-3 grid gap-2 text-[13px] list-disc pl-5"><li>สรุปคำตอบ 2–3 บรรทัดใต้หัวข้อ ให้ AI ยกไปตอบได้ทันที</li><li>ใส่ตารางเปรียบเทียบที่หัวคอลัมน์ชัดเจน (ราคา จำนวนคน เวลา)</li><li>อัปเดตปีและวันที่ทุกครั้งที่ราคาเปลี่ยน</li><li>มีบล็อก FAQ ในบทความ (ตรวจได้ที่แท็บ ตรวจสุขภาพ)</li><li>ไฟล์ /llms.txt สรุปเรือ ราคา และบทความหลัก${ROBOTS.llms ? '' : ' · <b class="font-medium" style="color:#9a5b00">ตอนนี้ปิดอยู่</b>'}</li>${blocked.length ? `<li style="color:#9a5b00">robots.txt ปิด ${blocked.map(esc).join(', ')} อยู่ · AI ตัวนั้นจะอ่านเว็บไม่ได้</li>` : ''}</ul>
        <div class="flex flex-wrap gap-2 mt-4"><a class="btn btn-o !h-9" href="/llms.txt" target="_blank" rel="noopener"><i data-lucide="external-link" class="w-3.5 h-3.5"></i>ดู /llms.txt</a><button class="btn btn-g !h-9" onclick="SEOV.tab='sitemap';vSeo()"><i data-lucide="pencil" class="w-3.5 h-3.5"></i>ตั้งค่า llms.txt / AI crawlers</button></div></div></div>`;
}
{ const _va = vSeo; vSeo = function () {
  const on = SEOV.tab === 'ai'; if (on) SEOV.tab = 'schema';
  try { _va(); } finally { if (on) SEOV.tab = 'ai'; }
  const bar = $('#view .tabbar'); if (!bar) return;
  if (on) bar.querySelector('.tab.on')?.classList.remove('on');
  const st = [...bar.querySelectorAll('.tab')].find(t => (t.getAttribute('onclick') || '').includes("'settings'"));
  const html = `<button class="tab ${on ? 'on' : ''}" onclick="SEOV.tab='ai';vSeo()">AI Search</button>`;
  st ? st.insertAdjacentHTML('beforebegin', html) : bar.insertAdjacentHTML('beforeend', html);
  if (on) { const b = $('#seoBody'); if (b) { b.classList.remove('p-4', 'sm:p-5'); b.classList.add('p-0'); b.innerHTML = seoAiTab(); const c = b.querySelector('[data-kwcards]'); if (c) bar.insertAdjacentElement('afterend', c); const w = b.parentElement; if (w?.classList.contains('card')) w.classList.remove('card'); } }
  icons();
}; PAGES.find(p => p[0] === 'seo')[3] = vSeo; }

/* ---------- ศูนย์ SEO → ตั้งค่า: templates and switches that the site really applies (public/site/fleet.js) ---------- */
['year', 'ogImg', 'ext', 'noSearch'].forEach(k => { if (SSET[k] === undefined) SSET[k] = true; });
if (SSET.extNofollow === undefined) SSET.extNofollow = false;
/* older templates used %name%: shown as {{name}} like the other variables (the site reads both) */
Object.values(SSET.tpl || {}).forEach(o => LANGS.forEach(([k]) => { if (o && typeof o[k] === 'string') o[k] = o[k].replace(/%(\w+)%/g, '{{$1}}'); }));
const SST_VARS = { boat: ['name', 'price', 'pax', 'marina', 'type', 'year', 'sep', 'site'], article: ['title', 'excerpt', 'year', 'sep', 'site'] };
/** same rules as the site (fxTpl): %x% or {{x}}, empty values and dangling separators drop out */
function sstFill(t, v) {
  const out = String(t || '').replace(/\{\{\s*(\w+)\s*\}\}|%(\w+)%/g, (_, a, b) => { const k = a || b; return v[k] != null && v[k] !== '' ? String(v[k]) : ''; });
  return out.replace(/\s+([|–·»])\s+(?=[|–·»]|$)/g, ' ').replace(/(เริ่ม|from)\s*(?=[|–·»]|$)/gi, '').replace(/\s{2,}/g, ' ').replace(/^\s*[|–·»]\s*|\s*[|–·»]\s*$/g, '').trim();
}
function sstVals(kind, k) {
  const sep = SSET.sep || '|', site = SSET.site?.[k] || 'Boat Trip Thailand', y = String(new Date().getFullYear());
  if (kind === 'boat') { const b = FLEET.find(x => x.active && x.from_) || FLEET[0] || {}; return { name: b.name || 'Leopard 90 ft', price: b.from_ ? (k === 'en' ? '$' + Math.round(b.from_ / 33.42).toLocaleString('en-US') : baht(b.from_)) : '', pax: b.pax || '', marina: String(b.marina || '').replace(/\s*\(.*?\)/, ''), type: k === 'en' ? ({ yacht: 'Yacht', sail: 'Sailing catamaran', power: 'Power catamaran', speed: 'Speedboat' })[b.type] || '' : TYPE_TH[b.type] || '', year: y, sep, site }; }
  const a = ART.find(x => x.status === 'published' && x.title[k]) || ART[0] || { title: tr(), excerpt: tr() };
  return { title: a.title[k] || a.title.th, excerpt: a.excerpt?.[k] || '', year: y, sep, site };
}
function sstRow(group, kind, label, ph, area) {
  return `<div class="grid gap-2" style="grid-template-columns:minmax(0,1fr)"><p class="lbl !mb-0">${label}</p>${LANGS.map(([k, C]) => { const v = SSET[group][kind][k] || '', out = v ? sstFill(v, sstVals(kind, k)) : '(เว้นว่าง · ใช้รูปแบบเดิมของระบบ)', n = thLen(out), [mn, mx] = SEO_LEN[group === 'tpl' ? 't' : 'd'];
    return `<div class="grid gap-1" style="grid-template-columns:minmax(0,1fr)"><div class="relative"><span class="bi-tag">${C}</span>${area ? `<textarea rows="2" class="inp !pl-10" placeholder="${esc(ph[k])}" oninput="SSET.${group}.${kind}.${k}=this.value;sstPrev(this,'${group}','${kind}','${k}')">${esc(v)}</textarea>` : `<input class="inp !pl-10" placeholder="${esc(ph[k])}" value="${esc(v)}" oninput="SSET.${group}.${kind}.${k}=this.value;sstPrev(this,'${group}','${kind}','${k}')"/>`}</div>
      <p class="text-[11.5px] flex justify-between gap-3"><span class="truncate" style="color:#1a0dab">${esc(out)}</span><span class="tnum shrink-0" style="color:${n > mx ? '#a3222c' : n >= mn ? '#1e7a46' : '#9a5b00'}">${n}</span></p></div>`; }).join('')}</div>`;
}
const SST_PH = {
  tpl: { boat: tr('{{name}} เช่าเรือภูเก็ต เริ่ม {{price}} {{sep}} {{site}}', '{{name}} Yacht Charter Phuket from {{price}} {{sep}} {{site}}'), article: tr('{{title}} {{sep}} {{site}}', '{{title}} {{sep}} {{site}}') },
  dtpl: { boat: tr('เช่า{{type}} {{name}} ส่วนตัวในภูเก็ต รับได้ {{pax}} คน ออกจาก {{marina}} ราคาเริ่มต้น {{price}} รวมกัปตันและลูกเรือ', 'Charter the {{name}}, a private {{type}} in Phuket for up to {{pax}} guests from {{marina}}. From {{price}} with captain and crew.'), article: tr('{{excerpt}}', '{{excerpt}}') },
};
SSET.dtpl ??= { boat: { ...SST_PH.dtpl.boat }, article: { ...SST_PH.dtpl.article } };   // first time: start from the suggested descriptions
function sstPrev(el, group, kind, k) {
  const p = el.closest('.grid.gap-1')?.querySelector('p'), out = el.value ? sstFill(el.value, sstVals(kind, k)) : '(เว้นว่าง · ใช้รูปแบบเดิมของระบบ)', n = thLen(out), [mn, mx] = SEO_LEN[group === 'tpl' ? 't' : 'd'];
  if (p) { p.firstElementChild.textContent = out; p.lastElementChild.textContent = n; p.lastElementChild.style.color = n > mx ? '#a3222c' : n >= mn ? '#1e7a46' : '#9a5b00'; }
}
seoSettings = function () {
  const S = SSET, tg = (k, l, h) => `<label class="flex items-center justify-between gap-4 py-3 border-b border-line last:border-0"><span><span class="block text-[13.5px]">${l}</span>${h ? `<span class="block text-[11.5px] text-muted mt-0.5">${h}</span>` : ''}</span><span class="tgl shrink-0"><input type="checkbox" ${S[k] ? 'checked' : ''} onchange="SSET.${k}=this.checked;try{seoTick()}catch(e){}"/><span></span></span></label>`;
  const on = (l, h) => `<div class="flex items-center justify-between gap-4 py-3 border-b border-line last:border-0"><span><span class="block text-[13.5px]">${l}</span>${h ? `<span class="block text-[11.5px] text-muted mt-0.5">${h}</span>` : ''}</span><span class="lang-b ok shrink-0">เปิดอยู่เสมอ</span></div>`;
  const id = (k, l, ph) => `<label class="grid gap-1"><span class="lbl !mb-0">${l}</span><input class="inp font-mono !text-[12px]" placeholder="${ph}" value="${esc(S[k] || '')}" onchange="SSET.${k}=this.value;try{seoTick()}catch(e){}"/></label>`;
  return `<div class="grid xl:grid-cols-2 gap-4 items-start" style="grid-template-columns:${innerWidth >= 1280 ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)'}">
    <div class="card p-5 grid gap-4" style="grid-template-columns:minmax(0,1fr);min-width:0"><div class="flex items-center justify-between gap-3"><p class="font-medium">รูปแบบ Title & Meta</p><label class="flex items-center gap-2 text-[12px]"><span class="text-muted">ตัวคั่น</span><select class="inp !h-8 !w-16" onchange="SSET.sep=this.value;try{seoTick()}catch(e){};vSeo()">${['|', '–', '·', '»'].map(s => `<option ${S.sep === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
      ${sstRow('tpl', 'boat', 'Title หน้าเรือ', SST_PH.tpl.boat)}${sstRow('dtpl', 'boat', 'Meta description หน้าเรือ', SST_PH.dtpl.boat, true)}
      ${sstRow('tpl', 'article', 'Title บทความ', SST_PH.tpl.article)}${sstRow('dtpl', 'article', 'Meta description บทความ', SST_PH.dtpl.article, true)}
      <p class="text-[11.5px] text-muted">ใช้เฉพาะหน้าที่ไม่ได้ตั้ง Title / Description เอง · เว้นว่าง = ใช้รูปแบบเดิมของระบบ · ตัวแปรหน้าเรือ: <span class="font-mono">${SST_VARS.boat.map(v => `{{${v}}}`).join(' ')}</span> · บทความ: <span class="font-mono">${SST_VARS.article.map(v => `{{${v}}}`).join(' ')}</span> · บันทึกอัตโนมัติ</p></div>
    <div class="grid gap-4">
      <div class="card px-5 py-2">
        ${tg('year', 'อัปเดตปีใน Title อัตโนมัติเมื่อขึ้นปีใหม่', 'พิมพ์ {{year}} ใน Title / Description ของหน้าไหนก็ได้ (เช่น “เช่าเรือยอชต์ภูเก็ต {{year}}”) ระบบเปลี่ยนเป็นปีปัจจุบันให้เอง')}
        ${tg('ogImg', 'ใช้รูปหน้าปกเรือเป็นรูปแชร์ (OG 1200×630)', 'แชร์ลิงก์เรือใน LINE / Facebook แล้วขึ้นรูปเรือลำนั้น ไม่ใช่รูปเริ่มต้นของเว็บ · บทความใช้รูปปกบทความอยู่แล้ว')}
        ${tg('ext', 'ลิงก์ภายนอกในบทความเปิดแท็บใหม่ + rel="noopener"', 'ลิงก์ที่มี ?ref= / ?aff= ใส่ rel="sponsored" ให้เอง ตามกฎของ Google')}
        ${tg('extNofollow', 'ลิงก์ภายนอกในบทความใส่ rel="nofollow"', 'ไม่ส่งคะแนน SEO ให้เว็บอื่น · ปกติไม่จำเป็น เปิดเมื่อลิงก์ไปเว็บที่ไม่ได้รับรอง')}
        ${tg('noSearch', 'noindex หน้ารวมเรือที่มีตัวกรอง', 'เช่น ?type=sail ?stay=… ?pax=… · กัน Google เก็บหน้าซ้ำหลายร้อยแบบ · หน้าค้นหาบทความ noindex อยู่แล้ว')}
        ${on('Canonical อัตโนมัติ (ตัด ?utm, ?gclid, ?page)', 'ทุกหน้าชี้ไป URL หลักของตัวเอง · ตั้ง canonical แยกรายหน้าได้ที่ Meta ทุกหน้า')}
        ${on('hreflang th / en + Breadcrumb + Twitter card', 'ทุกหน้ามีคู่ภาษา และ JSON-LD Breadcrumb ให้ Google แสดงเส้นทางหน้า')}
        ${on('แปลงรูปเป็น WebP / AVIF + lazy load', 'ส่งไฟล์ที่เล็กที่สุดตามเบราว์เซอร์ · รูปที่อยู่ด้านล่างโหลดเมื่อเลื่อนถึง')}</div>
      <div class="card p-5 grid gap-3"><p class="font-medium">ยืนยันความเป็นเจ้าของเว็บ</p><div class="grid sm:grid-cols-2 gap-3">${id('gsc', 'Google Search Console', 'google-site-verification=…')}${id('bing', 'Bing Webmaster Tools', 'msvalidate.01=…')}</div>
        <p class="text-[11.5px] text-muted">วางรหัสหรือทั้งแท็ก &lt;meta&gt; ได้ · ระบบใส่ในหน้าเว็บให้เอง · Google Analytics และ Meta Pixel ตั้งที่ วิเคราะห์เว็บไซต์ → เชื่อมต่อ API (โหลดหลังลูกค้ายอมรับคุกกี้)</p></div>
    </div></div>`;
};
{ const _vs = vSeo; vSeo = function () { _vs(); if (SEOV.tab === 'settings') { const t = [...$$('#view .tabbar .tab')].find(x => (x.getAttribute('onclick') || '').includes("'settings'")); if (t) t.textContent = 'ตั้งค่า'; const b = $('#seoBody'); if (b) { b.classList.remove('p-4', 'sm:p-5'); b.classList.add('p-0'); const w = b.parentElement; if (w?.classList.contains('card')) w.classList.remove('card'); } icons(); } else { const t = [...$$('#view .tabbar .tab')].find(x => (x.getAttribute('onclick') || '').includes("'settings'")); if (t) t.textContent = 'ตั้งค่า'; } }; PAGES.find(p => p[0] === 'seo')[3] = vSeo; }

/* ---------- วิเคราะห์เว็บไซต์ → เชื่อมต่อ API: ids and the service account key are set here (saved encrypted; .env still wins) ---------- */
const GGC = { test: null, testing: false, saving: false, sa: '' };
function ggSetup() {
  const s = GG.st || {}, C = s.cfg || {}, src = s.src || {}, canSet = can('settings') && !isRO();
  const env = k => src[k] === 'env', lock = k => env(k) || !canSet ? 'disabled' : '';
  const fld = (id, l, v, ph, help, k) => `<label class="grid gap-1.5 min-w-0"><span class="lbl !mb-0">${l}</span><input id="${id}" class="inp" ${lock(k)} value="${esc(v || '')}" placeholder="${ph}"/><span class="text-[11px] text-muted">${env(k) ? 'ตั้งใน .env บนเซิร์ฟเวอร์ (ใช้ค่านี้ก่อน)' : help}</span></label>`;
  const T = GGC.test, row = x => `<li class="flex items-start gap-2 text-[12.5px]"><i data-lucide="${x.ok ? 'circle-check' : 'circle-x'}" class="w-4 h-4 shrink-0 mt-0.5" style="color:${x.ok ? '#1e7a46' : '#a3222c'}"></i><span><b class="font-medium">${esc(x.step)}</b> · <span class="${x.ok ? 'text-muted' : ''}" style="${x.ok ? '' : 'color:#a3222c'}">${esc(x.msg)}</span></span></li>`;
  const email = s.email || C.savedEmail;
  return `<div class="grid xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
    <div class="card p-5 grid gap-4 min-w-0"><p class="font-medium">ค่าการเชื่อมต่อ</p>
      <div class="grid md:grid-cols-3 gap-4">${fld('ggcMid', 'GA4 Measurement ID (ติดตั้งโค้ดบนเว็บ)', C.ga4Id, 'G-XXXXXXXXXX', 'GA4 › ผู้ดูแลระบบ › สตรีมข้อมูล › เว็บ', 'ga4Id')}${fld('ggcProp', 'GA4 Property ID (ดึงรายงาน)', C.propertyId, 'เช่น 514093027', 'GA4 › ผู้ดูแลระบบ › รายละเอียดพร็อพเพอร์ตี้ (ตัวเลข)', 'property')}${fld('ggcSite', 'Search Console พร็อพเพอร์ตี้', C.gscSite, 'https://boattripthailand.com/', 'แบบโดเมน: sc-domain:… · แบบ URL: https://…/ (มี / ท้าย)', 'site')}</div>
      <label class="grid gap-1.5"><span class="lbl !mb-0">Service Account (ไฟล์ JSON) — ใช้ดึงข้อมูล GA4 + Search Console</span>
        <textarea id="ggcSa" rows="4" class="inp font-mono !text-[12px]" ${lock('key')} spellcheck="false" autocomplete="off" placeholder="${env('key') ? 'ตั้งใน .env บนเซิร์ฟเวอร์ (GOOGLE_SERVICE_ACCOUNT_JSON)' : email ? `บันทึกแล้ว: ${esc(email)} · วางไฟล์ใหม่เพื่อเปลี่ยน` : 'วางเนื้อหาไฟล์ .json ทั้งไฟล์ หรือกด “เลือกไฟล์ .json”'}" oninput="GGC.sa=this.value">${esc(GGC.sa)}</textarea></label>
      ${canSet && !env('key') ? `<div class="flex flex-wrap items-center gap-2"><label class="btn btn-o !h-9 cursor-pointer"><i data-lucide="upload" class="w-3.5 h-3.5"></i>เลือกไฟล์ .json<input type="file" accept=".json,application/json" class="hidden" onchange="ggcFile(this.files)"/></label>${C.savedEmail ? `<button class="btn btn-g !h-9 text-muted" onclick="ggcRemove()"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i>ลบที่บันทึกไว้</button>` : ''}<span class="text-[11px] text-muted">เก็บแบบเข้ารหัสบนเซิร์ฟเวอร์ · ไม่ส่งกลับมาที่เบราว์เซอร์อีก</span></div>` : ''}
      ${T ? `<ul class="grid gap-1.5 rounded-xl bg-sand p-3">${T.map(row).join('')}</ul>` : ''}
      <div class="flex flex-wrap justify-end gap-2 pt-1"><button class="btn btn-o" ${GGC.testing ? 'disabled' : ''} onclick="ggcTest()"><i data-lucide="zap" class="w-3.5 h-3.5"></i>${GGC.testing ? 'กำลังทดสอบ…' : 'ทดสอบการเชื่อมต่อ Google'}</button>${canSet ? `<button class="btn btn-p" ${GGC.saving ? 'disabled' : ''} onclick="ggcSave()"><i data-lucide="check" class="w-3.5 h-3.5"></i>${GGC.saving ? 'กำลังบันทึก…' : 'บันทึก'}</button>` : ''}</div>
      ${!canSet ? '<p class="text-[11.5px] text-muted">แก้ค่าได้เฉพาะผู้ที่มีสิทธิ์ ตั้งค่าเว็บไซต์</p>' : ''}</div>
    <div class="card p-5 min-w-0"><p class="font-medium">วิธีสร้าง Service Account (ฟรี)</p>
      <ol class="grid gap-2 mt-3 text-[12.5px] list-decimal pl-5"><li>เปิด <a class="text-maroon" href="https://console.cloud.google.com/" target="_blank" rel="noopener">console.cloud.google.com</a> → สร้างโปรเจกต์</li>
        <li>APIs & Services → เปิด <b class="font-medium">Google Analytics Data API</b> และ <b class="font-medium">Google Search Console API</b></li>
        <li>IAM → Service Accounts → สร้าง → แท็บ Keys → Add key → JSON (ได้ไฟล์ .json)</li>
        <li>GA4 › ผู้ดูแลระบบ › การจัดการสิทธิ์เข้าถึงพร็อพเพอร์ตี้ → เพิ่มอีเมล Service Account (ผู้ดู)</li>
        <li>Search Console › การตั้งค่า › ผู้ใช้และสิทธิ์ → เพิ่มอีเมลเดียวกัน (จำกัด · ถ้าจะกด “ส่งให้ Google” ในศูนย์ SEO ใช้แบบ เต็ม)</li>
        <li>วางไฟล์ JSON ที่ช่อง Service Account → บันทึก → ทดสอบการเชื่อมต่อ</li></ol>
      ${email ? `<div class="flex items-center gap-2 rounded-xl bg-sand px-3 py-2.5 mt-4 text-[12.5px] min-w-0"><i data-lucide="check" class="w-4 h-4 shrink-0" style="color:#1e7a46"></i><span class="font-mono truncate flex-1">${esc(email)}</span><button class="text-muted hover:text-maroon shrink-0" title="คัดลอกอีเมล" onclick="navigator.clipboard?.writeText(${esc(JSON.stringify(email))}).then(()=>toast('คัดลอกอีเมลแล้ว · วางในหน้าจัดการสิทธิ์ของ GA4 / Search Console'))"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button></div>` : ''}
      <p class="text-[11.5px] text-muted mt-4">ตั้งผ่าน .env ได้ด้วย GOOGLE_SERVICE_ACCOUNT_JSON (JSON หรือ base64) · GA4_PROPERTY_ID · GSC_SITE_URL · NEXT_PUBLIC_GA_ID — ค่าใน .env ใช้ก่อนค่าที่บันทึกในหน้านี้ · ข้อมูลจาก Google เก็บไว้ 30 นาที กด “โหลดข้อมูลใหม่” เพื่อดึงใหม่${C.at ? ` · บันทึกล่าสุด ${fmtD(iso(new Date(C.at)))} โดย ${esc(C.by || '')}` : ''}</p></div></div>`;
}
function ggcFile(files) {
  const f = files?.[0]; if (!f) return;
  f.text().then(t => { let j = null; try { j = JSON.parse(t); } catch (e) { } if (!j || j.type !== 'service_account') return toastErr('ไฟล์นี้ไม่ใช่กุญแจ service account');
    GGC.sa = t; const el = $('#ggcSa'); if (el) el.value = t; toast(`อ่านไฟล์ของ ${j.client_email} แล้ว · กดบันทึก`); });
}
function ggcSave() {
  const v = id => $('#' + id)?.disabled ? undefined : $('#' + id)?.value.trim();
  const body = { ga4Id: v('ggcMid') ?? GG.st?.cfg?.ga4Id ?? '', propertyId: v('ggcProp') ?? GG.st?.cfg?.propertyId ?? '', gscSite: v('ggcSite') ?? GG.st?.cfg?.gscSite ?? '' };
  if (GGC.sa.trim()) body.sa = GGC.sa.trim();
  GGC.saving = true; vAnalytics();
  api('PUT', 'analytics/google/config', body).then(r => { GG.st = r.status; GG.d = {}; GGC.sa = ''; AUDIT_DIRTY = true; toast('บันทึกแล้ว · กำลังทดสอบการเชื่อมต่อ…'); GGC.saving = false; ggcTest(); })
    .catch(e => { GGC.saving = false; fail(e); vAnalytics(); });
}
function ggcRemove() {
  if (!confirm('ลบกุญแจ service account ที่บันทึกไว้? (แท็บ Google Analytics / Search Console จะหยุดดึงข้อมูล)')) return;
  const C = GG.st?.cfg || {};
  api('PUT', 'analytics/google/config', { ga4Id: C.ga4Id || '', propertyId: C.propertyId || '', gscSite: C.gscSite || '', sa: null }).then(r => { GG.st = r.status; GG.d = {}; GGC.test = null; AUDIT_DIRTY = true; vAnalytics(); toast('ลบกุญแจแล้ว'); }).catch(fail);
}
function ggcTest() {
  GGC.testing = true; GGC.test = null; vAnalytics();
  api('POST', 'analytics/google/test').then(r => { GGC.test = r.steps; GG.st = r.status; const ok = r.steps.every(x => x.ok); toast(ok ? 'เชื่อมต่อ Google ได้ครบแล้ว' : 'ยังเชื่อมต่อไม่ครบ · ดูรายละเอียดด้านล่าง'); })
    .catch(fail).finally(() => { GGC.testing = false; vAnalytics(); });
}
/* status cards at the top follow the real connection */
{ const _va3 = vAnalytics; vAnalytics = function () {
  if (GA.tab === 'api' && !GG.st && !GGC.st0) { GGC.st0 = 1; api('GET', 'analytics/google/status').then(r => { GG.st = r.status; if (CUR === 'analytics') vAnalytics(); }).catch(() => {}); }
  _va3();
  if (GA.tab === 'api') { const f = $('#view .fade'); if (f && !f.querySelector('#ggcSa')) f.innerHTML = ggSetup(); icons(); }
}; PAGES.find(p => p[0] === 'analytics')[3] = vAnalytics; }

/* ---------- วิเคราะห์เว็บไซต์ → Meta: สถานะจริงจากเซิร์ฟเวอร์ + event ที่ระบบส่งจริง (conversion_events) ---------- */
const MS = { d: null, at: 0, loading: false };
function msLoad() {
  if (MS.loading || (MS.d && Date.now() - MS.at < 60_000)) return; MS.loading = true;
  api('GET', 'marketing/status').then(d => { MS.d = d; MS.at = Date.now(); MP.on = !!d.pixelId; MP.id = d.pixelId || ''; MP.capiOn = d.capi; })
    .catch(() => {}).finally(() => { MS.loading = false; if (CUR === 'analytics' && GA.tab === 'meta') vAnalytics(); });
}
const _metaBody0 = metaBody;
metaBody = function () {
  msLoad();
  if (!['setup', 'events', 'catalog', 'audiences', 'utm'].includes(MP.sub)) MP.sub = 'setup';
  const D = MS.d, sub = [['setup', 'สถานะ & ตั้งค่า'], ['events', 'Events'], ['catalog', 'แคตตาล็อกสินค้า'], ['audiences', 'กลุ่มเป้าหมาย'], ['utm', 'ลิงก์โฆษณา (UTM)']];
  const nav = `<div class="flex gap-1 overflow-x-auto no-sb mb-4">${sub.map(([k, l]) => `<button class="h-8 px-3 rounded-full text-[12.5px] whitespace-nowrap ${MP.sub === k ? 'bg-maroon text-white' : 'text-muted hover:bg-white'}" onclick="MP.sub='${k}';vAnalytics()">${l}</button>`).join('')}</div>`;
  if (MP.sub === 'utm') return _metaBody0().replace(`onclick="toast('คัดลอกลิงก์แล้ว')"><i data-lucide="copy" class="w-3.5 h-3.5"></i>คัดลอก`, `onclick="navigator.clipboard?.writeText($('#utmOut').value).then(()=>toast('คัดลอกลิงก์แล้ว'))"><i data-lucide="copy" class="w-3.5 h-3.5"></i>คัดลอก`);
  if (!D) return nav + '<div class="card p-10 text-center text-muted">กำลังโหลด…</div>';
  const row = (ok, t, d) => `<li class="flex gap-3"><i data-lucide="${ok ? 'check-circle-2' : 'circle'}" class="w-4 h-4 shrink-0 mt-0.5 ${ok ? 'text-[#1e7a46]' : 'text-muted'}"></i><div><p class="text-[13px] font-medium">${t}</p><p class="text-[12px] text-muted mt-0.5">${d}</p></div></li>`;
  const C = D.counts || {}, ST = { sent: ['ส่งแล้ว', 'ok'], failed: ['ไม่สำเร็จ', 'low'], skipped: ['ไม่ได้ส่ง', 'mid'] };
  let b = '';
  if (MP.sub === 'setup') b = `<div class="grid xl:grid-cols-2 gap-4 items-start">
    <div class="card p-5"><p class="font-medium">สถานะการเชื่อมต่อ</p><ul class="grid gap-3 mt-4">
      ${row(!!D.pixelId, 'Meta Pixel (บนหน้าเว็บ)', D.pixelId ? 'Pixel ' + esc(D.pixelId) + ' · โหลดหลังลูกค้ายอมรับคุกกี้การตลาด (PDPA)' : 'ยังไม่ได้ใส่ NEXT_PUBLIC_META_PIXEL_ID')}
      ${row(D.capi, 'Conversions API (จากเซิร์ฟเวอร์)', D.capi ? 'ส่ง Lead → QualifiedLead → Converted ตามสถานะลีดในหลังบ้าน' : 'ยังไม่ได้ใส่ META_CAPI_TOKEN')}
      ${row(!D.test, 'โหมดใช้งานจริง', D.test ? 'ยังเปิด META_TEST_EVENT_CODE อยู่ · event ไปที่ Test events เท่านั้น ลบออกเมื่อทดสอบเสร็จ' : 'ไม่ได้ตั้ง Test Event Code')}</ul>
      <div class="grid grid-cols-3 gap-3 mt-5">${['sent', 'skipped', 'failed'].map(k => `<div class="rounded-xl bg-sand p-3"><p class="text-[11.5px] text-muted">${ST[k][0]} · 30 วัน</p><p class="text-[20px] font-medium tnum mt-1">${nf(C[k] || 0)}</p></div>`).join('')}</div></div>
    <div class="card p-5"><p class="font-medium">วิธีเชื่อมต่อ (ทำครั้งเดียว)</p><ol class="grid gap-2.5 mt-3 text-[12.5px] list-decimal pl-5">
      <li>Meta Business Suite → Events Manager → สร้าง Dataset (Pixel) แล้วคัดลอก Pixel ID</li>
      <li>Dataset → Settings → Conversions API → Generate access token</li>
      <li>ใส่ค่าใน <span class="font-mono">.env</span> บนเซิร์ฟเวอร์ แล้ว build ใหม่ (<span class="font-mono">docker compose up -d --build</span>) เพราะ Pixel ID ฝังในหน้าเว็บตอน build</li>
      <li>ทดสอบด้วย Test Event Code ใน Events Manager → Test events แล้วลบออก</li>
      <li>ยืนยันโดเมนใน Business Settings → Brand safety → Domains (ใส่รหัสได้ที่ SEO → ตั้งค่า SEO)</li></ol>
      <pre class="p-3.5 mt-3 rounded-xl bg-[#1d1416] text-[#f1e6e6] text-[11px] leading-relaxed overflow-auto whitespace-pre-wrap break-all">${esc('NEXT_PUBLIC_META_PIXEL_ID=<Pixel ID>\nMETA_PIXEL_ID=<Pixel ID เดียวกัน>\nMETA_CAPI_TOKEN=<access token>\nMETA_TEST_EVENT_CODE=   # ใส่เฉพาะตอนทดสอบ')}</pre></div></div>`;
  if (MP.sub === 'events') b = `<div class="card overflow-hidden"><div class="px-5 pt-4 pb-2"><p class="font-medium">Event ที่เซิร์ฟเวอร์ส่งไป Meta ล่าสุด</p><p class="text-[11.5px] text-muted">Conversions API · ส่งเมื่อมีลีดใหม่ / เซลล์เปลี่ยนสถานะลีด${D.capi ? '' : ' · ตอนนี้ยังไม่ได้ใส่ token จึงบันทึกเป็น “ไม่ได้ส่ง”'}</p></div>
      <div class="overflow-x-auto"><table class="tbl min-w-[680px]"><thead><tr><th>เวลา</th><th>ลีด</th><th>Event</th><th>สถานะ</th><th>รายละเอียด</th></tr></thead><tbody>
      ${(D.recent || []).filter(r => r.platform === 'meta' || !r.platform).map(r => `<tr><td class="tnum whitespace-nowrap">${new Date(r.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td><td class="font-mono text-[12px]">${esc(r.ref || '—')}</td><td class="font-mono text-[12.5px]">${esc(r.event)}</td><td><span class="lang-b ${(ST[r.status] || ['', 'mid'])[1]}">${(ST[r.status] || [r.status])[0]}</span></td><td class="text-[11.5px] text-muted truncate max-w-[260px]">${esc(typeof r.detail === 'string' ? r.detail : r.detail ? JSON.stringify(r.detail) : '')}</td></tr>`).join('') || '<tr><td colspan="5" class="text-muted">ยังไม่มี event</td></tr>'}</tbody></table></div></div>
    <div class="card overflow-hidden mt-4"><p class="font-medium px-5 pt-4 pb-2">Event ที่หน้าเว็บส่งผ่าน Pixel</p><p class="text-[11.5px] text-muted px-5 pb-2">ส่งอัตโนมัติหลังลูกค้ายอมรับคุกกี้ · ดูจำนวนได้ใน Events Manager</p>
      <div class="overflow-x-auto"><table class="tbl min-w-[620px]"><thead><tr><th>Event</th><th>เกิดเมื่อ</th><th>ข้อมูลที่ส่ง</th></tr></thead><tbody>${MP_EVENTS.map(x => `<tr><td class="font-mono text-[12.5px]">${esc(x.e ?? x[0])}</td><td>${esc(x.w ?? x[1])}</td><td class="text-[11.5px] text-muted font-mono">${esc(x.p ?? x[2])}</td></tr>`).join('')}</tbody></table></div></div>`;
  if (MP.sub === 'catalog') { const ok = FLEET.filter(x => x.active !== false && x.from_), url = location.origin + '/feeds/meta-catalog.csv';
    b = `<div class="card p-5"><p class="font-medium">แคตตาล็อกสินค้าสำหรับโฆษณาแบบไดนามิก</p><p class="text-[12px] text-muted mt-1">Meta ใช้ไฟล์นี้แสดงโฆษณาเรือลำที่ลูกค้าเคยดู · อัปเดตอัตโนมัติจากข้อมูลเรือในหลังบ้าน · id ตรงกับ content_ids ที่ Pixel ส่ง</p>
      <div class="grid sm:grid-cols-2 gap-3 mt-4">${[['ภาษาอังกฤษ (ลิงก์ /en)', url], ['ภาษาไทย', url + '?lang=th']].map(([l, u]) => `<div><p class="lbl">${l}</p><div class="flex items-center gap-2 rounded-xl bg-sand px-3 h-10 min-w-0"><i data-lucide="link" class="w-4 h-4 text-muted shrink-0"></i><a class="font-mono text-[12px] truncate hover:text-maroon" href="${u}" target="_blank">${esc(u)}</a><button class="btn btn-g !h-7 !px-2 ml-auto" onclick="navigator.clipboard?.writeText('${u}').then(()=>toast('คัดลอกลิงก์แล้ว'))"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button></div></div>`).join('')}</div>
      <p class="text-[12.5px] mt-4">มีเรือในแคตตาล็อก <b>${ok.length}</b> ลำ · ไม่รวมเรือที่ยังไม่มีราคาเริ่มต้นหรือไม่มีรูป</p>
      <p class="text-[11.5px] text-muted mt-2">ใส่ลิงก์นี้ที่ Commerce Manager → Catalog → Data sources → Data feed → Scheduled feed (ให้ดึงทุกวัน) · ลิงก์ใช้ได้เมื่อเว็บขึ้นโดเมนจริงแล้ว</p></div>`; }
  if (MP.sub === 'audiences') b = _metaBody0().replace(/^[\s\S]*?<\/div>(?=<div class="grid)/, '')
    .replace(/ประมาณ [^<]*? คน \(ตัวอย่าง\)/g, 'สร้างใน Ads Manager').replace(/<button class="btn btn-o !h-8" onclick="toast\('คัดลอกเงื่อนไขแล้ว[^"]*"\>คัดลอกเงื่อนไข<\/button>/g, '');
  return nav + b;
};


/* ---------- ใช้ประโยชน์จากลีด: conversion toggles + message templates saved to /api/admin/settings/marketing ---------- */
if (BOOT.mkt) { Object.assign(AU.conv, BOOT.mkt.conv); if (BOOT.mkt.tpl) TPL.splice(0, TPL.length, ...BOOT.mkt.tpl.map(t => ({ ...t }))); }
const mktVal = () => ({ conv: { ...AU.conv }, tpl: TPL.map(({ k, n, th, en }) => ({ k, n, th, en })) });
let MKTSNAP = BOOT.mkt ? JSON.stringify(mktVal()) : null, MKTFLY = false;
function mktTick() {
  if (!MKTSNAP || MKTFLY || !can('marketing')) return;
  const v = mktVal(), k = JSON.stringify(v); if (k === MKTSNAP) return;
  const b = JSON.parse(MKTSNAP), CL = { lead: 'ส่ง Lead', qualified: 'ส่ง QualifiedLead', won: 'ส่ง Converted' }, onOff = x => x ? 'เปิด' : 'ปิด';
  const changes = [...Object.keys(CL).filter(x => b.conv[x] !== v.conv[x]).map(x => ({ f: CL[x], from: onOff(b.conv[x]), to: onOff(v.conv[x]) })),
    ...v.tpl.filter(t => { const o = b.tpl.find(x => x.k === t.k); return !o || o.th !== t.th || o.en !== t.en; }).map(t => ({ f: 'ข้อความสำเร็จรูป · ' + t.n, from: '—', to: 'แก้ไขแล้ว' }))];
  MKTFLY = true;
  api('PUT', 'settings/marketing', { value: v, changes }).then(() => { MKTSNAP = k; AUDIT_DIRTY = true; const t = $('#mktSaved'); if (t) t.textContent = 'บันทึกแล้ว'; }).catch(fail).finally(() => { MKTFLY = false; });
}
setInterval(mktTick, 2500);
window.addEventListener('beforeunload', e => { if (MKTSNAP && JSON.stringify(mktVal()) !== MKTSNAP) { mktTick(); e.preventDefault(); e.returnValue = ''; } });
/* ส่งผลกลับโฆษณา: what really went to Meta (logged by the server), Google via the offline-conversion file */
const MK = { data: null, at: 0, loading: false };
function mkLoad() {
  if (MK.loading) return; MK.loading = true;
  api('GET', 'marketing/status').then(d => { MK.data = d; MK.at = Date.now(); }).catch(fail).finally(() => { MK.loading = false; if (CUR === 'audiences' && AU.tab === 'conv') vAudiences(); });
}
const MK_ST = { sent: ['ส่งสำเร็จ', 'st-confirmed'], failed: ['ล้มเหลว', 'st-cancel'], skipped: ['ยังไม่เชื่อม Meta', 'st-quote'] };
function auConvBody() {
  if (!MK.data || Date.now() - MK.at > 60_000) mkLoad();
  const D = MK.data, withId = BOOKINGS.filter(l => l.clickId), adLeads = BOOKINGS.filter(l => ['gads', 'meta'].includes(l.src)).length;
  const c = D?.counts || {}, ts = x => { const d = new Date(x); return `${fmtD(iso(d))} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  return `<div class="card p-5 bg-[#fbf6ef] ring-1 ring-[#efe2cc]"><p class="font-medium">ทำไมต้องส่งผลกลับ</p><p class="text-[12.5px] mt-1 text-ink/80">ถ้าโฆษณารู้แค่ว่า “มีคนกรอกฟอร์ม” มันจะหาคนที่ชอบกรอกฟอร์ม · ถ้าเราบอกกลับว่าลีดไหน <b>คุยจริง</b> และ <b>ปิดการขายได้</b> Meta และ Google จะเรียนรู้และหาคนที่มีแนวโน้มเป็นลูกค้าจริง ทำให้ต้นทุนต่อลูกค้าลดลง</p></div>
    <div class="grid md:grid-cols-3 gap-4 mt-4">${[['lead', 'ส่งคำขอ (Lead)', 'ทันทีที่ลูกค้าส่งฟอร์มบนเว็บ'], ['qualified', 'คุยจริง (QualifiedLead)', 'เมื่อเซลล์เปลี่ยนสถานะเป็น “กำลังคุย”'], ['won', 'ปิดการขาย (Converted)', 'เมื่อเซลล์กด “ปิดการขายได้”']].map(([k, n, d]) => `<div class="card p-4"><div class="flex items-center justify-between"><p class="font-medium text-[13px]">${n}</p><span class="tgl"><input type="checkbox" ${AU.conv[k] ? 'checked' : ''} ${can('marketing') ? '' : 'disabled'} onchange="AU.conv.${k}=this.checked;mktTick()"/><span></span></span></div><p class="text-[12px] text-muted mt-1">${d}</p><p class="text-[11px] mt-3 flex flex-wrap gap-x-3"><span class="text-[#1877f2]">● Meta CAPI อัตโนมัติ</span>${k === 'won' ? '<span class="text-[#e37400]">● Google Ads ผ่านไฟล์</span>' : ''}</p></div>`).join('')}</div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
      <div class="card p-4"><p class="text-[11px] text-muted">Meta Conversions API</p><p class="text-[15px] mt-1.5 ${D?.meta ? 'text-[#1e7a46]' : 'text-[#9a6b00]'}">${!D ? '…' : D.meta ? 'เชื่อมแล้ว' + (D.test ? ' · โหมดทดสอบ' : '') : 'ยังไม่ได้ตั้งค่า'}</p><p class="text-[11px] text-muted mt-1">${D && !D.meta ? 'ใส่ META_PIXEL_ID และ META_CAPI_TOKEN ใน .env' : 'ส่งจากเซิร์ฟเวอร์ เข้ารหัสเบอร์/อีเมล'}</p></div>
      <div class="card p-4"><p class="text-[11px] text-muted">ส่งสำเร็จ · 30 วัน</p><p class="text-xl tnum mt-1">${nf(c.sent || 0)}</p><p class="text-[11px] text-muted mt-1">${c.failed ? `<span class="text-[#b42318]">ล้มเหลว ${c.failed}</span>` : 'ไม่มีที่ล้มเหลว'}${c.skipped ? ` · ข้าม ${c.skipped}` : ''}</p></div>
      <div class="card p-4"><p class="text-[11px] text-muted">ลีดที่มีรหัสคลิกโฆษณา</p><p class="text-xl tnum mt-1">${withId.length}</p><p class="text-[11px] text-muted mt-1">${adLeads ? `${pct(withId.length, adLeads)}% ของลีดจากโฆษณา` : 'ยังไม่มีลีดจากโฆษณา'}</p></div>
      <div class="card p-4"><p class="text-[11px] text-muted">ปิดได้จาก Google Ads · 90 วัน</p><p class="text-xl tnum mt-1">${D ? D.gclidWon : '…'}</p>${can('export') ? `<button class="btn btn-o !h-7 mt-1.5 text-[11.5px]" onclick="exportGads()"><i data-lucide="download" class="w-3.5 h-3.5"></i>ไฟล์ Offline conversions</button>` : ''}</div>
    </div>
    <div class="card mt-4 overflow-hidden"><p class="font-medium p-4 border-b border-line">เหตุการณ์ที่ส่งล่าสุด</p><div class="overflow-x-auto"><table class="tbl"><thead><tr><th>เวลา</th><th>ลีด</th><th>เหตุการณ์</th><th>แพลตฟอร์ม</th><th>สถานะ</th><th>รายละเอียด</th></tr></thead><tbody>${(D?.recent || []).map(e => `<tr${e.ref ? ` class="click" onclick="bookingDetail('${esc(e.ref)}')"` : ''}><td class="whitespace-nowrap">${ts(e.at)}</td><td>${esc(e.ref || '—')}</td><td>${esc(e.event)}</td><td>${e.platform === 'meta' ? 'Meta' : esc(e.platform)}</td><td><span class="pill ${(MK_ST[e.status] || ['', 'st-quote'])[1]}">${(MK_ST[e.status] || [e.status])[0]}</span></td><td class="text-[11.5px] text-muted max-w-[280px] truncate" title="${esc(e.detail || '')}">${esc(e.detail || '')}</td></tr>`).join('') || `<tr><td colspan="6" class="text-muted">${D ? 'ยังไม่มีเหตุการณ์ · จะเริ่มบันทึกเมื่อมีลีดใหม่จากเว็บ หรือเซลล์เปลี่ยนสถานะเป็นกำลังคุย / ปิดการขาย' : 'กำลังโหลด…'}</td></tr>`}</tbody></table></div></div>
    <p class="text-[11px] text-muted mt-3">Meta: ส่งอัตโนมัติจากเซิร์ฟเวอร์ (ไม่ส่งชื่อ เบอร์และอีเมลเข้ารหัส SHA-256) · Google Ads: ดาวน์โหลดไฟล์ Offline conversions แล้วอัปโหลดที่ Google Ads → Goals → Conversions → Uploads (ชื่อ conversion ตั้งใน .env: GADS_CONVERSION_NAME)</p>`;
}
{ const _vau = vAudiences; vAudiences = function () {
  _vau();
  if (AU.tab === 'tpl') $('#view .grid.lg\\:grid-cols-2')?.insertAdjacentHTML('beforebegin', `<p id="mktSaved" class="text-[11px] text-muted mb-3">${can('marketing') ? 'บันทึกอัตโนมัติ · เซลล์ทุกคนเห็นข้อความเดียวกันในหน้าลีด' : 'ดูได้อย่างเดียว'}</p>`);
  icons();
}; PAGES.find(p => p[0] === 'audiences')[3] = vAudiences; }

const NOT_LIVE = {
  settings: 'ขึ้นเว็บจริง: โลโก้ favicon เบอร์โทร WhatsApp LINE อีเมล ที่อยู่ ลิงก์แผนที่ ชื่อบริษัท และเลขใบอนุญาต ททท. · ส่วนอื่น (โซเชียล สี คำโปรย เวลาทำการ แจ้งเตือน โหมดปิดปรับปรุง) ยังไม่มีผลกับหน้าเว็บ · ปุ่มล้างแคชและสำรองข้อมูลยังเป็นการจำลอง',
  seo: 'Meta ทุกหน้า, index/canonical, redirect, robots.txt, llms.txt และรหัสยืนยันเว็บ บันทึกและมีผลกับหน้าเว็บจริง · อันดับคีย์เวิร์ดและตัวเลขจาก Google ยังเป็นข้อมูลตัวอย่าง (ต้องเชื่อม Search Console)',
  meta: 'หน้านี้ยังเป็นตัวอย่าง · ตั้งค่า Pixel / Conversions API ในไฟล์ .env บนเซิร์ฟเวอร์',
};
const _route20 = route;
route = function () {
  _route20();
  if (!ME) return;
  const [p, arg] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');
  if (NOT_LIVE[p] && !$('#nlBar')) $('#view').insertAdjacentHTML('afterbegin', `<div id="nlBar" class="mb-4 rounded-xl bg-[#fff8e6] ring-1 ring-[#f3e3b8] px-4 py-2.5 text-[12px] text-[#7a5a00] flex items-center gap-2"><i data-lucide="info" class="w-4 h-4 shrink-0"></i>${NOT_LIVE[p]}</div>`);
  if (p === 'settings' && BOOT.sys && !$('#sysCard')) $('#view').insertAdjacentHTML('beforeend', `<div id="sysCard" class="card mt-5"><div class="p-5 border-b border-line"><p class="font-medium">การเชื่อมต่อ</p><p class="text-[12px] text-muted mt-1">ตั้งค่าในไฟล์ .env บนเซิร์ฟเวอร์ แล้วรีสตาร์ต · ค่าลับไม่แสดงในหน้านี้</p></div><div class="divide-y divide-line">${BOOT.sys.map(([n, ok, d]) => `<div class="p-4 flex items-start gap-3"><span class="mt-0.5 w-5 h-5 rounded-full grid place-items-center text-white shrink-0 ${ok ? 'bg-[#1e7a46]' : 'bg-[#c9bfbf]'}"><i data-lucide="${ok ? 'check' : 'minus'}" class="w-3 h-3"></i></span><div class="min-w-0"><p>${esc(n)}</p><p class="text-[11.5px] text-muted break-all">${esc(d)}</p></div></div>`).join('')}</div></div>`);
  if (p === 'bookings' && can('export')) $('#view button[onclick="exportCsv()"]')?.insertAdjacentHTML('beforebegin', '<button class="btn btn-o" onclick="exportGads()" title="ลีดที่ปิดการขายได้และมาจากการคลิกโฆษณา Google · นำเข้าใน Google Ads → Conversions → Uploads"><i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>ไฟล์ Google Ads</button>');
  if (p === 'bookings' && arg && !$('#drawer').classList.contains('open')) { const ref = decodeURIComponent(arg); history.replaceState(null, '', '#/bookings'); if (BOOKINGS.some(l => l.id === ref)) bookingDetail(ref); else toast('ไม่พบลีดนี้ หรือไม่ได้อยู่ในความดูแลของคุณ'); }
  paintBell(); icons();
};
/* parts of otherwise-live pages that are not wired yet */
{ const _r = route; route = function () {
  _r(); if (!ME) return;
  const [p, arg] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');
  if (p === 'boats' && arg && !$('#nlBoat')) $('#view').insertAdjacentHTML('afterbegin', `<div id="nlBoat" class="mb-4 rounded-xl bg-[#fff8e6] ring-1 ring-[#f3e3b8] px-4 py-2.5 text-[12px] text-[#7a5a00] flex items-center gap-2"><i data-lucide="info" class="w-4 h-4 shrink-0"></i>ทุกช่องขึ้นเว็บจริงทั้งไทยและอังกฤษ รวมแท็บ SEO · ยกเว้น "คำอธิบายเรือ" ที่หน้าเว็บยังไม่มีย่อหน้าให้แสดง</div>`);
  icons();
}; }
{ const _cd = custDetail; custDetail = function (id) {
  _cd(id); const d = $('#drawer'), l = BOOKINGS.find(b => b.cust === id);
  const tg = d.querySelector('input[type=checkbox][onchange*="consent"]');
  if (tg) { if (l) tg.setAttribute('onchange', `leadApi('${l.id}','consent',{on:this.checked},this.checked?'บันทึกความยินยอมแล้ว':'บันทึกการถอนความยินยอมแล้ว')`); else tg.disabled = true; }
  const ta = [...d.querySelectorAll('textarea')].find(t => t.placeholder.startsWith('เช่น ชอบเรือใบ'));
  if (ta) { ta.disabled = true; ta.placeholder = 'ยังไม่รองรับการบันทึก · ใช้บันทึกในหน้ารายละเอียดลีดแทน'; }
}; }
rerender = function () { route(); };
PAGES.forEach(p => { if (p[0] === 'bookings') p[1] = 'ลีด'; });
/* =====================================================================
   ลีด & ลูกค้า: no double booking (server refuses a second WON for the same boat / date / slot; admins can
   confirm on purpose), the agreed price · deposit · payments of a lead, and customer edit / merge / PDPA erase.
   ===================================================================== */
const DEALS = BOOT.deals || {};
const dealOf = l => DEALS[l.dbId] || { price: null, deposit: null, note: '', payments: [], paid: 0, balance: null };
/* ---------- ปิดการขาย: the server checks the boat is still free ---------- */
{ const _ss = setStatus; setStatus = function (id, s) {
  if (s !== 'won') return _ss(id, s);
  const l = BOOKINGS.find(x => x.id === id); if (!l || l.status === s) return;
  if (!can('bookings_all') && !ownB(l)) return toast('ไม่มีสิทธิ์แก้ลีดนี้');
  wonGo(id, false);
}; }
function wonGo(id, force) {
  api('POST', `leads/${encodeURIComponent(id)}/status`, { status: 'won', force }).then(r => {
    syncLead(r); closeModal();
    const l = BOOKINGS.find(x => x.id === id);
    toast(force ? 'ปิดการขายแล้ว (ยืนยันจองซ้อน)' : 'ปิดการขายแล้ว · ใส่ราคาที่ตกลงกับลูกค้าด้วย');
    if (l && dealOf(l).price == null) { bookingDetail(id); setTimeout(() => { const i = $('#dlPrice'); i?.scrollIntoView({ block: 'center' }); i?.focus(); }, 60); }
  }).catch(e => {
    rerender(); if (DRAWER_LEAD === id && $('#drawer').classList.contains('open')) bookingDetail(id);
    if (e.status !== 409) return fail(e);
    openModal(`<div class="p-5 grid gap-2"><p class="font-medium flex items-center gap-2"><i data-lucide="calendar-x-2" class="w-4 h-4 text-[#a3222c]"></i>เรือไม่ว่างในรอบนี้</p><p class="text-[13px]">${esc(e.message)}</p>
      <p class="text-[12px] text-muted">ระบบไม่ให้ปิดการขายเรือลำเดียวกัน วันเดียวกัน รอบเดียวกันซ้ำ · เปลี่ยนวัน รอบ หรือเรือในลีดนี้ก่อน${can('bookings_all') ? ' · หรือยืนยันถ้าตั้งใจจองซ้อน (เช่น เรือ 2 ลำชื่อเดียวกัน)' : ''}</p>
      <div class="flex justify-end gap-2 mt-3"><button class="btn btn-o" onclick="closeModal()">ปิด</button>${can('bookings_all') ? `<button class="btn btn-p !bg-[#b42318]" onclick="wonGo('${id}',true)">ยืนยันจองซ้อน</button>` : ''}</div></div>`);
  });
}
/* ---------- the deal: agreed price, deposit, payments ---------- */
function dealApi(id, body, msg) {
  const l = BOOKINGS.find(x => x.id === id); if (!l) return;
  return api('POST', `leads/${encodeURIComponent(id)}/deal`, body).then(r => { if (r.deal) DEALS[l.dbId] = r.deal; syncLead(r); if (msg) toast(msg); }).catch(e => { fail(e); if (DRAWER_LEAD === id) bookingDetail(id); });
}
const dlMoney = v => String(v ?? '').replace(/[,\s฿]/g, '');
function dealBox(l) {
  const d = dealOf(l), b = bySlug(l.boat), ro = isRO() || (!can('bookings_all') && !ownB(l)), dis = ro ? 'disabled' : '';
  const due = d.deposit != null && d.paid < d.deposit ? `<span class="pill" style="background:#fff4e0;color:#9a5b00">ยังขาดมัดจำ ${baht(d.deposit - d.paid)}</span>` : d.balance != null && d.balance <= 0 ? '<span class="pill st-confirmed">ชำระครบแล้ว</span>' : d.price != null && d.paid ? '<span class="pill st-quote">รับมัดจำแล้ว</span>' : '';
  const M = ['โอน', 'บัตรเครดิต', 'เงินสด', 'PayPal', 'อื่นๆ'];
  return `<div id="dealBox" class="rounded-xl ring-1 ring-line p-4 grid gap-3">
    <div class="flex items-center justify-between gap-2"><p class="font-medium flex items-center gap-2"><i data-lucide="receipt-text" class="w-4 h-4 text-maroon"></i>ราคาที่ตกลง & การชำระเงิน</p>${due}</div>
    <div class="grid grid-cols-2 gap-3"><label class="grid gap-1"><span class="lbl !mb-0">ราคาที่ตกลง (บาท)</span><input id="dlPrice" class="inp tnum" inputmode="decimal" ${dis} value="${d.price ?? ''}" placeholder="${b?.from_ ? 'เริ่มต้น ' + nf(b.from_) : 'เช่น 85000'}" onchange="dealApi('${l.id}',{op:'set',price:dlMoney(this.value)},'บันทึกราคาที่ตกลงแล้ว')"/></label>
      <label class="grid gap-1"><span class="lbl !mb-0">มัดจำที่ต้องจ่าย</span><input class="inp tnum" inputmode="decimal" ${dis} value="${d.deposit ?? ''}" placeholder="${d.price ? 'เช่น ' + nf(Math.round(d.price / 2)) : ''}" onchange="dealApi('${l.id}',{op:'set',deposit:dlMoney(this.value)},'บันทึกมัดจำแล้ว')"/></label></div>
    <label class="grid gap-1"><span class="lbl !mb-0">รวมอะไรบ้าง / ส่วนลด</span><input class="inp" ${dis} value="${esc(d.note)}" placeholder="เช่น Full day + BBQ ส่วนลด 5,000 · ไม่รวมค่ารถรับส่ง" onchange="dealApi('${l.id}',{op:'set',note:this.value},'บันทึกแล้ว')"/></label>
    <div class="grid grid-cols-3 gap-2 text-center"><div class="rounded-lg bg-sand p-2"><p class="text-[11px] text-muted">ราคา</p><p class="font-medium tnum">${d.price != null ? baht(d.price) : '—'}</p></div><div class="rounded-lg bg-sand p-2"><p class="text-[11px] text-muted">รับแล้ว</p><p class="font-medium tnum" style="color:#1e7a46">${baht(d.paid)}</p></div><div class="rounded-lg bg-sand p-2"><p class="text-[11px] text-muted">คงเหลือ</p><p class="font-medium tnum" style="color:${d.balance > 0 ? '#a3222c' : 'inherit'}">${d.balance != null ? baht(Math.max(0, d.balance)) : '—'}</p></div></div>
    ${d.payments.length ? `<ul class="grid gap-1.5">${d.payments.map(p => `<li class="flex items-center gap-2 text-[12.5px]"><i data-lucide="circle-check" class="w-3.5 h-3.5 shrink-0" style="color:#1e7a46"></i><span class="tnum">${fmtD(p.at)}</span><span class="font-medium tnum">${baht(p.amount)}</span><span class="text-muted truncate flex-1">${esc(p.method)}${p.note ? ' · ' + esc(p.note) : ''} · ${esc(p.by)}</span>${ro ? '' : `<button class="text-muted hover:text-[#a3222c]" title="ลบรายการนี้" onclick="if(confirm('ลบรายการรับเงิน ${baht(p.amount)} ?'))dealApi('${l.id}',{op:'unpay',id:'${p.id}'},'ลบรายการแล้ว')"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>`}</li>`).join('')}</ul>` : ''}
    ${ro ? '' : `<div class="grid grid-cols-[1fr_auto] sm:grid-cols-[110px_120px_1fr_auto] gap-2 items-end pt-2 border-t border-line">
      <input id="dpAmt" class="inp !h-9 tnum" inputmode="decimal" placeholder="จำนวนเงิน"/><input id="dpAt" type="date" class="inp !h-9" value="${iso(TODAY)}"/>
      <div class="flex gap-2 col-span-2 sm:col-span-1"><select id="dpM" class="inp !h-9 !w-auto">${M.map(m => `<option>${m}</option>`).join('')}</select><input id="dpN" class="inp !h-9 flex-1 min-w-0" placeholder="หมายเหตุ (เลขที่สลิป)"/></div>
      <button class="btn btn-p !h-9" onclick="const a=dlMoney($('#dpAmt').value);if(!+a)return toast('ใส่จำนวนเงินที่ได้รับ');dealApi('${l.id}',{op:'pay',amount:a,at:$('#dpAt').value,method:$('#dpM').value,note:$('#dpN').value},'บันทึกรับเงินแล้ว')">รับเงิน</button></div>`}
    <p class="text-[11px] text-muted">ราคานี้ไม่เปลี่ยนตามฤดูกาลที่แก้ภายหลัง${d.updatedBy ? ` · แก้ล่าสุดโดย ${esc(d.updatedBy)} ${fmtD(iso(new Date(d.updatedAt)))}` : ''}</p></div>`;
}
{ const _bd = bookingDetail; bookingDetail = function (id) {
  _bd(id); const l = BOOKINGS.find(x => x.id === id), d = $('#drawer');
  if (!l || !d.classList.contains('open') || $('#dealBox')) return;
  // after "สิ่งที่สนใจ" (boat, date, guests)
  const anchor = [...d.querySelectorAll('p.lbl')].find(x => x.textContent === 'สิ่งที่สนใจ')?.parentElement || d.querySelector('.overflow-y-auto > *');
  anchor?.insertAdjacentHTML('afterend', dealBox(l));
  icons();
}; }
/* ---------- customers: edit · merge · PDPA erase ---------- */
function custApi(id, op, method, body) { return api(method, `customers/${encodeURIComponent(id)}${op === 'edit' ? '' : '/' + op}`, body); }
function custEdit(id) {
  const c = custOf(id); if (!c) return;
  const f = (k, l, v, t = 'text', ph = '') => `<label class="grid gap-1"><span class="lbl !mb-0">${l}</span><input id="ce_${k}" type="${t}" class="inp" value="${esc(v || '')}" placeholder="${ph}"/></label>`;
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">แก้ไขข้อมูลลูกค้า</p></div>
    <div class="p-5 grid gap-3">${f('name', 'ชื่อ', c.name)}<div class="grid grid-cols-2 gap-3">${f('phone', 'เบอร์โทร', c.phone, 'tel')}${f('wa', 'WhatsApp (ถ้าต่างจากเบอร์โทร)', c.wa, 'tel')}</div>
      <div class="grid grid-cols-2 gap-3">${f('email', 'อีเมล', c.email, 'email')}${f('country', 'ประเทศ', c.countryRaw ?? '', 'text', 'เช่น Thailand (ว่าง = ดูจากรหัสโทรศัพท์)')}</div>
      <label class="grid gap-1"><span class="lbl !mb-0">ภาษาที่ติดต่อ</span><select id="ce_lang" class="inp"><option value="th" ${c.lang !== 'en' ? 'selected' : ''}>ไทย</option><option value="en" ${c.lang === 'en' ? 'selected' : ''}>English</option></select></label>
      <label class="grid gap-1"><span class="lbl !mb-0">บันทึกเกี่ยวกับลูกค้า</span><textarea id="ce_notes" class="inp" rows="3" placeholder="เช่น ชอบเรือใบ มากับครอบครัว แพ้กุ้ง…">${esc(c.notes || '')}</textarea></label></div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="custEditGo('${c.id}')">บันทึก</button></div>`);
}
function custEditGo(id) {
  const v = k => $('#ce_' + k)?.value ?? '';
  custApi(id, 'edit', 'PUT', { name: v('name'), phone: v('phone'), wa: v('wa'), email: v('email'), country: v('country'), lang: v('lang'), notes: v('notes') }).then(r => {
    const i = CUSTOMERS.findIndex(c => c.id === id); if (i >= 0) CUSTOMERS[i] = r.customer; AUDIT_DIRTY = true; closeModal(); rerender(); custDetail(id); toast('บันทึกข้อมูลลูกค้าแล้ว');
  }).catch(fail);
}
function custMerge(id) {
  const c = custOf(id), others = CUSTOMERS.filter(x => x.id !== id);
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">รวมลูกค้าซ้ำเข้ากับ ${esc(c.name)}</p><p class="text-[12px] text-muted mt-1">ลีดทั้งหมดของรายการที่เลือกจะย้ายมาอยู่ที่ ${esc(c.name)} · ช่องที่ว่างจะเติมจากรายการนั้น แล้วรายการนั้นถูกลบ</p>
      <input class="inp mt-3" placeholder="ค้นหาชื่อ เบอร์ อีเมล…" oninput="const q=this.value.toLowerCase();$$('#cmList label').forEach(x=>x.classList.toggle('hidden',!x.dataset.k.includes(q)))"/></div>
    <div id="cmList" class="overflow-y-auto" style="max-height:46vh">${others.map(x => { const n = BOOKINGS.filter(l => l.cust === x.id).length, same = x.phone.replace(/\D/g, '').slice(-8) === c.phone.replace(/\D/g, '').slice(-8) || (x.email && x.email === c.email) || x.name.trim().toLowerCase() === c.name.trim().toLowerCase();
      return `<label class="flex items-center gap-3 px-5 py-2.5 border-b border-line cursor-pointer ${same ? 'order-first' : ''}" data-k="${esc((x.name + ' ' + x.phone + ' ' + x.email + ' ' + (x.wa || '')).toLowerCase())}"><input type="radio" name="cmFrom" value="${x.id}"/><span class="flex-1 min-w-0"><span class="block text-[13px] truncate">${esc(x.name)}${same ? ' <span class="lang-b mid">น่าจะซ้ำ</span>' : ''}</span><span class="block text-[11.5px] text-muted tnum truncate">${esc(x.phone)}${x.email ? ' · ' + esc(x.email) : ''}</span></span><span class="text-[11.5px] text-muted">${n} ลีด</span></label>`; }).join('')}</div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="custMergeGo('${id}')">รวมลูกค้า</button></div>`);
  $('#cmList').style.display = 'flex'; $('#cmList').style.flexDirection = 'column';
}
function custMergeGo(id) {
  const from = $('input[name=cmFrom]:checked')?.value; if (!from) return toast('เลือกลูกค้าที่จะรวม');
  custApi(id, 'merge', 'POST', { from }).then(r => {
    const i = CUSTOMERS.findIndex(c => c.id === id); if (i >= 0) CUSTOMERS[i] = r.customer;
    const j = CUSTOMERS.findIndex(c => c.id === r.removed); if (j >= 0) CUSTOMERS.splice(j, 1);
    BOOKINGS.forEach(l => { if (l.cust === r.removed) l.cust = id; });
    AUDIT_DIRTY = true; closeModal(); rerender(); custDetail(id); toast(`รวมลูกค้าแล้ว · ย้ายมา ${r.moved} ลีด`);
  }).catch(fail);
}
function custErase(id) {
  const c = custOf(id), L = BOOKINGS.filter(l => l.cust === id), won = L.filter(l => l.status === 'won').length;
  openModal(`<div class="p-5 border-b border-line"><p class="font-medium">ลบข้อมูลลูกค้าตามคำขอ (PDPA)</p><p class="text-[12.5px] mt-1">${esc(c.name)} · ${esc(c.phone)} · ลีด ${L.length} รายการ${won ? ` (ปิดการขายแล้ว ${won})` : ''}</p></div>
    <div class="p-5 grid gap-2 text-[12.5px]">
      <label class="flex gap-2.5 items-start p-3 rounded-xl ring-1 ring-line cursor-pointer"><input type="radio" name="ceMode" value="anonymise" checked class="mt-0.5"/><span><b class="font-medium">ลบข้อมูลส่วนบุคคล</b> · แนะนำ<br/><span class="text-muted text-[11.5px]">ลบชื่อ เบอร์ อีเมล WhatsApp ข้อความจากลูกค้า บันทึก IP และข้อมูลโฆษณา · เก็บวันที่ เรือ และยอดขายไว้ทำบัญชีและภาษี</span></span></label>
      <label class="flex gap-2.5 items-start p-3 rounded-xl ring-1 ring-line ${won ? 'opacity-50' : 'cursor-pointer'}"><input type="radio" name="ceMode" value="delete" ${won ? 'disabled' : ''} class="mt-0.5"/><span><b class="font-medium">ลบทั้งหมด</b><br/><span class="text-muted text-[11.5px]">${won ? 'ใช้ไม่ได้ เพราะมีการจองที่ปิดการขายแล้ว (ต้องเก็บไว้ทำบัญชี)' : 'ลบลูกค้าและลีดทั้งหมดของลูกค้ารายนี้ออกจากระบบ'}</span></span></label>
      <p class="text-muted text-[11.5px] mt-1">กู้คืนไม่ได้ · บันทึกกิจกรรมจะเก็บไว้แค่ว่ามีการลบตามคำขอ เป็นหลักฐานว่าดำเนินการแล้ว</p>
      <label class="grid gap-1 mt-1"><span class="lbl !mb-0">พิมพ์ ลบ เพื่อยืนยัน</span><input id="ceOk" class="inp" placeholder="ลบ"/></label></div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p !bg-[#b42318]" onclick="custEraseGo('${id}')"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i>ลบข้อมูล</button></div>`);
}
function custEraseGo(id) {
  if ($('#ceOk').value.trim() !== 'ลบ') return toast('พิมพ์คำว่า ลบ เพื่อยืนยัน');
  const mode = $('input[name=ceMode]:checked')?.value || 'anonymise';
  custApi(id, 'erase', 'POST', { mode }).then(() => {
    if (mode === 'delete') { const i = CUSTOMERS.findIndex(c => c.id === id); if (i >= 0) CUSTOMERS.splice(i, 1); for (let i = BOOKINGS.length - 1; i >= 0; i--) if (BOOKINGS[i].cust === id) BOOKINGS.splice(i, 1); }
    else { const c = custOf(id); if (c) Object.assign(c, { name: 'ลบตามคำขอ (PDPA)', phone: '—', email: '', wa: '', country: '', notes: '', consent: false }); BOOKINGS.forEach(l => { if (l.cust === id) Object.assign(l, { message: '', note: '' }); }); }
    AUDIT_DIRTY = true; closeModal(); closeDrawer(); rerender(); toast(mode === 'delete' ? 'ลบลูกค้าและลีดแล้ว' : 'ลบข้อมูลส่วนบุคคลแล้ว · เก็บสถิติการจองไว้');
  }).catch(fail);
}
{ const _cd = custDetail; custDetail = function (id) {
  _cd(id); const d = $('#drawer'), c = custOf(id); if (!c || !d.classList.contains('open')) return;
  const mine = can('bookings_all') || BOOKINGS.some(b => b.cust === id && ownB(b)), admin = can('bookings_all') && !isRO();
  const box = d.querySelector('.overflow-y-auto');
  if (box && mine && !isRO()) box.insertAdjacentHTML('afterbegin', `<div class="flex flex-wrap gap-2"><button class="btn btn-o !h-8" onclick="custEdit('${id}')"><i data-lucide="pencil" class="w-3.5 h-3.5"></i>แก้ไข</button>${admin ? `<button class="btn btn-o !h-8" onclick="custMerge('${id}')"><i data-lucide="merge" class="w-3.5 h-3.5"></i>รวมลูกค้าซ้ำ</button><button class="btn btn-o !h-8 text-[#b42318]" onclick="custErase('${id}')"><i data-lucide="user-x" class="w-3.5 h-3.5"></i>ลบข้อมูล (PDPA)</button>` : ''}</div>`);
  // the notes box is saved now (through แก้ไข)
  const ta = [...d.querySelectorAll('textarea')].find(t => t.placeholder.startsWith('ยังไม่รองรับ') || t.placeholder.startsWith('เช่น ชอบเรือใบ'));
  if (ta) { ta.disabled = !mine || isRO(); ta.placeholder = 'เช่น ชอบเรือใบ มากับครอบครัว แพ้กุ้ง…'; ta.value = c.notes || ''; ta.onchange = () => custApi(id, 'edit', 'PUT', { name: c.name, phone: c.phone, wa: c.wa, email: c.email, country: c.countryRaw ?? '', lang: c.lang, notes: ta.value }).then(r => { Object.assign(c, r.customer); toast('บันทึกแล้ว'); }).catch(fail); }
  icons();
}; }


/* =====================================================================
   แปลอัตโนมัติ (Gemini API แบบฟรี) + ตัวนับโควตา — เซิร์ฟเวอร์: src/lib/translate.ts
   · ระบบหยุดแปลเองก่อนถึงโควตาฟรีของ Google (เพดาน TRANSLATE_MONTHLY_LIMIT, ค่าเริ่มต้น 450,000 ตัวอักษร)
   · บทความ: คำแปลขึ้นสถานะ “รอตรวจ” เก็บเป็นร่างบนเซิร์ฟเวอร์ ไม่แสดงบนเว็บจนกว่าจะกดอนุมัติ
   · เรือ: ตรวจ/แก้คำแปลในหน้าต่างก่อนใส่เข้าหน้าเรือ
   ===================================================================== */
const TRU = { d: null, at: 0 }, TRDS = new Map();
const TR_L = { th: 'ไทย', en: 'อังกฤษ', ru: 'รัสเซีย', zh: 'จีน' };
const trChars = a => a.reduce((n, t) => n + [...String(t || '')].length, 0);   // same count as the server / Google
const trDec = s => { const t = document.createElement('textarea'); t.innerHTML = s || ''; return t.value; };
function trUsage(force) {
  if (!force && TRU.d && Date.now() - TRU.at < 30_000) return Promise.resolve(TRU.d);
  return api('GET', 'translate').then(d => { TRU.d = d; TRU.at = Date.now(); return d; });
}
function trMeter(u, add = 0) {
  const bar = (used, lim, extra = 0) => { const p = v => Math.min(100, v / (lim || 1) * 100), after = used + extra;
    const tone = after > lim ? '#a3222c' : after > lim * .8 ? '#b26a00' : '#1e7a46';
    return `<div class="mt-1 h-2 rounded-full bg-sand overflow-hidden flex"><div style="width:${p(used)}%;background:${tone}"></div>${extra ? `<div style="width:${Math.max(0, p(after) - p(used))}%;background:${tone};opacity:.45"></div>` : ''}</div>`; };
  const rq = u.reqsToday || 0, addR = add ? Math.max(1, Math.ceil(add / 6000)) : 0;
  return `<div class="grid gap-3 text-[12px]">
    <div><div class="flex flex-wrap justify-between gap-2"><span><b>① ตัวอักษรที่แปลเดือนนี้</b> · ใช้ไป <b class="tnum">${nf(u.chars)}</b>${add ? ` + ครั้งนี้ ~<b class="tnum">${nf(add)}</b>` : ''}</span><span class="tnum text-muted">จากเพดาน ${nf(u.limit)}</span></div>
      ${bar(u.chars, u.limit, add)}<p class="text-[11px] text-muted mt-1">เหลือ ${nf(Math.max(0, u.limit - u.chars))} ตัวอักษร · เริ่มนับใหม่ทุกวันที่ 1</p></div>
    <div><div class="flex flex-wrap justify-between gap-2"><span><b>② จำนวนครั้งที่แปลวันนี้</b> · ใช้ไป <b class="tnum">${nf(rq)}</b>${addR ? ` + ครั้งนี้ ~<b class="tnum">${addR}</b>` : ''} ครั้ง</span><span class="tnum text-muted">จากเพดาน ${nf(u.dailyReq)}</span></div>
      ${bar(rq, u.dailyReq, addR)}<p class="text-[11px] text-muted mt-1">เหลือ ${nf(Math.max(0, u.dailyReq - rq))} ครั้ง · เริ่มนับใหม่ทุกวันราว 14:00–15:00 น. (ตามเวลารีเซ็ตของ Google)</p></div>
  </div>`;
}
function trHelp(u) {
  return `<div class="mt-4 rounded-xl bg-sand/60 p-4 text-[12px] leading-relaxed"><p class="font-medium mb-1.5">อ่านตัวเลขยังไง</p><ul class="grid gap-1 list-disc pl-4">
    <li><b>เพดานทั้ง 2 ตัวเป็นตัวเลขที่เราตั้งเอง</b> เพื่อกันใช้เกินโควตาฟรี · ถึงเพดานตัวไหนก่อน ปุ่มแปลจะหยุดทำงานเอง</li>
    <li><b>① ตัวอักษร/เดือน ${nf(u.limit)}</b> ≈ บทความยาว (~8,000 ตัวอักษร) ได้ราว ${nf(Math.floor(u.limit / 8000))} บทความ หรือหน้าเรือ (~300 ตัวอักษร) หลายพันลำ</li>
    <li><b>② ครั้ง/วัน ${nf(u.dailyReq)}</b> · 1 ครั้ง = ส่งข้อความไปแปลได้ไม่เกิน ~6,000 ตัวอักษร · หน้าเรือใช้ 1 ครั้ง · บทความยาวอาจใช้ 2–3 ครั้ง</li>
    <li>Gemini ให้ฟรี ${nf(u.freeRpd || 500)} ครั้ง/วัน และไม่ได้ผูกบัตรไว้ → <b>ไม่มีค่าใช้จ่ายแน่นอน</b> ถ้าครบโควตาแค่แปลไม่ได้ชั่วคราว</li>
    <li>ระบบจะเตือนเมื่อใช้ถึง 80% และเมื่อเต็ม · แปลเสร็จต้องตรวจก่อนเผยแพร่ทุกครั้ง</li></ul></div>`;
}
/** confirm with an estimate and the monthly meter → resolves true/false */
function trConfirm(title, chars, detail, note) {
  return trUsage(true).then(u => new Promise(res => {
    const over = u.chars + chars > u.limit || (u.reqsToday || 0) >= u.dailyReq;
    window.__trOk = v => { closeModal(); res(v); };
    openModal(`<div class="p-5 grid gap-4"><p class="font-medium">${title}</p><p class="text-[12.5px] text-muted">${detail}</p>${trMeter(u, chars)}
      ${!u.enabled ? '<p class="text-[12.5px] text-[#a3222c]">ยังไม่พร้อมใช้: ยังไม่ได้ใส่ GEMINI_API_KEY ใน .env หรือปิดระบบแปลไว้</p>' : (u.reqsToday || 0) >= u.dailyReq ? '<p class="text-[12.5px] text-[#a3222c]">วันนี้แปลครบโควตาแล้ว · แปลต่อได้หลัง 14:00–15:00 น.</p>' : over ? '<p class="text-[12.5px] text-[#a3222c]">เกินเพดานเดือนนี้ · แปลได้อีกครั้งวันที่ 1 เดือนหน้า</p>' : ''}
      <p class="text-[11.5px] text-muted">${note}</p>
      <div class="flex justify-end gap-2"><button class="btn btn-o" onclick="__trOk(false)">ยกเลิก</button><button class="btn btn-p" ${over || !u.enabled ? 'disabled' : ''} onclick="__trOk(true)"><i data-lucide="languages" class="w-3.5 h-3.5"></i>แปล (~${nf(chars)} ตัวอักษร)</button></div></div>`);
    icons();
  })).catch(e => { fail(e); return false; });
}

/* ---------- บทความ ---------- */
const TR_KEYS = ['html', 'title', 'q', 'a', 'alt', 'cap', 'label'];
function trWalk(o, cb) {
  if (Array.isArray(o)) return o.forEach(x => trWalk(x, cb));
  if (o && typeof o === 'object') for (const k of Object.keys(o)) { if (typeof o[k] === 'string') { if (TR_KEYS.includes(k) && o[k].trim()) cb(o, k); } else if (o[k] && typeof o[k] === 'object') trWalk(o[k], cb); }
}
const trDir = a => { const from = ['orig', 'ok'].includes(a.tr.th) ? 'th' : 'en'; return [from, from === 'th' ? 'en' : 'th']; };
function trBtn(a) {
  if (!can('content')) return '';
  const [from, to] = trDir(a);
  if (!a.title[from] || a.tr[to] === 'mt' || (['orig', 'ok'].includes(a.tr[to]) && a.title[to])) return '';
  return `<button class="btn btn-o ml-auto" onclick="trArticle(${a.id})"><i data-lucide="languages" class="w-3.5 h-3.5"></i>แปล ${from.toUpperCase()} → ${to.toUpperCase()} อัตโนมัติ</button>`;
}
const TR_F = ['title', 'excerpt', 'seoT', 'seoD', 'kw'];
function trDraftOf(a, k) { return { title: a.title[k], excerpt: a.excerpt[k], seoT: a.seoT[k], seoD: a.seoD[k], kw: a.kw[k], slug: a.slug[k], blocks: a.blocks?.[k] || [] }; }
function trSaveDraft(a, k) { const v = trDraftOf(a, k), s = JSON.stringify(v); if (TRDS.get(a.id + ':' + k) === s) return; TRDS.set(a.id + ':' + k, s); api('POST', 'translate/drafts', { id: String(a.id), lang: k, value: v }).catch(fail); }
function trArticle(id) {
  const a = artById(id), [from, to] = trDir(a);
  if (!a.title[from]) return toast('ยังไม่มีต้นฉบับให้แปล');
  const fv = TR_F.map(f => a[f][from] || ''), B = JSON.parse(JSON.stringify(blocksFor(a, from))), refs = [];
  trWalk(B, (o, k) => refs.push([o, k]));
  const bv = refs.map(([o, k]) => o[k]), chars = trChars(fv) + trChars(bv);
  trConfirm(`แปลบทความ ${TR_L[from]} → ${TR_L[to]}`, chars, `${esc(a.title[from])} · หัวข้อ/SEO + ${refs.length} ส่วนในเนื้อหา`,
    'คำแปลจากเครื่องจะขึ้นสถานะ “รอตรวจ” และยังไม่แสดงบนเว็บ จนกว่าจะมีคนอ่าน แก้ แล้วกด “ตรวจแล้ว อนุมัติ”').then(ok => {
    if (!ok) return; toast('กำลังแปล… (บทความยาวอาจใช้ 10–30 วินาที)');
    const what = `บทความ #${a.id}`;
    api('POST', 'translate', { texts: fv, from, to, what: what + ' · หัวข้อ/SEO' })
      .then(r1 => api('POST', 'translate', { texts: bv, from, to, html: true, what: what + ' · เนื้อหา' }).then(r2 => [r1, r2]))
      .then(([r1, r2]) => {
        TR_F.forEach((f, i) => { a[f][to] = trDec(r1.out[i]) || a[f][to] || ''; });
        r2.out.forEach((t, i) => { const [o, k] = refs[i]; o[k] = t; });
        a.blocks ??= {}; a.blocks[to] = B; a.body[to] = blocksHtml(B);
        if (!a.slug[to]) a.slug[to] = slugify(a.title[to]) || `${to}-${a.id}`;
        a.tr[to] = 'mt'; TRU.d = r2.usage; TRU.at = Date.now();
        trSaveDraft(a, to);
        AE.lang = to; vArticleEdit(a.id); toast(`แปลแล้ว ${nf(r1.chars + r2.chars)} ตัวอักษร · สถานะ “รอตรวจ”`);
      }).catch(fail);
  });
}
/** autosave payload: a language that is still a machine draft is NOT sent (so it never goes live); its draft is kept on the server instead */
function trHold(a, p) {
  for (const k of Object.keys(a.tr || {})) if (a.tr[k] === 'mt') {
    trSaveDraft(a, k);
    for (const f of [...TR_F, 'slug']) p[f] = { ...p[f], [k]: '' };
    p.blocks = { ...p.blocks, [k]: [] };
  }
  return p;
}
{ const _ap = artApprove; artApprove = function (id) {
  const a = artById(id), k = AE.lang, wasMt = a?.tr[k] === 'mt';
  _ap(id);
  if (wasMt) { TRDS.delete(a.id + ':' + k); api('POST', 'translate/drafts/delete', { id: String(a.id), lang: k }).catch(() => {}); }
}; }
// machine drafts saved earlier → back into the editor as “รอตรวจ” (after login has set the user, hence the timeout)
setTimeout(() => can('content') && api('GET', 'translate/drafts').then(d => { (d.drafts || []).forEach(x => {
  const a = x.kind === 'article' && artById(x.id), v = x.value || {};
  if (!a || (['orig', 'ok'].includes(a.tr[x.lang]) && a.title[x.lang])) return;
  for (const f of [...TR_F, 'slug']) a[f][x.lang] = v[f] ?? '';
  a.blocks ??= {}; a.blocks[x.lang] = v.blocks || []; a.body[x.lang] = blocksHtml(a.blocks[x.lang]); a.tr[x.lang] = 'mt';
  TRDS.set(a.id + ':' + x.lang, JSON.stringify(trDraftOf(a, x.lang)));
}); if (CUR === 'articles' && d.drafts?.length) rerender(); }).catch(() => {}), 0);

/* ---------- เรือ ---------- */
function trBoat(slug) {
  const b = bySlug(slug), jobs = [];
  boatI18nFields(b).filter(Boolean).forEach(o => { const th = String(o.th || '').trim(), en = String(o.en || '').trim(); if (th && !en) jobs.push({ o, from: 'th', to: 'en' }); else if (en && !th) jobs.push({ o, from: 'en', to: 'th' }); });
  if (!jobs.length) return toast('ไม่มีช่องที่ว่างให้แปล');
  trConfirm(`แปลช่องที่ว่างของเรือ ${esc(b.name)}`, trChars(jobs.map(j => j.o[j.from])), `${jobs.length} ช่อง`, 'ตรวจและแก้คำแปลได้ในหน้าต่างถัดไป ก่อนใส่เข้าหน้าเรือ').then(ok => {
    if (!ok) return; toast('กำลังแปล…');
    const groups = ['th', 'en'].map(f => jobs.filter(j => j.from === f)).filter(g => g.length);
    Promise.all(groups.map(g => api('POST', 'translate', { texts: g.map(j => j.o[j.from]), from: g[0].from, to: g[0].to, what: `เรือ ${b.name}` })
      .then(r => { g.forEach((j, i) => { j.out = trDec(r.out[i]); }); return r; })))
      .then(rs => { TRU.d = rs[rs.length - 1].usage; TRU.at = Date.now(); trBoatReview(slug, jobs); }).catch(fail);
  });
}
function trBoatReview(slug, jobs) {
  window.__trJobs = jobs;
  // header and buttons stay put; only the list scrolls (the buttons no longer cover the last fields)
  openModal(`<div class="p-5 flex flex-col gap-3 max-h-[85vh]"><div><p class="font-medium">ตรวจคำแปลก่อนใช้ · ${jobs.length} ช่อง</p><p class="text-[12px] text-muted mt-1">ซ้าย = ต้นฉบับ · ขวา = คำแปล แก้ได้เลย · กด “ใช้คำแปล” แล้วระบบบันทึกเข้าหน้าเรือ</p></div>
    <div class="min-h-0 overflow-auto -mx-5 px-5 grid gap-3">${jobs.map((j, i) => `<div class="grid sm:grid-cols-2 gap-2 border-t border-line pt-3"><p class="text-[12px] text-muted"><span class="lang-b ok mr-1">${j.from.toUpperCase()}</span>${esc(j.o[j.from])}</p><textarea id="trj${i}" class="inp !h-auto py-2" rows="2">${esc(j.out || '')}</textarea></div>`).join('')}</div>
    <div class="flex justify-end gap-2 border-t border-line pt-3"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="trBoatApply('${slug}')"><i data-lucide="check" class="w-3.5 h-3.5"></i>ใช้คำแปล</button></div></div>`);
  icons();
}
function trBoatApply(slug) {
  (window.__trJobs || []).forEach((j, i) => { const v = $('#trj' + i)?.value.trim(); if (v) j.o[j.to] = v; });
  closeModal(); $('#langBar')?.remove(); vBoatEdit(slug); toast('ใส่คำแปลแล้ว · บันทึกอัตโนมัติ');
}
{ const _alb = addLangBar; addLangBar = function (b) {
  _alb(b);
  const bar = $('#langBar'); if (!bar || bar.querySelector('.tr-btn') || !can('boats')) return;
  const empty = boatI18nFields(b).filter(Boolean).some(o => !String(o.th || '').trim() !== !String(o.en || '').trim());
  if (empty) { bar.insertAdjacentHTML('beforeend', `<button class="btn btn-o tr-btn" onclick="trBoat('${b.slug}')"><i data-lucide="languages" class="w-3.5 h-3.5"></i>แปลช่องที่ว่างอัตโนมัติ</button>`); icons(); }
}; }

/* ---------- วิเคราะห์เว็บไซต์ → เชื่อมต่อ API: โควตาการแปล ---------- */
function trCard() {
  if (!TRU.d) { trUsage().then(() => { if (CUR === 'analytics' && GA.tab === 'api') vAnalytics(); }).catch(() => {}); return '<div class="card p-5 mt-4 text-muted text-[12.5px]">กำลังโหลดโควตาการแปล…</div>'; }
  const u = TRU.d;
  return `<div class="card p-5 mt-4"><div class="flex items-center gap-2"><i data-lucide="languages" class="w-5 h-5 text-maroon"></i><p class="font-medium">ระบบแปลอัตโนมัติ · ${u.provider ? 'Gemini (ฟรี)' : 'ยังไม่ได้เชื่อม'}</p><span class="lang-b ${u.enabled ? 'ok' : 'low'} ml-auto">${u.enabled ? 'พร้อมใช้' : 'ยังไม่พร้อม'}</span></div>
    <div class="mt-4">${trMeter(u)}</div>
    ${trHelp(u)}
    ${u.model ? `<p class="text-[11.5px] text-muted mt-2">โมเดล ${esc(u.model)}${u.provider ? ' · ข้อความที่ส่งไปแปลอาจถูก Google ใช้ปรับปรุงระบบ จึงใช้แปลเฉพาะเนื้อหาเว็บ ไม่ใช้กับข้อมูลลูกค้า' : ''}</p>` : '<p class="text-[11.5px] text-muted mt-2">ใส่ GEMINI_API_KEY (จาก aistudio.google.com) ใน .env แล้วรีสตาร์ต</p>'}
    <p class="lbl mt-4">ประวัติการแปลเดือนนี้</p><ul class="text-[12px] grid gap-1.5 mt-1">${u.log.slice(0, 15).map(l => `<li class="flex justify-between gap-3"><span class="truncate">${new Date(l.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })} · ${esc(l.user)} · ${esc(l.what)} <span class="text-muted">${l.from.toUpperCase()}→${l.to.toUpperCase()}</span></span><span class="tnum shrink-0 ${l.chars < 0 ? 'text-[#1e7a46]' : ''}">${nf(l.chars)}</span></li>`).join('') || '<li class="text-muted">ยังไม่มีการแปล</li>'}</ul></div>`;
}

/* ---------- แจ้งเตือนโควตาการแปล: ใกล้เต็ม (80%) / เต็มแล้ว · เตือนในแอดมินวันละครั้ง ---------- */
function trWarn(u) {
  if (!u || !u.enabled) return '';
  const m = u.chars / (u.limit || 1), d = (u.reqsToday || 0) / (u.dailyReq || 1);
  if (m >= 1) return 'โควตาแปลเดือนนี้เต็มแล้ว · แปลได้อีกครั้งวันที่ 1 เดือนหน้า';
  if (d >= 1) return 'วันนี้แปลครบ ' + nf(u.dailyReq) + ' ครั้งแล้ว · แปลต่อได้หลัง 14:00–15:00 น.';
  if (m >= .8) return 'โควตาแปลเดือนนี้ใช้ไป ' + Math.round(m * 100) + '% (เหลือ ' + nf(Math.max(0, u.limit - u.chars)) + ' ตัวอักษร)';
  if (d >= .8) return 'วันนี้แปลไป ' + nf(u.reqsToday) + '/' + nf(u.dailyReq) + ' ครั้ง ใกล้ครบโควตารายวัน';
  return '';
}
function trCheck() {
  if (typeof can === 'function' && !can('content') && !can('boats')) return;
  trUsage(true).then(u => {
    const w = trWarn(u); if (!w) return;
    const k = 'trWarn:' + new Date().toISOString().slice(0, 10) + ':' + w.slice(0, 24);
    try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) {}
    toastErr('⚠ ' + w);
  }).catch(() => {});
}
setTimeout(trCheck, 1500);
{ const _tc = trCard; trCard = function () { const h = _tc(), w = trWarn(TRU.d); return w ? h.replace('<div class="mt-4">', `<p class="mt-3 text-[12.5px] rounded-lg px-3 py-2 bg-[#fff7f6] text-[#a3222c] ring-1 ring-[#f3c7c2]">${w}</p><div class="mt-4">`) : h; }; }
{ const _gb = ggBody; ggBody = function () { const h = _gb(); return GA.tab === 'api' ? h + trCard() : h; }; }

/* ---------- start: the server already checked the session ---------- */
(function start() {
  const me = Object.assign({}, TEAM.find(t => t.id === BOOT.me.id) || BOOT.me, { perms: BOOT.me.perms });
  finishLogin(me, '', { t: Date.now() });
  setInterval(pollLeads, 45000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pollLeads(); });
  window.addEventListener('beforeunload', e => { boatTick(true); artTick(true); if (BFLY.size || AFLY.size) { e.preventDefault(); e.returnValue = ''; } });
})();
