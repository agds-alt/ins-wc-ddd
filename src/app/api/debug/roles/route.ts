/**
 * Debug Roles API Route
 * Shows all roles in database
 * Access via: GET http://localhost:3000/api/debug/roles
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/infrastructure/database/supabase';

export async function GET() {
  try {
    // Get all roles
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .order('level', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get user_roles count for each role
    const rolesWithCounts = await Promise.all(
      (roles || []).map(async (role) => {
        const { count } = await supabaseAdmin
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', role.id);

        return {
          ...role,
          user_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      total: roles?.length || 0,
      roles: rolesWithCounts,
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
