"use client";

import React, { useState, useMemo, useEffect } from "react";
import { CalendarCheck, Calendar, Save, Check } from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { calculateAttendanceMetrics } from "@/lib/calculations";
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
import { PageHeader } from "@/components/common/PageHeader";
import { InlineAlert } from "@/components/common/InlineAlert";
import { EmptyState } from "@/components/common/EmptyState";
import { AttendanceStatus } from "@/types";
import { getTodayDateString } from "@/lib/mock-data";

export default function AttendancePage() {
  const { classes, students, enrollments, attendance, saveDailyAttendance } = useSenbet();
  const { t, tClass, tAttendance } = useLanguage();

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

  // Summary counts using calculations utility
  const metrics = useMemo(() => {
    const recordList = enrolledStudents.map((st) => ({
      status: attendanceDraft[st.id]?.status || "present",
    }));
    return calculateAttendanceMetrics(recordList);
  }, [enrolledStudents, attendanceDraft]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t("attendance.title")}
        subtitle={t("attendance.subtitle")}
        action={
          <Button onClick={handleSave} variant="primary" className="flex items-center gap-1.5">
            <Save className="h-4 w-4" />
            <span>{t("common.save")}</span>
          </Button>
        }
      />

      {/* Selectors Bar: Class & Date */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("classes.className")}
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("attendance.date")}
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              icon={Calendar}
              className="text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Quick Bulk Marking Actions */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t("attendance.batchActions")}
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => markAll("present")}
                className="text-xs h-9 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 flex-1"
              >
                <Check className="h-3.5 w-3.5 mr-1" /> {t("attendance.markAllPresent")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => markAll("absent")}
                className="text-xs h-9 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100"
              >
                {t("attendance.clearAll")}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {savedSuccess && (
        <InlineAlert
          variant="success"
          title={t("common.success")}
          message={`${t("attendance.savedSuccess")} (${selectedDate})`}
          onClose={() => setSavedSuccess(false)}
        />
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-400">
              {metrics.present}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400/80 font-medium">
              {tAttendance("present")}
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
            ✓
          </div>
        </div>

        <div className="rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/70 dark:bg-rose-950/30 p-3.5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-rose-900 dark:text-rose-400">
              {metrics.absent}
            </div>
            <div className="text-xs text-rose-700 dark:text-rose-400/80 font-medium">
              {tAttendance("absent")}
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold text-xs">
            ✕
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-400">
              {metrics.late}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-400/80 font-medium">
              {tAttendance("late")}
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
            ⏱
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/30 p-3.5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-brand-blue dark:text-blue-400">
              {metrics.permission}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-400/80 font-medium">
              {tAttendance("permission")}
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
            📄
          </div>
        </div>
      </div>

      {/* Student Attendance Roll-Call Table */}
      {enrolledStudents.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={t("attendance.noStudents")}
          description={t("students.subtitle")}
          actionLabel={t("students.addStudent")}
          onAction={() => {}}
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>
                {t("attendance.title")}: {selectedDate}
              </CardTitle>
              <CardDescription>{t("attendance.subtitle")}</CardDescription>
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
                    <th className="px-4 py-3 text-center">{t("common.status")}</th>
                    <th className="px-4 py-3">{t("attendance.remarks")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {enrolledStudents.map((st) => {
                    const currentStatus = attendanceDraft[st.id]?.status || "present";
                    const remarks = attendanceDraft[st.id]?.remarks || "";

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {st.student_id}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {st.full_name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Present */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(st.id, "present")}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                currentStatus === "present"
                                  ? "bg-emerald-600 text-white shadow-xs scale-105"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-800"
                              }`}
                            >
                              ✓ {tAttendance("present")}
                            </button>

                            {/* Absent */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(st.id, "absent")}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                currentStatus === "absent"
                                  ? "bg-rose-600 text-white shadow-xs scale-105"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-800"
                              }`}
                            >
                              ✕ {tAttendance("absent")}
                            </button>

                            {/* Late */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(st.id, "late")}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                currentStatus === "late"
                                  ? "bg-amber-600 text-white shadow-xs scale-105"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-100 hover:text-amber-800"
                              }`}
                            >
                              ⏱ {tAttendance("late")}
                            </button>

                            {/* Permission */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(st.id, "permission")}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                currentStatus === "permission"
                                  ? "bg-brand-blue dark:bg-blue-600 text-white shadow-xs scale-105"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-100 hover:text-brand-blue"
                              }`}
                            >
                              📄 {tAttendance("permission")}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="text"
                            value={remarks}
                            onChange={(e) => setStudentRemarks(st.id, e.target.value)}
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
              {t("students.activeCount", { count: enrolledStudents.length })} ·{" "}
              {t("attendance.rate")}: <strong>{metrics.rate}%</strong>
            </span>
            <Button onClick={handleSave} variant="primary" size="sm" className="text-xs h-8">
              <Save className="h-3.5 w-3.5 mr-1" /> {t("common.save")}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
