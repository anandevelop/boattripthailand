-- ลีด → ถังขยะ: ลีดที่ลบจะอยู่ในถังขยะ 30 วันก่อนลบถาวร (lib/lead-trash.ts)
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "trash" jsonb;
