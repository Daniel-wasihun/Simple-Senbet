// src/hooks/useCachedData.ts
import { useState, useEffect, useCallback } from "react";
import { apiCache } from "@/services/apiCache";

interface UseCachedDataOptions<T> {
  ttl?: number;
  staleWhileRevalidate?: boolean;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions<T> = {}
) {
  const {
    ttl,
    staleWhileRevalidate = false,
    enabled = true,
    onError,
    onSuccess,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCache.get(key, fetcher, {
        ttl,
        staleWhileRevalidate,
      });

      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Unknown error");
      setError(errorObj);
      onError?.(errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, staleWhileRevalidate, enabled, onError, onSuccess]);

  const invalidate = useCallback(() => {
    apiCache.invalidate(key);
  }, [key]);

  const clear = useCallback(() => {
    apiCache.clear(key);
  }, [key]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    invalidate,
    clear,
  };
}
