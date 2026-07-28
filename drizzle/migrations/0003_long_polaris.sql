CREATE TABLE "location_cities" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"country_id" varchar(64) NOT NULL,
	"name" varchar(120) NOT NULL,
	"normalized_name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "location_cities_country_name_unique" UNIQUE("country_id","normalized_name")
);
--> statement-breakpoint
ALTER TABLE "location_cities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "location_countries" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"normalized_name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "location_countries_normalized_name_unique" UNIQUE("normalized_name")
);
--> statement-breakpoint
ALTER TABLE "location_countries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER VIEW "public"."company_proposal_status" SET (security_invoker = true);--> statement-breakpoint
ALTER VIEW "public"."company_statistics" SET (security_invoker = true);--> statement-breakpoint
ALTER VIEW "public"."current_company_profiles" SET (security_invoker = true);--> statement-breakpoint
ALTER TABLE "companies" DROP CONSTRAINT "companies_credit_code_unique";--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "daily_work_hours" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "weekly_work_days" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "location_cities" ADD CONSTRAINT "fk_location_cities_country" FOREIGN KEY ("country_id") REFERENCES "public"."location_countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_location_cities_name" ON "location_cities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_location_countries_name" ON "location_countries" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_name_region_unique" ON "companies" USING btree (lower("name"),lower(coalesce("country_name", "country_code", '')),lower(coalesce("province", '')),lower(coalesce("city", '')));--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_daily_work_hours_range" CHECK ("reviews"."daily_work_hours" is null or "reviews"."daily_work_hours" > 0 and "reviews"."daily_work_hours" <= 24);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_weekly_work_days_range" CHECK ("reviews"."weekly_work_days" is null or "reviews"."weekly_work_days" > 0 and "reviews"."weekly_work_days" <= 7);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for location_cities" ON "location_cities" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for location_countries" ON "location_countries" AS PERMISSIVE FOR SELECT TO "anon" USING (true);