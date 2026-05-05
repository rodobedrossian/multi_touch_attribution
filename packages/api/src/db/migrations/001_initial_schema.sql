-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- WRITE KEYS (one per domain/property)
-- ============================================================
CREATE TABLE IF NOT EXISTS write_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret      TEXT NOT NULL UNIQUE,   -- raw secret used as HMAC signing key
  key_hash    TEXT NOT NULL UNIQUE,   -- SHA-256(secret) for display/audit only
  domain      TEXT NOT NULL,
  label       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ
);

-- ============================================================
-- EVENTS (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL,
  anonymous_id    TEXT NOT NULL,
  user_id         TEXT,               -- back-filled after identify()
  session_id      TEXT NOT NULL,
  write_key_id    UUID REFERENCES write_keys(id),
  timestamp       TIMESTAMPTZ NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  url             TEXT,
  referrer        TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  utm_term        TEXT,
  properties      JSONB NOT NULL DEFAULT '{}',
  geo_country     CHAR(2),
  geo_city        TEXT,
  device_type     TEXT,
  browser         TEXT,
  os              TEXT,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- IDENTITY MAP
-- ============================================================
CREATE TABLE IF NOT EXISTS identity_map (
  anonymous_id  TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  email         TEXT,
  email_hash    TEXT,               -- SHA-256(lowercase(email)), used as canonical user_id
  name          TEXT,
  traits        JSONB NOT NULL DEFAULT '{}',
  first_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  merged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONVERSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL,
  anonymous_id          TEXT NOT NULL,
  conversion_type       TEXT NOT NULL DEFAULT 'lead',
  value                 NUMERIC(12, 2),
  currency              CHAR(3) DEFAULT 'USD',
  converted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_touch_source     TEXT,
  last_touch_medium     TEXT,
  last_touch_campaign   TEXT,
  last_touch_content    TEXT,
  first_touch_source    TEXT,
  first_touch_medium    TEXT,
  first_touch_campaign  TEXT,
  first_touch_content   TEXT,
  journey_summary       JSONB NOT NULL DEFAULT '[]',
  touchpoint_count      INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
