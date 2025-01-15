import { toast } from '@/components/ui/toast';

interface OfflineData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

/**
 * Utility class for handling offline data storage and retrieval
 */
export class OfflineStorage {
  private static DB_NAME = 'shifted-admin-offline';
  private static STORE_NAME = 'offline-data';
  private static DB_VERSION = 1;

  /**
   * Opens the IndexedDB database
   */
  private static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('expiresAt', 'expiresAt');
        }
      };
    });
  }

  /**
   * Stores data for offline use
   */
  static async store(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);

      const offlineData: OfflineData = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : undefined,
      };

      await store.put(offlineData);
    } catch (error) {
      console.error('Failed to store offline data:', error);
      toast({
        title: 'Storage Error',
        description: 'Failed to save data for offline use.',
        variant: 'destructive',
      });
    }
  }

  /**
   * Retrieves data stored for offline use
   */
  static async retrieve<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);

      const result = await store.get(key);
      if (!result) return null;

      const offlineData = result as OfflineData;
      
      // Check if data has expired
      if (offlineData.expiresAt && Date.now() > offlineData.expiresAt) {
        await this.remove(key);
        return null;
      }

      return offlineData.data as T;
    } catch (error) {
      console.error('Failed to retrieve offline data:', error);
      toast({
        title: 'Retrieval Error',
        description: 'Failed to retrieve offline data.',
        variant: 'destructive',
      });
      return null;
    }
  }

  /**
   * Removes data from offline storage
   */
  static async remove(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      await store.delete(key);
    } catch (error) {
      console.error('Failed to remove offline data:', error);
    }
  }

  /**
   * Cleans up expired data from offline storage
   */
  static async cleanup(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('expiresAt');

      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('Failed to cleanup offline data:', error);
    }
  }

  /**
   * Gets storage statistics
   */
  static async getStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    totalSize: number;
  }> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);

      const entries = await store.getAll();
      const now = Date.now();
      
      let totalSize = 0;
      let expiredEntries = 0;

      entries.forEach(entry => {
        totalSize += JSON.stringify(entry).length;
        if (entry.expiresAt && entry.expiresAt < now) {
          expiredEntries++;
        }
      });

      return {
        totalEntries: entries.length,
        expiredEntries,
        totalSize: Math.round(totalSize / 1024), // Size in KB
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalEntries: 0,
        expiredEntries: 0,
        totalSize: 0,
      };
    }
  }
} 