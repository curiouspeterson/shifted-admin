create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  duration_hours numeric(4,2) not null,
  crosses_midnight boolean default false,
  requires_supervisor boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid null references auth.users(id),
  updated_by uuid null references auth.users(id),
  version integer not null default 1
);
