-- Events: primary query patterns
CREATE INDEX IF NOT EXISTS events_anonymous_id_idx   ON events (anonymous_id);
CREATE INDEX IF NOT EXISTS events_user_id_idx        ON events (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS events_session_id_idx     ON events (session_id);
CREATE INDEX IF NOT EXISTS events_timestamp_idx      ON events (timestamp DESC);
CREATE INDEX IF NOT EXISTS events_type_idx           ON events (type);

-- Composite index used by the last-touch / first-touch attribution queries
CREATE INDEX IF NOT EXISTS events_attribution_idx ON events
  (anonymous_id, utm_source, utm_medium, utm_campaign, timestamp DESC)
  WHERE utm_source IS NOT NULL;

-- GDPR: fast lookup by IP for erasure
CREATE INDEX IF NOT EXISTS events_ip_address_idx ON events (ip_address);

-- Identity map
CREATE INDEX IF NOT EXISTS identity_map_user_id_idx    ON identity_map (user_id);
CREATE INDEX IF NOT EXISTS identity_map_email_hash_idx ON identity_map (email_hash);

-- Conversions
CREATE INDEX IF NOT EXISTS conversions_user_id_idx      ON conversions (user_id);
CREATE INDEX IF NOT EXISTS conversions_converted_at_idx ON conversions (converted_at DESC);
CREATE INDEX IF NOT EXISTS conversions_last_touch_idx   ON conversions
  (last_touch_source, last_touch_medium, last_touch_campaign);
