<?php

namespace Database\Seeders;

use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\Member;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\TeachingAssignment;
use App\Models\User;
use App\Services\StudentEnrollmentService;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\Hash;

/**
 * Isolated test fixture seeder specifically for Postman and Newman API test execution.
 *
 * Provisions required roles, admin, assigned teacher, unassigned teacher, academic year,
 * school class, course, active student enrollments, and teaching assignments without polluting
 * production defaults.
 */
class AttendanceTestSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        if (! app()->environment(['local', 'development', 'testing'])) {
            $this->command?->warn('Attendance test fixtures are disabled outside local, development, and testing environments.');

            return;
        }

        // 1. Ensure Base Roles and Superadmin are seeded
        $this->call(DatabaseSeeder::class);

        $teacherRole = Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);

        // 2. Provision Assigned Teacher
        $assignedTeacher = User::firstOrCreate(
            ['email' => 'attendance.assigned.teacher@example.test'],
            [
                'name' => 'Test Teacher',
                'password' => Hash::make('SenbetDev!2026'),
                'role_id' => $teacherRole->id,
            ]
        );
        if ($assignedTeacher->wasRecentlyCreated) {
            $assignedTeacher->syncRoles(['teacher']);
        }

        // 3. Provision Unassigned Teacher (for negative 403 test cases)
        $unassignedTeacher = User::firstOrCreate(
            ['email' => 'attendance.unassigned.teacher@example.test'],
            [
                'name' => 'Unassigned Teacher',
                'password' => Hash::make('SenbetDev!2026'),
                'role_id' => $teacherRole->id,
            ]
        );
        if ($unassignedTeacher->wasRecentlyCreated) {
            $unassignedTeacher->syncRoles(['teacher']);
        }

        // 4. Provision Academic Year
        $academicYear = AcademicYear::whereDate('start_date', '2025-09-01')->whereDate('end_date', '2026-06-30')->first();
        $academicYear ??= AcademicYear::create([
                'name' => '2025-2026 Academic Year',
                'start_date' => '2025-09-01',
                'end_date' => '2026-06-30',
                'is_current' => false,
            ]);

        // 5. Provision School Class
        $classA = SchoolClass::firstOrCreate(
            ['code' => 'G9'],
            [
                'name' => ['en' => 'Grade 9'],
                'number_of_sections' => 2,
                'passing_score' => 50.00,
            ]
        );

        // 6. Provision Course
        $courseA = Course::firstOrCreate(
            ['code' => 'MATH101'],
            [
                'class_id' => $classA->id,
                'name' => ['en' => 'Mathematics'],
                'credit_hour' => 3,
            ]
        );

        // 7. Provision Student Members
        $student1 = Member::firstOrCreate(
            ['phone_number' => '+1-202-555-0181'],
            [
                'full_name' => ['en' => 'Sample Student Alpha'],
                'date_of_birth' => '2010-05-10',
                'gender' => 'male',
                'class_id' => $classA->id,
                'section' => 'A',
            ]
        );

        $student2 = Member::firstOrCreate(
            ['phone_number' => '+1-202-555-0182'],
            [
                'full_name' => ['en' => 'Sample Student Beta'],
                'date_of_birth' => '2010-08-20',
                'gender' => 'female',
                'class_id' => $classA->id,
                'section' => 'A',
            ]
        );

        // 8. Enroll Students via Domain Enrollment Service
        $enrollmentService = app(StudentEnrollmentService::class);

        $activeEnrollment1 = $student1->enrollments()->where('class_id', $classA->id)->whereNull('end_date')->exists();
        if (! $activeEnrollment1) {
            $enrollmentService->enroll(
                $student1->id,
                $academicYear->id,
                $classA->id,
                'A',
                '2025-09-01'
            );
        }

        $activeEnrollment2 = $student2->enrollments()->where('class_id', $classA->id)->whereNull('end_date')->exists();
        if (! $activeEnrollment2) {
            $enrollmentService->enroll(
                $student2->id,
                $academicYear->id,
                $classA->id,
                'A',
                '2025-09-01'
            );
        }

        // 9. Provision Teaching Assignment for Assigned Teacher
        $assignmentAttributes = [
                'teacher_id' => $assignedTeacher->id,
                'academic_year_id' => $academicYear->id,
                'class_id' => $classA->id,
                'course_id' => $courseA->id,
                'section' => 'A',
                'semester' => Semester::Semester2->value,
            ];
        $assignment = TeachingAssignment::where($assignmentAttributes)
            ->whereDate('start_date', '2025-09-01')
            ->first();
        $assignment ??= TeachingAssignment::create($assignmentAttributes + [
                'start_date' => '2025-09-01',
                'end_date' => '2026-06-30',
                'is_primary' => true,
            ]);
    }
}
