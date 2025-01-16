create table if not exists public.schedule_assignments (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  date date not null,
  is_supervisor_shift boolean default false,
  overtime_hours numeric(4,2) null,
  overtime_status text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid null references auth.users(id),
  updated_by uuid null references auth.users(id),
  version integer not null default 1,
  
  -- Add unique constraint to prevent duplicate assignments
  unique (schedule_id, employee_id, shift_id, date)
);
