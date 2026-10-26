"use client";

import { create } from "zustand";
import {
  paymentsService,
} from "@/services/payments.service";
import {
  isFresh,
  DEFAULT_STORE_TTL,
  LONG_STORE_TTL,
  type CacheOptions,
} from "@/store/cacheUtils";

interface PaymentState {
  dashboard: any | null;
  rules: any | null;
  ledger: any[];
  ledgerPagination: any | null;
  memberHistory: Record<string, any>;
  dashboardLoading: boolean;
  ledgerLoading: boolean;
  rulesLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  currentMonth: string;
  timestamps: {
    dashboard: Record<string, number>;
    rules: number;
    ledger: Record<string, number>;
  };

  // Actions
  fetchDashboard: (
    month: string,
    options?: CacheOptions & { userId?: number }
  ) => Promise<any>;
  fetchRules: (
    options?: CacheOptions & { userId?: number }
  ) => Promise<any>;
  fetchLedger: (
    params?: Record<string, string | number>,
    options?: CacheOptions & { userId?: number }
  ) => Promise<{ data: any[]; pagination: any }>;
  fetchMemberHistory: (
    id: number | string,
    month?: string,
    options?: CacheOptions & { userId?: number }
  ) => Promise<any>;
  recordPayment: (payload: unknown, userId?: number) => Promise<any>;
  voidPayment: (id: number | string, payload: unknown, userId?: number) => Promise<any>;
  saveRules: (payload: unknown, userId?: number) => Promise<any>;
  invalidate: () => void;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  dashboard: null,
  rules: null,
  ledger: [],
  ledgerPagination: null,
  memberHistory: {},
  dashboardLoading: false,
  ledgerLoading: false,
  rulesLoading: false,
  actionLoading: false,
  error: null,
  currentMonth: "",
  timestamps: {
    dashboard: {},
    rules: 0,
    ledger: {},
  },

  fetchDashboard: async (month, options = {}) => {
    const { dashboard, currentMonth, timestamps, dashboardLoading } = get();
    const ttl = options.ttl ?? DEFAULT_STORE_TTL;

    if (!options.force && currentMonth === month && isFresh(timestamps.dashboard[month], ttl) && dashboard) {
      return dashboard;
    }

    if (dashboardLoading && currentMonth === month) {
      return dashboard;
    }

    set({ dashboardLoading: true, error: null });

    try {
      const query = month ? `?month=${encodeURIComponent(month)}` : "";
      const response = await paymentsService.dashboard(query, options.userId);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (json as { message?: string }).message || "Unable to load payments dashboard.";
        set({ dashboardLoading: false, error: message });
        throw new Error(message);
      }

      const dashData = (json as any)?.data ?? json;

      set((state) => ({
        dashboard: dashData,
        currentMonth: month,
        timestamps: {
          ...state.timestamps,
          dashboard: { ...state.timestamps.dashboard, [month]: Date.now() },
        },
        dashboardLoading: false,
        error: null,
      }));

      return dashData;
    } catch (err) {
      set({
        dashboardLoading: false,
        error: err instanceof Error ? err.message : "Error loading payments dashboard.",
      });
      throw err;
    }
  },

  fetchRules: async (options = {}) => {
    const { rules, timestamps, rulesLoading } = get();
    const ttl = options.ttl ?? LONG_STORE_TTL;

    if (!options.force && isFresh(timestamps.rules, ttl) && rules) {
      return rules;
    }

    if (rulesLoading) {
      return rules;
    }

    set({ rulesLoading: true });

    try {
      const response = await paymentsService.rules(options.userId);
      const json = await response.json().catch(() => ({}));

      if (response.ok) {
        const rulesData = (json as any)?.data ?? json;
        set((state) => ({
          rules: rulesData,
          timestamps: { ...state.timestamps, rules: Date.now() },
          rulesLoading: false,
        }));
        return rulesData;
      }
      set({ rulesLoading: false });
      return null;
    } catch {
      set({ rulesLoading: false });
      return null;
    }
  },

  fetchLedger: async (params = {}, options = {}) => {
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") searchParams.set(k, String(v));
    }
    const queryKey = searchParams.toString();
    const query = queryKey ? `?${queryKey}` : "";

    const { ledger, ledgerPagination, timestamps, ledgerLoading } = get();
    const ttl = options.ttl ?? DEFAULT_STORE_TTL;

    if (!options.force && isFresh(timestamps.ledger[queryKey], ttl) && ledger.length > 0) {
      return { data: ledger, pagination: ledgerPagination };
    }

    if (ledgerLoading) {
      return { data: ledger, pagination: ledgerPagination };
    }

    set({ ledgerLoading: true, error: null });

    try {
      const response = await paymentsService.ledger(query, options.userId);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (json as { message?: string }).message || "Unable to load payments ledger.";
        set({ ledgerLoading: false, error: message });
        throw new Error(message);
      }

      const container = (json as any)?.data ?? json;
      const rawList = Array.isArray(container)
        ? container
        : Array.isArray(container?.data)
        ? container.data
        : [];
      const pg = (json as any)?.pagination ?? (container as any)?.pagination ?? null;

      set((state) => ({
        ledger: rawList,
        ledgerPagination: pg,
        timestamps: {
          ...state.timestamps,
          ledger: { ...state.timestamps.ledger, [queryKey]: Date.now() },
        },
        ledgerLoading: false,
        error: null,
      }));

      return { data: rawList, pagination: pg };
    } catch (err) {
      set({
        ledgerLoading: false,
        error: err instanceof Error ? err.message : "Error loading ledger.",
      });
      throw err;
    }
  },

  fetchMemberHistory: async (id, month = "", options = {}) => {
    const key = `${id}:${month}`;
    const { memberHistory } = get();

    if (!options.force && memberHistory[key]) {
      return memberHistory[key];
    }

    try {
      const query = month ? `?month=${encodeURIComponent(month)}` : "";
      const response = await paymentsService.memberHistory(id, query, options.userId);
      const json = await response.json().catch(() => ({}));

      if (response.ok) {
        const historyData = (json as any)?.data ?? json;
        set((state) => ({
          memberHistory: { ...state.memberHistory, [key]: historyData },
        }));
        return historyData;
      }
      return null;
    } catch {
      return null;
    }
  },

  recordPayment: async (payload, userId) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await paymentsService.record(payload, userId);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (json as { message?: string }).message || "Unable to record payment.";
        throw new Error(message);
      }
      get().invalidate();
      return json;
    } finally {
      set({ actionLoading: false });
    }
  },

  voidPayment: async (id, payload, userId) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await paymentsService.void(id, payload, userId);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (json as { message?: string }).message || "Unable to void payment.";
        throw new Error(message);
      }
      get().invalidate();
      return json;
    } finally {
      set({ actionLoading: false });
    }
  },

  saveRules: async (payload, userId) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await paymentsService.saveRules(payload, userId);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (json as { message?: string }).message || "Unable to save payment rules.";
        throw new Error(message);
      }
      set((state) => ({
        timestamps: { ...state.timestamps, rules: 0 },
      }));
      return json;
    } finally {
      set({ actionLoading: false });
    }
  },

  invalidate: () => {
    set({
      timestamps: { dashboard: {}, rules: 0, ledger: {} },
      memberHistory: {},
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
