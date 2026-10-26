"use client";

import { create } from "zustand";
import {
  membersService,
  type MemberRecord,
} from "@/services/members.service";
import {
  isFresh,
  DEFAULT_STORE_TTL,
  type CacheOptions,
} from "@/store/cacheUtils";

interface MemberPagination {
  total: number;
  last_page: number;
  current_page: number;
  per_page: number;
}

interface MemberState {
  items: MemberRecord[];
  pagination: MemberPagination | null;
  activeMember: MemberRecord | null;
  loading: boolean;
  error: string | null;
  currentQuery: string;
  timestamp: number;

  // Actions
  fetchMembers: (
    params?: Record<string, string | number>,
    options?: CacheOptions & { userId?: number }
  ) => Promise<{ items: MemberRecord[]; pagination: MemberPagination }>;
  fetchMemberDetail: (
    id: number | string,
    options?: CacheOptions & { userId?: number }
  ) => Promise<MemberRecord>;
  createMember: (
    data: Partial<MemberRecord>,
    userId?: number
  ) => Promise<MemberRecord>;
  updateMember: (
    id: number | string,
    data: Partial<MemberRecord>,
    userId?: number
  ) => Promise<MemberRecord>;
  deleteMember: (
    id: number | string,
    userId?: number
  ) => Promise<void>;
  invalidate: () => void;
  clearError: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  items: [],
  pagination: null,
  activeMember: null,
  loading: false,
  error: null,
  currentQuery: "",
  timestamp: 0,

  fetchMembers: async (params = {}, options = {}) => {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== "") searchParams.set(key, String(val));
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const { items, pagination, currentQuery, timestamp, loading } = get();
    const ttl = options.ttl ?? DEFAULT_STORE_TTL;

    if (!options.force && currentQuery === query && isFresh(timestamp, ttl) && pagination) {
      return { items, pagination };
    }

    if (loading && currentQuery === query) {
      return { items, pagination: pagination ?? { total: items.length, last_page: 1, current_page: 1, per_page: 15 } };
    }

    set({ loading: true, error: null });

    try {
      const response = await membersService.list(query, options.userId);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (json as { message?: string }).message || "Unable to load members.";
        set({ loading: false, error: message });
        throw new Error(message);
      }

      const container = (json as any)?.data ?? json;
      const rawList: MemberRecord[] = Array.isArray(container)
        ? container
        : Array.isArray(container?.data)
        ? container.data
        : [];

      const parsedPagination: MemberPagination = {
        total: typeof container?.total === "number" ? container.total : rawList.length,
        last_page: typeof container?.last_page === "number" ? container.last_page : 1,
        current_page: typeof container?.current_page === "number" ? container.current_page : 1,
        per_page: typeof container?.per_page === "number" ? container.per_page : 15,
      };

      set({
        items: rawList,
        pagination: parsedPagination,
        currentQuery: query,
        timestamp: Date.now(),
        loading: false,
        error: null,
      });

      return { items: rawList, pagination: parsedPagination };
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Error fetching members.",
      });
      throw err;
    }
  },

  fetchMemberDetail: async (id, options = {}) => {
    const { activeMember, timestamp } = get();
    const ttl = options.ttl ?? DEFAULT_STORE_TTL;

    if (!options.force && activeMember?.id === Number(id) && isFresh(timestamp, ttl)) {
      return activeMember;
    }

    set({ loading: true, error: null });

    try {
      const response = await membersService.detail(id, options.userId);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (json as { message?: string }).message || `Unable to load member #${id}.`;
        set({ loading: false, error: message });
        throw new Error(message);
      }

      const member = ((json as any)?.data ?? json) as MemberRecord;
      set({ activeMember: member, loading: false, error: null });
      return member;
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Error fetching member detail.",
      });
      throw err;
    }
  },

  createMember: async (data, userId) => {
    const response = await membersService.create(data, userId);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = (json as { message?: string }).message || "Unable to create member.";
      throw new Error(message);
    }
    get().invalidate();
    return ((json as any)?.data ?? json) as MemberRecord;
  },

  updateMember: async (id, data, userId) => {
    const response = await membersService.update(id, data, userId);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = (json as { message?: string }).message || `Unable to update member #${id}.`;
      throw new Error(message);
    }
    const updated = ((json as any)?.data ?? json) as MemberRecord;
    set((state) => ({
      items: state.items.map((m) => (m.id === Number(id) ? { ...m, ...updated } : m)),
      activeMember: state.activeMember?.id === Number(id) ? { ...state.activeMember, ...updated } : state.activeMember,
      timestamp: 0, // Invalidate list cache timestamp
    }));
    return updated;
  },

  deleteMember: async (id, userId) => {
    const response = await membersService.delete(id, userId);
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      const message = (json as { message?: string }).message || `Unable to delete member #${id}.`;
      throw new Error(message);
    }
    set((state) => ({
      items: state.items.filter((m) => m.id !== Number(id)),
      activeMember: state.activeMember?.id === Number(id) ? null : state.activeMember,
      timestamp: 0,
    }));
  },

  invalidate: () => {
    set({ timestamp: 0, currentQuery: "" });
  },

  clearError: () => {
    set({ error: null });
  },
}));
