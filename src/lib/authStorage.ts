// src/lib/authStorage.ts
import type { Session } from '@supabase/supabase-js';

/**
 * Auth Storage Utility
 * 
 * Safely manage authentication storage to prevent corrupt data
 * from breaking the app and causing infinite loading loops.
 * 
 * Usage:
 * - Call authStorage.validateOnStartup() in main.tsx
 * - Call authStorage.clear() on logout
 * - Use authStorage.isValid() to check before auth operations
 */

export const authStorage = {
  /**
   * Save session to storage
   * This stores the session in the format Supabase expects
   */
  save(session: Session | null): void {
    try {
      if (!session) {
        console.warn('⚠️ Attempted to save null session');
        return;
      }

      // Supabase stores in 'supabase.auth.token' key
      const tokenData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user
      };

      localStorage.setItem('supabase.auth.token', JSON.stringify(tokenData));
      
      // Also save to custom keys for easier access
      localStorage.setItem('sb-auth-token', session.access_token);
      localStorage.setItem('sb-refresh-token', session.refresh_token);
      localStorage.setItem('sb-user-data', JSON.stringify(session.user));
      localStorage.setItem('sb-expires-at', session.expires_at?.toString() || '');

      console.log('✅ Session saved to storage');
    } catch (error) {
      console.error('❌ Failed to save session:', error);
    }
  },

  /**
   * Check if auth storage is valid
   * Returns false if storage is corrupt or missing required fields
   */
  isValid(): boolean {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      
      // No token stored - this is OK (user not logged in)
      if (!token) return false;
      
      // Try to parse token
      const parsed = JSON.parse(token);
      
      // Check if required fields exist
      if (!parsed || typeof parsed !== 'object') {
        console.warn('âš ï¸ Invalid auth token structure');
        return false;
      }
      
      // Must have access_token
      if (!parsed.access_token) {
        console.warn('âš ï¸ Missing access_token in storage');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('âŒ Invalid auth storage (parse error):', error);
      return false;
    }
  },

  /**
   * Clear all auth-related storage
   * Call this on logout or when corrupt storage is detected
   */
  clear(): void {
    try {
      console.log('ðŸ§¹ Clearing auth storage...');
      
      // Clear all Supabase auth keys
      const allKeys = Object.keys(localStorage);
      const supabaseKeys = allKeys.filter(key => 
        key.startsWith('supabase.auth') || 
        key.startsWith('sb-')
      );
      
      supabaseKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear custom auth storage (if you use any)
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      localStorage.removeItem('token');
      
      // Clear session storage
      sessionStorage.clear();
      
      console.log('âœ… Auth storage cleared successfully');
    } catch (error) {
      console.error('âŒ Failed to clear storage:', error);
      // Force clear entire localStorage as fallback
      try {
        localStorage.clear();
      } catch (e) {
        console.error('âŒ Critical: Cannot clear localStorage');
      }
    }
  },

  /**
   * Validate storage on app startup
   * Automatically clears corrupt storage
   * Call this in main.tsx before rendering app
   */
  validateOnStartup(): void {
    console.log('ðŸ” Validating auth storage on startup...');
    
    if (!this.isValid() && this.hasStoredToken()) {
      console.warn('âš ï¸ Corrupt auth storage detected - clearing...');
      this.clear();
      console.log('âœ… Storage validated and cleaned');
    } else if (this.hasStoredToken()) {
      console.log('âœ… Auth storage is valid');
      
      // Check if token is expired
      if (this.isTokenExpired()) {
        console.warn('âš ï¸ Token expired - clearing...');
        this.clear();
      }
    } else {
      console.log('â„¹ï¸ No auth token stored (user not logged in)');
    }
  },

  /**
   * Check if there's any stored token (even if invalid)
   */
  hasStoredToken(): boolean {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      return token !== null && token !== 'undefined' && token !== '';
    } catch {
      return false;
    }
  },

  /**
   * Get token expiry time
   */
  getTokenExpiry(): Date | null {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) return null;
      
      const parsed = JSON.parse(token);
      if (!parsed.expires_at) return null;
      
      // Supabase stores unix timestamp in seconds
      return new Date(parsed.expires_at * 1000);
    } catch (error) {
      console.error('Failed to get token expiry:', error);
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    
    const now = Date.now();
    const expiryTime = expiry.getTime();
    
    // Add 60 second buffer (token expires 60s before actual expiry)
    const isExpired = expiryTime < (now + 60000);
    
    if (isExpired) {
      console.warn('âš ï¸ Token expired at:', expiry.toISOString());
    }
    
    return isExpired;
  },

  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiry(): number {
    const expiry = this.getTokenExpiry();
    if (!expiry) return 0;
    
    const now = Date.now();
    const expiryTime = expiry.getTime();
    const secondsUntilExpiry = Math.floor((expiryTime - now) / 1000);
    
    return Math.max(0, secondsUntilExpiry);
  },

  /**
   * Get stored user ID (if available)
   */
  getUserId(): string | null {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) return null;
      
      const parsed = JSON.parse(token);
      return parsed.user?.id || null;
    } catch {
      return null;
    }
  },

  /**
   * Debug: Print auth storage info
   * Use this for troubleshooting
   */
  debug(): void {
    console.group('ðŸ” Auth Storage Debug Info');
    
    console.log('Valid:', this.isValid());
    console.log('Has Token:', this.hasStoredToken());
    console.log('Is Expired:', this.isTokenExpired());
    console.log('User ID:', this.getUserId());
    console.log('Expires At:', this.getTokenExpiry()?.toISOString() || 'N/A');
    console.log('Time Until Expiry:', `${this.getTimeUntilExpiry()}s`);
    
    // List all Supabase keys
    const allKeys = Object.keys(localStorage);
    const supabaseKeys = allKeys.filter(key => 
      key.startsWith('supabase') || key.startsWith('sb-')
    );
    console.log('Supabase Keys:', supabaseKeys);
    
    console.groupEnd();
  },

  /**
   * Emergency reset
   * Clears everything and reloads page
   */
  emergencyReset(): void {
    console.warn('ðŸš¨ Emergency reset triggered');
    this.clear();
    window.location.href = '/login';
  }
};

// Export for use in window console (debugging)
if (typeof window !== 'undefined') {
  (window as any).authStorage = authStorage;
  console.log('ðŸ’¡ Tip: Type "authStorage.debug()" in console for auth info');
}