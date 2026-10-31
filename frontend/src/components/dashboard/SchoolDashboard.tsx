"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { AdminModal } from "@/components/admin/AdminModal";
import { attendanceService } from "@/services/attendance.service";
import { reportsService } from "@/services/reports.service";
import { schoolManagementService } from "@/services/schoolManagement.service";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import Link from "next/link";
import {
  BRAND,
  btnBase,
  btnPrimary,
  btnSecondary,
  btnDanger,
  inputCls,
  labelCls,
  tableContainerCls,
  tableHeaderRowCls,
  tableHeaderCellCls,
  tableRowCls,
  actionBtnBase,
  actionBtnView,
  actionBtnDelete,
  modalStickyFooter,
  cardCls,
  detailCardCls,
  nestedLocalizedText,
} from "@/components/admin/adminUiTokens";
import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
  Plus,
  Percent,
  UserX,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Calendar,
} from "lucide-react";
import {
  AttendanceSessionSummary,
  SchoolClassSummary,
  CourseSummary,
  AttendanceSummaryData,
  TeachingAssignmentSummary,
  PaginationMeta,
  ClassGradebookData,
} from "@/types/auth";
import {
  DashboardOverviewShimmerSkeleton,
  AcademicDashboardShimmerSkeleton,
  TableShimmerSkeleton,
  AttendanceDashboardShimmerSkeleton,
} from "@/components/ui/DashboardShimmerSkeleton";
import { AppSelect } from "@/components/ui/AppSelect";

export type SchoolDashboardArea = "overview" | "academic" | "attendance";

export function SchoolDashboard({ area }: { area: SchoolDashboardArea }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
  const [adminClasses, setAdminClasses] = useState<SchoolClassSummary[]>([]);
  const [adminCourses, setAdminCourses] = useState<CourseSummary[]>([]);
  const [summaryData, setSummaryData] = useState<AttendanceSummaryData | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Administrative Filters & Pagination
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Summary Date & Class Drilldown Filter
  const [summaryDate, setSummaryDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [summaryClassId, setSummaryClassId] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  // Administrative Gradebook State
  const [gradebookClassId, setGradebookClassId] = useState<string>("");
  const [gradebookSection, setGradebookSection] = useState<string>("");
  const [gradebookSemester, setGradebookSemester] = useState<string>("semester_1");
  const [gradebookData, setGradebookData] = useState<ClassGradebookData | null>(null);
  const [gradebookLoading, setGradebookLoading] = useState<boolean>(false);
  const [gradebookError, setGradebookError] = useState<string | null>(null);

  // Session Closure & Deletion Modals
  const [sessionToClose, setSessionToClose] = useState<AttendanceSessionSummary | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<AttendanceSessionSummary | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [closeSubmitting, setCloseSubmitting] = useState<boolean>(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // New Session Creation Dialog State (Teacher)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newSessionSlot, setNewSessionSlot] = useState<string>("Period 1 (08:30-09:15)");
  const [newSessionDate, setNewSessionDate] = useState<string>(() => new Date().toISOString().split("T")[0]);

  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
  const isSuperOrAdmin = useMemo(() => {
    if (!user) return false;
    const r = (user.role || "").toLowerCase();
    const roles = (user.roles || []).map((x: any) =>
      (typeof x === "string" ? x : x.name || "").toLowerCase()
    );
    const adminRoles = ["superadmin", "admin", "administrator", "academic_director", "academic_administrator", "attendance_officer"];
    return adminRoles.includes(r) || roles.some((x) => adminRoles.includes(x)) || Boolean(user.permissions?.includes("*"));
  }, [user]);

  const hasPermission = useCallback(
    (permission: string) => isSuperOrAdmin || permissions.has(permission) || permissions.has("*"),
    [isSuperOrAdmin, permissions]
  );
  const canViewAttendance = hasPermission("attendance.view") && area !== "academic";
  const canCreateAttendance = hasPermission("attendance.create") && canViewAttendance;
  const canCloseAttendance = hasPermission("attendance.close") && canViewAttendance;
  const canDeleteAttendance = hasPermission("attendance.delete") && canViewAttendance;
  const canViewReports = hasPermission("reports.view") && area !== "attendance";
  const canExportReports = hasPermission("reports.export") && canViewReports;
  const canViewAcademicData = ["academic-years.view", "school-classes.view", "courses.view", "assessments.view"].some(hasPermission);

  // Authentication Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const loadSessions = useCallback(
    async (
      page = 1,
      date = filterDate,
      classId = filterClassId,
      status = filterStatus
    ) => {
      if (!user) return;
      if (!canViewAttendance) {
        setSessions([]);
        setPagination(null);
        setDataLoading(false);
        return;
      }
      setDataLoading(true);
      setFetchError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("per_page", "15");
        if (date) params.set("date", date);
        if (classId) params.set("class_id", classId);
        if (status && status !== "all") params.set("status", status);

        const res = await attendanceService.request(`attendance/sessions?${params.toString()}`, {
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
          setSessions(list);
          setPagination(json?.pagination || null);
        } else {
          setFetchError("Unable to load attendance sessions. Please refresh or verify permissions.");
        }
      } catch {
        setFetchError("Network error while connecting to the school backend.");
      } finally {
        setDataLoading(false);
      }
    },
    [user, canViewAttendance, filterDate, filterClassId, filterStatus]
  );

  const loadSummary = useCallback(
    async (date = summaryDate, classId = summaryClassId) => {
      if (!user) return;
      if (!canViewAttendance) {
        setSummaryData(null);
        setSummaryLoading(false);
        return;
      }
      setSummaryLoading(true);
      try {
        const params = new URLSearchParams();
        if (date) params.set("date", date);
        if (classId) params.set("class_id", classId);

        const res = await attendanceService.request(`attendance/summary?${params.toString()}`, {
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const sumJson = await res.json();
          setSummaryData(sumJson?.data || null);
        }
      } catch {
        // Soft error for summary
      } finally {
        setSummaryLoading(false);
      }
    },
    [user, canViewAttendance, summaryDate, summaryClassId]
  );

  const loadAdminMeta = useCallback(async () => {
    if (!user) return;
    if (!canViewAcademicData) return;

    try {
      const [classesRes, coursesRes] = await Promise.all([
        hasPermission("school-classes.view")
          ? schoolManagementService.request("school-classes", {}, undefined, user.id).catch(() => null)
          : null,
        hasPermission("courses.view")
          ? schoolManagementService.request("courses", {}, undefined, user.id).catch(() => null)
          : null,
      ]);

      if (classesRes && classesRes.ok) {
        const cData = await classesRes.json();
        setAdminClasses(Array.isArray(cData?.data) ? cData.data : []);
      }
      if (coursesRes && coursesRes.ok) {
        const crData = await coursesRes.json();
        setAdminCourses(Array.isArray(crData?.data) ? crData.data : []);
      }
    } catch {
      // Ignored
    }
  }, [user, canViewAcademicData, hasPermission]);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      canViewAttendance ? loadSessions(1, filterDate, filterClassId, filterStatus) : Promise.resolve(),
      canViewAttendance ? loadSummary(summaryDate, summaryClassId) : Promise.resolve(),
      canViewAcademicData ? loadAdminMeta() : Promise.resolve(),
    ]);
  }, [user, canViewAttendance, canViewAcademicData, loadSessions, loadSummary, loadAdminMeta, filterDate, filterClassId, filterStatus, summaryDate, summaryClassId]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadSessions(1, filterDate, filterClassId, filterStatus);
  };

  const handleClearFilters = () => {
    setFilterDate("");
    setFilterClassId("");
    setFilterStatus("");
    setCurrentPage(1);
    loadSessions(1, "", "", "");
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadSessions(newPage, filterDate, filterClassId, filterStatus);
  };

  const handleApplySummaryFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadSummary(summaryDate, summaryClassId);
  };

  const handleResetSummaryFilter = () => {
    const today = new Date().toISOString().split("T")[0];
    setSummaryDate(today);
    setSummaryClassId("");
    loadSummary(today, "");
  };

  const handleConfirmClose = async () => {
    if (!canCloseAttendance || !sessionToClose || closeSubmitting) return;
    setCloseSubmitting(true);
    setCloseError(null);

    try {
      const res = await attendanceService.request(`attendance/sessions/${sessionToClose.id}/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const json = await res.json();

      if (res.ok) {
        setActionSuccessMsg(`Attendance session #${sessionToClose.id} closed and permanently archived.`);
        setSessionToClose(null);
        await Promise.all([
          loadSessions(currentPage, filterDate, filterClassId, filterStatus),
          loadSummary(summaryDate, summaryClassId),
        ]);
      } else {
        const msg = json.errors
          ? Object.values(json.errors).flat().join(" ")
          : json.message || "Failed to close attendance session.";
        setCloseError(msg);
      }
    } catch {
      setCloseError("Network error while closing attendance session.");
    } finally {
      setCloseSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!canDeleteAttendance || !sessionToDelete || sessionToDelete.status === "closed" || deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      const response = await attendanceService.request(`attendance/sessions/${sessionToDelete.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to delete attendance session.");
      setActionSuccessMsg(`Attendance session #${sessionToDelete.id} deleted.`);
      setSessionToDelete(null);
      await Promise.all([
        loadSessions(currentPage, filterDate, filterClassId, filterStatus),
        loadSummary(summaryDate, summaryClassId),
      ]);
    } catch (cause) {
      setFetchError(cause instanceof Error ? cause.message : "Unable to delete attendance session.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleCreateSession = async (assignment: TeachingAssignmentSummary) => {
    if (!canCreateAttendance || !assignment) return;
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const res = await attendanceService.request("attendance/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          academic_year_id: assignment.academic_year_id || 1,
          term_id: 1,
          class_id: assignment.class_id,
          course_id: assignment.course_id || null,
          date: newSessionDate,
          time_slot: newSessionSlot,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setShowCreateModal(false);
        const createdSessionId = json?.data?.id;
        if (createdSessionId) {
          router.push(`/attendance/${createdSessionId}?section=${encodeURIComponent(assignment.section)}&semester=${encodeURIComponent(assignment.semester)}`);
        } else {
          await loadDashboardData();
        }
      } else {
        const msg = json.errors
          ? Object.values(json.errors).flat().join(" ")
          : json.message || "Failed to create attendance session.";
        setCreateError(msg);
      }
    } catch {
      setCreateError("Network error while creating attendance session.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const loadGradebook = useCallback(
    async (classId: string, section: string, semester: string) => {
      if (!canViewReports || !classId) {
        setGradebookData(null);
        setGradebookLoading(false);
        return;
      }
      setGradebookLoading(true);
      setGradebookError(null);
      try {
        const params = new URLSearchParams();
        if (semester) params.set("semester", semester);
        if (section) params.set("section", section);

        const res = await reportsService.classGradebook(classId, `?${params.toString()}`, user?.id);

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.message || `Failed to load gradebook (${res.status})`);
        }

        const json = await res.json();
        setGradebookData(json.data || null);
      } catch (err: unknown) {
        setGradebookError(err instanceof Error ? err.message : "Failed to load gradebook");
      } finally {
        setGradebookLoading(false);
      }
    },
    [canViewReports, user?.id]
  );

  useEffect(() => {
    if (adminClasses.length > 0 && !gradebookClassId) {
      setGradebookClassId(String(adminClasses[0].id));
    }
  }, [adminClasses, gradebookClassId]);

  useEffect(() => {
    if (gradebookClassId) {
      loadGradebook(gradebookClassId, gradebookSection, gradebookSemester);
    }
  }, [gradebookClassId, gradebookSection, gradebookSemester, loadGradebook]);

  const handleExportCsv = () => {
    if (!canExportReports || !gradebookClassId) return;
    const params = new URLSearchParams();
    if (gradebookSemester) params.set("semester", gradebookSemester);
    if (gradebookSection) params.set("section", gradebookSection);
    window.location.href = `/api/backend/report-cards/class/${gradebookClassId}/export/csv?${params.toString()}`;
  };

  const handlePrintGradebook = () => {
    if (!canExportReports || !gradebookClassId) return;
    const params = new URLSearchParams();
    if (gradebookSemester) params.set("semester", gradebookSemester);
    if (gradebookSection) params.set("section", gradebookSection);
    window.open(`/api/backend/report-cards/class/${gradebookClassId}/export/print?${params.toString()}`, "_blank");
  };

  if (area === "attendance" && !canViewAttendance) {
    return (
      <section className="m-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111624] p-8 text-center text-sm text-slate-500">
        You do not have permission to view attendance sessions and records.
      </section>
    );
  }

  if (area === "academic" && !canViewAcademicData && !canViewReports) {
    return (
      <section className="m-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111624] p-8 text-center text-sm text-slate-500">
        You do not have permission to view academic dashboard and performance metrics.
      </section>
    );
  }

  if (authLoading || !user || (dataLoading && sessions.length === 0 && !summaryData && !adminClasses.length)) {
    if (area === "attendance") {
      return <AttendanceDashboardShimmerSkeleton />;
    }
    if (area === "academic") {
      return <AcademicDashboardShimmerSkeleton />;
    }
    return <DashboardOverviewShimmerSkeleton />;
  }

  const userRoles = user.roles ?? [user.role];
  const hasAdministrativeScope = ["attendance.close", "attendance.delete", "reports.view.all", "reports.export.all", "school-classes.create", "courses.create", "users.view", "payments.view"].some(hasPermission);
  const isTeacher = userRoles.includes("teacher") && area !== "academic" && !hasAdministrativeScope;
  const isAdmin = !isTeacher && hasAdministrativeScope;
  const assignments = user.teaching_assignments || [];
  const primaryAssignment = assignments.find((a) => a.is_primary) || assignments[0];

  const getStatusBadge = (session: AttendanceSessionSummary) => {
    switch (session.status) {
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3 h-3" />
            Submitted
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Lock className="w-3 h-3" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {session.status}
          </span>
        );
    }
  };

  const getAreaHeading = () => {
    if (area === "attendance") {
      return {
        eyebrow: "Attendance Management",
        title: "Attendance & Roll Call Sessions",
        subtitle: "Monitor daily attendance, launch roll calls, and manage session records.",
      };
    }
    if (area === "academic") {
      return {
        eyebrow: "Academic Operations",
        title: "Academic Performance & Gradebook",
        subtitle: "Official rankings, passing/failing marks, and exportable grade reports.",
      };
    }
    return {
      eyebrow: "School Management",
      title: "Sunday School Dashboard",
      subtitle: "Sunday school attendance, academic rosters, and class schedules.",
    };
  };

  const heading = getAreaHeading();

  return (
    <div className="w-full space-y-5 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-7">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-sky-400">
              {heading.eyebrow}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            {area === "attendance" ? (
              <CalendarCheck className="w-5 h-5 text-[#0858a8] shrink-0" />
            ) : area === "academic" ? (
              <GraduationCap className="w-5 h-5 text-[#0858a8] shrink-0" />
            ) : (
              <BookOpen className="w-5 h-5 text-[#0858a8] shrink-0" />
            )}
            {heading.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {heading.subtitle}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {primaryAssignment && canCreateAttendance && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={btnPrimary}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          )}

          <button
            onClick={loadDashboardData}
            disabled={dataLoading}
            className={btnSecondary}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin text-[#0858a8]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {fetchError && (
        <div role="alert" className="p-3.5 rounded-[4px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to refresh records</p>
            <p className="mt-0.5">{fetchError}</p>
          </div>
          <button onClick={loadDashboardData} className={`${btnSecondary} h-7 px-2.5 text-xs text-rose-700 dark:text-rose-300`}>
            Retry
          </button>
        </div>
      )}

      {actionSuccessMsg && (
        <div role="status" className="p-3.5 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3 text-emerald-800 dark:text-emerald-200 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Action Completed</p>
            <p className="mt-0.5">{actionSuccessMsg}</p>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* TEACHER VIEW */}
      {isTeacher && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            {hasPermission("school-classes.view") && (
              <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned Classes</p>
                    <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{assignments.length}</p>
                  </div>
                  <div className="w-9 h-9 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0858a8] dark:text-sky-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}

            {canViewAttendance && (
              <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Sessions</p>
                    <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{sessions.length}</p>
                  </div>
                  <div className="w-9 h-9 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}

            {canViewAttendance && (
              <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Daily Attendance</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {summaryData?.attendance_rate !== undefined ? `${summaryData.attendance_rate}%` : "—"}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Percent className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}

            {canViewAttendance && (
              <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Daily Absences</p>
                    <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                      {summaryData?.counts?.absent ?? 0}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-[4px] bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <UserX className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Daily Attendance Summary Card */}
          {summaryData && (
            <div className={cardCls}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#0858a8] dark:text-sky-400" />
                    <span>Daily Attendance Summary & Absentee List</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Aggregated roll-call records for {summaryData.date}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 text-[11px]">
                    {summaryData.counts.present} Present
                  </span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800 text-[11px]">
                    {summaryData.counts.absent} Absent
                  </span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800 text-[11px]">
                    {summaryData.counts.late} Late
                  </span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 text-[11px]">
                    {summaryData.counts.excused} Excused
                  </span>
                </div>
              </div>

              {/* Absentee List Sub-Section */}
              <div className="mt-3.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                  Students Marked Absent Today ({summaryData.absentees.length})
                </h3>

                {summaryData.absentees.length === 0 ? (
                  <div className="p-3.5 rounded-[4px] bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    ✓ No students marked absent on {summaryData.date}. 100% attendance recorded!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {summaryData.absentees.map((absentee, idx) => (
                      <div
                        key={`${absentee.session_id}-${absentee.student_id}-${idx}`}
                        className="p-3 rounded-[4px] bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-start gap-2.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                          !
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {absentee.student_name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {absentee.class_name} • {absentee.course_title}
                          </p>
                          {absentee.remarks && (
                            <p className="text-[11px] text-rose-700 dark:text-rose-300 italic mt-1 bg-white/70 dark:bg-black/30 px-1.5 py-0.5 rounded-[3px] border border-rose-200/60 dark:border-rose-800/40 inline-block">
                              Reason: {absentee.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 1: Assigned Classes and Courses */}
          <section aria-labelledby="classes-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="classes-heading" className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#0858a8] dark:text-sky-400" />
                  <span>Your Assigned Classes & Courses</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Teaching assignments linked to your teacher profile
                </p>
              </div>

              {primaryAssignment && canCreateAttendance && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  type="button"
                  className={btnPrimary}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Session</span>
                </button>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="p-8 rounded-[6px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 text-center">
                <div className="w-10 h-10 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">No Teaching Assignments Found</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  You currently have no classes or courses assigned by the Sunday school administrator.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-[6px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 hover:border-[#0858a8] dark:hover:border-sky-500 transition shadow-2xs group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#0858a8] dark:text-sky-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded-[3px]">
                          {assignment.class_code || "CLASS"}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                          {assignment.class_name || "Assigned Class"}
                        </h3>
                      </div>
                      {assignment.is_primary && (
                        <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Course:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {assignment.course_name || "General / Homeroom"} ({assignment.course_code || "GEN"})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Section:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Section {assignment.section}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Semester:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {assignment.semester.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: Attendance Sessions Scoped to Teacher */}
          <section aria-labelledby="sessions-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="sessions-heading" className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#0858a8] dark:text-sky-400" />
                  <span>Attendance Sessions</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sessions authorized for your assigned classes and dates
                </p>
              </div>
            </div>

            {dataLoading ? (
              <div className="p-4 rounded-[6px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800">
                <TableShimmerSkeleton rows={4} columns={5} />
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 rounded-[6px] bg-white dark:bg-[#111624] border border-slate-200/90 dark:border-slate-800 text-center">
                <div className="w-10 h-10 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">No Attendance Sessions Yet</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-3">
                  There are no attendance sessions created for your assigned classes yet.
                </p>
                {primaryAssignment && canCreateAttendance && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className={btnPrimary}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Start Today&apos;s Roll Call Session</span>
                  </button>
                )}
              </div>
            ) : (
              <div className={tableContainerCls}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={tableHeaderRowCls}>
                        <th className={tableHeaderCellCls}>Date</th>
                        <th className={tableHeaderCellCls}>Slot</th>
                        <th className={tableHeaderCellCls}>Class</th>
                        <th className={tableHeaderCellCls}>Course</th>
                        <th className={tableHeaderCellCls}>Status</th>
                        <th className={`${tableHeaderCellCls} text-right`}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {sessions.map((session) => (
                        <tr key={session.id} className={tableRowCls(false)}>
                          <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">{session.date}</td>
                          <td className="py-3 px-4 capitalize text-slate-700 dark:text-slate-300">{session.time_slot}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {nestedLocalizedText(session.school_class?.name) || `Class #${session.class_id}`}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {session.course?.name ? nestedLocalizedText(session.course.name) : <span className="text-slate-400">Homeroom</span>}
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(session)}</td>
                          <td className="py-3 px-4 text-right">
                            {(() => {
                              const sessionAssignment = assignments.find(
                                (a) => a.class_id === session.class_id && (!session.course_id || a.course_id === session.course_id)
                              );
                              const linkHref = sessionAssignment
                                ? `/attendance/${session.id}?section=${encodeURIComponent(sessionAssignment.section)}&semester=${encodeURIComponent(sessionAssignment.semester)}`
                                : `/attendance/${session.id}`;

                              if (session.status === "draft") {
                                return (
                                  <Link
                                    href={linkHref}
                                    className={`${btnBase} h-7 px-2.5 bg-[#0858a8] text-white hover:bg-[#074c91] text-[11px]`}
                                  >
                                    <span>Take Attendance</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                );
                              } else if (session.is_teacher_editable) {
                                return (
                                  <Link
                                    href={linkHref}
                                    className={`${btnBase} h-7 px-2.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-[11px]`}
                                  >
                                    <span>Review (24h)</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                );
                              } else {
                                return (
                                  <Link
                                    href={linkHref}
                                    className={actionBtnView}
                                    title="View Roster"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                );
                              }
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ADMINISTRATOR VIEW */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Classes</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{adminClasses.length}</p>
                </div>
                <div className="w-9 h-9 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Courses</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{adminCourses.length}</p>
                </div>
                <div className="w-9 h-9 rounded-[4px] bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filtered Sessions</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    {pagination?.total ?? sessions.length}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0858a8] dark:text-sky-400">
                  <CalendarCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="rounded-[6px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Daily Attendance</p>
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {summaryData?.attendance_rate !== undefined ? `${summaryData.attendance_rate}%` : "—"}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* School-Wide Attendance Summary & Absentee Drilldown Card */}
          {canViewAttendance && (
            <div className={cardCls}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#0858a8] dark:text-sky-400" />
                    <span>School-Wide Attendance Summary & Absentee List</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live aggregated attendance rates and drill-down for {summaryData?.date || summaryDate}
                  </p>
                </div>

                {/* Summary Filter Controls */}
                <form onSubmit={handleApplySummaryFilter} className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    aria-label="Summary Date"
                    value={summaryDate}
                    onChange={(e) => setSummaryDate(e.target.value)}
                    className={`${inputCls()} w-36`}
                  />
                  <div className="w-44">
                    <AppSelect
                      value={summaryClassId}
                      onChange={(val) => setSummaryClassId(val)}
                      options={[
                        { value: "", label: "All School Classes" },
                        ...adminClasses.map((c) => ({ value: String(c.id), label: nestedLocalizedText(c.name) })),
                      ]}
                      placeholder="All School Classes"
                      size="sm"
                      ariaLabel="Filter Summary by Class"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={summaryLoading}
                    className={btnPrimary}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSummaryFilter}
                    disabled={summaryLoading}
                    title="Reset Summary Filters"
                    className={btnSecondary}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${summaryLoading ? "animate-spin" : ""}`} />
                  </button>
                </form>
              </div>

              {/* Summary Stats Badges */}
              {summaryData && (
                <div className="pt-3.5 space-y-3.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 text-[11px]">
                      {summaryData.total_sessions} Sessions ({summaryData.submitted_sessions} submitted)
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 text-[11px]">
                      {summaryData.counts.present} Present
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800 text-[11px]">
                      {summaryData.counts.absent} Absent
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800 text-[11px]">
                      {summaryData.counts.late} Late
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 text-[11px]">
                      {summaryData.counts.excused} Excused
                    </span>
                  </div>

                  {/* Absentees Drilldown */}
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                      Absentees Recorded ({summaryData.absentees.length})
                    </h3>

                    {summaryData.absentees.length === 0 ? (
                      <div className="p-3.5 rounded-[4px] bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                        ✓ No students marked absent on {summaryData.date} for the selected criteria.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {summaryData.absentees.map((absentee, idx) => (
                          <div
                            key={`${absentee.session_id}-${absentee.student_id}-${idx}`}
                            className="p-3 rounded-[4px] bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-start gap-2.5"
                          >
                            <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                              !
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {absentee.student_name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {absentee.class_name} • {absentee.course_title}
                              </p>
                              {absentee.remarks && (
                                <p className="text-[11px] text-rose-700 dark:text-rose-300 italic mt-1 bg-white/70 dark:bg-black/30 px-1.5 py-0.5 rounded-[3px] border border-rose-200/60 dark:border-rose-800/40 inline-block">
                                  Reason: {absentee.remarks}
                                </p>
                              )}
                              <div className="mt-1.5">
                                <Link
                                  href={`/attendance/${absentee.session_id}`}
                                  className="text-[11px] font-semibold text-[#0858a8] dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                                >
                                  <span>View Session</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* School-Wide Attendance Sessions Overview */}
          {canViewAttendance && (
            <div className={tableContainerCls}>
              {/* Sessions Filter Toolbar */}
              <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <form onSubmit={handleApplyFilters} className="flex flex-1 flex-wrap items-center gap-2.5">
                  <input
                    type="date"
                    aria-label="Filter by Date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className={`${inputCls()} w-36`}
                  />

                  <div className="w-40">
                    <AppSelect
                      value={filterClassId}
                      onChange={(val) => setFilterClassId(val)}
                      options={[
                        { value: "", label: "All Classes" },
                        ...adminClasses.map((c) => ({ value: String(c.id), label: nestedLocalizedText(c.name) })),
                      ]}
                      placeholder="All Classes"
                      size="sm"
                      ariaLabel="Filter by Class"
                    />
                  </div>

                  <div className="w-36">
                    <AppSelect
                      value={filterStatus}
                      onChange={(val) => setFilterStatus(val)}
                      options={[
                        { value: "", label: "All Statuses" },
                        { value: "draft", label: "Draft" },
                        { value: "submitted", label: "Submitted" },
                        { value: "closed", label: "Closed" },
                      ]}
                      placeholder="All Statuses"
                      size="sm"
                      ariaLabel="Filter by Status"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={dataLoading}
                    className={btnPrimary}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearFilters}
                    disabled={dataLoading}
                    className={btnSecondary}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </form>

                <div className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap self-end md:self-center">
                  {pagination?.total ?? sessions.length} sessions
                </div>
              </div>

              {/* Sessions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={tableHeaderRowCls}>
                      <th className={tableHeaderCellCls}>ID</th>
                      <th className={tableHeaderCellCls}>Date</th>
                      <th className={tableHeaderCellCls}>Slot</th>
                      <th className={tableHeaderCellCls}>Class</th>
                      <th className={tableHeaderCellCls}>Course</th>
                      <th className={tableHeaderCellCls}>Status</th>
                      <th className={`${tableHeaderCellCls} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={7} className="p-4">
                          <TableShimmerSkeleton rows={5} columns={7} />
                        </td>
                      </tr>
                    ) : sessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          No attendance sessions match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session) => (
                        <tr key={session.id} className={tableRowCls(false)}>
                          <td className="py-3 px-4 font-mono text-slate-400 dark:text-slate-500">#{session.id}</td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">{session.date}</td>
                          <td className="py-3 px-4 capitalize text-slate-700 dark:text-slate-300">{session.time_slot}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {nestedLocalizedText(session.school_class?.name) || `Class #${session.class_id}`}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {session.course?.name ? nestedLocalizedText(session.course.name) : <span className="text-slate-400">Homeroom</span>}
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(session)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Link
                                href={`/attendance/${session.id}`}
                                className={actionBtnView}
                                title="Inspect Roster"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>

                              {session.status === "submitted" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSessionToClose(session);
                                    setCloseError(null);
                                  }}
                                  className={`${btnBase} h-7 px-2 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-[11px]`}
                                  title="Close and finalize session"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Close</span>
                                </button>
                              )}

                              {canDeleteAttendance && session.status !== "closed" && (
                                <button
                                  type="button"
                                  onClick={() => setSessionToDelete(session)}
                                  className={actionBtnDelete}
                                  title="Delete Session"
                                >
                                  <span className="sr-only">Delete</span>
                                  ✕
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

              {/* Pagination Footer */}
              {pagination && pagination.total_pages > 1 && (
                <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    Page {pagination.current_page} of {pagination.total_pages} ({pagination.total} total sessions)
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={pagination.current_page <= 1 || dataLoading}
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      className={btnSecondary}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      disabled={pagination.current_page >= pagination.total_pages || dataLoading}
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      className={btnSecondary}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Administrative Academic Gradebook & Official Transcripts */}
          {canViewReports && (
            <div className={tableContainerCls}>
              <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#0858a8] dark:text-sky-400" />
                    <span>Administrative Academic Gradebook & Official Transcripts</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Official rankings, passing/failing marks, and exportable grade reports
                  </p>
                </div>

                {/* Gradebook Filter Controls & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-44">
                    <AppSelect
                      value={gradebookClassId}
                      onChange={(val) => setGradebookClassId(val)}
                      options={[
                        { value: "", label: "Select Class..." },
                        ...adminClasses.map((c) => ({ value: String(c.id), label: `${nestedLocalizedText(c.name)} (${c.code})` })),
                      ]}
                      placeholder="Select Class..."
                      size="sm"
                      ariaLabel="Filter Gradebook by Class"
                    />
                  </div>

                  <div className="w-32">
                    <AppSelect
                      value={gradebookSection}
                      onChange={(val) => setGradebookSection(val)}
                      options={[
                        { value: "", label: "All Sections" },
                        { value: "A", label: "Section A" },
                        { value: "B", label: "Section B" },
                        { value: "C", label: "Section C" },
                        { value: "D", label: "Section D" },
                      ]}
                      placeholder="All Sections"
                      size="sm"
                      ariaLabel="Filter Gradebook by Section"
                    />
                  </div>

                  <div className="w-32">
                    <AppSelect
                      value={gradebookSemester}
                      onChange={(val) => setGradebookSemester(val)}
                      options={[
                        { value: "semester_1", label: "Semester 1" },
                        { value: "semester_2", label: "Semester 2" },
                      ]}
                      placeholder="Semester 1"
                      size="sm"
                      ariaLabel="Filter Gradebook by Semester"
                    />
                  </div>

                  {canExportReports && (
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      disabled={!gradebookClassId || gradebookLoading}
                      className={btnSecondary}
                      title="Export Gradebook as CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <span>Export CSV</span>
                    </button>
                  )}

                  {canExportReports && (
                    <button
                      type="button"
                      onClick={handlePrintGradebook}
                      disabled={!gradebookClassId || gradebookLoading}
                      className={btnPrimary}
                      title="Print Official Gradebook / PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Gradebook</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Gradebook Table */}
              <div className="overflow-x-auto">
                {gradebookLoading ? (
                  <div className="p-4">
                    <TableShimmerSkeleton rows={5} columns={6} />
                  </div>
                ) : gradebookError ? (
                  <div className="py-8 text-center bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40 p-4">
                    <AlertTriangle className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
                    <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">{gradebookError}</p>
                  </div>
                ) : !gradebookData || gradebookData.students.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No student grades recorded for the selected class and semester.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className={tableHeaderRowCls}>
                      <tr>
                        <th className={tableHeaderCellCls}>Student</th>
                        <th className={`${tableHeaderCellCls} text-center`}>Sec</th>
                        <th className={`${tableHeaderCellCls} text-center`}>Average %</th>
                        <th className={`${tableHeaderCellCls} text-center`}>Status</th>
                        <th className={`${tableHeaderCellCls} text-center`}>Sec Rank</th>
                        <th className={`${tableHeaderCellCls} text-center`}>Class Rank</th>
                        <th className={`${tableHeaderCellCls} text-center`}>Failed Subj</th>
                        <th className={`${tableHeaderCellCls} text-center`}>Attendance %</th>
                        <th className={`${tableHeaderCellCls} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {gradebookData.students.map((st) => (
                        <tr key={st.student.id} className={tableRowCls(false)}>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{nestedLocalizedText(st.student.full_name)}</p>
                            {st.student.christian_name && (
                              <p className="text-[10px] text-slate-400">
                                {nestedLocalizedText(st.student.christian_name)}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium">{st.section}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100">
                            {st.summary.overall_average}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {st.summary.status === "PASS" && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-2.5 h-2.5" /> PASS
                              </span>
                            )}
                            {st.summary.status === "FAIL" && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <AlertTriangle className="w-2.5 h-2.5" /> FAIL
                              </span>
                            )}
                            {st.summary.status === "INCOMPLETE" && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-2.5 h-2.5" /> INCOMPLETE
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium">
                            {st.summary.section_rank ? `#${st.summary.section_rank}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium">
                            {st.summary.class_rank ? `#${st.summary.class_rank}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={st.summary.failed_courses_count > 0 ? "font-bold text-rose-600 dark:text-rose-400" : "text-slate-500"}>
                              {st.summary.failed_courses_count}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium">
                            {st.attendance.attendance_rate}%
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href={`/report-cards/${st.student.id}`}
                              className="inline-flex items-center gap-1 text-[#0858a8] dark:text-sky-400 hover:underline font-semibold text-xs"
                            >
                              <span>Report Card</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student / Read-Only View */}
      {!isTeacher && !isAdmin && (
        <div className="space-y-4">
          <div className={cardCls}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-sky-400">Sunday School</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">Your Learning Space</h2>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Courses and school information available to your account.</p>
          </div>
          {hasPermission("courses.view") && (
            <div className={cardCls}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Courses</h3>
              {adminCourses.length ? (
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {adminCourses.map((course) => (
                    <article key={course.id} className="rounded-[4px] border border-slate-200/90 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/40">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{nestedLocalizedText(course.name)}</h4>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{course.code}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No courses are available to display.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Attendance Session Dialog */}
      <ConfirmDialog
        isOpen={Boolean(sessionToDelete)}
        onClose={() => {
          if (!deleteSubmitting) setSessionToDelete(null);
        }}
        onConfirm={() => void handleDeleteSession()}
        isLoading={deleteSubmitting}
        title="Delete attendance session"
        description={sessionToDelete ? `Delete session #${sessionToDelete.id}? This action cannot be undone.` : "This action cannot be undone."}
      />

      {/* Close Attendance Session Dialog */}
      <ConfirmDialog
        isOpen={Boolean(sessionToClose && canCloseAttendance)}
        onClose={() => {
          if (!closeSubmitting) {
            setSessionToClose(null);
            setCloseError(null);
          }
        }}
        onConfirm={() => void handleConfirmClose()}
        isLoading={closeSubmitting}
        title="Close attendance session"
        description={closeError || (sessionToClose ? `Close and archive session #${sessionToClose.id} for ${nestedLocalizedText(sessionToClose.school_class?.name) || `Class #${sessionToClose.class_id}`} (${sessionToClose.date}, ${sessionToClose.time_slot})? Teachers will no longer be able to correct attendance marks.` : "Closing finalizes this session.")}
      />

      {/* Start Roll Call Session Modal */}
      {showCreateModal && canCreateAttendance && primaryAssignment && (
        <AdminModal
          open={showCreateModal}
          onOpenChange={(open) => {
            if (!open && !createSubmitting) setShowCreateModal(false);
          }}
          title="Start Roll Call Session"
          description="Confirm the class, course, date, and time slot for this attendance session."
          showHeader={true}
          size="md"
        >
          <div className="space-y-4 text-xs">
            {createError && (
              <div className="p-3 rounded-[4px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {createError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className={labelCls}>Class & Section</label>
                <div className={detailCardCls}>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {primaryAssignment.class_name || "Grade 9"} — Section {primaryAssignment.section}
                  </span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Course</label>
                <div className={detailCardCls}>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {primaryAssignment.course_name || "Homeroom"}
                  </span>
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Session Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={newSessionDate}
                  onChange={(e) => setNewSessionDate(e.target.value)}
                  className={inputCls()}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Time Slot / Period <span className="text-rose-500">*</span>
                </label>
                <AppSelect
                  value={newSessionSlot}
                  onChange={(val) => setNewSessionSlot(val)}
                  options={[
                    { value: "Period 1 (08:30-09:15)", label: "Period 1 (08:30-09:15)" },
                    { value: "Period 2 (09:20-10:05)", label: "Period 2 (09:20-10:05)" },
                    { value: "Period 3 (10:10-10:55)", label: "Period 3 (10:10-10:55)" },
                    { value: "Period 4 (11:00-11:45)", label: "Period 4 (11:00-11:45)" },
                    { value: "Homeroom Sunday (08:00-09:00)", label: "Homeroom Sunday (08:00-09:00)" },
                  ]}
                  placeholder="Select time slot"
                />
              </div>
            </div>

            <div className={modalStickyFooter}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createSubmitting}
                onClick={() => handleCreateSession(primaryAssignment)}
                className={btnPrimary}
              >
                {createSubmitting ? "Creating..." : "Create & Start Roll Call"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

export default SchoolDashboard;
