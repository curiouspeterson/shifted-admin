/**
 * Type declarations for the Background Sync API
 * @see https://wicg.github.io/background-sync/spec/
 */

interface SyncManager {
  /**
   * Register a background sync event with the given tag
   */
  register(tag: string): Promise<void>;

  /**
   * Get a list of registered sync tags
   */
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  /**
   * The SyncManager interface for registering background sync events
   */
  sync: SyncManager;
} 