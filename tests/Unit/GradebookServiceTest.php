<?php

namespace Tests\Unit;

use App\Exceptions\AssessmentWeightsInvalidException;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentResult;
use App\Models\Course;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use App\Services\GradebookService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GradebookServiceTest extends TestCase
{
    use RefreshDatabase;

    private GradebookService $gradebookService;
    private AcademicYear $academicYear;
    private SchoolClass $class;
    private Course $course1;
    private Course $course2;
    private Course $course3;
    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->gradebookService = app(GradebookService::class);

        $this->academicYear = AcademicYear::create([
            'name' => ['en' => '2018 E.C.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $this->class = SchoolClass::create([
            'name' => ['en' => 'Grade 9'],
            'code' => 'G9',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->course1 = Course::create([
            'name' => ['en' => 'Bible Study'],
            'code' => 'BIB101',
            'credit_hour' => 1,
            'class_id' => $this->class->id,
        ]);

        $this->course2 = Course::create([
            'name' => ['en' => 'Church History'],
            'code' => 'HIS101',
            'credit_hour' => 1,
            'class_id' => $this->class->id,
        ]);

        $this->course3 = Course::create([
            'name' => ['en' => 'Christian Ethics'],
            'code' => 'ETH101',
            'credit_hour' => 1,
            'class_id' => $this->class->id,
        ]);

        $this->teacher = User::factory()->create();
    }

    public function test_calculates_percentage_weighted_course_score_correctly(): void
    {
        $assignment = TeachingAssignment::create([
            'teacher_id' => $this->teacher->id,
            'course_id' => $this->course1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'semester' => 'semester_1',
            'is_primary' => true,
        ]);

        // Weights: 20% + 30% + 50% = 100%
        $a1 = Assessment::create([
            'teaching_assignment_id' => $assignment->id,
            'name' => ['en' => 'Assignment 1'],
            'total_score' => 20.00,
            'weight_percentage' => 20.00,
        ]);
        $a2 = Assessment::create([
            'teaching_assignment_id' => $assignment->id,
            'name' => ['en' => 'Midterm Exam'],
            'total_score' => 50.00,
            'weight_percentage' => 30.00,
        ]);
        $a3 = Assessment::create([
            'teaching_assignment_id' => $assignment->id,
            'name' => ['en' => 'Final Exam'],
            'total_score' => 100.00,
            'weight_percentage' => 50.00,
        ]);

        $student = Member::create([
            'full_name' => ['en' => 'Abebe Bikila'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);

        // Scores: 18/20 (18%), 45/50 (27%), 90/100 (45%) -> Total = 18 + 27 + 45 = 90.00%
        AssessmentResult::create(['assessment_id' => $a1->id, 'member_id' => $student->id, 'score' => 18.00]);
        AssessmentResult::create(['assessment_id' => $a2->id, 'member_id' => $student->id, 'score' => 45.00]);
        AssessmentResult::create(['assessment_id' => $a3->id, 'member_id' => $student->id, 'score' => 90.00]);

        $courseResult = $this->gradebookService->calculateCourseScore($assignment, $student->id);

        $this->assertEquals(90.00, $courseResult['percentage']);
        $this->assertTrue($courseResult['is_passed']);
        $this->assertFalse($courseResult['is_incomplete']);
    }

    public function test_rejects_invalid_weights_total_not_equaling_100(): void
    {
        $assignment = TeachingAssignment::create([
            'teacher_id' => $this->teacher->id,
            'course_id' => $this->course1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'semester' => 'semester_1',
            'is_primary' => true,
        ]);

        // Weights: 20% + 40% = 60% != 100%
        Assessment::create([
            'teaching_assignment_id' => $assignment->id,
            'name' => ['en' => 'Test 1'],
            'total_score' => 50.00,
            'weight_percentage' => 20.00,
        ]);
        Assessment::create([
            'teaching_assignment_id' => $assignment->id,
            'name' => ['en' => 'Test 2'],
            'total_score' => 50.00,
            'weight_percentage' => 40.00,
        ]);

        $student = Member::create([
            'full_name' => ['en' => 'Tirunesh Dibaba'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'female',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);

        $this->expectException(AssessmentWeightsInvalidException::class);
        $this->gradebookService->calculateCourseScore($assignment, $student->id);
    }

    public function test_missing_marks_mark_report_card_as_incomplete(): void
    {
        $assignment = TeachingAssignment::create([
            'teacher_id' => $this->teacher->id,
            'course_id' => $this->course1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'semester' => 'semester_1',
            'is_primary' => true,
        ]);

        $a1 = Assessment::create([
            'teaching_assignment_id' => $assignment->id,
            'name' => ['en' => 'Midterm'],
            'total_score' => 50.00,
            'weight_percentage' => 50.00,
        ]);
        Assessment::create([
            'teaching_assignment_id' => $assignment->id,
            'name' => ['en' => 'Final'],
            'total_score' => 50.00,
            'weight_percentage' => 50.00,
        ]);

        $student = Member::create([
            'full_name' => ['en' => 'Kenenisa Bekele'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);

        // Student only entered midterm (missing final)
        AssessmentResult::create(['assessment_id' => $a1->id, 'member_id' => $student->id, 'score' => 40.00]);

        $courseResult = $this->gradebookService->calculateCourseScore($assignment, $student->id);

        $this->assertTrue($courseResult['is_incomplete']);
        // Provisional score: 40/50 * 50% = 40.00%
        $this->assertEquals(40.00, $courseResult['percentage']);
    }

    public function test_report_card_passing_and_failing_rules(): void
    {
        // Setup assignments for course 1, course 2, course 3
        $as1 = TeachingAssignment::create([
            'teacher_id' => $this->teacher->id, 'course_id' => $this->course1->id,
            'academic_year_id' => $this->academicYear->id, 'class_id' => $this->class->id,
            'section' => 'A', 'semester' => 'semester_1', 'is_primary' => true,
        ]);
        $as2 = TeachingAssignment::create([
            'teacher_id' => $this->teacher->id, 'course_id' => $this->course2->id,
            'academic_year_id' => $this->academicYear->id, 'class_id' => $this->class->id,
            'section' => 'A', 'semester' => 'semester_1', 'is_primary' => true,
        ]);
        $as3 = TeachingAssignment::create([
            'teacher_id' => $this->teacher->id, 'course_id' => $this->course3->id,
            'academic_year_id' => $this->academicYear->id, 'class_id' => $this->class->id,
            'section' => 'A', 'semester' => 'semester_1', 'is_primary' => true,
        ]);

        $a1 = Assessment::create(['teaching_assignment_id' => $as1->id, 'name' => ['en' => 'Final'], 'total_score' => 100, 'weight_percentage' => 100]);
        $a2 = Assessment::create(['teaching_assignment_id' => $as2->id, 'name' => ['en' => 'Final'], 'total_score' => 100, 'weight_percentage' => 100]);
        $a3 = Assessment::create(['teaching_assignment_id' => $as3->id, 'name' => ['en' => 'Final'], 'total_score' => 100, 'weight_percentage' => 100]);

        // Student 1: scores 70%, 60%, 45% (1 fail). Overall avg = 58.33% >= 50.00% and <= 1 fail -> PASS
        $s1 = Member::create(['full_name' => ['en' => 'Student One'], 'date_of_birth' => '2010-01-01', 'gender' => 'male', 'class_id' => $this->class->id, 'section' => 'A']);
        AssessmentResult::create(['assessment_id' => $a1->id, 'member_id' => $s1->id, 'score' => 70]);
        AssessmentResult::create(['assessment_id' => $a2->id, 'member_id' => $s1->id, 'score' => 60]);
        AssessmentResult::create(['assessment_id' => $a3->id, 'member_id' => $s1->id, 'score' => 45]);

        $card1 = $this->gradebookService->generateStudentReportCard($s1->id, $this->academicYear->id, 'semester_1');
        $this->assertEquals('PASS', $card1['summary']['status']);
        $this->assertTrue($card1['summary']['is_passed']);
        $this->assertEquals(1, $card1['summary']['failed_courses_count']);

        // Student 2: scores 70%, 45%, 40% (2 fails). Overall avg = 51.67% >= 50.00% -> PASS on class average
        $s2 = Member::create(['full_name' => ['en' => 'Student Two'], 'date_of_birth' => '2010-01-01', 'gender' => 'female', 'class_id' => $this->class->id, 'section' => 'A']);
        AssessmentResult::create(['assessment_id' => $a1->id, 'member_id' => $s2->id, 'score' => 70]);
        AssessmentResult::create(['assessment_id' => $a2->id, 'member_id' => $s2->id, 'score' => 45]);
        AssessmentResult::create(['assessment_id' => $a3->id, 'member_id' => $s2->id, 'score' => 40]);

        $card2 = $this->gradebookService->generateStudentReportCard($s2->id, $this->academicYear->id, 'semester_1');
        $this->assertEquals('PASS', $card2['summary']['status']);
        $this->assertTrue($card2['summary']['is_passed']);
        $this->assertEquals(2, $card2['summary']['failed_courses_count']);

        // Student 3: scores 45%, 45%, 45%. Overall avg = 45.00% < 50.00% -> FAIL
        $s3 = Member::create(['full_name' => ['en' => 'Student Three'], 'date_of_birth' => '2010-01-01', 'gender' => 'male', 'class_id' => $this->class->id, 'section' => 'A']);
        AssessmentResult::create(['assessment_id' => $a1->id, 'member_id' => $s3->id, 'score' => 45]);
        AssessmentResult::create(['assessment_id' => $a2->id, 'member_id' => $s3->id, 'score' => 45]);
        AssessmentResult::create(['assessment_id' => $a3->id, 'member_id' => $s3->id, 'score' => 45]);

        $card3 = $this->gradebookService->generateStudentReportCard($s3->id, $this->academicYear->id, 'semester_1');
        $this->assertEquals('FAIL', $card3['summary']['status']);
        $this->assertFalse($card3['summary']['is_passed']);
    }

    public function test_standard_competition_ranking_with_ties_1224_and_incomplete_exclusion(): void
    {
        $reportCards = [
            ['student' => ['id' => 1], 'summary' => ['overall_average' => 95.00, 'is_incomplete' => false, 'rank' => null]],
            ['student' => ['id' => 2], 'summary' => ['overall_average' => 88.00, 'is_incomplete' => false, 'rank' => null]],
            ['student' => ['id' => 3], 'summary' => ['overall_average' => 88.00, 'is_incomplete' => false, 'rank' => null]],
            ['student' => ['id' => 4], 'summary' => ['overall_average' => 75.00, 'is_incomplete' => false, 'rank' => null]],
            ['student' => ['id' => 5], 'summary' => ['overall_average' => 40.00, 'is_incomplete' => true, 'rank' => null]],
        ];

        $this->gradebookService->applyStandardCompetitionRanking($reportCards, 'rank');

        $this->assertEquals(1, $reportCards[0]['summary']['rank']); // 95% -> 1st
        $this->assertEquals(2, $reportCards[1]['summary']['rank']); // 88% -> 2nd (tied)
        $this->assertEquals(2, $reportCards[2]['summary']['rank']); // 88% -> 2nd (tied)
        $this->assertEquals(4, $reportCards[3]['summary']['rank']); // 75% -> 4th (rank 3 skipped!)
        $this->assertNull($reportCards[4]['summary']['rank']);      // Incomplete -> excluded (null)
    }

    public function test_class_gradebook_generates_dual_section_and_class_ranks_1224(): void
    {
        // Setup assignments for Section A and Section B
        $asA = TeachingAssignment::create([
            'teacher_id' => $this->teacher->id, 'course_id' => $this->course1->id,
            'academic_year_id' => $this->academicYear->id, 'class_id' => $this->class->id,
            'section' => 'A', 'semester' => 'semester_1', 'is_primary' => true,
        ]);
        $asB = TeachingAssignment::create([
            'teacher_id' => $this->teacher->id, 'course_id' => $this->course1->id,
            'academic_year_id' => $this->academicYear->id, 'class_id' => $this->class->id,
            'section' => 'B', 'semester' => 'semester_1', 'is_primary' => true,
        ]);

        $aA = Assessment::create(['teaching_assignment_id' => $asA->id, 'name' => ['en' => 'Exam'], 'total_score' => 100, 'weight_percentage' => 100]);
        $aB = Assessment::create(['teaching_assignment_id' => $asB->id, 'name' => ['en' => 'Exam'], 'total_score' => 100, 'weight_percentage' => 100]);

        // Section A: S_A1 (90%), S_A2 (80%)
        $sA1 = Member::create(['full_name' => ['en' => 'Student A1'], 'date_of_birth' => '2010-01-01', 'gender' => 'male', 'class_id' => $this->class->id, 'section' => 'A']);
        $sA2 = Member::create(['full_name' => ['en' => 'Student A2'], 'date_of_birth' => '2010-01-01', 'gender' => 'female', 'class_id' => $this->class->id, 'section' => 'A']);
        AssessmentResult::create(['assessment_id' => $aA->id, 'member_id' => $sA1->id, 'score' => 90]);
        AssessmentResult::create(['assessment_id' => $aA->id, 'member_id' => $sA2->id, 'score' => 80]);

        // Section B: S_B1 (95%), S_B2 (80%)
        $sB1 = Member::create(['full_name' => ['en' => 'Student B1'], 'date_of_birth' => '2010-01-01', 'gender' => 'male', 'class_id' => $this->class->id, 'section' => 'B']);
        $sB2 = Member::create(['full_name' => ['en' => 'Student B2'], 'date_of_birth' => '2010-01-01', 'gender' => 'female', 'class_id' => $this->class->id, 'section' => 'B']);
        AssessmentResult::create(['assessment_id' => $aB->id, 'member_id' => $sB1->id, 'score' => 95]);
        AssessmentResult::create(['assessment_id' => $aB->id, 'member_id' => $sB2->id, 'score' => 80]);

        // We only configured course1 in this test, course2 and course3 will be incomplete unless we add them or filter
        // Let's generate class gradebook
        $gradebook = $this->gradebookService->generateClassGradebook($this->class->id, $this->academicYear->id, 'semester_1');
        $this->assertEquals(4, $gradebook['total_students']);

        // Since courses 2 and 3 had no assignments, report cards are incomplete -> ranks are null
        foreach ($gradebook['students'] as $st) {
            $this->assertTrue($st['summary']['is_incomplete']);
            $this->assertNull($st['summary']['class_rank']);
            $this->assertNull($st['summary']['section_rank']);
        }
    }
}
