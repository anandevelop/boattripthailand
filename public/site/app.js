/* =========================================================
   URL LAYER — real, crawlable paths for the mockup's views
   /                    ⇄ #/              /en/...  = English
   /yacht-charter       ⇄ #/fleet         /yacht-charter/:slug ⇄ #/boat/:slug
   /blog, /blog/:slug   ⇄ #/blog…         /destinations/:slug  ⇄ #/dest/:slug
   /about-us ⇄ #/about  /privacy-policy ⇄ #/privacy  /terms-and-conditions ⇄ #/terms
   /cookie-preferences ⇄ #/cookies        /design-system ⇄ #/design
   The rest of the app still speaks "#/…" internally (VH.hash).
   ========================================================= */
/* server-rendered pages: drop "already built/bound" markers so this browser binds its own handlers */
document.querySelectorAll('[data-built],[data-swipe]').forEach(el => { el.removeAttribute('data-built'); el.removeAttribute('data-swipe'); });
window.__LANG__ = /^\/en(\/|$)/.test(location.pathname) ? 'en' : 'th';
const SITE_ORIGIN = (window.__CFG__ || {}).site || 'https://boattripthailand.com';
/* contact & brand details from /admin → ตั้งค่า (window.__SET__); these are the values when nothing is saved there */
const SET = Object.assign({ phone: '+66 61 172 5854', wa: '+66 61 172 5854', email: 'boattripthailand@gmail.com', line: '@boattripthailand', lineUrl: 'https://lin.ee/kkzkoX7',
  company: 'Boat Trip (Thailand) Co., Ltd.', tat: '34/03754', map: 'https://maps.app.goo.gl/82Rp4Z99B1Jj5WNTA',
  address: { th: '79/29 หมู่ 4 ต.เกาะแก้ว อ.เมืองภูเก็ต จ.ภูเก็ต 83000', en: '79/29 Moo 4, Koh Kaew, Muang Phuket, Phuket 83000' } }, window.__SET__ || {});
const TEL = 'tel:' + SET.phone.replace(/[^\d+]/g, ''), WA_URL = 'https://wa.me/' + SET.wa.replace(/\D/g, '');
/* homepage content from /admin → เนื้อหาเว็บไซต์ (window.__HOME__, defaults in data/home.json) */
const HOME = window.__HOME__ || null;
/* pick the language (Thai when a translation is missing) and fill {boats} {maxpax} {from} {from:type} */
function homeTxt(o, lang = LANG) {
  const raw = o ? String((lang === 'en' ? o.en : o.th) || o.th || o.en || '') : '';
  return raw.replace(/\{(boats|maxpax|from)(?::([a-z]+))?\}/g, (m, k, ty) => {
    if (k === 'boats') return FLEET.length;
    if (k === 'maxpax') return Math.max(0, ...FLEET.map(b => b.pax || 0));
    // {from}: catalogue price (as the original copy); {from:type}: current-season price, as the original FAQ
    const p = FLEET.map(b => ty ? (b.type === ty && b.from_) : (b.fromAll ?? b.from_)).filter(Boolean);
    return p.length ? baht(Math.min(...p)) : '';
  });
}
/* Search Console / Bing ownership tags from /admin → SEO → ตั้งค่า SEO */
(function seoVerify() { const v = (window.__SEO__ || {}).verify || {}; [['google-site-verification', v.google], ['msvalidate.01', v.bing]].forEach(([n, c]) => { if (c) setMeta(n, c); }); })();
/* static parts of site/shell.html (header, footer, contact card) marked with data-set="…" */
(function applySet() {
  const each = (k, fn) => document.querySelectorAll(`[data-set="${k}"]`).forEach(fn);
  each('tel', a => a.setAttribute('href', TEL)); each('phone', e => { e.textContent = SET.phone; });
  each('wa', a => a.setAttribute('href', WA_URL)); each('waText', e => { e.textContent = SET.wa; });
  each('lineUrl', a => a.setAttribute('href', SET.lineUrl)); each('line', e => { e.textContent = SET.line; });
  each('email', a => { a.setAttribute('href', 'mailto:' + SET.email); a.textContent = SET.email; });
  each('tat', e => { e.textContent = SET.tat; }); each('company', e => { e.textContent = SET.company; });
  if (SET.logo) each('logo', i => i.setAttribute('src', SET.logo));
  if (SET.favicon) each('favicon', l => l.setAttribute('href', SET.favicon));
})();
const PAGE_MAP = { '/about-us': '#/about', '/privacy-policy': '#/privacy', '/terms-and-conditions': '#/terms', '/cookie-preferences': '#/cookies', '/design-system': '#/design', '/destinations': '#/destinations', '/blog': '#/blog', '/yacht-charter': '#/fleet' };
const HASH_MAP = Object.fromEntries(Object.entries(PAGE_MAP).map(([p, h]) => [h.slice(1), p]));

function pathToHash(path, search, frag) {
  let p; try { p = decodeURIComponent(path); } catch (e) { p = path; }
  p = p.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  let h;
  if (p === '/') h = frag && frag.length > 1 && !frag.startsWith('#/') ? frag : '#/';
  else if (p.startsWith('/yacht-charter/')) h = '#/boat/' + p.slice(15);
  else if (p.startsWith('/blog/')) h = '#/blog/' + p.slice(6);
  else if (p.startsWith('/destinations/')) h = '#/dest/' + p.slice(14);
  else h = PAGE_MAP[p] || '#/404';
  if (search && search.length > 1 && /^#\/(fleet|blog)$/.test(h)) h += search;
  return h;
}
function postFor(s) { return (window.POSTS || []).find(x => x.slug.th === s || x.slug.en === s); }
function hashToPath(h, lang) {
  lang = lang || LANG;
  const pre = lang === 'en' ? '/en' : '';
  if (!h || h === '#' || h === '#/') return pre || '/';
  if (!h.startsWith('#/')) return (pre || '/') + h;
  const i = h.indexOf('?'), r = (i < 0 ? h : h.slice(0, i)).slice(1), q = i < 0 ? '' : h.slice(i);
  let p;
  if (r.startsWith('/boat/')) p = '/yacht-charter/' + r.slice(6);
  else if (r.startsWith('/dest/')) p = '/destinations/' + r.slice(6);
  else if (r.startsWith('/blog/')) {
    let s = r.slice(6); try { s = decodeURIComponent(s); } catch (e) { }
    const post = postFor(s), has = k => post && post.slug[k] && (post.blocks ? post.blocks[k].length : post.has && post.has[k]);
    p = '/blog/' + encodeURIComponent(post ? (has(lang) ? post.slug[lang] : (post.slug.th || post.slug.en)) : s);
  }
  else p = HASH_MAP[r] || (r === '/404' ? '/404' : '/');
  return pre + p + q;
}
let VHASH = pathToHash(location.pathname, location.search, location.hash);
const VH = { get hash() { return VHASH; }, set hash(h) { navTo(h); } };
function navTo(h, replace) {
  if (/^https?:/.test(h)) { location.href = h; return; }
  if (h.startsWith('/')) { const u = new URL(h, location.origin); h = pathToHash(u.pathname, u.search, u.hash); }
  VHASH = h || '#/';
  const url = hashToPath(VHASH);
  if (window.history && history.pushState) (replace ? history.replaceState : history.pushState).call(history, null, '', url);
  window.dispatchEvent(new Event('btt:nav'));
}
function realLinks(root) {
  (root || document).querySelectorAll('a[href^="#/"]').forEach(a => { a.setAttribute('href', hashToPath(a.getAttribute('href'))); });
}
function seoAlternates() {
  const set = (lang, url) => { let l = document.head.querySelector(`link[rel="alternate"][hreflang="${lang}"]`); if (!l) { l = document.createElement('link'); l.rel = 'alternate'; l.hreflang = lang; document.head.appendChild(l); } l.setAttribute('href', url); };
  set('th', SITE_ORIGIN + hashToPath(VHASH, 'th')); set('en', SITE_ORIGIN + hashToPath(VHASH, 'en')); set('x-default', SITE_ORIGIN + hashToPath(VHASH, 'th'));
  if (VHASH === '#/404' || VHASH === '#/design') { const m = document.head.querySelector('meta[name="robots"]'); if (m) m.setAttribute('content', 'noindex, follow'); }
}
function afterRoute() {
  realLinks(); seoAlternates(); document.documentElement.lang = LANG;
  document.querySelectorAll('.lang-btn').forEach(b => { const on = b.dataset.lang === LANG; b.classList.toggle('chip-active', on); b.classList.toggle('text-muted', !on); b.setAttribute('aria-pressed', on); });
  syncLangChip();
}
/* phone navbar: the chip shows the language it switches TO */
function syncLangChip() {
  const c = document.getElementById('langChip'); if (!c) return;
  const to = LANG === 'th' ? 'en' : 'th';
  c.dataset.lang = to; c.setAttribute('lang', to); c.setAttribute('aria-label', to === 'en' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย');
  const s = c.querySelector('span'); if (s) s.textContent = to.toUpperCase();
}

if (typeof MutationObserver !== 'undefined') {
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches && n.matches('a[href^="#/"]')) n.setAttribute('href', hashToPath(n.getAttribute('href'))); realLinks(n); } })
    .observe(document.documentElement, { childList: true, subtree: true });
}
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
  const href = a.getAttribute('href');
  if (href.startsWith('#') && !href.startsWith('#/')) {
    const el = document.getElementById(href.slice(1));
    if (el && el.offsetParent !== null) return;          // in-page anchor on the current view
    e.preventDefault(); navTo(href); return;
  }
  let u; try { u = new URL(href, location.href); } catch (err) { return; }
  if (u.origin !== location.origin || /^\/(admin|api|_next|boats|img|brand|site)\//.test(u.pathname) || /\.[a-z0-9]{2,5}$/i.test(u.pathname)) return;
  e.preventDefault();
  if (u.pathname === location.pathname && u.search === location.search && u.hash) { navTo(pathToHash(u.pathname, u.search, u.hash)); return; }
  navTo(u.pathname + u.search + u.hash);
});
window.addEventListener('popstate', () => {
  const lang = /^\/en(\/|$)/.test(location.pathname) ? 'en' : 'th';
  VHASH = pathToHash(location.pathname, location.search, location.hash);
  if (typeof setLang === 'function' && lang !== LANG) setLang(lang); else window.dispatchEvent(new Event('btt:nav'));
});


/* =========================================================
   DATA  (boat data taken from BTT brochure, low-season prices)
   ========================================================= */
const U = (id, w=900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;
const IMG = {
  yacht1:'1567899378494-47b22a2ae96a', yacht2:'1605281317010-fe5ffe798166', yacht3:'1569263979104-865ab7cd8d13',
  yacht4:'1540946485063-a40da27545f8', sail1:'1500514966906-fe245eea9344', sail2:'1559599746-8823b38544c6',
  speed1:'1530053969600-caed2596d242', phiphi:'1537956965359-7573183d1f57', longtail:'1552465011-b4e21bf6e79a',
  beach:'1589394815804-964ed0be2eb5', snorkel:'1544551763-46a013bb70d5', ocean:'1559827260-dc66d52bef19',
  spa:'1544161515-4ab6ce6db874', resort:'1540541338287-41700207dee6', food:'1414235077428-338989a2e8c0',
  lounge:'1517248135467-4c7edcad34c4', elephant:'1585123334904-845d60e97b29', temple:'1528181304800-259b08848526',
  city:'1552465011-b4e21bf6e79a', sunset:'1507525428034-b723cf961d3e', atv:'1504870712357-65ea720d6078',
  show:'1508672019048-805c876b67e2', kayak:'1519046904884-53103b34b206', hotel:'1566073771259-6a8506099945'
};

const GROUPS = [
  { id:'g1', th:'โชว์ & ซิตี้ทัวร์', en:'Shows & City', icon:'sparkles', cats:['show','city','activity'] },
  { id:'g2', th:'ทะเล & เอาท์ดอร์', en:'Sea & Outdoor', icon:'waves', cats:['seatour','tourth','water','outdoor'] },
  { id:'g3', th:'ไลฟ์สไตล์ & ที่พัก', en:'Lifestyle & Stay', icon:'palmtree', cats:['stay','spa','animal','lounge','food'] },
];
const CATS = {
  show:    { th:'Show in Phuket', en:'Show in Phuket', icon:'drama', color:'maroon', count:12 },
  city:    { th:'City Tour', en:'City Tour', icon:'landmark', color:'sun', count:9 },
  activity:{ th:'Activity', en:'Activity', icon:'party-popper', color:'lagoon', count:18 },
  seatour: { th:'Sea Tour', en:'Sea Tour', icon:'sailboat', color:'lagoon', count:24 },
  tourth:  { th:'ทัวร์ทะเล', en:'Island Tours', icon:'tree-palm', color:'sun', count:16 },
  water:   { th:'กิจกรรมทางน้ำ', en:'Water Activities', icon:'waves', color:'lagoon', count:14 },
  outdoor: { th:'กิจกรรมเอาท์ดอร์', en:'Outdoor Activities', icon:'mountain', color:'maroon', count:11 },
  stay:    { th:'ที่พัก', en:'Stays', icon:'bed-double', color:'maroon', count:20 },
  spa:     { th:'นวดสปา', en:'Massage & Spa', icon:'flower-2', color:'sun', count:8 },
  animal:  { th:'เกี่ยวกับสัตว์', en:'Animal Encounters', icon:'paw-print', color:'lagoon', count:6 },
  lounge:  { th:'Lounge', en:'Lounge', icon:'martini', color:'maroon', count:7 },
  food:    { th:'ร้านอาหาร', en:'Restaurants', icon:'utensils', color:'sun', count:15 },
};
/* activities & tours from /admin → กิจกรรม & ทัวร์ (window.__ACTS__, defaults in data/activities.json) */
const ACTS = window.__ACTS__ || [];
/* photos set in admin first, else the files in public/img/acts named after the activity id */
const actImgs = a => (a.imgs && a.imgs.length ? a.imgs : SHOWIMG[a.pic] || []);
const ROUTES = [
  ['Phi Phi','2 ชม. จากภูเก็ต','2h from Phuket',IMG.phiphi],['Racha Yai','น้ำใสระดับคริสตัล','Crystal-clear water',IMG.beach],
  ['Phang Nga Bay','เขาหินปูนกลางทะเล','Limestone karsts',IMG.longtail],['Khai Island','ดำน้ำตื้นใกล้เมือง','Easy snorkeling',IMG.snorkel],
  ['Hong Krabi','ลากูนลับ','Hidden lagoon',IMG.ocean],['Coral Island','หาดทรายขาว','White sand beach',IMG.sunset],
  ['Naka Noi','เกาะไข่มุก','Pearl island',IMG.kayak],['Maiton','ชมโลมา','Dolphin spotting',IMG.beach],
];

/* =========================================================
   I18N
   ========================================================= */
const I18N = {
  en: {
    'topbar.tat':'TAT License No. ' + SET.tat,'topbar.loc':'Phuket · Krabi · Phang Nga',
    'nav.boats':'Charter','nav.tours':'Tours & Activities','nav.routes':'Top Routes','nav.lifestyle':'Stays & Lifestyle','nav.contact':'Contact',
    'cta.quick':'Quick Book',
    'hero.badge':'Andaman high season is here · 1 Nov – 30 Apr','hero.title':'Sail the Andaman<br/>your own way',
    'hero.sub':'50+ private yachts, catamarans and speedboats — plus tours, shows and activities across Phuket, all in one place.',
    'hero.cta1':'View all boats','hero.cta2':'Explore activities',
    'qs.tabBoat':'Charter a boat','qs.tabAct':'Tours & Activities','qs.note':'Confirmed in 30 min · No booking fee','qs.trip':'Trip type','qs.tripAll':'All trips',
    'qs.half':'Half day (4h)','qs.full':'Full day (8h)','qs.sunset':'Sunset (2–3h)','qs.overnight':'Overnight (2D1N)','qs.dest':'Destination','qs.date':'Date','qs.guests':'Guests','qs.search':'Search','qs2.boat':'Charter a boat','qs2.tours':'Tours & activities','qs2.dests':'Destinations','qs2.smart':'Help me choose','qs2.anyDest':'All destinations','qs2.pop':'Popular','qs2.chat':'Chat on','qs2.help':'and our team will help you pick a boat',
    'unit.pax':'pax','stat.boats':'boats in our fleet','stat.marina':'marinas & piers','stat.group':'guests per boat','stat.tat':'TAT licensed',
    'cat.kicker':'Explore Phuket','cat.title':'What are we doing today?','cat.sub':'Pick a category and we\'ll curate the best experiences for you.',
    'boats.kicker':'Our Fleet','boats.title':'Featured Boats','boats.sub':'From thrill-seeking speedboats to a 90 ft superyacht — every charter includes captain, crew and insurance.',
    'boats.empty':'No boats match these filters. Try adjusting them.',
    'sort.pop':'Sort: Popular','sort.low':'Price: Low → High','sort.high':'Price: High → Low','sort.size':'Boat size',
    'routes.kicker':'Island Hopping','routes.title':'Top routes from Phuket',
    'act.kicker':'Things to do','act.title':'Popular activities & attractions in Phuket',
    'promo.tag':'OVERNIGHT CHARTER','promo.title':'Sleep on the sea, wake up to an Andaman sunrise','promo.sub':'2 days 1 night aboard the VTECH 68 ft yacht — all meals, park fees and transfers included.','promo.cta':'View package',
    'price.from':'From','book.kicker':'Plan your trip','book.title':'Tell us where you want to go','book.sub':'Our team will get back to you with a quote and a tailored itinerary within 30 minutes (09:00–21:00).','book.call':'Call to book',
    'modal.title':'Book a Boat & Activity',
    'f.item':'Boat / activity of interest','f.name':'Full name','f.namePh':'e.g. John Smith','f.phone':'Phone / LINE ID','f.date':'Travel date','f.guests':'Guests','f.adult':'Adults','f.kid':'Kids',
    'f.slot':'Time slot','f.fullday':'Full day 10:00–18:00','f.overnight':'Overnight','f.note':'Notes / special requests','f.notePh':'e.g. birthday celebration, hotel pick-up, food allergies…',
    'f.consent':'Our sales team will contact you on WhatsApp / LINE / phone to check availability and suggest options for this request.','f.marketing':'Send me news, offers and last-minute availability (unsubscribe anytime)','f.err':'Please fill in your name, phone and travel date','f.email':'Email','f.opt':'(optional)','f.submit':'Send booking request',
    'foot.about':'Private yacht, catamaran and speedboat charters with full-service tours and activities in Phuket, Krabi and Phang Nga.',
    'foot.services':'Services','foot.l1':'Private yacht charter','foot.l2':'Catamarans','foot.l3':'Speedboats','foot.l4':'Tours & activities','foot.l5':'Stays & spa',
    'foot.info':'Information','foot.i1':'About us','foot.i2':'Marinas & piers','foot.i3':'FAQ','foot.i4':'Booking & cancellation','foot.i5':'Privacy policy','foot.contact':'Contact',
    'foot.addr':'79/29 Moo 4, Koh Kaew, Muang Phuket, Phuket 83000','foot.marinas':'Royal Phuket Marina · Ao Po Grand Marina · Chalong Pier · Boat Lagoon · ONE°15 Panwa','foot.mock':'HTML Mockup v2 · for the Next.js rebuild','sending':'Sending…',
    // dynamic
    'all':'All','type.speed':'Speedboat','type.overnight':'Overnight','hot':'Popular',
    'type.sail':'Sailing Catamaran','type.power':'Power Catamaran','type.longtail':'Long-tail Boat','type.yacht':'Motor Yacht',
    'home':'Home','fleet':'All Boats','fleetTitle':'Our Fleet','fleetSub':'{n} yachts, catamarans, speedboats and luxury long-tail boats across Phuket — every detail straight from our official brochure.',
    'searchBoat':'Search boat, marina, island…','allLoc':'All locations','anyPax':'Any group size','sort.default':'Sort: Default','sort.pax':'Capacity',
    'boats.emptyTxt':'No boats match these filters.','boatsUnit':'boats','select':'Select','notFound':'Boat not found','viewPhotos':'View photos',
    'programs2':'Programs & prices','vatNote':'USD shown at 1 USD = 33.42 THB · charged in THB incl. 7% VAT','timeSlots':'Time slots','includes2':'This price includes','complimentary':'Complimentary / Amenities','notIncluded':'Not included',
    'boatInfo':'Boat specifications','notes':'Notes','vanTitle':'Private van transfer (add-on)','extraTitle':'Extra services & terms','payTitle':'Payment & cancellation policy',
    'upTo':'Up to','f.dateS':'Date','qs.guestsS':'Guests','callUs':'Call us','trust1':'Insured trips','trust3':'Thai/EN support','similar':'Similar boats you may like','prev':'Previous','next':'Next',
    'paxOver':'This boat takes up to {n} guests — please choose a larger boat or contact us.','paxExtra':'Extra guests may incur a per-person surcharge — see notes below.','anyProgram':'— Any program / please recommend —',
    'f.program':'Program / route','boats.viewAll':'View all 70 boats',
    'boats.disclaimer':'* "From" = lowest rate in the BTT brochure, converted to USD at 1 USD = 33.42 THB (approx.). Charters are invoiced in THB incl. 7% VAT; final price depends on season, route and group size.',
    
    'bookNow':'Book','guests':'guests','details':'Details','book':'Book now','perTrip':'/ trip','items':'experiences','showing':'Showing','clear':'Clear',
    'programs':'Programs & prices (low season)','program':'Program','price':'Price','includes':'Included','inc1':'Captain, crew & hostess','inc2':'Snorkel gear & paddle board','inc3':'Soft drinks, fruit & towels','inc4':'Insurance & 7% VAT',
    'marina':'Marina','size':'Size','cap':'Capacity','bookThis':'Book this boat','ask':'Ask on LINE','sent':'Request sent! Our team will contact you within 30 minutes.',
    'found':'boats found','searchFor':'Results for','anyDest':'any destination','pickDate':'any date','toastLang':'Switched to English','chooseItem':'— Not sure yet / please recommend —',
    'boatsGroup':'Boats','actsGroup':'Activities','viewAll':'View all',
  }
};
let LANG = window.__LANG__ || 'th';
const TH_CACHE = {};
const t = (k, th) => LANG === 'en' ? (I18N.en[k] ?? th ?? k) : (th ?? TH_DYN[k] ?? k);
const TH_DYN = {
  'all':'ทั้งหมด','type.speed':'สปีดโบ๊ท','type.overnight':'ค้างคืน','hot':'ยอดนิยม',
  'type.sail':'เรือใบคาตามารัน','type.power':'พาวเวอร์คาตามารัน','type.longtail':'เรือหางยาว','type.yacht':'เรือยอชต์',
  'home':'หน้าแรก','fleet':'เรือทั้งหมด','fleetTitle':'เรือทั้งหมดของเรา','fleetSub':'เรือยอชต์ คาตามารัน สปีดโบ๊ท และเรือหางยาวหรู {n} ลำ ทั่วภูเก็ต — ข้อมูลครบตามโบรชัวร์ทางการ',
  'searchBoat':'ค้นหาชื่อเรือ ท่าเรือ เกาะ…','allLoc':'ทุกพื้นที่','anyPax':'ทุกขนาดกลุ่ม','sort.default':'เรียง: ค่าเริ่มต้น','sort.pax':'ความจุ',
  'boats.emptyTxt':'ไม่พบเรือที่ตรงกับตัวกรอง','boatsUnit':'ลำ','select':'เลือก','notFound':'ไม่พบเรือลำนี้','viewPhotos':'ดูรูปทั้งหมด',
  'programs2':'โปรแกรม & ราคา','vatNote':'ราคาตามโบรชัวร์ รวม VAT 7% · อาจมีการเปลี่ยนแปลง','timeSlots':'รอบเวลา','includes2':'ราคานี้รวม','complimentary':'บริการฟรี / สิ่งอำนวยความสะดวก','notIncluded':'ไม่รวมในราคา',
  'boatInfo':'ข้อมูลเรือ','notes':'หมายเหตุ','vanTitle':'บริการรถตู้รับส่งส่วนตัว (เพิ่มเติม)','extraTitle':'บริการเสริม & ข้อกำหนด','payTitle':'การชำระเงิน & นโยบายยกเลิก',
  'upTo':'สูงสุด','f.dateS':'วันที่','qs.guestsS':'จำนวนคน','callUs':'โทรหาเรา','trust1':'มีประกันภัย','trust3':'ซัพพอร์ต ไทย/EN','similar':'เรือที่คล้ายกัน','prev':'ก่อนหน้า','next':'ถัดไป',
  'sending':'กำลังส่ง…','paxOver':'เรือลำนี้รับได้สูงสุด {n} คน — เลือกเรือที่ใหญ่ขึ้นหรือติดต่อทีมงาน','paxExtra':'ผู้โดยสารเพิ่มอาจมีค่าใช้จ่ายต่อคน — ดูหมายเหตุด้านล่าง','anyProgram':'— ยังไม่เลือก / ให้ทีมงานแนะนำ —',
  
  'bookNow':'จองเลย','guests':'คน','details':'ดูรายละเอียด','book':'จองเรือ','perTrip':'/ ทริป','items':'รายการ','showing':'แสดง','clear':'ล้าง',
  'programs':'โปรแกรมและราคา (Low Season)','program':'โปรแกรม','price':'ราคา','includes':'รวมในแพ็กเกจ','inc1':'กัปตัน ลูกเรือ และโฮสเตส','inc2':'อุปกรณ์ดำน้ำตื้น & แพดเดิลบอร์ด','inc3':'น้ำดื่ม ผลไม้ และผ้าเย็น','inc4':'ประกันภัย & VAT 7%',
  'marina':'ท่าเรือ','size':'ขนาด','cap':'ความจุ','bookThis':'จองเรือลำนี้','ask':'สอบถามทาง LINE','sent':'ส่งคำขอเรียบร้อย! ทีมงานจะติดต่อกลับภายใน 30 นาที',
  'found':'ลำที่พบ','searchFor':'ผลการค้นหา','anyDest':'ทุกจุดหมาย','pickDate':'ทุกวัน','toastLang':'เปลี่ยนเป็นภาษาไทยแล้ว','chooseItem':'— ยังไม่แน่ใจ / ให้ทีมงานแนะนำ —',
  'boatsGroup':'เรือ','actsGroup':'กิจกรรม','viewAll':'ดูทั้งหมด',
};

function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (!(k in TH_CACHE)) TH_CACHE[k] = el.hasAttribute('data-th') ? el.getAttribute('data-th') : el.textContent;
    el.setAttribute('data-th', TH_CACHE[k]);
    el.textContent = LANG === 'en' ? (I18N.en[k] ?? TH_CACHE[k]) : TH_CACHE[k];
  });
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    const k = el.getAttribute('data-i18n-html');
    if (!(k in TH_CACHE)) TH_CACHE[k] = el.hasAttribute('data-th') ? el.getAttribute('data-th') : el.innerHTML;
    el.setAttribute('data-th', TH_CACHE[k]);
    el.innerHTML = LANG === 'en' ? (I18N.en[k] ?? TH_CACHE[k]) : TH_CACHE[k];
  });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const k = 'ph:' + el.getAttribute('data-i18n-ph');
    if (!(k in TH_CACHE)) TH_CACHE[k] = el.hasAttribute('data-th-ph') ? el.getAttribute('data-th-ph') : el.placeholder;
    el.setAttribute('data-th-ph', TH_CACHE[k]);
    el.placeholder = LANG === 'en' ? (I18N.en[el.dataset.i18nPh] ?? TH_CACHE[k]) : TH_CACHE[k];
  });
}

/* =========================================================
   HELPERS
   ========================================================= */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
/* Currency: TH = THB (source of truth from brochure). EN = USD converted from THB.
   FX source: Wise mid-market, 19 Oct 2026 — 1 USD = 33.42 THB. In Next.js replace with a daily rate from an FX API. */
const FX_THB_PER_USD = 33.42;
const toUSD = n => Math.round(n / FX_THB_PER_USD);
const baht = n => LANG === 'en' ? '$' + toUSD(n).toLocaleString('en-US') : '฿' + n.toLocaleString('en-US');
const moneyText = txt => LANG === 'en' ? String(txt).replace(/(?:฿\s?)?(\d[\d,]{2,})(?:\.\d+)?\s*(?:T\s*HB|baht)\b/gi, (m, n) => '$' + toUSD(+n.replace(/,/g,'')).toLocaleString('en-US')) : txt;
const icons = () => { window.lucide && lucide.createIcons(); try { observeReveal(); updateFavUI(); } catch (e) {} };
const imgTag = (id, cls='', w=900, alt='') => `<img loading="lazy" src="${U(id,w)}" alt="${alt}" class="${cls}" onerror="this.classList.add('err')" />`;
function toast(msg) { $('#toastText').textContent = msg; const el=$('#toast'); el.classList.remove('hidden'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.add('hidden'), 2800); }
const colorCls = { maroon:'bg-maroon-50 text-ink', sun:'bg-sun-100 text-sun-600', lagoon:'bg-lagoon-50 text-lagoon-700' };

/* =========================================================
   CATEGORIES
   ========================================================= */
let activeGroup = 'all', activeCat = null;
function renderGroups() {}
function renderCats() {
  const keep = $('#catGrid').scrollLeft;
  const item = (key, icon, label, on) => `<button data-c="${key}" role="tab" aria-selected="${on}" class="cbar-item ${on?'is-on':''}"><i data-lucide="${icon}" class="w-[18px] h-[18px]" stroke-width="1.5"></i><span>${label}</span></button>`;
  const all = item('', 'layout-grid', t('all'), !activeCat);
  $('#catGrid').innerHTML = all + GROUPS.flatMap(g => g.cats).filter(c => ACTS.some(x => x.cat === c)).map(c => { const C = CATS[c]; return item(c, C.icon, LANG==='en'?C.en:C.th, activeCat===c); }).join('');
  $('#catGrid').scrollLeft = keep;
  $$('.cbar-item').forEach(b => b.onclick = () => {
    const c = b.dataset.c; actAll = false; activeCat = c || null; activeGroup = c ? GROUPS.find(g => g.cats.includes(c)).id : 'all';
    renderCats(); renderActs();
  });
  $('#catGrid').onscroll = catNavState; setTimeout(catNavState, 30);
  icons();
}
function catScroll(d) { const r = $('#catGrid'); r.scrollBy({ left: d * r.clientWidth * .7, behavior: 'smooth' }); }
function catNavState() { const r = $('#catGrid'); if (!r) return; $('#catPrev').classList.toggle('is-off', r.scrollLeft < 8); $('#catNext').classList.toggle('is-off', r.scrollLeft + r.clientWidth >= r.scrollWidth - 8); }

let actAll = false;
const rateCur = r => { if (r.flat) return 0; const t = todayISO(); return r.cols.findIndex(c => !c.ranges || c.ranges.some(([f, e]) => t >= f && t <= e)); };
const rateEnd = r => r.cols.flatMap(c => (c.ranges || []).map(x => x[1])).sort().pop();
const firstV = v => Array.isArray(v) ? v[0] : v;
const numV = v => typeof v === 'number' ? v.toLocaleString() : (v ?? '—');
function stayFrom(a) { const r = a.rates; if (!r) return null; const ci = rateCur(r); if (ci < 0) return null; const ns = r.groups.slice(0, 1).flatMap(g => g.rows.filter(x => !x.extra).flatMap(x => r.flat && r.allCols ? x.v.flat() : [firstV(x.v[ci])])).filter(v => typeof v === 'number'); return ns.length ? Math.min(...ns) : null; }
function rateHTML(a) {
  const r = a.rates, lang = LANG === 'en' ? 'en' : 'th', ci = rateCur(r), end = rateEnd(r), exp = end && todayISO() > end, sub = r.sub, span = sub ? sub.length : 1;
  const cell = v => Array.isArray(v) ? v.map(x => `<td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">${numV(x)}</td>`).join('') : `<td class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">${numV(v)}</td>`;
  const hl = i => i === ci && !exp && !r.flat ? 'bg-maroon-50/70' : '';
  const range = c => c.ranges ? c.ranges.map(([f, e]) => `${fmtMD(f, lang)}–${fmtMD(e, lang)}`).join(', ') : '';
  return `<div class="mt-7"><div class="flex items-end justify-between gap-3"><p class="text-[11px] uppercase tracking-[.16em] text-muted">${r.title ? r.title[lang] : L('ราคาห้องพัก', 'Room rates')} (THB${r.unit[lang]})</p>${r.note ? `<span class="text-[11px] text-muted">${r.note[lang]}</span>` : ''}</div>
    ${exp ? `<p class="mt-2 flex gap-2 items-start rounded-xl bg-[#fff6e5] text-[#7a4a00] text-[12.5px] px-3 py-2.5"><i data-lucide="info" class="w-4 h-4 shrink-0 mt-px"></i>${L(`เรตจากโรงแรมใช้ได้ถึง ${fmtMD(end, 'th')} · ราคาช่วงนี้กรุณาสอบถามทีมงาน`, `Hotel rates valid until ${fmtMD(end, 'en')} · please ask us for current prices`)}</p>` : (end ? `<p class="mt-1 text-[11.5px] text-muted">${L(`ราคาใช้ได้ถึง ${fmtMD(end, 'th')}`, `Valid until ${fmtMD(end, 'en')}`)}</p>` : '')}
    <div class="mt-3 overflow-x-auto rounded-[14px] ring-1 ring-sand-200"><table class="w-full text-[13px] min-w-[520px]">
      <thead><tr class="text-left"><th class="px-3 py-2.5 font-medium text-xs text-muted align-bottom" ${sub ? 'rowspan="2"' : ''}>${r.rowLabel ? r.rowLabel[lang] : L('ประเภทห้อง', 'Room type')}</th>${r.cols.map((c, i) => `<th colspan="${span}" class="px-3 py-2.5 text-right align-bottom ${hl(i)} ${c.peak ? 'text-maroon' : 'text-ink'}"><span class="block font-medium text-xs">${c.label[lang]}${i === ci && !exp && !r.flat && r.cols.length > 1 ? ` <em class="not-italic text-[10px] text-white bg-maroon px-1.5 py-px rounded-full ml-1">${L('ตอนนี้', 'now')}</em>` : ''}</span><span class="block text-[10.5px] text-muted font-normal mt-0.5">${range(c)}</span></th>`).join('')}</tr>
        ${sub ? `<tr>${r.cols.map((c, i) => sub.map(x => `<th class="px-3 pb-2 text-right font-normal text-[10.5px] text-muted ${hl(i)}">${x[lang]}</th>`).join('')).join('')}</tr>` : ''}</thead>
      <tbody>${r.groups.map(g => `${g.name ? `<tr class="bg-sand/70"><td colspan="${1 + r.cols.length * span}" class="px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted">${g.name[lang]}</td></tr>` : ''}${g.rows.map(x => `<tr class="border-t border-sand-200 ${x.extra ? 'text-muted' : ''}"><td class="px-3 py-2.5"><span class="block font-medium ${x.extra ? 'font-normal' : 'text-ink'}">${typeof x.n === 'object' ? x.n[lang] : x.n}</span>${x.d && x.d[lang] ? `<span class="block text-[11px] text-muted">${x.d[lang]}</span>` : ''}</td>${x.v.map((v, i) => cell(v).replace(/<td class="/g, `<td class="${hl(i)} `)).join('')}</tr>`).join('')}`).join('')}</tbody></table></div></div>`;
}
function openAct(pic, k = 0) {
  track('ViewContent', { content_ids: [pic], content_type: 'activity', content_category: (ACTS.find(x => x.pic === pic) || {}).cat }, false);
  const a = ACTS.find(x => x.pic === pic), imgs = actImgs(a), lang = LANG === 'en' ? 'en' : 'th', name = lang === 'en' ? a.en : a.th;
  let m = $('#actModal'); if (!m) { m = document.createElement('div'); m.id = 'actModal'; m.className = 'fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-6'; document.body.appendChild(m); }
  m.innerHTML = `<div class="absolute inset-0 bg-black/55" onclick="closeAct()"></div>
    <div class="relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-t-[22px] sm:rounded-[22px] shadow-2xl fade-up" role="dialog" aria-modal="true" aria-label="${name}">
      <button onclick="closeAct()" class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 grid place-items-center shadow" aria-label="close"><i data-lucide="x" class="w-4 h-4"></i></button>
      <div class="relative aspect-[16/9] bg-sand"><img id="actMain" src="${imgs[k] || ''}" alt="${name}" class="absolute inset-0 w-full h-full object-cover"/></div>
      ${imgs.length > 1 ? `<div class="flex gap-2 px-5 pt-3 overflow-x-auto no-scrollbar">${imgs.map((src, i) => `<button onclick="$('#actMain').src=this.querySelector('img').src;$$('#actModal .act-th').forEach(b=>b.classList.remove('ring-maroon'));this.classList.add('ring-maroon')" class="act-th shrink-0 w-20 aspect-[4/3] rounded-lg overflow-hidden ring-2 ${i === k ? 'ring-maroon' : 'ring-transparent'}"><img src="${src}" alt="" class="w-full h-full object-cover"/></button>`).join('')}</div>` : ''}
      <div class="p-5 sm:p-7">
        <p class="text-[11px] uppercase tracking-[.16em] text-maroon">${[lang === 'en' ? CATS[a.cat].en : CATS[a.cat].th, lang === 'en' ? a.loc : (a.locTh || a.loc), lang === 'en' ? a.dur : (a.durTh ?? a.dur)].filter(Boolean).join(' · ')}</p>
        <h3 class="font-display font-medium text-2xl sm:text-[28px] text-ink leading-tight mt-1.5">${name}</h3>
        <p class="text-muted mt-1">${a.tag[lang]}</p>${a.op ? `<p class="text-[12px] text-muted mt-2">${L('ให้บริการโดย', 'Operated by')} <span class="text-ink">${a.op}</span></p>` : ''}
        <div class="mt-5 space-y-3 text-[15px] leading-relaxed text-ink/85">${a.desc[lang].split('\n').map(x => `<p>${x}</p>`).join('')}</div>
        ${a.progs ? `<div class="mt-6"><p class="text-[11px] uppercase tracking-[.16em] text-muted">${a.progs.title[lang]}</p><ul class="mt-3 grid sm:grid-cols-2 gap-2">${a.progs.items.map(x => `<li class="flex gap-2 items-start rounded-xl ring-1 ring-sand-200 px-3 py-2.5 text-[13.5px]"><i data-lucide="anchor" class="w-4 h-4 text-maroon shrink-0 mt-px"></i>${x[lang]}</li>`).join('')}</ul></div>` : ''}
        ${a.facts ? `<ul class="mt-5 grid sm:grid-cols-3 gap-2">${a.facts.map(f => `<li class="flex gap-2 items-start rounded-xl bg-sand px-3 py-2.5 text-[13px]"><i data-lucide="check" class="w-4 h-4 text-maroon shrink-0 mt-px"></i>${f[lang]}</li>`).join('')}</ul>` : ''}
        ${a.rates ? rateHTML(a) : ''}
        ${a.itin ? `<div class="mt-6"><p class="text-[11px] uppercase tracking-[.16em] text-muted">${L('เส้นทาง', 'Itinerary')}</p><ol class="mt-3 space-y-2.5">${a.itin.map((x, n) => { const [h, ...r] = x[lang].split(' – '); return `<li class="flex gap-3"><span class="w-6 h-6 shrink-0 rounded-full bg-maroon-50 text-maroon text-xs grid place-items-center tabular-nums">${n + 1}</span><span class="text-[14px] leading-relaxed"><b class="font-medium text-ink">${h}</b>${r.length ? ` <span class="text-muted">– ${r.join(' – ')}</span>` : ''}</span></li>`; }).join('')}</ol></div>` : ''}
        ${(() => { if (!a.kw && !a.marina) return ''; const bs = FLEET.filter(b => a.marina ? (b.marina || '').toLowerCase().includes(a.marina) : b.tables.some(t => t.rows.some(r => a.kw.some(k => (r[0] || '').toLowerCase().includes(k))))).sort((x, y) => (x.from_ || 9e9) - (y.from_ || 9e9)); if (!bs.length) return '';
          return `<div class="mt-7 rounded-[18px] bg-sand p-4"><div class="flex items-center justify-between gap-3"><p class="font-medium text-ink text-[15px]">${a.marina ? L('เรือที่ออกจากท่า Boat Lagoon ที่ตั้งของโรงแรม', 'Boats departing from Boat Lagoon marina') : L(`เช่าเรือส่วนตัวไป${a.th}`, `Private boats to ${a.en}`)}</p><span class="text-xs text-muted whitespace-nowrap">${bs.length} ${L('ลำ', 'boats')}</span></div>
            <div class="mt-3 grid sm:grid-cols-3 gap-2">${bs.slice(0, 3).map(b => `<a href="#/boat/${b.slug}" onclick="closeAct()" class="flex sm:block items-center gap-3 bg-white rounded-[14px] p-2 hover:ring-1 hover:ring-maroon/30"><img src="${bimg(b.slug, 'a')}" alt="" class="w-20 sm:w-full aspect-[4/3] object-cover rounded-[10px]"/><span class="block sm:mt-2 min-w-0"><span class="block text-[13px] font-medium truncate">${niceTitle(b.title)}</span><span class="block text-[12px] text-muted">${t('price.from','เริ่มต้น')} ${baht(b.from_)}</span></span></a>`).join('')}</div>
            ${bs.length > 3 ? `<a href="#/fleet" onclick="closeAct()" class="inline-flex items-center gap-1 mt-3 text-[13px] text-maroon">${L('ดูเรือทั้งหมดที่ไปเส้นทางนี้', 'See all boats for this route')} <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></a>` : ''}</div>`; })()}
        <div class="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 pt-5 border-t border-sand-200">
          <div class="flex-1"><p class="text-[11px] text-muted">${L('ราคา', 'Price')}</p><p class="font-medium">${a.price ? baht(a.price) : stayFrom(a) ? `${L('เริ่ม', 'From')} ${baht(stayFrom(a))}${a.rates.unit[lang]}` : (a.cat === 'stay' ? L('สอบถามราคาและห้องว่างกับทีมงาน', 'Ask our team for rates and availability') : a.cat === 'lounge' ? L('สอบถามราคาและจองกับทีมงาน', 'Ask our team for prices and booking') : a.cat === 'food' ? L('สอบถามเมนูและจองโต๊ะกับทีมงาน', 'Ask our team for the menu and table booking') : a.cat === 'tourth' ? L('สอบถามราคาและวันเดินทางกับทีมงาน', 'Ask our team for prices and dates') : a.cat === 'show' ? L('สอบถามราคาและรอบการแสดงกับทีมงาน', 'Ask our team for prices and show times') : L('สอบถามราคาและวันว่างกับทีมงาน', 'Ask our team for prices and availability'))}</p></div>
          <button onclick="closeAct();openBooking('act:${a.en}')" class="bg-maroon text-white px-6 h-11 rounded-full text-sm">${L('สอบถาม / จอง', 'Enquire / Book')}</button>
        </div>
      </div></div>`;
  m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; icons();
}
function closeAct() { const m = $('#actModal'); if (m) m.classList.add('hidden'); document.body.style.overflow = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAct(); });
function renderActs() {
  const g = GROUPS.find(x => x.id === activeGroup);
  const list = ACTS.filter(a => activeCat ? a.cat === activeCat : (!g || g.cats.includes(a.cat)));
  const label = activeCat ? (LANG==='en'?CATS[activeCat].en:CATS[activeCat].th) : (g ? (LANG==='en'?g.en:g.th) : t('all'));
  $('#actFilterLabel').innerHTML = `${t('showing')}: <b class="text-ink">${label}</b> · ${list.length} ${t('items')}` + (activeCat?` <button id="clearCat" class="ml-2 underline text-lagoon-700">${t('clear')}</button>`:'');
  if ($('#clearCat')) $('#clearCat').onclick = () => { activeCat=null; renderCats(); renderActs(); };
  const SEA = ['seatour','tourth','water'], seaBoats = FLEET.filter(b => bimg(b.slug,'a'));
  const media = (a,i) => actImgs(a).length ? `<img src="${actImgs(a)[0]}" alt="${(LANG==='en'?a.en:a.th)} – ${a.loc}, Phuket" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"/>` : SEA.includes(a.cat)
    ? `<img src="${bimg(seaBoats[(i*7)%seaBoats.length].slug, i%2?'b':'a')}" alt="${(LANG==='en'?a.en:a.th)} – ${a.loc}, Phuket" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"/>`
    : `<span class="absolute inset-0 act-ph"></span><i data-lucide="${CATS[a.cat].icon}" class="absolute right-[-10%] top-[8%] w-[70%] h-[70%] text-white/[.07]" stroke-width="1"></i>`;
  const lim = innerWidth < 640 ? 6 : 12, shown = actAll ? list : list.slice(0, lim);
  $('#actGrid').innerHTML = shown.map((a,i) => `
    <article class="act-card fade-up group relative aspect-[3/4] overflow-hidden img-fallback" style="animation-delay:${Math.min(i,10)*40}ms">
      ${media(a,i)}
      <span class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></span>
      <button class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/25 backdrop-blur text-white grid place-items-center hover:bg-black/40 z-10" aria-label="favorite" onclick="event.stopPropagation();this.querySelector('svg').classList.toggle('fill-white')"><i data-lucide="heart" class="w-3.5 h-3.5"></i></button>
      <button onclick="${a.desc ? `openAct('${a.pic}')` : `openBooking('act:${a.en}')`}" class="absolute inset-0 w-full h-full text-left" aria-label="${LANG==='en'?a.en:a.th}"></button>
      <div class="absolute inset-x-0 bottom-0 p-3.5 text-white pointer-events-none">
        <p class="text-[13px] leading-snug line-clamp-2">${LANG==='en'?a.en:a.th}</p>
        <p class="text-[11px] text-white/70 mt-0.5 truncate">${[LANG==='en' ? a.loc : (a.locTh || a.loc), LANG==='en' ? a.dur : (a.durTh ?? a.dur)].filter(Boolean).join(' · ')}</p>
        <div class="mt-2 flex items-center justify-between gap-2">
          <span class="text-[11px] text-white/70 truncate">${LANG==='en'?CATS[a.cat].en:CATS[a.cat].th}</span>
          ${(() => { const sf = stayFrom(a), lang = LANG === 'en' ? 'en' : 'th'; return a.price ? `<span class="text-[15px] font-medium tabular-nums whitespace-nowrap">${baht(a.price)}</span>` : sf ? `<span class="whitespace-nowrap text-right"><span class="text-[10px] text-white/70 mr-1">${L('เริ่ม','from')}</span><span class="text-[15px] font-medium tabular-nums">${baht(sf)}</span><span class="text-[10px] text-white/70">${a.rates.unit[lang]}</span></span>` : `<span class="text-[12px] whitespace-nowrap">${L('สอบถามราคา','Ask for price')}</span>`; })()}
        </div>
      </div>
    </article>`).join('');
  const more = $('#actMore');
  if (more) { more.hidden = list.length <= lim; more.innerHTML = actAll ? `${L('แสดงน้อยลง','Show less')} <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>` : `${L('ดูทั้งหมด','View all')} ${list.length} ${t('items')} <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`; }
  icons();
}

/* =========================================================
   FLEET HELPERS (data from BTT brochure → window.FLEET)
   ========================================================= */
const TYPES = ['yacht','sail','power','speed','longtail'];
const TYPE_COLOR = { yacht:'bg-maroon text-white', sail:'bg-lagoon text-white', power:'bg-lagoon-700 text-white', speed:'bg-sun text-ink', longtail:'bg-white text-ink' };
const DESTS = ['Phi Phi','Racha','Phang Nga','Khai','Coral','Maiton','Naka','Hong','Krabi','Promthep','Yao'];
const DEST_MAP = { 'Phi Phi':'Phi Phi','Racha Yai':'Racha','Phang Nga Bay':'Phang','Khai Island':'Khai','Coral Island':'Coral','Maiton':'Maiton','Naka Noi':'Naka','Hong Krabi':'Hong' };
const FEATURED = ['leopard-90-ft','splo-74-ft','vtech-68-ft','the-origin-90-ft','cognac-75-ft','siam-princess-70-ft','lobster-78-ft','leopard-40-ft','coco-40-ft','dean-44-ft','r5-47-ft','nanea-40-ft'];
const prettyMarina = s => (s||'').toLowerCase().replace(/(^|[\s(\/-])([a-zà-ÿ])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\bRpm\b/,'RPM').replace(/Puhket/,'Phuket').replace('One°15','ONE°15');
const infoGet = (b, ...keys) => { for (const k of keys) { const r = b.info.find(x => x[0].toLowerCase()===k.toLowerCase()); if (r && r[1] && r[1] !== 'N/A') return r[1]; } return null; };
/* photos at the size they are shown: /r/<w>/… is resized on the server (cards don't need the 1920 px originals). w = 0 → original */
const RS_W = [160, 320, 768, 1280, 1600];
const rs = (u, w = 768) => { if (!u || !w || !/^\/(boats|img|uploads)\//.test(u)) return u || ''; return '/r/' + (RS_W.find(x => x >= w) || 1600) + u; };
const bimg = (slug, k, w = 768) => rs((BIMG[slug] || {})[k] || '', w);
/** photos of a boat in admin order; falls back to the 3 brochure images */
const gallery = slug => { const g = (window.GALLERY || {})[slug]; return g && g.length ? g : ['hero', 'a', 'b'].map(k => bimg(slug, k, 0)).filter(Boolean); };
FLEET.forEach((b, i) => {
  b.idx = i;
  const blob = JSON.stringify(b.tables).toLowerCase() + ' ' + JSON.stringify(b.time_slots).toLowerCase();
  b.trips = ['half','full','sunset','overnight'].filter(k => blob.includes(k === 'overnight' ? 'night' : k));
  b.overnight = b.trips.includes('overnight') || !!infoGet(b,'Over Night','Overnight','Overnight Capacity');
  b.dest = DESTS.filter(d => blob.includes(d.toLowerCase()));
  b.hot = FEATURED.indexOf(b.slug) > -1 && FEATURED.indexOf(b.slug) < 6;
  b.marinaP = prettyMarina(b.marina);
  b.tags = [infoGet(b,'Cabin','Cabins','Bedroom') && `${infoGet(b,'Cabin','Cabins','Bedroom').split(' ')[0]} Cabin`, infoGet(b,'Cruising Speed','Cruising','Cruise Speed','Speed Cruise','Speed Cruising'), infoGet(b,'Year Refit','Last Refit','Refit','Year','Year Built') && 'Year ' + infoGet(b,'Year Refit','Last Refit','Refit','Year','Year Built')].filter(Boolean).slice(0,3);
});
/* translations staff save in /admin (boats.data.i18n): show the current language, brochure text as fallback.
   Display fields only — tables / time_slots stay in English because filters and pricing read them. */
const i18nPick = (o, src) => (o && String(o[LANG === 'en' ? 'en' : 'th'] || '').trim()) || src;
function locFleet() {
  const list = (arr, src) => Array.isArray(arr) && arr.length === src.length ? src.map((x, i) => i18nPick(arr[i], x)) : src;
  FLEET.forEach(b => {
    const i = b.i18n; if (!i) return;
    const s = b._src || (b._src = { title: b.title, subtitle: b.subtitle, includes: b.includes, complimentary: b.complimentary, not_included: b.not_included, notes: b.notes });
    b.title = i18nPick(i.name, s.title); b.subtitle = i18nPick(i.subtitle, s.subtitle);
    b.includes = list(i.includes, s.includes); b.complimentary = list(i.complimentary, s.complimentary); b.not_included = list(i.not_included, s.not_included);
    const n = i18nPick(i.notes, ''); b.notes = n ? n.split('\n').map(x => x.trim()).filter(Boolean) : s.notes;
  });
}
locFleet();
const progName = (b, ti, ri, raw) => i18nPick(b.i18n?.programs?.[ti]?.[ri], raw);
const slotName = (b, i, raw) => Array.isArray(b.i18n?.slots) && b.i18n.slots.length === b.time_slots.length ? i18nPick(b.i18n.slots[i], raw) : raw;
const bySlug = s => FLEET.find(b => b.slug === s);
const niceTitle = t => t.split(' ').map(w => /^ft$/i.test(w) ? 'ft' : /\d/.test(w) ? w : w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
const typeLabel = ty => t('type.' + ty);

function boatCard(b, i=0) {
  return `
    <article class="bcard reveal group bg-white overflow-hidden flex flex-col min-w-0" style="animation-delay:${Math.min(i,8)*50}ms">
      <div class="relative">
        <a href="#/boat/${b.slug}" class="block aspect-[4/3] img-fallback overflow-hidden" aria-label="${b.title}">
          <img loading="lazy" decoding="async" width="796" height="498" src="${bimg(b.slug,'hero')}" alt="${niceTitle(b.title)} – ${typeLabel(b.type)} for private charter, ${b.marinaP}" class="w-full h-full object-cover group-hover:scale-[1.04] transition duration-700" />
        </a>
        ${b.hot?`<span class="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur text-ink text-[11px] px-2.5 py-1 rounded-full shadow-sm"><i data-lucide="star" class="w-3 h-3 text-maroon fill-maroon"></i>${t('hot')}</span>`:''}
        <div class="absolute top-3 right-3 flex gap-2">
          <button data-cmp="${b.slug}" onclick="toggleCompare('${b.slug}')" aria-pressed="${CMP.includes(b.slug)}" aria-label="${L('เปรียบเทียบ','Compare')} ${b.title}" title="${L('เปรียบเทียบ','Compare')}" class="bcard-ico"><i data-lucide="git-compare" class="w-4 h-4"></i></button>
          <button data-fav="${b.slug}" onclick="toggleFav('${b.slug}')" aria-pressed="${FAV.includes(b.slug)}" aria-label="${L('บันทึก','Save')} ${b.title}" title="${L('บันทึก','Save')}" class="bcard-ico"><i data-lucide="heart" class="w-4 h-4 ${FAV.includes(b.slug)?'fill-maroon':''}"></i></button>
        </div>
      </div>
      <div class="px-5 pt-4 pb-5 flex flex-col flex-1">
        <p class="text-[10px] uppercase tracking-[.16em] text-muted truncate">${typeLabel(b.type)}</p>
        <h3 class="font-display text-lg leading-tight truncate mt-1"><a href="#/boat/${b.slug}" class="hover:text-maroon" title="${niceTitle(b.title)} yacht charter">${b.title}</a></h3>
        <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted mt-2.5">
          ${b.pax?`<span class="flex items-center gap-1.5"><i data-lucide="users" class="w-3 h-3"></i>${b.pax} ${t('guests')}</span>`:''}
          <span class="flex items-center gap-1.5 min-w-0"><i data-lucide="anchor" class="w-3 h-3 shrink-0"></i><span class="truncate">${b.marinaP}</span></span>
        </div>
        <div class="mt-auto pt-4">
          <div class="pt-3.5 border-t border-sand-200 flex items-end justify-between gap-2">
            <div class="min-w-0"><p class="text-[11px] text-muted leading-none">${t('price.from','เริ่มต้น')}</p><p class="text-base font-medium text-ink leading-tight mt-1 tabular-nums whitespace-nowrap">${b.from_?baht(b.from_):'—'}<span class="text-xs text-muted"> ${t('perTrip')}</span></p></div>
            <button onclick="openBooking('boat:${b.slug}')" class="shrink-0 h-8 px-4 bg-maroon text-white hover:bg-maroon-800 transition !text-[11px]">${t('book')}</button>
          </div>
          </div>
        </div>
      </div>
    </article>`;
}

/* =========================================================
   HOME · FEATURED BOATS
   ========================================================= */
let boatFilter = 'all', boatSort = 'pop', search = null;
const FILTERS = ['all', ...TYPES, 'overnight'];
function filterList(list, f) { return list.filter(b => f==='all' ? true : f==='overnight' ? b.overnight : b.type===f); }
function sortList(list, s) {
  const L = [...list];
  if (s==='low') L.sort((a,b)=>(a.from_||9e9)-(b.from_||9e9));
  if (s==='high') L.sort((a,b)=>(b.from_||0)-(a.from_||0));
  if (s==='size') L.sort((a,b)=>(b.ft||0)-(a.ft||0));
  if (s==='pax') L.sort((a,b)=>(b.pax||0)-(a.pax||0));
  return L;
}
function chipRow(el, cur, onPick) {
  el.innerHTML = FILTERS.map(f => `<button data-f="${f}" aria-pressed="${f===cur}" class="whitespace-nowrap px-4 py-2 text-sm font-medium ring-1 ring-sand-200 bg-white hover:ring-line-strong transition ${f===cur?'chip-active':''}">${t(f==='all'?'all':'type.'+f)}</button>`).join('');
  $$('button', el).forEach(b => b.onclick = () => onPick(b.dataset.f));
}
function renderBoatFilters() { chipRow($('#boatFilters'), boatFilter, f => { boatFilter = f; renderBoatFilters(); renderBoats(); }); }
function renderBoats() {
  let list;
  if (search) {
    list = filterList(FLEET, boatFilter).filter(b => (b.pax||99) >= search.guests
      && (search.trip==='all' || b.trips.includes(search.trip))
      && (!search.dest || b.dest.includes(DEST_MAP[search.dest] || search.dest)));
    $('#searchSummary').classList.remove('hidden'); $('#searchSummary').classList.add('flex');
    $('#searchSummary').innerHTML = `<i data-lucide="search" class="w-4 h-4"></i><span>${t('searchFor')}: <b>${search.dest||t('anyDest')}</b> · ${search.date||t('pickDate')} · ${search.guests} ${t('guests')} — <b>${list.length}</b> ${t('found')}</span><button id="clearSearch" class="ml-auto font-medium underline">${t('clear')}</button>`;
    $('#clearSearch').onclick = () => { search=null; $('#searchSummary').classList.add('hidden'); $('#searchSummary').classList.remove('flex'); renderBoats(); };
  } else {
    const featured = FEATURED.map(bySlug).filter(Boolean);
    list = filterList(featured, boatFilter);
    if (list.length < 3) list = filterList(FLEET, boatFilter).slice(0, 9);
  }
  if (boatSort !== 'pop') list = sortList(list, boatSort);
  $('#boatEmpty').classList.toggle('hidden', list.length>0);
  $('#boatGrid').innerHTML = list.slice(0, search ? 60 : 12).map(boatCard).join('');
  icons();
}

/* =========================================================
   FLEET PAGE  (#/fleet)
   ========================================================= */
const fleetState = { f:'all', s:'pop', q:'', loc:'all', pax:1 };
function renderFleetPage() {
  const v = $('#view-fleet');
  if (!v.dataset.built || v.dataset.lang !== LANG) {
    v.dataset.built = 1; v.dataset.lang = LANG;
    v.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-8 lg:pt-10">
      <nav aria-label="Breadcrumb" class="text-xs text-muted flex items-center gap-1.5"><a href="#/" class="hover:text-maroon">${t('home')}</a><i data-lucide="chevron-right" class="w-3 h-3"></i><span class="text-ink" aria-current="page">${t('fleet')}</span></nav>
      <div class="mt-5 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 class="font-display text-3xl sm:text-4xl leading-tight">${t('fleetTitle')}</h1>
          <p class="text-sm text-muted mt-2 max-w-2xl">${t('fleetSub').replace('{n}', FLEET.length)}</p>
        </div>
        <p id="fleetCount" class="text-xs text-muted shrink-0"></p>
      </div>
    </section>
    <section class="sticky top-[64px] z-30 bg-white/90 backdrop-blur-md mt-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div class="fl-bar flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-0 bg-white rounded-[22px] lg:rounded-full p-1.5">
          <label class="fl-search flex items-center gap-2 h-10 px-4 lg:w-64 shrink-0 rounded-full">
            <i data-lucide="search" class="w-4 h-4 text-muted shrink-0"></i><input id="fleetQ" class="bg-transparent w-full text-[13px] focus:outline-none !shadow-none !ring-0" placeholder="${t('searchBoat')}" value="${fleetState.q}" /></label>
          <span class="hidden lg:block w-px h-6 bg-[rgb(35_20_22/.1)] mx-1"></span>
          <div id="fleetChips" class="fl-chips flex gap-1 overflow-x-auto no-scrollbar min-w-0 flex-1 px-1"></div>
          <span class="hidden lg:block w-px h-6 bg-[rgb(35_20_22/.1)] mx-1"></span>
          <div class="flex gap-1 shrink-0">
            <select id="fleetLoc" hidden><option value="all">all</option></select>
            <select id="fleetPax" class="fl-sel">${[1,10,20,30,50].map(n=>`<option value="${n}">${n===1?t('anyPax'):n+'+ '+t('guests')}</option>`).join('')}</select>
            <select id="fleetSort" class="fl-sel"><option value="pop">${t('sort.default')}</option><option value="low">${t('sort.low')}</option><option value="high">${t('sort.high')}</option><option value="size">${t('sort.size')}</option><option value="pax">${t('sort.pax')}</option></select>
          </div>
        </div>
      </div>
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-16">
      <div id="fleetGrid" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"></div>
      <div id="fleetEmpty" class="hidden text-center py-16 text-muted">${t('boats.emptyTxt')}</div>
    </section>`;
    $('#fleetQ').oninput = e => { fleetState.q = e.target.value; drawFleet(); };
    $('#fleetLoc').value = fleetState.loc; $('#fleetLoc').onchange = e => { fleetState.loc = e.target.value; drawFleet(); };
    $('#fleetPax').value = fleetState.pax; $('#fleetPax').onchange = e => { fleetState.pax = +e.target.value; drawFleet(); };
    $('#fleetSort').value = fleetState.s; $('#fleetSort').onchange = e => { fleetState.s = e.target.value; drawFleet(); };
  }
  drawFleet();
}
function drawFleet() {
  if ($('#fleetQ') && $('#fleetQ').value !== fleetState.q) $('#fleetQ').value = fleetState.q;
  chipRow($('#fleetChips'), fleetState.f, f => { fleetState.f = f; drawFleet(); });
  const q = fleetState.q.trim().toLowerCase();
  const favOnly = VH.hash.includes('?fav');
  let list = filterList(FLEET, fleetState.f).filter(b => (!favOnly || FAV.includes(b.slug)) &&
    (!q || (b.title+' '+b.subtitle+' '+b.marina+' '+b.dest.join(' ')).toLowerCase().includes(q)) &&
    (fleetState.loc==='all' || (fleetState.loc==='pattaya') === b.pattaya) &&
    ((b.pax||0) >= fleetState.pax));
  list = sortList(list, fleetState.s);
  $('#fleetCount').innerHTML = `${t('showing')} <b class="text-ink font-medium">${list.length}</b> / ${FLEET.length} ${t('boatsUnit')}`;
  $('#fleetEmpty').classList.toggle('hidden', list.length > 0);
  $('#fleetGrid').innerHTML = list.map(boatCard).join('');
  icons();
}

/* =========================================================
   BOAT DETAIL PAGE  (#/boat/:slug)
   ========================================================= */
const ICON_FOR = k => { k=k.toLowerCase();
  if (/capacity|guest/.test(k) && !/water|fuel/.test(k)) return 'users';
  if (/length|loa|l\.o\.a|size|beam|draft/.test(k)) return 'ruler';
  if (/cabin|bedroom|over ?night/.test(k)) return 'bed-double';
  if (/speed|cruis/.test(k)) return 'gauge';
  if (/year|refit|launch|renovat|built/.test(k)) return 'calendar';
  if (/crew/.test(k)) return 'user-round-cog';
  if (/toilet|bath|shower/.test(k)) return 'bath';
  if (/engine|mercury|suzuki|yamaha/.test(k)) return 'cog';
  if (/water|fuel/.test(k)) return 'droplets';
  if (/air/.test(k)) return 'snowflake';
  return 'sparkles'; };
const KEY_SPECS = [['Length','L.O.A','LOA','Size'],['Capacity','Max Guest'],['Cabin','Cabins','Bedroom'],['Over Night','Overnight','Overnight Capacity'],['Crew','Crews'],['Cruising Speed','Cruising','Cruise Speed','Speed Cruise','Speed Cruising'],['Year Refit','Last Refit','Refit','Refitted'],['Year','Year Built','First Launch']];
const isPrice = c => /\d[\d,]*\s*T\s*HB/i.test(c);
const cleanPrice = c => moneyText(c.replace(/(\d)\s*T\s*HB/gi,'$1 THB'));
let detailProgram = 0;
function allPrograms(b) {
  const out = [];
  b.tables.forEach((tb, ti) => tb.rows.forEach((r) => {
    const cells = r.slice(1).map((c, ci) => ({ col: tb.columns[ci+1] || '', val: c }));
    out.push({ label: (tb.caption && !r[0].toLowerCase().startsWith(tb.caption.toLowerCase().replace(/[^a-z ]/g,'').trim().split(' ')[0]) ? tb.caption.replace(/\*/g,'') + ' · ' : '') + r[0], cells, ti, row: r });
  }));
  return out;
}
function listBlock(title, items, icon, color) {
  if (!items || !items.length) return '';
  return `<div class="bg-white rounded-xl p-6 ring-1 ring-sand-200">
    <h4 class="font-medium flex items-center gap-2 ${color}"><i data-lucide="${icon}" class="w-5 h-5"></i>${title}</h4>
    <ul class="mt-4 space-y-2 text-sm text-muted">${items.map(x=>`<li class="flex gap-2"><i data-lucide="${icon==='circle-x'?'x':'check'}" class="w-4 h-4 shrink-0 mt-0 ${color}"></i><span>${x}</span></li>`).join('')}</ul></div>`;
}
let DSZ = null;
function tableHTML(tb, ti, b) {
  const ks = tableKeys(b.slug, tb);
  if (!DSZ || !isSeasonTable(ks)) return tableHTML0(tb, ti, b);
  const lang = LANG === 'en' ? 'en' : 'th', ci = colFor(b, tb, DSZ.key, DSZ.base), key = ci > 0 ? ks[ci] : DSZ.key, progs = allPrograms(b), base = progs.findIndex(p => p.ti === ti);
  const price = r => ci > 0 && r[ci] && isPrice(r[ci]) ? cleanPrice(r[ci]) : `<span class="text-muted font-normal">${L('สอบถามราคา', 'On request')}</span>`;
  const hd = `<span class="block">${key ? SKEY[key][lang] : ''}</span><span class="block text-[10.5px] normal-case tracking-normal text-muted font-normal mt-0.5">${key ? rangeText(DSZ.cal, key, lang) : ''}</span>`;
  return `<div class="bg-white rounded-xl ring-1 ring-sand-200 overflow-hidden">
    ${tb.caption ? `<div class="px-4 pt-4"><span class="inline-flex items-center gap-2 text-xs font-medium bg-sun-100 text-sun-600 px-3 py-2 rounded-full"><i data-lucide="clock-3" class="w-3.5 h-3.5"></i>${tb.caption.replace(/\*/g, '')}</span></div>` : ''}
    <div class="hidden sm:block"><table class="w-full text-sm">
      <thead><tr class="text-left"><th class="px-4 py-3 font-medium text-xs uppercase tracking-wide text-muted border-b border-sand-200 align-bottom">Program</th><th class="px-4 py-3 font-medium text-xs uppercase tracking-wide text-right text-maroon border-b border-sand-200 align-bottom w-[260px]">${hd}</th><th class="border-b border-sand-200 w-20"></th></tr></thead>
      <tbody>${tb.rows.map((r, ri) => `<tr class="hover:bg-maroon-50/60 transition ${ri % 2 ? 'bg-sand/60' : ''}"><td class="px-4 py-3 font-medium">${progName(b, ti, ri, r[0])}</td><td class="px-4 py-3 text-right whitespace-nowrap font-medium text-ink tabular-nums">${price(r)}${DSZ.add && ci > 0 ? `<span class="block text-[11px] text-maroon font-normal">+ ${baht(DSZ.add)}</span>` : ''}</td>
        <td class="pr-4 py-2 text-right"><button onclick="pickProgram(${base + ri})" class="text-xs font-medium text-lagoon-700 hover:text-maroon whitespace-nowrap">${t('select')} →</button></td></tr>`).join('')}</tbody></table></div>
    <div class="sm:hidden divide-y divide-sand-200">${tb.rows.map((r, ri) => `<div class="p-4 flex items-start justify-between gap-3"><div class="min-w-0"><p class="font-medium leading-snug">${progName(b, ti, ri, r[0])}</p><p class="mt-1 tabular-nums">${price(r)}</p></div><button onclick="pickProgram(${base + ri})" class="text-xs font-medium text-lagoon-700 shrink-0">${t('select')} →</button></div>`).join('')}</div>
  </div>`;
}
function seasonBarHTML(b) {
  const lang = LANG === 'en' ? 'en' : 'th', date = ($('#dDate')?.value && $('#dDate').value !== todayISO()) ? $('#dDate').value : '', iso = date || todayISO(), v = seasonView(b, iso), keys = boatKeys(b), cal = v.cal;
  const chips = keys.map(k => `<button class="sz-chip ${DSZ.key === k ? 'on' : ''}" onclick="pickSeason('${k}')"><span class="flex items-center gap-1.5"><i style="background:${SCOL[k]}"></i>${SKEY[k][lang]}${(v.key === k) ? `<em>${date ? L('วันที่เลือก', 'your date') : L('ตอนนี้', 'now')}</em>` : ''}</span><small>${rangeText(cal, k, lang)}</small></button>`).join('');
  let note = '';
  if (keys.length && !v.key && !DSZ.pick) { const nx = nextSeason(cal, iso); note = `<p class="sz-note"><i data-lucide="info" class="w-4 h-4 shrink-0"></i>${L('วันที่นี้ยังไม่มีราคาในตารางของเรือลำนี้ · ทักแชทเพื่อสอบถาม', 'No published rate for this date · please ask our team')}${nx ? L(` · แสดงราคา ${SKEY[nx.key].th} ที่เริ่ม ${fmtMD(nx.from.slice(5), 'th')}`, ` · showing ${SKEY[nx.key].en} from ${fmtMD(nx.from.slice(5), 'en')}`) : ''}</p>`; }
  if (v.add) note += `<p class="sz-note"><i data-lucide="calendar-plus" class="w-4 h-4 shrink-0"></i>${L(`${v.sp.label} ${rangeText({ special: [v.sp] }, 'special', 'th')} บวกเพิ่ม ${addText(b, cal)} ต่อทริป`, `${v.sp.label} ${rangeText({ special: [v.sp] }, 'special', 'en')}: ${addText(b, cal)} per charter`)}</p>`;
  else if (cal.add) note += `<p class="text-xs text-muted mt-2">${L(`ช่วงเทศกาล ${rangeText(cal, 'special', 'th')} บวกเพิ่ม ${addText(b, cal)} ต่อทริป`, `Holiday dates ${rangeText(cal, 'special', 'en')}: ${addText(b, cal)} per charter`)}</p>`;
  const head = keys.length ? `<p class="text-xs text-muted mb-2">${date ? L('ราคาตามวันที่คุณเลือก · เลือกดูช่วงอื่นได้', 'Rates for your date · tap to see other seasons') : L('แสดงราคาตามช่วงเวลาปัจจุบัน · เลือกดูช่วงอื่นได้', 'Showing rates for the current season · tap to see others')}</p><div class="flex flex-wrap gap-2">${chips}</div>` : `<p class="text-sm">${L('ราคาเดียวทั้งปี', 'Same price all year')}</p>`;
  return `<div class="sz-bar">${head}${note}<div class="mt-4">${stripHTML(cal, iso, lang)}</div></div>`;
}
function tableHTML0(tb, ti, b) {
  const progs = allPrograms(b);
  let base = progs.findIndex(p => p.ti === ti);
  return `<div class="bg-white rounded-xl ring-1 ring-sand-200 overflow-hidden">
    ${tb.caption?`<div class="px-4 pt-4"><span class="inline-flex items-center gap-2 text-xs font-medium bg-sun-100 text-sun-600 px-3 py-2 rounded-full"><i data-lucide="clock-3" class="w-3.5 h-3.5"></i>${tb.caption.replace(/\*/g,'')}</span></div>`:''}
    <div class="hidden sm:block overflow-x-auto"><table class="w-full text-sm min-w-[560px]">
      <thead><tr class="text-left">${tb.columns.map((c,i)=>`<th data-ti="${ti}" data-ci="${i}" class="px-4 py-3 font-medium text-xs uppercase tracking-wide ${i? 'text-right text-ink':'text-muted'} border-b border-sand-200 align-bottom">${c}</th>`).join('')}<th class="border-b border-sand-200"></th></tr></thead>
      <tbody>${tb.rows.map((r,ri)=>`<tr class="hover:bg-maroon-50/60 transition ${ri%2?'bg-sand/60':''}">
        <td class="px-4 py-3 font-medium">${progName(b, ti, ri, r[0])}</td>
        ${r.slice(1).map((c,ci)=>`<td data-ti="${ti}" data-ci="${ci+1}" class="px-4 py-3 text-right whitespace-nowrap ${isPrice(c)?'font-medium text-ink':'text-muted'}">${cleanPrice(c)}${isPrice(c) && szAdd(DSZ, tb, ci+1, r) ? `<span class="block text-[11px] text-maroon font-normal">+ ${baht(szAdd(DSZ, tb, ci+1, r))}</span>` : ''}</td>`).join('')}
        <td class="pr-4 py-2 text-right"><button onclick="pickProgram(${base+ri})" class="text-xs font-medium text-lagoon-700 hover:text-maroon whitespace-nowrap">${t('select')} →</button></td></tr>`).join('')}
      </tbody></table></div>
    <div class="sm:hidden divide-y divide-sand-200">${tb.rows.map((r,ri)=>`<div class="p-4">
      <div class="flex items-start justify-between gap-3"><p class="font-medium leading-snug">${progName(b, ti, ri, r[0])}</p><button onclick="pickProgram(${base+ri})" class="text-xs font-medium text-lagoon-700 shrink-0">${t('select')} →</button></div>
      <dl class="mt-2 space-y-2 text-sm">${r.slice(1).map((c,ci)=>`<div data-ti="${ti}" data-ci="${ci+1}" class="flex justify-between gap-3 px-2 -mx-2"><dt class="text-muted text-xs">${tb.columns[ci+1]||''}</dt><dd class="whitespace-nowrap ${isPrice(c)?'font-medium text-ink':'text-muted'}">${cleanPrice(c)}${isPrice(c) && szAdd(DSZ, tb, ci+1, r) ? ` <span class="text-[11px] text-maroon font-normal">+ ${baht(szAdd(DSZ, tb, ci+1, r))}</span>` : ''}</dd></div>`).join('')}</dl></div>`).join('')}</div>
  </div>`;
}
function bentoHTML(b) {
  const g = gallery(b.slug), n = g.length, name = niceTitle(b.title);
  const tile = (i, cls, extra = '') => g[i] ? `<button type="button" class="bt ${cls} img-fallback group" onclick="openLightbox('${b.slug}',${i})" aria-label="${t('viewPhotos')} ${i + 1}">
      <img src="${rs(g[i])}" alt="${name} — photo ${i + 1}" loading="lazy" class="gal-img"/>${extra}</button>` : '';
  const all = `<span class="bt-all"><i data-lucide="layout-grid"></i>${L('ดูรูปทั้งหมด', 'All photos')} ${n}</span>`;
  const sub = [typeLabel(b.type), b.pax ? `${b.pax} ${t('guests')}` : ''].filter(Boolean).join(' · ');
  return `<div class="bento bento-n${Math.min(n, 5)}">
    <div class="bt bt-main img-fallback">
      <button type="button" class="absolute inset-0 w-full h-full group" onclick="openLightbox('${b.slug}',0)" aria-label="${t('viewPhotos')}"><img src="${rs(g[0] || '', 1600)}" srcset="${g[0] ? `${rs(g[0])} 768w, ${rs(g[0], 1280)} 1280w, ${rs(g[0], 1600)} 1600w` : ''}" sizes="(min-width:1024px) 60vw, 100vw" alt="${name}" fetchpriority="high" class="gal-img"/></button>
      ${b.hot ? `<span class="bt-chip"><i data-lucide="star"></i>${L('ยอดนิยม', 'Popular')}</span>` : ''}
      <div class="bt-acts">
        <button type="button" class="bt-round" onclick="shareBoat('${b.slug}')" aria-label="${L('แชร์', 'Share')}"><i data-lucide="share-2"></i></button>
        <button type="button" class="bt-round" data-fav="${b.slug}" onclick="toggleFav('${b.slug}')" aria-pressed="${FAV.includes(b.slug)}" aria-label="${L('บันทึก', 'Save')} ${name}"><i data-lucide="heart"></i></button>
      </div>
      <div class="bt-cover">
        <div class="min-w-0"><h1>${name}</h1><p>${sub}<span class="bt-hide-m">${b.marinaP ? ' · ' + b.marinaP : ''}</span></p></div>
        ${b.from_ ? `<div class="bt-price"><small>${t('price.from', 'เริ่มต้น')} / ${L('ทริป', 'trip')}</small><b class="tabular-nums">${baht(b.from_)}</b></div>` : ''}
      </div>
    </div>
    ${tile(1, 'bt-1')}${tile(2, 'bt-2')}${tile(3, 'bt-3')}${tile(4, 'bt-4', n > 5 ? all : '')}
  </div>
  ${n > 1 ? `<button type="button" class="bt-mall" onclick="openLightbox('${b.slug}',0)">
    <span class="bt-stack">${g.slice(1, 3).map(s => `<img src="${rs(s, 160)}" alt="" loading="lazy"/>`).join('')}</span>
    <span class="min-w-0"><b>${L('ดูรูปทั้งหมด', 'View all')} ${n} ${L('รูป', 'photos')}</b><span>${L('แตะเพื่อดูภาพเต็มจอ', 'Tap to view full screen')}</span></span>
    <i data-lucide="chevron-right"></i></button>` : ''}`;
}
function shareBoat(slug) {
  const url = SITE_ORIGIN + hashToPath('#/boat/' + slug);
  if (navigator.share) navigator.share({ title: niceTitle(bySlug(slug).title), url }).catch(() => {});
  else { navigator.clipboard?.writeText(url); toast(L('คัดลอกลิงก์แล้ว', 'Link copied')); }
}
/* section nav on the boat page: sticky, arrows when it overflows, active link follows the scroll */
function secState() { const n = $('#secnav'), w = $('#secwrap'); if (!n || !w) return; w.classList.toggle('can-l', n.scrollLeft > 4); w.classList.toggle('can-r', n.scrollLeft + n.clientWidth < n.scrollWidth - 4); }
function secScroll(d) { const n = $('#secnav'); n?.scrollBy({ left: d * Math.max(140, n.clientWidth * .6), behavior: 'smooth' }); }
function secGo(id) { const el = document.getElementById(id); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 140, behavior: 'smooth' }); }
let secIO;
function bindSecnav() {
  const n = $('#secnav'); if (!n) return;
  n.addEventListener('scroll', secState, { passive: true }); setTimeout(secState, 50);
  secIO?.disconnect();
  // the server render (linkedom) has no IntersectionObserver
  if (typeof IntersectionObserver === 'undefined') return;
  secIO = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return;
    $$('#secnav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    const on = $('#secnav a.on'); if (on) n.scrollTo({ left: on.offsetLeft - (n.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' }); }), { rootMargin: '-40% 0px -55% 0px' });
  $$('#secnav a').forEach(a => { const t = document.getElementById(a.getAttribute('href').slice(1)); t && secIO.observe(t); });
}
addEventListener('resize', secState);
/* =========================================================
   BOAT PAGE — Liquid Glass layout (mockup/boattripthailand-boat-liquid-glass.html)
   Every value comes from the boat record: tables, time_slots, info, notes, includes.
   ========================================================= */
const bpTH = s => LANG === 'en' ? String(s || '') : String(s || '').replace(/half[\s-]*day/ig, 'ครึ่งวัน').replace(/full[\s-]*day/ig, 'เต็มวัน').replace(/(\d+(?:\.\d)?)\s*hrs?\.?/ig, '$1 ชม.').replace(/sunset/ig, 'ซันเซ็ต').replace(/over\s*night/ig, 'ค้างคืน');
const bpTime = s => String(s || '').replace(/(\d{1,2})(?:[:.](\d{2}))?\s*([AP])\.?\s*M\.?/ig, (m, h, mm, ap) => String(+h % 12 + (/p/i.test(ap) ? 12 : 0)).padStart(2, '0') + ':' + (mm || '00')).replace(/\s*-\s*/g, '–');
const bpHrs = s => { const m = String(s || '').match(/(\d+(?:\.\d)?)\s*(?:hrs?|hours?|ชม)/i); return m ? +m[1] : null; };
const bpStrip = s => String(s || '').replace(/^\s*(half|full)[\s-]*day\s*(\d+(?:\.\d)?\s*hrs?\.?)?\s*[·:–-]\s*/i, '').trim() || String(s || '');
const bpKind = s => /half/i.test(s) ? 'half' : /full/i.test(s) ? 'full' : /sunset/i.test(s) ? 'sunset' : /night/i.test(s) ? 'night' : '';
const bpSzShort = k => k === 'special' ? L('ช่วงพิเศษ', 'Special') : k === 'all' || !SKEY[k] ? L('ทั้งปี', 'All year') : SKEY[k].en.replace(' Season', '');
const bpSzName = k => k ? SKEY[k][LANG === 'en' ? 'en' : 'th'] : '';
let bpGuestsN = 2;
/** every program row of a boat, with its table, hours and a short display name */
function bpProgs(b) {
  const out = [];
  b.tables.forEach((tb, ti) => tb.rows.forEach((r, ri) => {
    const ctx = r[0] + ' ' + (tb.caption || '');
    out.push({ i: out.length, ti, ri, row: r, tb, raw: r[0], name: bpStrip(progName(b, ti, ri, r[0])), hrs: bpHrs(r[0]) ?? bpHrs(tb.caption), kind: bpKind(ctx) });
  }));
  return out;
}
/** price of one program for the season being shown (DSZ); flat tables get the holiday surcharge */
function bpPrice(b, p) {
  if (!p) return null;
  const ks = tableKeys(b.slug, p.tb);
  if (isSeasonTable(ks)) { const ci = colFor(b, p.tb, DSZ.key, DSZ.base), n = ci > 0 ? priceNum(p.row[ci]) : null; return n == null ? null : { n, add: 0 }; }
  const ci = p.row.findIndex((c, k) => k > 0 && priceNum(c)); if (ci < 0) return null;
  return { n: priceNum(p.row[ci]), add: szAdd(DSZ, p.tb, ci, p.row), col: p.tb.columns.filter((c, k) => k > 0 && p.row[k] && priceNum(p.row[k])).length > 1 ? p.tb.columns[ci] : '' };
}
function bpGroupLabel(b, ti) {
  const tb = b.tables[ti], txt = (tb.caption || '') + ' ' + tb.rows.map(r => r[0]).join(' ');
  const hs = [...new Set(tb.rows.map(r => bpHrs(r[0]) ?? bpHrs(tb.caption)).filter(Boolean))].sort((x, y) => x - y);
  const h = hs.length ? ` ${hs.length > 1 ? hs[0] + '–' + hs[hs.length - 1] : hs[0]} ${L('ชม.', 'hrs')}` : '';
  if (/half/i.test(txt) && !/full/i.test(txt)) return L('ครึ่งวัน', 'Half day') + h;
  if (/full/i.test(txt) && !/half/i.test(txt)) return L('เต็มวัน', 'Full day') + h;
  if (/sunset/i.test(txt)) return L('ซันเซ็ต', 'Sunset') + h;
  if (/night/i.test(txt)) return L('ค้างคืน', 'Overnight');
  return tb.caption ? bpTH(tb.caption.replace(/\*/g, '')) : L(`ตารางที่ ${ti + 1}`, `Table ${ti + 1}`);
}
/** time slots that fit a program (same hours / same kind), split "9AM-1PM / 2PM-6PM" into two choices */
function bpSlots(b, p) {
  const all = b.time_slots.map(([k, v], si) => ({ k: slotName(b, si, k), raw: k, v }));
  let fit = p ? all.filter(s => p.hrs && bpHrs(s.raw) === p.hrs) : [];
  if (!fit.length && p && p.kind) fit = all.filter(s => bpKind(s.raw) === p.kind);
  return (fit.length ? fit : all).flatMap(s => String(s.v).split('/').map(x => bpTime(x.trim())).filter(Boolean));
}
function bpFacts(b) {
  const g = (...k) => infoGet(b, ...k), num = s => (String(s || '').match(/\d+/) || [])[0], out = [];
  const night = num(g('Over Night', 'Overnight', 'Overnight Capacity'));
  if (b.pax) out.push(['users', `${b.pax} ${L('คน', 'guests')}`, night ? L(`รอบกลางวัน (ค้างคืน ${night} คน)`, `Day trips (overnight ${night})`) : L('รอบกลางวัน', 'Day trips')]);
  const cab = g('Cabin', 'Cabins', 'Bedroom');
  if (cab) { const n = num(cab); out.push(['bed-double', n ? `${n} ${L('ห้องนอน', n > 1 ? 'cabins' : 'cabin')}` : cab, n ? cab.replace(/^\s*\d+\s*(cabins?|bedrooms?|rooms?)?\s*/i, '') || L('ห้องนอน', 'Cabins') : L('ห้องนอน', 'Cabins')]); }
  const crew = g('Crew', 'Crews');
  if (crew) out.push(['life-buoy', num(crew) ? L(`ลูกเรือ ${num(crew)} คน`, `${num(crew)} crew`) : crew, L('กัปตันและลูกเรือดูแลตลอดทริป', 'Captain and crew on board')]);
  const yr = g('Year', 'Year Built', 'First Launch'), rf = g('Year Refit', 'Last Refit', 'Refit', 'Refitted');
  if (yr || rf) out.push(['calendar-check', [yr, rf].filter(Boolean).join(' · '), yr && rf ? L('ปีที่ต่อ · ปีที่รีฟิต', 'Built · Refit') : yr ? L('ปีที่ต่อ', 'Built') : L('ปีที่รีฟิต', 'Refit')]);
  const sp = g('Cruising Speed', 'Cruising', 'Cruise Speed', 'Speed Cruise', 'Speed Cruising');
  if (out.length < 4 && sp) out.push(['gauge', sp, L('ความเร็วล่องเรือ', 'Cruising speed')]);
  if (out.length < 4 && b.ft) out.push(['ruler', `${b.ft} ${L('ฟุต', 'ft')}`, L('ความยาวเรือ', 'Length')]);
  return out.slice(0, 4);
}
const bpCondIcon = s => /extra|additional|เพิ่ม/i.test(s) ? 'user-plus' : /guest|pax|passenger|charter is for|คน/i.test(s) ? 'users' : /food|meal|lunch|อาหาร/i.test(s) ? 'utensils' : /fuel/i.test(s) ? 'fuel' : /time|hour|ชม/i.test(s) ? 'clock' : 'info';
function bpFaq(b) {
  const rule = extraRule(b), keys = boatKeys(b).filter(k => k !== 'special'), cal = calOf(b.slug), lang = LANG === 'en' ? 'en' : 'th';
  const night = infoGet(b, 'Over Night', 'Overnight', 'Overnight Capacity'), list = a => a.slice(0, 8).map(moneyText).join(', ');
  const qa = [];
  if (b.includes.length) qa.push([L('ราคานี้รวมอะไรบ้าง', 'What does the price include?'), `${L('รวม', 'Included')}: ${list(b.includes)}${b.includes.length > 8 ? '…' : ''}${b.not_included.length ? ` · ${L('ไม่รวม', 'Not included')}: ${list(b.not_included)}` : ''}`]);
  if (b.pax) qa.push(rule ? [L(`มากันมากกว่า ${rule.from - 1} คนได้ไหม`, `Can we bring more than ${rule.from - 1} guests?`), L(`ได้ สูงสุด ${b.pax} คน คนที่ ${rule.from}–${b.pax} คิดเพิ่มคนละ ${baht(rule.fee)}`, `Yes, up to ${b.pax}. Guests ${rule.from}–${b.pax} are ${baht(rule.fee)} each.`)]
    : [L('รองรับได้กี่คน', 'How many guests can come?'), L(`สูงสุด ${b.pax} คนต่อทริป`, `Up to ${b.pax} guests per charter.`)]);
  if (night) qa.push([L('ค้างคืนบนเรือได้ไหม', 'Can we stay overnight?'), L(`ได้ รองรับ ${night}${infoGet(b, 'Cabin', 'Cabins', 'Bedroom') ? ` (${infoGet(b, 'Cabin', 'Cabins', 'Bedroom')})` : ''} ทีมขายจะเสนอโปรแกรมค้างคืนตามวันที่ต้องการ`, `Yes, ${night}. Our team will quote an overnight program for your dates.`)]);
  qa.push([L('ราคาเปลี่ยนตามวันที่ไหม', 'Does the price change by date?'), keys.length > 1 ? L(`เปลี่ยนตามฤดูกาล: ${keys.map(k => `${bpSzShort(k)} ${rangeText(cal, k, lang)}`).join(' · ')} เลือกวันที่ในกล่องจองแล้วราคาจะเปลี่ยนให้เอง`, `Yes, by season: ${keys.map(k => `${bpSzShort(k)} ${rangeText(cal, k, lang)}`).join(' · ')}. Pick a date and the price updates.`) : L('ราคาเดียวทั้งปี', 'Same price all year.')]);
  qa.push([L('ต้องจ่ายเงินบนเว็บไหม', 'Do I pay on the website?'), L('ไม่ต้อง ส่งคำขอแล้วทีมขายติดต่อกลับเพื่อเช็กคิวเรือ ยืนยันราคา และแจ้งวิธีชำระเงิน', 'No. Send a request and our team will check availability, confirm the price and explain how to pay.')]);
  return qa;
}
function bpMarina(b) {
  const has = (a, re) => a.some(x => re.test(x)), out = [];
  out.push(['map-pin', `<b>${b.marinaP || L('ท่าเรือ', 'Marina')}</b><small>${L('ทีมขายส่งพิกัดให้ทาง WhatsApp / LINE', 'Our team sends the pin on WhatsApp / LINE')}</small>`]);
  out.push(['clock', L('มาถึงท่าก่อนเวลาออกเรือ 15–20 นาที', 'Arrive 15–20 minutes before departure')]);
  if (has(b.not_included, /transfer|van|pick ?up/i)) out.push(['car', L('รถรับส่งจากโรงแรมไม่รวมในราคา สอบถามทีมขายได้', 'Hotel transfer not included · ask our team')]);
  else if (has(b.includes, /transfer|van|pick ?up/i)) out.push(['car', L('รวมรถรับส่งตามเงื่อนไขของเรือ', 'Transfer included (see conditions)')]);
  if (has(b.not_included, /park|island fee/i)) out.push(['ticket', L('ค่าอุทยาน / ค่าขึ้นเกาะ ชำระตามจริงวันเดินทาง', 'Park / island fees paid on the day')]);
  return out;
}

function renderDetail(slug) {
  const b = bySlug(slug);
  const v = $('#view-boat');
  if (!b) { v.innerHTML = `<div class="max-w-3xl mx-auto px-4 py-32 text-center"><p class="text-xl font-medium text-ink">${t('notFound')}</p><a href="#/fleet" class="inline-block mt-6 bg-maroon text-white px-6 py-3 rounded-full">${t('fleet')}</a></div>`; return; }
  track('ViewContent', { content_ids: [b.slug], content_type: 'product', content_name: niceTitle(b.title), content_category: b.type, value: b.from_ || 0, currency: 'THB' });
  detailProgram = 0; { const v0 = seasonView(b, todayISO()); DSZ = { ...v0, pick: null }; if (!v0.key && boatKeys(b).length) { const nx = nextSeason(v0.cal, todayISO()); if (nx) DSZ.key = DSZ.base = nx.key; } }
  bpGuestsN = Math.max(1, Math.min(guests || 2, b.pax || 99));
  const name = niceTitle(b.title), g = gallery(b.slug), progs = bpProgs(b), facts = bpFacts(b), rule = extraRule(b);
  const similar = FLEET.filter(x => x.type === b.type && x.slug !== b.slug).sort((x, y) => Math.abs((x.from_ || 0) - (b.from_ || 0)) - Math.abs((y.from_ || 0) - (b.from_ || 0))).slice(0, 3);
  const refit = infoGet(b, 'Year Refit', 'Last Refit', 'Refit', 'Refitted');
  const yes = [...b.includes.map(x => [moneyText(x)]), ...b.complimentary.map(x => [x, L('ฟรี', 'free')])], no = b.not_included.map(moneyText);
  const secs = [['overview', L('ภาพรวม', 'Overview')], progs.length && ['programs', L('โปรแกรม & ราคา', 'Programs & rates')], b.time_slots.length && ['slotsSec', t('timeSlots')], (yes.length || no.length) && ['inclSec', L('รวม / ไม่รวม', 'Included')],
    ['policySec', L('เงื่อนไข', 'Policies')], ['boatInfoSec', t('boatInfo')], ['marinaSec', L('ท่าเรือ', 'Marina')], ['faqSec', L('คำถาม', 'FAQ')]].filter(Boolean);
  const panel = (id, h, sub, body, cls = '') => `<section class="bp-panel ${cls}" id="${id}"><h2>${h}</h2>${sub ? `<p class="bp-sub">${sub}</p>` : ''}${body}</section>`;
  const opts = b.tables.map((tb, ti) => `<optgroup label="${bpGroupLabel(b, ti)}">${progs.filter(p => p.ti === ti).map(p => `<option value="${p.i}">${p.name}</option>`).join('')}</optgroup>`).join('');
  v.innerHTML = `<div class="bp">
  <div class="bp-ambient" aria-hidden="true">${g[0] ? `<img src="${rs(g[0], 320)}" alt="" decoding="async"/>` : ''}</div>
  <div class="bp-wrap">
    <nav aria-label="Breadcrumb" class="bp-crumb"><a href="#/">${t('home')}</a><i data-lucide="chevron-right"></i><a href="#/fleet">${t('fleet')}</a><i data-lucide="chevron-right"></i><span aria-current="page">${name}</span></nav>
    ${bentoHTML(b)}
    <div class="bp-grid">
      <div class="min-w-0">
        <div class="secwrap" id="secwrap">
          <div class="sec-fade l"><button type="button" onclick="secScroll(-1)" aria-label="${L('เลื่อนซ้าย', 'Scroll left')}"><i data-lucide="chevron-left"></i></button></div>
          <div class="sec-fade r"><button type="button" onclick="secScroll(1)" aria-label="${L('เลื่อนขวา', 'Scroll right')}"><i data-lucide="chevron-right"></i></button></div>
          <nav class="secnav" id="secnav" aria-label="${L('ส่วนของหน้า', 'Page sections')}">${secs.map(([id, l], i) => `<a href="#${id}" class="${i ? '' : 'on'}" onclick="event.preventDefault();secGo('${id}')">${l}</a>`).join('')}</nav>
        </div>

        ${panel('overview', L('ภาพรวม', 'Overview'), [typeLabel(b.type), b.ft ? L(`ขนาด ${b.ft} ฟุต`, `${b.ft} ft`) : '', refit ? L(`รีฟิตปี ${refit}`, `refit ${refit}`) : '', b.pax ? L(`รับได้สูงสุด ${b.pax} คน`, `up to ${b.pax} guests`) : ''].filter(Boolean).join(' · '),
          `${facts.length ? `<div class="bp-facts">${facts.map(([ic, h, s]) => `<div class="bp-fact"><i data-lucide="${ic}"></i><b>${h}</b><span>${s}</span></div>`).join('')}</div>` : ''}
          <p class="bp-about">${L(`เหมาลำทั้งลำพร้อมกัปตันและลูกเรือ ออกจาก ${b.marinaP || 'ท่าเรือ'}${b.includes.length ? ` · รวม ${b.includes.slice(0, 5).map(moneyText).join(', ')}` : ''}`, `Private charter with captain and crew from ${b.marinaP || 'the marina'}${b.includes.length ? ` · includes ${b.includes.slice(0, 5).map(moneyText).join(', ')}` : ''}`)}</p>`)}

        ${progs.length ? `<section class="bp-panel" id="programs">
          <div class="bp-phead"><div><h2>${t('programs2')}</h2><p class="bp-sub m-0">${t('vatNote')}</p></div><div class="bp-seg" id="bpSeason" role="group" aria-label="${L('ฤดูกาล', 'Season')}"></div></div>
          <div id="bpNote"></div>
          ${b.tables.length > 1 ? `<div class="bp-seg mb-3" id="bpLen" role="group" aria-label="${L('ระยะเวลา', 'Duration')}"></div>` : ''}
          <div class="bp-progs" id="bpProgs"></div>
        </section>` : ''}

        ${b.time_slots.length ? panel('slotsSec', t('timeSlots'), b.marinaP ? L(`เวลาออกเรือจากท่า ${b.marinaP}`, `Departure times from ${b.marinaP}`) : '',
          `<div class="bp-slots">${b.time_slots.map(([k, val], si) => { const kd = bpKind(k); return `<div class="bp-slot"><i data-lucide="${kd === 'sunset' || (kd === 'full' && si) ? 'sunset' : kd === 'night' ? 'moon' : si === 0 ? 'sunrise' : kd === 'full' ? 'sunset' : 'sun'}"></i><b>${bpTH(slotName(b, si, k))}</b><span>${String(val).split('/').map(x => bpTime(x.trim())).join(L(' หรือ ', ' or '))}</span></div>`; }).join('')}</div>`) : ''}

        ${yes.length || no.length ? panel('inclSec', L('รวม / ไม่รวมในราคา', 'Included / not included'), L('ตามโบรชัวร์ของเรือ', 'From the boat brochure'),
          `<div class="bp-inc">
            <div><h3><i data-lucide="check-circle-2" class="text-[#1e7a46]"></i>${L('รวมในราคา', 'Included')}</h3><ul class="yes">${yes.map(([x, s]) => `<li><i data-lucide="check"></i><span>${x}${s ? ` <small>· ${s}</small>` : ''}</span></li>`).join('')}</ul></div>
            ${no.length ? `<div><h3><i data-lucide="x-circle" class="text-[#b42318]"></i>${L('ไม่รวม', 'Not included')}</h3><ul class="no">${no.map(x => `<li><i data-lucide="x"></i><span>${x}</span></li>`).join('')}</ul></div>` : ''}
          </div>`) : ''}

        ${panel('policySec', L('เงื่อนไข', 'Policies'), L('อ่านก่อนส่งคำขอ ทีมขายจะยืนยันรายละเอียดอีกครั้ง', 'Please read before sending a request · our team confirms the details'),
          `${b.notes.length || b.remarks.length ? `<div class="bp-conds">${[...b.notes, ...b.remarks].map(n => `<div class="bp-cond"><i data-lucide="${bpCondIcon(n)}"></i><span>${moneyText(n).replace(/^\*?remarks\s*:?\s*/i, '')}</span></div>`).join('')}</div>` : ''}
          <div class="bp-accs">${[[t('vanTitle'), vanHTML(), 'bus'], [t('extraTitle'), extraHTML(), 'party-popper'], [t('payTitle'), payHTML(), 'credit-card']].map(([h, body, ic]) => `<details class="bp-acc"><summary><span><i data-lucide="${ic}"></i>${h}</span><i data-lucide="plus" class="bp-plus"></i></summary><div class="bp-acc-b">${body}</div></details>`).join('')}</div>`)}

        ${panel('boatInfoSec', t('boatInfo'), L('จากโบรชัวร์ทางการของเรือ', 'From the official boat brochure'),
          `<table class="bp-spec"><tbody>${b.info.filter(([, val]) => val && val !== 'N/A').map(([k, val]) => `<tr><td>${k}</td><td>${val}</td></tr>`).join('')}${b.marinaP ? `<tr><td>Marina</td><td>${b.marinaP}</td></tr>` : ''}</tbody></table>`)}

        ${panel('marinaSec', L('ท่าเรือ', 'Marina'), L('จุดนัดพบก่อนออกเรือ', 'Where you board'),
          `<div class="bp-marina">
            <div class="bp-map" role="img" aria-label="${L('ภาพประกอบตำแหน่ง', 'Illustration of')} ${b.marinaP}">
              <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M0 0h170c10 30-8 55 8 80s40 20 46 52-12 52 6 88H0z" fill="#e8e2d3"/><path d="M0 0h150c8 28-6 52 8 76s36 22 40 50-10 50 4 94H0z" fill="#efe9da"/><circle cx="290" cy="60" r="16" fill="#e8e2d3"/><circle cx="330" cy="150" r="22" fill="#e8e2d3"/><circle cx="252" cy="182" r="9" fill="#e8e2d3"/></svg>
              <span class="bp-dot"></span><span class="bp-pin">${b.marinaP || L('ท่าเรือ', 'Marina')}</span><span class="bp-illu">${L('ภาพประกอบ', 'Illustration')}</span>
            </div>
            <ul>${bpMarina(b).map(([ic, h]) => `<li><i data-lucide="${ic}"></i><span>${h}</span></li>`).join('')}</ul>
          </div>`)}

        ${panel('faqSec', L('คำถามที่พบบ่อย', 'FAQ'), L('ตอบจากเงื่อนไขของเรือลำนี้', 'Answered from this boat’s conditions'),
          bpFaq(b).map(([q, a], i) => `<details class="bp-acc"${i ? '' : ' open'}><summary><span>${q}</span><i data-lucide="plus" class="bp-plus"></i></summary><p class="bp-acc-b">${a}</p></details>`).join(''), 'bp-faq')}

        ${similar.length ? `<section class="bp-simwrap" aria-label="${t('similar')}">
          <div class="bp-simhead"><div><h2>${L('เรือขนาดใกล้เคียง', 'Similar boats')}</h2><p class="bp-sub m-0">${L(`เผื่อวันที่ต้องการ ${name} ไม่ว่าง`, `In case ${name} is booked on your date`)}</p></div><a href="#/fleet">${t('viewAll')} →</a></div>
          <div class="bp-sims">${similar.map(s => `<a href="#/boat/${s.slug}" class="bp-sim"><div class="ph img-fallback"><img src="${rs(gallery(s.slug)[0]) || bimg(s.slug, 'a')}" alt="${niceTitle(s.title)}" loading="lazy"/></div><div class="bd"><b>${niceTitle(s.title)}</b><span>${[typeLabel(s.type), s.pax ? `${s.pax} ${t('guests')}` : '', s.marinaP].filter(Boolean).join(' · ')}</span>${s.from_ ? `<div class="pr">${t('price.from', 'เริ่มต้น')} <strong class="tabular-nums">${baht(s.from_)}</strong></div>` : ''}</div></a>`).join('')}</div>
        </section>` : ''}
      </div>

      <aside class="bp-aside" id="bpAside">
        <div class="bp-book" id="bookingCard">
          <div class="bp-from" id="bpFrom"></div>
          <div class="bp-price tabular-nums" id="bpPrice"></div>
          <div class="bp-ptitle" id="bpPtitle"></div>
          <label class="bp-fld"><span>${L('วันที่ต้องการ', 'Date')}</span><input id="dDate" type="date" class="bp-inp"/></label>
          ${progs.length ? `<label class="bp-fld"><span>${t('program')}</span><select id="dProg" class="bp-inp">${opts}</select></label>` : ''}
          <div class="bp-two ${b.time_slots.length ? '' : 'one'}">
            ${b.time_slots.length ? `<label class="bp-fld"><span>${t('timeSlots')}</span><select id="dSlot" class="bp-inp"></select></label>` : ''}
            <div class="bp-fld"><span>${L('จำนวนคน', 'Guests')}</span><div class="bp-step"><button type="button" onclick="bpGuests(-1)" aria-label="${L('ลดจำนวนคน', 'Fewer guests')}" id="bpMinus"><i data-lucide="minus"></i></button><output class="tabular-nums" id="bpGOut" aria-live="polite"></output><button type="button" onclick="bpGuests(1)" aria-label="${L('เพิ่มจำนวนคน', 'More guests')}" id="bpPlus"><i data-lucide="plus"></i></button></div><input type="hidden" id="dPax" value="${bpGuestsN}"/></div>
          </div>
          <p id="dPaxWarn" class="hidden"></p>
          <div class="bp-sum" id="dEstimate" aria-live="polite"></div>
          <button type="button" class="bp-btn bp-btn-p" onclick="bookFromDetail('${b.slug}')"><i data-lucide="send"></i>${L('ส่งคำขอจอง', 'Send booking request')}</button>
          <div class="bp-chat"><a class="bp-btn bp-btn-g" href="${WA_URL}" target="_blank" rel="noopener"><i data-lucide="message-circle"></i>WhatsApp</a><a class="bp-btn bp-btn-g" href="${SET.lineUrl}" target="_blank" rel="noopener"><i data-lucide="message-square"></i>LINE</a></div>
          <ul class="bp-assure"><li><i data-lucide="shield-check"></i>${L('ยังไม่ต้องชำระเงิน · ทีมขายติดต่อกลับเพื่อเช็กคิว', 'No payment now · our team will check availability')}</li><li><i data-lucide="badge-check"></i>${t('vatNote')}</li>${SET.tat ? `<li><i data-lucide="award"></i>TAT ${SET.tat}</li>` : ''}</ul>
        </div>
      </aside>
    </div>
  </div>

  <div class="bp-mbar" id="bpMbar"><div class="p"><small id="bpMbarL"></small><b class="tabular-nums" id="bpMbarP"></b></div><button type="button" class="bp-btn bp-btn-p" onclick="bpSheet(true)"><i data-lucide="send"></i>${L('จองเรือ', 'Book')}</button></div>
  <div class="bp-sheet-bg" id="bpSheetBg" onclick="bpSheet(false)"></div>
  <div class="bp-sheet" id="bpSheet" role="dialog" aria-modal="true" aria-label="${L('ส่งคำขอจอง', 'Booking request')}"><div class="grab"></div><button type="button" class="bp-sheet-x" onclick="bpSheet(false)" aria-label="${L('ปิด', 'Close')}"><i data-lucide="x"></i></button><div id="bpSheetBody"></div></div>
  <div class="bp-mspace"></div>
</div>`;

  const qd = $('#qsDate')?.dataset.touched ? $('#qsDate').value : ''; if (qd) $('#dDate').value = qd; $('#dDate').min = todayISO(); datePick($('#dDate'));
  if ($('#dProg')) $('#dProg').onchange = e => { detailProgram = +e.target.value; drawProgPrices(b); };
  $('#dDate').onchange = () => { DSZ.pick = null; drawProgPrices(b); };
  drawProgPrices(b, true);
  bindSecnav();
  icons();
}
function bpGuests(d) { const b = bySlug(currentSlug); bpGuestsN = Math.min(b.pax || 99, Math.max(1, bpGuestsN + d)); $('#dPax').value = bpGuestsN; drawProgPrices(b); }
function bpSheet(on) {
  const card = $('#bookingCard'); if (!card) return;
  if (on) $('#bpSheetBody').appendChild(card); else $('#bpAside').appendChild(card);
  $('#bpSheet').classList.toggle('open', on); $('#bpSheetBg').classList.toggle('open', on); document.body.style.overflow = on ? 'hidden' : '';
}
/** close the mobile booking sheet (and unlock page scroll) before the boat page goes away or is redrawn */
const bpSheetOff = () => { if ($('#bpSheet')?.classList.contains('open')) bpSheet(false); };
addEventListener('resize', () => { if (innerWidth > 1040) bpSheetOff(); });
function pickSeason(k) { DSZ.key = k; DSZ.pick = k; drawProgPrices(bySlug(currentSlug), true); }
function bpPickLen(ti) { const b = bySlug(currentSlug), p = bpProgs(b).find(x => x.ti === ti); if (p) pickProgram(p.i); }
/* island-route programs: a palm on an island over a wave line (lucide has no island icon) */
const ISLAND_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 20.2c1.6 0 1.6-1 3.2-1s1.6 1 3.2 1 1.6-1 3.1-1 1.6 1 3.2 1 1.6-1 3.2-1 1.5 1 3.1 1"/><path d="M5.2 17.2c1.9-2.3 4.2-3.4 6.8-3.4s4.9 1.1 6.8 3.4"/><path d="M12.6 13.8c-.3-3.1.3-5.9 1.7-8.2"/><path d="M14.3 5.6c-1.5-1.6-3.8-1.9-5.7-.7"/><path d="M14.3 5.6c1.1-1.9 3.4-2.6 5.4-1.8"/><path d="M14.3 5.6c.3 2.1 1.8 3.6 3.8 4"/><path d="M14.3 5.6c-1.9.2-3.4 1.6-3.8 3.6"/></svg>';
function drawProgPrices(b, keepPick) {
  const progs = bpProgs(b), p = progs[detailProgram] || progs[0];
  const date = $('#dDate').value, iso = date || todayISO(), v = seasonView(b, iso), lang = LANG === 'en' ? 'en' : 'th';
  if (!DSZ || !DSZ.pick) { DSZ = { ...v, pick: null }; if (!v.key && boatKeys(b).length) { const nx = nextSeason(v.cal, iso); if (nx) DSZ.key = DSZ.base = nx.key; } }
  else { DSZ = { ...v, key: DSZ.pick, base: DSZ.pick === 'special' ? v.base : DSZ.pick, pick: DSZ.pick }; }
  const keys = boatKeys(b).filter(k => k !== 'all');
  /* season segmented control + note */
  if ($('#bpSeason')) $('#bpSeason').innerHTML = keys.length > 1 ? keys.map(k => `<button type="button" aria-pressed="${DSZ.key === k}" onclick="pickSeason('${k}')">${bpSzShort(k)}<small>${(rangeText(v.cal, k, lang) || '').split(', ')[0]}</small></button>`).join('') : '';
  if ($('#bpNote')) {
    let note = '';
    if (!keys.length) note = `<p class="bp-note"><i data-lucide="calendar"></i>${L('ราคาเดียวทั้งปี', 'Same price all year')}</p>`;
    else if (DSZ.pick) note = `<p class="bp-note"><i data-lucide="info"></i>${L(`กำลังดูราคา <b>${bpSzName(DSZ.key)}</b> · ราคาจริงคิดตามวันที่เดินทาง`, `Showing <b>${bpSzName(DSZ.key)}</b> rates · the price follows your travel date`)}</p>`;
    else if (v.key) note = `<p class="bp-note"><i data-lucide="calendar"></i>${L(`${date ? 'วันที่ ' + fmtMD(iso, 'th') : 'วันนี้'} อยู่ในช่วง <b>${bpSzName(v.key)}</b>`, `${date ? fmtMD(iso, 'en') : 'Today'} is in <b>${bpSzName(v.key)}</b>`)}</p>`;
    else { const nx = nextSeason(v.cal, iso); note = `<p class="bp-note"><i data-lucide="info"></i>${L('วันที่นี้ยังไม่มีราคาในตารางของเรือลำนี้ · ทักแชทเพื่อสอบถาม', 'No published rate for this date · please ask our team')}${nx ? L(` · แสดงราคา ${SKEY[nx.key].th} ที่เริ่ม ${fmtMD(nx.from.slice(5), 'th')}`, ` · showing ${SKEY[nx.key].en} from ${fmtMD(nx.from.slice(5), 'en')}`) : ''}</p>`; }
    if (v.add) note += `<p class="bp-note"><i data-lucide="calendar-plus"></i>${L(`${v.sp.label} ${rangeText({ special: [v.sp] }, 'special', 'th')} บวกเพิ่ม ${addText(b, v.cal)} ต่อทริป`, `${v.sp.label} ${rangeText({ special: [v.sp] }, 'special', 'en')}: ${addText(b, v.cal)} per charter`)}</p>`;
    else if (v.cal.add) note += `<p class="bp-note"><i data-lucide="calendar-plus"></i>${L(`ช่วงเทศกาล ${rangeText(v.cal, 'special', 'th')} บวกเพิ่ม ${addText(b, v.cal)} ต่อทริป`, `Holiday dates ${rangeText(v.cal, 'special', 'en')}: ${addText(b, v.cal)} per charter`)}</p>`;
    $('#bpNote').innerHTML = note;
  }
  /* duration tabs + program cards */
  if ($('#bpLen')) $('#bpLen').innerHTML = b.tables.map((tb, ti) => `<button type="button" aria-pressed="${p && p.ti === ti}" onclick="bpPickLen(${ti})">${bpGroupLabel(b, ti)}</button>`).join('');
  if ($('#bpProgs')) $('#bpProgs').innerHTML = progs.filter(q => !p || q.ti === p.ti).map(q => { const pr = bpPrice(b, q), hrs = q.hrs ? `${q.hrs} ${L('ชั่วโมง', 'hours')}` : '';
    return `<button type="button" class="bp-prog" aria-pressed="${q.i === p.i}" onclick="pickProgram(${q.i})">
      <span class="ic">${q.kind === 'sunset' ? '<i data-lucide="sunset"></i>' : q.kind === 'night' ? '<i data-lucide="moon"></i>' : ISLAND_SVG}</span>
      <span class="min-w-0"><b>${q.name}</b><span>${[hrs, pr && pr.col].filter(Boolean).join(' · ') || bpGroupLabel(b, q.ti)}</span></span>
      <span class="pr tabular-nums">${pr ? baht(pr.n + pr.add) : `<em>${L('สอบถามราคา', 'On request')}</em>`}<small>${pr ? (pr.add ? `${L('รวม', 'incl.')} + ${baht(pr.add)}` : L('ทั้งลำ', 'per boat')) : ''}</small></span></button>`; }).join('');
  /* booking card */
  const pr = bpPrice(b, p), pax = bpGuestsN = Math.max(1, +$('#dPax').value || bpGuestsN);
  const extraPax = rule => rule && pax >= rule.from ? pax - rule.from + 1 : 0, rule = extraRule(b), xp = extraPax(rule), extra = xp * (rule ? rule.fee : 0);
  const total = pr ? pr.n + pr.add + extra : null, szLbl = keys.length ? bpSzName(DSZ.key) : L('ราคาทั้งปี', 'All year');
  $('#bpFrom').textContent = `${szLbl} · ${L('ราคาเหมาลำ', 'private charter')}`;
  $('#bpPrice').innerHTML = pr ? `${baht(pr.n + pr.add)} <small>/ ${L('ทริป', 'trip')}</small>` : `<span class="bp-ask">${L('สอบถามราคา', 'Price on request')}</span>`;
  $('#bpPtitle').textContent = p ? [p.name, p.hrs ? `${p.hrs} ${L('ชม.', 'hrs')}` : ''].filter(Boolean).join(' · ') : '';
  if ($('#dProg')) { $$('#dProg option').forEach(o => { const q = progs[+o.value], x = bpPrice(b, q); o.textContent = q.name + (x ? ' · ' + baht(x.n + x.add) : ''); }); $('#dProg').value = p ? p.i : 0; }
  if ($('#dSlot')) { const cur = $('#dSlot').value, sl = bpSlots(b, p); $('#dSlot').innerHTML = sl.map(s => `<option${s === cur ? ' selected' : ''}>${s}</option>`).join(''); }
  $('#bpGOut').textContent = `${pax} ${L('คน', pax > 1 ? 'guests' : 'guest')}`;
  $('#bpMinus').disabled = pax <= 1; $('#bpPlus').disabled = !!b.pax && pax >= b.pax;
  $('#dEstimate').innerHTML = pr ? `<div><span>${L('ราคาเรือ', 'Boat')}</span><span class="tabular-nums">${baht(pr.n)}</span></div>
    ${pr.add ? `<div><span>${DSZ.sp?.label || L('ช่วงพิเศษ', 'Special dates')}</span><span class="tabular-nums">+ ${baht(pr.add)}</span></div>` : ''}
    ${rule ? (xp ? `<div><span>${L(`ผู้โดยสารเพิ่ม ${xp} คน × ${baht(rule.fee)}`, `${xp} extra guest${xp > 1 ? 's' : ''} × ${baht(rule.fee)}`)}</span><span class="tabular-nums">${baht(extra)}</span></div>` : `<div><span>${L(`รวม 1–${rule.from - 1} คนในราคาแล้ว`, `1–${rule.from - 1} guests included`)}</span><span>—</span></div>`) : ''}
    <div class="tot"><span>${L('รวมประมาณ', 'Estimated total')}</span><span class="tabular-nums">${baht(total)}</span></div>`
    : `<div><span>${L('ราคาวันที่นี้', 'Rate for this date')}</span><span>${L('ทีมขายแจ้งราคาให้', 'Our team will quote')}</span></div>`;
  $('#bpMbarL').textContent = p ? `${p.name} · ${keys.length ? bpSzShort(DSZ.key) : L('ทั้งปี', 'All year')}` : name0(b);
  $('#bpMbarP').textContent = total != null ? baht(total) : L('สอบถามราคา', 'On request');
  icons();
}
const name0 = b => niceTitle(b.title);
function pickProgram(i) {
  detailProgram = i; if ($('#dProg')) $('#dProg').value = i; drawProgPrices(bySlug(currentSlug));
  if (innerWidth > 1040) $('#bookingCard')?.animate([{ transform: 'scale(.985)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
}
function bookFromDetail(slug) {
  const b = bySlug(slug), p = allPrograms(b)[detailProgram], slot = $('#dSlot')?.value;
  bpSheet(false);
  openBooking('boat:' + slug, p ? p.label : '');
  if ($('#dDate').value) modalForm.date.value = $('#dDate').value;
  modalForm.adults.value = $('#dPax').value || 2;
  if (slot) {
    // select the matching time chip; a time the chips don't have goes in the note and no chip is sent
    const chips = $$('.slot', modalForm), hit = chips.find(s => s.dataset.slot === slot);
    chips.forEach(s => s.classList.toggle('chip-active', s === hit));
    if (!hit && modalForm.note && !modalForm.note.value) modalForm.note.value = L('รอบเวลา: ', 'Time slot: ') + slot;
  }
}
function accordion(title, body, icon) {
  return `<div class="bg-white rounded-lg ring-1 ring-sand-200 overflow-hidden">
    <button class="acc-btn w-full flex items-center justify-between gap-3 px-4 py-4 text-left font-medium"><span class="flex items-center gap-3"><i data-lucide="${icon}" class="w-5 h-5 text-lagoon-600"></i>${title}</span><i data-lucide="chevron-down" class="acc-chev w-5 h-5 transition"></i></button>
    <div class="hidden px-4 pb-4 text-sm text-muted">${body}</div></div>`;
}
function miniTable(tb) {
  return `<div class="overflow-x-auto rounded-xl ring-1 ring-sand-200 mt-2"><table class="w-full text-xs sm:text-sm min-w-[480px]"><thead class="bg-sand"><tr>${tb.columns.map((c,i)=>`<th class="px-3 py-2 font-medium ${i?'text-right':'text-left'}">${c}</th>`).join('')}</tr></thead>
    <tbody>${tb.rows.map(r=>`<tr class="border-t border-sand-200">${r.map((c,i)=>`<td class="px-3 py-2 ${i?'text-right whitespace-nowrap':''}">${cleanPrice(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const vanHTML = () => `<p class="text-muted">Private Van Transfer · Round Trip</p>${EXTRA.van.tables.map(miniTable).join('')}<ul class="list-disc pl-4 mt-3 space-y-2">${EXTRA.van.notes.map(n=>`<li>${moneyText(n)}</li>`).join('')}</ul>`;
const extraHTML = () => `${EXTRA.services.tables.map(tb=>`<p class="font-medium mt-2">${tb.caption.replace(/\*/g,'')}</p>${miniTable(tb)}`).join('')}<ul class="list-disc pl-4 mt-3 space-y-2">${EXTRA.services.notes.map(n=>`<li>${moneyText(n)}</li>`).join('')}</ul>`;
const payHTML = () => `<ul class="list-disc pl-4 space-y-2">
  <li>A 50% payment is required upon booking confirmation, and the remaining 50% must be settled within 24 hours prior to departure.</li>
  <li>Credit Card Surcharge: 3.5% for MasterCard/Visa and 4.76% for AMEX and Union Pay, plus 7% VAT.</li>
  <li>Payments to ${SET.company} must be accompanied by a reference and made via bank transfer.</li></ul>
  <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 bg-sand rounded-xl p-4 mt-3"><dt class="text-muted">Bank</dt><dd class="font-medium">KASIKORN BANK · Lotus's Phuket</dd><dt class="text-muted">Account No.</dt><dd class="font-medium">213-1-65737-7</dd><dt class="text-muted">Account Name</dt><dd class="font-medium">${SET.company}</dd></dl>
  <p class="font-medium mt-4">Cancellation Policy</p>
  <ul class="list-disc pl-4 space-y-2 mt-2"><li>Less than 48 hours before departure: 30% of the total charter rate.</li><li>Less than 24 hours before departure: 50% of the total charter rate.</li><li>Less than 12 hours before departure or No Show: 100% — all deposits are strictly non-refundable.</li></ul>`;

/* lightbox */
let lbSlug = '', lbIdx = 0;
(()=>{ let x0=null; document.addEventListener('touchstart',e=>{ if(!$('#lightbox')||$('#lightbox').classList.contains('hidden')) return; x0=e.touches[0].clientX; },{passive:true}); document.addEventListener('touchend',e=>{ if(x0==null) return; const dx=e.changedTouches[0].clientX-x0; x0=null; if(Math.abs(dx)>45){ lbIdx+= dx<0?1:-1; drawLightbox(); } },{passive:true}); })();
function openLightbox(slug, i) { lbSlug = slug; lbIdx = i; drawLightbox(); const lb = $('#lightbox'); lb.classList.remove('hidden'); lb.classList.add('flex'); document.body.style.overflow='hidden'; icons(); }
function drawLightbox() {
  const g = gallery(lbSlug); lbIdx = (lbIdx+g.length)%g.length;
  const im = $('#lbImg'); im.classList.remove('is-in'); im.src = g[lbIdx]; im.alt = (bySlug(lbSlug)?.title || '') + ' — photo ' + (lbIdx+1); void im.offsetWidth; im.classList.add('is-in');
  $('#lbCount').textContent = `${lbIdx+1} / ${g.length}`;
  $('#lbThumbs').innerHTML = g.map((src,i)=>`<button onclick="lbIdx=${i};drawLightbox()" class="lb-th ${i===lbIdx?'is-on':''}" aria-label="Photo ${i+1}" aria-current="${i===lbIdx}"><img src="${rs(src, 160)}" alt=""/></button>`).join('');
  $('#lbThumbs .is-on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

/* =========================================================
   ROUTES
   ========================================================= */
function routeInfo(r) {
  const key = DEST_MAP[r[0]] || r[0].split(' ')[0];
  const list = FLEET.filter(b => b.dest.some(d => d.toLowerCase().startsWith(key.toLowerCase())));
  return { list, n: list.length, from: Math.min(...list.filter(b=>b.from_).map(b=>b.from_)) };
}
function renderRoutes() {
  const used = new Set();
  const card = r => { const info = routeInfo(r); const pick = info.list.find(b => !used.has(b.slug) && bimg(b.slug,'hero')) || FLEET.find(b=>!used.has(b.slug)); used.add(pick.slug);
    return `<a href="${destSlugOf(r[0]) ? '#/dest/' + destSlugOf(r[0]) : '#boats'}" onclick="${destSlugOf(r[0]) ? '' : `quickDest('${r[0]}')`}" class="rt-card snap-start shrink-0 group relative block aspect-[4/5] rounded-[18px] overflow-hidden img-fallback">
      <img src="${bimg(pick.slug,'hero')}" alt="${r[0]} – boat trip from Phuket" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"/>
      <span class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"></span>
      <span class="absolute inset-x-0 bottom-0 p-5 text-white">
        <span class="block font-display text-xl leading-tight">${r[0]}</span>
        <span class="block text-sm text-white/85 mt-1">${LANG==='en'?r[2]:r[1]}</span>
        <span class="block text-xs text-white/75 mt-1">${info.n ? `${L('เริ่ม','from')} ${baht(info.from)} · ${info.n} ${L('ลำ','boats')}` : ''}</span>
        <span class="inline-flex items-center gap-1.5 mt-3 text-xs text-white/90 border-b border-white/40 pb-0.5 group-hover:border-white transition">${t('viewAll')} <i data-lucide="arrow-right" class="w-3 h-3 transition group-hover:translate-x-0.5"></i></span>
      </span>
    </a>`; };
  $('#routeTrack').innerHTML = ROUTES.map(card).join('');
  const tr = $('#routeTrack'); tr.onscroll = routeNavState; setTimeout(routeNavState, 50);
  icons();
}
function routeScroll(d) { const tr = $('#routeTrack'), c = tr.querySelector('.rt-card'); if (!c) return; const step = (c.offsetWidth + 20) * (innerWidth < 768 ? 1 : 2); tr.scrollBy({ left: d * step, behavior: 'smooth' }); }
function routeNavState() { const tr = $('#routeTrack'); if (!tr) return; const atS = tr.scrollLeft < 8, atE = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 8; $('#rtPrev') && ($('#rtPrev').disabled = atS); $('#rtNext') && ($('#rtNext').disabled = atE); $('.rt-float') && $('.rt-float').classList.toggle('is-hidden', atE); }
function quickDest(d) { $('#qsDest').value = d; search = { trip:'all', dest:d, date:'', guests:1 }; boatFilter='all'; renderBoatFilters(); renderBoats(); }

/* =========================================================
   QUICK SEARCH
   ========================================================= */
let guests = 2;
function stepGuests(d) { guests = Math.min(60, Math.max(1, guests + d)); $('#qsGuests').textContent = guests; }
$('#quickSearch').addEventListener('submit', e => {
  e.preventDefault();
  if ($('.qs-tab.tab-active')?.dataset.qs === 'activity') { document.getElementById('categories').scrollIntoView({behavior:'smooth'}); return; }
  search = { trip: $('#qsTrip').value, dest: $('#qsDest').value, date: $('#qsDate').value, guests };
  track('Search', { search_string: [search.trip, search.dest].filter(Boolean).join(' '), num_guests: guests });
  boatFilter = search.trip==='overnight' ? 'overnight' : 'all';
  renderBoatFilters(); renderBoats();
  document.getElementById('boats').scrollIntoView({behavior:'smooth'});
});
$$('.qs-tab').forEach(b => b.onclick = () => { $$('.qs-tab').forEach(x => { x.classList.remove('tab-active'); x.classList.add('text-muted'); }); b.classList.add('tab-active'); b.classList.remove('text-muted'); });

/* =========================================================
   FORMS & MODALS
   ========================================================= */
/* ---------- lead attribution (first & last touch) → sent with every lead ---------- */
const ATTR = (() => {
  const q = new URLSearchParams(location.search), now = { src: q.get('utm_source') || '', med: q.get('utm_medium') || '', cmp: q.get('utm_campaign') || '', cnt: q.get('utm_content') || '', gclid: q.get('gclid') || '', fbclid: q.get('fbclid') || '', ref: document.referrer && !document.referrer.includes(location.host) ? document.referrer : '', landing: location.pathname + location.search, ts: Date.now() };
  let a = {}; try { a = JSON.parse(localStorage.getItem('btt_attr') || '{}'); } catch (e) { }
  const touched = now.src || now.gclid || now.fbclid || now.ref;
  if (!a.first) a.first = now; if (touched || !a.last) a.last = now;
  a.visits = (a.visits || 0) + (sessionStorage.getItem('btt_v') ? 0 : 1); a.pages = a.pages || 0;
  try { sessionStorage.setItem('btt_v', 1); localStorage.setItem('btt_attr', JSON.stringify(a)); } catch (e) { }
  return a;
})();
function attrPage() { ATTR.pages = (ATTR.pages || 0) + 1; try { localStorage.setItem('btt_attr', JSON.stringify(ATTR)); } catch (e) { } }
function leadContext() {
  const L = ATTR.last || {}, F = ATTR.first || {};
  return { source: L.gclid ? 'google_ads' : L.fbclid ? 'meta_ads' : L.src || (L.ref ? new URL(L.ref).hostname : 'direct'), medium: L.med, campaign: L.cmp, content: L.cnt, gclid: L.gclid, fbclid: L.fbclid, referrer: L.ref,
    landing_page: L.landing, first_touch: { source: F.src || (F.ref ? new URL(F.ref).hostname : 'direct'), landing_page: F.landing, at: F.ts }, pages_viewed: ATTR.pages, visits: ATTR.visits, returning: ATTR.visits > 1,
    boats_viewed: (typeof RECENT !== 'undefined' ? RECENT : []).slice(0, 5), current_page: location.pathname, lang: LANG, device: matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop', event_id: 'lead.' + Date.now().toString(36) };
}
/* ---------- booking form spam guard — same link patterns as src/lib/spam.ts (the server checks everything again) ---------- */
const LINK_RE = /https?:\/\/|www\.|<\s*a[\s>]|\[\/?(?:url|link)\b|\b(?:bit\.ly|t\.me|tinyurl\.com|goo\.gl|wa\.me|lin\.ee)\b/i;
const DOMAIN_RE = /\b[A-Za-z0-9][A-Za-z0-9-]{2,62}\.(?:com|net|org|info|biz|ru|cn|xyz|top|site|online|shop|store|club|io|ly|link|click|live|app|dev|tk|ml|ga|cf|gq|pw|cc|ws|su|vip|win|bid|loan|work|today|space|website|tech|pro|asia)\b/;
/** emails are fine in the note; the phone / LINE ID field only blocks real links ("boat.pro" is a normal LINE ID) */
const bfHasLink = el => { const v = el.value; return LINK_RE.test(v) || (el.name !== 'phone' && DOMAIN_RE.test(v.replace(/[^\s@]+@[^\s@]+/g, ' '))); };
const BF_TEXT = ['name', 'phone', 'whatsapp', 'note'];
const EMAIL_RE = /^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const EMAIL_TYPO = { 'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'yaho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com', 'icloud.co': 'icloud.com' };
const BF_MSG = {
  link: () => L('ช่องนี้ใส่ลิงก์หรือชื่อเว็บไซต์ไม่ได้', 'Links and web addresses can’t go in this field'),
  format: () => L('รูปแบบอีเมลไม่ถูกต้อง', 'This email address doesn’t look right'),
  disposable: () => L('ไม่รับอีเมลชั่วคราว กรุณาใช้อีเมลที่ใช้งานจริง', 'Please use your real email, not a temporary one'),
  domain: () => L('อีเมลนี้รับข้อความไม่ได้ ลองตรวจตัวสะกดอีกครั้ง', 'This email can’t receive messages — please check the spelling'),
  wa: () => L('ใส่เบอร์ WhatsApp เป็นตัวเลข เช่น +66 81 234 5678', 'Enter the WhatsApp number in digits, e.g. +66 81 234 5678'),
  phone: () => L('ใส่เบอร์โทรหรือ LINE ID เพียงหนึ่งรายการ อย่างน้อย 6 ตัว เช่น 081 234 5678', 'Enter one phone number or LINE ID, at least 6 characters, e.g. +66 81 234 5678'),
  invalid: () => L('ข้อมูลในช่องนี้ไม่ถูกต้องหรือยาวเกินไป', 'Please check this field — it may be too long'),
};
const bfWaOk = v => /^\+?[\d\s().-]+$/.test(v.trim()) && v.replace(/\D/g, '').length >= 7;
/** same rule as the phone field in src/app/api/leads/route.ts */
const bfPhoneOk = v => { const s = v.trim(); return s.length >= 6 && s.length <= 40 && /^[+\d\s().\-@a-zA-Z_]+$/.test(s); };
/** message under a field ('' clears it); html may hold a "did you mean" button */
function bfHint(el, html, onFix) {
  const fld = el.closest('.bf-fld'); if (!fld) return;
  let h = fld.querySelector(':scope > .bf-hint');
  if (!html) { h?.remove(); el.setAttribute('aria-invalid', 'false'); return; }
  if (!h) { h = document.createElement('small'); h.className = 'bf-hint'; h.setAttribute('role', 'alert'); fld.append(h); }
  h.innerHTML = html; el.setAttribute('aria-invalid', 'true');
  if (onFix) h.querySelector('.bf-fix')?.addEventListener('click', onFix);
}
/** format → common typo → /api/leads/email-check (MX records, throwaway inboxes); sets el._ok.
 *  The same address returns the same (maybe still running) check, so submit waits for the real answer
 *  and a blur doesn't redraw the "did you mean" button under the pointer. */
function bfCheckEmail(el) {
  const v = el.value.trim();
  if (el._checked === v && el._p) return el._p;
  el._checked = v;
  return el._p = bfEmail(el, v);
}
async function bfEmail(el, v) {
  el._ok = true;
  if (!v) return bfHint(el, '');
  if (!EMAIL_RE.test(v)) { el._ok = false; return bfHint(el, BF_MSG.format()); }
  const [user, dom] = v.toLowerCase().split('@'), fix = EMAIL_TYPO[dom];
  if (fix) { el._ok = false; return bfHint(el, `${L('หมายถึง', 'Did you mean')} <button type="button" class="bf-fix">${esc(user)}@${fix}</button> ${L('ใช่ไหม?', '?')}`, () => { el.value = `${user}@${fix}`; bfCheckEmail(el); el.focus(); }); }
  try {
    const r = await fetch('/api/leads/email-check?e=' + encodeURIComponent(v)).then(x => x.json());
    if (el.value.trim() !== v) return;
    if (!r.ok) { el._ok = false; return bfHint(el, (BF_MSG[r.reason] || BF_MSG.format)()); }
  } catch (e) { /* offline: the server checks again on send */ }
  bfHint(el, '');
}
function buildForm(wrap) {
  wrap.innerHTML = ''; wrap.appendChild($('#formTpl').content.cloneNode(true));
  const form = $('form', wrap);
  const sel = $('select[name=item]', form);
  sel.innerHTML = `<option value="">${t('chooseItem')}</option>
    <optgroup label="${t('boatsGroup')} (${FLEET.length})">${FLEET.map(b=>`<option value="boat:${b.slug}">${b.title}${b.from_?' · '+t('price.from','เริ่มต้น')+' '+baht(b.from_):''}</option>`).join('')}</optgroup>
    <optgroup label="${t('actsGroup')}">${ACTS.map(a=>`<option value="act:${a.en}">${LANG==='en'?a.en:a.th}</option>`).join('')}</optgroup>`;
  const today = new Date().toISOString().split('T')[0];
  $('input[name=date]', form).min = today; datePick($('input[name=date]', form));
  const progWrap = $('.prog-wrap', form), progSel = $('select[name=program]', form);
  sel.onchange = () => {
    const b = sel.value.startsWith('boat:') && bySlug(sel.value.slice(5));
    progWrap.classList.toggle('hidden', !b);
    if (b) progSel.innerHTML = `<option value="">${t('anyProgram')}</option>` + allPrograms(b).map(p=>`<option>${p.label}</option>`).join('');
  };
  $$('.slot', form).forEach(s => s.onclick = () => { $$('.slot', form).forEach(x=>x.classList.remove('chip-active')); s.classList.add('chip-active'); });
  $$('[required]', form).forEach(el => el.addEventListener('input', () => { if (el.value.trim()) el.setAttribute('aria-invalid','false'); }));
  // spam guard: no links in typed fields, real email (checked when the field is left), WhatsApp in digits
  const em = form.email, wa = form.whatsapp;
  if (em) {
    em.addEventListener('blur', () => bfCheckEmail(em));
    em.addEventListener('input', () => { em._checked = null; if (em.getAttribute('aria-invalid') === 'true') bfHint(em, ''); });
  }
  BF_TEXT.forEach(n => form[n]?.addEventListener('input', () => { const el = form[n]; if (el.closest('.bf-fld')?.querySelector('.bf-hint') && !bfHasLink(el)) bfHint(el, ''); }));
  form.addEventListener('reset', () => $$('.bf-hint', form).forEach(h => h.remove()));
  form._shownAt = Date.now();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form._busy) return;   // Enter / click again while the email check or the send is still running
    const note = form.note?.value ?? '';   // read now: fleet.js adds the reply-language tag for this click only
    const req = ['name','phone','date'].map(n => form[n]);
    req.forEach(el => (el._dpVis || el).setAttribute('aria-invalid', el.value.trim() ? 'false' : 'true')); // _dpVis = the visible date field (datePick)
    const bad = req.filter(el => !el.value.trim());
    $('.form-error', form).classList.toggle('hidden', !bad.length);
    if (bad.length) { (bad[0]._dpVis || bad[0]).focus(); return; }
    const linked = BF_TEXT.map(n => form[n]).filter(el => el && bfHasLink(el === form.note ? { name: 'note', value: note } : el));
    linked.forEach(el => bfHint(el, BF_MSG.link()));
    if (!linked.includes(form.phone) && !bfPhoneOk(form.phone.value)) { bfHint(form.phone, BF_MSG.phone()); linked.push(form.phone); }
    if (wa && wa.value.trim() && !bfWaOk(wa.value)) { bfHint(wa, BF_MSG.wa()); linked.push(wa); }
    if (em && em.value.trim()) { form._busy = true; try { await bfCheckEmail(em); } finally { form._busy = false; } }
    if (em && em.value.trim() && !em._ok) linked.push(em);
    if (linked.length) { linked[0].focus(); return; }
    { const it = form.item?.value || '', b = it.startsWith('boat:') ? bySlug(it.slice(5)) : null; track('Lead', { content_ids: it ? [it.split(':')[1]] : [], content_name: it, value: b?.from_ || 0, currency: 'THB', num_guests: +(form.adults?.value || 0) }); }
    const btn = $('button[type=submit]', form), label = btn.innerHTML;
    form._busy = btn.disabled = true; btn.setAttribute('aria-busy','true'); btn.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${t('sending')}</span>`;
    const payload = Object.fromEntries(new FormData(form)); payload.slot = $('.slot.chip-active', form)?.dataset.slot; payload.marketing_consent = !!form.marketing?.checked; payload.context = leadContext();
    payload.lang = LANG; payload.t = Date.now() - (form._shownAt || 0); payload.adults = +(payload.adults || 0); payload.children = +(payload.kids || 0); payload.message = note; delete payload.kids; delete payload.note; delete payload.marketing;
    const done = ok => { form._busy = btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = label; if (ok) { form.reset(); closeModals(); } };
    const fail = () => { done(false); toast(L('ส่งไม่สำเร็จ กรุณาลองใหม่ หรือทักเราทาง WhatsApp / LINE', 'Could not send. Please try again or message us on WhatsApp / LINE.')); };
    fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(r => r.json().then(j => ({ ok: r.ok && j.ok, j })))
      .then(({ ok, j }) => {
        if (ok) { done(true); toast(t('sent') + (j.ref ? ' · ' + j.ref : '')); return; }
        // the server found something the browser didn't: mark those fields
        const els = Object.entries(j.fields || {}).map(([k, why]) => { const el = form[k === 'message' ? 'note' : k]; if (el) bfHint(el, (BF_MSG[why?.[0]] || BF_MSG[{ whatsapp: 'wa', phone: 'phone', email: 'format' }[k] || 'invalid'])()); return el; }).filter(Boolean);
        if (!els.length) return fail();
        done(false); els[0].focus(); toast(L('กรุณาแก้ไขช่องที่มีข้อความสีแดง', 'Please fix the fields marked in red'));
      })
      .catch(fail);
  });
  applyI18n(wrap); icons();
  return form;
}
let modalForm, inlineForm;
function openBooking(preset='', program='') {
  track('InitiateCheckout', { content_ids: preset ? [preset.split(':')[1]] : [], content_type: preset.startsWith('boat:') ? 'product' : 'activity', content_name: program || preset });
  modalForm = buildForm($('#modalFormWrap'));
  if (preset) { modalForm.item.value = preset; modalForm.item.onchange(); if (program) modalForm.program.value = program; }
  const qd = $('#qsDate').value; if (qd) modalForm.date.value = qd;
  modalForm.adults.value = guests;
  $('#bookingModal').classList.remove('hidden'); document.body.style.overflow='hidden';
  $('#mobileMenu').classList.add('hidden');
  setTimeout(()=>modalForm.name.focus(), 50);
}
function closeModals() { bpSheetOff(); ['#bookingModal','#lightbox','#smartModal','#cmpModal','#cmdModal'].forEach(id=>$(id).classList.add('hidden')); document.body.style.overflow=''; }
$$('[data-close]').forEach(el => el.onclick = closeModals);
document.addEventListener('keydown', e => { if (e.key==='Escape') closeModals(); if (!$('#lightbox').classList.contains('hidden')) { if (e.key==='ArrowRight') { lbIdx++; drawLightbox(); } if (e.key==='ArrowLeft') { lbIdx--; drawLightbox(); } } });

/* =========================================================
   NAV / LANG
   ========================================================= */
$('#menuBtn').onclick = () => { const open = $('#mobileMenu').classList.toggle('hidden') === false; $('#menuBtn').setAttribute('aria-expanded', open); if (open) icons(); };
$$('#mobileMenu a').forEach(a => a.onclick = () => { $('#mobileMenu').classList.add('hidden'); $('#menuBtn').setAttribute('aria-expanded', false); });
window.addEventListener('scroll', () => $('#navbar').classList.toggle('is-compact', scrollY > 24), { passive:true });
function setLang(l) {
  bpSheetOff(); LANG = l; document.documentElement.lang = l; locFleet();
  $$('.lang-btn').forEach(b => { const on = b.dataset.lang===l; b.classList.toggle('chip-active', on); b.classList.toggle('text-muted', !on); b.setAttribute('aria-pressed', on); });
  syncLangChip(); applyI18n(); renderAll(); inlineForm = buildForm($('#inlineFormWrap')); dpRelabel();
}
$$('.lang-btn').forEach(b => b.onclick = () => { if (b.dataset.lang !== LANG) { const l = b.dataset.lang; history.pushState(null, '', hashToPath(VH.hash, l)); setLang(l); toast(t('toastLang')); } });
if ($('#langChip')) $('#langChip').onclick = () => { const l = LANG === 'th' ? 'en' : 'th'; history.pushState(null, '', hashToPath(VH.hash, l)); setLang(l); toast(t('toastLang')); };

const HERO_ROT = HOME ? { th: HOME.hero.words.map(w => w.th || w.en), en: HOME.hero.words.map(w => w.en || w.th) }
  : { th:['ในแบบของคุณ','กับคนที่คุณรัก','กับเพื่อนทั้งแก๊ง','แบบส่วนตัว'], en:['your way','with family','with friends','in private'] };
let heroRotI = 0;
function renderHeroText() {
  heroRotI = 0;
  const rot = HERO_ROT[LANG === 'en' ? 'en' : 'th'];
  $('#heroEyebrow').textContent = L('Boat Trip Thailand · Sea by Soul','Boat Trip Thailand · Sea by Soul');
  $('#heroTitle').innerHTML = `<span class="ht-line"><span class="ht-kw" style="animation-delay:.1s">${L('Yacht Charter ภูเก็ต','Yacht Charter Phuket')}</span></span>`
    + `<span class="ht-line"><span style="animation-delay:.22s">${L('ล่องทะเลอันดามัน','Sail the Andaman')}</span></span>`
    + `<span class="ht-line"><span style="animation-delay:.36s"><span class="hero-hl"><span id="heroRot">${rot[0]}</span></span></span></span>`;
  $('#heroSub').textContent = L(`เรือส่วนตัว ${FLEET.length} ลำ · ภูเก็ต กระบี่ พังงา`, `${FLEET.length} private boats · Phuket, Krabi, Phang Nga`);
  $('#heroCta1').textContent = L('ให้เราช่วยเลือก','Smart Match');
  const tr2 = $('#heroTrust2'); if (tr2) tr2.innerHTML = [['send', L('ส่งคำขอฟรี ไม่ต้องจ่ายบนเว็บ', 'Free request · no payment online')], ['calendar-check', L('ทีมงานเช็กคิวและยืนยันราคาให้', 'Our team checks availability and confirms the price')], SET.tat && ['badge-check', L(`ใบอนุญาตธุรกิจนำเที่ยว TAT ${SET.tat}`, `TAT licence ${SET.tat}`)]].filter(Boolean).map(([ic, x]) => `<li><i data-lucide="${ic}"></i>${x}</li>`).join('');
  $('#heroCta2').textContent = L('ดูเรือทั้งหมด','Browse the fleet');
  $('#promoPrice') && ($('#promoPrice').textContent = baht(375000));
  if (HOME) renderHomeContent();
  requestAnimationFrame(() => fitHeroHl());
}
/* Hero + promo banner text from /admin (overrides the built-in text above) */
function renderHomeContent() {
  const H = HOME.hero, P = HOME.promo, kw = $('#heroTitle .ht-kw'), lines = $$('#heroTitle .ht-line > span');
  if (kw) kw.textContent = homeTxt(H.kicker);
  if (lines[1]) lines[1].textContent = homeTxt(H.title);
  const r = $('#heroRot'); if (r) r.textContent = HERO_ROT[LANG === 'en' ? 'en' : 'th'][0] || '';
  $('#heroSub').textContent = homeTxt(H.sub);
  $('#heroCta2').textContent = homeTxt(H.cta1);   // white button → fleet
  $('#heroCta1').textContent = homeTxt(H.cta2);   // outline button → Smart Match
  const promo = $('#promo'); if (!promo) return;
  const today = new Date().toISOString().slice(0, 10), boat = FLEET.find(b => b.slug === P.boat);
  promo.hidden = !!((P.start && today < P.start) || (P.end && today > P.end));
  ['tag', 'title', 'sub', 'cta'].forEach(k => { const el = promo.querySelector(`[data-i18n="promo.${k}"],[data-home="promo.${k}"]`); if (el) { el.removeAttribute('data-i18n'); el.setAttribute('data-home', 'promo.' + k); el.textContent = homeTxt(P[k]); } });
  promo.querySelector('[data-home="promo.cta"]')?.setAttribute('onclick', boat ? `location.hash='#/boat/${boat.slug}'` : `location.hash='#/fleet'`);
  const img = promo.querySelector('img[data-bimg]');
  if (img && boat) { img.dataset.bimg = boat.slug + ':hero'; img.setAttribute('src', bimg(boat.slug, 'hero', 1280)); img.setAttribute('alt', niceTitle(boat.title)); }
  const price = P.price || boat?.from_; $('#promoPrice').textContent = price ? baht(price) : '';
}
function fitHeroHl() {}
function heroRotate() {
  const r = $('#heroRot'); if (!r || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rot = HERO_ROT[LANG === 'en' ? 'en' : 'th']; heroRotI = (heroRotI + 1) % rot.length;
  r.classList.add('out');
  setTimeout(() => { r.textContent = rot[heroRotI]; r.classList.remove('out'); r.classList.add('pre'); void r.offsetWidth; requestAnimationFrame(() => r.classList.remove('pre')); setTimeout(() => r.classList.remove('pre','out'), 500); }, 380);
}
addEventListener('resize', () => fitHeroHl(), { passive:true });
document.fonts && document.fonts.ready.then(() => fitHeroHl());

/* ---------- Search by boat type (line icons drawn for BTT) ---------- */
const TYPE_ICON = {
  yacht: `<svg viewBox="0 0 120 56" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M10 37h100l-9 7H18z"/><path d="M26 37l7-8h50l13 8"/><path d="M42 29l5-7h26l6 7"/><path d="M54 22v-7m-3 3h6"/><path d="M38 33h44" opacity=".7"/><path d="M33 40.5h60" opacity=".45"/><path d="M6 49c6 0 6 1.6 12 1.6S24 49 30 49s6 1.6 12 1.6S48 49 54 49s6 1.6 12 1.6S72 49 78 49s6 1.6 12 1.6S96 49 102 49s6 1.6 12 1.6" opacity=".55"/></svg>`,
  sail: `<svg viewBox="0 0 120 56" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M14 38h92l-7 6H21z"/><path d="M38 38l4-5h36l4 5"/><path d="M60 33V6"/><path d="M58.5 9v22H34z"/><path d="M61.5 11l21 20h-21z"/><path d="M46 35.5h28" opacity=".7"/><path d="M6 49c6 0 6 1.6 12 1.6S24 49 30 49s6 1.6 12 1.6S48 49 54 49s6 1.6 12 1.6S72 49 78 49s6 1.6 12 1.6S96 49 102 49s6 1.6 12 1.6" opacity=".55"/></svg>`,
  power: `<svg viewBox="0 0 120 56" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M10 38h100l-8 6H18z"/><path d="M22 38v-7h66l12 7"/><path d="M34 31l5-7h40l7 7"/><path d="M46 24v-5h26v5"/><path d="M42 19h34"/><path d="M30 34.5h56" opacity=".7"/><path d="M6 49c6 0 6 1.6 12 1.6S24 49 30 49s6 1.6 12 1.6S48 49 54 49s6 1.6 12 1.6S72 49 78 49s6 1.6 12 1.6S96 49 102 49s6 1.6 12 1.6" opacity=".55"/></svg>`,
  speed: `<svg viewBox="0 0 120 56" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M12 36h78c8 0 15-2 20-5l-8 9H20z"/><path d="M12 36v-3"/><path d="M52 36l9-8h14l3 8"/><path d="M50 24h28"/><path d="M57 24v4m14-4v4"/><path d="M10 33h-4v8" opacity=".8"/><path d="M6 49c6 0 6 1.6 12 1.6S24 49 30 49s6 1.6 12 1.6S48 49 54 49s6 1.6 12 1.6S72 49 78 49s6 1.6 12 1.6S96 49 102 49s6 1.6 12 1.6" opacity=".55"/></svg>`,
  longtail: `<svg viewBox="0 0 120 56" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M16 37c12 6 64 6 82 0"/><path d="M98 37l8-13c1-2 3-2 4 0"/><path d="M16 37l-4-7"/><path d="M38 38V27h42v11"/><path d="M34 27h50"/><path d="M14 33L4 44" opacity=".8"/><path d="M2 42l4 4" opacity=".8"/><path d="M6 49c6 0 6 1.6 12 1.6S24 49 30 49s6 1.6 12 1.6S48 49 54 49s6 1.6 12 1.6S72 49 78 49s6 1.6 12 1.6S96 49 102 49s6 1.6 12 1.6" opacity=".55"/></svg>`,
};
function renderTypeBand() {
  const el = $('#typeBand'); if (!el) return;
  const k = LANG === 'en' ? 1 : 0;
  const bg = bimg('ocean-pearl-42-ft','hero', 320);
  el.innerHTML = `
    <img src="${bg}" alt="" aria-hidden="true" loading="lazy" class="absolute inset-0 w-full h-full object-cover scale-[1.15] blur-[6px]"/>
    <div class="absolute inset-0 bg-[#0b1a24]/65" aria-hidden="true"></div>
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 text-white text-center">
      <p class="text-[11px] uppercase tracking-[.32em] text-white/70 reveal">${L('ค้นหาตาม','Search by')}</p>
      <h2 id="typeBandTitle" class="font-display text-3xl sm:text-4xl mt-3 reveal">${L('ประเภทเรือ','Boat type')}</h2>
      <p class="text-sm text-white/75 mt-4 max-w-xl mx-auto reveal">${L(`รู้แล้วว่าอยากได้เรือแบบไหน? เลือกจากเรือส่วนตัว ${FLEET.length} ลำของเรา ทั่วภูเก็ต กระบี่ และพังงา`,`Know what you're looking for? Browse our ${FLEET.length} private boats across Phuket, Krabi and Phang Nga.`)}</p>
      <ul class="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
        ${TYPES.map((ty,i) => { const n = FLEET.filter(b => b.type === ty).length; return `<li class="reveal" style="transition-delay:${i*70}ms">
          <a href="#/fleet" onclick="fleetState.f='${ty}'" class="tb-item group block">
            <span class="tb-ico block mx-auto">${TYPE_ICON[ty]}</span>
            <span class="block mt-4 text-lg font-medium">${typeLabel(ty)}</span>
            <span class="block text-sm text-white/70 mt-1">${n} ${L('ลำ','boats')} · ${L('เริ่ม','from')} ${baht(minFrom(ty))}</span>
          </a></li>`; }).join('')}
      </ul>
      <a href="#/fleet" class="mt-12 inline-flex items-center gap-2 h-11 px-6 bg-white text-ink hover:bg-white/90 transition text-[13px]">${L('ดูเรือทั้งหมด','View all boats')} <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></a>
    </div>`;
}

const HOME_PARTS = () => [renderHeroText, renderHero, renderTypeBand, renderStats, renderSmartTeaser, renderGroups, renderCats, renderActs, renderBoatFilters, renderBoats, renderRoutes, renderRecent, renderSeoGuide, renderHomeBlog, renderFaq, renderTeam, renderTeamLive];
function renderAll() { HOME_PARTS().forEach(f => f()); renderNavText(); updateCompareUI(); route(true); }
/* first load on another page (a boat, the fleet, an article…): draw that page first, then the hidden home sections
   a few at a time in later tasks, so the phone is not frozen while it builds a page nobody is looking at yet */
function renderHomeLater() {
  const parts = HOME_PARTS();
  if (navigator.userAgent === 'BTT-SSR') { parts.forEach(f => f()); return; }   // server render: same HTML as before
  // fxPark (fleet.js) takes the photos out of hidden views so they do not download before the home page is opened
  const park = () => { try { typeof fxPark === 'function' && fxPark(); } catch (e) { } };
  const step = () => { const t = Date.now(); while (parts.length && Date.now() - t < 25) { try { parts.shift()(); } catch (e) { console.error(e); } } park(); if (parts.length) setTimeout(step, 0); else icons(); };
  setTimeout(step, 0);
}

/* =========================================================
   DESIGN SYSTEM PAGE  (#/design) — implementation guidance
   ========================================================= */
/* =========================================================
   ABOUT US  (#/about)
   ========================================================= */
const MARINA_CANON = m => { const s = (m||'').toLowerCase();
  if (s.includes('chalong')) return 'Chalong Pier';
  if (s.includes('ao po')) return 'Ao Po Grand Marina';
  if (s.includes('one°15') || s.includes('one 15')) return 'ONE°15 Marina Panwa';
  if (s.includes('boat lagoon')) return 'Boat Lagoon';
  if (s.includes('royal phuket') || s.includes('rpm')) return 'Royal Phuket Marina';
  if (s.includes('coco')) return 'Coco Pier Panwa';
  if (s.includes('nakalay') || s.includes('kalim')) return 'Nakalay Pier (Kalim)';
  return prettyMarina(m); };
function renderAbout() {
  const v = $('#view-about');
  const marinas = Object.entries(FLEET.reduce((o,b) => { const k = MARINA_CANON(b.marina); o[k] = (o[k]||0)+1; return o; }, {})).sort((a,b)=>b[1]-a[1]);
  const maxPax = Math.max(...FLEET.map(b=>b.pax||0));
  const minP = Math.min(...FLEET.filter(b=>b.from_).map(b=>b.from_));
  const stats = [[FLEET.length, L('ลำในเครือข่าย','boats in our network')],[marinas.length, L('ท่าเรือ & มารีน่า','piers & marinas')],[maxPax, L('คนสูงสุดต่อลำ','guests max per boat')],[TYPES.length, L('ประเภทเรือ','boat types')]];
  const values = [
    ['badge-check', L('ใบอนุญาตถูกต้อง','Licensed & insured'), L(`บริษัทนำเที่ยวที่จดทะเบียนกับ ททท. (${SET.tat}) ทุกทริปมีกัปตันมืออาชีพ ลูกเรือ และประกันภัยผู้โดยสาร`,`A TAT-registered tour company (${SET.tat}). Every trip includes a professional captain, crew and passenger insurance.`)],
    ['receipt-text', L('ราคาโปร่งใส','Transparent pricing'), L('แสดงราคาจริงจากโบรชัวร์ทุกฤดูกาล รวม VAT 7% คำนวณค่าคนเพิ่มให้ก่อนจอง ไม่มีค่าธรรมเนียมแอบแฝง','Real brochure rates for every season, VAT included, extra-guest charges shown before you book — no hidden fees.')],
    ['compass', L('ช่วยเลือกเรือที่ใช่','Honest boat matching'), L('เราแนะนำเรือตามจำนวนคน งบ และสไตล์ทริปของคุณ ไม่ใช่ลำที่แพงที่สุด','We recommend boats by group size, budget and trip style — not by whichever is most expensive.')],
    ['message-circle', L('ตอบไวทุกวัน','Fast, human replies'), L('ทีมขายตอบทาง WhatsApp, LINE และโทรศัพท์ทุกวัน 09:00–21:00 น. ทั้งภาษาไทยและอังกฤษ','Our sales team replies on WhatsApp, LINE and phone daily 09:00–21:00, in Thai and English.')],
  ];
  const steps = [
    [L('บอกความต้องการ','Tell us your plan'), L('วันที่ จำนวนคน และสิ่งที่อยากทำ','Date, group size and what you want to do')],
    [L('รับตัวเลือกเรือ','Get boat options'), L('ทีมงานเสนอเรือที่เหมาะพร้อมราคาจริง','We shortlist suitable boats with real prices')],
    [L('คุยกับเซลล์และยืนยัน','Chat & confirm'), L('เซลล์ตัวจริงดูแลทาง WhatsApp / LINE ตั้งแต่ถามจนออกเรือ','A real person looks after you on WhatsApp / LINE until you sail')],
    [L('ออกทะเล','Set sail'), L('ลูกเรือดูแลตลอดทริป เราติดตามจนกลับถึงฝั่ง','Crew look after you; we follow up until you are back')],
  ];
  const imgs = ['leopard-90-ft','lobster-78-ft','coco-40-ft'].map(s=>bimg(s,'hero'));
  v.innerHTML = `
  <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12 lg:pb-16">
    <nav aria-label="Breadcrumb" class="text-xs text-muted flex items-center gap-2"><a href="#/" class="hover:text-maroon">${t('home')}</a><i data-lucide="chevron-right" class="w-3 h-3"></i><span aria-current="page" class="text-ink">${L('เกี่ยวกับเรา','About us')}</span></nav>
    <div class="mt-6 grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center">
      <div>
        <p class="text-xs uppercase tracking-[.2em] text-maroon">${L('เกี่ยวกับเรา','About us')} · Sea by Soul</p>
        <h1 class="font-display font-medium text-3xl sm:text-4xl leading-tight mt-3">${L('ทีม Yacht Charter ภูเก็ต ที่อยากให้ทุกทริปทะเลเป็นความทรงจำที่ดี','A Phuket yacht charter team that wants every day at sea to be a good memory')}</h1>
        <p class="text-muted mt-5 leading-relaxed">${L(`Boat Trip Thailand ให้บริการเช่าเรือยอชต์ คาตามารัน สปีดโบ๊ท และเรือหางยาวแบบส่วนตัว ${FLEET.length} ลำ จาก ${marinas.length} ท่าเรือทั่วภูเก็ต ไปเกาะพีพี อ่าวพังงา เกาะราชา กระบี่ และอีกมากมาย`, `Boat Trip Thailand arranges private yacht, catamaran, speedboat and long-tail charters — ${FLEET.length} boats from ${marinas.length} piers and marinas across Phuket, to Phi Phi, Phang Nga Bay, Racha, Krabi and beyond.`)}</p>
        <p class="text-muted mt-3 leading-relaxed">${L('เราทำงานกับเจ้าของเรือและกัปตันโดยตรง จึงให้ข้อมูลเรือ ราคา และเงื่อนไขได้ตรงไปตรงมา ตั้งแต่ทริปครึ่งวันสำหรับครอบครัว ไปจนถึงงานปาร์ตี้และงานองค์กรบนเรือลำใหญ่','We work directly with boat owners and captains, so we can be straight with you about boats, prices and terms — from a half-day family trip to a party or corporate event on a large catamaran.')}</p>
        <div class="mt-7 flex flex-wrap gap-3">
          <a href="#/fleet" class="inline-flex items-center gap-2 bg-maroon text-white px-6 py-3 text-sm hover:bg-maroon-800 transition">${L('ดูเรือทั้งหมด','Browse the fleet')}<i data-lucide="arrow-right" class="w-4 h-4"></i></a>
          <a href="#team" class="inline-flex items-center gap-2 ring-1 ring-ink px-6 py-3 text-sm hover:bg-ink hover:text-white transition">${L('คุยกับทีมงาน','Talk to our team')}</a>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2 aspect-[16/9] rounded-[24px] overflow-hidden img-fallback"><img src="${imgs[0]}" alt="${L('เรือยอชต์ Leopard 90 ft ในทะเลอันดามัน','Leopard 90 ft yacht on the Andaman Sea')}" class="w-full h-full object-cover" loading="lazy"/></div>
        <div class="aspect-[4/3] rounded-[18px] overflow-hidden img-fallback"><img src="${imgs[1]}" alt="${L('เรือคาตามารัน Lobster 78 ft','Lobster 78 ft catamaran')}" class="w-full h-full object-cover" loading="lazy"/></div>
        <div class="aspect-[4/3] rounded-[18px] overflow-hidden img-fallback"><img src="${imgs[2]}" alt="${L('เรือใบ Coco 40 ft','Coco 40 ft sailing catamaran')}" class="w-full h-full object-cover" loading="lazy"/></div>
      </div>
    </div>
  </section>

  <section class="border-y border-sand-200 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
      ${stats.map(([n,l])=>`<div class="reveal"><p class="font-display text-3xl sm:text-4xl text-maroon tabular-nums">${n}</p><p class="text-sm text-muted mt-1">${l}</p></div>`).join('')}
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
    <div class="max-w-2xl reveal"><p class="text-xs uppercase tracking-[.2em] text-maroon">${L('สิ่งที่เรายึดถือ','What we stand for')}</p><h2 class="font-display font-medium text-2xl sm:text-3xl mt-2">${L('ทำไมลูกค้าเลือกเช่าเรือกับเรา','Why guests charter with us')}</h2></div>
    <ul class="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${values.map(([ic,h,p])=>`<li class="reveal bg-white ring-1 ring-sand-200 rounded-[18px] p-6"><span class="w-11 h-11 rounded-full bg-maroon-50 text-maroon grid place-items-center"><i data-lucide="${ic}" class="w-5 h-5"></i></span><h3 class="font-medium text-lg mt-4">${h}</h3><p class="text-sm text-muted mt-2 leading-relaxed">${p}</p></li>`).join('')}
    </ul>
  </section>

  <section class="bg-sand">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 grid lg:grid-cols-[1fr_1.2fr] gap-10">
      <div class="reveal">
        <p class="text-xs uppercase tracking-[.2em] text-maroon">${L('ท่าเรือของเรา','Where we depart')}</p>
        <h2 class="font-display font-medium text-2xl sm:text-3xl mt-2">${L(`ออกเรือได้จาก ${marinas.length} ท่าเรือ`,`Depart from ${marinas.length} piers & marinas`)}</h2>
        <p class="text-muted mt-3 leading-relaxed">${L('เลือกท่าเรือที่ใกล้ที่พักที่สุด หรือให้เราจัดรถตู้รับส่งส่วนตัวจากโรงแรมทั่วภูเก็ต','Pick the pier closest to your hotel, or let us arrange a private van transfer from anywhere in Phuket.')}</p>
        <a href="#/fleet" class="mt-6 inline-flex items-center gap-2 text-sm text-maroon hover:underline underline-offset-4">${L(`เรือเริ่มต้น ${baht(minP)} ต่อทริป`,`Boats from ${baht(minP)} per charter`)}<i data-lucide="arrow-right" class="w-4 h-4"></i></a>
      </div>
      <ul class="grid sm:grid-cols-2 gap-3 reveal">
        ${marinas.map(([m,n])=>`<li class="bg-white ring-1 ring-sand-200 rounded-[14px] px-4 py-3 flex items-center justify-between gap-3"><span class="flex items-center gap-2 min-w-0"><i data-lucide="anchor" class="w-4 h-4 text-maroon shrink-0"></i><span class="truncate">${m}</span></span><span class="text-xs text-muted tabular-nums shrink-0">${n} ${L('ลำ','boats')}</span></li>`).join('')}
      </ul>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
    <div class="max-w-2xl reveal"><p class="text-xs uppercase tracking-[.2em] text-maroon">${L('การทำงานของเรา','How it works')}</p><h2 class="font-display font-medium text-2xl sm:text-3xl mt-2">${L('จองเรือกับเราใน 4 ขั้นตอน','Charter with us in 4 steps')}</h2></div>
    <ol class="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${steps.map(([h,p],i)=>`<li class="reveal rounded-[18px] bg-sand p-6"><span class="font-display text-3xl text-maroon tabular-nums">0${i+1}</span><h3 class="font-medium mt-3">${h}</h3><p class="text-sm text-muted mt-1">${p}</p></li>`).join('')}
    </ol>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-12 lg:pb-16">
    <div class="grid lg:grid-cols-[1.4fr_1fr] gap-4">
      <div class="reveal rounded-[24px] bg-maroon text-white p-8 sm:p-10 on-dark relative overflow-hidden">
        <p class="text-xs uppercase tracking-[.2em] text-white/80">Sea by Soul</p>
        <h2 class="font-display font-medium text-2xl sm:text-3xl mt-2">${L('พร้อมวางแผนทริปทะเลของคุณหรือยัง?','Ready to plan your day at sea?')}</h2>
        <p class="text-white/85 mt-3 max-w-lg">${L('บอกวันที่และจำนวนคน ทีมงานจะเสนอเรือที่เหมาะพร้อมราคาภายใน 30 นาที','Tell us your date and group size — we will send suitable boats and prices within 30 minutes.')}</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <button onclick="openSmart()" class="inline-flex items-center gap-2 bg-white text-ink px-6 py-3 text-sm hover:bg-sand transition"><i data-lucide="sparkles" class="w-4 h-4 text-maroon"></i>Smart Match</button>
          <a href="${TEL}" class="inline-flex items-center gap-2 ring-1 ring-white/60 px-6 py-3 text-sm hover:bg-white/10 transition"><i data-lucide="phone" class="w-4 h-4"></i>${SET.phone}</a>
        </div>
      </div>
      <div class="reveal rounded-[24px] ring-1 ring-sand-200 bg-white p-8" itemscope itemtype="https://schema.org/TravelAgency">
        <p class="text-xs uppercase tracking-[.2em] text-maroon">${L('ข้อมูลบริษัท','Company details')}</p>
        <dl class="mt-4 space-y-3 text-sm">
          <div class="flex justify-between gap-4 border-b border-dashed border-sand-200 pb-3"><dt class="text-muted">${L('ชื่อบริษัท','Company')}</dt><dd class="text-right" itemprop="legalName">${SET.company}</dd></div>
          <div class="flex justify-between gap-4 border-b border-dashed border-sand-200 pb-3"><dt class="text-muted">${L('ใบอนุญาต ททท.','TAT licence')}</dt><dd class="text-right">${SET.tat}</dd></div>
          <div class="flex justify-between gap-4 border-b border-dashed border-sand-200 pb-3"><dt class="text-muted">${L('ที่อยู่','Address')}</dt><dd class="text-right" itemprop="address"><a href="${MAP_URL}" target="_blank" rel="noopener" class="hover:text-maroon">${L(ADDRESS_TH, ADDRESS_EN)}</a></dd></div>
          <div class="flex justify-between gap-4 border-b border-dashed border-sand-200 pb-3"><dt class="text-muted">${L('โทร','Phone')}</dt><dd class="text-right"><a href="${TEL}" class="hover:text-maroon" itemprop="telephone">${SET.phone}</a></dd></div>
          <div class="flex justify-between gap-4 border-b border-dashed border-sand-200 pb-3"><dt class="text-muted">LINE</dt><dd class="text-right"><a href="${SET.lineUrl}" target="_blank" rel="noopener" class="hover:text-maroon">${SET.line}</a></dd></div>
          <div class="flex justify-between gap-4"><dt class="text-muted">Email</dt><dd class="text-right break-all"><a href="mailto:${SET.email}" class="hover:text-maroon" itemprop="email">${SET.email}</a></dd></div>
        </dl>
      </div>
    </div>
  </section>`;
  icons();
}

/* =========================================================
   LEGAL  (#/privacy · #/terms · #/cookies)
   ========================================================= */
const LEGAL_UPDATED = ['19 ตุลาคม 2569', '19 October 2026'];
const COMPANY = SET.company;
const CONTACT_EMAIL = SET.email;
const ADDRESS_TH = SET.address.th;
const ADDRESS_EN = SET.address.en;
const MAP_URL = SET.map;
function legalDocs() {
  const ul = a => `<ul>${a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  return {
  privacy: {
    title: L('นโยบายความเป็นส่วนตัว','Privacy Policy'),
    intro: L(`${COMPANY} ("บริษัท", "เรา") ให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ นโยบายนี้อธิบายว่าเราเก็บ ใช้ เปิดเผย และดูแลข้อมูลส่วนบุคคลอย่างไร เมื่อคุณใช้เว็บไซต์ boattripthailand.com ติดต่อเรา หรือจองเรือกับเรา ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)`,
                 `${COMPANY} ("we", "us") respects your privacy. This policy explains how we collect, use, disclose and protect personal data when you use boattripthailand.com, contact us or book a charter, in line with Thailand's Personal Data Protection Act B.E. 2562 (PDPA).`),
    secs: [
      ['controller', L('ผู้ควบคุมข้อมูล','Data controller'), `<p>${L(`${COMPANY} ใบอนุญาตประกอบธุรกิจนำเที่ยวเลขที่ ${SET.tat} ${ADDRESS_TH} ติดต่อเรื่องข้อมูลส่วนบุคคลได้ที่ <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> หรือ ${SET.phone}`,`${COMPANY}, TAT licence ${SET.tat}, ${ADDRESS_EN}, Thailand. For privacy matters contact <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> or ${SET.phone}.`)}</p>`],
      ['collect', L('ข้อมูลที่เราเก็บ','Data we collect'), ul(LANG==='en'?[
        '<b>Contact details</b> – name, phone number, email, LINE or WhatsApp ID.',
        '<b>Booking details</b> – boat, program, date, number of adults and children, pick-up hotel, special requests (e.g. celebrations, food allergies).',
        '<b>Passenger details for insurance</b> – names and, where required by the insurer or authorities, passport or ID numbers.',
        '<b>Payment records</b> – transfer slips and references. We do not store full card numbers; card payments are processed by the payment provider.',
        '<b>Technical data</b> – IP address, device and browser type, pages viewed, and cookies (see our Cookie Preferences).',
      ]:[
        '<b>ข้อมูลติดต่อ</b> – ชื่อ เบอร์โทร อีเมล LINE ID หรือ WhatsApp',
        '<b>ข้อมูลการจอง</b> – เรือ โปรแกรม วันที่ จำนวนผู้ใหญ่และเด็ก โรงแรมที่รับ คำขอพิเศษ (เช่น วันเกิด อาหารที่แพ้)',
        '<b>ข้อมูลผู้โดยสารเพื่อทำประกันภัย</b> – ชื่อ และเลขพาสปอร์ตหรือบัตรประชาชนเมื่อบริษัทประกันหรือหน่วยงานกำหนด',
        '<b>ข้อมูลการชำระเงิน</b> – สลิปโอนเงินและเลขอ้างอิง เราไม่เก็บเลขบัตรเครดิตเต็ม การชำระด้วยบัตรดำเนินการโดยผู้ให้บริการชำระเงิน',
        '<b>ข้อมูลทางเทคนิค</b> – IP อุปกรณ์ เบราว์เซอร์ หน้าที่เข้าชม และคุกกี้ (ดูที่การตั้งค่าคุกกี้)',
      ])],
      ['use', L('วัตถุประสงค์และฐานทางกฎหมาย','How we use data & legal bases'), ul(LANG==='en'?[
        '<b>To arrange your charter</b> – quotes, bookings, confirmations, transfers and on-board services (contract).',
        '<b>To insure passengers and meet maritime and tourism rules</b> (legal obligation).',
        '<b>To answer questions and provide support</b> by phone, LINE, WhatsApp or email (contract / legitimate interest).',
        '<b>To keep accounting and tax records</b> (legal obligation).',
        '<b>To improve our website</b> with analytics cookies (consent).',
        '<b>To send offers and promotions</b> (consent – you can unsubscribe at any time).',
      ]:[
        '<b>จัดทริปเช่าเรือ</b> – เสนอราคา จอง ยืนยัน รถรับส่ง และบริการบนเรือ (ฐานสัญญา)',
        '<b>ทำประกันภัยผู้โดยสารและปฏิบัติตามกฎหมายการเดินเรือและการท่องเที่ยว</b> (ฐานหน้าที่ตามกฎหมาย)',
        '<b>ตอบคำถามและดูแลลูกค้า</b> ทางโทรศัพท์ LINE WhatsApp หรืออีเมล (ฐานสัญญา / ประโยชน์โดยชอบด้วยกฎหมาย)',
        '<b>จัดทำบัญชีและภาษี</b> (ฐานหน้าที่ตามกฎหมาย)',
        '<b>ปรับปรุงเว็บไซต์</b> ด้วยคุกกี้วิเคราะห์ (ฐานความยินยอม)',
        '<b>ส่งข่าวสารและโปรโมชั่น</b> (ฐานความยินยอม – ยกเลิกได้ทุกเมื่อ)',
      ])],
      ['share', L('การเปิดเผยข้อมูล','Who we share data with'), `<p>${L('เราไม่ขายข้อมูลส่วนบุคคล เราเปิดเผยเฉพาะเท่าที่จำเป็นต่อ:','We never sell personal data. We share only what is needed with:')}</p>`+ul(LANG==='en'?['Boat owners, captains and crew operating your charter','Insurance companies','Transfer and extra-service providers you book (van, DJ, catering, guides)','Banks and payment providers','IT, hosting, analytics and messaging providers acting on our instructions','Government authorities when required by law']:['เจ้าของเรือ กัปตัน และลูกเรือที่ให้บริการทริปของคุณ','บริษัทประกันภัย','ผู้ให้บริการรถรับส่งและบริการเสริมที่คุณจอง (รถตู้ ดีเจ อาหาร ไกด์)','ธนาคารและผู้ให้บริการชำระเงิน','ผู้ให้บริการไอที โฮสติ้ง วิเคราะห์ข้อมูล และระบบแชท ที่ทำงานตามคำสั่งของเรา','หน่วยงานรัฐเมื่อกฎหมายกำหนด'])
        + `<p>${L('ผู้ให้บริการบางรายอาจเก็บข้อมูลนอกประเทศไทย เราจะดูแลให้มีมาตรการคุ้มครองที่เหมาะสมตามที่ PDPA กำหนด','Some providers may store data outside Thailand; we make sure appropriate safeguards are in place as the PDPA requires.')}</p>`],
      ['retention', L('ระยะเวลาเก็บข้อมูล','How long we keep data'), `<p>${L('เราเก็บข้อมูลการจองตลอดระยะเวลาที่ให้บริการ และเก็บเอกสารบัญชีตามที่กฎหมายกำหนด (โดยทั่วไปอย่างน้อย 5 ปี) ข้อมูลที่เก็บด้วยความยินยอมจะลบเมื่อคุณถอนความยินยอม','We keep booking data while providing the service and keep accounting records for as long as the law requires (generally at least 5 years). Data held on consent is deleted when you withdraw it.')}</p>`],
      ['rights', L('สิทธิของคุณ','Your rights'), ul(LANG==='en'?['Access and obtain a copy of your data','Correct inaccurate data','Delete or anonymise data','Restrict or object to processing','Data portability','Withdraw consent at any time','Complain to the Personal Data Protection Committee (PDPC)']:['ขอเข้าถึงและขอรับสำเนาข้อมูล','ขอแก้ไขข้อมูลให้ถูกต้อง','ขอลบหรือทำให้ข้อมูลไม่สามารถระบุตัวตนได้','ขอระงับหรือคัดค้านการประมวลผล','ขอโอนย้ายข้อมูล','ถอนความยินยอมได้ทุกเมื่อ','ร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)'])
        + `<p>${L(`ส่งคำขอได้ที่ <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> เราจะตอบภายใน 30 วัน`,`Send requests to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>; we reply within 30 days.`)}</p>`],
      ['security', L('ความปลอดภัยของข้อมูล','Security'), `<p>${L('เราใช้มาตรการทางเทคนิคและการจัดการที่เหมาะสม เช่น การเข้ารหัส HTTPS การจำกัดสิทธิ์เข้าถึงเฉพาะพนักงานที่จำเป็น และการเลือกผู้ให้บริการที่มีมาตรฐาน','We use appropriate technical and organisational measures such as HTTPS encryption, staff-only access on a need-to-know basis and carefully chosen providers.')}</p>`],
      ['children', L('ข้อมูลของผู้เยาว์','Children'), `<p>${L('การจองต้องทำโดยผู้ที่มีอายุ 20 ปีขึ้นไป ข้อมูลของเด็กที่ร่วมทริปจะได้รับจากผู้ปกครองเพื่อการทำประกันภัยและความปลอดภัยเท่านั้น','Bookings must be made by adults. Details of children on board are provided by their parent or guardian and used only for insurance and safety.')}</p>`],
      ['changes', L('การเปลี่ยนแปลงนโยบาย','Changes to this policy'), `<p>${L('เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว ฉบับล่าสุดจะแสดงในหน้านี้พร้อมวันที่ปรับปรุง','We may update this policy from time to time. The latest version will always be on this page with its update date.')}</p>`],
    ]},
  terms: {
    title: L('ข้อกำหนดและเงื่อนไข','Terms & Conditions'),
    intro: L(`ข้อกำหนดนี้ใช้กับการจองเรือและบริการทั้งหมดของ ${COMPANY} ผ่านเว็บไซต์ โทรศัพท์ LINE WhatsApp หรืออีเมล การชำระมัดจำถือว่าคุณได้อ่านและยอมรับข้อกำหนดนี้แล้ว`,
                 `These terms apply to all charters and services booked with ${COMPANY} via our website, phone, LINE, WhatsApp or email. Paying a deposit means you have read and accepted them.`),
    secs: [
      ['booking', L('การจองและการยืนยัน','Bookings & confirmation'), ul(LANG==='en'?['A request sent through the website is not yet a booking. It is confirmed once our team confirms availability in writing and the deposit is received.','Prices are per boat (whole charter), as published in our current brochure, inclusive of 7% VAT.','Extra-guest charges apply above the base number of guests shown for each boat.']:['คำขอที่ส่งผ่านเว็บไซต์ยังไม่ถือเป็นการจอง การจองจะสมบูรณ์เมื่อทีมงานยืนยันคิวเรือเป็นลายลักษณ์อักษรและได้รับเงินมัดจำแล้ว','ราคาเป็นราคาเหมาลำตามโบรชัวร์ปัจจุบัน รวม VAT 7%','มีค่าใช้จ่ายเพิ่มเมื่อจำนวนผู้โดยสารเกินจำนวนพื้นฐานของเรือแต่ละลำ'])],
      ['payment', L('การชำระเงิน','Payment'), ul(LANG==='en'?['50% deposit on booking confirmation; the remaining 50% must be paid at least 24 hours before departure.','Card surcharge: 3.5% for Visa/MasterCard and 4.76% for AMEX and UnionPay, plus 7% VAT.','Bank transfers must include the booking reference.']:['ชำระมัดจำ 50% เมื่อยืนยันการจอง ส่วนที่เหลือ 50% ชำระก่อนออกเรืออย่างน้อย 24 ชั่วโมง','ค่าธรรมเนียมบัตรเครดิต 3.5% สำหรับ Visa/MasterCard และ 4.76% สำหรับ AMEX และ UnionPay บวก VAT 7%','การโอนเงินต้องระบุเลขอ้างอิงการจอง'])
        + `<dl class="legal-dl"><dt>${L('ธนาคาร','Bank')}</dt><dd>KASIKORN BANK · Lotus's Phuket</dd><dt>${L('เลขที่บัญชี','Account no.')}</dt><dd>213-1-65737-7</dd><dt>${L('ชื่อบัญชี','Account name')}</dt><dd>${COMPANY}</dd></dl>`],
      ['cancellation', L('การยกเลิก','Cancellation'), `<div class="legal-table"><table><thead><tr><th>${L('ยกเลิกก่อนออกเรือ','Cancelled before departure')}</th><th>${L('ค่ายกเลิก','Cancellation fee')}</th></tr></thead><tbody>
          <tr><td>${L('น้อยกว่า 48 ชั่วโมง','Less than 48 hours')}</td><td>30%</td></tr><tr><td>${L('น้อยกว่า 24 ชั่วโมง','Less than 24 hours')}</td><td>50%</td></tr><tr><td>${L('น้อยกว่า 12 ชั่วโมง หรือไม่มาตามนัด','Less than 12 hours or no-show')}</td><td>100%</td></tr></tbody></table></div>
          <p>${L('ค่ายกเลิกคิดจากราคาเช่าเรือทั้งหมด กรณีน้อยกว่า 12 ชั่วโมงหรือไม่มาตามนัด เงินมัดจำไม่สามารถขอคืนได้','Fees are a percentage of the total charter price. For cancellations under 12 hours or no-shows, deposits are non-refundable.')}</p>`],
      ['weather', L('สภาพอากาศและการเปลี่ยนโปรแกรม','Weather & itinerary changes'), `<p>${L('บริษัทและกัปตันสงวนสิทธิ์ในการเปลี่ยนแปลง ปรับ หรือยกเลิกเส้นทางโดยไม่ต้องแจ้งล่วงหน้า ตามสภาพอากาศ คลื่นลม หรือเหตุผลด้านความปลอดภัย โดยคำนึงถึงความปลอดภัยและประโยชน์สูงสุดของผู้โดยสารเสมอ หากต้องยกเลิกทริปเพราะสภาพอากาศ เราจะเสนอวันใหม่หรือเส้นทางทดแทนก่อน','We and the captain may change, adjust or cancel the itinerary without notice because of weather, sea conditions or safety, always putting passengers\' safety and interests first. If a trip has to be cancelled for weather, we will first offer a new date or an alternative route.')}</p>`],
      ['onboard', L('กฎบนเรือ','Rules on board'), ul(LANG==='en'?['Smoking is strictly prohibited on board.','Dogs and other pets are not allowed on board.','For safety, the company may decline service to pregnant guests.','Guests must follow the captain\'s and crew\'s safety instructions at all times, including wearing life jackets when asked.','The captain may refuse or end a trip if a guest\'s behaviour puts others at risk.']:['ห้ามสูบบุหรี่บนเรือทุกกรณี','ห้ามนำสุนัขหรือสัตว์เลี้ยงทุกชนิดขึ้นเรือ','เพื่อความปลอดภัย บริษัทอาจปฏิเสธการให้บริการแก่ผู้โดยสารที่ตั้งครรภ์','ผู้โดยสารต้องปฏิบัติตามคำแนะนำด้านความปลอดภัยของกัปตันและลูกเรือ รวมถึงสวมเสื้อชูชีพเมื่อได้รับแจ้ง','กัปตันอาจปฏิเสธหรือยุติทริปหากพฤติกรรมของผู้โดยสารเป็นอันตรายต่อผู้อื่น'])],
      ['extras', L('บริการเสริม','Extra services'), `<p>${L('บริการเสริม เช่น ลูกโป่ง ช่อดอกไม้ เค้ก ดีเจ บาร์เทนเดอร์ ชุดปิกนิก เครื่องดื่มแอลกอฮอล์ อาหารพิเศษ ไกด์ และรถตู้รับส่ง มีค่าใช้จ่ายเพิ่มเติม และต้องจองล่วงหน้าอย่างน้อย 24 ชั่วโมงก่อนออกเรือ','Extras such as balloons, flowers, cakes, DJs, bartenders, picnic sets, alcohol, custom meals, guides and van transfers cost extra and must be booked at least 24 hours before departure.')}</p>`],
      ['liability', L('ความรับผิดและประกันภัย','Liability & insurance'), `<p>${L('ทุกทริปมีประกันภัยผู้โดยสารตามเงื่อนไขของกรมธรรม์ บริษัทไม่รับผิดชอบต่อการสูญหายหรือเสียหายของทรัพย์สินส่วนตัว หรือค่าใช้จ่ายที่เกิดจากการมาสายของผู้โดยสาร ผู้โดยสารต้องรับผิดชอบความเสียหายต่อเรือหรืออุปกรณ์ที่เกิดจากความประมาทของตน','Every trip includes passenger insurance under the policy terms. We are not liable for loss of or damage to personal belongings, or for costs caused by guests arriving late. Guests are responsible for damage to the boat or equipment caused by their own negligence.')}</p>`],
      ['law', L('กฎหมายที่ใช้บังคับ','Governing law'), `<p>${L('ข้อกำหนดนี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย','These terms are governed by the laws of the Kingdom of Thailand.')}</p>`],
      ['contact', L('ติดต่อเรา','Contact'), `<p>${COMPANY} · TAT ${SET.tat} · <a href="${MAP_URL}" target="_blank" rel="noopener">${L(ADDRESS_TH, ADDRESS_EN)}</a> · <a href="${TEL}">${SET.phone}</a> · <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>`],
    ]},
  };
}
const COOKIE_CATS = () => [
  ['necessary', L('คุกกี้ที่จำเป็น','Strictly necessary'), L('ทำให้เว็บไซต์ทำงานได้ เช่น ความปลอดภัย การส่งฟอร์มจอง และการจำการตั้งค่าคุกกี้ของคุณ ปิดไม่ได้','Keep the site working — security, booking forms and remembering your cookie choices. Always on.'), true],
  ['functional', L('คุกกี้การใช้งาน','Functional'), L('จำภาษา สกุลเงิน รายการโปรด และเรือที่ดูล่าสุด เพื่อให้ใช้งานสะดวกขึ้น','Remember your language, currency, favourites and recently viewed boats.'), false],
  ['analytics', L('คุกกี้วิเคราะห์','Analytics'), L('ช่วยให้เรารู้ว่าหน้าไหนมีคนเข้าชมและปรับปรุงเว็บไซต์ (เช่น Google Analytics) ข้อมูลเป็นแบบรวม','Help us understand which pages are used so we can improve the site (e.g. Google Analytics). Aggregated data.'), false],
  ['marketing', L('คุกกี้การตลาด','Marketing'), L('ใช้แสดงโฆษณาที่เกี่ยวข้องบนแพลตฟอร์มอื่น (เช่น Meta, Google Ads) และวัดผลแคมเปญ','Used to show relevant ads on other platforms (e.g. Meta, Google Ads) and measure campaigns.'), false],
];
const cookiePrefs = () => store.get('cookies', null);
/* ---------- Meta Pixel + GA4 event layer (loads only after marketing/analytics consent) ---------- */
const PIXEL_ID = (window.__CFG__ || {}).pixel || ''; /* set in admin → วิเคราะห์เว็บไซต์ → Meta Pixel; empty in this mockup so nothing is sent */
function loadPixel() {
  if (!PIXEL_ID || window.fbq || !(cookiePrefs() || {}).marketing) return;
  !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PIXEL_ID); fbq('track', 'PageView');
}
/* every event goes to dataLayer (GA4/GTM) and to Meta with the same event_id, so the server-side Conversions API copy is de-duplicated */
function track(ev, p = {}, custom = false) {
  const event_id = ev + '.' + Date.now().toString(36) + '.' + Math.random().toString(36).slice(2, 7);
  (window.dataLayer = window.dataLayer || []).push({ event: ev, ...p, event_id, lang: LANG });
  if (window.fbq && (cookiePrefs() || {}).marketing) fbq(custom ? 'trackCustom' : 'track', ev, p, { eventID: event_id });
  return event_id;
}
document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a) return; const h = a.getAttribute('href');
  if (/^tel:/.test(h)) track('Contact', { method: 'phone' }); else if (/wa\.me|whatsapp/i.test(h)) track('Contact', { method: 'whatsapp' }); else if (/line\.me|lin\.ee/i.test(h)) track('Contact', { method: 'line' }); });
function saveCookies(p, msg) { store.set('cookies', { ...p, necessary: true, ts: Date.now() }); loadPixel(); $('#cookieBar')?.classList.add('hidden'); toast(msg || L('บันทึกการตั้งค่าคุกกี้แล้ว','Cookie preferences saved')); if (currentView === 'legal' && VH.hash === '#/cookies') renderLegal('cookies'); }
function acceptAllCookies() { saveCookies({ functional: true, analytics: true, marketing: true }); }
function rejectCookies() { saveCookies({ functional: false, analytics: false, marketing: false }); }
function saveCookieForm() { const p = {}; $$('#cookieForm input[data-cat]').forEach(i => p[i.dataset.cat] = i.checked); saveCookies(p); }
function renderCookieBar() {
  const el = $('#cookieBar'); if (!el) return;
  if (cookiePrefs() || VH.hash === '#/cookies') { el.classList.add('hidden'); return; }
  el.innerHTML = `<div class="bg-white rounded-[22px] ring-1 ring-black/5 shadow-[0_24px_60px_-20px_rgba(58,0,7,.35)] p-5">
    <p class="font-medium flex items-center gap-2"><i data-lucide="cookie" class="w-4 h-4 text-maroon"></i>${L('เว็บไซต์นี้ใช้คุกกี้','We use cookies')}</p>
    <p class="text-sm text-muted mt-2 leading-relaxed">${L('เราใช้คุกกี้เพื่อให้เว็บไซต์ทำงานได้ จำการตั้งค่าของคุณ และปรับปรุงประสบการณ์ใช้งาน อ่านเพิ่มเติมใน <a href="#/privacy" class="text-maroon underline underline-offset-2">นโยบายความเป็นส่วนตัว</a>','We use cookies to run the site, remember your settings and improve your experience. Read our <a href="#/privacy" class="text-maroon underline underline-offset-2">Privacy Policy</a>.')}</p>
    <div class="mt-4 flex flex-wrap gap-2">
      <button onclick="acceptAllCookies()" class="h-10 px-5 bg-maroon text-white text-sm hover:bg-maroon-800 transition">${L('ยอมรับทั้งหมด','Accept all')}</button>
      <button onclick="rejectCookies()" class="h-10 px-5 ring-1 ring-ink text-sm hover:bg-ink hover:text-white transition">${L('เฉพาะที่จำเป็น','Necessary only')}</button>
      <a href="#/cookies" class="h-10 px-4 inline-flex items-center text-sm text-maroon hover:underline underline-offset-4">${L('ตั้งค่า','Customise')}</a>
    </div></div>`;
  el.classList.remove('hidden'); icons();
}
function renderLegal(kind) {
  const v = $('#view-legal');
  const tabs = [['privacy', L('นโยบายความเป็นส่วนตัว','Privacy Policy')], ['terms', L('ข้อกำหนดและเงื่อนไข','Terms & Conditions')], ['cookies', L('การตั้งค่าคุกกี้','Cookie Preferences')]];
  let title, intro, body, toc = [];
  if (kind === 'cookies') {
    const p = cookiePrefs() || { functional: false, analytics: false, marketing: false };
    title = L('การตั้งค่าคุกกี้','Cookie Preferences');
    intro = L('คุกกี้คือไฟล์ข้อมูลขนาดเล็กที่เก็บในเบราว์เซอร์ของคุณ เลือกได้ว่าจะอนุญาตคุกกี้ประเภทใด การตั้งค่าจะมีผลกับเบราว์เซอร์นี้ และเปลี่ยนได้ทุกเมื่อในหน้านี้','Cookies are small files stored in your browser. Choose which types you allow — your choice applies to this browser and can be changed here at any time.');
    body = `<form id="cookieForm" onsubmit="event.preventDefault();saveCookieForm()" class="space-y-3">
      ${COOKIE_CATS().map(([k,h,d,locked])=>`<label class="flex items-start justify-between gap-4 bg-white ring-1 ring-sand-200 rounded-[18px] p-5 ${locked?'':'cursor-pointer hover:ring-line-strong'} transition">
        <span class="min-w-0"><span class="font-medium flex items-center gap-2">${h}${locked?`<span class="text-[10px] uppercase tracking-wider bg-maroon-50 text-maroon px-2 py-0.5 rounded-full">${L('เปิดตลอด','Always on')}</span>`:''}</span><span class="block text-sm text-muted mt-1 leading-relaxed">${d}</span></span>
        <span class="tgl shrink-0 mt-0.5"><input type="checkbox" data-cat="${k}" ${locked||p[k]?'checked':''} ${locked?'disabled':''} aria-label="${h}"/><span aria-hidden="true"></span></span>
      </label>`).join('')}
      <div class="flex flex-wrap gap-2 pt-3">
        <button type="submit" class="h-11 px-6 bg-maroon text-white text-sm hover:bg-maroon-800 transition">${L('บันทึกการตั้งค่า','Save preferences')}</button>
        <button type="button" onclick="acceptAllCookies()" class="h-11 px-6 ring-1 ring-ink text-sm hover:bg-ink hover:text-white transition">${L('ยอมรับทั้งหมด','Accept all')}</button>
        <button type="button" onclick="rejectCookies()" class="h-11 px-5 text-sm text-maroon hover:underline underline-offset-4">${L('เฉพาะที่จำเป็น','Necessary only')}</button>
      </div>
      <p class="text-xs text-muted" aria-live="polite">${cookiePrefs() ? L('บันทึกล่าสุด: ','Last saved: ') + new Date(cookiePrefs().ts).toLocaleString(LANG==='en'?'en-GB':'th-TH') : L('ยังไม่ได้บันทึกการตั้งค่า','No preferences saved yet')}</p>
    </form>
    <div class="legal mt-10"><h2>${L('รายละเอียดคุกกี้ที่เราใช้','Cookies we use')}</h2>
      <div class="legal-table"><table><thead><tr><th>${L('ชื่อ','Name')}</th><th>${L('ประเภท','Type')}</th><th>${L('ระยะเวลา','Duration')}</th></tr></thead><tbody>
        <tr><td>btt.cookies</td><td>${L('จำเป็น','Necessary')}</td><td>${L('12 เดือน','12 months')}</td></tr>
        <tr><td>btt.fav · btt.recent</td><td>${L('การใช้งาน','Functional')}</td><td>${L('12 เดือน','12 months')}</td></tr>
        <tr><td>_ga · _ga_*</td><td>${L('วิเคราะห์','Analytics')}</td><td>${L('สูงสุด 2 ปี','Up to 2 years')}</td></tr>
        <tr><td>_fbp · _gcl_au</td><td>${L('การตลาด','Marketing')}</td><td>${L('3 เดือน','3 months')}</td></tr>
      </tbody></table></div>
      <p>${L('คุณยังลบหรือบล็อกคุกกี้ได้จากการตั้งค่าเบราว์เซอร์ ดูวิธีการใช้ข้อมูลของเราได้ใน <a href="#/privacy">นโยบายความเป็นส่วนตัว</a>','You can also delete or block cookies in your browser settings. See how we use data in our <a href="#/privacy">Privacy Policy</a>.')}</p></div>`;
  } else {
    const d = legalDocs()[kind]; title = d.title; intro = d.intro; toc = d.secs.map(([id,h])=>[id,h]);
    body = `<div class="legal">${d.secs.map(([id,h,html],i)=>`<section id="lg-${id}" class="scroll-mt-28"><h2><span class="text-maroon tabular-nums mr-2">${String(i+1).padStart(2,'0')}</span>${h}</h2>${html}</section>`).join('')}</div>`;
  }
  v.innerHTML = `
  <section class="bg-sand border-b border-sand-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10">
      <nav aria-label="Breadcrumb" class="text-xs text-muted flex items-center gap-2"><a href="#/" class="hover:text-maroon">${t('home')}</a><i data-lucide="chevron-right" class="w-3 h-3"></i><span aria-current="page" class="text-ink">${title}</span></nav>
      <h1 class="font-display font-medium text-3xl sm:text-4xl mt-5">${title}</h1>
      <p class="text-muted mt-3 max-w-3xl leading-relaxed">${intro}</p>
      <p class="text-xs text-muted mt-4">${L('ปรับปรุงล่าสุด','Last updated')}: ${LEGAL_UPDATED[LANG==='en'?1:0]}</p>
      <div class="mt-6 flex gap-2 overflow-x-auto no-scrollbar py-1 px-1 -mx-1" role="tablist" aria-label="${L('เอกสาร','Documents')}">${tabs.map(([k,l])=>`<a href="#/${k}" role="tab" aria-selected="${k===kind}" class="shrink-0 h-10 px-4 inline-flex items-center text-sm transition ${k===kind?'bg-ink text-white':'bg-white ring-1 ring-sand-200 hover:ring-line-strong'}">${l}</a>`).join('')}</div>
    </div>
  </section>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14 grid ${toc.length?'lg:grid-cols-[240px_1fr]':''} gap-10">
    ${toc.length?`<aside class="hidden lg:block"><div class="sticky top-28"><p class="text-xs uppercase tracking-[.2em] text-muted mb-3">${L('สารบัญ','Contents')}</p><ol class="space-y-1 text-sm">${toc.map(([id,h],i)=>`<li><a href="#/${kind}" onclick="event.preventDefault();document.getElementById('lg-${id}').scrollIntoView({behavior:'smooth'})" class="flex gap-2 px-3 py-2 rounded-[12px] hover:bg-sand hover:text-maroon transition"><span class="text-muted tabular-nums">${String(i+1).padStart(2,'0')}</span>${h}</a></li>`).join('')}</ol></div></aside>`:''}
    <div class="min-w-0 max-w-3xl">${body}
      <div class="mt-12 rounded-[18px] bg-sand p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><p class="text-sm">${L('มีคำถามเกี่ยวกับเอกสารนี้?','Questions about this page?')} <span class="text-muted">${L('ติดต่อทีมงานได้ทุกวัน 09:00–21:00 น.','Our team is available daily 09:00–21:00.')}</span></p><a href="mailto:${CONTACT_EMAIL}" class="shrink-0 h-10 px-5 inline-flex items-center gap-2 bg-maroon text-white text-sm hover:bg-maroon-800 transition"><i data-lucide="mail" class="w-4 h-4"></i>${L('ส่งอีเมล','Email us')}</a></div>
    </div>
  </section>`;
  icons();
}

function renderDesign() {
  const v = $('#view-design');
  if (v.dataset.built) return;
  v.dataset.built = 1;
  const sw = (name, hex, use, ratio) => `<div class="border border-line">
      <div class="h-16" style="background:${hex}"></div>
      <div class="p-3"><p class="ds-k text-ink">${name}</p><p class="ds-k text-muted">${hex}</p><p class="text-xs text-muted mt-2">${use}</p>${ratio?`<p class="text-xs mt-2"><span class="inline-block px-2 bg-sand ds-k">${ratio}</span></p>`:''}</div></div>`;
  const sec = (id, n, title, body) => `<section id="ds-${id}" class="py-12 border-t border-line scroll-mt-24"><p class="text-xs text-muted uppercase tracking-[.2em]">${n}</p><h2 class="ds-h mt-2">${title}</h2><div class="mt-6">${body}</div></section>`;
  const tbl = (head, rows) => `<div class="overflow-x-auto border border-line"><table class="w-full text-sm min-w-[640px]"><thead class="bg-sand"><tr>${head.map(h=>`<th class="text-left font-medium px-4 py-3 border-b border-line">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr class="border-b border-line last:border-0 align-top">${r.map((c,i)=>`<td class="px-4 py-3 ${i?'text-muted':''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const states = (rows) => tbl(['State','Visual rule (tokens)','Behaviour'], rows);
  const modes = (k, p, tch) => `<div class="grid md:grid-cols-3 gap-4 mt-4">${[['Keyboard',k,'keyboard'],['Pointer',p,'mouse-pointer-2'],['Touch',tch,'hand']].map(([h,b,ic])=>`<div class="border border-line p-4"><p class="font-medium flex items-center gap-2"><i data-lucide="${ic}" class="w-4 h-4"></i>${h}</p><p class="text-sm text-muted mt-2">${b}</p></div>`).join('')}</div>`;
  const nav = [['intent','Context'],['tokens','Tokens'],['button','Button'],['link','Link'],['input','Input'],['card','Card'],['chip','Filter chip'],['nav','Navigation'],['modal','Modal'],['smart','Smart features'],['list','List'],['a11y','Accessibility'],['tone','Content & tone'],['anti','Anti-patterns'],['qa','QA checklist']];
  const btnBase = 'inline-flex items-center justify-center gap-2 h-11 px-6 text-xs uppercase tracking-[.08em] font-medium border';
  v.innerHTML = `
  <section class="bg-maroon-900 text-white on-dark">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-t7">
      <nav class="text-sm text-white/90 flex items-center gap-2"><a href="#/" class="hover:underline">Home</a><i data-lucide="chevron-right" class="w-4 h-4"></i><span>Design System</span></nav>
      <h1 class="font-display text-3xl sm:text-4xl mt-6">Design System</h1>
      <p class="text-white/90 mt-4 max-w-2xl">Token-driven UI guidance for the Boat Trip Thailand content site, built on Fraser-style foundations: structured, tokenized, content-first. Version 1.0 · WCAG 2.2 AA.</p>
    </div>
  </section>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-[200px_1fr] gap-12">
    <aside class="hidden lg:block"><nav class="sticky top-24 py-12 text-sm space-y-2" aria-label="Design system sections">${nav.map(([id,l])=>`<a href="#/design" data-ds="${id}" class="ds-link block text-muted hover:text-ink">${l}</a>`).join('')}</nav></aside>
    <div class="min-w-0">

    ${sec('intent','01','Context and goals',`
      <p class="text-md max-w-3xl"><b>Design intent:</b> a calm, editorial charter catalogue where photography and facts lead, and every interaction is predictable, keyboard-reachable and token-consistent.</p>
      <ul class="mt-4 space-y-2 text-sm text-muted list-disc pl-5 max-w-3xl">
        <li>Audience: readers and knowledge seekers comparing boats, routes and rates.</li>
        <li>Surface: content site (home, fleet index, 70 boat detail pages, booking request).</li>
        <li>Goals: consistency across 70+ generated pages, AA accessibility, fast delivery in Next.js.</li>
        <li>Known density per page: buttons 189 · links 152 · cards 12 · inputs 10 · navigation 2 · lists 2. Components with high counts (buttons, links) must have zero local overrides.</li>
      </ul>`)}

    ${sec('tokens','02','Design tokens and foundations',`
      <h3 class="font-medium text-lg">Colour</h3>
      <p class="text-sm text-muted mt-2">Components must reference semantic tokens, never raw hex. Ratios are against <span class="ds-k">#ffffff</span> unless stated.</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        ${sw('color.text.primary','#231416','Body, headings, prices (warm near-black)','17.75 : 1')}
        ${sw('color.text.secondary','#6b5e60','Meta, captions, helper text','6.19 : 1')}
        ${sw('color.text.tertiary','#5e5254','Disabled label text','7.47 : 1')}
        ${sw('color.text.inverse','#ffffff','Text on surface.base / action','12.39 : 1 on action')}
        ${sw('color.surface.base','#3a0007','Top bar, footer, image scrims','17.75 : 1 w/ inverse')}
        ${sw('color.surface.muted','rgb(0 0 0 / .15)','Overlays, pressed fills','')}
        ${sw('color.border.default','#e2d8d8','Dividers, card outlines (decorative)','1.40 : 1 — non-essential only')}
        ${sw('color.border.muted','#8a7a7c','Input boundaries, focusable outlines','4.07 : 1')}
        ${sw('color.brand.primary','#70000e','THE brand colour — CTAs, active states, icons, links hover, dark surfaces','12.39 : 1 w/ inverse')}
        ${sw('color.feedback.error','#b00020','Error text + invalid outline','7.33 : 1')}
        ${sw('color.focus','#70000e','Focus ring (inverse on dark)','12.39 : 1')}
        ${sw('color.surface.subtle','#f8f4f3','Table heads, fields, sections','text.secondary 5.66 : 1')}
      </div>
      <h3 class="font-medium text-lg mt-10">Typography</h3>
      <p class="text-sm text-muted mt-2"><span class="ds-k">font.family.stack = Futura, Jost, "IBM Plex Sans Thai", Verdana, sans-serif</span> · base 13px / 19px / 400. Jost is the licensed-free Futura fallback; Thai glyphs fall through to IBM Plex Sans Thai.</p>
      <div class="mt-4 border border-line divide-y divide-line">
        ${[['font.size.4xl','30px','text-4xl','Page title (H1)'],['font.size.3xl','26px','text-3xl','Hero / H1 mobile'],['font.size.2xl','20px','text-2xl','Section title (H2)'],['font.size.xl','17px','text-xl','Card title'],['font.size.lg','16px','text-lg','H3, prices'],['font.size.md','14px','text-md','Lead paragraph'],['font.size.sm','13px','text-sm','Body (base)'],['font.size.xs','11px','text-xs','Meta, labels, buttons']].map(([k,px,c,u])=>`<div class="grid grid-cols-[104px_40px_minmax(0,1fr)] sm:grid-cols-[180px_70px_minmax(0,1fr)_200px] gap-4 items-baseline px-4 py-3"><span class="ds-k">${k}</span><span class="ds-k text-muted">${px}</span><span class="${c} truncate ${/4xl|3xl|2xl/.test(c)?'font-display':''}">Phang Nga Bay ล่องเรือ</span><span class="hidden sm:block text-xs text-muted">${u}</span></div>`).join('')}
      </div>
      <p class="text-sm text-muted mt-3">Display styles (H1–H2, card titles, prices) must be uppercase with 0.10–0.12em tracking at weight 400 (Thai: 0.02em). Sizes outside this scale must not be introduced.</p>
      <h3 class="font-medium text-lg mt-10">Spacing</h3>
      <div class="mt-4 space-y-2">${[['space.1','8px','t1','Minimum gap · icon ↔ label · chip gaps'],['space.2','12px','t2','Field padding, list rows'],['space.3','16px','t3','Card padding (mobile), gutters'],['space.4','24px','t4','Card padding, grid gaps'],['space.5','48px','t5','Section rhythm (<1024px)'],['space.6','120px','t6','Section rhythm (≥1024px)']].map(([k,px,c,u])=>`<div class="grid grid-cols-[72px_44px_minmax(0,1fr)] sm:grid-cols-[110px_70px_minmax(0,1fr)_220px] gap-4 items-center"><span class="ds-k">${k}</span><span class="ds-k text-muted">${px}</span><span class="block h-3 bg-maroon" style="width:${px};max-width:100%"></span><span class="hidden sm:block text-xs text-muted">${u}</span></div>`).join('')}</div>
      <p class="text-sm text-muted mt-3">Nothing smaller than space.1 (8px) may be used for spacing; 2px/4px/6px gaps are prohibited.</p>
      <h3 class="font-medium text-lg mt-10">Radius, elevation, motion</h3>
      ${tbl(['Token','Value','Rule'],[['radius','pill · 12 · 18 · 22px','Buttons, chips, steppers and small CTAs are pills; inputs and panels 12px; cards and media 18px; overlays 22px; avatars circle. Navbar (14px) and boat gallery (24px) are signature exceptions.'],['shadow.card','none','Cards separate with color.border.default, not shadow.'],['shadow.overlay','0 16px 40px -20px rgb(4 15 41 / .35)','Modal and lightbox only.'],['motion.duration.instant','200ms','Hover, focus, colour and border transitions.'],['motion.duration.fast','300ms','Modal/route enter, image zoom. Must be disabled under prefers-reduced-motion.']])}`)}

    ${sec('button','03','Button',`
      <p class="text-sm text-muted">Anatomy: container (44px min height) · optional leading icon (16px, gap space.2) · label (font.size.xs, uppercase, 0.12em, weight 500) · optional spinner (loading).</p>
      <div class="flex flex-wrap gap-4 mt-6 items-center">
        <button class="${btnBase} bg-maroon border-maroon text-white hover:bg-maroon-800">Book this boat</button>
        <button class="${btnBase} bg-white border-maroon text-ink hover:bg-maroon hover:text-white">View details</button>
        <button class="${btnBase} border-transparent text-ink underline underline-offset-4 hover:no-underline">View all boats</button>
        <button class="${btnBase} bg-white border-white text-ink" style="outline:1px solid #e2d8d8">On-image (inverse)</button>
      </div>
      <p class="text-xs text-muted mt-2">Variants: primary (action) · secondary (outline) · tertiary (text) · inverse (on imagery). One primary per view region.</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
        ${[['Default',`${btnBase} bg-maroon border-maroon text-white`,'Book'],['Hover',`${btnBase} bg-maroon-800 border-maroon-800 text-white`,'Book'],['Focus-visible',`${btnBase} bg-maroon border-maroon text-white`,'Book','outline:2px solid #70000e;outline-offset:2px'],['Active',`${btnBase} bg-maroon-800 border-maroon-800 text-white`,'Book','transform:translateY(1px)'],['Disabled',`${btnBase} border`,'Book','',true],['Loading',`${btnBase} bg-maroon border-maroon text-white`,'<span class="spinner"></span>Sending…'],['Error',`${btnBase} bg-white text-[color:var(--color-feedback-error)] border-[color:var(--color-feedback-error)]`,'Retry']].map(([l,c,txt,st,dis])=>`<div><button tabindex="-1" class="${c} w-full" style="${st||''}" ${dis?'disabled':''} ${l==='Loading'?'aria-busy="true"':''}>${txt}</button><p class="text-xs text-muted mt-2 text-center">${l}</p></div>`).join('')}
      </div>
      <div class="mt-6">${states([
        ['Default','bg color.action.primary · text color.text.inverse','—'],
        ['Hover','bg darkens one step (maroon-800) in motion.duration.instant','Pointer only; never the sole affordance'],
        ['Focus-visible','2px color.focus outline, 2px offset (inverse on dark surfaces)','Must appear on keyboard focus, never on mouse click'],
        ['Active','bg maroon-800 + 1px press offset','Fires on pointerup / Enter / Space'],
        ['Disabled','bg color.border.default · text color.text.tertiary','Native <code>disabled</code>; removed from tab order; tooltip explains why if not obvious'],
        ['Loading','spinner + verb label ("Sending…"), width locked','<code>aria-busy="true"</code> + disabled; prevents double submit'],
        ['Error','outline + text color.feedback.error, label becomes "Retry"','Paired with an inline role="alert" message']])}</div>
      ${modes('Tab to focus; Enter and Space activate. Focus order follows DOM order.','Cursor pointer; hover feedback within 200ms.','Hit area ≥ 44 × 44px; no hover-dependent content; activation on tap release.')}
      <p class="text-sm text-muted mt-4"><b>Responsive & edge cases:</b> labels must not truncate — wrap to two lines max, then shorten copy. In card footers buttons share a row ≥ 360px and stack full-width below. Icon-only buttons must carry <code>aria-label</code>.</p>`)}

    ${sec('link','04','Link',`
      <p class="text-sm">Inline: <a href="#/design" class="underline underline-offset-4 hover:no-underline">cancellation policy</a> · Navigation: <a href="#/design" class="hover:underline underline-offset-4">All boats</a> · Breadcrumb: <span class="text-muted">Home › All boats › </span>Leopard 90 ft</p>
      <div class="mt-4">${states([
        ['Default','color.text.primary; inline links underlined (1px, 4px offset)','—'],
        ['Hover','underline toggles (inline removes, nav adds)','—'],
        ['Focus-visible','2px color.focus outline','Required on every link incl. card-image links'],
        ['Active','color.text.secondary','—'],
        ['Disabled','Not allowed — render plain text instead','—'],
        ['Loading','Route links show page-level progress, not per-link spinners','—'],
        ['Error','Broken targets must fail QA (no #, no javascript:)','—']])}</div>
      ${modes('Tab / Shift+Tab; Enter follows. Skip-to-content link first in DOM.','Underline is the affordance — colour alone must not signal a link.','Adjacent links need ≥ 8px (space.3) separation.')}
      <p class="text-sm text-muted mt-4"><b>Edge cases:</b> link text must describe the destination ("View Leopard 90 ft rates", not "Click here"). Long boat names truncate with ellipsis only inside cards, never in body copy.</p>`)}

    ${sec('input','05','Input, select, textarea',`
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${[['Default',''],['Focus-visible','outline:2px solid #70000e;outline-offset:2px'],['Disabled','', 'disabled'],['Error','', 'error']].map(([l,st,k])=>`<label class="block"><span class="text-xs font-medium">Full name ${l==='Error'?'<span class="field-error">*</span>':''}</span>
          <input ${k==='disabled'?'disabled':''} ${k==='error'?'aria-invalid="true"':''} tabindex="-1" value="${l==='Default'?'':'Somchai J.'}" placeholder="e.g. Somchai Jaidee" class="mt-2 w-full px-4 h-11 text-sm bg-white ring-1 ring-line-strong ${k==='disabled'?'bg-sand text-tertiary cursor-not-allowed':''}" style="${st}" />
          <span class="text-xs mt-2 block ${k==='error'?'field-error':'text-muted'}">${k==='error'?'Enter your full name.':l}</span></label>`).join('')}
      </div>
      <div class="mt-6">${states([
        ['Default','bg white · 1px color.border.muted boundary (4.07:1) · 44px height · padding space.4/space.5','Label always visible above field'],
        ['Hover','boundary → color.text.primary','—'],
        ['Focus-visible','2px color.focus ring','Placeholder never replaces the label'],
        ['Active / filled','value color.text.primary','—'],
        ['Disabled','bg surface.subtle · text color.text.tertiary','Native disabled; excluded from submit'],
        ['Loading','Async selects show "Loading…" option and aria-busy on the field','—'],
        ['Error','2px inset color.feedback.error + helper text','<code>aria-invalid="true"</code>, <code>aria-describedby</code> to message; focus moves to first invalid field on submit']])}</div>
      ${modes('Tab between fields; native date & select keyboard behaviour preserved; Enter submits.','Whole label is clickable.','Correct <code>inputmode</code>/<code>type</code> (tel, date, number); iOS zooms inputs below 16px — mobile inputs should set 16px via the input-only exception <code>font-size:16px</code> (documented, not a new token).')}
      <p class="text-sm text-muted mt-4"><b>Edge cases:</b> guests field clamps to 1…boat capacity and warns when exceeded; long program names wrap inside selects on mobile via native picker.</p>`)}

    ${sec('card','06','Card (boat)',`
      <div class="grid grid-cols-1 md:grid-cols-[minmax(0,360px)_1fr] gap-6 items-start">
        <div class="min-w-0">${boatCard(bySlug('leopard-90-ft'))}</div>
        <div class="min-w-0">
          <p class="text-sm"><b>Anatomy:</b> media 16:10 (link) — photos must render clean, with no colour overlay, badge or text on top · eyebrow (type, color.brand.primary) · title (font.size.xl, uppercase) · subtitle · meta row (capacity, marina) · up to 3 tags · price (“From”) · actions (secondary + primary).</p>
          <div class="mt-4">${states([
            ['Default','1px color.border.default outline, no shadow','—'],
            ['Hover','media scales 1.05 over motion.duration.fast; outline unchanged','Pointer only'],
            ['Focus-visible','Ring on the focused child (image link or button), not the card','Card itself is not focusable'],
            ['Active','Child control active state','—'],
            ['Disabled','Unavailable boats show "Not available" badge; primary action disabled','—'],
            ['Loading','Skeleton: media block + 3 text bars in surface.subtle','Reserve final height to avoid CLS'],
            ['Error','Image fails → surface.base block with boat name; data missing → "—" price and "Ask for rate" action','—']])}</div>
          <p class="text-sm text-muted mt-4"><b>Long content:</b> title and marina truncate to one line with ellipsis + full text in <code>title</code>; tags capped at 3. <b>Empty state:</b> fleet filters with zero results show a sentence and a "Clear filters" action. Grid: 1 col &lt;640px · 2 col ≥640px · 3 col ≥1024px, gap space.6.</p>
        </div>
      </div>`)}

    ${sec('chip','07','Filter chip / segmented control',`
      <div class="flex flex-wrap gap-2"><button tabindex="-1" class="px-4 h-9 text-sm border border-line chip-active">All</button><button tabindex="-1" class="px-4 h-9 text-sm border border-line">Motor Yacht</button><button tabindex="-1" class="px-4 h-9 text-sm border border-line" style="outline:2px solid #70000e;outline-offset:2px">Sailing Catamaran</button><button tabindex="-1" disabled class="px-4 h-9 text-sm border">Overnight (0)</button></div>
      <div class="mt-6">${states([['Default','border color.border.default · text primary','<code>aria-pressed="false"</code>'],['Hover','border color.border.muted','—'],['Focus-visible','2px focus ring','—'],['Active / selected','bg color.text.primary · text inverse','<code>aria-pressed="true"</code>; exactly one selected in a single-select group'],['Disabled','Zero-result options disabled with count "(0)"','—'],['Loading','Result count replaced by spinner; chips stay interactive','—'],['Error','If filtering fails, keep previous results + inline alert','—']])}</div>
      ${modes('Tab into group; each chip is a button; Enter/Space toggles.','—','Horizontal scroll with momentum; first/last chip fully reachable; no scrollbar hiding of focus.')}`)}

    ${sec('nav','08','Navigation (header, mobile menu, breadcrumb)',`
      <ul class="text-sm space-y-2 list-disc pl-5">
        <li>Header must be sticky at 72px, white surface, 1px color.border.default bottom border; links font.size.sm.</li>
        <li>Language switch is a two-option group with <code>aria-pressed</code>; label "TH" / "EN" plus <code>lang</code> on the document must update.</li>
        <li>Mobile menu: toggle button has <code>aria-expanded</code> and <code>aria-controls</code>; Escape closes and returns focus to the toggle.</li>
        <li>Breadcrumb uses <code>&lt;nav aria-label="Breadcrumb"&gt;</code>, the current page is plain text with <code>aria-current="page"</code>.</li>
        <li>Active route should be indicated by a 2px underline (color.text.primary), not colour alone.</li>
      </ul>
      ${modes('Skip link → main; Tab through items; Escape closes mobile menu.','Hover underline.','Menu items ≥ 48px rows; tapping a link closes the menu.')}`)}

    ${sec('modal','09','Modal (booking) & lightbox',`
      <ul class="text-sm space-y-2 list-disc pl-5">
        <li>Must use <code>role="dialog"</code>, <code>aria-modal="true"</code> and an accessible name (title id).</li>
        <li>Focus moves to the first field on open, is trapped inside, and returns to the invoking control on close.</li>
        <li>Close via Escape, the close button (aria-label "Close") and backdrop click; body scroll locks.</li>
        <li>Mobile (&lt;640px): bottom sheet, full width; content scrolls inside, header stays visible.</li>
        <li>Lightbox: ← / → change image, counter announced via <code>aria-live="polite"</code>.</li>
        <li>States — loading: submit shows spinner + "Sending…"; error: role="alert" summary + field-level messages; success: modal closes and toast confirms.</li>
      </ul>`)}

    ${sec('smart','09b','Smart features',tbl(['Feature','Behaviour rules','Accessibility / edge cases'],[
      ['Smart Match','4-step recommender (group → style → budget & place → results). Rule-based scoring on real fleet data; every pick must show ≥2 human-readable reasons and a match %. Must never claim to be AI.','Dialog pattern; progress is an ordered list; results region <code>aria-live="polite"</code>; empty result offers how to relax filters.'],
      ['Season-aware pricing','Date → Andaman season (Low May–Oct · High Nov–Apr · Peak 20 Dec–10 Jan). Matching price column highlights in every table; sidebar shows an estimate incl. extra-guest surcharge parsed from brochure notes.','Highlight uses tint + 2px rule, never colour alone; estimate labelled "Estimate"; falls back to All-year column.'],
      ['Compare','Toggle on any card, max 3; tray slides up from bottom; table marks most length/capacity and best value.','Toggle buttons expose <code>aria-pressed</code>; 4th add shows a toast, not a silent fail; tray hidden from AT when empty.'],
      ['Favourites & recently viewed','Stored per device in localStorage (try/catch); header count; <code>#/fleet?fav</code> filter; recent strip on home (max 8, clearable).','Works with storage disabled (session-only).'],
      ['Command palette','⌘K / Ctrl K / "/" opens; searches boats, islands, marinas and pages.','<code>role="combobox"</code> + listbox, ↑↓/Enter/Esc; focus returns on close.'],
      ['Motion','Hero crossfade (6s), word reveal, scroll reveal, count-up stats, route progress bar, View Transitions on route change.','All motion disabled under prefers-reduced-motion (reveal content shows immediately).']]))}

    ${sec('list','10','List (includes / not included / specs)',`
      <ul class="text-sm space-y-2 list-disc pl-5">
        <li>Use semantic <code>&lt;ul&gt;</code> / <code>&lt;dl&gt;</code>; icons are decorative (<code>aria-hidden</code>) — the heading conveys include vs exclude.</li>
        <li>Rows separate with space.4; spec rows use a 1px dashed color.border.default divider.</li>
        <li>Long lists (&gt; 12 items) should collapse after 8 with a "Show all (n)" button carrying <code>aria-expanded</code>.</li>
        <li>Empty: the whole block must be omitted — never render an empty heading.</li>
      </ul>`)}

    ${sec('a11y','11','Accessibility acceptance criteria (WCAG 2.2 AA)',tbl(['#','Criterion','Pass / fail test'],[
      ['A1','Text contrast ≥ 4.5:1 (≥ 3:1 for ≥ 24px or 19px bold)','Automated axe run reports 0 contrast violations; tokens table ratios hold'],
      ['A2','Non-text contrast ≥ 3:1 for input boundaries, focus rings, icons that convey meaning','Inputs use color.border.muted (4.07:1); fail if any field uses border.default'],
      ['A3','Focus visible on every interactive element (2.4.7) and not obscured by sticky header (2.4.11)','Tab through each page: every stop shows a ring fully in view'],
      ['A4','Keyboard operable, no traps (2.1.1, 2.1.2)','Complete booking flow with keyboard only; Escape exits modal/lightbox'],
      ['A5','Target size ≥ 24 × 24px (2.5.8); primary targets 44px','Measure in devtools; fail if any target < 24px without spacing'],
      ['A6','Errors identified in text and linked to fields (3.3.1, 3.3.3)','Submit empty form: alert announced, first invalid field focused, aria-invalid set'],
      ['A7','Language of page and parts (3.1.1, 3.1.2)','<code>html[lang]</code> switches th/en with the toggle'],
      ['A8','Images have alt; decorative images empty alt','Boat media alt = boat name + view; scrims alt=""'],
      ['A9','Reduced motion respected (2.3.3)','With prefers-reduced-motion, marquee and zoom are disabled'],
      ['A10','Reflow at 320px without horizontal scroll (1.4.10)','scrollWidth ≤ viewport at 320px on home, fleet, detail'],
      ['A11','Consistent help & redundant entry (3.2.6, 3.3.7)','Contact options sit in the same place on every page; booking pre-fills boat, program, date, guests']]))}

    ${sec('tone','12','Content and tone',`
      <p class="text-sm">Concise, confident, factual. Lead with the boat, the route or the price. Numbers come from the brochure and keep their units.</p>
      <div class="grid md:grid-cols-2 gap-4 mt-4">
        <div class="border border-line p-4"><p class="font-medium flex items-center gap-2"><i data-lucide="check" class="w-4 h-4"></i>Do</p><ul class="text-sm text-muted mt-2 space-y-2 list-disc pl-5"><li>"Book this boat" · "View Leopard 90 ft rates"</li><li>"From ฿102,000 per trip, incl. 7% VAT"</li><li>"Enter your phone number or LINE ID."</li><li>"This boat takes up to 18 guests."</li></ul></div>
        <div class="border border-line p-4"><p class="font-medium flex items-center gap-2"><i data-lucide="x" class="w-4 h-4"></i>Don't</p><ul class="text-sm text-muted mt-2 space-y-2 list-disc pl-5"><li>"Click here" · "Submit" · "More"</li><li>"Amazing deal!!!" · unverified superlatives</li><li>"Invalid input"</li><li>"Oops, something went wrong :("</li></ul></div>
      </div>`)}

    ${sec('anti','13','Anti-patterns and prohibited implementations',`
      <ul class="text-sm space-y-2 list-disc pl-5">
        <li>Raw hex or arbitrary values (<code>text-sm</code>, <code>p-[18px]</code>) in components must not ship; add a token or use an existing one.</li>
        <li>Colours outside the maroon family must not be used — no navy, teal, yellow or brand-green (LINE/WhatsApp buttons use color.brand.primary). Neutrals must stay warm-tinted.</li>
        <li>Square corners are not used: controls are pills, surfaces 12px, cards 18px; shadows are reserved for floating layers (navbar, menus, modals).</li>
        <li>Colour overlays, gradients or text placed on boat photography are prohibited — photos must show true colour; text sits beside or below the image.</li>
        <li><code>outline: none</code> without a replacement focus style is prohibited.</li>
        <li>Opacity-based grey text (e.g. 50% ink) must not be used — use color.text.secondary.</li>
        <li>Hover-only disclosure of prices, actions or info is prohibited.</li>
        <li>Placeholder-as-label, colour-only status, and icon-only buttons without names are prohibited.</li>
      </ul>
      <p class="text-sm text-muted mt-4"><b>Migration notes (v1 → v2):</b> teal/yellow accents mapped to neutral tokens; radius → 0; shadows → borders; serif & script faces removed; v2.3: radius.xs 4px on all components, spacing minimum 8px, redesigned command palette; v2.2: type scale reduced (11–30px, base 13px), weights ≤ 500, header 60px; v2.1: maroon #70000e promoted to primary — navy and greens removed, neutrals warmed; opacity greys → color.text.secondary; section padding → space.7 (desktop) / 48px (mobile); off-scale spacing (4/10/14/20/28/32/40px) snapped to the nearest token.</p>`)}

    ${sec('qa','14','QA checklist',`
      <div class="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm" id="qaList">${[
        'Only semantic tokens used; no raw hex in components','Type sizes limited to font.size.xs–4xl (11–30px)','Spacing limited to space.1–6 (8–120px)','All 7 states implemented for every interactive component','Focus ring visible on every stop, incl. dark surfaces','Keyboard-only booking flow passes','Touch targets ≥ 44px for primary actions','Inputs show visible labels and error messages','Empty states for fleet filters and missing data','Long names truncate with full text available','No horizontal scroll at 320px','Reduced-motion disables marquee & zoom','axe: 0 violations on home, fleet, detail, design','TH/EN toggle updates html[lang] and all labels','Brochure prices match source tables','Images: alt text present, fallbacks render'
      ].map((q,i)=>`<label class="flex items-start gap-3 py-2 border-b border-line"><input type="checkbox" class="mt-0 accent-maroon w-4 h-4" /><span>${q}</span></label>`).join('')}</div>
      <p id="qaCount" class="text-xs text-muted mt-4" aria-live="polite">0 / 16 checked</p>`)}
    </div>
  </div>`;
  $$('.ds-link', v).forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById('ds-' + a.dataset.ds).scrollIntoView({behavior:'smooth'}); });
  $$('#qaList input', v).forEach(c => c.onchange = () => { $('#qaCount').textContent = `${$$('#qaList input:checked').length} / 16 checked`; });
  icons();
}

/* =========================================================
   SMART FEATURES
   ========================================================= */
const L = (th, en) => LANG === 'en' ? en : th;
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('btt.' + k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('btt.' + k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- Season engine (Andaman calendar) ---------- */
function seasonOf(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const m = d.getMonth() + 1, day = d.getDate();
  if ((m === 12 && day >= 20) || (m === 1 && day <= 10)) return 'peak';
  if (m >= 11 || m <= 4) return 'high';
  return 'low';
}
const SEASON_META = {
  low:  { th:'Low Season', en:'Low Season', noteTh:'ราคาดีที่สุด · มีคลื่นบางวัน', noteEn:'Best rates · some swell days' },
  high: { th:'High Season', en:'High Season', noteTh:'ทะเลสงบ ฟ้าใส · ควรจองล่วงหน้า', noteEn:'Calm, clear seas · book ahead' },
  peak: { th:'Peak Season', en:'Peak Season', noteTh:'ช่วงปีใหม่ · คิวเต็มเร็ว', noteEn:'New Year · sells out fast' },
};
function seasonColumn(cols, season) {
  const lc = cols.map(c => (c || '').toLowerCase());
  let i = lc.findIndex((c, k) => k > 0 && c.includes(season));
  if (i < 0 && season === 'peak') i = lc.findIndex((c, k) => k > 0 && c.includes('high'));
  if (i < 0) i = lc.findIndex((c, k) => k > 0 && /all year|price|rate/.test(c));
  return i;
}
/* a price cell starts with the amount ("24,500 THB"); text that merely mentions one ("1-7pax; Extra charge …/1000 THB") is not a price */
const priceNum = v => { const m = (v || '').replace(/\s/g, '').match(/^([\d,]{4,})T?HB/i); return m ? +m[1].replace(/,/g, '') : null; };
/* holiday surcharge per price cell (same rules as src/lib/season.ts): the column header decides half / full day,
   else the program name, else the table caption; calendars may set a lower `addHalf` for half-day programs */
const isHalfDay = (tb, ci, r) => { const h = tb.columns[ci] || ''; if (/half/i.test(h)) return true; if (/full/i.test(h)) return false; return /half/i.test((r && r[0]) || '') || /half/i.test(tb.caption || ''); };
const szAdd = (v, tb, ci, r) => !v || !v.add ? 0 : v.addHalf && isHalfDay(tb, ci, r) ? v.addHalf : v.add;
const hasHalfDay = b => b.tables.some(tb => tb.columns.some((_, ci) => ci > 0 && tb.rows.some(r => priceNum(r[ci]) && isHalfDay(tb, ci, r))));
/* "+ ฿7,000" or "+ ฿4,000 (Half day) / ฿7,000 (Full day)" for one calendar on one boat */
const addText = (b, cal) => cal.addHalf && cal.addHalf !== cal.add && hasHalfDay(b) ? `+ ${baht(cal.addHalf)} (Half day) / ${baht(cal.add)} (Full day)` : `+ ${baht(cal.add)}`;
/* ---------- Season calendars (set in admin → ฤดูกาลราคา) ---------- */
const SZ = window.SEASONS;
const SKEY = { low: { th: 'Low Season', en: 'Low Season' }, high: { th: 'High Season', en: 'High Season' }, peak: { th: 'Peak Season', en: 'Peak Season' }, special: { th: 'ช่วงพิเศษ', en: 'Special dates' }, all: { th: 'ราคาทั้งปี', en: 'All year' } };
const SORDER = ['low', 'high', 'peak', 'special', 'all'];
const SCOL = { low: '#e3c3c7', high: '#a33a47', peak: '#3a0007', special: '#c98a1d', all: '#d9cfcf', gap: '#ffffff' };
const M_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'], M_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const isoOf = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const todayISO = () => isoOf(new Date());

/* ---------- date picker: a calendar in the page language and site style (the browser's own follows the OS) ----------
   datePick(input) turns the original <input type=date> into a hidden field that keeps its id, name and ISO value,
   so code that reads .value, sets .min, listens for change or submits the form works unchanged.
   A text field in front shows the date (พ.ศ. in Thai) and opens the calendar. */
function dpAll() { return dpAll.s || (dpAll.s = new Set()); }
function dpText(iso) {
  const d = iso ? new Date(iso + 'T00:00:00') : null; if (!d || isNaN(d)) return iso || '';
  return LANG === 'en' ? `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]} ${d.getDate()} ${M_EN[d.getMonth()]} ${d.getFullYear()}`
    : `${['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][d.getDay()]} ${d.getDate()} ${M_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function dpSync(inp) {
  const v = inp._dpVis; if (!v) return;
  v.value = dpText(inp.value); v.placeholder = L('เลือกวันที่', 'Select date');
  if (inp.value && v.getAttribute('aria-invalid') === 'true') v.setAttribute('aria-invalid', 'false');
}
function dpSet(inp, iso, silent) {
  inp.value = iso;
  if (!silent) ['input', 'change'].forEach(t => inp.dispatchEvent(new Event(t, { bubbles: true })));
}
function datePick(inp) {
  if (!inp || inp._dpVis || navigator.userAgent === 'BTT-SSR') return;
  const vis = document.createElement('input');
  vis.type = 'text'; vis.className = inp.className + ' dp-vis'; vis.autocomplete = 'off'; vis.setAttribute('inputmode', 'none');
  vis.setAttribute('aria-haspopup', 'dialog'); vis.setAttribute('aria-expanded', 'false');
  vis.required = inp.required; inp.required = false; // hidden inputs are never validated
  inp.type = 'hidden'; inp.after(vis); inp._dpVis = vis;
  const nat = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  Object.defineProperty(inp, 'value', { configurable: true, get() { return nat.get.call(this); }, set(v) { nat.set.call(this, v); dpSync(this); } });
  vis.addEventListener('click', () => dpOpen(inp));
  vis.addEventListener('beforeinput', e => e.preventDefault());
  vis.addEventListener('keydown', e => {
    if (e.key === 'Tab') return; e.preventDefault();
    if (['Enter', ' ', 'ArrowDown'].includes(e.key)) dpOpen(inp);
    else if ((e.key === 'Backspace' || e.key === 'Delete') && !vis.required) dpSet(inp, '');
  });
  inp.form?.addEventListener('reset', () => setTimeout(() => dpSet(inp, '', true)));
  dpAll().forEach(i => i.isConnected || dpAll().delete(i)); dpAll().add(inp); dpSync(inp);
}
function dpRelabel() { dpClose(); dpAll().forEach(dpSync); }

let DP = null; // the open calendar: { inp, pop, y, m, f } — f = the day that has keyboard focus
function dpOpen(inp) {
  if (DP && DP.inp === inp) return dpClose(true);
  dpClose();
  const t0 = todayISO(), start = inp.value || (inp.min > t0 ? inp.min : t0), d = new Date(start + 'T00:00:00');
  const pop = document.createElement('div');
  pop.className = 'dp-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', L('เลือกวันที่', 'Choose a date'));
  document.body.appendChild(pop);
  DP = { inp, pop, y: d.getFullYear(), m: d.getMonth(), f: start };
  pop.addEventListener('click', dpClick); pop.addEventListener('keydown', dpKey);
  pop.addEventListener('focusout', e => { const to = e.relatedTarget; if (DP && to && !pop.contains(to) && to !== inp._dpVis) dpClose(); });
  inp._dpVis.setAttribute('aria-expanded', 'true');
  dpDraw(); dpPlace(); dpFocus();
  document.addEventListener('pointerdown', dpOutside, true); addEventListener('scroll', dpPlace, true); addEventListener('resize', dpPlace);
}
function dpClose(refocus) {
  if (!DP) return; const { inp, pop } = DP; DP = null;
  pop.remove(); inp._dpVis?.setAttribute('aria-expanded', 'false');
  document.removeEventListener('pointerdown', dpOutside, true); removeEventListener('scroll', dpPlace, true); removeEventListener('resize', dpPlace);
  if (refocus) inp._dpVis?.focus({ preventScroll: true });
}
function dpOutside(e) { if (DP && !DP.pop.contains(e.target) && e.target !== DP.inp._dpVis) dpClose(); }
function dpPlace() {
  if (!DP) return; const r = DP.inp._dpVis.getBoundingClientRect(), p = DP.pop;
  if (!r.width) return dpClose();
  p.style.width = Math.min(Math.max(r.width, 300), 360, innerWidth - 16) + 'px'; // as wide as its field, within reason
  let top = r.bottom + 8; if (top + p.offsetHeight > innerHeight - 8 && r.top - 8 - p.offsetHeight > 8) top = r.top - 8 - p.offsetHeight;
  p.style.top = top + 'px'; p.style.left = Math.max(8, Math.min(r.left, innerWidth - p.offsetWidth - 8)) + 'px';
}
function dpFocus() { DP?.pop.querySelector(`.dp-d[data-d="${DP.f}"]`)?.focus({ preventScroll: true }); }
function dpDraw() {
  const { inp, pop, y, m, f } = DP, en = LANG === 'en', min = inp.min || '', sel = inp.value, t0 = todayISO();
  const mon = en ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const wd = en ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] : ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const chev = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const prevOk = !min || isoOf(new Date(y, m, 0)) >= min;
  let cells = '<span></span>'.repeat(new Date(y, m, 1).getDay());
  for (let d = 1, n = new Date(y, m + 1, 0).getDate(); d <= n; d++) {
    const iso = isoOf(new Date(y, m, d));
    cells += `<button type="button" class="dp-d${iso === t0 ? ' is-today' : ''}" data-d="${iso}" tabindex="${iso === f ? 0 : -1}" aria-label="${dpText(iso)}"${iso === sel ? ' aria-pressed="true"' : ''}${min && iso < min ? ' disabled' : ''}>${d}</button>`;
  }
  pop.innerHTML = `<div class="dp-head"><b aria-live="polite">${mon[m]} ${en ? y : y + 543}</b>
      <span class="dp-nav"><button type="button" data-m="-1" aria-label="${L('เดือนก่อน', 'Previous month')}"${prevOk ? '' : ' disabled'}>${chev('m15 18-6-6 6-6')}</button><button type="button" data-m="1" aria-label="${L('เดือนถัดไป', 'Next month')}">${chev('m9 18 6-6-6-6')}</button></span></div>
    <div class="dp-wd" aria-hidden="true">${wd.map(w => `<span>${w}</span>`).join('')}</div>
    <div class="dp-grid">${cells}</div>
    <div class="dp-foot">${inp._dpVis.required || !sel ? '<span></span>' : `<button type="button" data-clear>${L('ล้าง', 'Clear')}</button>`}${min > t0 ? '' : `<button type="button" data-d="${t0}">${L('วันนี้', 'Today')}</button>`}</div>`;
}
function dpMove(days, months, focus) {
  const c = new Date(DP.f + 'T00:00:00'), day = c.getDate();
  if (months) { c.setDate(1); c.setMonth(c.getMonth() + months); c.setDate(Math.min(day, new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate())); }
  else c.setDate(day + days);
  let f = isoOf(c); if (DP.inp.min && f < DP.inp.min) f = DP.inp.min;
  const n = new Date(f + 'T00:00:00'); Object.assign(DP, { f, y: n.getFullYear(), m: n.getMonth() });
  dpDraw(); if (focus) dpFocus();
}
function dpClick(e) {
  const b = e.target.closest('button'); if (!b || b.disabled || !DP) return;
  const inp = DP.inp;
  if (b.dataset.m) { dpMove(0, +b.dataset.m); DP.pop.querySelector(`[data-m="${b.dataset.m}"]:not(:disabled)`)?.focus(); }
  else if ('clear' in b.dataset) { dpClose(true); dpSet(inp, ''); }
  else if (b.dataset.d) { dpClose(true); dpSet(inp, b.dataset.d); }
}
function dpKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return dpClose(true); } // don't also close the booking modal
  const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [-7, 0], ArrowDown: [7, 0], PageUp: [0, -1], PageDown: [0, 1] }[e.key];
  if (k && e.target.classList.contains('dp-d')) { e.preventDefault(); dpMove(k[0], k[1], true); }
}
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
  return { cal, base, sp, key, add: sp && cal.add ? cal.add : 0, addHalf: sp && cal.add ? cal.addHalf || 0 : 0 };
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
    if (!isSeasonTable(ks)) tb.rows.forEach(r => r.slice(1).forEach((c, i) => { const n = priceNum(c); if (n) nums.push(n + szAdd(v, tb, i + 1, r)); }));
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
(() => { if (document.getElementById('sz-css')) return; const s = document.createElement('style'); s.id = 'sz-css'; s.textContent = SZ_CSS; document.head.appendChild(s); })();

FLEET.forEach(b => { b.fromAll = b.from_; const v = nowFrom(b); if (v) b.from_ = v; b.szNow = seasonView(b, todayISO()); });
function extraRule(b) {
  for (const n of b.notes) {
    const m = n.match(/extra charge of (?:net )?([\d,]+)\s*THB[^.]*?from the (\d+)/i);
    if (m) return { fee: +m[1].replace(/,/g, ''), from: +m[2] };
  }
  return null;
}
function seasonStripHTML(sel) {
  const months = LANG === 'en' ? ['J','F','M','A','M','J','J','A','S','O','N','D'] : ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const cur = sel ? new Date(sel + 'T00:00:00').getMonth() : new Date().getMonth();
  const tone = i => (i >= 10 || i <= 3) ? 'high' : 'low';
  return `<div class="flex items-end gap-0" role="img" aria-label="${L('ปฏิทินฤดูกาลอันดามัน','Andaman season calendar')}">
    ${months.map((m, i) => `<div class="flex-1 text-center"><div class="h-1.5 ${tone(i)==='high'?'bg-maroon':'bg-maroon-200'} ${i===cur?'outline outline-2 outline-offset-2 outline-ink':''}"></div><span class="block mt-2 text-[10px] ${i===cur?'text-ink font-medium':'text-muted'}">${m}</span></div>`).join('')}
  </div>
  <div class="flex gap-4 mt-2 text-xs text-muted"><span class="flex items-center gap-2"><i class="inline-block w-3 h-1.5 bg-maroon"></i>High / Peak</span><span class="flex items-center gap-2"><i class="inline-block w-3 h-1.5 bg-maroon-200"></i>Low</span></div>`;
}

/* ---------- Favorites & recently viewed ---------- */
let FAV = store.get('fav', []), RECENT = store.get('recent', []), CMP = [];
function toggleFav(slug, btn) {
  if (!FAV.includes(slug)) track('AddToWishlist', { content_ids: [slug], content_type: 'product' });
  FAV = FAV.includes(slug) ? FAV.filter(s => s !== slug) : [slug, ...FAV];
  store.set('fav', FAV); updateFavUI();
  toast(FAV.includes(slug) ? L('บันทึกในรายการโปรดแล้ว','Saved to favourites') : L('นำออกจากรายการโปรดแล้ว','Removed from favourites'));
}
function updateFavUI() {
  $$('[data-fav]').forEach(b => { const on = FAV.includes(b.dataset.fav); b.setAttribute('aria-pressed', on); b.querySelector('svg')?.classList.toggle('fill-maroon', on); b.classList.toggle('text-maroon', on); });
  $$('.fav-count').forEach(e => { e.textContent = FAV.length; e.classList.toggle('hidden', !FAV.length); });
}
function trackRecent(slug) { RECENT = [slug, ...RECENT.filter(s => s !== slug)].slice(0, 8); store.set('recent', RECENT); }
function renderRecent() {
  const wrap = $('#recentWrap'); if (!wrap) return;
  const list = RECENT.map(bySlug).filter(Boolean);
  wrap.classList.toggle('hidden', !list.length);
  if (!list.length) return;
  wrap.innerHTML = `<div class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
    <div class="flex items-end justify-between"><h2 class="font-display text-xl">${L('เรือที่คุณดูล่าสุด','Recently viewed')}</h2><button onclick="RECENT=[];store.set('recent',[]);renderRecent()" class="text-xs text-muted hover:text-maroon underline underline-offset-4">${L('ล้าง','Clear')}</button></div>
    <div class="mt-4 flex gap-4 overflow-x-auto no-scrollbar snap-x pb-2">${list.map(b => `<a href="#/boat/${b.slug}" class="snap-start shrink-0 w-56 group"><div class="aspect-[16/10] overflow-hidden img-fallback"><img loading="lazy" src="${bimg(b.slug,'hero')}" alt="${b.title}" class="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"/></div><p class="mt-2 text-sm font-medium truncate">${b.title}</p><p class="text-xs text-muted">${t('price.from','เริ่มต้น')} ${b.from_?baht(b.from_):'—'}</p></a>`).join('')}</div></div>`;
}

/* ---------- Compare ---------- */
function toggleCompare(slug) {
  if (CMP.includes(slug)) CMP = CMP.filter(s => s !== slug);
  else { if (CMP.length >= 3) { toast(L('เปรียบเทียบได้สูงสุด 3 ลำ','Compare up to 3 boats')); return; } CMP.push(slug); }
  updateCompareUI();
}
function updateCompareUI() {
  $$('[data-cmp]').forEach(b => { const on = CMP.includes(b.dataset.cmp); b.setAttribute('aria-pressed', on); b.classList.toggle('text-maroon', on); b.classList.toggle('ring-maroon', on); });
  const tray = $('#cmpTray');
  tray.classList.toggle('translate-y-[150%]', !CMP.length); tray.classList.toggle('invisible', !CMP.length);
  tray.setAttribute('aria-hidden', !CMP.length);
  $('#cmpItems').innerHTML = CMP.map(s => { const b = bySlug(s); return `<div class="flex items-center gap-2 bg-white/10 pr-2"><img src="${bimg(s,'a',160)}" alt="" class="w-10 h-8 object-cover"/><span class="text-xs truncate max-w-[110px]">${b.title}</span><button onclick="toggleCompare('${s}')" aria-label="${L('นำออก','Remove')} ${b.title}" class="text-white/80 hover:text-white"><i data-lucide="x" class="w-3.5 h-3.5"></i></button></div>`; }).join('');
  $('#cmpGo').disabled = CMP.length < 2;
  $('#cmpGo').textContent = `${L('เปรียบเทียบ','Compare')} (${CMP.length})`;
  icons();
}
function openCompare() {
  const bs = CMP.map(bySlug);
  const rows = [
    [L('ประเภท','Type'), b => typeLabel(b.type)],
    [L('ความยาว','Length'), b => b.ft ? b.ft + ' ft' : '—'],
    [L('ความจุ','Capacity'), b => b.pax ? b.pax + ' ' + t('guests') : '—'],
    [L('ห้องนอน','Cabins'), b => infoGet(b,'Cabin','Cabins','Bedroom') || '—'],
    [L('ความเร็ว','Cruising speed'), b => infoGet(b,'Cruising Speed','Cruising','Cruise Speed','Speed Cruise') || '—'],
    [L('ค้างคืนได้','Overnight'), b => b.overnight ? '✓' : '—'],
    [L('ท่าเรือ','Marina'), b => b.marinaP],
    [L('รวมในราคา','Inclusions'), b => b.includes.length + ' ' + L('รายการ','items')],
    [L('ราคาเริ่มต้น','From'), b => b.from_ ? baht(b.from_) : '—'],
  ];
  const best = (fn, hi) => { const v = bs.map(fn); const ok = v.filter(x => x != null); if (!ok.length) return -1; const t = hi ? Math.max(...ok) : Math.min(...ok); return v.indexOf(t); };
  const bestPax = best(b => b.pax, true), bestPrice = best(b => b.from_, false), bestFt = best(b => b.ft, true);
  $('#cmpBody').innerHTML = `<div class="overflow-x-auto"><table class="w-full text-sm min-w-[560px]"><thead><tr><th class="w-36"></th>${bs.map(b => `<th class="p-3 text-left align-top font-normal"><a href="#/boat/${b.slug}" onclick="closeModals()" class="block group"><div class="aspect-[16/10] overflow-hidden img-fallback"><img src="${bimg(b.slug,'hero')}" alt="${b.title}" class="w-full h-full object-cover"/></div><p class="font-display mt-2 group-hover:text-maroon">${b.title}</p><p class="text-xs text-muted">${b.subtitle}</p></a></th>`).join('')}</tr></thead>
    <tbody>${rows.map(([lab, fn], ri) => `<tr class="border-t border-sand-200"><td class="p-3 text-muted text-xs uppercase tracking-wider">${lab}</td>${bs.map((b, i) => { const hl = (ri===2&&i===bestPax)||(ri===8&&i===bestPrice)||(ri===1&&i===bestFt); return `<td class="p-3 ${hl?'text-maroon font-medium':''}">${fn(b)}${hl&&bs.length>1?` <span class="text-[10px] uppercase tracking-wider align-middle">· ${ri===8?L('คุ้มสุด','best value'):L('มากสุด','most')}</span>`:''}</td>`; }).join('')}</tr>`).join('')}
    <tr class="border-t border-sand-200"><td></td>${bs.map(b => `<td class="p-3"><button onclick="closeModals();openBooking('boat:${b.slug}')" class="w-full px-4 py-2.5 bg-maroon text-white hover:bg-maroon-800">${t('book')}</button></td>`).join('')}</tr></tbody></table></div>`;
  $('#cmpModal').classList.remove('hidden'); document.body.style.overflow = 'hidden'; icons();
}

/* ---------- Smart Match (rule-based recommender) ---------- */
const SM = { step: 0, guests: 6, occasion: 'friends', vibe: 'relax', budget: 80000, dest: '', overnight: false };
const SM_OPTS = {
  occasion: [['family','ครอบครัว','Family','baby'],['friends','เพื่อน / ปาร์ตี้','Friends & party','party-popper'],['romantic','คู่รัก / ขอแต่งงาน','Couples & proposals','heart'],['corporate','องค์กร / อีเวนต์','Corporate & events','briefcase']],
  vibe: [['relax','ชิล ล่องเรือใบ','Relax & sail','sailboat'],['speed','เร็ว เที่ยวหลายเกาะ','Fast island hopping','zap'],['luxury','หรูหรา เรือยอชต์','Luxury yacht','gem'],['value','คุ้มค่าที่สุด','Best value','piggy-bank']],
  dest: [['','ที่ไหนก็ได้','Anywhere'],['Phi Phi','Phi Phi'],['Phang Nga','Phang Nga Bay'],['Racha','Racha'],['Khai','Khai'],['Coral','Coral'],['Krabi','Krabi']],
};
function smartScore(b) {
  const why = []; let s = 0;
  if (b.pax && b.pax < SM.guests) return null;
  if (SM.overnight && !b.overnight) return null;
  if (b.pax) { if (b.pax <= SM.guests * 2.5) { s += 20; why.push(L(`รองรับ ${b.pax} คน พอดีกับกลุ่มคุณ`, `Fits your group (up to ${b.pax})`)); } else s += 8; }
  if (b.from_) {
    if (b.from_ <= SM.budget) { s += 25; why.push(L(`อยู่ในงบ · เริ่ม ${baht(b.from_)}`, `Within budget · from ${baht(b.from_)}`)); }
    else if (b.from_ <= SM.budget * 1.2) s += 6; else s -= 30;
  }
  const v = SM.vibe;
  if (v === 'relax' && (b.type === 'sail' || b.type === 'power')) { s += 25; why.push(L('คาตามารันนิ่ง นั่งสบาย','Stable, spacious catamaran')); }
  if (v === 'speed' && b.type === 'speed') { s += 25; why.push(L('สปีดโบ๊ทเร็ว ไปได้หลายเกาะ','Fast boat for island hopping')); }
  if (v === 'speed' && b.type === 'power') s += 10;
  if (v === 'luxury' && b.type === 'yacht') { s += 20; why.push(L('เรือยอชต์ส่วนตัวระดับพรีเมียม','Premium private yacht')); if ((b.ft||0) >= 60) s += 8; }
  if (v === 'value' && b.from_) { const rank = FLEET.filter(x => x.from_ && x.from_ < b.from_).length / FLEET.length; s += Math.round(25 * (1 - rank)); if (rank < .3) why.push(L('ราคาคุ้มค่าในกลุ่มเดียวกัน','Great value for money')); }
  const o = SM.occasion;
  if (o === 'romantic' && (b.pax || 99) <= 20 && b.type !== 'longtail') { s += 10; why.push(L('ขนาดกะทัดรัด เป็นส่วนตัว','Intimate & private')); }
  if (o === 'friends' && (b.pax || 0) >= 20) { s += 10; why.push(L('พื้นที่กว้างสำหรับปาร์ตี้','Room to party')); }
  if (o === 'family' && (b.type === 'sail' || b.type === 'power')) { s += 10; why.push(L('ปลอดภัย เหมาะกับเด็กและผู้สูงอายุ','Family-friendly & stable')); }
  if (o === 'corporate' && (b.pax || 0) >= 30) { s += 10; why.push(L('รองรับกลุ่มใหญ่และอีเวนต์','Built for large groups')); }
  if (SM.dest) { if (b.dest.includes(SM.dest)) { s += 15; why.push(L(`มีโปรแกรมไป ${SM.dest}`, `Has a ${SM.dest} program`)); } else s -= 10; }
  if (SM.overnight) why.push(L('มีแพ็กเกจค้างคืน','Overnight available'));
  if (b.pax) s += 6 * Math.min(1, SM.guests / b.pax);            // tighter fit ranks higher
  if (b.from_ && b.from_ <= SM.budget) s += 4 * (b.from_ / SM.budget); // uses budget well (nicer boat)
  return { b, s, why: why.slice(0, 3) };
}
function openSmart(reset = true) { if (reset) SM.step = 0; drawSmart(); $('#smartModal').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function drawSmart() {
  const steps = [L('กลุ่มของคุณ','Your group'), L('สไตล์ทริป','Trip style'), L('งบ & จุดหมาย','Budget & place'), L('ผลลัพธ์','Matches')];
  const chip = (key, val, label, icon) => `<button type="button" onclick="SM.${key}='${val}';drawSmart()" aria-pressed="${SM[key]===val}" class="text-left p-4 ring-1 ${SM[key]===val?'ring-maroon bg-maroon-50':'ring-sand-200 hover:ring-line-strong'} transition flex items-center gap-3">${icon?`<i data-lucide="${icon}" class="w-5 h-5 text-maroon shrink-0"></i>`:''}<span class="text-sm">${label}</span></button>`;
  let body = '';
  if (SM.step === 0) body = `
    <p class="text-sm text-muted">${L('ไปกันกี่คน และโอกาสอะไร?','How many guests, and what’s the occasion?')}</p>
    <div class="mt-4 flex items-center gap-4"><button type="button" onclick="SM.guests=Math.max(1,SM.guests-1);drawSmart()" class="w-11 h-11 ring-1 ring-line-strong grid place-items-center" aria-label="-"><i data-lucide="minus" class="w-4 h-4"></i></button>
      <div class="text-center"><p class="font-display text-4xl leading-none">${SM.guests}</p><p class="text-xs text-muted mt-2">${t('guests')}</p></div>
      <button type="button" onclick="SM.guests=Math.min(145,SM.guests+1);drawSmart()" class="w-11 h-11 ring-1 ring-line-strong grid place-items-center" aria-label="+"><i data-lucide="plus" class="w-4 h-4"></i></button>
      <input type="range" min="1" max="60" value="${Math.min(SM.guests,60)}" oninput="SM.guests=+this.value;this.previousElementSibling.previousElementSibling.querySelector('p').textContent=this.value" onchange="drawSmart()" class="flex-1 accent-maroon" aria-label="${L('จำนวนคน','Guests')}"/></div>
    <div class="grid grid-cols-2 gap-2 mt-6">${SM_OPTS.occasion.map(([v,th,en,ic]) => chip('occasion', v, L(th,en), ic)).join('')}</div>`;
  if (SM.step === 1) body = `
    <p class="text-sm text-muted">${L('อยากได้ฟีลแบบไหน?','What kind of day do you want?')}</p>
    <div class="grid grid-cols-2 gap-2 mt-4">${SM_OPTS.vibe.map(([v,th,en,ic]) => chip('vibe', v, L(th,en), ic)).join('')}</div>
    <label class="mt-6 flex items-center justify-between gap-3 p-4 ring-1 ring-sand-200 cursor-pointer"><span class="text-sm flex items-center gap-3"><i data-lucide="moon-star" class="w-5 h-5 text-maroon"></i>${L('ต้องการค้างคืนบนเรือ','I want to stay overnight')}</span><input type="checkbox" ${SM.overnight?'checked':''} onchange="SM.overnight=this.checked" class="w-5 h-5 accent-maroon"/></label>`;
  if (SM.step === 2) body = `
    <p class="text-sm text-muted">${L('งบประมาณต่อทริป (ทั้งลำ)','Budget per charter (whole boat)')}</p>
    <p class="font-display text-3xl mt-2" id="smBudgetOut">≤ ${baht(SM.budget)}</p>
    <input type="range" min="15000" max="300000" step="5000" value="${SM.budget}" oninput="SM.budget=+this.value;$('#smBudgetOut').textContent='≤ '+baht(SM.budget)" class="w-full accent-maroon mt-2" aria-label="${L('งบประมาณ','Budget')}"/>
    <div class="flex justify-between text-xs text-muted"><span>${baht(15000)}</span><span>${baht(300000)}+</span></div>
    <p class="text-sm text-muted mt-6">${L('อยากไปที่ไหน?','Where to?')}</p>
    <div class="flex flex-wrap gap-2 mt-2">${SM_OPTS.dest.map(([v,th,en]) => `<button type="button" onclick="SM.dest='${v}';drawSmart()" aria-pressed="${SM.dest===v}" class="px-3 py-2 text-sm ring-1 ${SM.dest===v?'chip-active':'ring-sand-200 hover:ring-line-strong'}">${en?L(th,en):th}</button>`).join('')}</div>`;
  if (SM.step === 3) {
    const res = FLEET.map(smartScore).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 3);
    const max = 20 + 25 + (SM.vibe === 'luxury' ? 28 : 25) + 10 + (SM.dest ? 15 : 0) + 10;
    body = res.length ? `<p class="text-sm text-muted">${L(`จาก ${FLEET.length} ลำ นี่คือ 3 ลำที่ตรงกับคุณที่สุด`, `Out of ${FLEET.length} boats, these fit you best`)}</p>
      <div class="mt-4 space-y-3">${res.map((r, i) => { const pct = Math.max(40, Math.min(99, Math.round(r.s / max * 100))); return `
        <div class="grid grid-cols-[96px_1fr] sm:grid-cols-[150px_1fr] gap-4 ring-1 ${i===0?'ring-maroon':'ring-sand-200'} p-3 reveal in">
          <a href="#/boat/${r.b.slug}" onclick="closeModals()" class="block aspect-[4/3] overflow-hidden img-fallback"><img src="${bimg(r.b.slug,'hero')}" alt="${r.b.title}" class="w-full h-full object-cover"/></a>
          <div class="min-w-0">
            <div class="flex items-center justify-between gap-2"><p class="text-xs uppercase tracking-[.12em] text-maroon">${i===0?L('ตรงที่สุด','Top match'):typeLabel(r.b.type)}</p><span class="text-xs font-medium tabular-nums">${pct}% match</span></div>
            <div class="h-1 bg-sand mt-2"><div class="h-1 bg-maroon smart-bar" style="--w:${pct}%"></div></div>
            <p class="font-display mt-2 truncate">${r.b.title}</p>
            <ul class="mt-2 text-xs text-muted space-y-0">${r.why.map(w => `<li class="flex gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-maroon shrink-0"></i>${w}</li>`).join('')}</ul>
            <div class="mt-3 flex flex-wrap gap-2"><a href="#/boat/${r.b.slug}" onclick="closeModals()" class="text-xs px-3 py-2 ring-1 ring-sand-200 hover:ring-maroon">${t('details')}</a><button onclick="closeModals();openBooking('boat:${r.b.slug}')" class="px-3 py-2 bg-maroon text-white hover:bg-maroon-800">${t('book')}</button></div>
          </div></div>`; }).join('')}</div>`
      : `<div class="text-center py-10"><p>${L('ยังไม่พบเรือที่ตรงทุกเงื่อนไข','No boat matches every condition yet')}</p><p class="text-sm text-muted mt-2">${L('ลองเพิ่มงบหรือเลือก “ที่ไหนก็ได้”','Try a higher budget or “Anywhere”')}</p></div>`;
  }
  $('#smartBody').innerHTML = `
    <ol class="flex gap-2" aria-label="Progress">${steps.map((s, i) => `<li class="flex-1"><div class="h-0.5 ${i<=SM.step?'bg-maroon':'bg-sand-200'} transition-colors duration-300"></div><span class="hidden sm:block text-[10px] uppercase tracking-[.12em] mt-2 ${i===SM.step?'text-ink':'text-muted'}">${s}</span></li>`).join('')}</ol>
    <div class="mt-6 min-h-[260px] fade-up" aria-live="polite">${body}</div>
    <div class="mt-6 flex items-center justify-between gap-3 border-t border-sand-200 pt-4">
      <button type="button" onclick="SM.step=Math.max(0,SM.step-1);drawSmart()" class="text-sm text-muted hover:text-ink ${SM.step===0?'invisible':''}">← ${L('ย้อนกลับ','Back')}</button>
      ${SM.step<3?`<button type="button" onclick="SM.step++;drawSmart()" class="px-6 py-3 bg-maroon text-white hover:bg-maroon-800 flex items-center gap-2">${SM.step===2?L('ดูเรือที่ใช่','Show my matches'):L('ถัดไป','Next')}<i data-lucide="arrow-right" class="w-4 h-4"></i></button>`
      :`<button type="button" onclick="SM.step=0;drawSmart()" class="text-sm text-maroon hover:underline underline-offset-4">${L('เริ่มใหม่','Start over')}</button>`}
    </div>`;
  icons();
}

/* ---------- Command palette (⌘K) ---------- */
let cmdIdx = 0, cmdItems = [], cmdFilter = '';
const escH = x => String(x).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const markQ = (txt, q) => { if (!q) return escH(txt); const i = txt.toLowerCase().indexOf(q); return i < 0 ? escH(txt) : escH(txt.slice(0,i)) + '<mark class="cmd-mark">' + escH(txt.slice(i, i+q.length)) + '</mark>' + escH(txt.slice(i+q.length)); };
function openCmd() {
  $('#cmdModal').classList.remove('hidden'); document.body.style.overflow = 'hidden';
  const i = $('#cmdInput'); i.value = ''; cmdFilter = '';
  i.placeholder = L('ค้นหาชื่อเรือ เกาะ ท่าเรือ…', 'Search boats, islands, marinas…');
  $('#cmdHintNav').textContent = L('เลื่อน','navigate'); $('#cmdHintOpen').textContent = L('เปิด','open');
  drawCmd(''); setTimeout(() => i.focus(), 30);
}
function drawCmd(q) {
  q = q.trim().toLowerCase();
  $('#cmdClear').classList.toggle('hidden', !q);
  const chips = [['', L('ทั้งหมด','All')], ...TYPES.map(t0 => ['type:' + t0, typeLabel(t0)]), ['dest:Phi Phi','Phi Phi'], ['dest:Phang Nga','Phang Nga']];
  $('#cmdChips').innerHTML = chips.map(([v, l]) => `<button type="button" data-f="${v}" class="cmd-chip shrink-0 h-8 px-3 text-xs ring-1 transition ${cmdFilter===v ? 'chip-active' : 'ring-sand-200 text-muted hover:text-ink hover:ring-line-strong'}">${l}</button>`).join('');
  $$('.cmd-chip').forEach(b => b.onclick = () => { cmdFilter = b.dataset.f; drawCmd($('#cmdInput').value); $('#cmdInput').focus(); });
  const pages = [[L('เรือทั้งหมด','All boats'), L(`${FLEET.length} ลำ พร้อมตัวกรอง`, `${FLEET.length} boats with filters`), '#/fleet', 'ship'],
                 ['Smart Match', L('ตอบ 3 ข้อ เราเลือกให้','3 questions, 3 matches'), 'smart', 'sparkles'],
                 [L('รายการโปรด','Favourites'), `${FAV.length} ${t('boatsUnit')}`, '#/fleet?fav', 'heart'],
                 [L('ติดต่อทีมขาย','Talk to sales'), L('โทร / WhatsApp','Phone / WhatsApp'), '#team', 'headset']];
  const pg = pages.filter(p => !q || (p[0] + ' ' + p[1]).toLowerCase().includes(q));
  let boats = FLEET.filter(b => {
    if (cmdFilter.startsWith('type:') && b.type !== cmdFilter.slice(5)) return false;
    if (cmdFilter.startsWith('dest:') && !b.dest.includes(cmdFilter.slice(5))) return false;
    return !q || (b.title + ' ' + b.subtitle + ' ' + b.marina + ' ' + b.dest.join(' ') + ' ' + typeLabel(b.type)).toLowerCase().includes(q);
  });
  const total = boats.length;
  boats = boats.slice(0, q || cmdFilter ? 12 : 6);
  cmdItems = [...(cmdFilter ? [] : pg.map(p => ({ k:'page', label:p[0], sub:p[1], href:p[2], icon:p[3] }))),
              ...boats.map(b => ({ k:'boat', b, label:b.title, href:'#/boat/' + b.slug }))];
  cmdIdx = 0; paintCmd(q, total);
}
function paintCmd(q = $('#cmdInput').value.trim().toLowerCase(), total) {
  const pagesI = cmdItems.map((it, i) => [it, i]).filter(([it]) => it.k === 'page');
  const boatsI = cmdItems.map((it, i) => [it, i]).filter(([it]) => it.k === 'boat');
  const row = (it, i) => {
    const on = i === cmdIdx;
    if (it.k === 'page') return `<li role="option" id="cmd-${i}" aria-selected="${on}" data-i="${i}" class="cmd-row relative flex items-center gap-3 p-2 rounded cursor-pointer ${on ? 'bg-maroon-50' : 'hover:bg-sand'}">
      <span class="w-9 h-9 rounded grid place-items-center ${on ? 'bg-maroon text-white' : 'bg-sand text-maroon'} transition"><i data-lucide="${it.icon}" class="w-4 h-4"></i></span>
      <span class="min-w-0"><span class="block text-sm truncate">${markQ(it.label, q)}</span><span class="block text-xs text-muted truncate">${it.sub}</span></span></li>`;
    const b = it.b;
    return `<li role="option" id="cmd-${i}" aria-selected="${on}" data-i="${i}" class="cmd-row relative flex items-center gap-3 px-2 py-2 rounded cursor-pointer ${on ? 'bg-maroon-50' : 'hover:bg-sand'}">
      ${on ? '<span class="absolute left-0 top-2 bottom-2 w-0.5 bg-maroon rounded-circle"></span>' : ''}
      <img src="${bimg(b.slug,'hero',160)}" alt="" class="w-16 h-11 rounded object-cover shrink-0"/>
      <span class="min-w-0 flex-1"><span class="block text-sm truncate">${markQ(niceTitle(b.title), q)}</span>
        <span class="block text-xs text-muted truncate">${typeLabel(b.type)} · ${b.pax || '—'} ${t('guests')} · ${markQ(b.marinaP, q)}</span></span>
      <span class="text-right shrink-0"><span class="block text-[10px] uppercase tracking-[.12em] text-muted">${t('price.from','เริ่มต้น')}</span><span class="block text-sm tabular-nums">${b.from_ ? baht(b.from_) : '—'}</span></span>
      <i data-lucide="corner-down-left" class="w-3.5 h-3.5 text-maroon shrink-0 ${on ? '' : 'invisible'}"></i></li>`;
  };
  const head = l => `<li role="presentation" class="px-2 pt-3 pb-2 text-[10px] uppercase tracking-[.2em] text-muted">${l}</li>`;
  $('#cmdList').innerHTML = cmdItems.length
    ? (pagesI.length ? head(L('ไปที่','Jump to')) + `<li role="presentation"><ul class="grid sm:grid-cols-2 gap-2">${pagesI.map(([it, i]) => row(it, i)).join('')}</ul></li>` : '')
      + (boatsI.length ? head(q || cmdFilter ? L('ผลการค้นหาเรือ','Matching boats') : L('เรือแนะนำ','Suggested boats')) + boatsI.map(([it, i]) => row(it, i)).join('') : '')
    : `<li class="py-12 text-center"><i data-lucide="search-x" class="w-6 h-6 mx-auto text-muted"></i><p class="mt-3 text-sm">${L('ไม่พบผลลัพธ์สำหรับ','No results for')} “${escH(q)}”</p><p class="text-xs text-muted mt-2">${L('ลองชื่อเกาะ เช่น Phi Phi หรือประเภทเรือ','Try an island like Phi Phi or a boat type')}</p><button onclick="closeModals();openSmart()" class="mt-4 h-9 px-4 bg-maroon text-white text-xs inline-flex items-center gap-2"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i>Smart Match</button></li>`;
  if (total != null) $('#cmdCount').textContent = `${total} ${t('boatsUnit')}`;
  $('#cmdInput').setAttribute('aria-activedescendant', 'cmd-' + cmdIdx);
  $$('.cmd-row').forEach(r => { r.onmouseenter = () => { if (cmdIdx !== +r.dataset.i) { cmdIdx = +r.dataset.i; paintCmd(); } }; r.onclick = () => runCmd(+r.dataset.i); });
  icons();
}
function runCmd(i) { const it = cmdItems[i]; if (!it) return; closeModals(); if (it.href === 'smart') openSmart(); else VH.hash = it.href; }

/* ---------- Hero slideshow ---------- */
const HERO = ['leopard-90-ft','splo-74-ft','siam-princess-70-ft','the-origin-90-ft','lobster-78-ft','vtech-68-ft'];
let heroIdx = 0, heroTimer;
function renderHero() {
  const el = $('#heroStage'); if (!el) return;
  el.innerHTML = HERO.map((s, i) => { const b = bySlug(s); return `<img src="${bimg(s,'hero',1600)}" srcset="${bimg(s,'hero',768)} 768w, ${bimg(s,'hero',1280)} 1280w, ${bimg(s,'hero',1600)} 1600w" sizes="100vw" alt="${niceTitle(b.title)} – ${typeLabel(b.type)} charter in Phuket" ${i?'loading="lazy"':'fetchpriority="high"'} class="hero-slide absolute inset-0 w-full h-full object-cover" aria-hidden="${i!==0}"/>`; }).join('');
  $('#heroDots').innerHTML = HERO.map((s, i) => `<button onclick="heroGo(${i})" aria-label="${L('สไลด์','Slide')} ${i+1}: ${niceTitle(bySlug(s).title)}" class="w-7 h-1 rounded-full bg-white/35 relative overflow-hidden"><span class="hero-dot absolute inset-y-0 left-0 bg-white rounded-full"></span></button>`).join('');
  bindHeroSwipe();
  heroGo(heroIdx || 0);
}
let heroPaused = false;
function heroToggle() {
  heroPaused = !heroPaused; const btn = $('#heroPause');
  $('#heroBox').classList.toggle('paused', heroPaused);
  btn.setAttribute('aria-pressed', heroPaused); btn.setAttribute('aria-label', heroPaused ? 'Play slideshow' : 'Pause slideshow');
  btn.innerHTML = `<i data-lucide="${heroPaused ? 'play' : 'pause'}" class="w-4 h-4"></i>`; icons();
  if (heroPaused) clearTimeout(heroTimer); else heroGo(heroIdx);
}
function bindHeroSwipe() {
  const box = $('#heroBox'); if (!box || box.dataset.swipe) return; box.dataset.swipe = 1;
  let x0 = null, y0 = 0;
  box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) heroGo(heroIdx + (dx < 0 ? 1 : -1)); x0 = null; }, { passive: true });
  box.addEventListener('keydown', e => { if (e.key === 'ArrowRight') heroGo(heroIdx + 1); if (e.key === 'ArrowLeft') heroGo(heroIdx - 1); });
}
function heroGo(i) {
  const changed = heroIdx !== ((i + HERO.length) % HERO.length);
  heroIdx = (i + HERO.length) % HERO.length;
  if (changed) heroRotate();
  $$('.hero-slide').forEach((im, k) => { im.classList.toggle('is-on', k === heroIdx); im.setAttribute('aria-hidden', k !== heroIdx); });
  $$('.hero-dot').forEach((d, k) => { d.classList.remove('is-on'); d.style.width = k < heroIdx ? '100%' : '0'; if (k === heroIdx) { d.style.width = ''; heroDotOn(d); } });
  const b = bySlug(HERO[heroIdx]);
  $('#heroCap').innerHTML = `<a href="#/boat/${b.slug}" class="group inline-flex flex-col"><span class="text-[11px] uppercase tracking-[.18em] text-white/80">${typeLabel(b.type)} · ${String(heroIdx+1).padStart(2,'0')}/${String(HERO.length).padStart(2,'0')}</span><span class="font-display text-base sm:text-xl mt-1 group-hover:underline underline-offset-4">${niceTitle(b.title)}</span><span class="text-xs sm:text-sm text-white/85 mt-0.5">${t('price.from','เริ่มต้น')} ${baht(b.from_)}</span></a>`;
  clearTimeout(heroTimer);
  if (!heroPaused && !matchMedia('(prefers-reduced-motion: reduce)').matches) heroTimer = setTimeout(heroNext, 6000);
}
// next slide only while the home page is on screen (it keeps running hidden behind other pages otherwise)
function heroNext() { if (currentView !== 'home' || document.hidden) { heroTimer = setTimeout(heroNext, 6000); return; } heroGo(heroIdx + 1); }
// restart the dot's progress animation two frames later instead of forcing a layout of the whole page (offsetWidth)
function heroDotOn(d) {
  if (navigator.userAgent === 'BTT-SSR' || typeof requestAnimationFrame !== 'function') { d.classList.add('is-on'); return; }
  requestAnimationFrame(() => requestAnimationFrame(() => { if (d.style.width === '') d.classList.add('is-on'); }));
}

/* ---------- Stats, smart teaser ---------- */
function renderStats() {
  const marinas = new Set(FLEET.map(b => b.marinaP.toLowerCase().replace(/\s*(phuket|\(rpm\))\s*/g,'').trim())).size;
  const maxPax = Math.max(...FLEET.map(b => b.pax || 0));
  const minFrom = Math.min(...FLEET.filter(b => b.from_).map(b => b.from_));
  const S = [[FLEET.length,'',L('ลำในเครือข่าย','boats in our fleet'),'ship'],[marinas,'',L('ท่าเรือ & มารีน่า','marinas & piers'),'anchor'],[maxPax,'',L('คน · ความจุสูงสุด/ลำ','guests · largest boat'),'users-round'],[LANG==='en'?toUSD(minFrom):minFrom,LANG==='en'?'$':'฿',L('ราคาเริ่มต้นต่ำสุด','lowest starting rate'),'badge-percent']];
  $('#statsRow').innerHTML = S.map(([n, pre, lab, ic]) => `<div class="reveal flex items-center gap-3 py-4 border-t border-sand-200"><i data-lucide="${ic}" class="w-5 h-5 text-maroon shrink-0"></i><div><p class="font-display text-2xl leading-none tabular-nums"><span>${pre}</span><span class="count" data-to="${n}">0</span></p><p class="text-xs text-muted mt-2">${lab}</p></div></div>`).join('');
}
function renderSmartTeaser() {
  const el = $('#smartTeaser'); if (!el) return;
  el.innerHTML = `<div class="max-w-7xl mx-auto px-4 sm:px-6"><div class="reveal grid md:grid-cols-[1.2fr_1fr] gap-6 items-center ring-1 ring-sand-200 p-6 sm:p-10">
    <div><p class="text-xs uppercase tracking-[.2em] text-maroon flex items-center gap-2"><i data-lucide="sparkles" class="w-4 h-4"></i>Smart Match</p>
      <h2 class="font-display text-2xl sm:text-3xl mt-2">${L('ไม่แน่ใจว่าลำไหน? ตอบ 3 ข้อ เราเลือกให้','Not sure which boat? Answer 3 questions')}</h2>
      <p class="text-sm text-muted mt-3 max-w-lg">${L(`ระบบจับคู่จากข้อมูลจริงของเรือทั้ง ${FLEET.length} ลำ — จำนวนคน งบ สไตล์ทริป และเส้นทาง แล้วแนะนำ 3 ลำที่ใช่ที่สุดพร้อมเหตุผล`, `We match your group, budget, style and route against real data for all ${FLEET.length} boats — and explain every pick.`)}</p>
      <button onclick="openSmart()" class="mt-6 px-6 py-3 bg-maroon text-white hover:bg-maroon-800 inline-flex items-center gap-2">${L('เริ่มเลย · 30 วินาที','Start · 30 seconds')}<i data-lucide="arrow-right" class="w-4 h-4"></i></button></div>
    <div class="grid grid-cols-3 gap-2">${['the-origin-90-ft','lobster-78-ft','r5-47-ft'].map((s,i) => `<div class="aspect-[3/4] overflow-hidden img-fallback ${i===1?'translate-y-4':''}"><img loading="lazy" src="${bimg(s,'a')}" alt="" class="w-full h-full object-cover"/></div>`).join('')}</div>
  </div></div>`;
}

/* ---------- Reveal on scroll + counters ---------- */
const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); revealIO.unobserve(e.target);
  e.target.querySelectorAll('.count').forEach(runCount);
}), { rootMargin: '0px 0px -8% 0px' }) : null;
function observeReveal() { $$('.reveal:not(.in)').forEach(el => revealIO ? revealIO.observe(el) : el.classList.add('in')); }
setInterval(() => $$('.reveal:not(.in)').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0 && el.offsetParent) { el.classList.add('in'); el.querySelectorAll('.count').forEach(runCount); } }), 1200);
function runCount(el) {
  const to = +el.dataset.to, t0 = performance.now(), dur = 1100;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = to.toLocaleString('en-US'); return; }
  const step = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e).toLocaleString('en-US'); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- Route progress + scroll progress ---------- */
function routeProgress() { const b = $('#routeProg'); b.classList.remove('run'); void b.offsetWidth; b.classList.add('run'); }
window.addEventListener('scroll', () => { const h = document.documentElement; $('#scrollProg').style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`; }, { passive: true });
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); }
  else if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openCmd(); }
});

/* =========================================================
   SEO — homepage content, FAQ, meta & JSON-LD (keyword: "yacht charter")
   ========================================================= */
const SITE = SITE_ORIGIN;
const SEO_META = HOME ? {
  th: { get title() { return homeTxt(HOME.seo.title, 'th'); }, get desc() { return homeTxt(HOME.seo.desc, 'th'); } },
  en: { get title() { return homeTxt(HOME.seo.title, 'en'); }, get desc() { return homeTxt(HOME.seo.desc, 'en'); } },
} : {
  th: { title: 'Yacht Charter ภูเก็ต – เช่าเรือยอชต์ 70 ลำ | Boat Trip Thailand',
        desc: 'Yacht Charter ภูเก็ต เช่าเรือยอชต์ส่วนตัว คาตามารัน สปีดโบ๊ท 70 ลำ ไปพีพี อ่าวพังงา เกาะราชา เริ่ม ฿16,000 รวมกัปตัน ลูกเรือ และประกันภัย จองตรงกับทีมงาน' },
  en: { title: 'Yacht Charter Phuket – 70 Private Boats | Boat Trip Thailand',
        get desc() { return `Yacht charter in Phuket with 70 private yachts, catamarans and speedboats. Phi Phi, Phang Nga Bay and Racha from ${baht(16000)} incl. crew & insurance. Book direct.`; } },
};
const FAQ = HOME && HOME.faq.length ? HOME.faq.map(([q, a]) => ({ q: [homeTxt(q, 'th'), homeTxt(q, 'en')], a: [() => homeTxt(a, 'th'), () => homeTxt(a, 'en')] })) : [
  { q:['Yacht charter ภูเก็ตราคาเท่าไหร่?','How much does a yacht charter in Phuket cost?'],
    a:[()=>`ราคาขึ้นกับขนาดเรือ เส้นทาง และฤดูกาล ในโบรชัวร์ของเรา เรือคาตามารันเริ่มต้น ${baht(minFrom('sail'))} สปีดโบ๊ทเริ่ม ${baht(minFrom('speed'))} และเรือยอชต์ส่วนตัวเริ่ม ${baht(minFrom('yacht'))} ต่อทริป (ทั้งลำ) ราคารวมกัปตัน ลูกเรือ ประกันภัย และ VAT 7%`,
        ()=>`Prices depend on boat size, route and season. In our brochure, sailing catamarans start at ${baht(minFrom('sail'))}, speedboats at ${baht(minFrom('speed'))} and private motor yachts at ${baht(minFrom('yacht'))} per charter (whole boat), including captain, crew, insurance and 7% VAT.`] },
  { q:['ราคา yacht charter รวมอะไรบ้าง?','What is included in a yacht charter?'],
    a:[()=>'โดยทั่วไปรวมกัปตันและลูกเรือ น้ำมันเชื้อเพลิง อุปกรณ์ดำน้ำตื้น แพดเดิลบอร์ด น้ำดื่ม ผลไม้ ผ้าเย็น ประกันภัย และ VAT 7% ส่วนค่าอุทยานแห่งชาติ ค่าขึ้นเกาะ และรถรับส่ง ขึ้นอยู่กับแต่ละลำ — ดูรายละเอียดได้ในหน้าเรือแต่ละลำ',
        ()=>'Most charters include captain and crew, fuel, snorkelling gear, paddle boards, drinking water, fruit, towels, insurance and 7% VAT. National-park fees, island landing fees and transfers vary by boat — each boat page lists exactly what is and isn’t included.'] },
  { q:['ช่วงไหนเหมาะกับการเช่าเรือยอชต์ในภูเก็ตที่สุด?','When is the best time for a yacht charter in Phuket?'],
    a:[()=>'High Season (พ.ย.–เม.ย.) ทะเลอันดามันสงบและฟ้าใส เหมาะที่สุดสำหรับไปพีพีและเกาะราชา ช่วง Low Season (พ.ค.–ต.ค.) ราคาดีกว่าและยังออกเรือได้เกือบทุกวัน โดยเลือกเส้นทางที่กำบังลม เช่น อ่าวพังงา',
        ()=>'High season (November–April) brings calm, clear Andaman seas — ideal for Phi Phi and Racha. Low season (May–October) offers better rates and most days are still sailable on sheltered routes such as Phang Nga Bay.'] },
  { q:['เช่าเรือยอชต์ได้กี่คน?','How many guests can join a yacht charter?'],
    a:[()=>`ตั้งแต่ 2 คนบนเรือส่วนตัวขนาดเล็ก ไปจนถึง ${Math.max(...FLEET.map(b=>b.pax||0))} คนบนเรือคาตามารันขนาดใหญ่ ใช้ Smart Match หรือตัวกรองจำนวนคนในหน้าเรือทั้งหมดเพื่อหาลำที่พอดีกับกลุ่มของคุณ`,
        ()=>`From 2 guests on a small private boat up to ${Math.max(...FLEET.map(b=>b.pax||0))} on our largest catamaran. Use Smart Match or the guest filter on the fleet page to find the right size.`] },
  { q:['ต้องจองล่วงหน้ากี่วัน และยกเลิกได้ไหม?','How far ahead should I book, and can I cancel?'],
    a:[()=>'High Season แนะนำจองล่วงหน้า 1–2 สัปดาห์ (ช่วงปีใหม่ 1–2 เดือน) ชำระมัดจำ 50% เพื่อยืนยัน ยกเลิกน้อยกว่า 48 ชม. คิด 30% น้อยกว่า 24 ชม. คิด 50% และน้อยกว่า 12 ชม. หรือไม่มาคิด 100%',
        ()=>'In high season book 1–2 weeks ahead (1–2 months for New Year). A 50% deposit confirms the boat. Cancellations under 48 h are charged 30%, under 24 h 50%, and under 12 h or no-show 100%.'] },
  { q:['ออกเรือจากท่าไหน?','Which marinas do charters depart from?'],
    a:[()=>'เรือของเราออกจาก Royal Phuket Marina, Ao Po Grand Marina, Chalong Pier, Boat Lagoon, ONE°15 Marina และ Coco Pier (Panwa) ในภูเก็ต — แต่ละลำระบุท่าเรือไว้ชัดเจน',
        ()=>'Our boats depart from Royal Phuket Marina, Ao Po Grand Marina, Chalong Pier, Boat Lagoon, ONE°15 Marina and Coco Pier (Panwa) in Phuket — each boat page names its marina.'] },
];
const minFrom = ty => Math.min(...FLEET.filter(b => b.type === ty && b.from_).map(b => b.from_));
const TYPE_DESC = {
  yacht: ['เรือยอชต์มอเตอร์ส่วนตัวขนาด 42–90 ฟุต ห้องแอร์ ห้องนอน และดาดฟ้าอาบแดด เหมาะกับคู่รัก ครอบครัว และงานฉลอง', 'Private motor yachts of 42–90 ft with air-conditioned saloons, cabins and sun decks — perfect for couples, families and celebrations.'],
  sail: ['เรือใบคาตามารัน 2 ลำตัว นิ่งและกว้าง เมาเรือน้อย มีตาข่ายหัวเรือและสระลอยน้ำ คุ้มค่าที่สุดสำหรับกลุ่ม', 'Twin-hull sailing catamarans: stable, spacious and gentle on the stomach, with bow nets and floating pools — the best value for groups.'],
  power: ['พาวเวอร์คาตามารัน เร็วกว่าเรือใบแต่ยังนิ่ง เหมาะกับทริปเกาะไกลอย่างพีพีและกระบี่ในวันเดียว', 'Power catamarans: faster than sail yet just as stable — ideal for distant day trips to Phi Phi and Krabi.'],
  speed: ['สปีดโบ๊ทส่วนตัวความเร็ว 25–43 นอต ไปได้หลายเกาะในวันเดียว ราคาเริ่มต้นเป็นมิตร', 'Private speedboats cruising at 25–43 knots — hop several islands in one day at a friendly price.'],
  longtail: ['เรือหางยาวหรูสไตล์ไทย ตกแต่งพิเศษ ถ่ายรูปสวย เหมาะกับอ่าวพังงาและเกาะใกล้ภูเก็ต', 'Luxury Thai long-tail boats with custom interiors — photogenic and perfect for Phang Nga Bay and nearby islands.'],
};
function renderSeoGuide() {
  const el = $('#seoGuide'); if (!el) return;
  const k = LANG === 'en' ? 1 : 0;
  const types = TYPES.map(ty => ({ ty, n: FLEET.filter(b => b.type === ty).length, from: minFrom(ty), pax: Math.max(...FLEET.filter(b => b.type === ty).map(b => b.pax || 0)) }));
  const routes = [['Phi Phi','phi-phi', L('อ่าวมาหยา น้ำทะเลใส เหมาะกับสปีดโบ๊ทและพาวเวอร์คาตามารัน','Maya Bay and turquoise lagoons — best by speedboat or power catamaran')],
                  ['Phang Nga Bay','phang-nga', L('เกาะเจมส์บอนด์และเขาหินปูน ทะเลเรียบตลอดปี','James Bond Island and limestone karsts — calm water all year')],
                  ['Racha','racha', L('น้ำใสระดับคริสตัล จุดดำน้ำตื้นยอดนิยม','Crystal-clear water and top snorkelling spots')],
                  ['Khai & Coral','khai', L('ใกล้ภูเก็ต ครึ่งวันก็เที่ยวได้ เหมาะกับครอบครัว','Close to Phuket, easy half-day trips for families')],
                  ['Krabi 4 Islands','krabi', L('ทะเลแหวก ถ้ำพระนาง และเกาะไก่','Thale Waek sandbar, Phra Nang Cave and Chicken Island')]];
  el.innerHTML = `<div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-t7">
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
      <header class="lg:sticky lg:top-24 self-start reveal min-w-0">
        <p class="text-xs uppercase tracking-[.2em] text-maroon">${L('คู่มือเช่าเรือ','Charter guide')}</p>
        <h2 id="seoGuideTitle" class="font-display text-2xl sm:text-3xl mt-2">${L('Yacht Charter ภูเก็ต: ทุกอย่างที่ควรรู้ก่อนเช่าเรือ','Yacht charter in Phuket: everything to know before you book')}</h2>
        <p class="text-sm text-muted mt-4 leading-relaxed">${L(`Boat Trip Thailand ให้บริการ yacht charter ในภูเก็ต กระบี่ และพังงา ด้วยเรือส่วนตัว ${FLEET.length} ลำ ตั้งแต่สปีดโบ๊ทไปจนถึงซูเปอร์ยอชต์ 90 ฟุต ทุกทริปมีกัปตัน ลูกเรือ และประกันภัย ราคาอ้างอิงจากโบรชัวร์ทางการ และเราได้รับใบอนุญาตประกอบธุรกิจนำเที่ยว ททท. เลขที่ ${SET.tat}`, `Boat Trip Thailand runs yacht charters across Phuket, Krabi and Phang Nga with ${FLEET.length} private boats — from speedboats to a 90 ft superyacht. Every trip includes captain, crew and insurance, rates come straight from our official brochure, and we are a TAT-licensed operator (No. ${SET.tat}).`)}</p>
        <nav aria-label="${L('สารบัญ','On this page')}" class="mt-6 text-sm space-y-2">
          ${[['types',L('ประเภทเรือสำหรับ yacht charter','Types of yacht charter')],['prices',L('ราคา yacht charter ภูเก็ต','Yacht charter prices')],['routes',L('เส้นทางยอดนิยม','Popular routes')],['how',L('วิธีจองใน 4 ขั้นตอน','How to book in 4 steps')],['faq',L('คำถามที่พบบ่อย','FAQ')]].map(([id,l])=>`<a href="#guide-${id}" onclick="event.preventDefault();document.getElementById('guide-${id}').scrollIntoView({behavior:'smooth'})" class="flex items-center gap-2 text-muted hover:text-maroon"><i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>${l}</a>`).join('')}
        </nav>
      </header>
      <div class="space-y-12 text-sm leading-relaxed min-w-0">
        <section id="guide-types" class="reveal scroll-mt-24">
          <h3 class="font-display text-xl">${L('ประเภทเรือสำหรับ yacht charter','Types of yacht charter')}</h3>
          <div class="mt-4 grid sm:grid-cols-2 gap-px bg-[rgb(35_20_22/.08)] border border-[rgb(35_20_22/.08)] rounded-[18px] overflow-hidden">
            ${types.map((o,i) => `<a href="#/fleet" onclick="fleetState.f='${o.ty}'" class="bg-white p-5 hover:bg-maroon-50 transition group ${i===types.length-1 && types.length%2 ? 'sm:col-span-2' : ''}">
              <p class="flex items-center justify-between"><span class="font-medium">${typeLabel(o.ty)}</span><span class="text-xs text-muted">${o.n} ${t('boatsUnit')}</span></p>
              <p class="text-muted mt-2">${TYPE_DESC[o.ty][k]}</p>
              <p class="mt-3 text-xs text-maroon group-hover:underline underline-offset-4">${L('ดูเรือ','View')} ${typeLabel(o.ty)} →</p></a>`).join('')}
          </div>
        </section>
        <section id="guide-prices" class="reveal scroll-mt-24">
          <h3 class="font-display text-xl">${L('ราคา yacht charter ภูเก็ต (เริ่มต้นต่อทริป)','Phuket yacht charter prices (from, per charter)')}</h3>
          <p class="text-muted mt-2">${L('ราคาทั้งลำ รวมกัปตัน ลูกเรือ ประกันภัย และ VAT 7% อ้างอิงราคาต่ำสุดในโบรชัวร์ BTT','Whole-boat rates including captain, crew, insurance and 7% VAT — lowest published rate in the BTT brochure.')}</p>
          <div class="mt-4 overflow-x-auto ring-1 ring-sand-200"><table class="w-full text-sm min-w-[480px]">
            <caption class="sr-only">${L('ตารางราคา yacht charter ตามประเภทเรือ','Yacht charter prices by boat type')}</caption>
            <thead class="bg-sand"><tr><th scope="col" class="text-left font-medium px-4 py-3">${L('ประเภทเรือ','Boat type')}</th><th scope="col" class="text-right font-medium px-4 py-3">${L('จำนวนลำ','Boats')}</th><th scope="col" class="text-right font-medium px-4 py-3">${L('ความจุสูงสุด','Max guests')}</th><th scope="col" class="text-right font-medium px-4 py-3">${L('ราคาเริ่มต้น','From')}</th></tr></thead>
            <tbody>${types.map(o => `<tr class="border-t border-sand-200"><th scope="row" class="text-left font-normal px-4 py-3">${typeLabel(o.ty)}</th><td class="text-right px-4 py-3 tabular-nums">${o.n}</td><td class="text-right px-4 py-3 tabular-nums">${o.pax}</td><td class="text-right px-4 py-3 tabular-nums">${baht(o.from)}</td></tr>`).join('')}</tbody>
          </table></div>
        </section>
        <section id="guide-routes" class="reveal scroll-mt-24">
          <h3 class="font-display text-xl">${L('เส้นทาง yacht charter ยอดนิยมจากภูเก็ต','Popular yacht charter routes from Phuket')}</h3>
          <ul class="mt-4 divide-y divide-sand-200 ring-1 ring-sand-200">${routes.map(([n,,d]) => `<li><a href="#/fleet" onclick="fleetState.q='${n.split(' ')[0]}'" class="flex items-start justify-between gap-4 p-4 hover:bg-maroon-50 transition"><span><span class="font-medium">${L('เช่าเรือไป','Yacht charter to')} ${n}</span><span class="block text-muted mt-0">${d}</span></span><i data-lucide="arrow-up-right" class="w-4 h-4 text-maroon shrink-0 mt-2"></i></a></li>`).join('')}</ul>
        </section>
        <section id="guide-how" class="reveal scroll-mt-24">
          <h3 class="font-display text-xl">${L('วิธีจอง yacht charter ใน 4 ขั้นตอน','How to book a yacht charter in 4 steps')}</h3>
          <ol class="mt-4 grid sm:grid-cols-2 gap-3">${[[L('เลือกเรือ','Choose a boat'),L('ใช้ Smart Match หรือกรองตามจำนวนคน งบ และเส้นทาง','Use Smart Match or filter by guests, budget and route')],[L('เลือกวันและโปรแกรม','Pick date & program'),L('ระบบแสดงราคาตามฤดูกาลของวันที่คุณเลือก','We show the right seasonal rate for your date')],[L('ส่งคำขอจอง','Send a request'),L('ทีมงานยืนยันคิวเรือภายใน 30 นาที','Our team confirms availability within 30 minutes')],[L('มัดจำ 50%','Pay 50% deposit'),L('โอนผ่านธนาคาร ส่วนที่เหลือชำระก่อนออกเรือ 24 ชม.','Bank transfer; balance due 24 h before departure')]].map(([h,d],i)=>`<li class="p-4 ring-1 ring-sand-200 flex gap-4"><span class="font-display text-2xl text-maroon leading-none">${i+1}</span><span><span class="font-medium block">${h}</span><span class="text-muted">${d}</span></span></li>`).join('')}</ol>
        </section>
      </div>
    </div>
  </div>`;
}
function renderFaq() {
  const el = $('#faq'); if (!el) return;
  const k = LANG === 'en' ? 1 : 0;
  // styles: .fq-* in glass.css; heading reuses .tm-* from the team section
  el.innerHTML = `<div class="max-w-3xl mx-auto px-4 sm:px-6 py-14 lg:py-20" id="guide-faq">
    <div class="text-center"><p class="tm-eyebrow"><i data-lucide="circle-help"></i>FAQ</p>
    <h2 class="tm-title">${L('คำถามที่พบบ่อยเกี่ยวกับ Yacht Charter','Yacht charter FAQ')}</h2></div>
    <div class="fq-list">${FAQ.map(f => `<details class="fq"><summary><h3>${f.q[k]}</h3><span class="fq-ic" aria-hidden="true"><i data-lucide="plus"></i></span></summary><p>${f.a[k]()}</p></details>`).join('')}</div>
  </div>`;
}
function setMeta(name, val, attr = 'name') { let m = document.head.querySelector(`meta[${attr}="${name}"]`); if (!m) { m = document.createElement('meta'); m.setAttribute(attr, name); document.head.appendChild(m); } m.setAttribute('content', val); }
/* overrides from /admin → SEO (window.__SEO__): meta of the fixed pages, robots / canonical / OG title per page.
   ids: s-home, s-fleet, s-blog, s-about, s-privacy, s-terms, s-cookies, b-<boat slug>, a-<post id> */
function seoFinal(id) {
  const S = window.__SEO__; if (!S || !id) return;
  const pick = o => (o && (o.th || o.en) ? homeTxt(o) : '');   // Thai when a translation is missing; fills {boats} {from} …
  const pg = S.pages && S.pages[id];
  if (pg) { const t = pick(pg.t), d = pick(pg.d);
    if (t) { document.title = t; setMeta('og:title', t, 'property'); setMeta('twitter:title', t); }
    if (d) { setMeta('description', d); setMeta('og:description', d, 'property'); setMeta('twitter:description', d); } }
  const x = (S.sx && S.sx[id]) || {};
  setMeta('robots', `${x.index === false ? 'noindex' : 'index'}, ${x.follow === false ? 'nofollow' : 'follow'}, max-image-preview:large`);
  if (x.canon) $('#canonical').href = x.canon;
  const og = pick(x.ogT); if (og) { setMeta('og:title', og, 'property'); setMeta('twitter:title', og); }
}
function applySeo(view, boat) {
  const k = LANG === 'en' ? 'en' : 'th';
  let title = SEO_META[k].title, desc = SEO_META[k].desc, path = '/';
  if (view === 'boat' && boat) { title = `${niceTitle(boat.title)} ${L('เช่าเรือ','Yacht Charter')} ${boat.pattaya ? 'Pattaya' : 'Phuket'} – ${L('เริ่ม','from')} ${baht(boat.from_)} | BTT`; desc = L(`${niceTitle(boat.title)} ${typeLabel(boat.type)} รับได้ ${boat.pax||'-'} คน ออกจาก ${boat.marinaP} ราคาเริ่มต้น ${baht(boat.from_)} รวมกัปตันและประกัน ดูโปรแกรมและราคาทุกฤดูกาล`, `${niceTitle(boat.title)} ${typeLabel(boat.type)} for up to ${boat.pax||'-'} guests from ${boat.marinaP}. From ${baht(boat.from_)} incl. crew & insurance. See every program and seasonal rate.`); path = '/yacht-charter/' + boat.slug;
    // SEO title / description written in /admin win over the template
    title = i18nPick(boat.i18n?.seoTitle, title); desc = i18nPick(boat.i18n?.seoDesc, desc); }
  if (view === 'privacy') { title = L('นโยบายความเป็นส่วนตัว | Boat Trip Thailand','Privacy Policy | Boat Trip Thailand'); desc = L('นโยบายความเป็นส่วนตัวของ Boat Trip Thailand ตาม PDPA: ข้อมูลที่เก็บ วัตถุประสงค์ การเปิดเผย และสิทธิของคุณ','Boat Trip Thailand privacy policy under the PDPA: what we collect, why, who we share it with and your rights.'); path = '/privacy-policy'; }
  if (view === 'terms') { title = L('ข้อกำหนดและเงื่อนไข | Boat Trip Thailand','Terms & Conditions | Boat Trip Thailand'); desc = L('เงื่อนไขการจองเรือ การชำระเงิน การยกเลิก กฎบนเรือ และความรับผิดของ Boat Trip Thailand','Booking, payment, cancellation, on-board rules and liability terms for Boat Trip Thailand charters.'); path = '/terms-and-conditions'; }
  if (view === 'cookies') { title = L('การตั้งค่าคุกกี้ | Boat Trip Thailand','Cookie Preferences | Boat Trip Thailand'); desc = L('เลือกประเภทคุกกี้ที่อนุญาตบนเว็บไซต์ Boat Trip Thailand','Choose which cookies you allow on the Boat Trip Thailand website.'); path = '/cookie-preferences'; }
  if (view === 'about') { title = L('เกี่ยวกับเรา – Boat Trip Thailand | Yacht Charter ภูเก็ต','About Us – Boat Trip Thailand | Yacht Charter Phuket'); desc = L(`รู้จัก Boat Trip Thailand ผู้ให้บริการ yacht charter ภูเก็ต เรือส่วนตัว ${FLEET.length} ลำ ใบอนุญาต ททท. ${SET.tat} ราคาโปร่งใส ทีมงานตอบไวทุกวัน`,`Meet Boat Trip Thailand, a TAT-licensed (${SET.tat}) yacht charter company in Phuket with ${FLEET.length} private boats, transparent pricing and a fast, friendly team.`); path = '/about-us'; }
  if (view === 'fleet') { title = L('เรือทั้งหมด – Yacht Charter ภูเก็ต | BTT','All Boats – Yacht Charter Phuket | BTT'); path = '/yacht-charter'; }
  document.title = title;
  setMeta('description', desc);
  setMeta('og:title', title, 'property'); setMeta('og:description', desc, 'property'); setMeta('og:url', SITE + path, 'property');
  setMeta('og:locale', k === 'en' ? 'en_US' : 'th_TH', 'property');
  setMeta('twitter:title', title); setMeta('twitter:description', desc);
  document.getElementById('canonical').href = SITE + (k === 'en' ? '/en' : '') + (path === '/' ? '/' : path);
  // JSON-LD (FAQ follows the visible language)
  const ld = { '@context':'https://schema.org', '@graph':[
    { '@type':'TravelAgency', '@id':SITE+'/#org', name:'Boat Trip Thailand', alternateName:SET.company, url:SITE+'/', logo:SITE+'/logo.png', image:SITE+'/og/yacht-charter-phuket.jpg', telephone:TEL.slice(4), email:SET.email, slogan:'Sea by Soul',
      address:{ '@type':'PostalAddress', streetAddress:'79/29 Moo 4, Koh Kaew', addressLocality:'Muang Phuket', addressRegion:'Phuket', postalCode:'83000', addressCountry:'TH' }, hasMap:MAP_URL, areaServed:['Phuket','Krabi','Phang Nga'],
      priceRange:`${baht(Math.min(...FLEET.filter(b=>b.from_).map(b=>b.from_)))} – ${baht(Math.max(...FLEET.filter(b=>b.from_).map(b=>b.from_)))}`, knowsAbout:['Yacht charter','Catamaran charter','Speedboat charter','Island hopping'],
      contactPoint: TEAM.map(m => ({ '@type':'ContactPoint', name:m.name, contactType:'sales', telephone:m.tel })) },
    { '@type':'WebSite', '@id':SITE+'/#website', url:SITE+'/', name:'Boat Trip Thailand', inLanguage:['th','en'], publisher:{ '@id':SITE+'/#org' },
      potentialAction:{ '@type':'SearchAction', target:SITE+'/yacht-charter?q={search_term_string}', 'query-input':'required name=search_term_string' } },
    { '@type':'FAQPage', '@id':SITE+'/#faq', mainEntity: FAQ.map(f => ({ '@type':'Question', name:f.q[k==='en'?1:0], acceptedAnswer:{ '@type':'Answer', text:f.a[k==='en'?1:0]() } })) },
    { '@type':'ItemList', '@id':SITE+'/#featured', name:L('เรือแนะนำสำหรับ yacht charter','Featured yacht charters'), itemListElement: FEATURED.map(bySlug).filter(Boolean).map((b,i) => ({ '@type':'ListItem', position:i+1, url:SITE+'/yacht-charter/'+b.slug,
      item:{ '@type':'Product', name:niceTitle(b.title)+' – '+typeLabel(b.type)+' charter', image:SITE+'/boats/'+b.slug+'-hero.webp', brand:{ '@id':SITE+'/#org' },
        offers:{ '@type':'AggregateOffer', priceCurrency:'THB', lowPrice:b.from_, offerCount:b.tables.reduce((n,t)=>n+t.rows.length,0), availability:'https://schema.org/InStock' } } })) },
  ]};
  if (view === 'boat' && boat) ld['@graph'].push({ '@type':'BreadcrumbList', itemListElement:[{ '@type':'ListItem', position:1, name:t('home'), item:SITE+'/' },{ '@type':'ListItem', position:2, name:t('fleet'), item:SITE+'/yacht-charter' },{ '@type':'ListItem', position:3, name:niceTitle(boat.title), item:SITE+path }] });
  document.getElementById('ldjson').textContent = JSON.stringify(ld);
  seoFinal(view === 'boat' && boat ? 'b-' + boat.slug : 's-' + view);
}


/* ---------- Sales team ---------- */
const TEAM = [
  { id:'kwang', name:'Kwang', role:['ฝ่ายขาย','Sales'], tel:'+66835954839', telFmt:'+66 83 595 4839' },
  { id:'save',  name:'Save',  role:['ฝ่ายขาย','Sales'], tel:'+66954205550', telFmt:'+66 95 420 5550' },
  { id:'prang', name:'Prang', role:['ฝ่ายขาย','Sales'], tel:'+66633982865', telFmt:'+66 63 398 2865' },
];
function waLink(m) {
  const b = currentView === 'boat' && bySlug(currentSlug);
  const msg = b ? L(`สวัสดีครับ/ค่ะ คุณ${m.name} สนใจเช่าเรือ ${niceTitle(b.title)}`, `Hi ${m.name}, I'm interested in chartering ${niceTitle(b.title)}.`)
                : L(`สวัสดีครับ/ค่ะ คุณ${m.name} สนใจเช่าเรือยอชต์`, `Hi ${m.name}, I'd like to plan a yacht charter.`);
  return `https://wa.me/${m.tel.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
}
function teamIsOnline() { const ict = new Date(Date.now() + (new Date().getTimezoneOffset() + 420) * 60000), h = ict.getHours() + ict.getMinutes() / 60; return h >= 9 && h < 21; }
function copyTel(tel, name) { const done = () => toast(L(`คัดลอกเบอร์ ${name} แล้ว`, `${name}'s number copied`)); try { navigator.clipboard.writeText(tel).then(done, done); } catch (e) { done(); } }
function renderTeam() {
  const el = $('#team'); if (!el) return;
  const k = LANG === 'en' ? 1 : 0, on = teamIsOnline();
  const faces = TEAM.map(m => `<img src="${TEAM_IMG[m.id]}" alt="" loading="lazy" decoding="async" class="tm-face"/>`).join('');
  // styles: .tm-* in glass.css (liquid glass, same tone as the boat page)
  el.innerHTML = `<div class="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
    <div class="tm-head reveal">
      <div class="max-w-xl">
        <p class="tm-eyebrow"><i data-lucide="life-buoy"></i>${L('ทีมของเรา','Our crew')}</p>
        <h2 id="teamTitle" class="tm-title">${L('คุยกับผู้เชี่ยวชาญ Yacht Charter','Talk to a yacht charter specialist')}</h2>
        <p class="tm-sub">${L('บอกวันที่และจำนวนคน ทีมงานจะช่วยเลือกเรือและเส้นทางที่ลงตัวที่สุด พร้อมราคาจริง ทางโทรศัพท์หรือ WhatsApp','Tell us your date and group size — we will match the right boat and route with real prices, by phone or WhatsApp.')}</p>
      </div>
      <div class="tm-live${on ? ' on' : ''}">
        <span class="tm-faces">${faces}</span>
        <span><b><i class="tm-dot" aria-hidden="true"></i>${on ? L('ออนไลน์ตอนนี้','Online now') : L('ออฟไลน์','Offline')}</b><small>${on ? L('ตอบเฉลี่ยภายใน 30 นาที','Replies within ~30 min') : L('กลับมา 09:00 น. · ฝากข้อความได้','Back at 09:00 · leave a message')}</small></span>
      </div>
    </div>
    <ul class="tm-grid">
      ${TEAM.map((m, i) => `<li class="tm-card${on ? ' on' : ''} reveal" style="transition-delay:${i * 80}ms" itemscope itemtype="https://schema.org/Person">
        <div class="tm-who">
          <span class="tm-av"><img src="${TEAM_IMG[m.id]}" alt="${m.name} – ${m.role[1]}, Boat Trip Thailand" width="56" height="56" loading="lazy" itemprop="image"/><i class="tm-dot" aria-hidden="true"></i></span>
          <span class="min-w-0"><b class="tm-name" itemprop="name">${m.name}</b><small class="tm-role"><span itemprop="jobTitle">${m.role[k]}</span> · ไทย / English</small></span>
        </div>
        <a href="tel:${m.tel}" itemprop="telephone" class="tm-tel tabular-nums">${m.telFmt}</a>
        <div class="tm-acts">
          <a href="${waLink(m)}" target="_blank" rel="noopener" class="tm-wa" aria-label="WhatsApp ${m.name}"><i data-lucide="message-circle"></i>WhatsApp</a>
          <a href="tel:${m.tel}" class="tm-ic" aria-label="${L('โทรหา','Call')} ${m.name}"><i data-lucide="phone"></i></a>
          <button type="button" onclick="copyTel('${m.tel}','${m.name}')" class="tm-ic" aria-label="${L('คัดลอกเบอร์','Copy number')} ${m.name}"><i data-lucide="copy"></i></button>
        </div>
      </li>`).join('')}
    </ul>
    <p class="tm-hours"><i data-lucide="clock-3"></i>${L('ทุกวัน 09:00–21:00 น. (เวลาไทย)','Daily 09:00–21:00 (ICT)')}</p>
  </div>`; icons();
}

/* ---------- Navbar: sliding ink, live team status ---------- */
(() => {
  // sliding ink indicator
  const nav = $('#navLinks'), ink = $('#navInk');
  $$('.nav-a', nav).forEach(a => {
    const move = () => { const r = a.getBoundingClientRect(), p = nav.getBoundingClientRect(); ink.style.left = (r.left - p.left) + 'px'; ink.style.width = r.width + 'px'; ink.style.opacity = 1; };
    a.addEventListener('mouseenter', move); a.addEventListener('focus', move);
  });
  nav.addEventListener('mouseleave', () => { ink.style.opacity = 0; });
})();
function renderTeamLive() {
  const ict = new Date(Date.now() + (new Date().getTimezoneOffset() + 420) * 60000), h = ict.getHours() + ict.getMinutes() / 60;
  const on = h >= 9 && h < 21;
  const faces = TEAM.map((m, i) => `<img src="${TEAM_IMG[m.id]}" alt="" loading="lazy" decoding="async" class="w-6 h-6 rounded-circle object-cover ring-2 ring-white ${i ? '-ml-2' : ''}"/>`).join('');
  const label = on ? L('ทีมออนไลน์ · ตอบใน 30 นาที','Team online · replies in 30 min') : L('กลับมา 09:00 น. · ฝากข้อความได้','Back at 09:00 · leave a message');
  const dot = `<span class="live-dot w-1.5 h-1.5 rounded-circle ${on ? 'bg-maroon text-maroon' : 'bg-line-strong text-line-strong'}"></span>`;
  $('#teamLive').innerHTML = `<span class="flex">${faces}</span>${dot}<span class="text-xs text-muted whitespace-nowrap">${label}</span>`;
  $('#teamLiveM').innerHTML = `<span class="flex items-center gap-2"><span class="flex">${faces}</span>${dot}${label}</span>`;
}
function renderNavText() {
  $('#navGuide').textContent = L('บทความ','Blog');
  $$('.navGuideM').forEach(e => e.textContent = L('บทความ','Blog'));
  $$('.navAbout').forEach(e => e.textContent = L('เกี่ยวกับเรา','About us'));
  $$('.legalPrivacy').forEach(e => e.textContent = L('นโยบายความเป็นส่วนตัว','Privacy Policy'));
  $$('.legalTerms').forEach(e => e.textContent = L('ข้อกำหนดและเงื่อนไข','Terms & Conditions'));
  $$('.legalCookies').forEach(e => e.textContent = L('การตั้งค่าคุกกี้','Cookie Preferences'));
  if (typeof renderCookieBar === 'function') renderCookieBar();
  $('#navSearchLbl').textContent = L('ค้นหาเรือ','Search');
}
setInterval(renderTeamLive, 60000);

/* =========================================================
   ROUTER  (#/ · #/fleet · #/boat/:slug · in-page anchors)
   ========================================================= */
let currentSlug = null, currentView = 'home';
function showView(name) {
  currentView = name;
  $$('#navLinks .nav-a').forEach(a => a.classList.remove('is-active'));
  { const m = { fleet:'#navFleet', boat:'#navFleet', about:'#navLinks a[href="#/about"]', blog:'#navGuide' }[name]; m && $(m)?.classList.add('is-active'); }
  setTimeout(renderTeam, 0);
  ['home','fleet','boat','about','legal','design','blog','dest','nf'].forEach(n => $('#view-'+n).classList.toggle('hidden', n !== name));
  $('#floatCta').classList.toggle('!hidden', name === 'boat' || name === 'home');
}
/* =========================================================
   BLOG  (#/blog · #/blog/<slug>) — articles from the CMS
   ========================================================= */
const POSTS = window.POSTS || [];
setTimeout(() => document.querySelectorAll('img[data-pid]').forEach(im => { if (im.complete && !im.naturalWidth && window.pFallbackImg) { im.dataset.fb = 1; im.src = pFallbackImg(+im.dataset.pid); } }), 0);
/* admin preview (?preview=<id>): the article may be a draft, so it is not in the published list yet */
if (window.__PREVIEW__) { const i = POSTS.findIndex(x => x.id === window.__PREVIEW__.id); if (i >= 0) POSTS.splice(i, 1); POSTS.unshift(window.__PREVIEW__); }
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
const miniBoat = b => `<a href="#/boat/${b.slug}" class="post-boat"><img src="${bimg(b.slug, 'a', 320)}" alt="${esc(niceTitle(b.title))}" loading="lazy"/><span class="min-w-0"><b>${niceTitle(b.title)}</b><small>${typeLabel(b.type)} · ${b.pax || '-'} ${t('guests')}</small><em>${t('price.from', 'เริ่มต้น')} ${b.from_ ? baht(b.from_) : '—'}</em></span><i data-lucide="arrow-right" class="w-4 h-4 shrink-0 text-maroon"></i></a>`;
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
      <button onclick="BL.cat='${p.cat}';VH.hash='#/blog'" class="mt-6 text-[11px] uppercase tracking-[.18em] text-maroon">${c[k]}</button>
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
  seoFinal('a-' + p.id);
}
function seoBlog() { const k = plang(), title = L('บทความ คู่มือเช่าเรือยอชต์ภูเก็ต & เส้นทางเกาะ | Boat Trip Thailand', 'Phuket Yacht Charter Guides & Island Routes | Boat Trip Thailand'); document.title = title; setMeta('description', L('รวมบทความเช่าเรือยอชต์ภูเก็ต ราคา เส้นทางเกาะ ช่วงเวลาที่ดีที่สุด และไอเดียจัดทริปบนเรือ', 'Phuket yacht charter guides: prices, island routes, best time to go and ideas for your day at sea.')); setMeta('og:title', title, 'property'); $('#canonical').href = SITE + (k === 'en' ? '/en' : '') + '/blog'; setMeta('robots', BL.q ? 'noindex, follow' : 'index, follow'); }
{ const _sb = seoBlog; seoBlog = function () { _sb(); if (!BL.q) seoFinal('s-blog'); }; }   // search results stay noindex
/* home: latest articles strip */
function renderHomeBlog() {
  const el = $('#homeBlog'); if (!el) return; const L3 = postsVisible().slice(0, 3); if (!L3.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-20"><div class="flex items-end justify-between gap-4 mb-8"><div><p class="text-xs uppercase tracking-[.2em] text-maroon">${L('บทความ', 'From the blog')}</p><h2 class="font-display text-2xl sm:text-3xl text-ink mt-2">${L('คู่มือ & ไอเดียทริปทะเล', 'Guides & trip ideas')}</h2></div><a href="#/blog" class="text-sm text-maroon inline-flex items-center gap-1 shrink-0">${L(`ดูทั้งหมด ${postsVisible().length} บทความ`, `All ${postsVisible().length} articles`)}<i data-lucide="arrow-right" class="w-4 h-4"></i></a></div><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${L3.map(p => postCard(p)).join('')}</div></div>`;
  icons();
}

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
        <img src="${rs(d.hero)}" alt="${dl(d.name)}" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"/>
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
    <img src="${rs(d.hero, 1600)}" srcset="${rs(d.hero)} 768w, ${rs(d.hero, 1280)} 1280w, ${rs(d.hero, 1600)} 1600w" sizes="100vw" alt="" class="absolute inset-0 w-full h-full object-cover"/>
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

function route(keepScroll) { bpSheetOff(); try { return route0(keepScroll); } finally { afterRoute(); pageView(); setTimeout(liveBeat, 0); } }   // heartbeat in its own task, after the page is drawn
/* cookieless page-view counter (/api/t → /admin วิเคราะห์เว็บไซต์): page, traffic source, device and language only —
   no cookies, no visitor id. The source is decided on the first page of a browser session and kept for that session. */
let PV_LAST = '';
function pvSource() {
  try { const s = sessionStorage.getItem('btt_src'); if (s) return [s, false]; } catch { /* private mode */ }
  const q = new URLSearchParams(location.search), u = (q.get('utm_source') || '').toLowerCase(), m = (q.get('utm_medium') || '').toLowerCase(), paid = /cpc|ppc|paid|ads?$/.test(m);
  let r = ''; try { r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch { /* bad referrer */ }
  if (r === location.hostname.replace(/^www\./, '')) r = '';
  const by = x => /google/.test(x) ? 'google' : /bing/.test(x) ? 'bing' : /facebook|fb\.|^fb$|meta/.test(x) ? 'facebook' : /instagram|^ig$/.test(x) ? 'instagram' : /line\.me|lin\.ee|^line$/.test(x) ? 'line'
    : /tiktok/.test(x) ? 'tiktok' : /youtube|youtu\.be/.test(x) ? 'youtube' : /chatgpt|openai|perplexity|claude|gemini|copilot/.test(x) ? 'ai' : /mail|newsletter/.test(x) ? 'email' : '';
  let s = q.get('gclid') || (paid && /google/.test(u)) ? 'google-ads' : (paid && /facebook|fb|meta|instagram|ig/.test(u)) ? 'facebook-ads' : u ? (by(u) || 'other') : q.get('fbclid') ? 'facebook-ads' : r ? (by(r) || 'referral') : 'direct';
  try { sessionStorage.setItem('btt_src', s); } catch { /* private mode */ }
  return [s, true];
}
function pageView() {
  if (navigator.userAgent === 'BTT-SSR' || typeof navigator.sendBeacon !== 'function' || new URLSearchParams(location.search).has('preview')) return;
  const p = (VHASH === '#/404' ? '404:' : '') + location.pathname;
  if (p === PV_LAST) return; PV_LAST = p;
  const [s, f] = pvSource(), w = innerWidth, touch = matchMedia('(pointer: coarse)').matches;
  try { navigator.sendBeacon('/api/t', JSON.stringify({ p, s, f, d: w < 768 ? 'mobile' : touch && w < 1200 ? 'tablet' : 'desktop', l: LANG === 'en' ? 'en' : 'th' })); } catch { /* never block the page */ }
}
/* "ออนไลน์ตอนนี้" (/api/live → /admin): a heartbeat every 30 s while this tab is visible. The id is random and lives
   only in this tab (sessionStorage) — no cookie, nothing that identifies a person. A tab silent for 5 min stops counting. */
let LIVE_ID = '';
function liveBeat() {
  if (navigator.userAgent === 'BTT-SSR' || typeof navigator.sendBeacon !== 'function' || document.hidden || new URLSearchParams(location.search).has('preview')) return;
  if (!LIVE_ID) { try { LIVE_ID = sessionStorage.getItem('btt_live') || ''; } catch { /* private mode */ }
    if (!LIVE_ID) { LIVE_ID = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); try { sessionStorage.setItem('btt_live', LIVE_ID); } catch { /* private mode */ } } }
  const w = innerWidth, touch = matchMedia('(pointer: coarse)').matches, h = typeof VHASH === 'string' ? VHASH : '';
  const b = h.startsWith('#/boat/') ? h.slice(7).split(/[?#/]/)[0] : '';
  const f = !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('#modalFormWrap, #inlineFormWrap')) || !!(document.getElementById('bookingModal') && !document.getElementById('bookingModal').classList.contains('hidden'));   // a class check, not offsetParent (that forces a full layout)
  let s = 'direct'; try { s = sessionStorage.getItem('btt_src') || 'direct'; } catch { /* private mode */ }
  try { navigator.sendBeacon('/api/live', JSON.stringify({ v: LIVE_ID, p: location.pathname, s, d: w < 768 ? 'mobile' : touch && w < 1200 ? 'tablet' : 'desktop', l: LANG === 'en' ? 'en' : 'th', b, f })); } catch { /* never block the page */ }
}
if (navigator.userAgent !== 'BTT-SSR' && typeof setInterval === 'function' && typeof document.addEventListener === 'function') {
  setInterval(liveBeat, 30_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) liveBeat(); });
  document.addEventListener('focusin', e => { if (e.target && e.target.closest && e.target.closest('#modalFormWrap, #inlineFormWrap') && !liveBeat.f) { liveBeat.f = 1; liveBeat(); } });
}
function route0(keepScroll) {
  if (window.fbq && route.done) fbq('track', 'PageView'); route.done = 1; attrPage();
  const h = VH.hash || '#/';
  if (!keepScroll) routeProgress();
  if (h.startsWith('#/boat/')) trackRecent(decodeURIComponent(h.slice(7)));
  if (!/^#\/(boat|fleet|design|about|privacy|terms|cookies|blog|dest|404)/.test(h)) setTimeout(renderRecent, 0);
  if (h.startsWith('#/boat/')) { currentSlug = decodeURIComponent(h.slice(7)); showView('boat'); renderDetail(currentSlug); applySeo('boat', bySlug(currentSlug)); if (!keepScroll) scrollTo(0,0); return; }
  if (h === '#/design') { showView('design'); renderDesign(); document.title = 'Design System — Boat Trip Thailand'; setMeta('robots','noindex, follow'); if (!keepScroll) scrollTo(0,0); return; }
  if (/^#\/(privacy|terms|cookies)$/.test(h)) { const k = h.slice(2); showView('legal'); renderLegal(k); applySeo(k); renderCookieBar(); if (!keepScroll) scrollTo(0,0); return; }
  if (h.startsWith('#/dest/')) { showView('dest'); renderDest(decodeURIComponent(h.slice(7))); if (!keepScroll) scrollTo(0,0); return; }
  if (h === '#/destinations') { showView('dest'); renderDestIndex(); if (!keepScroll) scrollTo(0,0); return; }
  if (h === '#/404') { showView('nf'); renderNotFound(); if (!keepScroll) scrollTo(0,0); return; }
  if (h.startsWith('#/blog/')) { showView('blog'); renderPost(decodeURIComponent(h.slice(7))); if (!keepScroll) scrollTo(0,0); return; }
  if (h === '#/blog' || h.startsWith('#/blog?')) { showView('blog'); renderBlog(); seoBlog(); if (!keepScroll) scrollTo(0,0); return; }
  setMeta('og:type','website','property');
  if (h === '#/about') { showView('about'); renderAbout(); applySeo('about'); if (!keepScroll) scrollTo(0,0); return; }
  if (h.startsWith('#/fleet')) { showView('fleet'); renderFleetPage(); applySeo('fleet'); if (!keepScroll) scrollTo(0,0); return; }
  const wasOther = currentView !== 'home';
  showView('home'); applySeo('home');
  if (h === '#/' || h === '#') { if (!keepScroll) scrollTo(0,0); return; }
  const el = document.getElementById(h.slice(1));
  if (el && !keepScroll) setTimeout(() => el.scrollIntoView({behavior: wasOther ? 'auto' : 'smooth'}), wasOther ? 30 : 0);
}
window.addEventListener('btt:nav', () => { if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(() => route(false)); else route(false); });
$('#cmdInput').addEventListener('input', e => drawCmd(e.target.value));
$('#cmdClear').addEventListener('click', () => { $('#cmdInput').value=''; drawCmd(''); $('#cmdInput').focus(); });
$('#cmdInput').addEventListener('keydown', e => { if (e.key==='ArrowDown') { e.preventDefault(); cmdIdx=Math.min(cmdItems.length-1,cmdIdx+1); paintCmd(); $('#cmd-'+cmdIdx)?.scrollIntoView({block:'nearest'}); } if (e.key==='ArrowUp') { e.preventDefault(); cmdIdx=Math.max(0,cmdIdx-1); paintCmd(); $('#cmd-'+cmdIdx)?.scrollIntoView({block:'nearest'}); } if (e.key==='Enter') { e.preventDefault(); runCmd(cmdIdx); } });

$$('[data-bimg]').forEach(img => { const [s,k] = img.dataset.bimg.split(':'); img.src = bimg(s,k); });
$('#boatSort').onchange = e => { boatSort = e.target.value; renderBoats(); };
const d = new Date(); d.setDate(d.getDate()+3); $('#qsDate').value = d.toISOString().split('T')[0]; $('#qsDate').min = new Date().toISOString().split('T')[0]; $('#qsDate').addEventListener('change', e => e.target.dataset.touched = 1); datePick($('#qsDate'));
const HOME_FIRST = !/^#\/(boat|fleet|design|about|privacy|terms|cookies|blog|dest|404)/.test(VH.hash || '#/');
applyI18n(); if (HOME_FIRST) renderAll(); else { renderNavText(); updateCompareUI(); }
inlineForm = buildForm($('#inlineFormWrap')); route(false); icons(); loadPixel();
if (!HOME_FIRST) renderHomeLater();
