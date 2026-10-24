<?php

namespace Tests\Feature\Academic;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentResult;
use App\Models\Course;
use App\Models\Member;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\TeachingAssignment;
use App\Models\User;
use App\Services\PromotionService;
use App\Services\StudentEnrollmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromotionTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    private User $teacher;

    private User $studentUser;

    private AcademicYear $currentYear;

    private AcademicYear $nextYear;

    private SchoolClass $class1;

    private SchoolClass $class2;

    private Course $course1;

    private TeachingAssignment $assignmentSem1;

    private TeachingAssignment $assignmentSem2;

    private Member $passingStudent;

    private Member $failingStudent;

    private Member $terminalStudent;

    private Member $incompleteStudent;

    protected function setUp(): void
    {
        parent::setUp();

        // Roles
        $superadminRole = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $teacherRole = Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

        $this->superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->teacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->teacher->syncRoles(['teacher']);

        $this->studentUser = User::factory()->create(['role_id' => $studentRole->id]);
        $this->studentUser->syncRoles(['student']);

        // Academic Years
        $this->currentYear = AcademicYear::create([
            'name' => ['en' => '2017 E.C.'],
            'start_date' => '2024-09-01',
            'end_date' => '2025-06-30',
            'is_current' => false,
        ]);

        $this->nextYear = AcademicYear::create([
            'name' => ['en' => '2018 E.C.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        // Classes (Class 1 -> Class 2 -> null for graduation)
        $this->class2 = SchoolClass::create([
            'name' => ['en' => 'Grade 2', 'am' => 'ክፍል 2'],
            'code' => 'G2',
            'passing_score' => 50.00,
            'number_of_sections' => 1,
            'next_class_id' => null, // Terminal class
        ]);

        $this->class1 = SchoolClass::create([
            'name' => ['en' => 'Grade 1', 'am' => 'ክፍል 1'],
            'code' => 'G1',
            'passing_score' => 50.00,
            'number_of_sections' => 1,
            'next_class_id' => $this->class2->id,
        ]);

        // Course & Assignments
        $this->course1 = Course::create([
            'name' => ['en' => 'Church History'],
            'code' => 'CH101',
            'credit_hour' => 1,
            'class_id' => $this->class1->id,
        ]);

        $this->assignmentSem1 = TeachingAssignment::create([
            'class_id' => $this->class1->id,
            'course_id' => $this->course1->id,
            'teacher_id' => $this->teacher->id,
            'academic_year_id' => $this->currentYear->id,
            'semester' => 'semester_1',
            'section' => 'A',
            'start_date' => '2024-09-01',
            'end_date' => '2025-01-31',
        ]);

        $this->assignmentSem2 = TeachingAssignment::create([
            'class_id' => $this->class1->id,
            'course_id' => $this->course1->id,
            'teacher_id' => $this->teacher->id,
            'academic_year_id' => $this->currentYear->id,
            'semester' => 'semester_2',
            'section' => 'A',
            'start_date' => '2025-02-01',
            'end_date' => '2025-06-30',
        ]);

        // Assessments summing to 100%
        $assessSem1 = Assessment::create([
            'teaching_assignment_id' => $this->assignmentSem1->id,
            'name' => 'Final Exam Sem 1',
            'total_score' => 100,
            'weight_percentage' => 100.00,
        ]);

        $assessSem2 = Assessment::create([
            'teaching_assignment_id' => $this->assignmentSem2->id,
            'name' => 'Final Exam Sem 2',
            'total_score' => 100,
            'weight_percentage' => 100.00,
        ]);

        // Students
        $enrollmentService = app(StudentEnrollmentService::class);

        // 1. Passing student in Class 1
        $this->passingStudent = Member::create([
            'full_name' => ['en' => 'Yonas Petros'],
            'date_of_birth' => '2015-01-01',
            'gender' => 'male',
            'class_id' => $this->class1->id,
            'section' => 'A',
        ]);
        $enrollmentService->enroll($this->passingStudent->id, $this->currentYear->id, $this->class1->id, 'A', '2024-09-01');
        AssessmentResult::create(['assessment_id' => $assessSem1->id, 'member_id' => $this->passingStudent->id, 'score' => 85.00]);
        AssessmentResult::create(['assessment_id' => $assessSem2->id, 'member_id' => $this->passingStudent->id, 'score' => 90.00]);

        // 2. Failing student in Class 1
        $this->failingStudent = Member::create([
            'full_name' => ['en' => 'Bekele Tola'],
            'date_of_birth' => '2015-02-02',
            'gender' => 'male',
            'class_id' => $this->class1->id,
            'section' => 'A',
        ]);
        $enrollmentService->enroll($this->failingStudent->id, $this->currentYear->id, $this->class1->id, 'A', '2024-09-01');
        AssessmentResult::create(['assessment_id' => $assessSem1->id, 'member_id' => $this->failingStudent->id, 'score' => 30.00]);
        AssessmentResult::create(['assessment_id' => $assessSem2->id, 'member_id' => $this->failingStudent->id, 'score' => 40.00]);

        // 3. Passing student in Terminal Class (Class 2 -> null)
        $this->terminalStudent = Member::create([
            'full_name' => ['en' => 'Sara Daniel'],
            'date_of_birth' => '2014-03-03',
            'gender' => 'female',
            'class_id' => $this->class2->id,
            'section' => 'A',
        ]);
        $enrollmentService->enroll($this->terminalStudent->id, $this->currentYear->id, $this->class2->id, 'A', '2024-09-01');

        // Course & Assignments for Class 2
        $course2 = Course::create([
            'name' => ['en' => 'Dogma'],
            'code' => 'DG201',
            'credit_hour' => 1,
            'class_id' => $this->class2->id,
        ]);
        $assignTermSem1 = TeachingAssignment::create([
            'class_id' => $this->class2->id,
            'course_id' => $course2->id,
            'teacher_id' => $this->teacher->id,
            'academic_year_id' => $this->currentYear->id,
            'semester' => 'semester_1',
            'section' => 'A',
            'start_date' => '2024-09-01',
            'end_date' => '2025-01-31',
        ]);
        $assessTerm1 = Assessment::create([
            'teaching_assignment_id' => $assignTermSem1->id,
            'name' => 'Term Final',
            'total_score' => 100,
            'weight_percentage' => 100.00,
        ]);
        AssessmentResult::create(['assessment_id' => $assessTerm1->id, 'member_id' => $this->terminalStudent->id, 'score' => 95.00]);

        // 4. Incomplete student in Class 1 (No assessment results entered)
        $this->incompleteStudent = Member::create([
            'full_name' => ['en' => 'Tadesse Gizaw'],
            'date_of_birth' => '2015-04-04',
            'gender' => 'male',
            'class_id' => $this->class1->id,
            'section' => 'A',
        ]);
        $enrollmentService->enroll($this->incompleteStudent->id, $this->currentYear->id, $this->class1->id, 'A', '2024-09-01');
    }

    public function test_passing_student_with_next_class_is_evaluated_as_promoted(): void
    {
        $promotionService = app(PromotionService::class);
        $result = $promotionService->evaluateStudent($this->passingStudent->id, $this->currentYear->id);

        $this->assertEquals('PROMOTED', $result['decision']);
        $this->assertEquals($this->class2->id, $result['proposed_class_id']);
        $this->assertTrue($result['academic_summary']['is_passed']);
        $this->assertFalse($result['academic_summary']['is_incomplete']);
        $this->assertEquals(87.5, $result['academic_summary']['overall_average']);
    }

    public function test_failing_student_is_evaluated_as_retained(): void
    {
        $promotionService = app(PromotionService::class);
        $result = $promotionService->evaluateStudent($this->failingStudent->id, $this->currentYear->id);

        $this->assertEquals('RETAINED', $result['decision']);
        $this->assertEquals($this->class1->id, $result['proposed_class_id']); // Repeats same class
        $this->assertFalse($result['academic_summary']['is_passed']);
        $this->assertEquals(35.0, $result['academic_summary']['overall_average']);
    }

    public function test_passing_student_in_terminal_class_is_evaluated_as_graduated(): void
    {
        $promotionService = app(PromotionService::class);
        $result = $promotionService->evaluateStudent($this->terminalStudent->id, $this->currentYear->id);

        $this->assertEquals('GRADUATED', $result['decision']);
        $this->assertNull($result['proposed_class_id']);
        $this->assertTrue($result['academic_summary']['is_passed']);
    }

    public function test_student_with_unrecorded_marks_is_evaluated_as_incomplete(): void
    {
        $promotionService = app(PromotionService::class);
        $result = $promotionService->evaluateStudent($this->incompleteStudent->id, $this->currentYear->id);

        $this->assertEquals('INCOMPLETE', $result['decision']);
        $this->assertTrue($result['academic_summary']['is_incomplete']);
    }

    public function test_dry_run_simulation_returns_accurate_cohort_statistics_without_db_writes(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/promotion/dry-run', [
            'current_academic_year_id' => $this->currentYear->id,
            'next_academic_year_id' => $this->nextYear->id,
            'evaluation_mode' => 'annual',
        ]);

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertTrue($data['simulation']);
        $this->assertEquals(4, $data['statistics']['total_students']);
        $this->assertEquals(1, $data['statistics']['promoted']);
        $this->assertEquals(1, $data['statistics']['retained']);
        $this->assertEquals(1, $data['statistics']['graduated']);
        $this->assertEquals(1, $data['statistics']['incomplete']);

        // Assert zero enrollments exist in the next academic year
        $this->assertEquals(0, StudentEnrollment::where('academic_year_id', $this->nextYear->id)->count());
    }

    public function test_commit_promotion_executes_atomic_rollover_and_updates_enrollments(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/promotion/commit', [
            'current_academic_year_id' => $this->currentYear->id,
            'next_academic_year_id' => $this->nextYear->id,
            'evaluation_mode' => 'annual',
        ]);

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertTrue($data['committed']);
        $this->assertEquals(3, $data['processed_count']); // 1 Promoted, 1 Retained, 1 Graduated
        $this->assertEquals(1, $data['skipped_count']);   // 1 Incomplete skipped

        // 1. Promoted student verification
        $promotedEnrollment = StudentEnrollment::where('member_id', $this->passingStudent->id)
            ->where('academic_year_id', $this->nextYear->id)
            ->whereNull('end_date')
            ->first();
        $this->assertNotNull($promotedEnrollment);
        $this->assertEquals($this->class2->id, $promotedEnrollment->class_id);

        $this->passingStudent->refresh();
        $this->assertEquals($this->class2->id, $this->passingStudent->class_id);

        // Prior enrollment closed
        $oldPassingEnrollment = StudentEnrollment::where('member_id', $this->passingStudent->id)
            ->where('academic_year_id', $this->currentYear->id)
            ->first();
        $this->assertNotNull($oldPassingEnrollment->end_date);

        // 2. Retained student verification
        $retainedEnrollment = StudentEnrollment::where('member_id', $this->failingStudent->id)
            ->where('academic_year_id', $this->nextYear->id)
            ->whereNull('end_date')
            ->first();
        $this->assertNotNull($retainedEnrollment);
        $this->assertEquals($this->class1->id, $retainedEnrollment->class_id); // Repeats Class 1

        $this->failingStudent->refresh();
        $this->assertEquals($this->class1->id, $this->failingStudent->class_id);

        // 3. Graduated student verification
        $graduatedNewEnrollment = StudentEnrollment::where('member_id', $this->terminalStudent->id)
            ->where('academic_year_id', $this->nextYear->id)
            ->first();
        $this->assertNull($graduatedNewEnrollment); // No new active enrollment

        $oldGradEnrollment = StudentEnrollment::where('member_id', $this->terminalStudent->id)
            ->where('academic_year_id', $this->currentYear->id)
            ->first();
        $this->assertNotNull($oldGradEnrollment->end_date);
    }

    public function test_commit_promotion_is_idempotent(): void
    {
        // First commit
        $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/promotion/commit', [
            'current_academic_year_id' => $this->currentYear->id,
            'next_academic_year_id' => $this->nextYear->id,
            'evaluation_mode' => 'annual',
        ])->assertStatus(200);

        $initialNextYearCount = StudentEnrollment::where('academic_year_id', $this->nextYear->id)->count();

        // Second commit attempt
        $secondResponse = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/promotion/commit', [
            'current_academic_year_id' => $this->currentYear->id,
            'next_academic_year_id' => $this->nextYear->id,
            'evaluation_mode' => 'annual',
        ]);

        $secondResponse->assertStatus(200);
        $data = $secondResponse->json('data');

        // Should not duplicate enrollments
        $this->assertEquals($initialNextYearCount, StudentEnrollment::where('academic_year_id', $this->nextYear->id)->count());
        $this->assertEquals(0, $data['processed_count']);
        $this->assertGreaterThan(0, $data['skipped_count']);
    }

    public function test_commit_promotion_respects_administrative_overrides(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/promotion/commit', [
            'current_academic_year_id' => $this->currentYear->id,
            'next_academic_year_id' => $this->nextYear->id,
            'evaluation_mode' => 'annual',
            'overrides' => [
                $this->failingStudent->id => [
                    'decision' => 'PROMOTED',
                    'target_class_id' => $this->class2->id,
                    'reason' => 'Exceptional spiritual leadership recommendation',
                ],
            ],
        ]);

        $response->assertStatus(200);

        // Assert failing student was promoted due to override
        $promotedWithOverride = StudentEnrollment::where('member_id', $this->failingStudent->id)
            ->where('academic_year_id', $this->nextYear->id)
            ->first();

        $this->assertNotNull($promotedWithOverride);
        $this->assertEquals($this->class2->id, $promotedWithOverride->class_id);
    }

    public function test_single_student_promotion_evaluation_endpoint(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/promotion/student/{$this->passingStudent->id}?academic_year_id={$this->currentYear->id}");

        $response->assertStatus(200);
        $this->assertEquals('PROMOTED', $response->json('data.decision'));
        $this->assertEquals($this->class2->id, $response->json('data.proposed_class_id'));
    }

    public function test_unauthorized_users_are_forbidden_from_promotion_actions(): void
    {
        $dryRunForbidden = $this->actingAs($this->studentUser, 'sanctum')->postJson('/api/promotion/dry-run', [
            'current_academic_year_id' => $this->currentYear->id,
            'next_academic_year_id' => $this->nextYear->id,
        ]);
        $dryRunForbidden->assertStatus(403);

        $commitForbidden = $this->actingAs($this->teacher, 'sanctum')->postJson('/api/promotion/commit', [
            'current_academic_year_id' => $this->currentYear->id,
            'next_academic_year_id' => $this->nextYear->id,
        ]);
        $commitForbidden->assertStatus(403);
    }
}
