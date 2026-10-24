CREATE TABLE "media" (
	"url" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"dir" text DEFAULT 'new' NOT NULL,
	"alt" jsonb DEFAULT '{"th":"","en":""}'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rights" text DEFAULT 'unknown' NOT NULL,
	"credit" text DEFAULT '' NOT NULL,
	"focal" jsonb DEFAULT '{"x":50,"y":50}'::jsonb NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"width" integer,
	"height" integer,
	"size" integer,
	"uploaded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;