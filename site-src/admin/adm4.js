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
      ${rows.map(a => { const t = a.title.th || a.title.en, au = TEAM.find(x => x.id === a.author);
        return `<tr class="click" onclick="go('articles/${a.id}')"><td><div class="flex items-center gap-3 min-w-[280px]"><img src="${THUMBS[a.cover]}" class="w-16 h-11 rounded-lg object-cover shrink-0"/><div class="min-w-0"><p class="truncate max-w-[340px]">${esc(t)}</p><p class="text-[11px] text-muted truncate max-w-[340px]">${a.title.th && a.title.en ? esc(a.title.en) : (a.title.th ? 'ยังไม่มีชื่อภาษาอังกฤษ' : 'ยังไม่มีชื่อภาษาไทย')}</p></div></div></td>
          <td class="text-muted whitespace-nowrap">${ACAT_A[a.cat]}</td><td><div class="flex gap-1">${trBadge(a)}</div></td><td><span class="pill ${ART_ST[a.status][1]}">${ART_ST[a.status][0]}</span></td>
          <td><div class="flex items-center gap-2"><img src="${TEAM_IMG[a.author]}" class="w-6 h-6 rounded-full object-cover"/>${au.name}</div></td><td class="text-muted whitespace-nowrap">${fmtD(a.date)}</td><td class="text-right tnum">${a.views ? a.views.toLocaleString() : '—'}</td></tr>`; }).join('') || `<tr><td colspan="7" class="text-center text-muted py-10">ไม่พบบทความ</td></tr>`}
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
function artSet(id, f, k, el) { const a = artById(id); a[f][k] = el.value; if (f === 'title' && !a.slugLock?.[k]) { a.slug[k] = slugify(el.value); const s = $('#artSlug'); if (s) s.value = a.slug[k]; } artTouch(a, k); artSeoPrev(a); if (f === 'seoT' || f === 'seoD') artCount(); }
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
  const field = (f, label, { rows = 0, max = 0, idx = '' } = {}) => {
    const v = a[f][k] || '', inId = `af_${f}`;
    const inp = rows ? `<textarea id="${inId}" rows="${rows}" class="inp" oninput="artSet(${a.id},'${f}','${k}',this)">${esc(v)}</textarea>` : `<input id="${inId}" class="inp" value="${esc(v)}" oninput="artSet(${a.id},'${f}','${k}',this)"/>`;
    return `<label class="block"><span class="flex justify-between"><span class="lbl">${label}</span>${max ? `<span class="cnt-t" data-for="${inId}" data-max="${max}"></span>` : ''}</span>${inp}</label>`;
  };
  const tbtn = (ic, c, v, tip) => `<button type="button" class="btn btn-g !px-2 !h-8" title="${tip}" onmousedown="event.preventDefault();artCmd('${c}'${v ? `,'${v}'` : ''})"><i data-lucide="${ic}" class="w-4 h-4"></i></button>`;
  const au = TEAM.find(x => x.id === a.author);
  $('#view').innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      <button class="btn btn-g !px-2 self-start" onclick="go('articles')"><i data-lucide="arrow-left" class="w-4 h-4"></i>บทความทั้งหมด</button>
      <div class="sm:ml-auto flex flex-wrap items-center gap-2"><span class="pill ${ART_ST[a.status][1]}">${ART_ST[a.status][0]}</span>
        <button class="btn btn-o" onclick="window.open('boattripthailand-mockup.html','_blank')"><i data-lucide="eye" class="w-3.5 h-3.5"></i>Preview ${k.toUpperCase()}</button>
        <button class="btn btn-o" onclick="toast('บันทึกร่างแล้ว')">บันทึกร่าง</button>
        <button class="btn btn-p" onclick="artPublish(${a.id})"><i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>${a.status === 'published' ? 'อัปเดต' : 'เผยแพร่'}</button></div>
    </div>
    <div class="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
      <div class="grid gap-4 min-w-0">
        <div class="card p-2 flex flex-wrap items-center gap-2">
          <div class="flex gap-1">${LANGS.map(([c, C, l]) => `<button class="tab ${k === c ? 'on' : ''}" onclick="AE.lang='${c}';vArticleEdit(${a.id})">${C} · ${l}</button>`).join('')}</div>
          <div id="artTr" class="flex gap-1 ml-1">${trBadge(a)}</div>
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
          ${field('kw', 'คีย์เวิร์ดหลัก')}${field('seoT', 'Meta title', { max: 60 })}${field('seoD', 'Meta description', { rows: 2, max: 160 })}
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
