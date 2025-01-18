/**
 * Auth Types
 * Last Updated: 2025-03-19
 * 
 * Type definitions for authentication-related functionality.
 */

export interface SignInResponse {
  error?: string;
  data?: {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    token: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
} 