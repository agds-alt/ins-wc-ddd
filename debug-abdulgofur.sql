-- ====================================================================
-- DEBUG QUERIES FOR abdulgofur100persen@gmail.com
-- ====================================================================
-- Run these queries ONE BY ONE in Supabase SQL Editor
-- ====================================================================

-- QUERY 1: Check if user exists in auth.users
-- ====================================================================
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'abdulgofur100persen@gmail.com';

-- Expected: Should return 1 row with user ID
-- If no rows: User belum register atau email salah
-- Copy the "id" value for next queries
-- ====================================================================


-- QUERY 2: Check if user exists in public.users table
-- ====================================================================
SELECT 
  id,
  email,
  full_name,
  is_active,
  created_at
FROM public.users
WHERE email = 'abdulgofur100persen@gmail.com';

-- Expected: Should return 1 row
-- If no rows: User belum ada di public.users (perlu INSERT)
-- ====================================================================


-- QUERY 3: Check user's assigned roles
-- ====================================================================
SELECT 
  ur.id as user_role_id,
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  r.level as role_level,
  r.description as role_description,
  ur.created_at as assigned_at
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = (
  SELECT id FROM auth.users WHERE email = 'abdulgofur100persen@gmail.com'
);

-- Expected: Should return 1 row with role_name = 'superadmin' or 'admin'
-- Expected: role_level should be >= 80 (80=Admin, 90=SuperAdmin)
-- If no rows: USER TIDAK PUNYA ROLE! Ini masalahnya!
-- ====================================================================


-- QUERY 4: Check all available roles
-- ====================================================================
SELECT 
  id,
  name,
  level,
  description,
  is_active
FROM roles
ORDER BY level DESC;

-- Expected: Should see roles like:
-- - superadmin (level 90 or 100)
-- - admin (level 80)
-- - etc.
-- ====================================================================


-- QUERY 5: Test RPC functions (if user has role)
-- ====================================================================
-- NOTE: You must be logged in as abdulgofur100persen@gmail.com for this to work
-- Run this in Supabase SQL Editor while authenticated as that user

SELECT 
  auth.uid() as my_user_id,
  is_admin() as am_i_admin,
  is_super_admin() as am_i_super_admin,
  get_user_role_level() as my_role_level;

-- Expected if everything is correct:
-- am_i_admin: true
-- am_i_super_admin: true (if level >= 90)
-- my_role_level: 90 or 100
-- ====================================================================


-- ====================================================================
-- SOLUTION QUERIES (Run if user has no role)
-- ====================================================================

-- SOLUTION 1: If user has no role, assign superadmin role
-- ====================================================================
-- First, get the superadmin role ID
SELECT id, name, level FROM roles WHERE name ILIKE '%admin%';

-- Then insert user_role (replace UUIDs with actual values)
INSERT INTO user_roles (user_id, role_id, assigned_by)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'abdulgofur100persen@gmail.com'),
  (SELECT id FROM roles WHERE name = 'superadmin' LIMIT 1),
  (SELECT id FROM auth.users WHERE email = 'abdulgofur100persen@gmail.com')
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verify
SELECT 
  ur.user_id,
  r.name as role_name,
  r.level as role_level
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = (SELECT id FROM auth.users WHERE email = 'abdulgofur100persen@gmail.com');
-- ====================================================================


-- SOLUTION 2: If public.users doesn't have the user, insert it
-- ====================================================================
INSERT INTO public.users (id, email, full_name, is_active)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  true as is_active
FROM auth.users
WHERE email = 'abdulgofur100persen@gmail.com'
ON CONFLICT (id) DO NOTHING;
-- ====================================================================


-- ====================================================================
-- FINAL VERIFICATION
-- ====================================================================
-- Run this to see complete user info
SELECT 
  au.id,
  au.email,
  pu.full_name,
  r.name as role_name,
  r.level as role_level,
  ur.created_at as role_assigned_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE au.email = 'abdulgofur100persen@gmail.com';

-- Expected: All fields should have values
-- role_name should be 'superadmin'
-- role_level should be 90 or 100
-- ====================================================================
