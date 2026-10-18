<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    public function test_status_endpoint_returns_health_without_sensitive_metadata(): void
    {
        $response = $this->getJson('/api/status');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'online',
            'database' => [
                'connected' => true,
            ],
        ]);

        $json = $response->json();

        // Must not disclose internal software versions or database identity
        $this->assertArrayNotHasKey('framework', $json);
        $this->assertArrayNotHasKey('php_version', $json);
        $this->assertArrayNotHasKey('driver', $json['database'] ?? []);
        $this->assertArrayNotHasKey('database', $json['database'] ?? []);
        $this->assertStringNotContainsString('simple_senbet', $response->getContent());
        $this->assertStringNotContainsString('Laravel', $response->getContent());
    }

    public function test_cors_fails_closed_when_allowed_origins_is_unset(): void
    {
        $allowedOrigins = config('cors.allowed_origins');

        // When CORS_ALLOWED_ORIGINS is not explicitly configured, it must evaluate to empty array
        $this->assertIsArray($allowedOrigins);
        $this->assertNotContains('*', $allowedOrigins);

        // Preflight request from untrusted origin
        $response = $this->withHeaders([
            'Origin' => 'https://untrusted-cross-site.com',
            'Access-Control-Request-Method' => 'POST',
        ])->options('/api/status');

        // Should not allow untrusted origin
        $this->assertFalse($response->headers->has('Access-Control-Allow-Origin'));
    }
}
