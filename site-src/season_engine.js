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
  return { cal, base, sp, key, add: sp && cal.add ? cal.add : 0 };
}
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
    if (!isSeasonTable(ks)) tb.rows.forEach(r => r.slice(1).forEach(c => { const n = priceNum(c); if (n) nums.push(n + v.add); }));
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
