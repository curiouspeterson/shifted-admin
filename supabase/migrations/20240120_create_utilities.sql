-- Create utility tables and functions
-- Last Updated: 2024-01-18
-- Description: Setup for caching and rate limiting functionality

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.invalidate_cache_by_tags(TEXT[]);
DROP FUNCTION IF EXISTS public.cleanup_expired_cache();
DROP FUNCTION IF EXISTS public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits(INTEGER);

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.cache_entries CASCADE;
DROP TABLE IF EXISTS public.rate_limits CASCADE;

-- Create cache entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cache_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cache_entries' AND indexname = 'cache_entries_key_idx') THEN
        CREATE UNIQUE INDEX cache_entries_key_idx ON public.cache_entries(key);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cache_entries' AND indexname = 'cache_entries_tags_idx') THEN
        CREATE INDEX cache_entries_tags_idx ON public.cache_entries USING GIN(tags);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'cache_entries' AND indexname = 'cache_entries_expires_idx') THEN
        CREATE INDEX cache_entries_expires_idx ON public.cache_entries(expires_at);
    END IF;
END $$;

-- Create cache cleanup function if it doesn't exist
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.cache_entries
    WHERE expires_at < NOW();
END;
$$;

-- Create cache invalidation by tags function if it doesn't exist
CREATE OR REPLACE FUNCTION public.invalidate_cache_by_tags(tags_to_invalidate TEXT[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.cache_entries
    WHERE tags && tags_to_invalidate;
END;
$$;

-- Create rate limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip TEXT NOT NULL,
    identifier TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'rate_limits' AND indexname = 'rate_limits_ip_identifier_idx') THEN
        CREATE INDEX rate_limits_ip_identifier_idx ON public.rate_limits(ip, identifier);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'rate_limits' AND indexname = 'rate_limits_timestamp_idx') THEN
        CREATE INDEX rate_limits_timestamp_idx ON public.rate_limits(timestamp);
    END IF;
END $$;

-- Create rate limit check function if it doesn't exist
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    check_ip TEXT,
    check_identifier TEXT,
    window_seconds INTEGER,
    max_requests INTEGER
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO request_count
    FROM public.rate_limits
    WHERE ip = check_ip
    AND identifier = check_identifier
    AND timestamp > NOW() - (window_seconds || ' seconds')::interval;

    RETURN request_count < max_requests;
END;
$$;

-- Create rate limit cleanup function if it doesn't exist
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits(retention_hours INTEGER DEFAULT 24)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE timestamp < NOW() - (retention_hours || ' hours')::interval;
END;
$$;

-- Enable Row Level Security for both tables
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
    -- Cache entries policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cache_entries' AND policyname = 'cache_entries_select_policy') THEN
        CREATE POLICY cache_entries_select_policy ON public.cache_entries
            FOR SELECT USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cache_entries' AND policyname = 'cache_entries_insert_policy') THEN
        CREATE POLICY cache_entries_insert_policy ON public.cache_entries
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cache_entries' AND policyname = 'cache_entries_update_policy') THEN
        CREATE POLICY cache_entries_update_policy ON public.cache_entries
            FOR UPDATE USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cache_entries' AND policyname = 'cache_entries_delete_policy') THEN
        CREATE POLICY cache_entries_delete_policy ON public.cache_entries
            FOR DELETE USING (auth.uid() IS NOT NULL);
    END IF;
    
    -- Rate limits policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rate_limits' AND policyname = 'rate_limits_select_policy') THEN
        CREATE POLICY rate_limits_select_policy ON public.rate_limits
            FOR SELECT USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rate_limits' AND policyname = 'rate_limits_insert_policy') THEN
        CREATE POLICY rate_limits_insert_policy ON public.rate_limits
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rate_limits' AND policyname = 'rate_limits_delete_policy') THEN
        CREATE POLICY rate_limits_delete_policy ON public.rate_limits
            FOR DELETE USING (auth.uid() IS NOT NULL);
    END IF;
END $$; 