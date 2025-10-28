-- =============================================================================
-- FIX: Assign Roles to Users Without Role Assignments
-- =============================================================================
-- This query will assign "User" role to all active users who don't have roles yet
-- Safe to run - won't affect users who already have roles
-- =============================================================================

-- Step 1: Show users WITHOUT roles (before fix)
SELECT
  '👥 USERS WITHOUT ROLES (BEFORE FIX):' as info,
  u.email,
  u.full_name,
  u.is_active,
  u.created_at,
  '⚠️ NO ROLE - Will be assigned User role' as action
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true
ORDER BY u.created_at;

-- Step 2: Ensure roles table has "User" role
-- If not exists, create it
INSERT INTO roles (id, name, description, level, is_active, created_at, updated_at)
VALUES (
  'role-user',
  'User',
  'Standard user can perform inspections and view own data',
  40,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Step 3: Assign "User" role to all users without roles
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
SELECT
  u.id,
  'role-user',
  NOW(),
  NULL  -- System auto-assignment
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Step 4: Verify - show count of fixed users
SELECT
  'FIX APPLIED' as status,
  COUNT(*) as users_fixed,
  '✅ Users now have User role' as message
FROM user_roles ur
WHERE ur.role_id = 'role-user'
  AND ur.assigned_by IS NULL;  -- Auto-assigned in this session

-- Step 5: Show users WITHOUT roles (after fix - should be 0)
SELECT
  'VERIFICATION: Users still without roles' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ ALL USERS NOW HAVE ROLES!'
    ELSE '❌ Still has users without roles - check manually'
  END as status
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true;

-- Step 6: Show all current role assignments
SELECT
  '📋 CURRENT ROLE ASSIGNMENTS (AFTER FIX):' as info,
  u.email,
  u.full_name,
  r.name as role_name,
  r.level as role_level,
  CASE
    WHEN r.level >= 100 THEN '👑 Super Admin'
    WHEN r.level >= 80 THEN '⭐ Admin'
    WHEN r.level >= 60 THEN '👥 Manager'
    ELSE '👤 User'
  END as access_type
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = true
ORDER BY r.level DESC, u.email;

-- Step 7: Final readiness check
SELECT
  '🎯 FINAL READINESS CHECK (AFTER FIX)' as title,
  (SELECT COUNT(*) >= 3 FROM roles WHERE is_active = true) as has_enough_roles,
  (SELECT COUNT(*) > 0 FROM user_roles) as has_role_assignments,
  (SELECT COUNT(*) > 0 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.level >= 80) as has_admin,
  (SELECT COUNT(*) = 0 FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE u.is_active = true AND ur.id IS NULL) as all_users_have_roles,
  CASE
    WHEN (
      (SELECT COUNT(*) >= 3 FROM roles WHERE is_active = true) AND
      (SELECT COUNT(*) > 0 FROM user_roles) AND
      (SELECT COUNT(*) > 0 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.level >= 80) AND
      (SELECT COUNT(*) = 0 FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE u.is_active = true AND ur.id IS NULL)
    )
    THEN '✅✅✅ READY TO APPLY RLS MIGRATION ✅✅✅'
    ELSE '❌❌❌ NOT READY - CHECK ISSUES ABOVE ❌❌❌'
  END as overall_status;

-- =============================================================================
-- EXPECTED OUTCOME:
-- =============================================================================
-- After running this query, you should see:
-- 1. List of users who were missing roles
-- 2. Confirmation that "User" role was assigned to them
-- 3. Verification showing 0 users without roles
-- 4. Final check showing: ✅✅✅ READY TO APPLY RLS MIGRATION ✅✅✅
--
-- If you see READY, proceed to apply RLS migration!
-- =============================================================================
