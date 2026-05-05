import { getPool } from '../client';

export interface InsertEventParams {
  type: string;
  anonymous_id: string;
  user_id?: string | null;
  session_id: string;
  write_key_id: string | null;
  timestamp: Date;
  url?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  properties: Record<string, unknown>;
  geo_country?: string | null;
  geo_city?: string | null;
  device_type?: string | null;
  browser?: string | null;
  os?: string | null;
  ip_address?: string | null;
}

export async function insertEvent(params: InsertEventParams): Promise<string> {
  const pool = getPool();
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO events (
      type, anonymous_id, user_id, session_id, write_key_id,
      timestamp, url, referrer,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      properties, geo_country, geo_city, device_type, browser, os, ip_address
    ) VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,
      $9,$10,$11,$12,$13,
      $14,$15,$16,$17,$18,$19,$20
    ) RETURNING id`,
    [
      params.type, params.anonymous_id, params.user_id ?? null, params.session_id, params.write_key_id,
      params.timestamp, params.url ?? null, params.referrer ?? null,
      params.utm_source ?? null, params.utm_medium ?? null, params.utm_campaign ?? null,
      params.utm_content ?? null, params.utm_term ?? null,
      JSON.stringify(params.properties),
      params.geo_country ?? null, params.geo_city ?? null,
      params.device_type ?? null, params.browser ?? null, params.os ?? null,
      params.ip_address ?? null,
    ]
  );
  return rows[0].id;
}

export async function backfillUserId(anonymousId: string, userId: string): Promise<number> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    'UPDATE events SET user_id = $1 WHERE anonymous_id = $2 AND user_id IS NULL',
    [userId, anonymousId]
  );
  return rowCount ?? 0;
}

export interface TouchpointRow {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  timestamp: Date;
}

export async function getLastTouch(anonymousId: string): Promise<TouchpointRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<TouchpointRow>(
    `SELECT utm_source, utm_medium, utm_campaign, utm_content, timestamp
     FROM events
     WHERE anonymous_id = $1 AND utm_source IS NOT NULL
     ORDER BY timestamp DESC
     LIMIT 1`,
    [anonymousId]
  );
  return rows[0] ?? null;
}

export async function getFirstTouch(anonymousId: string): Promise<TouchpointRow | null> {
  const pool = getPool();
  const { rows } = await pool.query<TouchpointRow>(
    `SELECT utm_source, utm_medium, utm_campaign, utm_content, timestamp
     FROM events
     WHERE anonymous_id = $1 AND utm_source IS NOT NULL
     ORDER BY timestamp ASC
     LIMIT 1`,
    [anonymousId]
  );
  return rows[0] ?? null;
}

export interface JourneyEvent {
  type: string;
  url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  timestamp: Date;
}

export async function getJourneyEvents(anonymousId: string): Promise<JourneyEvent[]> {
  const pool = getPool();
  const { rows } = await pool.query<JourneyEvent>(
    `SELECT type, url, utm_source, utm_medium, utm_campaign, utm_content, timestamp
     FROM events
     WHERE anonymous_id = $1
     ORDER BY timestamp ASC
     LIMIT 500`,
    [anonymousId]
  );
  return rows;
}

export async function getEventsByUserId(userId: string): Promise<JourneyEvent[]> {
  const pool = getPool();
  const { rows } = await pool.query<JourneyEvent>(
    `SELECT type, url, utm_source, utm_medium, utm_campaign, utm_content, timestamp
     FROM events
     WHERE user_id = $1
     ORDER BY timestamp ASC
     LIMIT 500`,
    [userId]
  );
  return rows;
}
