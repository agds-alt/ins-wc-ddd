-- =============================================================================
-- DIAGNOSTIC: Check for infinity loop causes after inspection submit
-- =============================================================================
-- Run this to debug the infinity loop issue
-- =============================================================================

-- 1. Check if is_admin() function works
SELECT
  'TEST: is_admin() function' as test_name,
  is_admin() as result,
  auth.uid() as current_user_id;

-- 2. Check if user can read their own inspections
SELECT
  'TEST: Can read own inspections' as test_name,
  COUNT(*) as my_inspection_count
FROM inspection_records
WHERE user_id = auth.uid();

-- 3. Check if dashboard stats query works
SELECT
  'TEST: Dashboard stats query' as test_name,
  COUNT(*) as total_inspections,
  COUNT(CASE WHEN inspection_date = CURRENT_DATE THEN 1 END) as today_inspections
FROM inspection_records
WHERE user_id = auth.uid();

-- 4. Check user_roles RLS policy
SELECT
  'TEST: Can read own user_roles' as test_name,
  COUNT(*) as my_roles_count
FROM user_roles
WHERE user_id = auth.uid();

-- 5. Check roles RLS policy
SELECT
  'TEST: Can read active roles' as test_name,
  COUNT(*) as active_roles_count
FROM roles
WHERE is_active = true;

-- 6. Check users RLS policy (CRITICAL - newly added)
SELECT
  'TEST: Can read own user profile' as test_name,
  id,
  email,
  full_name
FROM users
WHERE id = auth.uid();

-- =============================================================================
-- Expected Results:
-- =============================================================================
-- All queries above should return data WITHOUT errors
-- If any query fails or hangs, that's the cause of infinity loop!
--
-- Common issues:
-- 1. is_admin() returns error → RLS policies stuck
-- 2. inspection_records query hangs → RLS policy conflict
-- 3. user_roles query fails → Missing RLS policy
-- 4. users query fails → RLS policy too restrictive
-- =============================================================================
