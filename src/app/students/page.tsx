"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Calendar,
  Phone,
  MapPin,
  Eye,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { Student, StudentStatus } from "@/types";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { FormField } from "@/components/common/FormField";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";

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
  const [baptismalName, setBaptismalName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [classId, setClassId] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [status, setStatus] = useState<StudentStatus>("active");

  // View Details Modal
  const [detailsStudent, setDetailsStudent] = useState<Student | null>(null);

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
        (s.baptismal_name && s.baptismal_name.toLowerCase().includes(q)) ||
        s.student_id.toLowerCase().includes(q) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(q)) ||
        (s.parent_phone && s.parent_phone.includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q));

      return matchesClass && matchesSearch;
    });
  }, [studentsWithClass, selectedClassFilter, searchQuery]);

  const openAddDialog = () => {
    setEditingStudent(null);
    setStudentId(`STU-2024-${String(students.length + 1).padStart(3, "0")}`);
    setFullName("");
    setBaptismalName("");
    setGender("male");
    setClassId(selectedClassFilter !== "all" ? selectedClassFilter : classes[0]?.id || "");
    setParentName("");
    setParentPhone("");
    setParentEmail("");
    setAddress("");
    setDateOfBirth("");
    setStatus("active");
    setDialogOpen(true);
  };

  const openEditDialog = (s: Student) => {
    setEditingStudent(s);
    setStudentId(s.student_id);
    setFullName(s.full_name);
    setBaptismalName(s.baptismal_name || "");
    setGender(s.gender);
    const enr = enrollments.find((e) => e.student_id === s.id);
    setClassId(enr?.class_id || classes[0]?.id || "");
    setParentName(s.parent_name || "");
    setParentPhone(s.parent_phone || "");
    setParentEmail(s.parent_email || "");
    setAddress(s.address || "");
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
        baptismal_name: baptismalName.trim() || undefined,
        gender,
        parent_name: parentName.trim() || undefined,
        parent_phone: parentPhone.trim() || undefined,
        parent_email: parentEmail.trim() || undefined,
        address: address.trim() || undefined,
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
        baptismalName: baptismalName.trim() || undefined,
        gender,
        classId,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        parentEmail: parentEmail.trim() || undefined,
        address: address.trim() || undefined,
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
          <Button onClick={openAddDialog} variant="primary" className="flex items-center gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>{t("students.registerNew")}</span>
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
              type="text"
              placeholder={t("students.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              className="text-xs sm:text-sm py-1.5"
            />
          </div>
        </div>
      </Card>

      {/* Students Data Table */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("students.noStudents")}
          description={t("students.noStudentsDesc")}
          actionLabel={t("students.registerNew")}
          onAction={openAddDialog}
        />
      ) : (
        <Card className="overflow-hidden p-0 border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">{t("students.studentId")}</th>
                  <th className="px-4 py-3.5">{t("students.fullName")}</th>
                  <th className="px-4 py-3.5">{t("students.gender")}</th>
                  <th className="px-4 py-3.5">{t("students.class")}</th>
                  <th className="px-4 py-3.5">{t("students.parentContact")}</th>
                  <th className="px-4 py-3.5">{t("common.status")}</th>
                  <th className="px-4 py-3.5 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {st.student_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{st.full_name}</span>
                        {st.baptismal_name && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-serif">
                            ✝ {st.baptismal_name}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                        {st.date_of_birth && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {st.date_of_birth}
                          </span>
                        )}
                        {st.address && (
                          <span className="flex items-center gap-1 truncate max-w-[150px]">
                            <MapPin className="h-3 w-3" /> {st.address}
                          </span>
                        )}
                      </div>
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
                          {st.parent_phone && (
                            <p className="text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" /> {st.parent_phone}
                            </p>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={st.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailsStudent(st)}
                          className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300"
                          title={t("students.profileDetails")}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
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
                          className="h-7 px-2 text-xs text-brand-blue dark:text-blue-400 border-blue-200 dark:border-blue-900"
                          title={t("students.moveStudent")}
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          <span className="hidden xl:inline">{t("action.move")}</span>
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
        title={editingStudent ? t("students.editModalTitle") : t("students.addModalTitle")}
        description={t("students.modalDesc")}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t("students.fullName")} required>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ዮሐንስ ተስፋዬ"
                required
              />
            </FormField>

            <FormField label={t("students.baptismalName")}>
              <Input
                value={baptismalName}
                onChange={(e) => setBaptismalName(e.target.value)}
                placeholder="ወልደ ጊዮርጊስ"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t("classes.nameLabel")} required>
              <Select value={classId} onChange={(e) => setClassId(e.target.value)} required>
                <option value="">— {t("classes.nameLabel")} —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {tClass(c.name)}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={t("students.dateOfBirth")}>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t("students.address")}>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="አዲስ አበባ፣ ቀበሌ 04"
              />
            </FormField>

            <FormField label={t("students.parentEmail")}>
              <Input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
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

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Student Profile Details Modal */}
      {detailsStudent && (
        <Modal
          isOpen={!!detailsStudent}
          onClose={() => setDetailsStudent(null)}
          title={detailsStudent.full_name}
          description={`${detailsStudent.student_id} • ${detailsStudent.gender === "male" ? t("students.male") : t("students.female")}`}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">{t("students.studentId")}</p>
                <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                  {detailsStudent.student_id}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">{t("students.baptismalName")}</p>
                <p className="font-semibold text-amber-700 dark:text-amber-300 font-serif mt-0.5">
                  {detailsStudent.baptismal_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">{t("students.class")}</p>
                <p className="font-semibold text-brand-blue dark:text-blue-400 mt-0.5">
                  {tClass(
                    classes.find((c) =>
                      enrollments.some(
                        (e) => e.student_id === detailsStudent.id && e.class_id === c.id
                      )
                    )?.name || "Unassigned"
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">{t("students.dateOfBirth")}</p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                  {detailsStudent.date_of_birth || "—"}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t("students.parentContact")}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-slate-400">{t("students.parentName")}</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {detailsStudent.parent_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">{t("students.parentPhone")}</p>
                  <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                    {detailsStudent.parent_phone || "—"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">{t("students.address")}</p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                  {detailsStudent.address || "—"}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDetailsStudent(null)}>
                {t("action.close")}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Move Class Modal */}
      <Modal
        isOpen={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        title={t("students.moveModalTitle")}
        description={studentToMove?.full_name}
      >
        <form onSubmit={handleMoveClass} className="space-y-4">
          <FormField label={t("students.selectTargetClass")} required>
            <Select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              required
            >
              <option value="">— {t("classes.nameLabel")} —</option>
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
            <Button type="submit" variant="primary" disabled={!targetClassId}>
              {t("students.confirmMove")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            setStudentToDelete(null);
          }
        }}
        title={t("students.confirmDelete").replace("{name}", studentToDelete?.full_name || "")}
        message="This action will remove the student from class enrollments and grade sheets."
        variant="danger"
        confirmLabel={t("common.delete")}
      />
    </div>
  );
}
