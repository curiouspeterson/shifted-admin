-- Test Suite for RLS Policies
-- Last Updated: 2024-01-16

BEGIN;

-- Create test users
SELECT plan(50);

-- Setup test data
INSERT INTO roles (role) VALUES
('team_admin'),
('team_member'),
('test_role')
ON CONFLICT (role) DO NOTHING;

INSERT INTO teams (id, name) VALUES
('11111111-1111-1111-1111-111111111111', 'Test Team 1'),
('22222222-2222-2222-2222-222222222222', 'Test Team 2');

INSERT INTO user_roles (user_id, role) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'team_admin'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'team_member'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'test_role');

INSERT INTO team_members (team_id, user_id, status) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'active'),
('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'active'),
('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'active');

-- Test helper functions
SELECT ok(
  private.is_team_member(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid
  ),
  'is_team_member returns true for active member'
);

SELECT ok(
  NOT private.is_team_member(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid
  ),
  'is_team_member returns false for non-member'
);

SELECT ok(
  private.has_role(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'team_admin'
  ),
  'has_role returns true for direct role'
);

SELECT ok(
  NOT private.has_role(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'team_admin'
  ),
  'has_role returns false for different role'
);

-- Test role inheritance
INSERT INTO roles (role, parent_role) VALUES
('test_child', 'team_admin')
ON CONFLICT (role) DO NOTHING;

INSERT INTO user_roles (user_id, role) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'test_child');

SELECT ok(
  private.has_role(
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
    'team_admin'
  ),
  'has_role returns true for inherited role'
);

-- Test policy validation
SELECT matches(
  (SELECT issues[1] FROM private.validate_policy('public', 'teams', 'nonexistent_policy')),
  'Policy nonexistent_policy does not exist%',
  'validate_policy detects missing policy'
);

-- Test team policies
SET ROLE test_user;
SET request.jwt.claims.sub TO 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT results_eq(
  'SELECT count(*) FROM teams WHERE id = ''11111111-1111-1111-1111-111111111111''',
  ARRAY[1::bigint],
  'Team admin can view their team'
);

SELECT results_eq(
  'SELECT count(*) FROM teams WHERE id = ''22222222-2222-2222-2222-222222222222''',
  ARRAY[0::bigint],
  'Team admin cannot view other teams'
);

-- Test team member policies
SET request.jwt.claims.sub TO 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT results_eq(
  'SELECT count(*) FROM team_members WHERE team_id = ''11111111-1111-1111-1111-111111111111''',
  ARRAY[2::bigint],
  'Team member can view team members'
);

SELECT throws_ok(
  'INSERT INTO team_members (team_id, user_id) VALUES (''11111111-1111-1111-1111-111111111111'', ''eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'')',
  'new row violates row-level security policy',
  'Team member cannot add members'
);

-- Test project policies
INSERT INTO projects (id, team_id, name) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Test Project');

SET request.jwt.claims.sub TO 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

SELECT results_eq(
  'SELECT count(*) FROM projects WHERE team_id = ''11111111-1111-1111-1111-111111111111''',
  ARRAY[1::bigint],
  'Team admin can view team projects'
);

SELECT lives_ok(
  'INSERT INTO projects (team_id, name) VALUES (''11111111-1111-1111-1111-111111111111'', ''New Project'')',
  'Team admin can create projects'
);

-- Test task policies
INSERT INTO tasks (id, project_id, team_id, assignee_id, title) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test Task');

SET request.jwt.claims.sub TO 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

SELECT results_eq(
  'SELECT count(*) FROM tasks WHERE id = ''44444444-4444-4444-4444-444444444444''',
  ARRAY[1::bigint],
  'Assignee can view their task'
);

SELECT lives_ok(
  'UPDATE tasks SET title = ''Updated Task'' WHERE id = ''44444444-4444-4444-4444-444444444444''',
  'Assignee can update their task'
);

-- Test comment policies
INSERT INTO comments (id, task_id, team_id, author_id, content) VALUES
('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test Comment');

SELECT results_eq(
  'SELECT count(*) FROM comments WHERE id = ''55555555-5555-5555-5555-555555555555''',
  ARRAY[1::bigint],
  'Author can view their comment'
);

SELECT lives_ok(
  'UPDATE comments SET content = ''Updated Comment'' WHERE id = ''55555555-5555-5555-5555-555555555555''',
  'Author can update their comment'
);

-- Test performance tracking
SELECT ok(
  EXISTS (
    SELECT 1 FROM policy_metrics 
    WHERE policy_name LIKE 'team%'
    LIMIT 1
  ),
  'Policy metrics are being tracked'
);

-- Cleanup
RESET ROLE;
SELECT * FROM finish();
ROLLBACK; 