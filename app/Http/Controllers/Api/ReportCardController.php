<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\AcademicYear;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Services\GradebookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportCardController extends Controller
{
    public function __construct(protected GradebookService $gradebookService) {}

    /**
     * Get an individual student's report card.
     */
    public function showStudent(Request $request, Member $student): JsonResponse
    {
        $user = $request->user();

        // 1. Authorization: Admins or assigned teachers
        $isAdmin = $user->hasRole(['superadmin', 'academic_director', 'academic_administrator']);
        if (! $isAdmin) {
            $isAssigned = TeachingAssignment::where('teacher_id', $user->id)
                ->where('class_id', $student->class_id)
                ->when($student->section, function ($query, $section) {
                    $query->where(function ($q) use ($section) {
                        $q->whereNull('section')->orWhere('section', $section);
                    });
                })
                ->exists();

            if (! $isAssigned) {
                return ApiResponse::forbidden('You do not have permission to view this student report card.');
            }
        }

        // 2. Resolve Academic Year and Semester
        $academicYearId = (int) $request->query('academic_year_id', function () {
            return AcademicYear::where('is_current', true)->value('id') ?? AcademicYear::latest('id')->value('id') ?? 1;
        });

        $semester = (string) $request->query('semester', 'semester_1');

        $reportCard = $this->gradebookService->generateStudentReportCard($student->id, $academicYearId, $semester);

        return ApiResponse::success($reportCard, 'Student report card retrieved successfully');
    }

    /**
     * Get class gradebook with rankings across all sections.
     */
    public function showClass(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $user = $request->user();

        // 1. Authorization: Admins or assigned teachers for this class
        $isAdmin = $user->hasRole(['superadmin', 'academic_director', 'academic_administrator']);
        if (! $isAdmin) {
            $isAssigned = TeachingAssignment::where('teacher_id', $user->id)
                ->where('class_id', $schoolClass->id)
                ->exists();

            if (! $isAssigned) {
                return ApiResponse::forbidden('You do not have permission to view this class gradebook.');
            }
        }

        // 2. Resolve Academic Year and Semester
        $academicYearId = (int) $request->query('academic_year_id', function () {
            return AcademicYear::where('is_current', true)->value('id') ?? AcademicYear::latest('id')->value('id') ?? 1;
        });

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
    public function exportCsv(Request $request, SchoolClass $schoolClass): \Symfony\Component\HttpFoundation\StreamedResponse|JsonResponse
    {
        $user = $request->user();

        // 1. Authorization: Admins or assigned teachers for this class
        $isAdmin = $user->hasRole(['superadmin', 'academic_director', 'academic_administrator']);
        if (! $isAdmin) {
            $isAssigned = TeachingAssignment::where('teacher_id', $user->id)
                ->where('class_id', $schoolClass->id)
                ->exists();

            if (! $isAssigned) {
                return ApiResponse::forbidden('You do not have permission to export this class gradebook.');
            }
        }

        // 2. Resolve Academic Year and Semester
        $academicYearId = (int) $request->query('academic_year_id', function () {
            return AcademicYear::where('is_current', true)->value('id') ?? AcademicYear::latest('id')->value('id') ?? 1;
        });

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
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
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
     * Sanitize cell value against CSV Formula Injection (=, +, -, @).
     */
    private function sanitizeCsvCell(mixed $value): string
    {
        $str = (string) ($value ?? '');
        if (str_starts_with($str, '=') || str_starts_with($str, '+') || str_starts_with($str, '-') || str_starts_with($str, '@')) {
            return "'" . $str;
        }
        return $str;
    }
}

