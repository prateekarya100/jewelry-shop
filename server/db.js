import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.warn(
    '⚠️  DATABASE_URL is not set. Copy server/.env.example to server/.env and\n' +
    '    add your Postgres connection string (from Neon, Supabase, etc.).'
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Most free hosted Postgres providers (Neon, Supabase, etc.) require SSL.
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

export async function query(text, params) {
  return pool.query(text, params);
}

/** Runs a series of queries as one atomic transaction — if anything inside
 * throws (e.g. "not enough stock"), everything rolls back: no partial
 * order, no partial stock deduction. This is what makes stock deduction
 * safe even if two customers try to buy the last item at the same time. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Runs schema.sql on startup. Every statement is idempotent, so this is
 * safe to run every time the server starts — it only creates what's
 * missing, never touches existing data. */
export async function initSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(sql);
  console.log('✅ Database schema ready');
}
