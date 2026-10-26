export interface CacheOptions {
  ttl?: number; // Time-to-live in milliseconds
  force?: boolean; // Force fresh network fetch, bypassing cache
}

export const DEFAULT_STORE_TTL = 30_000; // 30 seconds default for fast-changing operational data
export const LONG_STORE_TTL = 300_000; // 5 minutes default for relatively static lookup data (classes, courses, roles)

export function isFresh(timestamp: number | undefined, ttl: number = DEFAULT_STORE_TTL): boolean {
  if (!timestamp || timestamp <= 0) return false;
  return Date.now() - timestamp < ttl;
}
