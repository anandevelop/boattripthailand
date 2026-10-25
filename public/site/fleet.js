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
const FX_DUR = { half: ['ครึ่งวัน', 'Half day'], full: ['เต็มวัน', 'Full day'], night: ['ค้างคืน', 'Overnight'] };
const FX_TYPES = ['all', 'yacht', 'sail', 'power', 'speed', 'longtail'];
const FX_MIN = 15000, FX_MAX = 200000;
const FX = { type: 'all', dest: new Set(), pax: 2, paxSet: false, dur: '', bud: FX_MAX, sort: 'smart', date: '', fav: false };
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
const fxActive = () => !!(FX.dest.size || FX.dur || FX.bud < FX_MAX || FX.paxSet || FX.date);
function fxPass(b, ignoreType) {
  return (ignoreType || FX.type === 'all' || b.type === FX.type) && (!FX.fav || FAV.includes(b.slug)) && (b.pax || 0) >= FX.pax
    && (FX.bud >= FX_MAX || fxPrice(b).total <= FX.bud) && (!FX.dest.size || [...FX.dest].every(d => b.fxDest.includes(d))) && (!FX.dur || b.fxDur.includes(FX.dur));
}
function fxScore(b) {
  const fill = FX.pax / (b.pax || 1); let s = fill >= .45 ? 30 : fill * 60;   // not a big empty boat for a small group
  s += b.fxRank >= 0 ? 12 - b.fxRank * .8 : 0;                               // our recommended boats
  return s + 34 * (1 - Math.min(1, fxPer(b) / 20000));                      // value per guest
}
function fxList() {
  const rank = b => b.fxRank >= 0 ? b.fxRank : 99;
  const by = { smart: fxActive() ? (a, b) => fxScore(b) - fxScore(a) : (a, b) => rank(a) - rank(b) || (b.ft || 0) - (a.ft || 0),
    pp: (a, b) => fxPer(a) - fxPer(b), low: (a, b) => fxPrice(a).total - fxPrice(b).total, high: (a, b) => fxPrice(b).total - fxPrice(a).total, size: (a, b) => (b.ft || 0) - (a.ft || 0) }[FX.sort] || (() => 0);
  return FLEET.filter(b => fxPass(b)).sort(by);
}

/* ---------- the search lives in the URL: shareable, and usable as ad landing pages ---------- */
function fxRead() {
  const h = VH.hash || '', i = h.indexOf('?'), q = new URLSearchParams(i < 0 ? '' : h.slice(i + 1));
  Object.assign(FX, { type: 'all', dest: new Set(), pax: 2, paxSet: false, dur: '', bud: FX_MAX, sort: 'smart', date: '', fav: q.has('fav') });
  if (/^\d{4}-\d{2}-\d{2}$/.test(q.get('date') || '') && q.get('date') >= todayISO()) FX.date = q.get('date');
  if (+q.get('pax') > 0) { FX.pax = Math.min(200, Math.round(+q.get('pax'))); FX.paxSet = true; }
  (q.get('to') || '').split(',').filter(k => FX_DEST[k]).forEach(k => FX.dest.add(k));
  if (FX_DUR[q.get('dur')]) FX.dur = q.get('dur');
  if (+q.get('budget') >= FX_MIN) FX.bud = Math.min(FX_MAX, +q.get('budget'));
  if (FX_TYPES.includes(q.get('type'))) FX.type = q.get('type');
  if (['pp', 'low', 'high', 'size'].includes(q.get('sort'))) FX.sort = q.get('sort');
}
function fxWrite() {
  const q = new URLSearchParams();
  if (FX.fav) q.set('fav', ''); if (FX.date) q.set('date', FX.date); if (FX.paxSet) q.set('pax', FX.pax); if (FX.dest.size) q.set('to', [...FX.dest].join(','));
  if (FX.dur) q.set('dur', FX.dur); if (FX.bud < FX_MAX) q.set('budget', FX.bud); if (FX.type !== 'all') q.set('type', FX.type); if (FX.sort !== 'smart') q.set('sort', FX.sort);
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
        <div class="fx-seg" style="cursor:default"><small>${FXI('users')}${L('ไปกี่คน', 'Guests')}</small><div class="fx-step"><button type="button" onclick="fxStep(-1)" aria-label="${L('ลด', 'Fewer')}">${FXI('minus')}</button><b class="tnum fx-vpax"></b><button type="button" onclick="fxStep(1)" aria-label="${L('เพิ่ม', 'More')}">${FXI('plus')}</button></div></div>
        <button class="fx-seg" data-pop="fxPDur"><small>${FXI('clock')}${L('ระยะเวลา', 'Duration')}</small><b id="fxVDur"></b></button>
        <button class="fx-seg" data-pop="fxPBud"><small>${FXI('wallet')}${L('งบต่อลำ', 'Budget per boat')}</small><b id="fxVBud"></b></button>
        <a class="fx-go" href="#fxResults" onclick="event.preventDefault();fxToResults()">${FXI('sparkles')}<span id="fxGoT"></span></a>
      </div>
      <button class="fx-mfind" onclick="fxSheet(true)">${FXI('search')}<div><b>${L('หาเรือที่ใช่', 'Find your boat')}</b><small id="fxMSum"></small></div><span class="f">${FXI('sliders-horizontal')}</span></button>
      <div class="fx-pop" id="fxPDest" onclick="event.stopPropagation()"><h4>${L('อยากไปไหน · เลือกได้หลายที่', 'Where to · pick one or more')}</h4><div class="fx-dests" id="fxDests"></div></div>
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
          <option value="low">${L('ราคาต่อลำ ต่ำ → สูง', 'Price per boat, low → high')}</option><option value="high">${L('ราคาต่อลำ สูง → ต่ำ', 'Price per boat, high → low')}</option><option value="size">${L('เรือใหญ่ก่อน', 'Largest first')}</option></select>${FXI('chevron-down')}</label></div>
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
    $('#fxInsT').innerHTML = `${FX.date ? fxDate(FX.date) + ' · ' : ''}${FX.pax} ${t('guests')}${FX.dest.size ? ' · ' + [...FX.dest].map(fxDL).join(' + ') : ''}${FX.dur ? ' · ' + fxL(FX_DUR[FX.dur]) : ''} — <b>${L(`${list.length} ลำ`, `${list.length} boats`)}</b>${value ? L(` · คุ้มสุดคือ <b>${fxEsc(niceTitle(value.title))}</b> ≈ ${baht(fxPer(value))}/คน`, ` · best value <b>${fxEsc(niceTitle(value.title))}</b> ≈ ${baht(fxPer(value))}/guest`) : ''}`;
  } else ins.hidden = true;
  // finder labels
  const dl = [...FX.dest].map(fxDL), se = FX.date ? seasonOf(FX.date) : '';
  $('#fxSeason').innerHTML = se ? ` · <span class="fx-season ${se}">${se[0].toUpperCase() + se.slice(1)}</span>` : '';
  fxSetV('#fxVDest', dl.length ? dl.join(', ') : L('ทุกเกาะ', 'Anywhere'), !dl.length);
  fxSetV('#fxVDur', FX.dur ? fxL(FX_DUR[FX.dur]) : L('ได้ทั้งหมด', 'Any'), !FX.dur);
  fxSetV('#fxVBud', FX.bud >= FX_MAX ? L('ไม่จำกัด', 'No limit') : L('ไม่เกิน ', 'Up to ') + baht(FX.bud), FX.bud >= FX_MAX);
  $$('.fx-vpax').forEach(e => e.textContent = `${FX.pax} ${t('guests')}`);
  $('#fxMSum').textContent = [FX.date ? fxDate(FX.date) : L('ทุกวัน', 'Any date'), `${FX.pax} ${t('guests')}`, dl.length ? dl.join(', ') : L('ทุกเกาะ', 'Anywhere'), FX.dur ? fxL(FX_DUR[FX.dur]) : '', FX.bud < FX_MAX ? '≤ ' + baht(FX.bud) : ''].filter(Boolean).join(' · ');
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
  const pops = ['#fxPDest', '#fxPDur', '#fxPBud'].map(s => $(s));
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
function fxSetDur(k) { FX.dur = k; fxDraw(); }
function fxStep(d) { FX.pax = Math.max(1, Math.min(200, FX.pax + d)); FX.paxSet = true; fxDraw(); }
function fxReset() { const fav = FX.fav; Object.assign(FX, { type: 'all', dest: new Set(), pax: 2, paxSet: false, dur: '', bud: FX_MAX, sort: 'smart', date: '', fav }); fxDraw(); }
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
  const extra = [FX.pax > fxMaxPax() ? L(`กลุ่ม ${FX.pax} คน · ต้องการเรือหลายลำ`, `Group of ${FX.pax} · several boats needed`) : '', !slug && FX.dest.size ? L('อยากไป: ', 'Wants to visit: ') + [...FX.dest].map(fxDL).join(', ') : ''].filter(Boolean).join('\n');
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
  Object.assign(FX, { type: 'all', dest: new Set(), pax: 2, paxSet: false, dur: '', bud: FX_MAX, sort: 'smart', date: '', fav: false });
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

/* ---------- start ---------- */
if (!FX_SSR) {
  addEventListener('scroll', () => { const fw = $('#fxFw'); if (fw) fw.classList.toggle('stuck', fw.getBoundingClientRect().top <= 83); }, { passive: true });
  addEventListener('resize', () => { fxInd = null; fxMoveInd(); });
  try { if ($('#inlineFormWrap')) inlineForm = buildForm($('#inlineFormWrap')); } catch (e) { }
}
{ const g = $('#boatGrid'); if (g) { g.className = 'fx-grid mt-6'; try { renderBoats(); } catch (e) { } } }
updateCompareUI();
if ((VH.hash || '').startsWith('#/fleet')) { renderFleetPage(); if (typeof afterRoute === 'function') afterRoute(); }
