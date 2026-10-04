"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Award, Save, GraduationCap, ArrowRight } from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { clampScore } from "@/lib/calculations";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { InlineAlert } from "@/components/common/InlineAlert";
import { EmptyState } from "@/components/common/EmptyState";

export default function ResultsPage() {
  const { classes, courses, assessments, students, enrollments, results, saveAssessmentResults } =
    useSenbet();
  const { t, tClass, tCourse } = useLanguage();

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");

  // Local draft scores map: studentId -> { score: number, remarks: string }
  const [scoresDraft, setScoresDraft] = useState<
    Record<string, { score: number | string; remarks: string }>
  >({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize selected class when classes load
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // When class changes, update course selection
  const classCourses = useMemo(() => {
    return courses.filter((c) => c.class_id === selectedClassId);
  }, [courses, selectedClassId]);

  useEffect(() => {
    if (classCourses.length > 0) {
      if (!selectedCourseId || !classCourses.some((c) => c.id === selectedCourseId)) {
        setSelectedCourseId(classCourses[0].id);
      }
    } else {
      setSelectedCourseId("");
    }
  }, [classCourses, selectedCourseId]);

  // When course changes, update assessment selection
  const courseAssessments = useMemo(() => {
    return assessments.filter((a) => a.course_id === selectedCourseId);
  }, [assessments, selectedCourseId]);

  useEffect(() => {
    if (courseAssessments.length > 0) {
      if (!selectedAssessmentId || !courseAssessments.some((a) => a.id === selectedAssessmentId)) {
        setSelectedAssessmentId(courseAssessments[0].id);
      }
    } else {
      setSelectedAssessmentId("");
    }
  }, [courseAssessments, selectedAssessmentId]);

  // Get enrolled students in selected class
  const classEnrollments = useMemo(() => {
    return enrollments.filter((e) => e.class_id === selectedClassId);
  }, [enrollments, selectedClassId]);

  const enrolledStudents = useMemo(() => {
    const studentIds = new Set(classEnrollments.map((e) => e.student_id));
    return students.filter((s) => studentIds.has(s.id));
  }, [classEnrollments, students]);

  const currentAssessment = useMemo(() => {
    return assessments.find((a) => a.id === selectedAssessmentId) || null;
  }, [assessments, selectedAssessmentId]);

  // Load existing results into draft when assessment changes
  useEffect(() => {
    if (!selectedAssessmentId) return;

    const initialDraft: Record<string, { score: number | string; remarks: string }> = {};
    enrolledStudents.forEach((st) => {
      const existing = results.find(
        (r) => r.assessment_id === selectedAssessmentId && r.student_id === st.id
      );
      initialDraft[st.id] = {
        score: existing !== undefined ? existing.score : "",
        remarks: existing?.remarks || "",
      };
    });

    setScoresDraft(initialDraft);
    setSavedSuccess(false);
  }, [selectedAssessmentId, enrolledStudents, results]);

  const handleScoreChange = (studentId: string, val: string) => {
    setScoresDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: val,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, val: string) => {
    setScoresDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: val,
      },
    }));
  };

  const handleSave = () => {
    if (!selectedAssessmentId || !currentAssessment) return;

    const entriesToSave: Array<{ studentId: string; score: number; remarks?: string }> = [];

    enrolledStudents.forEach((st) => {
      const draft = scoresDraft[st.id];
      if (draft && draft.score !== "" && !isNaN(Number(draft.score))) {
        const rawScore = Number(draft.score);
        // Clamp to 0 and max_score using pure calculation
        const clamped = clampScore(rawScore, currentAssessment.max_score);
        entriesToSave.push({
          studentId: st.id,
          score: clamped,
          remarks: draft.remarks,
        });
      }
    });

    saveAssessmentResults(selectedAssessmentId, entriesToSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t("results.title")}
        subtitle={t("results.subtitle")}
        action={
          currentAssessment ? (
            <Button onClick={handleSave} variant="primary" className="flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              <span>{t("common.save")}</span>
            </Button>
          ) : undefined
        }
      />

      {/* Selectors Bar: Class -> Course -> Assessment */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Class selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              1. {t("classes.className")}
            </label>
            <Select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="py-1.5 text-xs sm:text-sm"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {tClass(c.name)}
                </option>
              ))}
            </Select>
          </div>

          {/* Course selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              2. {t("courses.courseName")}
            </label>
            <Select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={classCourses.length === 0}
              className="py-1.5 text-xs sm:text-sm"
            >
              {classCourses.map((crs) => (
                <option key={crs.id} value={crs.id}>
                  {tCourse(crs.name)}
                </option>
              ))}
              {classCourses.length === 0 && <option>{t("courses.noCourses")}</option>}
            </Select>
          </div>

          {/* Assessment selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              3. {t("assessments.title")}
            </label>
            <Select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              disabled={courseAssessments.length === 0}
              className="py-1.5 text-xs sm:text-sm"
            >
              {courseAssessments.map((asm) => (
                <option key={asm.id} value={asm.id}>
                  {asm.name} (Max: {asm.max_score}, {asm.weight_percentage}%)
                </option>
              ))}
              {courseAssessments.length === 0 && <option>{t("assessments.title")}</option>}
            </Select>
          </div>
        </div>
      </Card>

      {savedSuccess && (
        <InlineAlert
          variant="success"
          title={t("common.success")}
          message={t("results.savedSuccess")}
          onClose={() => setSavedSuccess(false)}
        />
      )}

      {/* Main Results Table */}
      {!currentAssessment ? (
        <EmptyState
          icon={Award}
          title={t("results.subtitle")}
          description={t("courses.subtitle")}
          actionLabel={selectedCourseId ? t("assessments.title") : undefined}
          onAction={() => {}}
        />
      ) : enrolledStudents.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={t("students.noStudents")}
          description={t("students.subtitle")}
          actionLabel={t("students.addStudent")}
          onAction={() => {}}
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{currentAssessment.name}</CardTitle>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  {t("assessments.maxScore")}: {currentAssessment.max_score}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 font-medium">
                  {t("assessments.weight")}: {currentAssessment.weight_percentage}%
                </span>
              </div>
              <CardDescription className="text-xs mt-1">
                {t("results.subtitle")} (0 - {currentAssessment.max_score})
              </CardDescription>
            </div>

            <Button onClick={handleSave} variant="primary" size="sm" className="text-xs h-8">
              <Save className="h-3.5 w-3.5 mr-1" /> {t("common.save")}
            </Button>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 w-28">{t("students.studentId")}</th>
                    <th className="px-4 py-3">{t("students.fullName")}</th>
                    <th className="px-4 py-3 w-36 text-center">
                      {t("results.score")} (/{currentAssessment.max_score})
                    </th>
                    <th className="px-4 py-3 w-28 text-center">{t("results.score")} %</th>
                    <th className="px-4 py-3 w-28 text-center">{t("common.status")}</th>
                    <th className="px-4 py-3">{t("attendance.remarks")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {enrolledStudents.map((st) => {
                    const studentDraft = scoresDraft[st.id] || { score: "", remarks: "" };
                    const numScore = studentDraft.score !== "" ? Number(studentDraft.score) : null;
                    const percentage =
                      numScore !== null && currentAssessment.max_score > 0
                        ? Math.round((numScore / currentAssessment.max_score) * 100)
                        : null;

                    const isPassed = percentage !== null && percentage >= 50;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {st.student_id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                          {st.full_name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            max={currentAssessment.max_score}
                            value={studentDraft.score}
                            onChange={(e) => handleScoreChange(st.id, e.target.value)}
                            placeholder="0"
                            className="w-24 mx-auto text-center font-bold text-slate-900 dark:text-white h-8 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-xs text-slate-700 dark:text-slate-300">
                          {percentage !== null ? `${percentage}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {percentage !== null ? (
                            <StatusBadge status={isPassed ? "pass" : "fail"} size="sm" />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="text"
                            value={studentDraft.remarks}
                            onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                            placeholder={t("attendance.remarksPlaceholder")}
                            className="text-xs h-8"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 py-3 px-6 rounded-b-xl">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("students.activeCount", { count: enrolledStudents.length })}
            </span>
            <div className="flex items-center gap-2">
              <Link href={`/roster?classId=${selectedClassId}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  {t("roster.title")} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
              <Button onClick={handleSave} variant="primary" size="sm" className="text-xs h-8">
                <Save className="h-3.5 w-3.5 mr-1" /> {t("common.save")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
