"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, LoaderCircle, Pencil, Plus, RefreshCw, Save, Shield, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AdminModal } from "@/components/admin/AdminModal";
import { accessManagementService } from "@/services/accessManagement.service";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

type AccessTab = "users" | "roles" | "permissions";
type RoleRecord = { id: number; name: string; label?: Record<string, string> | string; permissions?: PermissionRecord[] | { data?: PermissionRecord[] }; users_count?: number };
type PermissionRecord = { id: number; name: string; group_name: string; label?: Record<string, string> | string; description?: Record<string, string> | string | null };
type UserRecord = { id: number; name: string; email: string; roles?: string[] | Array<{ id: number; name: string }>; role?: string | { id: number; name: string } };
type PermissionDraft = { name: string; group_name: string; label: { en: string; am: string; om: string } };
type RoleDraft = { name: string; label: { en: string; am: string; om: string } };

const blankPermission: PermissionDraft = { name: "", group_name: "", label: { en: "", am: "", om: "" } };
const blankRole: RoleDraft = { name: "", label: { en: "", am: "", om: "" } };

function listFrom<T>(payload: unknown, key?: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const result = (key ? record[key] : undefined) ?? record.data ?? record.roles ?? record.permissions ?? record.users;
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && Array.isArray((result as Record<string, unknown>).data)) return (result as { data: T[] }).data;
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
  const granted = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const can = useCallback((permission: string) => granted.has(permission), [granted]);
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
  const [notice, setNotice] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", password_confirmation: "", role: "student" });
  const [permissionDraft, setPermissionDraft] = useState<PermissionDraft>(blankPermission);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<number | null>(null);
  const [permissionEdits, setPermissionEdits] = useState<Record<number, PermissionDraft>>({});
  const [roleSelections, setRoleSelections] = useState<Record<number, number[]>>({});
  const [roleAssignmentUser, setRoleAssignmentUser] = useState<UserRecord | null>(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [roleDraft, setRoleDraft] = useState<RoleDraft>(blankRole);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userEditDraft, setUserEditDraft] = useState({ name: "", email: "" });
  const [pendingConfirmation, setPendingConfirmation] = useState<{ title: string; description: string; action: () => void } | null>(null);

  const request = useCallback(async (path: string, method = "GET", body?: unknown) => {
    const response = await accessManagementService.request(`/api/backend/${path}`, method, body, user?.id);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || t("administration.requestFailed"));
    return payload as Record<string, unknown>;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const jobs: Array<Promise<void>> = [];
      if (canViewUsers) jobs.push(request("users").then((data) => {
        const result = listFrom<UserRecord>(data, "users");
        setUsers(result);
      }));
      if (canViewRoles) jobs.push(request("roles").then((data) => {
        const result = listFrom<RoleRecord>(data);
        setRoles(result);
        setActiveRoleId((current) => current ?? result[0]?.id ?? null);
      }));
      if (canViewPermissions) jobs.push(request("permissions?per_page=100").then((data) => setPermissions(listFrom<PermissionRecord>(data))));
      await Promise.all(jobs);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("administration.requestFailed"));
    } finally {
      setLoading(false);
    }
  }, [canViewPermissions, canViewRoles, canViewUsers, request, t]);

  useEffect(() => { void load(); }, []);

  const rolePermissions = useMemo(() => {
    const selected = roles.find((role) => role.id === activeRoleId)?.permissions;
    if (Array.isArray(selected)) return selected.map((permission) => permission.id);
    return selected?.data?.map((permission) => permission.id) ?? [];
  }, [activeRoleId, roles]);

  useEffect(() => { setSelectedPermissionIds(rolePermissions); }, [rolePermissions]);

  const save = async (action: () => Promise<unknown>, successMessage: string, refreshSession = false) => {
    setSaving(true);
    setError("");
    setNotice("");
    try { await action(); setNotice(successMessage); await load(); if (refreshSession) await refreshUser(); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("administration.requestFailed")); return false; }
    finally { setSaving(false); }
  };

  const submitNewUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateUser) return;
    const saved = await save(() => request("users", "POST", newUser), t("administration.userCreated"));
    if (saved) {
      setNewUser({ name: "", email: "", password: "", password_confirmation: "", role: "student" });
      setCreateUserOpen(false);
    }
  };

  const submitPermission = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!can("permissions.create")) return;
    const saved = await save(() => request("permissions", "POST", permissionDraft), t("administration.permissionCreated"));
    if (saved) {
      setPermissionDraft(blankPermission);
      setPermissionOpen(false);
    }
  };

  const submitRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingRole === null && !can("roles.create")) return;
    if (editingRole !== null && !can("roles.update")) return;
    const isEditing = editingRole !== null;
    const result = await save(
      () => request(isEditing ? `roles/${editingRole}` : "roles", isEditing ? "PUT" : "POST", roleDraft),
      isEditing ? t("administration.roleUpdated") : t("administration.roleCreated"),
    );
    if (result) {
      setRoleFormOpen(false);
      setEditingRole(null);
      setRoleDraft(blankRole);
    }
  };

  const availableTabs: AccessTab[] = [
    ...(canViewUsers ? ["users" as const] : []),
    ...(canViewRoles ? ["roles" as const] : []),
    ...(canViewPermissions ? ["permissions" as const] : []),
  ];
  useEffect(() => {
    if (!availableTabs.includes(tab) && availableTabs.length) setTab(availableTabs[0]);
  }, [tab, canViewPermissions, canViewRoles, canViewUsers]);
  const roleLabel = (role: RoleRecord) => labelValue(role.label, currentLocale) || role.name;
  const assignmentRoleIds = roleAssignmentUser ? roleSelections[roleAssignmentUser.id] ?? roles.filter((role) => {
    const assigned = Array.isArray(roleAssignmentUser.roles) ? roleAssignmentUser.roles.map((item) => typeof item === "string" ? item : item.name) : typeof roleAssignmentUser.role === "string" ? [roleAssignmentUser.role] : [];
    return assigned.includes(role.name);
  }).map((role) => role.id) : [];
  const openRoleAssignment = (entry: UserRecord, currentIds: number[]) => {
    setRoleSelections((current) => ({ ...current, [entry.id]: current[entry.id] ?? currentIds }));
    setRoleSearch("");
    setRoleAssignmentUser(entry);
  };

  if (!availableTabs.length) return <section className="mx-auto max-w-4xl px-5 py-12"><h1 className="text-2xl font-semibold">{t("administration.accessDenied")}</h1></section>;

  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-300">{t("administration.eyebrow")}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{t("administration.title")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{t("administration.description")}</p></div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("administration.refresh")}</button>
    </div>

    {(error || notice) && <div role={error ? "alert" : "status"} className={`mt-6 flex items-start gap-2 rounded-lg border p-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"}`}>{error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}</div>}
    {roleAssignmentUser && <AdminModal open={Boolean(roleAssignmentUser)} onOpenChange={(open) => { if (!open && !saving) setRoleAssignmentUser(null); }} title={t("administration.assignRolesFor", { defaultValue: `Roles for ${roleAssignmentUser.name}` })} description={t("administration.roleAssignmentDescription", { defaultValue: "Choose the roles this user may hold. System administrator access requires additional authorization." })} size="md"><div className="space-y-4"><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{t("administration.searchRoles", { defaultValue: "Search roles" })}<input type="search" value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><div className="max-h-[45vh] space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2 dark:border-slate-800">{roles.filter((role) => (can("roles.assign-system") || role.name !== "superadmin" || assignmentRoleIds.includes(role.id)) && `${role.name} ${roleLabel(role)}`.toLowerCase().includes(roleSearch.toLowerCase())).map((role) => { const checked = assignmentRoleIds.includes(role.id); const locked = role.name === "superadmin" && !can("roles.assign-system"); return <label key={role.id} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"><input type="checkbox" checked={checked} disabled={locked || saving} onChange={(event) => setRoleSelections((current) => ({ ...current, [roleAssignmentUser.id]: event.target.checked ? [...new Set([...assignmentRoleIds, role.id])] : assignmentRoleIds.filter((id) => id !== role.id) }))} className="h-4 w-4 accent-blue-700" /><span>{roleLabel(role)}</span>{locked && <span className="ml-auto text-xs text-slate-500">System role locked</span>}</label>; })}{!roles.length && <p className="p-4 text-center text-sm text-slate-500">{t("administration.noRoles", { defaultValue: "No roles are available." })}</p>}</div><div className="sticky bottom-[-1.25rem] flex justify-end gap-2 border-t border-slate-100 bg-white py-4 dark:border-slate-800 dark:bg-slate-900"><button type="button" disabled={saving} onClick={() => setRoleAssignmentUser(null)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">{t("administration.cancel")}</button><button type="button" disabled={saving || !assignmentRoleIds.length} onClick={() => { const entry = roleAssignmentUser; void save(() => request(`users/${entry.id}/roles`, "PUT", { role_ids: assignmentRoleIds }), t("administration.rolesSaved")).then((saved) => { if (saved) setRoleAssignmentUser(null); }); }} className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? t("administration.saving") : t("administration.saveRoles")}</button></div></div></AdminModal>}
    <ConfirmDialog isOpen={Boolean(pendingConfirmation)} onClose={() => { if (!saving) setPendingConfirmation(null); }} onConfirm={() => { const action = pendingConfirmation?.action; setPendingConfirmation(null); action?.(); }} isLoading={saving} title={pendingConfirmation?.title} description={pendingConfirmation?.description} />

    <div className="mt-7 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800" role="tablist" aria-label={t("administration.sections")}>
      {availableTabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`rounded-md px-3 py-2 text-sm font-medium transition ${tab === item ? "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{t(`administration.tabs.${item}`)}</button>)}
    </div>

    {loading ? <div className="flex min-h-56 items-center justify-center text-sm text-slate-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />{t("administration.loading")}</div> : <>
      {tab === "users" && canViewUsers && <section className="pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t("administration.usersTitle")}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("administration.usersDescription")}</p></div>{canCreateUser && <button onClick={() => setCreateUserOpen((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-3.5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><Plus className="h-4 w-4" />{t("administration.addUser")}</button>}</div>
        {createUserOpen && canCreateUser && <AdminModal open={createUserOpen} onOpenChange={(open) => { if (!open && !saving) setCreateUserOpen(false); }} title={t("administration.addUser")} description={t("administration.modalDescription", { defaultValue: "Enter the account details and initial role." })} size="lg"><form onSubmit={(event) => void submitNewUser(event)} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("administration.name")}<input required maxLength={255} value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("administration.email")}<input required type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("administration.role")}<select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">{roles.filter((role) => ["student", "teacher", "superadmin"].includes(role.name) && (role.name !== "superadmin" || can("roles.assign-system"))).map((role) => <option key={role.id} value={role.name}>{roleLabel(role)}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("administration.password")}<input required minLength={8} type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("administration.confirmPassword")}<input required minLength={8} type="password" value={newUser.password_confirmation} onChange={(event) => setNewUser({ ...newUser, password_confirmation: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
          <div className="flex items-end gap-2"><button disabled={saving} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? t("administration.saving") : t("administration.createUser")}</button><button type="button" onClick={() => setCreateUserOpen(false)} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700">{t("administration.cancel")}</button></div>
        </form></AdminModal>}
        {editingUser && can("users.update") && editingUser.id !== user?.id && <AdminModal open={Boolean(editingUser)} onOpenChange={(open) => { if (!open && !saving) setEditingUser(null); }} title={t("administration.editUser", { defaultValue: "Edit user" })} description={t("administration.modalDescription", { defaultValue: "Update the account details." })} size="md"><form onSubmit={(event) => { event.preventDefault(); void save(() => request(`users/${editingUser.id}`, "PUT", userEditDraft), t("administration.userUpdated")).then((saved) => { if (saved) setEditingUser(null); }); }} className="mb-5 grid gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4 sm:grid-cols-[1fr_1fr_auto] dark:border-blue-900 dark:bg-blue-950/20">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("administration.name")}<input required maxLength={255} value={userEditDraft.name} onChange={(event) => setUserEditDraft({ ...userEditDraft, name: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("administration.email")}<input required type="email" value={userEditDraft.email} onChange={(event) => setUserEditDraft({ ...userEditDraft, email: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
          <div className="flex items-end gap-2"><button disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{t("administration.saveUser")}</button><button type="button" onClick={() => setEditingUser(null)} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700">{t("administration.cancel")}</button></div>
        </form></AdminModal>}
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400"><tr><th className="px-4 py-3">{t("administration.user")}</th><th className="px-4 py-3">{t("administration.email")}</th><th className="px-4 py-3">{t("administration.role")}</th><th className="px-4 py-3 text-right">{t("administration.actions")}</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{users.map((entry) => { const assigned = Array.isArray(entry.roles) ? entry.roles.map((role) => typeof role === "string" ? role : role.name) : typeof entry.role === "string" ? [entry.role] : []; const ids = roleSelections[entry.id] ?? roles.filter((role) => assigned.includes(role.name)).map((role) => role.id); return <tr key={entry.id}><td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{entry.name}{entry.id === user?.id && <span className="ml-2 text-xs text-slate-500">{t("administration.you")}</span>}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{entry.email}</td><td className="px-4 py-3">{canAssignRoles ? <button type="button" onClick={() => openRoleAssignment(entry, ids)} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200">{t("administration.manageRoles", { defaultValue: "Manage roles" })}</button> : <div className="flex flex-wrap gap-1">{assigned.map((name) => <span key={name} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{roles.find((role) => role.name === name) ? roleLabel(roles.find((role) => role.name === name)!) : name}</span>)}</div>}</td><td className="px-4 py-3 text-right">{can("users.update") && entry.id !== user?.id && <button onClick={() => { setEditingUser(entry); setUserEditDraft({ name: entry.name, email: entry.email }); }} className="mr-2 rounded-md border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">{t("administration.edit")}</button>}{can("users.delete") && entry.id !== user?.id && <button aria-label={t("administration.deleteUser", { defaultValue: entry.name })} onClick={() => { setPendingConfirmation({ title: t("administration.deleteUser", { defaultValue: "Delete user" }), description: t("administration.confirmDeleteUser", { defaultValue: entry.name }), action: () => void save(() => request(`users/${entry.id}`, "DELETE"), t("administration.userDeleted")) }); }} className="ml-2 rounded-md p-2 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" /></button>}</td></tr>; })}{!users.length && <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">{t("administration.noUsers")}</td></tr>}</tbody></table></div>
      </section>}

      {tab === "roles" && canViewRoles && <section className="space-y-4 pt-6">
        {roleFormOpen && <AdminModal open={roleFormOpen} onOpenChange={(open) => { if (!open && !saving) { setRoleFormOpen(false); setEditingRole(null); } }} title={t(editingRole === null ? "administration.createRole" : "administration.editRole", { defaultValue: editingRole === null ? "Create role" : "Edit role" })} description={t("administration.modalDescription", { defaultValue: "Define the role and its translated display name." })} size="xl"><form onSubmit={(event) => void submitRole(event)} className="grid gap-3 rounded-lg border border-blue-200 bg-blue-50/40 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-blue-900 dark:bg-blue-950/20">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("administration.roleKey")}<input required pattern="[a-z][a-z0-9_-]*" value={roleDraft.name} onChange={(event) => setRoleDraft({ ...roleDraft, name: event.target.value })} disabled={editingRole !== null && roles.find((role) => role.id === editingRole)?.name === "superadmin"} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
          {(["en", "am", "om"] as const).map((language) => <label key={language} className="text-xs font-medium text-slate-600 dark:text-slate-300">{t(`language.${{ en: "english", am: "amharic", om: "oromo" }[language]}`)}<input required={language === "en"} value={roleDraft.label[language]} onChange={(event) => setRoleDraft({ ...roleDraft, label: { ...roleDraft.label, [language]: event.target.value } })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>)}
          <div className="flex items-end gap-2"><button disabled={saving} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{editingRole === null ? t("administration.createRole") : t("administration.saveRole")}</button><button type="button" onClick={() => { setRoleFormOpen(false); setEditingRole(null); }} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700">{t("administration.cancel")}</button></div>
        </form></AdminModal>}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-2 px-2 pb-3"><div className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4 text-blue-700 dark:text-blue-300" />{t("administration.rolesTitle")}</div>{can("roles.create") && <button type="button" onClick={() => { setEditingRole(null); setRoleDraft(blankRole); setRoleFormOpen(true); }} className="rounded-md p-1.5 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/50" aria-label={t("administration.createRole")}><Plus className="h-4 w-4" /></button>}</div>{roles.map((role) => <button key={role.id} onClick={() => setActiveRoleId(role.id)} className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm ${activeRoleId === role.id ? "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"}`}><span>{roleLabel(role)}<small className="mt-0.5 block text-xs text-slate-500">{role.users_count ?? 0} {t("administration.assignedUsers")}</small></span><span className="text-xs text-slate-500">{Array.isArray(role.permissions) ? role.permissions.length : role.permissions?.data?.length ?? 0}</span></button>)}</div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{roles.find((role) => role.id === activeRoleId) ? roleLabel(roles.find((role) => role.id === activeRoleId)!) : t("administration.selectRole")}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("administration.rolePermissionsDescription")}</p></div><div className="flex flex-wrap gap-2">{activeRoleId !== null && roles.find((role) => role.id === activeRoleId)?.name !== "superadmin" && can("roles.update") && <button onClick={() => { const role = roles.find((item) => item.id === activeRoleId); if (!role) return; setEditingRole(role.id); setRoleDraft({ name: role.name, label: { en: labelValue(role.label, "en"), am: labelValue(role.label, "am"), om: labelValue(role.label, "om") } }); setRoleFormOpen(true); }} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"><Pencil className="h-4 w-4" />{t("administration.edit")}</button>}{activeRoleId !== null && roles.find((role) => role.id === activeRoleId)?.name !== "superadmin" && can("roles.delete") && <button disabled={saving || (roles.find((role) => role.id === activeRoleId)?.users_count ?? 0) > 0} onClick={() => { const role = roles.find((item) => item.id === activeRoleId); if (role) setPendingConfirmation({ title: t("administration.deleteRole", { defaultValue: "Delete role" }), description: t("administration.confirmDeleteRole", { defaultValue: role.name }), action: () => void save(() => request(`roles/${role.id}`, "DELETE"), t("administration.roleDeleted")) }); }} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-rose-200 px-3 text-sm font-semibold text-rose-700 disabled:opacity-40 dark:border-rose-900 dark:text-rose-300"><Trash2 className="h-4 w-4" />{t("administration.deleteRole")}</button>}{canAssignPermissions && activeRoleId !== null && roles.find((role) => role.id === activeRoleId)?.name !== "superadmin" && <button disabled={saving} onClick={() => { setPermissionSearch(""); setPermissionAssignmentOpen(true); }} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-3.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"><Save className="h-4 w-4" />{t("administration.managePermissions", { defaultValue: "Manage permissions" })}</button>}</div></div>
          {canAssignPermissions ? <div className="hidden">{Object.entries(permissions.reduce<Record<string, PermissionRecord[]>>((groups, permission) => { (groups[permission.group_name] ??= []).push(permission); return groups; }, {})).map(([group, items]) => <fieldset key={group} className="rounded-md border border-slate-200 p-3 dark:border-slate-800"><legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</legend><div className="space-y-2">{items.map((permission) => <label key={permission.id} className="flex cursor-pointer items-start gap-2.5 rounded px-1 py-1 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"><input type="checkbox" checked={selectedPermissionIds.includes(permission.id)} onChange={(event) => setSelectedPermissionIds((current) => event.target.checked ? [...new Set([...current, permission.id])] : current.filter((id) => id !== permission.id))} className="mt-0.5 accent-blue-700" /><span><span className="block font-medium">{labelValue(permission.label, currentLocale) || permission.name}</span><span className="text-xs text-slate-500">{permission.name}</span></span></label>)}</div></fieldset>)}</div> : <p className="mt-6 rounded-md bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">{t("administration.noPermissionEdit")}</p>}
        </div>
        </div>
      </section>}

      {permissionAssignmentOpen && activeRoleId !== null && <AdminModal open={permissionAssignmentOpen} onOpenChange={(open) => { if (!open && !saving) { const changed = selectedPermissionIds.length !== rolePermissions.length || selectedPermissionIds.some((id) => !rolePermissions.includes(id)); if (changed) setPendingConfirmation({ title: t("administration.discardChanges", { defaultValue: "Discard permission changes?" }), description: t("administration.unsavedChanges", { defaultValue: "Your unsaved changes will be lost." }), action: () => { setSelectedPermissionIds(rolePermissions); setPermissionAssignmentOpen(false); } }); else setPermissionAssignmentOpen(false); } }} title={t("administration.savePermissions")} description={t("administration.rolePermissionsDescription")} size="xl"><div className="space-y-4"><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{t("administration.searchPermissions", { defaultValue: "Search permissions" })}<input type="search" value={permissionSearch} onChange={(event) => setPermissionSearch(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><div className="max-h-[55vh] space-y-3 overflow-y-auto">{Object.entries(permissions.reduce<Record<string, PermissionRecord[]>>((groups, permission) => { (groups[permission.group_name] ??= []).push(permission); return groups; }, {})).map(([group, items]) => { const visible = items.filter((permission) => { const isSystem = ["roles.manage", "roles.assign-system", "permissions.assign"].includes(permission.name); const allowed = !isSystem || can("roles.manage") || can("roles.assign-system") || selectedPermissionIds.includes(permission.id); return allowed && `${permission.name} ${labelValue(permission.label, currentLocale)} ${permission.group_name}`.toLowerCase().includes(permissionSearch.toLowerCase()); }); return visible.length ? <fieldset key={group} className="rounded-md border border-slate-200 p-3 dark:border-slate-800"><legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</legend><div className="space-y-1">{visible.map((permission) => { const systemLocked = ["roles.manage", "roles.assign-system", "permissions.assign"].includes(permission.name) && !can("roles.manage") && !can("roles.assign-system"); return <label key={permission.id} className="flex items-start gap-2.5 rounded px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"><input type="checkbox" checked={selectedPermissionIds.includes(permission.id)} disabled={systemLocked || saving} onChange={(event) => setSelectedPermissionIds((current) => event.target.checked ? [...new Set([...current, permission.id])] : current.filter((id) => id !== permission.id))} className="mt-0.5 accent-blue-700" /><span><span className="block font-medium">{labelValue(permission.label, currentLocale) || permission.name}</span><span className="text-xs text-slate-500">{permission.name}</span>{systemLocked && <span className="ml-2 text-xs text-slate-500">System permission locked</span>}</span></label>; })}</div></fieldset> : null; })}{!permissions.length && <p className="rounded-md border border-slate-200 p-5 text-center text-sm text-slate-500">{t("administration.noPermissions", { defaultValue: "No permissions are available." })}</p>}</div><div className="sticky bottom-[-1.25rem] flex justify-end gap-2 border-t border-slate-100 bg-white py-4 dark:border-slate-800 dark:bg-slate-900"><button type="button" disabled={saving} onClick={() => { const changed = selectedPermissionIds.length !== rolePermissions.length || selectedPermissionIds.some((id) => !rolePermissions.includes(id)); if (changed) setPendingConfirmation({ title: t("administration.discardChanges", { defaultValue: "Discard permission changes?" }), description: t("administration.unsavedChanges", { defaultValue: "Your unsaved changes will be lost." }), action: () => { setSelectedPermissionIds(rolePermissions); setPermissionAssignmentOpen(false); } }); else setPermissionAssignmentOpen(false); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">{t("administration.cancel")}</button><button type="button" disabled={saving} onClick={() => { void save(() => request(`roles/${activeRoleId}/permissions`, "PUT", { permission_ids: selectedPermissionIds }), t("administration.permissionsSaved"), true).then((saved) => { if (saved) setPermissionAssignmentOpen(false); }); }} className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? t("administration.saving") : t("administration.savePermissions")}</button></div></div></AdminModal>}      {tab === "permissions" && canViewPermissions && <section className="pt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t("administration.permissionsTitle")}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("administration.permissionsDescription")}</p></div>{can("permissions.create") && <button onClick={() => setPermissionOpen((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-3.5 text-sm font-semibold text-white hover:bg-blue-800"><Plus className="h-4 w-4" />{t("administration.addPermission")}</button>}</div>
        {permissionOpen && can("permissions.create") && <AdminModal open={permissionOpen} onOpenChange={(open) => { if (!open && !saving) setPermissionOpen(false); }} title={t("administration.addPermission")} description={t("administration.modalDescription", { defaultValue: "Add a permission to the system catalogue." })} size="xl"><form onSubmit={(event) => void submitPermission(event)} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900"><label className="text-xs font-medium">{t("administration.permissionName")}<input required pattern="[a-z]+(\.[a-z]+)*" value={permissionDraft.name} onChange={(event) => setPermissionDraft({ ...permissionDraft, name: event.target.value })} placeholder="students.view" className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><label className="text-xs font-medium">{t("administration.group")}<input required value={permissionDraft.group_name} onChange={(event) => setPermissionDraft({ ...permissionDraft, group_name: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>{(["en", "am", "om"] as const).map((language) => <label key={language} className="text-xs font-medium">{t(`language.${{ en: "english", am: "amharic", om: "oromo" }[language]}`)}<input required={language === "en"} value={permissionDraft.label[language]} onChange={(event) => setPermissionDraft({ ...permissionDraft, label: { ...permissionDraft.label, [language]: event.target.value } })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>)}<div className="flex items-end"><button disabled={saving} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />{t("administration.createPermission")}</button></div></form></AdminModal>}
        <div className="space-y-3">{permissions.map((permission) => { const draft = permissionEdits[permission.id] ?? { name: permission.name, group_name: permission.group_name, label: { en: labelValue(permission.label, "en"), am: labelValue(permission.label, "am"), om: labelValue(permission.label, "om") } }; return <article key={permission.id} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[minmax(160px,1fr)_minmax(120px,0.8fr)_repeat(3,minmax(120px,1fr))_auto]">{editingPermission === permission.id && can("permissions.update") && <AdminModal open={editingPermission === permission.id} onOpenChange={(open) => { if (!open && !saving) setEditingPermission(null); }} title={t("administration.editPermission", { defaultValue: "Edit permission" })} description={t("administration.modalDescription", { defaultValue: "Update the permission details and translated labels." })} size="xl"><form onSubmit={(event) => { event.preventDefault(); void save(() => request(`permissions/${permission.id}`, "PUT", draft), t("administration.permissionUpdated")).then((saved) => { if (saved) setEditingPermission(null); }); }} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium">{t("administration.permissionName")}<input value={draft.name} onChange={(event) => setPermissionEdits({ ...permissionEdits, [permission.id]: { ...draft, name: event.target.value } })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-950" /></label><label className="text-xs font-medium">{t("administration.group")}<input value={draft.group_name} onChange={(event) => setPermissionEdits({ ...permissionEdits, [permission.id]: { ...draft, group_name: event.target.value } })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-950" /></label>{(["en", "am", "om"] as const).map((language) => <label key={language} className="text-xs font-medium">{language.toUpperCase()}<input value={draft.label[language]} onChange={(event) => setPermissionEdits({ ...permissionEdits, [permission.id]: { ...draft, label: { ...draft.label, [language]: event.target.value } } })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-950" /></label>)}<button type="submit" disabled={saving} className="self-end rounded-md bg-blue-700 p-2 text-white disabled:opacity-50" aria-label={t("administration.savePermission")}><Save className="h-4 w-4" /></button></form></AdminModal>}<div><p className="font-medium text-slate-900 dark:text-white">{labelValue(permission.label, currentLocale) || permission.name}</p><p className="mt-1 text-xs text-slate-500">{permission.name}</p></div><div className="text-xs text-slate-500">{permission.group_name}</div><div className="md:col-span-3 flex items-center gap-2 text-xs text-slate-500"><span className="font-semibold">EN</span>{labelValue(permission.label, "en")}<span className="ml-2 font-semibold">AM</span>{labelValue(permission.label, "am")}<span className="ml-2 font-semibold">OM</span>{labelValue(permission.label, "om")}</div><div className="flex items-center justify-end gap-1">{can("permissions.update") && <button onClick={() => setEditingPermission(permission.id)} className="rounded-md border border-slate-200 px-2.5 py-2 text-xs font-semibold dark:border-slate-700">{t("administration.edit")}</button>}{can("permissions.delete") && <button onClick={() => { setPendingConfirmation({ title: t("administration.deletePermission", { defaultValue: "Delete permission" }), description: t("administration.confirmDeletePermission", { defaultValue: permission.name }), action: () => void save(() => request(`permissions/${permission.id}`, "DELETE"), t("administration.permissionDeleted")) }); }} className="rounded-md p-2 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30" aria-label={t("administration.deletePermission")}><Trash2 className="h-4 w-4" /></button>}</div></article>; })}</div>
      </section>}
    </>}
  </section>
}
