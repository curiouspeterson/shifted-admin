import { toast } from 'sonner';

export interface OfflineData<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt?: number;
}

class OfflineStorage {
  private dbName = 'dispatch-center-offline';
  private version = 1;
  private storeName = 'offline-store';

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
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async store<T>(key: string, data: T, expiresIn?: number): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      const offlineData: OfflineData<T> = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
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
          payload: { key, data },
        });
      }
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
    } catch (error) {
      toast.error('Failed to cleanup offline storage');
      throw error;
    }
  }

  async getStats(): Promise<{ total: number; expired: number }> {
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

      return {
        total: allData.length,
        expired,
      };
    } catch (error) {
      toast.error('Failed to get storage stats');
      return { total: 0, expired: 0 };
    }
  }
}

export const offlineStorage = new OfflineStorage(); 