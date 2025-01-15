/**
 * Service Worker Types
 * Last Updated: 2024-03-20
 * 
 * This module provides TypeScript type definitions for service worker
 * events and interfaces.
 */

/// <reference lib="webworker" />

declare global {
  interface ServiceWorkerGlobalScopeEventMap {
    periodicsync: PeriodicSyncEvent
  }
}

export interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<any>): void
}

export interface ExtendableMessageEvent extends ExtendableEvent {
  data: any
  source: WindowClient | Client | ServiceWorker | MessagePort | null
  ports: ReadonlyArray<MessagePort>
}

export interface PeriodicSyncEvent extends ExtendableEvent {
  tag: string
}

export interface SyncQueueItem {
  id: string
  timestamp: number
  url: string
  method: string
  headers: Record<string, string>
  body?: any
  retryCount: number
}

export interface SyncMessage {
  type: 'SYNC_NOW' | 'SKIP_WAITING'
}

export interface SyncResult {
  type: 'SYNC_COMPLETE' | 'SYNC_ERROR'
  error?: string
  request?: string
}

export interface UpdateMessage {
  type: 'UPDATE_AVAILABLE'
} 