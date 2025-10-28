-- =============================================================================
-- SEED DATA: Roles & User Role Assignments
-- =============================================================================
-- Jalankan file ini JIKA verification queries menunjukkan data roles/user_roles kosong
-- =============================================================================

-- =============================================================================
-- PART 1: CREATE/UPDATE ROLES (Master Data)
-- =============================================================================

-- Insert or update standard roles
-- Using INSERT ... ON CONFLICT to be safe (won't error if roles already exist)

INSERT INTO roles (id, name, description, level, is_active, created_at, updated_at)
VALUES
  (
    'role-super-admin',
    'Super Admin',
    'Full system access with ability to manage all users, roles, and system settings',
    100,
    true,
    NOW(),
    NOW()
  ),
  (
    'role-admin',
    'Admin',
    'Can manage organizations, buildings, locations, and view all inspection data',
    80,
    true,
    NOW(),
    NOW()
  ),
  (
    'role-manager',
    'Manager',
    'Can manage locations within assigned organization and view reports',
    60,
    true,
    NOW(),
    NOW()
  ),
  (
    'role-user',
    'User',
    'Standard user can perform inspections and view own data',
    40,
    true,
    NOW(),
    NOW()
  ),
  (
    'role-viewer',
    'Viewer',
    'Read-only access to inspection data',
    20,
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

-- Verify roles were created
SELECT
  id,
  name,
  level,
  is_active,
  '✅ Created/Updated' as status
FROM roles
ORDER BY level DESC;


-- =============================================================================
-- PART 2: ASSIGN ROLES TO EXISTING USERS
-- =============================================================================

-- 🚨 CRITICAL: You need to customize this section!
-- Option 1: Assign specific user as Super Admin (RECOMMENDED)
-- Option 2: Make all existing users regular users
-- Option 3: Make first user Super Admin, rest regular users

-- -----------------------------------------------------------------------------
-- OPTION 1: Assign Super Admin to SPECIFIC email (RECOMMENDED)
-- -----------------------------------------------------------------------------
-- Replace 'your-email@example.com' with your actual admin email

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get user ID by email
  SELECT id INTO admin_user_id
  FROM users
  WHERE email = 'your-email@example.com'  -- 🚨 CHANGE THIS!
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Assign Super Admin role
    INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
    VALUES (admin_user_id, 'role-super-admin', NOW(), admin_user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    RAISE NOTICE '✅ Super Admin role assigned to user: %', admin_user_id;
  ELSE
    RAISE WARNING '⚠️ User with email your-email@example.com not found!';
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- OPTION 2: Assign Admin role to MULTIPLE specific emails
-- -----------------------------------------------------------------------------
-- Uncomment and modify this if you have multiple admins

/*
DO $$
DECLARE
  admin_emails TEXT[] := ARRAY['admin1@example.com', 'admin2@example.com']; -- 🚨 CHANGE THIS!
  admin_email TEXT;
  admin_user_id UUID;
BEGIN
  FOREACH admin_email IN ARRAY admin_emails
  LOOP
    SELECT id INTO admin_user_id
    FROM users
    WHERE email = admin_email
    LIMIT 1;

    IF admin_user_id IS NOT NULL THEN
      INSERT INTO user_roles (user_id, role_id, assigned_at)
      VALUES (admin_user_id, 'role-admin', NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING;

      RAISE NOTICE '✅ Admin role assigned to: %', admin_email;
    ELSE
      RAISE WARNING '⚠️ User not found: %', admin_email;
    END IF;
  END LOOP;
END $$;
*/


-- -----------------------------------------------------------------------------
-- OPTION 3: Make FIRST registered user Super Admin, rest regular users
-- -----------------------------------------------------------------------------
-- Uncomment this if you want automatic assignment based on registration order

/*
DO $$
DECLARE
  first_user_id UUID;
  regular_user_record RECORD;
BEGIN
  -- Get first registered user
  SELECT id INTO first_user_id
  FROM users
  WHERE is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF first_user_id IS NOT NULL THEN
    -- Assign Super Admin to first user
    INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
    VALUES (first_user_id, 'role-super-admin', NOW(), first_user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    RAISE NOTICE '✅ First user assigned Super Admin role: %', first_user_id;

    -- Assign regular User role to all other users
    FOR regular_user_record IN
      SELECT id FROM users WHERE is_active = true AND id != first_user_id
    LOOP
      INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
      VALUES (regular_user_record.id, 'role-user', NOW(), first_user_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END LOOP;

    RAISE NOTICE '✅ Other users assigned regular User role';
  END IF;
END $$;
*/


-- -----------------------------------------------------------------------------
-- OPTION 4: Assign User role to ALL existing users (Safe default)
-- -----------------------------------------------------------------------------
-- This ensures no one loses access, then you can upgrade specific users to admin

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT
  u.id,
  'role-user',
  NOW()
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.is_active = true
AND ur.id IS NULL  -- Only assign if user doesn't have role yet
ON CONFLICT (user_id, role_id) DO NOTHING;


-- =============================================================================
-- PART 3: VERIFICATION AFTER SEEDING
-- =============================================================================

-- 3.1 Show all role assignments
SELECT
  u.email,
  u.full_name,
  r.name as role_name,
  r.level as role_level,
  CASE
    WHEN r.level >= 100 THEN '👑 Super Admin'
    WHEN r.level >= 80 THEN '⭐ Admin'
    WHEN r.level >= 60 THEN '👥 Manager'
    ELSE '👤 User'
  END as access_type,
  ur.assigned_at
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
WHERE u.is_active = true
ORDER BY r.level DESC, u.email;

-- 3.2 Check for users without roles (should be 0 after seeding)
SELECT
  COUNT(*) as users_without_roles,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All users have roles'
    ELSE '❌ Some users still missing roles!'
  END as status
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.is_active = true
AND ur.id IS NULL;

-- 3.3 Check admin count
SELECT
  COUNT(*) as admin_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ At least one admin exists'
    ELSE '❌ NO ADMIN - RLS will lock you out!'
  END as status
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE r.level >= 80;


-- =============================================================================
-- PART 4: MANUAL ROLE ASSIGNMENT TEMPLATE
-- =============================================================================

-- Use this template to manually assign roles to specific users

/*
-- Find user ID by email
SELECT id, email, full_name FROM users WHERE email LIKE '%your-email%';

-- Assign Super Admin role to specific user
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES (
  'user-id-here',  -- 🚨 Replace with actual user ID
  'role-super-admin',
  NOW()
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Or assign Admin role
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES (
  'user-id-here',  -- 🚨 Replace with actual user ID
  'role-admin',
  NOW()
)
ON CONFLICT (user_id, role_id) DO NOTHING;
*/


-- =============================================================================
-- PART 5: UPGRADE USER TO ADMIN (After RLS is enabled)
-- =============================================================================

-- After RLS is enabled, only Super Admin can assign roles
-- Use this query to upgrade a user to admin:

/*
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
VALUES (
  (SELECT id FROM users WHERE email = 'user-to-upgrade@example.com'),
  'role-admin',
  NOW(),
  auth.uid()  -- Current logged-in super admin
)
ON CONFLICT (user_id, role_id) DO NOTHING;
*/


-- =============================================================================
-- NOTES & WARNINGS
-- =============================================================================

/*
IMPORTANT NOTES:

1. 🚨 CRITICAL: Make sure at least ONE user has Super Admin role BEFORE enabling RLS!
   - If no user has admin role, you'll be LOCKED OUT of admin functions
   - You'll need to disable RLS manually to fix it

2. ⚠️ Role Levels:
   - Super Admin (100+): Full system access, can manage users and roles
   - Admin (80-99): Can manage organizations, buildings, locations
   - Manager (60-79): Can manage locations in assigned organizations
   - User (40-59): Can create inspections, view own data
   - Viewer (20-39): Read-only access

3. ✅ Safe Approach:
   - First: Run VERIFICATION_QUERIES.sql to check current state
   - Second: Run this file (SEED_DATA_ROLES.sql) to create roles and assignments
   - Third: Verify again using VERIFICATION_QUERIES.sql
   - Finally: Apply RLS migration (20250128_rls_policies.sql)

4. 🔄 You can safely re-run this file multiple times
   - Uses ON CONFLICT DO NOTHING / DO UPDATE
   - Won't create duplicates
   - Will update existing roles if needed

5. 📝 NO NEED TO RE-REGISTER USERS!
   - Existing users keep their accounts
   - Just need role assignments
   - Login credentials unchanged
*/
