<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Define standard role metadata
        $rolesData = [
            'superadmin' => [
                'label' => ['en' => 'Super Administrator', 'am' => 'ዋና አስተዳዳሪ'],
            ],
            'academic_director' => [
                'label' => ['en' => 'Academic Director', 'am' => 'የትምህርት ክፍል ኃላፊ'],
            ],
            'academic_administrator' => [
                'label' => ['en' => 'Academic Administrator', 'am' => 'የትምህርት አስተዳዳሪ'],
            ],
            'finance_officer' => [
                'label' => ['en' => 'Finance Officer', 'am' => 'የሂሳብ ሹም'],
            ],
            'member_coordinator' => [
                'label' => ['en' => 'Member Coordinator / Registrar', 'am' => 'የአባላት አስተባባሪ / ሬጅስትራር'],
            ],
            'attendance_officer' => [
                'label' => ['en' => 'Attendance Officer', 'am' => 'የአቴንዳንስ ኃላፊ'],
            ],
            'teacher' => [
                'label' => ['en' => 'Teacher', 'am' => 'መምህር'],
            ],
            'student' => [
                'label' => ['en' => 'Student / Member', 'am' => 'ተማሪ / አባል'],
            ],
        ];

        $roles = [];
        foreach ($rolesData as $roleName => $meta) {
            $roles[$roleName] = Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web'],
                ['label' => $meta['label']]
            );
        }

        // 2. Define permission matrix by domain module
        $modules = [
            'users' => [
                'users.view' => ['en' => 'View Users', 'am' => 'ተጠቃሚዎችን ይመልከቱ'],
                'users.create' => ['en' => 'Create Users', 'am' => 'ተጠቃሚዎችን ይመዝግቡ'],
                'users.update' => ['en' => 'Update Users', 'am' => 'የተጠቃሚ መረጃ ያሻሽሉ'],
                'users.delete' => ['en' => 'Delete Users', 'am' => 'ተጠቃሚዎችን ይሰርዙ'],
                'users.register' => ['en' => 'Register Users', 'am' => 'አዲስ ተጠቃሚ ይመዝግቡ'],
            ],
            'roles' => [
                'roles.view' => ['en' => 'View Roles', 'am' => 'ሚናዎችን ይመልከቱ'],
                'roles.manage' => ['en' => 'Manage Roles and Permissions', 'am' => 'ሚናዎችንና ፈቃዶችን ያስተዳድሩ'],
            ],
            'academic-years' => [
                'academic-years.view' => ['en' => 'View Academic Years', 'am' => 'የትምህርት ዘመናትን ይመልከቱ'],
                'academic-years.create' => ['en' => 'Create Academic Years', 'am' => 'የትምህርት ዘመን ይመዝግቡ'],
                'academic-years.update' => ['en' => 'Update Academic Years', 'am' => 'የትምህርት ዘመንን ያሻሽሉ'],
                'academic-years.delete' => ['en' => 'Delete Academic Years', 'am' => 'የትምህርት ዘመንን ይሰርዙ'],
            ],
            'school-classes' => [
                'school-classes.view' => ['en' => 'View Classes', 'am' => 'ክፍሎችን ይመልከቱ'],
                'school-classes.create' => ['en' => 'Create Classes', 'am' => 'አዲስ ክፍል ይመዝግቡ'],
                'school-classes.update' => ['en' => 'Update Classes', 'am' => 'የክፍል መረጃ ያሻሽሉ'],
                'school-classes.delete' => ['en' => 'Delete Classes', 'am' => 'ክፍል ይሰርዙ'],
            ],
            'courses' => [
                'courses.view' => ['en' => 'View Courses', 'am' => 'ትምህርቶችን ይመልከቱ'],
                'courses.create' => ['en' => 'Create Courses', 'am' => 'አዲስ ትምህርት ይመዝግቡ'],
                'courses.update' => ['en' => 'Update Courses', 'am' => 'የትምህርት መረጃ ያሻሽሉ'],
                'courses.delete' => ['en' => 'Delete Courses', 'am' => 'ትምህርትን ይሰርዙ'],
            ],
            'teaching-assignments' => [
                'teaching-assignments.view' => ['en' => 'View Teaching Assignments', 'am' => 'የመምህራን ምደባን ይመልከቱ'],
                'teaching-assignments.create' => ['en' => 'Assign Teachers', 'am' => 'መምህር ይመድቡ'],
                'teaching-assignments.update' => ['en' => 'Update Teaching Assignments', 'am' => 'የመምህራን ምደባ ያሻሽሉ'],
                'teaching-assignments.delete' => ['en' => 'Remove Teaching Assignments', 'am' => 'የመምህራን ምደባን ይሰርዙ'],
            ],
            'members' => [
                'members.view' => ['en' => 'View Members', 'am' => 'አባላትን ይመልከቱ'],
                'members.create' => ['en' => 'Register Members', 'am' => 'አዲስ አባል ይመዝግቡ'],
                'members.update' => ['en' => 'Update Members', 'am' => 'የአባል መረጃ ያሻሽሉ'],
                'members.delete' => ['en' => 'Delete Members', 'am' => 'አባልን ይሰርዙ'],
            ],
            'student-enrollments' => [
                'student-enrollments.view' => ['en' => 'View Student Enrollments', 'am' => 'የተማሪዎች ምዝገባን ይመልከቱ'],
                'student-enrollments.create' => ['en' => 'Enroll Students', 'am' => 'ተማሪዎችን ይመዝግቡ'],
                'student-enrollments.update' => ['en' => 'Transfer Students', 'am' => 'ተማሪዎችን ያስተላልፉ'],
                'student-enrollments.delete' => ['en' => 'Withdraw Students', 'am' => 'የተማሪ ምዝገባን ይሰርዙ'],
            ],
            'attendance' => [
                'attendance.view' => ['en' => 'View Attendance', 'am' => 'የአቴንዳንስ መዝገብ ይመልከቱ'],
                'attendance.create' => ['en' => 'Create Attendance Session', 'am' => 'የአቴንዳንስ ክፍለ-ጊዜ ይመዝግቡ'],
                'attendance.submit' => ['en' => 'Submit Attendance Marks', 'am' => 'የአቴንዳንስ ምልክት ያስገቡ'],
                'attendance.correct' => ['en' => 'Correct Attendance Marks', 'am' => 'የአቴንዳንስ ምልክት ያርሙ'],
                'attendance.close' => ['en' => 'Close Attendance Session', 'am' => 'የአቴንዳንስ ክፍለ-ጊዜ ያጠናቁ'],
                'attendance.delete' => ['en' => 'Delete Attendance Session', 'am' => 'የአቴንዳንስ ክፍለ-ጊዜ ይሰርዙ'],
            ],
            'assessments' => [
                'assessments.view' => ['en' => 'View Assessments', 'am' => 'ምዘናዎችን ይመልከቱ'],
                'assessments.create' => ['en' => 'Create Assessments', 'am' => 'አዲስ ምዘና ይመዝግቡ'],
                'assessments.update' => ['en' => 'Update Assessments', 'am' => 'የምዘና መረጃ ያሻሽሉ'],
                'assessments.delete' => ['en' => 'Delete Assessments', 'am' => 'ምዘና ይሰርዙ'],
            ],
            'assessment-results' => [
                'assessment-results.view' => ['en' => 'View Assessment Results', 'am' => 'የምዘና ውጤቶችን ይመልከቱ'],
                'assessment-results.create' => ['en' => 'Record Assessment Results', 'am' => 'የምዘና ውጤት ያስገቡ'],
                'assessment-results.update' => ['en' => 'Update Assessment Results', 'am' => 'የምዘና ውጤት ያሻሽሉ'],
                'assessment-results.delete' => ['en' => 'Delete Assessment Results', 'am' => 'የምዘና ውጤት ይሰርዙ'],
            ],
            'payments' => [
                'payments.view' => ['en' => 'View Payments and Ledger', 'am' => 'ክፍያዎችንና ሌጀር ይመልከቱ'],
                'payments.record' => ['en' => 'Record Payments', 'am' => 'ክፍያ ይመዝግቡ'],
                'payments.void' => ['en' => 'Void Payments', 'am' => 'ክፍያን ይሰርዙ'],
                'payments.export' => ['en' => 'Export Financial Reports', 'am' => 'የክፍያ ሪፖርቶችን ያውርዱ'],
                'payments.rules' => ['en' => 'Manage Payment Rules', 'am' => 'የክፍያ ደንቦችን ያስተዳድሩ'],
            ],
            'reports' => [
                'reports.view' => ['en' => 'View Reports and Gradebooks', 'am' => 'ሪፖርቶችንና ማህደር ይመልከቱ'],
                'reports.export' => ['en' => 'Export Gradebooks and Summaries', 'am' => 'ማህደርና ሪፖርት ያውርዱ'],
                'promotions.manage' => ['en' => 'Manage Annual Student Promotions', 'am' => 'የዓመታዊ የተማሪ ሽግግርን ያስተዳድሩ'],
            ],
        ];

        $permissions = [];
        foreach ($modules as $groupName => $groupPermissions) {
            foreach ($groupPermissions as $permName => $label) {
                $permissions[$permName] = Permission::firstOrCreate(
                    ['name' => $permName, 'guard_name' => 'web'],
                    [
                        'group_name' => $groupName,
                        'label' => $label,
                    ]
                );
            }
        }

        // Helper to extract Permission instances by array of names
        $filterPerms = fn (array $names) => collect($names)->map(fn ($name) => $permissions[$name] ?? null)->filter()->values();

        // 3. Assign Permissions to Roles

        // (a) Superadmin gets everything
        $roles['superadmin']->syncPermissions(array_values($permissions));

        // (b) Academic Director: Academic curriculum, classes, teachers, assessments, promotions, view finance/reports
        $roles['academic_director']->syncPermissions($filterPerms([
            'academic-years.view',
            'school-classes.view', 'school-classes.create', 'school-classes.update', 'school-classes.delete',
            'courses.view', 'courses.create', 'courses.update', 'courses.delete',
            'teaching-assignments.view', 'teaching-assignments.create', 'teaching-assignments.update', 'teaching-assignments.delete',
            'members.view', 'members.update',
            'student-enrollments.view', 'student-enrollments.create', 'student-enrollments.update', 'student-enrollments.delete',
            'attendance.view', 'attendance.create', 'attendance.submit', 'attendance.correct', 'attendance.close', 'attendance.delete',
            'assessments.view', 'assessments.create', 'assessments.update', 'assessments.delete',
            'assessment-results.view', 'assessment-results.create', 'assessment-results.update', 'assessment-results.delete',
            'reports.view', 'reports.export', 'promotions.manage',
            'payments.view', 'payments.export',
            'roles.view',
        ]));

        // (c) Academic Administrator: Operations, enrollment, class rosters, attendance, results
        $roles['academic_administrator']->syncPermissions($filterPerms([
            'academic-years.view',
            'school-classes.view', 'school-classes.create', 'school-classes.update',
            'courses.view', 'courses.create', 'courses.update',
            'teaching-assignments.view', 'teaching-assignments.create', 'teaching-assignments.update',
            'members.view', 'members.create', 'members.update',
            'student-enrollments.view', 'student-enrollments.create', 'student-enrollments.update', 'student-enrollments.delete',
            'attendance.view', 'attendance.create', 'attendance.submit', 'attendance.correct', 'attendance.close',
            'assessments.view', 'assessments.create', 'assessments.update',
            'assessment-results.view', 'assessment-results.create', 'assessment-results.update',
            'reports.view', 'reports.export', 'promotions.manage',
            'payments.view', 'payments.record', 'payments.export',
        ]));

        // (d) Finance Officer: Payment transactions, voids, monthly rules, receipts, financial exports
        $roles['finance_officer']->syncPermissions($filterPerms([
            'payments.view', 'payments.record', 'payments.void', 'payments.export', 'payments.rules',
            'members.view',
            'school-classes.view',
            'reports.view', 'reports.export',
        ]));

        // (e) Member Coordinator / Registrar: Member directory, enrollments, transfers, class assignments
        $roles['member_coordinator']->syncPermissions($filterPerms([
            'members.view', 'members.create', 'members.update', 'members.delete',
            'student-enrollments.view', 'student-enrollments.create', 'student-enrollments.update', 'student-enrollments.delete',
            'school-classes.view',
            'academic-years.view',
            'reports.view',
        ]));

        // (f) Attendance Officer: Daily sessions, attendance marks, absentees, session closures
        $roles['attendance_officer']->syncPermissions($filterPerms([
            'attendance.view', 'attendance.create', 'attendance.submit', 'attendance.correct', 'attendance.close', 'attendance.delete',
            'school-classes.view',
            'courses.view',
            'members.view',
            'student-enrollments.view',
            'teaching-assignments.view',
            'reports.view',
        ]));

        // (g) Teacher: Assigned classes, courses, attendance, grading assessments, student results
        $roles['teacher']->syncPermissions($filterPerms([
            'school-classes.view',
            'courses.view',
            'teaching-assignments.view',
            'members.view',
            'student-enrollments.view',
            'attendance.view', 'attendance.create', 'attendance.submit', 'attendance.correct',
            'assessments.view', 'assessments.create', 'assessments.update', 'assessments.delete',
            'assessment-results.view', 'assessment-results.create', 'assessment-results.update', 'assessment-results.delete',
            'payments.view', 'payments.record',
            'reports.view', 'reports.export',
        ]));

        // (h) Student / Member: Read-only access to their courses, assessments, and reports
        $roles['student']->syncPermissions($filterPerms([
            'school-classes.view',
            'courses.view',
            'assessments.view',
            'reports.view',
        ]));

        // Clear cached permissions once more
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
