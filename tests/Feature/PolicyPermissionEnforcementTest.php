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

    public function test_user_without_members_create_is_forbidden_from_registering_members(): void
    {
        $response = $this->actingAs($this->unauthorizedUser, 'sanctum')->postJson('/api/members', [
            'full_name' => ['en' => 'Test User'],
            'gender' => 'male',
            'date_of_birth' => '2015-01-01',
            'class_id' => 1,
            'section' => 'A',
        ]);

        $response->assertForbidden();
    }

    public function test_superadmin_can_view_roles_and_create_academic_year(): void
    {
        $superadminRole = Role::where('name', 'superadmin')->firstOrFail();
        $superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $superadmin->syncRoles(['superadmin']);

        $response = $this->actingAs($superadmin, 'sanctum')->postJson('/api/academic-years', [
            'name' => '2029-2030 Academic Year',
            'start_date' => '2029-09-01',
            'end_date' => '2030-06-30',
            'is_current' => false,
        ]);

        $response->assertCreated();
    }

    public function test_superadmin_cannot_delete_self(): void
    {
        $superadminRole = Role::where('name', 'superadmin')->firstOrFail();
        $superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $superadmin->syncRoles(['superadmin']);

        $response = $this->actingAs($superadmin, 'sanctum')->deleteJson("/api/users/{$superadmin->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('users', ['id' => $superadmin->id]);
    }

    public function test_superadmin_can_delete_other_user(): void
    {
        $superadminRole = Role::where('name', 'superadmin')->firstOrFail();
        $superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $superadmin->syncRoles(['superadmin']);

        $otherUser = User::factory()->create();

        $response = $this->actingAs($superadmin, 'sanctum')->deleteJson("/api/users/{$otherUser->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $otherUser->id]);
    }

    public function test_superadmin_cannot_alter_own_roles(): void
    {
        $superadminRole = Role::where('name', 'superadmin')->firstOrFail();
        $superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $superadmin->syncRoles(['superadmin']);
        $teacherRole = Role::where('name', 'teacher')->firstOrFail();

        $response = $this->actingAs($superadmin, 'sanctum')->putJson("/api/users/{$superadmin->id}/roles", [
            'role_ids' => [$teacherRole->id],
        ]);

        $response->assertForbidden();
    }

    public function test_superadmin_cannot_delete_superadmin_role(): void
    {
        $superadminRole = Role::where('name', 'superadmin')->firstOrFail();
        $superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $superadmin->syncRoles(['superadmin']);

        $response = $this->actingAs($superadmin, 'sanctum')->deleteJson("/api/roles/{$superadminRole->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('roles', ['name' => 'superadmin']);
    }

    public function test_superadmin_cannot_modify_superadmin_role_permissions(): void
    {
        $superadminRole = Role::where('name', 'superadmin')->firstOrFail();
        $superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $superadmin->syncRoles(['superadmin']);

        $response = $this->actingAs($superadmin, 'sanctum')->putJson("/api/roles/{$superadminRole->id}/permissions", [
            'permission_ids' => [],
        ]);

        $response->assertForbidden();
    }

    public function test_ordinary_user_can_view_own_profile_but_cannot_view_others_or_delete_superadmin(): void
    {
        $studentRole = Role::where('name', 'student')->firstOrFail();
        $ordinaryUser = User::factory()->create(['role_id' => $studentRole->id]);
        $ordinaryUser->syncRoles(['student']);

        $superadminRole = Role::where('name', 'superadmin')->firstOrFail();
        $superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $superadmin->syncRoles(['superadmin']);

        // Ordinary user can view own profile
        $responseSelf = $this->actingAs($ordinaryUser, 'sanctum')->getJson("/api/users/{$ordinaryUser->id}");
        $responseSelf->assertOk();

        // Ordinary user cannot view superadmin profile
        $responseOther = $this->actingAs($ordinaryUser, 'sanctum')->getJson("/api/users/{$superadmin->id}");
        $responseOther->assertForbidden();

        // Ordinary user cannot delete superadmin
        $responseDelete = $this->actingAs($ordinaryUser, 'sanctum')->deleteJson("/api/users/{$superadmin->id}");
        $responseDelete->assertForbidden();
    }
}
