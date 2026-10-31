"use client";

import React, { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { reportsService } from "@/services/reports.service";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  BookOpen,
  RefreshCw,
  Printer,
} from "lucide-react";
import { StudentReportCardData } from "@/types/auth";
import { ReportCardShimmerSkeleton } from "@/components/ui/DashboardShimmerSkeleton";

export default function StudentReportCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reportCard, setReportCard] = useState<StudentReportCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchReportCard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsService.studentReport(id, user?.id);

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You do not have permission to view this report card.");
        }
        if (res.status === 404) {
          throw new Error("Student or report card data not found.");
        }
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to load report card (${res.status})`);
      }

      const json = await res.json();
      setReportCard(json.data || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchReportCard();
    }
  }, [user, id]);

  const formatText = (text: string | { en?: string; am?: string } | undefined | null) => {
    if (!text) return "—";
    if (typeof text === "string") return text;
    return text.en || text.am || "—";
  };

  if (authLoading || (loading && !reportCard)) {
    return <ReportCardShimmerSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Unable to Load Report Card</h2>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={fetchReportCard}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportCard) return null;

  const { student, academic_year, class: schoolClass, section, semester, courses, summary, attendance } = reportCard;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 print:bg-white print:p-0 print:pb-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm 15mm;
              }
              body {
                font-family: 'Noto Sans Ethiopic', 'Abyssinica SIL', 'Nyala', sans-serif, system-ui;
                background-color: #ffffff !important;
                color: #0f172a !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
              .page-break-inside-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `,
        }}
      />

      {/* Top Bar (Hidden on print) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-amber-600" />
              {formatText(academic_year.name)} • {semester.replace("_", " ").toUpperCase()}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
              title="Print official report card document"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 print:p-0 print:max-w-none">
        {/* Print-Only Letterhead */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-slate-900 pb-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-serif">
            Simple Senbet Sunday School (የሰንበት ትምህርት ቤት)
          </h1>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 mt-1">
            Official Student Academic Report Card (የተማሪ የውጤት መግለጫ)
          </h2>
          <div className="flex justify-center gap-6 text-xs text-slate-600 mt-2">
            <span>
              <strong>Academic Year:</strong> {formatText(academic_year.name)}
            </span>
            <span>
              <strong>Term:</strong> {semester.replace("_", " ").toUpperCase()}
            </span>
            <span>
              <strong>Issued Date:</strong> {new Date().toLocaleDateString()}
            </span>
          </div>
          {summary.is_incomplete && (
            <div className="mt-3 py-1.5 px-4 bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs uppercase tracking-wider">
              PROVISIONAL / INCOMPLETE REPORT — NOT AN OFFICIAL FINAL TRANSCRIPT
            </div>
          )}
        </div>
        {/* Student Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Student Report Card
                </span>
                {summary.status === "PASS" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> PASS
                  </span>
                )}
                {summary.status === "FAIL" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> FAIL
                  </span>
                )}
                {summary.status === "INCOMPLETE" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> INCOMPLETE
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {formatText(student.full_name)}
              </h1>
              {student.christian_name && (
                <p className="text-sm text-slate-500">
                  Christian Name: {formatText(student.christian_name)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-medium">Class & Section</p>
                <p className="font-semibold text-slate-800">
                  {formatText(schoolClass.name)} (Sec {section})
                </p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Class Passing Mark</p>
                <p className="font-semibold text-slate-800">{schoolClass.passing_score}%</p>
              </div>
            </div>
          </div>

          {/* Metrics Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-1">Overall Average</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">{summary.overall_average}%</span>
                <span className="text-xs text-slate-400">/ 100%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {summary.failed_courses_count === 0
                  ? "All courses passed"
                  : `${summary.failed_courses_count} course(s) below passing`}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-1">Section Rank</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">
                  {summary.section_rank ? `#${summary.section_rank}` : "—"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {summary.is_incomplete ? "Pending completed marks" : `Within Section ${section}`}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-1">Class Rank</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">
                  {summary.class_rank ? `#${summary.class_rank}` : "—"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {summary.is_incomplete ? "Pending completed marks" : "Across all sections"}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-1">Attendance Rate</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">{attendance.attendance_rate}%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {attendance.present_count} present, {attendance.absent_count} absent
              </p>
            </div>
          </div>
        </div>

        {/* Incomplete Warning Alert */}
        {summary.is_incomplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Incomplete Assessment Records</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                One or more mandatory course assessments have not been recorded for this student. In compliance with
                school policy, final pass/fail determination and official rankings are withheld until all term assessments are submitted.
              </p>
            </div>
          </div>
        )}

        {/* Courses & Subject Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-600" />
              Academic Subject Results
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {summary.total_courses} Courses Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Credit Hr</th>
                  <th className="py-3 px-4 text-center">Score %</th>
                  <th className="py-3 px-4 text-center">Required Min</th>
                  <th className="py-3 px-4 text-center">Result</th>
                  <th className="py-3 px-4">Assessments Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.course_id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{formatText(course.course_name)}</p>
                      <p className="text-xs text-slate-400">{course.course_code}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{course.credit_hour}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-900">{course.percentage}%</span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">{course.passing_score}%</td>
                    <td className="py-3 px-4 text-center">
                      {course.is_incomplete ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Incomplete
                        </span>
                      ) : course.is_passed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {course.assessments.map((ass) => (
                          <span
                            key={ass.assessment_id}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${
                              ass.is_missing
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                            title={`Weight: ${ass.weight_percentage}%`}
                          >
                            <span>{formatText(ass.name)}:</span>
                            <span className="font-semibold">
                              {ass.is_missing ? "Missing (0%)" : `${ass.earned_score}/${ass.total_score}`}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Summary Banner (Informational Only) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              Attendance Participation Summary (Informational)
            </h3>
            <span className="text-xs text-slate-400">
              Score Adjustment: 0.00% (Independent of academic grade)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-400">Total Sessions</p>
              <p className="text-lg font-bold text-slate-800">{attendance.total_sessions}</p>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <p className="text-xs text-emerald-700">Present</p>
              <p className="text-lg font-bold text-emerald-800">{attendance.present_count}</p>
            </div>
            <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
              <p className="text-xs text-rose-700">Absent</p>
              <p className="text-lg font-bold text-rose-800">{attendance.absent_count}</p>
            </div>
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-700">Late</p>
              <p className="text-lg font-bold text-amber-800">{attendance.late_count}</p>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700">Excused</p>
              <p className="text-lg font-bold text-blue-800">{attendance.excused_count}</p>
            </div>
          </div>
        </div>

        {/* Printable Official Signatures Block */}
        <div className="hidden print:grid grid-cols-2 gap-16 mt-12 pt-8 border-t border-slate-300 page-break-inside-avoid">
          <div className="text-center">
            <div className="border-b border-slate-400 pb-1 mb-2 h-12"></div>
            <p className="text-xs font-bold text-slate-800">Class Teacher (የክፍሉ መምህር)</p>
            <p className="text-[11px] text-slate-500">Signature & Date</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-400 pb-1 mb-2 h-12"></div>
            <p className="text-xs font-bold text-slate-800">Academic Director (የትምህርት ክፍል ኃላፊ)</p>
            <p className="text-[11px] text-slate-500">Official Seal & Signature</p>
          </div>
        </div>
      </main>
    </div>
  );
}
