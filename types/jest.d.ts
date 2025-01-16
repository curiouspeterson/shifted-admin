/**
 * Jest Type Extensions
 * Last Updated: 2024-01-15
 */

/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare global {
  namespace jest {
    interface Matchers<R, T> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  }

  interface WorkboxPlugin {
    cacheWillUpdate?: (options: { request: Request; response: Response }) => Promise<Response>;
    cacheDidUpdate?: (options: { cacheName: string; request: Request; oldResponse?: Response; newResponse: Response }) => void;
    cacheKeyWillBeUsed?: (options: { request: Request; mode: string }) => Promise<Request | string>;
    cachedResponseWillBeUsed?: (options: { cacheName: string; request: Request; matchOptions?: CacheQueryOptions; cachedResponse?: Response }) => Promise<Response | null>;
    requestWillFetch?: (options: { request: Request }) => Promise<Request>;
    fetchDidFail?: (options: { error: Error; request: Request }) => void;
    fetchDidSucceed?: (options: { request: Request; response: Response }) => Promise<Response>;
  }

  interface Window {
    workbox: {
      routing: {
        registerRoute: (
          capture: RegExp | string | ((options: { url: URL; request: Request; event: FetchEvent }) => boolean),
          handler: (options: { request: Request; event: FetchEvent }) => Promise<Response>
        ) => void;
      };
      strategies: {
        CacheFirst: new (options?: { cacheName?: string; plugins?: WorkboxPlugin[] }) => { handle: (request: Request) => Promise<Response> };
        NetworkFirst: new (options?: { cacheName?: string; plugins?: WorkboxPlugin[] }) => { handle: (request: Request) => Promise<Response> };
        StaleWhileRevalidate: new (options?: { cacheName?: string; plugins?: WorkboxPlugin[] }) => { handle: (request: Request) => Promise<Response> };
      };
      expiration: {
        ExpirationPlugin: new (options: { maxEntries?: number; maxAgeSeconds?: number }) => WorkboxPlugin;
      };
      backgroundSync: {
        BackgroundSyncPlugin: new (options: { maxRetentionTime?: number; onSync?: (options: { queue: { name: string } }) => Promise<void> }) => WorkboxPlugin;
      };
    };
  }

  interface Navigator {
    serviceWorker: {
      register: jest.Mock;
      unregister: jest.Mock;
    };
  }

  interface WorkerNavigator {
    serviceWorker: {
      register: jest.Mock;
      unregister: jest.Mock;
    };
  }
} 