<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\AcademicYear;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Services\GradebookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportCardController extends Controller
{
    public function __construct(protected GradebookService $gradebookService) {}

    /**
     * Get an individual student's report card.
     */
    public function showStudent(Request $request, Member $student): JsonResponse
    {
        $this->authorize('report-card.view-student', $student);

        // 2. Resolve Academic Year and Semester
        $academicYearId = $this->resolveAcademicYearId($request);

        $semester = (string) $request->query('semester', 'semester_1');

        $reportCard = $this->gradebookService->generateStudentReportCard($student->id, $academicYearId, $semester);

        return ApiResponse::success($reportCard, 'Student report card retrieved successfully');
    }

    /**
     * Get class gradebook with rankings across all sections.
     */
    public function showClass(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $this->authorize('report-card.view-class', $schoolClass);

        // 2. Resolve Academic Year and Semester
        $academicYearId = $this->resolveAcademicYearId($request);

        $semester = (string) $request->query('semester', 'semester_1');
        $section = $request->query('section');

        $gradebook = $this->gradebookService->generateClassGradebook(
            $schoolClass->id,
            $academicYearId,
            $semester,
            $section ? (string) $section : null
        );

        return ApiResponse::success($gradebook, 'Class gradebook retrieved successfully');
    }

    /**
     * Export class gradebook as CSV with UTF-8 BOM and formula injection protection.
     */
    public function exportCsv(Request $request, SchoolClass $schoolClass): StreamedResponse|JsonResponse
    {
        $user = $request->user();
        $this->authorize('report-card.export-class', $schoolClass);

        // 2. Resolve Academic Year and Semester
        $academicYearId = $this->resolveAcademicYearId($request);

        $semester = (string) $request->query('semester', 'semester_1');
        $section = $request->query('section');

        $gradebook = $this->gradebookService->generateClassGradebook(
            $schoolClass->id,
            $academicYearId,
            $semester,
            $section ? (string) $section : null
        );

        $filename = sprintf('gradebook-class-%d-%d-%s.csv', $schoolClass->id, $academicYearId, $semester);
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($gradebook) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel compatibility with Amharic/Ge'ez text
            fwrite($handle, "\xEF\xBB\xBF");

            // CSV Header
            fputcsv($handle, [
                'Student ID',
                'Full Name',
                'Section',
                'Overall Average (%)',
                'Status',
                'Section Rank',
                'Class Rank',
                'Failed Courses',
                'Attendance Rate (%)',
            ]);

            foreach ($gradebook['students'] as $item) {
                $studentInfo = $item['student'] ?? [];
                $summary = $item['summary'] ?? [];
                $attendance = $item['attendance'] ?? [];

                $fullName = $this->formatTextValue($studentInfo['full_name'] ?? '');

                fputcsv($handle, [
                    $this->sanitizeCsvCell($studentInfo['id'] ?? ''),
                    $this->sanitizeCsvCell($fullName),
                    $this->sanitizeCsvCell($item['section'] ?? ''),
                    $this->sanitizeCsvCell($summary['overall_average'] ?? '0.00'),
                    $this->sanitizeCsvCell($summary['status'] ?? 'INCOMPLETE'),
                    $this->sanitizeCsvCell($summary['section_rank'] ?? 'N/A'),
                    $this->sanitizeCsvCell($summary['class_rank'] ?? 'N/A'),
                    $this->sanitizeCsvCell($summary['failed_courses_count'] ?? 0),
                    $this->sanitizeCsvCell($attendance['attendance_rate'] ?? '0.00'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Format potentially localized text value.
     */
    private function formatTextValue(mixed $value): string
    {
        if (is_array($value)) {
            return $value['am'] ?? $value['en'] ?? (string) reset($value);
        }

        return (string) ($value ?? '');
    }

    /**
     * Format bilingual text label (English and Amharic).
     */
    private function formatBilingualText(mixed $value): string
    {
        if (is_array($value)) {
            $en = $value['en'] ?? null;
            $am = $value['am'] ?? null;
            if ($en && $am && $en !== $am) {
                return "{$en} ({$am})";
            }

            return $am ?? $en ?? (string) reset($value);
        }

        return (string) ($value ?? '');
    }

    /**
     * Sanitize cell value against CSV Formula Injection (=, +, -, @).
     */
    private function sanitizeCsvCell(mixed $value): string
    {
        $str = (string) ($value ?? '');
        if (str_starts_with($str, '=') || str_starts_with($str, '+') || str_starts_with($str, '-') || str_starts_with($str, '@')) {
            return "'".$str;
        }

        return $str;
    }

    /**
     * Resolve academic year ID from request or fallback to current/latest active year.
     */
    private function resolveAcademicYearId(Request $request): int
    {
        if ($request->filled('academic_year_id')) {
            return (int) $request->query('academic_year_id');
        }

        return (int) (AcademicYear::where('is_current', true)->value('id')
            ?? AcademicYear::latest('id')->value('id')
            ?? 1);
    }

    /**
     * Export printable class gradebook HTML document (optimized for browser printing & PDF export).
     */
    public function exportPrint(Request $request, SchoolClass $schoolClass): Response|JsonResponse
    {
        $this->authorize('report-card.export-class', $schoolClass);

        // 2. Resolve Academic Year and Semester
        $academicYearId = $this->resolveAcademicYearId($request);

        $academicYear = AcademicYear::find($academicYearId);
        $semester = (string) $request->query('semester', 'semester_1');
        $section = $request->query('section');

        $gradebook = $this->gradebookService->generateClassGradebook(
            $schoolClass->id,
            $academicYearId,
            $semester,
            $section ? (string) $section : null
        );

        $className = htmlspecialchars($this->formatBilingualText($schoolClass->name), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $yearName = htmlspecialchars($academicYear ? $this->formatBilingualText($academicYear->name) : 'Academic Year '.$academicYearId, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $semesterLabel = htmlspecialchars(strtoupper(str_replace('_', ' ', $semester)), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $generatedAt = htmlspecialchars(date('Y-m-d H:i'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        // Build HTML table rows
        $rowsHtml = '';
        foreach ($gradebook['students'] as $item) {
            $student = $item['student'] ?? [];
            $summary = $item['summary'] ?? [];
            $attendance = $item['attendance'] ?? [];
            $studentId = (int) ($student['id'] ?? 0);
            $fullName = htmlspecialchars($this->formatTextValue($student['full_name'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $section = htmlspecialchars((string) ($item['section'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $statusRaw = (string) ($summary['status'] ?? 'INCOMPLETE');
            $statusBadgeClass = match ($statusRaw) {
                'PASS' => 'status-pass',
                'FAIL' => 'status-fail',
                default => 'status-incomplete',
            };
            $status = htmlspecialchars($statusRaw, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

            $sectionRank = htmlspecialchars((string) ($summary['section_rank'] ? '#'.$summary['section_rank'] : '—'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $classRank = htmlspecialchars((string) ($summary['class_rank'] ? '#'.$summary['class_rank'] : '—'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $average = (float) ($summary['overall_average'] ?? 0);
            $failedCount = (int) ($summary['failed_courses_count'] ?? 0);
            $attendanceRate = (float) ($attendance['attendance_rate'] ?? 0);

            $rowsHtml .= "
                <tr>
                    <td>{$studentId}</td>
                    <td class='student-name'>{$fullName}</td>
                    <td class='text-center'>{$section}</td>
                    <td class='text-center font-bold'>{$average}%</td>
                    <td class='text-center'><span class='badge {$statusBadgeClass}'>{$status}</span></td>
                    <td class='text-center'>{$sectionRank}</td>
                    <td class='text-center'>{$classRank}</td>
                    <td class='text-center'>{$failedCount}</td>
                    <td class='text-center'>{$attendanceRate}%</td>
                </tr>
            ";
        }

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gradebook - {$className} ({$yearName})</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 12mm 15mm;
        }
        body {
            font-family: 'Noto Sans Ethiopic', 'Abyssinica SIL', 'Nyala', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 24px;
            color: #1e293b;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
        }
        .header h2 {
            margin: 4px 0 0;
            font-size: 14px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .meta-bar {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-top: 10px;
            color: #475569;
        }
        .controls {
            margin-bottom: 16px;
            text-align: right;
        }
        .btn-print {
            background-color: #d97706;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-print:hover {
            background-color: #b45309;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        th, td {
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
        }
        th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
        }
        .student-name {
            font-weight: 600;
            color: #0f172a;
        }
        .text-center {
            text-align: center;
        }
        .font-bold {
            font-weight: 700;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
        }
        .status-pass {
            background-color: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }
        .status-fail {
            background-color: #ffe4e6;
            color: #be123c;
            border: 1px solid #fca5a5;
        }
        .status-incomplete {
            background-color: #fef3c7;
            color: #b45309;
            border: 1px solid #fde68a;
        }
        .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 40px;
            padding-top: 20px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .signature-box {
            text-align: center;
            width: 260px;
        }
        .signature-line {
            border-bottom: 1px solid #64748b;
            height: 36px;
            margin-bottom: 8px;
        }
        .signature-title {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
        }
        .signature-sub {
            font-size: 11px;
            color: #64748b;
        }
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="controls no-print">
        <button class="btn-print" onclick="window.print()">Print / Export PDF</button>
    </div>

    <div class="header">
        <h1>Simple Senbet Sunday School (የሰንበት ትምህርት ቤት)</h1>
        <h2>Official Class Academic Gradebook (የክፍል የውጤት መዝገብ)</h2>
        <div class="meta-bar">
            <span><strong>Class:</strong> {$className}</span>
            <span><strong>Academic Year:</strong> {$yearName}</span>
            <span><strong>Term:</strong> {$semesterLabel}</span>
            <span><strong>Generated:</strong> {$generatedAt}</span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 60px;">ID</th>
                <th>Student Full Name</th>
                <th style="width: 70px;">Section</th>
                <th style="width: 100px;">Average (%)</th>
                <th style="width: 100px;">Status</th>
                <th style="width: 90px;">Sec Rank</th>
                <th style="width: 90px;">Class Rank</th>
                <th style="width: 90px;">Failed Subj</th>
                <th style="width: 100px;">Attendance</th>
            </tr>
        </thead>
        <tbody>
            {$rowsHtml}
        </tbody>
    </table>

    <div class="signatures">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-title">Class Teacher (የክፍሉ መምህር)</div>
            <div class="signature-sub">Signature & Date</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-title">Academic Director (የትምህርት ክፍል ኃላፊ)</div>
            <div class="signature-sub">Official Seal & Signature</div>
        </div>
    </div>
</body>
</html>
HTML;

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }
}
