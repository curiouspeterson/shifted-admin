-- Add schedule status enum type
-- Last Updated: 2025-01-15

-- Create schedule status enum
CREATE TYPE schedule_status_type AS ENUM ('draft', 'published', 'archived');

-- Update schedules table to use new enum type
ALTER TABLE schedules 
  ALTER COLUMN status TYPE schedule_status_type 
  USING status::schedule_status_type; 