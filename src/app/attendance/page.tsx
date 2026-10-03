"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { CalendarCheck, Calendar, CheckCircle2, Save, Users, Check } from "lucide-react";
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
import { AttendanceStatus } from "@/types";
import { getTodayDateString } from "@/lib/mock-data";

export default function AttendancePage() {
  const { classes, students, enrollments, attendance, saveDailyAttendance } = useSenbet();

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Attendance draft map: studentId -> { status: AttendanceStatus, remarks: string }
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize selected class
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Enrolled students in selected class
  const classEnrollments = useMemo(() => {
    return enrollments.filter((e) => e.class_id === selectedClassId);
  }, [enrollments, selectedClassId]);

  const enrolledStudents = useMemo(() => {
    const ids = new Set(classEnrollments.map((e) => e.student_id));
    return students.filter((s) => ids.has(s.id));
  }, [classEnrollments, students]);

  // Load existing attendance for class and date
  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;

    const initialDraft: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    enrolledStudents.forEach((st) => {
      const existing = attendance.find(
        (a) => a.class_id === selectedClassId && a.date === selectedDate && a.student_id === st.id
      );

      initialDraft[st.id] = {
        status: existing?.status || "present", // default to present for fast roll-call
        remarks: existing?.remarks || "",
      };
    });

    setAttendanceDraft(initialDraft);
    setSavedSuccess(false);
  }, [selectedClassId, selectedDate, enrolledStudents, attendance]);

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const setStudentRemarks = (studentId: string, remarks: string) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated = { ...attendanceDraft };
    enrolledStudents.forEach((st) => {
      updated[st.id] = {
        ...updated[st.id],
        status,
      };
    });
    setAttendanceDraft(updated);
  };

  const handleSave = () => {
    if (!selectedClassId || !selectedDate) return;

    const recordsToSave = enrolledStudents.map((st) => ({
      studentId: st.id,
      status: attendanceDraft[st.id]?.status || "present",
      remarks: attendanceDraft[st.id]?.remarks || "",
    }));

    saveDailyAttendance(selectedClassId, selectedDate, recordsToSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Summary counts
  const summaryCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let permission = 0;

    enrolledStudents.forEach((st) => {
      const s = attendanceDraft[st.id]?.status;
      if (s === "present") present++;
      else if (s === "absent") absent++;
      else if (s === "late") late++;
      else if (s === "permission") permission++;
    });

    return { present, absent, late, permission };
  }, [enrolledStudents, attendanceDraft]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-blue-800" />
            <span>Daily Attendance Roll-Call</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ዕለታዊ የተማሪዎች መገኘት መዝገብ — ተገኝቷል፣ ቀረ፣ አርፍዷል፣ በፈቃድ
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="bg-blue-800 hover:bg-blue-900 text-white shadow-sm flex items-center gap-1.5"
        >
          <Save className="h-4 w-4" />
          <span>Save Attendance</span>
        </Button>
      </div>

      {/* Selectors Bar: Class & Date */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select Class (ክፍል)
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full text-xs sm:text-sm font-medium border border-slate-200 rounded-md p-2 bg-slate-50 text-slate-800 outline-none cursor-pointer"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Date (ቀን)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 text-xs sm:text-sm bg-slate-50 font-medium"
            />
          </div>
        </div>

        {/* Quick Bulk Marking Actions */}
        <div className="sm:col-span-2 lg:col-span-1 flex flex-col justify-end">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Quick Batch Actions
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => markAll("present")}
              className="text-xs h-8 text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 flex-1"
            >
              <Check className="h-3.5 w-3.5 mr-1" /> Mark All Present
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => markAll("absent")}
              className="text-xs h-8 text-rose-800 border-rose-300 bg-rose-50 hover:bg-rose-100"
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Attendance records successfully saved for {selectedDate}!</span>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-emerald-900">{summaryCounts.present}</div>
            <div className="text-xs text-emerald-700">Present (ተገኝቷል)</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold text-xs">
            ✓
          </div>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-rose-900">{summaryCounts.absent}</div>
            <div className="text-xs text-rose-700">Absent (ቀረ)</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-rose-200/60 text-rose-800 flex items-center justify-center font-bold text-xs">
            ✕
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-amber-900">{summaryCounts.late}</div>
            <div className="text-xs text-amber-700">Late (አርፍዷል)</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-amber-200/60 text-amber-800 flex items-center justify-center font-bold text-xs">
            ⏱
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-blue-900">{summaryCounts.permission}</div>
            <div className="text-xs text-blue-700">Permission (በፈቃድ)</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-blue-200/60 text-blue-800 flex items-center justify-center font-bold text-xs">
            📄
          </div>
        </div>
      </div>

      {/* Student Attendance Roll-Call Table */}
      {enrolledStudents.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-slate-400" />}
          title="No students enrolled in this class"
          description="Enroll students into this grade to record daily attendance."
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
              <CardTitle className="text-base text-slate-900">
                Attendance Roll-Call: {selectedDate}
              </CardTitle>
              <CardDescription>
                Click any status chip to toggle attendance for each student.
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
                  <TableHead className="w-28">ID</TableHead>
                  <TableHead>Student Name (የተማሪው ስም)</TableHead>
                  <TableHead className="w-80 text-center">Status Selection</TableHead>
                  <TableHead>Remarks / Note (ማስታወሻ)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledStudents.map((st) => {
                  const currentStatus = attendanceDraft[st.id]?.status || "present";
                  const remarks = attendanceDraft[st.id]?.remarks || "";

                  return (
                    <TableRow key={st.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-600">
                        {st.student_id}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{st.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.id, "present")}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                              currentStatus === "present"
                                ? "bg-emerald-600 text-white shadow-xs scale-105"
                                : "bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800"
                            }`}
                          >
                            ✓ Present
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.id, "absent")}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                              currentStatus === "absent"
                                ? "bg-rose-600 text-white shadow-xs scale-105"
                                : "bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-800"
                            }`}
                          >
                            ✕ Absent
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.id, "late")}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                              currentStatus === "late"
                                ? "bg-amber-600 text-white shadow-xs scale-105"
                                : "bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800"
                            }`}
                          >
                            ⏱ Late
                          </button>

                          {/* Permission */}
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.id, "permission")}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                              currentStatus === "permission"
                                ? "bg-blue-600 text-white shadow-xs scale-105"
                                : "bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-800"
                            }`}
                          >
                            📄 Permission
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={remarks}
                          onChange={(e) => setStudentRemarks(st.id, e.target.value)}
                          placeholder="e.g. excused by parent, arrived 9:30 AM..."
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
              Total Students: <strong>{enrolledStudents.length}</strong>
            </span>
            <Button
              onClick={handleSave}
              className="bg-blue-800 hover:bg-blue-900 text-white text-xs h-8"
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Save Daily Roll-Call
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
