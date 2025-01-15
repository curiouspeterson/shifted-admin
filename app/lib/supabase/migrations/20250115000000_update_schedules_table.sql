-- Update schedules table schema
-- Last Updated: 2025-01-15

-- Rename name column to title
ALTER TABLE schedules RENAME COLUMN name TO title;

-- Drop unused columns
ALTER TABLE schedules DROP COLUMN version;
ALTER TABLE schedules DROP COLUMN is_active;

-- Add metadata column
ALTER TABLE schedules ADD COLUMN metadata jsonb;

-- Add updated_by column
ALTER TABLE schedules ADD COLUMN updated_by uuid REFERENCES auth.users(id);

-- Make created_by non-nullable and add foreign key
ALTER TABLE schedules 
  ALTER COLUMN created_by SET NOT NULL,
  ADD FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Add indexes
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_date_range ON schedules(start_date, end_date);
CREATE INDEX idx_schedules_created_by ON schedules(created_by);
CREATE INDEX idx_schedules_updated_by ON schedules(updated_by); 