-- OAuth 2.1 สำหรับเชื่อม MCP เป็น Connector ใน claude.ai / Cowork (lib/oauth.ts)
ALTER TABLE "api_tokens" ADD COLUMN IF NOT EXISTS "grant_id" text;
ALTER TABLE "api_tokens" ADD COLUMN IF NOT EXISTS "expires_at" timestamptz;
CREATE TABLE IF NOT EXISTS "oauth_clients" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "redirect_uris" text[] NOT NULL,
  "meta" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "oauth_codes" (
  "code_hash" text PRIMARY KEY,
  "client_id" text NOT NULL,
  "grant_id" text NOT NULL,
  "redirect_uri" text NOT NULL,
  "challenge" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz
);
CREATE TABLE IF NOT EXISTS "oauth_grants" (
  "id" text PRIMARY KEY,
  "client_id" text NOT NULL,
  "client_name" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "approved_by_id" text,
  "refresh_hash" text UNIQUE,
  "refresh_expires_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz,
  "revoked_at" timestamptz
);
