<?php

namespace Tests\Feature\Stage1;

use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AttendanceMigrationTest extends TestCase
{
    use RefreshDatabase;

    private AcademicYear $academicYear;

    private SchoolClass $class;

    private Course $courseA;

    private Course $courseB;

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

        $this->courseA = Course::create([
            'class_id' => $this->class->id,
            'name' => ['en' => 'Mathematics'],
            'code' => 'MATH-10',
        ]);

        $this->courseB = Course::create([
            'class_id' => $this->class->id,
            'name' => ['en' => 'Physics'],
            'code' => 'PHYS-10',
        ]);

        $this->teacher = User::factory()->create([
            'name' => 'Teacher User',
            'email' => 'teacher@example.com',
        ]);

        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);

        $this->student = Member::create([
            'full_name' => ['en' => 'Student One'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);
    }

    public function test_all_four_attendance_tables_exist_with_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('attendance_sessions'));
        $this->assertTrue(Schema::hasTable('session_student_records'));
        $this->assertTrue(Schema::hasTable('session_teacher_records'));
        $this->assertTrue(Schema::hasTable('attendance_audit_logs'));

        // Check attendance_sessions soft deletes
        $this->assertTrue(Schema::hasColumn('attendance_sessions', 'deleted_at'));

        // Check attendance_audit_logs has created_at but NO updated_at
        $this->assertTrue(Schema::hasColumn('attendance_audit_logs', 'created_at'));
        $this->assertFalse(Schema::hasColumn('attendance_audit_logs', 'updated_at'));
    }

    public function test_course_partial_unique_index_rejects_duplicate_subject_sessions(): void
    {
        // Insert first course session
        DB::table('attendance_sessions')->insert([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->courseA->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attempt duplicate course session for the exact same slot
        $this->expectException(QueryException::class);
        DB::table('attendance_sessions')->insert([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->courseA->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_homeroom_partial_unique_index_rejects_duplicate_homeroom_sessions(): void
    {
        // Insert first homeroom session (course_id IS NULL)
        DB::table('attendance_sessions')->insert([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => null,
            'date' => '2026-10-18',
            'time_slot' => 'morning_roll_call',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attempt duplicate homeroom session for the same class and time slot
        $this->expectException(QueryException::class);
        DB::table('attendance_sessions')->insert([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => null,
            'date' => '2026-10-18',
            'time_slot' => 'morning_roll_call',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_subject_and_homeroom_sessions_can_coexist_for_same_class_and_slot(): void
    {
        // Insert homeroom session (course_id IS NULL)
        $homeroomId = DB::table('attendance_sessions')->insertGetId([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => null,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert course session (course_id IS NOT NULL) on the exact same date and time slot
        $courseSessionId = DB::table('attendance_sessions')->insertGetId([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->courseA->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Also insert second course session for a different course on the same date and slot
        $courseSessionBId = DB::table('attendance_sessions')->insertGetId([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->courseB->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertGreaterThan(0, $homeroomId);
        $this->assertGreaterThan(0, $courseSessionId);
        $this->assertGreaterThan(0, $courseSessionBId);
    }

    public function test_session_student_records_composite_uniqueness(): void
    {
        $sessionId = DB::table('attendance_sessions')->insertGetId([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->courseA->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('session_student_records')->insert([
            'attendance_session_id' => $sessionId,
            'student_id' => $this->student->id,
            'mark' => 'present',
            'marked_by' => $this->teacher->id,
            'marked_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attempting to record a second mark for the same student in the same session must fail
        $this->expectException(QueryException::class);
        DB::table('session_student_records')->insert([
            'attendance_session_id' => $sessionId,
            'student_id' => $this->student->id,
            'mark' => 'absent',
            'marked_by' => $this->teacher->id,
            'marked_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_session_teacher_records_composite_uniqueness(): void
    {
        $sessionId = DB::table('attendance_sessions')->insertGetId([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->courseA->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('session_teacher_records')->insert([
            'attendance_session_id' => $sessionId,
            'teacher_id' => $this->teacher->id,
            'mark' => 'present',
            'marked_by' => $this->admin->id,
            'marked_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attempting to record a second mark for the same teacher in the same session must fail
        $this->expectException(QueryException::class);
        DB::table('session_teacher_records')->insert([
            'attendance_session_id' => $sessionId,
            'teacher_id' => $this->teacher->id,
            'mark' => 'late',
            'marked_by' => $this->admin->id,
            'marked_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_audit_logs_restrict_session_deletion(): void
    {
        $sessionId = DB::table('attendance_sessions')->insertGetId([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->courseA->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('attendance_audit_logs')->insert([
            'attendance_session_id' => $sessionId,
            'actor_id' => $this->admin->id,
            'action' => 'session_created',
            'previous_state' => null,
            'new_state' => json_encode(['status' => 'draft']),
            'created_at' => now(),
        ]);

        // Attempting to hard-delete session must fail because audit log references it with ON DELETE RESTRICT
        $this->expectException(QueryException::class);
        DB::table('attendance_sessions')->where('id', $sessionId)->delete();
    }

    public function test_student_and_teacher_records_cascade_on_session_deletion(): void
    {
        $sessionId = DB::table('attendance_sessions')->insertGetId([
            'academic_year_id' => $this->academicYear->id,
            'term_id' => 1,
            'class_id' => $this->class->id,
            'course_id' => $this->courseA->id,
            'date' => '2026-10-18',
            'time_slot' => 'period_1',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('session_student_records')->insert([
            'attendance_session_id' => $sessionId,
            'student_id' => $this->student->id,
            'mark' => 'present',
            'marked_by' => $this->teacher->id,
            'marked_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('session_teacher_records')->insert([
            'attendance_session_id' => $sessionId,
            'teacher_id' => $this->teacher->id,
            'mark' => 'present',
            'marked_by' => $this->admin->id,
            'marked_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertEquals(1, DB::table('session_student_records')->where('attendance_session_id', $sessionId)->count());
        $this->assertEquals(1, DB::table('session_teacher_records')->where('attendance_session_id', $sessionId)->count());

        // Deleting session cascades to record tables
        DB::table('attendance_sessions')->where('id', $sessionId)->delete();

        $this->assertEquals(0, DB::table('session_student_records')->where('attendance_session_id', $sessionId)->count());
        $this->assertEquals(0, DB::table('session_teacher_records')->where('attendance_session_id', $sessionId)->count());
    }
}
