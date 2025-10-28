-- =============================================================================
-- CREATE CLEAN ADMIN USERS FOR PRODUCTION
-- =============================================================================
-- Creates 2 clean admin users with complete data:
-- 1. Super Admin user
-- 2. Admin user
--
-- IMPORTANT: These users are created via SQL for complete data population
-- You need to set passwords via Supabase Dashboard after creation
-- =============================================================================

-- =============================================================================
-- CONFIGURATION - EDIT THESE VALUES
-- =============================================================================

-- Edit these emails to your desired values
DO $$
DECLARE
  -- Super Admin user details
  superadmin_email TEXT := 'superadmin@wchecks.com';  -- 🚨 CHANGE THIS!
  superadmin_name TEXT := 'Super Administrator';
  superadmin_password TEXT := 'SuperAdmin123!';  -- 🚨 CHANGE THIS! (min 6 chars)

  -- Admin user details
  admin_email TEXT := 'admin@wchecks.com';  -- 🚨 CHANGE THIS!
  admin_name TEXT := 'Administrator';
  admin_password TEXT := 'Admin123!';  -- 🚨 CHANGE THIS! (min 6 chars)

  -- Variables for storing created user IDs
  superadmin_user_id UUID;
  admin_user_id UUID;
  superadmin_role_id UUID;
  admin_role_id UUID;
  user_occupation_id UUID;

BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating Clean Admin Users';
  RAISE NOTICE '========================================';

  -- =============================================================================
  -- STEP 1: Get role IDs
  -- =============================================================================

  SELECT id INTO superadmin_role_id
  FROM roles
  WHERE level >= 100
    AND is_active = true
  ORDER BY level DESC
  LIMIT 1;

  SELECT id INTO admin_role_id
  FROM roles
  WHERE level >= 80 AND level < 100
    AND is_active = true
  ORDER BY level DESC
  LIMIT 1;

  IF superadmin_role_id IS NULL THEN
    RAISE EXCEPTION 'Super Admin role not found! Ensure roles table has role with level >= 100';
  END IF;

  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found! Ensure roles table has role with level >= 80';
  END IF;

  RAISE NOTICE '✅ Found Super Admin role: %', superadmin_role_id;
  RAISE NOTICE '✅ Found Admin role: %', admin_role_id;

  -- =============================================================================
  -- STEP 2: Get a User occupation (optional, can be NULL)
  -- =============================================================================

  SELECT id INTO user_occupation_id
  FROM user_occupations
  WHERE is_active = true
  LIMIT 1;

  IF user_occupation_id IS NULL THEN
    RAISE NOTICE '⚠️  No occupation found, will use NULL';
  ELSE
    RAISE NOTICE '✅ Using occupation: %', user_occupation_id;
  END IF;

  -- =============================================================================
  -- STEP 3: Create Super Admin User via Supabase Auth
  -- =============================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'Creating Super Admin user...';

  -- Note: We use auth.users() function which may not be directly accessible
  -- Instead we'll create users in users table and you'll need to create auth manually

  -- Generate UUID for super admin
  superadmin_user_id := gen_random_uuid();

  -- Insert into users table
  INSERT INTO users (
    id,
    email,
    full_name,
    password_hash,
    phone,
    profile_photo_url,
    occupation_id,
    is_active,
    last_login_at,
    created_at,
    updated_at
  ) VALUES (
    superadmin_user_id,
    superadmin_email,
    superadmin_name,
    'managed_by_supabase_auth',  -- Placeholder, actual auth handled by Supabase
    NULL,
    NULL,
    user_occupation_id,
    true,
    NULL,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Created Super Admin user in users table: %', superadmin_user_id;
  RAISE NOTICE '   Email: %', superadmin_email;
  RAISE NOTICE '   Name: %', superadmin_name;

  -- Assign Super Admin role
  INSERT INTO user_roles (
    user_id,
    role_id,
    assigned_by,
    created_at
  ) VALUES (
    superadmin_user_id,
    superadmin_role_id,
    superadmin_user_id,  -- Self-assigned
    NOW()
  );

  RAISE NOTICE '✅ Assigned Super Admin role';

  -- =============================================================================
  -- STEP 4: Create Admin User
  -- =============================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'Creating Admin user...';

  -- Generate UUID for admin
  admin_user_id := gen_random_uuid();

  -- Insert into users table
  INSERT INTO users (
    id,
    email,
    full_name,
    password_hash,
    phone,
    profile_photo_url,
    occupation_id,
    is_active,
    last_login_at,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    admin_email,
    admin_name,
    'managed_by_supabase_auth',
    NULL,
    NULL,
    user_occupation_id,
    true,
    NULL,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Created Admin user in users table: %', admin_user_id;
  RAISE NOTICE '   Email: %', admin_email;
  RAISE NOTICE '   Name: %', admin_name;

  -- Assign Admin role
  INSERT INTO user_roles (
    user_id,
    role_id,
    assigned_by,
    created_at
  ) VALUES (
    admin_user_id,
    admin_role_id,
    superadmin_user_id,  -- Assigned by Super Admin
    NOW()
  );

  RAISE NOTICE '✅ Assigned Admin role';

  -- =============================================================================
  -- STEP 5: Create Auth Users (via Supabase Auth API)
  -- =============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'IMPORTANT: Manual Steps Required!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Users created in database, but you need to create auth accounts:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Super Admin:';
  RAISE NOTICE '   - Go to Supabase Dashboard > Authentication > Users';
  RAISE NOTICE '   - Click "Add user" > "Create new user"';
  RAISE NOTICE '   - Email: %', superadmin_email;
  RAISE NOTICE '   - Password: %', superadmin_password;
  RAISE NOTICE '   - User ID: %', superadmin_user_id;
  RAISE NOTICE '   - Check "Auto Confirm User"';
  RAISE NOTICE '';
  RAISE NOTICE '2. Admin:';
  RAISE NOTICE '   - Click "Add user" > "Create new user"';
  RAISE NOTICE '   - Email: %', admin_email;
  RAISE NOTICE '   - Password: %', admin_password;
  RAISE NOTICE '   - User ID: %', admin_user_id;
  RAISE NOTICE '   - Check "Auto Confirm User"';
  RAISE NOTICE '';
  RAISE NOTICE 'OR use these SQL commands (if extensions enabled):';
  RAISE NOTICE '';

END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Show created users
SELECT
  '📋 CREATED USERS:' as info,
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
  u.is_active,
  u.created_at
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.created_at >= NOW() - INTERVAL '1 minute'
ORDER BY r.level DESC;

-- Show all current users
SELECT
  '📊 ALL ACTIVE USERS:' as info,
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  r.level as role_level
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = true
ORDER BY r.level DESC NULLS LAST;

-- =============================================================================
-- ALTERNATIVE: Create via Supabase Auth API (if you prefer)
-- =============================================================================

/*
If you want to create users properly via Supabase Auth first, then update profiles:

1. Register via UI or Auth API with emails:
   - superadmin@wchecks.com (password: SuperAdmin123!)
   - admin@wchecks.com (password: Admin123!)

2. Then run this SQL to assign roles:

-- Get user IDs from auth
DO $$
DECLARE
  superadmin_id UUID;
  admin_id UUID;
BEGIN
  SELECT id INTO superadmin_id FROM users WHERE email = 'superadmin@wchecks.com';
  SELECT id INTO admin_id FROM users WHERE email = 'admin@wchecks.com';

  -- Assign Super Admin role
  INSERT INTO user_roles (user_id, role_id, assigned_by, created_at)
  VALUES (
    superadmin_id,
    (SELECT id FROM roles WHERE level >= 100 ORDER BY level DESC LIMIT 1),
    superadmin_id,
    NOW()
  ) ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Assign Admin role
  INSERT INTO user_roles (user_id, role_id, assigned_by, created_at)
  VALUES (
    admin_id,
    (SELECT id FROM roles WHERE level >= 80 AND level < 100 ORDER BY level DESC LIMIT 1),
    superadmin_id,
    NOW()
  ) ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE '✅ Roles assigned successfully';
END $$;
*/

-- =============================================================================
-- NOTES
-- =============================================================================

/*
Why this approach:

1. Creates users in users table with complete data
2. Assigns proper roles immediately
3. You control the User IDs (important for consistency)
4. Data is complete and clean

Limitation:
- Auth accounts must be created manually in Supabase Dashboard
- OR use the alternative approach (register via UI first)

Recommendation:
- Use Supabase Dashboard to create auth users with the exact UUIDs shown above
- Or use the alternative approach at the end of this file
*/
