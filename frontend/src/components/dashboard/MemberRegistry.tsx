"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SchoolClassSummary } from "@/types/auth";
import { AdminModal } from "@/components/admin/AdminModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { membersService } from "@/services/members.service";
import { schoolManagementService } from "@/services/schoolManagement.service";
import { TableShimmerSkeleton, MemberRegistryShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";
import { AppSelect } from "@/components/ui/AppSelect";
import { useLanguage } from "@/context/LanguageContext";
import { LocalizedFieldInput, SupportedLocale } from "@/components/admin/LocalizedFieldInput";

type Member = {
  id: number;
  full_name: string | Record<string, string>;
  christian_name?: string | Record<string, string> | null;
  date_of_birth: string;
  gender: string;
  emergency_contact_name?: string | Record<string, string> | null;
  emergency_contact_phone?: string | null;
  phone_number?: string | null;
  membership_date?: string | null;
  sol_father_name?: string | Record<string, string> | null;
  class_id: number;
  section?: string | null;
  school_class?: { id: number; name: string | Record<string, string> } | null;
};

type Draft = Omit<Member, "id" | "school_class">;
const emptyDraft: Draft = { full_name: { en: "", am: "", om: "" }, christian_name: "", date_of_birth: "", gender: "", emergency_contact_name: "", emergency_contact_phone: "", phone_number: "", membership_date: "", sol_father_name: "", class_id: 0, section: "" };

function rows<T>(payload: unknown): { items: T[]; pagination: { current_page: number; last_page: number; total: number } } {
  if (!payload || typeof payload !== "object") return { items: [], pagination: { current_page: 1, last_page: 1, total: 0 } };
  const root = payload as { data?: T[]; meta?: { current_page?: number; last_page?: number; total?: number }; pagination?: { current_page?: number; total_pages?: number; total?: number } };
  const page = root.meta ?? root.pagination;
  return { items: Array.isArray(root.data) ? root.data : [], pagination: { current_page: page?.current_page ?? 1, last_page: (page as { last_page?: number; total_pages?: number } | undefined)?.last_page ?? (page as { total_pages?: number } | undefined)?.total_pages ?? 1, total: page?.total ?? root.data?.length ?? 0 } };
}

function nestedText(value: unknown, language: "en" | "am" | "om" = "en"): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        return nestedText(parsed, language);
      } catch {
        return value;
      }
    }
    return value;
  }
  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    if (item.en !== undefined || item.am !== undefined || item.om !== undefined) {
      const current = item[language];
      if (typeof current === "string" && current.trim() !== "") {
        return current.trim();
      }
      return String(item.en || item.am || item.om || "—");
    }
    if (item.name) return nestedText(item.name, language);
    return String(item.full_name ?? item.title ?? item.id ?? "—");
  }
  return String(value);
}

function parseTranslations(value: unknown): Record<string, string> {
  if (value && typeof value === "object") {
    const obj = value as Record<string, string>;
    return { en: obj.en ?? "", am: obj.am ?? "", om: obj.om ?? "" };
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return { en: parsed.en ?? "", am: parsed.am ?? "", om: parsed.om ?? "" };
      }
    } catch {
      return { en: value, am: "", om: "" };
    }
    return { en: value, am: "", om: "" };
  }
  return { en: "", am: "", om: "" };
}

export function MemberRegistry() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const can = useCallback((name: string) => permissions.has(name), [permissions]);
  const [members, setMembers] = useState<Member[]>([]);
  const [classes, setClasses] = useState<SchoolClassSummary[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [entryLanguage, setEntryLanguage] = useState<SupportedLocale>("en");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [initialDraft, setInitialDraft] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);

  const request = useCallback(async (url: string, method = "GET", body?: unknown) => {
    const response = await membersService.request(url, method, body, user?.id);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "The request could not be completed.");
    return data;
  }, []);

  const load = useCallback(async () => {
    if (!can("members.view")) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "15" });
      if (search.trim()) params.set("search", search.trim());
      const result = rows<Member>(await request(`members?${params}`));
      setMembers(result.items); setPages(result.pagination.last_page); setTotal(result.pagination.total);
      if (can("school-classes.view")) {
        const classResponse = await schoolManagementService.request("school-classes", {}, undefined, user?.id);
        const classPayload = await classResponse.json();
        if (!classResponse.ok) throw new Error((classPayload as { message?: string }).message || "Unable to load classes.");
        setClasses(Array.isArray(classPayload.data) ? classPayload.data : []);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load the member register."); }
    finally { setLoading(false); }
  }, [can, page, request, search]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditingId(null); setEntryLanguage("en"); const initial = { ...emptyDraft, full_name: { en: "", am: "", om: "" }, class_id: classes[0]?.id ?? 0 }; setDraft(initial); setInitialDraft(JSON.stringify(initial)); setFormOpen(true); setNotice(""); setError(""); };
  const openEdit = (member: Member) => {
    setEditingId(member.id);
    setEntryLanguage("en");
    const { id: _id, school_class: _schoolClass, ...values } = member;
    const initial = { ...emptyDraft, ...values, full_name: parseTranslations(member.full_name), class_id: Number(values.class_id) };
    setDraft(initial); setInitialDraft(JSON.stringify(initial));
    setFormOpen(true); setNotice(""); setError("");
  };
  const closeForm = () => { if (saving) return; if (JSON.stringify(draft) !== initialDraft) { setDiscardOpen(true); return; } setFormOpen(false); setEditingId(null); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || (editingId ? !can("members.update") : !can("members.create"))) return;
    if (!draft.class_id) { setError("Choose a school class before saving."); return; }
    const fullNameObj = typeof draft.full_name === "object" ? draft.full_name as Record<string, string> : parseTranslations(draft.full_name);
    if (!fullNameObj.en?.trim()) {
      setError("English full name is mandatory.");
      return;
    }
    setSaving(true); setError("");
    try {
      const cleanFullName: Record<string, string> = { en: fullNameObj.en.trim() };
      if (fullNameObj.am?.trim()) cleanFullName.am = fullNameObj.am.trim();
      if (fullNameObj.om?.trim()) cleanFullName.om = fullNameObj.om.trim();

      const payload = { ...draft, full_name: cleanFullName, christian_name: draft.christian_name || null, emergency_contact_name: draft.emergency_contact_name || null, emergency_contact_phone: draft.emergency_contact_phone || null, phone_number: draft.phone_number || null, membership_date: draft.membership_date || null, sol_father_name: draft.sol_father_name || null, section: draft.section || null };
      await request(editingId ? `members/${editingId}` : "members", editingId ? "PUT" : "POST", payload);
      setNotice(editingId ? "Member details updated." : "Member registered."); setFormOpen(false); setEditingId(null); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save member."); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!pendingDelete || !can("members.delete") || saving) return;
    setSaving(true); setError(""); setNotice("");
    try { await request(`members/${pendingDelete.id}`, "DELETE"); setPendingDelete(null); setNotice("Member removed."); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to remove member."); }
    finally { setSaving(false); }
  };

  if (!can("members.view")) return <section className="m-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Your account does not have permission to view the member register.</section>;
  if (loading && members.length === 0) return <MemberRegistryShimmerSkeleton />;

  const field = (key: keyof Draft, label: string, required = false, type = "text") => <label key={key} className="block text-xs font-semibold text-slate-600">{label}<input required={required} type={type} value={String(draft[key] ?? "")} onChange={(event) => setDraft((old) => ({ ...old, [key]: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>;

  return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Member administration</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Member register</h1><p className="mt-1 text-sm text-slate-500">{total} registered members</p></div><div className="flex gap-2"><button onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Refresh</button>{can("members.create") && <button onClick={openCreate} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800"><Plus className="h-4 w-4" />Register member</button>}</div></header>
    {(error || notice) && <p role={error ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || notice}</p>}
    <form onSubmit={(event) => { event.preventDefault(); setPage(1); void load(); }} className="flex max-w-lg gap-2"><label className="relative flex-1"><span className="sr-only">Search member names</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members" className="min-h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></label><button className="rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700">Search</button></form>
    {formOpen && <AdminModal open={formOpen} onOpenChange={(open) => { if (!open) closeForm(); }} title={editingId ? "Update member" : "Register a member"} description="Enter the member details below." size="xl" headerAction={<div className="w-36 sm:w-44"><AppSelect value={entryLanguage} onChange={(val) => setEntryLanguage(val as SupportedLocale)} options={[{ value: "en", label: "English (en)" }, { value: "am", label: "አማርኛ (am)" }, { value: "om", label: "Afaan Oromoo (om)" }]} size="sm" ariaLabel="Member data entry language" /></div>}><form onSubmit={(event) => void submit(event)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><div className="sm:col-span-2 lg:col-span-3"><LocalizedFieldInput label="Full name" value={typeof draft.full_name === "object" ? draft.full_name as Record<string, string> : parseTranslations(draft.full_name)} onChange={(val) => setDraft((old) => ({ ...old, full_name: val }))} activeLocale={entryLanguage} onLocaleChange={setEntryLanguage} required={true} /></div>{field("christian_name", "Christian name")}{field("date_of_birth", "Date of birth", true, "date")}<label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Gender<div className="mt-1.5"><AppSelect value={draft.gender} onChange={(val) => setDraft((old) => ({ ...old, gender: val }))} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} placeholder="Select gender" required /></div></label><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">School class<div className="mt-1.5"><AppSelect value={draft.class_id ? String(draft.class_id) : ""} onChange={(val) => setDraft((old) => ({ ...old, class_id: Number(val) }))} options={classes.map((item) => ({ value: String(item.id), label: typeof item.name === "string" ? item.name : nestedText(item.name, language) }))} placeholder="Select class" required /></div></label>{field("section", "Section")}{field("phone_number", "Phone number")}{field("emergency_contact_name", "Emergency contact")}{field("emergency_contact_phone", "Emergency phone")}{field("membership_date", "Membership date", false, "date")}{field("sol_father_name", "Spiritual father")}</div><div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><button type="button" onClick={closeForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button disabled={saving} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : editingId ? "Save changes" : "Register member"}</button></div></form></AdminModal>}
    {viewing && <AdminModal open={Boolean(viewing)} onOpenChange={(open) => { if (!open) setViewing(null); }} title={nestedText(viewing.full_name, language)} description="Member record" size="md"><dl className="grid gap-4 sm:grid-cols-2">{[["Christian name", nestedText(viewing.christian_name, language)], ["Date of birth", viewing.date_of_birth], ["Gender", viewing.gender], ["Phone number", viewing.phone_number], ["Emergency contact", nestedText(viewing.emergency_contact_name, language)], ["Emergency phone", viewing.emergency_contact_phone], ["Membership date", viewing.membership_date], ["Spiritual father", nestedText(viewing.sol_father_name, language)], ["Class", nestedText(viewing.school_class?.name, language)], ["Section", viewing.section]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-900">{value || "—"}</dd></div>)}</dl></AdminModal>}<ConfirmDialog isOpen={discardOpen} onClose={() => setDiscardOpen(false)} onConfirm={() => { setDiscardOpen(false); setFormOpen(false); setEditingId(null); }} title="Discard changes?" description="Your unsaved member details will be lost." variant="primary" />
        <ConfirmDialog isOpen={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} onConfirm={() => void remove()} title="Remove member" description={pendingDelete ? `Remove ${nestedText(pendingDelete.full_name, language)} from the member register? This action cannot be undone.` : "This action cannot be undone."} isLoading={saving} />
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Section</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="p-4"><TableShimmerSkeleton rows={5} columns={5} /></td></tr> : members.map((member) => <tr key={member.id}><td className="px-4 py-3"><p className="font-semibold text-slate-900">{nestedText(member.full_name, language)}</p>{member.christian_name && <p className="text-xs text-slate-500">{nestedText(member.christian_name, language)}</p>}</td><td className="px-4 py-3 text-slate-600">{nestedText(member.school_class?.name ?? `Class ${member.class_id}`, language)}</td><td className="px-4 py-3 text-slate-600">{member.section || "—"}</td><td className="px-4 py-3 text-slate-600">{member.phone_number || "—"}</td><td className="px-4 py-3 text-right"><button onClick={() => setViewing(member)} aria-label={`View ${nestedText(member.full_name, language)}`} className="rounded-md p-2 text-slate-600 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>{can("members.update") && <button onClick={() => openEdit(member)} aria-label={`Edit ${nestedText(member.full_name, language)}`} className="rounded-md p-2 text-slate-600 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>}{can("members.delete") && <button onClick={() => setPendingDelete(member)} aria-label={`Delete ${nestedText(member.full_name, language)}`} className="rounded-md p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}</td></tr>)}{!loading && members.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No members found.</td></tr>}</tbody></table></div>
    <div className="flex items-center justify-between text-sm text-slate-600"><span>Page {page} of {Math.max(pages, 1)}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-40">Next</button></div></div>
  </main>;
}
