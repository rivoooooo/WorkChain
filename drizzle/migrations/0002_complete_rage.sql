CREATE TABLE "company_change_approvals" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"proposal_id" varchar(255) NOT NULL,
	"voter_key" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_change_approvals_voter_unique" UNIQUE("proposal_id","voter_key")
);
--> statement-breakpoint
ALTER TABLE "company_change_approvals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "company_change_proposals" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"base_version_id" varchar(255) NOT NULL,
	"changes" jsonb NOT NULL,
	"changes_hash" varchar(64) NOT NULL,
	"required_approvals" integer NOT NULL,
	"proposer_key" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_change_proposals_content_unique" UNIQUE("company_id","base_version_id","changes_hash"),
	CONSTRAINT "company_change_proposals_required_approvals_positive" CHECK ("company_change_proposals"."required_approvals" > 0),
	CONSTRAINT "company_change_proposals_hash_format" CHECK ("company_change_proposals"."changes_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "company_change_proposals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "company_profile_versions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"previous_version_id" varchar(255),
	"source_type" varchar(50) NOT NULL,
	"source_ref" varchar(255),
	"profile_data" jsonb NOT NULL,
	"profile_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_profile_versions_company_hash_unique" UNIQUE("company_id","profile_hash"),
	CONSTRAINT "company_profile_versions_hash_format" CHECK ("company_profile_versions"."profile_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "company_profile_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "company_proposal_resolutions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"proposal_id" varchar(255) NOT NULL,
	"result" varchar(30) NOT NULL,
	"resulting_version_id" varchar(255),
	"approval_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_proposal_resolutions_proposal_id_unique" UNIQUE("proposal_id"),
	CONSTRAINT "company_proposal_resolutions_result" CHECK ("company_proposal_resolutions"."result" in ('accepted', 'conflicted', 'superseded')),
	CONSTRAINT "company_proposal_resolutions_approval_count_non_negative" CHECK ("company_proposal_resolutions"."approval_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "company_proposal_resolutions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "data_snapshots" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"snapshot_date" varchar(10) NOT NULL,
	"object_prefix" text NOT NULL,
	"manifest_path" text NOT NULL,
	"manifest_hash" varchar(64) NOT NULL,
	"files" jsonb NOT NULL,
	"row_counts" jsonb NOT NULL,
	"size_bytes" numeric(20, 0) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "data_snapshots_date_unique" UNIQUE("snapshot_date"),
	CONSTRAINT "data_snapshots_manifest_hash_format" CHECK ("data_snapshots"."manifest_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "data_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "company_details" DROP CONSTRAINT "fk_company_details_company";
--> statement-breakpoint
ALTER TABLE "company_links" DROP CONSTRAINT "fk_company_links_company";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "fk_reviews_company";
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "previous_hash" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "previous_hash" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "hash" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "creation_source" varchar(50) DEFAULT 'legacy';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "creation_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "company_links" ADD COLUMN "content_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "hash_version" integer;--> statement-breakpoint
ALTER TABLE "company_change_approvals" ADD CONSTRAINT "fk_company_change_approvals_proposal" FOREIGN KEY ("proposal_id") REFERENCES "public"."company_change_proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_change_proposals" ADD CONSTRAINT "fk_company_change_proposals_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_change_proposals" ADD CONSTRAINT "fk_company_change_proposals_base_version" FOREIGN KEY ("base_version_id") REFERENCES "public"."company_profile_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profile_versions" ADD CONSTRAINT "fk_company_profile_versions_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_proposal_resolutions" ADD CONSTRAINT "fk_company_proposal_resolutions_proposal" FOREIGN KEY ("proposal_id") REFERENCES "public"."company_change_proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_company_change_approvals_proposal" ON "company_change_approvals" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "idx_company_change_proposals_company_created" ON "company_change_proposals" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_company_profile_versions_company_created" ON "company_profile_versions" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "company_profile_versions_source_ref_unique" ON "company_profile_versions" USING btree ("source_type","source_ref") WHERE "company_profile_versions"."source_ref" is not null;--> statement-breakpoint
CREATE INDEX "idx_data_snapshots_created_at" ON "data_snapshots" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "company_details" ADD CONSTRAINT "fk_company_details_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_links" ADD CONSTRAINT "fk_company_links_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_companies_creation_hash" ON "companies" USING btree ("creation_hash") WHERE "companies"."creation_hash" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "company_links_content_hash_unique" ON "company_links" USING btree ("company_id","content_hash") WHERE "company_links"."content_hash" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_company_previous_hash_unique" ON "reviews" USING btree ("company_id","previous_hash") WHERE "reviews"."previous_hash" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_company_genesis_unique" ON "reviews" USING btree ("company_id") WHERE "reviews"."previous_hash" is null;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hash_unique" UNIQUE("hash");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_company_hash_unique" UNIQUE("company_id","hash");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_salary_non_negative" CHECK ("reviews"."salary" >= 0);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bonus_non_negative" CHECK ("reviews"."bonus" >= 0);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_experience_non_negative" CHECK ("reviews"."experience_years" >= 0);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_career_range" CHECK ("reviews"."rating_career" between 1 and 5);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_balance_range" CHECK ("reviews"."rating_balance" between 1 and 5);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_management_range" CHECK ("reviews"."rating_management" between 1 and 5);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_compensation_range" CHECK ("reviews"."rating_compensation" between 1 and 5);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_culture_range" CHECK ("reviews"."rating_culture" between 1 and 5);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hash_format" CHECK ("reviews"."hash" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
CREATE VIEW "public"."company_proposal_status" AS (
  select
    p.id as proposal_id,
    p.company_id,
    p.required_approvals,
    count(a.id)::integer as approval_count,
    r.result as resolution,
    r.resulting_version_id
  from company_change_proposals p
  left join company_change_approvals a on a.proposal_id = p.id
  left join company_proposal_resolutions r on r.proposal_id = p.id
  group by p.id, p.company_id, p.required_approvals, r.result, r.resulting_version_id
);--> statement-breakpoint
CREATE VIEW "public"."company_statistics" AS (
  select
    company_id,
    count(*)::integer as review_count,
    round(avg((rating_career + rating_balance + rating_management + rating_compensation + rating_culture)::numeric / 5), 2) as avg_rating,
    round(avg(rating_career)::numeric, 2) as avg_career,
    round(avg(rating_balance)::numeric, 2) as avg_balance,
    round(avg(rating_management)::numeric, 2) as avg_management,
    round(avg(rating_compensation)::numeric, 2) as avg_compensation,
    round(avg(rating_culture)::numeric, 2) as avg_culture,
    coalesce(round(avg(salary) filter (where salary > 0)), 0)::integer as avg_salary,
    coalesce(round(avg(bonus) filter (where bonus > 0)), 0)::integer as avg_bonus
  from reviews
  group by company_id
);--> statement-breakpoint
CREATE VIEW "public"."current_company_profiles" AS (
  select distinct on (company_id)
    company_id,
    id as version_id,
    profile_data,
    profile_hash,
    created_at
  from company_profile_versions
  order by company_id, created_at desc, id desc
);--> statement-breakpoint
DROP POLICY "Allow select for backups_binary" ON "backups_binary" CASCADE;--> statement-breakpoint
DROP POLICY "Allow insert for backups_binary" ON "backups_binary" CASCADE;--> statement-breakpoint
DROP POLICY "Allow update for backups_binary" ON "backups_binary" CASCADE;--> statement-breakpoint
DROP POLICY "Allow delete for backups_binary" ON "backups_binary" CASCADE;--> statement-breakpoint
DROP POLICY "Allow select for backups_metadata" ON "backups_metadata" CASCADE;--> statement-breakpoint
DROP POLICY "Allow insert for backups_metadata" ON "backups_metadata" CASCADE;--> statement-breakpoint
DROP POLICY "Allow update for backups_metadata" ON "backups_metadata" CASCADE;--> statement-breakpoint
DROP POLICY "Allow delete for backups_metadata" ON "backups_metadata" CASCADE;--> statement-breakpoint
DROP POLICY "Allow select for companies" ON "companies" CASCADE;--> statement-breakpoint
DROP POLICY "Allow insert for companies" ON "companies" CASCADE;--> statement-breakpoint
DROP POLICY "Allow update for companies" ON "companies" CASCADE;--> statement-breakpoint
DROP POLICY "Allow delete for companies" ON "companies" CASCADE;--> statement-breakpoint
DROP POLICY "Allow select for company_details" ON "company_details" CASCADE;--> statement-breakpoint
DROP POLICY "Allow insert for company_details" ON "company_details" CASCADE;--> statement-breakpoint
DROP POLICY "Allow update for company_details" ON "company_details" CASCADE;--> statement-breakpoint
DROP POLICY "Allow delete for company_details" ON "company_details" CASCADE;--> statement-breakpoint
DROP POLICY "Allow select for company_links" ON "company_links" CASCADE;--> statement-breakpoint
DROP POLICY "Allow insert for company_links" ON "company_links" CASCADE;--> statement-breakpoint
DROP POLICY "Allow update for company_links" ON "company_links" CASCADE;--> statement-breakpoint
DROP POLICY "Allow delete for company_links" ON "company_links" CASCADE;--> statement-breakpoint
DROP POLICY "Allow select for geo_cities" ON "geo_cities" CASCADE;--> statement-breakpoint
DROP POLICY "Allow insert for geo_cities" ON "geo_cities" CASCADE;--> statement-breakpoint
DROP POLICY "Allow update for geo_cities" ON "geo_cities" CASCADE;--> statement-breakpoint
DROP POLICY "Allow delete for geo_cities" ON "geo_cities" CASCADE;--> statement-breakpoint
DROP POLICY "Allow select for geo_countries" ON "geo_countries" CASCADE;--> statement-breakpoint
DROP POLICY "Allow insert for geo_countries" ON "geo_countries" CASCADE;--> statement-breakpoint
DROP POLICY "Allow update for geo_countries" ON "geo_countries" CASCADE;--> statement-breakpoint
DROP POLICY "Allow delete for geo_countries" ON "geo_countries" CASCADE;--> statement-breakpoint
DROP POLICY "Allow select for reviews" ON "reviews" CASCADE;--> statement-breakpoint
DROP POLICY "Allow insert for reviews" ON "reviews" CASCADE;--> statement-breakpoint
DROP POLICY "Allow update for reviews" ON "reviews" CASCADE;--> statement-breakpoint
DROP POLICY "Allow delete for reviews" ON "reviews" CASCADE;--> statement-breakpoint
CREATE POLICY "Allow anonymous read for backups_metadata" ON "backups_metadata" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for companies" ON "companies" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for company_details" ON "company_details" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for company_links" ON "company_links" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for geo_cities" ON "geo_cities" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for geo_countries" ON "geo_countries" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for reviews" ON "reviews" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for company_change_approvals" ON "company_change_approvals" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for company_change_proposals" ON "company_change_proposals" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for company_profile_versions" ON "company_profile_versions" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for company_proposal_resolutions" ON "company_proposal_resolutions" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "Allow anonymous read for data_snapshots" ON "data_snapshots" AS PERMISSIVE FOR SELECT TO "anon" USING (true);