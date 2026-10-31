"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { schoolManagementService } from "@/services/schoolManagement.service";
import { AdminModal } from "@/components/admin/AdminModal";
import { LocalizedFieldInput, SupportedLocale } from "@/components/admin/LocalizedFieldInput";
import { AppSelect } from "@/components/ui/AppSelect";
import { SchoolManagementWorkspaceShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";
import { toast } from "sonner";
import {
  btnBase,
  btnPrimary,
  btnSecondary,
  btnSuccess,
  inputCls,
  labelCls,
  modalStickyFooter,
  nestedLocalizedText,
  tableHeaderCellCls,
  tableHeaderRowCls,
} from "@/components/admin/adminUiTokens";
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Users,
  AlertTriangle,
  ArrowLeft,
  Sliders,
} from "lucide-react";

interface TeachingAssignmentItem {
  id: number;
  teacher_id: number;
  teacher?: { id: number; name: string; email: string };
  class_id: number;
  class?: { id: number; name: unknown; code: string; passing_score?: number };
  course_id: number;
  course?: { id: number; name: unknown; code: string; credit_hour?: number; class_id?: number };
  academic_year_id: number;
  academic_year?: { id: number; name: unknown };
  section?: string;
  semester?: string;
  is_primary?: boolean;
  assessments?: AssessmentItem[];
}

interface AssessmentItem {
  id: number;
  teaching_assignment_id: number;
  name: unknown;
  total_score: number;
  weight_percentage: number;
}

interface StudentItem {
  id: number;
  full_name: unknown;
  christian_name?: unknown;
  gender?: string;
  class_id?: number;
  section?: string;
}

interface ResultRecord {
  id?: number;
  assessment_id: number;
  member_id: number;
  score: number;
  remarks?: string;
}

export function CourseAssessmentGradebookWorkspace() {
  const { user } = useAuth();
  const { language: globalLocale } = useLanguage();
  const { t } = useTranslation();
  const locale = (globalLocale as SupportedLocale) || "en";

  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);
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
    ];
    return adminRoles.includes(r) || roles.some((x) => adminRoles.includes(x)) || Boolean(user.permissions?.includes("*"));
  }, [user]);

  const can = useCallback(
    (p: string) => isSuperOrAdmin || permissions.has(p) || permissions.has("*"),
    [isSuperOrAdmin, permissions]
  );

  // States
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<TeachingAssignmentItem[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  // School classes for filtering/browsing courses
  const [classes, setClasses] = useState<Array<{ id: number; name: unknown; code: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [coursesForClass, setCoursesForClass] = useState<
    Array<{ id: number; name: unknown; code: string; credit_hour?: number; class_id: number; class?: { id: number; name: unknown } }>
  >([]);

  // Active gradebook states
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({}); // key: `${member_id}_${assessment_id}`
  const [initialScores, setInitialScores] = useState<Record<string, number>>({});
  const [studentSearch, setStudentSearch] = useState("");
  const [savingGrades, setSavingGrades] = useState(false);

  // Define assessment modal state
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [modalLocale, setModalLocale] = useState<SupportedLocale>("en");
  const [creatingAssessment, setCreatingAssessment] = useState(false);
  const [assessmentDraft, setAssessmentDraft] = useState({
    name: { en: "", am: "", om: "" },
    total_score: "100",
    weight_percentage: "25",
  });
  const [assessmentModalError, setAssessmentModalError] = useState("");

  // 1. Fetch available teaching assignments
  const loadAssignments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await schoolManagementService.request(
        "teaching-assignments",
        "GET",
        undefined,
        user.id
      );
      const json = await res.json();
      const list: TeachingAssignmentItem[] = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];
      setAssignments(list);

      // Auto-select first assignment if only one exists
      if (list.length === 1 && !selectedAssignmentId) {
        setSelectedAssignmentId(list[0].id);
      }
    } catch {
      toast.error("Failed to load teaching assignments.");
    } finally {
      setLoading(false);
    }
  }, [user, selectedAssignmentId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Load school classes list
  useEffect(() => {
    if (!user) return;
    const fetchClasses = async () => {
      try {
        const res = await schoolManagementService.request("school-classes?per_page=100", "GET", undefined, user.id);
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setClasses(list);
      } catch {
        // silent
      }
    };
    fetchClasses();
  }, [user]);

  // Load courses when a specific class is selected
  useEffect(() => {
    if (!user || selectedClassId === "all") {
      setCoursesForClass([]);
      return;
    }
    const fetchCourses = async () => {
      try {
        const res = await schoolManagementService.request(
          `courses?class_id=${selectedClassId}&per_page=250`,
          "GET",
          undefined,
          user.id
        );
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setCoursesForClass(list);
      } catch {
        // silent
      }
    };
    fetchCourses();
  }, [user, selectedClassId]);

  const activeAssignment = useMemo(
    () => assignments.find((a) => a.id === selectedAssignmentId) ?? null,
    [assignments, selectedAssignmentId]
  );

  // 2. When an assignment is selected, load its assessments, class students, and existing results
  const loadGradebookData = useCallback(async (assignment: TeachingAssignmentItem) => {
    if (!user) return;
    setLoading(true);
    try {
      const [assessmentsRes, membersRes, resultsRes] = await Promise.all([
        schoolManagementService.request(
          `assessments?teaching_assignment_id=${assignment.id}`,
          "GET",
          undefined,
          user.id
        ),
        schoolManagementService.request(
          `members?class_id=${assignment.class_id}&per_page=250${
            assignment.section ? `&section=${encodeURIComponent(assignment.section)}` : ""
          }`,
          "GET",
          undefined,
          user.id
        ),
        schoolManagementService.request(
          `assessment-results?teaching_assignment_id=${assignment.id}`,
          "GET",
          undefined,
          user.id
        ),
      ]);

      const [assessmentsJson, membersJson, resultsJson] = await Promise.all([
        assessmentsRes.json(),
        membersRes.json(),
        resultsRes.json(),
      ]);

      const loadedAssessments: AssessmentItem[] = Array.isArray(assessmentsJson?.data)
        ? assessmentsJson.data
        : Array.isArray(assessmentsJson)
        ? assessmentsJson
        : [];
      const loadedStudents: StudentItem[] = Array.isArray(membersJson?.data)
        ? membersJson.data
        : Array.isArray(membersJson)
        ? membersJson
        : [];
      const loadedResults: ResultRecord[] = Array.isArray(resultsJson?.data)
        ? resultsJson.data
        : Array.isArray(resultsJson)
        ? resultsJson
        : [];

      setAssessments(loadedAssessments);
      setStudents(loadedStudents);

      // Map loaded results into lookup dictionary
      const scoreMap: Record<string, number> = {};
      loadedResults.forEach((r: ResultRecord) => {
        scoreMap[`${r.member_id}_${r.assessment_id}`] = Number(r.score);
      });
      setScores(scoreMap);
      setInitialScores(scoreMap);
    } catch {
      toast.error("Failed to load gradebook roster and marks.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeAssignment) {
      loadGradebookData(activeAssignment);
    } else {
      setAssessments([]);
      setStudents([]);
      setScores({});
      setInitialScores({});
    }
  }, [activeAssignment, loadGradebookData]);

  // Total weight percentage of all defined assessments
  const totalWeight = useMemo(() => {
    return assessments.reduce((sum, a) => sum + Number(a.weight_percentage || 0), 0);
  }, [assessments]);

  // Check if there are unsaved score changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(scores) !== JSON.stringify(initialScores);
  }, [scores, initialScores]);

  // Handle cell score modification
  const handleScoreChange = (memberId: number, assessmentId: number, valueStr: string, maxScore: number) => {
    if (!can("assessment-results.create") && !can("assessment-results.update")) return;
    const key = `${memberId}_${assessmentId}`;
    if (valueStr === "") {
      setScores((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    const num = Math.max(0, Math.min(Number(valueStr), maxScore));
    setScores((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  // Calculate a student's total score out of 100
  const computeStudentTotal = (memberId: number) => {
    if (assessments.length === 0) return { total: 0, hasMissing: true };
    let earned = 0;
    let missingCount = 0;

    assessments.forEach((a) => {
      const key = `${memberId}_${a.id}`;
      const score = scores[key];
      if (score !== undefined) {
        const total = Number(a.total_score) || 100;
        const weight = Number(a.weight_percentage) || 0;
        earned += (score / total) * weight;
      } else {
        missingCount++;
      }
    });

    return {
      total: Math.round(earned * 10) / 10,
      hasMissing: missingCount > 0,
      missingCount,
    };
  };

  // Save all changed scores
  const handleSaveGrades = async () => {
    if (!activeAssignment || !can("assessment-results.create")) return;
    setSavingGrades(true);
    try {
      const batchPayload: Array<{
        assessment_id: number;
        member_id: number;
        score: number;
      }> = [];

      Object.entries(scores).forEach(([key, score]) => {
        const [mId, aId] = key.split("_");
        batchPayload.push({
          member_id: Number(mId),
          assessment_id: Number(aId),
          score,
        });
      });

      const res = await schoolManagementService.request(
        "assessment-results/batch",
        "POST",
        { results: batchPayload },
        user?.id
      );

      if (res.ok) {
        toast.success(t("management.resultsSaved", { defaultValue: "Assessment scores saved successfully." }));
        setInitialScores({ ...scores });
      } else {
        const errJson = (await res.json().catch(() => ({}))) as any;
        toast.error(errJson?.message || "Failed to save assessment scores.");
      }
    } catch {
      toast.error("Network error while saving assessment scores.");
    } finally {
      setSavingGrades(false);
    }
  };

  // Submit new assessment definition
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !can("assessments.create")) return;

    const enName =
      assessmentDraft.name.en.trim() ||
      assessmentDraft.name.am.trim() ||
      assessmentDraft.name.om.trim();

    if (!enName) {
      setAssessmentModalError("Please provide an assessment title.");
      return;
    }

    setCreatingAssessment(true);
    setAssessmentModalError("");

    try {
      const payload = {
        teaching_assignment_id: activeAssignment.id,
        name: {
          en: enName,
          ...(assessmentDraft.name.am.trim() ? { am: assessmentDraft.name.am.trim() } : {}),
          ...(assessmentDraft.name.om.trim() ? { om: assessmentDraft.name.om.trim() } : {}),
        },
        total_score: Number(assessmentDraft.total_score) || 100,
        weight_percentage: Number(assessmentDraft.weight_percentage) || 20,
      };

      const res = await schoolManagementService.request(
        "assessments",
        "POST",
        payload,
        user?.id
      );

      if (res.ok) {
        toast.success("Assessment defined successfully.");
        setAssessmentModalOpen(false);
        setAssessmentDraft({
          name: { en: "", am: "", om: "" },
          total_score: "100",
          weight_percentage: "25",
        });
        await loadGradebookData(activeAssignment);
      } else {
        const errJson = (await res.json().catch(() => ({}))) as any;
        setAssessmentModalError(errJson?.message || "Failed to create assessment.");
      }
    } catch {
      setAssessmentModalError("Network error while creating assessment.");
    } finally {
      setCreatingAssessment(false);
    }
  };

  // Filtered students list
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const term = studentSearch.toLowerCase();
    return students.filter((s) => {
      const fullName = nestedLocalizedText(s.full_name, locale).toLowerCase();
      const chrisName = nestedLocalizedText(s.christian_name, locale).toLowerCase();
      return fullName.includes(term) || chrisName.includes(term) || String(s.id).includes(term);
    });
  }, [students, studentSearch, locale]);

  // Overall class passing score
  const passingScore = activeAssignment?.class?.passing_score ?? 50;

  // Computed items for View 1 (Assigned courses or All courses for selected class)
  const displayItems = useMemo(() => {
    if (selectedClassId === "all") {
      return assignments.map((a) => ({
        type: "assignment" as const,
        id: a.id,
        assignment: a,
        course: a.course,
        class: a.class,
        teacher: a.teacher,
        assessmentCount: a.assessments?.length ?? 0,
      }));
    }

    // When a specific class is selected, show every course that belongs to this class!
    const selectedClass = classes.find((c) => String(c.id) === selectedClassId);
    return coursesForClass.map((course) => {
      const matchingAssignment = assignments.find(
        (a) => a.course_id === course.id && String(a.class_id) === selectedClassId
      );
      return {
        type: matchingAssignment ? ("assignment" as const) : ("course" as const),
        id: matchingAssignment ? matchingAssignment.id : course.id,
        assignment: matchingAssignment ?? null,
        course: course,
        class: selectedClass ?? (course.class || null),
        teacher: matchingAssignment?.teacher ?? null,
        assessmentCount: matchingAssignment?.assessments?.length ?? 0,
      };
    });
  }, [selectedClassId, assignments, classes, coursesForClass]);

  // Open or initialize gradebook for a course/assignment
  const handleSelectGradebookItem = async (item: {
    type: "assignment" | "course";
    assignment: TeachingAssignmentItem | null;
    course: { id: number; name: unknown; code: string; credit_hour?: number; class_id?: number } | null | undefined;
    class: { id: number; name: unknown; code?: string } | null | undefined;
  }) => {
    if (item.assignment) {
      setSelectedAssignmentId(item.assignment.id);
      return;
    }

    if (!item.course) return;

    if (!isSuperOrAdmin) {
      toast.error("You do not have permission to manage this course.");
      return;
    }

    try {
      setLoading(true);
      const res = await schoolManagementService.request(
        "teaching-assignments",
        "POST",
        {
          teacher_id: user?.id,
          course_id: item.course.id,
          class_id: item.class?.id || item.course.class_id,
          section: "A",
          semester: "semester_1",
        },
        user?.id
      );

      const json = await res.json();
      if (res.ok) {
        toast.success("Gradebook initialized for course.");
        await loadAssignments();
        const createdId = json?.data?.id ?? json?.id;
        if (createdId) {
          setSelectedAssignmentId(createdId);
        }
      } else {
        toast.error(json?.message || "Failed to initialize gradebook.");
      }
    } catch {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  // Render Access Guard
  if (!can("assessment-results.view")) {
    return (
      <section className="m-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111624] p-8 text-center text-sm text-slate-500">
        You do not have permission to view or manage student assessment results.
      </section>
    );
  }

  if (loading && assignments.length === 0) {
    return <SchoolManagementWorkspaceShimmerSkeleton moduleName="assessment-results" />;
  }

  return (
    <main className="w-full space-y-5 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-7">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            Academic Performance & Grading
          </p>
          <h1 className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0858a8]" />
            Course Gradebook & Assessment Results
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Manage continuous assessment scores, tests, and total grades out of 100 for assigned courses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeAssignment) loadGradebookData(activeAssignment);
              else loadAssignments();
            }}
            disabled={loading}
            className={btnSecondary}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {activeAssignment && (
            <button
              type="button"
              onClick={() => setSelectedAssignmentId(null)}
              className={btnSecondary}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Switch Course
            </button>
          )}

          {activeAssignment && can("assessments.create") && (
            <button
              type="button"
              onClick={() => setAssessmentModalOpen(true)}
              className={btnSecondary}
            >
              <Plus className="h-3.5 w-3.5" />
              Define Assessment
            </button>
          )}

          {activeAssignment && can("assessment-results.create") && (
            <button
              type="button"
              onClick={handleSaveGrades}
              disabled={savingGrades || !hasChanges}
              className={`${btnPrimary} ${hasChanges ? "ring-2 ring-blue-500/30" : ""}`}
            >
              <Save className={`h-3.5 w-3.5 ${savingGrades ? "animate-spin" : ""}`} />
              {savingGrades ? "Saving Scores..." : hasChanges ? "Save All Changes" : "Saved"}
            </button>
          )}
        </div>
      </header>

      {/* ─── View 1: Assigned Courses Selection Cards ──────────────── */}
      {!activeAssignment ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {selectedClassId !== "all"
                  ? `Courses in ${nestedLocalizedText(classes.find((c) => String(c.id) === selectedClassId)?.name, locale)} (${displayItems.length})`
                  : `Assigned Courses (${displayItems.length})`}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isSuperOrAdmin
                  ? "Select any course or filter by class to view full course lists and grade student assessments"
                  : "Select an assigned course to manage student gradebooks and scores"}
              </span>
            </div>

            {isSuperOrAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class Filter:</span>
                <div className="w-56">
                  <AppSelect
                    value={selectedClassId}
                    onChange={(v) => setSelectedClassId(v)}
                    options={[
                      { value: "all", label: "All Classes & Courses" },
                      ...classes.map((c) => ({
                        value: String(c.id),
                        label: `${nestedLocalizedText(c.name, locale)}${c.code ? ` (${c.code})` : ""}`,
                      })),
                    ]}
                    size="sm"
                    ariaLabel="Filter courses by class"
                  />
                </div>
              </div>
            )}
          </div>

          {displayItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111624] p-12 text-center">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No Courses Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedClassId !== "all"
                  ? "There are currently no courses defined for the selected class."
                  : "You do not currently have any active course allocations assigned to your profile."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayItems.map((item) => {
                const courseName = nestedLocalizedText(item.course?.name, locale);
                const className = nestedLocalizedText(item.class?.name, locale);
                const assessmentCount = item.assessmentCount;
                const isAssigned = item.type === "assignment";

                return (
                  <div
                    key={`${item.type}_${item.id}`}
                    onClick={() => handleSelectGradebookItem(item)}
                    className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] hover:border-blue-500 dark:hover:border-sky-500 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-[#0858a8] dark:text-sky-300 border border-blue-200/60 dark:border-blue-800/60">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {className || `Class #${item.course?.class_id || item.assignment?.class_id}`}
                          {item.assignment?.section ? ` · Sec ${item.assignment.section}` : ""}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.assignment?.semester ? item.assignment.semester.replace("_", " ") : "Semester 1"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0858a8] dark:group-hover:text-sky-400 transition">
                          {courseName || `Course #${item.id}`}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Code: {item.course?.code || "—"} · Credits: {item.course?.credit_hour ?? 1}
                        </p>
                      </div>

                      {item.teacher && isSuperOrAdmin ? (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Teacher: {item.teacher.name}</span>
                        </div>
                      ) : !isAssigned && isSuperOrAdmin ? (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Click to initialize course gradebook</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {isAssigned
                          ? `${assessmentCount} ${assessmentCount === 1 ? "Assessment" : "Assessments"}`
                          : "Gradebook Ready"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0858a8] dark:text-sky-400 group-hover:translate-x-1 transition-transform">
                        <span>{isAssigned ? "Open Gradebook" : "Setup & Grade"}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        /* ─── View 2: Horizontal Assessment Gradebook Spreadsheet ────── */
        <section className="space-y-4">
          {/* Active Course Context Banner */}
          <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0858a8] dark:text-sky-300">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {nestedLocalizedText(activeAssignment.course?.name, locale)}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-blue-50 dark:bg-blue-950/50 text-[#0858a8] dark:text-sky-300 border border-blue-200/60 dark:border-blue-800/60">
                    {nestedLocalizedText(activeAssignment.class?.name, locale)}
                    {activeAssignment.section ? ` (Section ${activeAssignment.section})` : ""}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Semester: {activeAssignment.semester ? activeAssignment.semester.replace("_", " ") : "Semester 1"} · Passing Score: {passingScore}%
                </p>
              </div>
            </div>

            {/* Assessment Weights Status Pill */}
            <div className="flex items-center gap-2.5">
              <div
                className={`px-3 py-1.5 rounded-[4px] border text-xs font-semibold flex items-center gap-1.5 ${
                  Math.abs(totalWeight - 100) < 0.01
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                }`}
              >
                {Math.abs(totalWeight - 100) < 0.01 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Weights Total: 100.0% (Valid)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Weights Total: {totalWeight.toFixed(1)}% (Target: 100%)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search registered student..."
                className="h-9 w-full rounded-[4px] border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#141a29] pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0858a8] shadow-2xs"
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
              <span>{filteredStudents.length} Students Registered</span>
              <span>·</span>
              <span>{assessments.length} Columns Configured</span>
            </div>
          </div>

          {/* Spreadsheet Table Container */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111624] shadow-2xs overflow-hidden">
            {assessments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Sliders className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  No Assessments Defined for this Course
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  To record marks and compute totals out of 100, define assessments (e.g. Quizzes, Midterm Exam, Final Exam) with weights summing to 100%.
                </p>
                {can("assessments.create") && (
                  <button
                    type="button"
                    onClick={() => setAssessmentModalOpen(true)}
                    className={btnPrimary}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Define First Assessment
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className={tableHeaderRowCls}>
                    <tr>
                      <th className={`${tableHeaderCellCls} w-10 text-center`}>#</th>
                      <th className={`${tableHeaderCellCls} min-w-[200px]`}>Student Member</th>
                      <th className={`${tableHeaderCellCls} w-16`}>Gender</th>

                      {/* Dynamic Assessment Columns */}
                      {assessments.map((assessment) => (
                        <th
                          key={assessment.id}
                          className={`${tableHeaderCellCls} min-w-[130px] text-center bg-slate-50/50 dark:bg-slate-900/40 border-l border-slate-200/60 dark:border-slate-800`}
                        >
                          <div className="space-y-0.5">
                            <span className="block font-bold text-slate-900 dark:text-slate-100 truncate">
                              {nestedLocalizedText(assessment.name, locale)}
                            </span>
                            <span className="block text-[10px] font-mono text-blue-600 dark:text-sky-400 font-semibold">
                              Max: {assessment.total_score} · {assessment.weight_percentage}%
                            </span>
                          </div>
                        </th>
                      ))}

                      {/* Final Total Column (Out of 100) */}
                      <th className={`${tableHeaderCellCls} min-w-[120px] text-center bg-blue-50/40 dark:bg-blue-950/30 border-l-2 border-blue-200 dark:border-blue-900 font-bold text-[#0858a8] dark:text-sky-300`}>
                        <div className="space-y-0.5">
                          <span className="block uppercase tracking-wider text-[11px]">Total (100%)</span>
                          <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400">
                            Passing: {passingScore}%
                          </span>
                        </div>
                      </th>

                      {/* Status Column */}
                      <th className={`${tableHeaderCellCls} w-24 text-center border-l border-slate-200/60 dark:border-slate-800`}>
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4 + assessments.length}
                          className="py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                          No registered students found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => {
                        const { total, hasMissing } = computeStudentTotal(student.id);
                        const isPass = total >= passingScore;

                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>

                            <td className="py-2.5 px-4">
                              <p className="font-bold text-slate-900 dark:text-slate-100">
                                {nestedLocalizedText(student.full_name, locale)}
                              </p>
                              {Boolean(student.christian_name) && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {nestedLocalizedText(student.christian_name, locale)}
                                </p>
                              )}
                            </td>

                            <td className="py-2.5 px-3 capitalize text-slate-600 dark:text-slate-400">
                              {student.gender || "—"}
                            </td>

                            {/* Assessment Input Cells */}
                            {assessments.map((assessment) => {
                              const key = `${student.id}_${assessment.id}`;
                              const val = scores[key];
                              const maxScore = Number(assessment.total_score) || 100;

                              return (
                                <td
                                  key={assessment.id}
                                  className="py-1.5 px-3 border-l border-slate-100 dark:border-slate-800/60 text-center"
                                >
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxScore}
                                    step="0.5"
                                    value={val !== undefined ? val : ""}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        student.id,
                                        assessment.id,
                                        e.target.value,
                                        maxScore
                                      )
                                    }
                                    placeholder="—"
                                    disabled={!can("assessment-results.create") && !can("assessment-results.update")}
                                    className="h-8 w-20 text-center font-mono font-bold rounded-[4px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#141a29] text-slate-900 dark:text-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0858a8] shadow-2xs mx-auto block"
                                  />
                                </td>
                              );
                            })}

                            {/* Computed Total Score (out of 100) */}
                            <td className="py-2.5 px-3 border-l-2 border-blue-200 dark:border-blue-900 text-center bg-blue-50/20 dark:bg-blue-950/10">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-[4px] font-mono text-xs font-extrabold ${
                                  hasMissing
                                    ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                    : isPass
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                }`}
                              >
                                {total.toFixed(1)} / 100
                              </span>
                            </td>

                            {/* Pass / Fail Status Badge */}
                            <td className="py-2.5 px-3 text-center border-l border-slate-100 dark:border-slate-800/60">
                              {hasMissing ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                  Incomplete
                                </span>
                              ) : isPass ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                  PASS
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                                  FAIL
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Modal: Define Assessment for Course ─────────────────────── */}
      {assessmentModalOpen && activeAssignment && (
        <AdminModal
          open={assessmentModalOpen}
          onOpenChange={(open) => {
            if (!open && !creatingAssessment) setAssessmentModalOpen(false);
          }}
          title="Define Course Assessment"
          description={`Add a test, quiz, or exam column for ${nestedLocalizedText(
            activeAssignment.course?.name,
            locale
          )} (Weights sum to 100%)`}
          size="lg"
          headerAction={
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Language:
              </span>
              <div className="w-40">
                <AppSelect
                  value={modalLocale}
                  onChange={(val) => setModalLocale(val as SupportedLocale)}
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
          }
        >
          <form onSubmit={handleCreateAssessment} className="space-y-4 p-1">
            {assessmentModalError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {assessmentModalError}
              </div>
            )}

            {/* Assessment Title (Localized) */}
            <LocalizedFieldInput
              label="Assessment Title (e.g. Midterm Exam, Quiz 1)"
              value={assessmentDraft.name}
              onChange={(val) =>
                setAssessmentDraft((prev) => ({
                  ...prev,
                  name: {
                    en: val.en ?? "",
                    am: val.am ?? "",
                    om: val.om ?? "",
                  },
                }))
              }
              activeLocale={modalLocale}
              required={true}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Maximum Possible Score <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="0.5"
                  required
                  value={assessmentDraft.total_score}
                  onChange={(e) =>
                    setAssessmentDraft((prev) => ({ ...prev, total_score: e.target.value }))
                  }
                  className={inputCls()}
                  placeholder="e.g. 100, 20, 50"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  The raw ceiling points a student can score.
                </span>
              </div>

              <div>
                <label className={labelCls}>
                  Weight Percentage (% out of 100) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.5"
                  required
                  value={assessmentDraft.weight_percentage}
                  onChange={(e) =>
                    setAssessmentDraft((prev) => ({
                      ...prev,
                      weight_percentage: e.target.value,
                    }))
                  }
                  className={inputCls()}
                  placeholder="e.g. 25, 40"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Current total weight: {totalWeight.toFixed(1)}% · Remaining:{" "}
                  {Math.max(0, 100 - totalWeight).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className={modalStickyFooter}>
              <button
                type="button"
                onClick={() => setAssessmentModalOpen(false)}
                disabled={creatingAssessment}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingAssessment}
                className={btnPrimary}
              >
                <Plus className="h-3.5 w-3.5" />
                {creatingAssessment ? "Creating Assessment..." : "Add Assessment Column"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </main>
  );
}
