"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SchoolClassSummary } from "@/types/auth";
import { AdminModal } from "@/components/admin/AdminModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { membersService } from "@/services/members.service";
import { schoolManagementService } from "@/services/schoolManagement.service";

type Member = {
  id: number;
  full_name: string;
  christian_name?: string | null;
  date_of_birth: string;
  gender: string;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  phone_number?: string | null;
  membership_date?: string | null;
  sol_father_name?: string | null;
  class_id: number;
  section?: string | null;
  school_class?: { id: number; name: string } | null;
};

type Draft = Omit<Member, "id" | "school_class">;
const emptyDraft: Draft = { full_name: "", christian_name: "", date_of_birth: "", gender: "", emergency_contact_name: "", emergency_contact_phone: "", phone_number: "", membership_date: "", sol_father_name: "", class_id: 0, section: "" };

function rows<T>(payload: unknown): { items: T[]; pagination: { current_page: number; last_page: number; total: number } } {
  if (!payload || typeof payload !== "object") return { items: [], pagination: { current_page: 1, last_page: 1, total: 0 } };
  const root = payload as { data?: T[]; meta?: { current_page?: number; last_page?: number; total?: number }; pagination?: { current_page?: number; total_pages?: number; total?: number } };
  const page = root.meta ?? root.pagination;
  return { items: Array.isArray(root.data) ? root.data : [], pagination: { current_page: page?.current_page ?? 1, last_page: (page as { last_page?: number; total_pages?: number } | undefined)?.last_page ?? (page as { total_pages?: number } | undefined)?.total_pages ?? 1, total: page?.total ?? root.data?.length ?? 0 } };
}

export function MemberRegistry() {
  const { user } = useAuth();
  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const can = useCallback((name: string) => permissions.has(name), [permissions]);
  const [members, setMembers] = useState<Member[]>([]);
  const [classes, setClasses] = useState<SchoolClassSummary[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
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

  const openCreate = () => { setEditingId(null); const initial = { ...emptyDraft, class_id: classes[0]?.id ?? 0 }; setDraft(initial); setInitialDraft(JSON.stringify(initial)); setFormOpen(true); setNotice(""); setError(""); };
  const openEdit = (member: Member) => {
    setEditingId(member.id);
    const { id: _id, school_class: _schoolClass, ...values } = member;
    const initial = { ...emptyDraft, ...values, class_id: Number(values.class_id) };
    setDraft(initial); setInitialDraft(JSON.stringify(initial));
    setFormOpen(true); setNotice(""); setError("");
  };
  const closeForm = () => { if (saving) return; if (JSON.stringify(draft) !== initialDraft) { setDiscardOpen(true); return; } setFormOpen(false); setEditingId(null); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || (editingId ? !can("members.update") : !can("members.create"))) return;
    if (!draft.class_id) { setError("Choose a school class before saving."); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...draft, christian_name: draft.christian_name || null, emergency_contact_name: draft.emergency_contact_name || null, emergency_contact_phone: draft.emergency_contact_phone || null, phone_number: draft.phone_number || null, membership_date: draft.membership_date || null, sol_father_name: draft.sol_father_name || null, section: draft.section || null };
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

  const field = (key: keyof Draft, label: string, required = false, type = "text") => <label key={key} className="block text-xs font-semibold text-slate-600">{label}<input required={required} type={type} value={String(draft[key] ?? "")} onChange={(event) => setDraft((old) => ({ ...old, [key]: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" /></label>;

  return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Member administration</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Member register</h1><p className="mt-1 text-sm text-slate-500">{total} registered members</p></div><div className="flex gap-2"><button onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Refresh</button>{can("members.create") && <button onClick={openCreate} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800"><Plus className="h-4 w-4" />Register member</button>}</div></header>
    {(error || notice) && <p role={error ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || notice}</p>}
    <form onSubmit={(event) => { event.preventDefault(); setPage(1); void load(); }} className="flex max-w-lg gap-2"><label className="relative flex-1"><span className="sr-only">Search member names</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members" className="min-h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></label><button className="rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700">Search</button></form>
    {formOpen && <AdminModal open={formOpen} onOpenChange={(open) => { if (!open) closeForm(); }} title={editingId ? "Update member" : "Register a member"} description="Enter the member details below." showHeader={false} size="xl"><form onSubmit={(event) => void submit(event)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">{editingId ? "Update member" : "Register a member"}</h2><button type="button" aria-label="Close form" onClick={closeForm} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{field("full_name", "Full name", true)}{field("christian_name", "Christian name")}{field("date_of_birth", "Date of birth", true, "date")}<label className="block text-xs font-semibold text-slate-600">Gender<select required value={draft.gender} onChange={(event) => setDraft((old) => ({ ...old, gender: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option></select></label><label className="block text-xs font-semibold text-slate-600">School class<select required value={draft.class_id || ""} onChange={(event) => setDraft((old) => ({ ...old, class_id: Number(event.target.value) }))} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{typeof item.name === "string" ? item.name : `Class ${item.id}`}</option>)}</select></label>{field("section", "Section")}{field("phone_number", "Phone number")}{field("emergency_contact_name", "Emergency contact")}{field("emergency_contact_phone", "Emergency phone")}{field("membership_date", "Membership date", false, "date")}{field("sol_father_name", "Spiritual father")}</div><div className="flex justify-end gap-2"><button type="button" onClick={closeForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button disabled={saving} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : editingId ? "Save changes" : "Register member"}</button></div></form></AdminModal>}
    {viewing && <AdminModal open={Boolean(viewing)} onOpenChange={(open) => { if (!open) setViewing(null); }} title={viewing.full_name} description="Member record" size="md"><dl className="grid gap-4 sm:grid-cols-2">{[["Christian name", viewing.christian_name], ["Date of birth", viewing.date_of_birth], ["Gender", viewing.gender], ["Phone number", viewing.phone_number], ["Emergency contact", viewing.emergency_contact_name], ["Emergency phone", viewing.emergency_contact_phone], ["Membership date", viewing.membership_date], ["Spiritual father", viewing.sol_father_name], ["Class", viewing.school_class?.name], ["Section", viewing.section]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-900">{value || "—"}</dd></div>)}</dl></AdminModal>}<ConfirmDialog isOpen={discardOpen} onClose={() => setDiscardOpen(false)} onConfirm={() => { setDiscardOpen(false); setFormOpen(false); setEditingId(null); }} title="Discard changes?" description="Your unsaved member details will be lost." variant="primary" />
        <ConfirmDialog isOpen={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} onConfirm={() => void remove()} title="Remove member" description={pendingDelete ? `Remove ${pendingDelete.full_name} from the member register? This action cannot be undone.` : "This action cannot be undone."} isLoading={saving} />
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Section</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">Loading members…</td></tr> : members.map((member) => <tr key={member.id}><td className="px-4 py-3"><p className="font-semibold text-slate-900">{member.full_name}</p>{member.christian_name && <p className="text-xs text-slate-500">{member.christian_name}</p>}</td><td className="px-4 py-3 text-slate-600">{member.school_class?.name ?? `Class ${member.class_id}`}</td><td className="px-4 py-3 text-slate-600">{member.section || "—"}</td><td className="px-4 py-3 text-slate-600">{member.phone_number || "—"}</td><td className="px-4 py-3 text-right"><button onClick={() => setViewing(member)} aria-label={`View ${member.full_name}`} className="rounded-md p-2 text-slate-600 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>{can("members.update") && <button onClick={() => openEdit(member)} aria-label={`Edit ${member.full_name}`} className="rounded-md p-2 text-slate-600 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>}{can("members.delete") && <button onClick={() => setPendingDelete(member)} aria-label={`Delete ${member.full_name}`} className="rounded-md p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}</td></tr>)}{!loading && members.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No members found.</td></tr>}</tbody></table></div>
    <div className="flex items-center justify-between text-sm text-slate-600"><span>Page {page} of {Math.max(pages, 1)}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-40">Next</button></div></div>
  </main>;
}
