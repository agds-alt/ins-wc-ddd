# ✅ Pre-RLS Migration Checklist

## 📋 Apakah Saya Perlu Daftar Ulang Akun?

### **JAWABAN: TIDAK! ❌**

**Anda TIDAK perlu:**
- ❌ Daftar ulang akun Super Admin
- ❌ Daftar ulang akun Admin
- ❌ Daftar ulang akun User lainnya
- ❌ Hapus dan buat ulang users
- ❌ Reset password

**Yang Anda PERLU:**
- ✅ Assign **roles** ke existing users
- ✅ Pastikan minimal 1 user punya role Super Admin
- ✅ Verify semua active users punya role assignments

---

## 🎯 Mengapa Tidak Perlu Daftar Ulang?

RLS migration **TIDAK mengubah:**
- ❌ Tabel `auth.users` (Supabase authentication)
- ❌ Tabel `users` (application user profiles)
- ❌ Email, password, atau user data lainnya

RLS migration **HANYA menambahkan:**
- ✅ Security policies (siapa boleh akses apa)
- ✅ Helper functions untuk authorization
- ✅ Indexes untuk performance

**User accounts tetap sama, hanya perlu role assignments!**

---

## 🔍 Step-by-Step Verification Process

### **STEP 1: Jalankan Verification Queries** 🔎

1. Buka Supabase Dashboard → SQL Editor
2. Buka file: `supabase/migrations/VERIFICATION_QUERIES.sql`
3. Copy SEMUA isi file
4. Paste ke SQL Editor
5. Run query

**Tunggu hasil dan analisis:**

---

### **Scenario A: ✅ SEMUA SUDAH OK**

**Output yang Anda lihat:**
```sql
-- STEP 5: FINAL CHECKLIST
has_roles_data: true
has_user_role_assignments: true
has_at_least_one_admin: true
all_active_users_have_roles: true
overall_status: ✅ READY to apply RLS migration
```

**Artinya:**
- ✅ Tabel `roles` sudah ada data (Super Admin, Admin, User roles)
- ✅ Semua user sudah punya role assignments
- ✅ Minimal 1 user sudah jadi admin
- ✅ **AMAN langsung apply RLS migration!**

**Next Action:**
```
🎉 Anda SIAP! Langsung ke step apply RLS migration
   Tidak perlu jalankan SEED_DATA_ROLES.sql
```

---

### **Scenario B: ❌ roles table KOSONG**

**Output yang Anda lihat:**
```sql
-- STEP 2.1
Roles count: 0
status: ❌ CRITICAL: No roles data - INSERT REQUIRED!
```

**Artinya:**
- ❌ Tabel `roles` ada tapi kosong (tidak ada data Super Admin, Admin, User)
- ❌ Semua user akan jadi "no role" setelah RLS enabled
- ❌ **BAHAYA: Anda akan terkunci dari admin functions!**

**Next Action:**
```
1. ❌ JANGAN apply RLS migration dulu!
2. ✅ Jalankan file: SEED_DATA_ROLES.sql (PART 1)
3. ✅ Verify lagi dengan VERIFICATION_QUERIES.sql
4. ✅ Kalau sudah OK, baru apply RLS migration
```

**Cara Fix:**
1. Buka `SEED_DATA_ROLES.sql`
2. Copy **PART 1 saja** (INSERT INTO roles...)
3. Paste ke SQL Editor
4. Run
5. Verify ada 5 roles: Super Admin (100), Admin (80), Manager (60), User (40), Viewer (20)

---

### **Scenario C: ❌ user_roles table KOSONG**

**Output yang Anda lihat:**
```sql
-- STEP 2.3
User role assignments count: 0
status: ❌ CRITICAL: No role assignments - ALL USERS WILL LOSE ACCESS!

-- STEP 2.5
(Shows all your users with warning: ⚠️ NO ROLE - WILL LOSE ACCESS!)
```

**Artinya:**
- ❌ Tabel `user_roles` kosong (tidak ada user yang di-assign role)
- ❌ Semua user termasuk Anda akan kehilangan admin access
- ❌ **BAHAYA TOTAL: LOCK OUT!**

**Next Action:**
```
1. ❌ JANGAN apply RLS migration!
2. ✅ Buka SEED_DATA_ROLES.sql
3. ✅ CUSTOMIZE PART 2 (pilih salah satu option)
4. ✅ Jalankan query
5. ✅ Verify lagi
```

**Cara Fix (Pilih salah satu):**

#### **Option 1: Assign Super Admin by Email (RECOMMENDED)** ⭐

Paling aman, Anda tahu persis siapa yang jadi admin.

```sql
-- Edit di SEED_DATA_ROLES.sql, PART 2, OPTION 1
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM users
  WHERE email = 'your-actual-email@example.com'  -- 🚨 GANTI INI!
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
    VALUES (admin_user_id, 'role-super-admin', NOW(), admin_user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    RAISE NOTICE '✅ Super Admin role assigned to user: %', admin_user_id;
  ELSE
    RAISE WARNING '⚠️ User with that email not found!';
  END IF;
END $$;
```

**Steps:**
1. Cari email Anda di tabel users:
   ```sql
   SELECT id, email, full_name FROM users;
   ```
2. Edit `your-actual-email@example.com` dengan email Anda
3. Run query
4. Verify: Anda sekarang Super Admin!

---

#### **Option 2: Multiple Admins by Email**

Jika ada beberapa orang yang perlu jadi admin.

```sql
-- Edit di SEED_DATA_ROLES.sql, PART 2, OPTION 2
DO $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'admin1@example.com',  -- 🚨 GANTI!
    'admin2@example.com',  -- 🚨 GANTI!
    'admin3@example.com'   -- 🚨 GANTI!
  ];
  -- ... (rest of code)
```

**Steps:**
1. List semua email yang perlu jadi admin
2. Edit array di query
3. Run query
4. Verify: Semua email tersebut jadi Admin

---

#### **Option 3: First User = Super Admin (Auto)**

Otomatis user pertama yang daftar jadi Super Admin, sisanya User biasa.

```sql
-- Uncomment OPTION 3 di SEED_DATA_ROLES.sql
-- No customization needed, just run!
```

**Hati-hati:** Kalau user pertama bukan Anda, mereka yang jadi Super Admin!

---

#### **Option 4: Everyone Gets User Role (Safest)**

Semua user jadi User biasa dulu, nanti upgrade manual.

```sql
-- OPTION 4 di SEED_DATA_ROLES.sql (already included)
-- Assigns 'role-user' to all users
```

Setelah apply, upgrade manual ke admin:
```sql
-- Find your user ID
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Upgrade to Super Admin
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES ('your-user-id', 'role-super-admin', NOW());
```

---

### **Scenario D: ⚠️ Ada Users Tanpa Role**

**Output yang Anda lihat:**
```sql
-- STEP 2.5
(Shows some users with: ⚠️ NO ROLE - WILL LOSE ACCESS!)
```

**Artinya:**
- ⚠️ Sebagian user sudah punya role, sebagian belum
- ⚠️ User tanpa role akan kehilangan akses

**Next Action:**
```
1. Assign role ke users yang belum punya
2. Atau jalankan OPTION 4 (auto-assign User role ke semua)
```

**Cara Fix:**
```sql
-- Auto-assign User role to all users without role
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT u.id, 'role-user', NOW()
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.is_active = true AND ur.id IS NULL
ON CONFLICT DO NOTHING;
```

---

## 📊 Quick Decision Matrix

| Kondisi | Tindakan | Perlu Daftar Ulang? |
|---------|----------|---------------------|
| ✅ Roles ada + Semua user punya role + Ada admin | Apply RLS langsung | ❌ TIDAK |
| ❌ Roles kosong | Jalankan SEED_DATA Part 1 | ❌ TIDAK |
| ❌ User_roles kosong | Jalankan SEED_DATA Part 2 | ❌ TIDAK |
| ⚠️ Sebagian user tanpa role | Assign role manual | ❌ TIDAK |
| ❌ Tidak ada admin (level >= 80) | Assign admin role | ❌ TIDAK |
| ✅ Sudah perfect semua | Apply RLS migration | ❌ TIDAK |

**KESIMPULAN: TIDAK PERNAH PERLU DAFTAR ULANG! ✅**

---

## 🚀 Recommended Workflow

### **Phase 1: Verification (5 menit)**

```bash
1. Buka Supabase Dashboard
2. SQL Editor → New Query
3. Copy-paste VERIFICATION_QUERIES.sql
4. Run dan analisis output
5. Catat hasil: Ada masalah atau tidak?
```

---

### **Phase 2: Fix Issues (10 menit)**

**Jika ada masalah:**
```bash
1. Buka SEED_DATA_ROLES.sql
2. Customize PART 2 (pilih option yang sesuai)
3. Run di SQL Editor
4. Verify output: "✅ Created/Updated"
```

**Jika tidak ada masalah:**
```bash
Skip phase ini, langsung ke Phase 3
```

---

### **Phase 3: Re-Verify (3 menit)**

```bash
1. Jalankan VERIFICATION_QUERIES.sql lagi
2. Pastikan hasil:
   ✅ has_roles_data: true
   ✅ has_user_role_assignments: true
   ✅ has_at_least_one_admin: true
   ✅ all_active_users_have_roles: true
   ✅ overall_status: READY to apply RLS
```

---

### **Phase 4: Apply RLS Migration (5 menit)**

```bash
1. Buka 20250128_database_indexes.sql
2. Copy-paste → SQL Editor → Run
3. Wait for "Success"
4. Buka 20250128_rls_policies.sql
5. Copy-paste → SQL Editor → Run
6. Wait for "Success"
```

---

### **Phase 5: Post-Migration Test (10 menit)**

**Test 1: Admin Access** ✅
```bash
1. Login dengan akun yang di-assign Super Admin
2. Pergi ke /admin/organizations
3. Expected: Bisa akses (tidak redirect)
4. Coba create organization baru
5. Expected: Berhasil
```

**Test 2: User Access** ✅
```bash
1. Login dengan akun User biasa (non-admin)
2. Pergi ke /admin/organizations
3. Expected: Redirect atau "Admin Access Required"
4. Pergi ke / (dashboard)
5. Expected: Bisa akses normal
```

**Test 3: Inspection Create** ✅
```bash
1. Login sebagai User
2. Scan QR code atau pilih lokasi
3. Create inspection
4. Expected: Berhasil
5. Check: Inspection muncul di dashboard
```

**Test 4: RLS Working** ✅
```bash
1. Login User A
2. Create inspection
3. Logout, login User B
4. Check dashboard User B
5. Expected: Tidak melihat inspection User A
   (Kecuali User B adalah admin)
```

---

## 🆘 Troubleshooting

### **Problem: "permission denied for table organizations"**

**Cause:** RLS enabled tapi user tidak punya admin role

**Solution:**
```sql
-- Option 1: Disable RLS temporarily
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Option 2: Assign admin role
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES (
  (SELECT id FROM users WHERE email = 'your-email@example.com'),
  'role-super-admin',
  NOW()
);

-- Option 3: Check if you have role
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

---

### **Problem: "function is_admin() does not exist"**

**Cause:** RLS policies migration belum dijalankan atau failed

**Solution:**
```sql
-- Manually create the function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.level >= 80
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
```

---

### **Problem: Semua user jadi admin / Tidak ada yang admin**

**Cause:** Role assignments salah

**Solution:**
```sql
-- Check current assignments
SELECT
  u.email,
  r.name,
  r.level
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id;

-- Fix: Delete wrong assignments
DELETE FROM user_roles WHERE role_id = 'wrong-role-id';

-- Fix: Assign correct roles
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES ('correct-user-id', 'role-super-admin', NOW());
```

---

## 📞 Support Checklist

Jika masih ada masalah, provide info ini:

```sql
-- 1. Check table structure
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('roles', 'user_roles', 'users');

-- 2. Check roles data
SELECT * FROM roles;

-- 3. Check user_roles data
SELECT
  ur.*,
  u.email,
  r.name as role_name
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id;

-- 4. Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('organizations', 'buildings', 'locations');

-- 5. Check current user
SELECT auth.uid(), auth.email();
```

---

## ✅ Final Checklist Before RLS

Before applying RLS migration, ensure:

- [ ] ✅ Table `roles` exists with data (5 roles minimum)
- [ ] ✅ Table `user_roles` exists with data
- [ ] ✅ At least ONE user has Super Admin role (level >= 100)
- [ ] ✅ All active users have role assignments
- [ ] ✅ You know which email is Super Admin
- [ ] ✅ You tested login with that Super Admin account
- [ ] ✅ You have backup of database (optional but recommended)
- [ ] ✅ You read this checklist completely 😊

**If all ✅, you are READY! 🚀**

---

## 🎉 Summary

### **DO:**
- ✅ Run verification queries first
- ✅ Assign roles to existing users
- ✅ Ensure at least one Super Admin exists
- ✅ Test login before and after RLS
- ✅ Keep existing user accounts

### **DON'T:**
- ❌ Re-register users
- ❌ Delete and recreate accounts
- ❌ Reset passwords
- ❌ Apply RLS before verifying roles
- ❌ Skip verification queries

**Key Takeaway:** RLS is about **permissions**, not **users**. Existing users stay, just need proper role assignments! 🎯
