<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationSeederTest extends TestCase
{
    use RefreshDatabase;

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
}
