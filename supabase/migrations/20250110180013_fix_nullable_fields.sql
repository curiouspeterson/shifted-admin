-- Fix nullable fields and ENUM handling
set check_function_bodies = off;

-- Fix nullable fields in schedule_assignments
UPDATE schedule_assignments
SET employee_id = (
    SELECT id FROM employees LIMIT 1
)
WHERE employee_id IS NULL;

UPDATE schedule_assignments
SET schedule_id = (
    SELECT id FROM schedules LIMIT 1
)
WHERE schedule_id IS NULL;

-- Fix nullable fields in employee_availability
UPDATE employee_availability
SET is_available = false
WHERE is_available IS NULL;

-- Make status NOT NULL and ensure it uses the ENUM
ALTER TABLE schedules
ALTER COLUMN status SET NOT NULL;

-- Make preferred_shift_pattern use the ENUM properly
ALTER TABLE employee_scheduling_rules
ALTER COLUMN preferred_shift_pattern TYPE shift_pattern_type
USING CASE 
    WHEN preferred_shift_pattern = '4x10' THEN '4x10'::shift_pattern_type
    WHEN preferred_shift_pattern = '3x12plus4' THEN '3x12plus4'::shift_pattern_type
    ELSE NULL
END;

-- Add default values for boolean fields
ALTER TABLE shifts
ALTER COLUMN crosses_midnight SET DEFAULT false,
ALTER COLUMN requires_supervisor SET DEFAULT false;

UPDATE shifts
SET crosses_midnight = false
WHERE crosses_midnight IS NULL;

UPDATE shifts
SET requires_supervisor = false
WHERE requires_supervisor IS NULL;

ALTER TABLE shifts
ALTER COLUMN crosses_midnight SET NOT NULL,
ALTER COLUMN requires_supervisor SET NOT NULL;

-- Add NOT NULL constraints to time_based_requirements
UPDATE time_based_requirements
SET is_active = true
WHERE is_active IS NULL;

UPDATE time_based_requirements
SET crosses_midnight = false
WHERE crosses_midnight IS NULL;

ALTER TABLE time_based_requirements
ALTER COLUMN is_active SET NOT NULL,
ALTER COLUMN crosses_midnight SET NOT NULL;

-- Add NOT NULL constraint to employees.is_active
UPDATE employees
SET is_active = true
WHERE is_active IS NULL;

ALTER TABLE employees
ALTER COLUMN is_active SET NOT NULL; 