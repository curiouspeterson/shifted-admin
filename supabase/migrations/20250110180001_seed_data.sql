-- Clean up existing test data
DO $$ BEGIN
  -- First delete from auth.users (this will cascade to employees due to foreign key)
  DELETE FROM auth.users WHERE email LIKE '%@test.com';
  
  -- Then explicitly delete from employees (just to be thorough)
  DELETE FROM employees WHERE email LIKE '%@test.com';
END $$;

-- Temporarily disable the trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Create test users
DO $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Create supervisor users
  FOR i IN 1..6 LOOP
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'supervisor' || i || '@test.com',
      '$2a$10$2nqIAYBQkheXFj.Tz/gyp.xyVqwZ4LUXYbBwqJk9vp6OTJV8UPxYi', -- 'password123'
      now(),
      null,
      null,
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO auth_user_id;

    -- Create employee record
    INSERT INTO employees (
      id,
      user_id,
      first_name,
      last_name,
      email,
      position,
      is_active
    ) VALUES (
      gen_random_uuid(),
      auth_user_id,
      'Supervisor' || i,
      'Smith' || i,
      'supervisor' || i || '@test.com',
      'shift_supervisor',
      true
    );
  END LOOP;

  -- Create management users
  FOR i IN 1..2 LOOP
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'manager' || i || '@test.com',
      '$2a$10$2nqIAYBQkheXFj.Tz/gyp.xyVqwZ4LUXYbBwqJk9vp6OTJV8UPxYi', -- 'password123'
      now(),
      null,
      null,
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO auth_user_id;

    -- Create employee record
    INSERT INTO employees (
      id,
      user_id,
      first_name,
      last_name,
      email,
      position,
      is_active
    ) VALUES (
      gen_random_uuid(),
      auth_user_id,
      'Manager' || i,
      'Johnson' || i,
      'manager' || i || '@test.com',
      'management',
      true
    );
  END LOOP;

  -- Create dispatcher users
  FOR i IN 1..42 LOOP
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'dispatcher' || i || '@test.com',
      '$2a$10$2nqIAYBQkheXFj.Tz/gyp.xyVqwZ4LUXYbBwqJk9vp6OTJV8UPxYi', -- 'password123'
      now(),
      null,
      null,
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO auth_user_id;

    -- Create employee record
    INSERT INTO employees (
      id,
      user_id,
      first_name,
      last_name,
      email,
      position,
      is_active
    ) VALUES (
      gen_random_uuid(),
      auth_user_id,
      'Dispatcher' || i,
      'Doe' || i,
      'dispatcher' || i || '@test.com',
      'dispatcher',
      true
    );
  END LOOP;
END $$;

-- Re-enable the trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Insert all possible shifts
INSERT INTO shifts (name, start_time, end_time, duration_hours, crosses_midnight, requires_supervisor)
VALUES 
    -- Day Shift Early variations
    ('Day Shift Early (4h)', '05:00:00', '09:00:00', 4.00, false, true),
    ('Day Shift Early (10h)', '05:00:00', '15:00:00', 10.00, false, true),
    ('Day Shift Early (12h)', '05:00:00', '17:00:00', 12.00, false, true),

    -- Day Shift variations
    ('Day Shift (4h)', '09:00:00', '13:00:00', 4.00, false, true),
    ('Day Shift (10h)', '09:00:00', '19:00:00', 10.00, false, true),
    ('Day Shift (12h)', '09:00:00', '21:00:00', 12.00, false, true),

    -- Swing Shift variations
    ('Swing Shift (4h)', '13:00:00', '17:00:00', 4.00, false, true),
    ('Swing Shift (10h)', '15:00:00', '01:00:00', 10.00, true, true),
    ('Swing Shift (12h)', '15:00:00', '03:00:00', 12.00, true, true),

    -- Graveyard variations
    ('Graveyard (4h)', '01:00:00', '05:00:00', 4.00, false, true),
    ('Graveyard (10h)', '19:00:00', '05:00:00', 10.00, true, true),
    ('Graveyard (12h)', '17:00:00', '05:00:00', 12.00, true, true);

-- Create a test schedule
DO $$
DECLARE
  test_schedule_id uuid;
BEGIN
  INSERT INTO schedules (name, start_date, end_date, status, created_by)
  VALUES ('Test Schedule', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'draft', 
    (SELECT id FROM auth.users WHERE email = 'supervisor1@test.com' LIMIT 1)
  ) RETURNING id INTO test_schedule_id;

  -- Insert time-based requirements for test schedule
  INSERT INTO time_based_requirements (schedule_id, start_time, end_time, min_employees, max_employees, day_of_week)
  VALUES 
      -- Early Morning Block (5 AM - 9 AM)
      (test_schedule_id, '05:00:00', '09:00:00', 6, 8, 0),
      (test_schedule_id, '05:00:00', '09:00:00', 6, 8, 1),
      (test_schedule_id, '05:00:00', '09:00:00', 6, 8, 2),
      (test_schedule_id, '05:00:00', '09:00:00', 6, 8, 3),
      (test_schedule_id, '05:00:00', '09:00:00', 6, 8, 4),
      (test_schedule_id, '05:00:00', '09:00:00', 6, 8, 5),
      (test_schedule_id, '05:00:00', '09:00:00', 6, 8, 6),
      
      -- Day Block (9 AM - 9 PM)
      (test_schedule_id, '09:00:00', '21:00:00', 8, 10, 0),
      (test_schedule_id, '09:00:00', '21:00:00', 8, 10, 1),
      (test_schedule_id, '09:00:00', '21:00:00', 8, 10, 2),
      (test_schedule_id, '09:00:00', '21:00:00', 8, 10, 3),
      (test_schedule_id, '09:00:00', '21:00:00', 8, 10, 4),
      (test_schedule_id, '09:00:00', '21:00:00', 8, 10, 5),
      (test_schedule_id, '09:00:00', '21:00:00', 8, 10, 6),
      
      -- Night Block (9 PM - 1 AM)
      (test_schedule_id, '21:00:00', '01:00:00', 7, 9, 0),
      (test_schedule_id, '21:00:00', '01:00:00', 7, 9, 1),
      (test_schedule_id, '21:00:00', '01:00:00', 7, 9, 2),
      (test_schedule_id, '21:00:00', '01:00:00', 7, 9, 3),
      (test_schedule_id, '21:00:00', '01:00:00', 7, 9, 4),
      (test_schedule_id, '21:00:00', '01:00:00', 7, 9, 5),
      (test_schedule_id, '21:00:00', '01:00:00', 7, 9, 6),
      
      -- Overnight Block (1 AM - 5 AM)
      (test_schedule_id, '01:00:00', '05:00:00', 6, 8, 0),
      (test_schedule_id, '01:00:00', '05:00:00', 6, 8, 1),
      (test_schedule_id, '01:00:00', '05:00:00', 6, 8, 2),
      (test_schedule_id, '01:00:00', '05:00:00', 6, 8, 3),
      (test_schedule_id, '01:00:00', '05:00:00', 6, 8, 4),
      (test_schedule_id, '01:00:00', '05:00:00', 6, 8, 5),
      (test_schedule_id, '01:00:00', '05:00:00', 6, 8, 6);
END $$;

-- Morning shift pattern (roughly 1/3 of dispatchers)
INSERT INTO employee_availability (employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  e.id,
  d.day,
  '06:00:00'::time,
  '14:00:00'::time,
  true
FROM employees e
CROSS JOIN (SELECT generate_series(0, 6) as day) d
WHERE e.position = 'dispatcher'
AND e.id IN (
  SELECT id FROM employees WHERE position = 'dispatcher' 
  ORDER BY random() 
  LIMIT 14
);

-- Day shift pattern (roughly 1/3 of dispatchers)
INSERT INTO employee_availability (employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  e.id,
  d.day,
  '14:00:00'::time,
  '22:00:00'::time,
  true
FROM employees e
CROSS JOIN (SELECT generate_series(0, 6) as day) d
WHERE e.position = 'dispatcher'
AND e.id IN (
  SELECT id FROM employees WHERE position = 'dispatcher' 
  AND id NOT IN (SELECT DISTINCT employee_id FROM employee_availability)
  ORDER BY random() 
  LIMIT 14
);

-- Night shift pattern (remaining dispatchers)
INSERT INTO employee_availability (employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  e.id,
  d.day,
  '22:00:00'::time,
  '23:59:59'::time,
  true
FROM employees e
CROSS JOIN (SELECT generate_series(0, 6) as day) d
WHERE e.position = 'dispatcher'
AND e.id IN (
  SELECT id FROM employees WHERE position = 'dispatcher' 
  AND id NOT IN (SELECT DISTINCT employee_id FROM employee_availability)
);

-- Supervisor availability
-- Morning supervisors (2)
INSERT INTO employee_availability (employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  e.id,
  d.day,
  '06:00:00'::time,
  '14:00:00'::time,
  true
FROM employees e
CROSS JOIN (SELECT generate_series(0, 6) as day) d
WHERE e.position = 'shift_supervisor'
AND e.id IN (
  SELECT id FROM employees WHERE position = 'shift_supervisor'
  ORDER BY random()
  LIMIT 2
);

-- Day supervisors (2)
INSERT INTO employee_availability (employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  e.id,
  d.day,
  '14:00:00'::time,
  '22:00:00'::time,
  true
FROM employees e
CROSS JOIN (SELECT generate_series(0, 6) as day) d
WHERE e.position = 'shift_supervisor'
AND e.id IN (
  SELECT id FROM employees WHERE position = 'shift_supervisor'
  AND id NOT IN (SELECT DISTINCT employee_id FROM employee_availability)
  ORDER BY random()
  LIMIT 2
);

-- Night supervisors (2)
INSERT INTO employee_availability (employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  e.id,
  d.day,
  '22:00:00'::time,
  '23:59:59'::time,
  true
FROM employees e
CROSS JOIN (SELECT generate_series(0, 6) as day) d
WHERE e.position = 'shift_supervisor'
AND e.id IN (
  SELECT id FROM employees WHERE position = 'shift_supervisor'
  AND id NOT IN (SELECT DISTINCT employee_id FROM employee_availability)
);

-- Add scheduling rules for each employee
INSERT INTO employee_scheduling_rules (
    employee_id,
    preferred_shift_pattern,
    max_weekly_hours,
    min_weekly_hours,
    require_consecutive_days
)
SELECT 
    e.id,
    CASE 
        WHEN e.position IN ('shift_supervisor', 'management') THEN '4x10'::shift_pattern_type
        WHEN random() < 0.7 THEN '4x10'::shift_pattern_type  -- 70% prefer 4x10
        ELSE '3x12plus4'::shift_pattern_type                 -- 30% prefer 3x12plus4
    END,
    40,  -- max weekly hours
    32,  -- min weekly hours
    true -- require consecutive days
FROM employees e
ON CONFLICT (employee_id) DO UPDATE
SET 
    preferred_shift_pattern = EXCLUDED.preferred_shift_pattern,
    max_weekly_hours = EXCLUDED.max_weekly_hours,
    min_weekly_hours = EXCLUDED.min_weekly_hours,
    require_consecutive_days = EXCLUDED.require_consecutive_days,
    updated_at = timezone('utc'::text, now()); 