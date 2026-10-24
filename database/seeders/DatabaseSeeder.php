<?php

namespace Database\Seeders;

use App\Models\Permission;
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
        $roles = collect(['student', 'teacher', 'superadmin'])
            ->mapWithKeys(fn (string $name) => [$name => Role::firstOrCreate(['name' => $name, 'guard_name' => 'web'])]);

        $permissions = collect([
            'users', 'school-classes', 'courses', 'members', 'assessments', 'assessment-results',
        ])->flatMap(fn (string $resource) => collect(['view', 'create', 'update', 'delete'])
            ->mapWithKeys(fn (string $action) => ["{$resource}.{$action}" => Permission::firstOrCreate([
                'name' => "{$resource}.{$action}",
                'guard_name' => 'web',
            ], [
                'group_name' => $resource,
                'label' => ['en' => ucwords(str_replace(['-', '.'], ' ', "{$resource}.{$action}"))],
            ])]
            ));

        $registerPermission = Permission::firstOrCreate([
            'name' => 'users.register',
            'guard_name' => 'web',
        ], [
            'group_name' => 'users',
            'label' => ['en' => 'Users Register'],
        ]);
        $permissions->put('users.register', $registerPermission);

        $roles['superadmin']->syncPermissions($permissions->values());
        $roles['teacher']->syncPermissions($permissions->only([
            'school-classes.view', 'courses.view', 'members.view',
            'assessments.view', 'assessments.create', 'assessments.update', 'assessments.delete',
            'assessment-results.view', 'assessment-results.create', 'assessment-results.update', 'assessment-results.delete',
        ])->values());
        $roles['student']->syncPermissions($permissions->only([
            'school-classes.view', 'courses.view', 'assessments.view',
        ])->values());

        $admin = User::firstOrCreate(
            ['email' => env('SUPERADMIN_EMAIL', 'admin@example.com')],
            [
                'name' => env('SUPERADMIN_NAME', 'Super Administrator'),
                'password' => env('SUPERADMIN_PASSWORD', 'ChangeMe123!'),
                'role_id' => $roles['superadmin']->id,
            ],
        );
        $admin->update(['role_id' => $roles['superadmin']->id]);
        $admin->syncRoles(['superadmin']);
    }
}
