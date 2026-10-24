<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_register_user_without_authentication(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Student One',
            'email' => 'student@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_without_permission_cannot_register_user(): void
    {
        $studentRole = Role::create(['name' => 'student', 'guard_name' => 'web']);
        $student = User::factory()->create(['role_id' => $studentRole->id]);
        $student->syncRoles(['student']);

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/auth/register', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $response->assertForbidden();
    }

    public function test_authorized_user_with_permission_can_register_user(): void
    {
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $adminRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $admin = User::factory()->create(['role_id' => $adminRole->id]);
        $admin->syncRoles(['superadmin']);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/auth/register', [
            'name' => 'Student One',
            'email' => 'student@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'role' => 'student',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', 'student')
            ->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('users', ['email' => 'student@example.com']);
    }

    public function test_user_with_explicit_users_register_permission_can_register_user(): void
    {
        $staffRole = Role::create(['name' => 'staff', 'guard_name' => 'web']);
        $permission = Permission::create(['name' => 'users.register', 'guard_name' => 'web']);
        $staffRole->givePermissionTo($permission);

        $staff = User::factory()->create(['role_id' => $staffRole->id]);
        $staff->syncRoles(['staff']);

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/auth/register', [
            'name' => 'Staff Registered Student',
            'email' => 'staff_student@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'staff_student@example.com');
    }

    public function test_user_administration_is_limited_to_superadmins(): void
    {
        $teacherRole = Role::create(['name' => 'teacher', 'guard_name' => 'web']);
        $teacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $teacher->syncRoles(['teacher']);

        $this->actingAs($teacher, 'sanctum')
            ->getJson('/api/users')
            ->assertForbidden()
            ->assertJsonPath('message', 'You are not authorized to perform this action.');
    }
}
