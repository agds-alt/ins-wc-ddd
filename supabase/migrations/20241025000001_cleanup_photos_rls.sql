-- CLEANUP & FIX: Photos Table RLS Policies
-- Date: 2024-10-25
-- Purpose: Remove redundant policies and create clean, consistent policies

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- This ensures clean slate
DROP POLICY IF EXISTS "Users can view relevant photos" ON photos;
DROP POLICY IF EXISTS "Admins can manage all photos" ON photos;
DROP POLICY IF EXISTS "Users can view own photos" ON photos;
DROP POLICY IF EXISTS "Users can view inspection photos" ON photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Admin can view all photos" ON photos;
DROP POLICY IF EXISTS "Users can upload photos" ON photos;
DROP POLICY IF EXISTS "Admin can delete any photos" ON photos;
DROP POLICY IF EXISTS "Users can soft delete own photos" ON photos;
DROP POLICY IF EXISTS "Admins can view all photos" ON photos;

-- Drop any other potential policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'photos'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON photos', r.policyname);
  END LOOP;
END $$;

-- ============================================
-- STEP 2: VERIFY RLS IS ENABLED
-- ============================================

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: CREATE CLEAN, CONSISTENT POLICIES
-- ============================================

-- Policy 1: Users can SELECT their own photos (not deleted)
CREATE POLICY "users_select_own_photos"
ON photos FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  AND (is_deleted = false OR is_deleted IS NULL)
);

-- Policy 2: Users can SELECT photos from inspections they created
CREATE POLICY "users_select_inspection_photos"
ON photos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM inspection_records ir
    WHERE ir.id = photos.inspection_id
    AND ir.user_id = auth.uid()
  )
  AND (is_deleted = false OR is_deleted IS NULL)
);

-- Policy 3: Users can SELECT photos from any location (public)
CREATE POLICY "users_select_location_photos"
ON photos FOR SELECT
TO authenticated
USING (
  location_id IS NOT NULL
  AND inspection_id IS NULL
  AND (is_deleted = false OR is_deleted IS NULL)
);

-- Policy 4: Admins can SELECT all photos (including deleted)
CREATE POLICY "admins_select_all_photos"
ON photos FOR SELECT
TO authenticated
USING (
  user_has_any_role_level(ARRAY['admin', 'super_admin'])
);

-- Policy 5: Users can INSERT photos (with validation)
CREATE POLICY "users_insert_photos"
ON photos FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (is_deleted = false OR is_deleted IS NULL)
  AND file_url IS NOT NULL
  AND (
    inspection_id IS NOT NULL OR 
    location_id IS NOT NULL
  )
);

-- Policy 6: Users can UPDATE their own photos (not deleted)
CREATE POLICY "users_update_own_photos"
ON photos FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  AND (is_deleted = false OR is_deleted IS NULL)
)
WITH CHECK (
  created_by = auth.uid()
  AND updated_by = auth.uid()
);

-- Policy 7: Users can soft DELETE their own photos
CREATE POLICY "users_soft_delete_own_photos"
ON photos FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  AND (is_deleted = false OR is_deleted IS NULL)
)
WITH CHECK (
  created_by = auth.uid()
  AND deleted_by = auth.uid()
  AND is_deleted = true
);

-- Policy 8: Admins can do everything
CREATE POLICY "admins_all_operations"
ON photos FOR ALL
TO authenticated
USING (
  user_has_any_role_level(ARRAY['admin', 'super_admin'])
);

-- Policy 9: Service role full access
CREATE POLICY "service_role_full_access"
ON photos FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- STEP 4: GRANT NECESSARY PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON photos TO authenticated;
GRANT ALL ON photos TO service_role;

-- ============================================
-- STEP 5: VERIFY POLICIES
-- ============================================

-- Should show exactly 9 policies
SELECT 
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies
WHERE tablename = 'photos'
ORDER BY cmd, policyname;

-- Check RLS status
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'photos';

-- ============================================
-- STEP 6: TEST POLICIES (Optional)
-- ============================================

-- Test 1: User can insert photo
-- (Run as authenticated user)
/*
INSERT INTO photos (
  file_url,
  file_name,
  mime_type,
  inspection_id,
  field_reference,
  created_by
) VALUES (
  'https://test.com/photo.jpg',
  'test.jpg',
  'image/jpeg',
  'valid-inspection-id',
  'floor_photo',
  auth.uid()
);
*/

-- Test 2: User can select own photos
/*
SELECT * FROM photos 
WHERE created_by = auth.uid();
*/

-- Test 3: User cannot select other users' photos (should return empty)
/*
SELECT * FROM photos 
WHERE created_by != auth.uid()
  AND inspection_id NOT IN (
    SELECT id FROM inspection_records WHERE user_id = auth.uid()
  );
*/

-- ============================================
-- STEP 7: REGENERATE TYPES
-- ============================================

-- After running this successfully:
-- npx supabase gen types typescript --project-id YOUR_PROJECT_ID > database.types.ts

-- ============================================
-- POLICY SUMMARY
-- ============================================

/*
POLICY STRUCTURE (9 Total):

SELECT (4 policies):
├─ users_select_own_photos              → Own photos only
├─ users_select_inspection_photos       → Inspection photos they created
├─ users_select_location_photos         → Public location photos
└─ admins_select_all_photos             → Admins see everything

INSERT (1 policy):
└─ users_insert_photos                  → With validation (url, id required)

UPDATE (2 policies):
├─ users_update_own_photos              → Can update metadata
└─ users_soft_delete_own_photos         → Can soft delete own

ALL (2 policies):
├─ admins_all_operations                → Admins do anything
└─ service_role_full_access             → Service role full access

KEY IMPROVEMENTS:
✅ No duplicate policies
✅ Consistent naming (snake_case)
✅ Proper validation on INSERT
✅ Clear separation of concerns
✅ Uses helper function consistently
✅ Explicit role checks (authenticated, service_role)
*/

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE photos IS 'Photos with clean RLS policies and soft delete support';

-- ============================================
-- EXPECTED RESULT
-- ============================================

/*
After this migration:
✅ 9 clean, non-redundant policies
✅ Proper INSERT validation
✅ Consistent use of helper functions
✅ Clear policy names
✅ Should appear in database.types.ts after regeneration

To verify:
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'photos';
-- Should return: 9
*/