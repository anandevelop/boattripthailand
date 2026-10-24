-- Audit log is append-only: nobody (not even Super Admin, not even the app) can edit or delete history.
CREATE OR REPLACE FUNCTION audit_logs_block_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_update BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION audit_logs_block_change();
--> statement-breakpoint
-- Truncate is a separate statement-level event
CREATE OR REPLACE FUNCTION audit_logs_block_truncate() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_logs_no_truncate ON audit_logs;
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON audit_logs FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_block_truncate();
