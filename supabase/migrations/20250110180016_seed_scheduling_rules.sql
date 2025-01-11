-- Add scheduling rules for each employee
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
        WHEN random() < 0.7 THEN '4x10'::shift_pattern_type  -- 70% prefer 4x10
        ELSE '3x12plus4'::shift_pattern_type                 -- 30% prefer 3x12plus4
    END,
    40,  -- max weekly hours
    32,  -- min weekly hours
    true -- require consecutive days
FROM employees e
ON CONFLICT (employee_id) DO UPDATE
SET 
    preferred_shift_pattern = EXCLUDED.preferred_shift_pattern,
    max_weekly_hours = EXCLUDED.max_weekly_hours,
    min_weekly_hours = EXCLUDED.min_weekly_hours,
    require_consecutive_days = EXCLUDED.require_consecutive_days,
    updated_at = timezone('utc'::text, now()); 