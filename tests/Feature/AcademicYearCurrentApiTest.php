<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicYearCurrentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_retrieve_current_academic_year(): void
    {
        $teacherRole = Role::create(['name' => 'teacher', 'guard_name' => 'web']);
        $teacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $teacher->syncRoles(['teacher']);

        AcademicYear::create([
            'name' => '2024-2025 Academic Year',
            'start_date' => '2024-09-01',
            'end_date' => '2025-06-30',
            'is_current' => false,
        ]);

        $currentYear = AcademicYear::create([
            'name' => '2025-2026 Academic Year',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $response = $this->actingAs($teacher, 'sanctum')->getJson('/api/academic-years/current');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $currentYear->id)
            ->assertJsonPath('data.is_current', true);
    }
}
