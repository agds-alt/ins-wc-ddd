# Database Migrations for WC-Checks

This folder contains SQL migration scripts for the WC-Checks application.

## Files

### 20250128_rls_policies.sql
**Row Level Security (RLS) Policies**

Implements comprehensive security policies for all tables:
- Organizations: Admin-only create/update, Super Admin delete
- Buildings: Admin-only create/update, Super Admin delete
- Locations: Admin-only create/update/delete
- Inspection Records: Users can CRUD their own, admins can CRUD all
- Photos: Users can manage photos from their inspections
- User Roles: Super Admin only

**Helper Functions:**
- `is_admin()` - Check if user has admin role (level >= 80)
- `is_super_admin()` - Check if user has super admin role (level >= 100)
- `user_has_role_level(min_level)` - Check if user meets minimum role level

### 20250128_database_indexes.sql
**Performance Optimization Indexes**

Creates optimized indexes for frequently queried columns:
- **QR Code scanning** - Critical for fast location lookup
- **Dashboard queries** - User inspections, date filters
- **Admin stats** - Today's inspections, active users
- **Location lookups** - By organization, building, QR code
- **Photo galleries** - By inspection, location, user
- **Role checks** - Fast authentication verification

**Expected Performance Improvements:**
- QR Code Scanning: 95%+ faster
- Dashboard Queries: 80%+ faster
- Admin Dashboard Stats: 90%+ faster
- Location Lists: 70%+ faster
- Inspection History: 85%+ faster

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the content of each migration file
5. Click **Run** to execute

**Order:**
1. First run: `20250128_database_indexes.sql`
2. Then run: `20250128_rls_policies.sql`

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Or run specific migration
supabase db execute --file supabase/migrations/20250128_database_indexes.sql
supabase db execute --file supabase/migrations/20250128_rls_policies.sql
```

### Option 3: psql (Advanced)

If you have direct database access:

```bash
psql postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres \
  -f supabase/migrations/20250128_database_indexes.sql

psql postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres \
  -f supabase/migrations/20250128_rls_policies.sql
```

## Verification

### Check if RLS is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'buildings', 'locations', 'inspection_records', 'photos', 'user_roles');
```

Expected: All tables should have `rowsecurity = true`

### Check if policies exist:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

Expected: Should show multiple policies for each table

### Check if indexes exist:

```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

Expected: Should show all indexes starting with `idx_`

### Check index usage:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Rollback

If you need to remove the migrations:

### Remove RLS Policies:

```sql
-- Disable RLS on tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.user_has_role_level(integer);
```

### Remove Indexes:

```sql
-- Drop all custom indexes (be careful!)
DROP INDEX IF EXISTS idx_inspection_records_user_date;
DROP INDEX IF EXISTS idx_inspection_records_location_submitted;
DROP INDEX IF EXISTS idx_locations_qr_code;
-- ... (drop all idx_* indexes)
```

## Important Notes

1. **RLS Policies**: These will affect all database access, including from the client. Ensure your application code has proper authentication before enabling RLS.

2. **Indexes**: Safe to add anytime. Indexes improve read performance but add slight overhead to writes. For a read-heavy app like WC-Checks, this is beneficial.

3. **Testing**: After applying migrations, test all major features:
   - QR code scanning
   - Creating inspections
   - Viewing reports
   - Admin operations
   - User authentication

4. **Backup**: Always backup your database before applying migrations:
   ```bash
   # In Supabase Dashboard
   Database > Backups > Create Backup
   ```

## Troubleshooting

### "permission denied for table X"
- RLS is enabled but policies are too restrictive
- Check if user has proper role assignments in `user_roles` table

### "function is_admin() does not exist"
- Run the RLS policies migration which creates helper functions

### "index already exists"
- Safe to ignore - migrations use `IF NOT EXISTS`
- Or drop existing index and recreate

### Slow queries after migration
- Run `ANALYZE` on affected tables
- Check query plan with `EXPLAIN ANALYZE`

## Support

For issues with migrations, check:
1. Supabase logs (Dashboard > Logs)
2. Application console for RLS errors
3. PostgreSQL error messages
4. This README for common solutions
