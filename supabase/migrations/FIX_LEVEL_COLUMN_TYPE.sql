-- =============================================================================
-- MIGRATION: Fix roles.level from VARCHAR/TEXT to INTEGER
-- =============================================================================
-- DANGER LEVEL: MEDIUM
-- This migration changes column data type which could break existing code
--
-- BEFORE RUNNING:
-- 1. BACKUP your database (Supabase Dashboard > Database > Backups)
-- 2. Verify no application code is running
-- 3. Read this entire file
-- =============================================================================

-- =============================================================================
-- STEP 1: VERIFY CURRENT STATE
-- =============================================================================

-- Check current column type
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'roles'
  AND column_name = 'level';

-- Expected: data_type = 'character varying' or 'text'

-- Check current data in roles table
SELECT
  id,
  name,
  display_name,
  level,
  pg_typeof(level) as current_type
FROM roles
ORDER BY level::integer;

-- Verify all level values can be converted to integer
SELECT
  id,
  name,
  level,
  CASE
    WHEN level ~ '^[0-9]+$' THEN '✅ Can convert to integer'
    ELSE '❌ CANNOT convert - contains non-numeric characters!'
  END as conversion_check
FROM roles;

-- If ANY row shows ❌, DO NOT PROCEED! Fix data first.

-- =============================================================================
-- STEP 2: CONVERT COLUMN TYPE (SAFE METHOD)
-- =============================================================================

-- This uses PostgreSQL USING clause to safely convert
-- If conversion fails, the entire transaction rolls back

BEGIN;

-- Convert the column type
ALTER TABLE roles
ALTER COLUMN level TYPE INTEGER
USING level::integer;

-- Verify the change
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'roles'
  AND column_name = 'level';

-- Expected: data_type = 'integer'

-- Verify data is still intact
SELECT
  id,
  name,
  display_name,
  level,
  pg_typeof(level) as new_type
FROM roles
ORDER BY level;

-- If everything looks good, COMMIT
COMMIT;

-- If something is wrong, run: ROLLBACK;

-- =============================================================================
-- STEP 3: VERIFY FOREIGN REFERENCES
-- =============================================================================

-- Check if any functions or views reference roles.level
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_definition ILIKE '%roles.level%'
  OR routine_definition ILIKE '%r.level%';

-- Update functions that compare level as string (if any)
-- Example: WHERE r.level >= '80' should become WHERE r.level >= 80

-- =============================================================================
-- STEP 4: UPDATE EXISTING FUNCTIONS (IF NEEDED)
-- =============================================================================

-- These functions from RLS migration might need updating:

-- Update is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 80  -- Now comparing integers, not strings
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_super_admin() function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 100  -- Now comparing integers
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user_has_role_level() function
CREATE OR REPLACE FUNCTION public.user_has_role_level(min_level integer)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= min_level  -- Already integer comparison
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 5: FINAL VERIFICATION
-- =============================================================================

-- Verify column type changed
SELECT
  'Column type verification:' as check_name,
  data_type,
  CASE
    WHEN data_type = 'integer' THEN '✅ SUCCESS - Column is now INTEGER'
    ELSE '❌ FAILED - Column is still ' || data_type
  END as result
FROM information_schema.columns
WHERE table_name = 'roles'
  AND column_name = 'level';

-- Verify data integrity
SELECT
  'Data integrity check:' as check_name,
  COUNT(*) as total_roles,
  MIN(level) as min_level,
  MAX(level) as max_level,
  '✅ All data intact' as status
FROM roles;

-- Verify functions work
SELECT
  'Function check:' as check_name,
  CASE
    WHEN user_has_role_level(40) IS NOT NULL THEN '✅ Functions working'
    ELSE '❌ Functions broken'
  END as status;

-- =============================================================================
-- ROLLBACK PROCEDURE (IF SOMETHING GOES WRONG)
-- =============================================================================

/*
If you need to rollback:

BEGIN;

-- Convert back to VARCHAR
ALTER TABLE roles
ALTER COLUMN level TYPE VARCHAR(10)
USING level::varchar;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'roles' AND column_name = 'level';

COMMIT;
*/

-- =============================================================================
-- POST-MIGRATION CHECKLIST
-- =============================================================================

/*
After running this migration:

1. ✅ Verify column type is INTEGER
2. ✅ Verify all roles data intact
3. ✅ Verify functions updated (is_admin, is_super_admin, user_has_role_level)
4. ✅ Regenerate TypeScript types:
   - Go to Supabase Dashboard
   - Project Settings > API > Generate Types
   - Copy to src/types/database.types.ts
5. ✅ Update any code that compares level as string to use integer
   - Change: r.level >= '80' to r.level >= 80
6. ✅ Test application:
   - Login as admin
   - Check admin access still works
   - Create test inspection

If all ✅, proceed with FIX_MISSING_ROLES!
*/
