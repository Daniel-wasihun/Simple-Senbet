<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentResult;
use App\Models\AttendanceAuditLog;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\MonthlyPaymentRule;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\SessionStudentRecord;
use App\Models\SessionTeacherRecord;
use App\Models\TeachingAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DevelopmentSampleDataSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_is_repeatable_and_creates_linked_sample_data(): void
    {
        $this->seed();
        $firstCounts = $this->sampleCounts();

        $this->seed();

        $this->assertSame($firstCounts, $this->sampleCounts());
        $this->assertSame([
            'years' => 4,
            'classes' => 10,
            'courses' => 10,
            'members' => 15,
            'enrollments' => 15,
            'assignments' => 10,
            'assessments' => 20,
            'results' => 20,
            'attendance_sessions' => 12,
            'student_marks' => 12,
            'teacher_marks' => 12,
            'attendance_audit' => 10,
            'rules' => 3,
            'payments' => 15,
            'payment_audit' => 15,
            'users' => 8,
        ], $firstCounts);

        $this->assertSame(1, AcademicYear::where('is_current', true)->count());
        $this->assertSame(8, User::whereHas('roles')->count());
        $this->assertTrue(Hash::check('SenbetDev!2026', User::where('email', 'teacher@example.com')->firstOrFail()->password));
        $this->assertSame(9, SchoolClass::whereNotNull('next_class_id')->count());
        $financeOfficer = User::where('email', 'finance.officer@example.test')->firstOrFail();
        $this->assertTrue($financeOfficer->hasRole('finance_officer'));
        $this->assertTrue($financeOfficer->hasPermissionTo('payments.record'));
        $this->assertFalse($financeOfficer->hasPermissionTo('school-classes.create'));
        $this->assertSame(3, MemberPayment::where('idempotency_key', 'like', 'development-seed:%')->distinct()->count('payment_status'));

        $this->seed(\Database\Seeders\AttendanceTestSeeder::class);
        $attendanceFixtureCounts = [
            'years' => AcademicYear::count(),
            'classes' => SchoolClass::count(),
            'courses' => Course::count(),
            'members' => Member::count(),
            'enrollments' => StudentEnrollment::count(),
            'assignments' => TeachingAssignment::count(),
            'users' => User::count(),
        ];
        $this->seed(\Database\Seeders\AttendanceTestSeeder::class);

        $this->assertSame($attendanceFixtureCounts, [
            'years' => AcademicYear::count(),
            'classes' => SchoolClass::count(),
            'courses' => Course::count(),
            'members' => Member::count(),
            'enrollments' => StudentEnrollment::count(),
            'assignments' => TeachingAssignment::count(),
            'users' => User::count(),
        ]);
    }

    public function test_seeders_preserve_existing_user_credentials_and_role_permissions(): void
    {
        $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);

        $studentRole = Role::findByName('student', 'web');
        $customPermission = Permission::create([
            'name' => 'fixtures.custom-access',
            'guard_name' => 'web',
            'group_name' => 'fixtures',
            'label' => ['en' => 'Fixture access'],
        ]);
        $studentRole->givePermissionTo($customPermission);

        $existingTeacher = User::create([
            'name' => 'Existing local account',
            'email' => 'teacher@example.com',
            'password' => Hash::make('ExistingSecret!2026'),
            'role_id' => $studentRole->id,
        ]);
        $existingTeacher->syncRoles([$studentRole]);

        $this->seed(\Database\Seeders\DevelopmentSampleDataSeeder::class);
        $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);

        $existingTeacher->refresh();
        $studentRole->refresh();
        $this->assertSame('Existing local account', $existingTeacher->name);
        $this->assertTrue(Hash::check('ExistingSecret!2026', $existingTeacher->password));
        $this->assertTrue($existingTeacher->hasRole('student'));
        $this->assertTrue($studentRole->hasPermissionTo($customPermission));
    }

    /** @return array<string, int> */
    private function sampleCounts(): array
    {
        return [
            'years' => AcademicYear::count(),
            'classes' => SchoolClass::where('code', 'like', 'DEV-G%')->count(),
            'courses' => Course::where('code', 'like', 'DEV-%')->count(),
            'members' => Member::where('phone_number', 'like', '+1-202-555-01%')->count(),
            'enrollments' => StudentEnrollment::count(),
            'assignments' => TeachingAssignment::count(),
            'assessments' => Assessment::count(),
            'results' => AssessmentResult::count(),
            'attendance_sessions' => AttendanceSession::where('time_slot', 'like', 'Development%')->count(),
            'student_marks' => SessionStudentRecord::count(),
            'teacher_marks' => SessionTeacherRecord::count(),
            'attendance_audit' => AttendanceAuditLog::count(),
            'rules' => MonthlyPaymentRule::count(),
            'payments' => MemberPayment::where('idempotency_key', 'like', 'development-seed:%')->count(),
            'payment_audit' => \App\Models\PaymentAuditLog::count(),
            'users' => User::count(),
        ];
    }
}
