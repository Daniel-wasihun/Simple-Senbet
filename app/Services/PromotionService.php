<?php

namespace App\Services;

use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PromotionService
{
    public function __construct(
        protected GradebookService $gradebookService,
        protected StudentEnrollmentService $enrollmentService
    ) {}

    /**
     * Evaluate a student's academic standing and determine promotion, retention, or graduation.
     *
     * @param  array<int, int>  $classMappings  Optional explicit mapping from current_class_id to next_class_id
     */
    public function evaluateStudent(
        int $memberId,
        int $academicYearId,
        string $evaluationMode = 'annual',
        array $classMappings = []
    ): array {
        $student = Member::with('schoolClass')->findOrFail($memberId);
        $academicYear = AcademicYear::findOrFail($academicYearId);

        // Find student enrollment context for the current academic year
        $enrollment = StudentEnrollment::where('member_id', $memberId)
            ->where('academic_year_id', $academicYearId)
            ->whereNull('end_date')
            ->first();

        if (! $enrollment) {
            // Check if there is any historical enrollment for this year
            $enrollment = StudentEnrollment::where('member_id', $memberId)
                ->where('academic_year_id', $academicYearId)
                ->latest('id')
                ->first();
        }

        $currentClassId = (int) ($enrollment?->class_id ?? $student->class_id);
        $section = (string) ($enrollment?->section ?? $student->section ?? 'A');

        $schoolClass = SchoolClass::with('nextClass')->findOrFail($currentClassId);
        $passingScore = (float) $schoolClass->passing_score;

        // Resolve target class: check payload classMappings first, then fallback to model's next_class_id
        $targetNextClassId = $classMappings[$currentClassId] ?? $schoolClass->next_class_id;
        $targetNextClass = $targetNextClassId ? SchoolClass::find($targetNextClassId) : null;

        // Generate report card(s) based on evaluation mode
        $evaluationData = $this->calculateAcademicSummary($memberId, $academicYearId, $evaluationMode);

        $overallAverage = $evaluationData['overall_average'];
        $failedCoursesCount = $evaluationData['failed_courses_count'];
        $isIncomplete = $evaluationData['is_incomplete'];
        $isPassed = $evaluationData['is_passed'];

        // Determine Promotion Decision
        if ($isIncomplete) {
            $decision = 'INCOMPLETE';
            $proposedClassId = null;
            $proposedClassName = null;
            $reason = 'Student has incomplete coursework, unrecorded assessments, or missing report card marks.';
        } elseif ($isPassed) {
            if ($targetNextClass !== null) {
                $decision = 'PROMOTED';
                $proposedClassId = $targetNextClass->id;
                $proposedClassName = $targetNextClass->name;
                $reason = "Promoted to {$targetNextClass->code}: Achieved annual average of {$overallAverage}% (Passing threshold: {$passingScore}%).";
            } else {
                $decision = 'GRADUATED';
                $proposedClassId = null;
                $proposedClassName = null;
                $reason = "Graduated: Successfully completed terminal class level ({$schoolClass->code}) with annual average of {$overallAverage}%.";
            }
        } else {
            $decision = 'RETAINED';
            $proposedClassId = $currentClassId;
            $proposedClassName = $schoolClass->name;
            $reason = "Retained in {$schoolClass->code}: Average {$overallAverage}% was below passing threshold of {$passingScore}%.";
        }

        return [
            'student' => [
                'id' => $student->id,
                'full_name' => $student->full_name,
                'christian_name' => $student->christian_name,
            ],
            'current_academic_year' => [
                'id' => $academicYear->id,
                'name' => $academicYear->name,
            ],
            'current_class' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'code' => $schoolClass->code,
                'passing_score' => $passingScore,
            ],
            'current_section' => $section,
            'evaluation_mode' => $evaluationMode,
            'academic_summary' => [
                'overall_average' => $overallAverage,
                'passing_score' => $passingScore,
                'failed_courses_count' => $failedCoursesCount,
                'is_passed' => $isPassed,
                'is_incomplete' => $isIncomplete,
                'details' => $evaluationData['details'],
            ],
            'decision' => $decision,
            'proposed_class_id' => $proposedClassId,
            'proposed_class_name' => $proposedClassName,
            'proposed_section' => $section,
            'reason' => $reason,
        ];
    }

    /**
     * Dry-run promotion simulation for a cohort without modifying the database.
     *
     * @param  array<int, int>  $classMappings
     */
    public function dryRunPromotion(
        int $currentAcademicYearId,
        int $nextAcademicYearId,
        ?int $classId = null,
        string $evaluationMode = 'annual',
        array $classMappings = []
    ): array {
        $this->validateAcademicYears($currentAcademicYearId, $nextAcademicYearId);

        $studentsQuery = StudentEnrollment::query()
            ->where('academic_year_id', $currentAcademicYearId)
            ->whereNull('end_date')
            ->when($classId, fn ($q, $cid) => $q->where('class_id', $cid));

        $enrollments = $studentsQuery->get();

        $decisions = [];
        $counts = [
            'total_students' => 0,
            'promoted' => 0,
            'retained' => 0,
            'graduated' => 0,
            'incomplete' => 0,
            'already_enrolled_in_target_year' => 0,
        ];

        foreach ($enrollments as $enrollment) {
            $studentId = (int) $enrollment->member_id;

            // Check if student already has active enrollment in the target academic year
            $alreadyEnrolled = StudentEnrollment::where('member_id', $studentId)
                ->where('academic_year_id', $nextAcademicYearId)
                ->whereNull('end_date')
                ->exists();

            $evaluation = $this->evaluateStudent($studentId, $currentAcademicYearId, $evaluationMode, $classMappings);
            $evaluation['already_enrolled_in_target_year'] = $alreadyEnrolled;

            $counts['total_students']++;

            if ($alreadyEnrolled) {
                $counts['already_enrolled_in_target_year']++;
            }

            match ($evaluation['decision']) {
                'PROMOTED' => $counts['promoted']++,
                'RETAINED' => $counts['retained']++,
                'GRADUATED' => $counts['graduated']++,
                'INCOMPLETE' => $counts['incomplete']++,
                default => null,
            };

            $decisions[] = $evaluation;
        }

        return [
            'simulation' => true,
            'current_academic_year_id' => $currentAcademicYearId,
            'next_academic_year_id' => $nextAcademicYearId,
            'filter_class_id' => $classId,
            'evaluation_mode' => $evaluationMode,
            'statistics' => $counts,
            'decisions' => $decisions,
        ];
    }

    /**
     * Atomically execute year-end class promotion and retention rollover.
     *
     * @param  array<int, int>  $classMappings
     * @param  array<int, array{decision?: string, target_class_id?: int, reason?: string}>  $overrides
     */
    public function commitPromotion(
        int $currentAcademicYearId,
        int $nextAcademicYearId,
        ?int $classId = null,
        string $evaluationMode = 'annual',
        array $classMappings = [],
        array $overrides = []
    ): array {
        $this->validateAcademicYears($currentAcademicYearId, $nextAcademicYearId);

        $currentYear = AcademicYear::findOrFail($currentAcademicYearId);
        $nextYear = AcademicYear::findOrFail($nextAcademicYearId);

        $closeDate = Carbon::parse($currentYear->end_date)->toDateString();
        $startDate = Carbon::parse($nextYear->start_date)->toDateString();

        return DB::transaction(function () use (
            $currentAcademicYearId,
            $nextAcademicYearId,
            $classId,
            $evaluationMode,
            $classMappings,
            $overrides,
            $closeDate,
            $startDate
        ) {
            $enrollments = StudentEnrollment::query()
                ->where('academic_year_id', $currentAcademicYearId)
                ->whereNull('end_date')
                ->when($classId, fn ($q, $cid) => $q->where('class_id', $cid))
                ->lockForUpdate()
                ->get();

            $processed = [];
            $skipped = [];

            foreach ($enrollments as $enrollment) {
                $studentId = (int) $enrollment->member_id;
                $student = Member::where('id', $studentId)->lockForUpdate()->firstOrFail();

                // Check idempotency: if already enrolled in next academic year, skip
                $alreadyEnrolled = StudentEnrollment::where('member_id', $studentId)
                    ->where('academic_year_id', $nextAcademicYearId)
                    ->whereNull('end_date')
                    ->exists();

                if ($alreadyEnrolled) {
                    $skipped[] = [
                        'student_id' => $studentId,
                        'reason' => 'Student already has an active enrollment in the target academic year.',
                    ];
                    continue;
                }

                $evaluation = $this->evaluateStudent($studentId, $currentAcademicYearId, $evaluationMode, $classMappings);
                $decision = $evaluation['decision'];
                $targetClassId = $evaluation['proposed_class_id'];
                $section = (string) ($evaluation['proposed_section'] ?? 'A');
                $reason = $evaluation['reason'];

                // Apply administrative override if present
                if (isset($overrides[$studentId])) {
                    $override = $overrides[$studentId];
                    if (! empty($override['decision'])) {
                        $decision = strtoupper((string) $override['decision']);
                    }
                    if (isset($override['target_class_id'])) {
                        $targetClassId = (int) $override['target_class_id'];
                    }
                    if (! empty($override['reason'])) {
                        $reason = 'Override: '.$override['reason'];
                    }
                }

                // If still incomplete and no override provided, cannot promote automatically
                if ($decision === 'INCOMPLETE') {
                    $skipped[] = [
                        'student_id' => $studentId,
                        'reason' => 'Student has incomplete coursework or missing report card marks.',
                    ];
                    continue;
                }

                // 1. Close current academic year enrollment
                $enrollment->update([
                    'end_date' => $closeDate,
                    'transfer_reason' => "Year-end: {$decision} — {$reason}",
                ]);

                // 2. Perform next year rollover action based on decision
                if ($decision === 'PROMOTED' || $decision === 'RETAINED') {
                    if (! $targetClassId) {
                        $targetClassId = $enrollment->class_id;
                    }

                    // Verify target class exists
                    SchoolClass::findOrFail($targetClassId);

                    StudentEnrollment::create([
                        'member_id' => $studentId,
                        'academic_year_id' => $nextAcademicYearId,
                        'class_id' => $targetClassId,
                        'section' => $section,
                        'start_date' => $startDate,
                        'end_date' => null,
                        'transfer_reason' => "Year-end {$decision} from Class #{$enrollment->class_id}",
                    ]);

                    // Update cached non-authoritative projection on member
                    $student->update([
                        'class_id' => $targetClassId,
                        'section' => $section,
                    ]);

                    $processed[] = [
                        'student_id' => $studentId,
                        'decision' => $decision,
                        'previous_class_id' => $enrollment->class_id,
                        'new_class_id' => $targetClassId,
                        'new_section' => $section,
                        'reason' => $reason,
                    ];
                } elseif ($decision === 'GRADUATED') {
                    // Graduated student: enrollment is closed, section projection cleared
                    $student->update([
                        'section' => null,
                    ]);

                    $processed[] = [
                        'student_id' => $studentId,
                        'decision' => 'GRADUATED',
                        'previous_class_id' => $enrollment->class_id,
                        'new_class_id' => null,
                        'reason' => $reason,
                    ];
                }
            }

            return [
                'committed' => true,
                'current_academic_year_id' => $currentAcademicYearId,
                'next_academic_year_id' => $nextAcademicYearId,
                'processed_count' => count($processed),
                'skipped_count' => count($skipped),
                'processed' => $processed,
                'skipped' => $skipped,
            ];
        });
    }

    /**
     * Calculate academic performance metrics across semesters according to evaluation mode.
     */
    protected function calculateAcademicSummary(int $memberId, int $academicYearId, string $evaluationMode): array
    {
        if ($evaluationMode === 'semester_1') {
            $rc = $this->gradebookService->generateStudentReportCard($memberId, $academicYearId, Semester::Semester1->value);

            return [
                'overall_average' => (float) ($rc['summary']['overall_average'] ?? 0.0),
                'failed_courses_count' => (int) ($rc['summary']['failed_courses_count'] ?? 0),
                'is_incomplete' => (bool) ($rc['summary']['is_incomplete'] ?? true),
                'is_passed' => (bool) ($rc['summary']['is_passed'] ?? false),
                'details' => ['semester_1' => $rc['summary']],
            ];
        }

        if ($evaluationMode === 'semester_2') {
            $rc = $this->gradebookService->generateStudentReportCard($memberId, $academicYearId, Semester::Semester2->value);

            return [
                'overall_average' => (float) ($rc['summary']['overall_average'] ?? 0.0),
                'failed_courses_count' => (int) ($rc['summary']['failed_courses_count'] ?? 0),
                'is_incomplete' => (bool) ($rc['summary']['is_incomplete'] ?? true),
                'is_passed' => (bool) ($rc['summary']['is_passed'] ?? false),
                'details' => ['semester_2' => $rc['summary']],
            ];
        }

        // Default 'annual': aggregate Semester 1 and Semester 2
        $rc1 = $this->gradebookService->generateStudentReportCard($memberId, $academicYearId, Semester::Semester1->value);
        $rc2 = $this->gradebookService->generateStudentReportCard($memberId, $academicYearId, Semester::Semester2->value);

        $hasSem1 = ! empty($rc1['courses']) && ! $rc1['summary']['is_incomplete'];
        $hasSem2 = ! empty($rc2['courses']) && ! $rc2['summary']['is_incomplete'];

        if ($hasSem1 && $hasSem2) {
            $annualAvg = round(((float) $rc1['summary']['overall_average'] + (float) $rc2['summary']['overall_average']) / 2, 2);
            $failedCoursesCount = max((int) $rc1['summary']['failed_courses_count'], (int) $rc2['summary']['failed_courses_count']);
            $passingScore = (float) $rc1['class']['passing_score'];
            $isPassed = ($annualAvg >= $passingScore);
            $isIncomplete = false;
        } elseif ($hasSem2) {
            // Semester 2 available and complete
            $annualAvg = (float) $rc2['summary']['overall_average'];
            $failedCoursesCount = (int) $rc2['summary']['failed_courses_count'];
            $isPassed = (bool) $rc2['summary']['is_passed'];
            $isIncomplete = false;
        } elseif ($hasSem1) {
            // Only Semester 1 available
            $annualAvg = (float) $rc1['summary']['overall_average'];
            $failedCoursesCount = (int) $rc1['summary']['failed_courses_count'];
            $isPassed = (bool) $rc1['summary']['is_passed'];
            $isIncomplete = false;
        } else {
            // Neither semester complete
            $annualAvg = 0.0;
            $failedCoursesCount = 0;
            $isPassed = false;
            $isIncomplete = true;
        }

        return [
            'overall_average' => $annualAvg,
            'failed_courses_count' => $failedCoursesCount,
            'is_incomplete' => $isIncomplete,
            'is_passed' => $isPassed,
            'details' => [
                'semester_1' => $rc1['summary'] ?? null,
                'semester_2' => $rc2['summary'] ?? null,
            ],
        ];
    }

    /**
     * Validate that source and target academic years are valid and sequential.
     *
     * @throws ValidationException
     */
    protected function validateAcademicYears(int $currentAcademicYearId, int $nextAcademicYearId): void
    {
        if ($currentAcademicYearId === $nextAcademicYearId) {
            throw ValidationException::withMessages([
                'next_academic_year_id' => ['Target academic year must be different from current academic year.'],
            ]);
        }

        $currentYear = AcademicYear::findOrFail($currentAcademicYearId);
        $nextYear = AcademicYear::findOrFail($nextAcademicYearId);

        $currentEnd = Carbon::parse($currentYear->end_date);
        $nextStart = Carbon::parse($nextYear->start_date);

        if ($nextStart->lt(Carbon::parse($currentYear->start_date))) {
            throw ValidationException::withMessages([
                'next_academic_year_id' => ['Target academic year must start after current academic year start date.'],
            ]);
        }
    }
}
