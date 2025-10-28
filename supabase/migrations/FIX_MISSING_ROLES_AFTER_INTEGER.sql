-- =============================================================================
-- FIX MISSING ROLES - INTEGER VERSION
-- =============================================================================
-- Run this AFTER FIX_LEVEL_COLUMN_TYPE.sql migration
-- Assumes roles.level is now INTEGER (not string)
-- =============================================================================

-- Step 1: Show users WITHOUT roles
SELECT
  '👥 USERS WITHOUT ROLES:' as info,
  u.email,
  u.full_name,
  u.created_at
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true
ORDER BY u.created_at;

-- Step 2: Find User role (level = 40, not '40')
SELECT
  'Role to assign:' as info,
  id,
  name,
  display_name,
  level,
  pg_typeof(level) as level_type
FROM roles
WHERE level = 40  -- INTEGER comparison
  AND is_active = true
LIMIT 1;

-- Step 3: Assign User role to users without roles
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
SELECT
  u.id,
  (SELECT id FROM roles WHERE level = 40 AND is_active = true LIMIT 1),
  NOW(),
  NULL
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true;

-- Step 4: Verify - Count fixed
SELECT
  '✅ FIX APPLIED:' as status,
  COUNT(*) as users_fixed
FROM user_roles
WHERE role_id = (SELECT id FROM roles WHERE level = 40 LIMIT 1)
  AND assigned_at >= NOW() - INTERVAL '1 minute';

-- Step 5: Verify users without roles (should be 0)
SELECT
  'VERIFICATION:' as check_name,
  COUNT(*) as users_without_roles,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ ALL USERS NOW HAVE ROLES!'
    ELSE '❌ Some users still missing roles'
  END as result
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true;

-- Step 6: Show all role assignments
SELECT
  '📋 ALL ROLE ASSIGNMENTS:' as info,
  u.email,
  r.name as role_name,
  r.level,
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
  '🎯 FINAL CHECK' as title,
  (SELECT COUNT(*) >= 3 FROM roles WHERE is_active = true) as has_enough_roles,
  (SELECT COUNT(*) > 0 FROM user_roles) as has_role_assignments,
  (SELECT COUNT(*) > 0 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.level >= 80) as has_admin,
  (SELECT COUNT(*) = 0 FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE ur.id IS NULL AND u.is_active = true) as all_users_have_roles,
  CASE
    WHEN (
      (SELECT COUNT(*) >= 3 FROM roles WHERE is_active = true) AND
      (SELECT COUNT(*) > 0 FROM user_roles) AND
      (SELECT COUNT(*) > 0 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.level >= 80) AND
      (SELECT COUNT(*) = 0 FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE ur.id IS NULL AND u.is_active = true)
    )
    THEN '✅✅✅ READY TO APPLY RLS MIGRATION ✅✅✅'
    ELSE '❌❌❌ NOT READY ❌❌❌'
  END as overall_status;
