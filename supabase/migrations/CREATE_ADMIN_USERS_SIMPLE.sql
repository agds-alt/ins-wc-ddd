-- =============================================================================
-- CREATE CLEAN ADMIN USERS - SIMPLE METHOD
-- =============================================================================
-- This script creates 2 admin users properly:
-- 1. Super Admin
-- 2. Admin
--
-- METHOD: Register via Supabase Auth, then assign roles via SQL
-- =============================================================================

-- =============================================================================
-- STEP 1: MANUAL REGISTRATION (Do this FIRST before running SQL!)
-- =============================================================================

/*
Go to your WC-Checks application and register 2 new users:

User 1 - Super Admin:
- Email: agdscid@gmail.com  (🚨 CHANGE to your email!)
- Password: YourStrongPassword123!
- Full Name: Super Administrator

User 2 - Admin:
- Email: admin@wchecks.com  (🚨 CHANGE to your email!)
- Password: YourStrongPassword123!
- Full Name: System Administrator

After registration, come back here and run the SQL below.
*/

-- =============================================================================
-- STEP 2: VERIFY USERS REGISTERED
-- =============================================================================

-- Check if users exist
SELECT
  '📋 REGISTERED USERS (before role assignment):' as info,
  id,
  email,
  full_name,
  is_active,
  created_at
FROM users
WHERE email IN ('agdscid@gmail.com', 'admin@wchecks.com')  -- 🚨 Match your emails!
ORDER BY created_at DESC;

-- Expected: 2 rows showing both users

-- =============================================================================
-- STEP 3: ASSIGN ROLES
-- =============================================================================

DO $$
DECLARE
  superadmin_user_id UUID;
  admin_user_id UUID;
  superadmin_role_id UUID;
  admin_role_id UUID;
BEGIN
  -- Get Super Admin user ID
  SELECT id INTO superadmin_user_id
  FROM users
  WHERE email = 'agdscid@gmail.com'  -- 🚨 Match your email!
  LIMIT 1;

  -- Get Admin user ID
  SELECT id INTO admin_user_id
  FROM users
  WHERE email = 'admin@wchecks.com'  -- 🚨 Match your email!
  LIMIT 1;

  -- Get Super Admin role ID (level >= 100)
  SELECT id INTO superadmin_role_id
  FROM roles
  WHERE level >= 100
    AND is_active = true
  ORDER BY level DESC
  LIMIT 1;

  -- Get Admin role ID (level >= 80, < 100)
  SELECT id INTO admin_role_id
  FROM roles
  WHERE level >= 80 AND level < 100
    AND is_active = true
  ORDER BY level DESC
  LIMIT 1;

  -- Validate users exist
  IF superadmin_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Super Admin user not found! Register agdscid@gmail.com first!';
  END IF;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Admin user not found! Register admin@wchecks.com first!';
  END IF;

  -- Validate roles exist
  IF superadmin_role_id IS NULL THEN
    RAISE EXCEPTION '❌ Super Admin role not found! Check roles table!';
  END IF;

  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION '❌ Admin role not found! Check roles table!';
  END IF;

  -- Delete existing role assignments for these users (clean slate)
  DELETE FROM user_roles WHERE user_id IN (superadmin_user_id, admin_user_id);

  -- Assign Super Admin role
  INSERT INTO user_roles (user_id, role_id, assigned_by, created_at)
  VALUES (superadmin_user_id, superadmin_role_id, superadmin_user_id, NOW());

  RAISE NOTICE '✅ Assigned Super Admin role to: %', superadmin_user_id;

  -- Assign Admin role
  INSERT INTO user_roles (user_id, role_id, assigned_by, created_at)
  VALUES (admin_user_id, admin_role_id, superadmin_user_id, NOW());

  RAISE NOTICE '✅ Assigned Admin role to: %', admin_user_id;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SUCCESS! Admin users created!';
  RAISE NOTICE '========================================';
END $$;

-- =============================================================================
-- STEP 4: VERIFICATION
-- =============================================================================

-- Show users with their roles
SELECT
  '✅ ADMIN USERS WITH ROLES:' as info,
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  r.level as role_level,
  CASE
    WHEN r.level >= 100 THEN '👑 Super Admin'
    WHEN r.level >= 80 THEN '⭐ Admin'
    ELSE '👤 User'
  END as access_type,
  ur.created_at as role_assigned_at
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.email IN ('agdscid@gmail.com', 'admin@wchecks.com')  -- 🚨 Match your emails!
ORDER BY r.level DESC;

-- Show ALL active users with roles
SELECT
  '📊 ALL USERS IN SYSTEM:' as info,
  u.email,
  u.full_name,
  COALESCE(r.name, 'NO ROLE') as role_name,
  COALESCE(r.level::text, 'N/A') as level,
  u.is_active
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = true
ORDER BY r.level DESC NULLS LAST;

-- =============================================================================
-- EXPECTED OUTPUT
-- =============================================================================

/*
After running this script, you should see:

✅ ADMIN USERS WITH ROLES:
- agdscid@gmail.com | Super Administrator | level: 100 | 👑 Super Admin
- admin@wchecks.com | System Administrator | level: 80 | ⭐ Admin

Now you can login with these accounts and they will have full admin access!
*/
