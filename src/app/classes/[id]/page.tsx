"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  Plus,
  ArrowLeft,
  ArrowRightLeft,
  Trash2,
  Award,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { EmptyState } from "@/components/common/EmptyState";

export default function ClassDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const classId = resolvedParams.id;

  const {
    classes,
    students,
    enrollments,
    courses,
    assessments,
    createStudent,
    createCourse,
    moveStudentClass,
    deleteStudent,
    deleteCourse,
  } = useSenbet();

  const { t, tClass, tCourse } = useLanguage();

  const cls = classes.find((c) => c.id === classId);

  const [activeTab, setActiveTab] = useState<"students" | "courses">("students");

  // Add student modal state
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // Move student modal state
  const [moveStudentOpen, setMoveStudentOpen] = useState(false);
  const [studentToMove, setStudentToMove] = useState<{ id: string; name: string } | null>(null);
  const [targetClassId, setTargetClassId] = useState("");

  // Add course modal state
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");

  // Delete confirmations
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteCourseTarget, setDeleteCourseTarget] = useState<{ id: string; name: string } | null>(
    null
  );

  if (!cls) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          {t("classes.noClasses")}
        </h2>
        <Link href="/classes" className="mt-4 inline-block">
          <Button variant="outline">{t("classes.title")}</Button>
        </Link>
      </div>
    );
  }

  // Filter students enrolled in this class
  const classEnrollments = enrollments.filter((e) => e.class_id === classId);
  const enrolledStudentIds = new Set(classEnrollments.map((e) => e.student_id));
  const classStudents = students.filter((s) => enrolledStudentIds.has(s.id));

  // Filter courses assigned to this class
  const classCourses = courses.filter((c) => c.class_id === classId);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentId.trim()) return;

    createStudent({
      studentId: studentId.trim(),
      fullName: fullName.trim(),
      gender,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      classId,
    });

    setStudentId("");
    setFullName("");
    setParentName("");
    setParentPhone("");
    setAddStudentOpen(false);
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    createCourse({
      name: courseName.trim(),
      code: courseCode.trim() || courseName.substring(0, 3).toUpperCase() + "-101",
      classId,
    });

    setCourseName("");
    setCourseCode("");
    setAddCourseOpen(false);
  };

  const handleMoveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToMove || !targetClassId) return;

    moveStudentClass(studentToMove.id, targetClassId);
    setMoveStudentOpen(false);
    setStudentToMove(null);
  };

  return (
    <div className="space-y-6">
      {/* Back button & Page Header */}
      <div>
        <Link
          href="/classes"
          className="inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-blue-400 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {t("classes.title")}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                {tClass(cls.name)}
              </h1>
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {cls.level_category || "General"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {cls.room_number ? `${t("classes.roomNumber")}: ${cls.room_number} · ` : ""}
              {t("students.activeCount", { count: classStudents.length })} · {classCourses.length}{" "}
              {t("classes.courses")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/attendance?classId=${cls.id}`}>
              <Button variant="secondary" size="sm" className="text-xs">
                <CalendarCheck className="h-3.5 w-3.5 mr-1.5 text-amber-600 dark:text-amber-400" />
                {t("dashboard.takeAttendance")}
              </Button>
            </Link>
            <Link href={`/roster?classId=${cls.id}`}>
              <Button variant="primary" size="sm" className="text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                {t("roster.title")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "students"
              ? "border-brand-blue text-brand-blue dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>
            {t("classes.students")} ({classStudents.length})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "courses"
              ? "border-brand-blue text-brand-blue dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>
            {t("classes.courses")} ({classCourses.length})
          </span>
        </button>
      </div>

      {/* Tab 1: Enrolled Students */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t("students.title")}
            </h3>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setStudentId(`STU-2024-${String(students.length + 1).padStart(3, "0")}`);
                setAddStudentOpen(true);
              }}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("students.addStudent")}
            </Button>
          </div>

          {classStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("students.noStudents")}
              description={t("students.subtitle")}
              actionLabel={t("students.addStudent")}
              onAction={() => {
                setStudentId(`STU-2024-${String(students.length + 1).padStart(3, "0")}`);
                setAddStudentOpen(true);
              }}
            />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">{t("students.studentId")}</th>
                      <th className="px-4 py-3">{t("students.fullName")}</th>
                      <th className="px-4 py-3">{t("students.gender")}</th>
                      <th className="px-4 py-3">{t("students.parentContact")}</th>
                      <th className="px-4 py-3">{t("common.status")}</th>
                      <th className="px-4 py-3 text-right">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {classStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {st.student_id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                          {st.full_name}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 capitalize">
                          {st.gender === "male" ? t("students.male") : t("students.female")}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                          {st.parent_name ? (
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {st.parent_name}
                              </p>
                              <p className="text-slate-400 dark:text-slate-500">
                                {st.parent_phone}
                              </p>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={st.status} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setStudentToMove({ id: st.id, name: st.full_name });
                                setTargetClassId("");
                                setMoveStudentOpen(true);
                              }}
                              className="h-7 text-xs px-2 text-slate-600 dark:text-slate-300"
                              title={t("students.moveStudent")}
                            >
                              <ArrowRightLeft className="h-3 w-3 mr-1" />
                              {t("students.moveStudent")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteStudentTarget({ id: st.id, name: st.full_name });
                              }}
                              className="h-7 text-xs px-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                              title={t("common.delete")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Courses */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t("courses.title")}
            </h3>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setAddCourseOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("courses.addCourse")}
            </Button>
          </div>

          {classCourses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={t("courses.noCourses")}
              description={t("courses.subtitle")}
              actionLabel={t("courses.addCourse")}
              onAction={() => setAddCourseOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classCourses.map((crs) => {
                const courseAssessments = assessments.filter((a) => a.course_id === crs.id);
                const totalWeight = courseAssessments.reduce(
                  (sum, a) => sum + a.weight_percentage,
                  0
                );

                return (
                  <Card key={crs.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mb-1">
                            {crs.code || "COURSE"}
                          </span>
                          <CardTitle className="text-base">{tCourse(crs.name)}</CardTitle>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteCourseTarget({ id: crs.id, name: tCourse(crs.name) });
                          }}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{t("assessments.title")}:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {courseAssessments.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{t("assessments.totalWeight")}:</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-xs ${
                            totalWeight === 100
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                          }`}
                        >
                          {totalWeight}%{" "}
                          {totalWeight === 100
                            ? `✓ ${t("assessments.validTotal")}`
                            : `(${t("assessments.invalidTotal")})`}
                        </span>
                      </div>
                      <Link href={`/courses/${crs.id}/assessments`}>
                        <Button variant="outline" size="sm" className="w-full text-xs mt-2">
                          <Award className="h-3.5 w-3.5 mr-1 text-amber-600 dark:text-amber-400" />
                          {t("assessments.title")}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Student Modal */}
      <Modal
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        title={`${t("students.addStudent")} — ${tClass(cls.name)}`}
        description={t("students.subtitle")}
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("students.studentId")} required>
              <Input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="STU-2024-001"
                required
              />
            </FormField>

            <FormField label={t("students.gender")} required>
              <Select
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
              >
                <option value="male">{t("students.male")}</option>
                <option value="female">{t("students.female")}</option>
              </Select>
            </FormField>
          </div>

          <FormField label={t("students.fullName")} required>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. ዮሐንስ ተስፋዬ / John Doe"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("students.parentName")}>
              <Input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="ተስፋዬ ገብሬ"
              />
            </FormField>

            <FormField label={t("students.parentPhone")}>
              <Input
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+251 91 ..."
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddStudentOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Move Student Modal */}
      <Modal
        isOpen={moveStudentOpen}
        onClose={() => setMoveStudentOpen(false)}
        title={t("students.moveStudent")}
        description={`${studentToMove?.name}`}
      >
        <form onSubmit={handleMoveStudent} className="space-y-4">
          <FormField label={t("students.targetClass")} required>
            <Select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              required
            >
              <option value="">— {t("students.selectClass")} —</option>
              {classes
                .filter((c) => c.id !== classId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {tClass(c.name)} ({c.level_category || "General"})
                  </option>
                ))}
            </Select>
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setMoveStudentOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("students.moveStudent")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Course Modal */}
      <Modal
        isOpen={addCourseOpen}
        onClose={() => setAddCourseOpen(false)}
        title={`${t("courses.addCourse")} — ${tClass(cls.name)}`}
        description={t("courses.subtitle")}
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <FormField label={t("courses.courseName")} required>
            <Input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. መጽሐፍ ቅዱስ ጥናት / Bible Study"
              required
            />
          </FormField>

          <FormField label={t("courses.courseCode")}>
            <Input
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. BIB-101"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddCourseOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Student Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteStudentTarget}
        onClose={() => setDeleteStudentTarget(null)}
        onConfirm={() => {
          if (deleteStudentTarget) {
            deleteStudent(deleteStudentTarget.id);
            setDeleteStudentTarget(null);
          }
        }}
        title={t("common.delete")}
        description={t("students.deleteConfirm", { name: deleteStudentTarget?.name || "" })}
        confirmText={t("common.delete")}
        variant="danger"
      />

      {/* Delete Course Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCourseTarget}
        onClose={() => setDeleteCourseTarget(null)}
        onConfirm={() => {
          if (deleteCourseTarget) {
            deleteCourse(deleteCourseTarget.id);
            setDeleteCourseTarget(null);
          }
        }}
        title={t("common.delete")}
        description={t("courses.deleteConfirm", { name: deleteCourseTarget?.name || "" })}
        confirmText={t("common.delete")}
        variant="danger"
      />
    </div>
  );
}
