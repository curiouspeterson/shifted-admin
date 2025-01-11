-- Fix remaining nullable fields and ensure constraints are properly applied
set check_function_bodies = off;

-- Double-check and enforce NOT NULL constraints on schedule_assignments
ALTER TABLE schedule_assignments
ALTER COLUMN employee_id SET NOT NULL,
ALTER COLUMN schedule_id SET NOT NULL;

-- Double-check and enforce NOT NULL constraints on employee_availability
ALTER TABLE employee_availability
ALTER COLUMN is_available SET NOT NULL,
ALTER COLUMN employee_id SET NOT NULL;

-- Double-check and enforce NOT NULL constraints on shifts
ALTER TABLE shifts
ALTER COLUMN crosses_midnight SET NOT NULL,
ALTER COLUMN requires_supervisor SET NOT NULL;

-- Double-check and enforce NOT NULL constraints on time_based_requirements
ALTER TABLE time_based_requirements
ALTER COLUMN is_active SET NOT NULL,
ALTER COLUMN crosses_midnight SET NOT NULL,
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN updated_at SET DEFAULT now();

-- Double-check and enforce NOT NULL constraints on employees
ALTER TABLE employees
ALTER COLUMN is_active SET NOT NULL;

-- Add default values for timestamp fields where appropriate
ALTER TABLE employee_scheduling_rules
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN updated_at SET DEFAULT now();

-- Ensure all boolean fields have appropriate defaults
ALTER TABLE employee_scheduling_rules
ALTER COLUMN require_consecutive_days SET DEFAULT true;

UPDATE employee_scheduling_rules
SET require_consecutive_days = true
WHERE require_consecutive_days IS NULL;

ALTER TABLE employee_scheduling_rules
ALTER COLUMN require_consecutive_days SET NOT NULL;

-- Set appropriate defaults for numeric fields
ALTER TABLE employee_scheduling_rules
ALTER COLUMN max_weekly_hours SET DEFAULT 40,
ALTER COLUMN min_weekly_hours SET DEFAULT 32;

-- Add appropriate indexes for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_schedules_date_range 
ON schedules (start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_time_off_requests_date_range 
ON time_off_requests (start_date, end_date); 

-- Update employee_scheduling_rules to ensure fields are not nullable
UPDATE employee_scheduling_rules
SET 
    created_at = timezone('utc'::text, now())
WHERE created_at IS NULL;

UPDATE employee_scheduling_rules
SET 
    updated_at = timezone('utc'::text, now())
WHERE updated_at IS NULL;

UPDATE employee_scheduling_rules
SET 
    max_weekly_hours = 40
WHERE max_weekly_hours IS NULL;

UPDATE employee_scheduling_rules
SET 
    min_weekly_hours = 32
WHERE min_weekly_hours IS NULL;

UPDATE employee_scheduling_rules
SET 
    preferred_shift_pattern = '4x10'::shift_pattern_type
WHERE preferred_shift_pattern IS NULL;

UPDATE employee_scheduling_rules
SET 
    require_consecutive_days = true
WHERE require_consecutive_days IS NULL;

-- Alter columns to be NOT NULL
ALTER TABLE employee_scheduling_rules
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL,
    ALTER COLUMN max_weekly_hours SET NOT NULL,
    ALTER COLUMN min_weekly_hours SET NOT NULL,
    ALTER COLUMN preferred_shift_pattern SET NOT NULL,
    ALTER COLUMN require_consecutive_days SET NOT NULL;

-- Add check constraints
ALTER TABLE employee_scheduling_rules
    ADD CONSTRAINT max_weekly_hours_check CHECK (max_weekly_hours > 0 AND max_weekly_hours <= 40),
    ADD CONSTRAINT min_weekly_hours_check CHECK (min_weekly_hours > 0 AND min_weekly_hours <= max_weekly_hours);

-- Add comments
COMMENT ON COLUMN employee_scheduling_rules.preferred_shift_pattern IS 'Either 4x10 (four 10-hour shifts) or 3x12plus4 (three 12-hour shifts plus one 4-hour shift)';
COMMENT ON COLUMN employee_scheduling_rules.max_weekly_hours IS 'Maximum number of hours an employee can work per week (1-40)';
COMMENT ON COLUMN employee_scheduling_rules.min_weekly_hours IS 'Minimum number of hours an employee should work per week (must be less than max_weekly_hours)';
COMMENT ON COLUMN employee_scheduling_rules.require_consecutive_days IS 'Whether the employee must work consecutive days in their pattern'; 