-- RLS Policies
-- Last Updated: 2024-01-16
--
-- Defines Row Level Security (RLS) policies using helper functions.
-- These policies enforce access control at the database level.

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Team policies
-- Only team admins can modify team settings
CREATE POLICY team_select ON teams
  FOR SELECT
  USING (
    private.is_team_member(auth.uid(), id) AND
    private.has_role(auth.uid(), 'team_member')
  );

CREATE POLICY team_insert ON teams
  FOR INSERT
  WITH CHECK (
    private.has_role(auth.uid(), 'team_admin')
  );

CREATE POLICY team_update ON teams
  FOR UPDATE
  USING (
    private.is_team_member(auth.uid(), id) AND
    private.has_role(auth.uid(), 'team_admin')
  )
  WITH CHECK (
    private.has_role(auth.uid(), 'team_admin')
  );

CREATE POLICY team_delete ON teams
  FOR DELETE
  USING (
    private.has_role(auth.uid(), 'team_admin')
  );

-- Team member policies
-- Team admins can manage members, members can view
CREATE POLICY team_member_select ON team_members
  FOR SELECT
  USING (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_member')
  );

CREATE POLICY team_member_insert ON team_members
  FOR INSERT
  WITH CHECK (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_admin')
  );

CREATE POLICY team_member_update ON team_members
  FOR UPDATE
  USING (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_admin')
  )
  WITH CHECK (
    private.has_role(auth.uid(), 'team_admin')
  );

CREATE POLICY team_member_delete ON team_members
  FOR DELETE
  USING (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_admin')
  );

-- Project policies
-- Team members can view, team admins can manage
CREATE POLICY project_select ON projects
  FOR SELECT
  USING (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_member')
  );

CREATE POLICY project_insert ON projects
  FOR INSERT
  WITH CHECK (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_admin')
  );

CREATE POLICY project_update ON projects
  FOR UPDATE
  USING (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_admin')
  )
  WITH CHECK (
    private.has_role(auth.uid(), 'team_admin')
  );

CREATE POLICY project_delete ON projects
  FOR DELETE
  USING (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_admin')
  );

-- Task policies
-- Team members can view and create, assignees can update
CREATE POLICY task_select ON tasks
  FOR SELECT
  USING (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_member')
  );

CREATE POLICY task_insert ON tasks
  FOR INSERT
  WITH CHECK (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_member')
  );

CREATE POLICY task_update ON tasks
  FOR UPDATE
  USING (
    (private.is_team_member(auth.uid(), team_id) AND assignee_id = auth.uid()) OR
    private.has_role(auth.uid(), 'team_admin')
  )
  WITH CHECK (
    private.is_team_member(auth.uid(), team_id)
  );

CREATE POLICY task_delete ON tasks
  FOR DELETE
  USING (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_admin')
  );

-- Comment policies
-- Team members can view and create, authors can update/delete
CREATE POLICY comment_select ON comments
  FOR SELECT
  USING (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_member')
  );

CREATE POLICY comment_insert ON comments
  FOR INSERT
  WITH CHECK (
    private.is_team_member(auth.uid(), team_id) AND
    private.has_role(auth.uid(), 'team_member')
  );

CREATE POLICY comment_update ON comments
  FOR UPDATE
  USING (
    (private.is_team_member(auth.uid(), team_id) AND author_id = auth.uid()) OR
    private.has_role(auth.uid(), 'team_admin')
  )
  WITH CHECK (
    private.is_team_member(auth.uid(), team_id)
  );

CREATE POLICY comment_delete ON comments
  FOR DELETE
  USING (
    (private.is_team_member(auth.uid(), team_id) AND author_id = auth.uid()) OR
    private.has_role(auth.uid(), 'team_admin')
  );

-- Add performance tracking triggers
CREATE OR REPLACE FUNCTION private.track_policy_execution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _start_time TIMESTAMPTZ;
  _execution_time FLOAT;
BEGIN
  _start_time := clock_timestamp();
  
  -- Execute original operation
  IF TG_OP = 'SELECT' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Track metrics
  _execution_time := extract(epoch from clock_timestamp() - _start_time) * 1000;
  PERFORM private.track_policy_metrics(
    TG_NAME,
    _execution_time,
    false
  );
END;
$$;

-- Add triggers to track policy performance
CREATE TRIGGER track_team_policies
  AFTER INSERT OR UPDATE OR DELETE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION private.track_policy_execution();

CREATE TRIGGER track_team_member_policies
  AFTER INSERT OR UPDATE OR DELETE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION private.track_policy_execution();

CREATE TRIGGER track_project_policies
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION private.track_policy_execution();

CREATE TRIGGER track_task_policies
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION private.track_policy_execution();

CREATE TRIGGER track_comment_policies
  AFTER INSERT OR UPDATE OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION private.track_policy_execution();

-- Comments for documentation
COMMENT ON POLICY team_select ON teams IS 'Allow team members to view team details';
COMMENT ON POLICY team_insert ON teams IS 'Allow team admins to create teams';
COMMENT ON POLICY team_update ON teams IS 'Allow team admins to update team details';
COMMENT ON POLICY team_delete ON teams IS 'Allow team admins to delete teams';

COMMENT ON POLICY team_member_select ON team_members IS 'Allow team members to view team membership';
COMMENT ON POLICY team_member_insert ON team_members IS 'Allow team admins to add team members';
COMMENT ON POLICY team_member_update ON team_members IS 'Allow team admins to update team membership';
COMMENT ON POLICY team_member_delete ON team_members IS 'Allow team admins to remove team members';

COMMENT ON POLICY project_select ON projects IS 'Allow team members to view projects';
COMMENT ON POLICY project_insert ON projects IS 'Allow team admins to create projects';
COMMENT ON POLICY project_update ON projects IS 'Allow team admins to update projects';
COMMENT ON POLICY project_delete ON projects IS 'Allow team admins to delete projects';

COMMENT ON POLICY task_select ON tasks IS 'Allow team members to view tasks';
COMMENT ON POLICY task_insert ON tasks IS 'Allow team members to create tasks';
COMMENT ON POLICY task_update ON tasks IS 'Allow assignees and admins to update tasks';
COMMENT ON POLICY task_delete ON tasks IS 'Allow team admins to delete tasks';

COMMENT ON POLICY comment_select ON comments IS 'Allow team members to view comments';
COMMENT ON POLICY comment_insert ON comments IS 'Allow team members to create comments';
COMMENT ON POLICY comment_update ON comments IS 'Allow authors and admins to update comments';
COMMENT ON POLICY comment_delete ON comments IS 'Allow authors and admins to delete comments'; 