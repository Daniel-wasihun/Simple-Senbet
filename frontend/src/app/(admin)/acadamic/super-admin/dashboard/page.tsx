"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
  Sparkles,
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
  DollarSign,
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

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
  const [adminClasses, setAdminClasses] = useState<SchoolClassSummary[]>([]);
  const [adminCourses, setAdminCourses] = useState<CourseSummary[]>([]);
  const [summaryData, setSummaryData] = useState<AttendanceSummaryData | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Administrative Filters & Pagination
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Summary Date & Class Drilldown Filter
  const [summaryDate, setSummaryDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [summaryClassId, setSummaryClassId] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  // Administrative Gradebook State
  const [gradebookClassId, setGradebookClassId] = useState<string>("");
  const [gradebookSection, setGradebookSection] = useState<string>("");
  const [gradebookSemester, setGradebookSemester] = useState<string>("semester_1");
  const [gradebookData, setGradebookData] = useState<ClassGradebookData | null>(null);
  const [gradebookLoading, setGradebookLoading] = useState<boolean>(false);
  const [gradebookError, setGradebookError] = useState<string | null>(null);

  // Quick Session Closure Modal (Admin)
  const [sessionToClose, setSessionToClose] = useState<AttendanceSessionSummary | null>(null);
  const [closeSubmitting, setCloseSubmitting] = useState<boolean>(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // New Session Creation Dialog State (Teacher)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newSessionSlot, setNewSessionSlot] = useState<string>("Period 1 (08:30-09:15)");
  const [newSessionDate, setNewSessionDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Authentication Guard: Redirect unauthenticated visitors to /login
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
      setDataLoading(true);
      setFetchError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("per_page", "15");
        if (date) params.set("date", date);
        if (classId) params.set("class_id", classId);
        if (status && status !== "all") params.set("status", status);

        const res = await fetch(`/api/backend/attendance/sessions?${params.toString()}`, {
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
          setSessions(list);
          if (json?.pagination) {
            setPagination(json.pagination);
          } else {
            setPagination(null);
          }
        } else {
          setFetchError("Unable to load attendance sessions. Please refresh or verify permissions.");
        }
      } catch {
        setFetchError("Network error while connecting to the school backend.");
      } finally {
        setDataLoading(false);
      }
    },
    [user, filterDate, filterClassId, filterStatus]
  );

  const loadSummary = useCallback(
    async (date = summaryDate, classId = summaryClassId) => {
      if (!user) return;
      setSummaryLoading(true);
      try {
        const params = new URLSearchParams();
        if (date) params.set("date", date);
        if (classId) params.set("class_id", classId);

        const res = await fetch(`/api/backend/attendance/summary?${params.toString()}`, {
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
    [user, summaryDate, summaryClassId]
  );

  const loadAdminMeta = useCallback(async () => {
    if (!user) return;
    const isAdminRole = user.role === "superadmin" || user.role === "academic_director";
    if (!isAdminRole) return;

    try {
      const [classesRes, coursesRes] = await Promise.all([
        fetch("/api/backend/school-classes", { headers: { Accept: "application/json" } }).catch(() => null),
        fetch("/api/backend/courses", { headers: { Accept: "application/json" } }).catch(() => null),
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
  }, [user]);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      loadSessions(1, filterDate, filterClassId, filterStatus),
      loadSummary(summaryDate, summaryClassId),
      loadAdminMeta(),
    ]);
  }, [user, loadSessions, loadSummary, loadAdminMeta, filterDate, filterClassId, filterStatus, summaryDate, summaryClassId]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

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
    if (!sessionToClose || closeSubmitting) return;
    setCloseSubmitting(true);
    setCloseError(null);

    try {
      const res = await fetch(`/api/backend/attendance/sessions/${sessionToClose.id}/close`, {
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

  // Quick Session Creation for Teachers
  const handleCreateSession = async (assignment: TeachingAssignmentSummary) => {
    if (!assignment) return;
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/backend/attendance/sessions", {
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

  const formatText = (text: string | { en?: string; am?: string } | undefined | null) => {
    if (!text) return "—";
    if (typeof text === "string") return text;
    return text.en || text.am || "—";
  };

  const loadGradebook = useCallback(
    async (classId: string, section: string, semester: string) => {
      if (!classId) return;
      setGradebookLoading(true);
      setGradebookError(null);
      try {
        const params = new URLSearchParams();
        if (semester) params.set("semester", semester);
        if (section) params.set("section", section);

        const res = await fetch(`/api/backend/report-cards/class/${classId}?${params.toString()}`, {
          headers: { Accept: "application/json" },
        });

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
    []
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
    if (!gradebookClassId) return;
    const params = new URLSearchParams();
    if (gradebookSemester) params.set("semester", gradebookSemester);
    if (gradebookSection) params.set("section", gradebookSection);
    window.location.href = `/api/backend/report-cards/class/${gradebookClassId}/export/csv?${params.toString()}`;
  };

  const handlePrintGradebook = () => {
    if (!gradebookClassId) return;
    const params = new URLSearchParams();
    if (gradebookSemester) params.set("semester", gradebookSemester);
    if (gradebookSection) params.set("section", gradebookSection);
    window.open(`/api/backend/report-cards/class/${gradebookClassId}/export/print?${params.toString()}`, "_blank");
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading Simple Senbet Dashboard...</p>
        </div>
      </div>
    );
  }

  const isTeacher = user.role === "teacher";
  const isAdmin = user.role === "superadmin" || user.role === "academic_director";
  const assignments = user.teaching_assignments || [];
  const primaryAssignment = assignments.find((a) => a.is_primary) || assignments[0];

  const getStatusBadge = (session: AttendanceSessionSummary) => {
    switch (session.status) {
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" />
            Submitted
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Lock className="w-3 h-3" />
            Closed (Archived)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
            {session.status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header & Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:bg-indigo-700 transition">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-lg text-slate-900 tracking-tight">Simple Senbet</span>
                  <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500">
                    የሰንበት ትምህርት ቤት
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/dashboard/payments"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Payments</span>
              </Link>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/60 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-700 hidden sm:inline">{user.name}</span>
                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-white text-indigo-700 border border-slate-200 shadow-2xs">
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Sign out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 text-xs font-semibold transition disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Welcome Banner */}
        <section aria-labelledby="welcome-heading" className="mb-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl shadow-indigo-950/10 relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-medium text-indigo-200 mb-3 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Simple Senbet Attendance MVP</span>
              </div>
              <h1 id="welcome-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                እንኳን ደህና መጡ፣ {user.name}
              </h1>
              <p className="mt-2 text-indigo-200 text-sm max-w-2xl">
                {isTeacher
                  ? "Welcome to your teacher attendance portal. Take roll-call for your assigned classes, review submitted records, and track daily student absences."
                  : isAdmin
                  ? "Welcome to the administrator overview. Monitor classes, courses, and school-wide attendance records."
                  : "Welcome to your student dashboard."}
              </p>
            </div>
            <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
              <GraduationCap className="w-64 h-64 text-white" />
            </div>
          </div>
        </section>

        {/* Global Error Alert */}
        {fetchError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm"
          >
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to refresh records</p>
              <p className="text-xs text-rose-700 mt-0.5">{fetchError}</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Global Success Alert */}
        {actionSuccessMsg && (
          <div
            role="status"
            className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Action Completed</p>
              <p className="text-xs text-emerald-700 mt-0.5">{actionSuccessMsg}</p>
            </div>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* TEACHER VIEW */}
        {isTeacher && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Classes</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{assignments.length}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Sessions</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{sessions.length}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Daily Attendance</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {summaryData?.attendance_rate !== undefined ? `${summaryData.attendance_rate}%` : "-"}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Percent className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Daily Absences</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">
                      {summaryData?.counts?.absent ?? 0}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <UserX className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Attendance Summary & Absentee List Card */}
            {summaryData && (
              <section aria-labelledby="summary-heading" className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 id="summary-heading" className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                      <span>Daily Attendance Summary & Absentee List</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Aggregated roll-call records for {summaryData.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      {summaryData.counts.present} Present
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                      {summaryData.counts.absent} Absent
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                      {summaryData.counts.late} Late
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                      {summaryData.counts.excused} Excused
                    </span>
                  </div>
                </div>

                {/* Absentee List Sub-Section */}
                <div className="mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Students Marked Absent Today ({summaryData.absentees.length})
                  </h3>

                  {summaryData.absentees.length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center text-xs text-emerald-800 font-medium">
                      ✓ No students marked absent on {summaryData.date}. 100% attendance recorded!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {summaryData.absentees.map((absentee, idx) => (
                        <div
                          key={`${absentee.session_id}-${absentee.student_id}-${idx}`}
                          className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0">
                            !
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {absentee.student_name}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {absentee.class_name} • {absentee.course_title}
                            </p>
                            {absentee.remarks && (
                              <p className="text-[11px] text-rose-700 italic mt-1 bg-white/70 px-2 py-0.5 rounded border border-rose-200/60 inline-block">
                                Reason: {absentee.remarks}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Section 1: Assigned Classes and Courses */}
            <section aria-labelledby="classes-heading">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 id="classes-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <span>Your Assigned Classes & Courses</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Teaching assignments linked to your teacher profile
                  </p>
                </div>

                {primaryAssignment && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Session</span>
                  </button>
                )}
              </div>

              {assignments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">No Teaching Assignments Found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    You currently have no classes or courses assigned by the Sunday school administrator. Please contact your administrator to configure your teaching schedule.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {assignment.class_code || "CLASS"}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-2">
                            {assignment.class_name || "Assigned Class"}
                          </h3>
                        </div>
                        {assignment.is_primary && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Primary
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Course:</span>
                          <span className="font-semibold text-slate-800">
                            {assignment.course_name || "General / Homeroom"} ({assignment.course_code || "GEN"})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Section:</span>
                          <span className="font-semibold text-slate-800">Section {assignment.section}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Semester:</span>
                          <span className="font-semibold text-slate-800 capitalize">
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
            <section aria-labelledby="sessions-heading">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 id="sessions-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-indigo-600" />
                    <span>Attendance Sessions</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sessions authorized for your assigned classes and dates
                  </p>
                </div>
                <button
                  onClick={loadDashboardData}
                  disabled={dataLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {dataLoading ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center">
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                    <span>Loading authorized attendance sessions...</span>
                  </div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">No Attendance Sessions Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    There are no attendance sessions created for your assigned classes yet.
                  </p>
                  {primaryAssignment && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Start Today&apos;s Roll Call Session</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Slot</th>
                          <th className="py-3 px-4">Class</th>
                          <th className="py-3 px-4">Course</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {sessions.map((session) => (
                          <tr key={session.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">{session.date}</td>
                            <td className="py-3 px-4 capitalize">{session.time_slot}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {session.school_class?.name || `Class #${session.class_id}`}
                            </td>
                            <td className="py-3 px-4">
                              {session.course?.name || <span className="text-slate-400">Homeroom</span>}
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
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
                                    >
                                      <span>Take Attendance</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                  );
                                } else if (session.is_teacher_editable) {
                                  return (
                                    <Link
                                      href={linkHref}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition"
                                    >
                                      <span>Review & Correct (24h)</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                  );
                                } else {
                                  return (
                                    <Link
                                      href={linkHref}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-medium hover:bg-slate-50 transition"
                                    >
                                      <span>View Roster</span>
                                      <ArrowRight className="w-3 h-3" />
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
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Classes</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{adminClasses.length}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Courses</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{adminCourses.length}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Filtered Sessions</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {pagination?.total ?? sessions.length}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Daily Attendance</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {summaryData?.attendance_rate !== undefined ? `${summaryData.attendance_rate}%` : "-"}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Percent className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* School-Wide Attendance Summary & Absentee Drilldown Card */}
            <section aria-labelledby="admin-summary-heading" className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 id="admin-summary-heading" className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                    <span>School-Wide Attendance Summary & Absentee List</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
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
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  />
                  <select
                    aria-label="Filter Summary by Class"
                    value={summaryClassId}
                    onChange={(e) => setSummaryClassId(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                  >
                    <option value="">All School Classes</option>
                    {adminClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={summaryLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSummaryFilter}
                    disabled={summaryLoading}
                    title="Reset Summary Filters"
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${summaryLoading ? "animate-spin" : ""}`} />
                  </button>
                </form>
              </div>

              {/* Summary Stats Badges */}
              {summaryData && (
                <div className="pt-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                      {summaryData.total_sessions} Sessions ({summaryData.submitted_sessions} submitted)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      {summaryData.counts.present} Present
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                      {summaryData.counts.absent} Absent
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                      {summaryData.counts.late} Late
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                      {summaryData.counts.excused} Excused
                    </span>
                  </div>

                  {/* Absentees Drilldown */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Absentees Recorded ({summaryData.absentees.length})
                    </h3>

                    {summaryData.absentees.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center text-xs text-emerald-800 font-medium">
                        ✓ No students marked absent on {summaryData.date} for the selected criteria.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {summaryData.absentees.map((absentee, idx) => (
                          <div
                            key={`${absentee.session_id}-${absentee.student_id}-${idx}`}
                            className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-start gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0">
                              !
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {absentee.student_name}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {absentee.class_name} • {absentee.course_title}
                              </p>
                              {absentee.remarks && (
                                <p className="text-[11px] text-rose-700 italic mt-1 bg-white/70 px-2 py-0.5 rounded border border-rose-200/60 inline-block">
                                  Reason: {absentee.remarks}
                                </p>
                              )}
                              <div className="mt-2">
                                <Link
                                  href={`/attendance/${absentee.session_id}`}
                                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
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
            </section>

            {/* School-Wide Attendance Sessions Overview & Filter Bar */}
            <section aria-labelledby="admin-sessions-heading">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h2 id="admin-sessions-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-indigo-600" />
                    <span>All Attendance Sessions (Administrative Overview & Closure)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Filter by date, class, and status; inspect student rosters; and close completed sessions
                  </p>
                </div>

                <button
                  onClick={() => loadSessions(currentPage, filterDate, filterClassId, filterStatus)}
                  disabled={dataLoading}
                  className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin" : ""}`} />
                  <span>Refresh Sessions</span>
                </button>
              </div>

              {/* Sessions Filter Toolbar */}
              <form onSubmit={handleApplyFilters} className="mb-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Date:</span>
                  <input
                    type="date"
                    aria-label="Filter by Date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Class:</span>
                  <select
                    aria-label="Filter by Class"
                    value={filterClassId}
                    onChange={(e) => setFilterClassId(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                  >
                    <option value="">All Classes</option>
                    {adminClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Status:</span>
                  <select
                    aria-label="Filter by Status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="submit"
                    disabled={dataLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Apply Filters</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    disabled={dataLoading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </form>

              {/* Sessions Table */}
              {dataLoading ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center">
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                    <span>Loading attendance sessions...</span>
                  </div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">No Attendance Sessions Found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    No sessions match the selected filters or exist in the database.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="py-3 px-4">ID</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Slot</th>
                          <th className="py-3 px-4">Class</th>
                          <th className="py-3 px-4">Course</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {sessions.map((session) => (
                          <tr key={session.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-mono text-slate-400">#{session.id}</td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">{session.date}</td>
                            <td className="py-3 px-4 capitalize">{session.time_slot}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {session.school_class?.name || `Class #${session.class_id}`}
                            </td>
                            <td className="py-3 px-4">
                              {session.course?.name || <span className="text-slate-400">Homeroom</span>}
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(session)}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <Link
                                  href={`/attendance/${session.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold transition"
                                >
                                  <span>Inspect Roster</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>

                                {session.status === "submitted" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSessionToClose(session);
                                      setCloseError(null);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold transition"
                                  >
                                    <Lock className="w-3 h-3" />
                                    <span>Close</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {pagination && pagination.total_pages > 1 && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        Showing <strong>{sessions.length}</strong> of <strong>{pagination.total}</strong> sessions (Page <strong>{pagination.current_page}</strong> of <strong>{pagination.total_pages}</strong>)
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={pagination.current_page <= 1 || dataLoading}
                          onClick={() => handlePageChange(pagination.current_page - 1)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 font-medium inline-flex items-center gap-1 transition"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous</span>
                        </button>
                        <button
                          type="button"
                          disabled={pagination.current_page >= pagination.total_pages || dataLoading}
                          onClick={() => handlePageChange(pagination.current_page + 1)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 font-medium inline-flex items-center gap-1 transition"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Administrative Academic Gradebook & Official Transcripts */}
            <section aria-labelledby="admin-gradebook-heading" className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 id="admin-gradebook-heading" className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                    <span>Administrative Academic Gradebook & Official Transcripts</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official rankings, passing/failing marks, and exportable grade reports
                  </p>
                </div>

                {/* Gradebook Filter Controls & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter Gradebook by Class"
                    value={gradebookClassId}
                    onChange={(e) => setGradebookClassId(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 font-medium"
                  >
                    <option value="">Select Class...</option>
                    {adminClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {formatText(c.name)} ({c.code})
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter Gradebook by Section"
                    value={gradebookSection}
                    onChange={(e) => setGradebookSection(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 font-medium"
                  >
                    <option value="">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>

                  <select
                    aria-label="Filter Gradebook by Semester"
                    value={gradebookSemester}
                    onChange={(e) => setGradebookSemester(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 font-medium"
                  >
                    <option value="semester_1">Semester 1</option>
                    <option value="semester_2">Semester 2</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={!gradebookClassId || gradebookLoading}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-50 flex items-center gap-1.5 transition cursor-pointer"
                    title="Export Gradebook as CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintGradebook}
                    disabled={!gradebookClassId || gradebookLoading}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Print Official Gradebook / PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Gradebook</span>
                  </button>
                </div>
              </div>

              {/* Gradebook Content Table */}
              <div className="pt-4">
                {gradebookLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                    <p className="text-xs font-medium">Loading authoritative class gradebook...</p>
                  </div>
                ) : gradebookError ? (
                  <div className="py-8 text-center bg-rose-50 border border-rose-100 rounded-2xl p-4">
                    <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                    <p className="text-xs text-rose-700 font-medium">{gradebookError}</p>
                  </div>
                ) : !gradebookData || gradebookData.students.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No student grades recorded for the selected class and semester.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3 text-center">Sec</th>
                          <th className="py-2.5 px-3 text-center">Average %</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-center">Sec Rank</th>
                          <th className="py-2.5 px-3 text-center">Class Rank</th>
                          <th className="py-2.5 px-3 text-center">Failed Subj</th>
                          <th className="py-2.5 px-3 text-center">Attendance %</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {gradebookData.students.map((st) => (
                          <tr key={st.student.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-2.5 px-3">
                              <p className="font-semibold text-slate-900">{formatText(st.student.full_name)}</p>
                              {st.student.christian_name && (
                                <p className="text-[10px] text-slate-400">
                                  {formatText(st.student.christian_name)}
                                </p>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium">{st.section}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                              {st.summary.overall_average}%
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {st.summary.status === "PASS" && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> PASS
                                </span>
                              )}
                              {st.summary.status === "FAIL" && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-2.5 h-2.5" /> FAIL
                                </span>
                              )}
                              {st.summary.status === "INCOMPLETE" && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
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
                              <span className={st.summary.failed_courses_count > 0 ? "font-bold text-rose-600" : "text-slate-500"}>
                                {st.summary.failed_courses_count}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium">
                              {st.attendance.attendance_rate}%
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Link
                                href={`/report-cards/${st.student.id}`}
                                className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold text-xs hover:underline"
                              >
                                <span>Report Card</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* NON-TEACHER / NON-ADMIN VIEW */}
        {!isTeacher && !isAdmin && (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center">
            <h2 className="text-base font-bold text-slate-900">Role View Restricted</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your account currently has the role <span className="font-semibold text-indigo-600">{user.role}</span>. Student attendance tracking and roll-call operations are restricted to teachers and administrators.
            </p>
          </div>
        )}
      </main>

      {/* New Session Creation Modal */}
      {showCreateModal && primaryAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                <span>Start Roll Call Session</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {createError}
              </div>
            )}

            <div className="my-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Class & Section</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                  {primaryAssignment.class_name || "Grade 9"} — Section {primaryAssignment.section}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Course</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                  {primaryAssignment.course_name || "Homeroom"}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Session Date</label>
                <input
                  type="date"
                  value={newSessionDate}
                  onChange={(e) => setNewSessionDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Time Slot / Period</label>
                <select
                  value={newSessionSlot}
                  onChange={(e) => setNewSessionSlot(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Period 1 (08:30-09:15)">Period 1 (08:30-09:15)</option>
                  <option value="Period 2 (09:20-10:05)">Period 2 (09:20-10:05)</option>
                  <option value="Period 3 (10:10-10:55)">Period 3 (10:10-10:55)</option>
                  <option value="Period 4 (11:00-11:45)">Period 4 (11:00-11:45)</option>
                  <option value="Homeroom Sunday (08:00-09:00)">Homeroom Sunday (08:00-09:00)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createSubmitting}
                onClick={() => handleCreateSession(primaryAssignment)}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-xs transition"
              >
                {createSubmitting ? "Creating..." : "Create & Start Roll Call"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Administrative Session Closure Confirmation Modal */}
      {sessionToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Close Attendance Session</h3>
            <p className="text-xs text-slate-600 mt-2">
              You are about to close and archive Session <strong>#{sessionToClose.id}</strong> for{" "}
              <strong>{sessionToClose.school_class?.name || `Class #${sessionToClose.class_id}`}</strong> (
              {sessionToClose.date}, {sessionToClose.time_slot}).
            </p>

            <div className="my-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Permanent Archival Notice</span>
              </p>
              <p className="text-[11px] text-amber-800">
                Closing permanently finalizes this session. Teachers will no longer be able to make corrections. All student attendance marks become final.
              </p>
            </div>

            {closeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-left">
                {closeError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={closeSubmitting}
                onClick={() => {
                  setSessionToClose(null);
                  setCloseError(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={closeSubmitting}
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                {closeSubmitting ? "Closing..." : "Confirm & Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
