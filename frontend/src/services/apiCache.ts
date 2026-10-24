// src/services/apiCache.ts

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Serve stale data while revalidating
}

class APICache {
  private static instance: APICache;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> =
    new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default
  private readonly STALE_WHILE_REVALIDATE_TTL = 30 * 60 * 1000; // 30 minutes for stale data

  private constructor() {}

  static getInstance(): APICache {
    if (!APICache.instance) {
      APICache.instance = new APICache();
    }
    return APICache.instance;
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const ttl = options.ttl ?? this.DEFAULT_TTL;
    const staleWhileRevalidate = options.staleWhileRevalidate ?? false;

    const cached = this.cache.get(key);
    const now = Date.now();

    // Check if cache is valid
    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Check if we can serve stale data while revalidating
    if (
      staleWhileRevalidate &&
      cached &&
      now - cached.timestamp < this.STALE_WHILE_REVALIDATE_TTL
    ) {
      // Serve stale data immediately
      const staleData = cached.data;

      // Revalidate in background
      this.revalidateInBackground(key, fetcher, ttl);

      return staleData;
    }

    // Check if request is already in progress
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Make new request
    try {
      const promise = fetcher();
      this.pendingRequests.set(key, promise);

      const data = await promise;

      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: now,
        ttl,
      });

      return data;
    } catch (error) {
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
    } catch (error) {
      console.warn(`Background revalidation failed for key: ${key}`, error);
    }
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
    } else {
      this.cache.clear();
      this.pendingRequests.clear();
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

export const apiCache = APICache.getInstance();
