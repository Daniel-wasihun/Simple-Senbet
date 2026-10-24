<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $superadminRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $teacherRole = Role::create(['name' => 'teacher', 'guard_name' => 'web']);

        $this->superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->teacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->teacher->syncRoles(['teacher']);
    }

    public function test_superadmin_can_list_roles(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')->getJson('/api/roles');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'guard_name'],
                ],
            ]);
    }

    public function test_superadmin_can_view_single_role_with_permissions(): void
    {
        $teacherRole = Role::where('name', 'teacher')->firstOrFail();

        $response = $this->actingAs($this->superadmin, 'sanctum')->getJson("/api/roles/{$teacherRole->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'teacher');
    }

    public function test_non_superadmin_is_forbidden_from_roles(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')->getJson('/api/roles');

        $response->assertForbidden();
    }
}
