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
  private versions: Map<string, number> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default
  private readonly STALE_WHILE_REVALIDATE_TTL = 30 * 60 * 1000; // 30 minutes for stale data

  private version(key: string): number { return this.versions.get(key) ?? 0; }
  private bumpVersion(key: string): void { this.versions.set(key, this.version(key) + 1); }

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
      this.revalidateInBackground(key, fetcher, ttl, this.version(key));

      return staleData;
    }

    // Check if request is already in progress
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Make new request
    let pending: Promise<T> | undefined;
    try {
      const version = this.version(key);
      pending = fetcher();
      this.pendingRequests.set(key, pending);

      const data = await pending;

      // Cache the result
      if (this.version(key) === version && this.pendingRequests.get(key) === pending) {
        this.cache.set(key, { data, timestamp: Date.now(), ttl });
      }

      return data;
    } finally {
      if (pending && this.pendingRequests.get(key) === pending) this.pendingRequests.delete(key);
    }
  }

  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
    version: number
  ): Promise<void> {
    if (this.pendingRequests.has(key)) return;
    const pending = fetcher();
    this.pendingRequests.set(key, pending);
    try {
      const data = await pending;
      if (this.version(key) === version && this.pendingRequests.get(key) === pending) {
        this.cache.set(key, { data, timestamp: Date.now(), ttl });
      }
    } catch (error) {
      console.warn(`Background revalidation failed for key: ${key}`, error);
    } finally {
      if (this.pendingRequests.get(key) === pending) this.pendingRequests.delete(key);
    }
  }

  clear(key?: string): void {
    if (key) {
      this.bumpVersion(key);
      this.cache.delete(key);
      this.pendingRequests.delete(key);
    } else {
      for (const key of new Set([...this.cache.keys(), ...this.pendingRequests.keys()])) this.bumpVersion(key);
      this.cache.clear();
      this.pendingRequests.clear();
    }
  }

  invalidate(key: string): void {
    this.bumpVersion(key);
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of new Set([...this.cache.keys(), ...this.pendingRequests.keys()])) {
      if (key.startsWith(prefix)) {
        this.bumpVersion(key);
        this.cache.delete(key);
        this.pendingRequests.delete(key);
      }
    }
  }
}

export const apiCache = APICache.getInstance();
