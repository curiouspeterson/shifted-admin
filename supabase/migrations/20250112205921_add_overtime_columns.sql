-- Drop and recreate time_based_requirements table
DROP TABLE IF EXISTS time_based_requirements;

CREATE TABLE time_based_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    min_employees INTEGER NOT NULL,
    max_employees INTEGER,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_time_based_requirements_updated_at ON time_based_requirements;
CREATE TRIGGER update_time_based_requirements_updated_at
    BEFORE UPDATE ON time_based_requirements
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Recreate the index
DROP INDEX IF EXISTS idx_time_based_requirements_times;
CREATE INDEX idx_time_based_requirements_times ON time_based_requirements (start_time, end_time);

-- Add new index for schedule lookup
CREATE INDEX idx_time_based_requirements_schedule ON time_based_requirements (schedule_id);

-- Enable RLS
ALTER TABLE time_based_requirements ENABLE ROW LEVEL SECURITY; 