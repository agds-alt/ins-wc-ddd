# Debugging Guide

## 401 Unauthorized Error on Login

If you're getting 401 error when trying to login with existing users from old database, follow these debugging steps:

### Step 1: Check Database Connection

Visit this URL in your browser:
```
http://localhost:3000/api/debug/db
```

This will show:
- ✅ Database connection status
- ✅ How many users exist
- ✅ Sample users with their data
- ✅ Roles configuration
- ✅ User-role assignments

**What to look for:**
- Make sure `users.count` > 0 (users exist)
- Check that users have `has_password_hash: true`
- Verify roles exist (especially Super Admin role)

### Step 2: Test Login Process

Use curl or Postman to test login with detailed debugging:

```bash
curl -X POST http://localhost:3000/api/debug/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

This will show each step of the login process:
1. ✅/❌ User found by email
2. ✅/❌ User is active
3. ✅/❌ Password hash exists
4. ✅/❌ Password matches
5. ✅/❌ User role found

**Common Issues:**

#### Issue 1: User not found
```json
{
  "error": "User not found",
  "steps": ["❌ User not found"]
}
```
**Solution**: Email doesn't exist in database. Check spelling or create user via `/api/seed`.

#### Issue 2: Password does not match
```json
{
  "password_match": false,
  "error": "Invalid password",
  "hints": [
    "Password in database might be hashed with different algorithm",
    "Check if old Vite app used same bcryptjs",
    "Try creating new user via /api/seed"
  ]
}
```
**Solution**:
- Old app might have used different hashing algorithm
- Password in database might be corrupted
- **Best solution**: Create fresh test users via `/api/seed`

#### Issue 3: No password hash
```json
{
  "has_password_hash": false,
  "error": "Password hash missing"
}
```
**Solution**: User record has no password. This happens if user was created without password or migrated incorrectly. Seed new users or update password in database.

### Step 3: Create Fresh Test Users

If password hashing is incompatible, create fresh users:

**Via Browser:**
```
http://localhost:3000/api/seed
```

**Via curl:**
```bash
curl http://localhost:3000/api/seed
```

This creates:
- `admin@test.com` / `Admin123!` (Super Admin)
- `user@test.com` / `User123!` (User)

### Step 4: Check Password Hash Format

Old database passwords might use different bcrypt format. Check in debug output:

```json
{
  "user": {
    "password_hash_preview": "$2a$10$abcd1234..."  // Good: bcrypt format
  }
}
```

**Valid bcrypt formats:**
- `$2a$` - Original bcrypt
- `$2b$` - Modern bcrypt (what bcryptjs uses)
- `$2y$` - PHP bcrypt

All should work with bcryptjs library.

**Invalid formats:**
- `md5:...` - MD5 hash
- `sha256:...` - SHA256 hash
- Plain text password

If format is invalid, you need to re-hash passwords or create new users.

## Other Common Issues

### Database RLS (Row Level Security) Issues

If debug shows users exist but login still fails, check Supabase RLS:

1. Go to Supabase Dashboard
2. Check Table Editor → users table
3. Look for "RLS enabled" badge
4. If RLS is blocking queries, you may need to:
   - Disable RLS temporarily for development
   - Or configure proper policies

### Missing Roles

If user exists but has no role:
```json
{
  "role_error": "No rows returned"
}
```

**Solution**: Run seed to create roles, or manually assign in Supabase:

```sql
-- Find user ID
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Assign Super Admin role
INSERT INTO user_roles (user_id, role_id, assigned_by)
VALUES (
  'user-id-here',
  'role-super-admin',
  'user-id-here'
);
```

## Debug Endpoints Reference

All debug endpoints only work in development mode.

### GET /api/debug/db
Shows database connection and data overview.

### POST /api/debug/login
Tests login process with detailed step-by-step output.

**Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### GET /api/seed
Creates test users with known passwords.

## Need More Help?

1. Check server logs in terminal where you ran `pnpm dev`
2. Check browser console for tRPC errors
3. Try logging in with test users from `/api/seed`
4. If still stuck, share the JSON output from `/api/debug/login`
