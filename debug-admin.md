# Debug: Admin Access Issue

## User Info
- Email: abdulgofur100persen@gmail.com
- Role: superadmin (registered in DB)
- Issue: Cannot access locations

## Current Implementation
useIsAdmin hook calls: `supabase.rpc('is_admin')`

## Test Queries

### 1. Check if user exists in auth.users
```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'abdulgofur100persen@gmail.com';
```

### 2. Check if user exists in public.users table
```sql
SELECT id, email, full_name, is_active
FROM public.users
WHERE email = 'abdulgofur100persen@gmail.com';
```

### 3. Check user roles
```sql
SELECT 
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  r.level as role_level,
  ur.created_at
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = (
  SELECT id FROM auth.users WHERE email = 'abdulgofur100persen@gmail.com'
);
```

### 4. Check if is_admin() function exists
```sql
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'is_admin';
```

### 5. Test is_admin() function
```sql
-- Set session user (run as superadmin)
SELECT is_admin();
SELECT is_super_admin();
```

### 6. Check locations table RLS status
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'locations';
```

### 7. Check RLS policies on locations table
```sql
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
  AND tablename = 'locations';
```

## RLS Recommendation

**PENTING:** RLS HARUS DIAKTIFKAN untuk production!

### Why RLS is Critical:
1. **Security**: Tanpa RLS, semua user bisa akses semua data
2. **Authorization**: RLS enforce permission di database level
3. **Defense in Depth**: Extra layer of security

### Temporary Debugging (Development Only):
- ✅ Nonaktifkan RLS sementara untuk debug
- ✅ Test query langsung
- ❌ JANGAN deploy ke production tanpa RLS

### Proper RLS Setup:
```sql
-- Enable RLS on locations table
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin can do everything
CREATE POLICY "Admins have full access to locations"
ON public.locations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 80 -- admin level
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 80
  )
);

-- Policy 2: All authenticated users can view active locations
CREATE POLICY "Users can view active locations"
ON public.locations
FOR SELECT
TO authenticated
USING (is_active = true);
```

## Troubleshooting Steps

### Step 1: Verify RPC function exists
If `is_admin()` doesn't exist, create it:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 80 -- 80 = admin, 90 = superadmin
  );
END;
$$;
```

### Step 2: Verify user has role assigned
Check user_roles table:
- user_id should match auth.users.id
- role_id should point to correct role in roles table

### Step 3: Check role levels
```sql
SELECT * FROM roles ORDER BY level DESC;
```

Expected levels:
- 100 = System Admin
- 90 = Super Admin
- 80 = Admin
- 70 = Manager
- 50 = Supervisor
- 30 = Staff
- 10 = Guest

## Alternative: Bypass RPC for Testing

Update useIsAdmin hook to query directly:

```typescript
// Temporary debug version
const { data, error } = await supabase
  .from('user_roles')
  .select(`
    role_id,
    roles (
      name,
      level
    )
  `)
  .eq('user_id', user.id)
  .gte('roles.level', 80)
  .single();

setIsAdmin(!!data && !error);
```
