<?php

namespace Tests\Feature\Stage1;

use App\Enums\AttendanceAuditAction;
use App\Enums\AttendanceMark;
use App\Enums\AttendanceStatus;
use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\AttendanceAuditLog;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Member;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\SessionStudentRecord;
use App\Models\SessionTeacherRecord;
use App\Models\User;
use App\Services\AttendanceService;
use App\Services\StudentEnrollmentService;
use App\Services\TeachingAssignmentService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AttendanceConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    private AttendanceService $attendanceService;

    private StudentEnrollmentService $enrollmentService;

    private TeachingAssignmentService $teachingAssignmentService;

    private AcademicYear $academicYear;

    private SchoolClass $classA;

    private Course $courseA;

    private User $teacher;

    private User $teacher2;

    private User $superadmin;

    private Member $student1;

    private Member $student2;

    private int $slotSequence = 1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->enrollmentService = app(StudentEnrollmentService::class);
        $this->teachingAssignmentService = app(TeachingAssignmentService::class);
        $this->attendanceService = app(AttendanceService::class);

        // Academic Year: Sep 1, 2025 to Jun 30, 2026
        $this->academicYear = AcademicYear::create([
            'name' => ['en' => '2025-2026 Academic Year'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        // Class
        $this->classA = SchoolClass::create([
            'name' => ['en' => 'Grade 10'],
            'code' => 'G10',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        // Course
        $this->courseA = Course::create([
            'class_id' => $this->classA->id,
            'name' => ['en' => 'Mathematics 10'],
            'code' => 'MATH-10',
            'credit_hour' => 3,
        ]);

        // Canonical Roles and Users
        $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
        $teacherRole = Role::findByName('teacher', 'web');
        $superadminRole = Role::findByName('superadmin', 'web');

        $this->teacher = User::factory()->create(['name' => 'Primary Teacher', 'role_id' => $teacherRole->id]);
        $this->teacher->assignRole('teacher');

        $this->teacher2 = User::factory()->create(['name' => 'Assistant Teacher', 'role_id' => $teacherRole->id]);
        $this->teacher2->assignRole('teacher');

        $this->superadmin = User::factory()->create(['name' => 'Super Administrator', 'role_id' => $superadminRole->id]);
        $this->superadmin->assignRole('superadmin');

        // Students in Class A, Section A
        $this->student1 = Member::create([
            'full_name' => ['en' => 'Abebe Bikila'],
            'date_of_birth' => '2008-01-01',
            'gender' => 'male',
            'class_id' => $this->classA->id,
            'section' => 'A',
            'status' => 'active',
        ]);

        $this->student2 = Member::create([
            'full_name' => ['en' => 'Derartu Tulu'],
            'date_of_birth' => '2008-02-02',
            'gender' => 'female',
            'class_id' => $this->classA->id,
            'section' => 'A',
            'status' => 'active',
        ]);

        // Enroll students
        $this->enrollmentService->enroll(
            $this->student1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->academicYear->start_date
        );

        $this->enrollmentService->enroll(
            $this->student2->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->academicYear->start_date
        );

        // Assign teacher to course
        $this->teachingAssignmentService->assign(
            $this->teacher->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            $this->academicYear->start_date,
            $this->academicYear->end_date,
            true
        );
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function nextSlot(): string
    {
        return 'Period-C'.($this->slotSequence++);
    }

    /**
     * Helper to create a standard draft course session
     */
    private function createDraftSession(?string $date = null, ?string $slot = null): AttendanceSession
    {
        return $this->attendanceService->createSession(
            academicYearId: $this->academicYear->id,
            termId: 1,
            classId: $this->classA->id,
            courseId: $this->courseA->id,
            date: $date ?? '2025-10-15',
            timeSlot: $slot ?? $this->nextSlot(),
            creatorId: $this->teacher->id
        );
    }

    // =========================================================================
    // Scope A: Concurrency, Locking & Atomicity Verification
    // =========================================================================

    public function test_concurrent_submission_serialization_only_one_succeeds_and_second_fails(): void
    {
        $session = $this->createDraftSession();

        $studentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Absent, 'remarks' => 'Illness'],
        ];
        $teacherMarks = [
            ['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present],
        ];

        // Submission 1 succeeds and transitions status from Draft to Submitted
        $submittedSession = $this->attendanceService->submitSession(
            $session,
            $studentMarks,
            $teacherMarks,
            $this->teacher,
            'A',
            Semester::Semester1
        );

        $this->assertEquals(AttendanceStatus::Submitted, $submittedSession->status);
        $this->assertNotNull($submittedSession->submitted_at);
        $this->assertEquals($this->teacher->id, $submittedSession->submitted_by);

        // Competing submission 2 attempts to submit the same session
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Only draft sessions can be submitted');

        $this->attendanceService->submitSession(
            $session->fresh(),
            $studentMarks,
            $teacherMarks,
            $this->teacher,
            'A',
            Semester::Semester1
        );
    }

    public function test_concurrent_submission_via_api_returns_403_forbidden_on_second_attempt(): void
    {
        $session = $this->createDraftSession();

        $payload = [
            'section' => 'A',
            'semester' => Semester::Semester1->value,
            'student_marks' => [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present->value],
                ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present->value],
            ],
            'teacher_marks' => [
                ['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present->value],
            ],
        ];

        // First API submission -> 200 OK
        $response1 = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/submit", $payload);
        $response1->assertOk()
            ->assertJsonPath('data.status', AttendanceStatus::Submitted->value);

        // Competing concurrent API submission -> 403 Forbidden by Policy defense
        $response2 = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/submit", $payload);
        $response2->assertForbidden();
    }

    public function test_simulated_pessimistic_lock_serialization_reloads_updated_row_and_rejects_stale_submission(): void
    {
        $session = $this->createDraftSession();

        $studentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ];
        $teacherMarks = [
            ['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present],
        ];

        // Process A starts transaction, acquires lockForUpdate, mutates session to Submitted, and commits
        DB::transaction(function () use ($session, $studentMarks, $teacherMarks) {
            $locked = AttendanceSession::where('id', $session->id)->lockForUpdate()->firstOrFail();
            $this->assertEquals(AttendanceStatus::Draft, $locked->status);

            // Complete Process A submission
            $this->attendanceService->submitSession(
                $locked,
                $studentMarks,
                $teacherMarks,
                $this->teacher,
                'A',
                Semester::Semester1
            );
        });

        // Now Process B with the originally-fetched draft instance attempts submission
        // AttendanceService::submitSession uses lockForUpdate() on session->id, which re-reads
        // the committed Submitted status and throws ValidationException.
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Only draft sessions can be submitted');

        $this->attendanceService->submitSession(
            $session, // passing original reference
            $studentMarks,
            $teacherMarks,
            $this->teacher,
            'A',
            Semester::Semester1
        );
    }

    public function test_concurrent_correction_and_closure_serialization_prevents_inconsistent_state(): void
    {
        $session = $this->createDraftSession();

        // Submit session first
        $this->attendanceService->submitSession(
            $session,
            [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
                ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
            ],
            [['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present]],
            $this->teacher,
            'A',
            Semester::Semester1
        );

        // Process A closes session
        $closedSession = $this->attendanceService->closeSession($session->fresh(), $this->superadmin);
        $this->assertEquals(AttendanceStatus::Closed, $closedSession->status);

        // Process B attempts correction on now-closed session
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Closed attendance sessions cannot be modified');

        $this->attendanceService->correctMarks(
            $session->fresh(),
            [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Late],
            ],
            $this->teacher
        );
    }

    public function test_closure_of_already_closed_session_is_rejected(): void
    {
        $session = $this->createDraftSession();

        $this->attendanceService->submitSession(
            $session,
            [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
                ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
            ],
            [['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present]],
            $this->teacher,
            'A',
            Semester::Semester1
        );

        $this->attendanceService->closeSession($session->fresh(), $this->superadmin);

        // Second closure attempt
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('The attendance session is already closed');

        $this->attendanceService->closeSession($session->fresh(), $this->superadmin);
    }

    public function test_atomic_rollback_on_submission_failure_preserves_zero_dirty_records(): void
    {
        $session = $this->createDraftSession();

        $initialAuditCount = AttendanceAuditLog::where('attendance_session_id', $session->id)->count();
        $this->assertEquals(1, $initialAuditCount); // SessionCreated audit log

        // Submit with an invalid student mark payload that fails validation inside transaction
        // (missing student 2 mark entirely)
        $incompleteStudentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            // student 2 omitted
        ];
        $teacherMarks = [
            ['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present],
        ];

        try {
            $this->attendanceService->submitSession(
                $session,
                $incompleteStudentMarks,
                $teacherMarks,
                $this->teacher,
                'A',
                Semester::Semester1
            );
            $this->fail('Expected ValidationException was not thrown.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('missing for expected student(s)', $e->getMessage());
        }

        // Verify strict atomicity: ZERO student records, ZERO teacher records, ZERO new audit logs
        $this->assertEquals(0, SessionStudentRecord::where('attendance_session_id', $session->id)->count());
        $this->assertEquals(0, SessionTeacherRecord::where('attendance_session_id', $session->id)->count());
        $this->assertEquals(
            $initialAuditCount,
            AttendanceAuditLog::where('attendance_session_id', $session->id)->count()
        );

        // Verify session remains in pristine draft state
        $freshSession = $session->fresh();
        $this->assertEquals(AttendanceStatus::Draft, $freshSession->status);
        $this->assertNull($freshSession->submitted_at);
        $this->assertNull($freshSession->submitted_by);
    }

    public function test_atomic_rollback_on_correction_failure_preserves_original_marks_and_audit(): void
    {
        $session = $this->createDraftSession();

        $this->attendanceService->submitSession(
            $session,
            [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
                ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Absent],
            ],
            [['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present]],
            $this->teacher,
            'A',
            Semester::Semester1
        );

        $auditCountBeforeCorrection = AttendanceAuditLog::where('attendance_session_id', $session->id)->count();

        // Attempt correction with duplicate student_id in correction list (triggers validation error)
        try {
            $this->attendanceService->correctMarks(
                $session->fresh(),
                [
                    ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Late],
                    ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Excused], // duplicate!
                ],
                $this->teacher
            );
            $this->fail('Expected duplicate student_id ValidationException.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('Duplicate student ID', $e->getMessage());
        }

        // Verify marks are intact (original Present and Absent)
        $rec1 = SessionStudentRecord::where('attendance_session_id', $session->id)
            ->where('student_id', $this->student1->id)->firstOrFail();
        $this->assertEquals(AttendanceMark::Present, $rec1->mark);

        $rec2 = SessionStudentRecord::where('attendance_session_id', $session->id)
            ->where('student_id', $this->student2->id)->firstOrFail();
        $this->assertEquals(AttendanceMark::Absent, $rec2->mark);

        // Verify no orphaned audit log was added
        $this->assertEquals(
            $auditCountBeforeCorrection,
            AttendanceAuditLog::where('attendance_session_id', $session->id)->count()
        );
    }

    public function test_database_partial_unique_index_enforces_course_slot_uniqueness_directly(): void
    {
        $slot = $this->nextSlot();
        $date = '2025-10-20';

        // Direct DB insert 1
        DB::table('attendance_sessions')->insert([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'date' => $date,
            'time_slot' => $slot,
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Direct DB insert 2 with same slot and course -> DB constraint violation
        $this->expectException(QueryException::class);

        DB::table('attendance_sessions')->insert([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'date' => $date,
            'time_slot' => $slot,
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_database_partial_unique_index_enforces_homeroom_slot_uniqueness_directly(): void
    {
        $slot = $this->nextSlot();
        $date = '2025-10-20';

        // Direct DB insert 1 with course_id NULL (homeroom)
        DB::table('attendance_sessions')->insert([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => null,
            'date' => $date,
            'time_slot' => $slot,
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Direct DB insert 2 with same slot and course_id NULL -> DB constraint violation
        $this->expectException(QueryException::class);

        DB::table('attendance_sessions')->insert([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => null,
            'date' => $date,
            'time_slot' => $slot,
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_foreign_key_restrict_prevents_deleting_session_with_audit_logs(): void
    {
        $session = $this->createDraftSession();

        // Ensure audit log exists
        $this->assertDatabaseHas('attendance_audit_logs', [
            'attendance_session_id' => $session->id,
        ]);

        // Hard DB delete must be restricted by foreign key fk_attendance_audit_logs_session
        $this->expectException(QueryException::class);

        DB::table('attendance_sessions')->where('id', $session->id)->delete();
    }

    // =========================================================================
    // Scope B: Edge-Case Verification
    // =========================================================================

    public function test_soft_deleted_session_slot_collision_is_prevented_at_service_and_api_level(): void
    {
        $slot = $this->nextSlot();
        $date = '2025-10-22';

        $session = $this->attendanceService->createSession(
            academicYearId: $this->academicYear->id,
            termId: 1,
            classId: $this->classA->id,
            courseId: $this->courseA->id,
            date: $date,
            timeSlot: $slot,
            creatorId: $this->teacher->id
        );

        // Soft-delete the session
        $session->delete();
        $this->assertTrue($session->fresh()->trashed());

        // 1. Service Level Rejection
        try {
            $this->attendanceService->createSession(
                academicYearId: $this->academicYear->id,
                termId: 1,
                classId: $this->classA->id,
                courseId: $this->courseA->id,
                date: $date,
                timeSlot: $slot,
                creatorId: $this->teacher->id
            );
            $this->fail('Expected ValidationException for soft-deleted slot collision.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('archived/soft-deleted', $e->getMessage());
        }

        // 2. HTTP API Level Rejection (422)
        $response = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/attendance/sessions', [
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'date' => $date,
            'time_slot' => $slot,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['time_slot']);
        $this->assertStringContainsString('archived/soft-deleted', $response->json('errors.time_slot.0'));
    }

    public function test_academic_year_date_range_exact_boundaries(): void
    {
        $slot1 = $this->nextSlot();
        $slot2 = $this->nextSlot();

        // 1. Exactly on start_date (2025-09-01) -> succeeds
        $sessionStart = $this->attendanceService->createSession(
            academicYearId: $this->academicYear->id,
            termId: 1,
            classId: $this->classA->id,
            courseId: $this->courseA->id,
            date: '2025-09-01',
            timeSlot: $slot1
        );
        $this->assertInstanceOf(AttendanceSession::class, $sessionStart);

        // 2. Exactly on end_date (2026-06-30) -> succeeds
        $sessionEnd = $this->attendanceService->createSession(
            academicYearId: $this->academicYear->id,
            termId: 2,
            classId: $this->classA->id,
            courseId: $this->courseA->id,
            date: '2026-06-30',
            timeSlot: $slot2
        );
        $this->assertInstanceOf(AttendanceSession::class, $sessionEnd);

        // 3. Exactly 1 day before start_date (2025-08-31) -> rejected
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('The session date (2025-08-31) must fall within the academic year');

        $this->attendanceService->createSession(
            academicYearId: $this->academicYear->id,
            termId: 1,
            classId: $this->classA->id,
            courseId: $this->courseA->id,
            date: '2025-08-31',
            timeSlot: $this->nextSlot()
        );
    }

    public function test_academic_year_date_range_one_day_after_end_date_rejected(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('The session date (2026-07-01) must fall within the academic year');

        $this->attendanceService->createSession(
            academicYearId: $this->academicYear->id,
            termId: 2,
            classId: $this->classA->id,
            courseId: $this->courseA->id,
            date: '2026-07-01',
            timeSlot: $this->nextSlot()
        );
    }

    public function test_student_enrollment_transfer_and_date_boundaries_enforced(): void
    {
        // Student 3 enrolled only from 2025-11-01 onwards
        $student3 = Member::create([
            'full_name' => ['en' => 'Late Enrolled Student'],
            'date_of_birth' => '2008-03-03',
            'gender' => 'male',
            'class_id' => $this->classA->id,
            'section' => 'A',
            'status' => 'active',
        ]);
        $this->enrollmentService->enroll(
            $student3->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-11-01'
        );

        // Session on 2025-10-15: Student 3 is not yet enrolled on this date
        $session = $this->createDraftSession('2025-10-15');

        // Submitting student 3 mark on 2025-10-15 must be rejected
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage("Student ID {$student3->id} is not enrolled in this roster on 2025-10-15");

        $this->attendanceService->submitSession(
            $session,
            [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
                ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
                ['student_id' => $student3->id, 'mark' => AttendanceMark::Present],
            ],
            [['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present]],
            $this->teacher,
            'A',
            Semester::Semester1
        );
    }

    public function test_transferred_out_student_rejected_after_enrollment_end_date(): void
    {
        // Transferred student whose enrollment ended on 2025-10-10
        $transferredStudent = Member::create([
            'full_name' => ['en' => 'Transferred Student'],
            'date_of_birth' => '2008-04-04',
            'gender' => 'female',
            'class_id' => $this->classA->id,
            'section' => 'A',
            'status' => 'active',
        ]);
        $enrollment = $this->enrollmentService->enroll(
            $transferredStudent->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );
        $enrollment->update([
            'status' => 'transferred',
            'end_date' => '2025-10-10',
        ]);

        $session = $this->createDraftSession('2025-10-15');

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage("Student ID {$transferredStudent->id} is not enrolled in this roster on 2025-10-15");

        $this->attendanceService->submitSession(
            $session,
            [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
                ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
                ['student_id' => $transferredStudent->id, 'mark' => AttendanceMark::Present],
            ],
            [['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present]],
            $this->teacher,
            'A',
            Semester::Semester1
        );
    }

    public function test_correction_window_exact_second_boundary_and_admin_override(): void
    {
        Carbon::setTestNow('2025-10-15 10:00:00');

        $session = $this->createDraftSession('2025-10-15');
        $this->attendanceService->submitSession(
            $session,
            [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
                ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
            ],
            [['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present]],
            $this->teacher,
            'A',
            Semester::Semester1
        );

        // 1. Exact 24h boundary (2025-10-16 10:00:00) -> Teacher correction succeeds
        Carbon::setTestNow('2025-10-16 10:00:00');
        $this->assertTrue($session->fresh()->isTeacherEditable());

        $correctedSession = $this->attendanceService->correctMarks(
            $session->fresh(),
            [['student_id' => $this->student1->id, 'mark' => AttendanceMark::Late]],
            $this->teacher
        );
        $this->assertInstanceOf(AttendanceSession::class, $correctedSession);

        // 2. 1 second past 24 hours (2025-10-16 10:00:01) -> Teacher correction rejected
        Carbon::setTestNow('2025-10-16 10:00:01');
        $this->assertFalse($session->fresh()->isTeacherEditable());

        try {
            $this->attendanceService->correctMarks(
                $session->fresh(),
                [['student_id' => $this->student2->id, 'mark' => AttendanceMark::Excused]],
                $this->teacher
            );
            $this->fail('Teacher correction after 24h must be rejected.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('The 24-hour teacher correction window has expired', $e->getMessage());
        }

        // 3. Superadmin override at 24h + 1s with valid reason -> succeeds
        $overrideSession = $this->attendanceService->correctMarks(
            $session->fresh(),
            [['student_id' => $this->student2->id, 'mark' => AttendanceMark::Excused]],
            $this->superadmin,
            isOverride: true,
            overrideReason: 'Parent provided certified medical note to administration'
        );
        $this->assertInstanceOf(AttendanceSession::class, $overrideSession);

        // Verify audit log recorded MarkCorrected with is_override
        $latestAudit = AttendanceAuditLog::where('attendance_session_id', $session->id)->latest('id')->firstOrFail();
        $this->assertEquals(AttendanceAuditAction::MarkCorrected, $latestAudit->action);
        $this->assertTrue($latestAudit->new_state['is_override']);
        $this->assertEquals('Parent provided certified medical note to administration', $latestAudit->new_state['override_reason']);

        Carbon::setTestNow();
    }

    public function test_hybrid_scope_daily_homeroom_session_lifecycle(): void
    {
        $slot = $this->nextSlot();

        // 1. Create Homeroom Session (course_id = null)
        $homeroomSession = $this->attendanceService->createSession(
            academicYearId: $this->academicYear->id,
            termId: 1,
            classId: $this->classA->id,
            courseId: null,
            date: '2025-10-15',
            timeSlot: $slot,
            creatorId: $this->teacher->id
        );
        $this->assertNull($homeroomSession->course_id);

        // 2. Submit Homeroom Session: no teacher marks required
        $submitted = $this->attendanceService->submitSession(
            $homeroomSession,
            [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
                ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Late],
            ],
            [], // empty teacher marks
            $this->teacher,
            'A'
        );

        $this->assertEquals(AttendanceStatus::Submitted, $submitted->status);
        $this->assertEquals(2, SessionStudentRecord::where('attendance_session_id', $homeroomSession->id)->count());
        $this->assertEquals(0, SessionTeacherRecord::where('attendance_session_id', $homeroomSession->id)->count());

        // 3. Course session can coexist for same class, date, and slot
        $courseSession = $this->attendanceService->createSession(
            academicYearId: $this->academicYear->id,
            termId: 1,
            classId: $this->classA->id,
            courseId: $this->courseA->id,
            date: '2025-10-15',
            timeSlot: $slot,
            creatorId: $this->teacher->id
        );
        $this->assertNotNull($courseSession->course_id);
        $this->assertNotEquals($homeroomSession->id, $courseSession->id);
    }

    public function test_audit_logs_are_append_only_and_preserve_complete_state_transitions(): void
    {
        Carbon::setTestNow('2025-10-15 08:00:00');

        // Step 1: Create
        $session = $this->createDraftSession();

        // Step 2: Submit
        $this->attendanceService->submitSession(
            $session,
            [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
                ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
            ],
            [['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present]],
            $this->teacher,
            'A',
            Semester::Semester1
        );

        // Step 3: Correct
        $this->attendanceService->correctMarks(
            $session->fresh(),
            [['student_id' => $this->student2->id, 'mark' => AttendanceMark::Absent, 'remarks' => 'Did not arrive']],
            $this->teacher
        );

        // Step 4: Close
        $this->attendanceService->closeSession($session->fresh(), $this->superadmin);

        // Verify sequential audit trail
        $logs = AttendanceAuditLog::where('attendance_session_id', $session->id)
            ->orderBy('id', 'asc')
            ->get();

        $this->assertCount(4, $logs);
        $this->assertEquals(AttendanceAuditAction::SessionCreated, $logs[0]->action);
        $this->assertEquals(AttendanceAuditAction::SessionSubmitted, $logs[1]->action);
        $this->assertEquals(AttendanceAuditAction::MarkCorrected, $logs[2]->action);
        $this->assertEquals(AttendanceAuditAction::SessionClosed, $logs[3]->action);

        // Verify timestamps are non-null and model has no updated_at
        foreach ($logs as $log) {
            $this->assertNotNull($log->created_at);
            $this->assertFalse(isset($log->updated_at));
        }

        Carbon::setTestNow();
    }
}
