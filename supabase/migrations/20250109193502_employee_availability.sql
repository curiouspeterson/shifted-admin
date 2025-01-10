-- Create employee_availability table
CREATE TABLE public.employee_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    UNIQUE(employee_id, day_of_week)
);

-- Set up permissions for employee_availability
ALTER TABLE public.employee_availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employee_availability
CREATE POLICY "Users can read their own availability"
    ON public.employee_availability
    FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own availability"
    ON public.employee_availability
    FOR ALL
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all availability"
    ON public.employee_availability
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant permissions explicitly
GRANT ALL ON public.employee_availability TO authenticated;
GRANT ALL ON public.employee_availability TO service_role;
GRANT ALL ON public.employee_availability TO postgres; 