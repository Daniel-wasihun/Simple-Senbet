<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Console\Command;

class ResetCredentialsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'senbet:reset-credentials 
                            {--password= : Set a universal password for all default accounts}
                            {--email= : Reset a specific account by email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed or reset standard Sunday School department users, passwords, and roles';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('1. Verifying Sunday School Roles and Permissions...');
        $this->call(RoleAndPermissionSeeder::class);

        $customPassword = $this->option('password');
        $targetEmail = $this->option('email');

        $accounts = [
            'superadmin' => [
                'name' => env('SUPERADMIN_NAME', 'Super Administrator'),
                'email' => env('SUPERADMIN_EMAIL', 'admin@example.com'),
                'password' => $customPassword ?: env('SUPERADMIN_PASSWORD', 'ChangeMe123!'),
                'role' => 'superadmin',
                'dashboard' => '/super-admin/dashboard',
            ],
            'academic_director' => [
                'name' => 'Academic Director',
                'email' => 'director@example.com',
                'password' => $customPassword ?: 'Director123!',
                'role' => 'academic_director',
                'dashboard' => '/acadamic/super-admin/dashboard',
            ],
            'finance_officer' => [
                'name' => 'Finance Officer',
                'email' => 'finance@example.com',
                'password' => $customPassword ?: 'Finance123!',
                'role' => 'finance_officer',
                'dashboard' => '/finance/super-admin/dashboard',
            ],
            'attendance_officer' => [
                'name' => 'Attendance Officer',
                'email' => 'attendance@example.com',
                'password' => $customPassword ?: 'Attendance123!',
                'role' => 'attendance_officer',
                'dashboard' => '/attendance/super-admin/dashboard',
            ],
            'teacher' => [
                'name' => 'Lead Teacher',
                'email' => 'teacher@example.com',
                'password' => $customPassword ?: 'Teacher123!',
                'role' => 'teacher',
                'dashboard' => '/attendance/super-admin/dashboard',
            ],
            'member_coordinator' => [
                'name' => 'Member Coordinator',
                'email' => 'registrar@example.com',
                'password' => $customPassword ?: 'Registrar123!',
                'role' => 'member_coordinator',
                'dashboard' => '/member/super-admin/dashboard',
            ],
            'student' => [
                'name' => 'Sample Student',
                'email' => 'student@example.com',
                'password' => $customPassword ?: 'Student123!',
                'role' => 'student',
                'dashboard' => '/member/super-admin/dashboard',
            ],
        ];

        $tableRows = [];

        foreach ($accounts as $roleName => $data) {
            if ($targetEmail && strtolower($targetEmail) !== strtolower($data['email'])) {
                continue;
            }

            $role = Role::firstOrCreate(['name' => $data['role'], 'guard_name' => 'web']);

            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => $data['password'],
                    'role_id' => $role->id,
                ]
            );

            $user->update([
                'name' => $data['name'],
                'password' => $data['password'],
                'role_id' => $role->id,
            ]);

            $user->syncRoles([$role->name]);

            $tableRows[] = [
                'Role' => $data['role'],
                'Name' => $data['name'],
                'Email' => $data['email'],
                'Password' => $data['password'],
                'Redirect Dashboard' => $data['dashboard'],
            ];
        }

        $this->newLine();
        $this->info('✓ Sunday School Department Credentials Synchronized Successfully:');
        $this->table(['Role', 'Name', 'Email', 'Password', 'Redirect Dashboard'], $tableRows);
        $this->info('You can now log in through the web portal at /login or use these credentials with the API.');

        return Command::SUCCESS;
    }
}
