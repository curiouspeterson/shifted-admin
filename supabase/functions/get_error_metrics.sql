/**
 * Get Error Metrics
 * Last Updated: 2024-03
 * 
 * Retrieves error metrics and aggregates them by type.
 */

create or replace function get_error_metrics(time_range text)
returns json
language plpgsql
security definer
as $$
declare
  start_ts bigint;
  end_ts bigint;
  result json;
  error_count bigint;
  error_types json;
begin
  -- Calculate time range
  end_ts := extract(epoch from now())::bigint;
  case time_range
    when '1h' then start_ts := end_ts - 3600;
    when '24h' then start_ts := end_ts - 86400;
    when '7d' then start_ts := end_ts - 604800;
    else raise exception 'Invalid time range';
  end case;

  -- Get total error count
  select count(*)
  from error_logs
  where timestamp >= start_ts
  and timestamp <= end_ts
  into error_count;

  -- Get errors by type
  select json_object_agg(
    error_type,
    count(*)
  )
  from (
    select
      case
        when message like '%rate limit exceeded%' then 'Rate Limit'
        when message like '%auth error%' then 'Authentication'
        when message like '%database error%' then 'Database'
        else 'Other'
      end as error_type
    from error_logs
    where timestamp >= start_ts
    and timestamp <= end_ts
  ) t
  group by error_type
  into error_types;

  -- Construct result
  result := json_build_object(
    'count', coalesce(error_count, 0),
    'byType', coalesce(error_types, '{}'::json)
  );

  return result;
end;
$$; 