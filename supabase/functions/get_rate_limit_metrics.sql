/**
 * Get Rate Limit Metrics
 * Last Updated: 2024-03
 * 
 * Retrieves rate limit metrics from Redis and aggregates them.
 */

create or replace function get_rate_limit_metrics(time_range text)
returns json
language plpgsql
security definer
as $$
declare
  start_ts bigint;
  end_ts bigint;
  result json;
  total_requests bigint;
  exceeded_requests bigint;
  route_metrics json;
begin
  -- Calculate time range
  end_ts := extract(epoch from now())::bigint;
  case time_range
    when '1h' then start_ts := end_ts - 3600;
    when '24h' then start_ts := end_ts - 86400;
    when '7d' then start_ts := end_ts - 604800;
    else raise exception 'Invalid time range';
  end case;

  -- Get total requests
  execute format(
    'select sum(value::bigint) from rate_limits where key like %L',
    'ratelimit:*:' || start_ts || '*'
  ) into total_requests;

  -- Get exceeded requests
  execute format(
    'select count(*) from rate_limits where key like %L and value::bigint >= max_requests',
    'ratelimit:*:' || start_ts || '*'
  ) into exceeded_requests;

  -- Get metrics by route
  execute format(
    'select json_object_agg(
      route,
      sum(value::bigint)
    ) from (
      select
        split_part(key, '':'', 2) as route,
        value
      from rate_limits
      where key like %L
      group by route
    ) t',
    'ratelimit:*:' || start_ts || '*'
  ) into route_metrics;

  -- Construct result
  result := json_build_object(
    'total', coalesce(total_requests, 0),
    'exceeded', coalesce(exceeded_requests, 0),
    'byRoute', coalesce(route_metrics, '{}'::json)
  );

  return result;
end;
$$; 