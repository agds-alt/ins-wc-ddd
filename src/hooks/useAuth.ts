// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authStorage } from '../lib/authStorage';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ ADD TIMEOUT to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('⚠️ Auth check timeout - clearing loading state');
      setLoading(false);
    }, 5000); // 5 seconds

    // ✅ CHECK if storage is valid before fetching
    if (!authStorage.isValid() && authStorage.hasStoredToken()) {
      console.warn('⚠️ Invalid storage detected - clearing');
      authStorage.clear();
      setUser(null);
      setLoading(false);
      clearTimeout(timeout);
      return;
    }

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Auth session error:', error);
          authStorage.clear();
        }
        
        // ✅ SAVE SESSION if exists
        if (session) {
          authStorage.save(session);
          console.log('✅ Initial session saved to authStorage');
        }
        
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(timeout);
      })
      .catch((err) => {
        console.error('Critical auth error:', err);
        authStorage.clear();
        setUser(null);
        setLoading(false);
        clearTimeout(timeout);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        // ✅ CRITICAL FIX: Save or clear auth storage based on session
        if (session) {
          authStorage.save(session);
          console.log('✅ Token saved to authStorage');
        } else {
          authStorage.clear();
          console.log('🗑️ AuthStorage cleared');
        }
        
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // ✅ LOGOUT FUNCTION with clear storage
  const signOut = async () => {
    await supabase.auth.signOut();
    authStorage.clear();
    setUser(null);
  };

  return { 
    user, 
    loading,
    signOut,
    isAuthenticated: !!user 
  };
}