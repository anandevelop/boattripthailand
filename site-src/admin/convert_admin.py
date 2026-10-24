"""
Admin UI = the approved admin mockup (site-src/admin/adm*.js + admin_*.html), wired to the real system.
  python3 site-src/admin/convert_admin.py   →  site/admin-shell.html, public/admin-app/app.js
then `npm run build:admin` (Tailwind) — `npm run build` does both.
Patches below remove sample data / the demo login and load everything from window.__BOOT__ (sent by the
server for the signed-in user, already scoped by role). adm20.js sends every change to /api/admin/*.
"""
import re, pathlib
H = pathlib.Path(__file__).resolve().parent
R = H.parent.parent
rd = lambda n: (H / n).read_text()

def must(s, a, b, n=1):
    c = s.count(a)
    assert c == n, (a[:90], c)
    return s.replace(a, b)

def cut(s, start, end, repl=''):
    """replace from `start` up to (not including) `end`"""
    i = s.index(start); j = s.index(end, i)
    return s[:i] + repl + s[j:]

# ---------------- scripts ----------------
a1 = rd('adm1.js')
a1 = must(a1, "const fmtD = s => { const d = new Date(s + 'T00:00:00');", "const fmtD = s => { if (!s) return '—'; const d = new Date(s + 'T00:00:00');")
a1 = must(a1, "b.active = true; b.featured = ['leopard-90-ft', 'splo-74-ft', 'vtech-68-ft', 'the-origin-90-ft', 'cognac-75-ft', 'siam-princess-70-ft'].includes(b.slug);", "if (b.active == null) b.active = true; b.featured = !!b.featured;")
a1 = cut(a1, 'const TEAM = [', 'const STATUS = {', 'const TEAM = BOOT.team;\n')
a1 = cut(a1, 'const CUSTOMERS = Array.from(', 'const custOf = ', 'const CUSTOMERS = BOOT.customers;\nconst BOOKINGS = BOOT.leads;\n')

src = (R / 'site-src/mockup.html').read_text()
acts = src[src.index('const ACTS = ['):src.index('];', src.index('const ACTS = [')) + 2]
acts = re.sub(r",\s*img:IMG\.\w+", '', acts)[len('const ACTS = '):-1]
a2 = rd('adm2.js')
a2 = must(a2, '__ACTS__', acts)
a2 = must(a2, '\nroute();\n', '\n')
a2 = must(a2, "$('#meAva').src = TEAM_IMG.kwang;", "$('#meAva').src = TEAM_IMG[BOOT.me.id] || '';")

a4 = rd('adm4.js').replace('au = TEAM.find(x => x.id === a.author);', "au = TEAM.find(x => x.id === a.author) || { name: a.wpAuthor || 'ทีม Boat Trip Thailand' };")
assert a4.count('a.wpAuthor ||') == 2
a4 = a4.replace('${TEAM_IMG[a.author]}', '${TEAM_IMG[a.author] || initialsAva(au.name)}')
a8 = must(rd('adm8.js'), '/*__SEASON_ENGINE__*/', (R / 'site-src/season_engine.js').read_text())

a14 = rd('adm14.js')
a14 = re.sub(r"\nTEAM\.forEach\(\(t, i\) => Object\.assign\(t, \{[^\n]*\n",
             "\nTEAM.forEach(t => { t.full ??= ''; t.wa ??= ''; t.line ??= ''; t.langs ??= ['ไทย']; t.showWeb ??= false; t.leads ??= true; t.active ??= true; t.perms ??= null; t.bio ??= tr('', ''); t.title ??= tr('ฝ่ายขาย', 'Sales'); });\n", a14, count=1)
assert "t.title ??= tr(" in a14

a16 = re.sub(r"\n\(function seedFaq\(\) \{[^\n]*\n", "\n", rd('adm16.js'), count=1)
assert 'seedFaq' not in a16

a17 = rd('adm17.js').rstrip()
a17 = a17.removesuffix('route();')
a17 = must(a17, "(function importWP() {\n  if (!WP.arts.length) return;\n  ART.length = 0;", "(function importWP() {\n  ART.length = 0; REDIR.length = 0;")

a19 = rd('adm19.js')
a19 = must(a19, '(function migrate() {', '(function migrate() { if (window.__BOOT__) return;')
a19 = must(a19, "direct: ['เข้าเว็บโดยตรง', 'globe', '#6b5e60'] };", "direct: ['เข้าเว็บโดยตรง', 'globe', '#6b5e60'], phone: ['โทรศัพท์', 'phone-call', '#6b5e60'], other: ['เว็บไซต์อื่น', 'link', '#6b5e60'] };")
a19 = must(a19, "function leadScore(l) {\n", "function leadScore(l) {\n  if (typeof l.score === 'number') { const s = l.score; return { s, r: l.scoreReasons || [], t: s >= 60 ? 'hot' : s >= 35 ? 'warm' : 'cold' }; }\n")

a19 = must(a19, "const users30 = typeof SER !== 'undefined' ? sum(SER.users.slice(-30)) : 0,", "const users30 = 0 /* needs GA4 — sample traffic is not mixed with real leads */,")
a19 = must(a19, "const boatName = s => bySlug(s)?.name || s;", "const boatName = s => bySlug(s)?.name || (s && s.startsWith('act:') ? 'กิจกรรม · ' + s.slice(4) : s) || 'ยังไม่ระบุเรือ';")
a18 = rd('adm18.js')
a18 = cut(a18, '/* ---------- demo users for the other roles ---------- */', '/* ---------- permissions ---------- */')
a18 = cut(a18, '(function seedAudit() {', '/* ---------- session ---------- */')
a18 = must(a18, "const AUDIT = []; let _ah = '00000000';", "const AUDIT = BOOT.audit; let _ah = '00000000';")
a18 = must(a18, "const ev = AUDIT.filter(e => e.ent === 'booking' && e.ref === id);", "const ev = [];")
a18 = must(a18, "const userName = id => id === '—' ? 'ไม่ระบุตัวตน' : TEAM.find(t => t.id === id)?.name || id;", "const userName = id => id === '—' ? 'ระบบ / ไม่ระบุตัวตน' : TEAM.find(t => t.id === id)?.name || (BOOT.names || {})[id] || id;")
a18 = must(a18, "${e.ip}${e.sample ? '' : ' (จำลอง)'}", "${esc(e.ip || '—')}")
a18, n = re.subn(r'<p class="text-\[11px\] text-muted mt-3">รายการที่มีป้าย[^<]*</p>', '<p class="text-[11px] text-muted mt-3">ทุกรายการบันทึกโดยเซิร์ฟเวอร์ (เวลา ผู้ใช้ IP อุปกรณ์) · แก้ไขหรือลบไม่ได้แม้แต่ผู้ดูแลระบบ</p>', a18)
assert n == 1, n
a18 = re.sub(r"\n/\* restore session \(same tab\) or show login \*/\n\(function \(\) \{ const s = sGet\(\)[^\n]*\n", "\n", a18)
assert 'const s = sGet(), u = s' not in a18

boot = """/* data for the signed-in user — sent by the server, already scoped by role */
const BOOT = window.__BOOT__;
window.FLEET = BOOT.fleet; window.THUMBS = BOOT.thumbs; window.TEAM_IMG = BOOT.teamImg; window.SEASONS = BOOT.seasons; window.ACTIMG = BOOT.actimg; window.WPDATA = BOOT.wp;
"""
js = boot + '\n'.join([a1, a2, rd('adm3.js'), a4, rd('adm5.js'), rd('adm6.js'), rd('adm7.js'), a8, rd('adm9.js'), rd('adm10.js'), rd('adm11.js'), rd('adm12.js'), rd('adm13.js'), a14, rd('adm15.js'), a16, a17, a19, a18,
                          "showLogin = function () { location.href = '/admin/login'; };", rd('adm20.js')])

# ---------------- shell ----------------
head = rd('admin_head.html')
head = re.sub(r'<script src="https://cdn\.tailwindcss\.com[^"]*"></script>\s*<script>\s*tailwind\.config = .*?</script>', '<link rel="stylesheet" href="/admin-app/tw.css?v=__V__" />', head, count=1, flags=re.S)
head = must(head, '<script>/*LUCIDE_INLINE*/</script>', '<script src="/site/lucide.min.js?v=__V__"></script>')
head = must(head, 'href="data:image/png;base64,FAV_B64"', 'href="/icon.png"')
css = head[head.index('<style>') + 7: head.index('</style>')]
head = head[:head.index('<style>')] + head[head.index('</style>') + 8:]
head = must(head, '<link rel="stylesheet" href="/admin-app/tw.css?v=__V__" />', '<link rel="stylesheet" href="/admin-app/admin.css?v=__V__" />\n<link rel="stylesheet" href="/admin-app/tw.css?v=__V__" />\n<link rel="stylesheet" href="/admin-app/glass.css?v=__V__" />')
head = must(head, '<title>BTT Admin – ระบบหลังบ้าน Boat Trip Thailand</title>', '<title>ระบบหลังบ้าน · Boat Trip Thailand</title>')
body = rd('admin_body.html')
body = must(body, 'src="data:image/png;base64,LOGON_B64"', 'src="/brand/logo.png"')
body = re.sub(r'\s*<div class="px-4 sm:px-6 py-2 text-\[11px\] text-muted bg-\[#fff8e6\][^\n]*</div>', '', body, count=1)
body = must(body, '<a href="boattripthailand-mockup.html" target="_blank"', '<a href="/" target="_blank" rel="noopener"')
body = must(body, '<script>window.FLEET=__FLEET__;window.THUMBS=__THUMBS__;window.TEAM_IMG=__TEAMIMG__;window.SEASONS=__SEASONS__;window.ACTIMG=__ACTIMG__;window.WPDATA=__WPDATA__;</script>\n<script src="admin.js"></script>',
            '<script>window.__BOOT__=/*BOOT_JSON*/null;</script>\n<script src="/admin-app/app.js?v=__V__"></script>')
assert 'Mockup ระบบหลังบ้าน' not in body
(R / 'site/admin-shell.html').write_text(head + body)
(R / 'public/admin-app').mkdir(parents=True, exist_ok=True)
(R / 'public/admin-app/app.js').write_text(js)
(R / 'public/admin-app/admin.css').write_text(css)
print('ok', len(head + body), len(js))
