-- Create and configure schedules table
-- Last Updated: 2024-01-17
-- Description: Initial setup for schedule management with status types and indexes

-- Create schedule status enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_status_type') THEN
        CREATE TYPE schedule_status_type AS ENUM ('draft', 'published', 'archived');
    END IF;
END $$;

-- Create schedules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status schedule_status_type DEFAULT 'draft' NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'schedules' AND indexname = 'schedules_status_idx') THEN
        CREATE INDEX schedules_status_idx ON public.schedules(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'schedules' AND indexname = 'schedules_date_range_idx') THEN
        CREATE INDEX schedules_date_range_idx ON public.schedules(start_date, end_date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'schedules' AND indexname = 'schedules_created_by_idx') THEN
        CREATE INDEX schedules_created_by_idx ON public.schedules(created_by);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_select_policy') THEN
        CREATE POLICY schedules_select_policy ON public.schedules
            FOR SELECT USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_insert_policy') THEN
        CREATE POLICY schedules_insert_policy ON public.schedules
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_update_policy') THEN
        CREATE POLICY schedules_update_policy ON public.schedules
            FOR UPDATE USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_delete_policy') THEN
        CREATE POLICY schedules_delete_policy ON public.schedules
            FOR DELETE USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Create updated_at trigger if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_schedules_updated_at') THEN
        CREATE TRIGGER set_schedules_updated_at
            BEFORE UPDATE ON public.schedules
            FOR EACH ROW
            EXECUTE FUNCTION public.set_current_timestamp_updated_at();
    END IF;
END $$; 