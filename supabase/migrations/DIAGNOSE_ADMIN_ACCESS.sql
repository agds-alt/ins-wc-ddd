-- DIAGNOSE ADMIN ACCESS ISSUES
-- Run this to check RLS policies for locations, buildings, organizations

-- 1. Check if tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('locations', 'buildings', 'organizations')
ORDER BY tablename;

-- 2. Check existing policies on locations table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'locations'
ORDER BY policyname;

-- 3. Check existing policies on buildings table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'buildings'
ORDER BY policyname;

-- 4. Check existing policies on organizations table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'organizations'
ORDER BY policyname;

-- 5. Test your admin access
SELECT
  'Testing admin check' as test,
  is_admin() as you_are_admin,
  auth.uid() as your_user_id;

-- 6. Test if you can see locations
SELECT
  'Locations you can see' as test,
  COUNT(*) as total_locations
FROM locations;

-- 7. Test user_roles
SELECT
  'Your roles' as test,
  r.name as role_name,
  r.level as role_level
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();
