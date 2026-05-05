import { getPool } from '../client';
import { JourneyEvent } from './events';

export interface InsertConversionParams {
  user_id: string;
  anonymous_id: string;
  conversion_type: string;
  value?: number | null;
  currency?: string;
  last_touch_source?: string | null;
  last_touch_medium?: string | null;
  last_touch_campaign?: string | null;
  last_touch_content?: string | null;
  first_touch_source?: string | null;
  first_touch_medium?: string | null;
  first_touch_campaign?: string | null;
  first_touch_content?: string | null;
  journey_summary: JourneyEvent[];
}

export async function insertConversion(params: InsertConversionParams): Promise<string> {
  const pool = getPool();
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO conversions (
      user_id, anonymous_id, conversion_type, value, currency,
      last_touch_source, last_touch_medium, last_touch_campaign, last_touch_content,
      first_touch_source, first_touch_medium, first_touch_campaign, first_touch_content,
      journey_summary, touchpoint_count
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING id`,
    [
      params.user_id, params.anonymous_id, params.conversion_type,
      params.value ?? null, params.currency ?? 'USD',
      params.last_touch_source ?? null, params.last_touch_medium ?? null,
      params.last_touch_campaign ?? null, params.last_touch_content ?? null,
      params.first_touch_source ?? null, params.first_touch_medium ?? null,
      params.first_touch_campaign ?? null, params.first_touch_content ?? null,
      JSON.stringify(params.journey_summary),
      params.journey_summary.length,
    ]
  );
  return rows[0].id;
}

export interface ChannelRow {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  conversions: string;
  value: string | null;
}

export async function getChannelReport(
  from: Date,
  to: Date,
  conversionType?: string
): Promise<ChannelRow[]> {
  const pool = getPool();
  const { rows } = await pool.query<ChannelRow>(
    `SELECT
       last_touch_source    AS source,
       last_touch_medium    AS medium,
       last_touch_campaign  AS campaign,
       COUNT(*)::text       AS conversions,
       SUM(value)::text     AS value
     FROM conversions
     WHERE converted_at BETWEEN $1 AND $2
       AND ($3::text IS NULL OR conversion_type = $3)
     GROUP BY 1, 2, 3
     ORDER BY COUNT(*) DESC`,
    [from, to, conversionType ?? null]
  );
  return rows;
}

export interface ConversionSummaryRow {
  total_conversions: string;
  total_value: string | null;
  unique_users: string;
}

export interface DailyRow {
  date: string;
  conversions: string;
}

export async function getSummaryReport(from: Date, to: Date): Promise<{
  summary: ConversionSummaryRow;
  topChannel: ChannelRow | null;
  byDay: DailyRow[];
}> {
  const pool = getPool();

  const [summaryRes, channelRes, dailyRes] = await Promise.all([
    pool.query<ConversionSummaryRow>(
      `SELECT COUNT(*)::text AS total_conversions, SUM(value)::text AS total_value,
              COUNT(DISTINCT user_id)::text AS unique_users
       FROM conversions WHERE converted_at BETWEEN $1 AND $2`,
      [from, to]
    ),
    pool.query<ChannelRow>(
      `SELECT last_touch_source AS source, last_touch_medium AS medium,
              last_touch_campaign AS campaign, COUNT(*)::text AS conversions, SUM(value)::text AS value
       FROM conversions WHERE converted_at BETWEEN $1 AND $2
       GROUP BY 1,2,3 ORDER BY COUNT(*) DESC LIMIT 1`,
      [from, to]
    ),
    pool.query<DailyRow>(
      `SELECT DATE(converted_at)::text AS date, COUNT(*)::text AS conversions
       FROM conversions WHERE converted_at BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 1`,
      [from, to]
    ),
  ]);

  return {
    summary: summaryRes.rows[0],
    topChannel: channelRes.rows[0] ?? null,
    byDay: dailyRes.rows,
  };
}

export interface ConversionRecord {
  id: string;
  conversion_type: string;
  value: number | null;
  converted_at: Date;
  last_touch_source: string | null;
  last_touch_medium: string | null;
  last_touch_campaign: string | null;
}

export async function getConversionsByUserId(userId: string): Promise<ConversionRecord[]> {
  const pool = getPool();
  const { rows } = await pool.query<ConversionRecord>(
    `SELECT id, conversion_type, value, converted_at,
            last_touch_source, last_touch_medium, last_touch_campaign
     FROM conversions WHERE user_id = $1 ORDER BY converted_at ASC`,
    [userId]
  );
  return rows;
}

export async function anonymizeConversionsByUserId(userId: string): Promise<number> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    "UPDATE conversions SET user_id = 'DELETED' WHERE user_id = $1",
    [userId]
  );
  return rowCount ?? 0;
}
