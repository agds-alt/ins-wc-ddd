/**
 * Password Hashing Utilities
 * Uses bcryptjs for secure password hashing
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate salt and hash
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);

  return hash;
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password comparison failed:', error);
    return false;
  }
}

/**
 * Validate password strength
 * Returns error message if invalid, null if valid
 */
export function validatePasswordStrength(password: string): string | null {
  // Minimum 8 characters
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  // Maximum 128 characters (prevent DoS)
  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must contain at least one letter';
  }

  // Must contain at least one number
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }

  return null; // Valid
}

/**
 * Generate random password (for temporary passwords)
 */
export function generateRandomPassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one of each required character type
  password += 'A'; // Uppercase
  password += 'a'; // Lowercase
  password += '1'; // Number
  password += '!'; // Special char

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
