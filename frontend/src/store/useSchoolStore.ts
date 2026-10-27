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
  extractDataAndPagination,
  extractErrorMessage,
  type CacheOptions,
  type PaginationMeta,
} from "@/store/cacheUtils";

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
    resource: Exclude<SchoolResource, "teaching-assignments">,
    id: number | string,
    data: unknown,
    userId?: number
  ) => Promise<any>;
  deleteRecord: (
    resource: SchoolResource,
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
        const message = extractErrorMessage(json, `Failed to fetch ${resource}.`);
        set((state) => ({
          loading: { ...state.loading, [key]: false },
          error: { ...state.error, [key]: message },
        }));
        throw new Error(message);
      }

      const { data, pagination } = extractDataAndPagination(json);

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
            const { data } = extractDataAndPagination(json);
            nextLookups[source] = data;
            nextTimestamps[`lookup:${source}`] = Date.now();
          }
        } catch {
          // Soft failure for individual lookups
        }
      })
    );

    set({ lookups: nextLookups, timestamps: nextTimestamps });
    return nextLookups;
  },

  createRecord: async (resource, data, userId) => {
    const res = await schoolManagementService.create(resource, data, userId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(json, `Failed to create ${resource}.`));
    }
    get().invalidate(resource);
    return json;
  },

  updateRecord: async (resource, id, data, userId) => {
    const res = await schoolManagementService.update(resource, id, data, userId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(json, `Failed to update ${resource}.`));
    }
    get().invalidate(resource);
    return json;
  },

  deleteRecord: async (resource, id, userId) => {
    const res = await schoolManagementService.delete(resource, id, userId);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(json, `Failed to delete ${resource}.`));
    }
    get().invalidate(resource);
  },

  endTeachingAssignment: async (id, endDate, userId) => {
    const res = await schoolManagementService.endTeachingAssignment(id, endDate, userId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(json, "Failed to end teaching assignment."));
    }
    get().invalidate("teaching-assignments");
    return json;
  },

  transferStudent: async (memberId, payload, userId) => {
    const res = await schoolManagementService.transferStudent(memberId, payload, userId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(json, "Failed to transfer student."));
    }
    get().invalidate("enrollments");
    return json;
  },

  withdrawStudent: async (memberId, payload, userId) => {
    const res = await schoolManagementService.withdrawStudent(memberId, payload, userId);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(extractErrorMessage(json, "Failed to withdraw student."));
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
