"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Plus, Filter, Award, Trash2, Edit2 } from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Course } from "@/types";

export default function CoursesPage() {
  const { courses, classes, enrollments, assessments, createCourse, updateCourse, deleteCourse } =
    useSenbet();
  const { t, tClass, tCourse } = useLanguage();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [classId, setClassId] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      return selectedClassFilter === "all" || c.class_id === selectedClassFilter;
    });
  }, [courses, selectedClassFilter]);

  const openAddDialog = () => {
    setEditingCourse(null);
    setName("");
    setCode("");
    setClassId(selectedClassFilter !== "all" ? selectedClassFilter : classes[0]?.id || "");
    setDialogOpen(true);
  };

  const openEditDialog = (c: Course) => {
    setEditingCourse(c);
    setName(c.name);
    setCode(c.code || "");
    setClassId(c.class_id);
    setDialogOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !classId) return;

    if (editingCourse) {
      updateCourse(editingCourse.id, {
        name: name.trim(),
        code: code.trim(),
        class_id: classId,
      });
    } else {
      createCourse({
        name: name.trim(),
        code: code.trim() || name.substring(0, 3).toUpperCase() + "-101",
        classId,
      });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t("courses.title")}
        subtitle={t("courses.subtitle")}
        action={
          <Button onClick={openAddDialog} variant="primary" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>{t("courses.addCourse")}</span>
          </Button>
        }
      />

      {/* Class Filter Bar */}
      <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-md">
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        <Select
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
          className="text-xs sm:text-sm py-1.5"
        >
          <option value="all">
            {t("common.all")} {t("classes.title")} ({courses.length})
          </option>
          {classes.map((c) => {
            const count = courses.filter((crs) => crs.class_id === c.id).length;
            return (
              <option key={c.id} value={c.id}>
                {tClass(c.name)} ({count})
              </option>
            );
          })}
        </Select>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t("courses.noCourses")}
          description={t("courses.subtitle")}
          actionLabel={t("courses.addCourse")}
          onAction={openAddDialog}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((crs) => {
            const cls = classes.find((c) => c.id === crs.class_id);
            const enrolledCount = enrollments.filter((e) => e.class_id === crs.class_id).length;
            const courseAssessments = assessments.filter((a) => a.course_id === crs.id);
            const totalWeight = courseAssessments.reduce((sum, a) => sum + a.weight_percentage, 0);

            return (
              <Card
                key={crs.id}
                className="hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {crs.code || "COURSE"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400">
                          {cls ? tClass(cls.name) : "Class"}
                        </span>
                      </div>
                      <CardTitle className="text-base leading-snug">{tCourse(crs.name)}</CardTitle>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditDialog(crs)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg"
                        title={t("common.edit")}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCourseToDelete(crs);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg"
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {enrolledCount}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t("classes.students")}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {courseAssessments.length}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t("assessments.title")}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t("assessments.totalWeight")}:
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        totalWeight === 100
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                      }`}
                    >
                      {totalWeight}%{" "}
                      {totalWeight === 100
                        ? `✓ ${t("assessments.validTotal")}`
                        : t("assessments.invalidTotal")}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link href={`/courses/${crs.id}/assessments`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <Award className="h-3.5 w-3.5 mr-1 text-amber-600 dark:text-amber-400" />
                      {t("assessments.title")}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingCourse ? t("courses.editCourse") : t("courses.addCourse")}
        description={t("courses.subtitle")}
      >
        <form onSubmit={handleSaveCourse} className="space-y-4">
          <FormField label={t("classes.className")} required>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} required>
              <option value="">— {t("students.selectClass")} —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {tClass(c.name)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={t("courses.courseName")} required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. መጽሐፍ ቅዱስ ጥናት / Bible Study"
              required
            />
          </FormField>

          <FormField label={t("courses.courseCode")}>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. BIB-101"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setCourseToDelete(null);
        }}
        onConfirm={() => {
          if (courseToDelete) {
            deleteCourse(courseToDelete.id);
            setDeleteConfirmOpen(false);
            setCourseToDelete(null);
          }
        }}
        title={t("common.delete")}
        description={t("courses.deleteConfirm", {
          name: courseToDelete ? tCourse(courseToDelete.name) : "",
        })}
        confirmText={t("common.delete")}
        variant="danger"
      />
    </div>
  );
}
