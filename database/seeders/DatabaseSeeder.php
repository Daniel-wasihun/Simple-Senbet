<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed only explicitly permitted non-production environments.
     */
    public function run(): void
    {
        if (! app()->environment(['local', 'development', 'testing'])) {
            $this->command?->warn('Database seeding is disabled outside local, development, and testing environments.');

            return;
        }

        $this->call([
            RoleAndPermissionSeeder::class,
            DevelopmentSampleDataSeeder::class,
        ]);
    }
}
