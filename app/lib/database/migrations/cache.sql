-- Create cache entries table
CREATE TABLE IF NOT EXISTS cache_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(key);
CREATE INDEX IF NOT EXISTS idx_cache_entries_tags ON cache_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_cache_entries_created_at ON cache_entries(created_at);

-- Function to cleanup old cache entries
CREATE OR REPLACE FUNCTION cleanup_cache_entries() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Delete entries older than 1 day
  DELETE FROM cache_entries
  WHERE created_at < NOW() - INTERVAL '1 day';
END;
$$;

-- Create a cron job for cleanup (if pg_cron is available)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    SELECT cron.schedule(
      'cleanup-cache-entries',
      '*/30 * * * *',  -- Run every 30 minutes
      'SELECT cleanup_cache_entries()'
    );
  END IF;
END;
$$;

-- Function to invalidate cache entries by tags
CREATE OR REPLACE FUNCTION invalidate_cache_by_tags(p_tags TEXT[]) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM cache_entries
  WHERE tags && p_tags;  -- Use array overlap operator
END;
$$;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cache_entry_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
CREATE TRIGGER update_cache_entry_timestamp
  BEFORE UPDATE ON cache_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_cache_entry_timestamp(); 