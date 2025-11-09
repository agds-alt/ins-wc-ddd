/**
 * Database Debug Endpoint
 * Access via: GET http://localhost:3000/api/debug/db
 * Checks database connection and shows user data
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/infrastructure/database/supabase';

export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Debug endpoint disabled in production' },
        { status: 403 }
      );
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      database: 'connected',
      checks: {},
    };

    // 1. Check users table
    try {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, is_active, password_hash, created_at')
        .limit(5);

      if (usersError) {
        results.checks.users = {
          status: 'error',
          error: usersError.message,
        };
      } else {
        results.checks.users = {
          status: 'ok',
          count: users?.length || 0,
          sample: users?.map((u) => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            is_active: u.is_active,
            has_password_hash: !!u.password_hash,
            password_hash_preview: u.password_hash
              ? `${u.password_hash.substring(0, 10)}...`
              : null,
            created_at: u.created_at,
          })),
        };
      }
    } catch (error) {
      results.checks.users = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 2. Check roles table
    try {
      const { data: roles, error: rolesError } = await supabaseAdmin
        .from('roles')
        .select('id, name, level, is_active')
        .limit(10);

      if (rolesError) {
        results.checks.roles = {
          status: 'error',
          error: rolesError.message,
        };
      } else {
        results.checks.roles = {
          status: 'ok',
          count: roles?.length || 0,
          data: roles,
        };
      }
    } catch (error) {
      results.checks.roles = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 3. Check user_roles join
    try {
      const { data: userRoles, error: userRolesError } = await supabaseAdmin
        .from('user_roles')
        .select(
          `
          user_id,
          role_id,
          users!inner (
            email,
            full_name
          ),
          roles!inner (
            name,
            level
          )
        `
        )
        .limit(5);

      if (userRolesError) {
        results.checks.user_roles = {
          status: 'error',
          error: userRolesError.message,
        };
      } else {
        results.checks.user_roles = {
          status: 'ok',
          count: userRoles?.length || 0,
          sample: userRoles,
        };
      }
    } catch (error) {
      results.checks.user_roles = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 4. Check locations table
    try {
      const { data: locations, error: locationsError } = await supabaseAdmin
        .from('locations')
        .select('id, name, code, qr_code')
        .limit(3);

      if (locationsError) {
        results.checks.locations = {
          status: 'error',
          error: locationsError.message,
        };
      } else {
        results.checks.locations = {
          status: 'ok',
          count: locations?.length || 0,
          sample: locations,
        };
      }
    } catch (error) {
      results.checks.locations = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return NextResponse.json(results, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
