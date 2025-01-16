-- Create rate limits table
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  route_type text not null,
  created_at timestamptz not null default now(),
  
  -- Add constraints
  constraint rate_limits_route_type_check check (
    route_type in ('auth', 'api', 'protected', 'public')
  )
);

-- Add indexes for performance
create index if not exists rate_limits_identifier_route_type_idx 
  on public.rate_limits (identifier, route_type);
create index if not exists rate_limits_created_at_idx 
  on public.rate_limits (created_at desc);

-- Add RLS policies
alter table public.rate_limits enable row level security;

create policy "Enable read for service role only"
  on public.rate_limits for select
  using ( auth.role() = 'service_role' );
  
create policy "Enable insert for service role only"
  on public.rate_limits for insert
  with check ( auth.role() = 'service_role' );

-- Create cleanup function
create or replace function public.cleanup_rate_limits(window_seconds int)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.rate_limits
  where created_at < now() - (window_seconds || ' seconds')::interval;
end;
$$; 