<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_guest_can_register_as_a_student_and_receive_a_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Student One',
            'email' => 'student@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', 'student')
            ->assertJsonStructure(['token']);
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
