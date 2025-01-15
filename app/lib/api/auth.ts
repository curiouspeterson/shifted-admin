/**
 * Authentication Service
 * Last Updated: 2025-01-15
 * 
 * This module provides authentication functionality for API requests.
 * It handles JWT verification and user authorization.
 */

import { NextRequest } from 'next/server';
import { AuthError } from '@/lib/errors';
import { supabase } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export class AuthService {
  /**
   * Authenticates a request using the Authorization header
   */
  async authenticateRequest(req: NextRequest): Promise<AuthUser> {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        throw new AuthError('UNAUTHORIZED', 'Missing or invalid authorization header');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new AuthError('UNAUTHORIZED', 'Missing token');
      }

      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        throw new AuthError('UNAUTHORIZED', 'Invalid token');
      }

      // Get user roles from metadata
      const roles = (user.app_metadata?.roles || ['user']) as string[];

      return {
        id: user.id,
        email: user.email!,
        roles,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('UNAUTHORIZED', 'Authentication failed');
    }
  }

  /**
   * Checks if a user has the required roles
   */
  hasRequiredRoles(user: AuthUser, requiredRoles: string[]): boolean {
    return requiredRoles.some(role => user.roles.includes(role));
  }

  /**
   * Gets the current user from a request
   */
  async getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
    try {
      return await this.authenticateRequest(req);
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService(); 