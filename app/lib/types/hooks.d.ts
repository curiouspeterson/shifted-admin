/**
 * Hook Type Declarations
 * Last Updated: 2024
 * 
 * Type declarations for custom hooks used in the application.
 */

import { User } from '@supabase/supabase-js';

// Auth Hook Types
declare module '@/lib/hooks/use-auth' {
  export interface AuthHookResult {
    user: User | null;
    isLoading: boolean;
  }

  export function useAuth(): AuthHookResult;
}

// Ensure the browser client is properly typed
declare module '@/lib/supabase' {
  import { SupabaseClient } from '@supabase/supabase-js';
  import type { Database } from '@/lib/supabase/database.types';

  export const browserClient: SupabaseClient<Database>;
} 