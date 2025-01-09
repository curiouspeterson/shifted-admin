-- Create shifts table with fixed times
CREATE TABLE shifts (
    id BIGSERIAL PRIMARY KEY,
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
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT NOT NULL,  -- ('dispatcher', 'shift_supervisor', 'management')
    default_shift_id BIGINT,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT fk_employee_default_shift FOREIGN KEY (default_shift_id) REFERENCES shifts(id)
);

-- Create schedules table
CREATE TABLE schedules (
    id BIGSERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,  -- bi-weekly periods
    status TEXT NOT NULL DEFAULT 'draft', -- ('draft', 'published')
    version INT NOT NULL DEFAULT 1,  -- support multiple drafts
    is_active BOOLEAN NOT NULL DEFAULT TRUE,  -- only one active version
    created_by BIGINT REFERENCES employees(id),
    published_by BIGINT REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Create schedule_assignments table
CREATE TABLE schedule_assignments (
    id BIGSERIAL PRIMARY KEY,
    schedule_id BIGINT REFERENCES schedules(id) ON DELETE CASCADE,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    shift_id BIGINT REFERENCES shifts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_supervisor_shift BOOLEAN NOT NULL DEFAULT FALSE,  -- track when supervisor works as dispatcher
    overtime_hours DECIMAL(4,2),
    overtime_status TEXT DEFAULT NULL, -- (NULL, 'pending', 'approved')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create overtime_history table
CREATE TABLE overtime_history (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    schedule_id BIGINT REFERENCES schedules(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    total_hours DECIMAL(4,2) NOT NULL,
    overtime_hours DECIMAL(4,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shift_swaps table
CREATE TABLE shift_swaps (
    id BIGSERIAL PRIMARY KEY,
    offering_employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    receiving_employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    schedule_assignment_id BIGINT REFERENCES schedule_assignments(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- ('pending', 'approved', 'denied')
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    manager_id BIGINT REFERENCES employees(id) ON DELETE SET NULL
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action_type TEXT NOT NULL, -- ('override', 'swap_approval', 'schedule_change', etc.)
    entity_type TEXT NOT NULL, -- ('schedule_assignment', 'shift_swap', etc.)
    entity_id BIGINT NOT NULL,
    manager_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
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