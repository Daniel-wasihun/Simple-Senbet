<?php

namespace Tests\Feature\Stage0;

use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use App\Services\TeachingAssignmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class TeachingAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private TeachingAssignmentService $assignmentService;

    private AcademicYear $academicYear;

    private SchoolClass $classA;

    private SchoolClass $classB;

    private Course $courseA;

    private Course $courseB;

    private User $teacher1;

    private User $teacher2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->assignmentService = app(TeachingAssignmentService::class);

        $this->academicYear = AcademicYear::create([
            'name' => ['en' => '2018 E.C.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $this->classA = SchoolClass::create([
            'name' => ['en' => 'Class One'],
            'code' => 'C1',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->classB = SchoolClass::create([
            'name' => ['en' => 'Class Two'],
            'code' => 'C2',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->courseA = Course::create([
            'name' => ['en' => 'Geez 101'],
            'code' => 'GZ1',
            'credit_hour' => 2,
            'class_id' => $this->classA->id,
        ]);

        $this->courseB = Course::create([
            'name' => ['en' => 'History 201'],
            'code' => 'HIS2',
            'credit_hour' => 3,
            'class_id' => $this->classB->id,
        ]);

        $this->teacher1 = User::factory()->create();
        $this->teacher2 = User::factory()->create();
    }

    public function test_can_create_section_specific_teaching_assignment(): void
    {
        $assignment = $this->assignmentService->assign(
            $this->teacher1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-09-01',
            '2026-01-31',
            true
        );

        $this->assertInstanceOf(TeachingAssignment::class, $assignment);
        $this->assertEquals($this->teacher1->id, $assignment->teacher_id);
        $this->assertEquals($this->classA->id, $assignment->class_id);
        $this->assertEquals('A', $assignment->section);
        $this->assertEquals($this->courseA->id, $assignment->course_id);
        $this->assertEquals(Semester::Semester1, $assignment->semester);
        $this->assertTrue($assignment->is_primary);
        $this->assertEquals('2025-09-01', $assignment->start_date->toDateString());
        $this->assertEquals('2026-01-31', $assignment->end_date->toDateString());
    }

    public function test_co_teaching_supports_multiple_teachers_for_same_section_and_course(): void
    {
        $primary = $this->assignmentService->assign(
            $this->teacher1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-09-01',
            '2026-01-31',
            true
        );

        $assistant = $this->assignmentService->assign(
            $this->teacher2->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-09-01',
            '2026-01-31',
            false
        );

        $this->assertTrue($primary->is_primary);
        $this->assertFalse($assistant->is_primary);
        $this->assertEquals(2, TeachingAssignment::where('class_id', $this->classA->id)->where('section', 'A')->count());
    }

    public function test_rejects_assignment_when_course_does_not_belong_to_class(): void
    {
        $this->expectException(ValidationException::class);

        // Course B belongs to Class B, not Class A
        $this->assignmentService->assign(
            $this->teacher1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseB->id,
            Semester::Semester1
        );
    }

    public function test_rejects_second_primary_teacher_with_overlapping_interval(): void
    {
        $this->assignmentService->assign(
            $this->teacher1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-09-01',
            '2026-01-31',
            true
        );

        $this->expectException(ValidationException::class);

        // Teacher 2 attempts to become primary during an overlapping period
        $this->assignmentService->assign(
            $this->teacher2->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-11-01',
            '2026-01-31',
            true
        );
    }

    public function test_allows_sequential_primary_teachers_with_non_overlapping_intervals(): void
    {
        $first = $this->assignmentService->assign(
            $this->teacher1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-09-01',
            '2025-11-01',
            true
        );

        $second = $this->assignmentService->assign(
            $this->teacher2->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-11-01',
            '2026-01-31',
            true
        );

        $this->assertInstanceOf(TeachingAssignment::class, $first);
        $this->assertInstanceOf(TeachingAssignment::class, $second);
    }

    public function test_get_expected_teachers_for_date(): void
    {
        $this->assignmentService->assign(
            $this->teacher1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-09-01',
            '2026-01-31',
            true
        );

        $this->assignmentService->assign(
            $this->teacher2->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-11-01',
            '2026-01-31',
            false
        );

        // Before teacher 2 starts (2025-10-15)
        $teachersOct = $this->assignmentService->getExpectedTeachersForDate(
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-10-15'
        );
        $this->assertCount(1, $teachersOct);
        $this->assertEquals($this->teacher1->id, $teachersOct->first()->teacher_id);

        // When both are active (2025-11-15)
        $teachersNov = $this->assignmentService->getExpectedTeachersForDate(
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-11-15'
        );
        $this->assertCount(2, $teachersNov);

        // After semester ends (2026-02-15)
        $teachersFeb = $this->assignmentService->getExpectedTeachersForDate(
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2026-02-15'
        );
        $this->assertCount(0, $teachersFeb);
    }

    public function test_competing_primary_teacher_assignments_are_serialized_and_rejected(): void
    {
        // 1. First assignment succeeds and creates primary teacher
        $first = $this->assignmentService->assign(
            $this->teacher1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-09-01',
            '2026-01-31',
            true
        );
        $this->assertTrue($first->is_primary);

        // 2. Competing assignment for another teacher during overlapping interval throws ValidationException post-lock
        $this->expectException(ValidationException::class);
        $this->assignmentService->assign(
            $this->teacher2->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-10-01',
            '2026-01-31',
            true
        );
    }

    public function test_canonical_migration_rollback_drops_table(): void
    {
        $migration = require database_path('migrations/2026_10_16_100005_create_teaching_assignments_table.php');
        $this->assertTrue(Schema::hasTable('teaching_assignments'));
        $migration->down();
        $this->assertFalse(Schema::hasTable('teaching_assignments'));
        $migration->up();
        $this->assertTrue(Schema::hasTable('teaching_assignments'));
    }

    public function test_migration_rollback_preflight_aborts_when_multi_section_assignments_exist(): void
    {
        // Create assignments for same teacher and course across two different sections
        $this->assignmentService->assign(
            $this->teacher1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-09-01',
            '2026-01-31',
            false
        );

        $this->assignmentService->assign(
            $this->teacher1->id,
            $this->academicYear->id,
            $this->classA->id,
            'B',
            $this->courseA->id,
            Semester::Semester1,
            '2025-09-01',
            '2026-01-31',
            false
        );

        $migration = require database_path('migrations/2026_10_17_100002_update_teaching_assignments_for_sections.php');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Rollback aborted: Found 1 teaching assignment group(s) with multiple section records.');

        $migration->down();
    }
}
