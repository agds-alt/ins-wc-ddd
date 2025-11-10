-- DEBUG: Check current user's role for building creation
-- Run this query in Supabase SQL Editor while logged in as your user

-- Step 1: Check who you are
SELECT
  'Current User' as check_type,
  auth.uid() as user_id,
  auth.email() as email;

-- Step 2: Check your roles
SELECT
  'User Roles' as check_type,
  u.email,
  u.full_name,
  r.name as role_name,
  r.level as role_level,
  CASE
    WHEN r.level >= 80 THEN '✅ CAN CREATE BUILDINGS'
    ELSE '❌ CANNOT CREATE BUILDINGS (need level >= 80)'
  END as can_create_buildings
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = auth.uid();

-- Step 3: Check if is_admin() function works
SELECT
  'Admin Check' as check_type,
  is_admin() as is_admin,
  CASE
    WHEN is_admin() THEN '✅ You are admin'
    ELSE '❌ You are NOT admin'
  END as status;

-- Step 4: Check buildings RLS policy
SELECT
  'Buildings RLS Policy' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'buildings'
ORDER BY policyname;
