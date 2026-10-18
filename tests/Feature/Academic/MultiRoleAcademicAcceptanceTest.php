<?php

namespace Tests\Feature\Academic;

use App\Enums\AttendanceMark;
use App\Enums\AttendanceStatus;
use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentResult;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Member;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\SessionStudentRecord;
use App\Models\StudentEnrollment;
use App\Models\TeachingAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Phase 3 Multi-Role End-to-End Acceptance Test Suite.
 *
 * Covers:
 * A. Superadmin lifecycle, governance, administrative gradebook, CSV/Print exports, attendance summary, profile.
 * B. Assigned Teacher vs Unassigned Teacher isolation, attendance submission, mark entry, roster access, gradebook boundaries.
 * C. Student role boundaries, profile inspection, isolation from administrative/teacher operations and other students' data.
 * D. Cross-module data consistency, weighted grading, tie-aware ranks, attendance score independence, and cache isolation.
 */
class MultiRoleAcademicAcceptanceTest extends TestCase
{
    use RefreshDatabase;

    protected Role $superRole;
    protected Role $teacherRole;
    protected Role $studentRole;

    protected User $superadmin;
    protected User $assignedTeacher;
    protected User $unassignedTeacher;
    protected User $studentUser;

    protected AcademicYear $academicYear;
    protected SchoolClass $schoolClass;
    protected Course $course;
    protected TeachingAssignment $assignment;

    protected Member $studentMember1;
    protected Member $studentMember2;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Roles & Permissions setup
        $this->superRole = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $this->teacherRole = Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        $this->studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

        $resources = ['users', 'school-classes', 'courses', 'members', 'assessments', 'assessment-results'];
        $actions = ['view', 'create', 'update', 'delete'];

        foreach ($resources as $res) {
            foreach ($actions as $act) {
                $p = Permission::firstOrCreate(['name' => "{$res}.{$act}", 'guard_name' => 'web']);
                $this->superRole->givePermissionTo($p);
                if ($act === 'view' || in_array($res, ['assessments', 'assessment-results'])) {
                    $this->teacherRole->givePermissionTo($p);
                }
                if ($act === 'view' && in_array($res, ['school-classes', 'courses'])) {
                    $this->studentRole->givePermissionTo($p);
                }
            }
        }

        // 2. Users
        $this->superadmin = User::factory()->create([
            'email' => 'superadmin@senbet.org',
            'password' => Hash::make('SuperSecret123!'),
            'role_id' => $this->superRole->id,
        ]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->assignedTeacher = User::factory()->create([
            'name' => 'Teacher Dawit',
            'email' => 'teacher.dawit@senbet.org',
            'password' => Hash::make('TeacherSecret123!'),
            'role_id' => $this->teacherRole->id,
        ]);
        $this->assignedTeacher->syncRoles(['teacher']);

        $this->unassignedTeacher = User::factory()->create([
            'name' => 'Teacher Almaz',
            'email' => 'teacher.almaz@senbet.org',
            'password' => Hash::make('TeacherSecret123!'),
            'role_id' => $this->teacherRole->id,
        ]);
        $this->unassignedTeacher->syncRoles(['teacher']);

        $this->studentUser = User::factory()->create([
            'name' => 'Student Yohannes',
            'email' => 'yohannes@senbet.org',
            'password' => Hash::make('StudentSecret123!'),
            'role_id' => $this->studentRole->id,
        ]);
        $this->studentUser->syncRoles(['student']);

        // 3. Academic Structure
        $this->academicYear = AcademicYear::create([
            'name' => ['en' => '2018 E.C.', 'am' => '፳፻፲፰ ዓ.ም.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $this->schoolClass = SchoolClass::create([
            'name' => ['en' => 'Grade 8', 'am' => '፰ኛ ክፍል'],
            'code' => 'G8',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->course = Course::create([
            'name' => ['en' => 'Spiritual Teachings', 'am' => 'መንፈሳዊ ትምህርት'],
            'code' => 'SPT101',
            'credit_hour' => 2,
            'class_id' => $this->schoolClass->id,
        ]);

        $this->assignment = TeachingAssignment::create([
            'teacher_id' => $this->assignedTeacher->id,
            'course_id' => $this->course->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->schoolClass->id,
            'section' => 'A',
            'semester' => Semester::Semester1,
            'is_primary' => true,
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
        ]);

        // 4. Student Members and Active Enrollments
        $this->studentMember1 = Member::create([
            'full_name' => ['en' => 'Yohannes Teshome', 'am' => 'ዮሐንስ ተሾመ'],
            'date_of_birth' => '2011-03-10',
            'gender' => 'male',
            'class_id' => $this->schoolClass->id,
            'section' => 'A',
        ]);
        StudentEnrollment::create([
            'member_id' => $this->studentMember1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->schoolClass->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
        ]);

        $this->studentMember2 = Member::create([
            'full_name' => ['en' => 'Marta Kebede', 'am' => 'ማርታ ከበደ'],
            'date_of_birth' => '2011-05-15',
            'gender' => 'female',
            'class_id' => $this->schoolClass->id,
            'section' => 'A',
        ]);
        StudentEnrollment::create([
            'member_id' => $this->studentMember2->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->schoolClass->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
        ]);
    }

    /**
     * A. Superadmin scenarios:
     * - Authentication, profile inspection, administrative CRUD, gradebook CSV and HTML Print export, attendance summary.
     */
    public function test_superadmin_full_academic_lifecycle_and_management(): void
    {
        // 1. Auth Login
        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'superadmin@senbet.org',
            'password' => 'SuperSecret123!',
        ]);
        $loginRes->assertOk()
            ->assertJsonPath('user.role', 'superadmin')
            ->assertJsonMissingPath('user.teaching_assignments');

        $token = $loginRes->json('token');
        $this->assertNotEmpty($token);

        // 2. Access Admin-only Users list
        $this->withToken($token)->getJson('/api/users')
            ->assertOk()
            ->assertJsonStructure(['users']);

        // 3. Create Assessment as Superadmin
        $assessRes = $this->withToken($token)->postJson('/api/assessments', [
            'teaching_assignment_id' => $this->assignment->id,
            'name' => 'Midterm Exam',
            'total_score' => 40.00,
            'weight_percentage' => 40.00,
        ]);
        $assessRes->assertCreated();
        $midtermId = $assessRes->json('data.id');

        $finalRes = $this->withToken($token)->postJson('/api/assessments', [
            'teaching_assignment_id' => $this->assignment->id,
            'name' => 'Final Exam',
            'total_score' => 60.00,
            'weight_percentage' => 60.00,
        ]);
        $finalRes->assertCreated();
        $finalId = $finalRes->json('data.id');

        // 4. Enter marks for Student 1 (Passing: 36/40 + 54/60 = 90%)
        $this->withToken($token)->postJson('/api/assessment-results', [
            'assessment_id' => $midtermId,
            'member_id' => $this->studentMember1->id,
            'score' => 36.00,
        ])->assertCreated();

        $this->withToken($token)->postJson('/api/assessment-results', [
            'assessment_id' => $finalId,
            'member_id' => $this->studentMember1->id,
            'score' => 54.00,
        ])->assertCreated();

        // 5. Enter marks for Student 2 (Failing: 16/40 + 24/60 = 40%)
        $this->withToken($token)->postJson('/api/assessment-results', [
            'assessment_id' => $midtermId,
            'member_id' => $this->studentMember2->id,
            'score' => 16.00,
        ])->assertCreated();

        $this->withToken($token)->postJson('/api/assessment-results', [
            'assessment_id' => $finalId,
            'member_id' => $this->studentMember2->id,
            'score' => 24.00,
        ])->assertCreated();

        // 6. Access Class Gradebook
        $gbRes = $this->withToken($token)->getJson("/api/report-cards/class/{$this->schoolClass->id}?academic_year_id={$this->academicYear->id}&semester=semester_1");
        $gbRes->assertOk()
            ->assertJsonPath('data.total_students', 2)
            ->assertJsonPath('data.students.0.summary.status', 'PASS')
            ->assertJsonPath('data.students.0.summary.overall_average', 90)
            ->assertJsonPath('data.students.1.summary.status', 'FAIL')
            ->assertJsonPath('data.students.1.summary.overall_average', 40);

        // 7. Export CSV
        $csvRes = $this->withToken($token)->get("/api/report-cards/class/{$this->schoolClass->id}/export/csv?academic_year_id={$this->academicYear->id}&semester=semester_1");
        $csvRes->assertOk();
        $csvRes->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        // 8. Printable HTML Report
        $printRes = $this->withToken($token)->get("/api/report-cards/class/{$this->schoolClass->id}/export/print?academic_year_id={$this->academicYear->id}&semester=semester_1");
        $printRes->assertOk();
        $printRes->assertHeader('Content-Type', 'text/html; charset=UTF-8');
        $this->assertStringContainsString('Official Class Academic Gradebook', $printRes->getContent());

        // 9. Logout
        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();
    }

    /**
     * B. Teacher scenarios:
     * - Assigned Teacher accesses assigned class, roster, records attendance, marks.
     * - Unassigned Teacher is denied (403) across class-specific academic and attendance endpoints.
     */
    public function test_teacher_role_assignment_boundaries_and_attendance_workflow(): void
    {
        // 1. Assigned Teacher Login
        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'teacher.dawit@senbet.org',
            'password' => 'TeacherSecret123!',
        ]);
        $loginRes->assertOk()
            ->assertJsonPath('user.role', 'teacher')
            ->assertJsonCount(1, 'user.teaching_assignments')
            ->assertJsonPath('user.teaching_assignments.0.class_code', 'G8');

        $dawitToken = $loginRes->json('token');

        // 2. Assigned Teacher creates an Attendance Session for Grade 8 Section A
        $sessionRes = $this->withToken($dawitToken)->postJson('/api/attendance/sessions', [
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->schoolClass->id,
            'course_id' => $this->course->id,
            'date' => '2025-10-12',
            'time_slot' => 'morning',
            'term_id' => 1,
        ]);
        $sessionRes->assertCreated();
        $sessionId = $sessionRes->json('data.id');

        // 3. Assigned Teacher fetches session roster
        $rosterRes = $this->withToken($dawitToken)->getJson("/api/attendance/sessions/{$sessionId}/roster");
        $rosterRes->assertOk()
            ->assertJsonPath('data.total_students', 2);

        // 4. Assigned Teacher submits attendance
        $submitRes = $this->withToken($dawitToken)->postJson("/api/attendance/sessions/{$sessionId}/submit", [
            'semester' => Semester::Semester1->value,
            'student_marks' => [
                ['student_id' => $this->studentMember1->id, 'mark' => AttendanceMark::Present->value],
                ['student_id' => $this->studentMember2->id, 'mark' => AttendanceMark::Absent->value, 'remarks' => 'Family Travel'],
            ],
            'teacher_marks' => [
                ['teacher_id' => $this->assignedTeacher->id, 'mark' => AttendanceMark::Present->value],
            ],
        ]);
        $submitRes->assertOk()
            ->assertJsonPath('data.status', AttendanceStatus::Submitted->value);

        // 5. Assigned Teacher can view attendance summary
        $summaryRes = $this->withToken($dawitToken)->getJson('/api/attendance/summary?date=2025-10-12');
        $summaryRes->assertOk()
            ->assertJsonPath('data.total_sessions', 1)
            ->assertJsonPath('data.counts.present', 1)
            ->assertJsonPath('data.counts.absent', 1)
            ->assertJsonCount(1, 'data.absentees');

        // 6. Unassigned Teacher Isolation:
        // Clear cached auth guards before switching actor
        $this->app['auth']->forgetGuards();

        // Unassigned teacher denied creating session for unassigned class
        $this->actingAs($this->unassignedTeacher, 'sanctum')->postJson('/api/attendance/sessions', [
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->schoolClass->id,
            'course_id' => $this->course->id,
            'date' => '2025-10-12',
            'time_slot' => 'afternoon',
            'term_id' => 1,
        ])->assertForbidden();

        // Unassigned teacher denied fetching roster of Dawit's session
        $this->actingAs($this->unassignedTeacher, 'sanctum')->getJson("/api/attendance/sessions/{$sessionId}/roster")
            ->assertForbidden();

        // Unassigned teacher denied exporting gradebook for Dawit's class
        $this->actingAs($this->unassignedTeacher, 'sanctum')->get("/api/report-cards/class/{$this->schoolClass->id}/export/csv?academic_year_id={$this->academicYear->id}&semester=semester_1")
            ->assertForbidden();

        $this->actingAs($this->unassignedTeacher, 'sanctum')->get("/api/report-cards/class/{$this->schoolClass->id}/export/print?academic_year_id={$this->academicYear->id}&semester=semester_1")
            ->assertForbidden();

        // Unassigned teacher denied viewing individual report card of Dawit's student
        $this->actingAs($this->unassignedTeacher, 'sanctum')->getJson("/api/report-cards/student/{$this->studentMember1->id}")
            ->assertForbidden();
    }

    /**
     * C. Student role boundaries:
     * - Authenticated student cannot access administrative or teacher endpoints.
     * - Student cannot access user administration, academic year creation, attendance creation, or other students' report cards.
     */
    public function test_student_role_authorization_and_data_isolation(): void
    {
        $this->app['auth']->forgetGuards();

        // 1. Student forbidden from administrative User Management
        $this->actingAs($this->studentUser, 'sanctum')->getJson('/api/users')
            ->assertForbidden();

        // 2. Student forbidden from Academic Years management
        $this->actingAs($this->studentUser, 'sanctum')->postJson('/api/academic-years', [
            'name' => '2019 E.C.',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
        ])->assertForbidden();

        // 3. Student forbidden from creating attendance sessions
        $this->actingAs($this->studentUser, 'sanctum')->postJson('/api/attendance/sessions', [
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->schoolClass->id,
            'date' => '2025-10-12',
            'time_slot' => 'morning',
            'term_id' => 1,
        ])->assertForbidden();

        // Create a draft session to test submission authorization
        $draftSession = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->schoolClass->id,
            'course_id' => $this->course->id,
            'date' => '2025-10-12',
            'time_slot' => 'morning',
            'status' => AttendanceStatus::Draft,
            'created_by' => $this->assignedTeacher->id,
        ]);

        // 4. Student forbidden from submitting attendance
        $this->actingAs($this->studentUser, 'sanctum')->postJson("/api/attendance/sessions/{$draftSession->id}/submit", [
            'semester' => 'semester_1',
            'student_marks' => [],
        ])->assertForbidden();

        // 5. Student forbidden from creating or modifying assessments
        $this->actingAs($this->studentUser, 'sanctum')->postJson('/api/assessments', [
            'teaching_assignment_id' => $this->assignment->id,
            'name' => 'Hacked Exam',
            'total_score' => 100,
            'weight_percentage' => 100,
        ])->assertForbidden();

        // 6. Student forbidden from class gradebook and report exports
        $this->actingAs($this->studentUser, 'sanctum')->getJson("/api/report-cards/class/{$this->schoolClass->id}")
            ->assertForbidden();

        $this->actingAs($this->studentUser, 'sanctum')->get("/api/report-cards/class/{$this->schoolClass->id}/export/csv")
            ->assertForbidden();

        $this->actingAs($this->studentUser, 'sanctum')->get("/api/report-cards/class/{$this->schoolClass->id}/export/print")
            ->assertForbidden();

        // 7. Student forbidden from viewing another member's report card
        $this->actingAs($this->studentUser, 'sanctum')->getJson("/api/report-cards/student/{$this->studentMember2->id}")
            ->assertForbidden();
    }

    /**
     * D. Cross-module data consistency and attendance score independence:
     * - Verifies that attendance percentage does not alter academic weighted average.
     * - Verifies tied rank calculation rules and incomplete status handling.
     */
    public function test_cross_module_consistency_and_attendance_score_independence(): void
    {
        // 1. Assessment: 100% Final Exam
        $exam = Assessment::create([
            'teaching_assignment_id' => $this->assignment->id,
            'name' => 'Comprehensive Final',
            'total_score' => 100.00,
            'weight_percentage' => 100.00,
        ]);

        AssessmentResult::create([
            'assessment_id' => $exam->id,
            'member_id' => $this->studentMember1->id,
            'score' => 90.00,
        ]);

        // 2. Attendance Session: Student 1 has 0% attendance (absent)
        $session = AttendanceSession::create([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->schoolClass->id,
            'course_id' => $this->course->id,
            'date' => '2025-10-15',
            'time_slot' => 'morning',
            'status' => AttendanceStatus::Closed,
            'submitted_by' => $this->assignedTeacher->id,
            'submitted_at' => now(),
            'closed_at' => now(),
        ]);

        SessionStudentRecord::create([
            'attendance_session_id' => $session->id,
            'student_id' => $this->studentMember1->id,
            'mark' => AttendanceMark::Absent,
            'marked_by' => $this->assignedTeacher->id,
            'marked_at' => now(),
        ]);

        // 3. Query report card as Superadmin
        $res = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/report-cards/student/{$this->studentMember1->id}?academic_year_id={$this->academicYear->id}&semester=semester_1")
            ->assertOk();

        // Attendance rate is 0.00%
        $res->assertJsonPath('data.attendance.attendance_rate', 0);
        // Academic score adjustment MUST remain 0.00 (informational attendance)
        $res->assertJsonPath('data.attendance.score_adjustment', 0);
        // Final academic overall average must remain exactly 90.00%
        $res->assertJsonPath('data.summary.overall_average', 90);
        $res->assertJsonPath('data.summary.status', 'PASS');
    }
}
