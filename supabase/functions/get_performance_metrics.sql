/**
 * Get Performance Metrics
 * Last Updated: 2024-03
 * 
 * Retrieves performance metrics from Redis and calculates statistics.
 */

create or replace function get_performance_metrics(time_range text)
returns json
language plpgsql
security definer
as $$
declare
  start_ts bigint;
  end_ts bigint;
  result json;
  avg_latency float;
  p95_latency float;
  cache_hits bigint;
  total_requests bigint;
begin
  -- Calculate time range
  end_ts := extract(epoch from now())::bigint;
  case time_range
    when '1h' then start_ts := end_ts - 3600;
    when '24h' then start_ts := end_ts - 86400;
    when '7d' then start_ts := end_ts - 604800;
    else raise exception 'Invalid time range';
  end case;

  -- Get average latency
  execute format(
    'select avg(value::json->>''latency'')::float
    from rate_limits
    where key like %L
    and value::json->>''latency'' is not null',
    'ratelimit:*:' || start_ts || '*'
  ) into avg_latency;

  -- Get 95th percentile latency
  execute format(
    'select percentile_cont(0.95) within group (
      order by (value::json->>''latency'')::float
    )
    from rate_limits
    where key like %L
    and value::json->>''latency'' is not null',
    'ratelimit:*:' || start_ts || '*'
  ) into p95_latency;

  -- Get cache hit rate
  execute format(
    'select 
      sum(case when value::json->>''cacheHit'' = ''true'' then 1 else 0 end) as hits,
      count(*) as total
    from rate_limits
    where key like %L
    and value::json->>''cacheHit'' is not null',
    'ratelimit:*:' || start_ts || '*'
  ) into cache_hits, total_requests;

  -- Calculate cache hit rate percentage
  declare cache_hit_rate float;
  if total_requests > 0 then
    cache_hit_rate := (cache_hits::float / total_requests::float) * 100;
  else
    cache_hit_rate := 0;
  end if;

  -- Construct result
  result := json_build_object(
    'avgLatency', coalesce(avg_latency, 0),
    'p95Latency', coalesce(p95_latency, 0),
    'cacheHitRate', coalesce(cache_hit_rate, 0)
  );

  return result;
end;
$$; 