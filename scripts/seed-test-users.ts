/**
 * Seed Test Users for Development
 * Run with: pnpm seed
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTestUsers() {
  console.log('🌱 Seeding test users...\n');

  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'Admin123!',
      full_name: 'Test Admin',
      role: 'Super Admin',
      role_id: 'role-super-admin',
    },
    {
      email: 'user@test.com',
      password: 'User123!',
      full_name: 'Test User',
      role: 'User',
      role_id: 'role-user',
    },
  ];

  // First, ensure roles exist
  console.log('1️⃣ Creating roles...');
  const roles = [
    {
      id: 'role-super-admin',
      name: 'Super Admin',
      description: 'Full system access',
      level: 100,
      is_active: true,
    },
    {
      id: 'role-admin',
      name: 'Admin',
      description: 'Can manage organizations and locations',
      level: 80,
      is_active: true,
    },
    {
      id: 'role-user',
      name: 'User',
      description: 'Standard user can perform inspections',
      level: 40,
      is_active: true,
    },
  ];

  for (const role of roles) {
    const { error } = await supabase.from('roles').upsert(role, {
      onConflict: 'id',
    });

    if (error) {
      console.log(`   ⚠️  Role ${role.name}: ${error.message}`);
    } else {
      console.log(`   ✅ Role ${role.name} created/updated`);
    }
  }

  console.log('\n2️⃣ Creating test users...\n');

  for (const user of testUsers) {
    try {
      // Hash password
      const password_hash = await bcrypt.hash(user.password, 10);

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', user.email)
        .single();

      let userId: string;

      if (existingUser) {
        console.log(`   📝 User ${user.email} already exists, updating...`);

        // Update password
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            password_hash,
            full_name: user.full_name,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('email', user.email)
          .select()
          .single();

        if (updateError) {
          console.log(`   ❌ Error updating user: ${updateError.message}`);
          continue;
        }

        userId = updatedUser.id;
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            email: user.email,
            password_hash,
            full_name: user.full_name,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.log(`   ❌ Error creating user: ${insertError.message}`);
          continue;
        }

        userId = newUser.id;
        console.log(`   ✅ User ${user.email} created`);
      }

      // Assign role
      const { error: roleError } = await supabase.from('user_roles').upsert(
        {
          user_id: userId,
          role_id: user.role_id,
          assigned_by: userId,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,role_id',
        }
      );

      if (roleError) {
        console.log(`   ⚠️  Error assigning role: ${roleError.message}`);
      } else {
        console.log(`   ✅ Role ${user.role} assigned to ${user.email}`);
      }

      console.log(`   🔑 Login credentials:`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Password: ${user.password}\n`);
    } catch (error) {
      console.error(`   ❌ Error seeding user ${user.email}:`, error);
    }
  }

  console.log('\n✅ Seeding complete!\n');
  console.log('📝 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@test.com');
  console.log('  Password: Admin123!');
  console.log('\nUser:');
  console.log('  Email: user@test.com');
  console.log('  Password: User123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seedTestUsers()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
