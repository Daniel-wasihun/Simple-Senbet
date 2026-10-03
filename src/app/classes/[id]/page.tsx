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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

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

  if (!cls) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">Class Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          The requested class does not exist or has been removed.
        </p>
        <Link href="/classes" className="mt-4 inline-block">
          <Button variant="outline">Back to Classes</Button>
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
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-800 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Classes
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-serif text-slate-900">{cls.name}</h1>
              <Badge variant="secondary">{cls.level_category || "General"}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Room: <strong>{cls.room_number || "Main Sanctuary Hall"}</strong> ·{" "}
              {classStudents.length} Students Enrolled · {classCourses.length} Courses
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/attendance?classId=${cls.id}`}>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 text-xs"
              >
                <CalendarCheck className="h-3.5 w-3.5 mr-1.5 text-amber-700" />
                Roll-Call
              </Button>
            </Link>
            <Link href={`/roster?classId=${cls.id}`}>
              <Button size="sm" className="bg-blue-800 hover:bg-blue-900 text-white text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Class Roster
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Students vs Courses */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "students"
              ? "border-blue-800 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Enrolled Students ({classStudents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "courses"
              ? "border-blue-800 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Class Courses ({classCourses.length})</span>
        </button>
      </div>

      {/* Tab Content: Enrolled Students */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Student Roster</h3>
            <Button
              size="sm"
              onClick={() => {
                setStudentId(`STU-2024-${String(students.length + 1).padStart(3, "0")}`);
                setAddStudentOpen(true);
              }}
              className="bg-blue-800 hover:bg-blue-900 text-white text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Enroll Student
            </Button>
          </div>

          {classStudents.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8 text-slate-400" />}
              title="No students enrolled in this class"
              description="Register new students or transfer existing students into this grade."
              action={
                <Button
                  onClick={() => {
                    setStudentId(`STU-2024-${String(students.length + 1).padStart(3, "0")}`);
                    setAddStudentOpen(true);
                  }}
                  className="bg-blue-800 text-white"
                >
                  Enroll First Student
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
                  <TableHead>Parent / Guardian</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.map((st) => (
                  <TableRow key={st.id}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-600">
                      {st.student_id}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">{st.full_name}</TableCell>
                    <TableCell className="capitalize text-slate-600 text-xs">
                      {st.gender === "male" ? "ወንድ (Male)" : "ሴት (Female)"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {st.parent_name ? (
                        <div>
                          <p className="font-medium text-slate-800">{st.parent_name}</p>
                          <p className="text-slate-400">{st.parent_phone}</p>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" className="capitalize text-[11px]">
                        {st.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStudentToMove({ id: st.id, name: st.full_name });
                            setTargetClassId("");
                            setMoveStudentOpen(true);
                          }}
                          className="h-7 text-xs px-2 text-slate-600 hover:text-blue-800"
                          title="Move to another class"
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          Move
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Remove ${st.full_name} from records?`)) {
                              deleteStudent(st.id);
                            }
                          }}
                          className="h-7 text-xs px-2 text-slate-400 hover:text-rose-600"
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
        </div>
      )}

      {/* Tab Content: Courses */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Class Subjects & Courses</h3>
            <Button
              size="sm"
              onClick={() => setAddCourseOpen(true)}
              className="bg-blue-800 hover:bg-blue-900 text-white text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Course
            </Button>
          </div>

          {classCourses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8 text-slate-400" />}
              title="No courses configured for this class"
              description="Add Sunday school courses like Bible Study, Mezmur, Church History, or Faith."
              action={
                <Button onClick={() => setAddCourseOpen(true)} className="bg-blue-800 text-white">
                  Add First Course
                </Button>
              }
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
                  <Card key={crs.id} className="border-slate-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="text-[10px] font-mono mb-1">
                            {crs.code || "COURSE"}
                          </Badge>
                          <CardTitle className="text-base text-slate-900">{crs.name}</CardTitle>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Delete course ${crs.name}?`)) {
                              deleteCourse(crs.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Assessments configured:</span>
                        <span className="font-semibold text-slate-900">
                          {courseAssessments.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Total weight:</span>
                        <Badge
                          variant={totalWeight === 100 ? "success" : "warning"}
                          className="text-[10px]"
                        >
                          {totalWeight}% {totalWeight === 100 ? "✓ Complete" : "(Incomplete)"}
                        </Badge>
                      </div>
                      <Link href={`/courses/${crs.id}/assessments`}>
                        <Button variant="outline" size="sm" className="w-full text-xs mt-2">
                          <Award className="h-3.5 w-3.5 mr-1 text-amber-600" />
                          Configure Breakdown
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

      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogHeader>
          <DialogTitle>Enroll Student in {cls.name}</DialogTitle>
          <DialogDescription>
            Register a student directly into this class with identification and contact details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateStudent} className="space-y-4 py-2">
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
                Parent/Guardian Name (የወላጅ ስም)
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
                placeholder="+251 91 ..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddStudentOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-800 text-white hover:bg-blue-900">
              Save & Enroll
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Move Student Dialog */}
      <Dialog open={moveStudentOpen} onOpenChange={setMoveStudentOpen}>
        <DialogHeader>
          <DialogTitle>Move Student to Another Class</DialogTitle>
          <DialogDescription>
            Transfer <strong>{studentToMove?.name}</strong> to a different class or grade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleMoveStudent} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Destination Class (ዒላማ ክፍል) *
            </label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="">— Select Target Class —</option>
              {classes
                .filter((c) => c.id !== classId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.level_category || "General"})
                  </option>
                ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMoveStudentOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-800 text-white hover:bg-blue-900">
              Transfer Student
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Add Course Dialog */}
      <Dialog open={addCourseOpen} onOpenChange={setAddCourseOpen}>
        <DialogHeader>
          <DialogTitle>Add Course to {cls.name}</DialogTitle>
          <DialogDescription>
            Create a course for this class (e.g. Bible Study, Mezmur, History).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateCourse} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course Name (የትምህርቱ ስም) *
            </label>
            <Input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. መጽሐፍ ቅዱስ ጥናት (Bible Study)"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course Code (ኮድ)
            </label>
            <Input
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. BIB-501"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddCourseOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-800 text-white hover:bg-blue-900">
              Create Course
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
