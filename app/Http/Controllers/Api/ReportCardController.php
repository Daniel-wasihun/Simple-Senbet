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
}
