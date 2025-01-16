alter table if exists public.employees
  add column if not exists department text;
