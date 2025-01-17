/**
 * App Context Provider
 * Last Updated: 2024-03-21
 * 
 * Global application context using modern React patterns.
 * Provides app-wide state management with TypeScript support.
 */

'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';

interface AppState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
}

type AppAction = 
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_SYNC_STATUS'; payload: boolean }
  | { type: 'SET_SYNC_TIME'; payload: string };

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const initialState: AppState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncTime: null,
};

const AppContext = createContext<AppContextType | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    case 'SET_SYNC_STATUS':
      return { ...state, isSyncing: action.payload };
    case 'SET_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
} 