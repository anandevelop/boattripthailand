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
const SITE_ORIGIN = (window.__CFG__ || {}).site || 'https://www.boattripthailand.com';
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
