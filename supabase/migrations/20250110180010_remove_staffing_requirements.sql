-- Drop the staffing_requirements table and its dependencies
DROP TABLE IF EXISTS staffing_requirements;

-- Add a comment to document the change
COMMENT ON SCHEMA public IS 'Removed staffing_requirements table in favor of time_based_requirements for simpler and more direct staffing requirements management.'; 