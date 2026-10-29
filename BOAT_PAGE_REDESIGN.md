# ปรับหน้าเรือตาม Mockup ใหม่ (Bento + ชื่อบนรูป + Liquid Glass)

คู่มือนี้เขียนจากไฟล์จริงในโฟลเดอร์ `boattripthailand` ณ 24 ต.ค. 2569
แบบที่อนุมัติ: `mockup/boattripthailand-boat-liquid-glass.html` (เปิดเทียบระหว่างทำ)
เลขบรรทัดอ้างอิงจากไฟล์ ณ วันนั้น ถ้าไม่ตรงให้ค้นด้วยข้อความในตัวอย่าง

> ⚠️ **ห้ามรัน `python3 site-src/convert.py`** — จะเขียน `site/shell.html` และ `public/site/app.js` ใหม่จาก mockup ต้นฉบับ งานที่แก้ทั้งหมดจะหาย

---

## สรุปสิ่งที่เปลี่ยน

| # | สิ่งที่ลูกค้าเห็น | ไฟล์ |
|---|---|---|
| 1 | รูปหน้าปกกว้างขึ้น + รูปเล็ก 2×2 = 4 รูป (คนละรูปกัน ไม่ซ้ำรูปปก) | `public/site/app.js` → `renderDetail()` |
| 2 | ชื่อเรือ + ราคาเริ่มต้น เป็นตัวขาวบางวางบนรูปปกโดยตรง | `renderDetail()` |
| 3 | ปุ่ม "ดูรูปทั้งหมด N" เล็ก มุมขวาล่างรูปที่ 4 (ไม่บังรูป) | `renderDetail()` |
| 4 | มือถือ: รูปเล็ก 4 รูปแถวเดียว + ปุ่ม "ดูรูปทั้งหมด N รูป" เต็มความกว้าง | CSS + `renderDetail()` |
| 5 | ป้ายบนรูปปกเหลือ "ยอดนิยม/เรือแนะนำ" อย่างเดียว (ไม่มี "รีฟิตใหม่", ไม่มีป้ายประเภทเรือ) | `renderDetail()` |
| 6 | รูปเรือ 1 ลำมีได้มากกว่า 3 รูป (ดูทั้งหมดในหน้าต่างรูป) | `src/lib/site-render.ts` + `drawLightbox()` |
| 7 | แถบเมนูส่วนของหน้า (ภาพรวม · ราคา · …) ติดหัวจอ + ลูกศรบอกว่าเลื่อนได้ | `renderDetail()` + CSS |
| 8 | สไตล์กระจก (Liquid Glass) | `public/site/glass.css` ดู `LIQUID_GLASS.md` |
| 9 | การ์ด "เรือใกล้เคียง" ไม่มีป้ายประเภทเรือทับรูป | `renderDetail()` |

ไฟล์ที่แตะ: `src/lib/site-render.ts`, `public/site/app.js`, `public/site/glass.css` (ใหม่), `site/shell.html` (เพิ่ม `<link>` 1 บรรทัด)

---

## ขั้นที่ 0 — เตรียมรูป

รูป Moonglider (Leopard 90 ft) ที่ย่อแล้ว 55 รูปอยู่ที่ `mockup/moonglider-web/` (กว้าง 1,800px)

**ทางที่แนะนำ:** อัปโหลดผ่านหลังบ้าน → เรือ & ราคา → Leopard 90 ft → แท็บรูปภาพ แล้ว **เรียงลำดับ** ตามนี้

| ลำดับ | ไปอยู่ตรงไหน | รูปที่ใช้ใน mockup |
|---|---|---|
| 1 | รูปปก (ใหญ่) | `DJI_0339-Enhanced-NR_1.jpg` |
| 2 | ช่องเล็ก ซ้ายบน | `0K9A1572-Enhanced-NR.jpg` (ห้องนั่งเล่น) |
| 3 | ช่องเล็ก ขวาบน | `0K9A1610-Enhanced-NR.jpg` (ห้องรับรอง) |
| 4 | ช่องเล็ก ซ้ายล่าง | `DJI_0315-Enhanced-NR.jpg` (สระลอยน้ำ) |
| 5 | ช่องเล็ก ขวาล่าง (มีปุ่มดูทั้งหมด) | `0K9A1390-Enhanced-NR.jpg` (ห้องนอน) |
| 6+ | ดูได้ใน "ดูรูปทั้งหมด" | ที่เหลือ |

ระบบจะเก็บ URL รูปไว้ในคอลัมน์ `boats.images` ตามลำดับที่เรียง — หน้าเว็บใช้ลำดับนี้ตรง ๆ

> ทางลัดสำหรับทดสอบ: คัดลอกไฟล์ไปไว้ `public/boats/leopard-90-ft/01.jpg …` แล้วแก้ `boats.images` ให้เป็น `['/boats/leopard-90-ft/01.jpg', …]`

---

## ขั้นที่ 1 — ส่งรูปทั้งหมดของเรือไปหน้าเว็บ

`src/lib/site-render.ts` บรรทัด 62 ตอนนี้ส่งแค่ 3 รูป (`hero`, `a`, `b`) ให้เพิ่ม `GALLERY` ที่มีครบทุกรูปตามลำดับ (เก็บ `BIMG` ไว้เหมือนเดิม เพราะหน้าอื่นยังใช้)

```diff
   const BIMG = Object.fromEntries(bs.map(b => [b.slug, Object.fromEntries(['hero', 'a', 'b'].map((k, i) => [k, b.images.find(u => u.endsWith(`-${k}.webp`)) ?? b.images[i] ?? '']))]));
+  /** every photo of a boat in the order set in the admin — first = cover */
+  const GALLERY = Object.fromEntries(bs.map(b => [b.slug, b.images.filter(Boolean)]));
```

แล้วเพิ่ม `GALLERY` ใน object `data` (บรรทัดที่มี `const data = { __SET__: …`):

```diff
-  … FLEET, EXTRA: extra, SEASONS, BIMG, SHOWIMG, TEAM_IMG, …
+  … FLEET, EXTRA: extra, SEASONS, BIMG, GALLERY, SHOWIMG, TEAM_IMG, …
```

และเพิ่ม type ใน `type SiteData = { … }` ด้านบนไฟล์: `GALLERY: Record<string, string[]>;`

---

## ขั้นที่ 2 — ตัวช่วยรูปใน `public/site/app.js`

ต่อจาก `const bimg = …` (บรรทัด 391) เพิ่ม:

```js
/** photos of a boat in admin order; falls back to the 3 brochure images */
const gallery = slug => { const g = (window.GALLERY || {})[slug]; return g && g.length ? g : ['hero', 'a', 'b'].map(k => bimg(slug, k)).filter(Boolean); };
```

แก้ `drawLightbox()` (บรรทัด 848) ให้ใช้รูปทั้งหมด:

```diff
-  const g = ['hero','a','b'].map(k=>bimg(lbSlug,k)).filter(Boolean); lbIdx = (lbIdx+g.length)%g.length;
+  const g = gallery(lbSlug); lbIdx = (lbIdx+g.length)%g.length;
```

ต่อท้าย `drawLightbox()` ให้รูปย่อที่เลือกเลื่อนมาอยู่กลางเสมอ (ตอนมี 20+ รูป):

```diff
   $('#lbThumbs').innerHTML = g.map(…).join('');
+  $('#lbThumbs .is-on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
 }
```

---

## ขั้นที่ 3 — แกลเลอรี Bento + ชื่อบนรูป (`renderDetail`)

ใน `renderDetail(slug)` (เริ่มบรรทัด 632) แทนที่ทั้งก้อน `<div class="gal"> … </div>` **และ** ก้อนชื่อเรือ/ราคาที่อยู่ใต้มัน (`<div class="mt-6 flex flex-col md:flex-row …"> … </div>` ที่มี `<h1>` และปุ่ม "จองเลย") ด้วย:

```js
    ${bentoHTML(b)}
```

> ปุ่ม "จองเลย" ใต้รูปเดิมไม่ต้องย้ายมา — กล่องจองด้านขวา (`#dDate` …) และแถบจองบนมือถือทำหน้าที่แทนอยู่แล้ว

และลบบรรทัด `const gallery = ['hero','a','b'].map(…)` (บรรทัด 642) ทิ้ง (ชื่อซ้ำกับตัวช่วยในขั้นที่ 2)

เพิ่มฟังก์ชันนี้ไว้เหนือ `function renderDetail`:

```js
function bentoHTML(b) {
  const g = gallery(b.slug), n = g.length, name = niceTitle(b.title);
  const tile = (i, cls, extra = '') => g[i] ? `<button type="button" class="bt ${cls} img-fallback group" onclick="openLightbox('${b.slug}',${i})" aria-label="${t('viewPhotos')} ${i + 1}">
      <img src="${g[i]}" alt="${i ? `${name} — photo ${i + 1}` : name}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} class="gal-img"/>${extra}</button>` : '';
  const all = `<span class="bt-all"><i data-lucide="layout-grid"></i>${L('ดูรูปทั้งหมด', 'All photos')} ${n}</span>`;
  const sub = [typeLabel(b.type), b.pax ? `${b.pax} ${t('guests')}` : ''].filter(Boolean).join(' · ');
  return `<div class="bento bento-n${Math.min(n, 5)}">
    <div class="bt bt-main img-fallback">
      <button type="button" class="absolute inset-0 w-full h-full group" onclick="openLightbox('${b.slug}',0)" aria-label="${t('viewPhotos')}"><img src="${g[0] || ''}" alt="${name}" fetchpriority="high" class="gal-img"/></button>
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
    <span class="bt-stack">${g.slice(1, 3).map(s => `<img src="${s}" alt="" loading="lazy"/>`).join('')}</span>
    <span class="min-w-0"><b>${L('ดูรูปทั้งหมด', 'View all')} ${n} ${L('รูป', 'photos')}</b><span>${L('แตะเพื่อดูภาพเต็มจอ', 'Tap to view full screen')}</span></span>
    <i data-lucide="chevron-right"></i></button>` : ''}`;
}
function shareBoat(slug) {
  const url = SITE_ORIGIN + hashToPath('#/boat/' + slug);
  if (navigator.share) navigator.share({ title: niceTitle(bySlug(slug).title), url }).catch(() => {});
  else { navigator.clipboard?.writeText(url); toast(L('คัดลอกลิงก์แล้ว', 'Link copied')); }
}
```

**หมายเหตุ**

- `h1` ย้ายมาอยู่บนรูป — ยังเป็น `<h1>` ตัวเดียวของหน้า (SEO เหมือนเดิม) ตรวจว่าไม่มี `<h1>` อื่นหลงเหลือใน `renderDetail`
- ชื่อประเภทเรือยังอยู่ในบรรทัดรอง (`typeLabel`) แต่ **ไม่มีป้ายทับรูป**
- เรือที่มีรูปน้อยกว่า 5 รูป: class `bento-n1 … bento-n4` ปรับช่องให้พอดี (CSS ในขั้นที่ 5)

---

## ขั้นที่ 4 — แถบเมนูส่วนของหน้า + ลูกศรเลื่อน

ใน `renderDetail` ใส่แถบนี้ **บนสุดของคอลัมน์ซ้าย** (ใต้ `<div class="space-y-6 min-w-0">`) และใส่ `id` ให้แต่ละส่วนตามที่ลิงก์ชี้ (ส่วนโปรแกรมมี `id="programs"` อยู่แล้ว)

```js
      <div class="secwrap" id="secwrap">
        <div class="sec-fade l"><button type="button" onclick="secScroll(-1)" aria-label="${L('เลื่อนซ้าย', 'Scroll left')}"><i data-lucide="chevron-left"></i></button></div>
        <div class="sec-fade r"><button type="button" onclick="secScroll(1)" aria-label="${L('เลื่อนขวา', 'Scroll right')}"><i data-lucide="chevron-right"></i></button></div>
        <nav class="secnav" id="secnav" aria-label="${L('ส่วนของหน้า', 'Page sections')}">
          ${[['boatInfoSec', t('boatInfo')], ['programs', t('programs2')], ['slotsSec', t('timeSlots')], ['inclSec', L('รวม / ไม่รวม', 'Included')], ['faqSec', 'FAQ']]
            .map(([id, l], i) => `<a href="#${id}" class="${i ? '' : 'on'}" onclick="event.preventDefault();secGo('${id}')">${l}</a>`).join('')}
        </nav>
      </div>
```

> ใส่เฉพาะส่วนที่มีจริงในหน้าเรือลำนั้น (เช่น ถ้า `b.time_slots` ว่าง ก็ไม่ต้องมีลิงก์ "รอบเวลา") และเพิ่ม `id="boatInfoSec"`, `id="slotsSec"`, `id="inclSec"`, `id="faqSec"` ให้กล่องที่ตรงกัน

เพิ่มฟังก์ชัน (ไว้ใต้ `bentoHTML`):

```js
function secState() { const n = $('#secnav'), w = $('#secwrap'); if (!n || !w) return; w.classList.toggle('can-l', n.scrollLeft > 4); w.classList.toggle('can-r', n.scrollLeft + n.clientWidth < n.scrollWidth - 4); }
function secScroll(d) { const n = $('#secnav'); n?.scrollBy({ left: d * Math.max(140, n.clientWidth * .6), behavior: 'smooth' }); }
function secGo(id) { const el = document.getElementById(id); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 140, behavior: 'smooth' }); }
let secIO;
function bindSecnav() {
  const n = $('#secnav'); if (!n) return;
  n.addEventListener('scroll', secState, { passive: true }); setTimeout(secState, 50);
  secIO?.disconnect();
  if (typeof IntersectionObserver === 'undefined') return;
  secIO = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return;
    $$('#secnav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    $('#secnav a.on')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }), { rootMargin: '-40% 0px -55% 0px' });
  $$('#secnav a').forEach(a => { const t = document.getElementById(a.getAttribute('href').slice(1)); t && secIO.observe(t); });
}
addEventListener('resize', secState);
```

แล้วเรียก `bindSecnav();` ท้าย `renderDetail` (หลังบรรทัดที่ใส่ `v.innerHTML = …` และก่อน/หลัง `icons()` ก็ได้)

> `typeof IntersectionObserver` สำคัญ — หน้าเว็บเรนเดอร์บนเซิร์ฟเวอร์ด้วย linkedom (`src/lib/site-render.ts`) ซึ่งไม่มี IntersectionObserver ถ้าไม่เช็กจะทำให้หน้าเรือ error ตอน SSR

**การ์ดเรือใกล้เคียง:** ในส่วน `similar` ของ `renderDetail` ลบ `<span …>${typeLabel(…)}</span>` ที่ลอยทับรูปออก (ถ้ามี)

---

## ขั้นที่ 5 — CSS

สร้าง/ต่อท้ายไฟล์ `public/site/glass.css` (ถ้ายังไม่ได้ทำตาม `LIQUID_GLASS.md` ให้สร้างไฟล์ใหม่) แล้วเพิ่มใน `site/shell.html` บรรทัด 33 **ต่อจาก** `tw.css`:

```diff
  <link rel="stylesheet" href="/site/tw.css?v=__V__" />
+ <link rel="stylesheet" href="/site/glass.css?v=__V__" />
```

เนื้อหา CSS หน้าเรือ:

```css
/* =========================================================
   หน้าเรือ — Bento + ชื่อบนรูป + เมนูส่วนของหน้า
   ========================================================= */
/* ---------- Bento: ปก 1 + เล็ก 4 ---------- */
.bento { position: relative; display: grid; gap: 10px; grid-template-columns: 2.8fr 1fr 1fr; grid-template-rows: 250px 250px;
  grid-template-areas: "m a b" "m c d"; }
.bento-n4 { grid-template-areas: "m a b" "m c c"; }
.bento-n3 { grid-template-columns: 2.8fr 1.4fr; grid-template-areas: "m a" "m b"; }
.bento-n2 { grid-template-columns: 2fr 1fr; grid-template-areas: "m a" "m a"; }
.bento-n1 { grid-template-columns: 1fr; grid-template-areas: "m" "m"; }
.bt { position: relative; overflow: hidden; border-radius: 22px !important; isolation: isolate; display: block; padding: 0;
  box-shadow: 0 20px 50px -28px rgb(58 0 7 / .55), 0 0 0 1px rgb(255 255 255 / .55); }
.bt-main { grid-area: m; } .bt-1 { grid-area: a; } .bt-2 { grid-area: b; } .bt-3 { grid-area: c; } .bt-4 { grid-area: d; }
.bento-n4 .bt-3 { grid-area: c; } .bento-n3 .bt-1 { grid-area: a; } .bento-n3 .bt-2 { grid-area: b; }
.bt-main .gal-img { object-position: 62% 45%; }
.bt-main::after { content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, rgb(0 0 0 / .22), transparent 28%, transparent 52%, rgb(0 0 0 / .55)); }

/* ป้าย + ปุ่มกระจกบนรูปปก */
.bt-chip { position: absolute; top: 16px; left: 16px; z-index: 3; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px;
  border-radius: 999px; font-size: 12.5px; color: #fff; background: rgb(20 6 8 / .28);
  -webkit-backdrop-filter: blur(18px) saturate(170%); backdrop-filter: blur(18px) saturate(170%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .45), inset 0 0 0 1px rgb(255 255 255 / .28); }
.bt-chip svg { width: 14px; height: 14px; }
.bt-acts { position: absolute; top: 16px; right: 16px; z-index: 3; display: flex; gap: 8px; }
.bt-round { width: 42px; height: 42px; border-radius: 999px !important; display: grid; place-items: center; color: #fff; background: rgb(20 6 8 / .28);
  -webkit-backdrop-filter: blur(18px) saturate(170%); backdrop-filter: blur(18px) saturate(170%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .45), inset 0 0 0 1px rgb(255 255 255 / .28); transition: transform .2s, background .2s; }
.bt-round:hover { transform: scale(1.06); background: rgb(255 255 255 / .28); }
.bt-round svg { width: 18px; height: 18px; }
.bt-round[aria-pressed="true"] svg { fill: #ff6b7d; stroke: #ff6b7d; }

/* ชื่อ + ราคา ตัวขาวบาง บนรูป */
.bt-cover { position: absolute; left: 30px; right: 30px; bottom: 26px; z-index: 3; display: flex; align-items: flex-end; justify-content: space-between;
  gap: 18px; color: #fff; pointer-events: none; text-shadow: 0 2px 18px rgb(0 0 0 / .35); }
.bt-cover h1 { margin: 0; font-weight: 300; font-size: clamp(36px, 4.2vw, 56px); line-height: 1; letter-spacing: .005em; }
.bt-cover p { margin: 10px 0 0; color: rgb(255 255 255 / .82); font-size: 13.5px; letter-spacing: .02em; }
.bt-price { line-height: 1.1; text-align: right; white-space: nowrap; }
.bt-price small { display: block; font-size: 12px; letter-spacing: .02em; color: rgb(255 255 255 / .75); margin-bottom: 4px; }
.bt-price b { font-size: 26px; font-weight: 400; }

/* ปุ่มดูรูปทั้งหมด (เล็ก มุมรูปที่ 4) */
.bt-all { position: absolute; right: 12px; bottom: 12px; z-index: 4; display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 13px;
  border-radius: 999px; font-size: 12.5px; color: #231416; background: rgb(255 255 255 / .62);
  -webkit-backdrop-filter: blur(16px) saturate(180%); backdrop-filter: blur(16px) saturate(180%);
  box-shadow: inset 0 1px 0 #fff, inset 0 0 0 1px rgb(255 255 255 / .55), 0 10px 24px -10px rgb(0 0 0 / .45); }
.bt-all svg { width: 15px; height: 15px; color: #70000e; }

/* ปุ่มดูรูปทั้งหมด (มือถือ) */
.bt-mall { display: none; align-items: center; gap: 12px; width: 100%; margin-top: 8px; min-height: 52px; padding: 8px 14px 8px 8px; border-radius: 18px !important;
  text-align: left; background: rgb(255 255 255 / .72); -webkit-backdrop-filter: blur(24px) saturate(185%); backdrop-filter: blur(24px) saturate(185%);
  box-shadow: 0 18px 50px -24px rgb(58 0 7 / .38), inset 0 1px 0 #fff, inset 0 0 0 1px rgb(255 255 255 / .42); }
.bt-stack { position: relative; width: 52px; height: 38px; flex-shrink: 0; }
.bt-stack img { position: absolute; width: 40px; height: 32px; object-fit: cover; border-radius: 8px !important; box-shadow: 0 0 0 2px #fff, 0 4px 10px -4px rgb(0 0 0 / .4); }
.bt-stack img:nth-child(1) { left: 0; top: 6px; transform: rotate(-6deg); } .bt-stack img:nth-child(2) { left: 12px; top: 2px; transform: rotate(5deg); }
.bt-mall b { display: block; font-weight: 500; font-size: 14.5px; }
.bt-mall span span { font-size: 12px; color: #6b5e60; }
.bt-mall > svg { width: 20px; height: 20px; margin-left: auto; color: #70000e; }

@media (max-width: 720px) {
  .bento, .bento-n4, .bento-n3, .bento-n2 { grid-template-columns: repeat(4, 1fr); grid-template-rows: 400px 84px; grid-template-areas: "m m m m" "a b c d"; gap: 6px; }
  .bento-n1 { grid-template-rows: 400px; grid-template-areas: "m m m m"; }
  .bento-n4 .bt-3 { grid-area: c; }
  .bt-1, .bt-2, .bt-3, .bt-4 { border-radius: 14px !important; }
  .bt-all { display: none; } .bt-mall { display: flex; }
  .bt-cover { left: 18px; right: 18px; bottom: 18px; gap: 12px; } .bt-cover h1 { font-size: 32px; } .bt-cover p { font-size: 12px; margin-top: 6px; }
  .bt-price small { font-size: 10.5px; } .bt-price b { font-size: 19px; } .bt-hide-m { display: none; }
  .bt-chip { top: 12px; left: 12px; } .bt-acts { top: 12px; right: 12px; }
}

/* ---------- เมนูส่วนของหน้า + ลูกศรเลื่อน ---------- */
.secwrap { position: sticky; top: 86px; z-index: 30; border-radius: 999px; background: rgb(255 255 255 / .72);
  -webkit-backdrop-filter: blur(24px) saturate(185%); backdrop-filter: blur(24px) saturate(185%);
  box-shadow: 0 18px 50px -24px rgb(58 0 7 / .38), inset 0 1px 0 #fff, inset 0 0 0 1px rgb(255 255 255 / .42); }
.secnav { display: flex; gap: 4px; padding: 5px; border-radius: 999px; overflow-x: auto; scrollbar-width: none; scroll-behavior: smooth; }
.secnav::-webkit-scrollbar { display: none; }
.secnav a { padding: 8px 14px; border-radius: 999px; font-size: 13px; color: #6b5e60; white-space: nowrap; transition: background .2s, color .2s; }
.secnav a.on { background: #fff; color: #231416; box-shadow: 0 4px 12px -6px rgb(35 20 22 / .4); }
.sec-fade { position: absolute; top: 1px; bottom: 1px; width: 64px; z-index: 2; display: flex; align-items: center; pointer-events: none; opacity: 0; transition: opacity .25s; }
.sec-fade.l { left: 1px; border-radius: 999px 0 0 999px; background: linear-gradient(90deg, rgb(250 247 246) 40%, rgb(250 247 246 / 0)); padding-left: 5px; }
.sec-fade.r { right: 1px; border-radius: 0 999px 999px 0; background: linear-gradient(270deg, rgb(250 247 246) 40%, rgb(250 247 246 / 0)); justify-content: flex-end; padding-right: 5px; }
.secwrap.can-l .sec-fade.l, .secwrap.can-r .sec-fade.r { opacity: 1; }
.sec-fade button { width: 32px; height: 32px; border-radius: 99px !important; display: grid; place-items: center; background: #fff; color: #70000e;
  box-shadow: 0 4px 12px -4px rgb(35 20 22 / .35), inset 0 0 0 1px rgb(35 20 22 / .06); }
.secwrap.can-l .sec-fade.l button, .secwrap.can-r .sec-fade.r button { pointer-events: auto; }
.sec-fade svg { width: 17px; height: 17px; }
.secwrap.can-r .sec-fade.r button { animation: secNudge 1.6s ease-in-out 1s 2; }
@keyframes secNudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
@media (max-width: 720px) { .secwrap { top: 74px; } }

@media (prefers-reduced-motion: reduce) { .secwrap .sec-fade button { animation: none; } }
@media (prefers-reduced-transparency: reduce) { .bt-all, .bt-mall, .secwrap { background: #fff; -webkit-backdrop-filter: none; backdrop-filter: none; } }
```

> ค่า `top: 86px / 74px` ของ `.secwrap` = ความสูงแถบเมนูบน + ช่องว่าง ถ้าแถบเมนูบนของคุณสูงไม่เท่านี้ (เช่น ไม่ได้ใช้แบบลอยจาก `LIQUID_GLASS.md`) ให้ปรับตาม — ของเดิมในโปรเจกต์ใช้ `top-[64px]`

กฎ CSS เก่าของแกลเลอรี (`.gal`, `.gal-main`, `.gal-t` ใน `public/site/mockup.css` บรรทัด 214–222) ไม่ต้องลบ — ไม่มีอะไรใช้แล้วแต่ไม่กระทบ ส่วน `.gal-img` ยังใช้อยู่

---

## ขั้นที่ 6 — ทำให้มีผล

| วิธีที่รัน | ทำ |
|---|---|
| `npm run dev` | หยุดแล้ว `npm run dev` ใหม่ |
| Docker | `docker compose up -d --build` |

- ระบบจำหน้าเว็บตามเวลาแก้ไขของ `public/site/app.js` (`src/lib/site-render.ts` บรรทัด 20–24) แก้ `app.js` แล้วจะเห็นผลเอง แต่แก้แค่ `shell.html` ต้องรีสตาร์ต
- ข้อมูลรูป (`GALLERY`) มีแคช 5 นาที — หลังเรียงรูปในหลังบ้านรอได้ หรือรีสตาร์ต
- ไม่ต้องรัน `npm run build:site` เพราะ CSS ใหม่อยู่ใน `glass.css` ไม่ผ่าน Tailwind

---

## ขั้นที่ 7 — เช็กลิสต์

- [ ] `/yacht-charter/leopard-90-ft` รูปปกกว้าง เห็นชื่อ + "เริ่มต้น / ทริป ฿102,000" ตัวขาวอ่านออก
- [ ] รูปเล็ก 4 รูปไม่ซ้ำรูปปก ปุ่ม "ดูรูปทั้งหมด 20" มุมขวาล่าง กดแล้วเปิดรูปครบทุกรูป ใช้ลูกศร/รูปย่อเลื่อนได้
- [ ] เรือที่มีแค่ 3 รูป (เรือลำอื่นส่วนใหญ่ตอนนี้) — Bento ไม่มีช่องว่าง
- [ ] มือถือ 390px: รูปปก + รูปเล็ก 4 รูปแถวเดียว + ปุ่ม "ดูรูปทั้งหมด N รูป" เต็มความกว้าง ไม่ล้นจอ
- [ ] แถบเมนูส่วนของหน้า: มือถือมีลูกศร › ขยับเบา ๆ กดแล้วเลื่อน เลื่อนแล้วมี ‹ บนคอมไม่มีลูกศร (ถ้าเมนูพอดี)
- [ ] กดเมนูแต่ละอัน เลื่อนไปส่วนนั้น และเมนูที่ active เปลี่ยนตามตอนเลื่อนหน้า
- [ ] ปุ่มหัวใจ/แชร์บนรูปทำงาน
- [ ] ปิด JavaScript แล้วเปิดหน้า (ดูที่ Google เห็น) ยังเห็นชื่อเรือเป็น `<h1>` และรูปปก
- [ ] หน้า `/en/yacht-charter/leopard-90-ft` ข้อความเป็นภาษาอังกฤษ

---

## ย้อนกลับ

ทุกอย่างอยู่ใน `renderDetail()` / `drawLightbox()` / ตัวช่วยใหม่ใน `app.js`, 2 บรรทัดใน `site-render.ts` และไฟล์ `glass.css`
แนะนำให้ commit แยก (`git checkout -b boat-page-bento`) ก่อนเริ่ม จะย้อนได้ด้วย `git checkout main`
