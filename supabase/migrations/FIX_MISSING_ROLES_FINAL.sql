-- =============================================================================
-- FIX MISSING ROLES - FINAL CORRECT VERSION
-- =============================================================================
-- Based on ACTUAL database.types.ts (after regeneration):
-- - roles.level: number (INTEGER) ✅
-- - user_roles: has assigned_by, created_at, updated_at
-- - user_roles: DOES NOT have assigned_at column
-- =============================================================================

-- Step 1: Show users WITHOUT roles (should be 8 users)
SELECT
  '👥 USERS WITHOUT ROLES (BEFORE FIX):' as info,
  COUNT(*) as total,
  string_agg(u.email, ', ') as emails
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true;

-- Step 2: Find User role (level = 40)
SELECT
  'Role to assign:' as info,
  id as role_id,
  name,
  level,
  pg_typeof(level) as level_type
FROM roles
WHERE level = 40
  AND is_active = true
LIMIT 1;

-- Step 3: Assign User role to all users without roles
-- Using actual columns: user_id, role_id, assigned_by, created_at
INSERT INTO user_roles (user_id, role_id, assigned_by, created_at)
SELECT
  u.id,
  (SELECT id FROM roles WHERE level = 40 AND is_active = true LIMIT 1),
  NULL,  -- assigned_by (system assignment)
  NOW()  -- created_at
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true;

-- Step 4: Show how many users were fixed
SELECT
  '✅ RESULT:' as status,
  COUNT(*) as users_assigned_roles,
  'Users now have User role (level 40)' as message
FROM user_roles ur
WHERE ur.role_id = (SELECT id FROM roles WHERE level = 40 LIMIT 1)
  AND ur.created_at >= NOW() - INTERVAL '1 minute';

-- Step 5: Verify NO users without roles (should be 0)
SELECT
  '🔍 VERIFICATION:' as check_name,
  COUNT(*) as users_without_roles,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ SUCCESS! ALL USERS NOW HAVE ROLES!'
    ELSE '❌ ERROR: Still has ' || COUNT(*) || ' users without roles'
  END as result
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true;

-- Step 6: Show all role assignments
SELECT
  '📋 ALL CURRENT ROLE ASSIGNMENTS:' as info,
  u.email,
  u.full_name,
  r.name as role_name,
  r.level,
  CASE
    WHEN r.level >= 100 THEN '👑 Super Admin'
    WHEN r.level >= 80 THEN '⭐ Admin'
    WHEN r.level >= 60 THEN '👥 Manager'
    ELSE '👤 User'
  END as access_type,
  ur.created_at as assigned_at
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = true
ORDER BY r.level DESC, u.email;

-- Step 7: FINAL READINESS CHECK
SELECT
  '🎯 FINAL READINESS CHECK' as title,
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
    ELSE '❌❌❌ NOT READY - CHECK ISSUES ABOVE ❌❌❌'
  END as overall_status;

-- =============================================================================
-- EXPECTED OUTPUT:
-- =============================================================================
-- Step 1: Shows 8 users without roles
-- Step 2: Shows User role (id, name='User', level=40)
-- Step 3: INSERT successful (8 rows)
-- Step 4: Shows 8 users assigned
-- Step 5: Shows 0 users without roles (✅ SUCCESS!)
-- Step 6: Shows all users with their roles
-- Step 7: Shows ✅✅✅ READY TO APPLY RLS MIGRATION ✅✅✅
-- =============================================================================
