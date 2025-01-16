-- Rollback Migration: Remove RLS Policies
-- Last Updated: 2024-01-16

-- Verify we're running as superuser
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles 
    WHERE rolname = current_user 
    AND rolsuper = true
  ) THEN
    RAISE EXCEPTION 'Superuser privileges required for RLS rollback';
  END IF;
END
$$;

-- Disable RLS on all tables
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS team_select ON teams;
DROP POLICY IF EXISTS team_insert ON teams;
DROP POLICY IF EXISTS team_update ON teams;
DROP POLICY IF EXISTS team_delete ON teams;

DROP POLICY IF EXISTS team_member_select ON team_members;
DROP POLICY IF EXISTS team_member_insert ON team_members;
DROP POLICY IF EXISTS team_member_update ON team_members;
DROP POLICY IF EXISTS team_member_delete ON team_members;

DROP POLICY IF EXISTS project_select ON projects;
DROP POLICY IF EXISTS project_insert ON projects;
DROP POLICY IF EXISTS project_update ON projects;
DROP POLICY IF EXISTS project_delete ON projects;

DROP POLICY IF EXISTS task_select ON tasks;
DROP POLICY IF EXISTS task_insert ON tasks;
DROP POLICY IF EXISTS task_update ON tasks;
DROP POLICY IF EXISTS task_delete ON tasks;

DROP POLICY IF EXISTS comment_select ON comments;
DROP POLICY IF EXISTS comment_insert ON comments;
DROP POLICY IF EXISTS comment_update ON comments;
DROP POLICY IF EXISTS comment_delete ON comments;

-- Drop triggers
DROP TRIGGER IF EXISTS track_team_policies ON teams;
DROP TRIGGER IF EXISTS track_team_member_policies ON team_members;
DROP TRIGGER IF EXISTS track_project_policies ON projects;
DROP TRIGGER IF EXISTS track_task_policies ON tasks;
DROP TRIGGER IF EXISTS track_comment_policies ON comments;

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;

-- Drop functions
DROP FUNCTION IF EXISTS private.track_policy_execution();
DROP FUNCTION IF EXISTS private.track_policy_metrics(TEXT, FLOAT, boolean);
DROP FUNCTION IF EXISTS private.validate_policy(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS private.has_role(UUID, TEXT);
DROP FUNCTION IF EXISTS private.is_team_member(UUID, UUID);
DROP FUNCTION IF EXISTS update_updated_at();

-- Drop tables
DROP TABLE IF EXISTS policy_metrics;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;

-- Drop schema if empty
DROP SCHEMA IF EXISTS private; 