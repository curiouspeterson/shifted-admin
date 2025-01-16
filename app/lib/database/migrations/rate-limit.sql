-- Create rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL,
  identifier TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_identifier ON rate_limits(ip, identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp ON rate_limits(timestamp);

-- Add TTL cleanup using TimescaleDB (if available) or cron job
SELECT create_hypertable('rate_limits', 'timestamp', if_not_exists => TRUE);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip TEXT,
  p_identifier TEXT,
  p_window_start TIMESTAMPTZ,
  p_window INTEGER,
  p_limit INTEGER
) RETURNS TABLE (
  count BIGINT,
  is_limited BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count BIGINT;
BEGIN
  -- Clean up old entries first
  DELETE FROM rate_limits
  WHERE timestamp < p_window_start;

  -- Count existing requests
  SELECT COUNT(*)
  INTO v_count
  FROM rate_limits
  WHERE ip = p_ip
    AND identifier = p_identifier
    AND timestamp >= p_window_start;

  -- Insert new request if not limited
  IF v_count < p_limit THEN
    INSERT INTO rate_limits (ip, identifier)
    VALUES (p_ip, p_identifier);
  END IF;

  -- Return results
  RETURN QUERY
  SELECT 
    v_count + 1,  -- Include the current request
    (v_count >= p_limit)::BOOLEAN;
END;
$$;

-- Function to cleanup old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE timestamp < NOW() - INTERVAL '1 day';
END;
$$;

-- Create a cron job for cleanup (if pg_cron is available)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    SELECT cron.schedule(
      'cleanup-rate-limits',
      '0 0 * * *',  -- Run daily at midnight
      'SELECT cleanup_rate_limits()'
    );
  END IF;
END;
$$; 