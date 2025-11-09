/**
 * Seed API Route
 * Access via: GET http://localhost:3000/api/seed
 * This creates test users for development
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/infrastructure/database/supabase';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Seed endpoint disabled in production' },
        { status: 403 }
      );
    }

    const results: string[] = [];

    // 1. Create roles
    results.push('🌱 Creating roles...');

    const roles = [
      {
        id: 'role-super-admin',
        name: 'Super Admin',
        description: 'Full system access',
        level: 100,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'role-admin',
        name: 'Admin',
        description: 'Can manage organizations and locations',
        level: 80,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'role-user',
        name: 'User',
        description: 'Standard user can perform inspections',
        level: 40,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    for (const role of roles) {
      const { error } = await supabaseAdmin.from('roles').upsert(role, {
        onConflict: 'id',
      });

      if (error) {
        results.push(`   ⚠️  Role ${role.name}: ${error.message}`);
      } else {
        results.push(`   ✅ Role ${role.name} created/updated`);
      }
    }

    // 2. Create test users
    results.push('\n📝 Creating test users...');

    const testUsers = [
      {
        email: 'admin@test.com',
        password: 'Admin123!',
        full_name: 'Test Admin',
        role_id: 'role-super-admin',
      },
      {
        email: 'user@test.com',
        password: 'User123!',
        full_name: 'Test User',
        role_id: 'role-user',
      },
    ];

    for (const user of testUsers) {
      try {
        // Hash password
        const password_hash = await bcrypt.hash(user.password, 10);

        // Check if user exists
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, email')
          .eq('email', user.email)
          .single();

        let userId: string;

        if (existingUser) {
          results.push(`   📝 User ${user.email} exists, updating...`);

          // Update password
          const { data: updatedUser, error: updateError } = await supabaseAdmin
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
            results.push(`   ❌ Error updating: ${updateError.message}`);
            continue;
          }

          userId = updatedUser.id;
        } else {
          // Create new user
          const { data: newUser, error: insertError } = await supabaseAdmin
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
            results.push(`   ❌ Error creating: ${insertError.message}`);
            continue;
          }

          userId = newUser.id;
          results.push(`   ✅ User ${user.email} created`);
        }

        // Assign role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert(
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
          results.push(`   ⚠️  Error assigning role: ${roleError.message}`);
        } else {
          results.push(`   ✅ Role assigned to ${user.email}`);
        }
      } catch (error) {
        results.push(
          `   ❌ Error with ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    results.push('\n✅ Seeding complete!');
    results.push('\n📋 Test Credentials:');
    results.push('━━━━━━━━━━━━━━━━━━━━━━━━━');
    results.push('Admin:');
    results.push('  Email: admin@test.com');
    results.push('  Password: Admin123!');
    results.push('\nUser:');
    results.push('  Email: user@test.com');
    results.push('  Password: User123!');
    results.push('━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      success: true,
      message: results.join('\n'),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
