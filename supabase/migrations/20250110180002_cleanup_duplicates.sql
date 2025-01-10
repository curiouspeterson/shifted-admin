-- Create a temporary table with the records we want to keep
CREATE TEMP TABLE employees_to_keep AS
SELECT DISTINCT ON (email) *
FROM employees
ORDER BY email, created_at DESC;

-- Delete all records from the original table
DELETE FROM employees;

-- Reinsert only the records we want to keep
INSERT INTO employees
SELECT * FROM employees_to_keep;

-- Drop the temporary table
DROP TABLE employees_to_keep;

-- Add a unique constraint to prevent future duplicates
ALTER TABLE employees ADD CONSTRAINT employees_email_unique UNIQUE (email); 