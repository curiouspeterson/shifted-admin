-- Create time_off_requests table
CREATE TABLE public.time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('vacation', 'sick', 'personal', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reason TEXT,
    approved_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- Set up RLS policies
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

-- Employees can view their own requests
CREATE POLICY "Users can view their own requests"
    ON public.time_off_requests
    FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE user_id = auth.uid()
        )
    );

-- Employees can create their own requests
CREATE POLICY "Users can create their own requests"
    ON public.time_off_requests
    FOR INSERT
    WITH CHECK (
        employee_id IN (
            SELECT id FROM employees 
            WHERE user_id = auth.uid()
        )
    );

-- Only managers can approve/deny requests
CREATE POLICY "Managers can update request status"
    ON public.time_off_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE user_id = auth.uid()
            AND position = 'manager'
        )
    );

-- Grant permissions
GRANT ALL ON public.time_off_requests TO authenticated;
GRANT ALL ON public.time_off_requests TO service_role; 