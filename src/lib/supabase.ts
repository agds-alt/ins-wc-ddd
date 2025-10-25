// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Configuration constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const CONNECTION_TIMEOUT = 10000; // 10 seconds

// Custom error types for better error handling
export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigError';
  }
}

export class SupabaseConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConnectionError';
  }
}

// Validate environment variables
const validateEnvironment = (): void => {
  const missingVars: string[] = [];
  
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
  
  if (missingVars.length > 0) {
    throw new SupabaseConfigError(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new SupabaseConfigError('Invalid VITE_SUPABASE_URL format');
  }

  console.log('🔐 Supabase Configuration:');
  console.log('   URL:', supabaseUrl ? `${supabaseUrl.substring(0, 25)}...` : 'Not set');
  console.log('   Key exists:', !!supabaseKey);
  console.log('   Key length:', supabaseKey?.length || 0);
};

// Retry mechanism with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) break;
      
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Create Supabase client with enhanced configuration
export const createSupabaseClient = () => {
  try {
    validateEnvironment();
    
    return createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: localStorage,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'wc-check-app',
          'X-Client-Version': '1.0.0',
        },
      },
      db: {
        schema: 'public',
      },
    });
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    throw error;
  }
};

// Create the main client instance
export const supabase = createSupabaseClient();

// Type-safe database operations using your generated types
export type User = Database['public']['Tables']['users']['Row'];
export type SafeUser = Omit<User, 'password_hash'>;
export type Building = Database['public']['Tables']['buildings']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type InspectionRecord = Database['public']['Tables']['inspection_records']['Row'];
export type InspectionTemplate = Database['public']['Tables']['inspection_templates']['Row'];

// Connection health check with retry logic
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const { data, error } = await retryWithBackoff(async () => {
      const result = await supabase.auth.getSession();
      
      if (result.error?.message?.includes('fetch') || result.error?.message?.includes('network')) {
        throw new SupabaseConnectionError(`Network error: ${result.error.message}`);
      }
      
      return result;
    });

    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connected successfully!');
    console.log('   Session status:', data.session ? 'Authenticated' : 'Not authenticated');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed after retries:', error);
    return false;
  }
};

// Enhanced health check with database schema validation
export const getConnectionStatus = async (): Promise<{
  connected: boolean;
  responseTime: string;
  auth: { status: string; error?: string };
  database: { status: string; error?: string };
  timestamp: string;
}> => {
  try {
    const startTime = performance.now();
    
    // Test basic connectivity
    const { error: authError } = await supabase.auth.getSession();
    
    // Test database connectivity with a simple query from your schema
    const { error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();

    const responseTime = Math.round(performance.now() - startTime);

    return {
      connected: !authError && !dbError,
      responseTime: `${responseTime}ms`,
      auth: authError ? { status: 'error', error: authError.message } : { status: 'ok' },
      database: dbError ? { status: 'error', error: dbError.message } : { status: 'ok' },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      connected: false,
      responseTime: '0ms',
      auth: { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      database: { status: 'error', error: 'Health check failed' },
      timestamp: new Date().toISOString(),
    };
  }
};

// Type-safe query helpers
export const db = {
  // Users
  users: {
    getSafe: (userId: string) => 
      supabase
        .from('users')
        .select('id, email, full_name, phone, profile_photo_url, occupation_id, is_active, last_login_at, created_at, updated_at')
        .eq('id', userId)
        .single(),
    
    updateLastLogin: (userId: string) =>
      supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId),
  },

  // Buildings
  buildings: {
    list: (organizationId: string) =>
      supabase
        .from('buildings')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name'),
    
    get: (buildingId: string) =>
      supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single(),
  },

  // Locations
  locations: {
    list: (organizationId: string) =>
      supabase
        .from('locations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name'),
    
    getWithDetails: (locationId: string) =>
      supabase
        .from('locations_with_details')
        .select('*')
        .eq('id', locationId)
        .single(),
    
    getByQRCode: (qrCode: string) =>
      supabase
        .from('locations')
        .select('*')
        .eq('qr_code', qrCode)
        .single(),
  },

  // Inspection Records
  inspectionRecords: {
    create: (record: Database['public']['Tables']['inspection_records']['Insert']) =>
      supabase
        .from('inspection_records')
        .insert(record)
        .select()
        .single(),
    
    listByUser: (userId: string, limit = 50) =>
      supabase
        .from('inspection_records')
        .select('*')
        .eq('user_id', userId)
        .order('inspection_date', { ascending: false })
        .limit(limit),
    
    listByLocation: (locationId: string) =>
      supabase
        .from('inspection_records')
        .select('*')
        .eq('location_id', locationId)
        .order('inspection_date', { ascending: false }),
  },

  // Inspection Templates
  inspectionTemplates: {
    listActive: () =>
      supabase
        .from('inspection_templates')
        .select('*')
        .eq('is_active', true)
        .order('name'),
    
    getDefault: () =>
      supabase
        .from('inspection_templates')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single(),
  },

  // Photos
  photos: {
    create: (photo: Database['public']['Tables']['photos']['Insert']) =>
      supabase
        .from('photos')
        .insert(photo)
        .select()
        .single(),
    
    listByInspection: (inspectionId: string) =>
      supabase
        .from('photos')
        .select('*')
        .eq('inspection_id', inspectionId)
        .eq('is_deleted', false),
  },
};

// Database function wrappers


// Error handler for common Supabase errors
export const handleSupabaseError = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  const message = error.message || error.toString();
  
  // Common error patterns from your schema
  if (message.includes('JWT')) return 'Authentication error. Please log in again.';
  if (message.includes('network') || message.includes('fetch')) return 'Network error. Please check your connection.';
  if (message.includes('timeout')) return 'Request timeout. Please try again.';
  if (message.includes('PGRST')) return 'Database error. Please try again later.';
  if (message.includes('foreign key')) return 'Reference error. The related record does not exist.';
  if (message.includes('unique constraint')) return 'A record with these details already exists.';
  
  return message;
};

// Initialize connection test on import (but don't block execution)
let connectionTestCompleted = false;
let connectionTestSuccessful = false;

testConnection().then(success => {
  connectionTestCompleted = true;
  connectionTestSuccessful = success;
  if (success) {
    console.log('🚀 Supabase client initialized and ready');
  } else {
    console.error('💥 Supabase client initialization failed');
  }
});

// Export a promise that resolves when connection test is complete
export const connectionReady = new Promise<boolean>((resolve) => {
  const checkReady = () => {
    if (connectionTestCompleted) {
      resolve(connectionTestSuccessful);
    } else {
      setTimeout(checkReady, 100);
    }
  };
  checkReady();
});

// Utility function to check if we're likely offline
export const isLikelyOffline = (): boolean => {
  return !navigator.onLine;
};

// Export connection constants
export { MAX_RETRIES, RETRY_DELAY, CONNECTION_TIMEOUT };

export default supabase;