-- Add is_supervisor_shift column to schedule_assignments table
ALTER TABLE schedule_assignments 
ADD COLUMN is_supervisor_shift BOOLEAN NOT NULL DEFAULT false;

-- Add an index to improve query performance when filtering by supervisor shifts
CREATE INDEX idx_schedule_assignments_supervisor 
ON schedule_assignments(is_supervisor_shift);

-- Add a comment explaining the column's purpose
COMMENT ON COLUMN schedule_assignments.is_supervisor_shift IS 
'Indicates whether this assignment requires a supervisor. Used for tracking supervisor coverage requirements.';

-- Enable Row Level Security
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" 
ON "public"."schedule_assignments"
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" 
ON "public"."schedule_assignments"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" 
ON "public"."schedule_assignments"
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated'); 