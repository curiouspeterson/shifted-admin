/**
 * Service Worker Types
 * Last Updated: 2024-01-15
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
  waitUntil(fn: Promise<void>): void
}

export interface ExtendableMessageEvent extends ExtendableEvent {
  data: SyncMessage | UpdateMessage
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
  body?: string | FormData | Blob | ArrayBuffer
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