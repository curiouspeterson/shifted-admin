-- Seed data for shifts table
INSERT INTO public.shifts (
  name,
  start_time,
  end_time,
  duration_hours,
  crosses_midnight,
  requires_supervisor
) VALUES
  -- Day Shift Early
  ('Day Shift Early (4h)', '05:00', '09:00', 4, false, false),
  ('Day Shift Early (10h)', '05:00', '15:00', 10, false, false),
  ('Day Shift Early (12h)', '05:00', '17:00', 12, false, false),

  -- Day Shift
  ('Day Shift (4h)', '09:00', '13:00', 4, false, false),
  ('Day Shift (10h)', '09:00', '19:00', 10, false, false),
  ('Day Shift (12h)', '09:00', '21:00', 12, false, false),

  -- Swing Shift
  ('Swing Shift (4h)', '13:00', '17:00', 4, false, false),
  ('Swing Shift (10h)', '15:00', '01:00', 10, true, false),
  ('Swing Shift (12h)', '15:00', '03:00', 12, true, false),

  -- Graveyard Shift
  ('Graveyard Shift (4h)', '01:00', '05:00', 4, false, false),
  ('Graveyard Shift (10h)', '19:00', '05:00', 10, true, false),
  ('Graveyard Shift (12h)', '17:00', '05:00', 12, true, true);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shifts_duration ON public.shifts(duration_hours);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON public.shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_shifts_crosses_midnight ON public.shifts(crosses_midnight); 