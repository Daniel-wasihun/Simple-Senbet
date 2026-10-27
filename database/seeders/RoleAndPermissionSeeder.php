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
        if (! app()->environment(['local', 'development', 'testing'])) {
            $this->command?->warn('Role and permission seeding is disabled outside local, development, and testing environments.');

            return;
        }

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
        $newRoles = [];
        foreach ($rolesData as $roleName => $meta) {
            $roles[$roleName] = Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web'],
                ['label' => $meta['label']]
            );
            $newRoles[$roleName] = $roles[$roleName]->wasRecentlyCreated;
        }

        // 2. Define permission matrix by domain module
        $modules = [
            'users' => [
                'users.view' => ['en' => 'View Users', 'am' => 'ተጠቃሚዎችን ይመልከቱ'],
                'users.create' => ['en' => 'Create Users', 'am' => 'ተጠቃሚዎችን ይመዝግቡ'],
                'users.update' => ['en' => 'Update Users', 'am' => 'የተጠቃሚ መረጃ ያሻሽሉ'],
                'users.delete' => ['en' => 'Delete Users', 'am' => 'ተጠቃሚዎችን ይሰርዙ'],
                'users.register' => ['en' => 'Register Users', 'am' => 'አዲስ ተጠቃሚ ይመዝግቡ'],
                'profile.view' => ['en' => 'View Own Profile', 'am' => 'የራስዎን መገለጫ ይመልከቱ'],
                'profile.update' => ['en' => 'Update Own Profile', 'am' => 'የራስዎን መገለጫ ያዘምኑ'],
            ],
            'roles' => [
                'roles.view' => ['en' => 'View Roles', 'am' => 'ሚናዎችን ይመልከቱ'],
                'roles.create' => ['en' => 'Create Roles', 'am' => 'ሚናዎችን ይፍጠሩ'],
                'roles.update' => ['en' => 'Update Roles', 'am' => 'ሚናዎችን ያዘምኑ'],
                'roles.delete' => ['en' => 'Delete Roles', 'am' => 'ሚናዎችን ይሰርዙ'],
                'roles.assign' => ['en' => 'Assign Roles to Users', 'am' => 'ሚናዎችን ለተጠቃሚዎች ይመድቡ'],
                'roles.assign-system' => ['en' => 'Assign System Administrator Roles', 'am' => 'የስርዓት አስተዳዳሪ ሚናዎችን ይመድቡ'],
                'roles.manage' => ['en' => 'Manage Roles and Permissions', 'am' => 'ሚናዎችንና ፈቃዶችን ያስተዳድሩ'],
                'permissions.view' => ['en' => 'View Permissions', 'am' => 'ፈቃዶችን ይመልከቱ'],
                'permissions.create' => ['en' => 'Create Permissions', 'am' => 'ፈቃዶችን ይፍጠሩ'],
                'permissions.update' => ['en' => 'Update Permissions', 'am' => 'ፈቃዶችን ያዘምኑ'],
                'permissions.delete' => ['en' => 'Delete Permissions', 'am' => 'ፈቃዶችን ይሰርዙ'],
                'permissions.assign' => ['en' => 'Assign Permissions to Roles', 'am' => 'ፈቃዶችን ለሚናዎች ይመድቡ'],
            ],
            'academic-years' => [
                'academic-years.view' => ['en' => 'View Academic Years', 'am' => 'የትምህርት ዘመናትን ይመልከቱ'],
                'academic-years.create' => ['en' => 'Create Academic Years', 'am' => 'የትምህርት ዘመን ይፍጠሩ'],
                'academic-years.update' => ['en' => 'Update Academic Years', 'am' => 'የትምህርት ዘመንን ያዘምኑ'],
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
                'attendance.override' => ['en' => 'Override Attendance Correction Window', 'am' => 'የአቴንዳንስ ማስተካከያ ጊዜን ይለፉ'],
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

        // Separate global access from teacher class scope.
        $globalScopePermissions = [
            'payments.view.all' => ['payments', ['en' => 'View Payments Across All Classes', 'am' => 'የሁሉንም ክፍሎች ክፍያ ይመልከቱ']],
            'payments.record.all' => ['payments', ['en' => 'Record Payments Across All Classes', 'am' => 'በሁሉም ክፍሎች ክፍያ ይመዝግቡ']],
            'payments.export.all' => ['payments', ['en' => 'Export Payments Across All Classes', 'am' => 'የሁሉንም ክፍሎች ክፍያ ወደ ውጭ ያውጡ']],
            'reports.view.all' => ['reports', ['en' => 'View Reports Across All Classes', 'am' => 'የሁሉንም ክፍሎች ሪፖርት ይመልከቱ']],
            'reports.export.all' => ['reports', ['en' => 'Export Reports Across All Classes', 'am' => 'የሁሉንም ክፍሎች ሪፖርት ወደ ውጭ ያውጡ']],
        ];

        foreach ($globalScopePermissions as $permissionName => [$groupName, $label]) {
            $permissions[$permissionName] = Permission::firstOrCreate(
                ['name' => $permissionName, 'guard_name' => 'web'],
                ['group_name' => $groupName, 'label' => $label]
            );
        }

        // Helper to extract Permission instances by array of names
        $filterPerms = fn (array $names) => collect($names)->map(fn ($name) => $permissions[$name] ?? null)->filter()->values();
        // Existing role grants may be customized. Initialize the canonical matrix only for new roles.
        $assignDefaultPermissions = function (string $roleName, $rolePermissions) use ($roles, $newRoles): void {
            if ($newRoles[$roleName]) {
                $roles[$roleName]->syncPermissions(collect($rolePermissions)->all());
            }
        };

        // 3. Assign Permissions to Roles

        // (a) Superadmin gets everything
        $assignDefaultPermissions('superadmin', array_values($permissions));

        // (b) Academic Director: Academic curriculum, classes, teachers, assessments, promotions, view finance/reports
        $assignDefaultPermissions('academic_director', $filterPerms([
            'academic-years.view', 'academic-years.create', 'academic-years.update',
            'school-classes.view', 'school-classes.create', 'school-classes.update', 'school-classes.delete',
            'courses.view', 'courses.create', 'courses.update', 'courses.delete',
            'teaching-assignments.view', 'teaching-assignments.create', 'teaching-assignments.update', 'teaching-assignments.delete',
            'members.view', 'members.create', 'members.update',
            'student-enrollments.view', 'student-enrollments.create', 'student-enrollments.update', 'student-enrollments.delete',
            'attendance.view', 'attendance.create', 'attendance.submit', 'attendance.correct', 'attendance.close', 'attendance.delete',
            'assessments.view', 'assessments.create', 'assessments.update', 'assessments.delete',
            'assessment-results.view', 'assessment-results.create', 'assessment-results.update', 'assessment-results.delete',
            'reports.view', 'reports.view.all', 'reports.export', 'reports.export.all', 'promotions.manage',
            'payments.view', 'payments.view.all', 'payments.record', 'payments.record.all', 'payments.void', 'payments.export', 'payments.export.all', 'payments.rules',
            'roles.view',
        ]));

        // (c) Academic Administrator: Operations, enrollment, class rosters, attendance, results
        $assignDefaultPermissions('academic_administrator', $filterPerms([
            'academic-years.view',
            'school-classes.view', 'school-classes.create', 'school-classes.update',
            'courses.view', 'courses.create', 'courses.update',
            'teaching-assignments.view', 'teaching-assignments.create', 'teaching-assignments.update',
            'members.view', 'members.create', 'members.update',
            'student-enrollments.view', 'student-enrollments.create', 'student-enrollments.update', 'student-enrollments.delete',
            'attendance.view', 'attendance.create', 'attendance.submit', 'attendance.correct', 'attendance.close', 'attendance.delete',
            'assessments.view', 'assessments.create', 'assessments.update',
            'assessment-results.view', 'assessment-results.create', 'assessment-results.update',
            'reports.view', 'reports.view.all', 'reports.export', 'reports.export.all', 'promotions.manage',
            'payments.view', 'payments.view.all', 'payments.record', 'payments.record.all', 'payments.void', 'payments.export', 'payments.export.all', 'payments.rules',
        ]));

        // (d) Finance Officer: Payment transactions, voids, monthly rules, receipts, financial exports
        $assignDefaultPermissions('finance_officer', $filterPerms([
            'payments.view', 'payments.view.all', 'payments.record', 'payments.record.all', 'payments.void', 'payments.export', 'payments.export.all', 'payments.rules',
            'members.view',
            'school-classes.view',
            'reports.view', 'reports.export',
        ]));

        // (e) Member Coordinator / Registrar: Member directory, enrollments, transfers, class assignments
        $assignDefaultPermissions('member_coordinator', $filterPerms([
            'members.view', 'members.create', 'members.update', 'members.delete',
            'student-enrollments.view', 'student-enrollments.create', 'student-enrollments.update', 'student-enrollments.delete',
            'school-classes.view',
            'academic-years.view',
            'reports.view',
        ]));

        // (f) Attendance Officer: Daily sessions, attendance marks, absentees, session closures
        $assignDefaultPermissions('attendance_officer', $filterPerms([
            'attendance.view', 'attendance.create', 'attendance.submit', 'attendance.correct', 'attendance.close', 'attendance.delete',
            'school-classes.view',
            'courses.view',
            'members.view',
            'student-enrollments.view',
            'teaching-assignments.view',
            'reports.view',
        ]));

        // (g) Teacher: Assigned classes, courses, attendance, grading assessments, student results
        $assignDefaultPermissions('teacher', $filterPerms([
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
        $assignDefaultPermissions('student', $filterPerms([
            'school-classes.view',
            'courses.view',
            'assessments.view',
            'reports.view',
        ]));

        // Every account can access and maintain its own profile. UserPolicy
        // still requires users.view/users.update to access another account.
        foreach ($roles as $roleName => $role) {
            if ($newRoles[$roleName]) {
                $role->givePermissionTo($permissions['profile.view'], $permissions['profile.update']);
            }
        }

        // Clear cached permissions once more
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
