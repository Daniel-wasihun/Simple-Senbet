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
use App\Models\StudentEnrollment;
use App\Models\TeachingAssignment;
use App\Models\User;
use App\Services\AttendanceService;
use App\Services\StudentEnrollmentService;
use App\Services\TeachingAssignmentService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AttendanceServiceTest extends TestCase
{
    use RefreshDatabase;

    private AttendanceService $attendanceService;
    private StudentEnrollmentService $enrollmentService;
    private TeachingAssignmentService $teachingAssignmentService;

    private AcademicYear $academicYear;
    private SchoolClass $classA;
    private SchoolClass $classB;
    private Course $courseA;
    private Course $courseB;
    private User $teacher;
    private User $superadmin;
    private Member $student1;
    private Member $student2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->enrollmentService = app(StudentEnrollmentService::class);
        $this->teachingAssignmentService = app(TeachingAssignmentService::class);
        $this->attendanceService = app(AttendanceService::class);

        // Academic Year: Sep 1, 2025 to Jun 30, 2026
        $this->academicYear = AcademicYear::create([
            'name' => ['en' => '2018 E.C.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        // Classes
        $this->classA = SchoolClass::create([
            'name' => ['en' => 'Grade 10'],
            'code' => 'G10',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->classB = SchoolClass::create([
            'name' => ['en' => 'Grade 11'],
            'code' => 'G11',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        // Courses
        $this->courseA = Course::create([
            'class_id' => $this->classA->id,
            'name' => ['en' => 'Mathematics 10'],
            'code' => 'MATH-10',
            'credit_hour' => 3,
        ]);

        $this->courseB = Course::create([
            'class_id' => $this->classB->id,
            'name' => ['en' => 'Physics 11'],
            'code' => 'PHYS-11',
            'credit_hour' => 3,
        ]);

        // Users
        $teacherRole = Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        $this->teacher = User::factory()->create(['name' => 'Teacher One', 'role_id' => $teacherRole->id]);
        $this->teacher->syncRoles(['teacher']);

        $adminRole = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $this->superadmin = User::factory()->create(['name' => 'Admin User', 'role_id' => $adminRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        // Students (Members)
        $this->student1 = Member::create([
            'full_name' => ['en' => 'Dawit Haile'],
            'date_of_birth' => '2010-05-10',
            'gender' => 'male',
            'class_id' => $this->classA->id,
            'section' => 'A',
        ]);

        $this->student2 = Member::create([
            'full_name' => ['en' => 'Sara Tesfaye'],
            'date_of_birth' => '2010-08-20',
            'gender' => 'female',
            'class_id' => $this->classA->id,
            'section' => 'A',
        ]);

        // Enroll students in Class A, Section A starting 2025-09-01
        $this->enrollmentService->enroll(
            $this->student1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );

        $this->enrollmentService->enroll(
            $this->student2->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );

        // Teaching Assignment for Teacher in Class A, Section A, Course A
        $this->teachingAssignmentService->assign(
            $this->teacher->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            $this->courseA->id,
            Semester::Semester1,
            '2025-09-01',
            '2026-01-31',
            true
        );
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function defaultTeacherMarks(): array
    {
        return [
            ['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present],
        ];
    }

    // =========================================================================
    // A. CREATION TESTS
    // =========================================================================

    public function test_can_create_valid_course_session(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->assertInstanceOf(AttendanceSession::class, $session);
        $this->assertSame(AttendanceStatus::Draft, $session->status);
        $this->assertSame($this->classA->id, $session->class_id);
        $this->assertSame($this->courseA->id, $session->course_id);
        $this->assertSame('period_1', $session->time_slot);

        // Check Audit Log
        $auditLog = AttendanceAuditLog::where('attendance_session_id', $session->id)->first();
        $this->assertNotNull($auditLog);
        $this->assertSame(AttendanceAuditAction::SessionCreated, $auditLog->action);
        $this->assertSame($this->teacher->id, $auditLog->actor_id);
    }

    public function test_can_create_valid_homeroom_session(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            null, // Homeroom has null course_id
            '2025-10-15',
            'morning_roll_call',
            $this->teacher->id
        );

        $this->assertInstanceOf(AttendanceSession::class, $session);
        $this->assertNull($session->course_id);
        $this->assertSame(AttendanceStatus::Draft, $session->status);
    }

    public function test_rejects_session_with_date_outside_academic_year(): void
    {
        $this->expectException(ValidationException::class);
        $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2027-01-01', // Outside academic year
            'period_1',
            $this->teacher->id
        );
    }

    public function test_rejects_incompatible_course_and_class(): void
    {
        // courseB belongs to classB, but we try creating a session for classA
        $this->expectException(ValidationException::class);
        $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseB->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );
    }

    public function test_rejects_duplicate_session_slot(): void
    {
        $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->expectException(ValidationException::class);
        $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );
    }

    public function test_rejects_creation_when_soft_deleted_session_occupies_slot(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $session->delete();
        $this->assertSoftDeleted('attendance_sessions', ['id' => $session->id]);

        $this->expectException(ValidationException::class);
        $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );
    }

    // =========================================================================
    // B. ROSTER RESOLUTION & SUBMISSION TESTS
    // =========================================================================

    public function test_successful_atomic_submission(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $studentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present, 'remarks' => 'Present'],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Late, 'remarks' => 'Late 10 min'],
        ];

        $teacherMarks = [
            ['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present, 'remarks' => 'Conducted lesson'],
        ];

        $submitted = $this->attendanceService->submitSession(
            $session,
            $studentMarks,
            $teacherMarks,
            $this->teacher,
            'A',
            Semester::Semester1
        );

        $this->assertSame(AttendanceStatus::Submitted, $submitted->status);
        $this->assertSame($this->teacher->id, $submitted->submitted_by);
        $this->assertNotNull($submitted->submitted_at);

        // Check records
        $this->assertCount(2, SessionStudentRecord::where('attendance_session_id', $session->id)->get());
        $this->assertCount(1, SessionTeacherRecord::where('attendance_session_id', $session->id)->get());

        // Check Audit Log
        $auditLog = AttendanceAuditLog::where('attendance_session_id', $session->id)
            ->where('action', AttendanceAuditAction::SessionSubmitted)
            ->first();
        $this->assertNotNull($auditLog);
        $this->assertSame($this->teacher->id, $auditLog->actor_id);
    }

    public function test_rejects_submission_with_missing_student_mark(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        // Only mark student 1, leave student 2 unrecorded
        $studentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
        ];

        $this->expectException(ValidationException::class);
        $this->attendanceService->submitSession(
            $session,
            $studentMarks,
            $this->defaultTeacherMarks(),
            $this->teacher,
            'A',
            Semester::Semester1
        );
    }

    public function test_rejects_submission_with_unexpected_student(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        // Create an outside student enrolled in Class B
        $outsideStudent = Member::create([
            'full_name' => ['en' => 'Outside Member'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
            'class_id' => $this->classB->id,
            'section' => 'A',
        ]);
        $this->enrollmentService->enroll(
            $outsideStudent->id,
            $this->academicYear->id,
            $this->classB->id,
            'A',
            '2025-09-01'
        );

        $studentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $outsideStudent->id, 'mark' => AttendanceMark::Present],
        ];

        $this->expectException(ValidationException::class);
        $this->attendanceService->submitSession(
            $session,
            $studentMarks,
            $this->defaultTeacherMarks(),
            $this->teacher,
            'A',
            Semester::Semester1
        );
    }

    public function test_rejects_submission_with_duplicate_student_id(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $studentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Absent], // Duplicate
        ];

        $this->expectException(ValidationException::class);
        $this->attendanceService->submitSession(
            $session,
            $studentMarks,
            $this->defaultTeacherMarks(),
            $this->teacher,
            'A',
            Semester::Semester1
        );
    }

    public function test_rejects_submission_with_missing_teacher_mark(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $studentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ];

        // Empty teacher marks when teacher is assigned
        $this->expectException(ValidationException::class);
        $this->attendanceService->submitSession(
            $session,
            $studentMarks,
            [],
            $this->teacher,
            'A',
            Semester::Semester1
        );
    }

    public function test_rejects_submission_with_unexpected_teacher(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $studentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ];

        $unassignedTeacher = User::factory()->create();
        $unassignedTeacher->assignRole('teacher');

        $teacherMarks = [
            ['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present],
            ['teacher_id' => $unassignedTeacher->id, 'mark' => AttendanceMark::Present],
        ];

        $this->expectException(ValidationException::class);
        $this->attendanceService->submitSession(
            $session,
            $studentMarks,
            $teacherMarks,
            $this->teacher,
            'A',
            Semester::Semester1
        );
    }

    public function test_rejects_submission_with_duplicate_teacher_id(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $studentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ];

        $teacherMarks = [
            ['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present],
            ['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Late],
        ];

        $this->expectException(ValidationException::class);
        $this->attendanceService->submitSession(
            $session,
            $studentMarks,
            $teacherMarks,
            $this->teacher,
            'A',
            Semester::Semester1
        );
    }

    public function test_rejects_repeated_submission_on_already_submitted_session(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $studentMarks = [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ];

        $this->attendanceService->submitSession($session, $studentMarks, $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);

        // Second submission attempt must fail
        $this->expectException(ValidationException::class);
        $this->attendanceService->submitSession($session, $studentMarks, $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);
    }

    // =========================================================================
    // C. CORRECTION TESTS & 24-HOUR WINDOW
    // =========================================================================

    public function test_teacher_can_correct_marks_within_24_hour_window(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->attendanceService->submitSession($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Absent],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ], $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);

        // Correction at 2 hours after submission
        $correctionTime = $submissionTime->copy()->addHours(2);
        Carbon::setTestNow($correctionTime);

        $corrected = $this->attendanceService->correctMarks($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Excused, 'remarks' => 'Doctor note provided'],
        ], $this->teacher);

        $rec = SessionStudentRecord::where('attendance_session_id', $session->id)
            ->where('student_id', $this->student1->id)
            ->first();

        $this->assertSame(AttendanceMark::Excused, $rec->mark);
        $this->assertSame('Doctor note provided', $rec->remarks);

        // Audit Log verification
        $auditLog = AttendanceAuditLog::where('attendance_session_id', $session->id)
            ->where('action', AttendanceAuditAction::MarkCorrected)
            ->first();
        $this->assertNotNull($auditLog);
        $this->assertSame($this->teacher->id, $auditLog->actor_id);
    }

    public function test_teacher_can_correct_marks_at_exact_24_hour_boundary(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->attendanceService->submitSession($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ], $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);

        // Exactly at 24 hours (inclusive boundary)
        $exactDeadline = $submissionTime->copy()->addHours(24);
        Carbon::setTestNow($exactDeadline);

        $this->attendanceService->correctMarks($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Late],
        ], $this->teacher);

        $this->assertSame(AttendanceMark::Late, SessionStudentRecord::where('student_id', $this->student1->id)->first()->mark);
    }

    public function test_rejects_teacher_correction_after_24_hour_window_without_override(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->attendanceService->submitSession($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ], $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);

        // 1 second after 24-hour deadline
        $expiredTime = $submissionTime->copy()->addHours(24)->addSecond();
        Carbon::setTestNow($expiredTime);

        $this->expectException(ValidationException::class);
        $this->attendanceService->correctMarks($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Late],
        ], $this->teacher);
    }

    public function test_superadmin_can_override_past_24_hours_with_valid_reason(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->attendanceService->submitSession($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ], $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);

        // 48 hours later
        $expiredTime = $submissionTime->copy()->addHours(48);
        Carbon::setTestNow($expiredTime);

        $this->attendanceService->correctMarks(
            $session,
            [['student_id' => $this->student1->id, 'mark' => AttendanceMark::Excused]],
            $this->superadmin,
            true, // isOverride
            'Administrative review approved medical absence.'
        );

        $rec = SessionStudentRecord::where('student_id', $this->student1->id)->first();
        $this->assertSame(AttendanceMark::Excused, $rec->mark);

        // Check Audit Log captures override reason
        $auditLog = AttendanceAuditLog::where('attendance_session_id', $session->id)
            ->where('action', AttendanceAuditAction::MarkCorrected)
            ->first();
        $this->assertTrue($auditLog->new_state['is_override']);
        $this->assertSame('Administrative review approved medical absence.', $auditLog->new_state['override_reason']);
    }

    public function test_rejects_override_attempt_by_non_superadmin(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->attendanceService->submitSession($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ], $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);

        // 48 hours later
        Carbon::setTestNow($submissionTime->copy()->addHours(48));

        // Teacher tries to pass isOverride = true
        $this->expectException(ValidationException::class);
        $this->attendanceService->correctMarks(
            $session,
            [['student_id' => $this->student1->id, 'mark' => AttendanceMark::Excused]],
            $this->teacher,
            true,
            'Teacher attempting unauthorized override'
        );
    }

    public function test_rejects_superadmin_override_without_reason(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->attendanceService->submitSession($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ], $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);

        Carbon::setTestNow($submissionTime->copy()->addHours(48));

        // Superadmin passes empty reason
        $this->expectException(ValidationException::class);
        $this->attendanceService->correctMarks(
            $session,
            [['student_id' => $this->student1->id, 'mark' => AttendanceMark::Excused]],
            $this->superadmin,
            true,
            '' // Empty reason
        );
    }

    // =========================================================================
    // D. SESSION CLOSURE TESTS
    // =========================================================================

    public function test_valid_session_closure(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->attendanceService->submitSession($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ], $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);

        $closed = $this->attendanceService->closeSession($session, $this->superadmin);

        $this->assertSame(AttendanceStatus::Closed, $closed->status);
        $this->assertNotNull($closed->closed_at);

        // Check Audit Log
        $auditLog = AttendanceAuditLog::where('attendance_session_id', $session->id)
            ->where('action', AttendanceAuditAction::SessionClosed)
            ->first();
        $this->assertNotNull($auditLog);
    }

    public function test_rejects_closure_of_draft_session(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->expectException(ValidationException::class);
        $this->attendanceService->closeSession($session, $this->superadmin);
    }

    public function test_rejects_repeated_closure_of_closed_session(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->attendanceService->submitSession($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ], $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);

        $this->attendanceService->closeSession($session, $this->superadmin);

        // Second closure must fail
        $this->expectException(ValidationException::class);
        $this->attendanceService->closeSession($session, $this->superadmin);
    }

    public function test_rejects_correction_on_closed_session(): void
    {
        $session = $this->attendanceService->createSession(
            $this->academicYear->id,
            1,
            $this->classA->id,
            $this->courseA->id,
            '2025-10-15',
            'period_1',
            $this->teacher->id
        );

        $this->attendanceService->submitSession($session, [
            ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present],
            ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Present],
        ], $this->defaultTeacherMarks(), $this->teacher, 'A', Semester::Semester1);

        $this->attendanceService->closeSession($session, $this->superadmin);

        // Correction on closed session must fail even for superadmin
        $this->expectException(ValidationException::class);
        $this->attendanceService->correctMarks(
            $session,
            [['student_id' => $this->student1->id, 'mark' => AttendanceMark::Late]],
            $this->superadmin,
            true,
            'Trying to edit closed session'
        );
    }
}
