-- Remove min_staff_count column from shifts table since it's now handled by staffing_requirements
ALTER TABLE shifts DROP COLUMN min_staff_count; 