-- FIX: Assign Admin Role to User
-- This script will give admin privileges to a user so they can create buildings

-- STEP 1: Find your user
-- Replace 'your-email@example.com' with your actual email
DO $$
DECLARE
  v_user_id uuid;
  v_admin_role_id uuid;
  v_user_email text := 'your-email@example.com'; -- CHANGE THIS!
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', v_user_email;
  END IF;

  RAISE NOTICE 'Found user: % (ID: %)', v_user_email, v_user_id;

  -- Get Admin role ID (level 80)
  SELECT id INTO v_admin_role_id
  FROM roles
  WHERE level = 80
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role (level 80) not found in roles table';
  END IF;

  RAISE NOTICE 'Found admin role: %', v_admin_role_id;

  -- Assign admin role (delete existing role first to avoid duplicates)
  DELETE FROM user_roles WHERE user_id = v_user_id;

  INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
  VALUES (v_user_id, v_admin_role_id, NOW(), NOW());

  RAISE NOTICE '✅ Successfully assigned admin role to %', v_user_email;

  -- Update users table if it has a role column
  UPDATE users
  SET role = 'admin'
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Updated users table role column';

END $$;

-- Verify the assignment
SELECT
  u.email,
  u.full_name,
  r.name as role_name,
  r.level as role_level,
  '✅ CAN CREATE BUILDINGS' as status
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'your-email@example.com'; -- CHANGE THIS!
