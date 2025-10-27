// src/hooks/useAuth.ts - EMERGENCY FIX: Remove infinite loop
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { authStorage } from '../lib/authStorage';
import type { Database } from '../types/database.types';

// Define the profile type based on your database schema
export type UserProfile = Omit<Database['public']['Tables']['users']['Row'], 'password_hash'>;

export interface AppUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  profile?: UserProfile | null;
}

interface UseAuthReturn {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ✅ CACHE profile in memory
let cachedProfile: UserProfile | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false); // ✅ Prevent double init

  // ✅ Fast profile fetch with cache
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // Check cache first
      const now = Date.now();
      if (cachedProfile && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('✅ Using cached profile');
        return cachedProfile;
      }

      console.log('🔄 Fetching fresh profile...');

      const { data, error: profileError } = await supabase
        .from('users')
        .select('id, email, full_name, is_active, occupation_id')
        .eq('id', userId)
        .eq('is_active', true)
        .maybeSingle(); // ✅ Use maybeSingle instead of single

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        return null;
      }

      if (!data) {
        console.warn('⚠️ No profile found');
        return null;
      }

      // Update cache
      cachedProfile = data;
      cacheTimestamp = now;

      console.log('✅ Profile loaded');
      return data;
    } catch (err) {
      console.error('❌ Profile fetch failed:', err);
      return null;
    }
  };

  // ✅ ONLY update last login on actual sign in
  const updateLastLogin = async (userId: string): Promise<void> => {
    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
      console.log('✅ Last login updated');
    } catch (err) {
      console.error('❌ Last login update failed:', err);
    }
  };

  // Refresh profile
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    const profileData = await fetchUserProfile(user.id);
    setProfile(profileData);
  }, [user?.id]);

  // ✅ Initialize ONCE with timeout protection
  useEffect(() => {
    if (initRef.current) return; // ✅ Already initialized
    initRef.current = true;

    let mounted = true;

    const initAuth = async () => {
      console.log('🔐 Initializing auth...');

      // ✅ TIMEOUT protection: Force complete after 3 seconds
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Auth timeout - proceeding anyway');
        if (mounted) {
          setLoading(false);
        }
      }, 3000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        clearTimeout(timeoutId);

        if (!mounted) return;

        if (sessionError || !session?.user) {
          console.log('ℹ️ No session');
          authStorage.clear();
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        console.log('✅ Session found');
        authStorage.save(session);

        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email!,
          user_metadata: session.user.user_metadata,
          app_metadata: session.user.app_metadata,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
        };

        setUser(appUser);

        // Fetch profile WITHOUT blocking
        fetchUserProfile(session.user.id).then(profileData => {
          if (mounted) {
            setProfile(profileData);
          }
        });

        setLoading(false);
      } catch (err) {
        console.error('❌ Auth init error:', err);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []); // ✅ Empty deps - run ONCE only

  // ✅ Handle auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth event: ${event}`);

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            authStorage.save(session);

            const appUser: AppUser = {
              id: session.user.id,
              email: session.user.email!,
              user_metadata: session.user.user_metadata,
              app_metadata: session.user.app_metadata,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at,
            };

            setUser(appUser);

            // Fetch profile and update last login
            const profileData = await fetchUserProfile(session.user.id);
            setProfile(profileData);

            // ✅ ONLY update on sign in
            await updateLastLogin(session.user.id);
          }
          break;

        case 'TOKEN_REFRESHED':
          // ✅ DO NOTHING - don't refetch or update
          console.log('✅ Token refreshed silently');
          break;

        case 'SIGNED_OUT':
          authStorage.clear();
          cachedProfile = null; // Clear cache
          cacheTimestamp = 0;
          setUser(null);
          setProfile(null);
          console.log('🗑️ Signed out');
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // ✅ Empty deps - setup ONCE

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      authStorage.clear();
      cachedProfile = null;
      cacheTimestamp = 0;
      setUser(null);
      setProfile(null);
      console.log('✅ Signed out');
    } catch (err) {
      console.error('❌ Sign out error:', err);
    }
  }, []);

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    signOut,
    refreshProfile,
  };
}

export function useUserProfile() {
  const { profile } = useAuth();

  return {
    fullName: profile?.full_name || 'User',
    email: profile?.email || '',
    occupationId: profile?.occupation_id,
    isActive: profile?.is_active ?? false,
  };
}