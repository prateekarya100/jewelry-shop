// Run once with: npm run seed-admin
// Creates (or updates the password of) the admin account, using
// ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from server/.env.
import 'dotenv/config';
import { pool, initSchema } from './db.js';
import { findByEmailOrPhone, createUser, updatePassword } from './users-db.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Admin' } = process.env;

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before running this.');
    process.exit(1);
  }

  await initSchema();

  const existing = await findByEmailOrPhone(ADMIN_EMAIL);
  if (existing) {
    await updatePassword(existing.id, ADMIN_PASSWORD);
    console.log(`✅ Admin account already existed (${ADMIN_EMAIL}) — password updated.`);
  } else {
    await createUser({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`✅ Admin account created: ${ADMIN_EMAIL}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
