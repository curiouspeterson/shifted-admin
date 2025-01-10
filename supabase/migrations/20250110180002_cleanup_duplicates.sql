-- Delete all duplicate records, keeping only the most recent one for each user_id
WITH ranked_employees AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY created_at DESC
    ) as rn
  FROM employees
)
DELETE FROM employees
WHERE id IN (
  SELECT id 
  FROM ranked_employees 
  WHERE rn > 1
); 