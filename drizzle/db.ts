import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.APP_DATABASE_URL || process.env.DATABASE_URL || '';

// Create postgres query client
export const sqlClient = postgres(connectionString, { prepare: false });

export const db = drizzle(sqlClient, { schema });
