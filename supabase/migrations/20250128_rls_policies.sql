-- =============================================================================
-- Row Level Security (RLS) Policies for WC-Checks
-- =============================================================================
-- This migration adds comprehensive RLS policies to secure database operations
-- Created: 2025-01-28
-- Sprint: 2
-- =============================================================================

-- =============================================================================
-- Drop Existing Policies (if any)
-- =============================================================================

-- Drop ORGANIZATIONS policies
DROP POLICY IF EXISTS "Anyone can view active organizations" ON organizations;
DROP POLICY IF EXISTS "Only admins can create organizations" ON organizations;
DROP POLICY IF EXISTS "Only admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Only super admins can delete organizations" ON organizations;

-- Drop BUILDINGS policies
DROP POLICY IF EXISTS "Anyone can view active buildings" ON buildings;
DROP POLICY IF EXISTS "Only admins can create buildings" ON buildings;
DROP POLICY IF EXISTS "Only admins can update buildings" ON buildings;
DROP POLICY IF EXISTS "Only super admins can delete buildings" ON buildings;

-- Drop LOCATIONS policies
DROP POLICY IF EXISTS "Anyone can view active locations" ON locations;
DROP POLICY IF EXISTS "Only admins can create locations" ON locations;
DROP POLICY IF EXISTS "Only admins can update locations" ON locations;
DROP POLICY IF EXISTS "Only admins can delete locations" ON locations;

-- Drop INSPECTION_RECORDS policies
DROP POLICY IF EXISTS "Users can view their own inspections" ON inspection_records;
DROP POLICY IF EXISTS "Anyone can create inspections" ON inspection_records;
DROP POLICY IF EXISTS "Users can update own unverified inspections" ON inspection_records;
DROP POLICY IF EXISTS "Only admins can delete inspections" ON inspection_records;

-- Drop PHOTOS policies
DROP POLICY IF EXISTS "Users can view photos from their inspections" ON photos;
DROP POLICY IF EXISTS "Users can upload photos to their inspections" ON photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "Only admins can hard delete photos" ON photos;

-- Drop USER_ROLES policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Only super admins can create user roles" ON user_roles;
DROP POLICY IF EXISTS "Only super admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Only super admins can delete user roles" ON user_roles;

-- =============================================================================
-- Enable RLS on all tables
-- =============================================================================
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inspection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Helper Functions for RLS
-- =============================================================================

-- Check if user is admin (level >= 80)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 80
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin (level >= 100)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 100
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has minimum role level
CREATE OR REPLACE FUNCTION public.user_has_role_level(min_level integer)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= min_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ORGANIZATIONS Policies
-- =============================================================================

-- Allow all authenticated users to read active organizations
CREATE POLICY "Anyone can view active organizations"
ON organizations FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can create organizations
CREATE POLICY "Only admins can create organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admins can update organizations
CREATE POLICY "Only admins can update organizations"
ON organizations FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Only super admins can delete organizations
CREATE POLICY "Only super admins can delete organizations"
ON organizations FOR DELETE
TO authenticated
USING (is_super_admin());

-- =============================================================================
-- BUILDINGS Policies
-- =============================================================================

-- Allow all authenticated users to read active buildings
CREATE POLICY "Anyone can view active buildings"
ON buildings FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can create buildings
CREATE POLICY "Only admins can create buildings"
ON buildings FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admins can update buildings
CREATE POLICY "Only admins can update buildings"
ON buildings FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Only super admins can delete buildings
CREATE POLICY "Only super admins can delete buildings"
ON buildings FOR DELETE
TO authenticated
USING (is_super_admin());

-- =============================================================================
-- LOCATIONS Policies
-- =============================================================================

-- Allow all authenticated users to read active locations
CREATE POLICY "Anyone can view active locations"
ON locations FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can create locations
CREATE POLICY "Only admins can create locations"
ON locations FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only admins can update locations
CREATE POLICY "Only admins can update locations"
ON locations FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Only admins can delete locations (soft delete)
CREATE POLICY "Only admins can delete locations"
ON locations FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================================================
-- INSPECTION_RECORDS Policies
-- =============================================================================

-- Users can view their own inspections
CREATE POLICY "Users can view their own inspections"
ON inspection_records FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- All authenticated users can create inspections
CREATE POLICY "Anyone can create inspections"
ON inspection_records FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own unverified inspections, admins can update any
CREATE POLICY "Users can update own unverified inspections"
ON inspection_records FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid() AND verified_at IS NULL)
  OR is_admin()
)
WITH CHECK (
  (user_id = auth.uid() AND verified_at IS NULL)
  OR is_admin()
);

-- Only admins can delete inspections
CREATE POLICY "Only admins can delete inspections"
ON inspection_records FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================================================
-- PHOTOS Policies
-- =============================================================================

-- Users can view photos from their own inspections or if admin
CREATE POLICY "Users can view photos from their inspections"
ON photos FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM inspection_records ir
    WHERE ir.id = photos.inspection_id
    AND ir.user_id = auth.uid()
  )
);

-- Users can upload photos to their own inspections
CREATE POLICY "Users can upload photos to their inspections"
ON photos FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM inspection_records ir
    WHERE ir.id = inspection_id
    AND ir.user_id = auth.uid()
  )
);

-- Users can update their own photos, admins can update any
CREATE POLICY "Users can update their own photos"
ON photos FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR is_admin())
WITH CHECK (created_by = auth.uid() OR is_admin());

-- Only admins can delete photos (hard delete)
CREATE POLICY "Only admins can hard delete photos"
ON photos FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================================================
-- USER_ROLES Policies
-- =============================================================================

-- Users can view their own roles, admins can view all
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- Only super admins can manage user roles
CREATE POLICY "Only super admins can create user roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

CREATE POLICY "Only super admins can update user roles"
ON user_roles FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Only super admins can delete user roles"
ON user_roles FOR DELETE
TO authenticated
USING (is_super_admin());

-- =============================================================================
-- Grant Execute Permissions on Helper Functions
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role_level(integer) TO authenticated;

-- =============================================================================
-- End of RLS Policies Migration
-- =============================================================================

-- Note: To apply these policies, run this SQL in your Supabase SQL Editor
-- or use the Supabase CLI: supabase db reset
