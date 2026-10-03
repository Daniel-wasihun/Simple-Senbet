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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-800" />
            <span>Student Registration by Class</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            የተማሪዎች አጠቃላይ መዝገብ — የተመደቡበት ክፍል፣ መለያ ቁጥርና አድራሻ
          </p>
        </div>

        <Button
          onClick={openAddDialog}
          className="bg-blue-800 hover:bg-blue-900 text-white shadow-sm flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Register Student</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Class Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full text-xs sm:text-sm font-medium border border-slate-200 rounded-md p-1.5 bg-slate-50 text-slate-800 outline-none cursor-pointer"
          >
            <option value="all">All Classes (ሁሉም ክፍሎች) — {students.length} Total</option>
            {classes.map((c) => {
              const count = enrollments.filter((e) => e.class_id === c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} ({count} students)
                </option>
              );
            })}
          </select>
        </div>

        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, ID (e.g. STU-2024-001), or guardian phone..."
            className="pl-9 text-xs sm:text-sm bg-slate-50"
          />
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-slate-400" />}
          title="No students found"
          description={
            searchQuery
              ? "No students match your search criteria. Try a different query."
              : "No students are enrolled in this selection. Register students to begin."
          }
          action={
            <Button onClick={openAddDialog} className="bg-blue-800 text-white">
              Register Student
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Full Name (ስም)</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Class (ክፍል)</TableHead>
              <TableHead>Parent / Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((st) => (
              <TableRow key={st.id}>
                <TableCell className="font-mono text-xs font-semibold text-slate-700">
                  {st.student_id}
                </TableCell>
                <TableCell className="font-medium text-slate-900">
                  <div>{st.full_name}</div>
                  {st.date_of_birth && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" /> DOB: {st.date_of_birth}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {st.gender === "male" ? "ወንድ" : "ሴት"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="font-medium text-blue-900 border-blue-200 bg-blue-50/50"
                  >
                    {st.current_class_name}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {st.parent_name ? (
                    <div>
                      <p className="font-medium text-slate-800">{st.parent_name}</p>
                      <p className="text-slate-400 font-mono flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5" /> {st.parent_phone}
                      </p>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      st.status === "active"
                        ? "success"
                        : st.status === "graduated"
                          ? "secondary"
                          : "destructive"
                    }
                    className="capitalize text-[10px]"
                  >
                    {st.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(st)}
                      className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                      title="Edit student"
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
                      className="h-7 px-2 text-xs text-blue-700 hover:bg-blue-50"
                      title="Move student to another class"
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                      Move
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${st.full_name}?`)) {
                          deleteStudent(st.id);
                        }
                      }}
                      className="h-7 px-2 text-xs text-slate-400 hover:text-rose-600"
                      title="Delete student"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add / Edit Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingStudent ? "Edit Student Details" : "Register New Student"}
          </DialogTitle>
          <DialogDescription>
            Enter the student demographic details and assign them to an active class.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveStudent} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student ID (መለያ ቁጥር) *
              </label>
              <Input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="STU-2024-001"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender (ጾታ) *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="male">ወንድ (Male)</option>
                <option value="female">ሴት (Female)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name (የተማሪው ሙሉ ስም) *
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. ዮሐንስ ተስፋዬ"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Class (ክፍል) *
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">— Select Class —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth (የትውልድ ቀን)
              </label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent / Guardian Name (የወላጅ ስም)
              </label>
              <Input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="ተስፋዬ ገብሬ"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent Phone (ስልክ ቁጥር)
              </label>
              <Input
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+251 91 234 5678"
              />
            </div>
          </div>

          {editingStudent && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enrollment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StudentStatus)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="active">Active (በሂደት ላይ)</option>
                <option value="graduated">Graduated (ተመርቋል)</option>
                <option value="transferred">Transferred (የተዘዋወረ)</option>
                <option value="suspended">Suspended (የታገደ)</option>
              </select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-800 text-white hover:bg-blue-900">
              {editingStudent ? "Save Changes" : "Register Student"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Move Class Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogHeader>
          <DialogTitle>Move Student to Another Class</DialogTitle>
          <DialogDescription>
            Change the assigned class for <strong>{studentToMove?.full_name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleMoveClass} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select New Class *
            </label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="">— Select Target Class —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.level_category || "General"})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-800 text-white hover:bg-blue-900">
              Confirm Move
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
