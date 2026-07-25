CREATE TABLE "company_details" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"legal_representative" varchar(255),
	"registered_capital" varchar(100),
	"business_scope" text,
	"registered_address" text,
	"establishment_date" varchar(50),
	"company_type" varchar(100),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "company_details_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
ALTER TABLE "company_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "company_links" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"storage_path" text,
	"title" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "company_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "geo_cities" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"ascii_name" varchar(200),
	"alternate_names" text,
	"chinese_name" varchar(200),
	"country_code" varchar(10) NOT NULL,
	"admin1_code" varchar(50),
	"latitude" numeric(10, 5),
	"longitude" numeric(10, 5)
);
--> statement-breakpoint
ALTER TABLE "geo_cities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "geo_countries" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"chinese_name" varchar(100)
);
--> statement-breakpoint
ALTER TABLE "geo_countries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "credit_code" varchar(50);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "country_code" varchar(10) DEFAULT 'CN';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "country_name" varchar(100) DEFAULT '中国';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "province" varchar(100);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "company_details" ADD CONSTRAINT "fk_company_details_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_links" ADD CONSTRAINT "fk_company_links_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_company_details_company_id" ON "company_details" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_company_links_company_id" ON "company_links" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_geo_cities_country" ON "geo_cities" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "idx_geo_cities_name" ON "geo_cities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_geo_cities_chinese_name" ON "geo_cities" USING btree ("chinese_name");--> statement-breakpoint
CREATE INDEX "idx_companies_credit_code" ON "companies" USING btree ("credit_code");--> statement-breakpoint
CREATE INDEX "idx_companies_location" ON "companies" USING btree ("country_code","province","city");--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_credit_code_unique" UNIQUE("credit_code");--> statement-breakpoint
CREATE POLICY "Allow update for backups_binary" ON "backups_binary" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow delete for backups_binary" ON "backups_binary" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow update for backups_metadata" ON "backups_metadata" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow delete for backups_metadata" ON "backups_metadata" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow update for companies" ON "companies" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow delete for companies" ON "companies" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow update for reviews" ON "reviews" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow delete for reviews" ON "reviews" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow select for company_details" ON "company_details" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow insert for company_details" ON "company_details" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow update for company_details" ON "company_details" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow delete for company_details" ON "company_details" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow select for company_links" ON "company_links" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow insert for company_links" ON "company_links" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow update for company_links" ON "company_links" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow delete for company_links" ON "company_links" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow select for geo_cities" ON "geo_cities" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow insert for geo_cities" ON "geo_cities" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow update for geo_cities" ON "geo_cities" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow delete for geo_cities" ON "geo_cities" AS PERMISSIVE FOR DELETE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow select for geo_countries" ON "geo_countries" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow insert for geo_countries" ON "geo_countries" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow update for geo_countries" ON "geo_countries" AS PERMISSIVE FOR UPDATE TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow delete for geo_countries" ON "geo_countries" AS PERMISSIVE FOR DELETE TO public USING (true);