/**
 * Login Debug Endpoint
 * Access via: POST http://localhost:3000/api/debug/login
 * Body: { "email": "test@example.com", "password": "password123" }
 *
 * Shows detailed login process debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/infrastructure/database/supabase';
import { comparePassword } from '@/infrastructure/auth/password';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Debug endpoint disabled in production' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const debug: any = {
      timestamp: new Date().toISOString(),
      email,
      steps: [],
    };

    // Step 1: Find user by email
    debug.steps.push('1. Finding user by email...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, password_hash, is_active')
      .eq('email', email)
      .single();

    if (userError || !user) {
      debug.steps.push('❌ User not found');
      debug.error = userError?.message || 'User not found';
      return NextResponse.json(debug, { status: 404 });
    }

    debug.steps.push('✅ User found');
    debug.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
      has_password_hash: !!user.password_hash,
      password_hash_length: user.password_hash?.length || 0,
      password_hash_preview: user.password_hash
        ? `${user.password_hash.substring(0, 20)}...`
        : null,
    };

    // Step 2: Check if active
    if (!user.is_active) {
      debug.steps.push('❌ User is inactive');
      debug.error = 'Account is inactive';
      return NextResponse.json(debug, { status: 403 });
    }

    debug.steps.push('✅ User is active');

    // Step 3: Check password hash exists
    if (!user.password_hash) {
      debug.steps.push('❌ No password hash in database');
      debug.error = 'Password hash missing';
      return NextResponse.json(debug, { status: 500 });
    }

    debug.steps.push('✅ Password hash exists');

    // Step 4: Compare password
    debug.steps.push('4. Comparing password...');
    try {
      const isValid = await comparePassword(password, user.password_hash);
      debug.password_match = isValid;

      if (!isValid) {
        debug.steps.push('❌ Password does not match');
        debug.error = 'Invalid password';
        debug.hints = [
          'Password in database might be hashed with different algorithm',
          'Check if old Vite app used same bcryptjs',
          'Try creating new user via /api/seed',
        ];
        return NextResponse.json(debug, { status: 401 });
      }

      debug.steps.push('✅ Password matches!');
    } catch (error) {
      debug.steps.push('❌ Error comparing password');
      debug.error = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(debug, { status: 500 });
    }

    // Step 5: Get user role
    debug.steps.push('5. Getting user role...');
    const { data: userWithRole, error: roleError } = await supabaseAdmin
      .from('users')
      .select(
        `
        *,
        user_roles!inner (
          role_id,
          roles!inner (
            name,
            level
          )
        )
      `
      )
      .eq('id', user.id)
      .single();

    if (roleError) {
      debug.steps.push('⚠️  Error getting role (but login would succeed)');
      debug.role_error = roleError.message;
    } else {
      debug.steps.push('✅ User role found');
      const userRole = (userWithRole as any).user_roles;
      const role = userRole?.[0]?.roles;
      debug.role = {
        name: role?.name,
        level: role?.level,
      };
    }

    debug.steps.push('\n🎉 LOGIN WOULD SUCCEED!');
    debug.success = true;

    return NextResponse.json(debug, { status: 200 });
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
