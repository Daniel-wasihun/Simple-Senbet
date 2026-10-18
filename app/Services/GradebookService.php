<?php

namespace App\Services;

use App\Exceptions\AssessmentWeightsInvalidException;
use App\Models\AcademicYear;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\SessionStudentRecord;
use App\Models\StudentEnrollment;
use App\Models\TeachingAssignment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class GradebookService
{
    /**
     * Validate that configured assessments for a teaching assignment sum to exactly 100.00%.
     *
     * @throws AssessmentWeightsInvalidException
     */
    public function validateAssessmentWeights(TeachingAssignment $assignment): void
    {
        $assessments = $assignment->assessments;

        if ($assessments->isEmpty()) {
            throw new AssessmentWeightsInvalidException(0.00, $assignment->id);
        }

        $totalWeight = (float) $assessments->sum('weight_percentage');

        // Precision check within 0.01 tolerance
        if (abs($totalWeight - 100.00) > 0.009) {
            throw new AssessmentWeightsInvalidException($totalWeight, $assignment->id);
        }
    }

    /**
     * Calculate a student's percentage-weighted score for a specific course teaching assignment.
     */
    public function calculateCourseScore(TeachingAssignment $assignment, int $memberId): array
    {
        $this->validateAssessmentWeights($assignment);

        $assignment->loadMissing(['schoolClass', 'course', 'assessments.assessmentResults']);

        $classPassingScore = (float) ($assignment->schoolClass?->passing_score ?? 50.00);

        $totalEarnedPercentage = 0.00;
        $isIncomplete = false;
        $missingCount = 0;
        $assessmentsBreakdown = [];

        foreach ($assignment->assessments as $assessment) {
            $totalScore = (float) $assessment->total_score;
            $weightPercentage = (float) $assessment->weight_percentage;

            $result = $assessment->assessmentResults->firstWhere('member_id', $memberId);

            if ($result !== null) {
                $score = (float) $result->score;
                $earnedContribution = ($totalScore > 0) ? ($score / $totalScore) * $weightPercentage : 0.00;
                $hasResult = true;
            } else {
                // Missing mark: contributes 0.00 earned score and marks assessment as missing
                $score = 0.00;
                $earnedContribution = 0.00;
                $hasResult = false;
                $isIncomplete = true;
                $missingCount++;
            }

            $totalEarnedPercentage += $earnedContribution;

            $assessmentsBreakdown[] = [
                'assessment_id' => $assessment->id,
                'name' => $assessment->name,
                'total_score' => $totalScore,
                'weight_percentage' => $weightPercentage,
                'earned_score' => $hasResult ? $score : null,
                'earned_percentage' => round($earnedContribution, 2),
                'is_missing' => ! $hasResult,
                'remarks' => $result?->remarks,
            ];
        }

        $finalPercentage = round($totalEarnedPercentage, 2);
        $isPassed = $finalPercentage >= $classPassingScore;

        return [
            'course_id' => $assignment->course_id,
            'course_name' => $assignment->course?->name,
            'course_code' => $assignment->course?->code,
            'credit_hour' => (int) ($assignment->course?->credit_hour ?? 1),
            'teaching_assignment_id' => $assignment->id,
            'percentage' => $finalPercentage,
            'passing_score' => $classPassingScore,
            'is_passed' => $isPassed,
            'is_incomplete' => $isIncomplete,
            'missing_assessments_count' => $missingCount,
            'assessments' => $assessmentsBreakdown,
        ];
    }

    /**
     * Generate complete report card for an individual student.
     */
    public function generateStudentReportCard(int $memberId, int $academicYearId, string $semester): array
    {
        $member = Member::with('schoolClass')->findOrFail($memberId);
        $academicYear = AcademicYear::findOrFail($academicYearId);

        // Find student enrollment context for this academic year
        $enrollment = StudentEnrollment::where('member_id', $memberId)
            ->where('academic_year_id', $academicYearId)
            ->first();

        $classId = $enrollment?->class_id ?? $member->class_id;
        $section = $enrollment?->section ?? $member->section ?? 'A';

        $schoolClass = SchoolClass::findOrFail($classId);
        $courses = Course::where('class_id', $classId)->get();

        $courseResults = [];
        $totalEarnedPercentages = 0.00;
        $totalCreditHours = 0;
        $weightedEarnedSum = 0.00;
        $failedCoursesCount = 0;
        $isReportCardIncomplete = false;

        foreach ($courses as $course) {
            $assignment = TeachingAssignment::with(['assessments.assessmentResults', 'schoolClass', 'course'])
                ->where('class_id', $classId)
                ->where('section', $section)
                ->where('course_id', $course->id)
                ->where('academic_year_id', $academicYearId)
                ->where('semester', $semester)
                ->first();

            if (! $assignment || $assignment->assessments->isEmpty()) {
                // Course has no configured assessments or teaching assignment -> incomplete
                $isReportCardIncomplete = true;
                $courseResults[] = [
                    'course_id' => $course->id,
                    'course_name' => $course->name,
                    'course_code' => $course->code,
                    'credit_hour' => (int) $course->credit_hour,
                    'teaching_assignment_id' => $assignment?->id,
                    'percentage' => 0.00,
                    'passing_score' => (float) $schoolClass->passing_score,
                    'is_passed' => false,
                    'is_incomplete' => true,
                    'missing_assessments_count' => 0,
                    'assessments' => [],
                ];
                $totalCreditHours += (int) $course->credit_hour;
                $failedCoursesCount++;
                continue;
            }

            try {
                $cScore = $this->calculateCourseScore($assignment, $memberId);
            } catch (AssessmentWeightsInvalidException $e) {
                $isReportCardIncomplete = true;
                $cScore = [
                    'course_id' => $course->id,
                    'course_name' => $course->name,
                    'course_code' => $course->code,
                    'credit_hour' => (int) $course->credit_hour,
                    'teaching_assignment_id' => $assignment->id,
                    'percentage' => 0.00,
                    'passing_score' => (float) $schoolClass->passing_score,
                    'is_passed' => false,
                    'is_incomplete' => true,
                    'missing_assessments_count' => $assignment->assessments->count(),
                    'assessments' => [],
                    'error' => $e->getMessage(),
                ];
            }

            if ($cScore['is_incomplete']) {
                $isReportCardIncomplete = true;
            }

            if (! $cScore['is_passed']) {
                $failedCoursesCount++;
            }

            $credit = (int) $cScore['credit_hour'];
            $totalCreditHours += $credit;
            $totalEarnedPercentages += $cScore['percentage'];
            $weightedEarnedSum += ($cScore['percentage'] * $credit);

            $courseResults[] = $cScore;
        }

        $courseCount = count($courseResults);
        $overallAverage = ($courseCount > 0) ? round($totalEarnedPercentages / $courseCount, 2) : 0.00;
        $passingScore = (float) $schoolClass->passing_score;

        // Passing & Failing Status (Approved Option A)
        if ($isReportCardIncomplete) {
            $status = 'INCOMPLETE';
            $finalPassed = null;
        } elseif ($overallAverage >= $passingScore && $failedCoursesCount <= 1) {
            $status = 'PASS';
            $finalPassed = true;
        } else {
            $status = 'FAIL';
            $finalPassed = false;
        }

        // Attendance Summary Integration (Informational Only)
        $attendanceSummary = $this->aggregateStudentAttendance($memberId, $classId, $academicYearId);

        return [
            'student' => [
                'id' => $member->id,
                'full_name' => $member->full_name,
                'christian_name' => $member->christian_name,
                'gender' => $member->gender,
            ],
            'academic_year' => [
                'id' => $academicYear->id,
                'name' => $academicYear->name,
            ],
            'class' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'code' => $schoolClass->code,
                'passing_score' => $passingScore,
            ],
            'section' => $section,
            'semester' => $semester,
            'courses' => $courseResults,
            'summary' => [
                'total_courses' => $courseCount,
                'total_credits' => $totalCreditHours,
                'total_marks_earned' => round($totalEarnedPercentages, 2),
                'total_marks_possible' => $courseCount * 100.00,
                'overall_average' => $overallAverage,
                'passing_score' => $passingScore,
                'failed_courses_count' => $failedCoursesCount,
                'status' => $status,
                'is_passed' => $finalPassed,
                'is_incomplete' => $isReportCardIncomplete,
                'section_rank' => null, // Computed at gradebook level
                'class_rank' => null,   // Computed at gradebook level
            ],
            'attendance' => $attendanceSummary,
        ];
    }

    /**
     * Generate class and section gradebooks with Standard Competition Ranking ("1224").
     */
    public function generateClassGradebook(int $classId, int $academicYearId, string $semester, ?string $section = null): array
    {
        $schoolClass = SchoolClass::findOrFail($classId);

        // Find all students enrolled in this class for the academic year
        $enrolledMemberIds = StudentEnrollment::where('class_id', $classId)
            ->where('academic_year_id', $academicYearId)
            ->pluck('member_id')
            ->toArray();

        // Also include members with primary class_id if no enrollment records exist
        $primaryMemberIds = Member::where('class_id', $classId)->pluck('id')->toArray();
        $allMemberIds = array_values(array_unique(array_merge($enrolledMemberIds, $primaryMemberIds)));

        $reportCards = [];
        foreach ($allMemberIds as $mId) {
            $reportCards[] = $this->generateStudentReportCard($mId, $academicYearId, $semester);
        }

        // Apply Class-wide Ranks ("1224") across all completed report cards in this class
        $this->applyStandardCompetitionRanking($reportCards, 'class_rank');

        // Group by section and apply Section Ranks ("1224") within each section
        $sections = [];
        foreach ($reportCards as $card) {
            $sec = $card['section'];
            $sections[$sec][] = $card;
        }

        $rankedReportCards = [];
        foreach ($sections as $sec => $sectionCards) {
            $this->applyStandardCompetitionRanking($sectionCards, 'section_rank');
            foreach ($sectionCards as $sc) {
                $rankedReportCards[] = $sc;
            }
        }

        // Optional section filter
        if ($section !== null && $section !== '' && $section !== 'all') {
            $rankedReportCards = array_values(array_filter($rankedReportCards, function ($card) use ($section) {
                return $card['section'] === $section;
            }));
        }

        return [
            'class' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'code' => $schoolClass->code,
                'passing_score' => (float) $schoolClass->passing_score,
            ],
            'academic_year_id' => $academicYearId,
            'semester' => $semester,
            'section' => $section,
            'total_students' => count($rankedReportCards),
            'students' => $rankedReportCards,
        ];
    }

    /**
     * Compute Standard Competition Ranking ("1224") on an array of report cards.
     * Tied students receive the same rank; subsequent rank skips by the count of tied peers.
     * Incomplete report cards are excluded from ranking (rank remains null).
     */
    public function applyStandardCompetitionRanking(array &$reportCards, string $rankKey): void
    {
        // 1. Separate completed from incomplete
        $completedIndices = [];
        foreach ($reportCards as $idx => $card) {
            if (! $card['summary']['is_incomplete']) {
                $completedIndices[] = $idx;
            } else {
                $reportCards[$idx]['summary'][$rankKey] = null;
            }
        }

        // 2. Sort completed indices by overall_average descending
        usort($completedIndices, function ($a, $b) use ($reportCards) {
            $avgA = (float) $reportCards[$a]['summary']['overall_average'];
            $avgB = (float) $reportCards[$b]['summary']['overall_average'];

            if (abs($avgA - $avgB) < 0.001) {
                return 0;
            }

            return ($avgA > $avgB) ? -1 : 1;
        });

        // 3. Assign standard competition ranks ("1224")
        $currentRank = 1;
        $count = count($completedIndices);

        for ($i = 0; $i < $count; $i++) {
            $currIdx = $completedIndices[$i];
            $currAvg = (float) $reportCards[$currIdx]['summary']['overall_average'];

            if ($i > 0) {
                $prevIdx = $completedIndices[$i - 1];
                $prevAvg = (float) $reportCards[$prevIdx]['summary']['overall_average'];

                if (abs($currAvg - $prevAvg) < 0.001) {
                    // Tie: inherit previous student's rank
                    $reportCards[$currIdx]['summary'][$rankKey] = $reportCards[$prevIdx]['summary'][$rankKey];
                } else {
                    // Gap: rank equals (current index + 1)
                    $reportCards[$currIdx]['summary'][$rankKey] = $i + 1;
                }
            } else {
                $reportCards[$currIdx]['summary'][$rankKey] = 1;
            }
        }
    }

    /**
     * Aggregate attendance summary metrics for a student in an academic year.
     */
    private function aggregateStudentAttendance(int $memberId, int $classId, int $academicYearId): array
    {
        $records = DB::table('session_student_records')
            ->join('attendance_sessions', 'session_student_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->where('session_student_records.student_id', $memberId)
            ->where('attendance_sessions.class_id', $classId)
            ->where('attendance_sessions.academic_year_id', $academicYearId)
            ->select('session_student_records.mark')
            ->get();

        $present = $records->where('mark', 'present')->count();
        $absent = $records->where('mark', 'absent')->count();
        $late = $records->where('mark', 'late')->count();
        $excused = $records->where('mark', 'excused')->count();
        $total = $records->count();

        $attendanceRate = ($total > 0) ? round((($present + $late) / $total) * 100, 2) : 100.00;

        return [
            'total_sessions' => $total,
            'present_count' => $present,
            'absent_count' => $absent,
            'late_count' => $late,
            'excused_count' => $excused,
            'attendance_rate' => $attendanceRate,
            'score_adjustment' => 0.00, // Strictly informational
        ];
    }
}
