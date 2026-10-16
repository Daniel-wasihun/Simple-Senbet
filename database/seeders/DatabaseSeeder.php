<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
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
