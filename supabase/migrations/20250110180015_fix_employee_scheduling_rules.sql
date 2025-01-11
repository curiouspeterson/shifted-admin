-- Drop and recreate employee_scheduling_rules table with correct types
DROP TABLE IF EXISTS employee_scheduling_rules;

CREATE TABLE employee_scheduling_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    max_weekly_hours INTEGER DEFAULT 40 CHECK (max_weekly_hours > 0 AND max_weekly_hours <= 40),
    min_weekly_hours INTEGER DEFAULT 32 CHECK (min_weekly_hours > 0 AND min_weekly_hours <= max_weekly_hours),
    preferred_shift_pattern shift_pattern_type NOT NULL DEFAULT '4x10',
    require_consecutive_days BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (employee_id)
);

-- Enable RLS
ALTER TABLE employee_scheduling_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Employees can view their own scheduling rules and supervisors can view all"
    ON employee_scheduling_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = employee_scheduling_rules.employee_id 
            AND (
                e.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 
                    FROM employees supervisor 
                    WHERE supervisor.user_id = auth.uid() 
                    AND supervisor.position IN ('shift_supervisor', 'management')
                )
            )
        )
    );

CREATE POLICY "Supervisors can manage scheduling rules"
    ON employee_scheduling_rules FOR ALL
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

-- Add updated_at trigger
CREATE TRIGGER update_employee_scheduling_rules_updated_at
    BEFORE UPDATE ON employee_scheduling_rules
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Add seed data
INSERT INTO employee_scheduling_rules (
    employee_id,
    preferred_shift_pattern,
    max_weekly_hours,
    min_weekly_hours,
    require_consecutive_days
)
SELECT 
    e.id,
    CASE 
        WHEN e.position IN ('shift_supervisor', 'management') THEN '4x10'::shift_pattern_type
        WHEN random() < 0.7 THEN '4x10'::shift_pattern_type
        ELSE '3x12plus4'::shift_pattern_type
    END,
    40,
    32,
    true
FROM employees e
ON CONFLICT (employee_id) DO UPDATE
SET 
    preferred_shift_pattern = EXCLUDED.preferred_shift_pattern,
    max_weekly_hours = EXCLUDED.max_weekly_hours,
    min_weekly_hours = EXCLUDED.min_weekly_hours,
    require_consecutive_days = EXCLUDED.require_consecutive_days,
    updated_at = timezone('utc'::text, now());

-- Add comments
COMMENT ON TABLE employee_scheduling_rules IS 'Stores employee-specific scheduling preferences and constraints';
COMMENT ON COLUMN employee_scheduling_rules.preferred_shift_pattern IS 'Either 4x10 (four 10-hour shifts) or 3x12plus4 (three 12-hour shifts plus one 4-hour shift)'; 