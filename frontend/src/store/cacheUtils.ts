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
    payload?.meta ??
    payload?.pagination ??
    (container && typeof container === "object" && !Array.isArray(container) ? container : payload);

  const total = typeof metaSource?.total === "number"
    ? metaSource.total
    : typeof payload?.total === "number"
    ? payload.total
    : rawList.length;

  const per_page = typeof metaSource?.per_page === "number"
    ? metaSource.per_page
    : typeof payload?.per_page === "number"
    ? payload.per_page
    : defaultPerPage;

  const last_page = typeof metaSource?.last_page === "number"
    ? metaSource.last_page
    : typeof payload?.last_page === "number"
    ? payload.last_page
    : typeof metaSource?.pages === "number"
    ? metaSource.pages
    : typeof payload?.pages === "number"
    ? payload.pages
    : Math.max(1, Math.ceil(total / Math.max(1, per_page)));

  const current_page = typeof metaSource?.current_page === "number"
    ? metaSource.current_page
    : typeof payload?.current_page === "number"
    ? payload.current_page
    : typeof metaSource?.page === "number"
    ? metaSource.page
    : 1;

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
