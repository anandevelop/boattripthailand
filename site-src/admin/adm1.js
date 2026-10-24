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
const fmtD = s => { const d = new Date(s + 'T00:00:00'); return `${d.getDate()} ${TH_M[d.getMonth()]} ${String(d.getFullYear() + 543).slice(2)}`; };
const niceTitle = t => t.split(' ').map(w => /^ft$/i.test(w) ? 'ft' : /^[\d.]+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
const priceNum = v => { const m = String(v || '').replace(/\s/g, '').match(/([\d,]{4,})T?HB/i); return m ? +m[1].replace(/,/g, '') : null; };
const TYPE_TH = { yacht: 'เรือยอชต์', sail: 'เรือใบคาตามารัน', power: 'พาวเวอร์คาตามารัน', speed: 'สปีดโบ๊ท', longtail: 'เรือหางยาว' };
const prettyMarina = s => (s || '').toLowerCase().replace(/(^|[\s(\/-])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bRpm\b/, 'RPM').replace(/Puhket/, 'Phuket').replace('One°15', 'ONE°15').replace('Marine Panwa', 'Marina Panwa');
FLEET.forEach(b => { b.name = niceTitle(b.title); b.marinaP = prettyMarina(b.marina); b.active = true; b.featured = ['leopard-90-ft', 'splo-74-ft', 'vtech-68-ft', 'the-origin-90-ft', 'cognac-75-ft', 'siam-princess-70-ft'].includes(b.slug); });
const bySlug = s => FLEET.find(b => b.slug === s);
const progsOf = b => { const out = []; b.tables.forEach((t, ti) => t.rows.forEach((r, ri) => out.push({ ti, ri, label: r[0], price: r.slice(1).map(priceNum).find(Boolean) }))); return out; };

/* ---------- Team & sample data ---------- */
const TEAM = [
  { id: 'kwang', name: 'Kwang', tel: '+66 83 595 4839', role: 'Admin · Sales', online: true },
  { id: 'save', name: 'Save', tel: '+66 95 420 5550', role: 'Sales', online: true },
  { id: 'prang', name: 'Prang', tel: '+66 63 398 2865', role: 'Sales', online: false },
];
const STATUS = {
  new: ['ใหม่', 'st-new'], quote: ['ส่งใบเสนอราคา', 'st-quote'], deposit: ['รอมัดจำ', 'st-deposit'],
  confirmed: ['ยืนยันแล้ว', 'st-confirmed'], done: ['เสร็จสิ้น', 'st-done'], cancel: ['ยกเลิก', 'st-cancel'],
};
const CHANNELS = ['เว็บไซต์', 'WhatsApp', 'LINE', 'โทรศัพท์', 'Agent'];
const FIRST = ['Emma', 'Liam', 'Sophie', 'Noah', 'Olivia', 'Lucas', 'Mia', 'Daniel', 'Chloe', 'Max', 'Anna', 'Ivan', 'Yuki', 'Wei', 'Hannah', 'Oscar', 'สมชาย', 'กมลวรรณ', 'ปิยะพงษ์', 'ณัฐธิดา', 'ธนกร', 'พิมพ์ชนก', 'วรวุฒิ', 'อรอุมา'];
const LAST = ['Müller', 'Smith', 'Rossi', 'Johansson', 'Kim', 'Ivanova', 'Tanaka', 'Chen', 'Dubois', 'Brown', 'Novak', 'García', 'ใจดี', 'ศรีสุข', 'วงศ์ไทย', 'ทองมา', 'แก้วประเสริฐ', 'สุวรรณ'];
const COUNTRY = ['🇩🇪 DE', '🇬🇧 UK', '🇮🇹 IT', '🇸🇪 SE', '🇰🇷 KR', '🇷🇺 RU', '🇯🇵 JP', '🇨🇳 CN', '🇫🇷 FR', '🇦🇺 AU', '🇹🇭 TH', '🇹🇭 TH', '🇹🇭 TH'];
const CUSTOMERS = Array.from({ length: 42 }, (_, i) => {
  const f = pick(FIRST), l = pick(LAST), th = /[ก-๙]/.test(f);
  return { id: 'C' + String(1001 + i), name: `${f} ${th ? pick(LAST.slice(12)) : (/[ก-๙]/.test(l) ? 'Smith' : l)}`, country: th ? '🇹🇭 TH' : pick(COUNTRY.slice(0, 10)),
    phone: th ? `08${Math.floor(rnd() * 9)}-${String(Math.floor(rnd() * 900) + 100)}-${String(Math.floor(rnd() * 9000) + 1000)}` : `+${pick(['44', '49', '39', '46', '82', '61', '33'])} ${Math.floor(rnd() * 900 + 100)} ${Math.floor(rnd() * 9000 + 1000)}`,
    email: `${f.toLowerCase().replace(/[^a-z]/g, '') || 'guest' + i}${i}@example.com`, channel: pick(CHANNELS), tags: rnd() > .8 ? ['VIP'] : rnd() > .7 ? ['Agent'] : [] };
});
const BOOKINGS = [];
(function seed() {
  const pool = FLEET.filter(b => b.from_);
  for (let i = 0; i < 68; i++) {
    const b = rnd() < .45 ? pick(pool.filter(x => x.featured)) : pick(pool);
    const pr = pick(progsOf(b).filter(p => p.price));
    const off = Math.floor(rnd() * 110) - 55, date = addDays(TODAY, off);
    const created = addDays(date, -Math.floor(rnd() * 25 + 2));
    const g = Math.max(2, Math.min(b.pax || 10, Math.floor(rnd() * (b.pax || 12)) + 2));
    let status = off < 0 ? (rnd() < .1 ? 'cancel' : 'done') : pick(['new', 'quote', 'deposit', 'deposit', 'confirmed', 'confirmed', 'confirmed']);
    if (off >= 0 && created > TODAY) created.setTime(addDays(TODAY, -Math.floor(rnd() * 5)).getTime());
    const total = pr.price;
    const paid = status === 'confirmed' || status === 'done' ? (off < 0 ? total : rnd() < .5 ? total : total / 2) : status === 'deposit' ? 0 : 0;
    BOOKINGS.push({ id: `BTT-${iso(created).slice(2).replace(/-/g, '')}-${String(Math.floor(rnd() * 9000) + 1000)}`, boat: b.slug, prog: pr.label, date: iso(date), guests: g, total, paid,
      status, cust: pick(CUSTOMERS).id, sales: pick(TEAM).id, channel: pick(CHANNELS), created: iso(created), pickup: rnd() > .5 ? pick(['Kata Rocks', 'Amanpuri', 'Patong Hilton', 'Laguna Banyan Tree', 'Mövenpick Karon']) : '', note: rnd() > .7 ? pick(['ฉลองวันเกิด ขอเค้ก', 'แพ้อาหารทะเล 1 ท่าน', 'มีเด็กเล็ก 2 คน ขอเสื้อชูชีพเด็ก', 'ขอรถรับส่ง 2 จุด']) : '' });
  }
  BOOKINGS.sort((a, b) => b.created.localeCompare(a.created));
})();
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
          <td><div class="flex items-center gap-1.5"><img src="${TEAM_IMG[s.id]}" class="w-6 h-6 rounded-full object-cover"/>${s.name}</div></td>
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
