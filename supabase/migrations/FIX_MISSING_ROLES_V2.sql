-- =============================================================================
-- FIX V2: Assign Roles to Users Without Role Assignments
-- =============================================================================
-- Fixed version - works with UUID roles and actual user_roles table structure
-- =============================================================================

-- Step 1: Show users WITHOUT roles (before fix)
SELECT
  '👥 USERS WITHOUT ROLES (8 users):' as info,
  u.email,
  u.full_name,
  '⚠️ Will be assigned User role' as action
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true
ORDER BY u.created_at;

-- Step 2: Find the "User" role ID (level = 40 or name = 'User')
SELECT
  'Role to be assigned:' as info,
  id as role_id,
  name,
  level,
  '👤 This role will be assigned to users without roles' as action
FROM roles
WHERE (level = 40 OR name ILIKE '%user%')
  AND is_active = true
ORDER BY level
LIMIT 1;

-- Step 3: Assign "User" role to all users without roles
-- Using the actual role_id from roles table
INSERT INTO user_roles (user_id, role_id)
SELECT
  u.id,
  (SELECT id FROM roles WHERE (level = 40 OR name ILIKE '%user%') AND is_active = true ORDER BY level LIMIT 1)
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true;

-- Step 4: Verify - Count users that were fixed
SELECT
  'FIX RESULT:' as status,
  COUNT(*) as users_now_have_roles,
  '✅ Users assigned User role' as message
FROM user_roles ur
WHERE ur.user_id IN (
  SELECT u.id
  FROM users u
  WHERE u.email IN (
    'agus12344335@gmail.com',
    'abdulgofur.islam@gmail.com',
    'admin@toilet.com',
    'inspector@toilet.com',
    'cleaner@toilet.com',
    'agdscid@gmail.com',
    'agdsc12@gmail.com',
    'agussuryana@gmail.com'
  )
);

-- Step 5: Verify - Users WITHOUT roles after fix (should be 0)
SELECT
  'VERIFICATION:' as check_name,
  COUNT(*) as users_without_roles,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ SUCCESS! ALL USERS NOW HAVE ROLES!'
    ELSE '❌ Still has users without roles'
  END as status
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true;

-- Step 6: Show all current role assignments
SELECT
  '📋 ALL ROLE ASSIGNMENTS (AFTER FIX):' as info,
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

-- Step 7: FINAL READINESS CHECK
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
-- After running this query, all 8 users should have "User" role assigned
-- Final check should show: ✅✅✅ READY TO APPLY RLS MIGRATION ✅✅✅
-- =============================================================================
