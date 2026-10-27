<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Member;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberRegistrationEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    private User $authorizedUser;
    private SchoolClass $schoolClass;
    private AcademicYear $academicYear;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $role = Role::where('name', 'superadmin')->firstOrFail();
        $this->authorizedUser = User::factory()->create(['role_id' => $role->id]);
        $this->authorizedUser->syncRoles(['superadmin']);

        $this->academicYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::create([
            'name' => ['en' => '2026-2027 Academic Year'],
            'start_date' => Carbon::today()->subMonths(2)->toDateString(),
            'end_date' => Carbon::today()->addMonths(8)->toDateString(),
            'is_current' => true,
        ]);

        $this->schoolClass = SchoolClass::create([
            'code' => 'G1',
            'name' => ['en' => 'Grade 1', 'am' => 'ክፍል 1', 'om' => 'Kutaa 1'],
            'number_of_sections' => 3, // Sections A, B, C
            'passing_score' => 50,
        ]);
    }

    public function test_member_registration_automatically_creates_student_enrollment(): void
    {
        $payload = [
            'full_name' => ['en' => 'Daniel Wasihun', 'am' => 'ዳንኤል ዋሲሁን', 'om' => 'Daani\'eel Waasihuun'],
            'christian_name' => ['en' => 'Haile Maryam', 'am' => 'ኃይለ ማርያም'],
            'date_of_birth' => Carbon::today()->subYears(7)->toDateString(),
            'gender' => 'male',
            'class_id' => $this->schoolClass->id,
            'section' => 'B',
            'phone_number' => '+251911002233',
        ];

        $response = $this->actingAs($this->authorizedUser, 'sanctum')->postJson('/api/members', $payload);

        $response->assertCreated();
        $memberId = $response->json('data.id');

        $this->assertDatabaseHas('members', [
            'id' => $memberId,
            'class_id' => $this->schoolClass->id,
            'section' => 'B',
        ]);

        // Verify active StudentEnrollment was automatically created
        $this->assertDatabaseHas('student_enrollments', [
            'member_id' => $memberId,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->schoolClass->id,
            'section' => 'B',
            'end_date' => null,
        ]);

        $member = Member::find($memberId);
        $this->assertEquals('Daniel Wasihun', $member->getTranslation('full_name', 'en'));
        $this->assertEquals('ዳንኤል ዋሲሁን', $member->getTranslation('full_name', 'am'));
    }

    public function test_member_under_three_years_fails_validation(): void
    {
        $payload = [
            'full_name' => ['en' => 'Baby Member'],
            'date_of_birth' => Carbon::today()->subYears(2)->toDateString(), // 2 years old
            'gender' => 'female',
            'class_id' => $this->schoolClass->id,
            'section' => 'A',
        ];

        $response = $this->actingAs($this->authorizedUser, 'sanctum')->postJson('/api/members', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date_of_birth']);
    }

    public function test_invalid_section_normalizes_to_first_valid_section(): void
    {
        $payload = [
            'full_name' => ['en' => 'Student XYZ'],
            'date_of_birth' => Carbon::today()->subYears(5)->toDateString(),
            'gender' => 'male',
            'class_id' => $this->schoolClass->id,
            'section' => 'Z', // Invalid section since class has 3 sections (A, B, C)
        ];

        $response = $this->actingAs($this->authorizedUser, 'sanctum')->postJson('/api/members', $payload);

        $response->assertCreated();
        $memberId = $response->json('data.id');

        $this->assertDatabaseHas('members', [
            'id' => $memberId,
            'section' => 'A',
        ]);

        $this->assertDatabaseHas('student_enrollments', [
            'member_id' => $memberId,
            'section' => 'A',
        ]);
    }
}
