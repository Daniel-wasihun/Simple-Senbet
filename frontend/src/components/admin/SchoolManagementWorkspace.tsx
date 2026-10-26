"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Globe, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AdminModal } from "@/components/admin/AdminModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { schoolManagementService } from "@/services/schoolManagement.service";
import { TableShimmerSkeleton, ManagementPageShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";
import { AppSelect } from "@/components/ui/AppSelect";
import { LocalizedFieldInput, SupportedLocale } from "@/components/admin/LocalizedFieldInput";

export type SchoolModule = "academic-years" | "school-classes" | "courses" | "teaching-assignments" | "enrollments" | "assessments" | "assessment-results";
type FieldType = "text" | "number" | "date" | "textarea" | "boolean" | "select" | "localized";
type Field = { name: string; label: string; type: FieldType; required?: boolean; min?: number; max?: number; source?: string; options?: Array<{ value: string; label: string }> };
type Row = Record<string, unknown> & { id: number };
type Lookup = { id: number; name?: string | Record<string, string>; full_name?: string; title?: string; code?: string; teacher?: { name: string }; class?: { name: string }; member?: { full_name: string }; academic_year?: { name: string }; school_class?: { name: string } };

const MODULES: Record<SchoolModule, { endpoint: string; permission: string; titleKey: string; createPermission?: string; updatePermission?: string; deletePermission?: string; createLabel: string; fields: Field[]; columns: string[]; lookups?: string[] }> = {
  "academic-years": { endpoint: "academic-years", permission: "academic-years.view", titleKey: "academicYears", createPermission: "academic-years.create", updatePermission: "academic-years.update", deletePermission: "academic-years.delete", createLabel: "createAcademicYear", fields: [{ name: "name", label: "name", type: "localized", required: true }, { name: "start_date", label: "startDate", type: "date", required: true }, { name: "end_date", label: "endDate", type: "date", required: true }, { name: "is_current", label: "currentYear", type: "boolean" }], columns: ["name", "start_date", "end_date", "is_current"] },
  "school-classes": { endpoint: "school-classes", permission: "school-classes.view", titleKey: "classes", createPermission: "school-classes.create", updatePermission: "school-classes.update", deletePermission: "school-classes.delete", createLabel: "createClass", fields: [{ name: "name", label: "name", type: "localized", required: true }, { name: "code", label: "code", type: "text", required: true }, { name: "number_of_sections", label: "numberOfSections", type: "number", min: 1, required: true }, { name: "passing_score", label: "passingScore", type: "number", min: 0, max: 100, required: true }, { name: "next_class_id", label: "nextClass", type: "select", source: "school-classes" }], columns: ["name", "code", "number_of_sections", "passing_score"], lookups: ["school-classes"] },
  courses: { endpoint: "courses", permission: "courses.view", createPermission: "courses.create", updatePermission: "courses.update", deletePermission: "courses.delete", titleKey: "courses", createLabel: "createCourse", fields: [{ name: "name", label: "name", type: "localized", required: true }, { name: "code", label: "code", type: "text", required: true }, { name: "description", label: "description", type: "localized" }, { name: "credit_hour", label: "creditHours", type: "number", min: 1, required: true }, { name: "class_id", label: "class", type: "select", source: "school-classes", required: true }], columns: ["name", "code", "class_id", "credit_hour"], lookups: ["school-classes"] },
  "teaching-assignments": { endpoint: "teaching-assignments", permission: "teaching-assignments.view", createPermission: "teaching-assignments.create", updatePermission: "teaching-assignments.update", deletePermission: "teaching-assignments.delete", titleKey: "teachingAssignments", createLabel: "createAssignment", fields: [{ name: "teacher_id", label: "teacherId", type: "number", min: 1, required: true }, { name: "academic_year_id", label: "academicYear", type: "select", source: "academic-years", required: true }, { name: "class_id", label: "class", type: "select", source: "school-classes", required: true }, { name: "section", label: "section", type: "text", required: true }, { name: "course_id", label: "course", type: "select", source: "courses", required: true }, { name: "semester", label: "semester", type: "select", options: [{ value: "semester_1", label: "Semester 1" }, { value: "semester_2", label: "Semester 2" }], required: true }, { name: "is_primary", label: "primaryAssignment", type: "boolean" }, { name: "start_date", label: "startDate", type: "date" }, { name: "end_date", label: "endDate", type: "date" }], columns: ["teacher", "class", "course", "academic_year", "section", "semester", "end_date"], lookups: ["academic-years", "school-classes", "courses"] },
  enrollments: { endpoint: "enrollments?per_page=25", permission: "student-enrollments.view", createPermission: "student-enrollments.create", updatePermission: "student-enrollments.update", deletePermission: "student-enrollments.delete", titleKey: "enrollments", createLabel: "enrollStudent", fields: [{ name: "member_id", label: "member", type: "select", source: "members", required: true }, { name: "academic_year_id", label: "academicYear", type: "select", source: "academic-years", required: true }, { name: "class_id", label: "class", type: "select", source: "school-classes", required: true }, { name: "section", label: "section", type: "text", required: true }, { name: "start_date", label: "startDate", type: "date", required: true }], columns: ["member", "academic_year", "class", "section", "start_date", "is_active"], lookups: ["members", "academic-years", "school-classes"] },
  assessments: { endpoint: "assessments", permission: "assessments.view", createPermission: "assessments.create", updatePermission: "assessments.update", deletePermission: "assessments.delete", titleKey: "assessments", createLabel: "createAssessment", fields: [{ name: "teaching_assignment_id", label: "teachingAssignment", type: "select", source: "teaching-assignments", required: true }, { name: "name", label: "name", type: "localized", required: true }, { name: "total_score", label: "totalScore", type: "number", min: 0.01, required: true }, { name: "weight_percentage", label: "weightPercentage", type: "number", min: 0, max: 100, required: true }], columns: ["name", "teaching_assignment", "total_score", "weight_percentage"], lookups: ["teaching-assignments"] },
  "assessment-results": { endpoint: "assessment-results", permission: "assessment-results.view", createPermission: "assessment-results.create", updatePermission: "assessment-results.update", deletePermission: "assessment-results.delete", titleKey: "assessmentResults", createLabel: "recordResult", fields: [{ name: "assessment_id", label: "assessment", type: "select", source: "assessments", required: true }, { name: "member_id", label: "member", type: "select", source: "members", required: true }, { name: "score", label: "score", type: "number", min: 0, required: true }, { name: "remarks", label: "remarks", type: "localized" }], columns: ["assessment", "member", "score", "remarks"], lookups: ["assessments", "members"] },
};

function payloadRows<T>(payload: unknown): { data: T[]; page: number; pages: number; total: number } {
  if (!payload || typeof payload !== "object") return { data: [], page: 1, pages: 1, total: 0 };
  const value = payload as { data?: unknown; pagination?: { current_page?: number; total_pages?: number; total?: number }; meta?: { current_page?: number; last_page?: number; total?: number } };
  const data = Array.isArray(value.data) ? value.data as T[] : value.data && typeof value.data === "object" && Array.isArray((value.data as { data?: T[] }).data) ? (value.data as { data: T[] }).data : [];
  const pagination = (value.pagination ?? value.meta) as { current_page?: number; total_pages?: number; last_page?: number; total?: number } | undefined;
  return { data, page: pagination?.current_page ?? 1, pages: pagination?.total_pages ?? pagination?.last_page ?? 1, total: pagination?.total ?? data.length };
}

function nestedText(value: unknown, language: "en" | "am" | "om" = "en"): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
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
    if (item.title) return nestedText(item.title, language);
    return String(item.full_name ?? item.code ?? item.id ?? "—");
  }
  return String(value);
}

export function SchoolManagementWorkspace({ module }: { module: SchoolModule }) {
  const config = MODULES[module];
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const [rows, setRows] = useState<Row[]>([]);
  const [lookups, setLookups] = useState<Record<string, Lookup[]>>({});
  const [form, setForm] = useState<Record<string, string | number | boolean | Record<string, string>>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [initialForm, setInitialForm] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [entryLanguage, setEntryLanguage] = useState<SupportedLocale>("en");
  const [notice, setNotice] = useState("");
  const [rowAction, setRowAction] = useState<Row | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [endingAssignment, setEndingAssignment] = useState<Row | null>(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [actionFields, setActionFields] = useState({ new_class_id: "", new_section: "", transfer_date: new Date().toISOString().slice(0, 10), withdrawal_date: new Date().toISOString().slice(0, 10), reason: "" });

  const can = useCallback((key: string) => permissions.has(key), [permissions]);
  const request = useCallback(async (path: string, method = "GET", body?: unknown) => {
    const response = await schoolManagementService.request(path, method, body, user?.id);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const validation = result.errors && typeof result.errors === "object" ? Object.values(result.errors as Record<string, unknown>).flat().map(String).join(" ") : "";
      const failure = new Error(validation || result.message || "The request could not be completed.") as Error & { fieldErrors?: Record<string, string> };
      if (result.errors && typeof result.errors === "object") failure.fieldErrors = Object.fromEntries(Object.entries(result.errors as Record<string, unknown>).map(([key, value]) => [key, Array.isArray(value) ? value.map(String).join(" ") : String(value)]));
      throw failure;
    }
    return result as Record<string, unknown>;
  }, []);

  const load = useCallback(async () => {
    if (!can(config.permission)) { setRows([]); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const result = payloadRows<Row>(await request(`${config.endpoint}${config.endpoint.includes("?") ? "&" : "?"}page=${page}`));
      setRows(result.data); setPages(result.pages); setTotal(result.total);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load records."); }
    finally { setLoading(false); }
  }, [can, config.endpoint, config.permission, page, request]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let active = true;
    const sources = config.lookups ?? [];
    if (!sources.length) return;
    void Promise.allSettled(sources.map(async (source) => [source, payloadRows<Lookup>(await request(`${source}?per_page=100`)).data] as const)).then((results) => {
      if (!active) return;
      const next: Record<string, Lookup[]> = {};
      for (const result of results) if (result.status === "fulfilled") next[result.value[0]] = result.value[1];
      setLookups(next);
    });
    return () => { active = false; };
  }, [config.lookups, request]);

  const beginCreate = () => { setEditing(null); setEntryLanguage("en"); const initial = Object.fromEntries(config.fields.map((field) => [field.name, field.type === "boolean" ? false : field.type === "localized" ? { en: "", am: "", om: "" } : ""])); setForm(initial); setInitialForm(JSON.stringify(initial)); setFormOpen(true); setError(""); setNotice(""); };
  const beginEdit = (row: Row) => { setEditing(row); setEntryLanguage("en"); const initial = Object.fromEntries(config.fields.map((field) => { const value = row[field.name]; if (field.type === "localized") { let translations: Record<string, string> = { en: "", am: "", om: "" }; if (value && typeof value === "object") { translations = value as Record<string, string>; } else if (typeof value === "string") { try { const parsed = JSON.parse(value); translations = parsed && typeof parsed === "object" ? parsed : { en: value }; } catch { translations = { en: value }; } } return [field.name, { en: translations.en ?? "", am: translations.am ?? "", om: translations.om ?? "" }]; } return [field.name, value === null || value === undefined ? "" : field.type === "boolean" ? Boolean(value) : String(value)]; })); setForm(initial); setInitialForm(JSON.stringify(initial)); setFormOpen(true); setError(""); setNotice(""); };
  const closeForm = () => { if (saving) return; if (JSON.stringify(form) !== initialForm) { setDiscardOpen(true); return; } setFormOpen(false); setEditing(null); };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || (editing ? !config.updatePermission || !can(config.updatePermission) : !config.createPermission || !can(config.createPermission))) return;
    setSaving(true); setError(""); setFieldErrors({}); setNotice("");

    for (const field of config.fields) {
      if (field.type === "localized" && field.required) {
        const val = form[field.name] as Record<string, string> | undefined;
        if (!val?.en || !val.en.trim()) {
          setError(t("management.englishMandatory", { defaultValue: `English ${t(`management.${field.label}`)} is required.` }));
          setSaving(false);
          return;
        }
      }
    }

    try {
      const body = Object.fromEntries(Object.entries(form).map(([key, value]) => {
        const fieldConfig = config.fields.find((f) => f.name === key);
        if (fieldConfig?.type === "localized") {
          const localizedVal = (value as Record<string, string> | undefined) ?? {};
          const cleanObj: Record<string, string> = {};
          if (localizedVal.en?.trim()) cleanObj.en = localizedVal.en.trim();
          if (localizedVal.am?.trim()) cleanObj.am = localizedVal.am.trim();
          if (localizedVal.om?.trim()) cleanObj.om = localizedVal.om.trim();
          return [key, cleanObj];
        }
        return [key, value === "" ? null : value];
      }));
      await request(editing ? `${config.endpoint.split("?")[0]}/${editing.id}` : config.endpoint.split("?")[0], editing ? "PUT" : "POST", body);
      setNotice(t(editing ? "administration.recordUpdated" : "administration.recordCreated")); setFormOpen(false); setEditing(null); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save this record."); setFieldErrors(cause && typeof cause === "object" && "fieldErrors" in cause ? (cause as Error & { fieldErrors: Record<string, string> }).fieldErrors : {}); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!pendingDelete || !config.deletePermission || !can(config.deletePermission)) return;
    setSaving(true); setError(""); setNotice("");
    try { await request(`${config.endpoint.split("?")[0]}/${pendingDelete.id}`, "DELETE"); setPendingDelete(null); setNotice(t("administration.recordDeleted")); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete this record."); }
    finally { setSaving(false); }
  };

  const viewRecord = async (row: Row) => {
    setError("");
    try {
      const result = await request(`${config.endpoint.split("?")[0]}/${row.id}`);
      setViewing((result.data && typeof result.data === "object" ? result.data : result) as Row);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load this record."); }
  };

  const endAssignment = async () => {
    if (!endingAssignment || !can("teaching-assignments.update") || saving) return;
    setSaving(true); setError("");
    try { await request(`teaching-assignments/${endingAssignment.id}/end`, "POST", { end_date: endDate }); setEndingAssignment(null); setNotice(t("management.assignmentEnded")); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to end assignment."); }
    finally { setSaving(false); }
  };

  const rowLabel = (field: string, row: Row): unknown => {
    const value = row[field];
    if (["class_id", "next_class_id"].includes(field)) return lookups["school-classes"]?.find((option) => option.id === Number(value))?.name ?? value;
    if (field === "course_id") return lookups.courses?.find((option) => option.id === Number(value))?.name ?? row.course;
    if (field === "academic_year_id") return lookups["academic-years"]?.find((option) => option.id === Number(value))?.name ?? row.academic_year;
    if (field === "member_id") return row.member ?? lookups.members?.find((option) => option.id === Number(value))?.full_name ?? value;
    if (field === "teacher") return row.teacher;
    if (field === "teaching_assignment_id") return row.teaching_assignment ?? value;
    if (field === "assessment_id") return row.assessment ?? value;
    return value;
  };

  const optionsFor = (field: Field) => {
    if (field.options) return field.options;
    return (lookups[field.source ?? ""] ?? []).map((option) => ({ value: String(option.id), label: `${nestedText(option.name ?? option.full_name ?? option.title, language)}${option.code ? ` Â· ${option.code}` : ""}` }));
  };

  const performEnrollmentAction = async (action: "transfer" | "withdraw") => {
    if (!rowAction || saving || (action === "transfer" ? !can("student-enrollments.update") : !can("student-enrollments.delete"))) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const body = action === "transfer" ? { new_class_id: Number(actionFields.new_class_id), new_section: actionFields.new_section, transfer_date: actionFields.transfer_date, reason: actionFields.reason || null } : { withdrawal_date: actionFields.withdrawal_date, reason: actionFields.reason || null };
      await request(`enrollments/members/${(rowAction.member as { id?: number } | undefined)?.id ?? rowAction.member_id}/${action}`, "POST", body);
      setNotice(t(action === "transfer" ? "administration.studentTransferred" : "administration.studentWithdrawn")); setRowAction(null); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update this enrollment."); }
    finally { setSaving(false); }
  };

  if (!can(config.permission)) return null;
  if (loading && rows.length === 0) return <ManagementPageShimmerSkeleton />;

  return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{t("dashboard.groups.school")}</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{t(`management.${config.titleKey}`)}</h1><p className="mt-1 text-sm text-slate-500">{total} {t("administration.records")}</p></div><div className="flex gap-2"><button onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />{t("administration.refresh")}</button>{config.createPermission && can(config.createPermission) && <button onClick={beginCreate} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800"><Plus className="h-4 w-4" />{t(`management.${config.createLabel}`)}</button>}</div></header>
    {(error || notice) && <p role={error ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || notice}</p>}
    {formOpen && <AdminModal open={formOpen} onOpenChange={(open) => { if (!open) closeForm(); }} title={t(editing ? "administration.editRecord" : `management.${config.createLabel}`)} description={t("administration.modalDescription", { defaultValue: "Enter the record details below." })} size="xl" headerAction={config.fields.some((field) => field.type === "localized") ? <div className="w-36 sm:w-44"><AppSelect value={entryLanguage} onChange={(val) => setEntryLanguage(val as SupportedLocale)} options={[{ value: "en", label: "English (en)" }, { value: "am", label: "አማርኛ (am)" }, { value: "om", label: "Afaan Oromoo (om)" }]} size="sm" ariaLabel="Modal data entry language" /></div> : null}><form onSubmit={(event) => void save(event)} className="space-y-4">{error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}<div className="grid gap-3 sm:grid-cols-2">{config.fields.map((field) => field.type === "localized" ? <div key={field.name} className="sm:col-span-2"><LocalizedFieldInput label={t(`management.${field.label}`)} value={(form[field.name] as Record<string, string>) ?? { en: "", am: "", om: "" }} onChange={(val) => setForm((current) => ({ ...current, [field.name]: val }))} activeLocale={entryLanguage} onLocaleChange={setEntryLanguage} required={field.required} multiline={field.label === "description" || field.label === "remarks"} errors={fieldErrors} /></div> : <label key={field.name} className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{t(`management.${field.label}`)}{Object.entries(fieldErrors).filter(([key]) => key === field.name || key.startsWith(`${field.name}.`)).map(([key, message]) => <span key={key} role="alert" className="mt-1 block text-xs font-normal text-rose-700">{message}</span>)}{field.type === "boolean" ? <span className="mt-2 flex min-h-10 items-center gap-2"><input type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.checked }))} className="h-4 w-4 accent-blue-700" />{t("management.enabled")}</span> : field.type === "select" && optionsFor(field).length ? <div className="mt-1.5"><AppSelect value={String(form[field.name] ?? "")} onChange={(val) => setForm((current) => ({ ...current, [field.name]: val }))} options={optionsFor(field)} placeholder={t("management.selectOption")} required={field.required} /></div> : field.type === "textarea" ? <textarea required={field.required} value={String(form[field.name] ?? "")} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} className="mt-1.5 min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal" /> : <input required={field.required} type={field.type === "select" ? "number" : field.type} min={field.min} max={field.max} value={String(form[field.name] ?? "")} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal" />}</label>)}</div><div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><button type="button" disabled={saving} onClick={closeForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">{t("administration.cancel")}</button><button disabled={saving} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? t("administration.saving") : t(editing ? "administration.saveRecord" : "administration.createRecord")}</button></div></form></AdminModal>}
    {rowAction && <AdminModal open={Boolean(rowAction)} onOpenChange={(open) => { if (!open && !saving) setRowAction(null); }} title={`${t("administration.enrollmentAction")}: ${nestedText(rowAction.member)}`} description={t("administration.modalDescription", { defaultValue: "Review the details before saving." })} showHeader={false} size="lg"><form onSubmit={(event) => { event.preventDefault(); void performEnrollmentAction("transfer"); }} className="space-y-4"><div className="mb-3 flex items-center justify-between"><h2 id="enrollment-action-title" className="font-semibold">{t("administration.enrollmentAction")}: {nestedText(rowAction.member)}</h2><button type="button" onClick={() => setRowAction(null)} aria-label={t("administration.cancel")}><X className="h-4 w-4" /></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium">{t("management.newClass")}<div className="mt-1"><AppSelect value={actionFields.new_class_id} onChange={(val) => setActionFields({ ...actionFields, new_class_id: val })} options={(lookups["school-classes"] || []).map((item) => ({ value: String(item.id), label: nestedText(item.name) }))} placeholder={t("management.selectOption")} required /></div></label><label className="text-xs font-medium">{t("management.newSection")}<input required value={actionFields.new_section} onChange={(event) => setActionFields({ ...actionFields, new_section: event.target.value })} className="mt-1 w-full rounded border p-2" /></label><label className="text-xs font-medium">{t("management.transferDate")}<input required type="date" value={actionFields.transfer_date} onChange={(event) => setActionFields({ ...actionFields, transfer_date: event.target.value })} className="mt-1 w-full rounded border p-2" /></label><label className="text-xs font-medium sm:col-span-2">{t("management.reason")}<input value={actionFields.reason} maxLength={255} onChange={(event) => setActionFields({ ...actionFields, reason: event.target.value })} className="mt-1 w-full rounded border p-2" /></label></div><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => void performEnrollmentAction("withdraw")} disabled={!can("student-enrollments.delete") || saving} className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-40">{t("management.withdrawStudent")}</button><button disabled={saving || !can("student-enrollments.update")} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t("management.transferStudent")}</button></div></form></AdminModal>}
        {endingAssignment && <AdminModal open={Boolean(endingAssignment)} onOpenChange={(open) => { if (!open && !saving) setEndingAssignment(null); }} title={t("management.endAssignment")} description={t("administration.modalDescription", { defaultValue: "Enter the date this assignment ends." })} size="md"><form onSubmit={(event) => { event.preventDefault(); void endAssignment(); }} className="space-y-5"><label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t("management.endDate")}<input required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 px-3 dark:border-slate-700 dark:bg-slate-950" /></label>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-100 bg-white pt-4 dark:border-slate-800 dark:bg-slate-900"><button type="button" disabled={saving} onClick={() => setEndingAssignment(null)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">{t("administration.cancel")}</button><button type="submit" disabled={saving} className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? t("administration.saving") : t("administration.saveRecord")}</button></div></form></AdminModal>}
    {viewing && <AdminModal open={Boolean(viewing)} onOpenChange={(open) => { if (!open) setViewing(null); }} title={nestedText(viewing.name ?? viewing.code ?? `${config.titleKey} #${viewing.id}`)} description={t("administration.viewRecord", { defaultValue: "Record details" })} size="lg"><dl className="grid gap-4 sm:grid-cols-2">{config.columns.map((column) => <div key={column} className="min-w-0"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(`management.${column}`)}</dt><dd className="mt-1 break-words text-sm text-slate-900 dark:text-slate-100">{nestedText(rowLabel(column, viewing), language)}</dd></div>)}</dl><div className="mt-6 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800"><button type="button" onClick={() => setViewing(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">{t("administration.close", { defaultValue: "Close" })}</button></div></AdminModal>}    <ConfirmDialog isOpen={discardOpen} onClose={() => setDiscardOpen(false)} onConfirm={() => { setDiscardOpen(false); setFormOpen(false); setEditing(null); }} title={t("administration.discardChanges", { defaultValue: "Discard changes?" })} description={t("administration.unsavedChanges", { defaultValue: "Your unsaved changes will be lost." })} variant="primary" />
    <ConfirmDialog isOpen={Boolean(pendingDelete)} onClose={() => { if (!saving) setPendingDelete(null); }} onConfirm={() => void remove()} isLoading={saving} title={t("administration.delete")} description={`${t("administration.confirmDeleteRecord", { defaultValue: "This action cannot be undone." })} ${nestedText(pendingDelete?.name ?? pendingDelete?.code ?? pendingDelete?.id)}`} />
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{config.columns.map((column) => <th key={column} className="px-4 py-3">{t(`management.${column}`)}</th>)}{(config.permission || config.updatePermission || config.deletePermission || module === "enrollments") && <th className="px-4 py-3 text-right">{t("administration.actions")}</th>}</tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={config.columns.length + 1} className="p-4"><TableShimmerSkeleton rows={5} columns={config.columns.length + 1} /></td></tr> : rows.map((row) => <tr key={row.id}>{config.columns.map((column) => <td key={column} className="px-4 py-3 text-slate-700">{nestedText(rowLabel(column, row), language)}</td>)}{(config.permission || config.updatePermission || config.deletePermission || module === "enrollments") && <td className="px-4 py-3 text-right"><button onClick={() => void viewRecord(row)} aria-label={`${t("administration.view")} ${row.id}`} className="rounded-md p-2 text-slate-600 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>{module === "enrollments" && Boolean(row.is_active) && can("student-enrollments.update") && <button onClick={() => { setRowAction(row); setActionFields((current) => ({ ...current, new_class_id: String(lookups["school-classes"]?.[0]?.id ?? "") })); }} className="mr-2 rounded-md border border-slate-300 px-2.5 py-2 text-xs font-semibold">{t("management.transferStudent")}</button>}{module === "teaching-assignments" && (row.end_date === null || row.end_date === undefined || row.end_date === "") && config.updatePermission && can(config.updatePermission) && <button onClick={() => { setEndingAssignment(row); setEndDate(new Date().toISOString().slice(0, 10)); }} className="mr-2 rounded-md border border-slate-300 px-2.5 py-2 text-xs font-semibold">{t("management.endAssignment")}</button>}{config.updatePermission && module !== "teaching-assignments" && module !== "enrollments" && can(config.updatePermission) && <button onClick={() => beginEdit(row)} aria-label={`${t("administration.edit")} ${row.id}`} className="rounded-md p-2 text-slate-600 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>}{config.deletePermission && module !== "enrollments" && can(config.deletePermission) && <button onClick={() => setPendingDelete(row)} aria-label={`${t("administration.delete")} ${row.id}`} className="rounded-md p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}</td>}</tr>)}{!loading && rows.length === 0 && <tr><td colSpan={config.columns.length + 1} className="px-4 py-12 text-center text-slate-500">{t("administration.noRecords")}</td></tr>}</tbody></table></div>
    <div className="flex items-center justify-between text-sm text-slate-600"><span>{t("management.pageOf", { defaultValue: `Page ${page} of ${Math.max(pages, 1)}` }).replace("{{page}}", String(page)).replace("{{pages}}", String(pages))}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-40">{t("management.previous")}</button><button disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-40">{t("management.next")}</button></div></div>
  </main>;
}




