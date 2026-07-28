import postgres from 'postgres';

const ownerUrl = process.env.DATABASE_OWNER_URL || process.env.DATABASE_URL;
if (!ownerUrl) {
  throw new Error('DATABASE_OWNER_URL is required to configure public reads.');
}

const sql = postgres(ownerUrl, { prepare: false, max: 1 });
const publicReadTables = [
  'companies',
  'reviews',
  'company_details',
  'company_links',
  'company_profile_versions',
  'location_countries',
  'location_cities',
] as const;

try {
  await sql.begin(async (tx) => {
    await tx`grant usage on schema public to anon`;
    await tx`
      grant select on table
        companies,
        reviews,
        company_details,
        company_links,
        company_profile_versions,
        location_countries,
        location_cities,
        current_company_profiles,
        company_statistics
      to anon
    `;
    // drizzle-kit push can preserve an existing policy whose stored USING
    // expression drifted to NULL. Repair the effective database policy after
    // every push so anon reads cannot silently return an empty result.
    for (const table of publicReadTables) {
      await tx.unsafe(
        `alter policy "Allow anonymous read for ${table}" ` +
          `on "${table}" to anon using (true)`
      );
    }
  });
  console.log('Granted anonymous read-only access to public application data.');
} finally {
  await sql.end();
}
