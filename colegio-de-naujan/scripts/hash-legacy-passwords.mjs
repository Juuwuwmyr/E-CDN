/**
 * hash-legacy-passwords.mjs
 *
 * One-time migration: replaces any remaining PLAINTEXT passwords in
 * portal_users and student_accounts with bcrypt hashes (cost 10).
 * Rows that already store a bcrypt hash (starting with "$2") are
 * skipped, so re-running is safe.
 *
 * IMPORTANT: this script needs the SERVICE ROLE key (never the anon
 * key) so it can bypass RLS and update every row.
 *
 * Usage (from the colegio-de-naujan directory):
 *   SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   node scripts/hash-legacy-passwords.mjs
 */
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'Missing environment variables.\n' +
    'Run with: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/hash-legacy-passwords.mjs'
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const isPlaintext = (pw) => typeof pw === 'string' && pw.length > 0 && !pw.startsWith('$2');

async function migrateTable(table, idColumn) {
  const { data: rows, error } = await supabase
    .from(table)
    .select(`${idColumn}, password`);

  if (error) {
    console.error(`[${table}] fetch failed:`, error.message);
    return 0;
  }

  let migrated = 0;
  for (const row of rows || []) {
    if (!isPlaintext(row.password)) continue;
    const hashed = bcrypt.hashSync(row.password, 10);
    const { error: upErr } = await supabase
      .from(table)
      .update({ password: hashed })
      .eq(idColumn, row[idColumn]);
    if (upErr) {
      console.error(`[${table}] failed to hash ${idColumn}=${row[idColumn]}:`, upErr.message);
    } else {
      migrated += 1;
      console.log(`[${table}] hashed ${idColumn}=${row[idColumn]}`);
    }
  }
  return migrated;
}

console.log('Hashing legacy plaintext passwords…\n');
const portalCount = await migrateTable('portal_users', 'id');
const studentCount = await migrateTable('student_accounts', 'student_number');
console.log(`\nDone. portal_users: ${portalCount} hashed, student_accounts: ${studentCount} hashed.`);
console.log('Any rows skipped were already bcrypt hashes.');
