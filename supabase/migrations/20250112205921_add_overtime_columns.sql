-- Add overtime columns to schedule_assignments table
ALTER TABLE schedule_assignments
ADD COLUMN overtime_hours NUMERIC(4,2),
ADD COLUMN overtime_status TEXT CHECK (overtime_status IN ('pending', 'approved', 'denied', null));

-- Remove start_time and end_time columns as they are redundant with shift reference
ALTER TABLE schedule_assignments
DROP COLUMN start_time,
DROP COLUMN end_time; 