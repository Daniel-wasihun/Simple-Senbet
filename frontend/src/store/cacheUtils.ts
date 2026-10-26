export interface CacheOptions {
  ttl?: number; // Time-to-live in milliseconds
  force?: boolean; // Force fresh network fetch, bypassing cache
}

export const DEFAULT_STORE_TTL = 30_000; // 30 seconds default for operational data
export const LONG_STORE_TTL = 300_000; // 5 minutes default for relatively static lookup data

export function isFresh(timestamp: number | undefined, ttl: number = DEFAULT_STORE_TTL): boolean {
  if (!timestamp || timestamp <= 0) return false;
  return Date.now() - timestamp < ttl;
}

export interface PaginationMeta {
  total: number;
  last_page: number;
  current_page: number;
  per_page: number;
}

/**
 * Standardize extracting data list and pagination metadata from diverse backend payloads:
 * Supports:
 * - Laravel LengthAwarePaginator: { data: [...], total, last_page, current_page, per_page }
 * - Wrapped resource responses: { data: { data: [...], total, ... } }
 * - BFF wrapped responses: { data: [...], pagination: { ... } }
 * - Direct array payloads: [...] or { data: [...] }
 */
export function extractDataAndPagination<T = any>(
  payload: any,
  defaultPerPage = 15
): { data: T[]; pagination: PaginationMeta } {
  const container = payload?.data ?? payload;
  const rawList: T[] = Array.isArray(container)
    ? container
    : Array.isArray(container?.data)
    ? container.data
    : [];

  const metaSource =
    payload?.pagination ??
    (container && typeof container === "object" && !Array.isArray(container) ? container : payload);

  const total = typeof metaSource?.total === "number" ? metaSource.total : rawList.length;
  const last_page = typeof metaSource?.last_page === "number"
    ? metaSource.last_page
    : typeof metaSource?.pages === "number"
    ? metaSource.pages
    : 1;
  const current_page = typeof metaSource?.current_page === "number"
    ? metaSource.current_page
    : typeof metaSource?.page === "number"
    ? metaSource.page
    : 1;
  const per_page = typeof metaSource?.per_page === "number" ? metaSource.per_page : defaultPerPage;

  return {
    data: rawList,
    pagination: { total, last_page, current_page, per_page },
  };
}

/**
 * Safely extracts user-friendly error messages from Laravel error payloads
 */
export function extractErrorMessage(json: any, fallback = "The request failed."): string {
  if (!json || typeof json !== "object") return fallback;
  if (json.errors && typeof json.errors === "object") {
    const errorList = Object.values(json.errors).flat().map(String).filter(Boolean);
    if (errorList.length > 0) return errorList.join(" ");
  }
  return json.message || fallback;
}
