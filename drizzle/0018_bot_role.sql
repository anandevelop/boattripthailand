-- บทบาท Bot: บัญชีสำหรับระบบอัตโนมัติ/AI ที่เข้ามาทำงานหลังบ้าน · ไม่เห็นลีด ลูกค้า ทีม บันทึกกิจกรรม · ไม่ใช้ 2FA (lib/perms.ts)
ALTER TYPE "public"."role" ADD VALUE IF NOT EXISTS 'BOT';
