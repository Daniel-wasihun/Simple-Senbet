"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  Trash2,
  Edit2,
  Calendar,
  Phone,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { FormField } from "@/components/common/FormField";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Student, StudentStatus } from "@/types";

export default function StudentsPage() {
  const {
    students,
    classes,
    enrollments,
    createStudent,
    updateStudent,
    moveStudentClass,
    deleteStudent,
  } = useSenbet();

  const { t, tClass } = useLanguage();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Add/Edit Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [classId, setClassId] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [status, setStatus] = useState<StudentStatus>("active");

  // Move Class Dialog
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [studentToMove, setStudentToMove] = useState<Student | null>(null);
  const [targetClassId, setTargetClassId] = useState("");

  // Delete Confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Map students with their enrolled class
  const studentsWithClass = useMemo(() => {
    return students.map((s) => {
      const enr = enrollments.find((e) => e.student_id === s.id);
      const cls = enr ? classes.find((c) => c.id === enr.class_id) : null;
      return {
        ...s,
        current_class_id: cls?.id,
        current_class_name: cls?.name || "Unassigned",
      };
    });
  }, [students, enrollments, classes]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return studentsWithClass.filter((s) => {
      const matchesClass =
        selectedClassFilter === "all" || s.current_class_id === selectedClassFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(q)) ||
        (s.parent_phone && s.parent_phone.includes(q));

      return matchesClass && matchesSearch;
    });
  }, [studentsWithClass, selectedClassFilter, searchQuery]);

  const openAddDialog = () => {
    setEditingStudent(null);
    setStudentId(`STU-2024-${String(students.length + 1).padStart(3, "0")}`);
    setFullName("");
    setGender("male");
    setClassId(selectedClassFilter !== "all" ? selectedClassFilter : classes[0]?.id || "");
    setParentName("");
    setParentPhone("");
    setDateOfBirth("");
    setStatus("active");
    setDialogOpen(true);
  };

  const openEditDialog = (s: Student) => {
    setEditingStudent(s);
    setStudentId(s.student_id);
    setFullName(s.full_name);
    setGender(s.gender);
    const enr = enrollments.find((e) => e.student_id === s.id);
    setClassId(enr?.class_id || classes[0]?.id || "");
    setParentName(s.parent_name || "");
    setParentPhone(s.parent_phone || "");
    setDateOfBirth(s.date_of_birth || "");
    setStatus(s.status);
    setDialogOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentId.trim() || !classId) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        student_id: studentId.trim(),
        full_name: fullName.trim(),
        gender,
        parent_name: parentName.trim(),
        parent_phone: parentPhone.trim(),
        date_of_birth: dateOfBirth || undefined,
        status,
      });
      // Check if class changed
      const currentEnr = enrollments.find((e) => e.student_id === editingStudent.id);
      if (currentEnr && currentEnr.class_id !== classId) {
        moveStudentClass(editingStudent.id, classId);
      }
    } else {
      createStudent({
        studentId: studentId.trim(),
        fullName: fullName.trim(),
        gender,
        classId,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        dateOfBirth: dateOfBirth || undefined,
        status,
      });
    }

    setDialogOpen(false);
  };

  const handleMoveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToMove || !targetClassId) return;
    moveStudentClass(studentToMove.id, targetClassId);
    setMoveDialogOpen(false);
    setStudentToMove(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t("students.title")}
        subtitle={t("students.subtitle")}
        action={
          <Button onClick={openAddDialog} variant="primary" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>{t("students.addStudent")}</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Class Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <Select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="text-xs sm:text-sm py-1.5"
            >
              <option value="all">
                {t("common.all")} {t("classes.title")} ({students.length})
              </option>
              {classes.map((c) => {
                const count = enrollments.filter((e) => e.class_id === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {tClass(c.name)} ({count})
                  </option>
                );
              })}
            </Select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("students.searchPlaceholder")}
              icon={Search}
              className="text-xs sm:text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("students.noStudents")}
          description={searchQuery ? t("common.noData") : t("students.subtitle")}
          actionLabel={t("students.addStudent")}
          onAction={openAddDialog}
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
                  <th className="px-4 py-3">{t("classes.className")}</th>
                  <th className="px-4 py-3">{t("students.parentContact")}</th>
                  <th className="px-4 py-3">{t("common.status")}</th>
                  <th className="px-4 py-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {st.student_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <div>{st.full_name}</div>
                      {st.date_of_birth && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> {st.date_of_birth}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 capitalize">
                      {st.gender === "male" ? t("students.male") : t("students.female")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        {tClass(st.current_class_name)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {st.parent_name ? (
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {st.parent_name}
                          </p>
                          <p className="text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" /> {st.parent_phone}
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
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(st)}
                          className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300"
                          title={t("common.edit")}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStudentToMove(st);
                            setTargetClassId("");
                            setMoveDialogOpen(true);
                          }}
                          className="h-7 px-2 text-xs text-brand-blue dark:text-blue-400"
                          title={t("students.moveStudent")}
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          {t("students.moveStudent")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setStudentToDelete(st);
                            setDeleteConfirmOpen(true);
                          }}
                          className="h-7 px-2 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingStudent ? t("students.editStudent") : t("students.addStudent")}
        description={t("students.subtitle")}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
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

            <FormField label={t("students.dob")}>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </FormField>
          </div>

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
                placeholder="+251 91 234 5678"
              />
            </FormField>
          </div>

          {editingStudent && (
            <FormField label={t("common.status")}>
              <Select value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)}>
                <option value="active">{t("students.active")}</option>
                <option value="graduated">{t("students.graduated")}</option>
                <option value="transferred">{t("students.transferred")}</option>
                <option value="suspended">{t("students.suspended")}</option>
              </Select>
            </FormField>
          )}

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

      {/* Move Class Modal */}
      <Modal
        isOpen={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        title={t("students.moveStudent")}
        description={`${studentToMove?.full_name}`}
      >
        <form onSubmit={handleMoveClass} className="space-y-4">
          <FormField label={t("students.targetClass")} required>
            <Select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              required
            >
              <option value="">— {t("students.selectClass")} —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {tClass(c.name)} ({c.level_category || "General"})
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setMoveDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("students.moveStudent")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setStudentToDelete(null);
        }}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            setDeleteConfirmOpen(false);
            setStudentToDelete(null);
          }
        }}
        title={t("common.delete")}
        description={t("students.deleteConfirm", { name: studentToDelete?.full_name || "" })}
        confirmText={t("common.delete")}
        variant="danger"
      />
    </div>
  );
}
