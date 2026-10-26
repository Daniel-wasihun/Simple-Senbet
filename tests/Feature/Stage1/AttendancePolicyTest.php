<?php

namespace Tests\Feature\Stage1;

use App\Enums\AttendanceStatus;
use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendancePolicyTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    private User $assignedTeacher;

    private User $unassignedTeacher;

    private User $student;

    private AcademicYear $academicYear;

    private SchoolClass $classA;

    private SchoolClass $classB;

    private Course $courseA;

    private Course $courseB;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed canonical roles and permissions
        $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);

        $superRole = Role::findByName('superadmin', 'web');
        $teacherRole = Role::findByName('teacher', 'web');
        $studentRole = Role::findByName('student', 'web');
        $directorRole = Role::findByName('academic_director', 'web');

        $this->superadmin = User::factory()->create(['role_id' => $superRole->id]);
        $this->superadmin->assignRole('superadmin');

        $this->assignedTeacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->assignedTeacher->assignRole('teacher');

        $this->unassignedTeacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->unassignedTeacher->assignRole('teacher');

        $this->student = User::factory()->create(['role_id' => $studentRole->id]);
        $this->student->assignRole('student');

        $this->academicYear = AcademicYear::create([
            'name' => '2025-2026 Academic Year',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $this->classA = SchoolClass::create([
            'name' => ['en' => 'Grade 9'],
            'code' => 'G9',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->classB = SchoolClass::create([
            'name' => ['en' => 'Grade 10'],
            'code' => 'G10',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->courseA = Course::create([
            'class_id' => $this->classA->id,
            'name' => ['en' => 'Mathematics'],
            'code' => 'MATH101',
            'credit_hour' => 3,
        ]);

        $this->courseB = Course::create([
            'class_id' => $this->classB->id,
            'name' => ['en' => 'Physics'],
            'code' => 'PHYS101',
            'credit_hour' => 3,
        ]);

        // Teaching assignment for assignedTeacher in Class A, Course A, Section A
        TeachingAssignment::create([
            'teacher_id' => $this->assignedTeacher->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->classA->id,
            'section' => 'A',
            'course_id' => $this->courseA->id,
            'semester' => Semester::Semester1,
            'start_date' => '2025-09-01',
            'end_date' => '2026-01-31',
            'is_primary' => true,
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private int $slotCounter = 1;

    private function createSession(AttendanceStatus $status = AttendanceStatus::Draft, ?Carbon $submittedAt = null): AttendanceSession
    {
        $slot = 'period_'.($this->slotCounter++);

        return AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'date' => '2025-10-15',
            'time_slot' => $slot,
            'status' => $status,
            'submitted_by' => $status !== AttendanceStatus::Draft ? $this->assignedTeacher->id : null,
            'submitted_at' => $submittedAt ?? ($status !== AttendanceStatus::Draft ? '2025-10-15 10:00:00' : null),
            'closed_at' => $status === AttendanceStatus::Closed ? '2025-10-15 12:00:00' : null,
        ]);
    }

    // =========================================================================
    // 1. VIEW TESTS
    // =========================================================================

    public function test_superadmin_can_view_any_and_all_sessions(): void
    {
        $session = $this->createSession();

        $this->assertTrue($this->superadmin->can('viewAny', AttendanceSession::class));
        $this->assertTrue($this->superadmin->can('view', $session));
    }

    public function test_assigned_teacher_can_view_session(): void
    {
        $session = $this->createSession();

        $this->assertTrue($this->assignedTeacher->can('viewAny', AttendanceSession::class));
        $this->assertTrue($this->assignedTeacher->can('view', $session));
    }

    public function test_unassigned_teacher_cannot_view_session(): void
    {
        $session = $this->createSession();

        $this->assertFalse($this->unassignedTeacher->can('view', $session));
    }

    public function test_student_cannot_view_session(): void
    {
        $session = $this->createSession();

        $this->assertFalse($this->student->can('viewAny', AttendanceSession::class));
        $this->assertFalse($this->student->can('view', $session));
    }

    // =========================================================================
    // 2. CREATE TESTS
    // =========================================================================

    public function test_superadmin_can_create_session(): void
    {
        $this->assertTrue($this->superadmin->can('create', AttendanceSession::class));
    }

    public function test_assigned_teacher_can_create_session_with_valid_assignment_context(): void
    {
        $canCreate = $this->assignedTeacher->can('create', [
            AttendanceSession::class,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
        ]);

        $this->assertTrue($canCreate);
    }

    public function test_teacher_cannot_create_session_without_context_deny_by_default(): void
    {
        // Authentication alone is not sufficient; context is required
        $this->assertFalse($this->assignedTeacher->can('create', AttendanceSession::class));
    }

    public function test_teacher_cannot_create_session_for_unassigned_class_or_course(): void
    {
        // Different class and course
        $canCreate = $this->assignedTeacher->can('create', [
            AttendanceSession::class,
            $this->classB->id,
            $this->courseB->id,
            '2025-10-15',
        ]);

        $this->assertFalse($canCreate);
    }

    public function test_teacher_cannot_create_session_outside_assignment_date_interval(): void
    {
        // Assignment ended on 2026-01-31; checking 2026-02-15
        $canCreate = $this->assignedTeacher->can('create', [
            AttendanceSession::class,
            $this->classA->id,
            $this->courseA->id,
            '2026-02-15',
        ]);

        $this->assertFalse($canCreate);
    }

    // =========================================================================
    // 3. SUBMIT TESTS & LIFECYCLE
    // =========================================================================

    public function test_assigned_teacher_and_superadmin_can_submit_draft_session(): void
    {
        $draftSession = $this->createSession(AttendanceStatus::Draft);

        $this->assertTrue($this->assignedTeacher->can('submit', $draftSession));
        $this->assertTrue($this->superadmin->can('submit', $draftSession));
    }

    public function test_unassigned_teacher_and_student_cannot_submit_draft_session(): void
    {
        $draftSession = $this->createSession(AttendanceStatus::Draft);

        $this->assertFalse($this->unassignedTeacher->can('submit', $draftSession));
        $this->assertFalse($this->student->can('submit', $draftSession));
    }

    public function test_cannot_submit_already_submitted_or_closed_session(): void
    {
        $submittedSession = $this->createSession(AttendanceStatus::Submitted);
        $closedSession = $this->createSession(AttendanceStatus::Closed);

        // Even superadmin cannot submit a non-draft session (lifecycle restriction)
        $this->assertFalse($this->assignedTeacher->can('submit', $submittedSession));
        $this->assertFalse($this->superadmin->can('submit', $submittedSession));
        $this->assertFalse($this->assignedTeacher->can('submit', $closedSession));
        $this->assertFalse($this->superadmin->can('submit', $closedSession));
    }

    // =========================================================================
    // 4. CORRECT TESTS & 24-HOUR WINDOW
    // =========================================================================

    public function test_assigned_teacher_can_correct_within_24_hour_window(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->createSession(AttendanceStatus::Submitted, $submissionTime);

        // At +2 hours
        Carbon::setTestNow($submissionTime->copy()->addHours(2));

        $this->assertTrue($this->assignedTeacher->can('correct', $session));
        $this->assertTrue($this->superadmin->can('correct', $session));
    }

    public function test_assigned_teacher_can_correct_at_exact_24_hour_boundary(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->createSession(AttendanceStatus::Submitted, $submissionTime);

        // Exactly at +24 hours (inclusive boundary)
        Carbon::setTestNow($submissionTime->copy()->addHours(24));

        $this->assertTrue($this->assignedTeacher->can('correct', $session));
        $this->assertTrue($this->superadmin->can('correct', $session));
    }

    public function test_assigned_teacher_denied_correction_after_24_hours(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->createSession(AttendanceStatus::Submitted, $submissionTime);

        // At +24 hours and 1 second
        Carbon::setTestNow($submissionTime->copy()->addHours(24)->addSecond());

        $this->assertFalse($this->assignedTeacher->can('correct', $session));
        // Superadmin retains administrative override authority
        $this->assertTrue($this->superadmin->can('correct', $session));
    }

    public function test_cannot_correct_draft_or_closed_session(): void
    {
        $draftSession = $this->createSession(AttendanceStatus::Draft);
        $closedSession = $this->createSession(AttendanceStatus::Closed);

        $this->assertFalse($this->assignedTeacher->can('correct', $draftSession));
        $this->assertFalse($this->superadmin->can('correct', $draftSession));
        $this->assertFalse($this->assignedTeacher->can('correct', $closedSession));
        $this->assertFalse($this->superadmin->can('correct', $closedSession));
    }

    // =========================================================================
    // 5. CLOSE TESTS
    // =========================================================================

    public function test_superadmin_can_close_submitted_session(): void
    {
        $submittedSession = $this->createSession(AttendanceStatus::Submitted);

        $this->assertTrue($this->superadmin->can('close', $submittedSession));
    }

    public function test_ordinary_teacher_cannot_close_session(): void
    {
        $submittedSession = $this->createSession(AttendanceStatus::Submitted);

        $this->assertFalse($this->assignedTeacher->can('close', $submittedSession));
    }

    public function test_cannot_close_draft_or_closed_session(): void
    {
        $draftSession = $this->createSession(AttendanceStatus::Draft);
        $closedSession = $this->createSession(AttendanceStatus::Closed);

        $this->assertFalse($this->superadmin->can('close', $draftSession));
        $this->assertFalse($this->superadmin->can('close', $closedSession));
    }

    // =========================================================================
    // 6. ACADEMIC DIRECTOR & HOMEROOM & DELETE TESTS
    // =========================================================================

    public function test_academic_director_role_can_view_and_close_session(): void
    {
        $director = User::factory()->create();
        $director->assignRole('academic_director');

        $submittedSession = $this->createSession(AttendanceStatus::Submitted);

        $this->assertTrue($director->can('view', $submittedSession));
        $this->assertTrue($director->can('close', $submittedSession));
    }

    public function test_homeroom_session_authorization_by_class_teacher(): void
    {
        // Homeroom session has course_id = null
        $homeroomSession = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => null,
            'date' => '2025-10-15',
            'time_slot' => 'homeroom_morning',
            'status' => AttendanceStatus::Draft,
        ]);

        // assignedTeacher is assigned to Class A, so can view and submit homeroom
        $this->assertTrue($this->assignedTeacher->can('view', $homeroomSession));
        $this->assertTrue($this->assignedTeacher->can('submit', $homeroomSession));

        // unassignedTeacher is not assigned to Class A
        $this->assertFalse($this->unassignedTeacher->can('view', $homeroomSession));
        $this->assertFalse($this->unassignedTeacher->can('submit', $homeroomSession));
    }

    public function test_delete_lifecycle_and_role_restrictions(): void
    {
        $draftSession = $this->createSession(AttendanceStatus::Draft);
        $closedSession = $this->createSession(AttendanceStatus::Closed);

        $this->assertTrue($this->superadmin->can('delete', $draftSession));
        $this->assertFalse($this->superadmin->can('delete', $closedSession));
        $this->assertFalse($this->assignedTeacher->can('delete', $draftSession));
    }
}
