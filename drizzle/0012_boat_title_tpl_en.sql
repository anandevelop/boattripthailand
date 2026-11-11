-- ศูนย์ SEO → ตั้งค่า → Title หน้าเรือ (EN): ตัดคำว่า "Yacht" (และ "from") ออก ให้ Title หน้าเรือภาษาอังกฤษไม่เกิน ~60 ตัวอักษร
-- "Black Wing 54 ft Yacht Charter Phuket $1,167 | Boat Trip Thailand" (65) → "Black Wing 54 ft Charter Phuket $1,167 | Boat Trip Thailand" (59)
-- เปลี่ยนเฉพาะเมื่อ template ยังมี "Yacht Charter Phuket" อยู่ · รันซ้ำได้
UPDATE settings
SET value = jsonb_set(value, '{sset,tpl,boat,en}',
  to_jsonb(regexp_replace(value #>> '{sset,tpl,boat,en}', 'Yacht Charter Phuket( from)?', 'Charter Phuket')))
WHERE key = 'seo.config' AND value #>> '{sset,tpl,boat,en}' LIKE '%Yacht Charter Phuket%';
