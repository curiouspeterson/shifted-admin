-- Create utility functions
-- Last Updated: 2024-01-15
-- Description: Setup for common utility functions used across tables

-- Create updated_at timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$; 