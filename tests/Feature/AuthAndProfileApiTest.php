<?php

namespace Tests\Feature;

use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthAndProfileApiTest extends TestCase
{
    use RefreshDatabase;

    protected Role $teacherRole;
    protected Role $adminRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacherRole = Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        $this->adminRole = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    public function test_teacher_can_login_with_valid_credentials_and_receive_assignments(): void
    {
        $teacher = User::factory()->create([
            'email' => 'teacher@example.com',
            'password' => Hash::make('Secret123!'),
            'role_id' => $this->teacherRole->id,
        ]);
        $teacher->syncRoles(['teacher']);

        $academicYear = AcademicYear::create([
            'name' => '2026-2027 Academic Year',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
        ]);

        $class = SchoolClass::create([
            'name' => 'Grade 4-A',
            'code' => 'G4A',
            'number_of_sections' => 2,
            'passing_score' => 50,
        ]);

        $course = Course::create([
            'name' => 'Bible Study',
            'code' => 'BST101',
            'class_id' => $class->id,
            'is_active' => true,
        ]);

        TeachingAssignment::create([
            'teacher_id' => $teacher->id,
            'academic_year_id' => $academicYear->id,
            'class_id' => $class->id,
            'section' => 'A',
            'course_id' => $course->id,
            'semester' => Semester::Semester1,
            'is_primary' => true,
            'start_date' => '2026-09-01',
            'end_date' => '2027-01-31',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'teacher@example.com',
            'password' => 'Secret123!',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'teacher@example.com')
            ->assertJsonPath('user.role', 'teacher')
            ->assertJsonPath('user.teaching_assignments.0.class_name', 'Grade 4-A')
            ->assertJsonPath('user.teaching_assignments.0.course_name', 'Bible Study')
            ->assertJsonPath('user.teaching_assignments.0.section', 'A')
            ->assertJsonPath('user.teaching_assignments.0.is_primary', true)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => [
                    'id', 'name', 'email', 'role', 'created_at', 'teaching_assignments',
                ],
            ]);
    }

    public function test_login_fails_with_invalid_credentials_without_leaking_details(): void
    {
        $teacher = User::factory()->create([
            'email' => 'teacher@example.com',
            'password' => Hash::make('CorrectPassword123!'),
            'role_id' => $this->teacherRole->id,
        ]);
        $teacher->syncRoles(['teacher']);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'teacher@example.com',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(422)
            ->assertJson(['message' => __('auth.failed')])
            ->assertJsonMissing(['token'])
            ->assertJsonMissing(['password']);
    }

    public function test_login_fails_for_non_existent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'AnyPassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJson(['message' => __('auth.failed')]);
    }

    public function test_unauthenticated_request_to_profile_is_rejected(): void
    {
        $this->getJson('/api/profile')
            ->assertUnauthorized();
    }

    public function test_authenticated_teacher_can_fetch_profile_with_assignments(): void
    {
        $teacher = User::factory()->create([
            'name' => 'Ato Melaku',
            'email' => 'melaku@example.com',
            'role_id' => $this->teacherRole->id,
        ]);
        $teacher->syncRoles(['teacher']);

        $academicYear = AcademicYear::create([
            'name' => '2026-2027 Academic Year',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
        ]);

        $class = SchoolClass::create([
            'name' => 'Grade 5-B',
            'code' => 'G5B',
            'number_of_sections' => 1,
            'passing_score' => 60,
        ]);

        $course = Course::create([
            'name' => 'Church History',
            'code' => 'CH101',
            'class_id' => $class->id,
            'is_active' => true,
        ]);

        TeachingAssignment::create([
            'teacher_id' => $teacher->id,
            'academic_year_id' => $academicYear->id,
            'class_id' => $class->id,
            'section' => 'B',
            'course_id' => $course->id,
            'semester' => Semester::Semester2,
            'is_primary' => false,
            'start_date' => '2027-02-01',
            'end_date' => '2027-06-30',
        ]);

        $this->actingAs($teacher, 'sanctum')
            ->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('user.name', 'Ato Melaku')
            ->assertJsonPath('user.role', 'teacher')
            ->assertJsonCount(1, 'user.teaching_assignments')
            ->assertJsonPath('user.teaching_assignments.0.class_name', 'Grade 5-B')
            ->assertJsonPath('user.teaching_assignments.0.course_code', 'CH101');
    }

    public function test_authenticated_admin_profile_returns_role_without_teaching_assignments(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role_id' => $this->adminRole->id,
        ]);
        $admin->syncRoles(['superadmin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/profile');

        $response->assertOk()
            ->assertJsonPath('user.name', 'Admin User')
            ->assertJsonPath('user.role', 'superadmin')
            ->assertJsonMissingPath('user.teaching_assignments');
    }

    public function test_logout_revokes_current_token(): void
    {
        $teacher = User::factory()->create([
            'email' => 'teacher@example.com',
            'role_id' => $this->teacherRole->id,
        ]);
        $teacher->syncRoles(['teacher']);

        $token = $teacher->createToken('test-token')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJson(['message' => __('auth.logged_out')]);

        // Token should now be deleted from personal_access_tokens
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $teacher->id,
            'name' => 'test-token',
        ]);

        // Forget in-memory auth guard cache
        $this->app['auth']->forgetGuards();

        // Subsequent call with the same revoked token should be unauthorized
        $this->withToken($token)
            ->getJson('/api/profile')
            ->assertUnauthorized();
    }
}
