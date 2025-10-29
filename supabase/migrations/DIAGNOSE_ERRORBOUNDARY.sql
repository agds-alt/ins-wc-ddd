-- =============================================================================
-- DIAGNOSTIC: Check Dashboard Query After Submit
-- =============================================================================
-- Run this as authenticated user (login via app first, then test here)
-- This will show which query is causing ErrorBoundary
-- =============================================================================

-- Test 1: Check if you can read your own user profile
SELECT
  'TEST 1: User Profile' as test,
  id,
  email,
  full_name
FROM users
WHERE id = auth.uid();
-- Expected: 1 row with your profile
-- If ERROR or empty → RLS policy issue on users table

-- Test 2: Check if you can read your own inspections
SELECT
  'TEST 2: My Inspections' as test,
  COUNT(*) as total_inspections
FROM inspection_records
WHERE user_id = auth.uid();
-- Expected: Count of your inspections
-- If ERROR → RLS policy issue on inspection_records

-- Test 3: Check if is_admin() function works
SELECT
  'TEST 3: is_admin() function' as test,
  is_admin() as am_i_admin,
  auth.uid() as my_user_id;
-- Expected: true or false (should NOT error)
-- If ERROR → is_admin() function broken

-- Test 4: Simulate Dashboard Stats Query (THIS IS THE ONE THAT LIKELY FAILS!)
SELECT
  'TEST 4: Dashboard Stats Query' as test,
  COUNT(*) as total,
  COUNT(CASE WHEN inspection_date = CURRENT_DATE THEN 1 END) as today
FROM inspection_records
WHERE user_id = auth.uid();
-- Expected: Total count and today count
-- If ERROR → This is what causes ErrorBoundary!

-- Test 5: Check user_roles RLS
SELECT
  'TEST 5: User Roles' as test,
  COUNT(*) as my_roles_count
FROM user_roles
WHERE user_id = auth.uid();
-- Expected: 1 or more roles
-- If ERROR → RLS issue on user_roles

-- Test 6: Check roles RLS
SELECT
  'TEST 6: Roles Table' as test,
  COUNT(*) as active_roles_count
FROM roles
WHERE is_active = true;
-- Expected: 3 or more active roles
-- If ERROR → RLS issue on roles

-- =============================================================================
-- INTERPRETATION
-- =============================================================================
-- Run ALL tests above
-- Note which test throws ERROR or returns empty unexpectedly
-- That's the query causing ErrorBoundary after submit!
--
-- Common issues:
-- - Test 1 fails → Run FIX_INFINITY_LOOP.sql
-- - Test 4 fails → RLS policy blocks inspection_records query
-- - Test 3 fails → is_admin() function has permission issue
-- =============================================================================
