-- RLS Helper Functions
-- Last Updated: 2024-01-16
--
-- Provides secure and performant helper functions for RLS policies.
-- These functions are used to enforce access control at the database level.

-- Create private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- Team membership check
-- Returns true if the user is a member of the specified team
CREATE OR REPLACE FUNCTION private.is_team_member(
  _user_id UUID,
  _team_id UUID
) RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  STABLE
AS $$
  -- Use EXISTS for better performance with large tables
  SELECT EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.team_id = _team_id
    AND tm.user_id = _user_id
    -- Add status check if teams can be inactive
    AND tm.status = 'active'
  );
$$;

-- Role check with inheritance
-- Returns true if the user has the required role or any role that inherits from it
CREATE OR REPLACE FUNCTION private.has_role(
  _user_id UUID,
  _required_role TEXT
) RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  STABLE
AS $$
  WITH RECURSIVE role_hierarchy AS (
    -- Base case: direct role
    SELECT role, parent_role
    FROM roles
    WHERE role = (
      SELECT role 
      FROM user_roles 
      WHERE user_id = _user_id
    )
    
    UNION
    
    -- Recursive case: parent roles
    SELECT r.role, r.parent_role
    FROM roles r
    INNER JOIN role_hierarchy rh ON r.role = rh.parent_role
  )
  SELECT EXISTS (
    SELECT 1 
    FROM role_hierarchy 
    WHERE role = _required_role
  );
$$;

-- Policy validation
-- Returns true if the policy is valid for the given table
CREATE OR REPLACE FUNCTION private.validate_policy(
  _schema_name TEXT,
  _table_name TEXT,
  _policy_name TEXT
) RETURNS TABLE (
  valid boolean,
  issues TEXT[]
)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  STABLE
AS $$
DECLARE
  _issues TEXT[] := ARRAY[]::TEXT[];
  _policy_exists boolean;
  _using_expr TEXT;
  _check_expr TEXT;
  _cmd TEXT;
BEGIN
  -- Check if policy exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = _schema_name
    AND tablename = _table_name
    AND policyname = _policy_name
  ) INTO _policy_exists;

  IF NOT _policy_exists THEN
    _issues := array_append(_issues, format('Policy %I does not exist on table %I.%I', _policy_name, _schema_name, _table_name));
    RETURN QUERY SELECT false, _issues;
  END IF;

  -- Get policy details
  SELECT 
    cmd,
    COALESCE(qual::TEXT, '') as using_expr,
    COALESCE(with_check::TEXT, '') as check_expr
  INTO _cmd, _using_expr, _check_expr
  FROM pg_policies
  WHERE schemaname = _schema_name
  AND tablename = _table_name
  AND policyname = _policy_name;

  -- Validate expressions based on command
  IF _cmd = 'UPDATE' AND _using_expr = '' THEN
    _issues := array_append(_issues, format('UPDATE policy %I missing USING expression', _policy_name));
  END IF;

  IF _cmd IN ('INSERT', 'UPDATE') AND _check_expr = '' THEN
    _issues := array_append(_issues, format('%s policy %I missing WITH CHECK expression', _cmd, _policy_name));
  END IF;

  -- Return validation result
  RETURN QUERY SELECT
    array_length(_issues, 1) IS NULL,
    _issues;
END;
$$;

-- Performance metrics for RLS policies
CREATE OR REPLACE FUNCTION private.track_policy_metrics(
  _policy_name TEXT,
  _execution_time_ms FLOAT,
  _cache_hit boolean
) RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  -- Store metrics in a dedicated table
  INSERT INTO policy_metrics (
    policy_name,
    execution_time_ms,
    cache_hit,
    timestamp
  ) VALUES (
    _policy_name,
    _execution_time_ms,
    _cache_hit,
    now()
  );

  -- Cleanup old metrics (keep last 24 hours)
  DELETE FROM policy_metrics
  WHERE timestamp < now() - interval '24 hours';
END;
$$;

-- Create required tables if they don't exist
CREATE TABLE IF NOT EXISTS roles (
  role TEXT PRIMARY KEY,
  parent_role TEXT REFERENCES roles(role),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY,
  role TEXT REFERENCES roles(role),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS policy_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  execution_time_ms FLOAT NOT NULL,
  cache_hit boolean NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_lookup 
ON team_members(team_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
ON user_roles(user_id, role);

CREATE INDEX IF NOT EXISTS idx_roles_hierarchy 
ON roles(role, parent_role);

CREATE INDEX IF NOT EXISTS idx_policy_metrics_cleanup 
ON policy_metrics(timestamp);

-- Comments for documentation
COMMENT ON FUNCTION private.is_team_member IS 'Checks if a user is an active member of a team';
COMMENT ON FUNCTION private.has_role IS 'Checks if a user has a role or inherits it through the role hierarchy';
COMMENT ON FUNCTION private.validate_policy IS 'Validates RLS policy configuration and expressions';
COMMENT ON FUNCTION private.track_policy_metrics IS 'Tracks performance metrics for RLS policy evaluation';

COMMENT ON TABLE roles IS 'Defines roles and their inheritance hierarchy';
COMMENT ON TABLE user_roles IS 'Associates users with their roles';
COMMENT ON TABLE team_members IS 'Tracks team membership with status';
COMMENT ON TABLE policy_metrics IS 'Stores performance metrics for RLS policies'; 