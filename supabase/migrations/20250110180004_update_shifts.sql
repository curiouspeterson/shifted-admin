-- First, clear existing shifts
DELETE FROM shifts;

-- Insert all possible shifts
INSERT INTO shifts (name, start_time, end_time, duration_hours, crosses_midnight, min_staff_count, requires_supervisor)
VALUES 
    -- Day Shift Early variations
    ('Day Shift Early (4h)', '05:00:00', '09:00:00', 4.00, false, 3, true),
    ('Day Shift Early (10h)', '05:00:00', '15:00:00', 10.00, false, 3, true),
    ('Day Shift Early (12h)', '05:00:00', '17:00:00', 12.00, false, 3, true),

    -- Day Shift variations
    ('Day Shift (4h)', '09:00:00', '13:00:00', 4.00, false, 3, true),
    ('Day Shift (10h)', '09:00:00', '19:00:00', 10.00, false, 3, true),
    ('Day Shift (12h)', '09:00:00', '21:00:00', 12.00, false, 3, true),

    -- Swing Shift variations
    ('Swing Shift (4h)', '13:00:00', '17:00:00', 4.00, false, 3, true),
    ('Swing Shift (10h)', '15:00:00', '01:00:00', 10.00, true, 3, true),
    ('Swing Shift (12h)', '15:00:00', '03:00:00', 12.00, true, 3, true),

    -- Graveyard variations
    ('Graveyard (4h)', '01:00:00', '05:00:00', 4.00, false, 2, true),
    ('Graveyard (10h)', '19:00:00', '05:00:00', 10.00, true, 2, true),
    ('Graveyard (12h)', '17:00:00', '05:00:00', 12.00, true, 2, true);

-- Update staffing requirements for the new shifts
DELETE FROM staffing_requirements;

-- Insert new staffing requirements for each shift and day
INSERT INTO staffing_requirements (shift_id, day_of_week, min_total_staff, min_supervisors, effective_start_date)
SELECT 
    s.id as shift_id,
    d.day as day_of_week,
    CASE 
        WHEN d.day IN (0, 6) THEN -- Weekend
            CASE 
                WHEN s.duration_hours = 4.00 THEN 2
                WHEN s.duration_hours = 10.00 THEN 3
                ELSE 3 -- 12 hours
            END
        ELSE -- Weekday
            CASE 
                WHEN s.duration_hours = 4.00 THEN 3
                WHEN s.duration_hours = 10.00 THEN 4
                ELSE 4 -- 12 hours
            END
    END as min_total_staff,
    1 as min_supervisors,
    CURRENT_DATE as effective_start_date
FROM shifts s
CROSS JOIN (SELECT generate_series(0, 6) as day) d; 