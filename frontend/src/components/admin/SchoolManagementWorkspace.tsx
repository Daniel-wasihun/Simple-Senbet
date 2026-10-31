"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AdminModal } from "@/components/admin/AdminModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { schoolManagementService } from "@/services/schoolManagement.service";
import { TableShimmerSkeleton, SchoolManagementWorkspaceShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";
import { AppSelect } from "@/components/ui/AppSelect";
import { LocalizedFieldInput, SupportedLocale } from "@/components/admin/LocalizedFieldInput";
import { toast } from "sonner";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  inputCls,
  labelCls,
  textareaCls,
  tableContainerCls,
  tableHeaderCellCls,
  tableHeaderRowCls,
  tableRowCls,
  actionBtnView,
  actionBtnEdit,
  actionBtnDelete,
  modalStickyFooter,
  detailCardCls,
  nestedLocalizedText,
} from "@/components/admin/adminUiTokens";

export type SchoolModule =
  | "academic-years"
  | "school-classes"
  | "courses"
  | "teaching-assignments"
  | "assessments"
  | "assessment-results";

type FieldType = "text" | "number" | "date" | "textarea" | "boolean" | "select" | "localized";

type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  source?: string;
  options?: Array<{ value: string; label: string }>;
};

type Row = Record<string, unknown> & { id: number };

type Lookup = {
  id: number;
  name?: string | Record<string, string>;
  full_name?: string;
  title?: string;
  code?: string;
  teacher?: { name: string };
  class?: { name: string };
  member?: { full_name: string };
  academic_year?: { name: string };
  school_class?: { name: string };
};

const MODULES: Record<
  SchoolModule,
  {
    endpoint: string;
    permission: string;
    titleKey: string;
    eyebrow: string;
    createPermission?: string;
    updatePermission?: string;
    deletePermission?: string;
    createLabel: string;
    fields: Field[];
    columns: string[];
    lookups?: string[];
  }
> = {
  "academic-years": {
    endpoint: "academic-years",
    permission: "academic-years.view",
    titleKey: "academicYears",
    eyebrow: "Academic Setup",
    createPermission: "academic-years.create",
    updatePermission: "academic-years.update",
    deletePermission: "academic-years.delete",
    createLabel: "createAcademicYear",
    fields: [
      { name: "name", label: "name", type: "localized", required: true },
      { name: "start_date", label: "startDate", type: "date", required: true },
      { name: "end_date", label: "endDate", type: "date", required: true },
      { name: "is_current", label: "currentYear", type: "boolean" },
    ],
    columns: ["name", "start_date", "end_date", "is_current"],
  },
  "school-classes": {
    endpoint: "school-classes",
    permission: "school-classes.view",
    titleKey: "classes",
    eyebrow: "Class Structure",
    createPermission: "school-classes.create",
    updatePermission: "school-classes.update",
    deletePermission: "school-classes.delete",
    createLabel: "createClass",
    fields: [
      { name: "name", label: "name", type: "localized", required: true },
      { name: "code", label: "code", type: "text", required: true },
      { name: "number_of_sections", label: "numberOfSections", type: "number", min: 1, required: true },
      { name: "passing_score", label: "passingScore", type: "number", min: 0, max: 100, required: true },
      { name: "next_class_id", label: "nextClass", type: "select", source: "school-classes" },
    ],
    columns: ["name", "code", "number_of_sections", "passing_score"],
    lookups: ["school-classes"],
  },
  courses: {
    endpoint: "courses",
    permission: "courses.view",
    titleKey: "courses",
    eyebrow: "Curriculum",
    createPermission: "courses.create",
    updatePermission: "courses.update",
    deletePermission: "courses.delete",
    createLabel: "createCourse",
    fields: [
      { name: "name", label: "name", type: "localized", required: true },
      { name: "code", label: "code", type: "text", required: true },
      { name: "description", label: "description", type: "localized" },
      { name: "credit_hour", label: "creditHours", type: "number", min: 1, required: true },
      { name: "class_id", label: "class", type: "select", source: "school-classes", required: true },
    ],
    columns: ["name", "code", "class_id", "credit_hour"],
    lookups: ["school-classes"],
  },
  "teaching-assignments": {
    endpoint: "teaching-assignments",
    permission: "teaching-assignments.view",
    titleKey: "teachingAssignments",
    eyebrow: "Faculty Allocation",
    createPermission: "teaching-assignments.create",
    updatePermission: "teaching-assignments.update",
    deletePermission: "teaching-assignments.delete",
    createLabel: "createAssignment",
    fields: [
      { name: "teacher_id", label: "teacherId", type: "number", min: 1, required: true },
      { name: "class_id", label: "class", type: "select", source: "school-classes", required: true },
      { name: "section", label: "section", type: "text", required: true },
      { name: "course_id", label: "course", type: "select", source: "courses", required: true },
      {
        name: "semester",
        label: "semester",
        type: "select",
        options: [
          { value: "semester_1", label: "Semester 1" },
          { value: "semester_2", label: "Semester 2" },
        ],
        required: true,
      },
      { name: "is_primary", label: "primaryAssignment", type: "boolean" },
      { name: "start_date", label: "startDate", type: "date" },
      { name: "end_date", label: "endDate", type: "date" },
    ],
    columns: ["teacher", "class", "course", "section", "semester", "end_date"],
    lookups: ["school-classes", "courses"],
  },
  assessments: {
    endpoint: "assessments",
    permission: "assessments.view",
    titleKey: "assessments",
    eyebrow: "Grading & Exams",
    createPermission: "assessments.create",
    updatePermission: "assessments.update",
    deletePermission: "assessments.delete",
    createLabel: "createAssessment",
    fields: [
      { name: "teaching_assignment_id", label: "teachingAssignment", type: "select", source: "teaching-assignments", required: true },
      { name: "name", label: "name", type: "localized", required: true },
      { name: "total_score", label: "totalScore", type: "number", min: 0.01, required: true },
      { name: "weight_percentage", label: "weightPercentage", type: "number", min: 0, max: 100, required: true },
    ],
    columns: ["name", "teaching_assignment", "total_score", "weight_percentage"],
    lookups: ["teaching-assignments"],
  },
  "assessment-results": {
    endpoint: "assessment-results",
    permission: "assessment-results.view",
    titleKey: "assessmentResults",
    eyebrow: "Student Grades",
    createPermission: "assessment-results.create",
    updatePermission: "assessment-results.update",
    deletePermission: "assessment-results.delete",
    createLabel: "recordResult",
    fields: [
      { name: "assessment_id", label: "assessment", type: "select", source: "assessments", required: true },
      { name: "member_id", label: "member", type: "select", source: "members", required: true },
      { name: "score", label: "score", type: "number", min: 0, required: true },
      { name: "remarks", label: "remarks", type: "localized" },
    ],
    columns: ["assessment", "member", "score", "remarks"],
    lookups: ["assessments", "members"],
  },
};

function payloadRows<T>(payload: unknown): { data: T[]; page: number; pages: number; total: number } {
  if (!payload || typeof payload !== "object") return { data: [], page: 1, pages: 1, total: 0 };
  const value = payload as {
    data?: unknown;
    pagination?: { current_page?: number; total_pages?: number; total?: number };
    meta?: { current_page?: number; last_page?: number; total?: number };
  };
  const data = Array.isArray(value.data)
    ? (value.data as T[])
    : value.data && typeof value.data === "object" && Array.isArray((value.data as { data?: T[] }).data)
      ? (value.data as { data: T[] }).data
      : [];
  const pagination = (value.pagination ?? value.meta) as
    | { current_page?: number; total_pages?: number; last_page?: number; total?: number }
    | undefined;
  return {
    data,
    page: pagination?.current_page ?? 1,
    pages: pagination?.total_pages ?? pagination?.last_page ?? 1,
    total: pagination?.total ?? data.length,
  };
}

export function SchoolManagementWorkspace({ module }: { module: SchoolModule }) {
  const config = MODULES[module];
  const { user } = useAuth();
  const { language } = useLanguage();
  const locale = (language as SupportedLocale) || "en";
  const { t } = useTranslation();

  const isSuperOrAdmin = useMemo(() => {
    if (!user) return false;
    const r = (user.role || "").toLowerCase();
    const roles = (user.roles || []).map((x: any) =>
      (typeof x === "string" ? x : x.name || "").toLowerCase()
    );
    const adminRoles = [
      "superadmin",
      "admin",
      "administrator",
      "academic_director",
      "academic_administrator",
      "member_coordinator",
    ];
    if (adminRoles.includes(r)) return true;
    return roles.some((x) => adminRoles.includes(x));
  }, [user]);

  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const can = useCallback(
    (key: string) => {
      if (isSuperOrAdmin) return true;
      return permissions.has(key) || permissions.has("*");
    },
    [isSuperOrAdmin, permissions]
  );

  /* ── local state ─────────────────────────────────────────────────── */
  const [rows, setRows] = useState<Row[]>([]);
  const [lookups, setLookups] = useState<Record<string, Lookup[]>>({});
  const [form, setForm] = useState<Record<string, string | number | boolean | Record<string, string>>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [initialForm, setInitialForm] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [lookupFilter, setLookupFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [entryLanguage, setEntryLanguage] = useState<SupportedLocale>("en");
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [endingAssignment, setEndingAssignment] = useState<Row | null>(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  /* ── API request helper ──────────────────────────────────────────── */
  const request = useCallback(
    async (path: string, method = "GET", body?: unknown) => {
      const response = await schoolManagementService.request(path, method, body, user?.id);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const validation =
          result.errors && typeof result.errors === "object"
            ? Object.values(result.errors as Record<string, unknown>).flat().map(String).join(" ")
            : "";
        const failure = new Error(validation || result.message || "The request could not be completed.") as Error & {
          fieldErrors?: Record<string, string>;
        };
        if (result.errors && typeof result.errors === "object") {
          failure.fieldErrors = Object.fromEntries(
            Object.entries(result.errors as Record<string, unknown>).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.map(String).join(" ") : String(value),
            ])
          );
        }
        throw failure;
      }
      return result as Record<string, unknown>;
    },
    [user?.id]
  );

  /* ── Data loader ─────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!can(config.permission)) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const queryParts: string[] = [`page=${page}`, `per_page=${perPage}`];
      if (search.trim()) queryParts.push(`search=${encodeURIComponent(search.trim())}`);
      if (lookupFilter !== "all") {
        if (module === "courses" || module === "teaching-assignments") {
          queryParts.push(`class_id=${encodeURIComponent(lookupFilter)}`);
        } else if (module === "assessments") {
          queryParts.push(`teaching_assignment_id=${encodeURIComponent(lookupFilter)}`);
        } else if (module === "assessment-results") {
          queryParts.push(`assessment_id=${encodeURIComponent(lookupFilter)}`);
        }
      }
      const endpoint = `${config.endpoint}${config.endpoint.includes("?") ? "&" : "?"}${queryParts.join("&")}`;
      const result = payloadRows<Row>(await request(endpoint));
      setRows(result.data);
      setPages(result.pages);
      setTotal(result.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load records.");
    } finally {
      setLoading(false);
    }
  }, [can, config.endpoint, config.permission, lookupFilter, module, page, perPage, request, search]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ── Load auxiliary lookup sources ────────────────────────────────── */
  useEffect(() => {
    let active = true;
    const sources = config.lookups ?? [];
    if (!sources.length) return;
    void Promise.allSettled(
      sources.map(
        async (source) =>
          [source, payloadRows<Lookup>(await request(`${source}?per_page=100`)).data] as const
      )
    ).then((results) => {
      if (!active) return;
      const next: Record<string, Lookup[]> = {};
      for (const result of results) {
        if (result.status === "fulfilled") next[result.value[0]] = result.value[1];
      }
      setLookups(next);
    });
    return () => {
      active = false;
    };
  }, [config.lookups, request]);

  /* ── Modals open / close ─────────────────────────────────────────── */
  const beginCreate = () => {
    setEditing(null);
    setEntryLanguage(locale);
    const initial = Object.fromEntries(
      config.fields.map((field) => [
        field.name,
        field.type === "boolean" ? false : field.type === "localized" ? { en: "", am: "", om: "" } : "",
      ])
    );
    setForm(initial);
    setInitialForm(JSON.stringify(initial));
    setFieldErrors({});
    setError("");
    setFormOpen(true);
  };

  const beginEdit = (row: Row) => {
    setEditing(row);
    setEntryLanguage(locale);
    const initial = Object.fromEntries(
      config.fields.map((field) => {
        const value = row[field.name];
        if (field.type === "localized") {
          let translations: Record<string, string> = { en: "", am: "", om: "" };
          if (value && typeof value === "object") {
            translations = value as Record<string, string>;
          } else if (typeof value === "string") {
            try {
              const parsed = JSON.parse(value);
              translations = parsed && typeof parsed === "object" ? parsed : { en: value };
            } catch {
              translations = { en: value };
            }
          }
          return [
            field.name,
            { en: translations.en ?? "", am: translations.am ?? "", om: translations.om ?? "" },
          ];
        }
        return [
          field.name,
          value === null || value === undefined ? "" : field.type === "boolean" ? Boolean(value) : String(value),
        ];
      })
    );
    setForm(initial);
    setInitialForm(JSON.stringify(initial));
    setFieldErrors({});
    setError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    if (JSON.stringify(form) !== initialForm) {
      setDiscardOpen(true);
      return;
    }
    setFormOpen(false);
    setEditing(null);
  };

  /* ── Save / Create / Update ──────────────────────────────────────── */
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      saving ||
      (editing
        ? !config.updatePermission || !can(config.updatePermission)
        : !config.createPermission || !can(config.createPermission))
    )
      return;

    setSaving(true);
    setError("");
    setFieldErrors({});

    for (const field of config.fields) {
      if (field.type === "localized" && field.required) {
        const val = form[field.name] as Record<string, string> | undefined;
        if (!val?.en?.trim() && !val?.am?.trim() && !val?.om?.trim()) {
          setError(`${t(`management.${field.label}`, { defaultValue: field.label })} is required in at least one language.`);
          setSaving(false);
          return;
        }
      }
    }

    try {
      const body = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          const fieldConfig = config.fields.find((f) => f.name === key);
          if (fieldConfig?.type === "localized") {
            const localizedVal = (value as Record<string, string> | undefined) ?? {};
            const cleanObj: Record<string, string> = {};
            if (localizedVal.en?.trim()) cleanObj.en = localizedVal.en.trim();
            if (localizedVal.am?.trim()) cleanObj.am = localizedVal.am.trim();
            if (localizedVal.om?.trim()) cleanObj.om = localizedVal.om.trim();
            if (!cleanObj.en) {
              cleanObj.en = cleanObj.am || cleanObj.om || "";
            }
            return [key, cleanObj];
          }
          return [key, value === "" ? null : value];
        })
      );
      await request(
        editing ? `${config.endpoint.split("?")[0]}/${editing.id}` : config.endpoint.split("?")[0],
        editing ? "PUT" : "POST",
        body
      );
      toast.success(editing ? "Record updated successfully." : "Record created successfully.");
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this record.");
      setFieldErrors(
        cause && typeof cause === "object" && "fieldErrors" in cause
          ? (cause as Error & { fieldErrors: Record<string, string> }).fieldErrors
          : {}
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete record ───────────────────────────────────────────────── */
  const remove = async () => {
    if (!pendingDelete || !config.deletePermission || !can(config.deletePermission)) return;
    setSaving(true);
    try {
      await request(`${config.endpoint.split("?")[0]}/${pendingDelete.id}`, "DELETE");
      toast.success("Record deleted successfully.");
      setPendingDelete(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(pendingDelete.id);
        return next;
      });
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to delete this record.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Bulk delete records ─────────────────────────────────────────── */
  const handleBulkDelete = async () => {
    if (!config.deletePermission || !can(config.deletePermission)) return;
    const ids = Array.from(selected);
    setSaving(true);
    try {
      await Promise.all(
        ids.map((id) => request(`${config.endpoint.split("?")[0]}/${id}`, "DELETE"))
      );
      toast.success(`${ids.length} records removed.`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Bulk delete failed.");
    } finally {
      setSaving(false);
    }
  };

  /* ── View record details ─────────────────────────────────────────── */
  const viewRecord = async (row: Row) => {
    try {
      const result = await request(`${config.endpoint.split("?")[0]}/${row.id}`);
      setViewing((result.data && typeof result.data === "object" ? result.data : result) as Row);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to load record details.");
    }
  };

  /* ── End Teaching Assignment ─────────────────────────────────────── */
  const endAssignment = async () => {
    if (!endingAssignment || !can("teaching-assignments.update") || saving) return;
    setSaving(true);
    try {
      await request(`teaching-assignments/${endingAssignment.id}/end`, "POST", { end_date: endDate });
      setEndingAssignment(null);
      toast.success("Assignment ended successfully.");
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to end assignment.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Checkbox helpers ────────────────────────────────────────────── */
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* ── Label & formatting helpers ──────────────────────────────────── */
  const rowLabel = (field: string, row: Row): unknown => {
    const value = row[field];
    if (["class_id", "next_class_id"].includes(field)) {
      return lookups["school-classes"]?.find((option) => option.id === Number(value))?.name ?? value;
    }
    if (field === "course_id") {
      return lookups.courses?.find((option) => option.id === Number(value))?.name ?? row.course;
    }
    if (field === "academic_year_id") {
      return lookups["academic-years"]?.find((option) => option.id === Number(value))?.name ?? row.academic_year;
    }
    if (field === "member_id") {
      return row.member ?? lookups.members?.find((option) => option.id === Number(value))?.full_name ?? value;
    }
    if (field === "teacher") return row.teacher;
    if (field === "teaching_assignment_id") return row.teaching_assignment ?? value;
    if (field === "assessment_id") return row.assessment ?? value;
    return value;
  };

  const optionsFor = (field: Field) => {
    if (field.options) return field.options;
    return (lookups[field.source ?? ""] ?? []).map((option) => ({
      value: String(option.id),
      label: `${nestedLocalizedText(option.name ?? option.full_name ?? option.title, locale)}${
        option.code ? ` · ${option.code}` : ""
      }`,
    }));
  };

  // Primary lookup source for the toolbar filter
  const primaryLookupSource = config.lookups?.[0];
  const filterOptions = useMemo(() => {
    if (!primaryLookupSource || !lookups[primaryLookupSource]) return [];
    return [
      { value: "all", label: `Filter: All` },
      ...lookups[primaryLookupSource].map((item) => ({
        value: String(item.id),
        label: nestedLocalizedText(item.name ?? item.title ?? item.id, locale),
      })),
    ];
  }, [primaryLookupSource, lookups, locale]);

  // Client-side lookup filtering if active
  const filteredRows = useMemo(() => {
    if (lookupFilter === "all" || !primaryLookupSource) return rows;
    return rows.filter((r) => {
      const fieldMatch = Object.entries(r).find(([k, v]) => String(v) === lookupFilter);
      return Boolean(fieldMatch);
    });
  }, [rows, lookupFilter, primaryLookupSource]);

  if (!can(config.permission)) {
    return (
      <section className="m-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111624] p-8 text-center text-sm text-slate-500">
        You do not have permission to view {t(`management.${config.titleKey}`, { defaultValue: module })}.
      </section>
    );
  }

  if (loading && rows.length === 0) {
    return <SchoolManagementWorkspaceShimmerSkeleton moduleName={module} />;
  }

  return (
    <main className="w-full space-y-5 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-7">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {config.eyebrow}
          </p>
          <h1 className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {t(`management.${config.titleKey}`, { defaultValue: config.titleKey })}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {total} {t("administration.records", { defaultValue: "records registered" })}
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
          {config.createPermission && can(config.createPermission) && (
            <button type="button" onClick={beginCreate} className={btnPrimary}>
              <Plus className="h-3.5 w-3.5" />
              {t(`management.${config.createLabel}`, { defaultValue: "Create Record" })}
            </button>
          )}
        </div>
      </header>

      {/* ─── Search + Quick Filters Toolbar ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(pendingSearch);
              setPage(1);
            }}
            className="flex gap-1.5 w-full sm:w-96"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                placeholder={`Search ${t(`management.${config.titleKey}`, { defaultValue: "records" })}…`}
                className="h-9 w-full rounded-[4px] border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0858a8] focus:border-[#0858a8] shadow-2xs"
              />
            </div>
            <button type="submit" className={btnSecondary}>
              {t("administration.search", { defaultValue: "Search" })}
            </button>
          </form>

          {/* Optional Lookup Filter */}
          {filterOptions.length > 1 && (
            <div className="w-44">
              <AppSelect
                value={lookupFilter}
                onChange={(v) => {
                  setLookupFilter(v);
                  setPage(1);
                }}
                options={filterOptions}
                size="sm"
                ariaLabel="Filter records"
              />
            </div>
          )}

          {/* Reset Filters */}
          {(search || lookupFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPendingSearch("");
                setLookupFilter("all");
                setPage(1);
              }}
              className="inline-flex h-8 items-center gap-1 rounded-[4px] px-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Reset all filters"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Selected / Bulk Actions */}
        {selected.size > 0 && config.deletePermission && can(config.deletePermission) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selected.size} selected
            </span>
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              className={btnDanger}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* ─── Table ──────────────────────────────────────────────────── */}
      <div className={tableContainerCls}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className={tableHeaderRowCls}>
              <tr>
                {config.deletePermission && can(config.deletePermission) && (
                  <th className="w-10 py-3.5 pl-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded-[2px] border-slate-300 dark:border-slate-600 text-[#0858a8] cursor-pointer accent-[#0858a8]"
                      aria-label="Select all"
                    />
                  </th>
                )}
                {config.columns.map((column) => (
                  <th key={column} className={tableHeaderCellCls}>
                    {t(`management.${column}`, { defaultValue: column })}
                  </th>
                ))}
                {(config.permission || config.updatePermission || config.deletePermission) && (
                  <th className={`${tableHeaderCellCls} text-right`}>
                    {t("administration.actions", { defaultValue: "Actions" })}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length + 2} className="p-4">
                    <TableShimmerSkeleton rows={7} columns={config.columns.length + 1} />
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.columns.length + 2}
                    className="py-14 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    {t("administration.noRecords", { defaultValue: "No records found." })}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`${tableRowCls(selected.has(row.id))} ${
                      loading ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {config.deletePermission && can(config.deletePermission) && (
                      <td className="w-10 pl-4">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleOne(row.id)}
                          className="h-4 w-4 rounded-[2px] border-slate-300 dark:border-slate-600 cursor-pointer accent-[#0858a8]"
                          aria-label={`Select record #${row.id}`}
                        />
                      </td>
                    )}
                    {config.columns.map((column, idx) => (
                      <td
                        key={column}
                        className={`py-3 px-4 ${
                          idx === 0
                            ? "font-semibold text-slate-900 dark:text-slate-100 text-sm"
                            : "text-sm text-slate-600 dark:text-slate-300 font-medium"
                        }`}
                      >
                        {nestedLocalizedText(rowLabel(column, row), locale)}
                      </td>
                    ))}
                    {(config.permission || config.updatePermission || config.deletePermission) && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void viewRecord(row)}
                            aria-label={`View record #${row.id}`}
                            title="View Details"
                            className={actionBtnView}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {module === "teaching-assignments" &&
                            (row.end_date === null || row.end_date === undefined || row.end_date === "") &&
                            config.updatePermission &&
                            can(config.updatePermission) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEndingAssignment(row);
                                  setEndDate(new Date().toISOString().slice(0, 10));
                                }}
                                className="inline-flex h-8 items-center px-2.5 rounded-[4px] border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs"
                              >
                                {t("management.endAssignment", { defaultValue: "End" })}
                              </button>
                            )}
                          {config.updatePermission && module !== "teaching-assignments" && can(config.updatePermission) && (
                            <button
                              type="button"
                              onClick={() => beginEdit(row)}
                              aria-label={`Edit record #${row.id}`}
                              title="Edit Record"
                              className={actionBtnEdit}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {config.deletePermission && can(config.deletePermission) && (
                            <button
                              type="button"
                              onClick={() => setPendingDelete(row)}
                              aria-label={`Delete record #${row.id}`}
                              title="Delete Record"
                              className={actionBtnDelete}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Pagination ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Page {page} of {Math.max(pages, 1)}
          </span>
          <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Rows per page:</span>
            <div className="w-[74px]">
              <AppSelect
                value={String(perPage)}
                onChange={(v) => {
                  setPerPage(Number(v));
                  setPage(1);
                }}
                options={[
                  { value: "5", label: "5" },
                  { value: "10", label: "10" },
                  { value: "15", label: "15" },
                  { value: "25", label: "25" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" },
                ]}
                size="sm"
                ariaLabel="Rows per page"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((v) => Math.max(1, v - 1))}
            className={btnSecondary}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pages || loading}
            onClick={() => setPage((v) => Math.min(pages, v + 1))}
            className={btnSecondary}
          >
            Next
          </button>
        </div>
      </div>

      {/* ─── Create / Edit Modal ─────────────────────────────────────── */}
      {formOpen && (
        <AdminModal
          open={formOpen}
          onOpenChange={(o) => {
            if (!o) closeForm();
          }}
          title={t(editing ? "administration.editRecord" : `management.${config.createLabel}`, {
            defaultValue: editing ? "Edit Record" : "Create Record",
          })}
          description={t("administration.modalDescription", {
            defaultValue: "Enter the details for this record below.",
          })}
          size="2xl"
          headerAction={
            config.fields.some((field) => field.type === "localized") ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Language:
                </span>
                <div className="w-40">
                  <AppSelect
                    value={entryLanguage}
                    onChange={(val) => setEntryLanguage(val as SupportedLocale)}
                    options={[
                      { value: "en", label: "English" },
                      { value: "am", label: "አማርኛ" },
                      { value: "om", label: "Afaan Oromoo" },
                    ]}
                    size="sm"
                    ariaLabel="Data entry language"
                  />
                </div>
              </div>
            ) : null
          }
        >
          <form onSubmit={(e) => void save(e)} className="space-y-4 p-1">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {config.fields.map((field) => {
                if (field.type === "localized") {
                  return (
                    <div key={field.name} className="sm:col-span-2 lg:col-span-3">
                      <LocalizedFieldInput
                        label={t(`management.${field.label}`, { defaultValue: field.label })}
                        value={
                          (form[field.name] as Record<string, string>) ?? {
                            en: "",
                            am: "",
                            om: "",
                          }
                        }
                        onChange={(val) =>
                          setForm((current) => ({ ...current, [field.name]: val }))
                        }
                        activeLocale={entryLanguage}
                        onLocaleChange={setEntryLanguage}
                        required={field.required}
                        multiline={field.label === "description" || field.label === "remarks"}
                        errors={fieldErrors}
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.name}>
                    <label className={labelCls}>
                      {t(`management.${field.label}`, { defaultValue: field.label })}{" "}
                      {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === "boolean" ? (
                      <label className="flex h-9 items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(form[field.name])}
                          onChange={(e) =>
                            setForm((current) => ({ ...current, [field.name]: e.target.checked }))
                          }
                          className="h-4 w-4 rounded-[2px] border-slate-300 dark:border-slate-600 text-[#0858a8] cursor-pointer accent-[#0858a8]"
                        />
                        <span>{t("management.enabled", { defaultValue: "Enabled" })}</span>
                      </label>
                    ) : field.type === "select" && optionsFor(field).length ? (
                      <AppSelect
                        value={String(form[field.name] ?? "")}
                        onChange={(val) =>
                          setForm((current) => ({ ...current, [field.name]: val }))
                        }
                        options={optionsFor(field)}
                        placeholder={t("management.selectOption", { defaultValue: "Select option" })}
                        required={field.required}
                      />
                    ) : field.type === "textarea" ? (
                      <textarea
                        required={field.required}
                        value={String(form[field.name] ?? "")}
                        onChange={(e) =>
                          setForm((current) => ({ ...current, [field.name]: e.target.value }))
                        }
                        className={textareaCls(Boolean(fieldErrors[field.name]))}
                      />
                    ) : (
                      <input
                        required={field.required}
                        type={field.type === "select" ? "number" : field.type}
                        min={field.min}
                        max={field.max}
                        value={String(form[field.name] ?? "")}
                        onChange={(e) =>
                          setForm((current) => ({ ...current, [field.name]: e.target.value }))
                        }
                        className={inputCls(Boolean(fieldErrors[field.name]))}
                      />
                    )}

                    {fieldErrors[field.name] && (
                      <p className="mt-0.5 text-[11px] text-rose-500 font-medium">
                        {fieldErrors[field.name]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={modalStickyFooter}>
              <button type="button" onClick={closeForm} className={btnSecondary}>
                {t("administration.cancel", { defaultValue: "Cancel" })}
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving
                  ? t("administration.saving", { defaultValue: "Saving…" })
                  : t(editing ? "administration.saveRecord" : "administration.createRecord", {
                      defaultValue: editing ? "Save Changes" : "Create Record",
                    })}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ─── Detail View Modal ───────────────────────────────────────── */}
      {viewing && (
        <AdminModal
          open={Boolean(viewing)}
          onOpenChange={(o) => {
            if (!o) setViewing(null);
          }}
          title={nestedLocalizedText(viewing.name ?? viewing.code ?? `${config.titleKey} #${viewing.id}`, locale)}
          description={t("administration.viewRecord", { defaultValue: "Record details" })}
          size="lg"
        >
          <dl className="grid gap-3 sm:grid-cols-2 p-1">
            {config.columns.map((column) => (
              <div key={column} className={detailCardCls}>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {t(`management.${column}`, { defaultValue: column })}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {nestedLocalizedText(rowLabel(column, viewing), locale)}
                </dd>
              </div>
            ))}
          </dl>
        </AdminModal>
      )}

      {/* ─── End Assignment Modal ────────────────────────────────────── */}
      {endingAssignment && (
        <AdminModal
          open={Boolean(endingAssignment)}
          onOpenChange={(o) => {
            if (!o && !saving) setEndingAssignment(null);
          }}
          title={t("management.endAssignment", { defaultValue: "End Teaching Assignment" })}
          description="Enter the date when this teaching assignment concludes."
          size="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void endAssignment();
            }}
            className="space-y-4 p-1"
          >
            <div>
              <label className={labelCls}>
                {t("management.endDate", { defaultValue: "End Date" })}
              </label>
              <input
                required
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls()}
              />
            </div>
            <div className={modalStickyFooter}>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEndingAssignment(null)}
                className={btnSecondary}
              >
                {t("administration.cancel", { defaultValue: "Cancel" })}
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : "Confirm End Assignment"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ─── Discard Changes Dialog ──────────────────────────────────── */}
      <ConfirmDialog
        isOpen={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          setFormOpen(false);
          setEditing(null);
        }}
        title={t("administration.discardChanges", { defaultValue: "Discard changes?" })}
        description={t("administration.unsavedChanges", {
          defaultValue: "Unsaved changes will be lost.",
        })}
        variant="primary"
      />

      {/* ─── Single Delete Dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!saving) setPendingDelete(null);
        }}
        onConfirm={() => void remove()}
        isLoading={saving}
        title={t("administration.delete", { defaultValue: "Delete Record" })}
        description={`${t("administration.confirmDeleteRecord", {
          defaultValue: "This action cannot be undone. Remove:",
        })} ${nestedLocalizedText(pendingDelete?.name ?? pendingDelete?.code ?? pendingDelete?.id, locale)}?`}
      />

      {/* ─── Bulk Delete Dialog ───────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => void handleBulkDelete()}
        isLoading={saving}
        title="Remove Selected Records"
        description={`Are you sure you want to delete ${selected.size} selected records? This action cannot be undone.`}
        icon={<CheckSquare className="h-5 w-5 text-rose-500" />}
      />
    </main>
  );
}
