/* =========================================================
   DESTINATIONS (#/dest/:slug) + 404 — same visual language as the fleet/about pages
   content: window.DEST_PAGES (server, src/lib/destinations.ts)
   ========================================================= */
const DPAGES = window.DEST_PAGES || [];
const DEST_KEY = { 'phi-phi': 'Phi Phi', 'phang-nga-bay': 'Phang Nga', 'racha-island': 'Racha', 'khai-island': 'Khai' };
const destSlugOf = name => Object.keys(DEST_KEY).find(k => name.toLowerCase().startsWith(DEST_KEY[k].toLowerCase())) || '';
const destBoats = slug => { const key = (DEST_KEY[slug] || '').toLowerCase(), d = DPAGES.find(x => x.slug === slug), re = d && d.match ? new RegExp(d.match, 'i') : null;
  return FLEET.filter(b => (key && b.dest.some(x => x.toLowerCase().startsWith(key))) || (re && b.tables.some(tb => tb.rows.some(r => re.test(r[0]))))); };
const dl = o => (o ? o[LANG === 'en' ? 'en' : 'th'] : '');

function renderDestIndex() {
  const v = $('#view-dest');
  v.innerHTML = `
  <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-8 lg:pt-10 pb-14 lg:pb-20">
    <nav aria-label="Breadcrumb" class="text-xs text-muted flex items-center gap-1.5"><a href="#/" class="hover:text-maroon">${t('home')}</a><i data-lucide="chevron-right" class="w-3 h-3"></i><span class="text-ink" aria-current="page">${L('จุดหมาย', 'Destinations')}</span></nav>
    <p class="text-[11px] uppercase tracking-[.28em] text-muted mt-8">Island Hopping</p>
    <h1 class="font-display text-3xl sm:text-4xl leading-tight mt-3">${L('เช่าเรือไปเกาะไหนดี', 'Where to go by private boat')}</h1>
    <div class="grid sm:grid-cols-2 gap-5 mt-8">${DPAGES.map(d => { const bs = destBoats(d.slug), from = Math.min(...bs.filter(b => b.from_).map(b => b.from_));
      return `<a href="#/dest/${d.slug}" class="group relative block aspect-[16/10] rounded-[18px] overflow-hidden img-fallback">
        <img src="${d.hero}" alt="${dl(d.name)}" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"/>
        <span class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"></span>
        <span class="absolute inset-x-0 bottom-0 p-6 text-white"><span class="block font-display text-2xl leading-tight">${dl(d.name)}</span>
          <span class="block text-xs text-white/80 mt-1">${bs.length ? `${L('เริ่ม', 'from')} ${baht(from)} · ${bs.length} ${L('ลำ', 'boats')}` : ''}</span></span>
      </a>`; }).join('')}</div>
  </section>`;
  document.title = L('จุดหมายเช่าเรือจากภูเก็ต พีพี อ่าวพังงา ราชา เกาะไข่ | Boat Trip Thailand', 'Phuket Boat Trip Destinations – Phi Phi, Phang Nga, Racha, Khai | Boat Trip Thailand');
  setMeta('description', L('เลือกจุดหมายเช่าเรือส่วนตัวจากภูเก็ต ทั้งเกาะพีพี อ่าวพังงา เกาะราชา และเกาะไข่ พร้อมเรือและราคาตามฤดูกาล', 'Choose a private boat destination from Phuket — Phi Phi, Phang Nga Bay, Racha and Khai islands — with boats and seasonal prices.'));
  $('#canonical').href = SITE_ORIGIN + hashToPath('#/destinations');
  icons();
}

function renderDest(slug) {
  const v = $('#view-dest'), d = DPAGES.find(x => x.slug === slug);
  if (!d) return renderNotFound();
  const k = LANG === 'en' ? 'en' : 'th', bs = destBoats(slug), from = bs.length ? Math.min(...bs.filter(b => b.from_).map(b => b.from_)) : 0;
  const title = k === 'en' ? `${d.name.en} private boat charter` : `เช่าเรือไป${d.name.th}`;
  v.innerHTML = `
  <section class="relative overflow-hidden on-dark bg-ink">
    <img src="${d.hero}" alt="" class="absolute inset-0 w-full h-full object-cover"/>
    <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" aria-hidden="true"></div>
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16 lg:pb-24 text-white">
      <nav aria-label="Breadcrumb" class="text-xs text-white/75 flex items-center gap-1.5"><a href="#/" class="hover:text-white">${t('home')}</a><i data-lucide="chevron-right" class="w-3 h-3"></i><a href="#/destinations" class="hover:text-white">${L('จุดหมาย', 'Destinations')}</a><i data-lucide="chevron-right" class="w-3 h-3"></i><span class="text-white" aria-current="page">${d.name[k]}</span></nav>
      <p class="text-[11px] uppercase tracking-[.28em] text-white/75 mt-16">Island Hopping · Phuket</p>
      <h1 class="font-display text-3xl sm:text-5xl leading-tight mt-3 max-w-3xl">${title}</h1>
      <p class="mt-4 text-sm text-white/85 max-w-xl leading-relaxed">${d.intro[k]}</p>
      <div class="mt-7 flex flex-wrap items-center gap-3">
        <button onclick="openBooking()" class="inline-flex items-center gap-2 h-11 px-6 bg-white text-ink hover:bg-white/90 transition text-[13px]">${L('ขอใบเสนอราคา', 'Get a quote')}<i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></button>
        ${bs.length ? `<span class="text-sm text-white/85">${L('เริ่มต้น', 'From')} <b class="text-lg">${baht(from)}</b> · ${bs.length} ${L('ลำ', 'boats')}</span>` : ''}
      </div>
    </div>
  </section>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 grid lg:grid-cols-[1fr_360px] gap-10">
    <div class="min-w-0">
      <dl class="grid grid-cols-2 gap-3">${d.facts[k].map(([a, b]) => `<div class="bg-sand p-4"><dt class="text-[11px] uppercase tracking-[.16em] text-muted">${a}</dt><dd class="mt-1.5 text-md">${b}</dd></div>`).join('')}</dl>
      <p class="text-[11px] uppercase tracking-[.28em] text-muted mt-12">Highlights</p>
      <h2 class="font-display text-2xl sm:text-3xl text-ink mt-3">${L('ไฮไลต์', 'Highlights')}</h2>
      <ul class="mt-6 divide-y divide-sand-200 border-y border-sand-200">${d.highlights[k].map(([a, b], i) => `<li class="py-4 flex gap-5"><span class="font-display text-maroon text-lg w-6 shrink-0">${String(i + 1).padStart(2, '0')}</span><div><p class="font-medium">${a}</p><p class="text-muted mt-1">${b}</p></div></li>`).join('')}</ul>
      <h2 class="font-display text-2xl sm:text-3xl text-ink mt-12">${L('คำแนะนำจากทีมงาน', 'Tips from our team')}</h2>
      <ul class="mt-5 space-y-3">${d.tips[k].map(x => `<li class="flex gap-3"><i data-lucide="check" class="w-4 h-4 text-maroon shrink-0 mt-0.5"></i><span>${x}</span></li>`).join('')}</ul>
      <h2 class="font-display text-2xl sm:text-3xl text-ink mt-12">${t('faqTitle', L('คำถามที่พบบ่อย', 'FAQ'))}</h2>
      <div class="mt-5 bg-sand px-5">${d.faq[k].map(([q, a], i) => `<details class="border-b border-sand-200 last:border-0" ${i ? '' : 'open'}><summary class="py-4 font-medium flex justify-between gap-4 cursor-pointer list-none">${q}<i data-lucide="plus" class="w-4 h-4 text-maroon shrink-0"></i></summary><p class="pb-4 text-muted">${a}</p></details>`).join('')}</div>
    </div>
    <aside class="lg:sticky lg:top-24 self-start bg-white rounded-xl p-6 shadow-float ring-1 ring-sand-200" id="destForm"></aside>
  </section>
  ${bs.length ? `<section class="max-w-7xl mx-auto px-4 sm:px-6 pb-14 lg:pb-20">
    <p class="text-lagoon-600 font-medium text-sm tracking-wider uppercase">Our Fleet</p>
    <h2 class="font-display font-medium text-2xl sm:text-3xl text-ink mt-2">${L(`เรือที่มีโปรแกรมไป${d.name.th}`, `Boats with ${d.name.en} programs`)}</h2>
    <div class="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">${bs.slice(0, 12).map((b, i) => boatCard(b, i)).join('')}</div>
  </section>` : ''}`;
  buildForm($('#destForm'));
  document.title = d.seoTitle[k]; setMeta('description', d.seoDesc[k]);
  setMeta('og:title', d.seoTitle[k], 'property'); setMeta('og:description', d.seoDesc[k], 'property'); setMeta('og:image', SITE_ORIGIN + d.hero, 'property');
  $('#canonical').href = SITE_ORIGIN + hashToPath('#/dest/' + slug);
  $('#ldjson').textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'TouristTrip', name: d.name[k], description: d.seoDesc[k], touristType: 'Private boat charter', provider: { '@type': 'TravelAgency', name: 'Boat Trip Thailand' }, ...(from ? { offers: { '@type': 'AggregateOffer', priceCurrency: 'THB', lowPrice: from, offerCount: bs.length } } : {}) },
    { '@type': 'FAQPage', mainEntity: d.faq[k].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: t('home'), item: SITE_ORIGIN + hashToPath('#/') }, { '@type': 'ListItem', position: 2, name: L('จุดหมาย', 'Destinations'), item: SITE_ORIGIN + hashToPath('#/destinations') }, { '@type': 'ListItem', position: 3, name: d.name[k], item: SITE_ORIGIN + hashToPath('#/dest/' + slug) }] },
  ] });
  icons();
}

function renderNotFound() {
  $('#view-nf').innerHTML = `<section class="max-w-3xl mx-auto px-4 py-32 text-center">
    <p class="text-[11px] uppercase tracking-[.28em] text-muted">404</p>
    <h1 class="font-display text-3xl sm:text-4xl mt-3">${L('ไม่พบหน้านี้', 'Page not found')}</h1>
    <p class="text-muted mt-3">${L('หน้าที่คุณหาอาจถูกย้ายหรือลบไปแล้ว', 'The page you are looking for may have moved.')}</p>
    <div class="mt-8 flex justify-center gap-3"><a href="#/" class="inline-flex items-center h-11 px-6 bg-maroon text-white text-[13px]">${t('home')}</a><a href="#/fleet" class="inline-flex items-center h-11 px-6 ring-1 ring-sand-200 text-[13px] hover:ring-maroon">${t('fleet')}</a></div>
  </section>`;
  document.title = L('ไม่พบหน้านี้ | Boat Trip Thailand', 'Page not found | Boat Trip Thailand');
  setMeta('robots', 'noindex, follow');
  icons();
}
