-- Update scheduling constraints and add required fields
set check_function_bodies = off;

-- Create ENUMs
DO $$ BEGIN
    CREATE TYPE shift_pattern_type AS ENUM ('4x10', '3x12plus4');
    CREATE TYPE schedule_status_type AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Make nullable fields required
ALTER TABLE schedule_assignments
ALTER COLUMN employee_id SET NOT NULL,
ALTER COLUMN schedule_id SET NOT NULL;

ALTER TABLE employee_availability
ALTER COLUMN is_available SET NOT NULL;

-- Add unique constraints
ALTER TABLE employee_availability
DROP CONSTRAINT IF EXISTS unique_employee_availability,
ADD CONSTRAINT unique_employee_availability 
UNIQUE (employee_id, day_of_week);

ALTER TABLE schedule_assignments
DROP CONSTRAINT IF EXISTS unique_employee_daily_assignment,
ADD CONSTRAINT unique_employee_daily_assignment 
UNIQUE (schedule_id, employee_id, date);

-- Add check constraints
ALTER TABLE shifts
DROP CONSTRAINT IF EXISTS valid_shift_times,
ADD CONSTRAINT valid_shift_times 
CHECK (
    (end_time > start_time AND crosses_midnight = false) OR 
    (end_time <= start_time AND crosses_midnight = true)
);

ALTER TABLE employee_scheduling_rules
DROP CONSTRAINT IF EXISTS valid_shift_pattern,
ADD CONSTRAINT valid_shift_pattern 
CHECK (preferred_shift_pattern IN ('4x10', '3x12plus4'));

-- Add performance indexes
DROP INDEX IF EXISTS idx_schedule_assignments_employee_date;
CREATE INDEX idx_schedule_assignments_employee_date 
ON schedule_assignments (employee_id, date);

DROP INDEX IF EXISTS idx_schedule_assignments_schedule_date;
CREATE INDEX idx_schedule_assignments_schedule_date 
ON schedule_assignments (schedule_id, date);

DROP INDEX IF EXISTS idx_employee_availability_lookup;
CREATE INDEX idx_employee_availability_lookup 
ON employee_availability (employee_id, day_of_week);

-- Handle the status column conversion
ALTER TABLE schedules 
ALTER COLUMN status DROP DEFAULT;

-- Add a temporary column for the conversion
ALTER TABLE schedules 
ADD COLUMN status_enum schedule_status_type;

-- Update the temporary column
UPDATE schedules 
SET status_enum = CASE 
    WHEN status = 'draft' THEN 'draft'::schedule_status_type
    WHEN status = 'published' THEN 'published'::schedule_status_type
    WHEN status = 'archived' THEN 'archived'::schedule_status_type
    ELSE 'draft'::schedule_status_type
END;

-- Drop the old column and rename the new one
ALTER TABLE schedules 
DROP COLUMN status;

ALTER TABLE schedules 
RENAME COLUMN status_enum TO status;

ALTER TABLE schedules 
ALTER COLUMN status SET DEFAULT 'draft'::schedule_status_type;

-- Handle the shift pattern conversion
ALTER TABLE employee_scheduling_rules 
ALTER COLUMN preferred_shift_pattern DROP DEFAULT;

-- Add a temporary column for the conversion
ALTER TABLE employee_scheduling_rules 
ADD COLUMN pattern_enum shift_pattern_type;

-- Update the temporary column
UPDATE employee_scheduling_rules 
SET pattern_enum = CASE 
    WHEN preferred_shift_pattern = '4x10' THEN '4x10'::shift_pattern_type
    WHEN preferred_shift_pattern = '3x12plus4' THEN '3x12plus4'::shift_pattern_type
    ELSE NULL
END;

-- Drop the old column and rename the new one
ALTER TABLE employee_scheduling_rules 
DROP COLUMN preferred_shift_pattern;

ALTER TABLE employee_scheduling_rules 
RENAME COLUMN pattern_enum TO preferred_shift_pattern; 