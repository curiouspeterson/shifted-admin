-- Create staffing_requirements table
CREATE TABLE staffing_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    min_total_staff INTEGER NOT NULL CHECK (min_total_staff >= 0),
    min_supervisors INTEGER NOT NULL DEFAULT 1 CHECK (min_supervisors >= 0),
    effective_start_date DATE NOT NULL,
    effective_end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_date_range CHECK (effective_end_date IS NULL OR effective_start_date <= effective_end_date),
    CONSTRAINT valid_staff_requirements CHECK (min_supervisors <= min_total_staff)
);

-- Create updated_at trigger
CREATE TRIGGER update_staffing_requirements_updated_at
    BEFORE UPDATE ON staffing_requirements
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE staffing_requirements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view staffing requirements"
    ON staffing_requirements FOR SELECT
    USING (true);

CREATE POLICY "Supervisors can manage staffing requirements"
    ON staffing_requirements FOR ALL
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

-- Add some initial staffing requirements
INSERT INTO staffing_requirements (shift_id, day_of_week, min_total_staff, min_supervisors, effective_start_date)
SELECT 
    s.id as shift_id,
    d.day as day_of_week,
    CASE 
        WHEN d.day IN (0, 6) THEN -- Weekend
            CASE 
                WHEN s.name = 'Early Morning' THEN 4
                WHEN s.name = 'Day Shift' THEN 6
                WHEN s.name = 'Evening' THEN 5
                ELSE 4 -- Night
            END
        ELSE -- Weekday
            CASE 
                WHEN s.name = 'Early Morning' THEN 5
                WHEN s.name = 'Day Shift' THEN 8
                WHEN s.name = 'Evening' THEN 6
                ELSE 4 -- Night
            END
    END as min_total_staff,
    1 as min_supervisors,
    CURRENT_DATE as effective_start_date
FROM shifts s
CROSS JOIN (SELECT generate_series(0, 6) as day) d; 