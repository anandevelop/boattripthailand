# Liquid Glass — คู่มือสำหรับโปรเจกต์ boattripthailand

คู่มือนี้เขียนจากไฟล์จริงในโฟลเดอร์ `boattripthailand` (Next.js 15.5 + Tailwind 3.4) ณ วันที่ 21 ต.ค. 2569
เลขบรรทัดอ้างอิงจากไฟล์ ณ วันนั้น ถ้าไฟล์ถูกแก้ภายหลัง ให้ค้นด้วยข้อความในตัวอย่างแทนเลขบรรทัด

**ระดับ:** พอดี ๆ — กระจกเฉพาะของที่ลอยเหนือเนื้อหา ส่วนที่ต้องอ่าน (การ์ดเรือ ราคา บทความ ตาราง) คงพื้นทึบ

---

## 0. ต้องรู้ก่อนแก้ — โปรเจกต์นี้ไม่ได้ใช้ React component สำหรับหน้าเว็บ

| ส่วน | หน้าตามาจาก | ใครส่งหน้าให้ผู้ใช้ |
|---|---|---|
| หน้าเว็บลูกค้า | `site/shell.html` (โครง HTML) + `public/site/app.js` (สร้างการ์ด/ป๊อปอัป/แถบคุกกี้) + `public/site/mockup.css` + `public/site/tw.css` | `src/app/[[...path]]/route.ts` → `src/lib/site-render.ts` |
| หลังบ้าน `/admin` | `site/admin-shell.html` + `public/admin-app/app.js` + `public/admin-app/admin.css` + `public/admin-app/tw.css` | `src/app/(admin)/admin/route.ts` |
| หน้าเข้าสู่ระบบ / 2FA | React: `src/app/(admin)/admin/login/layout.tsx`, `page.tsx`, `2fa/page.tsx`, `src/components/admin/LoginFrame.tsx` | Next.js ปกติ |

เพราะฉะนั้นวิธีที่ปลอดภัยที่สุดคือ **เพิ่มไฟล์ CSS ใหม่ 2 ไฟล์ + เพิ่ม `<link>` 4 จุด** โดย **ไม่ต้องแก้ HTML หรือ JS ของดีไซน์เลย**
CSS จะจับ element จาก `id` / class ที่มีอยู่แล้ว (เช่น `#navPill`, `.modal-enter`, `#drawer`) ถอดออกก็แค่ลบ `<link>`

**ไฟล์ที่จะแตะทั้งหมด**

| # | ไฟล์ | ทำอะไร |
|---|---|---|
| 1 | `public/site/glass.css` | **สร้างใหม่** — กระจกของหน้าเว็บ |
| 2 | `site/shell.html` บรรทัด 33 | เพิ่ม `<link>` 1 บรรทัด |
| 3 | `public/admin-app/glass.css` | **สร้างใหม่** — กระจกของหลังบ้าน + หน้าเข้าสู่ระบบ |
| 4 | `site/admin-shell.html` บรรทัด 13 | เพิ่ม `<link>` 1 บรรทัด |
| 5 | `site-src/admin/convert_admin.py` บรรทัด 88 | เพิ่ม `<link>` ในสคริปต์ (กันหายตอนสร้างหลังบ้านใหม่) |
| 6 | `src/app/(admin)/admin/login/layout.tsx` บรรทัด 14 | เพิ่ม `<link>` 1 บรรทัด |

> ⚠️ **อย่ารัน `python3 site-src/convert.py`** — สคริปต์นี้สร้าง `site/shell.html` และ `public/site/app.js` ใหม่จาก mockup ต้นฉบับ จะทับงานที่แก้ในสองไฟล์นี้หลังจากแปลงครั้งแรกทั้งหมด (รวม `<link>` ที่เพิ่มในขั้นที่ 2)
> ไม่ต้องรัน `npm run build:site` / `build:admin` ใหม่ด้วย เพราะ `glass.css` เป็น CSS ธรรมดา ไม่ผ่าน Tailwind

---

## ส่วน A — หน้าเว็บลูกค้า

### A1. สร้างไฟล์ `public/site/glass.css`

```css
/* =====================================================================
   LIQUID GLASS — หน้าเว็บ (ระดับพอดี ๆ)
   กระจกเฉพาะของที่ลอยเหนือเนื้อหา: แถบเมนู เมนูมือถือ/เมนูเช่าเรือ ปุ่มบนรูป Hero
   แถบค้นหา ป้ายบนรูปเรือ ป๊อปอัป แถบคุกกี้ Toast ปุ่มจองลอย แถบเปรียบเทียบ
   การ์ดเรือ ราคา บทความ ตาราง = พื้นทึบเหมือนเดิม
   ถอดออก: ลบ <link href="/site/glass.css"> ใน site/shell.html บรรทัดเดียว
   ===================================================================== */
:root {
  --g-bg: rgb(255 255 255 / .58);
  --g-bg-strong: rgb(255 255 255 / .74);
  --g-blur: blur(22px) saturate(185%);
  --g-shadow: 0 10px 34px -14px rgb(58 0 7 / .32), 0 2px 6px -2px rgb(35 20 22 / .08);
  --g-spec: inset 0 1px 0 rgb(255 255 255 / .95), inset 0 -1px 0 rgb(255 255 255 / .28), inset 0 0 0 1px rgb(255 255 255 / .35);
  --g-spec-dark: inset 0 1px 0 rgb(255 255 255 / .5), inset 0 0 0 1px rgb(255 255 255 / .32);
}
@media (max-width: 640px) { :root { --g-blur: blur(16px) saturate(175%); } }

/* ---------- พื้นกระจกขาว ---------- */
#navPill, #mobileMenu, #megaInner, .qs-card, #cookieBar > div {
  background: var(--g-bg) !important;
  -webkit-backdrop-filter: var(--g-blur); backdrop-filter: var(--g-blur);
  box-shadow: var(--g-shadow), var(--g-spec) !important;
  --tw-ring-shadow: 0 0 #0000;
}

/* ---------- แถบเมนู: แคปซูลลอย / หน้าแรกลอยทับรูป Hero ---------- */
#navbar { padding: 10px 12px 0; pointer-events: none; }
#navbar > * { pointer-events: auto; }
#navPill { max-width: 1304px; margin: 0 auto; border-radius: 24px !important; isolation: isolate; }
#navPill::before { content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none;
  background: linear-gradient(135deg, rgb(255 255 255 / .55) 0%, rgb(255 255 255 / 0) 38%, rgb(255 255 255 / 0) 70%, rgb(255 255 255 / .22) 100%); }
#navbar.is-compact #navPill { background: var(--g-bg-strong) !important; }
body:has(#view-home:not(.hidden)) #navbar { margin-bottom: -74px; }
body:has(#view-home:not(.hidden)) #navbar:not(.is-compact) #navPill { background: rgb(255 255 255 / .5) !important; }
#navInk { background: rgb(255 255 255 / .7) !important; box-shadow: var(--g-spec); }
#megaInner, #mobileMenu { border-radius: 24px !important; }

/* ---------- Hero ---------- */
#hero .hero-fade > a { border-radius: 9999px; box-shadow: 0 8px 24px -10px rgb(0 0 0 / .45), inset 0 1px 0 #fff; }
#hero .hero-fade > button, #hero button.w-10 {
  border-radius: 9999px; background: rgb(255 255 255 / .16) !important;
  -webkit-backdrop-filter: blur(14px) saturate(180%); backdrop-filter: blur(14px) saturate(180%);
  --tw-ring-shadow: 0 0 #0000; box-shadow: var(--g-spec-dark) !important;
}
#hero .hero-fade > button:hover, #hero button.w-10:hover { background: rgb(255 255 255 / .28) !important; }
.qs-card { background: var(--g-bg-strong) !important; }

/* ---------- ป้าย / ปุ่มไอคอนบนรูปเรือ ---------- */
.bcard-ico, span.absolute.top-3.left-3 {
  background: rgb(255 255 255 / .5) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%); backdrop-filter: blur(12px) saturate(180%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .9), inset 0 0 0 1px rgb(255 255 255 / .45), 0 4px 12px -6px rgb(0 0 0 / .35) !important;
}

/* ---------- สีแบรนด์แบบกระจก: Toast, ปุ่มจองลอย, แถบเปรียบเทียบ ---------- */
#toast > div, #floatCta, #cmpTray {
  background: rgb(112 0 14 / .8) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%); backdrop-filter: blur(16px) saturate(180%);
  box-shadow: 0 12px 30px -10px rgb(58 0 7 / .6), inset 0 1px 0 rgb(255 255 255 / .28) !important;
}
#cmpTray { background: rgb(79 0 10 / .76) !important; border-radius: 9999px; }
#cookieBar > div { border-radius: 24px !important; }

/* ---------- ป๊อปอัป (จองเรือ / Smart Match / เปรียบเทียบ / ค้นหา) ---------- */
#bookingModal > div:first-child, #smartModal > div:first-child, #cmpModal > div:first-child {
  background: rgb(58 0 7 / .22) !important; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
}
#cmdModal > div:first-child { background: rgb(58 0 7 / .16) !important; }
.modal-enter {
  background: rgb(255 255 255 / .72) !important;
  -webkit-backdrop-filter: blur(34px) saturate(190%); backdrop-filter: blur(34px) saturate(190%);
  box-shadow: 0 30px 80px -24px rgb(58 0 7 / .5), var(--g-spec) !important; border-radius: 28px !important;
}
.modal-enter > .bg-maroon:first-child { background: linear-gradient(135deg, rgb(112 0 14 / .9), rgb(79 0 10 / .86)) !important; }
.modal-enter input:not([type=checkbox]):not([type=radio]), .modal-enter select, .modal-enter textarea { background-color: rgb(255 255 255 / .62) !important; }

/* ---------- ผู้ใช้ปิดความโปร่งใส / เบราว์เซอร์ไม่รองรับ ---------- */
@media (prefers-reduced-transparency: reduce) {
  #navPill, #mobileMenu, #megaInner, .qs-card, #cookieBar > div, .modal-enter { background: #fff !important; -webkit-backdrop-filter: none; backdrop-filter: none; }
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  #navPill, #mobileMenu, #megaInner, .qs-card, #cookieBar > div, .modal-enter { background: rgb(255 255 255 / .96) !important; }
}
```

### A2. แก้ `site/shell.html` — เพิ่มบรรทัดเดียว **ต่อจาก** `tw.css`

```diff
  <link rel="stylesheet" href="/site/mockup.css?v=__V__" />
  <link rel="stylesheet" href="/site/tw.css?v=__V__" />
+ <link rel="stylesheet" href="/site/glass.css?v=__V__" />
  </head>
```

ต้องอยู่ **หลังสุด** เพราะ `public/site/mockup.css` มีกฎที่ต้องเขียนทับ:

| `mockup.css` | ค่าเดิม | glass.css เปลี่ยนเป็น |
|---|---|---|
| บรรทัด 104 `#navPill { border-radius:0 !important; }` | แถบเมนูเหลี่ยมเต็มจอ | แคปซูลมน 24px |
| บรรทัด 103 `#navbar.is-compact #navPill { background:… .97 }` | ขาวทึบตอนเลื่อนลง | กระจกขาว 74% |
| บรรทัด 87 `.bcard-ico { background:… .88 }` | ปุ่มไอคอนบนรูปขาวทึบ | กระจก 50% |

`__V__` ใน `?v=__V__` ระบบแทนด้วยเวลาแก้ไขของ `public/site/app.js` ให้เอง (ดู `src/lib/site-render.ts` บรรทัด 20–24)

### A3. อะไรเปลี่ยนตรงไหน

| สิ่งที่เห็น | element อยู่ที่ | selector ใน glass.css |
|---|---|---|
| แถบเมนูบน → แคปซูลกระจกลอย | `site/shell.html` 41–42 `<header id="navbar">` / `<div id="navPill">` | `#navbar`, `#navPill` |
| แถบเมนูลอยทับรูปหน้าแรก | `site/shell.html` 109 `<div id="view-home">` | `body:has(#view-home:not(.hidden)) #navbar` |
| แถบเมนูทึบขึ้นตอนเลื่อน | `public/site/app.js` 1124 ใส่ class `is-compact` เมื่อเลื่อนเกิน 24px | `#navbar.is-compact #navPill` |
| เมนู "เช่าเรือ" (mega menu) | `site/shell.html` 83 `#megaInner` | `#megaInner` |
| เมนูมือถือ | `site/shell.html` 88 `#mobileMenu` | `#mobileMenu` |
| ปุ่มบนรูปหน้าแรก (ดูเรือทั้งหมด / ให้เราช่วยเลือก) | `site/shell.html` 119–121 | `#hero .hero-fade > a`, `#hero .hero-fade > button` |
| ปุ่มเลื่อนสไลด์ ‹ › ⏸ | `site/shell.html` 130–132 (`w-10 h-10`) | `#hero button.w-10` |
| แถบค้นหาใต้รูปหน้าแรก | `site/shell.html` 140 `.qs-card` | `.qs-card` |
| ป้าย "ยอดนิยม" บนรูปเรือ | `public/site/app.js` 575 `span.absolute.top-3.left-3` | `span.absolute.top-3.left-3` |
| ปุ่มเปรียบเทียบ / หัวใจบนรูปเรือ | `public/site/app.js` 577–578 `.bcard-ico` | `.bcard-ico` |
| แถบคุกกี้ | กล่อง `site/shell.html` 381 `#cookieBar` / เนื้อหาสร้างใน `public/site/app.js` 1430–1432 | `#cookieBar > div` |
| Toast (แจ้งเตือนสั้น ๆ) | `site/shell.html` 463–464 | `#toast > div` |
| ปุ่ม "จองเรือด่วน" ลอยบนมือถือ | `site/shell.html` 382 `#floatCta` | `#floatCta` |
| แถบเปรียบเทียบเรือด้านล่าง | `site/shell.html` 423 `#cmpTray` | `#cmpTray` |
| ป๊อปอัปจองเรือ / Smart Match / เปรียบเทียบ | `site/shell.html` 385/388, 412/415, 428/431 (`.modal-enter`) | `#bookingModal > div:first-child` (ฉากหลัง), `.modal-enter` (แผง) |
| ช่องค้นหา Ctrl+K | `site/shell.html` 439 `#cmdModal` | `#cmdModal > div:first-child` |

**ไม่ได้แตะ:** การ์ดเรือส่วนชื่อ/ราคา, หน้าเรือ, ตารางราคา, บทความ, footer — ยังเป็นดีไซน์เดิมทุกอย่าง

### A4. ข้อควรระวังเฉพาะหน้าเว็บ

- **`margin-bottom: -74px` ใช้เฉพาะหน้าแรก** (เงื่อนไข `#view-home` ไม่ซ่อน) เพื่อดึงรูปขึ้นไปอยู่ใต้แถบเมนู หน้าอื่นไม่โดน หัวข้อ/breadcrumb จึงไม่ถูกบัง ถ้าภายหลังเปลี่ยนความสูงแถบเมนู (`h-16` = 64px) ต้องแก้ 74 ตาม (64 + ขอบบน 10)
- `:has()` ใช้ได้กับ Chrome 105+, Safari 15.4+, Firefox 121+ — เบราว์เซอร์เก่ากว่านั้นแถบเมนูจะไม่ลอยทับรูป แต่ยังเป็นกระจกและใช้งานได้ปกติ
- หน้าเว็บ **เรนเดอร์บนเซิร์ฟเวอร์** ด้วย `linkedom` (`src/lib/site-render.ts`) — CSS ไม่มีผลกับขั้นนี้ ไม่ต้องแก้อะไร
- `#navPill::before` คือแสงสะท้อนเฉียง ใช้ `isolation: isolate` + `z-index: -1` เพื่อไม่ให้ทับโลโก้และตัวหนังสือ ถ้าลบ `isolation` โลโก้จะดูซีด

---

## ส่วน B — หลังบ้าน + หน้าเข้าสู่ระบบ

### B1. สร้างไฟล์ `public/admin-app/glass.css`

```css
/* =====================================================================
   LIQUID GLASS — หลังบ้าน + หน้าเข้าสู่ระบบ (ระดับพอดี ๆ)
   พื้นหลังไล่สีอ่อน ๆ + แถบเมนูข้าง/แถบบน/หน้าต่างลีด/ป๊อปอัปเป็นกระจก
   การ์ดเป็นกระจกบาง ๆ ตัวเลขและตารางยังคมชัด
   ถอดออก: ลบ <link href="/admin-app/glass.css"> ใน site/admin-shell.html และ login/layout.tsx
   ===================================================================== */
:root {
  --g-blur: blur(24px) saturate(185%);
  --g-spec: inset 0 1px 0 rgb(255 255 255 / .95), inset 0 0 0 1px rgb(255 255 255 / .5);
  --g-shadow: 0 12px 36px -18px rgb(58 0 7 / .28);
}
body {
  background:
    radial-gradient(900px 600px at 8% -10%, rgb(112 0 14 / .10), transparent 60%),
    radial-gradient(800px 700px at 105% 10%, rgb(201 140 120 / .20), transparent 60%),
    radial-gradient(900px 700px at 60% 115%, rgb(112 0 14 / .08), transparent 60%),
    #f6f1ef !important;
  background-attachment: fixed !important;
}
/* แถบเมนูข้าง + แถบบน */
#side { background: rgb(255 255 255 / .55) !important; -webkit-backdrop-filter: var(--g-blur); backdrop-filter: var(--g-blur);
  border-right: 0 !important; box-shadow: inset -1px 0 0 rgb(255 255 255 / .8), 1px 0 0 rgb(35 20 22 / .05); }
#side .border-b, #side .border-t { border-color: rgb(255 255 255 / .7) !important; }
.nav-i:hover { background: rgb(255 255 255 / .6); }
.nav-i.on { background: rgb(255 255 255 / .85); box-shadow: var(--g-spec), 0 4px 14px -8px rgb(112 0 14 / .35); }
header.sticky { background: rgb(255 255 255 / .5) !important; -webkit-backdrop-filter: var(--g-blur); backdrop-filter: var(--g-blur);
  border-bottom: 0 !important; box-shadow: inset 0 -1px 0 rgb(255 255 255 / .8), 0 1px 0 rgb(35 20 22 / .05); }
header.sticky label.bg-sand { background: rgb(255 255 255 / .6) !important; box-shadow: var(--g-spec); }

/* การ์ด: กระจกบาง ๆ ให้สีพื้นหลังทะลุมานิดเดียว */
.card { background: rgb(255 255 255 / .72) !important; -webkit-backdrop-filter: blur(18px) saturate(170%); backdrop-filter: blur(18px) saturate(170%);
  box-shadow: var(--g-shadow), var(--g-spec) !important; border-radius: 20px; }
.card .bg-sand, .card .bg-sand\/70 { background-color: rgb(255 255 255 / .55) !important; }
.tbl thead th { background: transparent !important; }
.tbl tr.click:hover td { background: rgb(255 255 255 / .55) !important; }

/* ปุ่ม / ช่องกรอก */
.btn-o { background: rgb(255 255 255 / .6) !important; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: inset 0 1px 0 #fff, inset 0 0 0 1px rgb(35 20 22 / .1) !important; }
.btn-p { box-shadow: 0 8px 20px -10px rgb(112 0 14 / .7), inset 0 1px 0 rgb(255 255 255 / .25); }
.tab.on { box-shadow: 0 4px 12px -6px rgb(35 20 22 / .5), inset 0 1px 0 rgb(255 255 255 / .2); }
.inp { background-color: rgb(255 255 255 / .7) !important; }

/* หน้าต่างลีด (drawer), ป๊อปอัป, Toast — Toast สีแดงตอนบันทึกไม่สำเร็จ (adm20.js) ไม่โดนทับ */
#drawerMask, #modal > .absolute { background: rgb(58 0 7 / .16) !important; -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
#drawer { background: rgb(255 255 255 / .74) !important; -webkit-backdrop-filter: blur(34px) saturate(190%); backdrop-filter: blur(34px) saturate(190%);
  box-shadow: -24px 0 60px -30px rgb(58 0 7 / .45), inset 1px 0 0 rgb(255 255 255 / .9) !important; }
#drawer .border-b, #drawer .border-t, #modalBox .border-b, #modalBox .border-t { border-color: rgb(35 20 22 / .06) !important; }
#drawer .bg-sand { background-color: rgb(255 255 255 / .55) !important; }
#modalBox { background: rgb(255 255 255 / .76) !important; -webkit-backdrop-filter: blur(34px) saturate(190%); backdrop-filter: blur(34px) saturate(190%);
  box-shadow: 0 30px 80px -24px rgb(58 0 7 / .45), var(--g-spec) !important; border-radius: 26px !important; }
#toast > div:not([class*="b42318"]) { background: rgb(35 20 22 / .72) !important; -webkit-backdrop-filter: blur(18px) saturate(180%); backdrop-filter: blur(18px) saturate(180%); box-shadow: 0 12px 30px -12px rgb(0 0 0 / .5), inset 0 1px 0 rgb(255 255 255 / .2) !important; }

/* หน้าเข้าสู่ระบบ / 2FA */
body:has(.bg-maroon.text-white.relative) .bg-white.min-h-screen { background: rgb(255 255 255 / .8) !important; }

@media (prefers-reduced-transparency: reduce) {
  #side, header.sticky, .card, #drawer, #modalBox { background: #fff !important; -webkit-backdrop-filter: none; backdrop-filter: none; }
}
```

### B2. แก้ `site/admin-shell.html` — ต่อจาก `tw.css`

```diff
  <link rel="stylesheet" href="/admin-app/admin.css?v=__V__" />
  <link rel="stylesheet" href="/admin-app/tw.css?v=__V__" />
+ <link rel="stylesheet" href="/admin-app/glass.css?v=__V__" />
  <script src="/site/lucide.min.js?v=__V__"></script>
```

### B3. แก้ `site-src/admin/convert_admin.py` บรรทัด 88 — กัน `<link>` หายตอนสร้างหลังบ้านใหม่

`site/admin-shell.html` เป็นไฟล์ที่สคริปต์นี้สร้าง ถ้าวันหลังมีคนแก้ `site-src/admin/adm*.js` แล้วรัน `python3 site-src/admin/convert_admin.py` ไฟล์จะถูกเขียนใหม่ ต้องใส่ `<link>` ในสคริปต์ด้วย:

```diff
- head = must(head, '<link rel="stylesheet" href="/admin-app/tw.css?v=__V__" />', '<link rel="stylesheet" href="/admin-app/admin.css?v=__V__" />\n<link rel="stylesheet" href="/admin-app/tw.css?v=__V__" />')
+ head = must(head, '<link rel="stylesheet" href="/admin-app/tw.css?v=__V__" />', '<link rel="stylesheet" href="/admin-app/admin.css?v=__V__" />\n<link rel="stylesheet" href="/admin-app/tw.css?v=__V__" />\n<link rel="stylesheet" href="/admin-app/glass.css?v=__V__" />')
```

> อย่าเขียนกระจกลงใน `public/admin-app/admin.css` โดยตรง — ไฟล์นั้นถูกสร้างใหม่จาก `site-src/admin/admin_head.html` ทุกครั้งที่รันสคริปต์

### B4. แก้ `src/app/(admin)/admin/login/layout.tsx` — หน้าเข้าสู่ระบบ / 2FA

```diff
        <link rel="stylesheet" href="/admin-app/admin.css" />
        <link rel="stylesheet" href="/admin-app/tw.css" />
+       <link rel="stylesheet" href="/admin-app/glass.css" />
      </head>
```

ผล: พื้นหลังไล่สี และแผงฟอร์มด้านขวา (`src/components/admin/LoginFrame.tsx` บรรทัด 20 `bg-white min-h-screen`) เป็นกระจกขาว 80% ส่วนแผงแดงเลือดหมูด้านซ้ายเหมือนเดิม

### B5. อะไรเปลี่ยนตรงไหน

| สิ่งที่เห็น | element อยู่ที่ | selector |
|---|---|---|
| พื้นหลังไล่สีชมพู-แดงเลือดหมูอ่อน | `<body>` | `body` |
| แถบเมนูข้าง | `site/admin-shell.html` 20 `#side` | `#side`, `.nav-i`, `.nav-i.on` |
| แถบบน (หัวข้อหน้า / ค้นหา) | `site/admin-shell.html` 38 `<header class="sticky …">` | `header.sticky` |
| การ์ดทุกหน้า (KPI, ตาราง, ทีม) | class `.card` จาก `public/admin-app/admin.css` บรรทัด 4 | `.card` |
| ปุ่มขอบ / ปุ่มหลัก / แท็บ / ช่องกรอก | class `.btn-o`, `.btn-p`, `.tab.on`, `.inp` | ชื่อเดียวกัน |
| หน้าต่างรายละเอียดลีด (ขวา) | `site/admin-shell.html` 52–53 `#drawerMask`, `#drawer` | `#drawerMask`, `#drawer` |
| ป๊อปอัป | `site/admin-shell.html` 56–58 `#modal`, `#modalBox` | `#modalBox`, `#modal > .absolute` |
| Toast | `site/admin-shell.html` 61 `#toast` | `#toast > div:not([class*="b42318"])` |

> Toast สีแดงตอน "บันทึกไม่สำเร็จ" มาจาก `site-src/admin/adm20.js` บรรทัด 14 (`toastErr` ใส่ class `!bg-[#b42318]`) — selector `:not([class*="b42318"])` กันไม่ให้กระจกทับสีแดงนั้น ถ้าแก้สีใน `toastErr` ต้องแก้ selector นี้ตาม

---

## ส่วน C — ทำให้มีผล

ระบบจำโครงหน้า (`shell.html` / `admin-shell.html`) ไว้ในหน่วยความจำ และ **จำตามเวลาแก้ไขของ `app.js`** — แก้แค่ไฟล์ `.html` ระบบจะยังไม่เห็น ต้องรีสตาร์ต

| วิธีที่รันอยู่ | ทำอย่างนี้ |
|---|---|
| `npm run dev` | หยุด (Ctrl+C) แล้ว `npm run dev` ใหม่ |
| `npm start` | `npm run build && npm start` |
| Docker | `docker compose up -d --build` — ต้อง `--build` เพราะ `Dockerfile` คัดลอก `site/` และ `public/` เข้า image ตอน build |

หน้าเว็บมีแคชหน้าไว้ 5 นาที (`SITE_CACHE_SECONDS` ใน `.env`) — หลังรีสตาร์ตแคชล้างเองแล้ว เปิดเบราว์เซอร์ใหม่หรือกด Cmd+Shift+R

---

## ส่วน D — ปรับความใส / ความเบลอ

แก้ตัวแปรบนสุดของแต่ละไฟล์ ไม่ต้องไล่แก้ทีละจุด

| ตัวแปร | ไฟล์ | ค่าปัจจุบัน | อยากให้… |
|---|---|---|---|
| `--g-bg` | site | `rgb(255 255 255 / .58)` | ใสขึ้น → `.45` · อ่านง่ายขึ้น → `.7` |
| `--g-bg-strong` | site | `.74` | แถบเมนูตอนเลื่อน / แถบค้นหา |
| `--g-blur` | ทั้งสอง | `blur(22–24px) saturate(185%)` | เบลอน้อยลง (เครื่องเก่าลื่นขึ้น) → `blur(14px)` |
| `.card` background | admin | `.72` | การ์ดทึบขึ้น → `.85` |
| `body` background | admin | ไล่สี 3 จุด | อยากจางลง → ลดตัวเลข `.10` / `.20` / `.08` |

มือถือจอ ≤ 640px ใช้เบลอ 16px อยู่แล้ว (`@media (max-width: 640px)` ใน site)

---

## ส่วน E — เช็กลิสต์ทดสอบ

- [ ] หน้าแรก: แถบเมนูลอยทับรูป โลโก้/เมนูอ่านออกทุกสไลด์ (6 สไลด์)
- [ ] เลื่อนลง: แถบเมนูทึบขึ้น รายการเรือด้านหลังเบลอ ไม่กระตุก
- [ ] หน้าเรือ `/yacht-charter/...`, บทความ `/blog/...`, ปลายทาง `/destinations/...`: breadcrumb และหัวข้อไม่โดนแถบเมนูบัง
- [ ] เปิดเมนู "เช่าเรือ" / เมนูมือถือ / ป๊อปอัปจองเรือ / Smart Match / เปรียบเทียบ / Ctrl+K
- [ ] กดหัวใจหรือเปรียบเทียบบนการ์ดเรือ → Toast และแถบเปรียบเทียบด้านล่าง
- [ ] มือถือ: ปุ่ม "จองเรือด่วน", แถบคุกกี้
- [ ] หลังบ้าน: แดชบอร์ด, ลีด (เปิดหน้าต่างลีด), เรือ & ราคา, ทีม (เปิดแก้ไข), ทำให้บันทึกผิดพลาดหนึ่งครั้ง → Toast ต้องเป็นสีแดง
- [ ] หน้าเข้าสู่ระบบ และหน้า 2FA
- [ ] Safari บน Mac และ iPhone (ต้องเห็นเบลอ — มี `-webkit-backdrop-filter` แล้ว)
- [ ] Mac: System Settings → Accessibility → Display → **Reduce transparency** → หน้าเว็บกลับเป็นพื้นทึบ

---

## ส่วน F — ย้อนกลับ

| ต้องการ | ทำ |
|---|---|
| ปิดเฉพาะหน้าเว็บ | ลบบรรทัด `glass.css` ใน `site/shell.html` |
| ปิดเฉพาะหลังบ้าน | ลบบรรทัด `glass.css` ใน `site/admin-shell.html`, `site-src/admin/convert_admin.py`, `src/app/(admin)/admin/login/layout.tsx` |
| ปิดทั้งหมด | ทำทั้งสองข้อ (ไฟล์ `glass.css` เก็บไว้ได้ ไม่มีผลถ้าไม่มีใคร `<link>`) |

แล้วรีสตาร์ตตามส่วน C

> ตัวอย่างหน้าตาก่อน/หลังอยู่ที่ `mockup/liquid-glass/` · mockup แบบกระจกที่เปิดลองได้: `mockup/boattripthailand-mockup-glass.html`, `mockup/boattripthailand-admin-glass.html`
