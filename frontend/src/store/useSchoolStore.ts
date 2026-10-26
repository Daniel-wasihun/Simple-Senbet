"use client";

import { create } from "zustand";
import {
  schoolManagementService,
  type SchoolResource,
} from "@/services/schoolManagement.service";
import {
  isFresh,
  DEFAULT_STORE_TTL,
  LONG_STORE_TTL,
  type CacheOptions,
} from "@/store/cacheUtils";

interface PaginationMeta {
  total: number;
  pages: number;
  page: number;
}

interface SchoolState {
  items: Record<string, any[]>;
  pagination: Record<string, PaginationMeta>;
  lookups: Record<string, any[]>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  timestamps: Record<string, number>;

  // Actions
  fetchList: (
    resource: SchoolResource,
    query?: string,
    options?: CacheOptions & { userId?: number }
  ) => Promise<any[]>;
  fetchLookups: (
    sources: string[],
    options?: CacheOptions & { userId?: number }
  ) => Promise<Record<string, any[]>>;
  createRecord: (
    resource: SchoolResource,
    data: unknown,
    userId?: number
  ) => Promise<any>;
  updateRecord: (
    resource: Exclude<SchoolResource, "teaching-assignments" | "enrollments">,
    id: number | string,
    data: unknown,
    userId?: number
  ) => Promise<any>;
  deleteRecord: (
    resource: Exclude<SchoolResource, "enrollments">,
    id: number | string,
    userId?: number
  ) => Promise<void>;
  endTeachingAssignment: (
    id: number | string,
    endDate: string,
    userId?: number
  ) => Promise<any>;
  transferStudent: (
    memberId: number | string,
    payload: Record<string, unknown>,
    userId?: number
  ) => Promise<any>;
  withdrawStudent: (
    memberId: number | string,
    payload: Record<string, unknown>,
    userId?: number
  ) => Promise<any>;
  invalidate: (resource?: string) => void;
  clearError: (key?: string) => void;
}

function extractRowsAndMeta(payload: any): { data: any[]; pagination: PaginationMeta } {
  const container = payload?.data ?? payload;
  const rawList = Array.isArray(container)
    ? container
    : Array.isArray(container?.data)
    ? container.data
    : [];

  const meta: PaginationMeta = {
    total: typeof container?.total === "number" ? container.total : rawList.length,
    pages: typeof container?.last_page === "number" ? container.last_page : 1,
    page: typeof container?.current_page === "number" ? container.current_page : 1,
  };

  return { data: rawList, pagination: meta };
}

export const useSchoolStore = create<SchoolState>((set, get) => ({
  items: {},
  pagination: {},
  lookups: {},
  loading: {},
  error: {},
  timestamps: {},

  fetchList: async (resource, query = "", options = {}) => {
    const key = `${resource}${query ? `?${query}` : ""}`;
    const { items, timestamps, loading } = get();
    const ttl = options.ttl ?? DEFAULT_STORE_TTL;

    if (!options.force && isFresh(timestamps[key], ttl) && items[key]) {
      return items[key];
    }

    if (loading[key]) {
      return items[key] ?? [];
    }

    set((state) => ({
      loading: { ...state.loading, [key]: true },
      error: { ...state.error, [key]: null },
    }));

    try {
      const response = await schoolManagementService.list(
        resource,
        query ? (query.startsWith("?") ? query : `?${query}`) : "",
        options.userId
      );
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (json as { message?: string }).message || `Failed to fetch ${resource}.`;
        set((state) => ({
          loading: { ...state.loading, [key]: false },
          error: { ...state.error, [key]: message },
        }));
        throw new Error(message);
      }

      const { data, pagination } = extractRowsAndMeta(json);

      set((state) => ({
        items: { ...state.items, [key]: data },
        pagination: { ...state.pagination, [key]: pagination },
        timestamps: { ...state.timestamps, [key]: Date.now() },
        loading: { ...state.loading, [key]: false },
        error: { ...state.error, [key]: null },
      }));

      return data;
    } catch (err) {
      set((state) => ({
        loading: { ...state.loading, [key]: false },
        error: {
          ...state.error,
          [key]: err instanceof Error ? err.message : "Failed to load records.",
        },
      }));
      throw err;
    }
  },

  fetchLookups: async (sources, options = {}) => {
    const ttl = options.ttl ?? LONG_STORE_TTL;
    const { lookups, timestamps } = get();
    const needed = sources.filter(
      (source) => options.force || !isFresh(timestamps[`lookup:${source}`], ttl) || !lookups[source]
    );

    if (needed.length === 0) {
      return lookups;
    }

    const nextLookups = { ...lookups };
    const nextTimestamps = { ...timestamps };

    await Promise.all(
      needed.map(async (source) => {
        try {
          const res = await schoolManagementService.request(
            `${source}?per_page=100`,
            "GET",
            undefined,
            options.userId
          );
          if (res.ok) {
            const json = await res.json().catch(() => ({}));
            const { data } = extractRowsAndMeta(json);
            nextLookups[source] = data;
            nextTimestamps[`lookup:${source}`] = Date.now();
          }
        } catch {
          // Soft failure for individual lookups
        }
      })
    );

    set({
      lookups: nextLookups,
      timestamps: nextTimestamps,
    });

    return nextLookups;
  },

  createRecord: async (resource, data, userId) => {
    const res = await schoolManagementService.create(resource, data, userId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = (json as { message?: string }).message || `Failed to create ${resource}.`;
      throw new Error(message);
    }
    get().invalidate(resource);
    return json;
  },

  updateRecord: async (resource, id, data, userId) => {
    const res = await schoolManagementService.update(resource, id, data, userId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = (json as { message?: string }).message || `Failed to update ${resource}.`;
      throw new Error(message);
    }
    get().invalidate(resource);
    return json;
  },

  deleteRecord: async (resource, id, userId) => {
    const res = await schoolManagementService.delete(resource, id, userId);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const message = (json as { message?: string }).message || `Failed to delete ${resource}.`;
      throw new Error(message);
    }
    get().invalidate(resource);
  },

  endTeachingAssignment: async (id, endDate, userId) => {
    const res = await schoolManagementService.endTeachingAssignment(id, endDate, userId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = (json as { message?: string }).message || "Failed to end teaching assignment.";
      throw new Error(message);
    }
    get().invalidate("teaching-assignments");
    return json;
  },

  transferStudent: async (memberId, payload, userId) => {
    const res = await schoolManagementService.transferStudent(memberId, payload, userId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = (json as { message?: string }).message || "Failed to transfer student.";
      throw new Error(message);
    }
    get().invalidate("enrollments");
    return json;
  },

  withdrawStudent: async (memberId, payload, userId) => {
    const res = await schoolManagementService.withdrawStudent(memberId, payload, userId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = (json as { message?: string }).message || "Failed to withdraw student.";
      throw new Error(message);
    }
    get().invalidate("enrollments");
    return json;
  },

  invalidate: (resource) => {
    if (!resource) {
      set({ items: {}, pagination: {}, timestamps: {}, lookups: {} });
      return;
    }
    set((state) => {
      const nextTimestamps = { ...state.timestamps };
      const nextItems = { ...state.items };
      const nextLookups = { ...state.lookups };

      for (const key of Object.keys(nextTimestamps)) {
        if (key === resource || key.startsWith(`${resource}?`) || key === `lookup:${resource}`) {
          delete nextTimestamps[key];
          delete nextItems[key];
        }
      }
      delete nextLookups[resource];

      return {
        timestamps: nextTimestamps,
        items: nextItems,
        lookups: nextLookups,
      };
    });
  },

  clearError: (key) => {
    if (!key) {
      set({ error: {} });
    } else {
      set((state) => ({ error: { ...state.error, [key]: null } }));
    }
  },
}));
