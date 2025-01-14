/**
 * Schedule Provider Module
 * Last Updated: 2024
 * 
 * Provides global state management for schedule-related data using Zustand.
 * Implements the Context + Hooks pattern for sharing schedule state across components.
 * 
 * Features:
 * - Global schedule state management
 * - Type-safe state and selectors
 * - Memoized store instance
 * - Automatic state hydration
 * - Error boundary for missing provider
 */

'use client';

import { createContext, useContext, useRef, type PropsWithChildren } from 'react';
import { type StoreApi, useStore } from 'zustand';
import { createScheduleStore, type ScheduleStore, type ScheduleState } from '../stores/schedule-store';

/**
 * Context for sharing the Zustand store instance across components
 * Initialized as null and populated by the provider
 */
export const ScheduleStoreContext = createContext<StoreApi<ScheduleStore> | null>(null);

/**
 * Props interface for the ScheduleProvider component
 * 
 * @property children - Child components to be wrapped by the provider
 * @property initialState - Optional initial state to hydrate the store with
 */
export interface ScheduleProviderProps extends PropsWithChildren {
  initialState?: Partial<ScheduleState>;
}

/**
 * Schedule Provider Component
 * Creates and provides a memoized Zustand store instance to the component tree
 * 
 * @component
 * @param props - ScheduleProviderProps containing children and optional initial state
 * @returns Provider component wrapping children with schedule store context
 */
export function ScheduleProvider({
  children,
  initialState
}: ScheduleProviderProps) {
  // Memoize store instance using useRef to ensure consistent reference
  const storeRef = useRef<StoreApi<ScheduleStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createScheduleStore(initialState);
  }
  return (
    <ScheduleStoreContext.Provider value={storeRef.current}>
      {children}
    </ScheduleStoreContext.Provider>
  );
}

/**
 * Custom hook for accessing and selecting from the schedule store
 * Provides type-safe access to store state and handles missing provider error
 * 
 * @template T - Return type of the selector function
 * @param selector - Function to select specific state from the store
 * @returns Selected state from the store
 * @throws Error if used outside of ScheduleProvider
 * 
 * @example
 * ```tsx
 * const schedule = useScheduleStore(state => state.schedule);
 * const isLoading = useScheduleStore(state => state.isLoading);
 * ```
 */
export function useScheduleStore<T>(selector: (store: ScheduleStore) => T): T {
  const store = useContext(ScheduleStoreContext);
  if (!store) {
    throw new Error('Missing ScheduleContext.Provider in the tree');
  }
  return useStore(store, selector);
} 