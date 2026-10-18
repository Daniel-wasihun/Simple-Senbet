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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdministrativeGradebookOverviewTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;
    private User $director;
    private User $assignedTeacher;
    private User $unassignedTeacher;
    private AcademicYear $year;
    private SchoolClass $class;
    private Course $course;
    private TeachingAssignment $assignmentA;
    private Member $studentA;
    private Member $studentB;

    protected function setUp(): void
    {
        parent::setUp();

        $superRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $directorRole = Role::create(['name' => 'academic_director', 'guard_name' => 'web']);
        $teacherRole = Role::create(['name' => 'teacher', 'guard_name' => 'web']);

        $this->superadmin = User::factory()->create(['role_id' => $superRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->director = User::factory()->create(['role_id' => $directorRole->id]);
        $this->director->syncRoles(['academic_director']);

        $this->assignedTeacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->assignedTeacher->syncRoles(['teacher']);

        $this->unassignedTeacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->unassignedTeacher->syncRoles(['teacher']);

        $this->year = AcademicYear::create([
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

        $this->assignmentA = TeachingAssignment::create([
            'teacher_id' => $this->assignedTeacher->id,
            'course_id' => $this->course->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'semester' => 'semester_1',
            'is_primary' => true,
        ]);

        $assessment = Assessment::create([
            'teaching_assignment_id' => $this->assignmentA->id,
            'name' => ['en' => 'Final Exam'],
            'total_score' => 100.00,
            'weight_percentage' => 100.00,
        ]);

        $this->studentA = Member::create([
            'full_name' => ['en' => 'Student A'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);
        StudentEnrollment::create([
            'member_id' => $this->studentA->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
        ]);

        AssessmentResult::create([
            'assessment_id' => $assessment->id,
            'member_id' => $this->studentA->id,
            'score' => 88.00,
        ]);

        $this->studentB = Member::create([
            'full_name' => ['en' => 'Student B (Incomplete)'],
            'date_of_birth' => '2010-02-01',
            'gender' => 'female',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);
        StudentEnrollment::create([
            'member_id' => $this->studentB->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
        ]);
    }

    public function test_superadmin_can_access_gradebook_overview(): void
    {
        $res = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/report-cards/class/{$this->class->id}?academic_year_id={$this->year->id}&semester=semester_1");

        $res->assertOk()
            ->assertJsonPath('data.class.id', $this->class->id)
            ->assertJsonPath('data.total_students', 2);
    }

    public function test_academic_director_can_access_gradebook_overview(): void
    {
        $res = $this->actingAs($this->director, 'sanctum')
            ->getJson("/api/report-cards/class/{$this->class->id}?academic_year_id={$this->year->id}&semester=semester_1");

        $res->assertOk()
            ->assertJsonPath('data.class.id', $this->class->id);
    }

    public function test_assigned_teacher_can_access_gradebook_overview(): void
    {
        $res = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->getJson("/api/report-cards/class/{$this->class->id}?academic_year_id={$this->year->id}&semester=semester_1");

        $res->assertOk()
            ->assertJsonPath('data.class.id', $this->class->id);
    }

    public function test_unassigned_teacher_is_forbidden_from_class_gradebook(): void
    {
        $res = $this->actingAs($this->unassignedTeacher, 'sanctum')
            ->getJson("/api/report-cards/class/{$this->class->id}?academic_year_id={$this->year->id}&semester=semester_1");

        $res->assertForbidden();
    }

    public function test_filter_by_section_returns_section_specific_students(): void
    {
        $res = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/report-cards/class/{$this->class->id}?academic_year_id={$this->year->id}&semester=semester_1&section=A");

        $res->assertOk();
        $students = $res->json('data.students');
        foreach ($students as $st) {
            $this->assertEquals('A', $st['section']);
        }
    }
}
