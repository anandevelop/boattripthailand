/* =====================================================================
   ANALYTICS – Google Analytics 4 (Data API) + Search Console (Search Analytics API)
   Mockup: numbers are generated sample data; real system calls the APIs server-side.
   ===================================================================== */
const GA = { tab: 'overview', days: 28, cmp: true, gaOn: false, gscOn: false, prop: '', site: 'sc-domain:boattripthailand.com', qLang: '' };
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
function lineChart(cur, prev, { h = 180, fmt = nf, label = '', invert = false } = {}) {
  const id = 'ch' + (++CH), W = 800, n = cur.length, all = cur.concat(GA.cmp && prev ? prev : []);
  let lo = Math.min(...all), hi = Math.max(...all); if (invert) [lo, hi] = [lo - 1, hi + 1]; else { lo = 0; hi = hi * 1.1; }
  const x = i => i / (n - 1) * W, y = v => invert ? (v - lo) / (hi - lo) * (h - 24) + 8 : h - 20 - (v - lo) / (hi - lo) * (h - 32);
  const path = a => a.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const ticks = [0, .5, 1].map(f => invert ? lo + (hi - lo) * f : lo + (hi - lo) * f);
  const dates = cur.map((_, i) => addDays(TODAY, i - n + 1));
  CHD[id] = { cur, prev, fmt, label, dates, n };
  return `<div class="relative" id="${id}"><svg viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" class="w-full block" style="height:${h}px" onmousemove="chHover(event,'${id}')" onmouseleave="chLeave('${id}')">
      ${ticks.map(t => `<line x1="0" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="#f1eaea" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('')}
      ${GA.cmp && prev ? `<path d="${path(prev)}" fill="none" stroke="#c9bcbd" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>` : ''}
      <path d="${path(cur)}L${W},${invert ? 0 : h - 20}L0,${invert ? 0 : h - 20}Z" fill="#70000e" opacity=".06"/>
      <path d="${path(cur)}" fill="none" stroke="#70000e" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      <line class="ch-x" x1="0" x2="0" y1="0" y2="${h - 20}" stroke="#231416" stroke-width="1" opacity="0" vector-effect="non-scaling-stroke"/></svg>
    <div class="absolute left-0 top-0 text-[10px] text-muted tnum">${fmt(invert ? lo : hi)}</div>
    <div class="flex justify-between text-[10.5px] text-muted mt-1 tnum"><span>${fmtD(iso(dates[0]))}</span><span>${fmtD(iso(dates[Math.floor(n / 2)]))}</span><span>${fmtD(iso(dates[n - 1]))}</span></div>
    <div class="ch-tip hidden absolute z-10 pointer-events-none bg-ink text-white text-[11.5px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg"></div></div>`;
}
const CHD = {};
function chHover(e, id) { const d = CHD[id], box = $('#' + id), r = box.getBoundingClientRect(), f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), i = Math.round(f * (d.n - 1));
  const ln = box.querySelector('.ch-x'), X = i / (d.n - 1) * 800; ln.setAttribute('x1', X); ln.setAttribute('x2', X); ln.setAttribute('opacity', .25);
  const t = box.querySelector('.ch-tip'); t.classList.remove('hidden'); t.innerHTML = `${fmtD(iso(d.dates[i]))} · <b class="font-medium">${d.fmt(d.cur[i])}</b> ${d.label}${GA.cmp && d.prev ? `<span class="opacity-60"> · ก่อนหน้า ${d.fmt(d.prev[i])}</span>` : ''}`;
  t.style.left = Math.min(r.width - t.offsetWidth, Math.max(0, f * r.width - t.offsetWidth / 2)) + 'px'; t.style.top = '-6px'; }
function chLeave(id) { const b = $('#' + id); b.querySelector('.ch-tip').classList.add('hidden'); b.querySelector('.ch-x').setAttribute('opacity', 0); }
const legend = () => GA.cmp ? `<div class="flex items-center gap-4 text-[11px] text-muted"><span class="flex items-center gap-1.5"><i class="inline-block w-4 h-0.5 bg-maroon"></i>${GA.days} วันล่าสุด</span><span class="flex items-center gap-1.5"><i class="inline-block w-4 border-t border-dashed border-[#b8aaac]"></i>${GA.days} วันก่อนหน้า</span></div>` : '';
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
  $('#view').innerHTML = `${head('วิเคราะห์เว็บไซต์', 'ข้อมูลจาก Google Analytics 4, Google Search Console และ Meta Pixel', `<div class="flex p-0.5 rounded-full bg-white ring-1 ring-line">${[7, 28, 90].map(d => `<button class="h-8 px-3 rounded-full text-[12px] ${GA.days === d ? 'bg-ink text-white' : 'text-muted'}" onclick="GA.days=${d};vAnalytics()">${d} วัน</button>`).join('')}</div><label class="flex items-center gap-2 text-[12px] text-muted"><span class="tgl"><input type="checkbox" ${GA.cmp ? 'checked' : ''} onchange="GA.cmp=this.checked;vAnalytics()"/><span></span></span>เทียบช่วงก่อนหน้า</label><button class="btn btn-o" onclick="toast('ส่งออกรายงาน (จำลอง)')"><i data-lucide="download" class="w-3.5 h-3.5"></i>ส่งออก</button>`)}
    <div class="rounded-xl bg-[#fff8e6] text-[#7a4a00] text-[12px] px-4 py-2.5 mb-4 flex items-start gap-2"><i data-lucide="info" class="w-4 h-4 shrink-0 mt-px"></i>ตัวเลขทั้งหมดในหน้านี้เป็นข้อมูลตัวอย่าง เพื่อให้เห็นหน้าตารายงาน · เมื่อเชื่อม API ในระบบจริงจะแสดงข้อมูลจริงของเว็บ</div>
    <div class="grid md:grid-cols-3 gap-3 mb-4">${conn(GA.gaOn, 'Google Analytics 4', GA.prop || 'Property', 'chart-line')}${conn(GA.gscOn, 'Google Search Console', GA.site, 'search')}${conn(MP.on, 'Meta Pixel + Conversions API', MP.id || 'Pixel', 'megaphone').replace(`GA.tab='api'`, `GA.tab='meta'`)}</div>
    <div class="flex gap-1 overflow-x-auto no-sb mb-4">${tabs.map(([k, l, ic]) => `<button class="tab inline-flex items-center gap-1.5 ${GA.tab === k ? 'on' : ''}" onclick="GA.tab='${k}';vAnalytics()"><i data-lucide="${ic}" class="w-3.5 h-3.5"></i>${l}</button>`).join('')}</div>
    <div class="fade">${body}</div>`;
  icons();
}
PAGES.splice(PAGES.findIndex(p => p[0] === 'seo') + 1, 0, ['analytics', 'วิเคราะห์เว็บไซต์', 'chart-line', vAnalytics]);
/* SEO overview "connect GSC" card → go to analytics */
const _seoOverview11 = seoOverview;
seoOverview = function (P) { return _seoOverview11(P).replace(`GSC.on=true;vSeo();toast('เชื่อมต่อแล้ว (จำลอง) · แสดงข้อมูลตัวอย่าง')`, `GA.tab='api';go('analytics')`); };
/* dashboard: small web-traffic card */
const _vDash11 = PAGES.find(p => p[0] === 'dashboard')[3];
PAGES.find(p => p[0] === 'dashboard')[3] = function () { _vDash11(); const ul = $$('#view ul').pop(); if (!ul) return; const u = sum(SER.users.slice(-7)), pu = sum(SER.users.slice(-14, -7)), c = sum(SER.clicks.slice(-7));
  ul.parentElement.insertAdjacentHTML('beforeend', `<p class="font-medium mt-6 flex items-center gap-2"><i data-lucide="chart-line" class="w-4 h-4 text-maroon"></i>ผู้เข้าชมเว็บ 7 วัน <span class="text-[10.5px] text-muted font-normal">ตัวอย่าง</span></p><div class="mt-3 flex items-end justify-between gap-3 cursor-pointer" onclick="go('analytics')"><div><p class="text-[22px] font-medium tnum leading-none">${nf(u)}</p><p class="text-[11.5px] text-muted mt-1">ผู้ใช้ · ${nf(c)} คลิกจาก Google</p></div><span class="text-[12px] tnum ${u >= pu ? 'text-[#1e7a46]' : 'text-[#a3222c]'}">${u >= pu ? '▲' : '▼'} ${Math.abs((u - pu) / pu * 100).toFixed(1)}%</span></div>`); icons(); };


