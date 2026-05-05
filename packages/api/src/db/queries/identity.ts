import { getPool } from '../client';

export interface UpsertIdentityParams {
  anonymous_id: string;
  user_id: string;
  email?: string | null;
  email_hash: string;
  name?: string | null;
  traits: Record<string, unknown>;
}

export async function upsertIdentity(params: UpsertIdentityParams): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO identity_map (anonymous_id, user_id, email, email_hash, name, traits, last_seen, merged_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     ON CONFLICT (anonymous_id) DO UPDATE SET
       user_id   = EXCLUDED.user_id,
       email     = EXCLUDED.email,
       email_hash= EXCLUDED.email_hash,
       name      = EXCLUDED.name,
       traits    = EXCLUDED.traits,
       last_seen = NOW()`,
    [
      params.anonymous_id, params.user_id,
      params.email ?? null, params.email_hash,
      params.name ?? null, JSON.stringify(params.traits),
    ]
  );
}

export async function getAnonymousIdsByEmailHash(emailHash: string): Promise<string[]> {
  const pool = getPool();
  const { rows } = await pool.query<{ anonymous_id: string }>(
    'SELECT anonymous_id FROM identity_map WHERE email_hash = $1',
    [emailHash]
  );
  return rows.map(r => r.anonymous_id);
}

export async function getUserIdByEmailHash(emailHash: string): Promise<string | null> {
  const pool = getPool();
  const { rows } = await pool.query<{ user_id: string }>(
    'SELECT user_id FROM identity_map WHERE email_hash = $1 LIMIT 1',
    [emailHash]
  );
  return rows[0]?.user_id ?? null;
}

export async function deleteByEmailHash(emailHash: string): Promise<number> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    'DELETE FROM identity_map WHERE email_hash = $1',
    [emailHash]
  );
  return rowCount ?? 0;
}
