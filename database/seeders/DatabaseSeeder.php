<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed full role and permission matrix
        $this->call(RoleAndPermissionSeeder::class);

        // 2. Provision initial users for standard roles
        $usersToSeed = [
            'superadmin' => [
                'email' => env('SUPERADMIN_EMAIL', 'admin@example.com'),
                'name' => env('SUPERADMIN_NAME', 'Super Administrator'),
                'password' => env('SUPERADMIN_PASSWORD', 'ChangeMe123!'),
            ],
            'academic_director' => [
                'email' => 'director@example.com',
                'name' => 'Academic Director',
                'password' => 'Director123!',
            ],
            'finance_officer' => [
                'email' => 'finance@example.com',
                'name' => 'Finance Officer',
                'password' => 'Finance123!',
            ],
            'member_coordinator' => [
                'email' => 'registrar@example.com',
                'name' => 'Member Coordinator',
                'password' => 'Registrar123!',
            ],
            'attendance_officer' => [
                'email' => 'attendance@example.com',
                'name' => 'Attendance Officer',
                'password' => 'Attendance123!',
            ],
            'teacher' => [
                'email' => 'teacher@example.com',
                'name' => 'Lead Teacher',
                'password' => 'Teacher123!',
            ],
            'student' => [
                'email' => 'student@example.com',
                'name' => 'Sample Student',
                'password' => 'Student123!',
            ],
        ];

        foreach ($usersToSeed as $roleName => $userData) {
            $role = Role::where('name', $roleName)->first();
            if (! $role) {
                continue;
            }

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => $userData['password'],
                    'role_id' => $role->id,
                ]
            );

            $user->update([
                'name' => $userData['name'],
                'password' => $userData['password'],
                'role_id' => $role->id,
            ]);
            $user->syncRoles([$roleName]);
        }
    }
}
