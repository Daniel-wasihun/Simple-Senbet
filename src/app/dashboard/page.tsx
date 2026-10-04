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
import { useLanguage } from "@/context/language-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/common/Card";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function DashboardPage() {
  const { school, currentAcademicYear, getDashboardStats, currentRole } = useSenbet();
  const { t, tClass, tRole, tAttendance } = useLanguage();

  const stats = getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Top Banner / Manuscript folio hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-blue-dark via-brand-blue to-indigo-950 p-6 sm:p-8 text-white shadow-lg border border-blue-800 dark:border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-medium mb-3">
              <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
              <span>{school?.parish_name || "Orthodox Sunday School"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-white">
              {school?.name || t("common.appName")}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-blue-200">
              {t("classes.academicYear")}:{" "}
              <strong>{currentAcademicYear?.name || "2017 ዓ.ም"}</strong> · {t("common.role")}:{" "}
              <span className="capitalize font-semibold text-amber-300">{tRole(currentRole)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/attendance">
              <Button variant="gold" size="sm" className="font-bold shadow-md h-9 text-xs">
                <CalendarCheck className="h-4 w-4 mr-1.5" />
                {t("dashboard.takeAttendance")}
              </Button>
            </Link>
            <Link href="/students">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-400/40 bg-blue-900/60 text-white hover:bg-blue-800 text-xs h-9"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                {t("students.addStudent")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <StatCard
          title={t("dashboard.totalStudents")}
          value={stats.totalStudents}
          icon={Users}
          subtext={t("students.activeCount", { count: stats.totalStudents })}
          variant="primary"
        />

        {/* Total Classes */}
        <StatCard
          title={t("dashboard.totalClasses")}
          value={stats.totalClasses}
          icon={GraduationCap}
          subtext={t("classes.subtitle")}
          variant="gold"
        />

        {/* Total Courses */}
        <StatCard
          title={t("dashboard.totalCourses")}
          value={stats.totalCourses}
          icon={BookOpen}
          subtext={t("courses.subtitle")}
          variant="emerald"
        />

        {/* Today's Attendance Rate */}
        <StatCard
          title={t("dashboard.todayAttendance")}
          value={`${stats.todayAttendance.rate}%`}
          icon={CalendarCheck}
          subtext={`${stats.todayAttendance.present} ${tAttendance("present").toLowerCase()} · ${stats.todayAttendance.absent} ${tAttendance("absent").toLowerCase()}`}
          variant="indigo"
        />
      </div>

      {/* Middle Section: Attendance Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("dashboard.attendanceSummary")}</CardTitle>
                <CardDescription>{t("attendance.subtitle")}</CardDescription>
              </div>
              <Link href="/attendance">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-brand-blue dark:text-blue-400"
                >
                  {t("dashboard.takeAttendance")} <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 text-center">
                <div className="text-xl font-bold text-emerald-800 dark:text-emerald-400">
                  {stats.todayAttendance.present}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400/80 font-medium">
                  {tAttendance("present")}
                </div>
              </div>

              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3 text-center">
                <div className="text-xl font-bold text-rose-800 dark:text-rose-400">
                  {stats.todayAttendance.absent}
                </div>
                <div className="text-xs text-rose-600 dark:text-rose-400/80 font-medium">
                  {tAttendance("absent")}
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 text-center">
                <div className="text-xl font-bold text-amber-800 dark:text-amber-400">
                  {stats.todayAttendance.late}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400/80 font-medium">
                  {tAttendance("late")}
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-3 text-center">
                <div className="text-xl font-bold text-brand-blue dark:text-blue-400">
                  {stats.todayAttendance.permission}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400/80 font-medium">
                  {tAttendance("permission")}
                </div>
              </div>
            </div>

            {/* Attendance Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
                <span>{t("attendance.rate")}</span>
                <span>{stats.todayAttendance.rate}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-blue to-brand-gold rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, stats.todayAttendance.rate))}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Launch & Workflow Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>{t("common.appName")} Tasks</CardTitle>
            <CardDescription>{t("dashboard.recentResults")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link
              href="/attendance"
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-all text-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-blue-100 dark:bg-blue-950 text-brand-blue dark:text-blue-400 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-blue dark:group-hover:text-blue-400">
                  {t("dashboard.takeAttendance")}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-blue" />
            </Link>

            <Link
              href="/results"
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-all text-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 flex items-center justify-center">
                  <Award className="h-4 w-4" />
                </div>
                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-blue dark:group-hover:text-blue-400">
                  {t("results.title")}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-blue" />
            </Link>

            <Link
              href="/roster"
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-all text-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-blue dark:group-hover:text-blue-400">
                  {t("roster.title")}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-blue" />
            </Link>

            <Link
              href="/students"
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-all text-sm group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-400 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-blue dark:group-hover:text-blue-400">
                  {t("students.title")}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-blue" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Summary Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("dashboard.classPerformance")}</CardTitle>
            <CardDescription>{t("classes.subtitle")}</CardDescription>
          </div>
          <Link href="/classes">
            <Button variant="outline" size="sm" className="text-xs">
              {t("classes.title")} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">{t("classes.className")}</th>
                  <th className="px-4 py-3">{t("classes.students")}</th>
                  <th className="px-4 py-3">{t("roster.average")}</th>
                  <th className="px-4 py-3">{t("attendance.rate")}</th>
                  <th className="px-4 py-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {stats.classSummary.map((cls) => (
                  <tr key={cls.classId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      <Link
                        href={`/classes/${cls.classId}`}
                        className="hover:text-brand-blue dark:hover:text-blue-400 hover:underline"
                      >
                        {tClass(cls.className)}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {t("students.activeCount", { count: cls.studentCount })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {cls.averageScore > 0 ? `${cls.averageScore}%` : "—"}
                        </span>
                        {cls.averageScore >= 75 ? (
                          <StatusBadge status="pass" size="sm" />
                        ) : cls.averageScore >= 50 ? (
                          <StatusBadge status="pass" size="sm" />
                        ) : cls.averageScore > 0 ? (
                          <StatusBadge status="fail" size="sm" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {cls.attendanceRate}%
                        </span>
                        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-brand-blue dark:bg-blue-500 rounded-full"
                            style={{ width: `${cls.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/roster?classId=${cls.classId}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-brand-blue dark:text-blue-400"
                          >
                            {t("roster.title")}
                          </Button>
                        </Link>
                        <Link href={`/attendance?classId=${cls.classId}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-amber-700 dark:text-amber-400"
                          >
                            {t("attendance.title")}
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
