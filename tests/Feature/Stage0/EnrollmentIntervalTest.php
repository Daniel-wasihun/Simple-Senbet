<?php

namespace Tests\Feature\Stage0;

use App\Models\AcademicYear;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Services\StudentEnrollmentService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class EnrollmentIntervalTest extends TestCase
{
    use RefreshDatabase;

    private StudentEnrollmentService $enrollmentService;
    private AcademicYear $academicYear;
    private SchoolClass $classA;
    private SchoolClass $classB;
    private Member $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->enrollmentService = app(StudentEnrollmentService::class);

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

        $this->student = Member::create([
            'full_name' => ['en' => 'Dawit Haile'],
            'date_of_birth' => '2015-05-10',
            'gender' => 'male',
            'class_id' => $this->classA->id,
            'section' => 'A',
        ]);
    }

    public function test_can_enroll_student_in_class_and_section_and_syncs_member_projection(): void
    {
        $enrollment = $this->enrollmentService->enroll(
            $this->student->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );

        $this->assertInstanceOf(StudentEnrollment::class, $enrollment);
        $this->assertEquals($this->student->id, $enrollment->member_id);
        $this->assertEquals($this->classA->id, $enrollment->class_id);
        $this->assertEquals('A', $enrollment->section);
        $this->assertEquals('2025-09-01', $enrollment->start_date->toDateString());
        $this->assertNull($enrollment->end_date);

        // Verify member projection sync
        $this->student->refresh();
        $this->assertEquals($this->classA->id, $this->student->class_id);
        $this->assertEquals('A', $this->student->section);

        // Verify activeEnrollment relationship
        $this->assertNotNull($this->student->activeEnrollment);
        $this->assertEquals($enrollment->id, $this->student->activeEnrollment->id);
    }

    public function test_cannot_create_two_concurrent_active_enrollments_for_same_student(): void
    {
        $this->enrollmentService->enroll(
            $this->student->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );

        $this->expectException(ValidationException::class);
        $this->enrollmentService->enroll(
            $this->student->id,
            $this->academicYear->id,
            $this->classB->id,
            'B',
            '2025-10-01'
        );
    }

    public function test_database_partial_unique_index_prevents_duplicate_active_enrollment(): void
    {
        StudentEnrollment::create([
            'member_id' => $this->student->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->classA->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
            'end_date' => null,
        ]);

        $this->expectException(QueryException::class);
        StudentEnrollment::create([
            'member_id' => $this->student->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->classB->id,
            'section' => 'B',
            'start_date' => '2025-10-01',
            'end_date' => null,
        ]);
    }

    public function test_cannot_enroll_with_start_date_outside_academic_year(): void
    {
        $this->expectException(ValidationException::class);
        $this->enrollmentService->enroll(
            $this->student->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-08-01' // Before 2025-09-01
        );
    }

    public function test_cannot_enroll_overlapping_historical_interval(): void
    {
        // Create closed historical enrollment: 2025-09-01 to 2025-10-15
        StudentEnrollment::create([
            'member_id' => $this->student->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->classA->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
            'end_date' => '2025-10-15',
        ]);

        // Attempt to enroll on 2025-10-05 (which is < 2025-10-15)
        $this->expectException(ValidationException::class);
        $this->enrollmentService->enroll(
            $this->student->id,
            $this->academicYear->id,
            $this->classA->id,
            'B',
            '2025-10-05'
        );
    }

    public function test_student_transfer_closes_old_enrollment_and_creates_new_at_transfer_date(): void
    {
        $initial = $this->enrollmentService->enroll(
            $this->student->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );

        $transfer = $this->enrollmentService->transfer(
            $this->student->id,
            $this->classB->id,
            'B',
            '2025-10-01',
            'Promoted to class 2'
        );

        $initial->refresh();
        $this->assertEquals('2025-10-01', $initial->end_date->toDateString());
        $this->assertEquals('Promoted to class 2', $initial->transfer_reason);

        $this->assertEquals($this->classB->id, $transfer->class_id);
        $this->assertEquals('B', $transfer->section);
        $this->assertEquals('2025-10-01', $transfer->start_date->toDateString());
        $this->assertNull($transfer->end_date);

        // Cached projection updated
        $this->student->refresh();
        $this->assertEquals($this->classB->id, $this->student->class_id);
        $this->assertEquals('B', $this->student->section);
        $this->assertEquals($transfer->id, $this->student->activeEnrollment->id);
    }

    public function test_transfer_date_cannot_be_before_or_on_start_date(): void
    {
        $this->enrollmentService->enroll(
            $this->student->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );

        // Same day transfer rejected
        $this->expectException(ValidationException::class);
        $this->enrollmentService->transfer(
            $this->student->id,
            $this->classA->id,
            'B',
            '2025-09-01'
        );
    }

    public function test_roster_query_determines_membership_by_effective_date(): void
    {
        $this->enrollmentService->enroll(
            $this->student->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );

        $this->enrollmentService->transfer(
            $this->student->id,
            $this->classA->id,
            'B',
            '2025-10-01'
        );

        // On 2025-09-30 (day before transfer): student belongs to section A
        $rosterA_before = $this->enrollmentService->getRosterForDate($this->classA->id, 'A', '2025-09-30');
        $this->assertTrue($rosterA_before->contains('id', $this->student->id));

        $rosterB_before = $this->enrollmentService->getRosterForDate($this->classA->id, 'B', '2025-09-30');
        $this->assertFalse($rosterB_before->contains('id', $this->student->id));

        // On 2025-10-01 (transfer date): student belongs to section B
        $rosterA_on = $this->enrollmentService->getRosterForDate($this->classA->id, 'A', '2025-10-01');
        $this->assertFalse($rosterA_on->contains('id', $this->student->id));

        $rosterB_on = $this->enrollmentService->getRosterForDate($this->classA->id, 'B', '2025-10-01');
        $this->assertTrue($rosterB_on->contains('id', $this->student->id));
    }

    public function test_withdrawal_closes_active_enrollment_and_clears_member_projection(): void
    {
        $enrollment = $this->enrollmentService->enroll(
            $this->student->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );

        $withdrawn = $this->enrollmentService->withdraw($this->student->id, '2025-11-15', 'Relocated');

        $enrollment->refresh();
        $this->assertEquals('2025-11-15', $enrollment->end_date->toDateString());
        $this->assertEquals('Relocated', $enrollment->transfer_reason);

        $this->student->refresh();
        $this->assertNull($this->student->section);
        $this->assertNull($this->student->activeEnrollment);
    }
}
