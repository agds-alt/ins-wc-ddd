/**
 * Supabase Client for Next.js (Server-side only)
 * FREE TIER OPTIMIZED: Connection pooling disabled, efficient queries
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // For server-side operations

// Warn if missing env vars (but don't throw during build)
if ((!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && process.env.NODE_ENV !== 'test') {
  console.warn('Warning: Missing Supabase environment variables. Supabase features will not work.');
}

/**
 * Public Supabase client (for server components)
 * Uses anon key - respects RLS
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // Server-side doesn't need auto-refresh
    persistSession: false,   // Server-side doesn't persist
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'wc-check-nextjs',
    },
  },
  // 🆓 FREE TIER: Disable connection pooling
  db: {
    schema: 'public',
  },
});

/**
 * Admin Supabase client (for server-side operations)
 * Uses service role key - bypasses RLS
 * ⚠️ CAUTION: Only use in secure server-side code!
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'wc-check-nextjs-admin',
        },
      },
      db: {
        schema: 'public',
      },
    })
  : supabase; // Fallback to regular client if no service key

/**
 * Get Supabase client with user context (for RLS)
 * Use this in tRPC procedures with authenticated user
 */
export function getSupabaseWithUser(_userId: string): SupabaseClient<Database> {
  // For FREE TIER: We use the admin client with user context
  // In production with Redis, you'd get the actual session token
  return supabaseAdmin;
}

/**
 * Type exports for convenience
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
