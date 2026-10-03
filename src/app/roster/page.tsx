"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { FileSpreadsheet, Printer, GraduationCap } from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
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
import { EmptyState } from "@/components/ui/empty-state";
import { formatScore, getOrdinalRank } from "@/lib/utils";

export default function ClassRosterPage() {
  const { classes, courses, getClassRoster, currentAcademicYear, school } = useSenbet();

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-800" />
            <span>Class Performance Roster & Deterministic Ranking</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            የክፍል ደረጃ ሮስተር — ድምር ውጤት፣ አማካይ በመቶኛ፣ ደረጃ እና የክትትል ማጠቃለያ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs h-9 flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Print Official Roster</span>
          </Button>
          <Link href="/results">
            <Button size="sm" className="bg-blue-800 hover:bg-blue-900 text-white text-xs h-9">
              Enter Results
            </Button>
          </Link>
        </div>
      </div>

      {/* Class Selector Filter (Hidden when printing) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs max-w-md print:hidden flex items-center space-x-2">
        <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full text-xs sm:text-sm font-semibold border border-slate-200 rounded-md p-1.5 bg-slate-50 text-slate-800 outline-none cursor-pointer"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.level_category || "General"})
            </option>
          ))}
        </select>
      </div>

      {/* Printable Sheet Header (Visible on screen and in print) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="text-center pb-4 mb-4 border-b border-slate-200">
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            {school?.name || "ደብረ መዊዕ ቅዱስ ጊዮርጊስ ሰንበት ትምህርት ቤት"}
          </h2>
          <p className="text-xs text-slate-600 font-serif">{school?.parish_name} · የትምህርት ክፍል</p>
          <div className="mt-2 inline-flex items-center gap-3 text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
            <span>
              Class: <strong>{selectedClass?.name}</strong>
            </span>
            <span>·</span>
            <span>
              Academic Year: <strong>{currentAcademicYear?.name}</strong>
            </span>
            <span>·</span>
            <span>
              Total Students: <strong>{rosterEntries.length}</strong>
            </span>
          </div>
        </div>

        {rosterEntries.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet className="h-8 w-8 text-slate-400" />}
            title="No students found for this class"
            description="Enroll students into this class to generate performance rosters and deterministic rank reports."
            action={
              <Link href="/students">
                <Button className="bg-blue-800 text-white">Enroll Students</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/80">
                  <TableHead className="w-16 text-center font-bold text-slate-900">Rank</TableHead>
                  <TableHead className="w-28">Student ID</TableHead>
                  <TableHead className="min-w-[160px]">Student Name (ስም)</TableHead>
                  <TableHead className="w-24 text-center">Attendance</TableHead>

                  {/* Dynamic course columns */}
                  {classCourses.map((c) => (
                    <TableHead key={c.id} className="text-center min-w-[90px]">
                      <div className="truncate max-w-[110px]" title={c.name}>
                        {c.name.split(" ")[0]}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">Score</span>
                    </TableHead>
                  ))}

                  <TableHead className="w-24 text-center font-bold text-slate-900">
                    Total Marks
                  </TableHead>
                  <TableHead className="w-24 text-center font-bold text-slate-900">
                    Average %
                  </TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosterEntries.map((row) => {
                  const isTopOne = row.rank === 1;
                  const isTopTwo = row.rank === 2;
                  const isTopThree = row.rank === 3;

                  return (
                    <TableRow
                      key={row.student.id}
                      className={isTopOne ? "bg-amber-50/50 hover:bg-amber-50" : ""}
                    >
                      {/* Deterministic Rank */}
                      <TableCell className="text-center font-bold">
                        {isTopOne ? (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-blue-950 font-black shadow-xs text-xs">
                            1st 🥇
                          </span>
                        ) : isTopTwo ? (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-200 text-slate-800 font-bold text-xs">
                            2nd 🥈
                          </span>
                        ) : isTopThree ? (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                            3rd 🥉
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 font-mono">
                            {getOrdinalRank(row.rank)}
                          </span>
                        )}
                      </TableCell>

                      {/* Student ID */}
                      <TableCell className="font-mono text-xs font-semibold text-slate-600">
                        {row.student.student_id}
                      </TableCell>

                      {/* Student Name */}
                      <TableCell className="font-semibold text-slate-900">
                        {row.student.full_name}
                      </TableCell>

                      {/* Attendance Summary */}
                      <TableCell className="text-center text-xs">
                        <span className="font-medium text-slate-800">
                          {row.attendance.attendanceRate}%
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {row.attendance.present}p / {row.attendance.totalDays}d
                        </div>
                      </TableCell>

                      {/* Course Scores */}
                      {classCourses.map((c) => {
                        const scoreData = row.courseScores[c.id];
                        return (
                          <TableCell key={c.id} className="text-center font-mono text-xs">
                            {scoreData && scoreData.maxPossibleScore > 0 ? (
                              <div>
                                <span className="font-bold text-slate-900">
                                  {formatScore(scoreData.obtainedScore)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  /{scoreData.maxPossibleScore}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </TableCell>
                        );
                      })}

                      {/* Total Obtained */}
                      <TableCell className="text-center font-bold font-mono text-slate-900 bg-slate-50/70">
                        {formatScore(row.totalObtainedScore)}
                        {row.totalMaxScore > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            /{row.totalMaxScore}
                          </span>
                        )}
                      </TableCell>

                      {/* Overall Average */}
                      <TableCell className="text-center font-black text-slate-900 text-sm">
                        {row.totalMaxScore > 0 ? `${row.overallAverage}%` : "—"}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            row.status === "Passed"
                              ? "success"
                              : row.status === "Failed"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {row.status === "Passed"
                            ? "Passed (አልፏል)"
                            : row.status === "Failed"
                              ? "Failed (ወድቋል)"
                              : "In Progress"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Explanatory notes */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
              <p>
                * <strong>Deterministic Ranking Algorithm:</strong> Computed from total obtained
                score across all assigned class courses. Equal scores share the identical rank with
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
