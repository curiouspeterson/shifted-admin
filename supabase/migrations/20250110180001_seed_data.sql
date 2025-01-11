-- Clean up existing test data
DELETE FROM auth.users WHERE email LIKE '%@test.com';
DELETE FROM employees WHERE email LIKE '%@test.com';

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
      auth_user_id,  -- Link to auth user
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
      auth_user_id,  -- Link to auth user
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
      auth_user_id,  -- Link to auth user
      'Dispatcher' || i,
      'Doe' || i,
      'dispatcher' || i || '@test.com',
      'dispatcher',
      true
    );
  END LOOP;
END $$;

-- Create default shifts
INSERT INTO shifts (name, start_time, end_time, duration_hours, crosses_midnight, min_staff_count, requires_supervisor)
VALUES 
  ('Early Morning', '06:00:00', '14:00:00', 8.00, false, 3, true),
  ('Day Shift', '14:00:00', '22:00:00', 8.00, false, 3, true),
  ('Evening', '16:00:00', '00:00:00', 8.00, true, 3, true),
  ('Night', '22:00:00', '06:00:00', 8.00, true, 3, true);

-- Morning shift pattern (roughly 1/3 of dispatchers)
INSERT INTO employee_availability (id, employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  gen_random_uuid(),
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
INSERT INTO employee_availability (id, employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  gen_random_uuid(),
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
INSERT INTO employee_availability (id, employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  gen_random_uuid(),
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
INSERT INTO employee_availability (id, employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  gen_random_uuid(),
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
INSERT INTO employee_availability (id, employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  gen_random_uuid(),
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
INSERT INTO employee_availability (id, employee_id, day_of_week, start_time, end_time, is_available)
SELECT 
  gen_random_uuid(),
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