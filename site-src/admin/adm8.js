/* =====================================================================
   SEASON CALENDARS – date ranges per season, used by the website to show
   only the price that applies on the guest's date
   ===================================================================== */
/*__SEASON_ENGINE__*/
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
              <p class="text-[11.5px] text-muted mt-0.5">${c.kind === 'season' ? 'แยกราคาตามฤดู' : c.add ? `ราคาเดียว + ${baht(c.add)} ช่วงพิเศษ` : c.special ? 'ราคาเดียว + คอลัมน์ช่วงพิเศษ' : 'ราคาเดียวทั้งปี'} · ${bs.length} ลำ</p>
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
      ${c.kind === 'season' ? ['low', 'high', 'peak'].map(ranges).join('') : `<label class="block"><span class="lbl">บวกเพิ่มช่วงพิเศษ (บาท · เว้นว่างถ้ามีคอลัมน์ราคาพิเศษในตาราง)</span><input class="inp" type="number" value="${c.add || ''}" onchange="SZV.edit.add=+this.value||0;szDraw()"/></label>`}
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


