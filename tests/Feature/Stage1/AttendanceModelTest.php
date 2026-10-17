<?php

namespace Tests\Feature\Stage1;

use App\Enums\AttendanceAuditAction;
use App\Enums\AttendanceMark;
use App\Enums\AttendanceStatus;
use App\Models\AcademicYear;
use App\Models\AttendanceAuditLog;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\SessionStudentRecord;
use App\Models\SessionTeacherRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AttendanceModelTest extends TestCase
{
    use RefreshDatabase;

    private AcademicYear $academicYear;
    private SchoolClass $class;
    private Course $course;
    private User $teacher;
    private User $admin;
    private Member $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->academicYear = AcademicYear::create([
            'name' => ['en' => '2018 E.C.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $this->class = SchoolClass::create([
            'name' => ['en' => 'Grade 10'],
            'code' => 'G10',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->course = Course::create([
            'class_id' => $this->class->id,
            'name' => ['en' => 'Mathematics'],
            'code' => 'MATH-10',
        ]);

        $this->teacher = User::factory()->create([
            'name' => 'Teacher One',
            'email' => 'teacher@example.com',
        ]);

        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);

        $this->student = Member::create([
            'full_name' => ['en' => 'Student Member'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_attendance_session_model_configuration_and_casts(): void
    {
        $session = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->course->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => AttendanceStatus::Draft,
            'submitted_by' => null,
            'submitted_at' => null,
            'closed_at' => null,
        ]);

        $this->assertSame('attendance_sessions', $session->getTable());
        $this->assertInstanceOf(AttendanceStatus::class, $session->status);
        $this->assertSame(AttendanceStatus::Draft, $session->status);
        $this->assertInstanceOf(\DateTimeInterface::class, $session->date);
        $this->assertSame('2026-10-18', $session->date->format('Y-m-d'));
        $this->assertNull($session->submitted_at);
        $this->assertNull($session->closed_at);
        $this->assertNull($session->deleted_at);

        // Test SoftDeletes
        $session->delete();
        $this->assertSoftDeleted('attendance_sessions', ['id' => $session->id]);
        $this->assertNotNull($session->fresh()->deleted_at);
    }

    public function test_attendance_session_relationships(): void
    {
        $session = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->course->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => AttendanceStatus::Submitted,
            'submitted_by' => $this->teacher->id,
            'submitted_at' => now(),
            'closed_at' => null,
        ]);

        $studentRecord = SessionStudentRecord::create([
            'attendance_session_id' => $session->id,
            'student_id' => $this->student->id,
            'mark' => AttendanceMark::Present,
            'marked_by' => $this->teacher->id,
            'marked_at' => now(),
            'remarks' => 'On time',
        ]);

        $teacherRecord = SessionTeacherRecord::create([
            'attendance_session_id' => $session->id,
            'teacher_id' => $this->teacher->id,
            'mark' => AttendanceMark::Present,
            'marked_by' => $this->admin->id,
            'marked_at' => now(),
            'remarks' => 'Conducted lecture',
        ]);

        $auditLog = AttendanceAuditLog::create([
            'attendance_session_id' => $session->id,
            'actor_id' => $this->teacher->id,
            'action' => AttendanceAuditAction::SessionSubmitted,
            'previous_state' => ['status' => 'draft'],
            'new_state' => ['status' => 'submitted'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
        ]);

        // Assert AttendanceSession relationships
        $this->assertInstanceOf(AcademicYear::class, $session->academicYear);
        $this->assertSame($this->academicYear->id, $session->academicYear->id);

        $this->assertInstanceOf(SchoolClass::class, $session->schoolClass);
        $this->assertSame($this->class->id, $session->schoolClass->id);

        $this->assertInstanceOf(Course::class, $session->course);
        $this->assertSame($this->course->id, $session->course->id);

        $this->assertInstanceOf(User::class, $session->submittedBy);
        $this->assertSame($this->teacher->id, $session->submittedBy->id);

        $this->assertCount(1, $session->studentRecords);
        $this->assertSame($studentRecord->id, $session->studentRecords->first()->id);

        $this->assertCount(1, $session->teacherRecords);
        $this->assertSame($teacherRecord->id, $session->teacherRecords->first()->id);

        $this->assertCount(1, $session->auditLogs);
        $this->assertSame($auditLog->id, $session->auditLogs->first()->id);
    }

    public function test_homeroom_session_nullable_course_and_submitter(): void
    {
        $session = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => null,
            'date' => '2026-10-18',
            'time_slot' => 'homeroom',
            'status' => AttendanceStatus::Draft,
            'submitted_by' => null,
        ]);

        $this->assertNull($session->course);
        $this->assertNull($session->submittedBy);
    }

    public function test_session_student_record_configuration_and_relationships(): void
    {
        $session = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->course->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => AttendanceStatus::Draft,
        ]);

        $record = SessionStudentRecord::create([
            'attendance_session_id' => $session->id,
            'student_id' => $this->student->id,
            'mark' => AttendanceMark::Late,
            'marked_by' => $this->teacher->id,
            'marked_at' => '2026-10-18 08:35:00',
            'remarks' => 'Late 5 min',
        ]);

        $this->assertSame('session_student_records', $record->getTable());
        $this->assertInstanceOf(AttendanceMark::class, $record->mark);
        $this->assertSame(AttendanceMark::Late, $record->mark);
        $this->assertInstanceOf(\DateTimeInterface::class, $record->marked_at);

        // Relationship assertions
        $this->assertInstanceOf(AttendanceSession::class, $record->attendanceSession);
        $this->assertSame($session->id, $record->attendanceSession->id);

        // Ensure student points to Member model, NOT User model
        $this->assertInstanceOf(Member::class, $record->student);
        $this->assertSame($this->student->id, $record->student->id);

        // Ensure markedBy points to User model
        $this->assertInstanceOf(User::class, $record->markedBy);
        $this->assertSame($this->teacher->id, $record->markedBy->id);
    }

    public function test_session_teacher_record_configuration_and_relationships(): void
    {
        $session = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->course->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => AttendanceStatus::Draft,
        ]);

        $record = SessionTeacherRecord::create([
            'attendance_session_id' => $session->id,
            'teacher_id' => $this->teacher->id,
            'mark' => AttendanceMark::Present,
            'marked_by' => $this->admin->id,
            'marked_at' => '2026-10-18 08:30:00',
            'remarks' => 'Present on time',
        ]);

        $this->assertSame('session_teacher_records', $record->getTable());
        $this->assertInstanceOf(AttendanceMark::class, $record->mark);
        $this->assertSame(AttendanceMark::Present, $record->mark);

        // Relationship assertions
        $this->assertInstanceOf(AttendanceSession::class, $record->attendanceSession);
        $this->assertSame($session->id, $record->attendanceSession->id);

        $this->assertInstanceOf(User::class, $record->teacher);
        $this->assertSame($this->teacher->id, $record->teacher->id);

        $this->assertInstanceOf(User::class, $record->markedBy);
        $this->assertSame($this->admin->id, $record->markedBy->id);
    }

    public function test_attendance_audit_log_configuration_and_append_only_timestamps(): void
    {
        $session = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->course->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => AttendanceStatus::Draft,
        ]);

        $log = AttendanceAuditLog::create([
            'attendance_session_id' => $session->id,
            'actor_id' => $this->admin->id,
            'action' => AttendanceAuditAction::SessionCreated,
            'previous_state' => null,
            'new_state' => ['status' => 'draft'],
            'ip_address' => '192.168.1.10',
            'user_agent' => 'Mozilla/5.0',
        ]);

        $this->assertSame('attendance_audit_logs', $log->getTable());
        $this->assertNull(AttendanceAuditLog::UPDATED_AT);
        $this->assertInstanceOf(AttendanceAuditAction::class, $log->action);
        $this->assertSame(AttendanceAuditAction::SessionCreated, $log->action);
        $this->assertIsArray($log->new_state);
        $this->assertSame(['status' => 'draft'], $log->new_state);
        $this->assertNull($log->previous_state);
        $this->assertInstanceOf(\DateTimeInterface::class, $log->created_at);

        // Relationship assertions
        $this->assertInstanceOf(AttendanceSession::class, $log->attendanceSession);
        $this->assertSame($session->id, $log->attendanceSession->id);

        $this->assertInstanceOf(User::class, $log->actor);
        $this->assertSame($this->admin->id, $log->actor->id);
    }

    public function test_state_accessors_is_draft_and_is_closed(): void
    {
        $draftSession = new AttendanceSession(['status' => AttendanceStatus::Draft]);
        $this->assertTrue($draftSession->isDraft());
        $this->assertFalse($draftSession->isClosed());

        $submittedSession = new AttendanceSession(['status' => AttendanceStatus::Submitted]);
        $this->assertFalse($submittedSession->isDraft());
        $this->assertFalse($submittedSession->isClosed());

        $closedSession = new AttendanceSession(['status' => AttendanceStatus::Closed]);
        $this->assertFalse($closedSession->isDraft());
        $this->assertTrue($closedSession->isClosed());
    }

    public function test_state_accessor_is_teacher_editable_under_d_s1_02_rules(): void
    {
        $submissionTime = Carbon::parse('2026-10-18 10:00:00');

        // 1. Draft session is NOT teacher-editable
        $draftSession = new AttendanceSession([
            'status' => AttendanceStatus::Draft,
            'submitted_at' => null,
        ]);
        $this->assertFalse($draftSession->isTeacherEditable($submissionTime));

        // 2. Closed session is NOT teacher-editable
        $closedSession = new AttendanceSession([
            'status' => AttendanceStatus::Closed,
            'submitted_at' => $submissionTime,
        ]);
        $this->assertFalse($closedSession->isTeacherEditable($submissionTime));

        // 3. Submitted session without submitted_at is NOT teacher-editable
        $malformedSession = new AttendanceSession([
            'status' => AttendanceStatus::Submitted,
            'submitted_at' => null,
        ]);
        $this->assertFalse($malformedSession->isTeacherEditable($submissionTime));

        // 4. Submitted session with valid submitted_at
        $submittedSession = new AttendanceSession([
            'status' => AttendanceStatus::Submitted,
            'submitted_at' => $submissionTime,
        ]);

        // Well before deadline (e.g., 2 hours after submission) -> true
        $twoHoursLater = $submissionTime->copy()->addHours(2);
        $this->assertTrue($submittedSession->isTeacherEditable($twoHoursLater));

        // Exactly 1 second before 24-hour deadline -> true
        $oneSecondBeforeDeadline = $submissionTime->copy()->addHours(24)->subSecond();
        $this->assertTrue($submittedSession->isTeacherEditable($oneSecondBeforeDeadline));

        // Exactly at 24-hour deadline (inclusive boundary: submitted_at + 24 hours) -> true
        $exactDeadline = $submissionTime->copy()->addHours(24);
        $this->assertTrue($submittedSession->isTeacherEditable($exactDeadline));

        // Exactly 1 second after 24-hour deadline -> false
        $oneSecondAfterDeadline = $submissionTime->copy()->addHours(24)->addSecond();
        $this->assertFalse($submittedSession->isTeacherEditable($oneSecondAfterDeadline));

        // Well after deadline (e.g., 36 hours after submission) -> false
        $thirtySixHoursLater = $submissionTime->copy()->addHours(36);
        $this->assertFalse($submittedSession->isTeacherEditable($thirtySixHoursLater));

        // Test with Carbon::setTestNow()
        Carbon::setTestNow($exactDeadline);
        $this->assertTrue($submittedSession->isTeacherEditable());

        Carbon::setTestNow($oneSecondAfterDeadline);
        $this->assertFalse($submittedSession->isTeacherEditable());
    }
}
