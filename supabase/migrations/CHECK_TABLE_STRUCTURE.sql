-- =============================================================================
-- CHECK TABLE STRUCTURE - Run this first to understand your database schema
-- =============================================================================

-- Check roles table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'roles'
ORDER BY ordinal_position;

-- Check user_roles table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- Check existing roles data
SELECT * FROM roles;

-- Check existing user_roles data
SELECT
  ur.*,
  u.email,
  r.name as role_name
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
LIMIT 10;
