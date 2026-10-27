<?php

namespace Tests\Feature;

use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeachingAssignmentApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    private User $teacher1;

    private User $teacher2;

    private AcademicYear $academicYear;

    private SchoolClass $class;

    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);

        $superadminRole = Role::findByName('superadmin', 'web');
        $teacherRole = Role::findByName('teacher', 'web');

        $this->superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->teacher1 = User::factory()->create(['name' => 'Teacher One', 'role_id' => $teacherRole->id]);
        $this->teacher1->syncRoles(['teacher']);

        $this->teacher2 = User::factory()->create(['name' => 'Teacher Two', 'role_id' => $teacherRole->id]);
        $this->teacher2->syncRoles(['teacher']);

        $this->academicYear = AcademicYear::create([
            'name' => '2025-2026 Academic Year',
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
            'class_id' => $this->class->id,
            'name' => ['en' => 'Church Dogma'],
            'code' => 'DOGMA101',
            'credit_hour' => 3,
        ]);
    }

    public function test_superadmin_can_create_teaching_assignment(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/teaching-assignments', [
            'teacher_id' => $this->teacher1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'course_id' => $this->course->id,
            'semester' => Semester::Semester1->value,
            'start_date' => '2025-09-01',
            'is_primary' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.teacher_id', $this->teacher1->id)
            ->assertJsonPath('data.section', 'A')
            ->assertJsonPath('data.is_primary', true);

        $this->assertDatabaseHas('teaching_assignments', [
            'teacher_id' => $this->teacher1->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'course_id' => $this->course->id,
            'is_primary' => true,
        ]);
    }

    public function test_teaching_assignment_can_be_created_without_academic_year_id_using_semester_only(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/teaching-assignments', [
            'teacher_id' => $this->teacher2->id,
            'class_id' => $this->class->id,
            'section' => 'B',
            'course_id' => $this->course->id,
            'semester' => Semester::Semester2->value,
            'is_primary' => false,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.teacher_id', $this->teacher2->id)
            ->assertJsonPath('data.semester', Semester::Semester2->value);

        $this->assertDatabaseHas('teaching_assignments', [
            'teacher_id' => $this->teacher2->id,
            'class_id' => $this->class->id,
            'section' => 'B',
            'course_id' => $this->course->id,
            'semester' => Semester::Semester2->value,
            'academic_year_id' => $this->academicYear->id,
        ]);
    }

    public function test_teacher_cannot_create_teaching_assignment(): void
    {
        $response = $this->actingAs($this->teacher1, 'sanctum')->postJson('/api/teaching-assignments', [
            'teacher_id' => $this->teacher1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'course_id' => $this->course->id,
            'semester' => Semester::Semester1->value,
        ]);

        $response->assertForbidden();
    }

    public function test_superadmin_can_list_and_filter_teaching_assignments(): void
    {
        TeachingAssignment::create([
            'teacher_id' => $this->teacher1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'course_id' => $this->course->id,
            'semester' => Semester::Semester1->value,
            'start_date' => '2025-09-01',
            'is_primary' => true,
        ]);

        $response = $this->actingAs($this->superadmin, 'sanctum')->getJson('/api/teaching-assignments?section=A');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('pagination.total', 1);
    }

    public function test_teacher_only_sees_their_own_assignments_when_listing(): void
    {
        TeachingAssignment::create([
            'teacher_id' => $this->teacher1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'course_id' => $this->course->id,
            'semester' => Semester::Semester1->value,
            'start_date' => '2025-09-01',
            'is_primary' => true,
        ]);

        TeachingAssignment::create([
            'teacher_id' => $this->teacher2->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'B',
            'course_id' => $this->course->id,
            'semester' => Semester::Semester1->value,
            'start_date' => '2025-09-01',
            'is_primary' => true,
        ]);

        // Teacher 1 listing: only sees their own assignment (1 total, not 2)
        $response = $this->actingAs($this->teacher1, 'sanctum')->getJson('/api/teaching-assignments');

        $response->assertOk()
            ->assertJsonPath('pagination.total', 1)
            ->assertJsonPath('data.0.teacher_id', $this->teacher1->id);
    }

    public function test_superadmin_can_end_teaching_assignment(): void
    {
        $assignment = TeachingAssignment::create([
            'teacher_id' => $this->teacher1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'course_id' => $this->course->id,
            'semester' => Semester::Semester1->value,
            'start_date' => '2025-09-01',
            'is_primary' => true,
        ]);

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->postJson("/api/teaching-assignments/{$assignment->id}/end", [
                'end_date' => '2025-12-31',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.end_date', '2025-12-31');

        $this->assertEquals('2025-12-31', $assignment->fresh()->end_date?->toDateString());
    }

    public function test_superadmin_can_delete_teaching_assignment(): void
    {
        $assignment = TeachingAssignment::create([
            'teacher_id' => $this->teacher1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'course_id' => $this->course->id,
            'semester' => Semester::Semester1->value,
            'start_date' => '2025-09-01',
            'is_primary' => true,
        ]);

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->deleteJson("/api/teaching-assignments/{$assignment->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('teaching_assignments', ['id' => $assignment->id]);
    }

    public function test_query_expected_teachers_for_date(): void
    {
        TeachingAssignment::create([
            'teacher_id' => $this->teacher1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'course_id' => $this->course->id,
            'semester' => Semester::Semester1->value,
            'start_date' => '2025-09-01',
            'is_primary' => true,
        ]);

        $response = $this->actingAs($this->superadmin, 'sanctum')->getJson(
            '/api/teaching-assignments/expected?class_id='.$this->class->id.
            '&section=A&course_id='.$this->course->id.
            '&semester='.Semester::Semester1->value.
            '&date=2025-10-15'
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.teacher_id', $this->teacher1->id);
    }
}
