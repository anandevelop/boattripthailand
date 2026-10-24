/* =========================================================
   BLOG  (#/blog · #/blog/<slug>) — articles from the CMS
   ========================================================= */
const POSTS = window.POSTS || [];
setTimeout(() => document.querySelectorAll('img[data-pid]').forEach(im => { if (im.complete && !im.naturalWidth && window.pFallbackImg) { im.dataset.fb = 1; im.src = pFallbackImg(+im.dataset.pid); } }), 0);
if (window.__POST__) { const cur = POSTS.find(x => x.id === window.__POST__.id); if (cur) Object.assign(cur, window.__POST__); }
const esc = escH;
const BCAT = { guide: { th: 'คู่มือเช่าเรือ', en: 'Charter guides', icon: 'compass' }, route: { th: 'เส้นทาง & เกาะ', en: 'Routes & islands', icon: 'map' }, boat: { th: 'ประเภทเรือ', en: 'Boat types', icon: 'sailboat' }, event: { th: 'งานอีเวนต์บนเรือ', en: 'Events at sea', icon: 'party-popper' }, news: { th: 'ข่าว & โปรโมชัน', en: 'News & offers', icon: 'megaphone' } };
const BL = { cat: '', q: '', shown: 13 };
const plang = () => LANG === 'en' ? 'en' : 'th';
const pHas = (p, k = plang()) => !!(p.title[k] && (p.blocks ? p.blocks[k].length : p.has && p.has[k]));
const pT = (p, f) => p[f][plang()] || p[f][plang() === 'en' ? 'th' : 'en'] || '';
const pBlocks = p => p.blocks[plang()].length ? p.blocks[plang()] : p.blocks[plang() === 'en' ? 'th' : 'en'];
const pText = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const pRead = p => { if (!p.blocks && p.read) return p.read[plang()] || p.read.th || p.read.en || 3; const t = pBlocks(p).map(b => pText(b.html || b.items?.map(i => i.q + ' ' + i.a).join(' '))).join(' '); return Math.max(2, Math.round(plang() === 'th' ? t.replace(/\s/g, '').length / 600 : t.split(' ').length / 220)); };
const pDate = s => { const d = new Date(s + 'T00:00:00'); return LANG === 'en' ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : `${d.getDate()} ${['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][d.getMonth()]} ${d.getFullYear() + 543}`; };
const pUrl = p => '#/blog/' + encodeURIComponent(p.slug[plang()] || p.slug.th || p.slug.en);
const pBySlug = s => POSTS.find(p => p.slug.th === s || p.slug.en === s);
window.pFallbackImg = i => { const L = FLEET.filter(b => bimg(b.slug, 'a')); return bimg(L[(i * 7) % L.length].slug, i % 2 ? 'b' : 'a'); };
const pImg = (p, cls = '', eager) => `<img src="${p.cover || pFallbackImg(p.id)}" alt="${esc(pT(p, 'title'))}" ${eager ? '' : 'loading="lazy"'} class="${cls}" data-pid="${p.id}" onerror="if(!this.dataset.fb){this.dataset.fb=1;if(window.pFallbackImg)this.src=pFallbackImg(${p.id})}"/>`;
function postsVisible() { return POSTS.filter(p => pHas(p) || pHas(p, plang() === 'en' ? 'th' : 'en')).sort((a, b) => b.date.localeCompare(a.date)); }
function postCard(p, big) {
  const c = BCAT[p.cat] || BCAT.guide;
  return big ? `<a href="${pUrl(p)}" class="group grid lg:grid-cols-[1.25fr_1fr] gap-6 lg:gap-10 items-center">
      <div class="relative aspect-[16/10] overflow-hidden rounded-[22px] bg-sand">${pImg(p, 'absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition duration-700', true)}</div>
      <div><p class="text-[11px] uppercase tracking-[.18em] text-maroon">${L('บทความล่าสุด', 'Latest')} · ${c[plang()]}</p><h2 class="font-display text-2xl sm:text-[32px] leading-tight text-ink mt-3 group-hover:text-maroon transition">${esc(pT(p, 'title'))}</h2>
        <p class="text-muted mt-4 leading-relaxed line-clamp-3">${esc(pT(p, 'excerpt'))}</p><p class="text-xs text-muted mt-5 flex items-center gap-3"><span>${pDate(p.date)}</span><span class="w-1 h-1 rounded-full bg-sand-200"></span><span>${L(`อ่าน ${pRead(p)} นาที`, `${pRead(p)} min read`)}</span></p>
        <span class="inline-flex items-center gap-1.5 mt-6 text-sm text-maroon">${L('อ่านต่อ', 'Read article')} <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition"></i></span></div></a>`
    : `<a href="${pUrl(p)}" class="group block"><div class="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-sand">${pImg(p, 'absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700')}<span class="absolute left-3 top-3 text-[11px] px-2.5 py-1 rounded-full bg-white/90 text-ink">${c[plang()]}</span></div>
      <h3 class="font-medium text-[17px] leading-snug text-ink mt-4 line-clamp-2 group-hover:text-maroon transition">${esc(pT(p, 'title'))}</h3><p class="text-sm text-muted mt-2 line-clamp-2">${esc(pT(p, 'excerpt'))}</p>
      <p class="text-xs text-muted mt-3">${pDate(p.date)} · ${L(`${pRead(p)} นาที`, `${pRead(p)} min`)}</p></a>`;
}
function renderBlog() {
  const v = $('#view-blog'), all = postsVisible(), q = BL.q.toLowerCase();
  const list = all.filter(p => (!BL.cat || p.cat === BL.cat) && (!q || (pT(p, 'title') + ' ' + pT(p, 'excerpt') + ' ' + (p.kw.th || '') + ' ' + (p.kw.en || '')).toLowerCase().includes(q)));
  const feat = !BL.cat && !q ? list[0] : null, rest = feat ? list.slice(1) : list, shown = rest.slice(0, BL.shown - (feat ? 1 : 0));
  const cnt = k => all.filter(p => p.cat === k).length;
  v.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-8 lg:pt-10">
      <nav aria-label="Breadcrumb" class="text-xs text-muted flex items-center gap-1.5"><a href="#/" class="hover:text-maroon">${t('home')}</a><i data-lucide="chevron-right" class="w-3 h-3"></i><span class="text-ink" aria-current="page">${L('บทความ', 'Blog')}</span></nav>
      <div class="mt-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><h1 class="font-display text-3xl sm:text-4xl leading-tight">${L('บทความ & คู่มือเช่าเรือ', 'Guides & stories from the Andaman')}</h1><p class="text-sm text-muted mt-2 max-w-2xl">${L(`เคล็ดลับเช่าเรือยอชต์ภูเก็ต เส้นทางเกาะ และไอเดียทริป ${all.length} บทความจากทีมงานของเรา`, `${all.length} articles on chartering in Phuket, island routes and trip ideas from our team`)}</p></div>
        <label class="flex items-center gap-2 h-11 px-4 rounded-full ring-1 ring-sand-200 bg-white md:w-80 focus-within:ring-maroon/40"><i data-lucide="search" class="w-4 h-4 text-muted"></i><input id="blogQ" class="bg-transparent w-full text-sm outline-none" placeholder="${L('ค้นหาบทความ…', 'Search articles…')}" value="${esc(BL.q)}"/></label>
      </div>
      <div class="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">${[['', L('ทั้งหมด', 'All'), all.length, 'layout-grid'], ...Object.entries(BCAT).filter(([k]) => cnt(k)).map(([k, c]) => [k, c[plang()], cnt(k), c.icon])].map(([k, l, n, ic]) => `<button class="blog-chip ${BL.cat === k ? 'is-on' : ''}" onclick="BL.cat='${k}';BL.shown=13;renderBlog()"><i data-lucide="${ic}" class="w-4 h-4" stroke-width="1.5"></i>${l}<span class="opacity-50 tabular-nums">${n}</span></button>`).join('')}</div>
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16 lg:pb-20">
      ${feat ? `<div class="pb-10 mb-10 border-b border-sand-200">${postCard(feat, true)}</div>` : ''}
      ${q || BL.cat ? `<p class="text-sm text-muted mb-5">${L('พบ', 'Found')} ${list.length} ${L('บทความ', 'articles')}${q ? ` · “${esc(BL.q)}”` : ''} <button class="underline text-maroon ml-2" onclick="BL.cat='';BL.q='';renderBlog()">${L('ล้าง', 'Clear')}</button></p>` : ''}
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">${shown.map(p => postCard(p)).join('') || `<p class="text-muted col-span-full py-16 text-center">${L('ไม่พบบทความ', 'No articles found')}</p>`}</div>
      ${rest.length > shown.length ? `<div class="mt-12 text-center"><button class="h-11 px-6 rounded-full ring-1 ring-sand-200 hover:ring-maroon/40 text-sm inline-flex items-center gap-2" onclick="BL.shown+=12;renderBlog()">${L('ดูบทความเพิ่ม', 'Load more')} <span class="text-muted">${shown.length}/${rest.length}</span></button></div>` : ''}
    </section>`;
  const qi = $('#blogQ'); qi.oninput = () => { clearTimeout(qi._t); qi._t = setTimeout(() => { BL.q = qi.value; BL.shown = 13; renderBlog(); const n = $('#blogQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); };
  icons();
}
/* ---------- article ---------- */
function postBlock(b, i) {
  switch (b.t) {
    case 'p': return /<(ul|ol|div|table|p)\b/i.test(b.html) ? b.html : `<p>${b.html}</p>`;
    case 'h': return `<h${b.lv} id="s-${i}">${b.html}</h${b.lv}>`;
    case 'quote': return `<blockquote>${b.html}</blockquote>`;
    case 'hr': return '<hr/>';
    case 'img': return `<figure style="width:${b.w || 100}%" class="${b.align === 'c' ? 'mx-auto' : ''}"><img src="${b.src}" alt="${esc(b.alt || '')}" loading="lazy" onerror="this.closest('figure').remove()"/>${b.cap ? `<figcaption>${b.cap}</figcaption>` : ''}</figure>`;
    case 'faq': return `<section class="post-faq" id="s-${i}">${b.title ? `<h2>${b.title}</h2>` : ''}${b.items.map((x, n) => `<details ${n ? '' : 'open'}><summary>${x.q}<i data-lucide="plus" class="w-4 h-4 shrink-0"></i></summary><div>${x.a}</div></details>`).join('')}</section>`;
    case 'grid': return `<div class="post-grid" style="grid-template-columns:repeat(${b.cols},1fr);grid-auto-rows:${b.rowH}px;gap:${b.gap}px">${b.cells.filter(c => c.src).map(c => `<img src="${c.src}" loading="lazy" style="grid-column:span ${c.cs};grid-row:span ${c.rs}"/>`).join('')}</div>`;
    case 'boat': { const x = bySlug(b.slug); return x ? miniBoat(x) : ''; }
    case 'btn': return `<p style="text-align:${{ l: 'left', c: 'center', r: 'right' }[b.align] || 'center'}"><a href="#/fleet" class="post-btn">${esc(b.label)}</a></p>`;
    case 'space': return `<div style="height:${b.h}px"></div>`;
  }
  return '';
}
const miniBoat = b => `<a href="#/boat/${b.slug}" class="post-boat"><img src="${bimg(b.slug, 'a')}" alt="${esc(niceTitle(b.title))}" loading="lazy"/><span class="min-w-0"><b>${niceTitle(b.title)}</b><small>${typeLabel(b.type)} · ${b.pax || '-'} ${t('guests')}</small><em>${t('price.from', 'เริ่มต้น')} ${b.from_ ? baht(b.from_) : '—'}</em></span><i data-lucide="arrow-right" class="w-4 h-4 shrink-0 text-maroon"></i></a>`;
const PLACE_KW = [['phi phi', 'พีพี'], ['phang nga', 'พังงา', 'james bond', 'เจมส์บอนด์'], ['racha', 'ราชา'], ['coral', 'เฮ', 'คอรัล'], ['khai', 'เกาะไข่'], ['maiton', 'ไม้ท่อน'], ['similan', 'สิมิลัน'], ['krabi', 'กระบี่', 'hong', 'ห้อง'], ['sunset', 'ซันเซ็ต', 'พระอาทิตย์ตก']];
function relatedBoats(p) {
  const text = (pT(p, 'title') + ' ' + p.title.en + ' ' + p.title.th).toLowerCase(), hit = PLACE_KW.find(g => g.some(w => text.includes(w)));
  const route = hit ? hit[0] : null; let L = [];
  if (route) L = FLEET.filter(b => b.tables.some(t => t.rows.some(r => (r[0] || '').toLowerCase().includes(route.split(' ')[0]))));
  if (/catamaran|คาตามารัน/.test(text)) L = FLEET.filter(b => b.type === 'sail' || b.type === 'power');
  if (/speed|สปีด/.test(text)) L = FLEET.filter(b => b.type === 'speed');
  if (/party|ปาร์ตี้|corporate|บริษัท|wedding|งานแต่ง/.test(text)) L = FLEET.filter(b => (b.pax || 0) >= 25);
  if (!L.length) L = FEATURED.map(bySlug).filter(Boolean);
  return { list: L.filter(b => b.from_).sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.from_ - b.from_).slice(0, 3), route: hit ? (LANG === 'en' ? hit[0].replace(/\b\w/g, c => c.toUpperCase()) : hit[1]) : null };
}
function renderPost(slug) {
  const v = $('#view-blog'), p = pBySlug(slug);
  if (!p) { v.innerHTML = `<div class="max-w-3xl mx-auto px-4 py-32 text-center"><p class="text-xl font-medium">${L('ไม่พบบทความนี้', 'Article not found')}</p><a href="#/blog" class="inline-block mt-6 bg-maroon text-white px-6 py-3 rounded-full">${L('ดูบทความทั้งหมด', 'All articles')}</a></div>`; return; }
  if (!p.blocks) {
    v.innerHTML = `<div class="max-w-3xl mx-auto px-4 py-32 text-center text-muted">${L('กำลังโหลด…', 'Loading…')}</div>`;
    fetch('/api/site/post?id=' + p.id).then(r => r.json()).then(j => { if (j && j.blocks) { Object.assign(p, j); if (VH.hash.startsWith('#/blog/')) renderPost(slug); } });
    return;
  }
  const k = plang(), miss = !pHas(p, k), B = pBlocks(p), c = BCAT[p.cat] || BCAT.guide;
  const toc = B.map((b, i) => (b.t === 'h' && b.lv === 2) || (b.t === 'faq' && b.title) ? [i, pText(b.html || b.title)] : null).filter(Boolean);
  const rel = POSTS.filter(x => x !== p && x.cat === p.cat).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3), rb = relatedBoats(p);
  const share = encodeURIComponent(SITE + (k === 'en' ? '/en' : '') + '/blog/' + (p.slug[k] || p.slug.th));
  v.innerHTML = `
    <article itemscope itemtype="https://schema.org/BlogPosting">
    <section class="max-w-4xl mx-auto px-4 sm:px-6 pt-8 lg:pt-10">
      <nav aria-label="Breadcrumb" class="text-xs text-muted flex items-center gap-1.5 min-w-0"><a href="#/" class="hover:text-maroon shrink-0">${t('home')}</a><i data-lucide="chevron-right" class="w-3 h-3 shrink-0"></i><a href="#/blog" class="hover:text-maroon shrink-0">${L('บทความ', 'Blog')}</a><i data-lucide="chevron-right" class="w-3 h-3 shrink-0"></i><span class="text-ink truncate" aria-current="page">${esc(pT(p, 'title'))}</span></nav>
      <button onclick="BL.cat='${p.cat}';location.hash='#/blog'" class="mt-6 text-[11px] uppercase tracking-[.18em] text-maroon">${c[k]}</button>
      <h1 class="font-display text-[28px] sm:text-[40px] leading-[1.15] text-ink mt-3" itemprop="headline">${esc(pT(p, 'title'))}</h1>
      <p class="text-muted text-[15px] sm:text-lg mt-4 leading-relaxed">${esc(pT(p, 'excerpt'))}</p>
      <div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted"><span class="flex items-center gap-2"><img src="data:image/png;base64,LOGON_B64" alt="" class="w-6 h-6 object-contain"/>${L('ทีมงาน Boat Trip Thailand', 'Boat Trip Thailand team')}</span><time datetime="${p.date}" itemprop="datePublished">${pDate(p.date)}</time><span>${L(`อ่าน ${pRead(p)} นาที`, `${pRead(p)} min read`)}</span></div>
      ${miss ? `<p class="mt-5 rounded-xl bg-sand px-4 py-3 text-sm text-muted">${L('บทความนี้มีเฉพาะภาษาอังกฤษ', 'This article is available in Thai only')}</p>` : ''}
    </section>
    <figure class="max-w-6xl mx-auto px-4 sm:px-6 mt-8"><div class="relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden rounded-[22px] bg-sand">${pImg(p, 'absolute inset-0 w-full h-full object-cover', true)}</div></figure>
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10 lg:gap-14 items-start">
      <div class="min-w-0">
        ${toc.length > 2 ? `<details class="lg:hidden mb-8 rounded-[16px] ring-1 ring-sand-200 px-4 py-3"><summary class="text-sm font-medium cursor-pointer">${L('สารบัญ', 'Contents')}</summary><ol class="post-toc mt-3">${toc.map(([i, l]) => `<li><a href="javascript:void 0" onclick="document.getElementById('s-${i}').scrollIntoView({behavior:'smooth',block:'start'})">${esc(l)}</a></li>`).join('')}</ol></details>` : ''}
        <div class="post-body" itemprop="articleBody">${B.map(postBlock).join('')}</div>
        <div class="mt-12 rounded-[22px] p-6 sm:p-8 text-white relative overflow-hidden" style="background:radial-gradient(120% 120% at 0% 0%,#8a1a26,#3a0007)">
          <p class="text-[11px] uppercase tracking-[.18em] text-white/70">${L('พร้อมออกทะเลแล้วหรือยัง', 'Ready to set sail?')}</p>
          <p class="font-display text-2xl sm:text-[28px] leading-tight mt-2">${rb.route ? L(`เช่าเรือส่วนตัวไป${rb.route}`, `Private boats to ${rb.route}`) : L('เช่าเรือยอชต์ส่วนตัวในภูเก็ต', 'Charter a private yacht in Phuket')}</p>
          <p class="text-white/75 text-sm mt-2 max-w-lg">${L('บอกวันที่และจำนวนคน ทีมงานจะแนะนำเรือที่เหมาะและส่งใบเสนอราคาให้ภายในไม่กี่ชั่วโมง', 'Tell us your date and group size — we will suggest the right boat and send a quote within hours.')}</p>
          <div class="mt-5 flex flex-wrap gap-2"><button onclick="openBooking()" class="h-11 px-6 rounded-full bg-white text-ink text-sm">${L('ขอใบเสนอราคา', 'Get a quote')}</button><a href="#/fleet" class="h-11 px-6 rounded-full ring-1 ring-white/50 text-sm inline-flex items-center">${L('ดูเรือทั้งหมด', 'Browse boats')}</a></div></div>
        <div class="mt-8 flex flex-wrap items-center gap-2 text-sm"><span class="text-muted mr-1">${L('แชร์', 'Share')}</span>
          <a class="post-share" target="_blank" rel="noopener" href="https://social-plugins.line.me/lineit/share?url=${share}" aria-label="LINE"><i data-lucide="message-circle" class="w-4 h-4"></i></a><a class="post-share" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${share}" aria-label="Facebook"><i data-lucide="facebook" class="w-4 h-4"></i></a><a class="post-share" target="_blank" rel="noopener" href="https://wa.me/?text=${share}" aria-label="WhatsApp"><i data-lucide="phone" class="w-4 h-4"></i></a><button class="post-share" onclick="navigator.clipboard?.writeText(decodeURIComponent('${share}'));toast(L('คัดลอกลิงก์แล้ว','Link copied'))" aria-label="Copy link"><i data-lucide="link" class="w-4 h-4"></i></button></div>
      </div>
      <aside class="lg:sticky lg:top-24 grid gap-6">
        ${toc.length > 2 ? `<div class="hidden lg:block"><p class="text-[11px] uppercase tracking-[.18em] text-muted mb-3">${L('สารบัญ', 'Contents')}</p><ol class="post-toc" id="postToc">${toc.map(([i, l]) => `<li><a href="javascript:void 0" data-s="s-${i}" onclick="document.getElementById('s-${i}').scrollIntoView({behavior:'smooth',block:'start'})">${esc(l)}</a></li>`).join('')}</ol></div>` : ''}
        <div class="rounded-[18px] ring-1 ring-sand-200 p-4"><p class="text-sm font-medium mb-3">${rb.route ? L(`เรือที่ไป${rb.route}`, `Boats to ${rb.route}`) : L('เรือแนะนำ', 'Recommended boats')}</p><div class="grid gap-2">${rb.list.map(miniBoat).join('')}</div></div>
      </aside>
    </section>
    </article>
    ${rel.length ? `<section class="bg-sand py-14 lg:py-16"><div class="max-w-7xl mx-auto px-4 sm:px-6"><div class="flex items-end justify-between gap-4 mb-8"><h2 class="font-display text-2xl sm:text-3xl">${L('บทความที่เกี่ยวข้อง', 'Related articles')}</h2><a href="#/blog" class="text-sm text-maroon inline-flex items-center gap-1">${L('ดูทั้งหมด', 'View all')}<i data-lucide="arrow-right" class="w-4 h-4"></i></a></div><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${rel.map(x => postCard(x)).join('')}</div></div></section>` : ''}`;
  /* active TOC item while scrolling */
  const links = $$('#postToc a'); if (links.length && 'IntersectionObserver' in window) { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.dataset.s === e.target.id)); }), { rootMargin: '-20% 0px -70% 0px' }); links.forEach(a => { const el = document.getElementById(a.dataset.s); el && io.observe(el); }); }
  if (typeof track === 'function') track('ViewContent', { content_ids: [p.slug.en || p.slug.th], content_type: 'article', content_category: p.cat });
  icons(); seoPost(p);
}
function seoPost(p) {
  const k = plang(), title = p.seoT[k] || `${pT(p, 'title')} | Boat Trip Thailand`, desc = p.seoD[k] || pT(p, 'excerpt'), path = (k === 'en' ? '/en' : '') + '/blog/' + (p.slug[k] || p.slug.th);
  document.title = title; setMeta('description', desc); setMeta('og:title', title, 'property'); setMeta('og:description', desc, 'property'); setMeta('og:type', 'article', 'property'); setMeta('og:url', SITE + path, 'property'); if (p.cover) setMeta('og:image', p.cover, 'property');
  setMeta('robots', 'index, follow, max-image-preview:large'); $('#canonical').href = SITE + path;
  const faq = pBlocks(p).filter(b => b.t === 'faq').flatMap(b => b.items);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BlogPosting', headline: pT(p, 'title'), description: desc, image: p.cover, datePublished: p.date, dateModified: p.date, inLanguage: k, mainEntityOfPage: SITE + path, author: { '@type': 'Organization', name: 'Boat Trip Thailand', url: SITE + '/' }, publisher: { '@type': 'Organization', name: 'Boat Trip Thailand', logo: { '@type': 'ImageObject', url: SITE + '/logo.png' } } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: t('home'), item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: L('บทความ', 'Blog'), item: SITE + (k === 'en' ? '/en' : '') + '/blog' }, { '@type': 'ListItem', position: 3, name: pT(p, 'title'), item: SITE + path }] },
    ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map(x => ({ '@type': 'Question', name: pText(x.q), acceptedAnswer: { '@type': 'Answer', text: pText(x.a) } })) }] : []) ] };
  $('#ldjson').textContent = JSON.stringify(ld);
}
function seoBlog() { const k = plang(), title = L('บทความ คู่มือเช่าเรือยอชต์ภูเก็ต & เส้นทางเกาะ | Boat Trip Thailand', 'Phuket Yacht Charter Guides & Island Routes | Boat Trip Thailand'); document.title = title; setMeta('description', L('รวมบทความเช่าเรือยอชต์ภูเก็ต ราคา เส้นทางเกาะ ช่วงเวลาที่ดีที่สุด และไอเดียจัดทริปบนเรือ', 'Phuket yacht charter guides: prices, island routes, best time to go and ideas for your day at sea.')); setMeta('og:title', title, 'property'); $('#canonical').href = SITE + (k === 'en' ? '/en' : '') + '/blog'; setMeta('robots', BL.q ? 'noindex, follow' : 'index, follow'); }
/* home: latest articles strip */
function renderHomeBlog() {
  const el = $('#homeBlog'); if (!el) return; const L3 = postsVisible().slice(0, 3); if (!L3.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-20"><div class="flex items-end justify-between gap-4 mb-8"><div><p class="text-xs uppercase tracking-[.2em] text-maroon">${L('บทความ', 'From the blog')}</p><h2 class="font-display text-2xl sm:text-3xl text-ink mt-2">${L('คู่มือ & ไอเดียทริปทะเล', 'Guides & trip ideas')}</h2></div><a href="#/blog" class="text-sm text-maroon inline-flex items-center gap-1 shrink-0">${L(`ดูทั้งหมด ${postsVisible().length} บทความ`, `All ${postsVisible().length} articles`)}<i data-lucide="arrow-right" class="w-4 h-4"></i></a></div><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${L3.map(p => postCard(p)).join('')}</div></div>`;
  icons();
}
