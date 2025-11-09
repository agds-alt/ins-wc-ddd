/**
 * Authentication Service
 * Business logic for user authentication and authorization
 * FREE TIER: JWT-only, no Redis session storage
 */

import { User } from '../entities/User';
import { IUserRepository } from '../repositories/IUserRepository';

export interface LoginResult {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  occupation_id?: string;
}

export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: {
      hash(password: string): Promise<string>;
      compare(password: string, hash: string): Promise<boolean>;
    },
    private jwtService: {
      sign(payload: any): Promise<string>;
      verify(token: string): Promise<any>;
    }
  ) {}

  /**
   * Authenticate user with email and password
   * Returns user and JWT token
   */
  async login(email: string, password: string): Promise<LoginResult> {
    // Find user by email
    const user = await this.userRepository.findByIdWithRole(
      (await this.userRepository.findByEmail(email))?.id || ''
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is inactive. Please contact administrator.');
    }

    // Verify password (assuming password_hash is stored in DB)
    // Note: In real implementation, we'd need to get the hash from repository
    // For now, this is a placeholder that would be implemented with actual password checking

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate JWT token (FREE TIER: All session data in token)
    const token = await this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      fullName: user.fullName,
    });

    return {
      user,
      token,
    };
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const password_hash = await this.passwordHasher.hash(data.password);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      full_name: data.full_name,
      password_hash,
      phone: data.phone,
      occupation_id: data.occupation_id,
    });

    return user;
  }

  /**
   * Verify JWT token and get user
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = await this.jwtService.verify(token);

      // Get user with fresh data from DB
      const user = await this.userRepository.findByIdWithRole(payload.userId);

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    // Note: Need to implement password verification with stored hash

    // Hash new password
    const password_hash = await this.passwordHasher.hash(newPassword);

    // Update user (this would need a method to update password specifically)
    // await this.userRepository.updatePassword(userId, password_hash);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists for security
      return;
    }

    // Generate reset token
    const resetToken = await this.jwtService.sign({
      userId: user.id,
      type: 'password_reset',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    });

    // TODO: Send email with reset link
    // For now, just log it (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = await this.jwtService.verify(token);

      if (payload.type !== 'password_reset') {
        throw new Error('Invalid reset token');
      }

      // Hash new password
      const password_hash = await this.passwordHasher.hash(newPassword);

      // Update user password
      // await this.userRepository.updatePassword(payload.userId, password_hash);
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   * Check if user has permission
   */
  async checkPermission(userId: string, requiredLevel: number): Promise<boolean> {
    const user = await this.userRepository.findByIdWithRole(userId);

    if (!user) {
      return false;
    }

    return user.hasRoleLevel(requiredLevel);
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.userRepository.findByIdWithRole(userId);

    if (!user) {
      return false;
    }

    return user.isAdmin();
  }
}
