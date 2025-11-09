/**
 * Database Schema Check Endpoint
 * Access via: GET http://localhost:3000/api/debug/schema
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
      schema: {},
    };

    // Check roles table structure
    const { data: rolesSchema, error: rolesSchemaError } = await supabaseAdmin
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'roles'
          ORDER BY ordinal_position
        `,
      })
      .single();

    if (!rolesSchemaError && rolesSchema) {
      results.schema.roles = rolesSchema;
    } else {
      // Fallback: try to get schema from a sample query
      const { data: rolesData, error: rolesError } = await supabaseAdmin
        .from('roles')
        .select('*')
        .limit(1);

      if (!rolesError && rolesData && rolesData.length > 0) {
        const sample = rolesData[0];
        results.schema.roles = {
          note: 'Inferred from sample data',
          sample_data: sample,
          columns: Object.keys(sample).map((key) => ({
            column_name: key,
            sample_value: sample[key],
            type: typeof sample[key],
          })),
        };
      } else {
        results.schema.roles = {
          error: 'Could not determine schema',
          tables_exist: false,
        };
      }
    }

    // Check user_roles table structure
    const { data: userRolesData, error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .limit(1);

    if (!userRolesError && userRolesData && userRolesData.length > 0) {
      const sample = userRolesData[0];
      results.schema.user_roles = {
        note: 'Inferred from sample data',
        sample_data: sample,
        columns: Object.keys(sample).map((key) => ({
          column_name: key,
          sample_value: sample[key],
          type: typeof sample[key],
        })),
      };
    } else {
      results.schema.user_roles = {
        note: 'No data in table yet',
        tables_exist: true,
      };
    }

    // Check users table structure
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (!usersError && usersData && usersData.length > 0) {
      const sample = usersData[0];
      results.schema.users = {
        note: 'Inferred from sample data',
        sample_data: {
          id: sample.id,
          email: sample.email,
          has_password_hash: !!sample.password_hash,
        },
        columns: Object.keys(sample).map((key) => ({
          column_name: key,
          sample_value: key === 'password_hash' ? '[REDACTED]' : sample[key],
          type: typeof sample[key],
        })),
      };
    } else {
      results.schema.users = {
        note: 'No data in table yet',
        tables_exist: true,
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
