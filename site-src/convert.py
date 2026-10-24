"""
One-time conversion of the approved HTML mockup into the production site files.
  site-src/mockup.html + blog.js + season_engine.js  →  site/shell.html, site/mockup.css, public/site/app.js
After conversion, edit site/* and public/site/app.js directly (this script is kept for reference).
"""
import re, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
src = (R / 'site-src/mockup.html').read_text()
blog = (R / 'site-src/blog.js').read_text()
season = (R / 'site-src/season_engine.js').read_text()
nav = (R / 'site-src/nav-layer.js').read_text()
dest = (R / 'site-src/dest.js').read_text()

def must(s, a, b, n=1):
    c = s.count(a)
    assert c == n, (a[:80], c)
    return s.replace(a, b)

# ---------------- split ----------------
style = src[src.index('<style>') + 7: src.index('</style>')]
head_meta = src[src.index('<head>') + 6: src.index('<script src="https://cdn.tailwindcss.com')]
body_start = src.index('<body')
data_line = src.index('<script>window.TEAM_IMG=')
body = src[body_start: data_line]
script_start = src.index('<script>', data_line + 10) + 8
script = src[script_start: src.rindex('</script>')]

# ---------------- head ----------------
head_meta = must(head_meta, '<link rel="icon" type="image/png" href="data:image/png;base64,FAV_B64" />', '<link rel="icon" type="image/png" href="/icon.png" />')
head_meta = head_meta.replace('https://www.boattripthailand.com/og/yacht-charter-phuket.jpg', 'https://www.boattripthailand.com/boats/leopard-90-ft-hero.webp')
head = ('<!DOCTYPE html>\n<html lang="th" class="scroll-smooth">\n<head>' + head_meta +
        '<link rel="stylesheet" href="/site/mockup.css?v=__V__" />\n<link rel="stylesheet" href="/site/tw.css?v=__V__" />\n</head>\n')

# ---------------- body ----------------
body = body.replace('data:image/png;base64,LOGON_B64', '/brand/logo.png')
body = must(body, '<div id="view-blog" class="hidden"></div>', '<div id="view-blog" class="hidden"></div>\n<div id="view-dest" class="hidden"></div>\n<div id="view-nf" class="hidden"></div>')
# footer: remove mockup/dev-only line
body = re.sub(r'\s*<p><a href="#/design"[^\n]*?</p>', '', body)
# real chat links (numbers already shown in the design)
body = must(body, '<a href="#" class="flex items-center gap-4 bg-white rounded-lg p-4 ring-1 ring-sand-200 hover:ring-maroon/40 transition"><span class="w-12 h-12 rounded-xl bg-maroon text-white grid place-items-center"><i data-lucide="message-circle"', '<a href="https://line.me/R/ti/p/@boattripthailand" target="_blank" rel="noopener" class="flex items-center gap-4 bg-white rounded-lg p-4 ring-1 ring-sand-200 hover:ring-maroon/40 transition"><span class="w-12 h-12 rounded-xl bg-maroon text-white grid place-items-center"><i data-lucide="message-circle"')
body = must(body, '<a href="#" class="flex items-center gap-4 bg-white rounded-lg p-4 ring-1 ring-sand-200 hover:ring-maroon/40 transition"><span class="w-12 h-12 rounded-xl bg-maroon text-white grid place-items-center"><i data-lucide="smartphone"', '<a href="https://wa.me/66611725854" target="_blank" rel="noopener" class="flex items-center gap-4 bg-white rounded-lg p-4 ring-1 ring-sand-200 hover:ring-maroon/40 transition"><span class="w-12 h-12 rounded-xl bg-maroon text-white grid place-items-center"><i data-lucide="smartphone"')
body += '<script id="btt-data">__DATA__</script>\n<script src="/site-data.js?v=__DV__"></script>\n<script src="/site/lucide.min.js?v=__V__"></script>\n<script src="/site/app.js?v=__V__"></script>\n</body>\n</html>\n'

# ---------------- script ----------------
s = script
s = must(s, '/*__SEASON_ENGINE__*/', season)
s = must(s, '/*__BLOG__*/', blog + '\n' + dest)
s = must(s, "let LANG = 'th';", "let LANG = window.__LANG__ || 'th';")
s = s.replace('location.hash', 'VH.hash')
s = s.replace("addEventListener('hashchange'", "addEventListener('btt:nav'")
s = must(s, "const PIXEL_ID = '';", "const PIXEL_ID = (window.__CFG__ || {}).pixel || '';")
s = must(s, "(() => { const s = document.createElement('style'); s.textContent = SZ_CSS; document.head.appendChild(s); })();", "(() => { if (document.getElementById('sz-css')) return; const s = document.createElement('style'); s.id = 'sz-css'; s.textContent = SZ_CSS; document.head.appendChild(s); })();")
# lead form → real API
s = must(s, """    console.log('[BTT] lead payload →', payload); // POST /api/leads (Next.js) → admin “ลีด” + Meta CAPI / Google Ads (same event_id as the Pixel)
    setTimeout(() => { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = label; form.reset(); closeModals(); toast(t('sent')); }, 900);""",
"""    payload.lang = LANG; payload.t = Date.now() - (form._shownAt || 0); payload.adults = +(payload.adults || 0); payload.children = +(payload.kids || 0); payload.message = payload.note || ''; delete payload.kids; delete payload.note; delete payload.marketing;
    const done = ok => { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = label; if (ok) { form.reset(); closeModals(); } };
    fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(r => r.json().then(j => ({ ok: r.ok && j.ok, j })))
      .then(({ ok, j }) => { done(ok); toast(ok ? t('sent') + (j.ref ? ' · ' + j.ref : '') : L('ส่งไม่สำเร็จ กรุณาลองใหม่ หรือทักเราทาง WhatsApp / LINE', 'Could not send. Please try again or message us on WhatsApp / LINE.')); })
      .catch(() => { done(false); toast(L('ส่งไม่สำเร็จ กรุณาลองใหม่ หรือทักเราทาง WhatsApp / LINE', 'Could not send. Please try again or message us on WhatsApp / LINE.')); });""")
s = must(s, "  form.addEventListener('submit', e => {\n    e.preventDefault();\n    const req", "  form._shownAt = Date.now();\n  form.addEventListener('submit', e => {\n    e.preventDefault();\n    const req")
# language buttons change the URL
s = must(s, "$$('.lang-btn').forEach(b => b.onclick = () => { if (b.dataset.lang !== LANG) { setLang(b.dataset.lang); toast(t('toastLang')); } });",
            "$$('.lang-btn').forEach(b => b.onclick = () => { if (b.dataset.lang !== LANG) { const l = b.dataset.lang; history.pushState(null, '', hashToPath(VH.hash, l)); setLang(l); toast(t('toastLang')); } });")
# extra views in the router
s = must(s, "['home','fleet','boat','about','legal','design','blog'].forEach(n => $('#view-'+n)", "['home','fleet','boat','about','legal','design','blog','dest','nf'].forEach(n => $('#view-'+n)")
s = must(s, "  if (h.startsWith('#/blog/')) { showView('blog');", "  if (h.startsWith('#/dest/')) { showView('dest'); renderDest(decodeURIComponent(h.slice(7))); if (!keepScroll) scrollTo(0,0); return; }\n  if (h === '#/destinations') { showView('dest'); renderDestIndex(); if (!keepScroll) scrollTo(0,0); return; }\n  if (h === '#/404') { showView('nf'); renderNotFound(); if (!keepScroll) scrollTo(0,0); return; }\n  if (h.startsWith('#/blog/')) { showView('blog');")
s = must(s, "if (!/^#\\/(boat|fleet|design|about|privacy|terms|cookies|blog)/.test(h))", "if (!/^#\\/(boat|fleet|design|about|privacy|terms|cookies|blog|dest|404)/.test(h))")
# after every route: real hrefs + hreflang
s = must(s, "function route(keepScroll) {", "function route(keepScroll) { try { return route0(keepScroll); } finally { afterRoute(); } }\nfunction route0(keepScroll) {")
s = must(s, """return `<a href="#boats" onclick="quickDest('${r[0]}')" class="rt-card""", """return `<a href="${destSlugOf(r[0]) ? '#/dest/' + destSlugOf(r[0]) : '#boats'}" onclick="${destSlugOf(r[0]) ? '' : `quickDest('${r[0]}')`}" class="rt-card""")
# applyI18n: linkedom dataset bug with "i18n" + keep the original Thai in the DOM so an English SSR page can switch back to Thai
s = must(s, """    const k = el.dataset.i18n;
    if (!(k in TH_CACHE)) TH_CACHE[k] = el.textContent;""", """    const k = el.getAttribute('data-i18n');
    if (!(k in TH_CACHE)) TH_CACHE[k] = el.hasAttribute('data-th') ? el.getAttribute('data-th') : el.textContent;
    el.setAttribute('data-th', TH_CACHE[k]);""")
s = must(s, """    const k = el.dataset.i18nHtml;
    if (!(k in TH_CACHE)) TH_CACHE[k] = el.innerHTML;""", """    const k = el.getAttribute('data-i18n-html');
    if (!(k in TH_CACHE)) TH_CACHE[k] = el.hasAttribute('data-th') ? el.getAttribute('data-th') : el.innerHTML;
    el.setAttribute('data-th', TH_CACHE[k]);""")
s = must(s, """    const k = 'ph:' + el.dataset.i18nPh;
    if (!(k in TH_CACHE)) TH_CACHE[k] = el.placeholder;""", """    const k = 'ph:' + el.getAttribute('data-i18n-ph');
    if (!(k in TH_CACHE)) TH_CACHE[k] = el.hasAttribute('data-th-ph') ? el.getAttribute('data-th-ph') : el.placeholder;
    el.setAttribute('data-th-ph', TH_CACHE[k]);""")
s = must(s, "current_page: VH.hash || '#/'", "current_page: location.pathname")
s = must(s, "landing: location.pathname + VH.hash", "landing: location.pathname + location.search")
s = nav + '\n' + s
(R / 'public/site/mockup.css').write_text(style)
(R / 'site/shell.html').write_text(head + body)
(R / 'public/site/app.js').write_text(s)
print('ok', len(head + body), len(s))
