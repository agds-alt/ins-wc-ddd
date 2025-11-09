/**
 * JWT Authentication (FREE TIER - NO Redis)
 * Uses jose library for Edge Runtime compatibility
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRY = '7d'; // 7 days

// Convert secret to Uint8Array for jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  roleLevel?: number;
  fullName?: string;
  organizationId?: string;
  exp?: number;
}

/**
 * Sign JWT token (FREE TIER: All session data in token)
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  const secret = getSecretKey();

  // Calculate expiry (7 days from now)
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days

  const token = await new SignJWT({
    ...payload,
    exp,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Verify JWT token and extract payload
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecretKey();

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    return payload as JWTPayload;
  } catch (error) {
    // Token invalid or expired
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Create short-lived token (for password reset, etc.)
 */
export async function signShortLivedJWT(
  payload: Record<string, any>,
  expiresIn: string = '1h'
): Promise<string> {
  const secret = getSecretKey();

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  return token;
}

/**
 * Decode JWT without verification (for debugging)
 * ⚠️ DO NOT use for authentication!
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired (without verification)
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Get time until token expires (in seconds)
 */
export function getTimeUntilExpiry(token: string): number {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return 0;

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - now);
}

/**
 * Refresh token (generate new token with same payload)
 * Only if token is not yet expired
 */
export async function refreshJWT(token: string): Promise<string | null> {
  const payload = await verifyJWT(token);

  if (!payload) return null;

  // Remove exp from payload (will be regenerated)
  const { exp, ...rest } = payload;

  // Generate new token
  return await signJWT(rest);
}
