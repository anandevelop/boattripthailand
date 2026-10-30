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
  const amb = bimg('leopard-90-ft', 'hero', 320) || bimg(FLEET[0].slug, 'hero', 320);
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
    <div class="fx-ph"><a class="fx-ph-link img-fallback" href="#/boat/${b.slug}" aria-label="${L('ดูรายละเอียด', 'View')} ${name}"><img loading="${i < 3 && (VH.hash || '').startsWith('#/fleet') ? 'eager' : 'lazy'}" decoding="async" width="796" height="597" src="${bimg(b.slug, 'hero')}" alt="${name} – ${typeLabel(b.type)} ${L('เช่าเหมาลำ ภูเก็ต', 'private charter, Phuket')}"><span class="fx-more fx-gd">${L('ดูรายละเอียด', 'Details')} ${FXI('arrow-right')}</span></a>
      <div class="fx-tl">${badge}</div>
      <div class="fx-tr"><button class="fx-cmp fx-gd" data-cmp="${b.slug}" aria-pressed="${CMP.includes(b.slug)}" onclick="toggleCompare('${b.slug}')"><span class="n">${FXI('plus')}${L('เทียบ', 'Compare')}</span><span class="y">${FXI('check')}${L('เทียบแล้ว', 'Comparing')}</span></button><button class="fx-fav fx-gd" data-fav="${b.slug}" aria-pressed="${FAV.includes(b.slug)}" onclick="toggleFav('${b.slug}')" aria-label="${L('บันทึก', 'Save')} ${name}">${FXI('heart')}</button></div>
      <a class="fx-nm" href="#/boat/${b.slug}"><small>${typeLabel(b.type)}</small><b>${name}</b></a></div>
    <div class="fx-body">
      ${pick ? `<p class="fx-eye">${FXI('sparkles')}${L(`ตรงกับที่คุณเลือก · จาก ${list.length} ลำ`, `Matches your search · from ${list.length} boats`)}</p>
      <div class="fx-why"><div><span>${FXI('star')}</span><div><b>${L('เรือแนะนำของเรา', 'One of our recommended boats')}</b> · ${L('ตรงกับวัน จำนวนคน และเส้นทางที่เลือก', 'fits your date, group and route')}</div></div>
        <div><span>${FXI('users')}</span><div><b>${FX.pax} ${t('guests')} ${fill < 75 ? L('นั่งสบาย', 'with room to spare') : L('พอดีลำ', 'a snug fit')}</b> · ${L('จุได้', 'takes')} ${b.pax} ${t('guests')}</div></div>
        <div><span>${FXI('waves')}</span><div><b>${b.fxDest.slice(0, 3).map(fxDL).join(' · ') || L('โปรแกรมรอบภูเก็ต', 'Around Phuket')}</b> · ${L('ออกจาก', 'from')} ${fxEsc(b.marinaP)}</div></div></div>` : ''}
      <div class="fx-specs">${[b.ft ? `<span>${b.ft} ft</span>` : '', b.pax ? `<span>${L('สูงสุด', 'up to')} ${b.pax} ${t('guests')}</span>` : '', `<span class="m">${fxEsc((pierOf(b) || {}).n || b.marinaP)}</span>`].filter(Boolean).join('<i aria-hidden="true">·</i>')}</div>
      ${(() => { const d = fxDrive(b); return d ? `<div class="fx-drive ${d.hi <= 30 ? 'near' : d.hi <= 50 ? 'mid' : 'far'}">${FXI('car')}<span>${L(`ขับรถจาก${fxStayL(FX.stay)} ≈ <b>${d.lo}–${d.hi} นาที</b>`, `<b>${d.lo}–${d.hi} min</b> drive from ${fxStayL(FX.stay)}`)}</span></div>` : ''; })()}
      ${FX.paxSet && !pick ? `<div class="fx-fit"><div class="t"><span>${L('กลุ่มคุณ', 'Your group')} <b>${FX.pax}</b> / ${b.pax} ${t('guests')}</span><span>${fill < 35 ? L('กว้างขวางมาก', 'very spacious') : fill < 75 ? L('นั่งสบาย', 'comfortable') : L('เต็มพอดี', 'snug')}</span></div><div class="fx-meter"><i style="width:${fill}%"></i></div></div>` : ''}
      ${pick && alts.length ? `<p class="fx-alt-h">${L('ทางเลือกใกล้เคียง', 'Similar options')}</p><div class="fx-alts">${alts.map(x => `<a class="fx-alt" href="#/boat/${x.slug}"><img src="${bimg(x.slug, 'hero')}" alt="" loading="lazy"><div><b>${fxEsc(niceTitle(x.title))}</b><small>${x.pax} ${t('guests')} · ${baht(fxPrice(x).total)}</small></div></a>`).join('')}</div>` : ''}
      ${!pick && tags.length ? `<div class="fx-tags">${tags.map(d => `<span class="fx-tag ${FX.dest.has(d) ? 'hit' : ''}">${fxDL(d)}</span>`).join('')}</div>` : ''}
      <div class="fx-price"><div class="min-w-0"><span class="lbl">${lbl}</span><span class="amt tnum">${pr.total ? baht(pr.total) : '—'} <span>${t('perTrip')}</span></span>${pr.extraPax ? `<span class="xtra">${L(`รวมค่าคนเกิน ${pr.extraPax} คนแล้ว`, `incl. ${pr.extraPax} extra guest${pr.extraPax > 1 ? 's' : ''}`)}</span>` : ''}</div>
        <a class="fx-view" href="#/boat/${b.slug}" aria-label="${L('ดูรายละเอียด', 'View')} ${name}">${FXI('arrow-up-right')}</a></div>
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

/* ---------- booking form for guests from many countries: country code (reply language = site language) ---------- */
const FX_CC = [['+66', '🇹🇭 +66'], ['+86', '🇨🇳 +86'], ['+7', '🇷🇺 +7'], ['+91', '🇮🇳 +91'], ['+82', '🇰🇷 +82'], ['+81', '🇯🇵 +81'], ['+65', '🇸🇬 +65'], ['+60', '🇲🇾 +60'], ['+971', '🇦🇪 +971'], ['+44', '🇬🇧 +44'], ['+61', '🇦🇺 +61'], ['+49', '🇩🇪 +49'], ['+33', '🇫🇷 +33'], ['+1', '🇺🇸 +1']];
function fxFormExtras(form) {
  if (!form || form._fx || !form.phone) return; form._fx = true;
  const ph = form.phone, wrap = document.createElement('div'), sel = document.createElement('select');
  wrap.className = 'bf-tel'; sel.className = ph.className; sel.setAttribute('aria-label', L('รหัสประเทศ', 'Country code'));
  sel.innerHTML = `<option value="">🌐</option>` + FX_CC.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  sel.value = LANG === 'th' ? '+66' : '';
  ph.parentNode.insertBefore(wrap, ph); wrap.append(sel, ph);
  sel.onchange = () => { const rest = ph.value.replace(/^\+\d{1,4}\s*/, ''); ph.value = (sel.value ? sel.value + ' ' : '') + rest; ph.focus(); };
  // the reply language is the language the site is open in (the lead's lang field)
  fxConsentText(form);
}
/* PDPA wording: the notice says what the details are used for (contract basis, no tick needed) and links the policy;
   the optional box is a separate, specific consent for marketing — who, what, which channels, and that it can be withdrawn */
TH_CACHE['f.notice2'] = 'เมื่อกด "ส่งคำขอจอง" ทีมขายจะใช้ชื่อ เบอร์ติดต่อ และรายละเอียดทริปนี้ เพื่อติดต่อกลับทาง WhatsApp / LINE / โทรศัพท์ เช็กคิวเรือ และเสนอราคาให้คุณ อ่านรายละเอียดใน<a href="#/privacy">นโยบายความเป็นส่วนตัว</a>';
I18N.en['f.notice2'] = 'When you press "Send booking request", our sales team uses your name, contact details and trip details to reply by WhatsApp, LINE or phone, check availability and send you a quote. See our <a href="#/privacy">Privacy Policy</a>.';
TH_CACHE['f.mkt2'] = 'ฉันยินยอมให้ Boat Trip Thailand ส่งข่าวสาร โปรโมชั่น และคิวเรือว่างช่วงพิเศษ ทาง LINE WhatsApp หรืออีเมล <small>(ไม่บังคับ · ถอนความยินยอมได้ทุกเมื่อ)</small>';
I18N.en['f.mkt2'] = 'I agree that Boat Trip Thailand may send me news, offers and last-minute availability by LINE, WhatsApp or email <small>(optional · you can withdraw at any time)</small>';
function fxConsentText(form) {
  const sw = (el, k) => { if (!el) return; el.removeAttribute('data-i18n'); el.removeAttribute('data-th'); el.setAttribute('data-i18n-html', k); el.innerHTML = LANG === 'en' ? I18N.en[k] : TH_CACHE[k]; };
  sw(form.querySelector('.bf-note[data-i18n="f.consent"]'), 'f.notice2');
  sw(form.querySelector('.bf-check [data-i18n="f.marketing"]'), 'f.mkt2');
  if (typeof realLinks === 'function') realLinks(form);
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
  if (!R) { rtHide(box, true); RT.R = null; rtMarina(false); return; }
  rtHide(box, false); RT.R = R; rtMarina(true, R.pier);
  const P = rtPlan(b, p, R);
  $('#rtSum').innerHTML = `<span class="ic">${RT_SHIP}</span><div class="min-w-0"><b>${R.st.map(rtNm).join(' → ')}</b><span>${fxEsc(p.name)}${P.hrs && !/\d\s*(ชม|ชั่วโมง|hrs?|hours?|h)\b/i.test(p.name) ? ' · ' + L(`${P.hrs} ชม.`, `${P.hrs} h`) : ''} · ${L('ออก', 'leaves')} ${rtHm(P.start)}</span></div>
    <div class="st"><div><b class="tabular-nums">${Math.round(P.km)} ${L('กม.', 'km')}</b><span>${L('ทั้งทริป', 'round trip')}</span></div><div><b class="tabular-nums">${rtDur(P.sailT)}</b><span>${L('ล่องเรือ', 'sailing')}</span></div></div>`;
  $('#rtTl').innerHTML = P.steps.map(s => `<div class="rt-tp ${s.pt ? 'pt' : ''}" data-j="${s.pt ? -1 : s.j}" onmouseenter="rtHl(${s.pt ? -1 : s.j})" onmouseleave="rtHl(-1)">
      ${s.leg ? `<span class="leg tabular-nums">${rtDur(s.leg)}</span>` : ''}
      <div class="row"><span class="dot">${s.pt ? FXI('anchor') : s.j + 1}</span><span class="ln"></span></div>
      <div class="tm tabular-nums">${rtHm(s.tm)}</div><b>${fxEsc(s.b)}</b><p>${fxEsc(s.p)}</p></div>`).join('');
  if (window.lucide && !FX_SSR) lucide.createIcons();
  if (RT.map) rtDraw(); else if (!FX_SSR && !RT.io) { RT.io = new IntersectionObserver(es => { if (es[0].isIntersecting) { RT.io.disconnect(); RT.io = null; rtInit(); } }, { rootMargin: '300px 0px' }); RT.io.observe($('#rtMap')); }
}
/* the route map also carries the pier: name, address, copy, navigate, taxi card. The separate marina section then hides */
const rtHide = (el, on) => { if (el) on ? el.setAttribute('hidden', '') : el.removeAttribute('hidden'); };   // attribute, so the server render keeps it too
function rtMarina(on, pier) {
  const sec = $('#marinaSec'), bar = $('#rtPier');
  rtHide(sec, !!on);
  const a = $('#secnav a[href="#marinaSec"]'); if (a) a.setAttribute('onclick', on ? 'event.preventDefault();rtGoPier()' : "event.preventDefault();secGo('marinaSec')");
  if (!bar) return;
  rtHide(bar, !on); if (!on) return;
  PR.p = pier;
  const ll = pier.ll.map(x => x.toFixed(5)).join(', ');
  bar.innerHTML = `<button type="button" class="rt-pin" onclick="rtGoPier(true)" aria-label="${L('ดูท่าเรือบนแผนที่', 'Show the marina on the map')}">${PR_ANCHOR}</button>
    <div class="rt-pi"><small>${L('ท่าเรือ · จุดขึ้นเรือ', 'Marina · where you board')}</small><b>${fxEsc(pier.n)}</b><p>${fxEsc(L(`${pier.th} · ${pier.adTh}`, pier.adEn))}</p>
      <button type="button" class="pr-chip" onclick="pierCopy()" title="${L('คัดลอกพิกัด + ลิงก์นำทาง', 'Copy location + directions link')}">${FXI('copy')}<span class="tabular-nums">${pier.ok ? ll : L('คัดลอกลิงก์แผนที่', 'Copy map link')}</span></button></div>
    <div class="rt-pa"><a class="pr-btn pr-p" href="${PR_IOS ? prApple(pier) : prGoogle(pier)}" target="_blank" rel="noopener">${FXI('navigation')}<span>${prNavText()}</span></a>
      <button type="button" class="pr-btn pr-s" onclick="pierTaxi(true)">${FXI('smartphone')}<span>${L('บัตรให้คนขับแท็กซี่', 'Card for your taxi driver')}</span></button></div>`;
}
/* the "Marina" tab and the pier pin: scroll to the route and fly into the pier in 3D */
function rtGoPier(stay) {
  if (!stay) secGo('rtBox');
  const go = () => { const m = RT.map, R = RT.R; if (!m || !R) return; m.flyTo({ center: [R.pier.ll[1], R.pier.ll[0]], zoom: 15, pitch: 55, bearing: -18, duration: 1800, essential: true }); };
  if (RT.map) setTimeout(go, stay ? 0 : 500); else RT.pending = go;
}
function rtInit() {
  const el = $('#rtGl'); if (!el) return;
  pierLib().then(() => {
    if (!document.body.contains(el)) return;
    RT.styleOk = false;
    RT.map = new maplibregl.Map({ container: el, style: PR_STYLE, center: [98.5, 7.9], zoom: 9, attributionControl: { compact: true }, cooperativeGestures: true,
      locale: L({ 'CooperativeGesturesHandler.WindowsHelpText': 'กด Ctrl ค้างไว้แล้วเลื่อนเพื่อซูม', 'CooperativeGesturesHandler.MacHelpText': 'กด ⌘ ค้างไว้แล้วเลื่อนเพื่อซูม', 'CooperativeGesturesHandler.MobileHelpText': 'ใช้สองนิ้วเพื่อเลื่อนแผนที่' }, {}) });
    RT.map.on('error', () => { if (!RT.styleOk) rtFail(); });
    RT.map.on('style.load', () => { RT.styleOk = true; const ph = $('#rtPh'); if (ph) ph.classList.add('off'); rtLines(); if (RT.pending) { const g = RT.pending; RT.pending = null; setTimeout(g, 1200); } });
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
  const pe = document.createElement('div'); pe.innerHTML = `<div class="rt-pier" role="button" title="${fxEsc(R.pier.n)}">${PR_ANCHOR}</div>`; pe.style.zIndex = 4; pe.style.cursor = 'pointer'; pe.onclick = () => rtGoPier(true);
  RT.mk.push(new maplibregl.Marker({ element: pe, anchor: 'bottom' }).setLngLat([R.pier.ll[1], R.pier.ll[0]]).addTo(m));
  R.st.forEach((k, j) => {
    const w = document.createElement('div'), el = document.createElement('div'); w.appendChild(el);
    el.className = 'rt-stop pr-g'; el.dataset.j = j; el.innerHTML = `<i>${j + 1}</i>${fxEsc(rtNm(k))}`;
    el.onmouseenter = () => rtHl(j); el.onmouseleave = () => rtHl(-1);
    el.onclick = () => m.flyTo({ center: [RT_ISL[k][4][1], RT_ISL[k][4][0]], zoom: 13, duration: 1200 });
    w.style.zIndex = 3;
    RT.mk.push(new maplibregl.Marker({ element: w, anchor: 'left', offset: [-13, 0] }).setLngLat([RT_ISL[k][4][1], RT_ISL[k][4][0]]).addTo(m));
  });
  rtLines(); rtFit(1100); rtSail();
}
function rtFit(dur = 900) {
  const m = RT.map, R = RT.R; if (!m || !R) return;
  const bb = new maplibregl.LngLatBounds(); R.line.forEach(q => bb.extend([q[1], q[0]]));
  const small = ($('#rtMap') || {}).clientWidth < 600;
  m.fitBounds(bb, { pitch: 0, bearing: 0, padding: small ? { top: 40, bottom: 110, left: 40, right: 120 } : { top: 50, bottom: 96, left: 60, right: 210 }, duration: dur, maxZoom: 12.5 });
}
/* a small boat sails the route on a loop (off for reduced motion) */
function rtSail() {
  cancelAnimationFrame(RT.anim); const m = RT.map, R = RT.R;
  if (!m || !R || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!RT.boat || RT.boat._map !== m) { const e = document.createElement('div'); e.innerHTML = `<div class="rt-boat">${RT_SHIP}</div>`; e.style.zIndex = 1; RT.boat = new maplibregl.Marker({ element: e }).setLngLat([R.pier.ll[1], R.pier.ll[0]]).addTo(m); }
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
  Object.assign(RT, { key: '', map: null, styleOk: false, mk: [], boat: null, R: null, pending: null });
}
function rtMount() {
  const list = $('#bpProgs'); if (!list || $('#rtBox')) return;
  const box = document.createElement('div'); box.className = 'rt pr'; box.id = 'rtBox'; box.setAttribute('hidden', '');
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
    <div class="rt-pbar" id="rtPier" hidden></div>
    <div class="rt-tl" id="rtTl"></div>
    <p class="rt-note">${FXI('info')}${L('เส้นทางและเวลาโดยประมาณ · กัปตันอาจสลับลำดับเกาะตามคลื่นลมในวันจริง', 'Approximate route and times · the captain may change the order for the weather on the day')}</p>`;
  list.after(box);
}
{ const _dpp = drawProgPrices; drawProgPrices = function (b, keep) { _dpp(b, keep); try { const ps = bpProgs(b); rtUpdate(b, ps[detailProgram] || ps[0]); } catch (e) { console.warn('[route]', e); } }; }
{ const _rd2 = renderDetail; renderDetail = function (slug) { rtDrop(); _rd2(slug); try { const b = bySlug(slug); if (!b) return; rtMount(); const ps = bpProgs(b); rtUpdate(b, ps[detailProgram] || ps[0]); } catch (e) { console.warn('[route]', e); } }; }
if ((VH.hash || '').startsWith('#/boat/')) { try { const b = bySlug(decodeURIComponent(VH.hash.slice(7))); if (b) { rtMount(); const ps = bpProgs(b); rtUpdate(b, ps[detailProgram] || ps[0]); } } catch (e) { } }

/* =====================================================================
   Images · pages that are not on screen (the SPA keeps every view in the HTML) must not download:
   the server render parks their <img> sources in data-src, the browser puts them back when the view opens
   ===================================================================== */
const FX_VIEWS = '[id^="view-"]';
function fxSsrDone() { fxFixImgs(); try { fxBrandIcons(); } catch (e) { } fxPark(); }
/* the author logo on articles was a placeholder (data:…LOGON_B64) that never got filled in */
function fxFixImgs(root) { (root || document).querySelectorAll('img[src*="LOGON_B64"]').forEach(im => im.setAttribute('src', (typeof SET !== 'undefined' && SET.logo) || '/brand/logo.png')); }   // called by site-render.ts after the server render
/* run right after anything draws into a hidden view: the browser only starts the download after the current task, so it never starts */
function fxPark() {
  document.querySelectorAll(FX_VIEWS).forEach(v => {
    if (!/(^|\s)hidden(\s|$)/.test(v.getAttribute('class') || '')) return;
    v.querySelectorAll('img[src]').forEach(im => { im.setAttribute('data-src', im.getAttribute('src')); im.removeAttribute('src'); if (im.getAttribute('srcset')) { im.setAttribute('data-srcset', im.getAttribute('srcset')); im.removeAttribute('srcset'); } });
  });
}
function fxWake(root) {
  (root || document).querySelectorAll('img[data-src]').forEach(im => { if (im.closest(FX_VIEWS + '.hidden')) return; im.src = im.dataset.src; im.removeAttribute('data-src'); if (im.dataset.srcset) { im.srcset = im.dataset.srcset; im.removeAttribute('data-srcset'); } });
}
if (!FX_SSR) {
  { const _sv = showView; showView = function (name) { _sv(name); try { fxWake($('#view-' + name)); } catch (e) { } }; }
  fxFixImgs(); fxPark(); fxWake();
  { const _rp = typeof renderPost === 'function' ? renderPost : null; if (_rp) renderPost = function () { const r = _rp.apply(this, arguments); fxFixImgs(); return r; }; }
  // every renderer that can draw into a view that is not on screen
  ['renderAll', 'renderBoats', 'renderHero', 'renderCats', 'renderActs', 'renderRoutes', 'renderRecent', 'renderHomeBlog', 'renderTeam', 'renderTypeBand', 'renderSmartTeaser'].forEach(n => {
    const f = globalThis[n]; if (typeof f !== 'function') return;
    try { globalThis[n] = function () { const r = f.apply(this, arguments); fxPark(); return r; }; } catch (e) { }
  });
}

/* =====================================================================
   Social icons · the real brand marks (Simple Icons, CC0) instead of generic icons:
   WhatsApp was a speech bubble / phone / smartphone, LINE a speech bubble, TikTok a music note.
   Matched by where the link goes (wa.me, lin.ee, facebook…) or its label; runs after every lucide.createIcons()
   ===================================================================== */
const FX_BRAND = {"line": "M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314", "whatsapp": "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z", "facebook": "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z", "instagram": "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077", "youtube": "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z", "tiktok": "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"};
const fxBrandOf = el => {
  const h = (el.getAttribute('href') || '') + ' ' + (el.getAttribute('aria-label') || ''), tx = (el.textContent || '').trim();
  if (/wa\.me|whatsapp/i.test(h) || /^whatsapp/i.test(tx)) return 'whatsapp';
  if (/lin\.ee|line\.me|\bline\b/i.test(h) || /^line\b/i.test(tx)) return 'line';
  if (/facebook/i.test(h)) return 'facebook'; if (/instagram/i.test(h)) return 'instagram'; if (/youtube/i.test(h)) return 'youtube'; if (/tiktok/i.test(h)) return 'tiktok';
  return '';
};
const FX_SWAP = /lucide-(message-circle|message-square|smartphone|phone|facebook|instagram|youtube|music-2|music)\b/;
function fxBrandIcons(root) {
  (root || document).querySelectorAll('svg.lucide').forEach(s => {
    const c = s.getAttribute('class') || ''; if (!FX_SWAP.test(c)) return;
    const host = s.closest('a,button,li'); if (!host) return;
    if (/^tel:/.test(host.getAttribute('href') || '')) return;   // a real phone call keeps the phone
    const k = fxBrandOf(host); if (!k) return;
    const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    n.setAttribute('viewBox', '0 0 24 24'); n.setAttribute('fill', 'currentColor'); n.setAttribute('aria-hidden', 'true');
    ['width', 'height'].forEach(a => s.getAttribute(a) && n.setAttribute(a, s.getAttribute(a)));
    n.setAttribute('class', c.replace(/\blucide(-[\w-]+)?\b/g, '').trim() + ' bi bi-' + k);
    n.innerHTML = `<path d="${FX_BRAND[k]}"/>`;
    s.replaceWith(n);
  });
}
if (typeof lucide !== 'undefined' && lucide.createIcons && !lucide._fxBrand) { const _ci = lucide.createIcons; lucide.createIcons = function () { const r = _ci.apply(this, arguments); try { fxBrandIcons(); } catch (e) { } return r; }; lucide._fxBrand = 1; }

/* =====================================================================
   Privacy policy (PDPA) — written against what the system really collects:
   booking form (customers + leads tables), attribution sent with a lead (btt_attr), IP / browser for spam
   limits, the cookieless page counter (/api/t), browser storage, LINE alerts to sales, optional GA4 / Meta
   (consent), Google Fonts / map tiles, email domain check. Replaces legalDocs().privacy from app.js.
   ===================================================================== */
const PV_UPDATED = ['27 ตุลาคม 2569', '27 October 2026'];
function fxPrivacy() {
  const E = LANG === 'en', T = (th, en) => E ? en : th, ul = a => `<ul>${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const mail = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;
  const table = (head, rows) => `<div class="legal-table"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  return {
    title: T('นโยบายความเป็นส่วนตัว', 'Privacy Policy'),
    intro: T(`${COMPANY} ("บริษัท" หรือ "เรา") ให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ นโยบายนี้อธิบายว่าเราเก็บข้อมูลอะไร เก็บอย่างไร ใช้เพื่ออะไร ส่งต่อให้ใคร เก็บไว้นานแค่ไหน และคุณมีสิทธิอะไรบ้าง เมื่อคุณใช้เว็บไซต์ boattripthailand.com ส่งคำขอจอง หรือติดต่อเราทางโทรศัพท์ LINE WhatsApp หรืออีเมล ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)`,
      `${COMPANY} ("we", "us") cares about your personal data. This policy explains what we collect, how, why, who we share it with, how long we keep it and what your rights are when you use boattripthailand.com, send a booking request or contact us by phone, LINE, WhatsApp or email, under Thailand's Personal Data Protection Act B.E. 2562 (PDPA).`),
    secs: [
      ['controller', T('ผู้ควบคุมข้อมูลส่วนบุคคล', 'Data controller'), `<p>${T(`${COMPANY} ใบอนุญาตประกอบธุรกิจนำเที่ยวเลขที่ ${SET.tat} ที่อยู่ ${ADDRESS_TH} เป็นผู้ควบคุมข้อมูลส่วนบุคคลตามนโยบายนี้ ติดต่อเรื่องข้อมูลส่วนบุคคลได้ที่ ${mail} หรือโทร ${SET.phone} (ทุกวัน 09:00–21:00 น.)`,
        `${COMPANY}, TAT licence ${SET.tat}, ${ADDRESS_EN}, Thailand, is the data controller. For anything about your personal data contact ${mail} or call ${SET.phone} (daily 09:00–21:00 Thai time).`)}</p>`],

      ['collect', T('ข้อมูลที่เราเก็บ', 'Data we collect'),
        `<h3>${T('1. ข้อมูลที่คุณกรอกในฟอร์มขอใบเสนอราคา / จองเรือ', '1. What you enter in the quote / booking form')}</h3>` + ul(E ? [
          '<b>Name</b> and <b>phone number or LINE ID</b> (required).',
          '<b>Email</b> and <b>WhatsApp number</b> (optional).',
          '<b>What you are interested in</b> – boat, program or activity, travel date, time slot, number of adults and children.',
          '<b>Your message</b> – anything you write, e.g. a celebration, pick-up hotel or a food allergy.',
          '<b>Your choice about offers</b> – whether you agreed to receive promotions, and when.',
        ] : [
          '<b>ชื่อ-นามสกุล</b> และ <b>เบอร์โทรหรือ LINE ID</b> (จำเป็น)',
          '<b>อีเมล</b> และ <b>เบอร์ WhatsApp</b> (ไม่บังคับ)',
          '<b>สิ่งที่คุณสนใจ</b> – เรือ โปรแกรมหรือกิจกรรม วันที่เดินทาง รอบเวลา จำนวนผู้ใหญ่และเด็ก',
          '<b>ข้อความของคุณ</b> – สิ่งที่คุณเขียนมา เช่น ฉลองวันเกิด โรงแรมที่ให้ไปรับ หรืออาหารที่แพ้',
          '<b>การเลือกรับข่าวสาร</b> – คุณยินยอมรับข่าวสารโปรโมชั่นหรือไม่ และยินยอมเมื่อใด',
        ])
        + `<h3>${T('2. ข้อมูลที่ได้ระหว่างดูแลการจองของคุณ', '2. What we receive while arranging your trip')}</h3>` + ul(E ? [
          '<b>Conversations</b> with our team by phone, LINE, WhatsApp or email, and notes our team makes about your request.',
          '<b>Passenger details for insurance</b> – names and, where the insurer or authorities require it, passport or ID numbers and nationality.',
          '<b>Payment records</b> – bank transfer slips and references. We never ask for or keep full card numbers; card payments are handled by the bank or payment provider.',
          '<b>Pick-up and service details</b> – hotel, flight or arrival time, and extra services you book.',
        ] : [
          '<b>บทสนทนา</b> กับทีมงานทางโทรศัพท์ LINE WhatsApp หรืออีเมล และบันทึกของทีมงานเกี่ยวกับคำขอของคุณ',
          '<b>ข้อมูลผู้โดยสารเพื่อทำประกันภัย</b> – ชื่อ และเลขพาสปอร์ตหรือบัตรประชาชนและสัญชาติ เมื่อบริษัทประกันหรือหน่วยงานรัฐกำหนด',
          '<b>หลักฐานการชำระเงิน</b> – สลิปโอนเงินและเลขอ้างอิง เราไม่ขอและไม่เก็บเลขบัตรเครดิตเต็ม การชำระด้วยบัตรดำเนินการโดยธนาคารหรือผู้ให้บริการชำระเงิน',
          '<b>ข้อมูลการรับส่งและบริการเสริม</b> – โรงแรม เวลาเดินทางถึง และบริการเสริมที่คุณจอง',
        ])
        + `<h3>${T('3. ข้อมูลที่ระบบบันทึกพร้อมคำขอจองโดยอัตโนมัติ', '3. Recorded automatically with your request')}</h3>` + ul(E ? [
          '<b>IP address and browser / device type</b> – to stop spam and repeated automated requests, and to protect the form.',
          '<b>How you found us</b> – the referring website, landing page, campaign tags (utm_*), ad click IDs (gclid, fbclid), number of visits and pages viewed, and up to 8 boats you looked at. This is kept in your own browser (see section 4) and sent only together with a request you choose to send.',
          '<b>Site language</b> you used, which is also the language our team replies in.',
        ] : [
          '<b>หมายเลข IP และประเภทเบราว์เซอร์ / อุปกรณ์</b> – เพื่อป้องกันสแปมและการส่งฟอร์มซ้ำ ๆ โดยโปรแกรมอัตโนมัติ',
          '<b>ช่องทางที่คุณรู้จักเรา</b> – เว็บไซต์ที่ลิงก์มา หน้าแรกที่เข้า แท็กแคมเปญ (utm_*) รหัสคลิกโฆษณา (gclid, fbclid) จำนวนครั้งที่เข้าเว็บ จำนวนหน้าที่ดู และเรือที่ดูล่าสุดไม่เกิน 8 ลำ ข้อมูลนี้เก็บไว้ในเบราว์เซอร์ของคุณเอง (ดูข้อ 4) และถูกส่งมาพร้อมคำขอจองที่คุณกดส่งเท่านั้น',
          '<b>ภาษาของเว็บไซต์</b> ที่คุณใช้ ซึ่งเป็นภาษาที่ทีมงานใช้ติดต่อกลับ',
        ])
        + `<h3>${T('4. ข้อมูลในเบราว์เซอร์และสถิติการเข้าชม', '4. Browser storage and visit statistics')}</h3>` + ul(E ? [
          '<b>Saved in your browser only</b> – your cookie choices, favourite boats, recently viewed boats and the "how you found us" data above. We cannot read these unless you send a request. Details are on the <a href="#/cookies">Cookie Preferences</a> page.',
          '<b>Visit statistics without cookies</b> – for each page view we count the page, the traffic source, the device type (mobile / desktop) and the language. No cookie, no visitor ID and no IP address is stored for these statistics.',
          '<b>Google Analytics and Meta Pixel</b> – only if you accept analytics or marketing cookies. These services set their own cookies (_ga, _fbp, …).',
        ] : [
          '<b>เก็บในเบราว์เซอร์ของคุณเท่านั้น</b> – การตั้งค่าคุกกี้ เรือที่กดถูกใจ เรือที่ดูล่าสุด และข้อมูลช่องทางที่รู้จักเราตามข้อ 3 เราไม่สามารถอ่านข้อมูลเหล่านี้ได้ เว้นแต่คุณส่งคำขอจอง ดูรายละเอียดที่หน้า <a href="#/cookies">การตั้งค่าคุกกี้</a>',
          '<b>สถิติการเข้าชมแบบไม่ใช้คุกกี้</b> – ต่อการเปิดหน้าหนึ่งครั้ง เรานับเพียงหน้าที่เปิด ช่องทางที่มา ประเภทอุปกรณ์ (มือถือ / คอมพิวเตอร์) และภาษา ไม่มีคุกกี้ ไม่มีรหัสผู้เข้าชม และไม่บันทึกหมายเลข IP',
          '<b>Google Analytics และ Meta Pixel</b> – ทำงานเฉพาะเมื่อคุณยอมรับคุกกี้วิเคราะห์หรือคุกกี้การตลาด บริการเหล่านี้ตั้งคุกกี้ของตัวเอง (เช่น _ga, _fbp)',
        ])],

      ['sensitive', T('ข้อมูลอ่อนไหว', 'Sensitive data'), `<p>${T('เราไม่ขอข้อมูลอ่อนไหว เช่น ข้อมูลสุขภาพ ศาสนา หรือความเชื่อ แต่หากคุณแจ้งเองเพื่อให้เราดูแลทริปได้ถูกต้อง เช่น อาหารที่แพ้ อาการเมาเรือ การตั้งครรภ์ หรือความต้องการด้านการเคลื่อนไหว เราจะใช้ข้อมูลนั้นเพื่อจัดบริการและความปลอดภัยบนเรือเท่านั้น โดยถือว่าคุณให้ความยินยอมโดยชัดแจ้งเมื่อแจ้งข้อมูลนั้นมา และจะส่งต่อเฉพาะกัปตัน ลูกเรือ หรือผู้ให้บริการที่ต้องใช้ข้อมูลนั้น คุณขอให้ลบได้ทุกเมื่อ',
        'We do not ask for sensitive data such as health, religion or beliefs. If you tell us something so we can look after you properly – a food allergy, seasickness, pregnancy or mobility needs – we use it only to arrange the service and keep you safe on board. You give your explicit consent by telling us, we share it only with the captain, crew or provider who needs it, and you can ask us to delete it at any time.')}</p>`],

      ['use', T('วัตถุประสงค์และฐานทางกฎหมาย', 'Why we use your data and on what legal basis'), table(E ? ['Purpose', 'Data used', 'Legal basis'] : ['วัตถุประสงค์', 'ข้อมูลที่ใช้', 'ฐานทางกฎหมาย'], E ? [
        ['Reply to your request, quote prices, check availability and arrange your charter', 'Form data, conversations, booking details', 'Contract (steps before and under a contract)'],
        ['Send your request to our sales team immediately (LINE alert to the team)', 'Name, phone, boat, date, guests', 'Contract'],
        ['Insure passengers and follow maritime, tourism and immigration rules', 'Passenger names, passport / ID numbers', 'Legal obligation'],
        ['Keep accounting and tax records', 'Payment records, booking details', 'Legal obligation'],
        ['Prioritise and follow up requests; know which channels and campaigns bring customers', 'Request details, how you found us, visits, boats viewed', 'Legitimate interest'],
        ['Stop spam and abuse of the booking form', 'IP address, browser type, email domain, links in messages', 'Legitimate interest'],
        ['Improve the website with visit statistics without cookies', 'Page, source, device type, language (no identity)', 'Legitimate interest'],
        ['Google Analytics; measure ads with Meta (Pixel and server-side events)', 'Cookies; for Meta also email and phone in hashed form, IP, browser, ad click ID', 'Consent (cookie settings)'],
        ['Send offers and promotions', 'Name, phone, email, LINE / WhatsApp', 'Consent – withdraw at any time'],
      ] : [
        ['ตอบคำขอ เสนอราคา เช็กคิว และจัดทริปเช่าเรือ', 'ข้อมูลในฟอร์ม บทสนทนา รายละเอียดการจอง', 'ฐานสัญญา (ก่อนและระหว่างทำสัญญา)'],
        ['ส่งคำขอของคุณถึงทีมขายทันที (แจ้งเตือนผ่าน LINE ของทีม)', 'ชื่อ เบอร์โทร เรือ วันที่ จำนวนคน', 'ฐานสัญญา'],
        ['ทำประกันภัยผู้โดยสาร และปฏิบัติตามกฎหมายการเดินเรือ การท่องเที่ยว และคนเข้าเมือง', 'ชื่อผู้โดยสาร เลขพาสปอร์ต / บัตรประชาชน', 'ฐานหน้าที่ตามกฎหมาย'],
        ['จัดทำบัญชีและภาษี', 'หลักฐานการชำระเงิน รายละเอียดการจอง', 'ฐานหน้าที่ตามกฎหมาย'],
        ['จัดลำดับและติดตามคำขอ และดูว่าช่องทาง / แคมเปญใดนำลูกค้ามา', 'รายละเอียดคำขอ ช่องทางที่รู้จักเรา จำนวนครั้งที่เข้าเว็บ เรือที่ดู', 'ฐานประโยชน์โดยชอบด้วยกฎหมาย'],
        ['ป้องกันสแปมและการใช้ฟอร์มจองในทางที่ผิด', 'หมายเลข IP ประเภทเบราว์เซอร์ โดเมนอีเมล ลิงก์ในข้อความ', 'ฐานประโยชน์โดยชอบด้วยกฎหมาย'],
        ['ปรับปรุงเว็บไซต์ด้วยสถิติการเข้าชมแบบไม่ใช้คุกกี้', 'หน้า ช่องทางที่มา ประเภทอุปกรณ์ ภาษา (ไม่ระบุตัวตน)', 'ฐานประโยชน์โดยชอบด้วยกฎหมาย'],
        ['Google Analytics และวัดผลโฆษณากับ Meta (Pixel และการส่งข้อมูลจากเซิร์ฟเวอร์)', 'คุกกี้ และสำหรับ Meta: อีเมลและเบอร์โทรในรูปแบบเข้ารหัสทางเดียว (hash) IP เบราว์เซอร์ รหัสคลิกโฆษณา', 'ฐานความยินยอม (การตั้งค่าคุกกี้)'],
        ['ส่งข่าวสารและโปรโมชั่น', 'ชื่อ เบอร์โทร อีเมล LINE / WhatsApp', 'ฐานความยินยอม ยกเลิกได้ทุกเมื่อ'],
      ]) + `<p>${T('หากคุณไม่ให้ข้อมูลที่จำเป็น (ชื่อและช่องทางติดต่อ) เราจะไม่สามารถติดต่อกลับหรือจัดการจองให้ได้ เราไม่ใช้ข้อมูลของคุณตัดสินใจโดยอัตโนมัติที่มีผลทางกฎหมายต่อคุณ การจัดลำดับคำขอใช้เพื่อให้ทีมงานตอบได้เร็วขึ้นเท่านั้น',
        'If you do not give the required details (a name and a way to reach you) we cannot reply or arrange a booking. We make no automated decisions with legal effect on you; request scoring only helps our team reply sooner.')}</p>`],

      ['share', T('การเปิดเผยข้อมูล', 'Who we share data with'), `<p>${T('เราไม่ขายข้อมูลส่วนบุคคล เราส่งต่อเฉพาะข้อมูลที่จำเป็นให้แก่:', 'We never sell personal data. We share only what is needed with:')}</p>` + ul(E ? [
        '<b>Boat owners, captains and crew</b> operating your charter, and <b>providers of extra services</b> you book (transfers, catering, DJ, guides).',
        '<b>Insurance companies</b> covering passengers.',
        '<b>Banks and payment providers</b>.',
        '<b>Service providers that run our systems</b>, only on our instructions: server and database hosting; LINE (alerts to our sales team and LINE Official Account chats); WhatsApp / Meta when you chat with us there; email providers.',
        '<b>Google and Meta</b> for analytics and ad measurement – <b>only with your consent</b>.',
        '<b>Services that load parts of the page</b> and therefore see your IP address and browser: Google Fonts (typefaces) and CARTO / Esri (map tiles on boat pages).',
        '<b>Authorities</b> such as the Marine Department, Tourism Department, police or courts when the law requires it.',
      ] : [
        '<b>เจ้าของเรือ กัปตัน และลูกเรือ</b> ที่ให้บริการทริปของคุณ และ <b>ผู้ให้บริการเสริม</b> ที่คุณจอง (รถรับส่ง อาหาร ดีเจ ไกด์)',
        '<b>บริษัทประกันภัย</b> ที่คุ้มครองผู้โดยสาร',
        '<b>ธนาคารและผู้ให้บริการชำระเงิน</b>',
        '<b>ผู้ให้บริการระบบของเรา</b> ซึ่งทำงานตามคำสั่งของเราเท่านั้น: ผู้ให้บริการเซิร์ฟเวอร์และฐานข้อมูล, LINE (แจ้งเตือนทีมขายและแชท LINE Official Account), WhatsApp / Meta เมื่อคุณแชทกับเราผ่านช่องทางนั้น, ผู้ให้บริการอีเมล',
        '<b>Google และ Meta</b> เพื่อการวิเคราะห์และวัดผลโฆษณา – <b>เฉพาะเมื่อคุณให้ความยินยอม</b>',
        '<b>บริการที่โหลดส่วนประกอบของหน้าเว็บ</b> ซึ่งจะเห็นหมายเลข IP และเบราว์เซอร์ของคุณ: Google Fonts (ตัวอักษร) และ CARTO / Esri (ภาพแผนที่ในหน้าเรือ)',
        '<b>หน่วยงานรัฐ</b> เช่น กรมเจ้าท่า กรมการท่องเที่ยว ตำรวจ หรือศาล เมื่อกฎหมายกำหนด',
      ]) + `<p>${T('ระบบแปลภาษาอัตโนมัติของเว็บไซต์ใช้กับเนื้อหาบทความและข้อมูลเรือเท่านั้น ไม่มีการส่งข้อมูลส่วนบุคคลของลูกค้า', 'The automatic translation used on this website handles articles and boat information only; no customer data is sent to it.')}</p>`],

      ['transfer', T('การส่งข้อมูลไปต่างประเทศ', 'International transfers'), `<p>${T('ผู้ให้บริการบางราย เช่น LINE, Meta (WhatsApp, Facebook), Google, CARTO และ Esri อาจเก็บหรือประมวลผลข้อมูลนอกประเทศไทย เราใช้ผู้ให้บริการที่มีมาตรฐานการคุ้มครองข้อมูลที่เหมาะสม และส่งข้อมูลตามเงื่อนไขของมาตรา 28 และ 29 แห่ง PDPA เช่น เพื่อปฏิบัติตามสัญญากับคุณ ด้วยความยินยอมของคุณ หรือภายใต้ข้อกำหนดคุ้มครองข้อมูลของผู้ให้บริการ',
        'Some providers, such as LINE, Meta (WhatsApp, Facebook), Google, CARTO and Esri, may store or process data outside Thailand. We use providers with appropriate data protection standards and transfer data under sections 28 and 29 of the PDPA – to perform our contract with you, with your consent, or under the provider\'s data protection terms.')}</p>`],

      ['retention', T('ระยะเวลาเก็บข้อมูล', 'How long we keep data'), table(E ? ['Data', 'How long'] : ['ข้อมูล', 'ระยะเวลา'], E ? [
        ['Requests that did not become a booking', '2 years after our last contact with you'],
        ['Bookings, payment and accounting records', '5 years after the trip (accounting and tax law)'],
        ['Passenger passport / ID numbers', 'Until the insurance and legal needs of the trip end, then deleted'],
        ['Consent to offers', 'Until you withdraw it'],
        ['IP address and browser type sent with a request', 'Kept with that request, for the same period'],
        ['Visit statistics without cookies', 'No personal data – kept as totals'],
        ['Data in your browser', 'Until you clear it, or for the period shown on the Cookie Preferences page'],
      ] : [
        ['คำขอที่ไม่ได้เกิดการจอง', '2 ปีนับจากการติดต่อครั้งล่าสุด'],
        ['ข้อมูลการจอง หลักฐานการชำระเงิน และเอกสารบัญชี', '5 ปีนับจากวันเดินทาง (ตามกฎหมายบัญชีและภาษี)'],
        ['เลขพาสปอร์ต / บัตรประชาชนของผู้โดยสาร', 'จนสิ้นสุดความจำเป็นด้านประกันภัยและกฎหมายของทริปนั้น แล้วลบ'],
        ['ความยินยอมรับข่าวสาร', 'จนกว่าคุณจะถอนความยินยอม'],
        ['หมายเลข IP และประเภทเบราว์เซอร์ที่ส่งมาพร้อมคำขอ', 'เก็บร่วมกับคำขอนั้นตามระยะเวลาเดียวกัน'],
        ['สถิติการเข้าชมแบบไม่ใช้คุกกี้', 'ไม่มีข้อมูลส่วนบุคคล เก็บเป็นยอดรวม'],
        ['ข้อมูลในเบราว์เซอร์ของคุณ', 'จนกว่าคุณจะลบ หรือตามระยะเวลาในหน้าการตั้งค่าคุกกี้'],
      ]) + `<p>${T('เมื่อพ้นระยะเวลา เราจะลบหรือทำให้ข้อมูลไม่สามารถระบุตัวตนได้ เว้นแต่ต้องเก็บไว้เพื่อการใช้สิทธิเรียกร้องตามกฎหมาย', 'After these periods we delete or anonymise the data, unless we need it to establish or defend legal claims.')}</p>`],

      ['rights', T('สิทธิของคุณ', 'Your rights'), ul(E ? [
        '<b>Access</b> your data and get a copy, and ask how we obtained it.',
        '<b>Correct</b> data that is wrong or incomplete.',
        '<b>Delete</b> or anonymise your data.',
        '<b>Restrict</b> or <b>object</b> to processing, including processing based on legitimate interest and direct marketing.',
        '<b>Data portability</b> – receive your data in a common format or have it sent to someone else.',
        '<b>Withdraw consent</b> at any time – for offers, tell us or reply "stop"; for cookies, change the Cookie Preferences page. Withdrawing does not affect what was done before.',
        '<b>Complain</b> to the Office of the Personal Data Protection Committee (PDPC).',
      ] : [
        '<b>ขอเข้าถึง</b>และขอรับสำเนาข้อมูล รวมถึงขอทราบว่าเราได้ข้อมูลมาอย่างไร',
        '<b>ขอแก้ไข</b>ข้อมูลที่ไม่ถูกต้องหรือไม่ครบถ้วน',
        '<b>ขอลบ</b>หรือทำให้ข้อมูลไม่สามารถระบุตัวตนได้',
        '<b>ขอระงับ</b>หรือ<b>คัดค้าน</b>การใช้ข้อมูล รวมถึงการใช้ตามฐานประโยชน์โดยชอบด้วยกฎหมายและการตลาดแบบตรง',
        '<b>ขอรับหรือขอให้โอนข้อมูล</b>ในรูปแบบที่ใช้กันทั่วไป',
        '<b>ถอนความยินยอม</b>ได้ทุกเมื่อ – สำหรับข่าวสาร แจ้งเราหรือตอบกลับว่า "ยกเลิก" สำหรับคุกกี้ เปลี่ยนได้ที่หน้าการตั้งค่าคุกกี้ การถอนความยินยอมไม่กระทบสิ่งที่ทำไปก่อนหน้า',
        '<b>ร้องเรียน</b>ต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)',
      ]) + `<p>${T(`ส่งคำขอได้ที่ ${mail} หรือทาง LINE / โทรศัพท์ เราอาจขอข้อมูลเพื่อยืนยันตัวตนก่อนดำเนินการ และจะตอบภายใน 30 วันโดยไม่มีค่าใช้จ่าย หากเราปฏิเสธคำขอตามที่กฎหมายอนุญาต เราจะแจ้งเหตุผลให้ทราบ`,
        `Send requests to ${mail}, or via LINE or phone. We may ask you to confirm your identity first, and we reply within 30 days free of charge. If the law lets us refuse a request, we will tell you why.`)}</p>`],

      ['security', T('ความปลอดภัยของข้อมูล', 'Security'), ul(E ? [
        'All connections to the website are encrypted (HTTPS).',
        'Only staff who need it can see customer data. Passwords are stored hashed, administrator accounts must use two-step verification, and sign-ins and changes to data are logged.',
        'The booking form is protected against spam and automated attacks (rate limits, link and email checks).',
        'We choose providers with recognised security standards.',
      ] : [
        'การเชื่อมต่อกับเว็บไซต์ทั้งหมดเข้ารหัสด้วย HTTPS',
        'เฉพาะพนักงานที่จำเป็นเท่านั้นที่เข้าถึงข้อมูลลูกค้าได้ รหัสผ่านถูกเก็บแบบเข้ารหัสทางเดียว บัญชีผู้ดูแลระบบต้องยืนยันตัวตนสองขั้นตอน และมีการบันทึกการเข้าระบบและการแก้ไขข้อมูล',
        'ฟอร์มจองมีระบบป้องกันสแปมและการโจมตีอัตโนมัติ (จำกัดจำนวนครั้ง ตรวจลิงก์และอีเมล)',
        'เราเลือกผู้ให้บริการที่มีมาตรฐานความปลอดภัยเป็นที่ยอมรับ',
      ]) + `<p>${T('หากเกิดเหตุละเมิดข้อมูลส่วนบุคคล เราจะแจ้ง สคส. ภายใน 72 ชั่วโมงนับจากทราบเหตุ และแจ้งคุณโดยไม่ชักช้าหากมีความเสี่ยงสูงต่อสิทธิของคุณ ตามที่กฎหมายกำหนด',
        'If a personal data breach happens, we notify the PDPC within 72 hours of becoming aware of it, and tell you without delay if it is likely to put your rights at high risk, as the law requires.')}</p>`],

      ['children', T('ข้อมูลของผู้เยาว์', 'Children'), `<p>${T('การส่งคำขอจองต้องทำโดยผู้ที่บรรลุนิติภาวะ (อายุ 20 ปีขึ้นไป) ข้อมูลของเด็กที่ร่วมทริปจะได้รับจากผู้ปกครอง และใช้เพื่อการทำประกันภัยและความปลอดภัยบนเรือเท่านั้น',
        'Booking requests must be made by adults (20 or older under Thai law). Details of children on board come from their parent or guardian and are used only for insurance and safety.')}</p>`],

      ['cookies', T('คุกกี้และข้อมูลในเบราว์เซอร์', 'Cookies and browser storage'), `<p>${T('รายการคุกกี้และข้อมูลที่เว็บไซต์เก็บในเบราว์เซอร์ พร้อมระยะเวลา อยู่ที่หน้า <a href="#/cookies">การตั้งค่าคุกกี้</a> ซึ่งคุณเลือกเปิดหรือปิดคุกกี้วิเคราะห์และคุกกี้การตลาดได้ทุกเมื่อ',
        'The full list of cookies and browser storage, with how long each is kept, is on the <a href="#/cookies">Cookie Preferences</a> page, where you can switch analytics and marketing cookies on or off at any time.')}</p>`],

      ['changes', T('การเปลี่ยนแปลงนโยบาย', 'Changes to this policy'), `<p>${T('เราอาจปรับปรุงนโยบายนี้เมื่อระบบหรือกฎหมายเปลี่ยน ฉบับล่าสุดจะแสดงในหน้านี้พร้อมวันที่ปรับปรุง หากเปลี่ยนแปลงสาระสำคัญ เราจะแจ้งบนเว็บไซต์ และขอความยินยอมใหม่เมื่อกฎหมายกำหนด',
        'We may update this policy when our systems or the law change. The latest version is always on this page with its date. For important changes we will tell you on the website and ask for consent again where the law requires.')}</p>`],
    ],
  };
}
{ const _ld = legalDocs; legalDocs = function () { const d = _ld(); try { d.privacy = fxPrivacy(); } catch (e) { console.warn('[privacy]', e); } return d; }; }
/* cookies page: the real list of what the site stores; the updated date on both pages */
const FX_STORE_ROWS = () => [
  ['btt.cookies', L('จำเป็น', 'Necessary'), L('การเลือกคุกกี้ของคุณ', 'Your cookie choices'), L('จนกว่าคุณจะลบ', 'Until you clear it')],
  ['btt_admin', L('จำเป็น', 'Necessary'), L('การเข้าสู่ระบบของพนักงาน (เฉพาะทีมงาน)', 'Staff sign-in (team only)'), L('จนออกจากระบบ / หมดอายุ', 'Until sign-out / expiry')],
  ['btt_src · btt_v', L('จำเป็น', 'Necessary'), L('ช่องทางที่มาของการเข้าชมครั้งนี้ สำหรับสถิติแบบไม่ใช้คุกกี้', 'Traffic source of this visit, for cookieless statistics'), L('จนปิดเบราว์เซอร์', 'Until the browser closes')],
  ['btt.fav · btt.recent', L('การใช้งาน', 'Functional'), L('เรือที่กดถูกใจ และเรือที่ดูล่าสุด', 'Favourite and recently viewed boats'), L('จนกว่าคุณจะลบ', 'Until you clear it')],
  ['btt_attr', L('การใช้งาน', 'Functional'), L('ช่องทางที่รู้จักเรา จำนวนครั้งที่เข้า และเรือที่ดู ส่งมาพร้อมคำขอจองเท่านั้น', 'How you found us, visits and boats viewed – sent only with a booking request'), L('จนกว่าคุณจะลบ', 'Until you clear it')],
  ['_ga · _ga_*', L('วิเคราะห์', 'Analytics'), 'Google Analytics', L('สูงสุด 2 ปี', 'Up to 2 years')],
  ['_fbp · _gcl_au', L('การตลาด', 'Marketing'), 'Meta Pixel · Google Ads', L('3 เดือน', '3 months')],
];
function fxLegalFix(kind) {
  const v = $('#view-legal'); if (!v) return;
  if (kind === 'privacy' || kind === 'cookies') v.querySelectorAll('section p.text-xs').forEach(p => { if (/ปรับปรุงล่าสุด|Last updated/.test(p.textContent)) p.textContent = `${L('ปรับปรุงล่าสุด', 'Last updated')}: ${PV_UPDATED[LANG === 'en' ? 1 : 0]}`; });
  if (kind === 'cookies') {
    const tb = v.querySelector('.legal-table table'); if (!tb) return;
    tb.querySelector('thead').innerHTML = `<tr><th>${L('ชื่อ', 'Name')}</th><th>${L('ประเภท', 'Type')}</th><th>${L('ใช้ทำอะไร', 'What it does')}</th><th>${L('ระยะเวลา', 'Duration')}</th></tr>`;
    tb.querySelector('tbody').innerHTML = FX_STORE_ROWS().map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
  }
}
{ const _rl = renderLegal; renderLegal = function (kind) { _rl(kind); try { fxLegalFix(kind); } catch (e) { } }; }
{ const h = VH.hash || ''; const m = h.match(/^#\/(privacy|terms|cookies)$/); if (m) { try { renderLegal(m[1]); } catch (e) { } } }

/* =====================================================================
   Terms & Conditions — detailed, built from the boat brochures in the system (notes, remarks, not included)
   and how the website works (request → written confirmation, per-boat prices, seasons, USD on the EN site).
   Keeps the company's own commercial rules (deposit, balance, card fees, cancellation fees, bank account).
   Replaces legalDocs().terms from app.js.
   ===================================================================== */
const TM_UPDATED = ['27 ตุลาคม 2569', '27 October 2026'];
function fxTerms() {
  const E = LANG === 'en', T = (th, en) => E ? en : th, ul = a => `<ul>${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const mail = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`, pv = `<a href="#/privacy">${T('นโยบายความเป็นส่วนตัว', 'Privacy Policy')}</a>`;
  const table = (head, rows) => `<div class="legal-table"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  return {
    title: T('ข้อกำหนดและเงื่อนไข', 'Terms & Conditions'),
    intro: T(`ข้อกำหนดนี้ใช้กับการเช่าเรือ ทัวร์ กิจกรรม และบริการทั้งหมดที่จองกับ ${COMPANY} ("บริษัท" หรือ "เรา") ผ่านเว็บไซต์ boattripthailand.com โทรศัพท์ LINE WhatsApp หรืออีเมล กรุณาอ่านก่อนชำระเงิน การชำระมัดจำถือว่าคุณ ("ลูกค้า") และผู้โดยสารทุกคนในการจองได้อ่านและยอมรับข้อกำหนดนี้แล้ว เงื่อนไขเฉพาะของเรือแต่ละลำที่แสดงในหน้าเรือและในใบยืนยันการจองถือเป็นส่วนหนึ่งของข้อกำหนดนี้`,
      `These terms apply to every boat charter, tour, activity and service booked with ${COMPANY} ("we", "us") through boattripthailand.com, by phone, LINE, WhatsApp or email. Please read them before paying. Paying a deposit means you (the "customer") and every passenger in the booking have read and accepted them. The specific conditions of each boat shown on its page and in your booking confirmation form part of these terms.`),
    secs: [
      ['about', T('เกี่ยวกับบริษัทและบริการ', 'About us and our service'), `<p>${T(`${COMPANY} เป็นบริษัทนำเที่ยวที่ได้รับอนุญาต ใบอนุญาตเลขที่ ${SET.tat} เราจัดหาและประสานงานการเช่าเรือแบบเหมาลำพร้อมกัปตันและลูกเรือ เรือแต่ละลำดำเนินการโดยเจ้าของเรือหรือผู้ประกอบการเรือที่เป็นพันธมิตรของเรา ซึ่งรับผิดชอบการเดินเรือ ลูกเรือ และมาตรฐานความปลอดภัยของเรือตามกฎหมาย`,
        `${COMPANY} is a licensed tour operator (TAT licence ${SET.tat}). We arrange and coordinate private charters with captain and crew. Each boat is operated by its owner or a partner boat operator, who is responsible for navigation, crew and the boat's legal safety standards.`)}</p>`],

      ['booking', T('การขอใบเสนอราคาและการยืนยันการจอง', 'Requests and booking confirmation'), ul(E ? [
        'Sending a request through the website, LINE, WhatsApp or by phone is <b>not yet a booking</b> and costs nothing. Our team first checks the boat\'s availability for your date.',
        'A booking is confirmed only when <b>(1)</b> we confirm the boat, program, date, time and price in writing (LINE, WhatsApp or email) with a booking reference, and <b>(2)</b> we receive the deposit.',
        'Please check the confirmation carefully – boat, program, date, departure time and marina, number of guests and extras – and tell us at once if anything is wrong.',
        'The customer who books must be 20 or older and is responsible for passing these terms to every passenger.',
        'Until the deposit is received the boat is not held for you, and the date may be booked by someone else.',
      ] : [
        'การส่งคำขอผ่านเว็บไซต์ LINE WhatsApp หรือโทรศัพท์ <b>ยังไม่ถือเป็นการจอง</b> และไม่มีค่าใช้จ่าย ทีมงานจะตรวจสอบคิวเรือในวันที่คุณต้องการก่อน',
        'การจองจะสมบูรณ์เมื่อ <b>(1)</b> เรายืนยันเรือ โปรแกรม วันที่ เวลา และราคาเป็นลายลักษณ์อักษร (LINE WhatsApp หรืออีเมล) พร้อมเลขอ้างอิงการจอง และ <b>(2)</b> ได้รับเงินมัดจำแล้ว',
        'กรุณาตรวจสอบใบยืนยัน ได้แก่ เรือ โปรแกรม วันที่ เวลาและท่าเรือที่ออก จำนวนผู้โดยสาร และบริการเสริม หากมีข้อผิดพลาดให้แจ้งเราทันที',
        'ผู้ทำการจองต้องมีอายุ 20 ปีขึ้นไป และมีหน้าที่แจ้งข้อกำหนดนี้แก่ผู้โดยสารทุกคน',
        'ก่อนได้รับเงินมัดจำ เรือยังไม่ถูกกันไว้ให้คุณ และวันนั้นอาจถูกจองโดยลูกค้ารายอื่นได้',
      ])],

      ['prices', T('ราคา', 'Prices'), ul(E ? [
        'Prices are <b>per boat (whole charter)</b>, not per person, and include <b>7% VAT</b>, as published in each boat\'s current brochure.',
        'Each boat has a <b>base number of guests</b> included in the price. Guests above it pay an <b>extra-guest fee per person</b> shown on the boat page; on many boats children above 4 years count as guests. The number of guests can never exceed the boat\'s legal maximum.',
        'Prices depend on the <b>season</b> of your travel date (e.g. Low, High, Peak), and some boats add a <b>holiday surcharge</b> on special dates such as New Year, Chinese New Year, Songkran and other holidays shown on the boat page.',
        'Prices on the <b>English site are shown in US dollars as an estimate</b>. The price in Thai baht in your confirmation is the one you pay.',
        'Prices shown on the website are for reference and may change before a booking is confirmed. The price in your written confirmation is final. If an obvious error is found in a price on the website, we will tell you before confirming.',
      ] : [
        'ราคาเป็น<b>ราคาเหมาลำทั้งลำ</b> ไม่ใช่ราคาต่อคน และ<b>รวม VAT 7%</b> ตามโบรชัวร์ปัจจุบันของเรือแต่ละลำ',
        'เรือแต่ละลำมี<b>จำนวนผู้โดยสารพื้นฐาน</b>ที่รวมอยู่ในราคา ผู้โดยสารที่เกินจะมี<b>ค่าผู้โดยสารเพิ่มต่อคน</b>ตามที่แสดงในหน้าเรือ เรือหลายลำนับเด็กอายุมากกว่า 4 ปีเป็นผู้โดยสาร และจำนวนผู้โดยสารต้องไม่เกินจำนวนสูงสุดที่เรือรับได้ตามกฎหมาย',
        'ราคาขึ้นอยู่กับ<b>ฤดูกาล</b>ของวันที่เดินทาง (เช่น Low, High, Peak) และเรือบางลำมี<b>ค่าบริการเพิ่มช่วงเทศกาล</b> เช่น ปีใหม่ ตรุษจีน สงกรานต์ และวันหยุดอื่นตามที่แสดงในหน้าเรือ',
        'ราคาบน<b>เว็บไซต์ภาษาอังกฤษแสดงเป็นดอลลาร์สหรัฐโดยประมาณ</b> ราคาเงินบาทในใบยืนยันการจองคือราคาที่ต้องชำระ',
        'ราคาบนเว็บไซต์เป็นราคาอ้างอิงและอาจเปลี่ยนแปลงได้ก่อนการยืนยันการจอง ราคาในใบยืนยันเป็นลายลักษณ์อักษรถือเป็นราคาสุดท้าย หากพบความผิดพลาดของราคาบนเว็บไซต์อย่างชัดแจ้ง เราจะแจ้งให้ทราบก่อนยืนยัน',
      ])],

      ['included', T('สิ่งที่รวมและไม่รวมในราคา', 'What is and is not included'), `<p>${T('สิ่งที่รวมในราคาแตกต่างกันตามเรือและโปรแกรม ดูรายละเอียดได้ในหน้าเรือแต่ละลำ (หัวข้อ "รวม / ไม่รวม") โดยทั่วไป<b>ไม่รวม</b>รายการต่อไปนี้ เว้นแต่ระบุไว้ในใบยืนยัน:',
        'What is included differs by boat and program – see the "Included" section on each boat page. Unless your confirmation says otherwise, the following are generally <b>not included</b>:')}</p>` + ul(E ? [
        '<b>National park and island entry fees</b> – paid on the day at the actual rate.',
        '<b>Land transfers</b> and taxis to and from the marina.',
        '<b>Food</b> on boats where it is not listed as included (meals can be pre-ordered at the price on the boat page); <b>lunch on half-day programs</b> on many boats.',
        '<b>Longtail boats for landing on an island</b>, the island tractor on Racha Island, beach chairs at Coral Island and other activity fees on the islands.',
        'Tour guide, crew gratuity, alcoholic drinks, water toys (slider, pool, fishing rods) and other personal expenses unless listed.',
        '<b>Relocation fuel surcharge</b> when you ask to board or land at a different marina from the boat\'s home marina.',
      ] : [
        '<b>ค่าอุทยานแห่งชาติและค่าขึ้นเกาะ</b> ชำระตามจริงในวันเดินทาง',
        '<b>รถรับส่ง</b>และค่าแท็กซี่ไป-กลับท่าเรือ',
        '<b>อาหาร</b> สำหรับเรือที่ไม่ได้ระบุว่ารวม (สั่งล่วงหน้าได้ตามราคาในหน้าเรือ) และ<b>อาหารกลางวันสำหรับโปรแกรมครึ่งวัน</b>ของเรือหลายลำ',
        '<b>ค่าเรือหางยาวสำหรับขึ้นเกาะ</b> ค่ารถอีแต๋นบนเกาะราชา ค่าเก้าอี้ชายหาดที่เกาะเฮ และค่ากิจกรรมอื่นบนเกาะ',
        'ไกด์ ทิปลูกเรือ เครื่องดื่มแอลกอฮอล์ อุปกรณ์เล่นน้ำ (สไลเดอร์ สระลอยน้ำ คันเบ็ด) และค่าใช้จ่ายส่วนตัวอื่น เว้นแต่ระบุไว้',
        '<b>ค่าน้ำมันย้ายท่า</b> หากคุณขอขึ้นหรือลงเรือที่ท่าอื่นนอกจากท่าประจำของเรือ',
      ]) + `<p>${T('การนำอาหารและเครื่องดื่มขึ้นเรือ: เรือบางลำอนุญาตโดยไม่มีค่าใช้จ่าย บางลำมีค่าบริการ (รวมถึงการใช้เตาบาร์บีคิว) กรุณาสอบถามก่อนเดินทาง',
        'Bringing your own food and drinks: some boats allow it free of charge, others charge a fee (including for using a BBQ grill). Please ask before your trip.')}</p>`],

      ['payment', T('การชำระเงิน', 'Payment'), ul(E ? [
        '<b>50% deposit</b> when the booking is confirmed; the <b>remaining 50%</b> at least <b>24 hours before departure</b>. For bookings made less than 24 hours before departure, the full amount is due on confirmation.',
        'Payment is in <b>Thai baht</b> by bank transfer or card. Card payments carry a fee of <b>3.5% for Visa / MasterCard</b> and <b>4.76% for AMEX and UnionPay</b>, plus 7% VAT on the fee.',
        'Please put your booking reference on the transfer and send us the slip. Bank charges and exchange differences for transfers from abroad are paid by the customer.',
        'If the balance is not paid on time, we may treat the booking as cancelled by the customer, with the cancellation fees in section 7.',
        'Extra services and extra guests added after confirmation are paid with the balance, or on the day where agreed.',
      ] : [
        '<b>ชำระมัดจำ 50%</b> เมื่อยืนยันการจอง และ<b>ส่วนที่เหลือ 50%</b> ก่อนออกเรือ<b>อย่างน้อย 24 ชั่วโมง</b> หากจองน้อยกว่า 24 ชั่วโมงก่อนออกเรือ ต้องชำระเต็มจำนวนเมื่อยืนยัน',
        'ชำระเป็น<b>เงินบาท</b>ด้วยการโอนเงินหรือบัตร การชำระด้วยบัตรมีค่าธรรมเนียม <b>3.5% สำหรับ Visa / MasterCard</b> และ <b>4.76% สำหรับ AMEX และ UnionPay</b> บวก VAT 7% ของค่าธรรมเนียม',
        'กรุณาระบุเลขอ้างอิงการจองเมื่อโอนเงิน และส่งสลิปให้เรา ค่าธรรมเนียมธนาคารและส่วนต่างอัตราแลกเปลี่ยนสำหรับการโอนจากต่างประเทศเป็นของลูกค้า',
        'หากไม่ชำระส่วนที่เหลือตามกำหนด เราอาจถือว่าลูกค้ายกเลิกการจอง และคิดค่ายกเลิกตามข้อ 7',
        'บริการเสริมและผู้โดยสารที่เพิ่มหลังยืนยันการจอง ชำระพร้อมยอดคงเหลือ หรือในวันเดินทางตามที่ตกลง',
      ]) + `<dl class="legal-dl"><dt>${T('ธนาคาร', 'Bank')}</dt><dd>KASIKORN BANK · Lotus's Phuket</dd><dt>${T('เลขที่บัญชี', 'Account no.')}</dt><dd>213-1-65737-7</dd><dt>${T('ชื่อบัญชี', 'Account name')}</dt><dd>${COMPANY}</dd></dl>`
        + `<p>${T('โปรดโอนเงินเข้าบัญชีบริษัทข้างต้นเท่านั้น เราจะไม่ขอให้โอนเข้าบัญชีบุคคล หากมีผู้แจ้งเลขบัญชีอื่นในนามบริษัท กรุณาโทรยืนยันกับเราที่ ' + SET.phone + ' ก่อน',
          'Only pay into the company account above. We never ask for payment to a personal account; if anyone gives you different bank details in our name, call us on ' + SET.phone + ' first.')}</p>`],

      ['changes', T('การเปลี่ยนแปลงการจองโดยลูกค้า', 'Changes by the customer'), ul(E ? [
        'Ask for changes (date, program, number of guests, extras) as early as possible, in writing. Changes depend on the boat\'s availability and may change the price.',
        'Adding guests is possible up to the boat\'s maximum, with the extra-guest fee. Fewer guests than booked does not reduce the charter price, which is per boat.',
        'Moving to a different date is treated as a new booking for the new date, subject to availability; the deposit already paid is moved to it when we confirm the change in writing.',
      ] : [
        'แจ้งขอเปลี่ยนแปลง (วันที่ โปรแกรม จำนวนผู้โดยสาร บริการเสริม) ให้เร็วที่สุดเป็นลายลักษณ์อักษร การเปลี่ยนแปลงขึ้นอยู่กับคิวเรือและอาจทำให้ราคาเปลี่ยน',
        'เพิ่มผู้โดยสารได้ไม่เกินจำนวนสูงสุดของเรือ โดยชำระค่าผู้โดยสารเพิ่ม การมาน้อยกว่าที่จองไม่ทำให้ราคาเช่าเรือลดลง เพราะเป็นราคาเหมาลำ',
        'การเลื่อนไปวันอื่นถือเป็นการจองใหม่สำหรับวันนั้นตามคิวเรือว่าง และเงินมัดจำที่ชำระแล้วจะโอนไปใช้กับวันใหม่เมื่อเรายืนยันการเปลี่ยนแปลงเป็นลายลักษณ์อักษร',
      ])],

      ['cancellation', T('การยกเลิกโดยลูกค้า', 'Cancellation by the customer'), `<p>${T('แจ้งยกเลิกเป็นลายลักษณ์อักษรทาง LINE WhatsApp หรืออีเมล เวลาที่เราได้รับข้อความถือเป็นเวลายกเลิก ค่ายกเลิกคิดจากราคาเช่าเรือทั้งหมด:',
        'Cancel in writing by LINE, WhatsApp or email; the time we receive your message is the cancellation time. Fees are a percentage of the total charter price:')}</p>`
        + table(E ? ['Cancelled before departure', 'Cancellation fee'] : ['ยกเลิกก่อนออกเรือ', 'ค่ายกเลิก'], E ? [['48 hours or more', 'No fee'], ['Less than 48 hours', '30%'], ['Less than 24 hours', '50%'], ['Less than 12 hours, or no-show', '100% – the deposit is not refunded']] : [['48 ชั่วโมงขึ้นไป', 'ไม่มีค่ายกเลิก'], ['น้อยกว่า 48 ชั่วโมง', '30%'], ['น้อยกว่า 24 ชั่วโมง', '50%'], ['น้อยกว่า 12 ชั่วโมง หรือไม่มาตามนัด', '100% – ไม่คืนเงินมัดจำ']])
        + ul(E ? [
          'Amounts already paid above the cancellation fee are refunded to the account or card used, within 14 working days. Card and bank fees already charged are not refunded.',
          'Extras ordered from third parties (cakes, flowers, DJ, decoration…) that have already been prepared may be charged at cost.',
          'Arriving late does not extend the trip: the program ends at the time in your confirmation.',
        ] : [
          'เงินที่ชำระแล้วส่วนที่เกินค่ายกเลิก จะคืนเข้าบัญชีหรือบัตรที่ใช้ชำระภายใน 14 วันทำการ ค่าธรรมเนียมบัตรและธนาคารที่เกิดขึ้นแล้วไม่คืน',
          'บริการเสริมที่สั่งจากผู้ให้บริการภายนอกและจัดเตรียมแล้ว (เค้ก ดอกไม้ ดีเจ ของตกแต่ง ฯลฯ) อาจคิดตามต้นทุนจริง',
          'การมาสายไม่ทำให้เวลาทริปขยายออก โปรแกรมจะสิ้นสุดตามเวลาในใบยืนยันการจอง',
        ])],

      ['weather', T('สภาพอากาศ ความปลอดภัย และการยกเลิกโดยบริษัท', 'Weather, safety and cancellation by us'), ul(E ? [
        'The company and the captain may <b>change, shorten or cancel the itinerary without notice</b> because of weather, sea conditions, national park closures, orders from authorities or any safety reason. The captain\'s decision on safety is final.',
        'Changing the route or islands for these reasons is not a cancellation and is not refunded, as long as the trip goes ahead.',
        'If the trip cannot go ahead because of weather, safety, a boat breakdown or an order from the authorities, we offer first <b>a new date</b> or <b>a comparable boat or route</b>. If none suits you, we refund the amount you paid for the trip, less third-party costs already incurred that cannot be recovered.',
        'National parks can close some areas for a period (for example Maya Bay at times). Programs to a closed area are changed to an open route.',
      ] : [
        'บริษัทและกัปตันสงวนสิทธิ์<b>เปลี่ยน ย่น หรือยกเลิกเส้นทางโดยไม่ต้องแจ้งล่วงหน้า</b> ตามสภาพอากาศ คลื่นลม การปิดอุทยาน คำสั่งของหน่วยงานรัฐ หรือเหตุผลด้านความปลอดภัย การตัดสินใจของกัปตันเรื่องความปลอดภัยถือเป็นที่สุด',
        'การเปลี่ยนเส้นทางหรือเกาะด้วยเหตุผลข้างต้นไม่ถือเป็นการยกเลิก และไม่มีการคืนเงิน หากทริปยังออกเดินทางได้',
        'หากทริปออกเดินทางไม่ได้เพราะสภาพอากาศ ความปลอดภัย เรือขัดข้อง หรือคำสั่งหน่วยงานรัฐ เราจะเสนอ<b>วันใหม่</b> หรือ<b>เรือ / เส้นทางที่ใกล้เคียงกัน</b>ก่อน หากไม่สะดวกทั้งหมด เราคืนเงินค่าทริปที่ชำระแล้ว หักค่าใช้จ่ายของผู้ให้บริการภายนอกที่เกิดขึ้นแล้วและเรียกคืนไม่ได้',
        'อุทยานอาจปิดบางพื้นที่เป็นช่วง ๆ (เช่น อ่าวมาหยาในบางช่วง) โปรแกรมที่ไปพื้นที่ที่ปิดจะเปลี่ยนเป็นเส้นทางที่เปิด',
      ])],

      ['day', T('วันเดินทาง', 'On the day'), ul(E ? [
        'Arrive at the marina <b>15–20 minutes before departure</b>. We send the meeting point and the crew contact before the trip.',
        'The boat returns at the time in your confirmation. Extra hours or an extra destination can be added on board only if the captain agrees and the schedule allows, at the rate on the boat page (some boats have a maximum time on the water).',
        'Bring ID or passport if asked for the insurance list, swimwear, sun protection and any medication you need.',
      ] : [
        'มาถึงท่าเรือ<b>ก่อนเวลาออกเรือ 15–20 นาที</b> เราจะส่งจุดนัดพบและเบอร์ติดต่อลูกเรือให้ก่อนวันเดินทาง',
        'เรือกลับตามเวลาในใบยืนยันการจอง การเพิ่มชั่วโมงหรือจุดหมายทำได้เมื่อกัปตันยินยอมและตารางเรืออนุญาต ตามอัตราในหน้าเรือ (เรือบางลำมีชั่วโมงใช้งานสูงสุด)',
        'นำบัตรประชาชนหรือพาสปอร์ตมาหากได้รับแจ้งเพื่อทำรายชื่อประกันภัย ชุดว่ายน้ำ ครีมกันแดด และยาประจำตัว',
      ])],

      ['onboard', T('กฎบนเรือ', 'Rules on board'), ul(E ? [
        '<b>No smoking</b> on board, for any reason – for cleanliness, safety and the comfort of everyone on board.',
        '<b>No dogs or other pets</b> on board.',
        'For safety and in line with maritime safety standards, the company may <b>decline service to pregnant guests</b>. Please tell us about a pregnancy when booking.',
        'Follow the captain\'s and crew\'s safety instructions at all times, including <b>wearing a life jacket</b> when asked. Swimming, snorkelling and water activities are only allowed where and when the crew allows.',
        'Children must be supervised by their parents or guardians at all times, on board and in the water.',
        'Drink alcohol responsibly. Illegal drugs are not allowed. The captain may refuse boarding or end the trip early, without refund, if a guest\'s behaviour puts people or the boat at risk.',
        'Respect national park rules: do not feed fish, touch or stand on coral, or take shells, sand or coral.',
      ] : [
        '<b>ห้ามสูบบุหรี่</b>บนเรือทุกกรณี เพื่อความสะอาด ความปลอดภัย และความสะดวกสบายของทุกคนบนเรือ',
        '<b>ห้ามนำสุนัขหรือสัตว์เลี้ยงทุกชนิด</b>ขึ้นเรือ',
        'เพื่อความปลอดภัยและตามมาตรฐานความปลอดภัยทางทะเล บริษัทอาจ<b>ปฏิเสธการให้บริการแก่ผู้โดยสารที่ตั้งครรภ์</b> กรุณาแจ้งให้ทราบตั้งแต่ตอนจอง',
        'ปฏิบัติตามคำแนะนำด้านความปลอดภัยของกัปตันและลูกเรือตลอดเวลา รวมถึง<b>สวมเสื้อชูชีพ</b>เมื่อได้รับแจ้ง การว่ายน้ำ ดำน้ำตื้น และกิจกรรมทางน้ำทำได้เฉพาะจุดและเวลาที่ลูกเรืออนุญาต',
        'เด็กต้องอยู่ในความดูแลของผู้ปกครองตลอดเวลา ทั้งบนเรือและในน้ำ',
        'ดื่มเครื่องดื่มแอลกอฮอล์อย่างมีความรับผิดชอบ ห้ามสารเสพติดผิดกฎหมาย กัปตันอาจปฏิเสธการขึ้นเรือหรือยุติทริปก่อนเวลาโดยไม่คืนเงิน หากพฤติกรรมของผู้โดยสารเป็นอันตรายต่อผู้อื่นหรือต่อเรือ',
        'ปฏิบัติตามกฎของอุทยานแห่งชาติ: ห้ามให้อาหารปลา ห้ามจับหรือเหยียบปะการัง และห้ามเก็บเปลือกหอย ทราย หรือปะการัง',
      ])],

      ['extras', T('บริการเสริม', 'Extra services'), `<p>${T('บริการเสริม เช่น ลูกโป่ง ช่อดอกไม้ เค้กวันเกิด ดีเจ บาร์เทนเดอร์ ชุดปิกนิก เครื่องดื่มแอลกอฮอล์ อาหารพิเศษ ไกด์ และรถตู้รับส่ง มีค่าใช้จ่ายเพิ่มเติม ต้องสั่ง<b>ล่วงหน้าอย่างน้อย 24 ชั่วโมงก่อนออกเรือ</b> และขึ้นอยู่กับความพร้อมของผู้ให้บริการ ของแถมตามโปรโมชั่นของเรือแต่ละลำ (เช่น สไลเดอร์ สระลอยน้ำ หรือแชมเปญในช่วง Low Season) เป็นไปตามเงื่อนไขของเรือและไม่สามารถแลกเป็นเงินสด',
        'Extras such as balloons, flowers, birthday cakes, DJs, bartenders, picnic sets, alcohol, custom meals, guides and van transfers cost extra, must be ordered <b>at least 24 hours before departure</b> and depend on the provider\'s availability. Free gifts offered by some boats (e.g. a slider, a pool or champagne in low season) follow that boat\'s conditions and cannot be exchanged for cash.')}</p>`],

      ['liability', T('ประกันภัยและความรับผิด', 'Insurance and liability'), ul(E ? [
        'Every trip includes <b>passenger accident insurance</b> under the terms of the boat\'s policy. It covers accidents with personal injury directly related to the trip. <b>Loss of or damage to phones, cameras and other belongings is not covered.</b>',
        'We are not liable for loss of or damage to personal belongings, for costs caused by guests arriving late, or for activities you book directly with other providers on the islands.',
        'Guests are responsible for damage to the boat or its equipment caused by their own negligence or breaking the rules on board.',
        'We are not liable for failure or delay caused by events beyond our reasonable control (force majeure), such as storms, natural disasters, epidemics, closures or orders by the authorities, strikes or war. In such cases section 8 applies.',
        'Nothing in these terms limits liability that cannot be limited under Thai law, including for death or injury caused by our negligence.',
      ] : [
        'ทุกทริปมี<b>ประกันอุบัติเหตุผู้โดยสาร</b>ตามเงื่อนไขกรมธรรม์ของเรือ คุ้มครองอุบัติเหตุที่ทำให้บาดเจ็บซึ่งเกี่ยวข้องโดยตรงกับทริป <b>ไม่คุ้มครองการสูญหายหรือเสียหายของโทรศัพท์ กล้อง และทรัพย์สินส่วนตัว</b>',
        'บริษัทไม่รับผิดชอบต่อการสูญหายหรือเสียหายของทรัพย์สินส่วนตัว ค่าใช้จ่ายที่เกิดจากการมาสายของผู้โดยสาร หรือกิจกรรมที่คุณจองกับผู้ให้บริการอื่นบนเกาะโดยตรง',
        'ผู้โดยสารต้องรับผิดชอบความเสียหายต่อเรือหรืออุปกรณ์ที่เกิดจากความประมาทของตนหรือการฝ่าฝืนกฎบนเรือ',
        'บริษัทไม่ต้องรับผิดในกรณีที่ไม่สามารถให้บริการหรือให้บริการล่าช้าจากเหตุสุดวิสัยที่อยู่นอกเหนือการควบคุม เช่น พายุ ภัยธรรมชาติ โรคระบาด การปิดหรือคำสั่งของหน่วยงานรัฐ การนัดหยุดงาน หรือสงคราม ในกรณีดังกล่าวให้ใช้ข้อ 8',
        'ข้อกำหนดนี้ไม่จำกัดความรับผิดที่กฎหมายไทยไม่อนุญาตให้จำกัด รวมถึงความเสียหายต่อชีวิตหรือร่างกายที่เกิดจากความประมาทของเรา',
      ])],

      ['website', T('การใช้เว็บไซต์', 'Using this website'), ul(E ? [
        'Boat details, photos, routes and times on the website come from the boats\' brochures and are for guidance. Boats may differ slightly from the photos, and route maps and times are approximate.',
        'Texts, photos, logos and design on this website belong to us or our partners. Please do not copy them for commercial use without our permission.',
        `How we handle your personal data is described in our ${pv}.`,
      ] : [
        'ข้อมูลเรือ รูปภาพ เส้นทาง และเวลาบนเว็บไซต์มาจากโบรชัวร์ของเรือและใช้เพื่อประกอบการตัดสินใจ เรือจริงอาจแตกต่างจากรูปเล็กน้อย และแผนที่เส้นทางกับเวลาเป็นค่าโดยประมาณ',
        'ข้อความ รูปภาพ โลโก้ และการออกแบบบนเว็บไซต์เป็นของบริษัทหรือพันธมิตร ห้ามคัดลอกไปใช้เชิงพาณิชย์โดยไม่ได้รับอนุญาต',
        `การจัดการข้อมูลส่วนบุคคลของคุณเป็นไปตาม${pv}`,
      ])],

      ['law', T('ข้อร้องเรียนและกฎหมายที่ใช้บังคับ', 'Complaints and governing law'), `<p>${T(`หากมีปัญหาระหว่างทริป กรุณาแจ้งลูกเรือหรือโทรหาเราทันที ${SET.phone} เพื่อให้เราแก้ไขได้ในวันนั้น ข้อร้องเรียนหลังทริปส่งได้ที่ ${mail} ภายใน 30 วัน เราจะตอบภายใน 7 วันทำการ ข้อกำหนดนี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย ข้อพิพาทอยู่ในเขตอำนาจศาลไทย ทั้งนี้ไม่ตัดสิทธิของคุณตามกฎหมายคุ้มครองผู้บริโภค หากข้อกำหนดนี้แปลเป็นภาษาอื่น ให้ถือฉบับภาษาไทยเป็นหลัก`,
        `If something is wrong during the trip, tell the crew or call us at once on ${SET.phone} so we can fix it on the day. Send complaints after the trip to ${mail} within 30 days; we reply within 7 working days. These terms are governed by the laws of the Kingdom of Thailand and disputes fall under the jurisdiction of the Thai courts, without affecting your rights under consumer protection law. If these terms are translated, the Thai version prevails.`)}</p>`],

      ['update', T('การเปลี่ยนแปลงข้อกำหนด', 'Changes to these terms'), `<p>${T('เราอาจปรับปรุงข้อกำหนดนี้เป็นครั้งคราว ฉบับที่ใช้กับการจองของคุณคือฉบับที่แสดงในวันที่ยืนยันการจอง',
        'We may update these terms from time to time. The version that applies to your booking is the one shown on the day your booking is confirmed.')}</p>`],

      ['contact', T('ติดต่อเรา', 'Contact'), `<p>${COMPANY} · TAT ${SET.tat} · <a href="${MAP_URL}" target="_blank" rel="noopener">${T(ADDRESS_TH, ADDRESS_EN)}</a> · <a href="${TEL}">${SET.phone}</a> · ${mail}</p>`],
    ],
  };
}
{ const _ld2 = legalDocs; legalDocs = function () { const d = _ld2(); try { d.terms = fxTerms(); } catch (e) { console.warn('[terms]', e); } return d; }; }
{ const _lf = fxLegalFix; fxLegalFix = function (kind) { _lf(kind); if (kind !== 'terms') return; const v = $('#view-legal'); v && v.querySelectorAll('section p.text-xs').forEach(p => { if (/ปรับปรุงล่าสุด|Last updated/.test(p.textContent)) p.textContent = `${L('ปรับปรุงล่าสุด', 'Last updated')}: ${TM_UPDATED[LANG === 'en' ? 1 : 0]}`; }); }; }
{ const h = VH.hash || ''; if (h === '#/terms') { try { renderLegal('terms'); } catch (e) { } } }

/* =====================================================================
   Contact page  /contact  (#/contact) — channels, quote form, office, piers. The sales team band follows
   on every page. Added from fleet.js: the route, the view container and the nav links ("ติดต่อเรา" was #team).
   Server: site-render.ts routeExists() knows /contact so it answers 200, not 404.
   ===================================================================== */
PAGE_MAP['/contact'] = '#/contact'; HASH_MAP['/contact'] = '/contact';
function ctView() {
  let v = document.getElementById('view-contact');
  if (!v) { v = document.createElement('div'); v.id = 'view-contact'; v.className = 'hidden'; const nf = document.getElementById('view-nf'); nf.parentNode.insertBefore(v, nf); }
  return v;
}
const ctOpen = () => { const h = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: 'numeric', hourCycle: 'h23' }).format(new Date()); return h >= 9 && h < 21; };
function ctCopy(txt, btn) { (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { toast(L('คัดลอกแล้ว', 'Copied')); }, () => toast(txt)); }
function renderContact() {
  const v = ctView(), E = LANG === 'en';
  const lineId = SET.line || '@boattripthailand', phone = SET.phone, mail = SET.email;
  const ch = [
    ['phone-call', L('โทรหาเรา', 'Call us'), phone, TEL, L('โทรเลย', 'Call now'), phone, L('ตอบทันทีในเวลาทำการ', 'Instant answer during opening hours')],
    ['message-circle', 'LINE Official', lineId, SET.lineUrl, L('เพิ่มเพื่อน', 'Add friend'), lineId, L('ช่องทางที่ลูกค้าไทยใช้มากที่สุด', 'Most used by Thai guests')],
    ['message-circle', 'WhatsApp', phone, WA_URL, L('แชทเลย', 'Chat now'), phone, L('สะดวกสำหรับลูกค้าต่างชาติ', 'Easiest for international guests')],
    ['mail', L('อีเมล', 'Email'), mail, 'mailto:' + mail, L('ส่งอีเมล', 'Send email'), mail, L('สำหรับเอกสาร ใบเสนอราคา และบริษัท', 'For documents, quotes and companies')],
  ];
  const piers = (typeof PIERS !== 'undefined' ? PIERS : []);
  const open = FX_SSR ? null : ctOpen();
  v.innerHTML = `
  <section class="cx-page max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-6">
    <nav aria-label="Breadcrumb" class="text-xs text-muted flex items-center gap-1.5"><a href="#/" class="hover:text-maroon">${t('home')}</a>${FXI('chevron-right')}<span class="text-ink" aria-current="page">${L('ติดต่อเรา', 'Contact')}</span></nav>
    <div class="cx-hero">
      <div>
        <p class="cx-eye">${FXI('anchor')}<span>${L('ติดต่อเรา', 'Contact us')}</span></p>
        <h1>${L('คุยกับทีมเราได้ทุกวัน', 'Talk to our team, every day')}</h1>
        <p class="cx-sub">${L('บอกวันที่ จำนวนคน และที่อยากไป ทีมงานจะเช็กคิวเรือและส่งใบเสนอราคาให้ภายใน 30 นาทีในเวลาทำการ ยังไม่ต้องชำระเงิน', 'Tell us your date, group size and where you want to go. We check the boats and send a quote within 30 minutes during opening hours — no payment needed yet.')}</p>
        <div class="cx-meta">
          <span class="cx-open ${open === null ? '' : open ? 'on' : 'off'}" id="ctOpen">${open === null ? FXI('clock') + L('ทุกวัน 09:00–21:00 น.', 'Daily 09:00–21:00') : open ? `<i></i>${L('เปิดอยู่ตอนนี้ · ถึง 21:00 น.', 'Open now · until 21:00')}` : `<i></i>${L('ปิดแล้ว · เปิดอีกครั้ง 09:00 น.', 'Closed · opens at 09:00')}`}</span>
          <span>${FXI('languages')}${L('ไทย · English', 'Thai · English')}</span>
          <span>${FXI('badge-check')}TAT ${fxEsc(SET.tat)}</span>
        </div>
      </div>
    </div>

    <div class="cx-grid">${ch.map(([ic, h, val, href, act, copy, note]) => `
      <div class="cx-ch">
        <a class="cx-main" href="${href}" ${/^https?:/.test(href) ? 'target="_blank" rel="noopener"' : ''}>
          <span class="cx-ic">${FXI(ic)}</span>
          <span class="cx-tx"><small>${h}</small><b class="tabular-nums">${fxEsc(val)}</b><em>${note}</em></span>
        </a>
        <div class="cx-act"><a href="${href}" ${/^https?:/.test(href) ? 'target="_blank" rel="noopener"' : ''} class="cx-go">${act}${FXI('arrow-up-right')}</a><button type="button" class="cx-cp" onclick="ctCopy('${copy.replace(/'/g, '')}')" aria-label="${L('คัดลอก', 'Copy')} ${h}">${FXI('copy')}</button></div>
      </div>`).join('')}
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16 cx-two">
    <div class="cx-form">
      <p class="cx-eye">${FXI('send')}<span>${L('ขอใบเสนอราคา', 'Request a quote')}</span></p>
      <h2>${L('ส่งรายละเอียดทริปของคุณ', 'Tell us about your trip')}</h2>
      <p class="cx-sub2">${L('กรอกเท่าที่รู้ก็พอ ทีมงานจะติดต่อกลับทาง WhatsApp LINE หรือโทรศัพท์', 'Fill in what you know — we reply by WhatsApp, LINE or phone.')}</p>
      <div id="ctFormWrap"></div>
    </div>
    <aside class="cx-side">
      <div class="cx-card">
        <h3>${FXI('building-2')}${L('สำนักงาน', 'Office')}</h3>
        <p class="cx-co">${fxEsc(SET.company)}</p>
        <p class="cx-ad">${fxEsc(L(ADDRESS_TH, ADDRESS_EN))}</p>
        <dl class="cx-dl"><dt>${L('เวลาทำการ', 'Opening hours')}</dt><dd>${L('ทุกวัน 09:00–21:00 น. (เวลาไทย)', 'Daily 09:00–21:00 (Thai time)')}</dd><dt>${L('ใบอนุญาต', 'Licence')}</dt><dd>TAT ${fxEsc(SET.tat)}</dd></dl>
        <a class="cx-map" href="${MAP_URL}" target="_blank" rel="noopener">${FXI('map-pin')}${L('เปิดใน Google Maps', 'Open in Google Maps')}</a>
        <p class="cx-note">${L('สำนักงานไม่ใช่จุดขึ้นเรือ เรือออกจากท่าตามที่ระบุในหน้าเรือแต่ละลำ', 'The office is not where you board — each boat leaves from the marina shown on its page.')}</p>
      </div>
      ${piers.length ? `<div class="cx-card">
        <h3>${FXI('anchor')}${L('ท่าเรือที่ออกเรือ', 'Marinas we depart from')}</h3>
        <ul class="cx-piers">${piers.map(p => `<li><span><b>${fxEsc(p.n)}</b><small>${fxEsc(L(p.th, p.adEn))}</small></span><a href="${prGoogle(p)}" target="_blank" rel="noopener" aria-label="${L('นำทางไป', 'Directions to')} ${fxEsc(p.n)}">${FXI('navigation')}</a></li>`).join('')}</ul>
      </div>` : ''}
      <div class="cx-card cx-tips">
        <h3>${FXI('lightbulb')}${L('ได้คำตอบเร็วขึ้น', 'Get an answer faster')}</h3>
        <ul>${(E ? ['Travel date (or a range)', 'Number of adults and children', 'Half day, full day or sunset', 'Where you are staying', 'Budget or the boat you like'] : ['วันที่เดินทาง (หรือช่วงวันที่)', 'จำนวนผู้ใหญ่และเด็ก', 'ครึ่งวัน เต็มวัน หรือชมพระอาทิตย์ตก', 'ที่พักของคุณ', 'งบประมาณ หรือเรือที่สนใจ']).map(x => `<li>${FXI('check')}${x}</li>`).join('')}</ul>
      </div>
    </aside>
  </section>`;
  try { buildForm($('#ctFormWrap')); } catch (e) { }
  document.title = L('ติดต่อเรา – Boat Trip Thailand | เช่าเรือยอชต์ภูเก็ต', 'Contact – Boat Trip Thailand | Yacht Charter Phuket');
  const desc = L(`ติดต่อ Boat Trip Thailand ทางโทรศัพท์ ${phone} LINE ${lineId} WhatsApp หรืออีเมล ทุกวัน 09:00–21:00 น. ขอใบเสนอราคาเช่าเรือยอชต์ คาตามารัน สปีดโบ๊ท ภูเก็ต ตอบภายใน 30 นาที`, `Contact Boat Trip Thailand by phone ${phone}, LINE ${lineId}, WhatsApp or email, daily 09:00–21:00. Request a quote for yacht, catamaran and speedboat charters in Phuket — reply within 30 minutes.`);
  setMeta('description', desc); setMeta('og:title', document.title, 'property'); setMeta('og:description', desc, 'property'); setMeta('og:url', SITE + '/contact', 'property');
  const c = document.getElementById('canonical'); if (c) c.href = SITE + (LANG === 'en' ? '/en' : '') + '/contact';
  icons();
}
{ const _sv2 = showView; showView = function (name) { _sv2(name); const v = document.getElementById('view-contact'); if (v) v.classList.toggle('hidden', name !== 'contact'); if (name === 'contact') $('#floatCta')?.classList.add('!hidden'); }; }
{ const _r0 = route0; route0 = function (keepScroll) { if ((VH.hash || '') === '#/contact') { ctView(); showView('contact'); renderContact(); if (!keepScroll) scrollTo(0, 0); return; } return _r0(keepScroll); }; }
/* nav + mobile menu: "ติดต่อเรา" opens the page (it used to jump to the team band) */
function ctLinks() { document.querySelectorAll('a[data-i18n="nav.contact"], a:has(> [data-i18n="nav.contact"])').forEach(a => a.setAttribute('href', hashToPath('#/contact'))); }
ctLinks();
{ const _ar = afterRoute; afterRoute = function () { _ar(); try { ctLinks(); const a = document.querySelector('#navLinks a[data-i18n="nav.contact"]'); if (a) a.classList.toggle('is-active', VHASH === '#/contact'); } catch (e) { } }; }
if (pathToHash(location.pathname, location.search, location.hash) === '#/contact') { VHASH = '#/contact'; try { route(true); } catch (e) { } }

/* =====================================================================
   /admin → ศูนย์ SEO → ตั้งค่า, applied on the site (browser and server render):
   Title / Description templates for boats and articles without their own, {{year}} kept current,
   each boat's cover photo as its share image, external links in articles (new tab, noopener / nofollow),
   and noindex on the boat list when filters are in the URL.
   ===================================================================== */
const FX_SC = (window.__SEO__ || {}).cfg || {};
const fxYear = () => String(new Date().getFullYear());
/** "%name%" or "{{name}}" → value; empty values drop their word and doubled separators */
function fxTpl(t, v) {
  if (!t) return '';
  const out = String(t).replace(/\{\{\s*(\w+)\s*\}\}|%(\w+)%/g, (_, a, b) => { const k = a || b; return v[k] != null && v[k] !== '' ? String(v[k]) : ''; });
  return out.replace(/\s+([|–·»])\s+(?=[|–·»]|$)/g, ' ').replace(/(เริ่ม|from)\s*(?=[|–·»]|$)/gi, '').replace(/\s{2,}/g, ' ').replace(/^\s*[|–·»]\s*|\s*[|–·»]\s*$/g, '').trim();
}
function fxMetaSet(title, desc) {
  if (title) { document.title = title; setMeta('og:title', title, 'property'); setMeta('twitter:title', title); }
  if (desc) { setMeta('description', desc); setMeta('og:description', desc, 'property'); setMeta('twitter:description', desc); }
}
function fxYearFix() {
  if (FX_SC.year === false) return;
  const y = fxYear(), re = /\{\{\s*year\s*\}\}|%year%/gi;
  if (re.test(document.title)) document.title = document.title.replace(re, y);
  ['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description'].forEach(n => { const m = document.head.querySelector(`meta[name="${n}"],meta[property="${n}"]`); if (m && /\{\{\s*year\s*\}\}|%year%/i.test(m.content)) m.content = m.content.replace(re, y); });
}
let FX_POST = null;
{ const _sp = seoPost; seoPost = function (p) { FX_POST = p; return _sp(p); }; }
{ const _sf = seoFinal; seoFinal = function (id) {
  const k = LANG === 'en' ? 'en' : 'th', sep = FX_SC.sep || '|', site = (FX_SC.site && FX_SC.site[k]) || 'Boat Trip Thailand';
  try {
    if (id && id.startsWith('b-')) {
      const b = bySlug(id.slice(2));
      if (b) {
        const v = { name: niceTitle(b.title || b.name || ''), price: b.from_ ? (k === 'en' ? '$' + Math.round(b.from_ / 33.42).toLocaleString('en-US') : baht(b.from_)) : '', pax: b.pax || '', marina: b.marinaP || b.marina || '', type: typeLabel(b.type), year: fxYear(), sep, site };
        const own = o => String(o?.[k] || '').trim();
        const T = !own(b.i18n?.seoTitle) && fxTpl(FX_SC.tpl?.boat?.[k], v), D = !own(b.i18n?.seoDesc) && fxTpl(FX_SC.dtpl?.boat?.[k], v);
        fxMetaSet(T, D);
        if (FX_SC.ogImg !== false) { const h = bimg(b.slug, 'hero', 0) || (b.imgs || [])[0]; if (h) { const u = /^https?:/.test(h) ? h : SITE_ORIGIN + h; setMeta('og:image', u, 'property'); setMeta('twitter:image', u); setMeta('og:image:alt', v.name, 'property'); } }
      }
    }
    if (id && id.startsWith('a-') && FX_POST && String(FX_POST.id) === id.slice(2)) {
      const p = FX_POST, v = { title: pT(p, 'title'), excerpt: pT(p, 'excerpt'), year: fxYear(), sep, site };
      const T = !String(p.seoT?.[k] || '').trim() && fxTpl(FX_SC.tpl?.article?.[k], v), D = !String(p.seoD?.[k] || '').trim() && fxTpl(FX_SC.dtpl?.article?.[k], v);
      fxMetaSet(T, D);
      if (p.cover) { const u = /^https?:/.test(p.cover) ? p.cover : SITE_ORIGIN + p.cover; setMeta('twitter:image', u); }
      if (FX_SC.ext !== false) $$('#view-blog .post-body a[href^="http"]').forEach(a => { let h = ''; try { h = new URL(a.href).host; } catch (e) { } if (!h || /(^|\.)boattripthailand\.com$/i.test(h) || h === location.host) return;
        a.target = '_blank'; a.rel = ['noopener', FX_SC.extNofollow ? 'nofollow' : '', /[?&](ref|aff|affiliate|utm_source)=/i.test(a.href) ? 'sponsored' : ''].filter(Boolean).join(' '); });
    }
  } catch (e) { }
  _sf(id);
  try {
    // boat list with filters (?type= ?stay= ?pax= …): one indexable version only
    if (id === 's-fleet' && FX_SC.noFilter !== false && [...new URLSearchParams(location.search).keys()].some(q => !/^(utm_|gclid|fbclid|lang)/.test(q))) setMeta('robots', 'noindex, follow');
    fxYearFix();
  } catch (e) { }
}; }
/* the first page was set up before this file loaded */
try { const h = VH.hash || ''; if (h.startsWith('#/boat/')) applySeo('boat', bySlug(decodeURIComponent(h.slice(7)))); else if (h.startsWith('#/blog/')) { const p = pBySlug(decodeURIComponent(h.slice(7))); if (p) seoPost(p); } else if (h.startsWith('#/fleet')) applySeo('fleet'); else fxYearFix(); } catch (e) { }

/* ---------- start ---------- */
if (!FX_SSR) {
  addEventListener('scroll', () => { const fw = $('#fxFw'); if (fw) fw.classList.toggle('stuck', fw.getBoundingClientRect().top <= 83); }, { passive: true });
  addEventListener('resize', () => { fxInd = null; fxMoveInd(); });
  try { if ($('#inlineFormWrap')) inlineForm = buildForm($('#inlineFormWrap')); } catch (e) { }
}
{ const g = $('#boatGrid'); if (g) { g.className = 'fx-grid mt-6'; try { renderBoats(); } catch (e) { } } }
if (!FX_SSR) { fxPark(); try { fxBrandIcons(); } catch (e) { } }
updateCompareUI();
{ const _rd = renderDest; renderDest = function (slug) { _rd(slug); try { $$('#view-dest .grid.lg\\:grid-cols-4').forEach(g => { if (g.querySelector('.fx-card')) g.className = 'fx-grid mt-6'; }); fxPark(); } catch (e) { } }; }
if ((VH.hash || '').startsWith('#/dest/')) { try { renderDest(decodeURIComponent(VH.hash.slice(7))); fxFixImgs(); } catch (e) { } }
if ((VH.hash || '').startsWith('#/fleet')) { renderFleetPage(); if (typeof afterRoute === 'function') afterRoute(); }
