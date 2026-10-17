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
use App\Models\TeachingAssignment;
use App\Models\User;
use App\Services\StudentEnrollmentService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;
    private User $assignedTeacher;
    private User $unassignedTeacher;
    private User $studentUser;
    private AcademicYear $academicYear;
    private SchoolClass $classA;
    private SchoolClass $classB;
    private Course $courseA;
    private Course $courseB;
    private Member $member1;
    private Member $member2;
    private StudentEnrollmentService $enrollmentService;
    private int $slotCounter = 1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->enrollmentService = app(StudentEnrollmentService::class);

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'academic_director', 'guard_name' => 'web']);

        $this->superadmin = User::factory()->create();
        $this->superadmin->assignRole('superadmin');

        $this->assignedTeacher = User::factory()->create();
        $this->assignedTeacher->assignRole('teacher');

        $this->unassignedTeacher = User::factory()->create();
        $this->unassignedTeacher->assignRole('teacher');

        $this->studentUser = User::factory()->create();
        $this->studentUser->assignRole('student');

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

        // Students in Class A, Section A
        $this->member1 = Member::create([
            'full_name' => ['en' => 'Dawit Haile'],
            'date_of_birth' => '2010-05-10',
            'gender' => 'male',
            'class_id' => $this->classA->id,
            'section' => 'A',
        ]);

        $this->member2 = Member::create([
            'full_name' => ['en' => 'Sara Tesfaye'],
            'date_of_birth' => '2010-08-20',
            'gender' => 'female',
            'class_id' => $this->classA->id,
            'section' => 'A',
        ]);

        $this->enrollmentService->enroll(
            $this->member1->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );

        $this->enrollmentService->enroll(
            $this->member2->id,
            $this->academicYear->id,
            $this->classA->id,
            'A',
            '2025-09-01'
        );

        // Teaching Assignment: assignedTeacher in Class A, Section A, Course A
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

        // Teaching Assignment: unassignedTeacher in Class B, Section A, Course B
        TeachingAssignment::create([
            'teacher_id' => $this->unassignedTeacher->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->classB->id,
            'section' => 'A',
            'course_id' => $this->courseB->id,
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

    private function createSession(AttendanceStatus $status = AttendanceStatus::Draft, ?Carbon $submittedAt = null): AttendanceSession
    {
        $slot = 'period_' . ($this->slotCounter++);

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
    // 1. AUTHENTICATION & GUEST ACCESS
    // =========================================================================

    public function test_guests_cannot_access_any_attendance_endpoints(): void
    {
        $session = $this->createSession();

        $this->postJson('/api/attendance/sessions', [])->assertUnauthorized();
        $this->getJson('/api/attendance/sessions')->assertUnauthorized();
        $this->getJson("/api/attendance/sessions/{$session->id}")->assertUnauthorized();
        $this->postJson("/api/attendance/sessions/{$session->id}/submit", [])->assertUnauthorized();
        $this->patchJson("/api/attendance/sessions/{$session->id}/marks", [])->assertUnauthorized();
        $this->postJson("/api/attendance/sessions/{$session->id}/close")->assertUnauthorized();
    }

    // =========================================================================
    // 2. SESSION CREATION (POST /api/attendance/sessions)
    // =========================================================================

    public function test_superadmin_can_create_draft_session_successfully(): void
    {
        $payload = [
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'date' => '2025-10-15',
            'time_slot' => 'period_create_admin',
        ];

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->postJson('/api/attendance/sessions', $payload)
            ->assertCreated();

        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.status', 'draft');
        $response->assertJsonPath('data.class_id', $this->classA->id);
        $response->assertJsonPath('data.course_id', $this->courseA->id);
        $this->assertDatabaseHas('attendance_sessions', [
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'time_slot' => 'period_create_admin',
            'status' => 'draft',
        ]);
    }

    public function test_assigned_teacher_can_create_session_for_assigned_class_and_course(): void
    {
        $payload = [
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'date' => '2025-10-15',
            'time_slot' => 'period_create_teacher',
        ];

        $response = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson('/api/attendance/sessions', $payload)
            ->assertCreated();

        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.time_slot', 'period_create_teacher');
    }

    public function test_teacher_cannot_create_session_for_unassigned_class(): void
    {
        $payload = [
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classB->id, // Assigned to unassignedTeacher, not assignedTeacher
            'course_id' => $this->courseB->id,
            'date' => '2025-10-15',
            'time_slot' => 'period_unassigned',
        ];

        $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson('/api/attendance/sessions', $payload)
            ->assertForbidden();
    }

    public function test_create_session_fails_with_invalid_payload(): void
    {
        $this->actingAs($this->superadmin, 'sanctum')
            ->postJson('/api/attendance/sessions', [
                'academic_year_id' => 99999,
                'date' => 'not-a-date',
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['success', 'message', 'errors']);
    }

    // =========================================================================
    // 3. LISTING & QUERY SCOPING (GET /api/attendance/sessions)
    // =========================================================================

    public function test_index_lists_sessions_and_returns_paginated_response(): void
    {
        $this->createSession();
        $this->createSession();

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson('/api/attendance/sessions')
            ->assertOk();

        $response->assertJsonPath('success', true);
        $response->assertJsonStructure([
            'success',
            'message',
            'data',
            'pagination' => ['total', 'count', 'per_page', 'current_page', 'total_pages'],
            'meta' => ['locale', 'timestamp'],
        ]);
    }

    public function test_index_query_scoping_prevents_teacher_from_seeing_unassigned_sessions(): void
    {
        // Session 1: Class A, Course A (assignedTeacher teaches this)
        $sessionA = $this->createSession();

        // Session 2: Class B, Course B (unassignedTeacher teaches this)
        $sessionB = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classB->id,
            'course_id' => $this->courseB->id,
            'date' => '2025-10-15',
            'time_slot' => 'period_class_b',
            'status' => AttendanceStatus::Draft,
        ]);

        // assignedTeacher should only see sessionA
        $teacherResponse = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->getJson('/api/attendance/sessions')
            ->assertOk();

        $ids = collect($teacherResponse->json('data'))->pluck('id')->all();
        $this->assertContains($sessionA->id, $ids);
        $this->assertNotContains($sessionB->id, $ids);

        // Superadmin sees both
        $adminResponse = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson('/api/attendance/sessions')
            ->assertOk();

        $adminIds = collect($adminResponse->json('data'))->pluck('id')->all();
        $this->assertContains($sessionA->id, $adminIds);
        $this->assertContains($sessionB->id, $adminIds);
    }

    public function test_index_filters_by_status_and_date(): void
    {
        $draft = $this->createSession(AttendanceStatus::Draft);
        $submitted = $this->createSession(AttendanceStatus::Submitted);

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson('/api/attendance/sessions?status=draft')
            ->assertOk();

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($draft->id, $ids);
        $this->assertNotContains($submitted->id, $ids);
    }

    // =========================================================================
    // 4. SHOW SESSION (GET /api/attendance/sessions/{session})
    // =========================================================================

    public function test_show_returns_session_details_to_authorized_user(): void
    {
        $session = $this->createSession();

        $response = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->getJson("/api/attendance/sessions/{$session->id}")
            ->assertOk();

        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.id', $session->id);
        $response->assertJsonPath('data.class_id', $this->classA->id);
    }

    public function test_show_denies_access_to_unassigned_teacher(): void
    {
        $session = $this->createSession();

        $this->actingAs($this->unassignedTeacher, 'sanctum')
            ->getJson("/api/attendance/sessions/{$session->id}")
            ->assertForbidden();
    }

    public function test_show_returns_404_for_non_existent_or_soft_deleted_session(): void
    {
        $this->actingAs($this->superadmin, 'sanctum')
            ->getJson('/api/attendance/sessions/999999')
            ->assertNotFound();

        $session = $this->createSession();
        $session->delete();

        $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/attendance/sessions/{$session->id}")
            ->assertNotFound();
    }

    // =========================================================================
    // 5. SUBMIT SESSION (POST /api/attendance/sessions/{session}/submit)
    // =========================================================================

    public function test_submit_session_succeeds_for_draft_session(): void
    {
        $session = $this->createSession(AttendanceStatus::Draft);

        $payload = [
            'student_marks' => [
                ['student_id' => $this->member1->id, 'mark' => 'present', 'remarks' => 'On time'],
                ['student_id' => $this->member2->id, 'mark' => 'late', 'remarks' => '10m late'],
            ],
            'teacher_marks' => [
                ['teacher_id' => $this->assignedTeacher->id, 'mark' => 'present', 'remarks' => 'Conducted lesson'],
            ],
            'section' => 'A',
            'semester' => Semester::Semester1->value,
        ];

        $response = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/submit", $payload)
            ->assertOk();

        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.status', 'submitted');
        $this->assertNotNull($response->json('data.submitted_at'));

        $this->assertDatabaseHas('session_student_records', [
            'attendance_session_id' => $session->id,
            'student_id' => $this->member1->id,
            'mark' => 'present',
        ]);
        $this->assertDatabaseHas('session_teacher_records', [
            'attendance_session_id' => $session->id,
            'teacher_id' => $this->assignedTeacher->id,
            'mark' => 'present',
        ]);
    }

    public function test_submit_session_fails_for_incomplete_student_roster(): void
    {
        $session = $this->createSession(AttendanceStatus::Draft);

        // Omits member2
        $payload = [
            'student_marks' => [
                ['student_id' => $this->member1->id, 'mark' => 'present'],
            ],
            'teacher_marks' => [
                ['teacher_id' => $this->assignedTeacher->id, 'mark' => 'present'],
            ],
            'section' => 'A',
            'semester' => Semester::Semester1->value,
        ];

        $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/submit", $payload)
            ->assertUnprocessable();
    }

    public function test_submit_session_fails_on_already_submitted_session(): void
    {
        $session = $this->createSession(AttendanceStatus::Submitted);

        $payload = [
            'student_marks' => [
                ['student_id' => $this->member1->id, 'mark' => 'present'],
                ['student_id' => $this->member2->id, 'mark' => 'present'],
            ],
            'teacher_marks' => [
                ['teacher_id' => $this->assignedTeacher->id, 'mark' => 'present'],
            ],
            'section' => 'A',
            'semester' => Semester::Semester1->value,
        ];

        // FormRequest / Policy forbids submitting non-draft sessions
        $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/submit", $payload)
            ->assertForbidden();
    }

    // =========================================================================
    // 6. CORRECT MARKS (PATCH /api/attendance/sessions/{session}/marks)
    // =========================================================================

    public function test_correct_marks_succeeds_within_24_hour_window(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->createSession(AttendanceStatus::Draft);

        // Submit first
        $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/submit", [
                'student_marks' => [
                    ['student_id' => $this->member1->id, 'mark' => 'absent'],
                    ['student_id' => $this->member2->id, 'mark' => 'present'],
                ],
                'teacher_marks' => [
                    ['teacher_id' => $this->assignedTeacher->id, 'mark' => 'present'],
                ],
                'section' => 'A',
                'semester' => Semester::Semester1->value,
            ])
            ->assertOk();

        // 2 hours later
        Carbon::setTestNow($submissionTime->copy()->addHours(2));

        $response = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->patchJson("/api/attendance/sessions/{$session->id}/marks", [
                'corrected_marks' => [
                    ['student_id' => $this->member1->id, 'mark' => 'excused', 'remarks' => 'Doctor note provided'],
                ],
            ])
            ->assertOk();

        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('session_student_records', [
            'attendance_session_id' => $session->id,
            'student_id' => $this->member1->id,
            'mark' => 'excused',
            'remarks' => 'Doctor note provided',
        ]);
    }

    public function test_ordinary_teacher_denied_correction_past_24_hours(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->createSession(AttendanceStatus::Draft);

        $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/submit", [
                'student_marks' => [
                    ['student_id' => $this->member1->id, 'mark' => 'absent'],
                    ['student_id' => $this->member2->id, 'mark' => 'present'],
                ],
                'teacher_marks' => [
                    ['teacher_id' => $this->assignedTeacher->id, 'mark' => 'present'],
                ],
                'section' => 'A',
                'semester' => Semester::Semester1->value,
            ])
            ->assertOk();

        // 25 hours later
        Carbon::setTestNow($submissionTime->copy()->addHours(25));

        $this->actingAs($this->assignedTeacher, 'sanctum')
            ->patchJson("/api/attendance/sessions/{$session->id}/marks", [
                'corrected_marks' => [
                    ['student_id' => $this->member1->id, 'mark' => 'present'],
                ],
            ])
            ->assertForbidden();
    }

    public function test_superadmin_can_override_past_24_hours_with_valid_reason(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $session = $this->createSession(AttendanceStatus::Draft);

        $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/submit", [
                'student_marks' => [
                    ['student_id' => $this->member1->id, 'mark' => 'absent'],
                    ['student_id' => $this->member2->id, 'mark' => 'present'],
                ],
                'teacher_marks' => [
                    ['teacher_id' => $this->assignedTeacher->id, 'mark' => 'present'],
                ],
                'section' => 'A',
                'semester' => Semester::Semester1->value,
            ])
            ->assertOk();

        // 48 hours later
        Carbon::setTestNow($submissionTime->copy()->addHours(48));

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->patchJson("/api/attendance/sessions/{$session->id}/marks", [
                'corrected_marks' => [
                    ['student_id' => $this->member1->id, 'mark' => 'excused'],
                ],
                'is_override' => true,
                'override_reason' => 'Administrative review granted medical excuse.',
            ])
            ->assertOk();

        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('session_student_records', [
            'attendance_session_id' => $session->id,
            'student_id' => $this->member1->id,
            'mark' => 'excused',
        ]);

        $auditLog = AttendanceAuditLog::where('attendance_session_id', $session->id)
            ->where('action', AttendanceAuditAction::MarkCorrected)
            ->latest('id')
            ->first();
        $this->assertNotNull($auditLog);
        $this->assertTrue($auditLog->new_state['is_override']);
        $this->assertSame('Administrative review granted medical excuse.', $auditLog->new_state['override_reason']);
    }

    public function test_superadmin_override_fails_without_reason(): void
    {
        $session = $this->createSession(AttendanceStatus::Submitted);

        $this->actingAs($this->superadmin, 'sanctum')
            ->patchJson("/api/attendance/sessions/{$session->id}/marks", [
                'corrected_marks' => [
                    ['student_id' => $this->member1->id, 'mark' => 'excused'],
                ],
                'is_override' => true,
                'override_reason' => '', // Missing / empty reason
            ])
            ->assertUnprocessable();
    }

    // =========================================================================
    // 7. SESSION CLOSURE (POST /api/attendance/sessions/{session}/close)
    // =========================================================================

    public function test_close_session_succeeds_for_superadmin(): void
    {
        $session = $this->createSession(AttendanceStatus::Submitted);

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/close")
            ->assertOk();

        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.status', 'closed');
        $this->assertNotNull($response->json('data.closed_at'));
        $this->assertDatabaseHas('attendance_sessions', [
            'id' => $session->id,
            'status' => 'closed',
        ]);
    }

    public function test_close_session_denied_for_teacher(): void
    {
        $session = $this->createSession(AttendanceStatus::Submitted);

        $this->actingAs($this->assignedTeacher, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/close")
            ->assertForbidden();
    }

    public function test_close_session_fails_on_draft_or_closed_session(): void
    {
        $draft = $this->createSession(AttendanceStatus::Draft);
        $closed = $this->createSession(AttendanceStatus::Closed);

        $this->actingAs($this->superadmin, 'sanctum')
            ->postJson("/api/attendance/sessions/{$draft->id}/close")
            ->assertForbidden();

        $this->actingAs($this->superadmin, 'sanctum')
            ->postJson("/api/attendance/sessions/{$closed->id}/close")
            ->assertForbidden();
    }

    // =========================================================================
    // 8. DATA PROTECTION & ENVELOPE STRUCTURE
    // =========================================================================

    public function test_response_envelope_structure_and_sensitive_data_protection(): void
    {
        $session = $this->createSession(AttendanceStatus::Submitted);

        SessionStudentRecord::create([
            'attendance_session_id' => $session->id,
            'student_id' => $this->member1->id,
            'mark' => AttendanceMark::Present,
            'marked_by' => $this->assignedTeacher->id,
            'marked_at' => now(),
        ]);

        SessionTeacherRecord::create([
            'attendance_session_id' => $session->id,
            'teacher_id' => $this->assignedTeacher->id,
            'mark' => AttendanceMark::Present,
            'marked_by' => $this->assignedTeacher->id,
            'marked_at' => now(),
        ]);

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/attendance/sessions/{$session->id}")
            ->assertOk();

        $json = $response->json();

        // 1. Check envelope keys
        $this->assertTrue($json['success']);
        $this->assertIsArray($json['data']);
        $this->assertIsArray($json['meta']);
        $this->assertArrayHasKey('timestamp', $json['meta']);

        // 2. Sensitive data protection: ensure no passwords, remember_tokens, or personal secrets are serialized
        $rawJson = $response->getContent();
        $this->assertStringNotContainsString('password', $rawJson);
        $this->assertStringNotContainsString('remember_token', $rawJson);
    }
}
