-- Migration: Add RLS Policies
-- Last Updated: 2024-01-16

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify we're running as superuser
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles 
    WHERE rolname = current_user 
    AND rolsuper = true
  ) THEN
    RAISE EXCEPTION 'Superuser privileges required for RLS setup';
  END IF;
END
$$;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS private;

-- Drop existing objects (if migration is rerun)
DROP TRIGGER IF EXISTS track_team_policies ON teams;
DROP TRIGGER IF EXISTS track_team_member_policies ON team_members;
DROP TRIGGER IF EXISTS track_project_policies ON projects;
DROP TRIGGER IF EXISTS track_task_policies ON tasks;
DROP TRIGGER IF EXISTS track_comment_policies ON comments;

DROP FUNCTION IF EXISTS private.track_policy_execution();
DROP FUNCTION IF EXISTS private.track_policy_metrics(TEXT, FLOAT, boolean);
DROP FUNCTION IF EXISTS private.validate_policy(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS private.has_role(UUID, TEXT);
DROP FUNCTION IF EXISTS private.is_team_member(UUID, UUID);

DROP TABLE IF EXISTS policy_metrics;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;

-- Create base tables
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_lookup 
ON team_members(team_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
ON user_roles(user_id, role);

CREATE INDEX IF NOT EXISTS idx_roles_hierarchy 
ON roles(role, parent_role);

CREATE INDEX IF NOT EXISTS idx_policy_metrics_cleanup 
ON policy_metrics(timestamp);

-- Insert default roles
INSERT INTO roles (role) VALUES
('team_admin'),
('team_member')
ON CONFLICT (role) DO NOTHING;

-- Create helper functions
\ir ../sql/rls_helpers.sql

-- Create policies
\ir ../sql/rls_policies.sql

-- Verify setup
DO $$
DECLARE
  _issues TEXT[];
BEGIN
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename IN ('teams', 'team_members', 'projects', 'tasks', 'comments')
    AND rowsecurity = true
  ) THEN
    _issues := array_append(_issues, 'RLS not enabled on all tables');
  END IF;

  -- Check if helper functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname IN ('is_team_member', 'has_role', 'validate_policy', 'track_policy_metrics')
    AND pronamespace = 'private'::regnamespace
  ) THEN
    _issues := array_append(_issues, 'Missing helper functions');
  END IF;

  -- Check if policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename IN ('teams', 'team_members', 'projects', 'tasks', 'comments')
  ) THEN
    _issues := array_append(_issues, 'Missing RLS policies');
  END IF;

  -- Raise any issues
  IF array_length(_issues, 1) > 0 THEN
    RAISE EXCEPTION 'Migration verification failed: %', array_to_string(_issues, ', ');
  END IF;
END
$$;

COMMENT ON SCHEMA private IS 'Schema for helper functions and internal tables';

-- Add updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at(); 