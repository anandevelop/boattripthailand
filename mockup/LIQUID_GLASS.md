# คู่มือปรับดีไซน์เป็น Liquid Glass — Boat Trip Thailand

คู่มือนี้ใช้กับโปรเจกต์ **Next.js รุ่นก่อนหน้า (12 / 13 / 14)** ที่ใช้ **Tailwind CSS 3.x** ได้ทั้งแบบ **App Router** (`app/`) และ **Pages Router** (`pages/`)
ไม่ต้องลง package เพิ่ม ใช้ CSS ล้วน (`backdrop-filter`)

> ระดับที่เลือก: **พอดี ๆ** — ทำเป็นกระจกเฉพาะ "ของที่ลอยอยู่เหนือเนื้อหา" (เมนู ปุ่มบนรูป ป๊อปอัป แถบล่าง)
> ส่วนที่ต้องอ่าน (การ์ดเรือ ราคา บทความ ตาราง) **คงพื้นทึบ** เพื่อให้อ่านง่าย

---

## สารบัญ

1. [หลักการ](#1-หลักการ)
2. [ขั้นที่ 1 — สร้างไฟล์ `glass.css`](#2-ขั้นที่-1--สร้างไฟล์-glasscss)
3. [ขั้นที่ 2 — import เข้าโปรเจกต์](#3-ขั้นที่-2--import-เข้าโปรเจกต์)
4. [ขั้นที่ 3 — ใส่ใน Component หน้าเว็บ](#4-ขั้นที่-3--ใส่ใน-component-หน้าเว็บ)
5. [ขั้นที่ 4 — ใส่ในหลังบ้าน](#5-ขั้นที่-4--ใส่ในหลังบ้าน)
6. [ข้อควรระวัง (สำคัญ)](#6-ข้อควรระวัง-สำคัญ)
7. [เช็กลิสต์ทดสอบ](#7-เช็กลิสต์ทดสอบ)
8. [วิธีย้อนกลับ](#8-วิธีย้อนกลับ)

---

## 1. หลักการ

กระจกที่ดูดีมี 4 ชั้น:

| ชั้น | ทำด้วย | ค่าที่ใช้ |
|---|---|---|
| พื้นโปร่ง | `background` สีขาวโปร่งแสง | ขาว 50–75% |
| เบลอสิ่งที่อยู่ด้านหลัง | `backdrop-filter: blur() saturate()` | blur 20–34px, saturate 180% |
| ขอบสะท้อนแสง (specular) | `box-shadow: inset` เส้นขาวด้านบน | ขาว 90% หนา 1px |
| เงาลอย | `box-shadow` เงานุ่มสีแดงเลือดหมูจาง | `rgb(58 0 7 / .3)` |

**ที่ไหนใช้ / ไม่ใช้**

| ใช้กระจก ✅ | คงพื้นทึบ ❌ |
|---|---|
| Navbar, เมนูมือถือ, Mega menu | การ์ดเรือ (ส่วนข้อความ/ราคา) |
| ปุ่มบนรูป Hero, ปุ่มเลื่อนสไลด์ | เนื้อหาบทความ |
| ป้าย "ยอดนิยม", ปุ่มหัวใจ/เปรียบเทียบบนรูป | ตารางราคา |
| แถบค้นหาบน Hero | ฟอร์มยาว ๆ ทั้งหน้า |
| Modal จองเรือ, Toast, Cookie bar, ปุ่มจองลอยบนมือถือ | Footer |

> กระจกจะ "เห็นผล" ก็ต่อเมื่อมีรูปหรือสีอยู่ด้านหลัง ถ้าวางบนพื้นขาวจะแทบไม่ต่างจากเดิม — ต้องจัดให้ของที่เป็นกระจก **ลอยทับรูป** หรือมี **พื้นหลังไล่สี**

---

## 2. ขั้นที่ 1 — สร้างไฟล์ `glass.css`

สร้างไฟล์ `styles/glass.css` (Pages Router) หรือ `app/glass.css` (App Router)

```css
/* =====================================================================
   LIQUID GLASS — Boat Trip Thailand
   ใช้ร่วมกับ Tailwind 3 ได้ (ไม่ชนกัน เพราะเป็น class เฉพาะ .glass-*)
   ===================================================================== */
:root {
  /* พื้นกระจก */
  --g-bg:        rgb(255 255 255 / .58);
  --g-bg-strong: rgb(255 255 255 / .74);
  --g-bg-soft:   rgb(255 255 255 / .16);   /* บนรูปมืด เช่น Hero */
  --g-maroon:    rgb(112 0 14 / .82);      /* ปุ่มหลักแบบกระจก */
  --g-ink:       rgb(35 20 22 / .72);      /* toast สีเข้ม */

  /* เบลอ */
  --g-blur:    blur(22px) saturate(185%);
  --g-blur-lg: blur(34px) saturate(190%);
  --g-blur-sm: blur(12px) saturate(180%);

  /* เงา + ขอบสะท้อนแสง */
  --g-shadow: 0 10px 34px -14px rgb(58 0 7 / .32), 0 2px 6px -2px rgb(35 20 22 / .08);
  --g-spec:   inset 0 1px 0 rgb(255 255 255 / .95),
              inset 0 -1px 0 rgb(255 255 255 / .28),
              inset 0 0 0 1px rgb(255 255 255 / .35);
  --g-spec-on-dark: inset 0 1px 0 rgb(255 255 255 / .55),
                    inset 0 0 0 1px rgb(255 255 255 / .38);
}

/* ---------- พื้นฐาน ---------- */
.glass,
.glass-strong,
.glass-panel {
  -webkit-backdrop-filter: var(--g-blur);   /* Safari ต้องมี prefix */
          backdrop-filter: var(--g-blur);
  box-shadow: var(--g-shadow), var(--g-spec);
  border: 0;
}
.glass        { background: var(--g-bg); }
.glass-strong { background: var(--g-bg-strong); }

/* แผงใหญ่ เช่น Modal / Drawer — เบลอแรงขึ้นและทึบขึ้นเพื่อให้อ่านฟอร์มได้ */
.glass-panel {
  background: rgb(255 255 255 / .72);
  -webkit-backdrop-filter: var(--g-blur-lg);
          backdrop-filter: var(--g-blur-lg);
  box-shadow: 0 30px 80px -24px rgb(58 0 7 / .5), var(--g-spec);
}

/* บนรูปมืด (ปุ่มรองบน Hero, ปุ่มเลื่อนสไลด์) */
.glass-on-dark {
  background: var(--g-bg-soft);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
          backdrop-filter: blur(14px) saturate(180%);
  box-shadow: var(--g-spec-on-dark);
  color: #fff;
}

/* ป้ายเล็ก/ปุ่มไอคอนบนรูปเรือ */
.glass-chip {
  background: rgb(255 255 255 / .5);
  -webkit-backdrop-filter: var(--g-blur-sm);
          backdrop-filter: var(--g-blur-sm);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .9),
              inset 0 0 0 1px rgb(255 255 255 / .45),
              0 4px 12px -6px rgb(0 0 0 / .35);
}

/* ปุ่มหลักสีแบรนด์แบบกระจก (ปุ่มจองลอยบนมือถือ, แถบเปรียบเทียบ) */
.glass-brand {
  background: var(--g-maroon);
  color: #fff;
  -webkit-backdrop-filter: blur(16px) saturate(180%);
          backdrop-filter: blur(16px) saturate(180%);
  box-shadow: 0 12px 30px -10px rgb(58 0 7 / .65), inset 0 1px 0 rgb(255 255 255 / .3);
}

/* toast สีเข้ม */
.glass-ink {
  background: var(--g-ink);
  color: #fff;
  -webkit-backdrop-filter: blur(18px) saturate(180%);
          backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 12px 30px -12px rgb(0 0 0 / .5), inset 0 1px 0 rgb(255 255 255 / .2);
}

/* เงาสะท้อนแสงเฉียง (ใส่เพิ่มกับ navbar ให้ดู "เป็นกระจก" ชัดขึ้น) */
.glass-sheen { position: relative; isolation: isolate; }
.glass-sheen::before {
  content: '';
  position: absolute; inset: 0; z-index: -1;
  border-radius: inherit; pointer-events: none;
  background: linear-gradient(135deg,
    rgb(255 255 255 / .55) 0%, rgb(255 255 255 / 0) 38%,
    rgb(255 255 255 / 0) 70%, rgb(255 255 255 / .22) 100%);
}

/* ฉากหลังของ Modal — จางลง เบลอเล็กน้อย ให้เห็นหน้าเว็บผ่านแผงกระจก */
.glass-veil {
  background: rgb(58 0 7 / .22);
  -webkit-backdrop-filter: blur(6px);
          backdrop-filter: blur(6px);
}

/* ช่องกรอกข้อมูลในแผงกระจก */
.glass-panel input:not([type=checkbox]):not([type=radio]),
.glass-panel select,
.glass-panel textarea { background-color: rgb(255 255 255 / .62); }

/* ---------- พื้นหลังไล่สีสำหรับหลังบ้าน ---------- */
.glass-backdrop {
  background:
    radial-gradient(900px 600px at 8% -10%, rgb(112 0 14 / .10), transparent 60%),
    radial-gradient(800px 700px at 105% 10%, rgb(201 140 120 / .20), transparent 60%),
    radial-gradient(900px 700px at 60% 115%, rgb(112 0 14 / .08), transparent 60%),
    #f6f1ef;
  background-attachment: fixed;
}

/* ---------- เบราว์เซอร์ที่ไม่รองรับ / ผู้ใช้ปิดความโปร่งใส ---------- */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass, .glass-strong, .glass-panel, .glass-chip { background: rgb(255 255 255 / .96); }
  .glass-on-dark { background: rgb(0 0 0 / .35); }
}
@media (prefers-reduced-transparency: reduce) {
  .glass, .glass-strong, .glass-panel, .glass-chip {
    background: #fff; -webkit-backdrop-filter: none; backdrop-filter: none;
  }
}
```

> **ทำไมไม่ใช้แค่ `backdrop-blur` ของ Tailwind?** ใช้ได้ แต่ Tailwind ไม่มีขอบสะท้อนแสงหลายชั้นและ fallback ให้ การรวมไว้ใน class เดียว (`.glass`) ทำให้แก้ค่าที่เดียวแล้วเปลี่ยนทั้งเว็บ

---

## 3. ขั้นที่ 2 — import เข้าโปรเจกต์

Global CSS ใน Next.js **import ได้เฉพาะไฟล์ระดับบนสุด** เท่านั้น (ถ้า import ใน component ทั่วไปจะ error)

### App Router (Next 13.4+ / 14) — `app/layout.tsx`

```tsx
import './globals.css';
import './glass.css';   // ← เพิ่มบรรทัดนี้ (หลัง globals.css)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
```

### Pages Router (Next 12 / 13 / 14) — `pages/_app.tsx`

```tsx
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../styles/glass.css';   // ← เพิ่มบรรทัดนี้

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

### Tailwind — ไม่ต้องแก้ config

class `.glass-*` เขียนเป็น CSS ธรรมดา Tailwind จะไม่ลบทิ้ง (purge จะลบเฉพาะ utility ของ Tailwind เอง)
ถ้าอยากเรียกด้วย `@apply` ได้ ให้ย้ายเนื้อหาไปไว้ใน `globals.css` ภายใต้ `@layer components { ... }`

---

## 4. ขั้นที่ 3 — ใส่ใน Component หน้าเว็บ

ตัวอย่างด้านล่างเขียนแบบ "ก่อน → หลัง" เปลี่ยนแค่ `className` เป็นหลัก

### 4.1 Navbar — แคปซูลกระจกลอย และลอยทับรูป Hero เฉพาะหน้าแรก

**App Router** (ต้องเป็น Client Component เพราะใช้ `usePathname`)

```tsx
'use client';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const overHero = pathname === '/' || pathname === '/en';

  return (
    <header
      className={`sticky top-0 z-40 px-3 pt-2.5 pointer-events-none ${overHero ? '-mb-[74px]' : ''}`}
    >
      <div
        className={`pointer-events-auto mx-auto max-w-[1304px] rounded-3xl glass-sheen ${
          overHero ? 'glass' : 'glass-strong'
        }`}
      >
        <div className="h-16 px-4 sm:px-6 flex items-center gap-3">
          {/* โลโก้ / เมนู / ปุ่มภาษา — เหมือนเดิม */}
        </div>
      </div>
    </header>
  );
}
```

**Pages Router** — เปลี่ยนแค่วิธีอ่าน path:

```tsx
import { useRouter } from 'next/router';
const { pathname, locale } = useRouter();
const overHero = pathname === '/';
```

> `-mb-[74px]` ทำให้ Hero เลื่อนขึ้นไปอยู่ใต้ Navbar (74px = สูง 64 + ขอบบน 10) ใช้เฉพาะหน้าที่มีรูปเต็มจอด้านบน หน้าอื่นไม่ต้องใส่ ไม่งั้นหัวข้อจะโดน Navbar บัง

**อยากให้ Navbar ทึบขึ้นตอนเลื่อนลง** (อ่านง่ายเวลาอยู่บนรายการเรือ):

```tsx
const [compact, setCompact] = useState(false);
useEffect(() => {
  const on = () => setCompact(window.scrollY > 40);
  on(); window.addEventListener('scroll', on, { passive: true });
  return () => window.removeEventListener('scroll', on);
}, []);
// แล้วใช้ className={compact || !overHero ? 'glass-strong' : 'glass'}
```

### 4.2 เมนูมือถือ / Mega menu

```diff
- <div className="absolute left-3 right-3 top-full mt-2 bg-white ring-1 ring-black/5 rounded-[22px] shadow-float">
+ <div className="absolute left-3 right-3 top-full mt-2 glass-strong rounded-3xl">
```

### 4.3 Hero — ปุ่มรอง, ปุ่มเลื่อนสไลด์, แถบค้นหา

```diff
  {/* ปุ่มหลัก: คงสีขาวทึบ แต่เป็นแคปซูล + เงา */}
- <Link href="/yacht-charter" className="h-11 px-6 bg-white text-ink">
+ <Link href="/yacht-charter" className="h-11 px-6 bg-white text-ink rounded-full shadow-[0_8px_24px_-10px_rgb(0_0_0/.45),inset_0_1px_0_#fff]">

  {/* ปุ่มรอง: กระจกบนรูปมืด */}
- <button className="h-11 px-6 text-white ring-1 ring-white/40 hover:bg-white/10">
+ <button className="h-11 px-6 rounded-full glass-on-dark hover:bg-white/25">

  {/* ปุ่มเลื่อนสไลด์ */}
- <button className="w-10 h-10 bg-white/15 backdrop-blur-md ring-1 ring-white/30">
+ <button className="w-10 h-10 rounded-full glass-on-dark">

  {/* แถบค้นหาที่วางทับขอบล่างของ Hero */}
- <div className="bg-white rounded-[22px] lg:rounded-full p-2">
+ <div className="glass-strong rounded-[22px] lg:rounded-full p-2">
```

### 4.4 การ์ดเรือ — เฉพาะป้ายและปุ่มที่อยู่บนรูป

```diff
- <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-ink text-[11px] px-2.5 py-1 rounded-full shadow-sm">ยอดนิยม</span>
+ <span className="absolute top-3 left-3 glass-chip text-ink text-[11px] px-2.5 py-1 rounded-full">ยอดนิยม</span>

- <button className="w-9 h-9 rounded-full bg-white/90 ...">♡</button>
+ <button className="w-9 h-9 rounded-full glass-chip ...">♡</button>
```

> ส่วนล่างของการ์ด (ชื่อเรือ จำนวนคน ราคา ปุ่มจอง) **คงพื้นขาวทึบ** — ถ้าทำเป็นกระจกทั้งใบบนพื้นขาว จะดูเทา ๆ และอ่านยากขึ้นโดยไม่ได้อะไรเพิ่ม

### 4.5 Modal จองเรือ

```tsx
<div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
  {/* ฉากหลัง: จางลง ให้เห็นหน้าเว็บ */}
  <div className="absolute inset-0 glass-veil" onClick={onClose} />

  <div className="relative h-full overflow-y-auto flex items-end sm:items-center justify-center sm:p-6">
    {/* แผงกระจก */}
    <div className="relative w-full sm:max-w-2xl glass-panel rounded-t-[28px] sm:rounded-[28px] overflow-hidden">
      {/* หัวแผงสีแบรนด์ โปร่งเล็กน้อย */}
      <div className="px-6 py-4 text-white bg-gradient-to-br from-[rgb(112_0_14/.9)] to-[rgb(79_0_10/.86)]">
        <p className="text-xs tracking-widest">BOOKING REQUEST</p>
        <h3 className="text-xl">จองเรือ & กิจกรรม</h3>
      </div>
      <form className="p-6 grid gap-4">{/* ช่องกรอก — พื้นขาวโปร่งให้อัตโนมัติจาก .glass-panel */}</form>
    </div>
  </div>
</div>
```

### 4.6 Toast / Cookie bar / ปุ่มจองลอยบนมือถือ / แถบเปรียบเทียบ

```diff
- <div className="bg-white rounded-xl shadow-float p-4">  {/* cookie bar */}
+ <div className="glass rounded-3xl p-4">

- <button className="fixed bottom-4 inset-x-4 bg-maroon text-white rounded-full shadow-float">จองเรือด่วน</button>
+ <button className="fixed bottom-4 inset-x-4 glass-brand rounded-full">จองเรือด่วน</button>

- <div className="... bg-maroon-900 text-white shadow-float">  {/* แถบเปรียบเทียบเรือ */}
+ <div className="... glass-brand rounded-full">

- <div className="bg-ink text-white rounded-full px-4 h-10">  {/* toast */}
+ <div className="glass-ink rounded-full px-4 h-10">
```

---

## 5. ขั้นที่ 4 — ใส่ในหลังบ้าน

หลังบ้านเป็นพื้นสีเรียบ ต้อง **ใส่พื้นหลังไล่สี** ก่อน กระจกถึงจะมีอะไรให้เบลอ

### 5.1 Layout หลังบ้าน

```tsx
// app/(admin)/admin/layout.tsx  หรือ  components/AdminLayout.tsx (Pages Router)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen glass-backdrop flex">
      <aside className="fixed lg:sticky top-0 h-screen w-[236px] glass shadow-none
                        [box-shadow:inset_-1px_0_0_rgb(255_255_255/.8)]">
        {/* เมนูข้าง */}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-16 glass [box-shadow:inset_0_-1px_0_rgb(255_255_255/.8)]">
          {/* หัวเรื่องหน้า / ค้นหา */}
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 5.2 เมนูข้างที่เลือกอยู่

```diff
- <a className={active ? 'bg-maroon-50 text-maroon' : 'text-muted hover:bg-sand'}>
+ <a className={active ? 'bg-white/85 text-maroon shadow-[inset_0_1px_0_#fff,0_4px_14px_-8px_rgb(112_0_14/.35)]' : 'text-muted hover:bg-white/60'}>
```

### 5.3 การ์ด (KPI / ตาราง)

ใช้กระจกบาง ๆ (ทึบ 72%) ตัวเลขยังคมชัด:

```diff
- <div className="bg-white rounded-2xl ring-1 ring-black/5">
+ <div className="rounded-[20px] bg-white/70 backdrop-blur-xl backdrop-saturate-150
+                 shadow-[0_12px_36px_-18px_rgb(58_0_7/.28),inset_0_1px_0_#fff,inset_0_0_0_1px_rgb(255_255_255/.5)]">
```

> ตารางยาว ๆ: ใส่กระจกที่ **การ์ดที่ครอบตาราง** ครั้งเดียว อย่าใส่ทีละแถว (ดูข้อ 6 เรื่องประสิทธิภาพ)

### 5.4 Drawer รายละเอียดลีด และ Modal

```diff
- <div className="fixed inset-0 bg-black/30" />
+ <div className="fixed inset-0 glass-veil" />

- <aside className="fixed right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl">
+ <aside className="fixed right-0 top-0 h-full w-full max-w-[520px] glass-panel">
```

---

## 6. ข้อควรระวัง (สำคัญ)

### 6.1 `backdrop-filter` ไม่ทำงาน — สาเหตุที่เจอบ่อย

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| Safari ไม่เบลอ | ไม่มี prefix | ต้องมี `-webkit-backdrop-filter` (ใน `glass.css` มีแล้ว) — ถ้าใช้ class ของ Tailwind `backdrop-blur-*` ต้องมี `autoprefixer` ใน `postcss.config` (โปรเจกต์ Next + Tailwind ปกติมีอยู่แล้ว) |
| เบลอไม่ติด / เห็นแค่สีขาว | ด้านหลังไม่มีอะไร (พื้นขาวล้วน) | วางให้ลอยทับรูป หรือใช้ `.glass-backdrop` |
| เบลอหายเมื่อเปิด dropdown ข้างใน | parent มี `overflow: hidden` + `transform` / `filter` | ย้ายกระจกไปที่ element ที่ไม่มี `transform`, หรือเลิกใช้ `filter` บน parent |
| กระจกซ้อนกระจกดูขุ่นเป็นฝ้า | ใช้ `.glass` ข้างใน `.glass` | ชั้นในใช้ `bg-white/60` ธรรมดา **ไม่ต้องใส่ blur ซ้ำ** |
| ข้อความ/โลโก้ใน navbar โดนเงาสะท้อนทับ | `::before` อยู่บนเนื้อหา | ใช้ `.glass-sheen` (มี `isolation` + `z-index:-1` ให้แล้ว) |

### 6.2 อ่านง่าย (Contrast)

- ข้อความบนกระจกขาว → ใช้สีเข้ม (`text-ink`) ไม่ใช้เทาอ่อน
- ข้อความบนกระจกที่ลอยบนรูปมืด → ใช้ `.glass-on-dark` + ตัวอักษรสีขาว
- ตรวจ contrast ≥ 4.5:1 กับรูปที่ **สว่างที่สุด** ในสไลด์ (เช่น รูปท้องฟ้า/ดาดฟ้าเรือสีขาว) ถ้าไม่ผ่าน ให้เพิ่มความทึบ (`--g-bg` เป็น .7)

### 6.3 ประสิทธิภาพ

- `backdrop-filter` กินแรงเครื่อง **ต่อชิ้นและต่อพื้นที่** — หลีกเลี่ยงการใส่ให้ทุกการ์ดในรายการ 70 ลำ (ใส่ได้เฉพาะป้ายเล็กบนรูป ซึ่งพื้นที่น้อย)
- มือถือ: ลด blur ลงได้ถ้าเลื่อนแล้วกระตุก
  ```css
  @media (max-width: 640px) { :root { --g-blur: blur(14px) saturate(170%); } }
  ```
- อย่าใส่ `transition` ให้ `backdrop-filter` (ทำให้กระตุกตอน hover) ให้ transition แค่ `background-color`
- `next/image` ใช้ร่วมได้ปกติ ไม่ต้องแก้

### 6.4 SSR / Hydration

- `glass.css` เป็น CSS ล้วน ไม่มีผลกับ SSR
- Navbar ที่ใช้ `usePathname` / `useRouter` ต้องเป็น Client Component (`'use client'`) ใน App Router
- ค่า `compact` (ตอนเลื่อน) ตั้งค่าเริ่มต้นเป็น `false` เพื่อให้ HTML จากเซิร์ฟเวอร์ตรงกับรอบแรกบนเบราว์เซอร์

---

## 7. เช็กลิสต์ทดสอบ

- [ ] Chrome, Safari (Mac + iPhone), Firefox — กระจกเบลอขึ้นทุกตัว
- [ ] หน้าแรก: Navbar ลอยทับรูป Hero, โลโก้/เมนูอ่านออกทุกสไลด์
- [ ] เลื่อนลง: Navbar ทึบขึ้น, รายการเรือด้านหลังเบลอสวย ไม่กระตุก
- [ ] หน้าอื่น (หน้าเรือ / บทความ): หัวข้อไม่โดน Navbar บัง
- [ ] เปิด Modal จองเรือ: เห็นหน้าเว็บจาง ๆ ด้านหลัง, ฟอร์มอ่านและกรอกได้ชัด
- [ ] มือถือ: ปุ่มจองลอย, Cookie bar, เมนูมือถือ
- [ ] หลังบ้าน: แดชบอร์ด, ตารางลีด, Drawer, Modal ตัวเลขคมชัด
- [ ] เครื่องมือ Lighthouse / DevTools Performance ไม่มี "Long frames" ตอนเลื่อน
- [ ] macOS: เปิด *System Settings → Accessibility → Display → Reduce transparency* แล้วหน้าเว็บกลับเป็นพื้นทึบ

---

## 8. วิธีย้อนกลับ

1. ลบบรรทัด `import './glass.css'` ใน `app/layout.tsx` หรือ `pages/_app.tsx`
2. class `.glass-*` ที่ใส่ไว้ใน component จะไม่มีผลอะไร (เป็นแค่ชื่อ class เปล่า) — ค่อยทยอยลบทีหลังได้
3. ยกเว้นจุดที่แก้ layout: `-mb-[74px]` ของ Navbar หน้าแรก — ต้องลบออกด้วย

> แนะนำทำใน branch แยก (`git checkout -b liquid-glass`) แล้วเปิด Preview ให้ทีมดูบนมือถือจริงก่อน merge
