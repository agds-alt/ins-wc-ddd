-- =============================================================================
-- QUICK VERIFICATION - Copy-paste this entire file to Supabase SQL Editor
-- =============================================================================
-- This is a simplified version for quick checking
-- =============================================================================

-- Step 1: Check if roles table has data
SELECT
  'CHECK 1: Roles Table' as check_name,
  COUNT(*) as total_roles,
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ OK - Has roles data'
    WHEN COUNT(*) > 0 THEN '⚠️ WARNING - Less than 3 roles'
    ELSE '❌ CRITICAL - No roles! Need to seed data'
  END as status
FROM roles;

-- Step 2: Show existing roles
SELECT
  name,
  level,
  is_active,
  CASE
    WHEN level >= 100 THEN '👑 Super Admin'
    WHEN level >= 80 THEN '⭐ Admin'
    WHEN level >= 60 THEN '👥 Manager'
    ELSE '👤 User'
  END as role_type
FROM roles
ORDER BY level DESC;

-- Step 3: Check user role assignments
SELECT
  'CHECK 2: User Role Assignments' as check_name,
  COUNT(*) as total_assignments,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ OK - Users have roles'
    ELSE '❌ CRITICAL - No assignments! Users will lose access!'
  END as status
FROM user_roles;

-- Step 4: Show who has what role
SELECT
  u.email,
  u.full_name,
  r.name as role_name,
  r.level as role_level,
  CASE
    WHEN r.level >= 100 THEN '👑 Super Admin - FULL ACCESS'
    WHEN r.level >= 80 THEN '⭐ Admin - Can manage orgs/buildings'
    ELSE '👤 Regular User'
  END as access_level
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = true
ORDER BY r.level DESC, u.email;

-- Step 5: Check for users WITHOUT roles (CRITICAL!)
SELECT
  u.email,
  u.full_name,
  u.is_active,
  u.created_at,
  '⚠️ NO ROLE ASSIGNED - WILL LOSE ACCESS!' as warning
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.is_active = true
ORDER BY u.created_at;

-- Step 6: Count users without roles
SELECT
  'CHECK 3: Users Without Roles' as check_name,
  COUNT(*) as users_without_roles,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ OK - All users have roles'
    ELSE '❌ CRITICAL - Some users missing roles!'
  END as status
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.is_active = true
  AND ur.id IS NULL;

-- Step 7: Check admin count
SELECT
  'CHECK 4: Admin Users' as check_name,
  COUNT(*) as admin_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ OK - At least one admin exists'
    ELSE '❌ CRITICAL - NO ADMIN! You will be locked out!'
  END as status
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE r.level >= 80;

-- Step 8: Show who will be admins
SELECT
  u.email,
  u.full_name,
  r.name as role_name,
  r.level,
  '✅ Will have admin access after RLS' as post_rls_status
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
WHERE r.level >= 80
  AND u.is_active = true
ORDER BY r.level DESC;

-- =============================================================================
-- FINAL READINESS CHECK
-- =============================================================================
SELECT
  '🎯 FINAL READINESS CHECK' as title,
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
    ELSE '❌❌❌ NOT READY - FIX ISSUES FIRST ❌❌❌'
  END as overall_status;

-- =============================================================================
-- INTERPRETATION:
-- =============================================================================
-- If you see ✅✅✅ READY:
--   → Proceed to apply RLS migration (skip SEED_DATA step)
--
-- If you see ❌❌❌ NOT READY:
--   → Run SEED_DATA_ROLES.sql first
--   → Then run this verification again
-- =============================================================================
