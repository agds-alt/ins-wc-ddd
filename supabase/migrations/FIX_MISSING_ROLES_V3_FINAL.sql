-- =============================================================================
-- FIX V3: FINAL CORRECTED VERSION
-- =============================================================================
-- Based on actual database.types.ts:
-- - roles.id: string (UUID)
-- - roles.level: STRING (not integer!) - e.g. '40', '80', '100'
-- - user_roles has: assigned_at, assigned_by columns
-- =============================================================================

-- Step 1: Show users WITHOUT roles
SELECT
  '👥 USERS WITHOUT ROLES:' as info,
  u.email,
  u.full_name
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true
ORDER BY u.created_at;

-- Step 2: Find User role (level = '40')
SELECT
  'Role to assign:' as info,
  id,
  name,
  display_name,
  level
FROM roles
WHERE level = '40'
  AND is_active = true
LIMIT 1;

-- Step 3: Assign User role to users without roles
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
SELECT
  u.id,
  (SELECT id FROM roles WHERE level = '40' AND is_active = true LIMIT 1),
  NOW(),
  NULL
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true;

-- Step 4: Verify users without roles (should be 0)
SELECT
  'AFTER FIX:' as status,
  COUNT(*) as users_without_roles,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ ALL USERS NOW HAVE ROLES!'
    ELSE '❌ Some users still missing roles'
  END as result
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true;

-- Step 5: FINAL READINESS CHECK
SELECT
  '🎯 FINAL CHECK' as title,
  (SELECT COUNT(*) = 0 FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE ur.id IS NULL AND u.is_active = true) as all_users_have_roles,
  CASE
    WHEN (SELECT COUNT(*) = 0 FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE ur.id IS NULL AND u.is_active = true)
    THEN '✅✅✅ READY TO APPLY RLS MIGRATION ✅✅✅'
    ELSE '❌❌❌ NOT READY ❌❌❌'
  END as overall_status;
