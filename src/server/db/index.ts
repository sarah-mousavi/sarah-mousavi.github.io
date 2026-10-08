import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/* Connect lazily: a missing DATABASE_URL must fail the request that needs the
   database, not the build or the pages that never touch it. */
let instance: PostgresJsDatabase<typeof schema> | null = null;

function connect(): PostgresJsDatabase<typeof schema> {
  if (instance) return instance;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const client = postgres(url, {
    max: Number(process.env.DB_POOL_MAX ?? 5),
    ssl: process.env.DB_SSL === 'require' ? 'require' : undefined,
  });
  instance = drizzle(client, { schema });
  return instance;
}

/* Same `db.…` call sites as before; the connection is made on first use. */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(connect() as object, prop, receiver);
  },
});

export const isDbConfigured = () => Boolean(process.env.DATABASE_URL);
export { schema };
