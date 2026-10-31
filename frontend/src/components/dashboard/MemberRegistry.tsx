"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  CheckSquare,
  Filter,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SchoolClassSummary } from "@/types/auth";
import { AdminModal } from "@/components/admin/AdminModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useMemberStore } from "@/store/useMemberStore";
import { schoolManagementService } from "@/services/schoolManagement.service";
import { MemberRegistryShimmerSkeleton, TableShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";
import { AppSelect } from "@/components/ui/AppSelect";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

/* ─── Locale types ───────────────────────────────────────────────────── */
export type SupportedLocale = "en" | "am" | "om";

type TranslatableField = { en: string; am: string; om: string };

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
  school_class?: { id: number; name: string | Record<string, string>; number_of_sections?: number } | null;
};

type Draft = {
  full_name: TranslatableField;
  christian_name: TranslatableField;
  emergency_contact_name: TranslatableField;
  sol_father_name: TranslatableField;
  date_of_birth: string;
  gender: string;
  class_id: number;
  section: string;
  phone_number: string;
  emergency_contact_phone: string;
  membership_date: string;
};

/* ─── Constants ──────────────────────────────────────────────────────── */
const emptyTranslatable: TranslatableField = { en: "", am: "", om: "" };

const emptyDraft: Draft = {
  full_name: { ...emptyTranslatable },
  christian_name: { ...emptyTranslatable },
  emergency_contact_name: { ...emptyTranslatable },
  sol_father_name: { ...emptyTranslatable },
  date_of_birth: "",
  gender: "",
  class_id: 0,
  section: "",
  phone_number: "",
  emergency_contact_phone: "",
  membership_date: "",
};

// Reusable standard buttons & inputs with crisp compact border radius (no rounded bubbles)
const BRAND = "#0858a8";
const BRAND_HOVER = "#074c91";
const BRAND_ACTIVE = "#063e77";

const btnBase = "inline-flex h-9 items-center justify-center gap-1.5 rounded-[4px] px-3.5 text-xs font-semibold shadow-2xs transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 cursor-pointer";
const btnPrimary = `${btnBase} bg-[#0858a8] text-white hover:bg-[#074c91] active:bg-[#063e77] focus-visible:ring-[#0858a8]`;
const btnSecondary = `${btnBase} border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:ring-slate-400`;
const btnDanger = `${btnBase} bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-600`;
const inputCls = (error?: boolean) =>
  `h-9 w-full rounded-[4px] border ${
    error
      ? "border-rose-400 dark:border-rose-600 focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
      : "border-slate-200/90 dark:border-slate-700 focus:ring-1 focus:ring-[#0858a8] focus:border-[#0858a8]"
  } bg-white dark:bg-[#141a29] px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none shadow-2xs transition`;
const labelCls = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";

/* ─── i18n ───────────────────────────────────────────────────────────── */
const I18N: Record<SupportedLocale, {
  eyebrow: string; title: string; registeredCount: (n: number) => string;
  refresh: string; registerMember: string; search: string; searchPlaceholder: string;
  noAccess: string; noMembers: string; discardTitle: string; discardDesc: string;
  removeTitle: string; removeConfirm: (n: string) => string;
  bulkDeleteTitle: string; bulkDeleteConfirm: (n: number) => string;
  registered: string; updated: string; removed: string; bulkRemoved: (n: number) => string;
  colMember: string; colClass: string; colSection: string; colPhone: string; colActions: string;
  pageOf: (p: number, t: number) => string; prev: string; next: string; perPage: string;
  languageLabel: string;
  viewTitle: string; createTitle: string; editTitle: string; modalDesc: string;
  fullName: string; christianName: string; dob: string; gender: string;
  male: string; female: string; selectGender: string;
  schoolClass: string; selectClass: string; selectClassFirst: string; section: string; selectSection: string;
  phone: string; emergencyName: string; emergencyPhone: string;
  membershipDate: string; spiritualFather: string; cancel: string;
  save: string; saveChanges: string; saving: string; updating: string;
  ageError: string; nameError: string; classError: string; sectionError: string; genderError: string; dobRequired: string;
  selected: (n: number) => string; deleteSelected: string;
  allClasses: string; allClassesFilter: string; allGenders: string; clearFilters: string; filterByClass: string;
}> = {
  en: {
    eyebrow: "Member Administration", title: "Member Register & Enrollment",
    registeredCount: (n) => `${n} registered students`,
    refresh: "Refresh", registerMember: "Register Member", search: "Search",
    searchPlaceholder: "Search by name or phone…",
    noAccess: "You do not have permission to view members.",
    noMembers: "No members found.",
    discardTitle: "Discard changes?", discardDesc: "Unsaved changes will be lost.",
    removeTitle: "Remove Member", removeConfirm: (n) => `Remove ${n} from the register? Active enrollment will be closed.`,
    bulkDeleteTitle: "Remove Selected", bulkDeleteConfirm: (n) => `Remove ${n} selected member${n > 1 ? "s" : ""}? All active enrollments will be closed.`,
    registered: "Member registered & enrolled.", updated: "Member updated.", removed: "Member removed.", bulkRemoved: (n) => `${n} member${n > 1 ? "s" : ""} removed.`,
    colMember: "Member", colClass: "Class", colSection: "Section", colPhone: "Phone", colActions: "Actions",
    pageOf: (p, t) => `Page ${p} of ${t}`, prev: "Previous", next: "Next", perPage: "Rows per page",
    languageLabel: "Language:",
    viewTitle: "Member Record", createTitle: "Register Member", editTitle: "Update Member",
    modalDesc: "Enter member details in any supported language.",
    fullName: "Full Name", christianName: "Christian Name", dob: "Date of Birth",
    gender: "Gender", male: "Male", female: "Female", selectGender: "Select gender",
    schoolClass: "School Class", selectClass: "Select class", selectClassFirst: "Select class first",
    section: "Section", selectSection: "Select section",
    phone: "Phone Number", emergencyName: "Emergency Contact Name", emergencyPhone: "Emergency Phone",
    membershipDate: "Membership Date", spiritualFather: "Spiritual Father",
    cancel: "Cancel", save: "Register Member", saveChanges: "Save Changes", saving: "Registering…", updating: "Saving…",
    ageError: "Student must be at least 3 years old.",
    nameError: "Full name is required in at least one language.",
    classError: "Please select a school class.",
    sectionError: "Please select a section.",
    genderError: "Please select a gender.",
    dobRequired: "Date of birth is required.",
    selected: (n) => `${n} selected`, deleteSelected: "Delete Selected",
    allClasses: "All Classes", allClassesFilter: "Class: All", allGenders: "Gender: All", clearFilters: "Reset", filterByClass: "Filter by Class",
  },
  am: {
    eyebrow: "የአባላት አስተዳደር", title: "የአባላት መዝገብና ምዝገባ",
    registeredCount: (n) => `${n} የተመዘገቡ ተማሪዎች`,
    refresh: "ያድሱ", registerMember: "አባል ይመዝግቡ", search: "ይፈልጉ",
    searchPlaceholder: "አባልን በስም ወይም ስልክ ይፈልጉ…",
    noAccess: "የአባላት መዝገብ ለማየት ፈቃድ የለዎትም።",
    noMembers: "ምንም አባል አልተገኘም።",
    discardTitle: "ለውጦቹን ይሰርዙ?", discardDesc: "ያልተቀመጡ ለውጦች ይጠፋሉ።",
    removeTitle: "አባል ይሰርዙ", removeConfirm: (n) => `${n}ን ከመዝገብ ይሰርዙ?`,
    bulkDeleteTitle: "የተመረጡትን ይሰርዙ", bulkDeleteConfirm: (n) => `${n} አባላትን ይሰርዙ?`,
    registered: "አባሉ ተመዝግቧል።", updated: "አባሉ ተሻሽሏል።", removed: "አባሉ ተሰርዟል።", bulkRemoved: (n) => `${n} አባላት ተሰርዘዋል።`,
    colMember: "አባል", colClass: "ክፍል", colSection: "ሴክሽን", colPhone: "ስልክ", colActions: "ተግባር",
    pageOf: (p, t) => `ገጽ ${p} ከ ${t}`, prev: "ቀዳሚ", next: "ቀጣይ", perPage: "በአንድ ገጽ",
    languageLabel: "ቋንቋ:",
    viewTitle: "የአባል መረጃ", createTitle: "አዲስ አባል ይመዝግቡ", editTitle: "የአባል መረጃ ያሻሽሉ",
    modalDesc: "የአባሉን መረጃ ይሙሉ።",
    fullName: "ሙሉ ስም", christianName: "የክርስትና ስም", dob: "የትውልድ ቀን",
    gender: "ጾታ", male: "ወንድ", female: "ሴት", selectGender: "ጾታ ይምረጡ",
    schoolClass: "ክፍል", selectClass: "ክፍል ይምረጡ", selectClassFirst: "አስቀድመው ክፍል ይምረጡ",
    section: "ሴክሽን", selectSection: "ሴክሽን ይምረጡ",
    phone: "ስልክ ቁጥር", emergencyName: "አደጋ ጊዜ ተጠሪ", emergencyPhone: "አደጋ ጊዜ ስልክ",
    membershipDate: "የአባልነት ቀን", spiritualFather: "የንስሐ አባት",
    cancel: "ይተው", save: "አባል ይመዝግቡ", saveChanges: "መረጃውን ያሻሽሉ", saving: "በመመዝገብ ላይ…", updating: "በማሻሻል ላይ…",
    ageError: "ዕድሜ ቢያንስ 3 ዓመት መሆን አለበት።",
    nameError: "ሙሉ ስም ቢያንስ በአንድ ቋንቋ ያስፈልጋል።",
    classError: "እባክዎ ክፍል ይምረጡ።",
    sectionError: "እባክዎ ሴክሽን ይምረጡ።",
    genderError: "እባክዎ ጾታ ይምረጡ።",
    dobRequired: "የትውልድ ቀን ያስፈልጋል።",
    selected: (n) => `${n} ተመርጠዋል`, deleteSelected: "የተመረጡትን ይሰርዙ",
    allClasses: "ሁሉም ክፍሎች", allClassesFilter: "ክፍል: ሁሉም", allGenders: "ጾታ: ሁሉም", clearFilters: "ማጣሪያ ያጽዱ", filterByClass: "በክፍል አጣራ",
  },
  om: {
    eyebrow: "Bulchiinsa Miseensaa", title: "Galmee Miseensotaa",
    registeredCount: (n) => `Barattootni galmaa'an ${n}`,
    refresh: "Haaromsi", registerMember: "Miseensa Galmeessi", search: "Barbaadi",
    searchPlaceholder: "Maqaa ykn bilbilaan barbaadi…",
    noAccess: "Galmee miseensotaa ilaaluuf heeyyama hin qabdu.",
    noMembers: "Miseensi hin argamne.",
    discardTitle: "Jijjiirama dhiisuu?", discardDesc: "Oodeeffannoon hin qusatamne ni bada.",
    removeTitle: "Miseensa Haqi", removeConfirm: (n) => `${n} galmee keessaa haquu?`,
    bulkDeleteTitle: "Filatamoo Haqi", bulkDeleteConfirm: (n) => `Miseensota ${n} haquu?`,
    registered: "Miseensi galmaa'eera.", updated: "Fooyya'eera.", removed: "Miseensi haqameera.", bulkRemoved: (n) => `Miseensota ${n} haqameera.`,
    colMember: "Miseensa", colClass: "Kutaa", colSection: "Hirmaannaa", colPhone: "Bilbila", colActions: "Tarkaanfii",
    pageOf: (p, t) => `Fuula ${p} keessaa ${t}`, prev: "Duraa", next: "Itti Aanu", perPage: "Fuula tokkotti",
    languageLabel: "Afaan:",
    viewTitle: "Oodeeffannoo", createTitle: "Miseensa Haaraa Galmeessi", editTitle: "Miseensa Gulaali",
    modalDesc: "Oodeeffannoo miseensaa galchaa.",
    fullName: "Maqaa Guutuu", christianName: "Maqaa Kiristinnaa", dob: "Guyyaa Dhalootaa",
    gender: "Saala", male: "Dhiira", female: "Dubara", selectGender: "Saala filadhaa",
    schoolClass: "Kutaa", selectClass: "Kutaa filadhaa", selectClassFirst: "Dura kutaa filadhaa",
    section: "Hirmaannaa", selectSection: "Hirmaannaa filadhaa",
    phone: "Lakk. Bilbilaa", emergencyName: "Nama Yeroo Balaa", emergencyPhone: "Bilbila Yeroo Balaa",
    membershipDate: "Guyyaa Miseensummaa", spiritualFather: "Abbaa Amantii",
    cancel: "Dhiisi", save: "Miseensa Galmeessi", saveChanges: "Jijjiirama Qabadhu", saving: "Galmeessaa jira…", updating: "Fooyyessaa jira…",
    ageError: "Umriin waggaa 3 ol ta'uu qaba.",
    nameError: "Maqaan guutuun afaan tokkoon galfamu qaba.",
    classError: "Kutaa filadhaa.",
    sectionError: "Hirmaannaa filadhaa.",
    genderError: "Saala filadhaa.",
    dobRequired: "Guyyaa dhalootaa barbaachisaadha.",
    selected: (n) => `${n} filatame`, deleteSelected: "Filatamoo Haqi",
    allClasses: "Kutaa Hunda", allClassesFilter: "Kutaa: Hunda", allGenders: "Saala: Hunda", clearFilters: "Haqi", filterByClass: "Kutaan calali",
  },
};

/* ─── Helpers ────────────────────────────────────────────────────────── */
function parseTranslations(value: unknown): TranslatableField {
  if (value && typeof value === "object") {
    const obj = value as Record<string, string>;
    return { en: obj.en ?? "", am: obj.am ?? "", om: obj.om ?? "" };
  }
  if (typeof value === "string") {
    const t = value.trim();
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
      try {
        const p = JSON.parse(t);
        if (p && typeof p === "object") return { en: p.en ?? "", am: p.am ?? "", om: p.om ?? "" };
      } catch { return { en: value, am: "", om: "" }; }
    }
    return { en: value, am: "", om: "" };
  }
  return { en: "", am: "", om: "" };
}

function nestedText(value: unknown, lang: SupportedLocale = "en"): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") {
    const t = value.trim();
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
      try { return nestedText(JSON.parse(t), lang); } catch { return value; }
    }
    return value;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.en !== undefined || obj.am !== undefined || obj.om !== undefined) {
      const cur = obj[lang];
      if (typeof cur === "string" && cur.trim()) return cur.trim();
      return String(obj.en || obj.am || obj.om || "—");
    }
    if (obj.name) return nestedText(obj.name, lang);
    return String(obj.full_name ?? obj.title ?? obj.id ?? "—");
  }
  return String(value);
}

function cleanTranslatable(f: TranslatableField): Record<string, string> | null {
  const r: Record<string, string> = {};
  if (f.en?.trim()) r.en = f.en.trim();
  if (f.am?.trim()) r.am = f.am.trim();
  if (f.om?.trim()) r.om = f.om.trim();
  if (Object.keys(r).length === 0) return null;
  if (!r.en) {
    r.en = r.am || r.om || "";
  }
  return r;
}

function sectionLetters(count: number): string[] {
  return Array.from({ length: Math.max(1, count) }, (_, i) => String.fromCharCode(65 + i));
}

/* ─── Component ──────────────────────────────────────────────────────── */
export function MemberRegistry() {
  const { user } = useAuth();
  const { language: globalLocale } = useLanguage();
  const locale = (globalLocale as SupportedLocale) || "am";
  const L = I18N[locale] ?? I18N.en;

  const {
    items: storeItems,
    pagination,
    loading: storeLoading,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    deleteMembersBulk,
    invalidate,
  } = useMemberStore();

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
    (p: string) => {
      if (isSuperOrAdmin) return true;
      if (permissions.has(p) || permissions.has("*")) return true;
      if (p === "members.view" || p === "members.create" || p === "members.update") {
        if (user?.role && user.role !== "student") return true;
      }
      return false;
    },
    [isSuperOrAdmin, permissions, user?.role]
  );

  /* ── local state ─────────────────────────────────────────────────── */
  const [classes, setClasses] = useState<SchoolClassSummary[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = sessionStorage.getItem(`classes:list:${user?.id ?? "guest"}`);
      if (!raw) return [];
      const { data, ts } = JSON.parse(raw) as { data: SchoolClassSummary[]; ts: number };
      if (Date.now() - ts < 10 * 60_000 && Array.isArray(data)) return data;
    } catch {}
    return [];
  });
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [entryLocale, setEntryLocale] = useState<SupportedLocale>("en");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [filterClass, setFilterClass] = useState<number | null>(null);
  const [filterGender, setFilterGender] = useState<string | null>(null);
  const [initialDraft, setInitialDraft] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  /* members directly from store — server already applied filters */
  const members = useMemo(() => storeItems as unknown as Member[], [storeItems]);

  const total = pagination?.total ?? (storeItems as unknown as Member[]).length;
  const pages = Math.max(1, pagination?.last_page ?? Math.ceil(total / Math.max(1, perPage)));

  /* ── gender options for filter toolbar (from current page data) ───── */
  const genderOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "all", label: L.allGenders }];
    opts.push({ value: "male", label: L.male });
    opts.push({ value: "female", label: L.female });
    return opts;
  }, [L.allGenders, L.male, L.female]);

  /* ── age constraint ──────────────────────────────────────────────── */
  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 3);
    return d.toISOString().split("T")[0];
  }, []);

  /* ── load classes reliably from classes API (long-TTL cache) ─────── */
  useEffect(() => {
    let active = true;
    const cacheKey = `classes:list:${user?.id ?? "guest"}`;
    const cached = (() => {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw) as { data: SchoolClassSummary[]; ts: number };
        // 10-minute TTL for class list
        if (Date.now() - ts < 10 * 60_000) return data;
      } catch {}
      return null;
    })();

    if (cached && cached.length > 0) {
      setClasses(cached);
      return;
    }

    const fetchClasses = async () => {
      try {
        const r = await schoolManagementService.list("school-classes", "?per_page=100", user?.id);
        if (!r.ok) return;
        const json = await r.json().catch(() => ({}));
        let list: SchoolClassSummary[] = [];
        if (Array.isArray(json.data)) {
          list = json.data;
        } else if (json.data && Array.isArray(json.data.data)) {
          list = json.data.data;
        } else if (Array.isArray(json)) {
          list = json;
        }
        if (active && list.length > 0) {
          setClasses(list);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ data: list, ts: Date.now() }));
          } catch {}
        }
      } catch (e) {
        console.error("Failed to load school classes:", e);
      }
    };
    void fetchClasses();
    return () => { active = false; };
  }, [user?.id]);

  /* ── load members — all filters sent to server for correct pagination ─ */
  const load = useCallback(
    (opts?: { force?: boolean }) =>
      fetchMembers(
        {
          page,
          per_page: perPage,
          ...(search ? { search } : {}),
          ...(filterClass !== null ? { class_id: filterClass } : {}),
          ...(filterGender !== null ? { gender: filterGender } : {}),
        },
        { userId: user?.id, force: opts?.force, ttl: 30_000 }
      ).catch(() => {}),
    [fetchMembers, page, perPage, search, filterClass, filterGender, user?.id]
  );

  useEffect(() => { void load(); }, [load]);

  /* ── section options dependent on selected class (unselected if no class) ─── */
  const selectedClass = useMemo(
    () => (draft.class_id ? (classes.find((c) => Number(c.id) === Number(draft.class_id)) ?? null) : null),
    [classes, draft.class_id]
  );

  const mL = I18N[entryLocale] ?? I18N.en;

  const sectionOpts = useMemo(() => {
    if (!selectedClass) return [];
    const count = selectedClass.number_of_sections ?? 1;
    const letters = sectionLetters(count);
    return letters.map((l) => ({ value: l, label: `${mL.section} ${l}` }));
  }, [selectedClass, mL.section]);

  /* ── open create / edit ──────────────────────────────────────────── */
  const openCreate = () => {
    setEditingId(null);
    setEntryLocale(locale);
    setFieldErrors({});
    setFormError("");
    const init: Draft = {
      ...emptyDraft,
      gender: "",
      class_id: 0,
      section: "",
      membership_date: new Date().toISOString().split("T")[0],
    };
    setDraft(init);
    setInitialDraft(JSON.stringify(init));
    setFormOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditingId(m.id);
    setEntryLocale(locale);
    setFieldErrors({});
    setFormError("");
    const matchedClass = classes.find((c) => Number(c.id) === Number(m.class_id)) ?? null;
    const numSections = matchedClass?.number_of_sections ?? 1;
    const letters = sectionLetters(numSections);
    // Keep the member's existing section if still valid; if only one option auto-select it
    const sec = m.section && letters.includes(m.section)
      ? m.section
      : numSections === 1
        ? (letters[0] ?? "")
        : "";
    const init: Draft = {
      full_name: parseTranslations(m.full_name),
      christian_name: parseTranslations(m.christian_name),
      emergency_contact_name: parseTranslations(m.emergency_contact_name),
      sol_father_name: parseTranslations(m.sol_father_name),
      date_of_birth: m.date_of_birth ? m.date_of_birth.split("T")[0] : "",
      gender: m.gender || "",
      class_id: matchedClass?.id ?? Number(m.class_id) ?? 0,
      section: sec,
      phone_number: m.phone_number || "",
      emergency_contact_phone: m.emergency_contact_phone || "",
      membership_date: m.membership_date ? m.membership_date.split("T")[0] : "",
    };
    setDraft(init);
    setInitialDraft(JSON.stringify(init));
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    if (JSON.stringify(draft) !== initialDraft) { setDiscardOpen(true); return; }
    setFormOpen(false);
    setEditingId(null);
  };

  /* ── class change (resets section; auto-selects if only 1 option) ── */
  const handleClassChange = (id: number) => {
    const cls = classes.find((c) => Number(c.id) === id) ?? null;
    const numSections = cls?.number_of_sections ?? 1;
    // Auto-select the only section when there is exactly one
    const autoSection = numSections === 1 ? (sectionLetters(1)[0] ?? "") : "";
    setDraft((p) => ({
      ...p,
      class_id: id,
      section: autoSection,
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.class_id;
      delete next.section;
      return next;
    });
  };

  /* ── submit ──────────────────────────────────────────────────────── */
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving || (editingId ? !can("members.update") : !can("members.create"))) return;

    const errs: Record<string, string> = {};
    const nameClean = cleanTranslatable(draft.full_name);
    if (!nameClean) errs.full_name = mL.nameError;
    if (!draft.gender) errs.gender = mL.genderError;
    if (!draft.class_id) errs.class_id = mL.classError;
    if (!draft.section) errs.section = mL.sectionError;
    if (!draft.date_of_birth) errs.date_of_birth = mL.dobRequired;
    else if (draft.date_of_birth > maxDob) errs.date_of_birth = mL.ageError;

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setFormError(Object.values(errs)[0]);
      return;
    }

    setFieldErrors({});
    setFormError("");
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        full_name: nameClean,
        christian_name: cleanTranslatable(draft.christian_name),
        emergency_contact_name: cleanTranslatable(draft.emergency_contact_name),
        sol_father_name: cleanTranslatable(draft.sol_father_name),
        date_of_birth: draft.date_of_birth,
        gender: draft.gender,
        class_id: draft.class_id,
        section: draft.section,
        phone_number: draft.phone_number?.trim() || null,
        emergency_contact_phone: draft.emergency_contact_phone?.trim() || null,
        membership_date: draft.membership_date || null,
      };

      if (editingId) {
        await updateMember(editingId, payload as any, user?.id);
        toast.success(mL.updated);
      } else {
        await createMember(payload as any, user?.id);
        toast.success(mL.registered);
        // Re-fetch to show the new member — do NOT reset page which would cause full reload
        void load({ force: true });
      }

      setFormOpen(false);
      setEditingId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save member.");
    } finally {
      setSaving(false);
    }
  };

  /* ── single delete ───────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget || !can("members.delete")) return;
    try {
      await deleteMember(deleteTarget.id, user?.id);
      toast.success(L.removed);
      setDeleteTarget(null);
      setSelected((p) => { const n = new Set(p); n.delete(deleteTarget.id); return n; });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  /* ── bulk delete ─────────────────────────────────────────────────── */
  const handleBulkDelete = async () => {
    if (!can("members.delete")) return;
    const ids = Array.from(selected);
    try {
      await deleteMembersBulk(ids, user?.id);
      toast.success(L.bulkRemoved(ids.length));
      setSelected(new Set());
      setBulkDeleteOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk delete failed.");
    }
  };

  /* ── checkbox helpers ────────────────────────────────────────────── */
  const allSelected = members.length > 0 && members.every((m) => selected.has(m.id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(members.map((m) => m.id)));
  };

  const toggleOne = (id: number) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  /* ── translatable input renderer ─────────────────────────────────── */
  const renderTranslatableInput = (
    key: "full_name" | "christian_name" | "emergency_contact_name" | "sol_father_name",
    label: string,
    required = false
  ) => {
    const langLabel =
      entryLocale === "am" ? "አማርኛ" : entryLocale === "om" ? "Afaan Oromoo" : "English";
    const err = fieldErrors[key];
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls}>
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
            {langLabel}
          </span>
        </div>
        <input
          type="text"
          value={draft[key][entryLocale] ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setDraft((p) => ({ ...p, [key]: { ...p[key], [entryLocale]: v } }));
            if (err && v.trim()) setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; });
          }}
          placeholder={`${label} (${langLabel})`}
          className={inputCls(Boolean(err))}
        />
        {err && <p className="mt-0.5 text-[11px] text-rose-500 font-medium">{err}</p>}
      </div>
    );
  };

  /* ── guard ───────────────────────────────────────────────────────── */
  if (!can("members.view")) {
    return (
      <section className="m-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111624] p-8 text-center text-sm text-slate-500">
        {L.noAccess}
      </section>
    );
  }

  if (storeLoading && members.length === 0 && !search && !filterClass && !filterGender) {
    return <MemberRegistryShimmerSkeleton />;
  }

  /* ── render ──────────────────────────────────────────────────────── */
  return (
    <main className="w-full space-y-5 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-7">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {L.eyebrow}
          </p>
          <h1 className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {L.title}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {L.registeredCount(total)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { invalidate(); void load({ force: true }); }}
            disabled={storeLoading}
            className={btnSecondary}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${storeLoading ? "animate-spin" : ""}`} />
            {L.refresh}
          </button>
          {can("members.create") && (
            <button type="button" onClick={openCreate} className={btnPrimary}>
              <Plus className="h-3.5 w-3.5" />
              {L.registerMember}
            </button>
          )}
        </div>
      </header>

      {/* ─── Search + Quick Filters Toolbar ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search bar — wider */}
          <form
            onSubmit={(e) => { e.preventDefault(); setSearch(pendingSearch); setPage(1); }}
            className="flex gap-1.5 w-full sm:w-96"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                placeholder={L.searchPlaceholder}
                className="h-9 w-full rounded-[4px] border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0858a8] focus:border-[#0858a8] shadow-2xs"
              />
            </div>
            <button type="submit" className={btnSecondary}>{L.search}</button>
          </form>

          {/* Quick Class Filter — loaded from fetched classes */}
          {classes.length > 0 && (
            <div className="w-44">
              <AppSelect
                value={filterClass !== null ? String(filterClass) : "all"}
                onChange={(v) => { setFilterClass(v === "all" ? null : Number(v)); setPage(1); }}
                options={[
                  { value: "all", label: L.allClassesFilter },
                  ...classes.map((c) => ({
                    value: String(c.id),
                    label: typeof c.name === "string" ? c.name : nestedText(c.name, locale),
                  })),
                ]}
                size="sm"
                ariaLabel="Filter by class"
              />
            </div>
          )}

          {/* Quick Gender Filter — derived from actual members in store */}
          {genderOptions.length > 1 && (
            <div className="w-36">
              <AppSelect
                value={filterGender ?? "all"}
                onChange={(v) => { setFilterGender(v === "all" ? null : v); setPage(1); }}
                options={genderOptions}
                size="sm"
                ariaLabel="Filter by gender"
              />
            </div>
          )}

          {/* Clear Filters Button */}
          {(filterClass !== null || filterGender !== null || search) && (
            <button
              type="button"
              onClick={() => { setFilterClass(null); setFilterGender(null); setSearch(""); setPendingSearch(""); setPage(1); }}
              className="inline-flex h-8 items-center gap-1 rounded-[4px] px-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Reset all filters"
            >
              <X className="h-3.5 w-3.5" />
              <span>{L.clearFilters}</span>
            </button>
          )}
        </div>

        {/* Selected / Bulk Actions */}
        {selected.size > 0 && can("members.delete") && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">{L.selected(selected.size)}</span>
            <button type="button" onClick={() => setBulkDeleteOpen(true)} className={btnDanger}>
              <Trash2 className="h-3.5 w-3.5" />
              {L.deleteSelected}
            </button>
          </div>
        )}
      </div>

      {/* ─── Table ──────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {can("members.delete") && (
                  <th className="w-10 py-3.5 pl-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded-[2px] border-slate-300 dark:border-slate-600 text-[#0858a8] cursor-pointer accent-[#0858a8]"
                      aria-label="Select all"
                    />
                  </th>
                )}
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">{L.colMember}</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">{L.colClass}</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">{L.colSection}</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">{L.colPhone}</th>
                <th className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 text-right">{L.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {storeLoading && members.length === 0 ? (
                <tr>
                  <td colSpan={can("members.delete") ? 6 : 5} className="p-4">
                    <TableShimmerSkeleton rows={7} columns={5} />
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={can("members.delete") ? 6 : 5}
                    className="py-14 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    {L.noMembers}
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m.id}
                    className={`transition-colors ${
                      storeLoading ? "opacity-60 pointer-events-none" : ""
                    } ${
                      selected.has(m.id)
                        ? "bg-blue-50/60 dark:bg-blue-950/20"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    {can("members.delete") && (
                      <td className="w-10 pl-4">
                        <input
                          type="checkbox"
                          checked={selected.has(m.id)}
                          onChange={() => toggleOne(m.id)}
                          className="h-4 w-4 rounded-[2px] border-slate-300 dark:border-slate-600 cursor-pointer accent-[#0858a8]"
                          aria-label={`Select ${nestedText(m.full_name, locale)}`}
                        />
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        {nestedText(m.full_name, locale)}
                      </p>
                      {m.christian_name && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {nestedText(m.christian_name, locale)}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {nestedText(m.school_class?.name ?? `Class ${m.class_id}`, locale)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {m.section ? `${L.section} ${m.section}` : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm text-slate-600 dark:text-slate-400">
                      {m.phone_number || "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewing(m)}
                          aria-label={`View ${nestedText(m.full_name, locale)}`}
                          title="View Details"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60 transition shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {can("members.update") && (
                          <button
                            type="button"
                            onClick={() => openEdit(m)}
                            aria-label={`Edit ${nestedText(m.full_name, locale)}`}
                            title="Edit Member"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60 transition shadow-2xs cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {can("members.delete") && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(m)}
                            aria-label={`Delete ${nestedText(m.full_name, locale)}`}
                            title="Delete Member"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 transition shadow-2xs cursor-pointer"
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

      {/* ─── Pagination ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {L.pageOf(page, Math.max(pages, 1))}
          </span>
          <span className="text-slate-300 dark:text-slate-700 select-none">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{L.perPage}:</span>
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
                ariaLabel={L.perPage}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || storeLoading}
            onClick={() => setPage((v) => Math.max(1, v - 1))}
            className={btnSecondary}
          >
            {L.prev}
          </button>
          <button
            type="button"
            disabled={page >= pages || storeLoading}
            onClick={() => setPage((v) => Math.min(pages, v + 1))}
            className={btnSecondary}
          >
            {L.next}
          </button>
        </div>
      </div>

      {/* ─── Registration / Edit Modal ───────────────────────────────── */}
      {formOpen && (
        <AdminModal
          open={formOpen}
          onOpenChange={(o) => { if (!o) closeForm(); }}
          title={editingId ? mL.editTitle : mL.createTitle}
          description={mL.modalDesc}
          size="2xl"
          headerAction={
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {L.languageLabel}
              </span>
              <div className="w-40">
                <AppSelect
                  value={entryLocale}
                  onChange={(v) => setEntryLocale(v as SupportedLocale)}
                  options={[
                    { value: "en", label: "English" },
                    { value: "am", label: "አማርኛ" },
                    { value: "om", label: "Afaan Oromoo" },
                  ]}
                  size="sm"
                  ariaLabel={L.languageLabel}
                />
              </div>
            </div>
          }
        >
          <form
            onSubmit={(e) => void submit(e)}
            className="space-y-4 p-1"
          >
            {/* Form-level error */}
            {formError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Full Name (span full) */}
              <div className="sm:col-span-2 lg:col-span-3">
                {renderTranslatableInput("full_name", mL.fullName, true)}
              </div>

              {/* Christian Name */}
              {renderTranslatableInput("christian_name", mL.christianName)}

              {/* DOB */}
              <div>
                <label className={labelCls}>
                  {mL.dob} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  max={maxDob}
                  value={draft.date_of_birth}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((p) => ({ ...p, date_of_birth: v }));
                    const err = !v ? mL.dobRequired : v > maxDob ? mL.ageError : null;
                    setFieldErrors((p) => {
                      const n = { ...p };
                      if (err) n.date_of_birth = err;
                      else delete n.date_of_birth;
                      return n;
                    });
                  }}
                  className={inputCls(Boolean(fieldErrors.date_of_birth))}
                />
                {fieldErrors.date_of_birth && (
                  <p className="mt-0.5 text-[11px] text-rose-500 font-medium">{fieldErrors.date_of_birth}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className={labelCls}>
                  {mL.gender} <span className="text-rose-500">*</span>
                </label>
                <AppSelect
                  value={draft.gender || ""}
                  onChange={(v) => {
                    setDraft((p) => ({ ...p, gender: v }));
                    if (fieldErrors.gender) {
                      setFieldErrors((prev) => { const n = { ...prev }; delete n.gender; return n; });
                    }
                  }}
                  options={[
                    { value: "male", label: mL.male },
                    { value: "female", label: mL.female },
                  ]}
                  placeholder={mL.selectGender}
                  required
                />
                {fieldErrors.gender && (
                  <p className="mt-0.5 text-[11px] text-rose-500 font-medium">{fieldErrors.gender}</p>
                )}
              </div>

              {/* School Class */}
              <div>
                <label className={labelCls}>
                  {mL.schoolClass} <span className="text-rose-500">*</span>
                </label>
                <AppSelect
                  value={draft.class_id ? String(draft.class_id) : ""}
                  onChange={(v) => handleClassChange(Number(v))}
                  options={classes.map((c) => ({
                    value: String(c.id),
                    label: typeof c.name === "string" ? c.name : nestedText(c.name, entryLocale),
                  }))}
                  placeholder={classes.length === 0 ? "Loading classes..." : mL.selectClass}
                  disabled={classes.length === 0}
                  required
                />
                {fieldErrors.class_id && (
                  <p className="mt-0.5 text-[11px] text-rose-500 font-medium">{fieldErrors.class_id}</p>
                )}
              </div>

              {/* Section */}
              <div>
                <label className={labelCls}>
                  {mL.section} <span className="text-rose-500">*</span>
                </label>
                <AppSelect
                  value={draft.section || ""}
                  onChange={(v) => {
                    setDraft((p) => ({ ...p, section: v }));
                    if (fieldErrors.section) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.section;
                        return next;
                      });
                    }
                  }}
                  options={sectionOpts}
                  placeholder={!draft.class_id ? mL.selectClassFirst : mL.selectSection}
                  disabled={!draft.class_id || sectionOpts.length === 0}
                  required
                />
                {fieldErrors.section && (
                  <p className="mt-0.5 text-[11px] text-rose-500 font-medium">{fieldErrors.section}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className={labelCls}>{mL.phone}</label>
                <input
                  type="text"
                  value={draft.phone_number}
                  onChange={(e) => setDraft((p) => ({ ...p, phone_number: e.target.value }))}
                  placeholder="+251…"
                  className={inputCls()}
                />
              </div>

              {/* Emergency Contact Name */}
              {renderTranslatableInput("emergency_contact_name", mL.emergencyName)}

              {/* Emergency Phone */}
              <div>
                <label className={labelCls}>{mL.emergencyPhone}</label>
                <input
                  type="text"
                  value={draft.emergency_contact_phone}
                  onChange={(e) => setDraft((p) => ({ ...p, emergency_contact_phone: e.target.value }))}
                  placeholder="+251…"
                  className={inputCls()}
                />
              </div>

              {/* Membership Date */}
              <div>
                <label className={labelCls}>{mL.membershipDate}</label>
                <input
                  type="date"
                  value={draft.membership_date}
                  onChange={(e) => setDraft((p) => ({ ...p, membership_date: e.target.value }))}
                  className={inputCls()}
                />
              </div>

              {/* Spiritual Father */}
              {renderTranslatableInput("sol_father_name", mL.spiritualFather)}
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-5 mt-6 flex items-center justify-end gap-2 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-5 py-3 sm:px-6 backdrop-blur-xs">
              <button type="button" onClick={closeForm} className={btnSecondary}>
                {mL.cancel}
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving
                  ? (editingId ? mL.updating : mL.saving)
                  : (editingId ? mL.saveChanges : mL.save)}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ─── View Modal ──────────────────────────────────────────────── */}
      {viewing && (
        <AdminModal
          open={Boolean(viewing)}
          onOpenChange={(o) => { if (!o) setViewing(null); }}
          title={nestedText(viewing.full_name, locale)}
          description={L.viewTitle}
          size="lg"
        >
          <dl className="grid gap-3 sm:grid-cols-2 p-1">
            {([
              [L.christianName, nestedText(viewing.christian_name, locale)],
              [L.dob, viewing.date_of_birth ? viewing.date_of_birth.split("T")[0] : "—"],
              [L.gender, viewing.gender === "male" ? L.male : viewing.gender === "female" ? L.female : viewing.gender],
              [L.schoolClass, nestedText(viewing.school_class?.name ?? `Class ${viewing.class_id}`, locale)],
              [L.section, viewing.section ? `${L.section} ${viewing.section}` : "—"],
              [L.phone, viewing.phone_number || "—"],
              [L.emergencyName, nestedText(viewing.emergency_contact_name, locale)],
              [L.emergencyPhone, viewing.emergency_contact_phone || "—"],
              [L.membershipDate, viewing.membership_date ? viewing.membership_date.split("T")[0] : "—"],
              [L.spiritualFather, nestedText(viewing.sol_father_name, locale)],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="rounded-[4px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>
        </AdminModal>
      )}

      {/* ─── Discard Dialog ──────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => { setDiscardOpen(false); setFormOpen(false); setEditingId(null); }}
        title={L.discardTitle}
        description={L.discardDesc}
        variant="primary"
      />

      {/* ─── Single Delete Dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title={L.removeTitle}
        description={deleteTarget ? L.removeConfirm(nestedText(deleteTarget.full_name, locale)) : ""}
      />

      {/* ─── Bulk Delete Dialog ───────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => void handleBulkDelete()}
        title={L.bulkDeleteTitle}
        description={L.bulkDeleteConfirm(selected.size)}
        icon={<CheckSquare className="h-5 w-5 text-rose-500" />}
      />
    </main>
  );
}
