<?php

namespace Tests\Feature\Academic;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentResult;
use App\Models\Course;
use App\Models\Member;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportCardApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;
    private User $assignedTeacher;
    private User $unassignedTeacher;
    private AcademicYear $academicYear;
    private SchoolClass $class;
    private Course $course;
    private TeachingAssignment $assignment;
    private Member $student;

    protected function setUp(): void
    {
        parent::setUp();

        $superRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $teacherRole = Role::create(['name' => 'teacher', 'guard_name' => 'web']);

        $this->superadmin = User::factory()->create(['role_id' => $superRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->assignedTeacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->assignedTeacher->syncRoles(['teacher']);

        $this->unassignedTeacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->unassignedTeacher->syncRoles(['teacher']);

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

        $this->course = Course::create([
            'name' => ['en' => 'Bible Study'],
            'code' => 'BIB101',
            'credit_hour' => 1,
            'class_id' => $this->class->id,
        ]);

        $this->assignment = TeachingAssignment::create([
            'teacher_id' => $this->assignedTeacher->id,
            'course_id' => $this->course->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'semester' => 'semester_1',
            'is_primary' => true,
        ]);

        $this->student = Member::create([
            'full_name' => ['en' => 'Hagos Gebre'],
            'date_of_birth' => '2010-02-15',
            'gender' => 'male',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);
    }

    public function test_superadmin_can_retrieve_student_report_card(): void
    {
        $assessment = Assessment::create([
            'teaching_assignment_id' => $this->assignment->id,
            'name' => ['en' => 'Final Exam'],
            'total_score' => 100.00,
            'weight_percentage' => 100.00,
        ]);

        AssessmentResult::create([
            'assessment_id' => $assessment->id,
            'member_id' => $this->student->id,
            'score' => 85.00,
        ]);

        $res = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/report-cards/student/{$this->student->id}?academic_year_id={$this->academicYear->id}&semester=semester_1");

        $res->assertOk()
            ->assertJsonPath('data.student.id', $this->student->id)
            ->assertJsonPath('data.summary.status', 'PASS')
            ->assertJsonPath('data.summary.overall_average', 85)
            ->assertJsonPath('data.courses.0.percentage', 85)
            ->assertJsonPath('data.attendance.score_adjustment', 0);
    }

    public function test_assigned_teacher_can_retrieve_student_report_card(): void
    {
        $assessment = Assessment::create([
            'teaching_assignment_id' => $this->assignment->id,
            'name' => ['en' => 'Final Exam'],
            'total_score' => 100.00,
            'weight_percentage' => 100.00,
        ]);

        AssessmentResult::create([
            'assessment_id' => $assessment->id,
            'member_id' => $this->student->id,
            'score' => 45.00,
        ]);

        $res = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->getJson("/api/report-cards/student/{$this->student->id}?academic_year_id={$this->academicYear->id}&semester=semester_1");

        $res->assertOk()
            ->assertJsonPath('data.summary.status', 'FAIL')
            ->assertJsonPath('data.summary.overall_average', 45);
    }

    public function test_unassigned_teacher_is_forbidden_from_viewing_student_report_card(): void
    {
        $this->actingAs($this->unassignedTeacher, 'sanctum')
            ->getJson("/api/report-cards/student/{$this->student->id}")
            ->assertForbidden();
    }

    public function test_incomplete_report_card_when_assessments_are_missing(): void
    {
        // 2 assessments: 50% + 50% = 100%
        $a1 = Assessment::create([
            'teaching_assignment_id' => $this->assignment->id,
            'name' => ['en' => 'Midterm'],
            'total_score' => 50.00,
            'weight_percentage' => 50.00,
        ]);
        Assessment::create([
            'teaching_assignment_id' => $this->assignment->id,
            'name' => ['en' => 'Final'],
            'total_score' => 50.00,
            'weight_percentage' => 50.00,
        ]);

        // Student only entered midterm
        AssessmentResult::create([
            'assessment_id' => $a1->id,
            'member_id' => $this->student->id,
            'score' => 40.00,
        ]);

        $res = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/report-cards/student/{$this->student->id}?academic_year_id={$this->academicYear->id}&semester=semester_1");

        $res->assertOk()
            ->assertJsonPath('data.summary.status', 'INCOMPLETE')
            ->assertJsonPath('data.summary.is_incomplete', true)
            ->assertJsonPath('data.summary.is_passed', null);
    }

    public function test_class_gradebook_endpoint(): void
    {
        $res = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/report-cards/class/{$this->class->id}?academic_year_id={$this->academicYear->id}&semester=semester_1");

        $res->assertOk()
            ->assertJsonPath('data.class.id', $this->class->id)
            ->assertJsonStructure(['data' => ['class', 'students']]);
    }
}
