-- =============================================================================
-- VERIFICATION QUERIES - Jalankan SEBELUM Apply RLS Migration
-- =============================================================================
-- File ini berisi queries untuk verifikasi struktur database dan data
-- sebelum menerapkan RLS policies
-- =============================================================================

-- =============================================================================
-- STEP 1: CHECK TABLE STRUCTURE
-- =============================================================================

-- 1.1 Check apakah table 'roles' ada dan strukturnya benar
SELECT
  'Table: roles' as check_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING - CREATE TABLE FIRST!'
  END as status;

-- 1.2 Check columns di table 'roles'
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'roles'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid or text)
-- name (text)
-- level (integer)
-- description (text, nullable)
-- is_active (boolean)
-- created_at (timestamp)
-- updated_at (timestamp)


-- 1.3 Check apakah table 'user_roles' ada
SELECT
  'Table: user_roles' as check_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING - CREATE TABLE FIRST!'
  END as status;

-- 1.4 Check columns di table 'user_roles'
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid, nullable jika auto-generated)
-- user_id (uuid)
-- role_id (uuid or text)
-- assigned_at (timestamp)
-- assigned_by (uuid, nullable)


-- =============================================================================
-- STEP 2: CHECK EXISTING DATA
-- =============================================================================

-- 2.1 Check apakah table 'roles' punya data
SELECT
  'Roles count' as check_name,
  COUNT(*) as total,
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ OK (At least Super Admin, Admin, User)'
    WHEN COUNT(*) > 0 THEN '⚠️ WARNING: Less than 3 roles'
    ELSE '❌ CRITICAL: No roles data - INSERT REQUIRED!'
  END as status
FROM roles;

-- 2.2 Show existing roles data
SELECT
  id,
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


-- 2.3 Check apakah ada user yang sudah punya role assignments
SELECT
  'User role assignments count' as check_name,
  COUNT(*) as total,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ OK (Users have roles assigned)'
    ELSE '❌ CRITICAL: No role assignments - ALL USERS WILL LOSE ACCESS!'
  END as status
FROM user_roles;

-- 2.4 Show existing user role assignments
SELECT
  ur.user_id,
  u.email,
  u.full_name,
  r.name as role_name,
  r.level as role_level,
  ur.assigned_at,
  CASE
    WHEN r.level >= 100 THEN '👑 Super Admin'
    WHEN r.level >= 80 THEN '⭐ Admin'
    ELSE '👤 User'
  END as access_level
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
ORDER BY r.level DESC, u.email;


-- 2.5 Check users yang BELUM punya role assignments (CRITICAL!)
SELECT
  u.id,
  u.email,
  u.full_name,
  u.is_active,
  u.created_at,
  '⚠️ NO ROLE - WILL LOSE ACCESS!' as warning
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
AND u.is_active = true
ORDER BY u.created_at;


-- =============================================================================
-- STEP 3: CHECK AUTH USERS
-- =============================================================================

-- 3.1 Check total users di auth.users (Supabase Auth)
SELECT
  'Auth users count' as check_name,
  COUNT(*) as total
FROM auth.users;

-- 3.2 Check total users di public.users (Application users)
SELECT
  'Application users count' as check_name,
  COUNT(*) as total
FROM users;

-- 3.3 Check users di auth tapi TIDAK ada di public.users (orphaned auth users)
SELECT
  au.id,
  au.email,
  au.created_at,
  '⚠️ ORPHANED AUTH USER - No profile in users table' as warning
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
WHERE u.id IS NULL;


-- =============================================================================
-- STEP 4: SIMULATE RLS CHECK (Before enabling RLS)
-- =============================================================================

-- 4.1 Simulate: Who will be admin after RLS enabled?
SELECT
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  r.level,
  CASE
    WHEN r.level >= 100 THEN '✅ Will be Super Admin'
    WHEN r.level >= 80 THEN '✅ Will be Admin'
    ELSE '❌ Will be Regular User (no admin access)'
  END as after_rls_status
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = true
ORDER BY r.level DESC;


-- 4.2 Simulate: Users who will LOSE admin access after RLS
-- (Users who currently can access admin pages but don't have role >= 80)
SELECT
  u.id,
  u.email,
  u.full_name,
  COALESCE(r.level, 0) as current_role_level,
  '🚨 WILL LOSE ADMIN ACCESS after RLS!' as critical_warning
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = true
AND (r.level IS NULL OR r.level < 80)
ORDER BY u.email;


-- =============================================================================
-- STEP 5: FINAL CHECKLIST
-- =============================================================================

-- 5.1 Comprehensive readiness check
SELECT
  'RLS Migration Readiness' as check_category,
  (
    SELECT COUNT(*) >= 3 FROM roles WHERE is_active = true
  ) as has_roles_data,
  (
    SELECT COUNT(*) > 0 FROM user_roles
  ) as has_user_role_assignments,
  (
    SELECT COUNT(*) > 0
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE r.level >= 80
  ) as has_at_least_one_admin,
  (
    SELECT COUNT(*) = 0
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    WHERE u.is_active = true AND ur.id IS NULL
  ) as all_active_users_have_roles,
  CASE
    WHEN (
      (SELECT COUNT(*) >= 3 FROM roles WHERE is_active = true) AND
      (SELECT COUNT(*) > 0 FROM user_roles) AND
      (SELECT COUNT(*) > 0 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.level >= 80) AND
      (SELECT COUNT(*) = 0 FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id WHERE u.is_active = true AND ur.id IS NULL)
    )
    THEN '✅ READY to apply RLS migration'
    ELSE '❌ NOT READY - Fix issues first!'
  END as overall_status;


-- =============================================================================
-- INTERPRETATION GUIDE
-- =============================================================================

/*
CRITICAL CHECKS:

1. ✅ roles table EXISTS with at least 3 roles (Super Admin, Admin, User)
2. ✅ user_roles table EXISTS with data
3. ✅ At least ONE user has admin role (level >= 80)
4. ✅ ALL active users have role assignments

If ANY of these fail:
- ❌ DO NOT apply RLS migration yet!
- ❌ You will LOCK YOURSELF OUT of admin functions!
- ❌ Fix the issues first using the SEED DATA queries below

NEXT STEPS:
- If all ✅: Safe to apply RLS migration
- If any ❌: Run the seed data queries in SEED_DATA_ROLES.sql first
*/
