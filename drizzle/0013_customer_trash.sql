-- ลูกค้า → ถังขยะ: ลูกค้าที่ลบจะอยู่ในถังขยะ 30 วันก่อนลบถาวร (lib/customer-trash.ts)
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "trash" jsonb;
