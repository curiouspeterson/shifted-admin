-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMs
DO $$ BEGIN
    CREATE TYPE shift_pattern_type AS ENUM ('4x10', '3x12plus4');
    CREATE TYPE schedule_status_type AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT NOT NULL CHECK (position IN ('dispatcher', 'shift_supervisor', 'management')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT employees_email_unique UNIQUE (email)
);

-- Create employee_availability table
CREATE TABLE employee_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_employee_availability UNIQUE (employee_id, day_of_week)
);

-- Create time_off_requests table
CREATE TABLE time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
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

-- Create shifts table
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours NUMERIC(4,2) NOT NULL,
    crosses_midnight BOOLEAN NOT NULL DEFAULT false,
    requires_supervisor BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_shift_times CHECK (
        (end_time > start_time AND crosses_midnight = false) OR 
        (end_time <= start_time AND crosses_midnight = true)
    )
);

-- Create schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status schedule_status_type NOT NULL DEFAULT 'draft',
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
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_supervisor_shift BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_employee_daily_assignment UNIQUE (schedule_id, employee_id, date)
);

-- Create time_based_requirements table
CREATE TABLE time_based_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    min_total_staff INTEGER NOT NULL CHECK (min_total_staff >= 0),
    min_supervisors INTEGER NOT NULL CHECK (min_supervisors >= 0),
    crosses_midnight BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_staff_count CHECK (min_supervisors <= min_total_staff)
);

-- Create employee_scheduling_rules table
CREATE TABLE employee_scheduling_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    max_weekly_hours INTEGER NOT NULL DEFAULT 40 CHECK (max_weekly_hours > 0 AND max_weekly_hours <= 40),
    min_weekly_hours INTEGER NOT NULL DEFAULT 32 CHECK (min_weekly_hours > 0 AND min_weekly_hours <= max_weekly_hours),
    preferred_shift_pattern shift_pattern_type NOT NULL DEFAULT '4x10',
    require_consecutive_days BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (employee_id)
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

CREATE TRIGGER update_time_based_requirements_updated_at
    BEFORE UPDATE ON time_based_requirements
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_employee_scheduling_rules_updated_at
    BEFORE UPDATE ON employee_scheduling_rules
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes
CREATE INDEX idx_schedule_assignments_employee_date ON schedule_assignments (employee_id, date);
CREATE INDEX idx_schedule_assignments_schedule_date ON schedule_assignments (schedule_id, date);
CREATE INDEX idx_schedule_assignments_shift_id ON schedule_assignments(shift_id);
CREATE INDEX idx_schedule_assignments_supervisor ON schedule_assignments(is_supervisor_shift);
CREATE INDEX idx_employee_availability_lookup ON employee_availability (employee_id, day_of_week);
CREATE INDEX idx_schedules_date_range ON schedules (start_date, end_date);
CREATE INDEX idx_time_off_requests_date_range ON time_off_requests (start_date, end_date);
CREATE INDEX idx_time_based_requirements_times ON time_based_requirements (start_time, end_time);

-- Create function to automatically create employee records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.employees (
    id,
    user_id,
    first_name,
    last_name,
    email,
    position,
    is_active
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    NEW.email,
    'dispatcher',
    true
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_based_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_scheduling_rules ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is supervisor
CREATE OR REPLACE FUNCTION is_supervisor(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM employees 
    WHERE employees.user_id = $1 
    AND position IN ('shift_supervisor', 'management')
  );
END;
$$ language plpgsql SECURITY DEFINER;

-- Create RLS policies
CREATE POLICY "Employees can view their own record and supervisors can view all"
    ON employees FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            auth.uid() = user_id OR
            is_supervisor(auth.uid())
        )
    );

CREATE POLICY "Employees can update their own record"
    ON employees FOR UPDATE
    USING (auth.uid() = user_id);

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

CREATE POLICY "Everyone can view time based requirements"
    ON time_based_requirements FOR SELECT
    USING (true);

CREATE POLICY "Supervisors can manage time based requirements"
    ON time_based_requirements FOR ALL
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

-- Add comments
COMMENT ON TABLE time_based_requirements IS 'Stores minimum staffing requirements for different time periods';
COMMENT ON TABLE employee_scheduling_rules IS 'Stores employee-specific scheduling preferences and constraints';
COMMENT ON COLUMN time_based_requirements.crosses_midnight IS 'Indicates if the time period spans across midnight';
COMMENT ON COLUMN employee_scheduling_rules.preferred_shift_pattern IS 'Either 4x10 (four 10-hour shifts) or 3x12plus4 (three 12-hour shifts plus one 4-hour shift)';
COMMENT ON CONSTRAINT schedule_assignments_shift_id_fkey ON schedule_assignments IS 'Foreign key relationship between schedule_assignments and shifts tables'; 