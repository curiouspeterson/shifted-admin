-- Drop existing table and recreate with correct schema
DROP TABLE IF EXISTS time_based_requirements CASCADE;

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

-- Create indexes
CREATE INDEX idx_time_based_requirements_times ON time_based_requirements (start_time, end_time);
CREATE INDEX idx_time_based_requirements_schedule ON time_based_requirements (schedule_id);

-- Create trigger for updated_at
CREATE TRIGGER update_time_based_requirements_updated_at
    BEFORE UPDATE ON time_based_requirements
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE time_based_requirements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Everyone can view time based requirements"
    ON time_based_requirements FOR SELECT
    USING (true);

CREATE POLICY "Supervisors can manage time based requirements"
    ON time_based_requirements FOR ALL
    USING (
        CASE 
            WHEN auth.jwt()->>'role' = 'anon' THEN false
            ELSE EXISTS (
                SELECT 1 
                FROM employees supervisor 
                WHERE supervisor.user_id = auth.uid() 
                AND supervisor.position IN ('shift_supervisor', 'management')
            )
        END
    ); 