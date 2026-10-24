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


