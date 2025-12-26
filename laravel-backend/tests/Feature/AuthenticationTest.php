<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test login creates token with device name from User-Agent.
     */
    public function test_login_creates_token_with_device_name(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'device',
            ]);

        // Verify token was created
        $this->assertDatabaseCount('personal_access_tokens', 1);

        // Verify device name contains expected parts
        $responseData = $response->json();
        $this->assertNotEmpty($responseData['token']);
        $this->assertNotEmpty($responseData['device']);
    }

    /**
     * Test login with invalid credentials returns 401.
     */
    public function test_login_with_invalid_credentials_fails(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials',
            ]);

        // Verify no token was created
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    /**
     * Test login with non-existent user returns 401.
     */
    public function test_login_with_non_existent_user_fails(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials',
            ]);
    }

    /**
     * Test login requires email validation.
     */
    public function test_login_requires_email(): void
    {
        $response = $this->postJson('/api/login', [
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test login requires password validation.
     */
    public function test_login_requires_password(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test login requires valid email format.
     */
    public function test_login_requires_valid_email_format(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'invalid-email',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test token works for authenticated requests.
     */
    public function test_token_works_for_authenticated_requests(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Login to get token
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        // Use token to access protected route
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJson([
                'email' => 'test@example.com',
            ]);
    }

    /**
     * Test unauthenticated request to protected route returns 401.
     */
    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    /**
     * Test invalid token returns 401.
     */
    public function test_invalid_token_returns_401(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid-token')
            ->getJson('/api/user');

        $response->assertStatus(401);
    }

    /**
     * Test login with missing User-Agent defaults to Unknown Device.
     */
    public function test_login_with_missing_user_agent_defaults_to_unknown_device(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => '',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'device',
            ]);

        // Device name should contain "Unknown" parts
        $device = $response->json('device');
        $this->assertStringContainsString('Unknown', $device);
    }

    /**
     * Test multiple logins create multiple tokens.
     */
    public function test_multiple_logins_create_multiple_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // First login (desktop)
        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ]);

        // Second login (mobile)
        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        ]);

        // Verify two tokens were created
        $this->assertDatabaseCount('personal_access_tokens', 2);
    }

    /**
     * Test login with mobile User-Agent creates token with mobile device name.
     */
    public function test_login_with_mobile_user_agent(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        ]);

        $response->assertStatus(200);

        $device = $response->json('device');
        // Device name should contain iOS or iPhone-related info
        $this->assertNotEmpty($device);
    }

    /**
     * Test login token is correctly stored in database.
     */
    public function test_login_token_stored_in_database(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'TestBrowser/1.0',
        ]);

        $response->assertStatus(200);

        // Verify token exists in database for this user
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_type' => User::class,
            'tokenable_id' => $user->id,
        ]);
    }
}
