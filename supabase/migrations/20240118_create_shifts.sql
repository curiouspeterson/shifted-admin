-- Create shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_hours numeric(4,2) NOT NULL,
  crosses_midnight boolean NOT NULL DEFAULT false,
  requires_supervisor boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add a trigger to update the updated_at timestamp
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at(); 