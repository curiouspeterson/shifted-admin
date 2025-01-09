-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_employee_deleted ON public.employees;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();
DROP FUNCTION IF EXISTS public.handle_employee_deletion();

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_email text;
BEGIN
  -- Log the incoming data for debugging
  RAISE NOTICE 'New user signup - ID: %, Metadata: %', NEW.id, NEW.raw_user_meta_data;

  -- Extract first and last name
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1),
    'New'
  );
  
  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 2),
    'Employee'
  );

  -- Get email from either raw_user_meta_data or direct email field
  v_email := COALESCE(
    NEW.raw_user_meta_data->>'email',
    NEW.email,
    NEW.raw_user_meta_data->>'preferred_email'
  );

  -- Log the extracted data
  RAISE NOTICE 'Extracted data - First: %, Last: %, Email: %', v_first_name, v_last_name, v_email;

  -- Validate email
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Email is required for employee creation';
  END IF;

  -- Create employee record
  INSERT INTO public.employees (
    user_id,
    first_name,
    last_name,
    position,
    email,
    is_active
  ) VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    'dispatcher',  -- default position
    v_email,      -- use extracted email
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle employee deletion
CREATE OR REPLACE FUNCTION public.handle_employee_deletion()
RETURNS trigger AS $$
BEGIN
  -- Log the deletion in audit_logs
  INSERT INTO public.audit_logs (
    action_type,
    entity_type,
    entity_id,
    reason
  ) VALUES (
    'user_deletion',
    'employee',
    OLD.id,
    'User account deleted'
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Create trigger on employees for deletion logging
CREATE TRIGGER on_employee_deleted
  BEFORE DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_employee_deletion();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role; 