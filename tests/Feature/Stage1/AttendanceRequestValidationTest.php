<?php

namespace Tests\Feature\Stage1;

use App\Enums\AttendanceMark;
use App\Enums\AttendanceStatus;
use App\Enums\Semester;
use App\Http\Requests\Attendance\CorrectAttendanceMarksRequest;
use App\Http\Requests\Attendance\CreateAttendanceSessionRequest;
use App\Http\Requests\Attendance\SubmitAttendanceSessionRequest;
use App\Models\AcademicYear;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Member;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class AttendanceRequestValidationTest extends TestCase
{
    use RefreshDatabase;

    private AcademicYear $academicYear;

    private SchoolClass $classA;

    private Course $courseA;

    private Member $student1;

    private Member $student2;

    private User $teacher;

    private User $superadmin;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

        $this->superadmin = User::factory()->create();
        $this->superadmin->assignRole('superadmin');

        $this->teacher = User::factory()->create();
        $this->teacher->assignRole('teacher');

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

        $this->courseA = Course::create([
            'class_id' => $this->classA->id,
            'name' => ['en' => 'Mathematics'],
            'code' => 'MATH101',
            'credit_hour' => 3,
        ]);

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

        TeachingAssignment::create([
            'teacher_id' => $this->teacher->id,
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

    // =========================================================================
    // 1. CREATE ATTENDANCE SESSION REQUEST
    // =========================================================================

    public function test_create_request_passes_with_valid_payload(): void
    {
        $payload = [
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'date' => '2025-10-15',
            'time_slot' => 'period_1',
        ];

        $request = new CreateAttendanceSessionRequest;
        $validator = Validator::make($payload, $request->rules());

        $this->assertTrue($validator->passes(), json_encode($validator->errors()->all()));
    }

    public function test_create_request_passes_with_nullable_course_for_homeroom(): void
    {
        $payload = [
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => null,
            'date' => '2025-10-15',
            'time_slot' => 'homeroom_1',
        ];

        $request = new CreateAttendanceSessionRequest;
        $validator = Validator::make($payload, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_create_request_fails_with_missing_required_fields(): void
    {
        $request = new CreateAttendanceSessionRequest;
        $validator = Validator::make([], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('academic_year_id', $validator->errors()->toArray());
        $this->assertArrayHasKey('term_id', $validator->errors()->toArray());
        $this->assertArrayHasKey('class_id', $validator->errors()->toArray());
        $this->assertArrayHasKey('date', $validator->errors()->toArray());
        $this->assertArrayHasKey('time_slot', $validator->errors()->toArray());
    }

    public function test_create_request_fails_with_invalid_date_format(): void
    {
        $payload = [
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'date' => '15-10-2025', // Invalid format (not Y-m-d)
            'time_slot' => 'period_1',
        ];

        $validator = Validator::make($payload, (new CreateAttendanceSessionRequest)->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('date', $validator->errors()->toArray());
    }

    public function test_create_request_fails_with_non_existent_foreign_keys(): void
    {
        $payload = [
            'academic_year_id' => 99999, // non-existent
            'term_id' => 1,
            'class_id' => 88888,        // non-existent
            'course_id' => 77777,       // non-existent
            'date' => '2025-10-15',
            'time_slot' => 'period_1',
        ];

        $validator = Validator::make($payload, (new CreateAttendanceSessionRequest)->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('academic_year_id', $validator->errors()->toArray());
        $this->assertArrayHasKey('class_id', $validator->errors()->toArray());
        $this->assertArrayHasKey('course_id', $validator->errors()->toArray());
    }

    public function test_create_request_authorization_fail_closed_for_guest_and_unauthorized(): void
    {
        $payload = [
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'date' => '2025-10-15',
        ];

        // Guest: null user
        $guestRequest = CreateAttendanceSessionRequest::create('/test', 'POST', $payload);
        $this->assertFalse($guestRequest->authorize());

        // Superadmin: authorized
        $adminRequest = CreateAttendanceSessionRequest::create('/test', 'POST', $payload);
        $adminRequest->setUserResolver(fn () => $this->superadmin);
        $this->assertTrue($adminRequest->authorize());

        // Assigned teacher: authorized with context
        $teacherRequest = CreateAttendanceSessionRequest::create('/test', 'POST', $payload);
        $teacherRequest->setUserResolver(fn () => $this->teacher);
        $this->assertTrue($teacherRequest->authorize());

        // Teacher without context: denied by default
        $noContextRequest = CreateAttendanceSessionRequest::create('/test', 'POST', []);
        $noContextRequest->setUserResolver(fn () => $this->teacher);
        $this->assertFalse($noContextRequest->authorize());
    }

    // =========================================================================
    // 2. SUBMIT ATTENDANCE SESSION REQUEST
    // =========================================================================

    public function test_submit_request_passes_with_valid_payload(): void
    {
        $payload = [
            'student_marks' => [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Present->value, 'remarks' => 'Good'],
                ['student_id' => $this->student2->id, 'mark' => AttendanceMark::Late->value],
            ],
            'teacher_marks' => [
                ['teacher_id' => $this->teacher->id, 'mark' => AttendanceMark::Present->value],
            ],
            'section' => 'A',
            'semester' => Semester::Semester1->value,
        ];

        $request = new SubmitAttendanceSessionRequest;
        $validator = Validator::make($payload, $request->rules());

        $this->assertTrue($validator->passes(), json_encode($validator->errors()->all()));
    }

    public function test_submit_request_fails_with_empty_or_missing_student_marks(): void
    {
        $payload = [
            'student_marks' => [],
        ];

        $validator = Validator::make($payload, (new SubmitAttendanceSessionRequest)->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('student_marks', $validator->errors()->toArray());
    }

    public function test_submit_request_fails_with_duplicate_student_id(): void
    {
        $payload = [
            'student_marks' => [
                ['student_id' => $this->student1->id, 'mark' => 'present'],
                ['student_id' => $this->student1->id, 'mark' => 'absent'], // duplicate
            ],
        ];

        $validator = Validator::make($payload, (new SubmitAttendanceSessionRequest)->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('student_marks.1.student_id', $validator->errors()->toArray());
    }

    public function test_submit_request_fails_with_invalid_attendance_mark(): void
    {
        $payload = [
            'student_marks' => [
                ['student_id' => $this->student1->id, 'mark' => 'not_a_valid_mark'],
            ],
        ];

        $validator = Validator::make($payload, (new SubmitAttendanceSessionRequest)->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('student_marks.0.mark', $validator->errors()->toArray());
    }

    public function test_submit_request_fails_with_duplicate_teacher_id(): void
    {
        $payload = [
            'student_marks' => [
                ['student_id' => $this->student1->id, 'mark' => 'present'],
            ],
            'teacher_marks' => [
                ['teacher_id' => $this->teacher->id, 'mark' => 'present'],
                ['teacher_id' => $this->teacher->id, 'mark' => 'present'], // duplicate
            ],
        ];

        $validator = Validator::make($payload, (new SubmitAttendanceSessionRequest)->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('teacher_marks.1.teacher_id', $validator->errors()->toArray());
    }

    public function test_submit_request_fails_with_invalid_semester(): void
    {
        $payload = [
            'student_marks' => [
                ['student_id' => $this->student1->id, 'mark' => 'present'],
            ],
            'semester' => 'semester_99',
        ];

        $validator = Validator::make($payload, (new SubmitAttendanceSessionRequest)->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('semester', $validator->errors()->toArray());
    }

    public function test_submit_request_authorization_with_route_bound_session(): void
    {
        $draftSession = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'date' => '2025-10-15',
            'time_slot' => 'period_1',
            'status' => AttendanceStatus::Draft,
        ]);

        $request = SubmitAttendanceSessionRequest::create('/test', 'POST');
        $request->setUserResolver(fn () => $this->teacher);
        $request->setRouteResolver(fn () => new class($draftSession)
        {
            public function __construct(private AttendanceSession $session) {}

            public function parameter($key, $default = null)
            {
                return $key === 'session' ? $this->session : $default;
            }
        });

        $this->assertTrue($request->authorize());

        // If session is already submitted, submit authorization fails
        $draftSession->update(['status' => AttendanceStatus::Submitted, 'submitted_at' => now()]);
        $this->assertFalse($request->authorize());
    }

    // =========================================================================
    // 3. CORRECT ATTENDANCE MARKS REQUEST
    // =========================================================================

    public function test_correct_request_passes_with_valid_payload(): void
    {
        $payload = [
            'corrected_marks' => [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Excused->value, 'remarks' => 'Doctor note'],
            ],
            'is_override' => false,
        ];

        $request = new CorrectAttendanceMarksRequest;
        $validator = Validator::make($payload, $request->rules());

        $this->assertTrue($validator->passes(), json_encode($validator->errors()->all()));
    }

    public function test_correct_request_supports_student_marks_alias(): void
    {
        $payload = [
            'student_marks' => [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Excused->value],
            ],
        ];

        $request = CorrectAttendanceMarksRequest::create('/test', 'POST', $payload);
        $request->setContainer(app());

        // Trigger prepareForValidation
        $refMethod = new \ReflectionMethod(CorrectAttendanceMarksRequest::class, 'prepareForValidation');
        $refMethod->setAccessible(true);
        $refMethod->invoke($request);

        $validator = Validator::make($request->all(), $request->rules());
        $this->assertTrue($validator->passes(), json_encode($validator->errors()->all()));
        $this->assertCount(1, $request->getCorrectedStudentMarks());
    }

    public function test_correct_request_fails_when_override_is_true_without_reason(): void
    {
        $payload = [
            'corrected_marks' => [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Excused->value],
            ],
            'is_override' => true,
            'override_reason' => null, // Missing reason
        ];

        $validator = Validator::make($payload, (new CorrectAttendanceMarksRequest)->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('override_reason', $validator->errors()->toArray());
    }

    public function test_correct_request_fails_when_override_reason_is_shorter_than_5_chars(): void
    {
        $payload = [
            'corrected_marks' => [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Excused->value],
            ],
            'is_override' => true,
            'override_reason' => 'abc', // 3 chars < 5
        ];

        $validator = Validator::make($payload, (new CorrectAttendanceMarksRequest)->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('override_reason', $validator->errors()->toArray());
    }

    public function test_correct_request_passes_when_override_reason_is_valid(): void
    {
        $payload = [
            'corrected_marks' => [
                ['student_id' => $this->student1->id, 'mark' => AttendanceMark::Excused->value],
            ],
            'is_override' => true,
            'override_reason' => 'Administrative override for approved medical note.',
        ];

        $request = CorrectAttendanceMarksRequest::create('/test', 'POST', $payload);
        $validator = Validator::make($request->all(), $request->rules());

        $this->assertTrue($validator->passes(), json_encode($validator->errors()->all()));
        $this->assertTrue($request->isOverride());
        $this->assertSame('Administrative override for approved medical note.', $request->getOverrideReason());
    }

    public function test_correct_request_authorization_enforces_lifecycle_and_24h_window(): void
    {
        $submissionTime = Carbon::parse('2025-10-15 10:00:00');
        Carbon::setTestNow($submissionTime);

        $submittedSession = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->classA->id,
            'course_id' => $this->courseA->id,
            'date' => '2025-10-15',
            'time_slot' => 'period_2',
            'status' => AttendanceStatus::Submitted,
            'submitted_by' => $this->teacher->id,
            'submitted_at' => $submissionTime,
        ]);

        $request = CorrectAttendanceMarksRequest::create('/test', 'POST');
        $request->setRouteResolver(fn () => new class($submittedSession)
        {
            public function __construct(private AttendanceSession $session) {}

            public function parameter($key, $default = null)
            {
                return $key === 'session' ? $this->session : $default;
            }
        });

        // 1. Within 24h: teacher authorized
        $request->setUserResolver(fn () => $this->teacher);
        $this->assertTrue($request->authorize());

        // 2. Past 24h: teacher denied
        Carbon::setTestNow($submissionTime->copy()->addHours(25));
        $this->assertFalse($request->authorize());

        // 3. Past 24h: superadmin authorized
        $request->setUserResolver(fn () => $this->superadmin);
        $this->assertTrue($request->authorize());
    }
}
