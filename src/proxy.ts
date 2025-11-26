/**
 * Next.js Proxy (formerly Middleware)
 * Route protection and authentication check
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/infrastructure/auth/jwt';
import { AUTH_COOKIE_NAME } from '@/infrastructure/auth/cookies';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/'];

// Admin-only routes
const adminRoutes = ['/admin'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If public route, allow access
  if (isPublicRoute) {
    // If already authenticated and trying to access login/register, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
      const payload = await verifyJWT(token);
      if (payload) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  }

  // Protected route - check authentication
  if (!token) {
    // Not authenticated - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const payload = await verifyJWT(token);

  if (!payload) {
    // Invalid token - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);

    const response = NextResponse.redirect(loginUrl);

    // Clear invalid cookie
    response.cookies.delete(AUTH_COOKIE_NAME);

    return response;
  }

  // Check admin routes
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (isAdminRoute) {
    // For admin routes, we need to check role
    // Since middleware can't easily query database, we'll rely on client-side checks
    // The tRPC procedures will enforce admin access on the backend
    // This is just a UX improvement to redirect non-admins early

    // In production, you might want to include role in JWT payload
    // and check it here
  }

  // Authenticated - allow access
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)' ,
  ],
};
