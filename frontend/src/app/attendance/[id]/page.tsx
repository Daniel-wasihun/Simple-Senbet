"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AdminModal } from "@/components/admin/AdminModal";
import { attendanceService } from "@/services/attendance.service";
import { formatText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TableShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";
import {
  AttendanceMark,
  AttendanceDetailSession,
  SessionRosterResponse,
  RosterStudent,
} from "@/types/auth";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  AlertTriangle,
  Users,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Save,
  Send,
  MessageSquare,
  GraduationCap,
  Calendar,
} from "lucide-react";

interface StudentMarkState {
  mark: AttendanceMark | null;
  remarks: string;
  originalMark?: AttendanceMark | null;
  originalRemarks?: string;
}

function AttendanceTakingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const sessionId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const urlSection = searchParams.get("section");
  const urlSemester = searchParams.get("semester");

  const [session, setSession] = useState<AttendanceDetailSession | null>(null);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [marksState, setMarksState] = useState<Record<number, StudentMarkState>>({});
  
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [closing, setClosing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [activeRemarksId, setActiveRemarksId] = useState<number | null>(null);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Find all teaching assignments matching this session's class and course
  const matchingAssignments = useMemo(() => {
    if (!session || !user?.teaching_assignments) return [];
    return user.teaching_assignments.filter(
      (a) => a.class_id === session.class_id && (!session.course_id || a.course_id === session.course_id)
    );
  }, [session, user]);

  // Load session details and roster
  const loadSessionAndRoster = useCallback(async (targetSection?: string | null) => {
    if (!sessionId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch Session Details
      const sessionRes = await attendanceService.request(`/api/backend/attendance/sessions/${sessionId}`, {
        headers: { Accept: "application/json" },
      });

      if (!sessionRes.ok) {
        if (sessionRes.status === 403) {
          setErrorMsg("You are not authorized to access this attendance session.");
        } else if (sessionRes.status === 404) {
          setErrorMsg("Attendance session not found.");
        } else {
          setErrorMsg(`Failed to load session details (HTTP ${sessionRes.status}).`);
        }
        setLoading(false);
        return;
      }

      const sessionJson = await sessionRes.json();
      const sessionData: AttendanceDetailSession = sessionJson.data || sessionJson;
      setSession(sessionData);

      // Determine authoritative section and semester context
      const assignments = (user?.teaching_assignments || []).filter(
        (a) => a.class_id === sessionData.class_id && (!sessionData.course_id || a.course_id === sessionData.course_id)
      );

      const userIsAdmin = user?.role === "superadmin" || user?.role === "academic_director";
      const defaultSec = assignments[0]?.section ?? (userIsAdmin ? "A" : null);
      const resolvedSec = targetSection ?? urlSection ?? defaultSec;
      const matchedAssignment = assignments.find((a) => !resolvedSec || a.section === resolvedSec) || assignments[0];
      const resolvedSem = urlSemester ?? matchedAssignment?.semester ?? (userIsAdmin ? "first_semester" : null);

      setSelectedSection(resolvedSec);
      setSelectedSemester(resolvedSem);

      // Validate required context for draft sessions
      if (sessionData.status === "draft" && !resolvedSec && !userIsAdmin) {
        setErrorMsg("Cannot resolve section context for attendance taking. A valid section must be assigned to your profile or provided in the request parameters.");
        setLoading(false);
        return;
      }

      // 2. Fetch Roster with determined section
      const rosterUrl = resolvedSec
        ? `/api/backend/attendance/sessions/${sessionId}/roster?section=${encodeURIComponent(resolvedSec)}`
        : `/api/backend/attendance/sessions/${sessionId}/roster`;

      const rosterRes = await attendanceService.request(rosterUrl, {
        headers: { Accept: "application/json" },
      });

      let rosterStudents: RosterStudent[] = [];
      if (rosterRes.ok) {
        const rosterJson: { data: SessionRosterResponse } = await rosterRes.json();
        rosterStudents = rosterJson?.data?.students || [];
      } else {
        // Fallback: if roster endpoint fails or session is already submitted, construct roster from records
        if (sessionData.student_records && sessionData.student_records.length > 0) {
          rosterStudents = sessionData.student_records.map((rec) => ({
            id: rec.student_id,
            name: rec.student?.name || `Student #${rec.student_id}`,
            first_name: rec.student?.first_name,
            last_name: rec.student?.last_name,
            gender: rec.student?.gender,
          }));
        }
      }

      setRoster(rosterStudents);

      // 3. Initialize Mark States
      const initialMarks: Record<number, StudentMarkState> = {};
      const existingRecords = sessionData.student_records || [];

      // Map existing records if session is submitted
      existingRecords.forEach((rec) => {
        initialMarks[rec.student_id] = {
          mark: rec.mark,
          remarks: rec.remarks || "",
          originalMark: rec.mark,
          originalRemarks: rec.remarks || "",
        };
      });

      // Ensure every roster student has an entry
      rosterStudents.forEach((student) => {
        if (!initialMarks[student.id]) {
          initialMarks[student.id] = {
            mark: null,
            remarks: "",
            originalMark: null,
            originalRemarks: "",
          };
        }
      });

      setMarksState(initialMarks);
    } catch {
      setErrorMsg("Network error connecting to the Simple Senbet backend.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, urlSection, urlSemester, user]);

  useEffect(() => {
    if (user && sessionId) {
      loadSessionAndRoster();
    }
  }, [user, sessionId, loadSessionAndRoster]);

  // Check session status and roles
  const isAdmin = user?.role === "superadmin" || user?.role === "academic_director";
  const isTeacher = user?.role === "teacher";
  const isDraft = session?.status === "draft";
  const isSubmitted = session?.status === "submitted";
  const isClosed = session?.status === "closed";
  const isTeacherEditable = (isTeacher && session?.is_teacher_editable) ?? false;
  const isEditable = (isTeacher && isDraft) || (isTeacher && isSubmitted && isTeacherEditable);

  // Set single student mark
  const handleMarkChange = (studentId: number, mark: AttendanceMark) => {
    if (!isEditable) return;
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        mark,
      },
    }));
  };

  // Set remarks
  const handleRemarksChange = (studentId: number, remarks: string) => {
    if (!isEditable) return;
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  // "All Present" convenience action
  const handleMarkAllPresent = () => {
    if (!isEditable) return;
    setMarksState((prev) => {
      const next: Record<number, StudentMarkState> = {};
      roster.forEach((student) => {
        next[student.id] = {
          ...prev[student.id],
          mark: "present",
        };
      });
      return next;
    });
  };

  // Summary counts
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let unmarked = 0;

    roster.forEach((student) => {
      const mark = marksState[student.id]?.mark;
      if (mark === "present") present++;
      else if (mark === "absent") absent++;
      else if (mark === "late") late++;
      else if (mark === "excused") excused++;
      else unmarked++;
    });

    return { present, absent, late, excused, unmarked, total: roster.length };
  }, [roster, marksState]);

  // Check if any mark has changed from saved state (for corrections)
  const changedMarksCount = useMemo(() => {
    if (!isSubmitted) return 0;
    let count = 0;
    roster.forEach((student) => {
      const state = marksState[student.id];
      if (state && (state.mark !== state.originalMark || state.remarks !== state.originalRemarks)) {
        count++;
      }
    });
    return count;
  }, [roster, marksState, isSubmitted]);

  // Submit Draft Session
  const handleSubmitSession = async () => {
    if (!session || submitting) return;
    setShowConfirmModal(false);
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate required section and semester context
    if (!selectedSection) {
      setErrorMsg("Cannot submit attendance: section context could not be determined.");
      setSubmitting(false);
      return;
    }

    if (!selectedSemester) {
      setErrorMsg("Cannot submit attendance: semester context could not be determined.");
      setSubmitting(false);
      return;
    }

    // Verify all marked
    if (counts.unmarked > 0) {
      setErrorMsg(`All students must be marked before submission (${counts.unmarked} unmarked remaining).`);
      setSubmitting(false);
      return;
    }

    try {
      const studentMarksPayload = roster.map((s) => ({
        student_id: s.id,
        mark: marksState[s.id]?.mark || "present",
        remarks: marksState[s.id]?.remarks || null,
      }));

      const teacherMarksPayload = user?.id
        ? [{ teacher_id: user.id, mark: "present", remarks: "Attendance recorded by teacher" }]
        : [];

      const res = await attendanceService.request(`/api/backend/attendance/sessions/${session.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          section: selectedSection,
          semester: selectedSemester,
          student_marks: studentMarksPayload,
          teacher_marks: teacherMarksPayload,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setSuccessMsg("Attendance session submitted successfully!");
        await loadSessionAndRoster(selectedSection);
      } else {
        const errorText = json.errors
          ? Object.values(json.errors).flat().join(" ")
          : json.message || "Failed to submit attendance roster.";
        setErrorMsg(errorText);
      }
    } catch {
      setErrorMsg("Network error occurred while submitting attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Corrections (24-Hour Window)
  const handleSaveCorrections = async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Filter only changed marks
    const corrections = roster
      .filter((s) => {
        const state = marksState[s.id];
        return state && (state.mark !== state.originalMark || state.remarks !== state.originalRemarks);
      })
      .map((s) => ({
        student_id: s.id,
        mark: marksState[s.id]?.mark,
        remarks: marksState[s.id]?.remarks || null,
      }));

    if (corrections.length === 0) {
      setErrorMsg("No marks or remarks were changed.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await attendanceService.request(`/api/backend/attendance/sessions/${session.id}/marks`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          corrected_marks: corrections,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setSuccessMsg(`Successfully saved corrections for ${corrections.length} student(s)!`);
        await loadSessionAndRoster(selectedSection);
      } else {
        const errorText = json.errors
          ? Object.values(json.errors).flat().join(" ")
          : json.message || "Failed to save mark corrections.";
        setErrorMsg(errorText);
      }
    } catch {
      setErrorMsg("Network error while saving corrections.");
    } finally {
      setSubmitting(false);
    }
  };

  // Administrative Session Closure
  const handleCloseSession = async () => {
    if (!session || closing) return;
    setClosing(true);
    setCloseError(null);

    try {
      const res = await attendanceService.request(`/api/backend/attendance/sessions/${session.id}/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const json = await res.json();

      if (res.ok) {
        setShowCloseModal(false);
        setSuccessMsg("Attendance session closed and permanently archived.");
        await loadSessionAndRoster(selectedSection);
      } else {
        const errorText = json.errors
          ? Object.values(json.errors).flat().join(" ")
          : json.message || "Failed to close attendance session.";
        setCloseError(errorText);
      }
    } catch {
      setCloseError("Network error while closing attendance session.");
    } finally {
      setClosing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e1a] p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111624] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111624] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>
            <TableShimmerSkeleton rows={8} columns={5} />
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg && !session) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-md text-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-600 mt-2 mb-6">{errorMsg}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-3">
              {isDraft && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  Draft Session
                </span>
              )}
              {isSubmitted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Submitted
                </span>
              )}
              {isClosed && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <Lock className="w-3.5 h-3.5" />
                  Closed
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {/* Session Info Card */}
        {session && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center flex-wrap gap-2 text-xs font-semibold text-indigo-600 mb-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>{formatText(session.school_class?.name) || `Class #${session.class_id}`}</span>
                  <span>•</span>
                  {matchingAssignments.length > 1 && isDraft ? (
                    <div className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-0.5">
                      <span className="text-[11px] font-medium text-indigo-700">Section:</span>
                      <select
                        aria-label="Select section for attendance"
                        value={selectedSection || ""}
                        onChange={(e) => {
                          const newSec = e.target.value;
                          loadSessionAndRoster(newSec);
                        }}
                        className="bg-transparent font-bold text-indigo-900 focus:outline-none text-[11px]"
                      >
                        {matchingAssignments.map((a) => (
                          <option key={a.id} value={a.section}>
                            Section {a.section}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span>Section {selectedSection || "Unassigned"}</span>
                  )}
                  <span>•</span>
                  <span>{session.course?.name ? formatText(session.course.name) : "Homeroom Roll Call"}</span>
                  {selectedSemester && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{selectedSemester.replace("_", " ")}</span>
                    </>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  የሰንበት ትምህርት ቤት ክትትል (Attendance Roll Call)
                </h1>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1 font-mono font-medium text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {session.date}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{session.time_slot}</span>
                </div>
              </div>

              {/* Status & Review Banner */}
              <div className="flex flex-col sm:items-end gap-1.5">
                {isDraft && (
                  <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Complete roll-call for all enrolled students</span>
                  </div>
                )}
                {isSubmitted && isTeacherEditable && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>24-Hour Correction Window Active</span>
                  </div>
                )}
                {isSubmitted && !isTeacherEditable && (
                  <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-medium flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>Correction window expired (Read-Only)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Global Feedback Banners */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Attendance Error</p>
              <p className="text-rose-700 mt-0.5">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Success</p>
              <p className="text-emerald-700 mt-0.5">{successMsg}</p>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Actions & Live Count Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Live Metrics Chips */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Roster ({counts.total}):</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {counts.present} Present
            </span>
            <span className="px-2.5 py-1 rounded-lg font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              {counts.absent} Absent
            </span>
            <span className="px-2.5 py-1 rounded-lg font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {counts.late} Late
            </span>
            <span className="px-2.5 py-1 rounded-lg font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              {counts.excused} Excused
            </span>
            {counts.unmarked > 0 && isDraft && (
              <span className="px-2.5 py-1 rounded-lg font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                {counts.unmarked} Unmarked
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {isDraft && (
              <button
                onClick={handleMarkAllPresent}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Present</span>
              </button>
            )}

            {isDraft && (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={counts.unmarked > 0 || submitting || !selectedSection || !selectedSemester}
                type="button"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Submitting..." : "Submit Roster"}</span>
              </button>
            )}

            {isSubmitted && isTeacherEditable && (
              <button
                onClick={handleSaveCorrections}
                disabled={changedMarksCount === 0 || submitting}
                type="button"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {submitting ? "Saving..." : `Save Corrections (${changedMarksCount})`}
                </span>
              </button>
            )}

            {isAdmin && isSubmitted && (
              <button
                onClick={() => setShowCloseModal(true)}
                type="button"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Close Session</span>
              </button>
            )}
          </div>
        </div>

        {/* Closed Session Warning Banner */}
        {isClosed && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 text-xs flex items-center gap-3">
            <Lock className="w-5 h-5 text-slate-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">Session Closed & Permanently Archived</p>
              <p className="text-slate-600 mt-0.5">
                This attendance session has been finalized and closed by administration{session?.closed_at ? ` (${new Date(session.closed_at).toLocaleString()})` : ""}. All student marks and teacher records are permanently locked and cannot be edited.
              </p>
            </div>
          </div>
        )}

        {/* Conducting Teacher Audit Records */}
        {session?.teacher_records && session.teacher_records.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Conducting Teacher Audit Records</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {session.teacher_records.map((tr) => (
                <div
                  key={tr.id || tr.teacher_id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {formatText(tr.teacher?.name) || `Teacher #${tr.teacher_id}`}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {tr.remarks || "Attendance session conducted"}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                    {tr.mark}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Roster List */}
        <div className="space-y-3">
          {roster.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center text-slate-500 text-xs">
              {errorMsg ? "Cannot display roster due to error." : "No students enrolled in this roster."}
            </div>
          ) : (
            roster.map((student, idx) => {
              const currentMark = marksState[student.id]?.mark;
              const currentRemarks = marksState[student.id]?.remarks || "";
              const hasChanged = isSubmitted && (currentMark !== marksState[student.id]?.originalMark || currentRemarks !== marksState[student.id]?.originalRemarks);

              return (
                <div
                  key={student.id}
                  className={`p-4 rounded-2xl bg-white border transition ${
                    hasChanged ? "border-blue-300 bg-blue-50/20 shadow-xs" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {formatText(student.name) || `${student.first_name || ""} ${student.last_name || ""}`.trim() || `Student #${student.id}`}
                          </h3>
                          {hasChanged && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                              Modified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>ID: {student.id}</span>
                          {student.gender && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{student.gender}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mark Buttons (Touch Targets) */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Present Button */}
                      <button
                        type="button"
                        disabled={!isEditable}
                        onClick={() => handleMarkChange(student.id, "present")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition ${
                          currentMark === "present"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-transparent hover:border-emerald-200"
                        } disabled:opacity-75 disabled:pointer-events-none`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </button>

                      {/* Absent Button */}
                      <button
                        type="button"
                        disabled={!isEditable}
                        onClick={() => handleMarkChange(student.id, "absent")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition ${
                          currentMark === "absent"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-transparent hover:border-rose-200"
                        } disabled:opacity-75 disabled:pointer-events-none`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>

                      {/* Late Button */}
                      <button
                        type="button"
                        disabled={!isEditable}
                        onClick={() => handleMarkChange(student.id, "late")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition ${
                          currentMark === "late"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-transparent hover:border-amber-200"
                        } disabled:opacity-75 disabled:pointer-events-none`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Late</span>
                      </button>

                      {/* Excused Button */}
                      <button
                        type="button"
                        disabled={!isEditable}
                        onClick={() => handleMarkChange(student.id, "excused")}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition ${
                          currentMark === "excused"
                            ? "bg-purple-600 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-transparent hover:border-purple-200"
                        } disabled:opacity-75 disabled:pointer-events-none`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Excused</span>
                      </button>

                      {/* Remarks Toggle */}
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => setActiveRemarksId(activeRemarksId === student.id ? null : student.id)}
                          title="Add Remarks"
                          className={`p-2 rounded-xl border text-xs transition ${
                            currentRemarks
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                              : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Remarks Input Drawer */}
                  {(activeRemarksId === student.id || (!isEditable && currentRemarks)) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {isEditable ? (
                        <input
                          type="text"
                          placeholder="Optional reason or note (e.g., Sick, Traffic, Family permission)..."
                          value={currentRemarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <span className="text-xs text-slate-600 italic">Note: {currentRemarks}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Confirmation Modal for Full Submission */}
      {showConfirmModal && (
        <AdminModal open={showConfirmModal} onOpenChange={(open) => { if (!open && !submitting) setShowConfirmModal(false); }} title="Confirm Attendance Submission" description={`Review attendance for ${counts.total} students before submitting.`} size="md" showHeader={false}>
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Attendance Submission</h3>
            <p className="text-xs text-slate-600 mt-2">
              You are about to record attendance for <strong>{counts.total} students</strong> in{" "}
              <strong>{formatText(session?.school_class?.name) || `Class #${session?.class_id}`}</strong> (Section{" "}
              <strong>{selectedSection}</strong>,{" "}
              <span className="capitalize">{selectedSemester?.replace("_", " ")}</span>):
            </p>

            <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-slate-400 text-[10px]">Present</p>
                <p className="font-bold text-emerald-600 text-sm mt-0.5">{counts.present}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Absent</p>
                <p className="font-bold text-rose-600 text-sm mt-0.5">{counts.absent}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Late</p>
                <p className="font-bold text-amber-600 text-sm mt-0.5">{counts.late}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Excused</p>
                <p className="font-bold text-purple-600 text-sm mt-0.5">{counts.excused}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-6">
              Once submitted, marks can be corrected by the teacher within the 24-hour window.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitSession}
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Confirmation Modal for Administrative Session Closure */}
      {showCloseModal && (
        <AdminModal open={showCloseModal} onOpenChange={(open) => { if (!open && !closing) { setShowCloseModal(false); setCloseError(null); } }} title="Close Attendance Session" description="Review the permanent closure details before confirming." size="md" showHeader={false}>
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Close Attendance Session</h3>
            <p className="text-xs text-slate-600 mt-2">
              You are about to close and archive the session for <strong>{formatText(session?.school_class?.name) || `Class #${session?.class_id}`}</strong> ({session?.date}, {session?.time_slot}).
            </p>

            <div className="my-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Permanent Administrative Closure</span>
              </p>
              <p className="text-[11px] text-amber-800">
                Closing permanently archives this session. Teachers will no longer be able to submit corrections. All roster marks become final for school reporting.
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
                disabled={closing}
                onClick={() => {
                  setShowCloseModal(false);
                  setCloseError(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={closing}
                onClick={handleCloseSession}
                className="flex-1 px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition disabled:opacity-50"
              >
                {closing ? "Closing..." : "Confirm & Close"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

export default function AttendanceTakingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Loading Attendance Portal...</p>
          </div>
        </div>
      }
    >
      <AttendanceTakingContent />
    </Suspense>
  );
}
