/**
 * Supabase Type Declarations
 * Last Updated: 2024
 * 
 * Type declarations for Supabase client and database types to resolve module import issues.
 */

declare module '@/lib/supabase/server' {
  export * from '../../lib/supabase/server';
}

declare module '@/lib/supabase/database.types' {
  export * from '../../lib/supabase/database.types';
} 