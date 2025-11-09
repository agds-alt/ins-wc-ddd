/**
 * Fix Roles API Route
 * One-time script to clean up duplicate roles and migrate to correct names
 * Access via: GET http://localhost:3000/api/fix-roles
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/infrastructure/database/supabase';

export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Fix-roles endpoint disabled in production' },
        { status: 403 }
      );
    }

    const results: string[] = [];
    results.push('🔧 Fixing role names...\n');

    // Define correct roles
    const correctRoles = [
      { name: 'super_admin', level: 100 },
      { name: 'admin', level: 80 },
      { name: 'user', level: 40 },
    ];

    // Get all roles
    const { data: allRoles } = await supabaseAdmin
      .from('roles')
      .select('*')
      .order('level', { ascending: false });

    results.push(`Found ${allRoles?.length || 0} roles in database\n`);

    for (const correctRole of correctRoles) {
      // Find role with correct name
      const correctRoleInDb = allRoles?.find(
        (r) => r.name === correctRole.name && r.level === correctRole.level
      );

      // Find role with old name (wrong case/format)
      const oldRoleInDb = allRoles?.find(
        (r) => r.name !== correctRole.name && r.level === correctRole.level
      );

      if (correctRoleInDb && oldRoleInDb) {
        // We have both old and new - migrate users from old to new, then delete old
        results.push(
          `📋 Found duplicate roles for level ${correctRole.level}:`
        );
        results.push(`   - Old: "${oldRoleInDb.name}" (${oldRoleInDb.id})`);
        results.push(`   - New: "${correctRoleInDb.name}" (${correctRoleInDb.id})`);

        // Update all user_roles pointing to old role to point to new role
        const { data: userRolesToUpdate } = await supabaseAdmin
          .from('user_roles')
          .select('user_id, role_id')
          .eq('role_id', oldRoleInDb.id);

        if (userRolesToUpdate && userRolesToUpdate.length > 0) {
          results.push(
            `   🔄 Migrating ${userRolesToUpdate.length} user assignments...`
          );

          for (const userRole of userRolesToUpdate) {
            // Delete old assignment
            await supabaseAdmin
              .from('user_roles')
              .delete()
              .eq('user_id', userRole.user_id)
              .eq('role_id', oldRoleInDb.id);

            // Create new assignment (or update if exists)
            await supabaseAdmin
              .from('user_roles')
              .upsert(
                {
                  user_id: userRole.user_id,
                  role_id: correctRoleInDb.id,
                  created_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,role_id' }
              );
          }

          results.push(`   ✅ Migrated ${userRolesToUpdate.length} users`);
        }

        // Delete old role
        const { error: deleteError } = await supabaseAdmin
          .from('roles')
          .delete()
          .eq('id', oldRoleInDb.id);

        if (deleteError) {
          results.push(`   ❌ Error deleting old role: ${deleteError.message}`);
        } else {
          results.push(`   ✅ Deleted old role "${oldRoleInDb.name}"`);
        }
      } else if (oldRoleInDb && !correctRoleInDb) {
        // Only old role exists - rename it
        results.push(
          `🔄 Renaming "${oldRoleInDb.name}" -> "${correctRole.name}"`
        );

        const { error: updateError } = await supabaseAdmin
          .from('roles')
          .update({
            name: correctRole.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', oldRoleInDb.id);

        if (updateError) {
          results.push(`   ❌ Error: ${updateError.message}`);
        } else {
          results.push(`   ✅ Renamed successfully`);
        }
      } else if (correctRoleInDb) {
        results.push(`✅ Role "${correctRole.name}" is correct`);
      } else {
        results.push(
          `⚠️  No role found for level ${correctRole.level}, please run /api/seed`
        );
      }

      results.push(''); // Empty line
    }

    results.push('✅ Role cleanup complete!\n');
    results.push('Please re-login to refresh your session.');

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
