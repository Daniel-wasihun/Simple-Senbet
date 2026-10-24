<?php

namespace Tests\Feature\Academic;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Course;
use App\Models\Member;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicCrudAndAuthTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    private User $teacher;

    private Role $superadminRole;

    private Role $teacherRole;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup roles and permissions
        $this->superadminRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $this->teacherRole = Role::create(['name' => 'teacher', 'guard_name' => 'web']);

        $permissions = [
            'school-classes.view', 'school-classes.create', 'school-classes.update', 'school-classes.delete',
            'courses.view', 'courses.create', 'courses.update', 'courses.delete',
            'members.view', 'members.create', 'members.update', 'members.delete',
            'assessments.view', 'assessments.create', 'assessments.update', 'assessments.delete',
            'assessment-results.view', 'assessment-results.create', 'assessment-results.update', 'assessment-results.delete',
        ];

        foreach ($permissions as $perm) {
            $p = Permission::create(['name' => $perm, 'guard_name' => 'web']);
            $this->superadminRole->givePermissionTo($p);
            if (str_contains($perm, '.view')) {
                $this->teacherRole->givePermissionTo($p);
            }
        }

        $this->superadmin = User::factory()->create(['role_id' => $this->superadminRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->teacher = User::factory()->create(['role_id' => $this->teacherRole->id]);
        $this->teacher->syncRoles(['teacher']);
    }

    public function test_academic_year_crud_and_role_authorization(): void
    {
        // 1. Superadmin can create academic year
        $createRes = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/academic-years', [
            'name' => '2018 E.C.',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);
        $createRes->assertCreated();
        $yearId = $createRes->json('data.id');

        // 2. Non-superadmin cannot create or list academic years via admin endpoint
        $this->actingAs($this->teacher, 'sanctum')->postJson('/api/academic-years', [
            'name' => '2019 E.C.',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
        ])->assertForbidden();

        // 3. Validation: start_date before end_date
        $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/academic-years', [
            'name' => 'Invalid Year',
            'start_date' => '2026-06-30',
            'end_date' => '2025-09-01',
        ])->assertUnprocessable();

        // 4. Update
        $this->actingAs($this->superadmin, 'sanctum')->putJson("/api/academic-years/{$yearId}", [
            'name' => '2018 Academic Year Updated',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ])->assertOk();
    }

    public function test_school_class_and_course_crud(): void
    {
        // 1. Create class
        $classRes = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/school-classes', [
            'name' => 'Grade 9',
            'code' => 'G9',
            'number_of_sections' => 3,
            'passing_score' => 50.00,
        ]);
        $classRes->assertCreated();
        $classId = $classRes->json('data.id');

        // 2. Reject duplicate class code
        $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/school-classes', [
            'name' => 'Grade 9 Duplicate',
            'code' => 'G9',
            'number_of_sections' => 1,
            'passing_score' => 50.00,
        ])->assertUnprocessable();

        // 3. Create course for class
        $courseRes = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/courses', [
            'name' => 'Bible Study',
            'code' => 'BIB101',
            'credit_hour' => 3,
            'class_id' => $classId,
        ]);
        $courseRes->assertCreated();
        $courseId = $courseRes->json('data.id');

        // 4. Verify teacher can view class and course
        $this->actingAs($this->teacher, 'sanctum')->getJson("/api/school-classes/{$classId}")->assertOk();
        $this->actingAs($this->teacher, 'sanctum')->getJson("/api/courses/{$courseId}")->assertOk();

        // 5. Update course
        $this->actingAs($this->superadmin, 'sanctum')->putJson("/api/courses/{$courseId}", [
            'name' => 'Bible Study Advanced',
            'code' => 'BIB101',
            'credit_hour' => 4,
            'class_id' => $classId,
        ])->assertOk();
    }

    public function test_member_and_student_enrollment_crud(): void
    {
        $class = SchoolClass::create([
            'name' => ['en' => 'Grade 10'],
            'code' => 'G10',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        // 1. Create student member
        $memberRes = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/members', [
            'full_name' => 'Yonas Bekele',
            'christian_name' => 'Hailemaryam',
            'date_of_birth' => '2010-04-12',
            'gender' => 'male',
            'class_id' => $class->id,
            'section' => 'A',
            'phone_number' => '+251911223344',
        ]);
        $memberRes->assertCreated();
        $memberId = $memberRes->json('data.id');

        // 2. Fetch and verify
        $this->actingAs($this->superadmin, 'sanctum')->getJson("/api/members/{$memberId}")
            ->assertOk()
            ->assertJsonPath('data.section', 'A');

        // 3. Update member section
        $this->actingAs($this->superadmin, 'sanctum')->putJson("/api/members/{$memberId}", [
            'full_name' => 'Yonas Bekele',
            'date_of_birth' => '2010-04-12',
            'gender' => 'male',
            'class_id' => $class->id,
            'section' => 'B',
        ])->assertOk();

        $this->assertDatabaseHas('members', ['id' => $memberId, 'section' => 'B']);
    }

    public function test_assessment_and_assessment_results_crud(): void
    {
        $year = AcademicYear::create([
            'name' => ['en' => '2018 E.C.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $class = SchoolClass::create([
            'name' => ['en' => 'Grade 11'],
            'code' => 'G11',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $course = Course::create([
            'name' => ['en' => 'Church History'],
            'code' => 'HIST101',
            'credit_hour' => 2,
            'class_id' => $class->id,
        ]);

        $assignment = TeachingAssignment::create([
            'teacher_id' => $this->teacher->id,
            'course_id' => $course->id,
            'academic_year_id' => $year->id,
            'class_id' => $class->id,
            'section' => 'A',
            'semester' => 'semester_1',
            'is_primary' => true,
            'start_date' => '2025-09-01',
        ]);

        $member = Member::create([
            'full_name' => ['en' => 'Sara Daniel'],
            'date_of_birth' => '2009-08-20',
            'gender' => 'female',
            'class_id' => $class->id,
            'section' => 'A',
        ]);

        // 1. Create Assessment
        $assessmentRes = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/assessments', [
            'teaching_assignment_id' => $assignment->id,
            'name' => 'Midterm Exam',
            'total_score' => 50.00,
            'weight_percentage' => 40.00,
        ]);
        $assessmentRes->assertCreated();
        $assessmentId = $assessmentRes->json('data.id');

        // 2. Reject total_score <= 0 or invalid weight
        $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/assessments', [
            'teaching_assignment_id' => $assignment->id,
            'name' => 'Invalid Assessment',
            'total_score' => -10,
            'weight_percentage' => 120,
        ])->assertUnprocessable();

        // 3. Create Assessment Result
        $resultRes = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/assessment-results', [
            'assessment_id' => $assessmentId,
            'member_id' => $member->id,
            'score' => 42.50,
            'remarks' => 'Excellent work',
        ]);
        $resultRes->assertCreated();
        $resultId = $resultRes->json('data.id');

        // 4. Reject score exceeding total_score
        $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/assessment-results', [
            'assessment_id' => $assessmentId,
            'member_id' => $member->id,
            'score' => 55.00,
        ])->assertUnprocessable();

        // 5. Update score
        $this->actingAs($this->superadmin, 'sanctum')->putJson("/api/assessment-results/{$resultId}", [
            'assessment_id' => $assessmentId,
            'member_id' => $member->id,
            'score' => 45.00,
        ])->assertOk();

        $this->assertDatabaseHas('assessment_results', [
            'id' => $resultId,
            'score' => 45.00,
        ]);
    }
}
