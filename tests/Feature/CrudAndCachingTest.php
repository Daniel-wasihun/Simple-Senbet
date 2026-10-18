<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Course;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CrudAndCachingTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;
    private SchoolClass $class;
    private Course $course;
    private TeachingAssignment $assignment;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Superadmin
        $role = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $this->superadmin = User::factory()->create(['role_id' => $role->id]);
        $this->superadmin->syncRoles(['superadmin']);

        // Setup Class & Course
        $this->class = SchoolClass::create([
            'name' => ['en' => 'Grade 9'],
            'code' => 'G9',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->course = Course::create([
            'class_id' => $this->class->id,
            'name' => ['en' => 'Church History'],
            'code' => 'HIST-9',
            'credit_hour' => 3,
        ]);

        $year = AcademicYear::create([
            'name' => ['en' => '2018 E.C.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $teacherRole = Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        $teacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $teacher->syncRoles(['teacher']);

        $this->assignment = TeachingAssignment::create([
            'teacher_id' => $teacher->id,
            'academic_year_id' => $year->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'course_id' => $this->course->id,
            'semester' => 'semester_1',
            'is_primary' => true,
            'start_date' => '2025-09-01',
            'end_date' => '2026-01-31',
        ]);
    }

    public function test_user_management_crud_and_caching(): void
    {
        // 1. Index users (populates cache)
        $res = $this->actingAs($this->superadmin, 'sanctum')->getJson('/api/users');
        $res->assertOk()->assertJsonStructure(['users' => ['data']]);

        // 2. Create user (invalidates cache)
        $createRes = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/users', [
            'name' => 'New Teacher',
            'email' => 'newteacher@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'teacher',
        ]);
        $createRes->assertCreated()
            ->assertJsonPath('user.name', 'New Teacher')
            ->assertJsonPath('user.role', 'teacher');

        $newUserId = $createRes->json('user.id');

        // 3. Show user (cached lookup)
        $showRes = $this->actingAs($this->superadmin, 'sanctum')->getJson("/api/users/{$newUserId}");
        $showRes->assertOk()->assertJsonPath('user.email', 'newteacher@example.com');

        // 4. Update user
        $updateRes = $this->actingAs($this->superadmin, 'sanctum')->putJson("/api/users/{$newUserId}", [
            'name' => 'Updated Teacher',
            'email' => 'newteacher@example.com',
            'role' => 'teacher',
        ]);
        $updateRes->assertOk()->assertJsonPath('user.name', 'Updated Teacher');

        // 5. Cannot delete self
        $this->actingAs($this->superadmin, 'sanctum')->deleteJson("/api/users/{$this->superadmin->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', __('auth.cannot_delete_self'));

        // 6. Delete user
        $deleteRes = $this->actingAs($this->superadmin, 'sanctum')->deleteJson("/api/users/{$newUserId}");
        $deleteRes->assertOk()->assertJsonPath('message', __('auth.user_deleted'));
        $this->assertDatabaseMissing('users', ['id' => $newUserId]);
    }

    public function test_school_class_crud_and_caching(): void
    {
        // Index
        $this->actingAs($this->superadmin, 'sanctum')->getJson('/api/school-classes')
            ->assertOk()->assertJsonStructure(['data']);

        // Create
        $createRes = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/school-classes', [
            'name' => 'Grade 11',
            'code' => 'G11',
            'number_of_sections' => 3,
            'passing_score' => 60.00,
        ]);
        $createRes->assertCreated()->assertJsonPath('data.code', 'G11');
        $classId = $createRes->json('data.id');

        // Show
        $this->actingAs($this->superadmin, 'sanctum')->getJson("/api/school-classes/{$classId}")
            ->assertOk()->assertJsonPath('data.code', 'G11');

        // Update
        $this->actingAs($this->superadmin, 'sanctum')->putJson("/api/school-classes/{$classId}", [
            'name' => 'Grade 11 Advanced',
            'code' => 'G11-ADV',
            'number_of_sections' => 3,
            'passing_score' => 65.00,
        ])->assertOk()->assertJsonPath('data.code', 'G11-ADV');

        // Delete
        $this->actingAs($this->superadmin, 'sanctum')->deleteJson("/api/school-classes/{$classId}")
            ->assertNoContent();
        $this->assertDatabaseMissing('classes', ['id' => $classId]);
    }

    public function test_course_crud_and_caching(): void
    {
        // Index
        $this->actingAs($this->superadmin, 'sanctum')->getJson('/api/courses')
            ->assertOk()->assertJsonStructure(['data']);

        // Create
        $createRes = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/courses', [
            'name' => 'Liturgical Studies',
            'code' => 'LIT-9',
            'credit_hour' => 2,
            'class_id' => $this->class->id,
        ]);
        $createRes->assertCreated()->assertJsonPath('data.code', 'LIT-9');
        $courseId = $createRes->json('data.id');

        // Show
        $this->actingAs($this->superadmin, 'sanctum')->getJson("/api/courses/{$courseId}")
            ->assertOk()->assertJsonPath('data.code', 'LIT-9');

        // Update
        $this->actingAs($this->superadmin, 'sanctum')->putJson("/api/courses/{$courseId}", [
            'name' => 'Liturgical Studies II',
            'code' => 'LIT-9B',
            'credit_hour' => 3,
            'class_id' => $this->class->id,
        ])->assertOk()->assertJsonPath('data.code', 'LIT-9B');

        // Delete
        $this->actingAs($this->superadmin, 'sanctum')->deleteJson("/api/courses/{$courseId}")
            ->assertNoContent();
        $this->assertDatabaseMissing('courses', ['id' => $courseId]);
    }

    public function test_assessment_crud_and_caching(): void
    {
        // Index
        $this->actingAs($this->superadmin, 'sanctum')->getJson('/api/assessments')
            ->assertOk()->assertJsonStructure(['data']);

        // Create
        $createRes = $this->actingAs($this->superadmin, 'sanctum')->postJson('/api/assessments', [
            'teaching_assignment_id' => $this->assignment->id,
            'name' => 'Midterm Exam',
            'total_score' => 40.00,
            'weight_percentage' => 30.00,
        ]);
        $createRes->assertCreated()->assertJsonPath('data.name', 'Midterm Exam');
        $assessmentId = $createRes->json('data.id');

        // Show
        $this->actingAs($this->superadmin, 'sanctum')->getJson("/api/assessments/{$assessmentId}")
            ->assertOk()->assertJsonPath('data.name', 'Midterm Exam');

        // Update
        $this->actingAs($this->superadmin, 'sanctum')->putJson("/api/assessments/{$assessmentId}", [
            'teaching_assignment_id' => $this->assignment->id,
            'name' => 'Midterm Exam Revised',
            'total_score' => 50.00,
            'weight_percentage' => 30.00,
        ])->assertOk()->assertJsonPath('data.name', 'Midterm Exam Revised');

        // Delete
        $this->actingAs($this->superadmin, 'sanctum')->deleteJson("/api/assessments/{$assessmentId}")
            ->assertNoContent();
        $this->assertDatabaseMissing('assessments', ['id' => $assessmentId]);
    }

    public function test_cache_version_invalidation_prevents_stale_data_return(): void
    {
        $cachedService = app(\App\Services\CachedCrudService::class);

        // 1. Initial lookup populates cache
        $res1 = $this->actingAs($this->superadmin, 'sanctum')->getJson("/api/school-classes/{$this->class->id}");
        $res1->assertOk()->assertJsonPath('data.code', 'G9');

        // 2. Direct database update bypassing service
        \Illuminate\Support\Facades\DB::table('classes')
            ->where('id', $this->class->id)
            ->update(['code' => 'G9-BYPASS']);

        // 3. Stale cache is returned because cache has not been invalidated yet
        $resCached = $this->actingAs($this->superadmin, 'sanctum')->getJson("/api/school-classes/{$this->class->id}");
        $resCached->assertOk()->assertJsonPath('data.code', 'G9');

        // 4. Invalidation increments version
        $cachedService->invalidate(SchoolClass::class);

        // 5. Subsequent request misses stale cache and returns fresh data
        $resFresh = $this->actingAs($this->superadmin, 'sanctum')->getJson("/api/school-classes/{$this->class->id}");
        $resFresh->assertOk()->assertJsonPath('data.code', 'G9-BYPASS');
    }

    public function test_model_cache_version_isolation(): void
    {
        $cachedService = app(\App\Services\CachedCrudService::class);

        $classKeyBefore = $cachedService->key(SchoolClass::class, 'test');
        $courseKeyBefore = $cachedService->key(Course::class, 'test');

        $this->assertStringContainsString('api.school_class.v', $classKeyBefore);
        $this->assertStringContainsString('api.course.v', $courseKeyBefore);

        // Invalidate SchoolClass only
        $cachedService->invalidate(SchoolClass::class);

        $classKeyAfter = $cachedService->key(SchoolClass::class, 'test');
        $courseKeyAfter = $cachedService->key(Course::class, 'test');

        // SchoolClass key must change
        $this->assertNotEquals($classKeyBefore, $classKeyAfter);

        // Course key must remain unchanged (isolated scope)
        $this->assertEquals($courseKeyBefore, $courseKeyAfter);
    }
}

