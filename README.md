# Boat Trip Thailand — เว็บไซต์ + ระบบลีด

Next.js 15 (App Router) · Tailwind · PostgreSQL (Drizzle ORM) · Docker

เว็บนี้มีหน้าที่ **หาลีด** ส่วนเซลล์ **ปิดการขายเองทางแชท / โทร** จึงไม่มีระบบชำระเงินบนเว็บ

## หน้าเว็บ = ดีไซน์ mockup ที่อนุมัติแล้ว (ตรงทุกพิกเซล)

หน้าเว็บสาธารณะใช้โค้ดหน้าตาจาก mockup ชุดเดียวกับที่ออกแบบไว้ แต่ทำงานแบบเว็บจริง:

- **ทุกหน้ามี URL จริง** (`/yacht-charter/leopard-90-ft`, `/en/blog/...`) และ **เรนเดอร์เสร็จที่เซิร์ฟเวอร์** — Google เห็นเนื้อหา, title, description, canonical, hreflang และ JSON-LD ครบโดยไม่ต้องรัน JavaScript
- ในเบราว์เซอร์ สคริปต์เดิมของ mockup รันต่อ (เมนู, ค้นหา Ctrl+K, Smart Match, เปรียบเทียบเรือ, รายการโปรด, กิจกรรม, ฟอร์ม) และเปลี่ยนหน้าโดยไม่โหลดใหม่
- ข้อมูลเรือ ฤดูกาล และบทความดึงจากฐานข้อมูล · ฟอร์มส่งเข้า `/api/leads` → ระบบลีด + LINE

| ไฟล์ | หน้าที่ |
|---|---|
| `site/shell.html` | โครง HTML ของทุกหน้า (เมนู, footer, modal) |
| `public/site/app.js` | สคริปต์หน้าเว็บทั้งหมด (render ทุกหน้า) — **แก้ดีไซน์/ข้อความที่นี่** |
| `public/site/mockup.css` | CSS เฉพาะของดีไซน์ |
| `tailwind.site.config.js` | design tokens (สี ฟอนต์ ขนาด) — `npm run build:site` สร้าง `public/site/tw.css` |
| `src/lib/site-render.ts` | เรนเดอร์หน้าบนเซิร์ฟเวอร์ + แคช 5 นาที (`SITE_CACHE_SECONDS`) |
| `src/app/[[...path]]/route.ts` | ทุก URL หน้าเว็บ (404 จริงสำหรับหน้าที่ไม่มี) |
| `site-src/` | ไฟล์ mockup ต้นฉบับ + สคริปต์แปลง (เก็บไว้อ้างอิง) |

## หลังบ้าน `/admin` = ดีไซน์ mockup หลังบ้านที่อนุมัติแล้ว

หน้าตาและการใช้งานเหมือน mockup ทุกหน้า แต่ข้อมูลเป็นของจริงจากฐานข้อมูล และทุกการแก้ไขผ่านเซิร์ฟเวอร์:

- เปิด `/admin` → เซิร์ฟเวอร์ตรวจเซสชัน แล้วส่งเฉพาะข้อมูลที่ผู้ใช้คนนั้นมีสิทธิ์เห็น (Sales ได้แค่ลีด/ลูกค้าของตัวเอง ไม่ได้รับข้อมูลทีม บทความ หรือบันทึกกิจกรรมเลย)
- ทุกปุ่มที่แก้ข้อมูลเรียก `/api/admin/*` → ตรวจสิทธิ์ + ตรวจว่าเป็นงานของตัวเอง + บันทึก Audit log ที่เซิร์ฟเวอร์ (ไม่เชื่อสิ่งที่เบราว์เซอร์ส่งมา)
- **บันทึกจริงแล้ว**: ลีด (สถานะ, ติดต่อ, นัดติดตาม, เหตุผลไม่สำเร็จ, บันทึกภายใน, มอบหมาย, ยินยอม PDPA, เพิ่มลีด, Export CSV, ไฟล์ Google Ads), ทีม & สิทธิ์ (เพิ่ม/แก้/ปิดบัญชี/โอนงาน/ตั้งรหัสชั่วคราว), เรือ & ราคา (หน้าเว็บอัปเดตทันที, เปลี่ยน URL แล้วตั้ง 301 ให้อัตโนมัติ), ฤดูกาลราคา, บทความ (บันทึกอัตโนมัติ), ตั้งค่าเว็บ, บันทึกกิจกรรม + ตรวจสายแฮช, โปรไฟล์ (เปลี่ยนรหัสผ่าน, เชื่อม LINE)
- **ยังเป็นตัวอย่าง** (มีป้ายบอกในหน้า): กิจกรรม & ทัวร์, เนื้อหาหน้าแรก, คลังสื่อ (อัปโหลดรูป), ศูนย์ SEO, วิเคราะห์เว็บไซต์ (GA4/Search Console), การส่งกลุ่มเป้าหมายไป Meta/Google

| ไฟล์ | หน้าที่ |
|---|---|
| `site/admin-shell.html` | โครง HTML หลังบ้าน |
| `public/admin-app/app.js` | สคริปต์หลังบ้านทั้งหมด (สร้างจาก `site-src/admin/adm*.js` ด้วย `python3 site-src/admin/convert_admin.py`) |
| `site-src/admin/adm20.js` | ตัวเชื่อมดีไซน์กับเซิร์ฟเวอร์ (ส่งทุกการแก้ไขไป API) |
| `public/admin-app/admin.css` + `tailwind.admin.config.js` | สไตล์หลังบ้าน — `npm run build:admin` สร้าง `public/admin-app/tw.css` |
| `src/app/(admin)/admin/route.ts` | เปิด `/admin` + ส่งข้อมูลตามสิทธิ์ (`src/lib/admin-boot.ts`) |
| `src/app/api/admin/[...op]/route.ts` | API ของหลังบ้านทั้งหมด |

## มีอะไรบ้าง (เฟส 1)

| ส่วน | รายละเอียด |
|---|---|
| หน้าเว็บ | ตามดีไซน์ mockup ทุกหน้า: หน้าแรก, เรือทั้งหมด, หน้าเรือ (ราคาตามฤดูกาล), ทัวร์ & กิจกรรม, บทความ 148 เรื่อง, เกี่ยวกับเรา, ข้อกำหนด/ความเป็นส่วนตัว/คุกกี้ + หน้าปลายทาง 4 หน้า (พีพี / อ่าวพังงา / ราชา / เกาะไข่) · ไทยเป็นค่าเริ่มต้น อังกฤษอยู่ใต้ `/en` |
| SEO | title/description ทุกหน้า, canonical + hreflang, JSON-LD (TravelAgency, Product, BlogPosting, FAQPage, BreadcrumbList, TouristTrip), `sitemap.xml`, `robots.txt`, **redirect 301 จาก URL เดิมของ WordPress 294 รายการ** (ครั้งเดียว ไม่มี redirect ต่อกัน) |
| ฟอร์มลีด | ส่งที่มาของลูกค้าไปด้วย (utm, gclid, fbclid, referrer, หน้าแรกที่เข้า, จำนวนหน้า, เรือที่ดู, อุปกรณ์) · ช่องยินยอมรับข่าวสาร (ไม่ติ๊กไว้ก่อน ตาม PDPA) · กันบอท (honeypot + เวลา + rate limit) · ลูกค้าส่งซ้ำใน 24 ชม. รวมเป็นลีดเดิม |
| แจ้งเซลล์ | **LINE OA**: ส่งการ์ดลีดเข้า LINE ของเซลล์ที่ได้รับมอบหมาย มีปุ่ม “รับเรื่อง” / WhatsApp ลูกค้า / เปิดในระบบ · ลีดที่ไม่มีคนตอบเกิน 15 นาที แจ้งเตือนเข้ากลุ่มทีมขาย |
| มอบหมายลีด | วนตามลำดับ (round-robin) เฉพาะคนที่เปิด “รับลีดอัตโนมัติ” และพูดภาษาเดียวกับลูกค้า |
| หลังบ้าน `/admin` | ตามดีไซน์ mockup: แดชบอร์ดลีด, ลีด (ตาราง/บอร์ด, กรอง, คะแนน, ข้อความสำเร็จรูป, เรือทางเลือกที่ว่าง), ปฏิทินเรือ, ลูกค้า, ใช้ประโยชน์จากลีด, เรือ & ราคา, ฤดูกาลราคา, บทความ, ทีม & สิทธิ์, บันทึกกิจกรรม, ตั้งค่า · ลีดใหม่เข้ามาเองระหว่างเปิดหน้า (ทุก 45 วินาที) |
| สิทธิ์ | **Super Admin / Admin / Sales** ตรวจที่เซิร์ฟเวอร์ทุกหน้า ทุก action และทุก query · Sales เห็นเฉพาะลีดของตัวเอง · ปรับสิทธิ์รายคนได้ |
| ความปลอดภัย | รหัสผ่าน bcrypt · 2FA (TOTP) บังคับ Super Admin และ Admin · ล็อกบัญชี 15 นาทีเมื่อผิด 5 ครั้ง · หมดเวลาเมื่อไม่ใช้งาน 30 นาที · เปลี่ยนสิทธิ์/ปิดบัญชี = ยกเลิกเซสชันทันที |
| บันทึกกิจกรรม | ใคร ทำอะไร เมื่อไร ค่าก่อน → หลัง · **แก้ไข/ลบไม่ได้** (trigger ในฐานข้อมูล) · hash ต่อกันเป็นสาย ตรวจการแก้ย้อนหลังได้ |
| โฆษณา | Meta Pixel + Conversions API (Lead → QualifiedLead → Converted) · GA4 · โหลดเฉพาะเมื่อผู้ใช้ยอมรับคุกกี้ |

**ยังไม่มี**: บันทึกจริงของหน้า กิจกรรม/เนื้อหาหน้าแรก/คลังสื่อ/SEO/วิเคราะห์ (ดูด้านบน), ตั้งเวลาเผยแพร่บทความ, และหน้าเว็บยังไม่อ่านข้อมูลติดต่อ/ทีมจาก “ตั้งค่า”/“ทีม” (ใช้ค่าในดีไซน์)

---

## ติดตั้งบนเซิร์ฟเวอร์ (Docker)

ต้องมี Docker + Docker Compose (บน Mac ใช้ Docker Desktop หรือ Colima ได้)

```bash
cp .env.example .env          # แก้ค่าในไฟล์ (อย่างน้อย POSTGRES_PASSWORD, APP_URL)
docker compose up -d --build  # สร้างฐานข้อมูล + เว็บ (migration รันอัตโนมัติ)

# นำเข้าเรือ ฤดูกาล บทความ และ redirect (รันครั้งแรก และทุกครั้งที่แก้ไฟล์ใน data/)
docker compose exec app npx tsx scripts/seed.ts

# สร้าง Super Admin คนแรก — ระบบแสดงรหัสผ่านชั่วคราวครั้งเดียว
docker compose exec app npx tsx scripts/create-user.ts --email anan@boattripthailand.com --name ANAN --role SUPER_ADMIN
```

เปิด `http://localhost:3000/admin` → ล็อกอิน → สแกน QR ตั้ง 2FA → กดชื่อตัวเองมุมซ้ายล่างเพื่อเปลี่ยนรหัสผ่าน / เชื่อม LINE → เพิ่มทีมที่ “ทีมงาน & สิทธิ์” (ระบบแสดงรหัสผ่านชั่วคราวให้ส่งต่อ)

**HTTPS + โดเมนจริง**: ตั้ง DNS ของ `DOMAIN` ให้ชี้มาที่เซิร์ฟเวอร์ แล้ว `docker compose --profile https up -d` (Caddy ออกใบรับรองให้อัตโนมัติ)

**สำรองข้อมูล**: `docker compose exec db pg_dump -U btt btt > backup-$(date +%F).sql` (ควรตั้ง cron ทุกวัน)

## ตั้งค่า LINE OA (แจ้งเตือนลีด)

1. [LINE Developers](https://developers.line.biz/console/) → เลือก Provider → ช่อง Messaging API ของ LINE OA บริษัท
2. คัดลอก **Channel secret** และออก **Channel access token (long-lived)** ใส่ใน `.env` (`LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`) แล้ว `docker compose up -d`
3. Webhook URL: `https://<โดเมน>/api/line/webhook` → เปิด **Use webhook** → กด Verify
4. ใน LINE Official Account Manager: ปิด Auto-reply / Greeting ที่ไม่ต้องการ และเปิด **Allow bot to join group chats**
5. **เซลล์แต่ละคน**: เพิ่มเพื่อน LINE OA → ในหลังบ้านกดชื่อตัวเองมุมซ้ายล่าง → “สร้างรหัสเชื่อม LINE” → พิมพ์ `LINK 123456` ส่งใน LINE OA
6. **กลุ่มทีมขาย**: เชิญ LINE OA เข้ากลุ่ม ระบบบันทึกกลุ่มให้อัตโนมัติ (ดูสถานะที่ “ตั้งค่า” → การเชื่อมต่อ)

## พัฒนาบนเครื่อง

```bash
npm install
cp .env.example .env    # DATABASE_URL ชี้ไป Postgres บนเครื่อง
npm run db:migrate && npm run db:seed
npm run user:create -- --email you@boattripthailand.com --name You --role SUPER_ADMIN
npm run dev             # http://localhost:3000
```

แก้ schema ที่ `src/db/schema.ts` แล้ว `npm run db:generate` เพื่อสร้างไฟล์ migration ใหม่ใน `drizzle/`

## ย้ายจาก WordPress

1. ติดตั้งระบบนี้บนเซิร์ฟเวอร์ใหม่ + seed ข้อมูล ทดสอบผ่านโดเมนชั่วคราว
2. ตั้งค่า LINE OA / Pixel / GA4 แล้วลองส่งฟอร์มจริง 1 ครั้ง ดูว่าการ์ดลีดเข้า LINE
3. เปลี่ยน DNS ของโดเมนมาที่เซิร์ฟเวอร์ใหม่ (redirect 301 จาก URL เดิมทำงานทันที)
4. ส่ง `https://<โดเมน>/sitemap.xml` ใน Google Search Console และดูรายงาน “หน้าที่ไม่พบ (404)” 2–4 สัปดาห์แรก
5. รูปปกบทความยังโหลดจาก `boattripthailand.com/wp-content/...` — **ต้องดาวน์โหลดเก็บไว้ก่อนปิดเว็บเดิม**

## โครงสร้าง

```
site/ + public/site/     หน้าเว็บ (ดีไซน์ mockup) · src/app/[[...path]] เรนเดอร์ทุก URL
src/app/(admin)/admin/   หลังบ้าน (route.ts) + หน้าเข้าสู่ระบบ / 2FA
src/app/api/admin        API หลังบ้าน (ตรวจสิทธิ์ + audit ทุกครั้ง)
src/app/api/leads        รับลีดจากฟอร์ม
src/app/api/line/webhook LINE OA: เชื่อมบัญชี, กลุ่ม, ปุ่มรับเรื่อง
src/lib/                 auth, perms, leads, audit, line, meta, season (ราคาตามฤดูกาล)
src/middleware.ts        redirect 301 จาก WordPress + ภาษา
src/instrumentation.ts   งานเบื้องหลัง: แจ้งเตือนลีดเกินเวลา, ล้างเซสชัน
drizzle/                 migration (รวม trigger ห้ามแก้บันทึกกิจกรรม)
data/                    ข้อมูลตั้งต้นจากโบรชัวร์และ WordPress
```
