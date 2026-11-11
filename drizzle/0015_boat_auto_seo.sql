-- หน้าเรือ: SEO Title / Description ที่ระบบเคยเติมให้อัตโนมัติ (แบบ "… Yacht Charter Phuket – from $1,167 | BTT")
-- ล้างออก ให้ใช้ template ในศูนย์ SEO แทน (ราคาตามตารางปัจจุบัน · Title ภาษาอังกฤษไม่เกิน 60 ตัว)
-- ข้อความที่ทีมเขียนเองไม่ตรงรูปแบบนี้ จึงไม่ถูกแตะ
UPDATE "boats" SET "data" = jsonb_set("data", '{i18n,seoTitle,en}', '""')
  WHERE "data" #>> '{i18n,seoTitle,en}' ~ '^.+ Yacht Charter (Phuket|Pattaya) – from \$[0-9,]+ \| BTT$';
UPDATE "boats" SET "data" = jsonb_set("data", '{i18n,seoTitle,th}', '""')
  WHERE "data" #>> '{i18n,seoTitle,th}' ~ '^.+ เช่าเรือ(ภูเก็ต|พัทยา) – เริ่ม ฿[0-9,]+ \| BTT$';
UPDATE "boats" SET "data" = jsonb_set("data", '{i18n,seoDesc,en}', '""')
  WHERE "data" #>> '{i18n,seoDesc,en}' ~ '^.+ for up to [0-9]+ guests from .+\. From \$[0-9,]+ incl\. crew & insurance\.$';
UPDATE "boats" SET "data" = jsonb_set("data", '{i18n,seoDesc,th}', '""')
  WHERE "data" #>> '{i18n,seoDesc,th}' ~ '^.+ รับได้ [0-9]+ คน ออกจาก .+ ราคาเริ่มต้น ฿[0-9,]+ รวมกัปตันและประกัน$';
