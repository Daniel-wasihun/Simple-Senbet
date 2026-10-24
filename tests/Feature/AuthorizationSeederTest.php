<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Member;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_provisions_all_standard_roles_and_permissions(): void
    {
        $this->seed();

        $expectedRoles = [
            'superadmin',
            'academic_director',
            'academic_administrator',
            'finance_officer',
            'member_coordinator',
            'attendance_officer',
            'teacher',
            'student',
        ];

        foreach ($expectedRoles as $roleName) {
            $this->assertDatabaseHas('roles', ['name' => $roleName, 'guard_name' => 'web']);
            $role = Role::findByName($roleName, 'web');
            $this->assertNotEmpty($role->permissions, "Role {$roleName} should have permissions assigned.");
        }
    }

    public function test_seeder_assigns_default_permissions_and_policies_honor_them(): void
    {
        $this->seed();

        $teacher = User::factory()->create();
        $teacher->assignRole('teacher');

        $student = User::factory()->create();
        $student->assignRole('student');

        $this->assertTrue($teacher->can('create', Assessment::class));
        $this->assertTrue($teacher->can('viewAny', Course::class));
        $this->assertFalse($teacher->can('create', Course::class));
        $this->assertTrue($student->can('viewAny', Course::class));
        $this->assertFalse($student->can('create', Assessment::class));
    }

    public function test_finance_officer_has_payment_authority_and_limited_academic_access(): void
    {
        $this->seed();

        $financeUser = User::factory()->create();
        $financeUser->assignRole('finance_officer');

        // Finance permissions
        $this->assertTrue($financeUser->hasPermissionTo('payments.view'));
        $this->assertTrue($financeUser->hasPermissionTo('payments.record'));
        $this->assertTrue($financeUser->hasPermissionTo('payments.void'));
        $this->assertTrue($financeUser->hasPermissionTo('payments.export'));
        $this->assertTrue($financeUser->hasPermissionTo('payments.rules'));

        // Cannot modify academics
        $this->assertFalse($financeUser->can('create', Course::class));
        $this->assertFalse($financeUser->can('create', Assessment::class));
        $this->assertFalse($financeUser->hasPermissionTo('attendance.create'));
    }

    public function test_member_coordinator_has_member_management_authority(): void
    {
        $this->seed();

        $coordinator = User::factory()->create();
        $coordinator->assignRole('member_coordinator');

        // Member & enrollment permissions
        $this->assertTrue($coordinator->can('create', Member::class));
        $this->assertTrue($coordinator->can('viewAny', Member::class));
        $this->assertTrue($coordinator->hasPermissionTo('student-enrollments.create'));
        $this->assertTrue($coordinator->hasPermissionTo('student-enrollments.update'));

        // Cannot manage payments or grading
        $this->assertFalse($coordinator->hasPermissionTo('payments.record'));
        $this->assertFalse($coordinator->can('create', Assessment::class));
    }

    public function test_attendance_officer_has_attendance_lifecycle_authority(): void
    {
        $this->seed();

        $officer = User::factory()->create();
        $officer->assignRole('attendance_officer');

        // Attendance permissions
        $this->assertTrue($officer->hasPermissionTo('attendance.view'));
        $this->assertTrue($officer->hasPermissionTo('attendance.create'));
        $this->assertTrue($officer->hasPermissionTo('attendance.submit'));
        $this->assertTrue($officer->hasPermissionTo('attendance.correct'));
        $this->assertTrue($officer->hasPermissionTo('attendance.close'));

        // Cannot configure payments or academic years
        $this->assertFalse($officer->hasPermissionTo('payments.rules'));
        $this->assertFalse($officer->hasPermissionTo('academic-years.create'));
    }

    public function test_superadmin_has_full_system_permissions(): void
    {
        $this->seed();

        $superadmin = User::where('email', env('SUPERADMIN_EMAIL', 'admin@example.com'))->firstOrFail();

        $this->assertTrue($superadmin->hasRole('superadmin'));
        $this->assertTrue($superadmin->can('register', User::class));
        $this->assertTrue($superadmin->can('create', Course::class));
        $this->assertTrue($superadmin->can('create', Member::class));
        $this->assertTrue($superadmin->hasPermissionTo('payments.void'));
        $this->assertTrue($superadmin->hasPermissionTo('promotions.manage'));
    }
}
