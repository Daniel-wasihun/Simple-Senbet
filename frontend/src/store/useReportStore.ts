"use client";

import { create } from "zustand";
import {
  reportsService,
} from "@/services/reports.service";
import {
  isFresh,
  LONG_STORE_TTL,
  type CacheOptions,
} from "@/store/cacheUtils";

interface ReportState {
  classGradebooks: Record<string, any>;
  studentReports: Record<string, any>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  timestamps: Record<string, number>;

  // Actions
  fetchClassGradebook: (
    classId: number | string,
    query?: string,
    options?: CacheOptions & { userId?: number }
  ) => Promise<any>;
  fetchStudentReport: (
    studentId: number | string,
    options?: CacheOptions & { userId?: number }
  ) => Promise<any>;
  invalidate: (key?: string) => void;
  clearError: (key?: string) => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  classGradebooks: {},
  studentReports: {},
  loading: {},
  error: {},
  timestamps: {},

  fetchClassGradebook: async (classId, query = "", options = {}) => {
    const key = `class:${classId}:${query}`;
    const { classGradebooks, timestamps, loading } = get();
    const ttl = options.ttl ?? LONG_STORE_TTL;

    if (!options.force && isFresh(timestamps[key], ttl) && classGradebooks[key]) {
      return classGradebooks[key];
    }

    if (loading[key]) {
      return classGradebooks[key];
    }

    set((state) => ({
      loading: { ...state.loading, [key]: true },
      error: { ...state.error, [key]: null },
    }));

    try {
      const q = query ? (query.startsWith("?") ? query : `?${query}`) : "";
      const response = await reportsService.classGradebook(classId, q, options.userId);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (json as { message?: string }).message || "Unable to load class gradebook.";
        set((state) => ({
          loading: { ...state.loading, [key]: false },
          error: { ...state.error, [key]: message },
        }));
        throw new Error(message);
      }

      const reportData = (json as any)?.data ?? json;

      set((state) => ({
        classGradebooks: { ...state.classGradebooks, [key]: reportData },
        timestamps: { ...state.timestamps, [key]: Date.now() },
        loading: { ...state.loading, [key]: false },
        error: { ...state.error, [key]: null },
      }));

      return reportData;
    } catch (err) {
      set((state) => ({
        loading: { ...state.loading, [key]: false },
        error: {
          ...state.error,
          [key]: err instanceof Error ? err.message : "Error loading gradebook.",
        },
      }));
      throw err;
    }
  },

  fetchStudentReport: async (studentId, options = {}) => {
    const key = `student:${studentId}`;
    const { studentReports, timestamps, loading } = get();
    const ttl = options.ttl ?? LONG_STORE_TTL;

    if (!options.force && isFresh(timestamps[key], ttl) && studentReports[key]) {
      return studentReports[key];
    }

    if (loading[key]) {
      return studentReports[key];
    }

    set((state) => ({
      loading: { ...state.loading, [key]: true },
      error: { ...state.error, [key]: null },
    }));

    try {
      const response = await reportsService.studentReport(studentId, options.userId);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (json as { message?: string }).message || "Unable to load student report card.";
        set((state) => ({
          loading: { ...state.loading, [key]: false },
          error: { ...state.error, [key]: message },
        }));
        throw new Error(message);
      }

      const reportData = (json as any)?.data ?? json;

      set((state) => ({
        studentReports: { ...state.studentReports, [key]: reportData },
        timestamps: { ...state.timestamps, [key]: Date.now() },
        loading: { ...state.loading, [key]: false },
        error: { ...state.error, [key]: null },
      }));

      return reportData;
    } catch (err) {
      set((state) => ({
        loading: { ...state.loading, [key]: false },
        error: {
          ...state.error,
          [key]: err instanceof Error ? err.message : "Error loading student report.",
        },
      }));
      throw err;
    }
  },

  invalidate: (key) => {
    if (!key) {
      set({ classGradebooks: {}, studentReports: {}, timestamps: {} });
      return;
    }
    set((state) => {
      const nextTimestamps = { ...state.timestamps };
      const nextGradebooks = { ...state.classGradebooks };
      const nextReports = { ...state.studentReports };

      delete nextTimestamps[key];
      delete nextGradebooks[key];
      delete nextReports[key];

      return {
        timestamps: nextTimestamps,
        classGradebooks: nextGradebooks,
        studentReports: nextReports,
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
