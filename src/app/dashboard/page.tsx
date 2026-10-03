"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  ArrowRight,
  UserPlus,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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

export default function DashboardPage() {
  const { school, currentAcademicYear, getDashboardStats, currentRole } = useSenbet();

  const stats = getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Top Banner / Manuscript folio hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-lg border border-blue-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-medium mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>{school?.parish_name || "Orthodox Sunday School"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-white">
              {school?.name || "ደብረ መዊዕ ቅዱስ ጊዮርጊስ ሰንበት ትምህርት ቤት"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-blue-200">
              Academic Term: <strong>{currentAcademicYear?.name || "2017 ዓ.ም"}</strong> · Role:{" "}
              <span className="capitalize font-semibold text-amber-300">{currentRole}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/attendance">
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold shadow-md text-xs h-9"
              >
                <CalendarCheck className="h-4 w-4 mr-1.5" />
                Today&apos;s Roll-Call
              </Button>
            </Link>
            <Link href="/students">
              <Button
                size="sm"
                variant="outline"
                className="border-blue-700 bg-blue-900/60 text-white hover:bg-blue-800 text-xs h-9"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Register Student
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalStudents}</div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">Active</span> in Sunday School
            </p>
          </CardContent>
        </Card>

        {/* Total Classes */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Classes
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <GraduationCap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalClasses}</div>
            <p className="text-[11px] text-slate-500 mt-1 text-slate-500">Preschool to Grade 12</p>
          </CardContent>
        </Card>

        {/* Total Courses */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Courses & Subjects
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalCourses}</div>
            <p className="text-[11px] text-slate-500 mt-1 text-slate-500">
              Bible, Mezmur, History, Faith
            </p>
          </CardContent>
        </Card>

        {/* Today's Attendance Rate */}
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Today&apos;s Attendance
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.todayAttendance.rate}%</div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-600 font-semibold">
                {stats.todayAttendance.present} present
              </span>{" "}
              ·
              <span className="text-rose-600 font-semibold">
                {stats.todayAttendance.absent} absent
              </span>{" "}
              ·
              <span className="text-amber-600 font-semibold">
                {stats.todayAttendance.late} late
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Attendance Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Summary */}
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-900">Attendance Overview</CardTitle>
                <CardDescription>
                  Daily attendance roll-call summary for the active term
                </CardDescription>
              </div>
              <Link href="/attendance">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-800 hover:bg-blue-50"
                >
                  Open Roll-Call <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                <div className="text-xl font-bold text-emerald-800">
                  {stats.todayAttendance.present}
                </div>
                <div className="text-xs text-emerald-600">Present (ተገኝቷል)</div>
              </div>
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center">
                <div className="text-xl font-bold text-rose-800">
                  {stats.todayAttendance.absent}
                </div>
                <div className="text-xs text-rose-600">Absent (ቀረ)</div>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                <div className="text-xl font-bold text-amber-800">{stats.todayAttendance.late}</div>
                <div className="text-xs text-amber-600">Late (አርፍዷል)</div>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
                <div className="text-xl font-bold text-blue-800">
                  {stats.todayAttendance.permission}
                </div>
                <div className="text-xs text-blue-600">Permission (በፈቃድ)</div>
              </div>
            </div>

            {/* Attendance Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
                <span>Daily Roll-call Completion Rate</span>
                <span>{stats.todayAttendance.rate}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-700 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, stats.todayAttendance.rate))}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Launch & Workflow Checklist */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Senbet Quick Tasks</CardTitle>
            <CardDescription>Direct shortcuts to high-frequency actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link
              href="/attendance"
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <span className="font-medium text-slate-800 group-hover:text-blue-900">
                  Take Class Attendance
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-700" />
            </Link>

            <Link
              href="/results"
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Award className="h-4 w-4" />
                </div>
                <span className="font-medium text-slate-800 group-hover:text-blue-900">
                  Record Assessment Scores
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-700" />
            </Link>

            <Link
              href="/roster"
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <span className="font-medium text-slate-800 group-hover:text-blue-900">
                  View Roster & Rankings
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-700" />
            </Link>

            <Link
              href="/students"
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <span className="font-medium text-slate-800 group-hover:text-blue-900">
                  Manage Student Registry
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-700" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Summary Table */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-slate-900">Class Performance Summary</CardTitle>
            <CardDescription>
              Overview of enrolled students, average score, and attendance by class
            </CardDescription>
          </div>
          <Link href="/classes">
            <Button variant="outline" size="sm" className="text-xs">
              Manage Classes <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Class Average Score</TableHead>
                <TableHead>Attendance Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.classSummary.map((cls) => (
                <TableRow key={cls.classId}>
                  <TableCell className="font-semibold text-slate-900">
                    <Link
                      href={`/classes/${cls.classId}`}
                      className="hover:text-blue-800 hover:underline"
                    >
                      {cls.className}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {cls.studentCount} students
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {cls.averageScore > 0 ? `${cls.averageScore}%` : "—"}
                      </span>
                      {cls.averageScore >= 75 ? (
                        <Badge variant="success" className="text-[10px]">
                          High
                        </Badge>
                      ) : cls.averageScore >= 50 ? (
                        <Badge variant="default" className="text-[10px]">
                          Good
                        </Badge>
                      ) : cls.averageScore > 0 ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Needs Attention
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{cls.attendanceRate}%</span>
                      <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-700 rounded-full"
                          style={{ width: `${cls.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/roster?classId=${cls.classId}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-blue-700 hover:bg-blue-50"
                        >
                          Roster
                        </Button>
                      </Link>
                      <Link href={`/attendance?classId=${cls.classId}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50"
                        >
                          Attendance
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
