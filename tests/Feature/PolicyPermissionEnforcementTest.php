<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PolicyPermissionEnforcementTest extends TestCase
{
    use RefreshDatabase;

    private User $unauthorizedUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();

        // Create a user with zero roles or permissions
        $this->unauthorizedUser = User::factory()->create();
    }

    public function test_user_without_roles_permission_is_forbidden_from_roles_index(): void
    {
        $response = $this->actingAs($this->unauthorizedUser, 'sanctum')->getJson('/api/roles');

        $response->assertForbidden();
    }

    public function test_user_without_roles_manage_permission_is_forbidden_from_syncing_permissions(): void
    {
        $role = Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);

        $response = $this->actingAs($this->unauthorizedUser, 'sanctum')
            ->putJson("/api/roles/{$role->id}/permissions", [
                'permission_ids' => [],
            ]);

        $response->assertForbidden();
    }

    public function test_user_without_payments_view_permission_is_forbidden_from_payment_dashboard(): void
    {
        $response = $this->actingAs($this->unauthorizedUser, 'sanctum')->getJson('/api/payments/dashboard');

        $response->assertForbidden();
    }

    public function test_user_without_payments_record_permission_is_forbidden_from_recording_payments(): void
    {
        $response = $this->actingAs($this->unauthorizedUser, 'sanctum')->postJson('/api/payments', [
            'member_id' => 1,
            'payment_month' => '2026-10',
            'paid_amount' => 100,
        ]);

        $response->assertForbidden();
    }

    public function test_user_without_payments_export_permission_is_forbidden_from_exporting_payments(): void
    {
        $response = $this->actingAs($this->unauthorizedUser, 'sanctum')->getJson('/api/payments/export/transactions');

        $response->assertForbidden();
    }

    public function test_user_without_attendance_close_permission_is_forbidden_from_closing_session(): void
    {
        $academicYear = AcademicYear::firstOrCreate(
            ['is_current' => true],
            ['name' => '2026', 'start_date' => '2026-09-01', 'end_date' => '2027-06-30']
        );
        $schoolClass = SchoolClass::firstOrCreate(
            ['code' => 'G1'],
            ['name' => 'Grade 1', 'number_of_sections' => 1, 'passing_score' => 50]
        );

        $session = AttendanceSession::create([
            'academic_year_id' => $academicYear->id,
            'class_id' => $schoolClass->id,
            'date' => '2026-10-18',
            'time_slot' => 'morning',
            'term_id' => 1,
            'status' => 'submitted',
        ]);

        $response = $this->actingAs($this->unauthorizedUser, 'sanctum')
            ->postJson("/api/attendance/sessions/{$session->id}/close");

        $response->assertForbidden();
    }

    public function test_user_without_teaching_assignments_create_is_forbidden_from_assigning_teachers(): void
    {
        $academicYear = AcademicYear::firstOrCreate(
            ['is_current' => true],
            ['name' => '2026', 'start_date' => '2026-09-01', 'end_date' => '2027-06-30']
        );
        $schoolClass = SchoolClass::firstOrCreate(
            ['code' => 'G1'],
            ['name' => 'Grade 1', 'number_of_sections' => 1, 'passing_score' => 50]
        );
        $course = Course::firstOrCreate(
            ['code' => 'C1', 'class_id' => $schoolClass->id],
            ['name' => 'Course 1', 'credit_hour' => 1]
        );

        $response = $this->actingAs($this->unauthorizedUser, 'sanctum')->postJson('/api/teaching-assignments', [
            'teacher_id' => $this->unauthorizedUser->id,
            'academic_year_id' => $academicYear->id,
            'class_id' => $schoolClass->id,
            'section' => 'A',
            'course_id' => $course->id,
            'semester' => 'semester_1',
        ]);

        $response->assertForbidden();
    }

    public function test_user_without_student_enrollments_create_is_forbidden_from_enrolling_students(): void
    {
        $response = $this->actingAs($this->unauthorizedUser, 'sanctum')->postJson('/api/enrollments', [
            'member_id' => 1,
            'academic_year_id' => 1,
            'class_id' => 1,
            'section' => 'A',
            'start_date' => '2026-10-01',
        ]);

        $response->assertForbidden();
    }
}
