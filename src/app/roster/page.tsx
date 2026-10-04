"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { FileSpreadsheet, Printer, GraduationCap } from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { formatScore, getOrdinalRank } from "@/lib/utils";

export default function ClassRosterPage() {
  const { classes, courses, getClassRoster, currentAcademicYear, school } = useSenbet();
  const { t, tClass, tCourse, tResult } = useLanguage();

  const [selectedClassId, setSelectedClassId] = useState<string>("");

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      // Default to Grade 5 if present, otherwise first class
      const g5 = classes.find((c) => c.name.includes("5"));
      setSelectedClassId(g5 ? g5.id : classes[0].id);
    }
  }, [classes, selectedClassId]);

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  const classCourses = useMemo(() => {
    return courses.filter((c) => c.class_id === selectedClassId);
  }, [courses, selectedClassId]);

  // Compute full class roster with deterministic ranking
  const rosterEntries = useMemo(() => {
    if (!selectedClassId) return [];
    return getClassRoster(selectedClassId);
  }, [selectedClassId, getClassRoster]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Hidden when printing) */}
      <div className="print:hidden">
        <PageHeader
          title={t("roster.title")}
          subtitle={t("roster.subtitle")}
          action={
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="text-xs h-9 flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>{t("roster.printRoster")}</span>
              </Button>
              <Link href="/results">
                <Button variant="primary" size="sm" className="text-xs h-9">
                  {t("results.title")}
                </Button>
              </Link>
            </div>
          }
        />
      </div>

      {/* Class Selector Filter (Hidden when printing) */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-md print:hidden flex items-center space-x-2">
        <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
        <Select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="text-xs sm:text-sm py-1 font-semibold"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {tClass(c.name)} ({c.level_category || "General"})
            </option>
          ))}
        </Select>
      </div>

      {/* Printable Sheet Header (Visible on screen and in print) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs print:border-none print:shadow-none print:p-0">
        <div className="text-center pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white print:text-black">
            {school?.name || t("common.appName")}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-serif print:text-slate-600">
            {school?.parish_name} · {t("roster.title")}
          </p>
          <div className="mt-2 inline-flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full print:bg-slate-100 print:text-black">
            <span>
              {t("classes.className")}:{" "}
              <strong>{selectedClass ? tClass(selectedClass.name) : ""}</strong>
            </span>
            <span>·</span>
            <span>
              {t("classes.academicYear")}: <strong>{currentAcademicYear?.name}</strong>
            </span>
            <span>·</span>
            <span>
              {t("classes.students")}: <strong>{rosterEntries.length}</strong>
            </span>
          </div>
        </div>

        {rosterEntries.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title={t("roster.noData")}
            description={t("roster.subtitle")}
            actionLabel={t("students.addStudent")}
            onAction={() => {}}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm print:text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:text-black">
                <tr>
                  <th className="w-16 px-3 py-3 text-center font-bold text-slate-900 dark:text-white print:text-black">
                    {t("roster.rank")}
                  </th>
                  <th className="w-28 px-3 py-3">{t("students.studentId")}</th>
                  <th className="min-w-[160px] px-3 py-3">{t("students.fullName")}</th>
                  <th className="w-24 px-3 py-3 text-center">{t("attendance.title")}</th>

                  {/* Dynamic course columns */}
                  {classCourses.map((c) => (
                    <th key={c.id} className="text-center min-w-[90px] px-2 py-3">
                      <div className="truncate max-w-[110px]" title={c.name}>
                        {tCourse(c.name).split(" ")[0]}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {t("results.score")}
                      </span>
                    </th>
                  ))}

                  <th className="w-24 px-3 py-3 text-center font-bold text-slate-900 dark:text-white print:text-black">
                    {t("roster.total")}
                  </th>
                  <th className="w-24 px-3 py-3 text-center font-bold text-slate-900 dark:text-white print:text-black">
                    {t("roster.average")} %
                  </th>
                  <th className="w-24 px-3 py-3 text-center">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rosterEntries.map((row) => {
                  const isTopOne = row.rank === 1;
                  const isTopTwo = row.rank === 2;
                  const isTopThree = row.rank === 3;

                  return (
                    <tr
                      key={row.student.id}
                      className={
                        isTopOne
                          ? "bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50/80"
                          : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      }
                    >
                      {/* Deterministic Rank */}
                      <td className="px-3 py-3 text-center font-bold">
                        {isTopOne ? (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-r from-brand-gold to-amber-500 text-brand-blue-dark font-black shadow-xs text-xs">
                            1 🥇
                          </span>
                        ) : isTopTwo ? (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs">
                            2 🥈
                          </span>
                        ) : isTopThree ? (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-xs">
                            3 🥉
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                            {getOrdinalRank(row.rank)}
                          </span>
                        )}
                      </td>

                      {/* Student ID */}
                      <td className="px-3 py-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {row.student.student_id}
                      </td>

                      {/* Student Name */}
                      <td className="px-3 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{row.student.full_name}</span>
                          {row.student.baptismal_name && (
                            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-serif">
                              (✝ {row.student.baptismal_name})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Attendance Summary */}
                      <td className="px-3 py-3 text-center text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {row.attendance.attendanceRate}%
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {row.attendance.present}p / {row.attendance.totalDays}d
                        </div>
                      </td>

                      {/* Course Scores */}
                      {classCourses.map((c) => {
                        const scoreData = row.courseScores[c.id];
                        return (
                          <td key={c.id} className="px-2 py-3 text-center font-mono text-xs">
                            {scoreData && scoreData.maxPossibleScore > 0 ? (
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {formatScore(scoreData.obtainedScore)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  /{scoreData.maxPossibleScore}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Obtained */}
                      <td className="px-3 py-3 text-center font-bold font-mono text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-slate-800/40">
                        {formatScore(row.totalObtainedScore)}
                        {row.totalMaxScore > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            /{row.totalMaxScore}
                          </span>
                        )}
                      </td>

                      {/* Overall Average */}
                      <td className="px-3 py-3 text-center font-black text-slate-900 dark:text-slate-100 text-sm">
                        {row.totalMaxScore > 0 ? `${row.overallAverage}%` : "—"}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 text-center">
                        <StatusBadge
                          status={
                            row.status === "Passed"
                              ? "pass"
                              : row.status === "Failed"
                                ? "fail"
                                : "active"
                          }
                          label={tResult(row.status)}
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Explanatory notes */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 dark:text-slate-400 print:text-black">
              <p>
                * <strong>Deterministic Ranking Algorithm:</strong> Computed from total obtained
                score across all assigned class courses. Equal scores share identical rank with
                standard competition skipping (1, 2, 2, 4).
              </p>
              <p className="mt-1 sm:mt-0 font-serif">
                Generated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
