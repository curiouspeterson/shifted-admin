-- Update shifts table with new minimum staff counts based on start time
UPDATE shifts
SET min_staff_count = 
    CASE 
        -- 5am-9am shifts (6 minimum)
        WHEN start_time >= '05:00:00' AND start_time < '09:00:00' THEN 6
        -- 9am-9pm shifts (8 minimum)
        WHEN start_time >= '09:00:00' AND start_time < '21:00:00' THEN 8
        -- 9pm-1am shifts (7 minimum)
        WHEN start_time >= '21:00:00' OR start_time < '01:00:00' THEN 7
        -- 1am-5am shifts (6 minimum)
        WHEN start_time >= '01:00:00' AND start_time < '05:00:00' THEN 6
        ELSE min_staff_count
    END;

-- Clear existing staffing requirements
DELETE FROM staffing_requirements;

-- Insert new staffing requirements for each shift and day
-- We'll set the same requirements for all days since no day-specific requirements were given
INSERT INTO staffing_requirements (shift_id, day_of_week, min_total_staff, min_supervisors, effective_start_date)
SELECT 
    s.id as shift_id,
    d.day as day_of_week,
    CASE 
        -- Base minimum staff on shift start time
        WHEN s.start_time >= '05:00:00' AND s.start_time < '09:00:00' THEN 6
        WHEN s.start_time >= '09:00:00' AND s.start_time < '21:00:00' THEN 8
        WHEN s.start_time >= '21:00:00' OR s.start_time < '01:00:00' THEN 7
        WHEN s.start_time >= '01:00:00' AND s.start_time < '05:00:00' THEN 6
        ELSE 6 -- Default minimum
    END as min_total_staff,
    1 as min_supervisors, -- Always require 1 supervisor
    CURRENT_DATE as effective_start_date
FROM shifts s
CROSS JOIN (SELECT generate_series(0, 6) as day) d;

-- Add a comment to explain the staffing requirements
COMMENT ON TABLE staffing_requirements IS 
'Minimum staffing requirements by time period:
- 5am-9am: 6 employees minimum
- 9am-9pm: 8 employees minimum
- 9pm-1am: 7 employees minimum
- 1am-5am: 6 employees minimum
Always requires 1 supervisor (counts as part of minimum employee count)';

-- Create an index to help with querying staffing requirements by time period
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_staffing_requirements_shift_day ON staffing_requirements(shift_id, day_of_week); 