"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  Save,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export default function ResultsPage() {
  const { classes, courses, assessments, students, enrollments, results, saveAssessmentResults } =
    useSenbet();

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
        // Clamp to 0 and max_score
        const clampedScore = Math.max(0, Math.min(currentAssessment.max_score, rawScore));
        entriesToSave.push({
          studentId: st.id,
          score: clampedScore,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
            <Award className="h-6 w-6 text-blue-800" />
            <span>Assessment Results Entry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            የምዘና ውጤቶች ማስገቢያና ራስ-ሰር ስሌት (Auto-Calculation & Pass/Fail)
          </p>
        </div>

        {currentAssessment && (
          <Button
            onClick={handleSave}
            className="bg-blue-800 hover:bg-blue-900 text-white shadow-sm flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            <span>Save All Results</span>
          </Button>
        )}
      </div>

      {/* Selectors Bar: Class -> Course -> Assessment */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Class selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            1. Select Class (ክፍል)
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full text-xs sm:text-sm font-medium border border-slate-200 rounded-md p-2 bg-slate-50 text-slate-800 outline-none"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            2. Select Course (የትምህርት ዓይነት)
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            disabled={classCourses.length === 0}
            className="w-full text-xs sm:text-sm font-medium border border-slate-200 rounded-md p-2 bg-slate-50 text-slate-800 outline-none disabled:opacity-50"
          >
            {classCourses.map((crs) => (
              <option key={crs.id} value={crs.id}>
                {crs.name}
              </option>
            ))}
            {classCourses.length === 0 && <option>No courses in this class</option>}
          </select>
        </div>

        {/* Assessment selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            3. Select Assessment (የምዘና ዓይነት)
          </label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            disabled={courseAssessments.length === 0}
            className="w-full text-xs sm:text-sm font-medium border border-slate-200 rounded-md p-2 bg-slate-50 text-slate-800 outline-none disabled:opacity-50"
          >
            {courseAssessments.map((asm) => (
              <option key={asm.id} value={asm.id}>
                {asm.name} (Max: {asm.max_score}, {asm.weight_percentage}%)
              </option>
            ))}
            {courseAssessments.length === 0 && <option>No assessments configured</option>}
          </select>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Results saved successfully! Course totals and class rankings updated.</span>
        </div>
      )}

      {/* Main Results Table */}
      {!currentAssessment ? (
        <EmptyState
          icon={<Award className="h-8 w-8 text-slate-400" />}
          title="No assessment selected or configured"
          description="Create or configure assessment components for this course to begin entering student marks."
          action={
            selectedCourseId && (
              <Link href={`/courses/${selectedCourseId}/assessments`}>
                <Button className="bg-blue-800 text-white">Configure Assessment Components</Button>
              </Link>
            )
          }
        />
      ) : enrolledStudents.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-8 w-8 text-slate-400" />}
          title="No students enrolled in this class"
          description="Enroll students into this class to enter exam marks."
          action={
            <Link href="/students">
              <Button className="bg-blue-800 text-white">Enroll Students</Button>
            </Link>
          }
        />
      ) : (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base text-slate-900">{currentAssessment.name}</CardTitle>
                <Badge variant="outline">Max Score: {currentAssessment.max_score}</Badge>
                <Badge variant="secondary">Weight: {currentAssessment.weight_percentage}%</Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Enter student scores. Values will be automatically clamped between 0 and{" "}
                {currentAssessment.max_score}.
              </CardDescription>
            </div>

            <Button
              onClick={handleSave}
              size="sm"
              className="bg-blue-800 hover:bg-blue-900 text-white text-xs h-8"
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Student ID</TableHead>
                  <TableHead>Student Name (ስም)</TableHead>
                  <TableHead className="w-36 text-center">
                    Score (/{currentAssessment.max_score})
                  </TableHead>
                  <TableHead className="w-28 text-center">Score %</TableHead>
                  <TableHead className="w-28 text-center">Status</TableHead>
                  <TableHead>Teacher Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledStudents.map((st) => {
                  const studentDraft = scoresDraft[st.id] || { score: "", remarks: "" };
                  const numScore = studentDraft.score !== "" ? Number(studentDraft.score) : null;
                  const percentage =
                    numScore !== null && currentAssessment.max_score > 0
                      ? Math.round((numScore / currentAssessment.max_score) * 100)
                      : null;

                  const isPassed = percentage !== null && percentage >= 50;

                  return (
                    <TableRow key={st.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-600">
                        {st.student_id}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">{st.full_name}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max={currentAssessment.max_score}
                          value={studentDraft.score}
                          onChange={(e) => handleScoreChange(st.id, e.target.value)}
                          placeholder="0"
                          className="w-24 mx-auto text-center font-bold text-slate-900 h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium text-xs">
                        {percentage !== null ? `${percentage}%` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {percentage !== null ? (
                          <Badge
                            variant={isPassed ? "success" : "destructive"}
                            className="text-[10px]"
                          >
                            {isPassed ? "Pass (አልፏል)" : "Fail (ወድቋል)"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">Ungraded</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={studentDraft.remarks}
                          onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                          placeholder="Optional remarks..."
                          className="text-xs h-8"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex items-center justify-between bg-slate-50 border-t border-slate-200 py-3 px-6 rounded-b-xl">
            <span className="text-xs text-slate-500">
              Total Enrolled Students: <strong>{enrolledStudents.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Link href={`/roster?classId=${selectedClassId}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  View Full Class Roster & Rankings <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
              <Button
                onClick={handleSave}
                className="bg-blue-800 hover:bg-blue-900 text-white text-xs h-8"
              >
                <Save className="h-3.5 w-3.5 mr-1" /> Save Results
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
