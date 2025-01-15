-- Enable Redis extension if not already enabled
create extension if not exists redis_fdw;

-- Create Redis server connection
create server if not exists redis_server
  foreign data wrapper redis_fdw
  options (address 'localhost', port '6379');

-- Create Redis foreign table for rate limiting
create foreign table if not exists rate_limits (
  key text,
  value text
)
  server redis_server
  options (database '0');

-- Function to increment rate limit counter with atomic operations
create or replace function increment_rate_limit(
  key text,
  max_requests int,
  burst_size int,
  window_size int
) returns json
language plpgsql
security definer
as $$
declare
  current_count int;
  expires_at bigint;
  current_ts bigint;
  result json;
begin
  -- Get current timestamp
  current_ts := extract(epoch from now())::bigint;
  
  -- Perform atomic increment operation
  execute format(
    'select redis_incr(%L)',
    key
  ) into current_count;
  
  -- If this is the first request in the window, set expiry
  if current_count = 1 then
    execute format(
      'select redis_expire(%L, %s)',
      key,
      window_size
    );
    expires_at := current_ts + window_size;
  else
    -- Get existing expiry time
    execute format(
      'select redis_ttl(%L)',
      key
    ) into expires_at;
    expires_at := current_ts + expires_at;
  end if;
  
  -- Apply burst limit if specified
  if current_count > burst_size then
    -- Add delay for burst control
    perform pg_sleep(0.1);
  end if;
  
  -- Construct result JSON
  result := json_build_object(
    'count', current_count,
    'expires_at', expires_at,
    'window_size', window_size,
    'max_requests', max_requests,
    'burst_size', burst_size
  );
  
  return result;
end;
$$; 