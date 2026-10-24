<?php

namespace Tests\Feature;

use App\Enums\AttendanceStatus;
use App\Models\AcademicYear;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceSessionDeleteApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    private User $teacher;

    private AttendanceSession $draftSession;

    private AttendanceSession $closedSession;

    protected function setUp(): void
    {
        parent::setUp();

        $superadminRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $teacherRole = Role::create(['name' => 'teacher', 'guard_name' => 'web']);

        $this->superadmin = User::factory()->create(['role_id' => $superadminRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->teacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->teacher->syncRoles(['teacher']);

        $academicYear = AcademicYear::create([
            'name' => '2025-2026 Academic Year',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $class = SchoolClass::create([
            'name' => ['en' => 'Grade 9'],
            'code' => 'G9',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $course = Course::create([
            'class_id' => $class->id,
            'name' => ['en' => 'Mezmur'],
            'code' => 'MEZ101',
            'credit_hour' => 2,
        ]);

        $this->draftSession = AttendanceSession::create([
            'academic_year_id' => $academicYear->id,
            'term_id' => 1,
            'class_id' => $class->id,
            'course_id' => $course->id,
            'date' => '2025-10-05',
            'time_slot' => '09:00-10:00',
            'status' => AttendanceStatus::Draft,
            'created_by' => $this->superadmin->id,
        ]);

        $this->closedSession = AttendanceSession::create([
            'academic_year_id' => $academicYear->id,
            'term_id' => 1,
            'class_id' => $class->id,
            'course_id' => $course->id,
            'date' => '2025-10-12',
            'time_slot' => '09:00-10:00',
            'status' => AttendanceStatus::Closed,
            'created_by' => $this->superadmin->id,
        ]);
    }

    public function test_superadmin_can_delete_draft_session(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->deleteJson("/api/attendance/sessions/{$this->draftSession->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('attendance_sessions', [
            'id' => $this->draftSession->id,
        ]);
    }

    public function test_teacher_cannot_delete_session(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->deleteJson("/api/attendance/sessions/{$this->draftSession->id}");

        $response->assertForbidden();
    }

    public function test_superadmin_cannot_delete_closed_session(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->deleteJson("/api/attendance/sessions/{$this->closedSession->id}");

        $response->assertForbidden();
    }
}
