/**
 * Cleanup Roles API Route
 * Fixes role structure to match application expectations
 * Access via: POST http://localhost:3000/api/cleanup-roles
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/infrastructure/database/supabase';

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Cleanup-roles endpoint disabled in production' },
        { status: 403 }
      );
    }

    const results: string[] = [];
    results.push('🔧 Cleaning up roles to match application structure...\n');

    // Step 1: Fix super_admin role
    results.push('Step 1: Fixing super_admin role');

    const { data: systemAdmin } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('name', 'system_admin')
      .eq('level', 100)
      .single();

    const { data: wrongSuperAdmin } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('name', 'super_admin')
      .eq('level', 90)
      .single();

    const { data: correctSuperAdmin } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('name', 'super_admin')
      .eq('level', 100)
      .single();

    if (systemAdmin && !correctSuperAdmin) {
      // Rename system_admin -> super_admin
      const { error } = await supabaseAdmin
        .from('roles')
        .update({
          name: 'super_admin',
          description: 'Full system access',
          updated_at: new Date().toISOString(),
        })
        .eq('id', systemAdmin.id);

      if (error) {
        results.push(`   ❌ Error renaming system_admin: ${error.message}`);
      } else {
        results.push(`   ✅ Renamed system_admin -> super_admin (level 100)`);
      }
    } else if (systemAdmin && correctSuperAdmin) {
      // Both exist, migrate users from system_admin to super_admin
      const { data: usersToMigrate } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role_id', systemAdmin.id);

      if (usersToMigrate && usersToMigrate.length > 0) {
        results.push(`   🔄 Migrating ${usersToMigrate.length} users from system_admin to super_admin`);

        for (const ur of usersToMigrate) {
          await supabaseAdmin
            .from('user_roles')
            .delete()
            .eq('user_id', ur.user_id)
            .eq('role_id', systemAdmin.id);

          await supabaseAdmin
            .from('user_roles')
            .upsert(
              {
                user_id: ur.user_id,
                role_id: correctSuperAdmin.id,
                created_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,role_id' }
            );
        }

        results.push(`   ✅ Migrated ${usersToMigrate.length} users`);
      }

      // Delete system_admin
      await supabaseAdmin
        .from('roles')
        .delete()
        .eq('id', systemAdmin.id);

      results.push(`   ✅ Deleted system_admin role`);
    } else if (correctSuperAdmin) {
      results.push(`   ✅ super_admin role already correct`);
    }

    // Step 2: Delete wrong super_admin at level 90
    if (wrongSuperAdmin) {
      results.push('\nStep 2: Removing incorrect super_admin at level 90');

      // Check if any users assigned
      const { data: usersWithWrongRole } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role_id', wrongSuperAdmin.id);

      if (usersWithWrongRole && usersWithWrongRole.length > 0) {
        // Get correct super_admin role
        const { data: correctRole } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', 'super_admin')
          .eq('level', 100)
          .single();

        if (correctRole) {
          results.push(`   🔄 Migrating ${usersWithWrongRole.length} users to correct super_admin`);

          for (const ur of usersWithWrongRole) {
            await supabaseAdmin
              .from('user_roles')
              .delete()
              .eq('user_id', ur.user_id)
              .eq('role_id', wrongSuperAdmin.id);

            await supabaseAdmin
              .from('user_roles')
              .upsert(
                {
                  user_id: ur.user_id,
                  role_id: correctRole.id,
                  created_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,role_id' }
              );
          }

          results.push(`   ✅ Migrated ${usersWithWrongRole.length} users`);
        }
      }

      // Delete the wrong super_admin role
      const { error: deleteError } = await supabaseAdmin
        .from('roles')
        .delete()
        .eq('id', wrongSuperAdmin.id);

      if (deleteError) {
        results.push(`   ❌ Error deleting wrong super_admin: ${deleteError.message}`);
      } else {
        results.push(`   ✅ Deleted incorrect super_admin (level 90)`);
      }
    }

    // Step 3: Verify required roles exist
    results.push('\nStep 3: Verifying required roles');

    const requiredRoles = [
      { name: 'super_admin', level: 100, description: 'Full system access' },
      { name: 'admin', level: 80, description: 'Can manage organizations and locations' },
      { name: 'user', level: 40, description: 'Standard user can perform inspections' },
    ];

    for (const role of requiredRoles) {
      const { data: existing } = await supabaseAdmin
        .from('roles')
        .select('*')
        .eq('name', role.name)
        .eq('level', role.level)
        .single();

      if (!existing) {
        const { error } = await supabaseAdmin
          .from('roles')
          .insert({
            name: role.name,
            level: role.level,
            description: role.description,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          results.push(`   ❌ Error creating ${role.name}: ${error.message}`);
        } else {
          results.push(`   ✅ Created ${role.name} role`);
        }
      } else {
        const { count } = await supabaseAdmin
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', existing.id);

        results.push(`   ✅ ${role.name} exists (${count || 0} users)`);
      }
    }

    results.push('\n✅ Cleanup complete!');
    results.push('\n⚠️  IMPORTANT: Logout and login again to refresh your session!');

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
