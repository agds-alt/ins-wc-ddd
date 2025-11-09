/**
 * Assign Super Admin Role to User
 * POST with email to assign super_admin role
 * Access via: POST http://localhost:3000/api/assign-superadmin
 * Body: { "email": "your-email@example.com" }
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/infrastructure/database/supabase';

export async function POST(request: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is disabled in production' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const results: string[] = [];
    results.push(`🔧 Assigning super_admin role to ${email}...\n`);

    // Find user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
    }

    results.push(`Found user: ${user.full_name} (${user.email})`);

    // Find super_admin role
    const { data: superAdminRole, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name, level')
      .eq('name', 'super_admin')
      .eq('level', 100)
      .single();

    if (roleError || !superAdminRole) {
      results.push('❌ super_admin role not found in database');
      results.push('Please run /api/seed first to create roles');

      return NextResponse.json({
        success: false,
        message: results.join('\n'),
      }, { status: 400 });
    }

    results.push(`Found super_admin role: ${superAdminRole.id}\n`);

    // Check current roles
    const { data: currentRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles(name, level)')
      .eq('user_id', user.id);

    if (currentRoles && currentRoles.length > 0) {
      results.push('Current roles:');
      currentRoles.forEach((ur: any) => {
        results.push(`  - ${ur.roles.name} (level ${ur.roles.level})`);
      });
      results.push('');
    }

    // Remove all existing roles
    const { error: deleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      results.push(`⚠️  Warning: Could not remove old roles: ${deleteError.message}`);
    } else {
      results.push('✅ Removed all old roles');
    }

    // Assign super_admin role
    const { error: assignError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: user.id,
        role_id: superAdminRole.id,
        created_at: new Date().toISOString(),
      });

    if (assignError) {
      results.push(`❌ Failed to assign super_admin role: ${assignError.message}`);

      return NextResponse.json({
        success: false,
        message: results.join('\n'),
      }, { status: 500 });
    }

    results.push('✅ Assigned super_admin role successfully!\n');
    results.push('⚠️  IMPORTANT: Logout and login again to refresh your session!');

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
