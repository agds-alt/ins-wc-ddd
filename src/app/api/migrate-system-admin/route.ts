/**
 * Migrate System Admin to Super Admin
 * Moves users from system_admin role to super_admin role
 * Access via: POST http://localhost:3000/api/migrate-system-admin
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/infrastructure/database/supabase';

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Migration endpoint disabled in production' },
        { status: 403 }
      );
    }

    const results: string[] = [];
    results.push('🔄 Migrating users from system_admin to super_admin...\n');

    // Find system_admin role
    const { data: systemAdminRole } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('name', 'system_admin')
      .eq('level', 100)
      .single();

    if (!systemAdminRole) {
      results.push('✅ No system_admin role found - migration not needed');
      return NextResponse.json({
        success: true,
        message: results.join('\n'),
      });
    }

    // Find super_admin role
    const { data: superAdminRole } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('name', 'super_admin')
      .eq('level', 100)
      .single();

    if (!superAdminRole) {
      results.push('❌ super_admin role not found - please run cleanup-roles first');
      return NextResponse.json(
        {
          success: false,
          message: results.join('\n'),
        },
        { status: 400 }
      );
    }

    results.push(`Found roles:`);
    results.push(`  - system_admin: ${systemAdminRole.id}`);
    results.push(`  - super_admin: ${superAdminRole.id}\n`);

    // Get all users with system_admin role
    const { data: usersToMigrate } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, users (email)')
      .eq('role_id', systemAdminRole.id);

    if (!usersToMigrate || usersToMigrate.length === 0) {
      results.push('✅ No users to migrate');
    } else {
      results.push(`Migrating ${usersToMigrate.length} users:\n`);

      for (const userRole of usersToMigrate) {
        const userEmail = (userRole as any).users?.email || 'unknown';

        // Delete old role assignment
        const { error: deleteError } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userRole.user_id)
          .eq('role_id', systemAdminRole.id);

        if (deleteError) {
          results.push(`  ❌ Failed to remove system_admin from ${userEmail}: ${deleteError.message}`);
          continue;
        }

        // Add new role assignment
        const { error: insertError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userRole.user_id,
            role_id: superAdminRole.id,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          results.push(`  ❌ Failed to assign super_admin to ${userEmail}: ${insertError.message}`);
        } else {
          results.push(`  ✅ Migrated ${userEmail} to super_admin`);
        }
      }

      results.push('');
    }

    // Delete system_admin role
    const { error: deleteRoleError } = await supabaseAdmin
      .from('roles')
      .delete()
      .eq('id', systemAdminRole.id);

    if (deleteRoleError) {
      results.push(`❌ Failed to delete system_admin role: ${deleteRoleError.message}`);
    } else {
      results.push(`✅ Deleted system_admin role`);
    }

    results.push('\n✅ Migration complete!');
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
