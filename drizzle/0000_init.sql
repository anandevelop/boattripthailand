CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'TALKING', 'WON', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'SALES');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	"role" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"ref" text,
	"label" text NOT NULL,
	"changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"note" text,
	"ip" text,
	"user_agent" text,
	"prev_hash" text NOT NULL,
	"hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boats" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subtitle" text,
	"type" text NOT NULL,
	"ft" double precision,
	"pax" integer,
	"marina" text,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"from_price" integer,
	"calendar_id" text,
	"data" jsonb NOT NULL,
	"images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"phone_norm" text NOT NULL,
	"email" text,
	"country" text,
	"lang" text DEFAULT 'th' NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"consent_at" timestamp with time zone,
	"consent_source" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_norm_unique" UNIQUE("phone_norm")
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"user_id" text,
	"type" text NOT NULL,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"customer_id" text NOT NULL,
	"status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"item" text,
	"boat_slug" text,
	"program" text,
	"trip_date" date,
	"adults" integer DEFAULT 2 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"slot" text,
	"message" text,
	"source" text DEFAULT 'direct' NOT NULL,
	"medium" text,
	"campaign" text,
	"content" text,
	"gclid" text,
	"fbclid" text,
	"referrer" text,
	"landing_page" text,
	"first_touch" jsonb,
	"pages_viewed" integer,
	"visits" integer,
	"boats_viewed" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"device" text,
	"lang" text DEFAULT 'th' NOT NULL,
	"contact_via" text DEFAULT 'web_form' NOT NULL,
	"event_id" text,
	"ip" text,
	"user_agent" text,
	"score" integer DEFAULT 0 NOT NULL,
	"score_reasons" jsonb,
	"assigned_to_id" text,
	"first_reply_at" timestamp with time zone,
	"next_follow_up" date,
	"lost_reason" text,
	"won_at" timestamp with time zone,
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug_th" text,
	"slug_en" text,
	"category" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"cover" text,
	"title" jsonb NOT NULL,
	"excerpt" jsonb NOT NULL,
	"seo_title" jsonb NOT NULL,
	"seo_desc" jsonb NOT NULL,
	"keywords" text,
	"blocks" jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_th_unique" UNIQUE("slug_th"),
	CONSTRAINT "posts_slug_en_unique" UNIQUE("slug_en")
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"from" text PRIMARY KEY NOT NULL,
	"to" text NOT NULL,
	"code" integer DEFAULT 301 NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season_calendars" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'season' NOT NULL,
	"ranges" jsonb NOT NULL,
	"special" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mfa_verified" boolean DEFAULT false NOT NULL,
	"session_version" integer NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"role" "role" DEFAULT 'SALES' NOT NULL,
	"perms" text[],
	"password_hash" text NOT NULL,
	"totp_secret" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"receives_leads" boolean DEFAULT true NOT NULL,
	"languages" text[] DEFAULT ARRAY['th']::text[] NOT NULL,
	"line_user_id" text,
	"line_link_code" text,
	"failed_logins" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"session_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_line_user_id_unique" UNIQUE("line_user_id"),
	CONSTRAINT "users_line_link_code_unique" UNIQUE("line_link_code")
);
--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_ts_idx" ON "audit_logs" USING btree ("ts");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity","ref");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("user_id","ts");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_idx" ON "lead_activities" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_status_created_idx" ON "leads" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "leads_assigned_idx" ON "leads" USING btree ("assigned_to_id","status");--> statement-breakpoint
CREATE INDEX "leads_customer_idx" ON "leads" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");