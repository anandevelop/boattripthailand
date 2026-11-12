-- ลีด → เอกสาร: ใบเสนอราคา / ใบยืนยันการจอง (lib/lead-docs.ts)
CREATE TABLE IF NOT EXISTS "lead_docs" (
  "id" serial PRIMARY KEY,
  "no" text NOT NULL UNIQUE,
  "lead_id" text NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "kind" text NOT NULL,
  "lang" text NOT NULL DEFAULT 'th',
  "data" jsonb NOT NULL,
  "total" integer NOT NULL DEFAULT 0,
  "created_by" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "sent_at" timestamptz,
  "sent_to" text
);
CREATE INDEX IF NOT EXISTS "lead_docs_lead" ON "lead_docs" ("lead_id");
