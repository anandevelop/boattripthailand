/* =====================================================================
   WORDPRESS IMPORT – real articles from boattripthailand.WordPress.2026-10-20.xml
   ===================================================================== */
const WP = window.WPDATA || { arts: [], redir: [] };
(function importWP() {
  if (!WP.arts.length) return;
  ART.length = 0;
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
route();
