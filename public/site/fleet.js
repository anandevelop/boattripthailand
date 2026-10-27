/* =====================================================================
   หน้าเรือทั้งหมด (/yacht-charter) — Liquid Glass · smart finder
   แบบที่อนุมัติ: mockup/boattripthailand-fleet-liquid-glass.html · สไตล์: public/site/fleet.css
   Loaded after app.js (browser + server render) and replaces renderFleetPage / drawFleet.
   Uses what app.js already has: season calendars (seasonView / nowFrom), extraRule, compare tray,
   favourites, the booking modal (openBooking → /api/leads) and the date picker.
   ===================================================================== */
const FX_SSR = typeof navigator !== 'undefined' && navigator.userAgent === 'BTT-SSR';
const FX_MONTH = { th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
const FX_DEST = {
  phiphi: [/phi ?phi|\bpp\b/i, 'เกาะพีพี', 'Phi Phi Islands', 'มาหยา · ปิเละ', 'Maya Bay · Pileh'],
  khai: [/khai/i, 'เกาะไข่', 'Khai Islands', 'น้ำใส ใกล้ภูเก็ต', 'Clear water, close by'],
  coral: [/coral/i, 'เกาะเฮ', 'Coral Island', 'ดำน้ำตื้น', 'Snorkelling'],
  maiton: [/maiton/i, 'เกาะไม้ท่อน', 'Maiton Island', 'หาดทรายขาว', 'White-sand beach'],
  racha: [/racha/i, 'เกาะราชา', 'Racha Islands', 'อ่าวปะตก', 'Patok Bay'],
  phangnga: [/phang ?nga|james bond|\bjb\b|\bhong\b/i, 'อ่าวพังงา', 'Phang Nga Bay', 'เขาตะปู · ห้อง', 'James Bond Island'],
  naka: [/naka|rang ?yai/i, 'เกาะนาคา', 'Naka Island', 'รังใหญ่', 'Rang Yai'],
  sunset: [/promthep|phromthep|sunset/i, 'พระอาทิตย์ตก', 'Sunset cruise', 'แหลมพรหมเทพ', 'Promthep Cape'],
};
/* where the guest stays → drive time to each boat's pier (road ≈ 1.4 × straight line, 32–40 km/h, +5 min parking) */
const FX_STAY = {
  patong: ['ป่าตอง', 'Patong', 7.8961, 98.2965], karon: ['กะตะ / กะรน', 'Kata / Karon', 7.83, 98.298], kamala: ['กมลา', 'Kamala', 7.9506, 98.283],
  bangtao: ['บางเทา / ลากูน่า', 'Bang Tao / Laguna', 7.998, 98.295], town: ['ภูเก็ตเมือง', 'Phuket Town', 7.8804, 98.3923], chalong: ['ฉลอง', 'Chalong', 7.845, 98.34],
  rawai: ['ราไวย์ / ในหาน', 'Rawai / Nai Harn', 7.773, 98.324], airport: ['สนามบิน / ในยาง', 'Airport / Nai Yang', 8.1132, 98.3169], panwa: ['พันวา / เกาะแก้ว', 'Panwa / Koh Kaew', 7.83, 98.41],
};
const fxKm = (a, b) => { const r = x => x * Math.PI / 180, dLa = r(b[0] - a[0]), dLo = r(b[1] - a[1]); return 12742 * Math.asin(Math.sqrt(Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo / 2) ** 2)); };
function fxDrive(b) {
  if (!FX.stay || !FX_STAY[FX.stay]) return null;
  const p = pierOf(b); if (!p) return null;
  const s = FX_STAY[FX.stay], d = fxKm([s[2], s[3]], p.ll) * 1.4, base = d / (d > 20 ? 40 : 32) * 60 + 5, r5 = x => Math.max(10, Math.round(x / 5) * 5);
  const lo = r5(base * .9); return { lo, hi: Math.max(lo + 5, r5(base * 1.15)), km: d };
}
const fxStayL = k => FX_STAY[k] ? (LANG === 'en' ? FX_STAY[k][1] : FX_STAY[k][0]) : '';
const FX_DUR = { half: ['ครึ่งวัน', 'Half day'], full: ['เต็มวัน', 'Full day'], night: ['ค้างคืน', 'Overnight'] };
const FX_TYPES = ['all', 'yacht', 'sail', 'power', 'speed', 'longtail'];
const FX_MIN = 15000, FX_MAX = 200000;
const FX = { type: 'all', dest: new Set(), pax: 2, paxSet: false, dur: '', bud: FX_MAX, sort: 'smart', date: '', fav: false, stay: '' };
let fxBuiltFor = '', fxPop = null, fxInd = null;
const fxL = (a) => LANG === 'en' ? a[1] : a[0];
const fxDL = k => LANG === 'en' ? FX_DEST[k][2] : FX_DEST[k][1];
const fxEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fxMaxPax = () => Math.max(...FLEET.map(b => b.pax || 0));
const fxDate = iso => { if (!iso) return ''; const [, m, d] = iso.split('-').map(Number); return `${d} ${FX_MONTH[LANG === 'en' ? 'en' : 'th'][m - 1]}`; };

/* ---------- facts read once from the brochure tables (always the English source text) ---------- */
FLEET.forEach(b => {
  const progs = b.tables.flatMap(tb => tb.rows.map(r => r[0] || '').concat(tb.columns[0] || '')).concat((b.time_slots || []).map(r => r[0] || '')).join(' | ');
  b.fxDest = Object.keys(FX_DEST).filter(k => FX_DEST[k][0].test(progs));
  b.fxDur = ['half', 'full', 'night'].filter(k => (b.trips || []).includes(k === 'night' ? 'overnight' : k));
  if (!b.fxDur.length) b.fxDur = ['full'];
  b.fxRank = FEATURED.indexOf(b.slug);
});

/* what the cheapest price buys: "Half Day 4 hrs. · Naka Noi" → ครึ่งวัน 4 ชม. */
function fxProg(s) {
  const k = bpKind(s || ''), h = bpHrs(s || '');
  const lab = { half: ['ครึ่งวัน', 'Half day'], full: ['เต็มวัน', 'Full day'], sunset: ['ชมพระอาทิตย์ตก', 'Sunset'], night: ['ค้างคืน', 'Overnight'] }[k];
  if (lab) return fxL(lab) + (h && k !== 'night' ? ` ${h} ${L('ชม.', 'hrs')}` : '');
  return h ? `${h} ${L('ชม.', 'hrs')}` : '';
}
function fxSlotHint(b, ti) {
  const sl = (b.time_slots || []).map(r => r[0] || ''); if (!sl.length) return '';
  if (b.tables.length === sl.length) return sl[ti];
  const k = bpKind(sl[0]); return sl.every(x => bpKind(x) === k) ? sl[0] : '';
}
/* cheapest program for the date (season calendar of the boat, holiday surcharges included) or overall */
function fxFrom(b, iso) {
  let best = null;
  const take = (n, text, ti) => { if (n && (!best || n < best.n)) best = { n, text, ti }; };
  const v = iso ? seasonView(b, iso) : null;
  if (v && !v.key && boatKeys(b).length) { const nx = nextSeason(v.cal, iso); if (nx) v.key = v.base = nx.key; }
  b.tables.forEach((tb, ti) => {
    const ks = tableKeys(b.slug, tb), txt = (r, ci) => `${r[0] || ''} ${tb.columns[ci] || ''} ${tb.columns[0] || ''}`;
    if (!isSeasonTable(ks)) tb.rows.forEach(r => r.forEach((c, ci) => { if (ci && ks[ci] !== 'special') take(priceNum(c) && priceNum(c) + (v ? szAdd(v, tb, ci, r) : 0), txt(r, ci), ti); }));
    else if (!v) tb.rows.forEach(r => r.forEach((c, ci) => { if (ci && ks[ci] !== 'special') take(priceNum(c), txt(r, ci), ti); }));
    else { const ci = colFor(b, tb, v.key, v.base); if (ci > 0) tb.rows.forEach(r => take(priceNum(r[ci]), txt(r, ci), ti)); }
  });
  if (!best) return { n: b.from_ || 0, prog: '', key: v ? v.key : '' };
  return { n: best.n, prog: fxProg(best.text) || fxProg(fxSlotHint(b, best.ti)), key: v ? v.key : '' };
}
function fxPrice(b) {
  const c = b._fxc && b._fxc.k === FX.date + LANG ? b._fxc : (b._fxc = Object.assign({ k: FX.date + LANG }, fxFrom(b, FX.date)));
  const rule = extraRule(b), extraPax = rule ? Math.max(0, FX.pax - rule.from + 1) : 0;
  return { base: c.n, prog: c.prog, key: c.key, extraPax, total: c.n + extraPax * (rule ? rule.fee : 0) };
}
const fxPer = b => Math.round(fxPrice(b).total / Math.max(1, FX.pax));

/* ---------- filter · smart order ---------- */
const fxActive = () => !!(FX.dest.size || FX.dur || FX.bud < FX_MAX || FX.paxSet || FX.date || FX.stay);
function fxPass(b, ignoreType) {
  return (ignoreType || FX.type === 'all' || b.type === FX.type) && (!FX.fav || FAV.includes(b.slug)) && (b.pax || 0) >= FX.pax
    && (FX.bud >= FX_MAX || fxPrice(b).total <= FX.bud) && (!FX.dest.size || [...FX.dest].every(d => b.fxDest.includes(d))) && (!FX.dur || b.fxDur.includes(FX.dur));
}
function fxScore(b) {
  const fill = FX.pax / (b.pax || 1); let s = fill >= .45 ? 30 : fill * 60;   // not a big empty boat for a small group
  s += b.fxRank >= 0 ? 12 - b.fxRank * .8 : 0;                               // our recommended boats
  s += 34 * (1 - Math.min(1, fxPer(b) / 20000));                            // value per guest
  const dr = fxDrive(b); if (FX.stay) s -= dr ? Math.max(0, dr.hi - 20) * .45 : 18;   // a long drive counts against it
  return s;
}
const fxNear = b => { const d = fxDrive(b); return d ? d.hi : 999; };
function fxList() {
  const rank = b => b.fxRank >= 0 ? b.fxRank : 99;
  const by = { smart: fxActive() ? (a, b) => fxScore(b) - fxScore(a) : (a, b) => rank(a) - rank(b) || (b.ft || 0) - (a.ft || 0),
    pp: (a, b) => fxPer(a) - fxPer(b), low: (a, b) => fxPrice(a).total - fxPrice(b).total, high: (a, b) => fxPrice(b).total - fxPrice(a).total, size: (a, b) => (b.ft || 0) - (a.ft || 0), near: (a, b) => fxNear(a) - fxNear(b) || fxPrice(a).total - fxPrice(b).total }[FX.sort] || (() => 0);
  return FLEET.filter(b => fxPass(b)).sort(by);
}

/* ---------- the search lives in the URL: shareable, and usable as ad landing pages ---------- */
function fxRead() {
  const h = VH.hash || '', i = h.indexOf('?'), q = new URLSearchParams(i < 0 ? '' : h.slice(i + 1));
  Object.assign(FX, { type: 'all', dest: new Set(), pax: 2, paxSet: false, dur: '', bud: FX_MAX, sort: 'smart', date: '', fav: q.has('fav'), stay: FX_STAY[q.get('stay')] ? q.get('stay') : '' });
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.get('date') || '') && q.get('date') >= todayISO()) FX.date = q.get('date');
  if (+q.get('pax') > 0) { FX.pax = Math.min(200, Math.round(+q.get('pax'))); FX.paxSet = true; }
  (q.get('to') || '').split(',').filter(k => FX_DEST[k]).forEach(k => FX.dest.add(k));
  if (FX_DUR[q.get('dur')]) FX.dur = q.get('dur');
  if (+q.get('budget') >= FX_MIN) FX.bud = Math.min(FX_MAX, +q.get('budget'));
  if (FX_TYPES.includes(q.get('type'))) FX.type = q.get('type');
  if (['pp', 'low', 'high', 'size'].includes(q.get('sort')) || (q.get('sort') === 'near' && FX.stay)) FX.sort = q.get('sort');
}
function fxWrite() {
  const q = new URLSearchParams();
  if (FX.fav) q.set('fav', ''); if (FX.date) q.set('date', FX.date); if (FX.paxSet) q.set('pax', FX.pax); if (FX.dest.size) q.set('to', [...FX.dest].join(','));
  if (FX.stay) q.set('stay', FX.stay); if (FX.dur) q.set('dur', FX.dur); if (FX.bud < FX_MAX) q.set('budget', FX.bud); if (FX.type !== 'all') q.set('type', FX.type); if (FX.sort !== 'smart') q.set('sort', FX.sort);
  const s = q.toString().replace(/^fav=(&|$)/, 'fav$1');
  VHASH = '#/fleet' + (s ? '?' + s : '');
  if (!FX_SSR) try { history.replaceState(history.state, '', hashToPath(VHASH)); seoAlternates(); } catch (e) { }
}

/* ---------- page ---------- */
const FXI = n => `<i data-lucide="${n}"></i>`;
renderFleetPage = function () {
  const v = $('#view-fleet'); if (!v) return;
  fxRead();
  if (fxBuiltFor !== LANG || !$('#fxGrid')) { fxBuild(v); fxBuiltFor = LANG; }
  drawFleet();
};
function fxBuild(v) {
  const amb = bimg('leopard-90-ft', 'hero') || bimg(FLEET[0].slug, 'hero');
  v.innerHTML = `
  <div class="fx-amb" aria-hidden="true">${amb ? `<img src="${amb}" alt="">` : ''}</div>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-8 lg:pt-10 pb-16">
    <nav aria-label="Breadcrumb" class="text-xs text-muted flex items-center gap-1.5"><a href="#/" class="hover:text-maroon">${t('home')}</a><i data-lucide="chevron-right" class="w-3 h-3"></i><span class="text-ink" aria-current="page">${t('fleet')}</span></nav>
    <div class="fx-head">
      <div><h1 id="fxH1">${t('fleet')}<sup class="tnum">${FLEET.length}</sup></h1>
        <p class="fx-sub">${L('เรือยอชต์ คาตามารัน สปีดโบ๊ท และเรือหางยาวหรูแบบเหมาลำทั่วภูเก็ต · เลือกวันที่ จำนวนคน และที่อยากไป ระบบจะแสดงราคาจริงของวันนั้นให้', 'Private yachts, catamarans, speedboats and luxury long-tails across Phuket. Pick a date, your group size and where you want to go — we show the real price for that day.')}</p></div>
      <div class="fx-stats"><div><b class="tnum">${new Set(FLEET.map(b => typeof MARINA_CANON === 'function' ? MARINA_CANON(b.marina) : b.marinaP)).size}</b>${L('ท่าเรือ', 'piers & marinas')}</div><div><b class="tnum">${fxMaxPax()}</b>${L('คนต่อลำสูงสุด', 'guests on our largest boat')}</div><div><b>TAT</b>${fxEsc(SET.tat || '34/03754')}</div></div>
    </div>

    <div class="fx-fw" id="fxFw"><div class="fx-box" id="fxBox">
      <div class="fx-finder" id="fxFinder">
        <div class="fx-seg" onclick="fxOpenDate(event)"><small>${FXI('calendar')}${L('วันที่ไป', 'Date')}<span id="fxSeason"></span></small><input type="date" id="fxDate" class="fx-dv" min="${todayISO()}" aria-label="${L('วันที่ไป', 'Date')}"></div>
        <button class="fx-seg" data-pop="fxPDest"><small>${FXI('map-pin')}${L('อยากไปไหน', 'Where to')}</small><b id="fxVDest"></b></button>
        <button class="fx-seg" data-pop="fxPStay"><small>${FXI('bed-double')}${L('พักที่ไหน', 'Staying in')}</small><b id="fxVStay"></b></button>
        <div class="fx-seg" style="cursor:default"><small>${FXI('users')}${L('ไปกี่คน', 'Guests')}</small><div class="fx-step"><button type="button" onclick="fxStep(-1)" aria-label="${L('ลด', 'Fewer')}">${FXI('minus')}</button><b class="tnum fx-vpax"></b><button type="button" onclick="fxStep(1)" aria-label="${L('เพิ่ม', 'More')}">${FXI('plus')}</button></div></div>
        <button class="fx-seg" data-pop="fxPDur"><small>${FXI('clock')}${L('ระยะเวลา', 'Duration')}</small><b id="fxVDur"></b></button>
        <button class="fx-seg" data-pop="fxPBud"><small>${FXI('wallet')}${L('งบต่อลำ', 'Budget per boat')}</small><b id="fxVBud"></b></button>
        <a class="fx-go" href="#fxResults" onclick="event.preventDefault();fxToResults()">${FXI('sparkles')}<span id="fxGoT"></span></a>
      </div>
      <button class="fx-mfind" onclick="fxSheet(true)">${FXI('search')}<div><b>${L('หาเรือที่ใช่', 'Find your boat')}</b><small id="fxMSum"></small></div><span class="f">${FXI('sliders-horizontal')}</span></button>
      <div class="fx-pop" id="fxPDest" onclick="event.stopPropagation()"><h4>${L('อยากไปไหน · เลือกได้หลายที่', 'Where to · pick one or more')}</h4><div class="fx-dests" id="fxDests"></div></div>
      <div class="fx-pop" id="fxPStay" onclick="event.stopPropagation()" style="width:420px"><h4>${L('พักที่ไหน · ดูเวลาขับรถไปท่าเรือของแต่ละลำ', 'Where are you staying? · see the drive to each boat\'s pier')}</h4><div class="fx-stays" id="fxStays"></div><p class="fx-pnote">${L('เวลาโดยประมาณ ไม่รวมช่วงรถติด', 'Rough times, without rush-hour traffic')}</p></div>
      <div class="fx-pop" id="fxPDur" onclick="event.stopPropagation()"><h4>${L('ระยะเวลา', 'Duration')}</h4><div class="fx-chips" id="fxDurs"></div></div>
      <div class="fx-pop" id="fxPBud" onclick="event.stopPropagation()" style="width:340px"><h4>${L('งบต่อลำ (รวมค่าคนเกินแล้ว)', 'Budget per boat (extra guests included)')}</h4>
        <div class="fx-budv tnum" id="fxBudV"></div><div class="fx-hist" id="fxHist"></div>
        <input type="range" id="fxBud" min="${FX_MIN}" max="${FX_MAX}" step="5000" aria-label="${L('งบต่อลำ', 'Budget per boat')}">
        <div class="fx-rl tnum"><span>${baht(FX_MIN)}</span><span>${baht(FX_MAX)}+</span></div></div>
    </div></div>

    <div class="fx-bar" id="fxResults">
      <div class="fx-tabs" id="fxTabs"></div>
      <div class="r"><span class="tnum" id="fxCount"></span>
        <label class="fx-sort"><span class="sr-only">${L('เรียงลำดับ', 'Sort')}</span><select id="fxSort">
          <option value="smart">${L('เรียงแบบฉลาด ✦', 'Smart order ✦')}</option><option value="pp">${L('ราคาต่อคน ต่ำ → สูง', 'Price per guest, low → high')}</option>
          <option value="low">${L('ราคาต่อลำ ต่ำ → สูง', 'Price per boat, low → high')}</option><option value="high">${L('ราคาต่อลำ สูง → ต่ำ', 'Price per boat, high → low')}</option><option value="size">${L('เรือใหญ่ก่อน', 'Largest first')}</option><option value="near" id="fxSortNear">${L('ใกล้ที่พักก่อน', 'Closest to my stay')}</option></select>${FXI('chevron-down')}</label></div>
    </div>
    <div class="fx-ins" id="fxIns" hidden><span class="fx-spark">${FXI('sparkles')}</span><span id="fxInsT"></span><button class="fx-share" onclick="fxShare()">${FXI('link')}<span>${L('แชร์ผลค้นหา', 'Share this search')}</span></button><button class="fx-clr" onclick="fxReset()">${L('ล้าง', 'Clear')}</button></div>
    <div class="fx-grid" id="fxGrid"></div>
  </section>
  <div class="fx-veil" id="fxVeil" onclick="if(event.target===this)fxSheet(false)"><div class="fx-sheet">
    <div class="fx-srow" style="margin-bottom:14px"><h3>${L('หาเรือที่ใช่', 'Find your boat')}</h3><button class="fx-x" onclick="fxSheet(false)" aria-label="${L('ปิด', 'Close')}">${FXI('x')}</button></div>
    <div class="fx-srow"><h4>${L('วันที่ไป', 'Date')}</h4><input type="date" id="fxDate2" min="${todayISO()}" aria-label="${L('วันที่ไป', 'Date')}"></div>
    <div class="fx-srow"><h4>${L('ไปกี่คน', 'Guests')}</h4><div class="fx-step"><button type="button" onclick="fxStep(-1)">${FXI('minus')}</button><b class="tnum fx-vpax"></b><button type="button" onclick="fxStep(1)">${FXI('plus')}</button></div></div>
    <div id="fxSBody"></div>
    <div class="fx-sfoot"><button class="fx-reset" onclick="fxReset()">${L('ล้าง', 'Clear')}</button><button class="fx-book" onclick="fxSheet(false);fxToResults()" id="fxSGo"></button></div>
  </div></div>`;
  ['#fxDate', '#fxDate2'].forEach(id => { const i = $(id); i.value = FX.date; datePick(i); i.addEventListener('change', () => { FX.date = i.value; fxDraw(); }); });
  $('#fxSort').onchange = e => { FX.sort = e.target.value; fxDraw(); };
  $('#fxBud').oninput = e => { FX.bud = +e.target.value; fxDraw(); };
  v.querySelectorAll('.fx-seg[data-pop]').forEach(s => s.onclick = e => { e.stopPropagation(); fxShowPop(s.dataset.pop, s); });
  icons();
}
drawFleet = function () { fxDraw(); };

function fxDraw() {
  if (!$('#fxGrid')) return;
  const list = fxList(), big = FX.pax > fxMaxPax(), act = fxActive();
  const pick = FX.sort === 'smart' && act && list.length > 2 ? list.find(b => b.fxRank >= 0) || null : null;
  const value = act && list.length > 1 ? list.reduce((m, b) => fxPer(b) < fxPer(m) ? b : m, list[0]) : null;
  const order = pick ? [pick, ...list.filter(b => b !== pick)] : list, n = big ? 0 : list.length;
  $('#fxGrid').innerHTML = big
    ? `<div class="fx-big"><div><b>${L(`กลุ่ม ${FX.pax} คน · ใหญ่กว่าเรือลำเดียว`, `${FX.pax} guests · more than one boat`)}</b><p>${L(`เรือที่ใหญ่ที่สุดของเรารับได้ ${fxMaxPax()} คน · ทีมจัดหลายลำให้ออกเดินทางพร้อมกันได้`, `Our largest boat takes ${fxMaxPax()} guests · we can arrange several boats sailing together.`)}</p></div><button class="fx-book" onclick="fxBook('')">${L('ส่งคำขอจัดหลายลำ', 'Request several boats')}</button></div>`
    : list.length ? order.map((b, i) => fxCard(b, b === pick ? 'pick' : b === value ? 'value' : '', i, list)).join('')
    : `<div class="fx-empty">${FXI('ship')}<b>${FX.fav ? L('ยังไม่มีเรือในรายการโปรด', 'No saved boats yet') : L('ยังไม่มีเรือที่ตรงทุกข้อ', 'No boat matches everything yet')}</b><p>${L('ลองเพิ่มงบ หรือลดจำนวนจุดหมาย · ทีมเราหาเรือนอกรายการให้ได้', 'Try a higher budget or fewer stops · our team can also find boats not listed here.')}</p><div><button class="fx-reset" onclick="fxReset()">${L('ล้างตัวกรอง', 'Clear filters')}</button><button class="fx-book" onclick="fxBook('')">${L('ให้ทีมหาเรือให้', 'Ask our team')}</button></div></div>`;
  $('#fxCount').textContent = L(`พบ ${n} ลำ`, `${n} boats`);
  $('#fxGoT').textContent = L(`ดู ${n} ลำ`, `See ${n} boats`); $('#fxSGo').textContent = L(`ดู ${n} ลำ`, `See ${n} boats`);
  const H = $('#fxH1'); if (H) H.innerHTML = `${FX.fav ? L('เรือที่บันทึกไว้', 'Saved boats') : t('fleet')}<sup class="tnum">${FX.fav ? FAV.length : FLEET.length}</sup>`;
  // tabs with live counts + the sliding glass pill
  $('#fxTabs').innerHTML = '<span class="fx-ind" id="fxInd"></span>' + FX_TYPES.map(k => `<button class="fx-tab ${FX.type === k ? 'on' : ''}" onclick="fxType('${k}')">${k === 'all' ? t('all') : typeLabel(k)}<i class="tnum">${FLEET.filter(b => (k === 'all' || b.type === k) && fxPass(b, true)).length}</i></button>`).join('');
  fxMoveInd();
  // insight line
  const ins = $('#fxIns');
  if (act && list.length && !big) {
    ins.hidden = false;
    $('#fxInsT').innerHTML = `${FX.date ? fxDate(FX.date) + ' · ' : ''}${FX.pax} ${t('guests')}${FX.dest.size ? ' · ' + [...FX.dest].map(fxDL).join(' + ') : ''}${FX.stay ? ' · ' + L('พัก', 'staying in ') + fxStayL(FX.stay) : ''}${FX.dur ? ' · ' + fxL(FX_DUR[FX.dur]) : ''} — <b>${L(`${list.length} ลำ`, `${list.length} boats`)}</b>${value ? L(` · คุ้มสุดคือ <b>${fxEsc(niceTitle(value.title))}</b> ≈ ${baht(fxPer(value))}/คน`, ` · best value <b>${fxEsc(niceTitle(value.title))}</b> ≈ ${baht(fxPer(value))}/guest`) : ''}`;
  } else ins.hidden = true;
  // finder labels
  const dl = [...FX.dest].map(fxDL), se = FX.date ? seasonOf(FX.date) : '';
  $('#fxSeason').innerHTML = se ? ` · <span class="fx-season ${se}">${se[0].toUpperCase() + se.slice(1)}</span>` : '';
  fxSetV('#fxVDest', dl.length ? dl.join(', ') : L('ทุกเกาะ', 'Anywhere'), !dl.length);
  fxSetV('#fxVStay', FX.stay ? fxStayL(FX.stay) : L('ไม่ระบุ', 'Not set'), !FX.stay);
  const sn = $('#fxSortNear'); if (sn) sn.disabled = !FX.stay;
  fxSetV('#fxVDur', FX.dur ? fxL(FX_DUR[FX.dur]) : L('ได้ทั้งหมด', 'Any'), !FX.dur);
  fxSetV('#fxVBud', FX.bud >= FX_MAX ? L('ไม่จำกัด', 'No limit') : L('ไม่เกิน ', 'Up to ') + baht(FX.bud), FX.bud >= FX_MAX);
  $$('.fx-vpax').forEach(e => e.textContent = `${FX.pax} ${t('guests')}`);
  $('#fxMSum').textContent = [FX.date ? fxDate(FX.date) : L('ทุกวัน', 'Any date'), `${FX.pax} ${t('guests')}`, dl.length ? dl.join(', ') : L('ทุกเกาะ', 'Anywhere'), FX.stay ? L('พัก', '') + fxStayL(FX.stay) : '', FX.dur ? fxL(FX_DUR[FX.dur]) : '', FX.bud < FX_MAX ? '≤ ' + baht(FX.bud) : ''].filter(Boolean).join(' · ');
  ['#fxDate', '#fxDate2'].forEach(id => { const i = $(id); if (i && i.value !== FX.date) i.value = FX.date; });
  if ($('#fxSort').value !== FX.sort) $('#fxSort').value = FX.sort;
  fxPops(); fxWrite(); icons(); updateCompareUI(); updateFavUI();
}
const fxSetV = (s, txt, dim) => { const e = $(s); if (!e) return; e.textContent = txt; e.classList.toggle('dim', dim); };

function fxCard(b, mode, i, list) {
  const pick = mode === 'pick', pr = fxPrice(b), name = fxEsc(niceTitle(b.title)), fill = Math.min(100, Math.round(FX.pax / (b.pax || 1) * 100));
  const se = pr.key && FX.date ? bpSzShort(pr.key).replace(/ Season$/, '') : '';
  const lbl = (FX.date ? `${fxDate(FX.date)}${se ? ' · ' + se : ''}` : t('price.from', 'เริ่มต้น')) + (pr.prog ? ` · <b>${pr.prog}</b>` : '');
  const tags = FX.dest.size ? [...FX.dest, ...b.fxDest.filter(d => !FX.dest.has(d))].slice(0, 3) : [];
  const badge = pick ? `<span class="fx-badge best">${FXI('star')}${L('ทีมเราแนะนำ', 'Our pick')}</span>`
    : mode === 'value' ? `<span class="fx-badge value">${FXI('tag')}${L('คุ้มที่สุด', 'Best value')}</span>`
    : !fxActive() && b.fxRank >= 0 && b.fxRank < 3 ? `<span class="fx-badge fx-gd">${FXI('star')}${t('hot')}</span>` : '';
  const alts = pick ? list.filter(x => x !== b).slice(0, 2) : [];
  return `<article class="fx-card ${pick ? 'fx-pick' : ''}">
    <div class="fx-ph"><a class="fx-ph-link img-fallback" href="#/boat/${b.slug}" aria-label="${L('ดูรายละเอียด', 'View')} ${name}"><img loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async" width="796" height="597" src="${bimg(b.slug, 'hero')}" alt="${name} – ${typeLabel(b.type)} ${L('เช่าเหมาลำ ภูเก็ต', 'private charter, Phuket')}"><span class="fx-more fx-gd">${L('ดูรายละเอียด', 'Details')} ${FXI('arrow-right')}</span></a>
      <div class="fx-tl">${badge}</div>
      <div class="fx-tr"><button class="fx-cmp fx-gd" data-cmp="${b.slug}" aria-pressed="${CMP.includes(b.slug)}" onclick="toggleCompare('${b.slug}')"><span class="n">${FXI('plus')}${L('เทียบ', 'Compare')}</span><span class="y">${FXI('check')}${L('เทียบแล้ว', 'Comparing')}</span></button><button class="fx-fav fx-gd" data-fav="${b.slug}" aria-pressed="${FAV.includes(b.slug)}" onclick="toggleFav('${b.slug}')" aria-label="${L('บันทึก', 'Save')} ${name}">${FXI('heart')}</button></div>
      <a class="fx-nm" href="#/boat/${b.slug}"><small>${typeLabel(b.type)}</small><b>${name}</b></a></div>
    <div class="fx-body">
      ${pick ? `<p class="fx-eye">${FXI('sparkles')}${L(`ตรงกับที่คุณเลือก · จาก ${list.length} ลำ`, `Matches your search · from ${list.length} boats`)}</p>
      <div class="fx-why"><div><span>${FXI('star')}</span><div><b>${L('เรือแนะนำของเรา', 'One of our recommended boats')}</b> · ${L('ตรงกับวัน จำนวนคน และเส้นทางที่เลือก', 'fits your date, group and route')}</div></div>
        <div><span>${FXI('users')}</span><div><b>${FX.pax} ${t('guests')} ${fill < 75 ? L('นั่งสบาย', 'with room to spare') : L('พอดีลำ', 'a snug fit')}</b> · ${L('จุได้', 'takes')} ${b.pax} ${t('guests')}</div></div>
        <div><span>${FXI('waves')}</span><div><b>${b.fxDest.slice(0, 3).map(fxDL).join(' · ') || L('โปรแกรมรอบภูเก็ต', 'Around Phuket')}</b> · ${L('ออกจาก', 'from')} ${fxEsc(b.marinaP)}</div></div></div>` : ''}
      <div class="fx-specs">${b.ft ? `<span>${FXI('move-horizontal')}${b.ft} ft</span>` : ''}${b.pax ? `<span>${FXI('users')}${b.pax} ${t('guests')}</span>` : ''}<span class="m">${FXI('anchor')}<span>${fxEsc(b.marinaP)}</span></span></div>
      ${(() => { const d = fxDrive(b); return d ? `<div class="fx-drive ${d.hi <= 30 ? 'near' : d.hi <= 50 ? 'mid' : 'far'}">${FXI('car')}<span>${L(`ขับรถจาก${fxStayL(FX.stay)} ≈ <b>${d.lo}–${d.hi} นาที</b>`, `<b>${d.lo}–${d.hi} min</b> drive from ${fxStayL(FX.stay)}`)}</span></div>` : ''; })()}
      ${FX.paxSet && !pick ? `<div class="fx-fit"><div class="t"><span>${L('กลุ่มคุณ', 'Your group')} <b>${FX.pax}</b> / ${b.pax} ${t('guests')}</span><span>${fill < 35 ? L('กว้างขวางมาก', 'very spacious') : fill < 75 ? L('นั่งสบาย', 'comfortable') : L('เต็มพอดี', 'snug')}</span></div><div class="fx-meter"><i style="width:${fill}%"></i></div></div>` : ''}
      ${pick && alts.length ? `<p class="fx-alt-h">${L('ทางเลือกใกล้เคียง', 'Similar options')}</p><div class="fx-alts">${alts.map(x => `<a class="fx-alt" href="#/boat/${x.slug}"><img src="${bimg(x.slug, 'hero')}" alt="" loading="lazy"><div><b>${fxEsc(niceTitle(x.title))}</b><small>${x.pax} ${t('guests')} · ${baht(fxPrice(x).total)}</small></div></a>`).join('')}</div>` : ''}
      ${!pick && tags.length ? `<div class="fx-tags">${tags.map(d => `<span class="fx-tag ${FX.dest.has(d) ? 'hit' : ''}">${fxDL(d)}</span>`).join('')}</div>` : ''}
      <div class="fx-price"><div class="min-w-0"><span class="lbl">${lbl}</span><span class="amt tnum">${pr.total ? baht(pr.total) : '—'} <span>${t('perTrip')}</span></span>${pr.extraPax ? `<span class="xtra">${L(`รวมค่าคนเกิน ${pr.extraPax} คนแล้ว`, `incl. ${pr.extraPax} extra guest${pr.extraPax > 1 ? 's' : ''}`)}</span>` : ''}</div>
        <button class="fx-book" onclick="fxBook('${b.slug}')">${t('book')}</button></div>
    </div></article>`;
}

/* ---------- popovers / mobile sheet ---------- */
function fxPops() {
  $('#fxDests').innerHTML = Object.keys(FX_DEST).map(k => `<button type="button" class="fx-dest ${FX.dest.has(k) ? 'on' : ''}" onclick="fxToggleDest('${k}')"><span class="e">${FXI('waves')}</span><span><b>${fxDL(k)}</b><small><span class="h">${LANG === 'en' ? FX_DEST[k][4] : FX_DEST[k][3]} · </span>${FLEET.filter(b => b.fxDest.includes(k) && (b.pax || 0) >= FX.pax).length} ${L('ลำ', 'boats')}</small></span></button>`).join('');
  const near = k => { const keep = FX.stay; FX.stay = k; const m = Math.min(...FLEET.map(b => fxNear(b))); FX.stay = keep; return m; };
  $('#fxStays').innerHTML = Object.keys(FX_STAY).map(k => `<button type="button" class="fx-stay ${FX.stay === k ? 'on' : ''}" onclick="fxSetStay('${k}')"><b>${fxStayL(k)}</b><small class="tnum">${L(`ท่าใกล้สุด ≈ ${near(k)} นาที`, `nearest pier ≈ ${near(k)} min`)}</small></button>`).join('')
    + (FX.stay ? `<button type="button" class="fx-stay clr" onclick="fxSetStay('')">${FXI('x')}<b>${L('ไม่ระบุ', 'Clear')}</b></button>` : '');
  $('#fxDurs').innerHTML = [['', [L('ได้ทั้งหมด', 'Any'), L('ได้ทั้งหมด', 'Any')]], ...Object.entries(FX_DUR)].map(([k, l]) => `<button type="button" class="fx-chip ${FX.dur === k ? 'on' : ''}" onclick="fxSetDur('${k}')">${fxL(l)}<i>${FLEET.filter(b => (!k || b.fxDur.includes(k)) && (b.pax || 0) >= FX.pax).length}</i></button>`).join('');
  const bins = 16, w = (FX_MAX - FX_MIN) / bins, hb = Array(bins).fill(0);
  FLEET.filter(b => (b.pax || 0) >= FX.pax).forEach(b => { const n = fxPrice(b).total; if (n) hb[Math.max(0, Math.min(bins - 1, Math.floor((n - FX_MIN) / w)))]++; });
  const mx = Math.max(1, ...hb);
  $('#fxHist').innerHTML = hb.map((n, i) => `<i class="${FX_MIN + i * w <= FX.bud ? 'in' : ''}" style="height:${8 + n / mx * 92}%"></i>`).join('');
  const r = $('#fxBud'); if (+r.value !== FX.bud) r.value = FX.bud; r.style.setProperty('--v', ((FX.bud - FX_MIN) / (FX_MAX - FX_MIN) * 100) + '%');
  $('#fxBudV').textContent = FX.bud >= FX_MAX ? L('ไม่จำกัด', 'No limit') : L('ไม่เกิน ', 'Up to ') + baht(FX.bud);
}
function fxShowPop(id, seg) {
  $$('.fx-pop').forEach(p => p.classList.remove('on')); $$('.fx-seg').forEach(s => s.classList.remove('open'));
  if (!id || fxPop === id) { fxPop = null; return; }
  if (typeof dpClose === 'function') dpClose();
  fxPop = id; const p = $('#' + id); p.classList.add('on');
  if (seg) { seg.classList.add('open'); p.style.left = Math.max(0, Math.min(seg.offsetLeft, $('#fxBox').offsetWidth - p.offsetWidth)) + 'px'; }
}
if (!FX_SSR) document.addEventListener('click', e => { if (fxPop && !e.target.closest('.fx-pop')) fxShowPop(null); });
function fxOpenDate(e) { e.stopPropagation(); fxShowPop(null); const i = $('#fxDate'); if (i && i._dpVis && e.target !== i._dpVis) dpOpen(i); }
function fxSheet(on) {
  const pops = ['#fxPDest', '#fxPStay', '#fxPDur', '#fxPBud'].map(s => $(s));
  if (on) { fxShowPop(null); pops.forEach(p => $('#fxSBody').appendChild(p)); $('#fxVeil').classList.add('on'); document.body.style.overflow = 'hidden'; }
  else { pops.forEach(p => $('#fxBox').appendChild(p)); $('#fxVeil').classList.remove('on'); document.body.style.overflow = ''; }
}
function fxMoveInd() {
  if (FX_SSR || typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() => {
    const on = $('#fxTabs .fx-tab.on'), ind = $('#fxInd'); if (!on || !ind) return;
    if (fxInd) { ind.style.transition = 'none'; ind.style.width = fxInd.w + 'px'; ind.style.transform = `translateX(${fxInd.x}px)`; ind.offsetWidth; ind.style.transition = ''; }
    ind.style.width = on.offsetWidth + 'px'; ind.style.transform = `translateX(${on.offsetLeft}px)`;
    fxInd = { w: on.offsetWidth, x: on.offsetLeft };
  });
}

/* ---------- actions ---------- */
function fxType(k) { FX.type = k; fxDraw(); }
function fxToggleDest(k) { FX.dest.has(k) ? FX.dest.delete(k) : FX.dest.add(k); fxDraw(); }
function fxSetStay(k) { FX.stay = k; if (k && FX.sort === 'smart') FX.sort = 'near'; if (!k && FX.sort === 'near') FX.sort = 'smart'; fxShowPop(null); fxDraw(); }
function fxSetDur(k) { FX.dur = k; fxDraw(); }
function fxStep(d) { FX.pax = Math.max(1, Math.min(200, FX.pax + d)); FX.paxSet = true; fxDraw(); }
function fxReset() { const fav = FX.fav; Object.assign(FX, { type: 'all', dest: new Set(), pax: 2, paxSet: false, dur: '', bud: FX_MAX, sort: 'smart', date: '', fav, stay: '' }); fxDraw(); }
function fxToResults() { const r = $('#fxResults'); if (r) scrollTo({ top: r.getBoundingClientRect().top + scrollY - 170, behavior: 'smooth' }); }
function fxShare() {
  const u = location.href;
  if (navigator.share) navigator.share({ title: document.title, url: u }).catch(() => { });
  else if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => toast(L('คัดลอกลิงก์ผลค้นหาแล้ว · ส่งให้เพื่อนในกลุ่มได้เลย', 'Link copied · send it to your group')), () => toast(u));
}
/* "จองเรือ" → the site's booking form, filled with what the guest already chose */
function fxBook(slug) {
  openBooking(slug ? 'boat:' + slug : '');
  const f = modalForm; if (!f) return;
  if (FX.date) f.date.value = FX.date;
  if (FX.paxSet && f.adults) f.adults.value = FX.pax;
  const extra = [FX.pax > fxMaxPax() ? L(`กลุ่ม ${FX.pax} คน · ต้องการเรือหลายลำ`, `Group of ${FX.pax} · several boats needed`) : '', !slug && FX.dest.size ? L('อยากไป: ', 'Wants to visit: ') + [...FX.dest].map(fxDL).join(', ') : '', FX.stay ? L('พักที่: ', 'Staying in: ') + fxStayL(FX.stay) : ''].filter(Boolean).join('\n');
  if (extra && f.note && !f.note.value) f.note.value = extra;
}

/* ---------- booking form for guests from many countries: country code + reply language ---------- */
const FX_CC = [['+66', '🇹🇭 +66'], ['+86', '🇨🇳 +86'], ['+7', '🇷🇺 +7'], ['+91', '🇮🇳 +91'], ['+82', '🇰🇷 +82'], ['+81', '🇯🇵 +81'], ['+65', '🇸🇬 +65'], ['+60', '🇲🇾 +60'], ['+971', '🇦🇪 +971'], ['+44', '🇬🇧 +44'], ['+61', '🇦🇺 +61'], ['+49', '🇩🇪 +49'], ['+33', '🇫🇷 +33'], ['+1', '🇺🇸 +1']];
const FX_LANGS = [['th', 'ไทย'], ['en', 'English'], ['zh', '中文'], ['ru', 'Русский']];
function fxFormExtras(form) {
  if (!form || form._fx || !form.phone) return; form._fx = true;
  const ph = form.phone, wrap = document.createElement('div'), sel = document.createElement('select');
  wrap.className = 'bf-tel'; sel.className = ph.className; sel.setAttribute('aria-label', L('รหัสประเทศ', 'Country code'));
  sel.innerHTML = `<option value="">🌐</option>` + FX_CC.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  sel.value = LANG === 'th' ? '+66' : '';
  ph.parentNode.insertBefore(wrap, ph); wrap.append(sel, ph);
  sel.onchange = () => { const rest = ph.value.replace(/^\+\d{1,4}\s*/, ''); ph.value = (sel.value ? sel.value + ' ' : '') + rest; ph.focus(); };
  const note = form.note; if (!note) return;
  form._cl = LANG;
  const box = document.createElement('div'); box.className = 'bf-fld bf-wide';
  box.innerHTML = `<span>${L('ให้ติดต่อกลับเป็นภาษา', 'Reply to me in')}</span><div class="bf-langs">${FX_LANGS.map(([v, l]) => `<button type="button" data-l="${v}" aria-pressed="${v === LANG}">${l}</button>`).join('')}</div>`;
  box.querySelectorAll('button').forEach(b => b.onclick = () => { form._cl = b.dataset.l; box.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  (note.closest('label') || note).before(box);
  // the lead API stores th/en only: another reply language travels in the message, added just for the send
  const btn = form.querySelector('button[type=submit]');
  if (btn) btn.addEventListener('click', () => {
    if (form._cl === LANG) return;
    const orig = note.value, tag = `[${L('ให้ติดต่อกลับเป็นภาษา', 'Reply in')}: ${FX_LANGS.find(x => x[0] === form._cl)[1]}]`;
    note.value = (orig ? orig + '\n' : '') + tag;
    setTimeout(() => { if (note.value.endsWith(tag)) note.value = orig; }, 0);
  });
}
{ const _bf = buildForm; buildForm = function (wrap) { const f = _bf(wrap); try { fxFormExtras(f); } catch (e) { } return f; }; }


/* ---------- the same card on the home page and every other boat grid ---------- */
boatCard = function (b, i = 0) {
  const keep = Object.assign({}, FX, { dest: new Set(FX.dest) });
  Object.assign(FX, { type: 'all', dest: new Set(), pax: 2, paxSet: false, dur: '', bud: FX_MAX, sort: 'smart', date: '', fav: false, stay: '' });
  try { return fxCard(b, '', i, []); } finally { Object.assign(FX, keep); }
};

/* ---------- compare tray: the picked boats' photos, empty slots up to 3, one button ---------- */
updateCompareUI = function () {
  $$('[data-cmp]').forEach(b => b.setAttribute('aria-pressed', CMP.includes(b.dataset.cmp)));
  const tray = $('#cmpTray'); if (!tray) return;
  if (!tray.classList.contains('fx-tray')) tray.className = 'fx-tray';
  const n = CMP.length;
  tray.classList.toggle('on', n > 0); tray.setAttribute('aria-hidden', String(!n)); tray.setAttribute('aria-label', L('เปรียบเทียบเรือ', 'Compare boats'));
  tray.innerHTML = `<div class="fx-tth">${CMP.map(s => { const b = bySlug(s), nm = b ? fxEsc(niceTitle(b.title)) : s; return `<button type="button" onclick="toggleCompare('${s}')" title="${L('นำออก', 'Remove')} ${nm}" aria-label="${L('นำออก', 'Remove')} ${nm}"><img src="${bimg(s, 'hero')}" alt=""><span>${FXI('x')}</span></button>`; }).join('')}${'<i aria-hidden="true"></i>'.repeat(Math.max(0, 3 - n))}</div>
    <p class="fx-tp"><b><span class="l">${L('เปรียบเทียบ ', 'Compare ')}</span>${L(`${n} ลำ`, `${n} boat${n === 1 ? '' : 's'}`)}</b><small>${n < 2 ? L('เลือกอีกอย่างน้อย 1 ลำ', 'Pick at least one more') : L('เลือกได้สูงสุด 3 ลำ', 'Up to 3 boats')}</small></p>
    <button type="button" id="cmpGo" class="fx-tgo" onclick="openCompare()" ${n < 2 ? 'disabled' : ''}>${L('เปรียบเทียบ', 'Compare')}</button>
    <button type="button" class="fx-tx" onclick="CMP = []; updateCompareUI()" aria-label="${L('ล้างรายการเปรียบเทียบ', 'Clear comparison')}">${FXI('x')}</button><div id="cmpItems" hidden></div>`;   // #cmpItems: app.js's own first run (before this file) writes into it
  if (window.lucide) lucide.createIcons();
};

/* =====================================================================
   Boat page → "ท่าเรือ · จุดขึ้นเรือ" (marina section)
   Real map (MapLibre, loaded only when the section scrolls near) · pier name on top ·
   one navigate button (Apple Maps on iPhone/iPad, Google Maps elsewhere) · taxi card.
   Pier list lives here; boats are matched through MARINA_CANON (app.js).
   ok: true = pin checked on the pier itself · false = approximate, so navigation
   searches the pier by name instead of the coordinates.
   ===================================================================== */
const PIERS = [
  { c: 'Chalong Pier', n: 'Chalong Pier', th: 'ท่าเทียบเรืออ่าวฉลอง', adTh: 'ถ.เจ้าฟ้าตะวันออก ต.ฉลอง อ.เมืองภูเก็ต จ.ภูเก็ต', adEn: 'Chao Fa East Rd, Chalong, Mueang Phuket', ll: [7.8215, 98.3608], ok: false, q: 'Chalong Pier, Phuket' },
  { c: 'Royal Phuket Marina', n: 'Royal Phuket Marina', th: 'รอยัล ภูเก็ต มารีน่า', adTh: 'ถ.เทพกระษัตรี ต.เกาะแก้ว อ.เมืองภูเก็ต จ.ภูเก็ต', adEn: 'Thepkasattri Rd, Ko Kaeo, Mueang Phuket', ll: [7.96658, 98.3915], ok: true },
  { c: 'Boat Lagoon', n: 'Boat Lagoon Phuket', th: 'โบ๊ทลากูน ภูเก็ต', adTh: 'ถ.เทพกระษัตรี ต.เกาะแก้ว อ.เมืองภูเก็ต จ.ภูเก็ต', adEn: 'Thepkasattri Rd, Ko Kaeo, Mueang Phuket', ll: [7.96667, 98.38667], ok: true },
  { c: 'Ao Po Grand Marina', n: 'Ao Po Grand Marina', th: 'อ่าวปอ แกรนด์ มารีน่า', adTh: 'ต.ป่าคลอก อ.ถลาง จ.ภูเก็ต', adEn: 'Pa Khlok, Thalang, Phuket', ll: [8.06939, 98.44461], ok: true },
  { c: 'ONE°15 Marina Panwa', n: 'ONE°15 Marina Panwa', th: 'วันฟิฟทีน มารีน่า พันวา', adTh: 'ต.วิชิต อ.เมืองภูเก็ต จ.ภูเก็ต', adEn: 'Cape Panwa, Wichit, Mueang Phuket', ll: [7.8085, 98.4085], ok: false, q: 'ONE15 Marina Panwa, Phuket' },
  { c: 'Coco Pier Panwa', n: 'Coco Pier Panwa', th: 'ท่าเรือโคโค่ พันวา', adTh: 'แหลมพันวา ต.วิชิต อ.เมืองภูเก็ต จ.ภูเก็ต', adEn: 'Cape Panwa, Wichit, Mueang Phuket', ll: [7.803, 98.404], ok: false, q: 'Coco Pier Panwa, Phuket' },
  { c: 'Nakalay Pier (Kalim)', n: 'Nakalay Pier (Kalim)', th: 'ท่าเรือนาคาเล (กะหลิม)', adTh: 'หาดกะหลิม ต.ป่าตอง อ.กะทู้ จ.ภูเก็ต', adEn: 'Kalim Beach, Patong, Kathu, Phuket', ll: [7.9118, 98.2925], ok: false, q: 'Nakalay Pier Kalim, Phuket' },
];
const PR = { p: null, b: null, map: null, pin: null, is3d: true, styleOk: false, io: null };
const PR_ML = '/site/vendor/maplibre-gl-4.7.1/maplibre-gl';
const PR_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const PR_SAT = { version: 8, sources: { sat: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Imagery © Esri' } }, layers: [{ id: 'sat', type: 'raster', source: 'sat' }] };
const PR_IOS = !FX_SSR && typeof navigator !== 'undefined' && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
const PR_ANCHOR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3"/></svg>';

const pierOf = b => { const c = b && MARINA_CANON(b.marina); return PIERS.find(p => p.c === c) || null; };
const prDest = p => p.ok ? p.ll.join(',') : p.q;
const prGoogle = p => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(prDest(p))}&travelmode=driving`;
const prApple = p => `https://maps.apple.com/?daddr=${encodeURIComponent(prDest(p))}&q=${encodeURIComponent(p.n)}`;
const prNavText = () => L(`นำทางด้วย ${PR_IOS ? 'Apple Maps' : 'Google Maps'}`, `Navigate with ${PR_IOS ? 'Apple Maps' : 'Google Maps'}`);

function pierHTML(b, p) {
  const ll = p.ll.map(x => x.toFixed(5)).join(', ');
  return `<div class="pr-h">
      <p class="pr-eye">${FXI('anchor')}<span>${fxEsc(niceTitle(b.title))} · ${L('ท่าเรือ · จุดขึ้นเรือ', 'Marina · where you board')}</span></p>
      <h2>${fxEsc(p.n)}</h2>
      <div class="pr-sub"><p>${fxEsc(L(`${p.th} · ${p.adTh}`, p.adEn))}</p><button type="button" class="pr-chip" onclick="pierCopy()" title="${L('คัดลอกพิกัด + ลิงก์นำทาง', 'Copy location + directions link')}">${FXI('copy')}<span class="tabular-nums">${p.ok ? ll : L('คัดลอกลิงก์แผนที่', 'Copy map link')}</span></button></div>
    </div>
    <div class="pr-map" id="prMap">
      <div class="pr-gl" id="prGl" role="region" aria-label="${L('แผนที่ท่าเรือ', 'Marina map')} ${fxEsc(p.n)}"></div>
      <div class="pr-ph" id="prPh"><span class="pr-ph-pin">${PR_ANCHOR}</span><b>${fxEsc(p.n)}</b><small id="prPhT">${L('กำลังโหลดแผนที่…', 'Loading map…')}</small></div>
      <div class="pr-ov pr-tl"><div class="pr-seg pr-g" role="group" aria-label="${L('แบบแผนที่', 'Map type')}"><button type="button" class="on" data-s="map" onclick="pierStyle(this)">${L('แผนที่', 'Map')}</button><button type="button" data-s="sat" onclick="pierStyle(this)">${L('ดาวเทียม', 'Satellite')}</button></div></div>
      <div class="pr-ov pr-tr">
        <button type="button" class="pr-mb pr-g" onclick="PR.map && PR.map.zoomIn()" aria-label="${L('ซูมเข้า', 'Zoom in')}">${FXI('plus')}</button>
        <button type="button" class="pr-mb pr-g" onclick="PR.map && PR.map.zoomOut()" aria-label="${L('ซูมออก', 'Zoom out')}">${FXI('minus')}</button>
        <button type="button" class="pr-mb pr-g on" id="pr3d" onclick="pier3d()" aria-label="${L('มุมมอง 3 มิติ', '3D view')}">3D</button>
        <button type="button" class="pr-mb pr-g" onclick="PR.map && PR.map.easeTo({ bearing: 0, duration: 600 })" aria-label="${L('หันทิศเหนือ', 'Face north')}"><svg id="prCmp" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 4 10-4 10-4-10z"/><path d="m12 2 4 10H8z" fill="currentColor"/></svg></button>
        <button type="button" class="pr-mb pr-g" onclick="pierFocus(1200)" aria-label="${L('กลับไปที่ท่าเรือ', 'Back to the marina')}">${FXI('locate-fixed')}</button>
      </div>
    </div>
    <div class="pr-acts">
      <a class="pr-btn pr-p" id="prNav" href="${PR_IOS ? prApple(p) : prGoogle(p)}" target="_blank" rel="noopener">${FXI('navigation')}<span>${prNavText()}</span></a>
      <button type="button" class="pr-btn pr-s" onclick="pierTaxi(true)">${FXI('smartphone')}<span>${L('บัตรให้คนขับแท็กซี่', 'Card for your taxi driver')}</span></button>
    </div>`;
}

function pierMount(slug) {
  const b = bySlug(slug), sec = $('#marinaSec'), p = pierOf(b);
  if (!b || !sec || !p) return;
  pierDrop();
  PR.p = p; PR.b = b;
  sec.classList.add('pr');
  sec.innerHTML = pierHTML(b, p);
  if (FX_SSR) return;
  if (window.lucide) lucide.createIcons();
  // load the map library only when the section is about to scroll into view
  PR.io = new IntersectionObserver(es => { if (es[0].isIntersecting) { PR.io.disconnect(); PR.io = null; pierMap(); } }, { rootMargin: '300px 0px' });
  PR.io.observe($('#prMap'));
}
function pierDrop() {
  if (PR.io) { PR.io.disconnect(); PR.io = null; }
  if (PR.map) { try { PR.map.remove(); } catch (e) { } PR.map = null; PR.pin = null; }
  PR.styleOk = false; PR.is3d = true;
}
let prLib = null;
function pierLib() {
  if (window.maplibregl) return Promise.resolve();
  return prLib || (prLib = new Promise((ok, no) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = PR_ML + '.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = PR_ML + '.js'; s.async = true; s.onload = ok; s.onerror = () => { prLib = null; no(); }; document.head.appendChild(s);
  }));
}
function pierFail(msg) { const ph = $('#prPh'); if (!ph) return; ph.classList.remove('off'); $('#prMap').classList.add('fail'); $('#prPhT').textContent = msg || L('โหลดแผนที่ไม่ได้ · ปุ่มนำทางยังใช้งานได้', 'Map unavailable · directions still work'); }
function pierMap() {
  const p = PR.p, box = $('#prGl'); if (!p || !box) return;
  pierLib().then(() => {
    if (PR.p !== p || !document.body.contains(box)) return;   // the visitor moved on to another boat
    const m = new maplibregl.Map({
      container: box, style: PR_STYLE, center: [p.ll[1], p.ll[0]], zoom: 12.5, pitch: 0, bearing: 0, attributionControl: { compact: true }, cooperativeGestures: true,
      locale: L({ 'CooperativeGesturesHandler.WindowsHelpText': 'กด Ctrl ค้างไว้แล้วเลื่อนเพื่อซูม', 'CooperativeGesturesHandler.MacHelpText': 'กด ⌘ ค้างไว้แล้วเลื่อนเพื่อซูม', 'CooperativeGesturesHandler.MobileHelpText': 'ใช้สองนิ้วเพื่อเลื่อนแผนที่' }, {}),
    });
    PR.map = m;
    m.on('error', () => { if (!PR.styleOk) pierFail(); });
    m.on('style.load', () => {
      const first = !PR.styleOk; PR.styleOk = true; $('#prPh') && $('#prPh').classList.add('off');
      if (first) setTimeout(() => pierFocus(2600), 250);
    });
    m.on('rotate', () => { const c = $('#prCmp'); if (c) c.style.transform = `rotate(${-m.getBearing()}deg)`; });
    const el = document.createElement('div');
    el.innerHTML = `<div class="pr-pin"><span class="ring"></span><span class="stem"></span><span class="head">${PR_ANCHOR}</span><div class="lab pr-g">${fxEsc(p.n)}<small>${fxEsc(p.th)}</small></div></div>`;
    PR.pin = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.ll[1], p.ll[0]]).addTo(m);
  }).catch(() => pierFail());
}
function pierFocus(dur = 1400) {
  const m = PR.map, p = PR.p; if (!m || !p) return;
  m.flyTo({ center: [p.ll[1], p.ll[0]], zoom: 15, pitch: PR.is3d ? 58 : 0, bearing: PR.is3d ? -18 : 0, duration: dur, essential: true });
}
function pier3d() { PR.is3d = !PR.is3d; const b = $('#pr3d'); if (b) b.classList.toggle('on', PR.is3d); if (PR.map) PR.map.easeTo({ pitch: PR.is3d ? 58 : 0, bearing: PR.is3d ? -18 : 0, duration: 800 }); }
function pierStyle(btn) {
  $$('#prMap .pr-seg button').forEach(x => x.classList.toggle('on', x === btn));
  if (PR.map) PR.map.setStyle(btn.dataset.s === 'sat' ? PR_SAT : PR_STYLE);
}
function pierCopy() {
  const p = PR.p; if (!p) return;
  const txt = `${p.n} (${p.th}) — ${prGoogle(p)}`;
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast(L('คัดลอกพิกัด + ลิงก์นำทางแล้ว', 'Location + directions link copied')), () => toast(txt));
}
/* full-screen card the guest shows to a taxi / Grab driver: big Thai name, address, GPS */
function pierTaxi(on) {
  let t = $('#prTaxi');
  if (on && PR.p) {
    const p = PR.p;
    if (!t) { t = document.createElement('div'); t.id = 'prTaxi'; t.className = 'pr-taxi'; t.setAttribute('role', 'dialog'); t.setAttribute('aria-modal', 'true'); t.onclick = e => { if (e.target === t) pierTaxi(false); }; document.body.appendChild(t); }
    t.setAttribute('aria-label', L('บัตรให้คนขับแท็กซี่', 'Card for your taxi driver'));
    t.innerHTML = `<div class="pr-tcard">
      <p class="k">Please take me to</p><p class="k2">กรุณาไปส่งที่</p>
      <h3>${fxEsc(p.th)}</h3><p class="en">${fxEsc(p.n)}</p>
      <p class="ad">${fxEsc(p.adTh)}</p>${p.ok ? `<p class="ll tabular-nums">GPS ${p.ll.join(', ')}</p>` : ''}
      <div class="ft"><a class="pr-btn pr-s call" href="${TEL}">${FXI('phone')}<span>${L('โทรหาทีมงาน', 'Call our team')} ${fxEsc(SET.phone)}</span></a><button type="button" class="pr-btn pr-s" onclick="pierTaxi(false)">${L('ปิด', 'Close')}</button></div>
      <p class="rot">หันหน้าจอให้คนขับดู · Show this screen to your driver</p></div>`;
    if (window.lucide) lucide.createIcons();
    requestAnimationFrame(() => t.classList.add('on'));
  } else if (t) t.classList.remove('on');
}

{ const _renderDetail = renderDetail; renderDetail = function (slug) { _renderDetail(slug); try { pierMount(slug); } catch (e) { console.warn('[pier]', e); } }; }
if (!FX_SSR) addEventListener('keydown', e => { if (e.key === 'Escape') pierTaxi(false); });
if ((VH.hash || '').startsWith('#/boat/')) { try { pierMount(decodeURIComponent(VH.hash.slice(7))); } catch (e) { } }

/* =====================================================================
   Boat page → "โปรแกรม & ราคา": trip route map for the program the guest picked
   Islands are read from the program name in the price table ("Khai Nok + Naka Noi + Rang Yai"),
   drawn pier → island → … → pier over water, with a timeline. Follows every program change
   (cards, duration tabs, season, the booking-card select) because it hooks drawProgPrices.
   Shares the MapLibre loader with the marina map (pierLib). Island pins are approximate.
   ===================================================================== */
// [name EN, name TH, highlight TH, highlight EN, [lat, lng], zone]
const RT_ISL = {
  khainok: ['Khai Nok', 'เกาะไข่นอก', 'น้ำใส ทรายขาว · ดำน้ำตื้น', 'Clear water, white sand · snorkelling', [7.8795, 98.5235]],
  khainui: ['Khai Nui', 'เกาะไข่นุ้ย', 'แนวปะการังตื้น · ปลาเยอะ', 'Shallow reef · lots of fish', [7.8892, 98.5057]],
  nakanoi: ['Naka Noi', 'เกาะนาคาน้อย', 'หาดเงียบ · ร้านริมหาด', 'Quiet beach · beach bar', [8.0262, 98.4578]],
  rangyai: ['Rang Yai', 'เกาะรังใหญ่', 'หาดยาว · กิจกรรมทางน้ำ', 'Long beach · water sports', [7.9592, 98.4572]],
  maiton: ['Maiton', 'เกาะไม้ท่อน', 'หาดทรายขาว · น้ำใส', 'White-sand beach · clear water', [7.7617, 98.4818]],
  coral: ['Coral Island', 'เกาะเฮ', 'ดำน้ำดูปะการัง · หาดกล้วย', 'Coral snorkelling · Banana Beach', [7.7448, 98.3695], 's'],
  rachayai: ['Racha Yai', 'เกาะราชาใหญ่', 'อ่าวปะตก · น้ำใสมาก', 'Patok Bay · very clear water', [7.6045, 98.3667], 's'],
  rachanoi: ['Racha Noi', 'เกาะราชาน้อย', 'จุดดำน้ำ · ไกลจากฝั่ง', 'Dive spot · far offshore', [7.4985, 98.3185], 's'],
  promthep: ['Promthep Cape', 'แหลมพรหมเทพ', 'ชมพระอาทิตย์ตกจากทะเล', 'Sunset from the sea', [7.7505, 98.3045], 's'],
  panak: ['Panak', 'เกาะปันหยัก', 'ถ้ำทะลุ · ป่าโกงกาง', 'Sea caves · mangroves', [8.1785, 98.4932]],
  hongpn: ['Hong (Phang Nga)', 'เกาะห้อง พังงา', 'ลากูนในถ้ำ · พายคายัค', 'Hidden lagoon · kayaking', [8.2302, 98.5032]],
  jb: ['James Bond Island', 'เขาตะปู', 'เขาหินปูนกลางทะเล', 'Limestone tower in the sea', [8.2747, 98.5013]],
  yaonoi: ['Koh Yao Noi', 'เกาะยาวน้อย', 'หมู่บ้านชาวประมง · หาดเงียบ', 'Fishing village · quiet beaches', [8.1215, 98.6115]],
  yaoyai: ['Koh Yao Yai', 'เกาะยาวใหญ่', 'หาดยาว · วิวอ่าวพังงา', 'Long beaches · Phang Nga Bay views', [7.9985, 98.5755]],
  hongkr: ['Hong Krabi', 'เกาะห้อง กระบี่', 'ลากูนปิด · น้ำเขียวใส', 'Enclosed lagoon · emerald water', [8.0784, 98.6769]],
  phiphi: ['Phi Phi', 'เกาะพีพี', 'อ่าวมาหยา · ปิเละ · ต้นไทร', 'Maya Bay · Pileh · Tonsai', [7.7108, 98.7685]],
  bamboo: ['Bamboo Island', 'เกาะไผ่', 'หาดขาวยาว · ดำน้ำตื้น', 'Long white beach · snorkelling', [7.8175, 98.7625]],
  poda: ['Poda + Tup', 'เกาะปอดะ · ทะเลแหวก', 'สันทรายเชื่อมเกาะ · หาดขาว', 'Sandbar between islands · white beach', [7.9686, 98.8115]],
  chicken: ['Chicken Island', 'เกาะไก่', 'หินรูปหัวไก่ · ดำน้ำตื้น', 'Chicken-head rock · snorkelling', [7.9505, 98.8093]],
};
// where each pier's boats leave the coast, and which side of Phuket it is on (w = west coast, s = south, e = east / Phang Nga Bay)
const RT_PIER = {
  'Royal Phuket Marina': { z: 'e', out: [[7.958, 98.405], [7.952, 98.432]] }, 'Boat Lagoon': { z: 'e', out: [[7.958, 98.405], [7.952, 98.432]] },
  'Ao Po Grand Marina': { z: 'e', out: [[8.064, 98.462]] }, 'ONE°15 Marina Panwa': { z: 'e', out: [[7.802, 98.432]] }, 'Coco Pier Panwa': { z: 'e', out: [[7.798, 98.428]] },
  'Chalong Pier': { z: 's', out: [[7.805, 98.372]] }, 'Nakalay Pier (Kalim)': { z: 'w', out: [[7.912, 98.28]] },
};
// round the island, never across it: west ↔ south (off Promthep) ↔ east (off Cape Panwa)
const RT_LINK = { ws: [[7.86, 98.262], [7.745, 98.288]], se: [[7.765, 98.418], [7.79, 98.452]] };
const RT_KN = { yacht: 20, power: 18, speed: 28, sail: 8, longtail: 12 };
const RT = { key: '', map: null, styleOk: false, mk: [], boat: null, anim: 0, io: null, R: null, sat: false };

function rtStops(raw) {
  const s = String(raw || '').toLowerCase(), out = [], add = k => { if (!out.includes(k)) out.push(k); };
  if (/khai nok/.test(s)) add('khainok'); if (/khai nui/.test(s)) add('khainui'); if (/\bkhai\b(?!\s*n[oa-z])/.test(s)) add('khainok');
  if (/naka/.test(s)) add('nakanoi'); if (/rang/.test(s)) add('rangyai');
  if (/racha noi/.test(s)) add('rachanoi'); if (/racha(?!\s*noi)/.test(s)) add('rachayai');
  if (/coral/.test(s)) add('coral'); if (/maiton/.test(s)) add('maiton'); if (/promthep|phromthep|sunset/.test(s)) add('promthep');
  if (/phang ?nga|james|\bjb\b|panak/.test(s)) { add('panak'); add('hongpn'); add('jb'); }
  if (/hong krabi|krabi hong/.test(s) || (/\bhong\b/.test(s) && !/phang ?nga|jb/.test(s))) add('hongkr');
  if (/yao ?noi/.test(s)) add('yaonoi'); if (/yao ?yai/.test(s)) add('yaoyai');
  if (/phi ?phi|maya/.test(s)) add('phiphi'); if (/bamboo/.test(s)) add('bamboo');
  if (/4 island|four island|krabi(?!\s*hong)/.test(s) && !/hong krabi/.test(s)) { add('poda'); add('chicken'); }
  return out;
}
const rtZone = ll => ll.z || 'e';
function rtLeg(a, za, b, zb) {   // straight over water, or round the island through the links
  const ord = 'wse', i = ord.indexOf(za), j = ord.indexOf(zb), pts = [a];
  if (i < j) { if (i === 0 && j >= 1) pts.push(...RT_LINK.ws); if (j === 2 && i <= 1) pts.push(...RT_LINK.se); }
  if (i > j) { if (i === 2 && j <= 1) pts.push(...[...RT_LINK.se].reverse()); if (j === 0 && i >= 1) pts.push(...[...RT_LINK.ws].reverse()); }
  pts.push(b); return pts;
}
function rtRoute(b, p) {
  const pier = pierOf(b), cfg = pier && RT_PIER[pier.c]; if (!cfg) return null;
  const st0 = rtStops(p.raw + ' ' + (p.tb.caption || '')); if (!st0.length) return null;
  // the likely loop: nearest island first, then the nearest from there (the captain decides on the day)
  const left = [...st0], st = []; let at = cfg.out[cfg.out.length - 1];
  while (left.length) { left.sort((x, y) => fxKm(at, RT_ISL[x][4]) - fxKm(at, RT_ISL[y][4])); st.push(left.shift()); at = RT_ISL[st[st.length - 1]][4]; }
  const pts = [{ ll: pier.ll, z: cfg.z }, ...cfg.out.map(ll => ({ ll, z: cfg.z, wp: 1 })), ...st.map(k => ({ ll: RT_ISL[k][4], z: RT_ISL[k][5] || 'e', k })), ...[...cfg.out].reverse().map(ll => ({ ll, z: cfg.z, wp: 1 })), { ll: pier.ll, z: cfg.z }];
  const line = [pier.ll], legs = []; let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    rtLeg(pts[i].ll, pts[i].z, pts[i + 1].ll, pts[i + 1].z).slice(1).forEach(q => { acc += fxKm(line[line.length - 1], q); line.push(q); });
    if (!pts[i + 1].wp) { legs.push(acc); acc = 0; }
  }
  return { pier, st, line, legs };
}
const rtHm = m => { m = Math.round(m / 5) * 5; return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const rtDur = m => { m = Math.max(5, Math.round(m / 5) * 5); const h = Math.floor(m / 60), r = m % 60; return h ? L(`${h} ชม.${r ? ' ' + r + ' นาที' : ''}`, `${h} h${r ? ' ' + r + ' min' : ''}`) : L(`${r} นาที`, `${r} min`); };
const rtNm = k => LANG === 'en' ? RT_ISL[k][0] : RT_ISL[k][1];
const RT_SHIP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.4 17.4 22 8l-10-4L2 8l2.6 9.4"/><path d="M12 4v14"/></svg>';

/* the timeline + summary for one program (also rendered on the server, so the route is in the HTML) */
function rtPlan(b, p, R) {
  const sl = (bpSlots(b, p)[0] || '').match(/(\d{2}):(\d{2})(?:–(\d{2}):(\d{2}))?/);
  const start = sl ? +sl[1] * 60 + +sl[2] : 9 * 60, end = sl && sl[3] ? +sl[3] * 60 + +sl[4] : 0;
  const hrs = p.hrs || (end > start ? (end - start) / 60 : p.kind === 'half' ? 4 : p.kind === 'sunset' ? 3 : 8);
  const kmh = (RT_KN[b.type] || 15) * 1.852, sail = R.legs.map(d => d / kmh * 60), sailT = sail.reduce((a, x) => a + x, 0);
  const stay = Math.max(20, (hrs * 60 - sailT) / R.st.length);
  let t = start; const steps = [{ pt: 1, tm: t, b: L('ออกจาก ', 'Leave ') + R.pier.n, p: L('มาถึงก่อน 15–20 นาที', 'Arrive 15–20 min early') }];
  R.st.forEach((k, j) => { t += sail[j]; steps.push({ j, tm: t, b: rtNm(k), p: `${LANG === 'en' ? RT_ISL[k][3] : RT_ISL[k][2]} · ${L('อยู่', 'stay')} ≈ ${rtDur(stay)}`, leg: sail[j] }); t += stay; });
  steps.push({ pt: 1, tm: start + hrs * 60, b: L('กลับถึงท่า', 'Back at the pier'), p: R.pier.n, leg: sail[sail.length - 1] });
  return { hrs, start, sailT, km: R.legs.reduce((a, x) => a + x, 0), steps };
}
function rtUpdate(b, p) {
  const box = $('#rtBox'); if (!box || !b || !p) return;
  const key = b.slug + '|' + p.i + '|' + LANG; if (RT.key === key && box.dataset.k === key) return;
  RT.key = key; box.dataset.k = key;
  const R = rtRoute(b, p);
  if (!R) { box.hidden = true; RT.R = null; return; }
  box.hidden = false; RT.R = R;
  const P = rtPlan(b, p, R);
  $('#rtSum').innerHTML = `<span class="ic">${RT_SHIP}</span><div class="min-w-0"><b>${R.st.map(rtNm).join(' → ')}</b><span>${fxEsc(p.name)}${P.hrs ? ' · ' + L(`${P.hrs} ชม.`, `${P.hrs} h`) : ''} · ${L('ออก', 'leaves')} ${rtHm(P.start)}</span></div>
    <div class="st"><div><b class="tabular-nums">${Math.round(P.km)} ${L('กม.', 'km')}</b><span>${L('ทั้งทริป', 'round trip')}</span></div><div><b class="tabular-nums">${rtDur(P.sailT)}</b><span>${L('ล่องเรือ', 'sailing')}</span></div></div>`;
  $('#rtTl').innerHTML = P.steps.map(s => `<div class="rt-tp ${s.pt ? 'pt' : ''}" data-j="${s.pt ? -1 : s.j}" onmouseenter="rtHl(${s.pt ? -1 : s.j})" onmouseleave="rtHl(-1)">
      ${s.leg ? `<span class="leg tabular-nums">${rtDur(s.leg)}</span>` : ''}
      <div class="row"><span class="dot">${s.pt ? FXI('anchor') : s.j + 1}</span><span class="ln"></span></div>
      <div class="tm tabular-nums">${rtHm(s.tm)}</div><b>${fxEsc(s.b)}</b><p>${fxEsc(s.p)}</p></div>`).join('');
  if (window.lucide && !FX_SSR) lucide.createIcons();
  if (RT.map) rtDraw(); else if (!FX_SSR && !RT.io) { RT.io = new IntersectionObserver(es => { if (es[0].isIntersecting) { RT.io.disconnect(); RT.io = null; rtInit(); } }, { rootMargin: '300px 0px' }); RT.io.observe($('#rtMap')); }
}
function rtInit() {
  const el = $('#rtGl'); if (!el) return;
  pierLib().then(() => {
    if (!document.body.contains(el)) return;
    RT.styleOk = false;
    RT.map = new maplibregl.Map({ container: el, style: PR_STYLE, center: [98.5, 7.9], zoom: 9, attributionControl: { compact: true }, cooperativeGestures: true,
      locale: L({ 'CooperativeGesturesHandler.WindowsHelpText': 'กด Ctrl ค้างไว้แล้วเลื่อนเพื่อซูม', 'CooperativeGesturesHandler.MacHelpText': 'กด ⌘ ค้างไว้แล้วเลื่อนเพื่อซูม', 'CooperativeGesturesHandler.MobileHelpText': 'ใช้สองนิ้วเพื่อเลื่อนแผนที่' }, {}) });
    RT.map.on('error', () => { if (!RT.styleOk) rtFail(); });
    RT.map.on('style.load', () => { RT.styleOk = true; const ph = $('#rtPh'); if (ph) ph.classList.add('off'); rtLines(); });
    rtDraw();
  }).catch(() => rtFail());
}
function rtFail() { const ph = $('#rtPh'); if (ph) { ph.classList.remove('off'); ph.textContent = L('โหลดแผนที่ไม่ได้ · ดูลำดับเกาะได้ด้านล่าง', 'Map unavailable · the stops are listed below'); } const m = $('#rtMap'); if (m) m.classList.add('fail'); }
const rtGeo = line => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: line.map(q => [q[1], q[0]]) } });
function rtLines() {
  if (!RT.map || !RT.styleOk || !RT.R) return;
  try {
    const d = rtGeo(RT.R.line), m = RT.map;
    if (m.getSource('rt')) m.getSource('rt').setData(d);
    else {
      m.addSource('rt', { type: 'geojson', data: d });
      m.addLayer({ id: 'rt-glow', type: 'line', source: 'rt', paint: { 'line-color': '#1f7a8c', 'line-width': 12, 'line-opacity': .16, 'line-blur': 5 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      m.addLayer({ id: 'rt', type: 'line', source: 'rt', paint: { 'line-color': '#1f7a8c', 'line-width': 3, 'line-dasharray': [2, 1.6] }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
    }
  } catch (e) { setTimeout(rtLines, 400); }
}
function rtDraw() {
  const m = RT.map, R = RT.R; if (!m || !R) return;
  RT.mk.forEach(x => x.remove()); RT.mk = [];
  const pe = document.createElement('div'); pe.innerHTML = `<div class="rt-pier">${PR_ANCHOR}</div>`;
  RT.mk.push(new maplibregl.Marker({ element: pe, anchor: 'bottom' }).setLngLat([R.pier.ll[1], R.pier.ll[0]]).addTo(m));
  R.st.forEach((k, j) => {
    const w = document.createElement('div'), el = document.createElement('div'); w.appendChild(el);
    el.className = 'rt-stop pr-g'; el.dataset.j = j; el.innerHTML = `<i>${j + 1}</i>${fxEsc(rtNm(k))}`;
    el.onmouseenter = () => rtHl(j); el.onmouseleave = () => rtHl(-1);
    el.onclick = () => m.flyTo({ center: [RT_ISL[k][4][1], RT_ISL[k][4][0]], zoom: 13, duration: 1200 });
    RT.mk.push(new maplibregl.Marker({ element: w, anchor: 'left', offset: [-13, 0] }).setLngLat([RT_ISL[k][4][1], RT_ISL[k][4][0]]).addTo(m));
  });
  rtLines(); rtFit(1100); rtSail();
}
function rtFit(dur = 900) {
  const m = RT.map, R = RT.R; if (!m || !R) return;
  const bb = new maplibregl.LngLatBounds(); R.line.forEach(q => bb.extend([q[1], q[0]]));
  const small = ($('#rtMap') || {}).clientWidth < 600;
  m.fitBounds(bb, { padding: small ? { top: 40, bottom: 110, left: 40, right: 120 } : { top: 50, bottom: 96, left: 60, right: 210 }, duration: dur, maxZoom: 12.5 });
}
/* a small boat sails the route on a loop (off for reduced motion) */
function rtSail() {
  cancelAnimationFrame(RT.anim); const m = RT.map, R = RT.R;
  if (!m || !R || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!RT.boat || RT.boat._map !== m) { const e = document.createElement('div'); e.innerHTML = `<div class="rt-boat">${RT_SHIP}</div>`; RT.boat = new maplibregl.Marker({ element: e }).setLngLat([R.pier.ll[1], R.pier.ll[0]]).addTo(m); }
  const Ln = R.line, seg = []; const tot = Ln.slice(1).reduce((a, q, i) => { const d = fxKm(Ln[i], q); seg.push(d); return a + d; }, 0);
  const T = Math.max(9000, tot * 160), t0 = performance.now();
  const step = now => {
    if (!document.body.contains(m.getContainer())) return;
    let d = ((now - t0) % T) / T * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const f = seg[i] ? d / seg[i] : 0, a = Ln[i], c = Ln[i + 1];
    RT.boat.setLngLat([a[1] + (c[1] - a[1]) * f, a[0] + (c[0] - a[0]) * f]);
    RT.anim = requestAnimationFrame(step);
  };
  RT.anim = requestAnimationFrame(step);
}
function rtHl(j) {
  $$('.rt-stop').forEach(e => e.classList.toggle('hl', +e.dataset.j === j));
  $$('.rt-tp').forEach(e => e.classList.toggle('hl', j >= 0 && +e.dataset.j === j));
}
function rtSat(btn) { RT.sat = !RT.sat; btn.classList.toggle('on', RT.sat); if (RT.map) { RT.styleOk = false; RT.map.setStyle(RT.sat ? PR_SAT : PR_STYLE); } }
function rtDrop() {
  cancelAnimationFrame(RT.anim); if (RT.io) { RT.io.disconnect(); RT.io = null; }
  if (RT.map) { try { RT.map.remove(); } catch (e) { } }
  Object.assign(RT, { key: '', map: null, styleOk: false, mk: [], boat: null, R: null });
}
function rtMount() {
  const list = $('#bpProgs'); if (!list || $('#rtBox')) return;
  const box = document.createElement('div'); box.className = 'rt pr'; box.id = 'rtBox'; box.hidden = true;
  box.innerHTML = `<div class="rt-h">${FXI('route')}<span>${L('เส้นทางของโปรแกรมนี้', 'Route of this program')}</span></div>
    <div class="rt-map pr-mapbox" id="rtMap">
      <div class="pr-gl" id="rtGl" role="region" aria-label="${L('แผนที่เส้นทางทริป', 'Trip route map')}"></div>
      <div class="rt-ph" id="rtPh">${L('กำลังโหลดแผนที่…', 'Loading map…')}</div>
      <div class="pr-ov pr-tr">
        <button type="button" class="pr-mb pr-g" onclick="RT.map && RT.map.zoomIn()" aria-label="${L('ซูมเข้า', 'Zoom in')}">${FXI('plus')}</button>
        <button type="button" class="pr-mb pr-g" onclick="RT.map && RT.map.zoomOut()" aria-label="${L('ซูมออก', 'Zoom out')}">${FXI('minus')}</button>
        <button type="button" class="pr-mb pr-g" onclick="rtSat(this)" aria-label="${L('ภาพดาวเทียม', 'Satellite')}">${FXI('satellite')}</button>
        <button type="button" class="pr-mb pr-g" onclick="rtFit(900)" aria-label="${L('ดูทั้งเส้นทาง', 'Whole route')}">${FXI('maximize-2')}</button>
      </div>
      <div class="rt-sum pr-g" id="rtSum"></div>
    </div>
    <div class="rt-tl" id="rtTl"></div>
    <p class="rt-note">${FXI('info')}${L('เส้นทางและเวลาโดยประมาณ · กัปตันอาจสลับลำดับเกาะตามคลื่นลมในวันจริง', 'Approximate route and times · the captain may change the order for the weather on the day')}</p>`;
  list.after(box);
}
{ const _dpp = drawProgPrices; drawProgPrices = function (b, keep) { _dpp(b, keep); try { const ps = bpProgs(b); rtUpdate(b, ps[detailProgram] || ps[0]); } catch (e) { console.warn('[route]', e); } }; }
{ const _rd2 = renderDetail; renderDetail = function (slug) { rtDrop(); _rd2(slug); try { const b = bySlug(slug); if (!b) return; rtMount(); const ps = bpProgs(b); rtUpdate(b, ps[detailProgram] || ps[0]); } catch (e) { console.warn('[route]', e); } }; }
if ((VH.hash || '').startsWith('#/boat/')) { try { const b = bySlug(decodeURIComponent(VH.hash.slice(7))); if (b) { rtMount(); const ps = bpProgs(b); rtUpdate(b, ps[detailProgram] || ps[0]); } } catch (e) { } }

/* ---------- start ---------- */
if (!FX_SSR) {
  addEventListener('scroll', () => { const fw = $('#fxFw'); if (fw) fw.classList.toggle('stuck', fw.getBoundingClientRect().top <= 83); }, { passive: true });
  addEventListener('resize', () => { fxInd = null; fxMoveInd(); });
  try { if ($('#inlineFormWrap')) inlineForm = buildForm($('#inlineFormWrap')); } catch (e) { }
}
{ const g = $('#boatGrid'); if (g) { g.className = 'fx-grid mt-6'; try { renderBoats(); } catch (e) { } } }
updateCompareUI();
if ((VH.hash || '').startsWith('#/fleet')) { renderFleetPage(); if (typeof afterRoute === 'function') afterRoute(); }
