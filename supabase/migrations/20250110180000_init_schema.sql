-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('dispatcher', 'shift_supervisor', 'management')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create employee_availability table
CREATE TABLE employee_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create time_off_requests table
CREATE TABLE time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('vacation', 'sick', 'personal', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reason TEXT,
    approved_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- Create schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- Create schedule_assignments table
CREATE TABLE schedule_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create shifts table
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours NUMERIC(4,2) NOT NULL,
    crosses_midnight BOOLEAN DEFAULT false,
    min_staff_count INTEGER NOT NULL DEFAULT 1,
    requires_supervisor BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for all tables
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_employee_availability_updated_at
    BEFORE UPDATE ON employee_availability
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_schedule_assignments_updated_at
    BEFORE UPDATE ON schedule_assignments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON shifts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Everyone can view shifts" ON shifts;
DROP POLICY IF EXISTS "Supervisors can manage shifts" ON shifts;
DROP POLICY IF EXISTS "Everyone can view schedule assignments" ON schedule_assignments;
DROP POLICY IF EXISTS "Supervisors can manage schedule assignments" ON schedule_assignments;
DROP POLICY IF EXISTS "Everyone can view schedules" ON schedules;
DROP POLICY IF EXISTS "Supervisors can manage schedules" ON schedules;
DROP POLICY IF EXISTS "Employees can view their own requests and supervisors can view all" ON time_off_requests;
DROP POLICY IF EXISTS "Employees can create their own requests" ON time_off_requests;
DROP POLICY IF EXISTS "Supervisors can update request status" ON time_off_requests;
DROP POLICY IF EXISTS "Employees can view their own record and supervisors can view all" ON employees;
DROP POLICY IF EXISTS "Employees can update their own record" ON employees;
DROP POLICY IF EXISTS "Employees can view their own availability and supervisors can view all" ON employee_availability;
DROP POLICY IF EXISTS "Employees can manage their own availability" ON employee_availability;

-- Create policies for employees
CREATE POLICY "Employees can view their own record and supervisors can view all"
    ON employees FOR SELECT
    USING (
        CASE 
            WHEN auth.jwt()->>'role' = 'anon' THEN false
            WHEN auth.uid() = user_id THEN true
            ELSE EXISTS (
                SELECT 1 
                FROM employees supervisor 
                WHERE supervisor.user_id = auth.uid() 
                AND supervisor.position IN ('shift_supervisor', 'management')
                AND supervisor.id != employees.id
            )
        END
    );

CREATE POLICY "Employees can update their own record"
    ON employees FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policies for employee_availability
CREATE POLICY "Employees can view their own availability and supervisors can view all"
    ON employee_availability FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = employee_availability.employee_id 
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

CREATE POLICY "Employees can manage their own availability"
    ON employee_availability FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = employee_availability.employee_id 
            AND e.user_id = auth.uid()
        )
    );

-- Create policies for time_off_requests
CREATE POLICY "Employees can view their own requests and supervisors can view all"
    ON time_off_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = time_off_requests.employee_id 
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

CREATE POLICY "Employees can create their own requests"
    ON time_off_requests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = time_off_requests.employee_id 
            AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Supervisors can update request status"
    ON time_off_requests FOR UPDATE
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

-- Create policies for schedules
CREATE POLICY "Everyone can view schedules"
    ON schedules FOR SELECT
    USING (true);

CREATE POLICY "Supervisors can manage schedules"
    ON schedules FOR ALL
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

-- Create policies for schedule_assignments
CREATE POLICY "Everyone can view schedule assignments"
    ON schedule_assignments FOR SELECT
    USING (true);

CREATE POLICY "Supervisors can manage schedule assignments"
    ON schedule_assignments FOR ALL
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

-- Create policies for shifts
CREATE POLICY "Everyone can view shifts"
    ON shifts FOR SELECT
    USING (true);

CREATE POLICY "Supervisors can manage shifts"
    ON shifts FOR ALL
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