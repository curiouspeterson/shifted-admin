/**
 * Authentication Hook
 * Last Updated: 2024-03
 * 
 * Custom hook for managing authentication state and session handling.
 * Features:
 * - Persistent session management
 * - Automatic token refresh
 * - Type-safe auth state
 * - Error handling
 */

import { useCallback, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    session: null,
    loading: true,
    error: null,
  });

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      setState(prev => ({ ...prev, session, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error as Error,
        loading: false 
      }));
    }
  }, [supabase.auth]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      await refreshSession();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error as Error,
        loading: false 
      }));
    }
  }, [supabase.auth, refreshSession]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setState({ session: null, loading: false, error: null });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error as Error,
        loading: false 
      }));
    }
  }, [supabase.auth]);

  // Set up auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, session, loading: false }));
    });

    // Initial session check
    refreshSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, refreshSession]);

  return {
    ...state,
    signIn,
    signOut,
    refreshSession,
  };
} 