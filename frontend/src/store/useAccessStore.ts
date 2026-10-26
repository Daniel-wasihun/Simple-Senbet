"use client";

import { create } from "zustand";
import {
  accessManagementService,
  type AccessResource,
} from "@/services/accessManagement.service";
import {
  isFresh,
  LONG_STORE_TTL,
  extractDataAndPagination,
  extractErrorMessage,
  type CacheOptions,
} from "@/store/cacheUtils";

interface AccessState {
  users: any[];
  roles: any[];
  permissions: any[];
  rolePermissions: Record<number, any[]>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  timestamps: Record<string, number>;

  // Actions
  fetchResource: (
    resource: AccessResource,
    query?: string,
    options?: CacheOptions & { userId?: number }
  ) => Promise<any[]>;
  fetchRolePermissions: (
    roleId: number,
    options?: CacheOptions & { actorId?: number }
  ) => Promise<any[]>;
  createRecord: (
    resource: AccessResource,
    data: unknown,
    userId?: number
  ) => Promise<any>;
  updateRecord: (
    resource: AccessResource,
    id: number | string,
    data: unknown,
    userId?: number
  ) => Promise<any>;
  deleteRecord: (
    resource: AccessResource,
    id: number | string,
    userId?: number
  ) => Promise<void>;
  assignUserRoles: (
    userId: number | string,
    roleIds: number[],
    actorId?: number
  ) => Promise<any>;
  syncRolePermissions: (
    roleId: number | string,
    permissionIds: number[],
    actorId?: number
  ) => Promise<any>;
  invalidate: (resource?: AccessResource) => void;
  clearError: (resource?: string) => void;
}

export const useAccessStore = create<AccessState>((set, get) => ({
  users: [],
  roles: [],
  permissions: [],
  rolePermissions: {},
  loading: {},
  error: {},
  timestamps: {},

  fetchResource: async (resource, query = "", options = {}) => {
    const key = `${resource}${query ? `?${query}` : ""}`;
    const { timestamps, loading } = get();
    const ttl = options.ttl ?? LONG_STORE_TTL;

    const currentList = get()[resource] as any[];

    if (!options.force && isFresh(timestamps[key], ttl) && currentList.length > 0) {
      return currentList;
    }

    if (loading[key]) {
      return currentList;
    }

    set((state) => ({
      loading: { ...state.loading, [key]: true },
      error: { ...state.error, [key]: null },
    }));

    try {
      const response = await accessManagementService.list(resource, query, options.userId);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = extractErrorMessage(json, `Unable to load ${resource}.`);
        set((state) => ({
          loading: { ...state.loading, [key]: false },
          error: { ...state.error, [key]: message },
        }));
        throw new Error(message);
      }

      const { data } = extractDataAndPagination(json);

      set((state) => ({
        [resource]: data,
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
          [key]: err instanceof Error ? err.message : `Error loading ${resource}.`,
        },
      }));
      throw err;
    }
  },

  fetchRolePermissions: async (roleId, options = {}) => {
    const key = `role-perm:${roleId}`;
    const { rolePermissions, timestamps, loading } = get();
    const ttl = options.ttl ?? LONG_STORE_TTL;

    if (!options.force && isFresh(timestamps[key], ttl) && rolePermissions[roleId]) {
      return rolePermissions[roleId];
    }

    set((state) => ({ loading: { ...state.loading, [key]: true } }));

    try {
      const response = await accessManagementService.rolePermissions(roleId, options.actorId);
      const json = await response.json().catch(() => ({}));

      if (response.ok) {
        const perms = extractDataAndPagination(json).data;
        set((state) => ({
          rolePermissions: { ...state.rolePermissions, [roleId]: perms },
          timestamps: { ...state.timestamps, [key]: Date.now() },
          loading: { ...state.loading, [key]: false },
        }));
        return perms;
      }
      set((state) => ({ loading: { ...state.loading, [key]: false } }));
      return [];
    } catch {
      set((state) => ({ loading: { ...state.loading, [key]: false } }));
      return [];
    }
  },

  createRecord: async (resource, data, userId) => {
    const response = await accessManagementService.create(resource, data, userId);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(extractErrorMessage(json, `Failed to create ${resource}.`));
    }
    get().invalidate(resource);
    return json;
  },

  updateRecord: async (resource, id, data, userId) => {
    const response = await accessManagementService.update(resource, id, data, userId);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(extractErrorMessage(json, `Failed to update ${resource}.`));
    }
    get().invalidate(resource);
    return json;
  },

  deleteRecord: async (resource, id, userId) => {
    const response = await accessManagementService.delete(resource, id, userId);
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(extractErrorMessage(json, `Failed to delete ${resource}.`));
    }
    get().invalidate(resource);
  },

  assignUserRoles: async (userId, roleIds, actorId) => {
    const response = await accessManagementService.assignUserRoles(userId, roleIds, actorId);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(extractErrorMessage(json, "Failed to assign roles."));
    }
    get().invalidate("users");
    return json;
  },

  syncRolePermissions: async (roleId, permissionIds, actorId) => {
    const response = await accessManagementService.syncRolePermissions(roleId, permissionIds, actorId);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(extractErrorMessage(json, "Failed to save permissions."));
    }
    get().invalidate("roles");
    set((state) => {
      const nextPerms = { ...state.rolePermissions };
      delete nextPerms[Number(roleId)];
      return { rolePermissions: nextPerms };
    });
    return json;
  },

  invalidate: (resource) => {
    if (!resource) {
      set({ timestamps: {}, users: [], roles: [], permissions: [], rolePermissions: {} });
      return;
    }
    set((state) => {
      const nextTimestamps = { ...state.timestamps };
      for (const k of Object.keys(nextTimestamps)) {
        if (k.startsWith(resource)) delete nextTimestamps[k];
      }
      return {
        [resource]: [],
        timestamps: nextTimestamps,
      };
    });
  },

  clearError: (resource) => {
    if (!resource) {
      set({ error: {} });
    } else {
      set((state) => ({ error: { ...state.error, [resource]: null } }));
    }
  },
}));
