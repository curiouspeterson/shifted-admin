-- Drop existing tables if they exist in correct dependency order
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS shift_swaps;
DROP TABLE IF EXISTS overtime_history;
DROP TABLE IF EXISTS schedule_assignments;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;

-- Create shifts table first (since it's referenced by employees)
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(4,2) NOT NULL,
    crosses_midnight BOOLEAN NOT NULL DEFAULT FALSE,
    min_staff_count INT NOT NULL,
    requires_supervisor BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    position TEXT NOT NULL,  -- ('dispatcher', 'shift_supervisor', 'management')
    default_shift_id UUID REFERENCES shifts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee_availability table
CREATE TABLE employee_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    UNIQUE(employee_id, day_of_week)
);

-- Create schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,  -- bi-weekly periods
    status TEXT NOT NULL DEFAULT 'draft', -- ('draft', 'published')
    version INT NOT NULL DEFAULT 1,  -- support multiple drafts
    is_active BOOLEAN NOT NULL DEFAULT TRUE,  -- only one active version
    created_by UUID REFERENCES employees(id),
    published_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Create schedule_assignments table
CREATE TABLE schedule_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_supervisor_shift BOOLEAN NOT NULL DEFAULT FALSE,  -- track when supervisor works as dispatcher
    overtime_hours DECIMAL(4,2),
    overtime_status TEXT DEFAULT NULL, -- (NULL, 'pending', 'approved')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create overtime_history table
CREATE TABLE overtime_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    total_hours DECIMAL(4,2) NOT NULL,
    overtime_hours DECIMAL(4,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shift_swaps table
CREATE TABLE shift_swaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_employee_id UUID REFERENCES employees(id),
    receiving_employee_id UUID REFERENCES employees(id),
    schedule_assignment_id UUID REFERENCES schedule_assignments(id),
    status TEXT NOT NULL DEFAULT 'pending', -- ('pending', 'approved', 'denied')
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    manager_id UUID REFERENCES employees(id)
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- ('override', 'swap_approval', 'schedule_change', etc.)
    entity_type TEXT NOT NULL, -- ('schedule_assignment', 'shift_swap', etc.)
    entity_id UUID NOT NULL,
    manager_id UUID REFERENCES employees(id),
    reason TEXT NOT NULL,
    override_type TEXT, -- ('forced_assignment', 'availability_override', etc.)
    constraint_type TEXT, -- ('employee_availability', 'maximum_hours', etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_schedule_assignments_date ON schedule_assignments(date);
CREATE INDEX idx_schedule_assignments_employee ON schedule_assignments(employee_id, date);
CREATE INDEX idx_overtime_history_employee ON overtime_history(employee_id, week_start_date);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_schedules_date_range ON schedules(start_date, end_date);
CREATE INDEX idx_shift_swaps_status ON shift_swaps(status);

-- Pre-populate shifts table with fixed shifts
INSERT INTO shifts (name, start_time, end_time, duration_hours, crosses_midnight, min_staff_count) VALUES
('Early Morning', '05:00', '09:00', 4, false, 6),
('Day Shift', '09:00', '21:00', 12, false, 8),
('Evening', '21:00', '01:00', 4, true, 7),
('Night', '01:00', '05:00', 4, false, 6);
