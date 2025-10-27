-- ====================================================================
-- EMERGENCY FIX: Enable user_roles access
-- ====================================================================
-- This allows LocationsListPage to work by enabling users to read
-- their own roles from user_roles table
-- ====================================================================

-- OPTION 1: Add RLS policy for user_roles (RECOMMENDED)
-- ====================================================================

-- Drop existing policy if any
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Also allow viewing roles table
DROP POLICY IF EXISTS "Everyone can view roles" ON public.roles;

CREATE POLICY "Everyone can view roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_level() TO authenticated;

-- ====================================================================
-- VERIFY
-- ====================================================================
-- Test if you can read your own role
SELECT
  ur.user_id,
  r.name as role_name,
  r.level as role_level
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();

-- Expected: Should return your role (super_admin, level 90)
-- If error: RLS is blocking, run OPTION 2 below
-- ====================================================================


-- ====================================================================
-- OPTION 2: Temporarily disable RLS (DEVELOPMENT ONLY)
-- ====================================================================
-- WARNING: Only use this for debugging!
-- DO NOT USE IN PRODUCTION!
-- ====================================================================

-- Uncomment these lines to disable RLS temporarily:
-- ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.buildings DISABLE ROW LEVEL SECURITY;

-- After app works, re-enable with:
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
-- ====================================================================
