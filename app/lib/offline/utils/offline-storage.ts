import { toast } from 'sonner';

export interface OfflineData<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt?: number;
  version?: number;
  lastSynced?: number;
}

export interface StorageStats {
  total: number;
  expired: number;
  size: number;
  lastCleanup: number;
}

/**
 * Enhanced offline storage utility with improved error handling and sync support
 */
class OfflineStorage {
  private dbName = 'dispatch-center-offline';
  private version = 1;
  private storeName = 'offline-store';
  private lastCleanup = 0;
  private cleanupInterval = 1000 * 60 * 60; // 1 hour

  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        toast.error('Failed to open offline storage');
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('expiresAt', 'expiresAt');
          store.createIndex('lastSynced', 'lastSynced');
          store.createIndex('version', 'version');
        }
      };
    });
  }

  async store<T>(
    key: string, 
    data: T, 
    options?: { 
      expiresIn?: number; 
      version?: number;
    }
  ): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      const now = Date.now();
      const offlineData: OfflineData<T> = {
        key,
        data,
        timestamp: now,
        expiresAt: options?.expiresIn ? now + options.expiresIn : undefined,
        version: options?.version,
        lastSynced: now,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(offlineData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Register with service worker cache if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_DATA',
          payload: { key, data, timestamp: now },
        });
      }

      // Trigger cleanup if needed
      await this.maybeCleanup();
    } catch (error) {
      toast.error('Failed to store offline data');
      throw error;
    }
  }

  async retrieve<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);

      const data = await new Promise<OfflineData<T> | undefined>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!data) return null;

      // Check expiration
      if (data.expiresAt && data.expiresAt < Date.now()) {
        await this.remove(key);
        return null;
      }

      return data.data;
    } catch (error) {
      toast.error('Failed to retrieve offline data');
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Remove from service worker cache if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'REMOVE_CACHE',
          payload: { key },
        });
      }
    } catch (error) {
      toast.error('Failed to remove offline data');
      throw error;
    }
  }

  private async maybeCleanup(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupInterval) return;
    await this.cleanup();
    this.lastCleanup = now;
  }

  async cleanup(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      const allData = await new Promise<OfflineData[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const now = Date.now();
      const expired = allData.filter(item => item.expiresAt && item.expiresAt < now);

      for (const item of expired) {
        await this.remove(item.key);
      }

      this.lastCleanup = now;
    } catch (error) {
      toast.error('Failed to cleanup offline storage');
      throw error;
    }
  }

  async getStats(): Promise<StorageStats> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);

      const allData = await new Promise<OfflineData[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const now = Date.now();
      const expired = allData.filter(item => item.expiresAt && item.expiresAt < now).length;
      const size = allData.reduce((acc, item) => acc + JSON.stringify(item).length, 0);

      return {
        total: allData.length,
        expired,
        size: Math.round(size / 1024), // Size in KB
        lastCleanup: this.lastCleanup,
      };
    } catch (error) {
      toast.error('Failed to get storage stats');
      return { total: 0, expired: 0, size: 0, lastCleanup: 0 };
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Clear service worker cache if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_CACHE',
        });
      }
    } catch (error) {
      toast.error('Failed to clear offline storage');
      throw error;
    }
  }
}

export const offlineStorage = new OfflineStorage(); 