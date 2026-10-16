<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicYearApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_can_create_and_read_an_academic_year(): void
    {
        $role = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $user = User::factory()->create(['role_id' => $role->id]);
        $user->syncRoles(['superadmin']);

        $this->actingAs($user, 'sanctum')->postJson('/api/academic-years', [
            'name' => '2018 E.C.', 'start_date' => '2025-09-01', 'end_date' => '2026-06-30', 'is_current' => true,
        ])->assertCreated()->assertJsonPath('data.name', '2018 E.C.');

        $this->actingAs($user, 'sanctum')->getJson('/api/academic-years')
            ->assertOk()->assertJsonPath('data.0.name', '2018 E.C.');
    }
}
