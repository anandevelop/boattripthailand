-- บทความ "เจาะลึกราคาเช่าเรือยอร…": slug ไทยที่ถูกตัดตอนนำเข้าจาก WordPress → slug อังกฤษ
-- 301 จาก URL เดิม (และ redirect เก่าที่ชี้มาที่ URL เดิม ชี้ไปที่ใหม่ ไม่ให้เป็น chain) · ลิงก์ในบทความอื่นเปลี่ยนเป็น URL ใหม่
-- รันซ้ำได้: ถ้าไม่เจอบทความ หรือ slug ใหม่ถูกใช้ไปแล้ว จะไม่ทำอะไร
DO $$
DECLARE pid integer; old text; nw text := 'phuket-yacht-charter-price-2026';
BEGIN
  SELECT id, slug_th INTO pid, old FROM posts WHERE slug_th LIKE 'เจาะลึกราคาเช่าเรือยอร%' ORDER BY id LIMIT 1;
  IF pid IS NULL OR EXISTS (SELECT 1 FROM posts WHERE slug_th = nw OR slug_en = nw) THEN RETURN; END IF;
  UPDATE posts SET slug_th = nw, updated_at = now() WHERE id = pid;
  UPDATE redirects SET "to" = '/blog/' || nw WHERE "to" = '/blog/' || old;
  INSERT INTO redirects ("from", "to", code) VALUES ('/blog/' || old, '/blog/' || nw, 301)
    ON CONFLICT ("from") DO UPDATE SET "to" = EXCLUDED."to", code = 301;
  DELETE FROM redirects WHERE "from" = '/blog/' || nw;
  -- links inside article bodies (href="…" is stored as href=\"…\" in the JSON text)
  UPDATE posts SET blocks = replace(blocks::text, '/blog/' || old || '\"', '/blog/' || nw || '\"')::jsonb
    WHERE strpos(blocks::text, '/blog/' || old || '\"') > 0;
END $$;
