"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Eye,
  Key,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AdminModal } from "@/components/admin/AdminModal";
import { accessManagementService } from "@/services/accessManagement.service";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { TableShimmerSkeleton, AccessManagementShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";
import { AppSelect } from "@/components/ui/AppSelect";
import { LocalizedFieldInput, SupportedLocale } from "@/components/admin/LocalizedFieldInput";
import { toast } from "sonner";
import {
  btnBase,
  btnDanger,
  btnPrimary,
  btnSecondary,
  inputCls,
  labelCls,
  tableContainerCls,
  tableHeaderCellCls,
  tableHeaderRowCls,
  tableRowCls,
  actionBtnEdit,
  actionBtnDelete,
  modalStickyFooter,
  cardCls,
  detailCardCls,
} from "@/components/admin/adminUiTokens";

type AccessTab = "users" | "roles" | "permissions";

type RoleRecord = {
  id: number;
  name: string;
  label?: Record<string, string> | string;
  permissions?: PermissionRecord[] | { data?: PermissionRecord[] };
  users_count?: number;
};

type PermissionRecord = {
  id: number;
  name: string;
  group_name: string;
  label?: Record<string, string> | string;
  description?: Record<string, string> | string | null;
};

type UserRecord = {
  id: number;
  name: string;
  email: string;
  roles?: string[] | Array<{ id: number; name: string }>;
  role?: string | { id: number; name: string };
};

type PermissionDraft = {
  name: string;
  group_name: string;
  label: { en: string; am: string; om: string };
};

type RoleDraft = {
  name: string;
  label: { en: string; am: string; om: string };
};

const blankPermission: PermissionDraft = {
  name: "members.view",
  group_name: "members",
  label: { en: "View Members", am: "አባላትን ይመልከቱ", om: "Miseensota ilaali" },
};

export const STANDARD_PERMISSION_MODULES = [
  { value: "members", label: "Members & Registry (members)" },
  { value: "attendance", label: "Attendance & Sessions (attendance)" },
  { value: "academic-years", label: "Academic Years (academic-years)" },
  { value: "school-classes", label: "School Classes (school-classes)" },
  { value: "courses", label: "Courses & Curriculum (courses)" },
  { value: "teaching-assignments", label: "Teaching Assignments (teaching-assignments)" },
  { value: "student-enrollments", label: "Student Enrollments (student-enrollments)" },
  { value: "assessments", label: "Assessments & Tests (assessments)" },
  { value: "assessment-results", label: "Assessment Results (assessment-results)" },
  { value: "promotions", label: "Student Promotions (promotions)" },
  { value: "payments", label: "Finance & Payments (payments)" },
  { value: "reports", label: "Reports & Gradebooks (reports)" },
  { value: "users", label: "User Accounts (users)" },
  { value: "roles", label: "Security Roles (roles)" },
  { value: "permissions", label: "Permissions Catalogue (permissions)" },
  { value: "profile", label: "User Profile (profile)" },
];

export const STANDARD_PERMISSION_ACTIONS = [
  { value: "view", label: "View / Read (view)" },
  { value: "create", label: "Create / Register (create)" },
  { value: "update", label: "Update / Edit (update)" },
  { value: "delete", label: "Delete / Remove (delete)" },
  { value: "manage", label: "Manage Full Module (manage)" },
  { value: "export", label: "Export Reports (export)" },
  { value: "assign", label: "Assign Allocations (assign)" },
  { value: "submit", label: "Submit Marks / Data (submit)" },
  { value: "record", label: "Record Data / Payments (record)" },
  { value: "close", label: "Close Session (close)" },
  { value: "correct", label: "Correct Marks (correct)" },
  { value: "override", label: "Override Lock Windows (override)" },
  { value: "void", label: "Void / Invalidate Records (void)" },
  { value: "rules", label: "Configure Rules (rules)" },
  { value: "view.all", label: "View Across All Classes (view.all)" },
  { value: "record.all", label: "Record Across All Classes (record.all)" },
  { value: "export.all", label: "Export Across All Classes (export.all)" },
];

function generateDefaultLabel(mod: string, act: string): string {
  const actName = act.replace(".all", " (All Classes)").replace(".", " ");
  const actCap = actName.charAt(0).toUpperCase() + actName.slice(1);
  const modName = mod.replace("-", " ");
  const modCap = modName.charAt(0).toUpperCase() + modName.slice(1);
  return `${actCap} ${modCap}`;
}

const blankRole: RoleDraft = {
  name: "",
  label: { en: "", am: "", om: "" },
};

function listFrom<T>(payload: unknown, key?: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const result =
    (key ? record[key] : undefined) ??
    record.data ??
    record.roles ??
    record.permissions ??
    record.users;
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && Array.isArray((result as Record<string, unknown>).data)) {
    return (result as { data: T[] }).data;
  }
  return [];
}

function labelValue(value: PermissionRecord["label"] | RoleRecord["label"], language: string): string {
  if (typeof value === "string") return value;
  if (!value) return "";
  return value[language] ?? value.en ?? Object.values(value)[0] ?? "";
}

export function AccessManagementWorkspace({ initialTab }: { initialTab: AccessTab }) {
  const { user, refreshUser } = useAuth();
  const { t, currentLocale } = useTranslation();

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const r = (user.role || "").toLowerCase();
    const roles = (user.roles || []).map((x: any) =>
      (typeof x === "string" ? x : x.name || "").toLowerCase()
    );
    return r === "superadmin" || roles.includes("superadmin");
  }, [user]);

  const granted = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const can = useCallback(
    (permission: string) => {
      if (isSuperAdmin) return true;
      return granted.has(permission) || granted.has("*");
    },
    [isSuperAdmin, granted]
  );

  const canViewUsers = can("users.view");
  const canViewRoles = can("roles.view");
  const canViewPermissions = can("permissions.view") || canViewRoles;
  const canAssignRoles = can("roles.assign") && canViewRoles;
  const canAssignPermissions = can("permissions.assign") && canViewRoles && canViewPermissions;
  const canCreateUser = can("users.create") && canAssignRoles;

  const [tab, setTab] = useState<AccessTab>(initialTab);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [permissionAssignmentOpen, setPermissionAssignmentOpen] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* Users state */
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "student",
  });
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userEditDraft, setUserEditDraft] = useState({ name: "", email: "" });
  const [roleAssignmentUser, setRoleAssignmentUser] = useState<UserRecord | null>(null);
  const [roleSelections, setRoleSelections] = useState<Record<number, number[]>>({});
  const [roleSearch, setRoleSearch] = useState("");

  /* Roles state */
  const [roleDraft, setRoleDraft] = useState<RoleDraft>(blankRole);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [roleEntryLanguage, setRoleEntryLanguage] = useState<SupportedLocale>("en");

  /* Permissions state */
  const [permissionSearchCatalogue, setPermissionSearchCatalogue] = useState("");
  const [permissionGroupFilter, setPermissionGroupFilter] = useState("all");
  const [permModule, setPermModule] = useState<string>("members");
  const [permAction, setPermAction] = useState<string>("view");
  const [permissionDraft, setPermissionDraft] = useState<PermissionDraft>(blankPermission);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionRecord | null>(null);
  const [permissionEntryLanguage, setPermissionEntryLanguage] = useState<SupportedLocale>("en");

  /* Confirmation */
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  const request = useCallback(
    async (path: string, method = "GET", body?: unknown) => {
      const response = await accessManagementService.request(path, method, body, user?.id);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || t("administration.requestFailed"));
      return payload as Record<string, unknown>;
    },
    [user?.id, t]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const jobs: Array<Promise<void>> = [];
      if (canViewUsers) {
        jobs.push(
          request("users").then((data) => {
            const result = listFrom<UserRecord>(data, "users");
            setUsers(result);
          })
        );
      }
      if (canViewRoles) {
        jobs.push(
          request("roles").then((data) => {
            const result = listFrom<RoleRecord>(data);
            setRoles(result);
            setActiveRoleId((current) => current ?? result[0]?.id ?? null);
          })
        );
      }
      if (canViewPermissions) {
        jobs.push(
          request("permissions?per_page=150").then((data) =>
            setPermissions(listFrom<PermissionRecord>(data))
          )
        );
      }
      await Promise.all(jobs);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("administration.requestFailed"));
    } finally {
      setLoading(false);
    }
  }, [canViewPermissions, canViewRoles, canViewUsers, request, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const rolePermissions = useMemo(() => {
    const selected = roles.find((role) => role.id === activeRoleId)?.permissions;
    if (Array.isArray(selected)) return selected.map((permission) => permission.id);
    return selected?.data?.map((permission) => permission.id) ?? [];
  }, [activeRoleId, roles]);

  useEffect(() => {
    setSelectedPermissionIds(rolePermissions);
  }, [rolePermissions]);

  const saveAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
    refreshSession = false
  ) => {
    setSaving(true);
    setError("");
    try {
      await action();
      toast.success(successMessage);
      await load();
      if (refreshSession) await refreshUser();
      return true;
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : t("administration.requestFailed");
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  /* ── User Form Submissions ───────────────────────────────────────── */
  const submitNewUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateUser) return;
    const saved = await saveAction(
      () => request("users", "POST", newUser),
      t("administration.userCreated", { defaultValue: "User account created successfully." })
    );
    if (saved) {
      setNewUser({ name: "", email: "", password: "", password_confirmation: "", role: "student" });
      setCreateUserOpen(false);
    }
  };

  const submitEditUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;
    const saved = await saveAction(
      () => request(`users/${editingUser.id}`, "PUT", userEditDraft),
      t("administration.userUpdated", { defaultValue: "User account updated." })
    );
    if (saved) setEditingUser(null);
  };

  /* ── Role Form Submissions ───────────────────────────────────────── */
  const submitRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingRole === null && !can("roles.create")) return;
    if (editingRole !== null && !can("roles.update")) return;
    if (!roleDraft.label.en?.trim() && !roleDraft.label.am?.trim() && !roleDraft.label.om?.trim()) {
      setError("Display name is required in at least one language.");
      return;
    }
    const isEditing = editingRole !== null;
    const enLabel = roleDraft.label.en?.trim() || roleDraft.label.am?.trim() || roleDraft.label.om?.trim() || "";
    const cleanDraft = {
      name: roleDraft.name.trim(),
      label: {
        en: enLabel,
        ...(roleDraft.label.am?.trim() ? { am: roleDraft.label.am.trim() } : {}),
        ...(roleDraft.label.om?.trim() ? { om: roleDraft.label.om.trim() } : {}),
      },
    };
    const result = await saveAction(
      () => request(isEditing ? `roles/${editingRole}` : "roles", isEditing ? "PUT" : "POST", cleanDraft),
      isEditing ? "Role updated successfully." : "Role created successfully."
    );
    if (result) {
      setRoleFormOpen(false);
      setEditingRole(null);
      setRoleDraft(blankRole);
    }
  };

  /* ── Permission Form Submissions ─────────────────────────────────── */
  const submitPermission = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!can("permissions.create")) return;
    const mergedKey = `${permModule.trim()}.${permAction.trim()}`;
    const enLabel =
      permissionDraft.label.en?.trim() ||
      permissionDraft.label.am?.trim() ||
      permissionDraft.label.om?.trim() ||
      generateDefaultLabel(permModule, permAction);
    const cleanDraft = {
      name: mergedKey,
      group_name: permModule.trim(),
      label: {
        en: enLabel,
        ...(permissionDraft.label.am?.trim() ? { am: permissionDraft.label.am.trim() } : {}),
        ...(permissionDraft.label.om?.trim() ? { om: permissionDraft.label.om.trim() } : {}),
      },
    };
    const saved = await saveAction(
      () => request("permissions", "POST", cleanDraft),
      "Permission created successfully."
    );
    if (saved) {
      setPermissionDraft(blankPermission);
      setPermissionOpen(false);
    }
  };

  const submitEditPermission = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPermission) return;
    const mergedKey = `${permModule.trim()}.${permAction.trim()}`;
    const enLabel =
      permissionDraft.label.en?.trim() ||
      permissionDraft.label.am?.trim() ||
      permissionDraft.label.om?.trim() ||
      generateDefaultLabel(permModule, permAction);
    const cleanDraft = {
      name: mergedKey,
      group_name: permModule.trim(),
      label: {
        en: enLabel,
        ...(permissionDraft.label.am?.trim() ? { am: permissionDraft.label.am.trim() } : {}),
        ...(permissionDraft.label.om?.trim() ? { om: permissionDraft.label.om.trim() } : {}),
      },
    };
    const saved = await saveAction(
      () => request(`permissions/${editingPermission.id}`, "PUT", cleanDraft),
      "Permission updated successfully."
    );
    if (saved) setEditingPermission(null);
  };

  /* ── Helpers ─────────────────────────────────────────────────────── */
  const availableTabs: AccessTab[] = [
    ...(canViewUsers ? ["users" as const] : []),
    ...(canViewRoles ? ["roles" as const] : []),
    ...(canViewPermissions ? ["permissions" as const] : []),
  ];

  useEffect(() => {
    if (!availableTabs.includes(tab) && availableTabs.length) setTab(availableTabs[0]);
  }, [tab, availableTabs]);

  const roleLabel = (role: RoleRecord) => labelValue(role.label, currentLocale) || role.name;

  const assignmentRoleIds = roleAssignmentUser
    ? roleSelections[roleAssignmentUser.id] ??
      roles
        .filter((role) => {
          const assigned = Array.isArray(roleAssignmentUser.roles)
            ? roleAssignmentUser.roles.map((item) => (typeof item === "string" ? item : item.name))
            : typeof roleAssignmentUser.role === "string"
              ? [roleAssignmentUser.role]
              : [];
          return assigned.includes(role.name);
        })
        .map((role) => role.id)
    : [];

  const openRoleAssignment = (entry: UserRecord, currentIds: number[]) => {
    setRoleSelections((current) => ({ ...current, [entry.id]: current[entry.id] ?? currentIds }));
    setRoleSearch("");
    setRoleAssignmentUser(entry);
  };

  /* Filtered users */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !userSearch.trim() ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const assigned = Array.isArray(u.roles)
        ? u.roles.map((r) => (typeof r === "string" ? r : r.name))
        : typeof u.role === "string"
          ? [u.role]
          : [];
      const matchRole = userRoleFilter === "all" || assigned.includes(userRoleFilter);
      return matchSearch && matchRole;
    });
  }, [users, userSearch, userRoleFilter]);

  /* Unique permission groups */
  const permissionGroups = useMemo(() => {
    const set = new Set(permissions.map((p) => p.group_name).filter(Boolean));
    return Array.from(set).sort();
  }, [permissions]);

  const availableModuleOptions = useMemo(() => {
    const map = new Map<string, string>();
    STANDARD_PERMISSION_MODULES.forEach((m) => map.set(m.value, m.label));
    permissions.forEach((p) => {
      if (p.group_name && !map.has(p.group_name)) {
        map.set(
          p.group_name,
          `${p.group_name.charAt(0).toUpperCase() + p.group_name.slice(1)} (${p.group_name})`
        );
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [permissions]);

  const availableActionOptions = useMemo(() => {
    const map = new Map<string, string>();
    STANDARD_PERMISSION_ACTIONS.forEach((a) => map.set(a.value, a.label));
    permissions.forEach((p) => {
      const parts = p.name.split(".");
      if (parts.length > 1) {
        const actionPart = parts.slice(1).join(".");
        if (!map.has(actionPart)) {
          map.set(
            actionPart,
            `${actionPart.charAt(0).toUpperCase() + actionPart.slice(1)} (${actionPart})`
          );
        }
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [permissions]);

  /* Filtered permissions catalogue */
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const matchSearch =
        !permissionSearchCatalogue.trim() ||
        p.name.toLowerCase().includes(permissionSearchCatalogue.toLowerCase()) ||
        labelValue(p.label, currentLocale).toLowerCase().includes(permissionSearchCatalogue.toLowerCase());
      const matchGroup =
        permissionGroupFilter === "all" || p.group_name === permissionGroupFilter;
      return matchSearch && matchGroup;
    });
  }, [permissions, permissionSearchCatalogue, permissionGroupFilter, currentLocale]);

  if (!availableTabs.length) {
    return (
      <section className="m-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111624] p-8 text-center text-sm text-slate-500">
        {t("administration.accessDenied", { defaultValue: "Access denied to administration workspace." })}
      </section>
    );
  }

  if (loading && !roles.length && !users.length) {
    return <AccessManagementShimmerSkeleton />;
  }

  return (
    <main className="w-full space-y-5 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-7">
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            System Security & Access
          </p>
          <h1 className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {t("administration.title", { defaultValue: "Access Control & Identity" })}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {users.length} registered accounts · {roles.length} system roles · {permissions.length} security permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={btnSecondary}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {t("administration.refresh", { defaultValue: "Refresh" })}
          </button>
          {tab === "users" && canCreateUser && (
            <button
              type="button"
              onClick={() => setCreateUserOpen(true)}
              className={btnPrimary}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("administration.addUser", { defaultValue: "Add User" })}
            </button>
          )}
          {tab === "roles" && can("roles.create") && (
            <button
              type="button"
              onClick={() => {
                setEditingRole(null);
                setRoleDraft(blankRole);
                setRoleFormOpen(true);
              }}
              className={btnPrimary}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("administration.createRole", { defaultValue: "Create Role" })}
            </button>
          )}
          {tab === "permissions" && can("permissions.create") && (
            <button
              type="button"
              onClick={() => {
                setPermModule("members");
                setPermAction("view");
                setPermissionDraft({
                  name: "members.view",
                  group_name: "members",
                  label: { en: "View Members", am: "አባላትን ይመልከቱ", om: "Miseensota ilaali" },
                });
                setPermissionOpen(true);
              }}
              className={btnPrimary}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("administration.addPermission", { defaultValue: "Add Permission" })}
            </button>
          )}
        </div>
      </header>

      {/* ─── Workspace Tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1.5 border-b border-slate-200/90 dark:border-slate-800 pb-3" role="tablist">
        {canViewUsers && (
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`${btnBase} ${
              tab === "users"
                ? "bg-[#0858a8] text-white shadow-2xs"
                : "border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Users & Accounts</span>
          </button>
        )}
        {canViewRoles && (
          <button
            type="button"
            onClick={() => setTab("roles")}
            className={`${btnBase} ${
              tab === "roles"
                ? "bg-[#0858a8] text-white shadow-2xs"
                : "border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Roles & Assignments</span>
          </button>
        )}
        {canViewPermissions && (
          <button
            type="button"
            onClick={() => setTab("permissions")}
            className={`${btnBase} ${
              tab === "permissions"
                ? "bg-[#0858a8] text-white shadow-2xs"
                : "border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>Permissions Catalogue</span>
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: USERS                                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab === "users" && canViewUsers && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name or email…"
                  className="h-9 w-full rounded-[4px] border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0858a8] focus:border-[#0858a8] shadow-2xs"
                />
              </div>

              {roles.length > 0 && (
                <div className="w-44">
                  <AppSelect
                    value={userRoleFilter}
                    onChange={(v) => setUserRoleFilter(v)}
                    options={[
                      { value: "all", label: "Role: All" },
                      ...roles.map((r) => ({ value: r.name, label: roleLabel(r) })),
                    ]}
                    size="sm"
                    ariaLabel="Filter by role"
                  />
                </div>
              )}

              {(userSearch || userRoleFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setUserSearch("");
                    setUserRoleFilter("all");
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-[4px] px-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Reset filters"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className={tableContainerCls}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className={tableHeaderRowCls}>
                  <tr>
                    <th className={tableHeaderCellCls}>User</th>
                    <th className={tableHeaderCellCls}>Email Address</th>
                    <th className={tableHeaderCellCls}>Role Access</th>
                    <th className={`${tableHeaderCellCls} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-14 text-center text-sm text-slate-500 dark:text-slate-400">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((entry) => {
                      const assigned = Array.isArray(entry.roles)
                        ? entry.roles.map((r) => (typeof r === "string" ? r : r.name))
                        : typeof entry.role === "string"
                          ? [entry.role]
                          : [];
                      const ids =
                        roleSelections[entry.id] ??
                        roles.filter((role) => assigned.includes(role.name)).map((role) => role.id);

                      return (
                        <tr key={entry.id} className={tableRowCls(false)}>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                              {entry.name}
                            </span>
                            {entry.id === user?.id && (
                              <span className="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                You
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {entry.email}
                          </td>
                          <td className="py-3 px-4">
                            {canAssignRoles ? (
                              <button
                                type="button"
                                onClick={() => openRoleAssignment(entry, ids)}
                                className="inline-flex h-7 items-center gap-1.5 rounded-[4px] border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <UserCheck className="h-3 w-3 text-blue-600 dark:text-sky-400" />
                                <span>Manage Roles ({ids.length})</span>
                              </button>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {assigned.map((name) => (
                                  <span
                                    key={name}
                                    className="rounded-[3px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                                  >
                                    {roles.find((r) => r.name === name)
                                      ? roleLabel(roles.find((r) => r.name === name)!)
                                      : name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {can("users.update") && entry.id !== user?.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUser(entry);
                                    setUserEditDraft({ name: entry.name, email: entry.email });
                                  }}
                                  title="Edit User"
                                  className={actionBtnEdit}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {can("users.delete") && entry.id !== user?.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingConfirmation({
                                      title: `Delete User: ${entry.name}`,
                                      description: `Are you sure you want to delete ${entry.name} (${entry.email})? This action cannot be undone.`,
                                      action: () =>
                                        void saveAction(
                                          () => request(`users/${entry.id}`, "DELETE"),
                                          "User account deleted."
                                        ),
                                    });
                                  }}
                                  title="Delete User"
                                  className={actionBtnDelete}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ROLES & ASSIGNMENTS                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab === "roles" && canViewRoles && (
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* Roles Selector Sidebar */}
          <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-3 shadow-xs">
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Configured Roles ({roles.length})
              </span>
              {can("roles.create") && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRole(null);
                    setRoleDraft(blankRole);
                    setRoleFormOpen(true);
                  }}
                  className="rounded-[4px] p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 cursor-pointer"
                  title="Create Role"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setActiveRoleId(role.id)}
                  className={`w-full flex items-center justify-between rounded-[4px] px-3 py-2.5 text-left transition cursor-pointer ${
                    activeRoleId === role.id
                      ? "bg-blue-50/80 text-blue-900 font-semibold dark:bg-blue-950/60 dark:text-blue-200 border-l-2 border-[#0858a8]"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-semibold">{roleLabel(role)}</span>
                    <span className="block text-[11px] text-slate-400 font-normal">
                      {role.users_count ?? 0} assigned users
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {Array.isArray(role.permissions)
                      ? role.permissions.length
                      : role.permissions?.data?.length ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Role Permissions Card */}
          <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-5 shadow-xs">
            {activeRoleId !== null && roles.find((r) => r.id === activeRoleId) ? (
              (() => {
                const role = roles.find((r) => r.id === activeRoleId)!;
                return (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                          {roleLabel(role)}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Key: <code className="font-mono text-blue-600 dark:text-sky-400">{role.name}</code>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {role.name !== "superadmin" && can("roles.update") && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRole(role.id);
                              setRoleDraft({
                                name: role.name,
                                label: {
                                  en: labelValue(role.label, "en"),
                                  am: labelValue(role.label, "am"),
                                  om: labelValue(role.label, "om"),
                                },
                              });
                              setRoleFormOpen(true);
                            }}
                            className={btnSecondary}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit Role</span>
                          </button>
                        )}
                        {role.name !== "superadmin" && can("roles.delete") && (
                          <button
                            type="button"
                            disabled={(role.users_count ?? 0) > 0}
                            onClick={() => {
                              setPendingConfirmation({
                                title: `Delete Role: ${role.name}`,
                                description: `Are you sure you want to remove the role ${roleLabel(role)}? This action cannot be undone.`,
                                action: () =>
                                  void saveAction(
                                    () => request(`roles/${role.id}`, "DELETE"),
                                    "Role deleted successfully."
                                  ),
                              });
                            }}
                            className={btnDanger}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                        {canAssignPermissions && role.name !== "superadmin" && (
                          <button
                            type="button"
                            onClick={() => {
                              setPermissionSearch("");
                              setPermissionAssignmentOpen(true);
                            }}
                            className={btnPrimary}
                          >
                            <Key className="h-3.5 w-3.5" />
                            <span>Manage Permissions</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Granted Permissions (
                        {Array.isArray(role.permissions)
                          ? role.permissions.length
                          : role.permissions?.data?.length ?? 0}
                        )
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {(Array.isArray(role.permissions) ? role.permissions : role.permissions?.data ?? []).map(
                          (p) => (
                            <div
                              key={p.id}
                              className="rounded-[4px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-2.5"
                            >
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {labelValue(p.label, currentLocale) || p.name}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.name}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="py-12 text-center text-xs text-slate-400">
                Select a role from the left sidebar to inspect and configure permissions.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: PERMISSIONS CATALOGUE                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tab === "permissions" && canViewPermissions && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={permissionSearchCatalogue}
                  onChange={(e) => setPermissionSearchCatalogue(e.target.value)}
                  placeholder="Search permissions by identifier or label…"
                  className="h-9 w-full rounded-[4px] border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0858a8] focus:border-[#0858a8] shadow-2xs"
                />
              </div>

              {permissionGroups.length > 0 && (
                <div className="w-44">
                  <AppSelect
                    value={permissionGroupFilter}
                    onChange={(v) => setPermissionGroupFilter(v)}
                    options={[
                      { value: "all", label: "Group: All" },
                      ...permissionGroups.map((g) => ({ value: g, label: g })),
                    ]}
                    size="sm"
                    ariaLabel="Filter by group"
                  />
                </div>
              )}

              {(permissionSearchCatalogue || permissionGroupFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setPermissionSearchCatalogue("");
                    setPermissionGroupFilter("all");
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-[4px] px-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Reset filters"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          <div className={tableContainerCls}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className={tableHeaderRowCls}>
                  <tr>
                    <th className={tableHeaderCellCls}>Display Name</th>
                    <th className={tableHeaderCellCls}>System Code</th>
                    <th className={tableHeaderCellCls}>Security Group</th>
                    <th className={`${tableHeaderCellCls} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-14 text-center text-sm text-slate-500 dark:text-slate-400">
                        No permissions found.
                      </td>
                    </tr>
                  ) : (
                    filteredPermissions.map((permission) => (
                      <tr key={permission.id} className={tableRowCls(false)}>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {labelValue(permission.label, currentLocale) || permission.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-blue-600 dark:text-sky-400">
                          {permission.name}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center rounded px-2 py-0.5 bg-slate-100 dark:bg-slate-800">
                            {permission.group_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {can("permissions.update") && (
                              <button
                                type="button"
                                onClick={() => {
                                  const parts = permission.name.split(".");
                                  const mod = parts[0] || permission.group_name || "members";
                                  const act = parts.slice(1).join(".") || "view";
                                  setPermModule(mod);
                                  setPermAction(act);
                                  setEditingPermission(permission);
                                  setPermissionDraft({
                                    name: permission.name,
                                    group_name: permission.group_name,
                                    label: {
                                      en: labelValue(permission.label, "en"),
                                      am: labelValue(permission.label, "am"),
                                      om: labelValue(permission.label, "om"),
                                    },
                                  });
                                }}
                                title="Edit Permission"
                                className={actionBtnEdit}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {can("permissions.delete") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingConfirmation({
                                    title: `Delete Permission: ${permission.name}`,
                                    description: `Are you sure you want to delete permission '${permission.name}'?`,
                                    action: () =>
                                      void saveAction(
                                        () => request(`permissions/${permission.id}`, "DELETE"),
                                        "Permission deleted."
                                      ),
                                  });
                                }}
                                title="Delete Permission"
                                className={actionBtnDelete}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add User ─────────────────────────────────────────── */}
      {createUserOpen && (
        <AdminModal
          open={createUserOpen}
          onOpenChange={(o) => {
            if (!o) setCreateUserOpen(false);
          }}
          title="Create New User Account"
          description="Provision a new administrative, teacher, or student account."
          size="lg"
        >
          <form onSubmit={(e) => void submitNewUser(e)} className="space-y-4 p-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Samuel Bekele"
                  className={inputCls()}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@senbet.org"
                  className={inputCls()}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Primary Role <span className="text-rose-500">*</span>
                </label>
                <AppSelect
                  value={newUser.role}
                  onChange={(v) => setNewUser({ ...newUser, role: v })}
                  options={roles
                    .filter(
                      (role) =>
                        ["student", "teacher", "superadmin", "admin"].includes(role.name) &&
                        (role.name !== "superadmin" || isSuperAdmin)
                    )
                    .map((role) => ({ value: role.name, label: roleLabel(role) }))}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••••••"
                  className={inputCls()}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={newUser.password_confirmation}
                  onChange={(e) => setNewUser({ ...newUser, password_confirmation: e.target.value })}
                  placeholder="••••••••••••"
                  className={inputCls()}
                />
              </div>
            </div>

            <div className={modalStickyFooter}>
              <button
                type="button"
                onClick={() => setCreateUserOpen(false)}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Creating…" : "Create User"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ─── MODAL: Edit User ────────────────────────────────────────── */}
      {editingUser && (
        <AdminModal
          open={Boolean(editingUser)}
          onOpenChange={(o) => {
            if (!o) setEditingUser(null);
          }}
          title={`Edit Account: ${editingUser.name}`}
          description="Update identity details for this user."
          size="md"
        >
          <form onSubmit={(e) => void submitEditUser(e)} className="space-y-4 p-1">
            <div>
              <label className={labelCls}>Full Name</label>
              <input
                required
                value={userEditDraft.name}
                onChange={(e) => setUserEditDraft({ ...userEditDraft, name: e.target.value })}
                className={inputCls()}
              />
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <input
                required
                type="email"
                value={userEditDraft.email}
                onChange={(e) => setUserEditDraft({ ...userEditDraft, email: e.target.value })}
                className={inputCls()}
              />
            </div>

            <div className={modalStickyFooter}>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ─── MODAL: Manage User Roles ────────────────────────────────── */}
      {roleAssignmentUser && (
        <AdminModal
          open={Boolean(roleAssignmentUser)}
          onOpenChange={(o) => {
            if (!o && !saving) setRoleAssignmentUser(null);
          }}
          title={`Role Assignments: ${roleAssignmentUser.name}`}
          description="Select the security roles assigned to this user."
          size="md"
        >
          <div className="space-y-4 p-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Search roles…"
                className="h-9 w-full rounded-[4px] border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0858a8] focus:border-[#0858a8] shadow-2xs"
              />
            </div>

            <div className="max-h-[50vh] space-y-1 overflow-y-auto rounded-[4px] border border-slate-200/90 dark:border-slate-800 p-2">
              {roles
                .filter(
                  (role) =>
                    (isSuperAdmin || role.name !== "superadmin" || assignmentRoleIds.includes(role.id)) &&
                    `${role.name} ${roleLabel(role)}`.toLowerCase().includes(roleSearch.toLowerCase())
                )
                .map((role) => {
                  const checked = assignmentRoleIds.includes(role.id);
                  const locked = role.name === "superadmin" && !isSuperAdmin;
                  return (
                    <label
                      key={role.id}
                      className={`flex items-center gap-3 rounded-[4px] px-3 py-2 text-xs cursor-pointer transition ${
                        checked
                          ? "bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-semibold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked || saving}
                        onChange={(e) =>
                          setRoleSelections((current) => ({
                            ...current,
                            [roleAssignmentUser.id]: e.target.checked
                              ? [...new Set([...assignmentRoleIds, role.id])]
                              : assignmentRoleIds.filter((id) => id !== role.id),
                          }))
                        }
                        className="h-4 w-4 rounded-[2px] border-slate-300 dark:border-slate-600 text-[#0858a8] cursor-pointer accent-[#0858a8]"
                      />
                      <span>{roleLabel(role)}</span>
                      {locked && (
                        <span className="ml-auto text-[10px] text-slate-400">Locked</span>
                      )}
                    </label>
                  );
                })}
            </div>

            <div className={modalStickyFooter}>
              <button
                type="button"
                disabled={saving}
                onClick={() => setRoleAssignmentUser(null)}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  const entry = roleAssignmentUser;
                  void saveAction(
                    () => request(`users/${entry.id}/roles`, "PUT", { role_ids: assignmentRoleIds }),
                    "Roles updated."
                  ).then((saved) => {
                    if (saved) setRoleAssignmentUser(null);
                  });
                }}
                className={btnPrimary}
              >
                {saving ? "Saving…" : "Save Roles"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ─── MODAL: Add / Edit Role ──────────────────────────────────── */}
      {roleFormOpen && (
        <AdminModal
          open={roleFormOpen}
          onOpenChange={(o) => {
            if (!o && !saving) {
              setRoleFormOpen(false);
              setEditingRole(null);
            }
          }}
          title={editingRole === null ? "Create Security Role" : "Edit Role"}
          description="Define the system key and multi-language display names."
          size="lg"
          headerAction={
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Language:
              </span>
              <div className="w-40">
                <AppSelect
                  value={roleEntryLanguage}
                  onChange={(val) => setRoleEntryLanguage(val as SupportedLocale)}
                  options={[
                    { value: "en", label: "English" },
                    { value: "am", label: "አማርኛ" },
                    { value: "om", label: "Afaan Oromoo" },
                  ]}
                  size="sm"
                  ariaLabel="Role language"
                />
              </div>
            </div>
          }
        >
          <form onSubmit={(e) => void submitRole(e)} className="space-y-4 p-1">
            <div>
              <label className={labelCls}>
                Role Key (System Identifier) <span className="text-rose-500">*</span>
              </label>
              <input
                required
                pattern="[a-z][a-z0-9_-]*"
                value={roleDraft.name}
                onChange={(e) => setRoleDraft({ ...roleDraft, name: e.target.value })}
                disabled={editingRole !== null && roles.find((r) => r.id === editingRole)?.name === "superadmin"}
                placeholder="e.g. academic_director"
                className={inputCls()}
              />
            </div>

            <LocalizedFieldInput
              label="Display Name"
              value={roleDraft.label}
              onChange={(val) =>
                setRoleDraft({
                  ...roleDraft,
                  label: { en: val.en ?? "", am: val.am ?? "", om: val.om ?? "" },
                })
              }
              activeLocale={roleEntryLanguage}
              onLocaleChange={setRoleEntryLanguage}
              required={true}
            />

            <div className={modalStickyFooter}>
              <button
                type="button"
                onClick={() => {
                  setRoleFormOpen(false);
                  setEditingRole(null);
                }}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : editingRole === null ? "Create Role" : "Save Role"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ─── MODAL: Manage Role Permissions ──────────────────────────── */}
      {permissionAssignmentOpen && activeRoleId !== null && (
        <AdminModal
          open={permissionAssignmentOpen}
          onOpenChange={(o) => {
            if (!o && !saving) setPermissionAssignmentOpen(false);
          }}
          title="Configure Role Permissions"
          description={`Select permissions granted to role: ${
            roles.find((r) => r.id === activeRoleId)?.name
          }`}
          size="2xl"
        >
          <div className="space-y-4 p-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                placeholder="Search permissions…"
                className="h-9 w-full rounded-[4px] border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0858a8] focus:border-[#0858a8] shadow-2xs"
              />
            </div>

            <div className="max-h-[55vh] space-y-3 overflow-y-auto">
              {Object.entries(
                permissions.reduce<Record<string, PermissionRecord[]>>((groups, p) => {
                  (groups[p.group_name] ??= []).push(p);
                  return groups;
                }, {})
              ).map(([group, items]) => {
                const visible = items.filter((p) => {
                  const isSystem = ["roles.manage", "roles.assign-system", "permissions.assign"].includes(
                    p.name
                  );
                  const allowed = !isSystem || isSuperAdmin || selectedPermissionIds.includes(p.id);
                  return (
                    allowed &&
                    `${p.name} ${labelValue(p.label, currentLocale)} ${p.group_name}`
                      .toLowerCase()
                      .includes(permissionSearch.toLowerCase())
                  );
                });

                if (!visible.length) return null;

                return (
                  <fieldset
                    key={group}
                    className="rounded-[4px] border border-slate-200/90 dark:border-slate-800 p-3"
                  >
                    <legend className="px-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                      {group}
                    </legend>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {visible.map((p) => {
                        const checked = selectedPermissionIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2.5 rounded-[4px] px-2.5 py-1.5 text-xs cursor-pointer transition ${
                              checked
                                ? "bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 font-semibold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={saving}
                              onChange={(e) =>
                                setSelectedPermissionIds((current) =>
                                  e.target.checked
                                    ? [...new Set([...current, p.id])]
                                    : current.filter((id) => id !== p.id)
                                )
                              }
                              className="mt-0.5 h-3.5 w-3.5 rounded-[2px] border-slate-300 dark:border-slate-600 text-[#0858a8] cursor-pointer accent-[#0858a8]"
                            />
                            <div>
                              <span>{labelValue(p.label, currentLocale) || p.name}</span>
                              <span className="block text-[10px] font-mono text-slate-400 font-normal">
                                {p.name}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>

            <div className={modalStickyFooter}>
              <button
                type="button"
                disabled={saving}
                onClick={() => setPermissionAssignmentOpen(false)}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  void saveAction(
                    () =>
                      request(`roles/${activeRoleId}/permissions`, "PUT", {
                        permission_ids: selectedPermissionIds,
                      }),
                    "Permissions updated successfully.",
                    true
                  ).then((saved) => {
                    if (saved) setPermissionAssignmentOpen(false);
                  });
                }}
                className={btnPrimary}
              >
                {saving ? "Saving…" : "Save Permissions"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ─── MODAL: Add / Edit Permission ────────────────────────────── */}
      {(permissionOpen || Boolean(editingPermission)) && (
        <AdminModal
          open={permissionOpen || Boolean(editingPermission)}
          onOpenChange={(o) => {
            if (!o) {
              setPermissionOpen(false);
              setEditingPermission(null);
            }
          }}
          title={editingPermission ? "Edit Permission" : "Add Permission"}
          description="Register or modify a security permission in the system catalogue."
          size="lg"
          headerAction={
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Language:
              </span>
              <div className="w-40">
                <AppSelect
                  value={permissionEntryLanguage}
                  onChange={(val) => setPermissionEntryLanguage(val as SupportedLocale)}
                  options={[
                    { value: "en", label: "English" },
                    { value: "am", label: "አማርኛ" },
                    { value: "om", label: "Afaan Oromoo" },
                  ]}
                  size="sm"
                  ariaLabel="Permission language"
                />
              </div>
            </div>
          }
        >
          <form
            onSubmit={(e) => void (editingPermission ? submitEditPermission(e) : submitPermission(e))}
            className="space-y-4 p-1"
          >
            <div className="space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    Target Module <span className="text-rose-500">*</span>
                  </label>
                  <AppSelect
                    value={permModule}
                    onChange={(mod) => {
                      setPermModule(mod);
                      const newName = `${mod}.${permAction}`;
                      setPermissionDraft((p) => ({
                        ...p,
                        name: newName,
                        group_name: mod,
                        label: {
                          ...p.label,
                          en: p.label.en ? p.label.en : generateDefaultLabel(mod, permAction),
                        },
                      }));
                    }}
                    options={availableModuleOptions}
                    size="md"
                    ariaLabel="Select permission module"
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Operation Action <span className="text-rose-500">*</span>
                  </label>
                  <AppSelect
                    value={permAction}
                    onChange={(act) => {
                      setPermAction(act);
                      const newName = `${permModule}.${act}`;
                      setPermissionDraft((p) => ({
                        ...p,
                        name: newName,
                        group_name: permModule,
                        label: {
                          ...p.label,
                          en: p.label.en ? p.label.en : generateDefaultLabel(permModule, act),
                        },
                      }));
                    }}
                    options={availableActionOptions}
                    size="md"
                    ariaLabel="Select permission action"
                  />
                </div>
              </div>

              {/* Merged Permission Identifier Card */}
              <div className="p-3 rounded-[4px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Merged Permission Key (System Identifier)
                  </span>
                  <code className="text-xs font-mono font-bold text-blue-600 dark:text-sky-400">
                    {permModule}.{permAction}
                  </code>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Assigned Group
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 font-mono">
                    {permModule}
                  </span>
                </div>
              </div>
            </div>

            <LocalizedFieldInput
              label="Display Name"
              value={permissionDraft.label}
              onChange={(val) =>
                setPermissionDraft({
                  ...permissionDraft,
                  label: { en: val.en ?? "", am: val.am ?? "", om: val.om ?? "" },
                })
              }
              activeLocale={permissionEntryLanguage}
              onLocaleChange={setPermissionEntryLanguage}
              required={true}
            />

            <div className={modalStickyFooter}>
              <button
                type="button"
                onClick={() => {
                  setPermissionOpen(false);
                  setEditingPermission(null);
                }}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : editingPermission ? "Save Permission" : "Create Permission"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ─── Confirmation Dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(pendingConfirmation)}
        onClose={() => {
          if (!saving) setPendingConfirmation(null);
        }}
        onConfirm={() => {
          const action = pendingConfirmation?.action;
          setPendingConfirmation(null);
          action?.();
        }}
        isLoading={saving}
        title={pendingConfirmation?.title ?? "Confirm Action"}
        description={pendingConfirmation?.description ?? "Are you sure you want to proceed?"}
      />
    </main>
  );
}
