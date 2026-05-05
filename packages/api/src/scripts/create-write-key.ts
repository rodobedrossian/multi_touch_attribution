/**
 * Usage: npx tsx src/scripts/create-write-key.ts --domain example.com --label "Production"
 *
 * Inserts a new write key into the database and prints the key string to embed in the snippet.
 */
import 'dotenv/config';
import { randomBytes, createHash } from 'crypto';
import { randomUUID } from 'crypto';
import { getPool } from '../db/client';

async function main() {
  const args = process.argv.slice(2);
  const domainIdx = args.indexOf('--domain');
  const labelIdx = args.indexOf('--label');

  const domain = domainIdx !== -1 ? args[domainIdx + 1] : 'localhost';
  const label = labelIdx !== -1 ? args[labelIdx + 1] : 'Default';

  const id = randomUUID();
  const secret = randomBytes(32).toString('hex');
  const keyHash = createHash('sha256').update(secret).digest('hex');

  const pool = getPool();
  await pool.query(
    'INSERT INTO write_keys (id, secret, key_hash, domain, label) VALUES ($1, $2, $3, $4, $5)',
    [id, secret, keyHash, domain, label]
  );

  console.log('\n✅ Write key created successfully\n');
  console.log(`Key ID:     ${id}`);
  console.log(`Domain:     ${domain}`);
  console.log(`Label:      ${label}`);
  console.log('\n--- Embed this in your snippet install ---');
  console.log(`window.analyticsWriteKey = '${id}.${secret}';`);
  console.log('\n⚠️  Store the secret securely — it cannot be retrieved again.\n');

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
