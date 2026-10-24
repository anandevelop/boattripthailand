CREATE TABLE "conversion_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"lead_id" text,
	"event" text NOT NULL,
	"platform" text NOT NULL,
	"status" text NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "conversion_events_created" ON "conversion_events" USING btree ("created_at");