// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { authStorage } from '../lib/authStorage';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Define the profile type based on your database schema
export type UserProfile = Database['public']['Tables']['users']['Row'];

// Extended user type that combines Supabase User with our profile
export interface AppUser {
  id: string;
  email: string;
  // From Supabase User
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  // From our profile
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

// Auth state constants for better debugging
const AuthEvents = {
  INIT: 'INIT',
  SIGNED_IN: 'SIGNED_IN',
  SIGNED_OUT: 'SIGNED_OUT',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
} as const;

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch user profile with proper error handling
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      if (!userId) {
        console.warn('⚠️ No user ID provided for profile fetch');
        return null;
      }

      const { data, error: profileError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          profile_photo_url,
          occupation_id,
          is_active,
          last_login_at,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // User not found in profiles table
          console.warn('⚠️ User profile not found in database, creating default profile...');
          return await createDefaultUserProfile(userId);
        }
        
        console.error('❌ Error fetching user profile:', profileError);
        setError(`Failed to load user profile: ${profileError.message}`);
        return null;
      }

      console.log('✅ User profile loaded successfully');
      return data;
    } catch (err) {
      console.error('❌ Unexpected error in fetchUserProfile:', err);
      setError('Unexpected error loading user profile');
      return null;
    }
  }, []);

  // Create default user profile if not exists
  const createDefaultUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // First, get the email from auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.error('❌ No auth user found for profile creation');
        return null;
      }

      const defaultProfile: Database['public']['Tables']['users']['Insert'] = {
        id: userId,
        email: authUser.email!,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('users')
        .insert(defaultProfile)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating default profile:', insertError);
        return null;
      }

      console.log('✅ Default user profile created successfully');
      return data;
    } catch (err) {
      console.error('❌ Error creating default profile:', err);
      return null;
    }
  };

  // Update last login timestamp
  const updateLastLogin = useCallback(async (userId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error updating last login:', updateError);
      } else {
        console.log('✅ Last login timestamp updated');
      }
    } catch (err) {
      console.error('❌ Unexpected error updating last login:', err);
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      console.warn('⚠️ No user ID available for profile refresh');
      return;
    }

    setLoading(true);
    try {
      const profileData = await fetchUserProfile(user.id);
      setProfile(profileData);
      setError(null);
    } catch (err) {
      console.error('❌ Error refreshing profile:', err);
      setError('Failed to refresh user profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchUserProfile]);

  // Initialize auth state
  const initializeAuth = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Safety timeout
      const timeout = setTimeout(() => {
        console.warn('⚠️ Auth initialization timeout');
        setLoading(false);
      }, 10000);

      // Validate storage first
      if (!authStorage.isValid() && authStorage.hasStoredToken()) {
        console.warn('⚠️ Invalid auth storage detected - clearing');
        authStorage.clear();
        setUser(null);
        setProfile(null);
        clearTimeout(timeout);
        setLoading(false);
        return;
      }

      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        authStorage.clear();
        setError(`Session error: ${sessionError.message}`);
        clearTimeout(timeout);
        setLoading(false);
        return;
      }

      if (session?.user) {
        console.log('✅ Initial session found');
        authStorage.save(session);

        // Create app user object
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
        
        if (profileData) {
          await updateLastLogin(session.user.id);
        }
      } else {
        console.log('ℹ️ No active session found');
        authStorage.clear();
        setUser(null);
        setProfile(null);
      }

      clearTimeout(timeout);
      setLoading(false);
    } catch (err) {
      console.error('❌ Critical auth initialization error:', err);
      authStorage.clear();
      setUser(null);
      setProfile(null);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  }, [fetchUserProfile, updateLastLogin]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (
    event: string, 
    session: any
  ): Promise<void> => {
    console.log(`🔐 Auth state changed: ${event}`);

    try {
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
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

            const profileData = await fetchUserProfile(session.user.id);
            setProfile(profileData);
            
            if (profileData && event === 'SIGNED_IN') {
              await updateLastLogin(session.user.id);
            }

            setError(null);
          }
          break;

        case 'SIGNED_OUT':
        case 'USER_DELETED':
          authStorage.clear();
          setUser(null);
          setProfile(null);
          setError(null);
          console.log('🗑️ Auth storage cleared');
          break;

        default:
          console.warn(`⚠️ Unhandled auth event: ${event}`);
      }
    } catch (err) {
      console.error(`❌ Error handling auth event ${event}:`, err);
      setError(`Auth error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, updateLastLogin]);

  useEffect(() => {
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth, handleAuthStateChange]);

  // Sign out function with proper cleanup
  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('❌ Sign out error:', signOutError);
        setError(`Sign out failed: ${signOutError.message}`);
        return;
      }

      // Local cleanup (redundant but safe)
      authStorage.clear();
      setUser(null);
      setProfile(null);
      setError(null);
      console.log('✅ Signed out successfully');
    } catch (err) {
      console.error('❌ Unexpected sign out error:', err);
      setError('Unexpected error during sign out');
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user && !!profile?.is_active,
    signOut,
    refreshProfile,
  };
}

// Helper hook for user profile access
export function useUserProfile() {
  const { profile } = useAuth();
  
  return {
    fullName: profile?.full_name || 'User',
    email: profile?.email || '',
    phone: profile?.phone || '',
    profilePhoto: profile?.profile_photo_url,
    occupationId: profile?.occupation_id,
    isActive: profile?.is_active ?? false,
    lastLogin: profile?.last_login_at,
    createdAt: profile?.created_at,
  };
}