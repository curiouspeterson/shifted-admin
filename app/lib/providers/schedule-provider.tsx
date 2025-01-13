'use client';

import { createContext, useContext, useRef, type PropsWithChildren } from 'react';
import { type StoreApi, useStore } from 'zustand';
import { createScheduleStore, type ScheduleStore, type ScheduleState } from '../stores/schedule-store';

export const ScheduleStoreContext = createContext<StoreApi<ScheduleStore> | null>(null);

export interface ScheduleProviderProps extends PropsWithChildren {
  initialState?: Partial<ScheduleState>;
}

export function ScheduleProvider({
  children,
  initialState
}: ScheduleProviderProps) {
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

export function useScheduleStore<T>(selector: (store: ScheduleStore) => T): T {
  const store = useContext(ScheduleStoreContext);
  if (!store) {
    throw new Error('Missing ScheduleContext.Provider in the tree');
  }
  return useStore(store, selector);
} 