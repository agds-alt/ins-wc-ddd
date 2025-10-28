-- =============================================================================
-- CREATE SUPER ADMIN USER - PHASE 1
-- =============================================================================
-- Email: agdscid@gmail.com
-- Role: Super Admin (level 100)
-- =============================================================================

-- =============================================================================
-- STEP 1: VERIFY USER REGISTERED
-- =============================================================================

-- Check if user exists
SELECT
  '📋 SUPER ADMIN USER:' as info,
  id,
  email,
  full_name,
  is_active,
  created_at
FROM users
WHERE email = 'agdscid@gmail.com';

-- Expected: 1 row showing the super admin user

-- =============================================================================
-- STEP 2: ASSIGN SUPER ADMIN ROLE
-- =============================================================================

DO $$
DECLARE
  superadmin_user_id UUID;
  superadmin_role_id UUID;
BEGIN
  -- Get Super Admin user ID
  SELECT id INTO superadmin_user_id
  FROM users
  WHERE email = 'agdscid@gmail.com'
  LIMIT 1;

  -- Get Super Admin role ID (level >= 100)
  SELECT id INTO superadmin_role_id
  FROM roles
  WHERE level >= 100
    AND is_active = true
  ORDER BY level DESC
  LIMIT 1;

  -- Validate user exists
  IF superadmin_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Super Admin user not found! Register agdscid@gmail.com first!';
  END IF;

  -- Validate role exists
  IF superadmin_role_id IS NULL THEN
    RAISE EXCEPTION '❌ Super Admin role not found! Check roles table!';
  END IF;

  -- Delete existing role assignments for this user (clean slate)
  DELETE FROM user_roles WHERE user_id = superadmin_user_id;

  -- Assign Super Admin role
  INSERT INTO user_roles (user_id, role_id, assigned_by, created_at)
  VALUES (superadmin_user_id, superadmin_role_id, superadmin_user_id, NOW());

  RAISE NOTICE '✅ Assigned Super Admin role to: %', superadmin_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SUCCESS! Super Admin created!';
  RAISE NOTICE '========================================';
END $$;

-- =============================================================================
-- STEP 3: VERIFICATION
-- =============================================================================

-- Show super admin with role
SELECT
  '✅ SUPER ADMIN WITH ROLE:' as info,
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  r.level as role_level,
  '👑 Super Admin' as access_type,
  ur.created_at as role_assigned_at
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'agdscid@gmail.com';

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

✅ SUPER ADMIN WITH ROLE:
- agdscid@gmail.com | level: 100 | 👑 Super Admin

Now you can login with this account and it will have full super admin access!

NEXT: When admin email is ready, we'll create Phase 2 script for the admin user.
*/
