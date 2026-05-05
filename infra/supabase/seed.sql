-- Optional seed data for local development
-- Run after migrations to populate test data

-- Insert a test write key
-- The secret below is "test-secret-do-not-use-in-production"
-- Use packages/api/src/scripts/create-write-key.ts for real keys

INSERT INTO write_keys (id, secret, key_hash, domain, label)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test-secret-do-not-use-in-production',
  '4c5a5e3e8b86c9a2e3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
  'localhost',
  'Development'
) ON CONFLICT (id) DO NOTHING;

-- Sample events (last 7 days, various channels)
DO $$
DECLARE
  anon1 TEXT := 'aaaa0001-0000-0000-0000-000000000001';
  anon2 TEXT := 'bbbb0002-0000-0000-0000-000000000002';
BEGIN
  INSERT INTO events (type, anonymous_id, session_id, timestamp, url, utm_source, utm_medium, utm_campaign, properties) VALUES
    ('pageview', anon1, 'ses_001', NOW() - INTERVAL '5 days', 'https://example.com/', 'google', 'cpc', 'brand-q1-2025', '{}'),
    ('pageview', anon1, 'ses_001', NOW() - INTERVAL '5 days' + INTERVAL '2 minutes', 'https://example.com/pricing', 'google', 'cpc', 'brand-q1-2025', '{}'),
    ('pageview', anon1, 'ses_002', NOW() - INTERVAL '2 days', 'https://example.com/contact', NULL, NULL, NULL, '{}'),
    ('pageview', anon2, 'ses_003', NOW() - INTERVAL '3 days', 'https://example.com/', 'meta', 'paid-social', 'awareness-q1-2025', '{}'),
    ('pageview', anon2, 'ses_004', NOW() - INTERVAL '1 day', 'https://example.com/pricing', NULL, NULL, NULL, '{}')
  ON CONFLICT DO NOTHING;

  INSERT INTO identity_map (anonymous_id, user_id, email, email_hash, name, traits) VALUES
    (anon1, 'abc123', 'alice@example.com', 'abc123', 'Alice Smith', '{"email":"alice@example.com"}'),
    (anon2, 'def456', 'bob@example.com', 'def456', 'Bob Jones', '{"email":"bob@example.com"}')
  ON CONFLICT DO NOTHING;

  INSERT INTO conversions (user_id, anonymous_id, conversion_type, last_touch_source, last_touch_medium, last_touch_campaign, first_touch_source, first_touch_medium, first_touch_campaign, journey_summary, touchpoint_count) VALUES
    ('abc123', anon1, 'lead', 'google', 'cpc', 'brand-q1-2025', 'google', 'cpc', 'brand-q1-2025', '[]', 3),
    ('def456', anon2, 'lead', 'meta', 'paid-social', 'awareness-q1-2025', 'meta', 'paid-social', 'awareness-q1-2025', '[]', 2)
  ON CONFLICT DO NOTHING;
END $$;
