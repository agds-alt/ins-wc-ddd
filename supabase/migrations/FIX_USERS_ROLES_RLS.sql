-- =============================================================================
-- FIX: Enable RLS for USERS and ROLES tables
-- =============================================================================
-- CRITICAL: These tables were missing RLS protection in original migration
-- Created: 2025-10-28
-- Issue: users and roles tables exposed without RLS policies
-- =============================================================================

-- =============================================================================
-- Drop Existing Policies (if any)
-- =============================================================================

-- Drop USERS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view active users" ON users;
DROP POLICY IF EXISTS "Only admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Only admins can create users" ON users;
DROP POLICY IF EXISTS "Only super admins can delete users" ON users;

-- Drop ROLES policies
DROP POLICY IF EXISTS "Anyone can view active roles" ON roles;
DROP POLICY IF EXISTS "Only super admins can create roles" ON roles;
DROP POLICY IF EXISTS "Only super admins can update roles" ON roles;
DROP POLICY IF EXISTS "Only super admins can delete roles" ON roles;

-- =============================================================================
-- Enable RLS on USERS and ROLES tables
-- =============================================================================

ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS Table Policies
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can view all users
CREATE POLICY "Only admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 80
  )
);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Only admins can create users (via registration or admin panel)
-- Note: Registration handles this via service role, but we allow admins for manual creation
CREATE POLICY "Only admins can create users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 80
  )
);

-- Only super admins can delete users
CREATE POLICY "Only super admins can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 100
  )
);

-- =============================================================================
-- ROLES Table Policies
-- =============================================================================

-- All authenticated users can view active roles (needed for role checks)
CREATE POLICY "Anyone can view active roles"
ON roles FOR SELECT
TO authenticated
USING (is_active = true);

-- Only super admins can create roles
CREATE POLICY "Only super admins can create roles"
ON roles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 100
  )
);

-- Only super admins can update roles
CREATE POLICY "Only super admins can update roles"
ON roles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 100
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 100
  )
);

-- Only super admins can delete roles
CREATE POLICY "Only super admins can delete roles"
ON roles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 100
  )
);

-- =============================================================================
-- Verification Query
-- =============================================================================

-- Run this to verify RLS is enabled:
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'roles')
ORDER BY tablename;

-- Expected output:
-- public | roles | true
-- public | users | true

-- =============================================================================
-- End of USERS and ROLES RLS Fix
-- =============================================================================

/*
IMPORTANT NOTES:

1. **Registration Bypass:**
   - User registration goes through Supabase Auth (service role)
   - Service role bypasses RLS, so registration still works
   - But we added admin-only policy for manual user creation

2. **Helper Functions:**
   - is_admin() and is_super_admin() functions already exist
   - They query user_roles and roles tables
   - RLS on roles allows this (SELECT policy for authenticated)

3. **Security Impact:**
   - Users can only see their own profile
   - Admins can see all users
   - Only super admins can manage roles
   - Roles are readable by all (needed for permission checks)

4. **Testing:**
   - Login as regular user → should only see own profile
   - Login as admin (level 80+) → should see all users
   - Login as super admin (level 100+) → can manage roles
*/
