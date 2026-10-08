import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

/* One pooled client per process. Works the same against Vercel/Neon Postgres
   and against a plain Postgres on a VPS — only DATABASE_URL changes. */
const client = postgres(url, {
  max: Number(process.env.DB_POOL_MAX ?? 5),
  ssl: process.env.DB_SSL === 'require' ? 'require' : undefined,
});

export const db = drizzle(client, { schema });
export { schema };
