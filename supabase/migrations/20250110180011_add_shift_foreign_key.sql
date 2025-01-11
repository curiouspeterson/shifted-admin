-- Add foreign key constraint for shift_id in schedule_assignments table
ALTER TABLE schedule_assignments
ADD CONSTRAINT schedule_assignments_shift_id_fkey
FOREIGN KEY (shift_id)
REFERENCES shifts(id)
ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_schedule_assignments_shift_id
ON schedule_assignments(shift_id);

COMMENT ON CONSTRAINT schedule_assignments_shift_id_fkey ON schedule_assignments IS 'Foreign key relationship between schedule_assignments and shifts tables'; 