import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_OWNER_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_OWNER_URL or DATABASE_URL is required.');

const sql = postgres(databaseUrl, { max: 1 });

const [result] = await sql`
  select
    (select count(*) from reviews r
      where not exists (select 1 from companies c where c.id = r.company_id)
    )::integer as orphan_reviews,
    (select count(*) from company_details d
      where not exists (select 1 from companies c where c.id = d.company_id)
    )::integer as orphan_details,
    (select count(*) from company_links l
      where not exists (select 1 from companies c where c.id = l.company_id)
    )::integer as orphan_links,
    (select count(*) from (
      select company_id, previous_hash
      from reviews
      where previous_hash is not null
      group by company_id, previous_hash
      having count(*) > 1
    ) duplicates)::integer as duplicate_chain_links,
    (select count(*) from (
      select company_id
      from reviews
      where previous_hash is null
      group by company_id
      having count(*) > 1
    ) duplicates)::integer as duplicate_genesis_blocks
`;

await sql.end();
console.log(result);

const blockers = Object.entries(result).filter(([, value]) => Number(value) > 0);
if (blockers.length > 0) {
  throw new Error(
    `Database is not ready for immutable constraints: ${blockers
      .map(([key, value]) => `${key}=${value}`)
      .join(', ')}`
  );
}
