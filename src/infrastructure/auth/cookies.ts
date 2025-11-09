/**
 * Cookie Management (FREE TIER - Stateless Sessions)
 * HTTP-only cookies for JWT storage
 */

import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'wc_auth_token';
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Set auth cookie (JWT token)
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true, // Prevent JavaScript access (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: COOKIE_MAX_AGE,
    path: '/', // Available across entire site
  });
}

/**
 * Get auth cookie (JWT token)
 */
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME);

  return cookie?.value || null;
}

/**
 * Delete auth cookie (logout)
 */
export async function deleteAuthCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Check if auth cookie exists
 */
export async function hasAuthCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(AUTH_COOKIE_NAME);
}

/**
 * Client-side cookie management (for use in browser)
 */
export const clientCookies = {
  /**
   * Set cookie on client side
   */
  set(name: string, value: string, days: number = 7): void {
    if (typeof window === 'undefined') return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=lax`;
  },

  /**
   * Get cookie on client side
   */
  get(name: string): string | null {
    if (typeof window === 'undefined') return null;

    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') cookie = cookie.substring(1, cookie.length);
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }

    return null;
  },

  /**
   * Delete cookie on client side
   */
  delete(name: string): void {
    if (typeof window === 'undefined') return;

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },
};
