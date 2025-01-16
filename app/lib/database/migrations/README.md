# Database Migrations

## RLS Policies Migration (20240116000000)

This migration implements Row Level Security (RLS) for the application's database tables, following Supabase best practices.

### Features

1. Team-Based Access Control
- Team members can view team resources
- Team admins have full management rights
- Role inheritance support
- Team membership validation

2. Resource-Specific Policies
- Teams: Admin-only management
- Projects: Team-scoped access
- Tasks: Assignee-specific updates
- Comments: Author-specific control

3. Performance Monitoring
- Execution time tracking
- Per-policy metrics
- Trigger-based monitoring
- Automatic cleanup

4. Security Features
- Proper USING/WITH CHECK clauses
- Role hierarchy support
- Helper function integration
- Clear documentation

### Files

- `20240116000000_add_rls_policies.sql`: Forward migration
- `20240116000000_add_rls_policies_down.sql`: Rollback migration
- `../sql/rls_helpers.sql`: Helper functions
- `../sql/rls_policies.sql`: RLS policy definitions

### Prerequisites

1. Superuser privileges required
2. Extensions:
   - uuid-ossp
   - pgcrypto

### Tables Created

1. `roles`
   - Defines role hierarchy
   - Supports role inheritance

2. `user_roles`
   - Associates users with roles
   - Tracks role assignments

3. `team_members`
   - Manages team membership
   - Tracks member status

4. `policy_metrics`
   - Stores performance data
   - Automatic 24-hour cleanup

### Helper Functions

1. `private.is_team_member`
   - Checks team membership
   - Performance optimized

2. `private.has_role`
   - Validates user roles
   - Supports role inheritance

3. `private.validate_policy`
   - Validates policy configuration
   - Provides detailed feedback

4. `private.track_policy_metrics`
   - Monitors performance
   - Tracks cache efficiency

### Running Migrations

```bash
# Apply migration
psql -f 20240116000000_add_rls_policies.sql

# Rollback migration
psql -f 20240116000000_add_rls_policies_down.sql
```

### Verification

The migration includes verification steps to ensure:
1. RLS is enabled on all tables
2. Helper functions are created
3. Policies are properly applied
4. Indexes are created for performance

### Performance Considerations

1. Proper indexing on:
   - Team membership lookups
   - Role hierarchy checks
   - Policy metrics cleanup

2. Caching support:
   - Role hierarchy results
   - Team membership checks
   - Policy validation results

3. Monitoring:
   - Execution time tracking
   - Cache hit rates
   - Slow policy detection

### Security Notes

1. All functions use `SECURITY DEFINER`
2. Explicit search path set
3. Proper schema isolation
4. Role-based access control

### References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) 