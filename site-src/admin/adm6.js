/* =====================================================================
   SEO CENTER – audit, meta manager, keywords, redirects, schema,
   sitemap & robots, global settings. Works on the real TH/EN data above.
   ===================================================================== */
const thLen = s => String(s || '').replace(/[ัิ-ฺ็-๎]/g, '').length; /* Thai marks take no width */
const SITE = 'boattripthailand.com';
const SX = {}; /* per-page overrides: robots, canonical, og, schema */
const sx = id => SX[id] ??= { index: true, follow: true, canon: '', ogT: tr(), schema: '' };
const STATIC_SEO = {
  fleet: { t: tr('เช่าเรือยอชต์ภูเก็ต 70 ลำ เทียบราคา เลือกเรือ | Boat Trip Thailand', 'Phuket Yacht Charter – Compare 70 Boats | Boat Trip Thailand'), d: tr('รวมเรือยอชต์ คาตามารัน สปีดโบ๊ท ให้เช่าในภูเก็ต กรองตามจำนวนคน งบ และเส้นทาง พร้อมราคาเริ่มต้นทุกลำ', 'Browse yachts, catamarans and speedboats for charter in Phuket. Filter by group size, budget and route with starting prices for every boat.') },
  activities: { t: tr('กิจกรรม ทัวร์ และโชว์ในภูเก็ต | Boat Trip Thailand', ''), d: tr('รวมกิจกรรม ทัวร์ทะเล และโชว์ในภูเก็ต จองพร้อมเช่าเรือได้ในที่เดียว', '') },
  blog: { t: tr('บทความ คู่มือเช่าเรือ และเส้นทางเกาะ | Boat Trip Thailand', 'Boat Trip Guides & Island Routes | Boat Trip Thailand'), d: tr('คู่มือเช่าเรือยอชต์ภูเก็ต เส้นทางเกาะ และไอเดียจัดงานบนเรือ', 'Phuket yacht charter guides, island routes and ideas for events at sea.') },
  about: { t: tr('เกี่ยวกับเรา | Boat Trip Thailand', 'About Us | Boat Trip Thailand'), d: tr('', '') },
  privacy: { t: tr('นโยบายความเป็นส่วนตัว | Boat Trip Thailand', 'Privacy Policy | Boat Trip Thailand'), d: tr('', '') },
  terms: { t: tr('ข้อกำหนดและเงื่อนไข | Boat Trip Thailand', 'Terms & Conditions | Boat Trip Thailand'), d: tr('', '') },
  cookies: { t: tr('การตั้งค่าคุกกี้ | Boat Trip Thailand', 'Cookie Preferences | Boat Trip Thailand'), d: tr('', '') },
};
['privacy', 'terms', 'cookies'].forEach(k => SX['s-' + k] = { index: false, follow: true, canon: '', ogT: tr(), schema: '' });
const ST = { home: 'หน้าแรก', page: 'หน้าเพจ', boat: 'เรือ', article: 'บทความ', act: 'กิจกรรม' };
function seoPages() {
  const P = [], st = (id, name, path, o, schema) => P.push({ id: 's-' + id, type: id === 'home' ? 'home' : 'page', name, url: tr(path, '/en' + (path === '/' ? '' : path)), t: o.t, d: o.d, schema, go: id === 'home' ? "go('content');WEB.tab='seo';vContent()" : '' });
  st('home', 'หน้าแรก', '/', { t: WEB.seo.title, d: WEB.seo.desc }, 'Organization + WebSite');
  st('fleet', 'เรือทั้งหมด', '/yacht-charter', STATIC_SEO.fleet, 'CollectionPage');
  st('activities', 'กิจกรรม & ทัวร์', '/activities', STATIC_SEO.activities, 'CollectionPage');
  st('blog', 'บทความ', '/blog', STATIC_SEO.blog, 'Blog');
  st('about', 'เกี่ยวกับเรา', '/about-us', STATIC_SEO.about, 'AboutPage');
  st('privacy', 'นโยบายความเป็นส่วนตัว', '/privacy-policy', STATIC_SEO.privacy, 'WebPage');
  st('terms', 'ข้อกำหนดและเงื่อนไข', '/terms-and-conditions', STATIC_SEO.terms, 'WebPage');
  st('cookies', 'การตั้งค่าคุกกี้', '/cookie-preferences', STATIC_SEO.cookies, 'WebPage');
  FLEET.forEach(b => { const i = b.i18n; if (!i) return; P.push({ id: 'b-' + b.slug, type: 'boat', name: b.name, url: tr('/yacht-charter/' + b.slug, '/en/yacht-charter/' + b.slug), t: i.seoTitle, d: i.seoDesc, schema: 'Product + Offer', img: THUMBS[b.slug], go: `boatEdit('${b.slug}');BE.tab='seo';vBoatEdit('${b.slug}')`, hidden: !b.active }); });
  ART.forEach(a => P.push({ id: 'a-' + a.id, type: 'article', name: a.title.th || a.title.en, url: tr(a.slug.th ? '/blog/' + a.slug.th : '', a.slug.en ? '/en/blog/' + a.slug.en : ''), t: a.seoT, d: a.seoD, kw: a.kw, schema: 'BlogPosting', img: THUMBS[a.cover], art: a, go: `go('articles/${a.id}')`, draft: a.status !== 'published' && a.status !== 'scheduled' }));
  ACTS.forEach((x, n) => { x.seo ??= { t: tr(), d: tr() }; const s = slugify(x.en || x.th); P.push({ id: 'x-' + n, type: 'act', name: x.th || x.en, url: tr('/activities/' + s, '/en/activities/' + s), t: x.seo.t, d: x.seo.d, schema: 'TouristTrip', hidden: x.active === false }); });
  return P;
}
/* ---------- audit rules ---------- */
const ISSUE_L = { t_miss: 'ไม่มี Title', t_long: 'Title ยาวเกิน 60 ตัวอักษร', t_short: 'Title สั้นเกินไป', d_miss: 'ไม่มี Meta description', d_long: 'Description ยาวเกิน 160 ตัวอักษร', d_short: 'Description สั้นเกินไป', dup: 'Title ซ้ำกับหน้าอื่น', kw: 'คีย์เวิร์ดหลักไม่อยู่ใน Title', alt: 'รูปไม่มี Alt text', h2: 'ยังไม่มีหัวข้อ H2', link: 'ยังไม่มีลิงก์ไปหน้าเรือ', thin: 'เนื้อหาน้อยเกินไป', hreflang: 'มีแค่ภาษาเดียว (hreflang ไม่ครบคู่)', noindex: 'ตั้งเป็น noindex' };
const LV = { err: ['ต้องแก้', 'low', 'circle-alert'], warn: ['ควรแก้', 'mid', 'triangle-alert'], note: ['แนะนำ', 'ok', 'info'] };
function pageIssues(p, all) {
  const out = [], add = (lv, k, msg, lang) => out.push({ lv, k, msg, lang });
  const s = sx(p.id), langs = p.type === 'article' ? LANGS.filter(([k]) => ['orig', 'ok', 'mt'].includes(p.art.tr[k])) : LANGS;
  if (p.type === 'article' && langs.length < 2) add('warn', 'hreflang', 'มีแค่ภาษาเดียว · hreflang ไม่ครบคู่');
  langs.forEach(([k, C]) => {
    const t = p.t[k] || '', d = p.d[k] || '', tl = thLen(t), dl = thLen(d);
    if (!t.trim()) add('err', 't_miss', `ไม่มี Title`, C); else if (tl > 60) add('warn', 't_long', `Title ยาว ${tl} ตัวอักษร (เกิน 60)`, C); else if (tl < 25) add('note', 't_short', `Title สั้น ${tl} ตัวอักษร`, C);
    if (!d.trim()) add('err', 'd_miss', `ไม่มี Meta description`, C); else if (dl > 160) add('warn', 'd_long', `Description ยาว ${dl} ตัวอักษร (เกิน 160)`, C); else if (dl < 70) add('note', 'd_short', `Description สั้น ${dl} ตัวอักษร`, C);
    if (t.trim() && all && all.some(o => o !== p && (o.t[k] || '').trim() === t.trim())) add('err', 'dup', 'Title ซ้ำกับหน้าอื่น', C);
    if (p.kw && p.kw[k] && t && !t.toLowerCase().includes(p.kw[k].toLowerCase())) add('note', 'kw', `คีย์เวิร์ด “${p.kw[k]}” ไม่อยู่ใน Title`, C);
    if (p.type === 'article') { const B = blocksOf(p.art, k); const miss = B.reduce((n, b) => n + (b.t === 'img' && !b.alt ? 1 : 0) + (b.t === 'grid' ? b.cells.filter(c => c.src && !c.alt).length : 0) + (b.t === 'cols' ? b.cols.filter(c => c.k === 'img' && c.src && !c.alt).length : 0), 0);
      if (miss) add('warn', 'alt', `รูปไม่มี Alt text ${miss} รูป`, C);
      if (!B.some(b => b.t === 'h' && b.lv === 2)) add('note', 'h2', 'ยังไม่มีหัวข้อ H2', C);
      if (!B.some(b => b.t === 'boat') && !p.art.boats.length) add('note', 'link', 'ยังไม่มีลิงก์ไปหน้าเรือ (internal link)', C);
      const len = k === 'th' ? txtOf(p.art.body[k]).replace(/\s/g, '').length : txtOf(p.art.body[k]).split(/\s+/).length;
      if (len < (k === 'th' ? 800 : 300)) add('warn', 'thin', `เนื้อหาน้อย (${len} ${k === 'th' ? 'ตัวอักษร' : 'คำ'})`, C);
    }
  });
  if (!s.index && (p.type === 'boat' || p.type === 'article' || p.type === 'home')) add('warn', 'noindex', 'ตั้งเป็น noindex · Google จะไม่แสดงหน้านี้');
  return out;
}
const scoreOf = iss => Math.max(0, 100 - iss.reduce((n, i) => n + ({ err: 18, warn: 7, note: 2 }[i.lv]), 0));
const scoreCls = s => s >= 85 ? 'ok' : s >= 60 ? 'mid' : 'low';
function auditAll() { const P = seoPages().filter(p => !p.draft && !p.hidden); P.forEach(p => { p.iss = pageIssues(p, P); p.score = scoreOf(p.iss); }); return P; }

/* ---------- sample data (clearly labelled) ---------- */
const GSC = { on: false, days: Array.from({ length: 28 }, (_, i) => Math.round(60 + 25 * Math.sin(i / 3) + i * 2.2 + rnd() * 18)) };
const KW = [
  ['yacht charter phuket', 'en', '/en/', 7, 2], ['เช่าเรือยอชต์ภูเก็ต', 'th', '/', 4, 1], ['phuket yacht charter', 'en', '/en/blog/phuket-yacht-charter-guide', 12, -3],
  ['เช่าเรือภูเก็ต', 'th', '/yacht-charter', 9, 0], ['catamaran charter phuket', 'en', '/en/yacht-charter', 15, 4], ['เกาะใกล้ภูเก็ต', 'th', '/blog/เกาะใกล้ภูเก็ต-1-วัน', 18, 6],
  ['private boat phi phi', 'en', '/en/yacht-charter', 24, -2], ['ทริปเกาะพีพี เรือส่วนตัว', 'th', '/blog/พีพี-หรือ-อ่าวพังงา', null, 0],
].map(([q, l, url, pos, ch]) => ({ q, l, url, pos, ch }));
const REDIR = [
  { from: '/boat/leopard-90-ft/', to: '/yacht-charter/leopard-90-ft', code: 301, hits: 38 },
  { from: '/yacht/splo-74-ft/', to: '/yacht-charter/splo-74-ft', code: 301, hits: 21 },
  { from: '/category/yacht/', to: '/yacht-charter', code: 301, hits: 64 },
  { from: '/contact-us/', to: '/about-us', code: 301, hits: 12 },
];
const LOG404 = [['/boat/vtech-68-ft/', 27], ['/en/boat/cognac-75-ft/', 14], ['/pattaya-yacht-charter/', 31], ['/wp-content/uploads/2023/05/brochure.pdf', 9], ['/tag/phuket/', 6], ['/boat/the-origin-90-ft/?lang=en', 4]].map(([u, h]) => ({ u, h }));
const SCHEMA_ORG = { name: 'Boat Trip Thailand', type: 'TravelAgency', phone: TEAM[0].tel, email: '', street: '', city: 'Phuket', zip: '', lat: '', lng: '', hours: '08:00–20:00', social: ['', '', ''], logo: true, rating: false };
const ROBOTS = { txt: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /*?q=\n\nSitemap: https://${SITE}/sitemap.xml`, ai: { GPTBot: true, ClaudeBot: true, PerplexityBot: true, 'Google-Extended': true, CCBot: false }, llms: true };
const SMAP = { pages: true, boats: true, blog: true, activities: true, images: true, hreflang: true };
const SSET = { sep: '|', site: tr('Boat Trip Thailand', 'Boat Trip Thailand'), tpl: { boat: tr('%name% เช่าเรือภูเก็ต เริ่ม %price% %sep% %site%', '%name% Yacht Charter Phuket from %price% %sep% %site%'), article: tr('%title% %sep% %site%', '%title% %sep% %site%'), act: tr('%name% ภูเก็ต %sep% %site%', '%name% Phuket %sep% %site%') }, gsc: '', bing: '', ga4: '', gtm: '', pixel: '', slash: false, lower: true, canon: true, noSearch: true, crumbs: true };
const SEOV = { tab: 'overview', type: '', issue: '', lang: 'th', q: '', page: 0, prev: 'b-leopard-90-ft' };

/* ---------- main view ---------- */
function vSeo() {
  const tabs = [['overview', 'ภาพรวม', 'gauge'], ['pages', 'Meta ทุกหน้า', 'file-text'], ['keywords', 'คีย์เวิร์ด', 'tag'], ['redirects', 'Redirect & 404', 'shuffle'], ['schema', 'Schema', 'code'], ['sitemap', 'Sitemap & Robots', 'network'], ['settings', 'ตั้งค่า SEO', 'settings-2']];
  const P = auditAll();
  $('#view').innerHTML = `${head('SEO', 'ตรวจและจัดการ SEO ทุกหน้า ทั้งภาษาไทยและอังกฤษ · ปัญหาคำนวณจากข้อมูลจริงในระบบ ตัวเลขจาก Google เป็นตัวอย่าง', `<button class="btn btn-o" onclick="toast('ตรวจทั้งเว็บใหม่แล้ว · ${P.length} หน้า');vSeo()"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>ตรวจใหม่</button>`)}
    <div class="card"><div class="px-3 py-3 flex gap-1 overflow-x-auto no-sb border-b border-line">${tabs.map(([k, l, ic]) => `<button class="tab inline-flex items-center gap-1.5 ${SEOV.tab === k ? 'on' : ''}" onclick="SEOV.tab='${k}';vSeo()"><i data-lucide="${ic}" class="w-3.5 h-3.5"></i>${l}</button>`).join('')}</div>
    <div id="seoBody" class="p-4 sm:p-5 fade">${({ overview: seoOverview, pages: seoPagesTab, keywords: seoKw, redirects: seoRedir, schema: seoSchema, sitemap: seoSitemap, settings: seoSettings })[SEOV.tab](P)}</div></div>`;
  icons();
}
const ring = (v, size = 120) => { const r = size / 2 - 8, c = 2 * Math.PI * r, col = v >= 85 ? '#1e7a46' : v >= 60 ? '#b4501a' : '#a3222c';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="shrink-0"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#f1eaea" stroke-width="8"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c * v / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="50%" text-anchor="middle" dy=".35em" font-size="${size / 4}" fill="#231416" font-family="Jost">${v}</text></svg>`; };

function seoOverview(P) {
  const avg = Math.round(P.reduce((s, p) => s + p.score, 0) / P.length), all = P.flatMap(p => p.iss.map(i => ({ ...i, p })));
  const cnt = lv => all.filter(i => i.lv === lv).length;
  const groups = {}; all.forEach(i => { const g = groups[i.k] ??= { lv: i.lv, msg: ISSUE_L[i.k], n: 0, pages: new Set() }; g.n++; g.pages.add(i.p.id); });
  const top = Object.entries(groups).sort((a, b) => ({ err: 0, warn: 1, note: 2 }[a[1].lv] - { err: 0, warn: 1, note: 2 }[b[1].lv]) || b[1].n - a[1].n);
  const idx = P.filter(p => sx(p.id).index && !p.hidden).length;
  const max = Math.max(...GSC.days), sum = GSC.days.reduce((a, b) => a + b, 0);
  const gsc = GSC.on ? `<div class="flex items-center justify-between"><p class="font-medium">Google Search Console · 28 วัน</p><span class="text-[11px] text-muted">ตัวเลขตัวอย่าง</span></div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">${[['คลิก', sum.toLocaleString()], ['การแสดงผล', (sum * 27).toLocaleString()], ['CTR เฉลี่ย', (100 / 27).toFixed(1) + '%'], ['อันดับเฉลี่ย', '14.2']].map(([l, v]) => `<div><p class="text-[11px] text-muted">${l}</p><p class="text-[20px] font-medium tnum">${v}</p></div>`).join('')}</div>
      <div class="relative mt-4"><div class="flex items-end gap-[2px] h-28 border-b border-line" onmouseleave="$('#gscTip').classList.add('hidden')">${GSC.days.map((v, i) => `<div class="flex-1 h-full flex items-end group cursor-default" onmouseenter="const t=$('#gscTip');t.classList.remove('hidden');t.style.left=(${i}/28*100)+'%';t.innerHTML='${fmtD(iso(addDays(TODAY, i - 27)))} · <b>${v}</b> คลิก'"><div class="w-full rounded-t-[4px] bg-maroon/80 group-hover:bg-maroon" style="height:${v / max * 100}%"></div></div>`).join('')}</div>
        <div id="gscTip" class="hidden absolute -top-7 bg-ink text-white text-[11px] px-2 py-1 rounded-md whitespace-nowrap pointer-events-none"></div>
        <div class="flex justify-between text-[10.5px] text-muted mt-1"><span>${fmtD(iso(addDays(TODAY, -27)))}</span><span>วันนี้</span></div></div>`
    : `<div class="flex flex-col sm:flex-row sm:items-center gap-4"><div class="w-11 h-11 rounded-xl bg-sand grid place-items-center shrink-0"><i data-lucide="plug" class="w-5 h-5 text-maroon"></i></div><div class="flex-1"><p class="font-medium">เชื่อม Google Search Console</p><p class="text-[12px] text-muted mt-0.5">ดูคลิก การแสดงผล อันดับคีย์เวิร์ด และหน้าที่ Google ยังไม่ index</p></div><button class="btn btn-p" onclick="GSC.on=true;vSeo();toast('เชื่อมต่อแล้ว (จำลอง) · แสดงข้อมูลตัวอย่าง')">เชื่อมต่อ</button></div>`;
  return `<div class="grid xl:grid-cols-3 gap-4 items-start">
    <div class="xl:col-span-2 grid gap-4">
      <div class="rounded-2xl ring-1 ring-line p-5 flex flex-col sm:flex-row sm:items-center gap-5">${ring(avg)}
        <div class="flex-1"><p class="text-[17px] font-medium">คะแนน SEO ทั้งเว็บ</p><p class="text-muted text-[12px] mt-0.5">ตรวจ ${P.length} หน้าที่แสดงบนเว็บ (ไม่รวมฉบับร่างและหน้าที่ซ่อน) · ${idx} หน้าเปิดให้ Google index</p>
          <div class="grid grid-cols-3 gap-2 mt-4">${['err', 'warn', 'note'].map(lv => `<button class="rounded-xl bg-sand p-3 text-left hover:ring-1 hover:ring-line" onclick="SEOV.tab='pages';SEOV.issue='${lv}';vSeo()"><span class="lang-b ${LV[lv][1]}">${LV[lv][0]}</span><p class="text-[22px] font-medium tnum mt-1.5">${cnt(lv)}</p></button>`).join('')}</div></div></div>
      <div class="rounded-2xl ring-1 ring-line p-5">${gsc}</div>
      <div class="rounded-2xl ring-1 ring-line"><p class="font-medium px-5 pt-4 pb-2">ปัญหาที่พบ เรียงตามความสำคัญ</p>
        <ul>${top.map(([k, g]) => `<li class="flex items-center gap-3 px-5 py-3 border-t border-line"><i data-lucide="${LV[g.lv][2]}" class="w-4 h-4 shrink-0 ${g.lv === 'err' ? 'text-[#a3222c]' : g.lv === 'warn' ? 'text-[#b4501a]' : 'text-muted'}"></i><span class="flex-1">${g.msg}</span><span class="text-muted text-[12px] tnum whitespace-nowrap">${g.pages.size} หน้า</span><button class="btn btn-g !h-8" onclick="SEOV.tab='pages';SEOV.issue='${k}';vSeo()">ดู<i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></button></li>`).join('') || '<li class="px-5 py-6 text-muted border-t border-line">ไม่พบปัญหา</li>'}</ul></div>
    </div>
    <div class="grid gap-4">
      <div class="rounded-2xl ring-1 ring-line p-5"><p class="font-medium">คะแนนตามประเภทหน้า</p><ul class="mt-3 space-y-3">${Object.entries(ST).map(([t, l]) => { const g = P.filter(p => p.type === t); if (!g.length) return ''; const s = Math.round(g.reduce((a, p) => a + p.score, 0) / g.length); return `<li class="cursor-pointer" onclick="SEOV.tab='pages';SEOV.type='${t}';SEOV.issue='';vSeo()"><div class="flex justify-between text-[12.5px]"><span>${l} <span class="text-muted">· ${g.length}</span></span><span class="tnum">${s}</span></div><div class="mt-1 h-1.5 rounded-full bg-sand overflow-hidden"><div class="h-full rounded-full ${s >= 85 ? 'bg-[#1e7a46]' : s >= 60 ? 'bg-[#b4501a]' : 'bg-[#a3222c]'}" style="width:${s}%"></div></div></li>`; }).join('')}</ul></div>
      <div class="rounded-2xl ring-1 ring-line p-5"><div class="flex justify-between"><p class="font-medium">Core Web Vitals</p><span class="text-[11px] text-muted">ตัวอย่าง</span></div>
        <div class="mt-3 grid gap-2.5">${[['LCP', '2.1 วินาที', 'ok', 'โหลดภาพหลัก'], ['INP', '160 ms', 'ok', 'ตอบสนองการกด'], ['CLS', '0.12', 'mid', 'หน้าขยับระหว่างโหลด']].map(([k, v, c, l]) => `<div class="flex items-center gap-3"><span class="w-10 text-[12px] font-medium">${k}</span><span class="flex-1 text-[12px] text-muted">${l}</span><span class="lang-b ${c}">${v}</span></div>`).join('')}</div>
        <p class="text-[11px] text-muted mt-3">ระบบจริงดึงจาก PageSpeed Insights API ทุกสัปดาห์</p></div>
      <div class="rounded-2xl ring-1 ring-line p-5"><p class="font-medium">ทางลัด</p><div class="grid gap-1 mt-2">${[['redirects', 'shuffle', `404 ที่ยังไม่มี redirect · ${LOG404.length}`], ['sitemap', 'network', 'Sitemap & robots.txt'], ['schema', 'code', 'ข้อมูลธุรกิจ (Schema)']].map(([t, ic, l]) => `<button class="nav-i !h-9" onclick="SEOV.tab='${t}';vSeo()"><i data-lucide="${ic}" class="w-4 h-4"></i>${l}</button>`).join('')}</div></div>
    </div></div>`;
}

function seoPagesTab(P) {
  const k = SEOV.lang;
  let rows = P.filter(p => (!SEOV.type || p.type === SEOV.type) && (!SEOV.q || (p.name + p.url.th + p.url.en).toLowerCase().includes(SEOV.q.toLowerCase())));
  if (SEOV.issue) rows = rows.filter(p => p.iss.some(i => i.lv === SEOV.issue || i.k === SEOV.issue));
  rows.sort((a, b) => a.score - b.score);
  const per = 20, pages = Math.max(1, Math.ceil(rows.length / per)); SEOV.page = Math.min(SEOV.page, pages - 1);
  const view = rows.slice(SEOV.page * per, SEOV.page * per + per);
  const len = (s, max, min) => { const n = thLen(s); return `<span class="lang-b ${!n ? 'low' : n > max ? 'mid' : n < min ? 'mid' : 'ok'} tnum">${n || '—'}</span>`; };
  const issueOpts = [['', 'ทุกสถานะ'], ['err', 'มีจุดต้องแก้'], ['warn', 'มีจุดควรแก้'], ['t_miss', 'ไม่มี Title'], ['t_long', 'Title ยาวเกิน'], ['d_miss', 'ไม่มี Description'], ['d_long', 'Description ยาวเกิน'], ['dup', 'Title ซ้ำ'], ['alt', 'รูปไม่มี Alt'], ['hreflang', 'มีภาษาเดียว'], ['noindex', 'noindex']];
  return `<div class="flex flex-col lg:flex-row lg:items-center gap-2 mb-3">
      <div class="flex gap-1 overflow-x-auto no-sb">${[['', 'ทั้งหมด'], ...Object.entries(ST)].map(([t, l]) => `<button class="tab ${SEOV.type === t ? 'on' : ''}" onclick="SEOV.type='${t}';SEOV.page=0;vSeo()">${l}</button>`).join('')}</div>
      <div class="lg:ml-auto grid grid-cols-1 sm:grid-cols-[1fr_170px_auto] gap-2 items-center">
        <input class="inp" placeholder="ค้นหาหน้า หรือ URL…" value="${esc(SEOV.q)}" onkeydown="if(event.key==='Enter'){SEOV.q=this.value;SEOV.page=0;vSeo()}"/>
        <select class="inp" onchange="SEOV.issue=this.value;SEOV.page=0;vSeo()">${issueOpts.map(([v, l]) => `<option value="${v}" ${SEOV.issue === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <div class="flex p-0.5 rounded-full bg-sand">${LANGS.map(([c, C]) => `<button class="h-8 px-3 rounded-full text-[12px] ${k === c ? 'bg-white shadow-sm' : 'text-muted'}" onclick="SEOV.lang='${c}';vSeo()">${C}</button>`).join('')}</div></div></div>
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl bg-sand p-3 mb-3 text-[12.5px]"><i data-lucide="zap" class="w-4 h-4 text-maroon shrink-0"></i><span class="flex-1">หน้าที่ยังไม่มี Title สร้างให้อัตโนมัติจาก “รูปแบบ Title” ในแท็บตั้งค่าได้ · Description ควรเขียนเองให้น่าคลิก</span><button class="btn btn-o !h-8" onclick="seoBulkTitle()">เติม Title ที่ว่างอัตโนมัติ</button></div>
    <div class="overflow-x-auto rounded-xl ring-1 ring-line"><table class="tbl min-w-[980px]"><thead><tr><th>หน้า</th><th>ประเภท</th><th>Title (${k.toUpperCase()})</th><th class="text-center">ยาว</th><th class="text-center">Desc</th><th>Index</th><th>ปัญหา</th><th class="text-center">คะแนน</th><th></th></tr></thead><tbody>
    ${view.map(p => { const s = sx(p.id), e = p.iss.filter(i => i.lv === 'err').length, w = p.iss.filter(i => i.lv === 'warn').length;
      return `<tr class="click" onclick="seoEdit('${p.id}')"><td><div class="flex items-center gap-2.5 min-w-[200px]">${p.img ? `<img src="${p.img}" class="w-10 h-7 rounded object-cover"/>` : `<span class="w-10 h-7 rounded bg-sand grid place-items-center"><i data-lucide="file-text" class="w-3.5 h-3.5 text-muted"></i></span>`}<div class="min-w-0"><p class="truncate max-w-[220px]">${esc(p.name)}${p.hidden ? ' <span class="text-[10.5px] text-muted">(ซ่อน)</span>' : ''}</p><p class="text-[11px] text-muted truncate max-w-[220px]">${esc(p.url[k] || '—')}</p></div></div></td>
        <td class="text-muted whitespace-nowrap">${ST[p.type]}</td><td><p class="truncate max-w-[300px] ${p.t[k] ? '' : 'text-muted'}">${esc(p.t[k] || 'ยังไม่มี')}</p></td>
        <td class="text-center">${len(p.t[k], 60, 25)}</td><td class="text-center">${len(p.d[k], 160, 70)}</td>
        <td>${s.index ? '<span class="text-[#1e7a46] text-[12px]">index</span>' : '<span class="text-muted text-[12px]">noindex</span>'}</td>
        <td class="whitespace-nowrap">${e ? `<span class="lang-b low">${e} ต้องแก้</span> ` : ''}${w ? `<span class="lang-b mid">${w} ควรแก้</span>` : ''}${!e && !w ? '<span class="text-muted text-[12px]">—</span>' : ''}</td>
        <td class="text-center"><span class="lang-b ${scoreCls(p.score)} tnum">${p.score}</span></td><td class="text-right"><i data-lucide="pencil" class="w-4 h-4 text-muted inline"></i></td></tr>`; }).join('') || '<tr><td colspan="9" class="text-center text-muted py-10">ไม่พบหน้าที่ตรงเงื่อนไข</td></tr>'}
    </tbody></table></div>
    <div class="flex items-center justify-between mt-3 text-[12px] text-muted"><span>${rows.length} หน้า · ความยาวนับแบบไม่รวมสระบน/ล่างของภาษาไทย</span>${pages > 1 ? `<div class="flex items-center gap-1"><button class="btn btn-g !h-8 !px-2" ${SEOV.page ? '' : 'disabled'} onclick="SEOV.page--;vSeo()"><i data-lucide="chevron-left" class="w-4 h-4"></i></button><span class="tnum">${SEOV.page + 1} / ${pages}</span><button class="btn btn-g !h-8 !px-2" ${SEOV.page < pages - 1 ? '' : 'disabled'} onclick="SEOV.page++;vSeo()"><i data-lucide="chevron-right" class="w-4 h-4"></i></button></div>` : ''}</div>`;
}

/* drawer: edit one page's SEO (writes straight into the page's own {th,en} fields) */
function seoField(label, o, k, max, rows, id) {
  const v = o[k] || '', n = thLen(v);
  const inp = rows ? `<textarea rows="${rows}" class="inp" oninput="seoIn(this,${max},'${id}','${k}')">${esc(v)}</textarea>` : `<input class="inp" value="${esc(v)}" oninput="seoIn(this,${max},'${id}','${k}')"/>`;
  return `<label class="block" data-o><span class="flex justify-between"><span class="lbl">${label}</span><span class="text-[10.5px] tnum ${n > max ? 'text-[#a3222c]' : 'text-muted'}">${n}/${max}</span></span>${inp}<span class="block mt-1 h-1 rounded-full bg-sand overflow-hidden"><span class="block h-full rounded-full ${n > max ? 'bg-[#a3222c]' : n > max * .5 ? 'bg-[#1e7a46]' : 'bg-[#e0a64b]'}" style="width:${Math.min(100, n / max * 100)}%"></span></span></label>`;
}
let SE = null;
function seoIn(el, max, id, k) {
  const p = SE, f = el.closest('label'), isT = f.querySelector('.lbl').textContent.startsWith('Title'), n = thLen(el.value);
  (isT ? p.t : p.d)[k] = el.value;
  f.querySelector('.tnum').textContent = `${n}/${max}`; f.querySelector('.tnum').className = `text-[10.5px] tnum ${n > max ? 'text-[#a3222c]' : 'text-muted'}`;
  const bar = f.querySelector('span.block span'); bar.style.width = Math.min(100, n / max * 100) + '%'; bar.className = `block h-full rounded-full ${n > max ? 'bg-[#a3222c]' : n > max * .5 ? 'bg-[#1e7a46]' : 'bg-[#e0a64b]'}`;
  seoPrev();
}
function seoPrev() {
  const p = SE; $('#sePrev').innerHTML = LANGS.map(([k, C]) => `<div class="rounded-xl ring-1 ring-line p-3.5"><p class="text-[10.5px] text-muted mb-1.5">Google · ${C}</p><p class="text-[11px] text-[#4d5156] truncate">${SITE}${esc(p.url[k] || '')}</p><p class="text-[15px] text-[#1a0dab] leading-snug mt-0.5 line-clamp-1">${esc(p.t[k] || '—')}</p><p class="text-[12px] text-[#4d5156] mt-0.5 line-clamp-2">${esc(p.d[k] || '—')}</p></div>`).join('')
    + `<div class="rounded-xl ring-1 ring-line overflow-hidden"><p class="text-[10.5px] text-muted px-3.5 pt-3 mb-1.5">แชร์ใน LINE / Facebook</p>${p.img ? `<img src="${p.img}" class="w-full aspect-[1200/630] object-cover"/>` : `<div class="w-full aspect-[1200/630] bg-sand grid place-items-center text-[11px] text-muted">ใช้รูป OG เริ่มต้นของเว็บ</div>`}<div class="p-3 bg-[#f6f7f9]"><p class="text-[10.5px] text-muted uppercase">${SITE}</p><p class="text-[13px] font-medium line-clamp-1">${esc(sx(p.id).ogT.th || p.t.th || '')}</p></div></div>`;
}
function seoEdit(id) {
  REG = []; const P = auditAll(), p = P.find(x => x.id === id); SE = p; const s = sx(id);
  const tog = (key, l, h) => `<label class="flex items-center justify-between gap-3 py-1.5"><span>${l}${h ? `<span class="block text-[11px] text-muted">${h}</span>` : ''}</span><span class="tgl"><input type="checkbox" ${s[key] ? 'checked' : ''} onchange="sx('${id}').${key}=this.checked"/><span></span></span></label>`;
  openDrawer(`<div class="h-16 px-5 flex items-center justify-between border-b border-line shrink-0"><div class="min-w-0"><p class="text-[11px] text-muted">${ST[p.type]} · SEO</p><p class="font-medium truncate">${esc(p.name)}</p></div><div class="flex items-center gap-2"><span class="lang-b ${scoreCls(p.score)}">คะแนน ${p.score}</span><button class="btn btn-g !px-2" onclick="closeDrawer()"><i data-lucide="x" class="w-5 h-5"></i></button></div></div>
    <div class="flex-1 overflow-y-auto p-5 grid gap-5 content-start">
      ${p.iss.length ? `<div class="rounded-xl bg-sand p-3.5"><p class="text-[12px] font-medium mb-2">สิ่งที่ควรแก้</p><ul class="grid gap-1.5 text-[12.5px]">${p.iss.map(i => `<li class="flex items-start gap-2"><i data-lucide="${LV[i.lv][2]}" class="w-3.5 h-3.5 mt-0.5 shrink-0 ${i.lv === 'err' ? 'text-[#a3222c]' : i.lv === 'warn' ? 'text-[#b4501a]' : 'text-muted'}"></i><span>${i.lang ? `<b class="font-medium">${i.lang}</b> · ` : ''}${i.msg}</span></li>`).join('')}</ul></div>` : '<div class="rounded-xl bg-[#eaf6ef] text-[#1e7a46] p-3.5 text-[12.5px] flex items-center gap-2"><i data-lucide="circle-check" class="w-4 h-4"></i>หน้านี้ผ่านการตรวจทั้งหมด</div>'}
      <div class="grid gap-3">${LANGS.map(([k, C, L]) => `<div class="grid gap-3 rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium">${L}</p><p class="text-[11px] text-muted -mt-2 truncate">${SITE}${esc(p.url[k] || '— ยังไม่มีหน้าภาษานี้')}</p>${seoField('Title', p.t, k, 60, 0, id)}${seoField('Meta description', p.d, k, 160, 2, id)}</div>`).join('')}</div>
      <div><p class="lbl">ตัวอย่างการแสดงผล</p><div id="sePrev" class="grid gap-2.5"></div></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium mb-1">การ index</p>${tog('index', 'ให้ Google index หน้านี้', 'ปิด = ใส่ noindex')}${tog('follow', 'ให้ติดตามลิงก์ในหน้านี้', 'ปิด = nofollow')}
        <label class="block mt-2"><span class="lbl">Canonical URL (เว้นว่าง = ใช้ URL ของหน้านี้เอง)</span><input class="inp" placeholder="https://${SITE}${esc(p.url.th)}" value="${esc(s.canon)}" onchange="sx('${id}').canon=this.value"/></label></div>
      <div class="rounded-xl ring-1 ring-line p-4 grid gap-3"><p class="text-[12px] font-medium">โซเชียล (Open Graph)</p>${bi('OG title (เว้นว่าง = ใช้ Title)', s.ogT)}<p class="text-[11px] text-muted">รูป OG ใช้รูปปก/รูปเรือของหน้านี้อัตโนมัติ ขนาด 1200×630</p></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="text-[12px] font-medium">Structured data</p><p class="text-[12.5px] mt-1">${p.schema} <span class="text-muted">· สร้างอัตโนมัติจากข้อมูลหน้า</span></p>${p.go ? `<button class="btn btn-o mt-3" onclick="closeDrawer();${p.go}"><i data-lucide="external-link" class="w-3.5 h-3.5"></i>ไปหน้าแก้ไขเนื้อหา</button>` : ''}</div>
    </div>
    <div class="p-4 border-t border-line flex justify-end gap-2"><button class="btn btn-o" onclick="closeDrawer()">ปิด</button><button class="btn btn-p" onclick="closeDrawer();vSeo();toast('บันทึก SEO แล้ว')">บันทึก</button></div>`);
  seoPrev();
}

function seoKw() {
  const P = seoPages(), kwUse = {};
  P.forEach(p => p.kw && LANGS.forEach(([k]) => { const w = (p.kw[k] || '').trim().toLowerCase(); if (w) (kwUse[w] ??= []).push(p.name); }));
  const cannib = Object.entries(kwUse).filter(([, v]) => v.length > 1);
  return `<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3"><p class="text-[12px] text-muted">ติดตามอันดับคีย์เวิร์ดสำคัญ · อันดับเป็นตัวอย่าง ระบบจริงดึงจาก Search Console ทุกวัน</p><button class="btn btn-p" onclick="seoAddKw()"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่มคีย์เวิร์ด</button></div>
    ${cannib.length ? `<div class="rounded-xl bg-[#fff6e5] text-[#7a4a00] p-3.5 mb-3 text-[12.5px]"><b class="font-medium">คีย์เวิร์ดชนกัน:</b> ${cannib.map(([w, v]) => `“${esc(w)}” ใช้ใน ${v.length} หน้า (${v.map(esc).join(', ')})`).join(' · ')} · ควรให้ 1 คีย์เวิร์ดหลักต่อ 1 หน้า</div>` : ''}
    <div class="overflow-x-auto rounded-xl ring-1 ring-line"><table class="tbl min-w-[720px]"><thead><tr><th>คีย์เวิร์ด</th><th>ภาษา</th><th>หน้าเป้าหมาย</th><th class="text-center">อันดับ</th><th class="text-center">7 วัน</th><th></th></tr></thead><tbody>
    ${KW.map((w, n) => `<tr><td>${esc(w.q)}</td><td><span class="lang-b ok">${w.l.toUpperCase()}</span></td><td class="text-muted truncate max-w-[280px]">${esc(w.url)}</td>
      <td class="text-center tnum">${w.pos ?? '<span class="text-muted">ยังไม่ติด 100</span>'}</td>
      <td class="text-center tnum">${w.ch > 0 ? `<span class="text-[#1e7a46] inline-flex items-center gap-0.5"><i data-lucide="trending-up" class="w-3.5 h-3.5"></i>${w.ch}</span>` : w.ch < 0 ? `<span class="text-[#a3222c] inline-flex items-center gap-0.5"><i data-lucide="trending-down" class="w-3.5 h-3.5"></i>${-w.ch}</span>` : '<span class="text-muted">—</span>'}</td>
      <td class="text-right"><button class="btn btn-g !px-2" onclick="KW.splice(${n},1);vSeo()"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`).join('')}</tbody></table></div>`;
}
function seoAddKw() {
  const P = seoPages().filter(p => !p.draft);
  openModal(`<div class="p-5 grid gap-3"><p class="font-medium">เพิ่มคีย์เวิร์ดที่ต้องการติดตาม</p>
    <label><span class="lbl">คีย์เวิร์ด</span><input id="kwQ" class="inp" placeholder="เช่น เช่าเรือยอชต์ภูเก็ต ราคา"/></label>
    <div class="grid grid-cols-2 gap-3"><label><span class="lbl">ภาษา</span><select id="kwL" class="inp"><option value="th">ไทย</option><option value="en">English</option></select></label>
    <label><span class="lbl">หน้าเป้าหมาย</span><select id="kwU" class="inp">${P.map(p => `<option value="${esc(p.url.th)}">${esc(p.name)}</option>`).join('')}</select></label></div>
    <div class="flex justify-end gap-2 mt-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="if($('#kwQ').value.trim()){const l=$('#kwL').value;KW.unshift({q:$('#kwQ').value.trim(),l,url:(l==='en'?'/en':'')+$('#kwU').value,pos:null,ch:0});closeModal();vSeo();toast('เพิ่มคีย์เวิร์ดแล้ว · อันดับจะอัปเดตพรุ่งนี้')}">เพิ่ม</button></div></div>`);
}

const guessTarget = u => { const m = u.match(/(?:boat|yacht)\/([a-z0-9-]+)/); if (m && bySlug(m[1])) return (u.startsWith('/en/') || /lang=en/.test(u) ? '/en' : '') + '/yacht-charter/' + m[1]; if (/pattaya/.test(u)) return '/yacht-charter'; if (/tag|category/.test(u)) return '/blog'; return ''; };
function seoRedir() {
  return `<div class="rounded-xl bg-sand p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3"><i data-lucide="shuffle" class="w-5 h-5 text-maroon shrink-0"></i><div class="flex-1"><p class="font-medium">ย้ายจาก WordPress</p><p class="text-[12px] text-muted mt-0.5">นำเข้า sitemap เดิม แล้วระบบจับคู่ URL เก่ากับหน้าใหม่ให้อัตโนมัติ เพื่อไม่ให้อันดับ Google หาย</p></div><button class="btn btn-o" onclick="toast('นำเข้า sitemap เดิม (จำลอง)')"><i data-lucide="download" class="w-3.5 h-3.5"></i>นำเข้า sitemap / CSV</button></div>
    <div class="grid xl:grid-cols-[1.4fr_1fr] gap-4 items-start">
    <div class="rounded-xl ring-1 ring-line min-w-0"><div class="flex items-center justify-between px-4 py-3"><p class="font-medium">Redirect <span class="text-muted font-normal">· ${REDIR.length}</span></p><button class="btn btn-p !h-8" onclick="seoAddRedir('','')"><i data-lucide="plus" class="w-3.5 h-3.5"></i>เพิ่ม</button></div>
      <div class="overflow-x-auto"><table class="tbl min-w-[560px]"><thead><tr><th>URL เดิม</th><th></th><th>ไปที่</th><th>ชนิด</th><th class="text-right">ครั้ง</th><th></th></tr></thead><tbody>
      ${REDIR.map((r, n) => `<tr><td class="text-muted truncate max-w-[200px]">${esc(r.from)}</td><td><i data-lucide="arrow-right" class="w-3.5 h-3.5 text-muted"></i></td><td class="truncate max-w-[200px]">${esc(r.to)}</td><td><span class="lang-b ok">${r.code}</span></td><td class="text-right tnum">${r.hits}</td><td class="text-right"><button class="btn btn-g !px-2" onclick="REDIR.splice(${n},1);vSeo()"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`).join('')}</tbody></table></div>
      <p class="text-[11px] text-muted px-4 py-3">ตัวอย่าง URL รูปแบบ WordPress · ระบบจริงใช้ URL จาก sitemap เดิมของเว็บ</p></div>
    <div class="rounded-xl ring-1 ring-line min-w-0"><div class="px-4 py-3"><p class="font-medium">หน้า 404 ที่มีคนเข้า</p><p class="text-[11px] text-muted">ข้อมูลตัวอย่าง · 30 วัน</p></div>
      <ul>${LOG404.map((x, n) => { const g = guessTarget(x.u); return `<li class="px-4 py-2.5 border-t border-line flex items-center gap-2"><div class="min-w-0 flex-1"><p class="truncate text-[12.5px]">${esc(x.u)}</p><p class="text-[11px] text-muted">${x.h} ครั้ง${g ? ` · แนะนำ → ${esc(g)}` : ''}</p></div><button class="btn btn-o !h-8 shrink-0" onclick="seoAddRedir('${esc(x.u)}','${esc(g)}',${n})">สร้าง redirect</button></li>`; }).join('') || '<li class="px-4 py-6 text-muted border-t border-line">ไม่มี 404 แล้ว</li>'}</ul></div></div>`;
}
function seoAddRedir(from, to, n) {
  openModal(`<div class="p-5 grid gap-3"><p class="font-medium">เพิ่ม Redirect</p>
    <label><span class="lbl">URL เดิม</span><input id="rF" class="inp" value="${from}" placeholder="/old-page/"/></label>
    <label><span class="lbl">ไปที่</span><input id="rT" class="inp" value="${to}" placeholder="/yacht-charter/..."/></label>
    <label><span class="lbl">ชนิด</span><select id="rC" class="inp"><option value="301">301 · ย้ายถาวร (แนะนำ)</option><option value="302">302 · ชั่วคราว</option><option value="410">410 · ลบแล้ว</option></select></label>
    <div class="flex justify-end gap-2 mt-2"><button class="btn btn-o" onclick="closeModal()">ยกเลิก</button><button class="btn btn-p" onclick="if($('#rF').value){REDIR.unshift({from:$('#rF').value,to:$('#rT').value,code:+$('#rC').value,hits:0});${n != null ? `LOG404.splice(${n},1);` : ''}closeModal();vSeo();toast('เพิ่ม redirect แล้ว')}">บันทึก</button></div></div>`);
}

function seoJsonLd() {
  const o = SCHEMA_ORG, v = SEOV.prev, base = `https://${SITE}`;
  if (v === 'org') return { '@context': 'https://schema.org', '@type': o.type, name: o.name, url: base, logo: base + '/logo.png', telephone: o.phone, ...(o.email && { email: o.email }), address: { '@type': 'PostalAddress', ...(o.street && { streetAddress: o.street }), addressLocality: o.city, addressCountry: 'TH', ...(o.zip && { postalCode: o.zip }) }, ...(o.lat && { geo: { '@type': 'GeoCoordinates', latitude: o.lat, longitude: o.lng } }), openingHours: o.hours, ...(o.social.filter(Boolean).length && { sameAs: o.social.filter(Boolean) }) };
  if (v.startsWith('b-')) { const b = bySlug(v.slice(2)); return { '@context': 'https://schema.org', '@type': 'Product', name: b.name, description: b.i18n?.seoDesc.en || '', image: base + `/images/${b.slug}.webp`, brand: { '@type': 'Brand', name: o.name }, offers: { '@type': 'Offer', priceCurrency: 'THB', price: b.from_ || undefined, availability: 'https://schema.org/InStock', url: base + '/yacht-charter/' + b.slug } }; }
  if (v.startsWith('a-')) { const a = artById(+v.slice(2)); return { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: a.title.th || a.title.en, description: a.seoD.th || a.seoD.en, image: base + '/images/blog-' + a.id + '.webp', datePublished: a.date, author: { '@type': 'Person', name: TEAM.find(t => t.id === a.author).name }, publisher: { '@type': 'Organization', name: o.name }, inLanguage: a.title.th ? 'th' : 'en' }; }
  if (v === 'faq') return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: WEB.faq.filter(([q, a]) => q.th && a.th).map(([q, a]) => ({ '@type': 'Question', name: q.th, acceptedAnswer: { '@type': 'Answer', text: a.th } })) };
}
function seoSchema() {
  const o = SCHEMA_ORG, f = (k, l, ph = '') => `<label><span class="lbl">${l}</span><input class="inp" value="${esc(o[k])}" placeholder="${ph}" oninput="SCHEMA_ORG.${k}=this.value;$('#ldOut').textContent=JSON.stringify(seoJsonLd(),null,2)"/></label>`;
  return `<div class="grid xl:grid-cols-2 gap-4 items-start">
    <div class="grid gap-4">
      <div class="rounded-xl ring-1 ring-line p-4 grid gap-3"><p class="font-medium flex items-center gap-2"><i data-lucide="building-2" class="w-4 h-4 text-maroon"></i>ข้อมูลธุรกิจ (ใช้ทุกหน้า)</p>
        <div class="grid sm:grid-cols-2 gap-3">${f('name', 'ชื่อธุรกิจ')}<label><span class="lbl">ประเภท</span><select class="inp" onchange="SCHEMA_ORG.type=this.value;$('#ldOut').textContent=JSON.stringify(seoJsonLd(),null,2)">${['TravelAgency', 'LocalBusiness', 'Organization'].map(t => `<option ${o.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>${f('phone', 'โทรศัพท์')}${f('email', 'อีเมล', 'ยังไม่ได้กรอก')}${f('street', 'ที่อยู่', 'ยังไม่ได้กรอก')}${f('city', 'เมือง')}${f('lat', 'Latitude', 'เช่น 7.88')}${f('lng', 'Longitude', 'เช่น 98.39')}${f('hours', 'เวลาทำการ')}</div>
        <div><p class="lbl">โซเชียล (sameAs)</p><div class="grid gap-2">${['Facebook', 'Instagram', 'YouTube'].map((s, n) => `<input class="inp" placeholder="ลิงก์ ${s}" value="${esc(o.social[n])}" oninput="SCHEMA_ORG.social[${n}]=this.value;$('#ldOut').textContent=JSON.stringify(seoJsonLd(),null,2)"/>`).join('')}</div></div></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="font-medium">Schema อัตโนมัติตามประเภทหน้า</p><div class="mt-2 grid gap-1">${[['หน้าแรก', 'Organization + WebSite + SearchAction', true], ['หน้าเรือ', 'Product + Offer (ราคาเริ่มต้น)', true], ['บทความ', 'BlogPosting', true], ['FAQ', 'FAQPage', true], ['ทุกหน้า', 'BreadcrumbList', true], ['กิจกรรม', 'TouristTrip', true]].map(([a, b, on]) => `<label class="flex items-center gap-3 py-1.5"><span class="w-20 text-muted text-[12px]">${a}</span><span class="flex-1">${b}</span><span class="tgl"><input type="checkbox" ${on ? 'checked' : ''}/><span></span></span></label>`).join('')}
        <label class="flex items-center gap-3 py-1.5 border-t border-line mt-1 pt-3"><span class="flex-1">คะแนนรีวิว (AggregateRating)<span class="block text-[11px] text-muted">เปิดได้เมื่อมีรีวิวจริงจากลูกค้าในระบบเท่านั้น · Google ลงโทษรีวิวที่สร้างขึ้นเอง</span></span><span class="tgl"><input type="checkbox" disabled/><span></span></span></label></div></div>
    </div>
    <div class="rounded-xl ring-1 ring-line overflow-hidden xl:sticky xl:top-20"><div class="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-line"><p class="font-medium flex-1">JSON-LD ที่จะใส่ในหน้า</p><select class="inp !h-8 !w-auto !text-[12px]" onchange="SEOV.prev=this.value;$('#ldOut').textContent=JSON.stringify(seoJsonLd(),null,2)">${[['org', 'ข้อมูลธุรกิจ'], ['b-leopard-90-ft', 'หน้าเรือ: Leopard 90 ft'], ['b-vtech-68-ft', 'หน้าเรือ: Vtech 68 ft'], ['a-1', 'บทความ: ' + ART[0].title.th.slice(0, 24) + '…'], ['faq', 'FAQ หน้าแรก']].map(([v, l]) => `<option value="${v}" ${SEOV.prev === v ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="btn btn-o !h-8" onclick="toast('ผ่านการตรวจ Rich Results (จำลอง)')">ทดสอบ</button></div>
      <pre id="ldOut" class="p-4 whitespace-pre-wrap break-words text-[11.5px] leading-relaxed bg-[#1d1416] text-[#f1e6e6] overflow-auto max-h-[560px]">${esc(JSON.stringify(seoJsonLd(), null, 2))}</pre></div></div>`;
}

function seoSitemap() {
  const P = seoPages().filter(p => !p.draft && !p.hidden && sx(p.id).index);
  const n = t => P.filter(p => t.includes(p.type)).length * (SMAP.hreflang ? 2 : 1);
  const maps = [['pages', 'sitemap-pages.xml', 'หน้าหลัก', n(['home', 'page'])], ['boats', 'sitemap-boats.xml', 'เรือ', n(['boat'])], ['blog', 'sitemap-blog.xml', 'บทความ', n(['article'])], ['activities', 'sitemap-activities.xml', 'กิจกรรม', n(['act'])]];
  return `<div class="grid xl:grid-cols-2 gap-4 items-start">
    <div class="rounded-xl ring-1 ring-line"><div class="px-4 py-3 flex items-center justify-between"><div><p class="font-medium">Sitemap</p><p class="text-[11px] text-muted">${SITE}/sitemap.xml · อัปเดตอัตโนมัติเมื่อแก้เนื้อหา</p></div><button class="btn btn-o !h-8" onclick="toast('ส่ง sitemap ให้ Google แล้ว (จำลอง)')">ส่งให้ Google</button></div>
      ${maps.map(([k, f, l, c]) => `<div class="flex items-center gap-3 px-4 py-3 border-t border-line"><i data-lucide="file-code-2" class="w-4 h-4 text-muted"></i><div class="flex-1 min-w-0"><p class="truncate">${f}</p><p class="text-[11px] text-muted">${l} · ${c} URL</p></div><button class="btn btn-g !h-8" onclick="seoXml('${k}')">ดู XML</button><span class="tgl"><input type="checkbox" ${SMAP[k] ? 'checked' : ''} onchange="SMAP.${k}=this.checked"/><span></span></span></div>`).join('')}
      <div class="px-4 py-3 border-t border-line grid gap-2"><label class="flex items-center justify-between gap-3"><span>ใส่ hreflang th / en / x-default</span><span class="tgl"><input type="checkbox" ${SMAP.hreflang ? 'checked' : ''} onchange="SMAP.hreflang=this.checked;vSeo()"/><span></span></span></label><label class="flex items-center justify-between gap-3"><span>ใส่รูปภาพใน sitemap (Image sitemap)</span><span class="tgl"><input type="checkbox" ${SMAP.images ? 'checked' : ''}/><span></span></span></label>
      <p class="text-[11px] text-muted">หน้าที่ซ่อน, noindex และบทความฉบับร่าง จะไม่อยู่ใน sitemap</p></div></div>
    <div class="grid gap-4">
      <div class="rounded-xl ring-1 ring-line p-4"><div class="flex items-center justify-between"><p class="font-medium">robots.txt</p><button class="btn btn-g !h-8" onclick="ROBOTS.txt=$('#rbT').value;toast('บันทึก robots.txt แล้ว')">บันทึก</button></div>
        <textarea id="rbT" rows="8" class="inp mt-2 font-mono !text-[12px]">${esc(ROBOTS.txt)}</textarea></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="font-medium flex items-center gap-2"><i data-lucide="bot" class="w-4 h-4 text-maroon"></i>AI crawlers</p><p class="text-[11px] text-muted mt-0.5">อนุญาตให้ AI อ่านเว็บ ช่วยให้ ChatGPT, Claude, Perplexity แนะนำเรือของเราได้</p>
        <div class="mt-2 grid gap-1">${Object.keys(ROBOTS.ai).map(b => `<label class="flex items-center justify-between gap-3 py-1"><span class="font-mono text-[12px]">${b}</span><span class="tgl"><input type="checkbox" ${ROBOTS.ai[b] ? 'checked' : ''} onchange="ROBOTS.ai['${b}']=this.checked"/><span></span></span></label>`).join('')}
        <label class="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-line"><span>สร้างไฟล์ /llms.txt <span class="block text-[11px] text-muted">สรุปเว็บ เรือ และราคาให้ AI อ่านง่าย</span></span><span class="tgl"><input type="checkbox" ${ROBOTS.llms ? 'checked' : ''} onchange="ROBOTS.llms=this.checked"/><span></span></span></label></div></div>
    </div></div>`;
}
function seoXml(k) {
  const P = seoPages().filter(p => !p.draft && !p.hidden && sx(p.id).index && ({ pages: ['home', 'page'], boats: ['boat'], blog: ['article'], activities: ['act'] })[k].includes(p.type)).slice(0, 3);
  const x = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` + P.map(p => `  <url>\n    <loc>https://${SITE}${p.url.th}</loc>\n    <lastmod>${iso(TODAY)}</lastmod>\n` + (SMAP.hreflang ? `    <xhtml:link rel="alternate" hreflang="th" href="https://${SITE}${p.url.th}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="https://${SITE}${p.url.en}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="https://${SITE}${p.url.th}"/>\n` : '') + `  </url>`).join('\n') + `\n  <!-- … -->\n</urlset>`;
  openModal(`<div class="p-5"><div class="flex items-center justify-between mb-3"><p class="font-medium">sitemap-${k}.xml (บางส่วน)</p><button class="btn btn-g !px-2" onclick="closeModal()"><i data-lucide="x" class="w-5 h-5"></i></button></div><pre class="p-4 rounded-xl text-[11px] leading-relaxed bg-[#1d1416] text-[#f1e6e6] overflow-auto max-h-[60vh]">${esc(x)}</pre></div>`);
}

function seoSettings() {
  const S = SSET, b = FLEET[0], fill = (t, k, key) => t.replace('%name%', key === 'act' ? (ACTS[0][k] || ACTS[0].th) : b.name).replace('%title%', ART[0].title[k] || ART[0].title.th).replace('%price%', k === 'th' ? baht(b.from_) : '$' + Math.round((b.from_ || 0) / 33.42).toLocaleString()).replace(/%sep%/g, S.sep).replace('%site%', S.site[k]);
  const tplRow = (key, l) => `<div class="grid gap-2"><p class="lbl !mb-0">${l}</p>${LANGS.map(([k, C]) => `<div class="grid sm:grid-cols-[1fr_1fr] gap-2 items-center"><div class="relative"><span class="bi-tag">${C}</span><input class="inp !pl-10 font-mono !text-[12px]" value="${esc(S.tpl[key][k])}" oninput="SSET.tpl.${key}.${k}=this.value;this.parentElement.nextElementSibling.textContent=seoFill(this.value,'${k}','${key}')"/></div><p class="text-[12px] text-[#1a0dab] truncate">${esc(fill(S.tpl[key][k], k, key))}</p></div>`).join('')}</div>`;
  const tg = (k, l, h) => `<label class="flex items-center justify-between gap-3 py-1.5"><span>${l}${h ? `<span class="block text-[11px] text-muted">${h}</span>` : ''}</span><span class="tgl"><input type="checkbox" ${S[k] ? 'checked' : ''} onchange="SSET.${k}=this.checked"/><span></span></span></label>`;
  const id = (k, l, ph) => `<label><span class="lbl">${l}</span><input class="inp font-mono !text-[12px]" placeholder="${ph}" value="${esc(S[k])}" onchange="SSET.${k}=this.value"/></label>`;
  return `<div class="grid xl:grid-cols-2 gap-4 items-start">
    <div class="rounded-xl ring-1 ring-line p-4 grid gap-4"><div class="flex items-center justify-between"><p class="font-medium">รูปแบบ Title อัตโนมัติ</p><label class="flex items-center gap-2 text-[12px]"><span class="text-muted">ตัวคั่น</span><select class="inp !h-8 !w-16" onchange="SSET.sep=this.value;vSeo()">${['|', '–', '·', '»'].map(s => `<option ${S.sep === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
      ${tplRow('boat', 'หน้าเรือ')}${tplRow('article', 'บทความ')}${tplRow('act', 'กิจกรรม')}
      <p class="text-[11px] text-muted">ตัวแปร: <span class="font-mono">%name% %title% %price% %sep% %site%</span> · ใช้เมื่อหน้านั้นไม่ได้ตั้ง Title เอง</p></div>
    <div class="grid gap-4">
      <div class="rounded-xl ring-1 ring-line p-4 grid gap-3"><p class="font-medium">ยืนยันเว็บ & ติดตามผล</p><div class="grid sm:grid-cols-2 gap-3">${id('gsc', 'Google Search Console', 'google-site-verification=…')}${id('bing', 'Bing Webmaster', 'msvalidate.01=…')}${id('ga4', 'Google Analytics 4', 'G-XXXXXXX')}${id('gtm', 'Google Tag Manager', 'GTM-XXXXXX')}${id('pixel', 'Meta Pixel', '123456789')}</div>
        <p class="text-[11px] text-muted">สคริปต์ติดตามโหลดหลังผู้ใช้ยอมรับคุกกี้เท่านั้น (ตาม PDPA)</p></div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="font-medium mb-1">URL & เทคนิค</p>${tg('canon', 'ใส่ canonical อัตโนมัติทุกหน้า')}${tg('lower', 'บังคับ URL ตัวพิมพ์เล็ก', 'redirect /Yacht → /yacht อัตโนมัติ')}${tg('slash', 'ลงท้าย URL ด้วย /')}${tg('noSearch', 'noindex หน้าผลค้นหาและหน้าที่มีตัวกรอง', 'กันหน้าซ้ำจาก ?q= และ ?type=')}${tg('crumbs', 'แสดง breadcrumb + schema')}</div>
      <div class="rounded-xl ring-1 ring-line p-4"><p class="font-medium mb-1">รูปภาพ</p><label class="flex items-center justify-between gap-3 py-1.5"><span>แปลงเป็น WebP และย่อขนาดอัตโนมัติ</span><span class="tgl"><input type="checkbox" checked/><span></span></span></label><label class="flex items-center justify-between gap-3 py-1.5"><span>Lazy-load รูปที่อยู่ด้านล่าง</span><span class="tgl"><input type="checkbox" checked/><span></span></span></label><label class="flex items-center justify-between gap-3 py-1.5"><span>เตือนเมื่อรูปไม่มี Alt text ก่อนเผยแพร่</span><span class="tgl"><input type="checkbox" checked/><span></span></span></label></div>
    </div></div>`;
}
function seoBulkTitle() {
  let n = 0; const fill = (tpl, name, k, price) => tpl.replace('%name%', name).replace('%title%', name).replace('%price%', price || '').replace(/%sep%/g, SSET.sep).replace('%site%', SSET.site[k]).replace(/\s+/g, ' ').trim();
  seoPages().filter(p => !p.draft && !p.hidden).forEach(p => LANGS.forEach(([k]) => { if ((p.t[k] || '').trim()) return;
    const tpl = SSET.tpl[p.type === 'boat' ? 'boat' : p.type === 'article' ? 'article' : 'act'][k], nm = p.type === 'act' ? (k === 'en' ? ACTS[+p.id.slice(2)].en : ACTS[+p.id.slice(2)].th) || p.name : p.type === 'article' ? (p.art.title[k] || '') : p.name;
    if (!nm || p.type === 'page' || p.type === 'home') return;
    const b = p.type === 'boat' ? bySlug(p.id.slice(2)) : null;
    p.t[k] = fill(tpl, nm, k, b ? (k === 'th' ? baht(b.from_) : '$' + Math.round((b.from_ || 0) / 33.42).toLocaleString()) : ''); n++; }));
  toast(n ? `เติม Title ${n} ช่องจากรูปแบบที่ตั้งไว้ · Description ต้องเขียนเอง` : 'ไม่มี Title ที่ว่างแล้ว'); vSeo();
}
function seoFill(t, k, key) { const b = FLEET[0]; return t.replace('%name%', key === 'act' ? (ACTS[0][k] || ACTS[0].th) : b.name).replace('%title%', ART[0].title[k] || ART[0].title.th).replace('%price%', k === 'th' ? baht(b.from_) : '$' + Math.round((b.from_ || 0) / 33.42).toLocaleString()).replace(/%sep%/g, SSET.sep).replace('%site%', SSET.site[k]); }

/* ---------- SEO checklist inside the article editor ---------- */
function artSeoChecks() {
  const a = curA(); if (!a) return; const el = $('#artChecks'); if (!el) return;
  const k = AE.lang, kw = (a.kw[k] || '').toLowerCase().trim(), B = blocksOf(a, k), t = a.seoT[k] || a.title[k] || '', d = a.seoD[k] || a.excerpt[k] || '';
  const body = txtOf(a.body[k]).toLowerCase(), first = txtOf((B.find(b => b.t === 'p') || {}).html).toLowerCase(), len = k === 'th' ? body.replace(/\s/g, '').length : body.split(/\s+/).filter(Boolean).length;
  const imgs = B.flatMap(b => b.t === 'img' ? [b] : b.t === 'grid' ? b.cells.filter(c => c.src) : b.t === 'cols' ? b.cols.filter(c => c.k === 'img' && c.src) : []), noAlt = imgs.filter(x => !x.alt).length;
  const C = [
    [!!kw, 'ตั้งคีย์เวิร์ดหลักแล้ว'], [kw && t.toLowerCase().includes(kw), 'คีย์เวิร์ดอยู่ใน Title'], [kw && first.includes(kw), 'คีย์เวิร์ดอยู่ในย่อหน้าแรก'],
    [kw && B.some(b => b.t === 'h' && txtOf(b.html).toLowerCase().includes(kw)), 'คีย์เวิร์ดอยู่ในหัวข้อ H2/H3 อย่างน้อย 1 จุด'], [kw && (a.slug[k] || '').toLowerCase().includes(kw.replace(/\s+/g, '-')), 'คีย์เวิร์ดอยู่ใน URL'],
    [thLen(t) >= 25 && thLen(t) <= 60, `ความยาว Title 25–60 (ตอนนี้ ${thLen(t)})`], [thLen(d) >= 70 && thLen(d) <= 160, `ความยาว Description 70–160 (ตอนนี้ ${thLen(d)})`],
    [len >= (k === 'th' ? 800 : 300), `ความยาวเนื้อหา ${k === 'th' ? '≥ 800 ตัวอักษร' : '≥ 300 คำ'} (ตอนนี้ ${len})`], [B.some(b => b.t === 'h' && b.lv === 2), 'มีหัวข้อ H2 แบ่งเนื้อหา'],
    [imgs.length > 0, 'มีรูปประกอบ'], [imgs.length > 0 && !noAlt, noAlt ? `รูปไม่มี Alt text ${noAlt} รูป` : 'รูปทุกรูปมี Alt text'], [B.some(b => b.t === 'boat' || b.t === 'btn') || a.boats.length > 0, 'มีลิงก์ไปหน้าเรือ / ปุ่มจอง'],
  ];
  const ok = C.filter(c => c[0]).length, sc = Math.round(ok / C.length * 100);
  el.innerHTML = `<div class="flex items-center gap-3 mb-2">${ring(sc, 56)}<div><p class="font-medium">คะแนน SEO ของบทความ</p><p class="text-[11px] text-muted">ผ่าน ${ok}/${C.length} ข้อ · ${k.toUpperCase()}</p></div></div><ul class="grid gap-1.5 text-[12.5px]">${C.map(([p, l]) => `<li class="flex items-start gap-2"><i data-lucide="${p ? 'circle-check' : 'circle-dashed'}" class="w-3.5 h-3.5 mt-0.5 shrink-0 ${p ? 'text-[#1e7a46]' : 'text-[#b4501a]'}"></i><span class="${p ? 'text-muted' : ''}">${l}</span></li>`).join('')}</ul>`;
  icons();
}
const _vArticleEdit2 = vArticleEdit;
vArticleEdit = function (id) { _vArticleEdit2(id); const prev = $('#artPrev'); if (prev && !$('#artChecks')) { prev.parentElement.insertAdjacentHTML('afterend', '<div id="artChecks" class="rounded-xl bg-sand/60 p-4"></div>'); } artSeoChecks(); };
const _artSeoPrev = artSeoPrev; artSeoPrev = function (a) { _artSeoPrev(a); clearTimeout(artSeoPrev.t); artSeoPrev.t = setTimeout(artSeoChecks, 250); };
const _edSave = edSave; edSave = function () { _edSave(); clearTimeout(edSave.t); edSave.t = setTimeout(artSeoChecks, 400); };

/* ---------- register ---------- */
PAGES.splice(PAGES.findIndex(p => p[0] === 'articles') + 1, 0, ['seo', 'SEO', 'search-check', vSeo]);

