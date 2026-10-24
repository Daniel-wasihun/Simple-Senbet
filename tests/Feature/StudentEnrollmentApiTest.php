<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Member;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentEnrollmentApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    private User $teacher;

    private AcademicYear $academicYear;

    private SchoolClass $classA;

    private SchoolClass $classB;

    private Member $member;

    protected function setUp(): void
    {
        parent::setUp();

        $superadminRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $teacherRole = Role::create(['name' => 'teacher', 'guard_name' => 'web']);

        $this->superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->teacher = User::factory()->create(['name' => 'Teacher', 'role_id' => $teacherRole->id]);
        $this->teacher->syncRoles(['teacher']);

        $this->academicYear = AcademicYear::create([
            'name' => '2025-2026 Academic Year',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $this->classA = SchoolClass::create([
            'name' => ['en' => 'Grade 9'],
            'code' => 'G9',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->classB = SchoolClass::create([
            'name' => ['en' => 'Grade 10'],
            'code' => 'G10',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->member = Member::create([
            'full_name' => ['en' => 'Samuel Girma'],
            'date_of_birth' => '2010-06-15',
            'gender' => 'male',
            'class_id' => $this->classA->id,
            'section' => 'A',
        ]);
    }

    public function test_superadmin_can_enroll_student(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/enrollments', [
            'member_id' => $this->member->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->classA->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.member_id', $this->member->id)
            ->assertJsonPath('data.section', 'A')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('student_enrollments', [
            'member_id' => $this->member->id,
            'class_id' => $this->classA->id,
            'section' => 'A',
            'end_date' => null,
        ]);
    }

    public function test_teacher_cannot_enroll_student(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')->postJson('/api/enrollments', [
            'member_id' => $this->member->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->classA->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
        ]);

        $response->assertForbidden();
    }

    public function test_superadmin_can_transfer_student(): void
    {
        StudentEnrollment::create([
            'member_id' => $this->member->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->classA->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
            'end_date' => null,
        ]);

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->postJson("/api/enrollments/members/{$this->member->id}/transfer", [
                'new_class_id' => $this->classB->id,
                'new_section' => 'B',
                'transfer_date' => '2025-11-01',
                'reason' => 'Academic advancement',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.class_id', $this->classB->id)
            ->assertJsonPath('data.section', 'B');

        $this->assertEquals(
            '2025-11-01',
            StudentEnrollment::where('member_id', $this->member->id)->where('class_id', $this->classA->id)->first()->end_date?->toDateString()
        );

        $this->assertNull(
            StudentEnrollment::where('member_id', $this->member->id)->where('class_id', $this->classB->id)->first()->end_date
        );
    }

    public function test_superadmin_can_withdraw_student(): void
    {
        StudentEnrollment::create([
            'member_id' => $this->member->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->classA->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
            'end_date' => null,
        ]);

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->postJson("/api/enrollments/members/{$this->member->id}/withdraw", [
                'withdrawal_date' => '2025-12-15',
                'reason' => 'Family relocation',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.end_date', '2025-12-15')
            ->assertJsonPath('data.is_active', false);

        $this->assertEquals(
            '2025-12-15',
            StudentEnrollment::where('member_id', $this->member->id)->first()->end_date?->toDateString()
        );
    }

    public function test_query_active_roster_for_date(): void
    {
        StudentEnrollment::create([
            'member_id' => $this->member->id,
            'academic_year_id' => $this->academicYear->id,
            'class_id' => $this->classA->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
            'end_date' => null,
        ]);

        $response = $this->actingAs($this->superadmin, 'sanctum')->getJson(
            '/api/enrollments/roster?class_id='.$this->classA->id.
            '&section=A&date=2025-10-01'
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->member->id);
    }
}
