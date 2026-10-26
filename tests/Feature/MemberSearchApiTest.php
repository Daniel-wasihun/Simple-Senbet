<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberSearchApiTest extends TestCase
{
    use RefreshDatabase;

    private User $authorizedUser;
    private SchoolClass $schoolClass;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();

        $role = Role::where('name', 'superadmin')->firstOrFail();
        $this->authorizedUser = User::factory()->create(['role_id' => $role->id]);
        $this->authorizedUser->syncRoles(['superadmin']);

        $this->schoolClass = SchoolClass::create([
            'code' => 'G1',
            'name' => ['en' => 'Grade 1', 'am' => 'ክፍል 1'],
            'number_of_sections' => 1,
            'passing_score' => 50,
        ]);

        Member::create([
            'class_id' => $this->schoolClass->id,
            'full_name' => ['en' => 'Abebe Bikila', 'am' => 'አበበ ቢቂላ'],
            'christian_name' => 'Gebre Maryam',
            'date_of_birth' => '2010-01-01',
            'gender' => 'Male',
            'phone_number' => '+251911223344',
        ]);

        Member::create([
            'class_id' => $this->schoolClass->id,
            'full_name' => ['en' => 'Almaz Ayana', 'am' => 'አልማዝ አያና'],
            'christian_name' => 'Walatta Petros',
            'date_of_birth' => '2011-02-02',
            'gender' => 'Female',
            'phone_number' => '+251922334455',
        ]);
    }

    public function test_empty_search_returns_all_members(): void
    {
        $response = $this->actingAs($this->authorizedUser, 'sanctum')->getJson('/api/members?search=');

        $response->assertOk()
            ->assertJsonCount(Member::count(), 'data');
    }

    public function test_english_name_search_matches(): void
    {
        $response = $this->actingAs($this->authorizedUser, 'sanctum')->getJson('/api/members?search=Bikila');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.christian_name', 'Gebre Maryam');
    }

    public function test_amharic_unicode_search_matches(): void
    {
        $response = $this->actingAs($this->authorizedUser, 'sanctum')->getJson('/api/members?search=አልማዝ');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.christian_name', 'Walatta Petros');
    }

    public function test_christian_name_search_matches(): void
    {
        $response = $this->actingAs($this->authorizedUser, 'sanctum')->getJson('/api/members?search=Maryam');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.phone_number', '+251911223344');
    }

    public function test_phone_number_search_matches(): void
    {
        $response = $this->actingAs($this->authorizedUser, 'sanctum')->getJson('/api/members?search=922334455');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.christian_name', 'Walatta Petros');
    }

    public function test_special_characters_and_sql_injection_attempts_do_not_error(): void
    {
        $maliciousInputs = [
            "' OR '1'='1",
            "'; DROP TABLE members; --",
            "%_\\",
            "\"'<>",
            "{}[]()",
        ];

        foreach ($maliciousInputs as $input) {
            $response = $this->actingAs($this->authorizedUser, 'sanctum')->getJson('/api/members?search=' . urlencode($input));
            $response->assertOk();
        }
    }
}
