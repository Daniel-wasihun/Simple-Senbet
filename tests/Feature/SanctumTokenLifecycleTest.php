<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SanctumTokenLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();

        $role = Role::where('name', 'student')->firstOrFail();
        $this->user = User::factory()->create([
            'email' => 'student@example.test',
            'password' => bcrypt('Password123!'),
            'role_id' => $role->id,
        ]);
        $this->user->syncRoles(['student']);
    }

    public function test_login_issues_valid_bearer_token(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'student@example.test',
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user']);

        $token = $response->json('token');

        // Verify token can access profile
        $this->app['auth']->forgetGuards();
        $profileResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/profile');

        $profileResponse->assertOk()
            ->assertJsonPath('user.email', 'student@example.test');
    }

    public function test_logout_revokes_current_access_token(): void
    {
        $token = $this->user->createToken('test-device')->plainTextToken;

        // Verify token works
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/profile')
            ->assertOk();

        // Logout
        $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $logoutResponse->assertOk();

        // Submitting with the revoked token returns 401 Unauthorized
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/profile')
            ->assertUnauthorized();
    }

    public function test_expired_token_is_rejected_with_401(): void
    {
        // Token expires after 10080 minutes (7 days)
        $token = $this->user->createToken('test-device')->plainTextToken;

        // Verify active token works initially
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/profile')
            ->assertOk();

        // Fast-forward time past the 7-day expiration (7 days + 1 minute)
        Carbon::setTestNow(now()->addDays(7)->addMinutes(1));
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/profile')
            ->assertUnauthorized();

        Carbon::setTestNow(); // Reset test time
    }

    public function test_unauthenticated_request_is_rejected_with_401(): void
    {
        $this->getJson('/api/profile')
            ->assertUnauthorized();
    }
}
