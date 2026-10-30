-- ตั้งเวลาเผยแพร่บทความ: when a scheduled article goes live (null = not scheduled)
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "publish_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_publish_at_idx" ON "posts" ("publish_at") WHERE "publish_at" IS NOT NULL;
