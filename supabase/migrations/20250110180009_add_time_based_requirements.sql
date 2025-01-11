-- Create time-based staffing requirements table
CREATE TABLE time_based_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    min_total_staff INTEGER NOT NULL CHECK (min_total_staff >= 0),
    min_supervisors INTEGER NOT NULL CHECK (min_supervisors >= 0),
    crosses_midnight BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_staff_count CHECK (min_supervisors <= min_total_staff)
);

-- Create index for efficient time-based queries
CREATE INDEX idx_time_based_requirements_times 
ON time_based_requirements (start_time, end_time);

-- Create employee scheduling rules table
CREATE TABLE employee_scheduling_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    max_weekly_hours INTEGER DEFAULT 40 CHECK (max_weekly_hours > 0 AND max_weekly_hours <= 40),
    min_weekly_hours INTEGER DEFAULT 40 CHECK (min_weekly_hours > 0 AND min_weekly_hours <= max_weekly_hours),
    preferred_shift_pattern VARCHAR(10) CHECK (preferred_shift_pattern IN ('4x10', '3x12_1x4')),
    require_consecutive_days BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (employee_id)
);

-- Enable RLS
ALTER TABLE time_based_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_scheduling_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON time_based_requirements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert/update for supervisors" ON time_based_requirements
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.position = 'supervisor'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.position = 'supervisor'
        )
    );

CREATE POLICY "Enable read access for authenticated users" ON employee_scheduling_rules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert/update for supervisors" ON employee_scheduling_rules
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.position = 'supervisor'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.position = 'supervisor'
        )
    );

-- Insert initial time-based requirements
INSERT INTO time_based_requirements 
    (start_time, end_time, min_total_staff, min_supervisors, crosses_midnight)
VALUES 
    ('05:00:00', '09:00:00', 6, 1, false),
    ('09:00:00', '21:00:00', 8, 1, false),
    ('21:00:00', '01:00:00', 7, 1, true),
    ('01:00:00', '05:00:00', 6, 1, false);

-- Add comments
COMMENT ON TABLE time_based_requirements IS 'Stores minimum staffing requirements for different time periods';
COMMENT ON TABLE employee_scheduling_rules IS 'Stores employee-specific scheduling preferences and constraints';
COMMENT ON COLUMN time_based_requirements.crosses_midnight IS 'Indicates if the time period spans across midnight';
COMMENT ON COLUMN employee_scheduling_rules.preferred_shift_pattern IS 'Either 4x10 (four 10-hour shifts) or 3x12_1x4 (three 12-hour shifts plus one 4-hour shift)'; 