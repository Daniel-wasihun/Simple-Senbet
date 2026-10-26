"use client";

import { create } from "zustand";
import {
  attendanceService,
  type AttendanceFilters,
  type AttendanceSessionRecord,
} from "@/services/attendance.service";
import type {
  AttendanceSummaryData,
  AttendanceDetailSession,
  RosterStudent,
} from "@/types/auth";
import {
  isFresh,
  DEFAULT_STORE_TTL,
  type CacheOptions,
} from "@/store/cacheUtils";

interface AttendanceState {
  sessions: AttendanceSessionRecord[];
  pagination: any | null;
  summary: AttendanceSummaryData | null;
  currentSession: AttendanceDetailSession | null;
  roster: RosterStudent[];
  sessionsLoading: boolean;
  summaryLoading: boolean;
  detailLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  lastSessionFilter: string;
  sessionsTimestamp: number;
  summaryTimestamp: number;

  // Actions
  fetchSessions: (
    filters?: AttendanceFilters,
    options?: CacheOptions
  ) => Promise<{ data: AttendanceSessionRecord[]; pagination?: any }>;
  fetchSummary: (
    date?: string,
    classId?: number | string,
    options?: CacheOptions
  ) => Promise<AttendanceSummaryData | null>;
  fetchSessionDetail: (
    id: number | string,
    options?: CacheOptions
  ) => Promise<AttendanceDetailSession>;
  fetchRoster: (
    id: number | string,
    section?: string,
    options?: CacheOptions
  ) => Promise<RosterStudent[]>;
  createSession: (payload: Record<string, unknown>) => Promise<any>;
  submitSession: (id: number | string, payload: unknown) => Promise<any>;
  correctMarks: (id: number | string, payload: unknown) => Promise<any>;
  closeSession: (id: number | string) => Promise<any>;
  deleteSession: (id: number | string) => Promise<void>;
  invalidate: (target?: "sessions" | "summary" | "all") => void;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  sessions: [],
  pagination: null,
  summary: null,
  currentSession: null,
  roster: [],
  sessionsLoading: false,
  summaryLoading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
  lastSessionFilter: "",
  sessionsTimestamp: 0,
  summaryTimestamp: 0,

  fetchSessions: async (filters = {}, options = {}) => {
    const query = new URLSearchParams(
      Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();

    const { sessions, pagination, lastSessionFilter, sessionsTimestamp, sessionsLoading } = get();
    const ttl = options.ttl ?? DEFAULT_STORE_TTL;

    if (!options.force && lastSessionFilter === query && isFresh(sessionsTimestamp, ttl) && sessions.length > 0) {
      return { data: sessions, pagination };
    }

    if (sessionsLoading && lastSessionFilter === query) {
      return { data: sessions, pagination };
    }

    set({ sessionsLoading: true, error: null });

    try {
      const response = await attendanceService.list(filters);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (json as { message?: string }).message || "Unable to load attendance sessions.";
        set({ sessionsLoading: false, error: message });
        throw new Error(message);
      }

      const raw = (json as any)?.data ?? json;
      const dataList: AttendanceSessionRecord[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : [];
      const pg = (json as any)?.pagination ?? (raw as any)?.pagination ?? null;

      set({
        sessions: dataList,
        pagination: pg,
        lastSessionFilter: query,
        sessionsTimestamp: Date.now(),
        sessionsLoading: false,
        error: null,
      });

      return { data: dataList, pagination: pg };
    } catch (err) {
      set({
        sessionsLoading: false,
        error: err instanceof Error ? err.message : "Error loading sessions.",
      });
      throw err;
    }
  },

  fetchSummary: async (date = "", classId = "", options = {}) => {
    const { summary, summaryTimestamp, summaryLoading } = get();
    const ttl = options.ttl ?? DEFAULT_STORE_TTL;

    if (!options.force && isFresh(summaryTimestamp, ttl) && summary) {
      return summary;
    }

    if (summaryLoading) {
      return summary;
    }

    set({ summaryLoading: true });

    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (classId) params.set("class_id", String(classId));

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const res = await attendanceService.request(`attendance/summary${queryStr}`);
      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        const sumData = (json as any)?.data || null;
        set({ summary: sumData, summaryTimestamp: Date.now(), summaryLoading: false });
        return sumData;
      }
      set({ summaryLoading: false });
      return null;
    } catch {
      set({ summaryLoading: false });
      return null;
    }
  },

  fetchSessionDetail: async (id, options = {}) => {
    const { currentSession, detailLoading } = get();
    if (!options.force && currentSession?.id === Number(id)) {
      return currentSession;
    }

    if (detailLoading && currentSession?.id === Number(id)) {
      return currentSession;
    }

    set({ detailLoading: true, error: null });

    try {
      const response = await attendanceService.session(id);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (json as { message?: string }).message || `Failed to load attendance session #${id}.`;
        set({ detailLoading: false, error: message });
        throw new Error(message);
      }

      const sessionData = (((json as any)?.data ?? json) as unknown) as AttendanceDetailSession;
      set({ currentSession: sessionData, detailLoading: false, error: null });
      return sessionData;
    } catch (err) {
      set({
        detailLoading: false,
        error: err instanceof Error ? err.message : "Failed to load session.",
      });
      throw err;
    }
  },

  fetchRoster: async (id, section, _options = {}) => {
    try {
      const response = await attendanceService.roster(id, section);
      const json = await response.json().catch(() => ({}));

      if (response.ok) {
        const rosterData = ((json as any)?.data?.students ?? (json as any)?.students ?? []) as RosterStudent[];
        set({ roster: rosterData });
        return rosterData;
      }
      return [];
    } catch {
      return [];
    }
  },

  createSession: async (payload) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await attendanceService.create(payload);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (json as { message?: string }).message || "Unable to create attendance session.";
        throw new Error(message);
      }
      get().invalidate("all");
      return json;
    } finally {
      set({ actionLoading: false });
    }
  },

  submitSession: async (id, payload) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await attendanceService.submit(id, payload);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (json as { message?: string }).message || "Failed to submit attendance.";
        throw new Error(message);
      }
      get().invalidate("all");
      return json;
    } finally {
      set({ actionLoading: false });
    }
  },

  correctMarks: async (id, payload) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await attendanceService.correct(id, payload);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (json as { message?: string }).message || "Failed to save mark corrections.";
        throw new Error(message);
      }
      get().invalidate("all");
      return json;
    } finally {
      set({ actionLoading: false });
    }
  },

  closeSession: async (id) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await attendanceService.close(id);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (json as { message?: string }).message || "Failed to close attendance session.";
        throw new Error(message);
      }
      get().invalidate("all");
      return json;
    } finally {
      set({ actionLoading: false });
    }
  },

  deleteSession: async (id) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await attendanceService.remove(id);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const message = (json as { message?: string }).message || `Failed to delete attendance session #${id}.`;
        throw new Error(message);
      }
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== Number(id)),
        currentSession: state.currentSession?.id === Number(id) ? null : state.currentSession,
      }));
      get().invalidate("summary");
    } finally {
      set({ actionLoading: false });
    }
  },

  invalidate: (target = "all") => {
    if (target === "all" || target === "sessions") {
      set({ sessionsTimestamp: 0, lastSessionFilter: "" });
    }
    if (target === "all" || target === "summary") {
      set({ summaryTimestamp: 0 });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
