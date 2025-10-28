-- =============================================================================
-- RLS DIAGNOSTIC QUERY
-- =============================================================================
-- Run this to diagnose why RLS functions return false
-- =============================================================================

-- Step 1: Check who you're logged in as
SELECT
  '👤 CURRENT USER' as info,
  auth.uid() as my_auth_uid,
  auth.email() as my_email,
  auth.role() as my_role;

-- Step 2: Check your user record
SELECT
  '📋 MY USER RECORD' as info,
  u.id,
  u.email,
  u.full_name,
  u.is_active
FROM users u
WHERE u.id = auth.uid();

-- Step 3: Check your role assignments
SELECT
  '🎭 MY ROLES' as info,
  u.email,
  r.name as role_name,
  r.level as role_level,
  ur.user_id,
  ur.role_id
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = auth.uid();

-- Step 4: Manual check (compare auth.uid vs user_id)
SELECT
  '🔍 MANUAL ROLE CHECK' as info,
  auth.uid() as auth_uid,
  ur.user_id as user_id_in_table,
  (auth.uid() = ur.user_id) as uids_match,
  r.level,
  r.name
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = auth.uid();

-- Step 5: Check if agdscid@gmail.com has roles
SELECT
  '📊 AGDSCID ROLES' as info,
  u.email,
  u.id as user_id,
  r.name as role_name,
  r.level as role_level,
  ur.assigned_by,
  ur.created_at
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'agdscid@gmail.com';

-- =============================================================================
-- EXPECTED RESULTS:
-- =============================================================================
-- If logged in as agdscid@gmail.com:
-- - Step 1: Should show agdscid@gmail.com email
-- - Step 2: Should show user record
-- - Step 3: Should show Super Admin role (level 100)
-- - Step 4: uids_match = true, level = 100
-- - Step 5: Should show role assignment
--
-- If NOT logged in or auth.uid() is NULL:
-- - All steps will show empty or NULL
-- - You need to run this in an authenticated context (e.g., via app, not SQL Editor)
-- =============================================================================
