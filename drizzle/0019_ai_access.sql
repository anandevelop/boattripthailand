-- AI / MCP: API tokens, คำขอลบจาก AI (ต้องให้คนยืนยัน), งานเบื้องหลัง (อัปโหลดรูป นำเข้า PDF)
CREATE TABLE IF NOT EXISTS "api_tokens" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "prefix" text NOT NULL,
  "created_by_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz,
  "revoked_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "api_tokens_user_idx" ON "api_tokens" ("user_id");
CREATE TABLE IF NOT EXISTS "ai_requests" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "method" text NOT NULL,
  "path" text NOT NULL,
  "body" jsonb,
  "label" text NOT NULL,
  "reason" text,
  "code_hash" text NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'PENDING',
  "result" jsonb,
  "decided_by" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL,
  "decided_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "ai_requests_status_idx" ON "ai_requests" ("status");
CREATE TABLE IF NOT EXISTS "bg_jobs" (
  "id" text PRIMARY KEY,
  "kind" text NOT NULL,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "input" jsonb NOT NULL,
  "status" text NOT NULL DEFAULT 'QUEUED',
  "step" text,
  "result" jsonb,
  "error" text,
  "attempts" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "bg_jobs_status_idx" ON "bg_jobs" ("status", "created_at");
CREATE TABLE IF NOT EXISTS "ai_changes" (
  "id" text PRIMARY KEY,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "kind" text NOT NULL,
  "ref" text NOT NULL,
  "label" text NOT NULL,
  "before" jsonb,
  "undone_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ai_changes_created_idx" ON "ai_changes" ("created_at");
