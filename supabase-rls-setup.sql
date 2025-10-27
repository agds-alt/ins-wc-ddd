-- ====================================================================
-- SUPABASE RLS (Row Level Security) SETUP
-- ====================================================================
-- IMPORTANT: RLS MUST BE ENABLED FOR PRODUCTION SECURITY!
--
-- Without RLS:
-- - Any authenticated user can read/write ANY data
-- - No authorization checks at database level
-- - Major security vulnerability
--
-- With RLS:
-- - Database enforces permissions automatically
-- - Users can only access data they're allowed to see
-- - Extra security layer beyond application logic
-- ====================================================================

-- ====================================================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- ====================================================================

-- Function: is_admin()
-- Check if current user has admin privileges (level >= 80)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 80 -- 80 = Admin, 90 = Super Admin, 100 = System Admin
  );
END;
$$;

-- Function: is_super_admin()
-- Check if current user has super admin privileges (level >= 90)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 90 -- 90 = Super Admin, 100 = System Admin
  );
END;
$$;

-- Function: get_user_role_level()
-- Get current user's role level
CREATE OR REPLACE FUNCTION public.get_user_role_level()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_level integer;
BEGIN
  SELECT COALESCE(MAX(r.level), 0) INTO user_level
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid();

  RETURN user_level;
END;
$$;

-- ====================================================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ====================================================================

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on buildings table
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on locations table
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on inspection_records table
ALTER TABLE public.inspection_records ENABLE ROW LEVEL SECURITY;

-- Enable RLS on photos table
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on roles table (read-only for all)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- STEP 3: CREATE RLS POLICIES FOR ORGANIZATIONS
-- ====================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin full access to organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view active organizations" ON public.organizations;

-- Policy: Admins have full access
CREATE POLICY "Admin full access to organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policy: All authenticated users can view active organizations
CREATE POLICY "Users can view active organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (is_active = true);

-- ====================================================================
-- STEP 4: CREATE RLS POLICIES FOR BUILDINGS
-- ====================================================================

DROP POLICY IF EXISTS "Admin full access to buildings" ON public.buildings;
DROP POLICY IF EXISTS "Users can view active buildings" ON public.buildings;

CREATE POLICY "Admin full access to buildings"
ON public.buildings
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view active buildings"
ON public.buildings
FOR SELECT
TO authenticated
USING (is_active = true);

-- ====================================================================
-- STEP 5: CREATE RLS POLICIES FOR LOCATIONS
-- ====================================================================

DROP POLICY IF EXISTS "Admin full access to locations" ON public.locations;
DROP POLICY IF EXISTS "Users can view active locations" ON public.locations;

-- Policy: Admins have full access (CREATE, READ, UPDATE, DELETE)
CREATE POLICY "Admin full access to locations"
ON public.locations
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policy: All authenticated users can view active locations
CREATE POLICY "Users can view active locations"
ON public.locations
FOR SELECT
TO authenticated
USING (is_active = true);

-- ====================================================================
-- STEP 6: CREATE RLS POLICIES FOR INSPECTION_RECORDS
-- ====================================================================

DROP POLICY IF EXISTS "Admin can view all inspections" ON public.inspection_records;
DROP POLICY IF EXISTS "Users can view own inspections" ON public.inspection_records;
DROP POLICY IF EXISTS "Users can create own inspections" ON public.inspection_records;
DROP POLICY IF EXISTS "Admin can update all inspections" ON public.inspection_records;

-- Policy: Admins can view all inspection records
CREATE POLICY "Admin can view all inspections"
ON public.inspection_records
FOR SELECT
TO authenticated
USING (is_admin());

-- Policy: Users can view their own inspection records
CREATE POLICY "Users can view own inspections"
ON public.inspection_records
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can create their own inspection records
CREATE POLICY "Users can create own inspections"
ON public.inspection_records
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Admins can update all inspections
CREATE POLICY "Admin can update all inspections"
ON public.inspection_records
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ====================================================================
-- STEP 7: CREATE RLS POLICIES FOR PHOTOS
-- ====================================================================

DROP POLICY IF EXISTS "Admin can view all photos" ON public.photos;
DROP POLICY IF EXISTS "Users can view own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can upload photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update own photos" ON public.photos;

CREATE POLICY "Admin can view all photos"
ON public.photos
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Users can view own photos"
ON public.photos
FOR SELECT
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM inspection_records ir
    WHERE ir.id = photos.inspection_id
    AND ir.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload photos"
ON public.photos
FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own photos"
ON public.photos
FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- ====================================================================
-- STEP 8: CREATE RLS POLICIES FOR USERS TABLE
-- ====================================================================

DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Admin can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ====================================================================
-- STEP 9: CREATE RLS POLICIES FOR USER_ROLES TABLE
-- ====================================================================

DROP POLICY IF EXISTS "Admin can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admin can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ====================================================================
-- STEP 10: CREATE RLS POLICIES FOR ROLES TABLE
-- ====================================================================

DROP POLICY IF EXISTS "Everyone can view roles" ON public.roles;

-- Policy: All authenticated users can view roles (read-only reference data)
CREATE POLICY "Everyone can view roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- ====================================================================
-- STEP 11: GRANT NECESSARY PERMISSIONS
-- ====================================================================

-- Grant execute permission on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_level() TO authenticated;

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Check RLS status on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test functions for current user
SELECT
  is_admin() as is_admin,
  is_super_admin() as is_super_admin,
  get_user_role_level() as role_level;

-- ====================================================================
-- TROUBLESHOOTING
-- ====================================================================

-- If policies are blocking legitimate access:
-- 1. Check user has correct role assigned in user_roles table
-- 2. Verify role has correct level in roles table (80+ for admin)
-- 3. Test RPC functions manually
-- 4. Check if auth.uid() returns correct user ID

-- Temporarily disable RLS for debugging (DEVELOPMENT ONLY):
-- ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS after debugging:
-- ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- ROLE LEVELS REFERENCE
-- ====================================================================
-- 100 = System Admin (full system access)
-- 90  = Super Admin (manage users, roles, all data)
-- 80  = Admin (manage locations, view all data)
-- 70  = Manager (manage team, view team data)
-- 50  = Supervisor (oversee inspections)
-- 30  = Staff (perform inspections)
-- 10  = Guest (read-only access)
-- ====================================================================
