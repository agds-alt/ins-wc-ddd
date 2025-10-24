// src/lib/supabase.ts - Test connection
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔐 Supabase Config Test:');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);
console.log('Key length:', supabaseKey?.length);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Test connection immediately
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
  } else {
    console.log('✅ Supabase connected successfully!');
  }
});