CREATE TABLE "backups_binary" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"csv_base64" text,
	"xlsx_base64" text,
	"sql_base64" text
);
--> statement-breakpoint
ALTER TABLE "backups_binary" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "backups_metadata" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"date" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"review_count" integer DEFAULT 0,
	"csv_size" integer DEFAULT 0,
	"xlsx_size" integer DEFAULT 0,
	"sql_size" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "backups_metadata" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"review_count" integer DEFAULT 0,
	"avg_rating" numeric(4, 2) DEFAULT '0.00',
	"avg_career" numeric(4, 2) DEFAULT '0.00',
	"avg_balance" numeric(4, 2) DEFAULT '0.00',
	"avg_management" numeric(4, 2) DEFAULT '0.00',
	"avg_compensation" numeric(4, 2) DEFAULT '0.00',
	"avg_culture" numeric(4, 2) DEFAULT '0.00',
	"avg_salary" integer DEFAULT 0,
	"avg_bonus" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"branch_location" varchar(255) NOT NULL,
	"position" varchar(255) NOT NULL,
	"employment_status" varchar(50) DEFAULT 'current',
	"salary" integer DEFAULT 0,
	"bonus" integer DEFAULT 0,
	"experience_years" integer DEFAULT 1,
	"rating_career" integer NOT NULL,
	"rating_balance" integer NOT NULL,
	"rating_management" integer NOT NULL,
	"rating_compensation" integer NOT NULL,
	"rating_culture" integer NOT NULL,
	"review_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"previous_hash" varchar(255) DEFAULT '0',
	"hash" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_backups_metadata_date" ON "backups_metadata" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_companies_name" ON "companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_reviews_company_id" ON "reviews" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_created_at" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE POLICY "Allow select for backups_binary" ON "backups_binary" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow insert for backups_binary" ON "backups_binary" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow select for backups_metadata" ON "backups_metadata" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow insert for backups_metadata" ON "backups_metadata" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow select for companies" ON "companies" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow insert for companies" ON "companies" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow select for reviews" ON "reviews" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow insert for reviews" ON "reviews" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);