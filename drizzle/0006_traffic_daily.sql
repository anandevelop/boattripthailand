CREATE TABLE "traffic_daily" (
	"day" date NOT NULL,
	"path" text NOT NULL,
	"source" text NOT NULL,
	"device" text NOT NULL,
	"lang" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "traffic_daily_day_path_source_device_lang_pk" PRIMARY KEY("day","path","source","device","lang")
);
--> statement-breakpoint
CREATE INDEX "traffic_daily_day" ON "traffic_daily" USING btree ("day");