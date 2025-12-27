<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test list devices returns all user tokens.
     */
    public function test_list_devices_returns_all_user_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Login twice to create two tokens
        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ]);

        $token = $loginResponse->json('token');

        // List devices
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/devices');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'devices' => [
                    '*' => ['id', 'name', 'last_used_at'],
                ],
            ]);

        $devices = $response->json('devices');
        $this->assertCount(2, $devices);
    }

    /**
     * Test list devices requires authentication.
     */
    public function test_list_devices_requires_authentication(): void
    {
        $response = $this->getJson('/api/devices');

        $response->assertStatus(401);
    }

    /**
     * Test destroy deletes a specific device token.
     */
    public function test_destroy_deletes_specific_device_token(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Login twice to create two tokens
        $firstLoginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        $secondLoginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ]);

        $firstToken = $firstLoginResponse->json('token');
        $secondToken = $secondLoginResponse->json('token');

        // Get device list to find first token's ID
        $devicesResponse = $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->getJson('/api/devices');

        $devices = $devicesResponse->json('devices');
        $firstDeviceId = $devices[0]['id'];

        // Delete first device using second token
        $deleteResponse = $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->deleteJson("/api/devices/{$firstDeviceId}");

        $deleteResponse->assertStatus(204);

        // Verify token count is now 1
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    /**
     * Test deleted token is removed from database.
     */
    public function test_deleted_token_is_removed_from_database(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Login twice to create two tokens
        $firstLoginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        $secondLoginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ]);

        $secondToken = $secondLoginResponse->json('token');

        // Get device list to find first token's ID
        $devicesResponse = $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->getJson('/api/devices');

        $devices = $devicesResponse->json('devices');
        $firstDeviceId = $devices[0]['id'];

        // Verify token exists before deletion
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $firstDeviceId]);

        // Delete first device
        $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->deleteJson("/api/devices/{$firstDeviceId}");

        // Verify token is removed from database (this guarantees 401 in production)
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $firstDeviceId]);
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    /**
     * Test destroy non-existent device returns 404.
     */
    public function test_destroy_non_existent_device_returns_404(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        // Try to delete non-existent device
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson('/api/devices/99999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Device not found',
            ]);
    }

    /**
     * Test cannot delete another user's device token.
     */
    public function test_cannot_delete_another_users_device_token(): void
    {
        $user1 = User::factory()->create([
            'email' => 'user1@example.com',
            'password' => bcrypt('password123'),
        ]);

        $user2 = User::factory()->create([
            'email' => 'user2@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Login both users
        $user1LoginResponse = $this->postJson('/api/login', [
            'email' => 'user1@example.com',
            'password' => 'password123',
        ]);

        $user2LoginResponse = $this->postJson('/api/login', [
            'email' => 'user2@example.com',
            'password' => 'password123',
        ]);

        $user2Token = $user2LoginResponse->json('token');

        // Get user1's token ID
        $user1TokenId = $user1->tokens()->first()->id;

        // User2 tries to delete user1's token
        $response = $this->withHeader('Authorization', 'Bearer ' . $user2Token)
            ->deleteJson("/api/devices/{$user1TokenId}");

        // Should return 404 (not 403) since user2 can't even see user1's tokens
        $response->assertStatus(404);

        // Verify user1's token still exists
        $this->assertDatabaseCount('personal_access_tokens', 2);
    }

    /**
     * Test destroy requires authentication.
     */
    public function test_destroy_requires_authentication(): void
    {
        $response = $this->deleteJson('/api/devices/1');

        $response->assertStatus(401);
    }

    /**
     * Test logout all deletes all tokens except current.
     */
    public function test_logout_all_deletes_all_tokens_except_current(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Login three times to create three tokens
        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        $secondLoginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ]);

        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ]);

        $secondToken = $secondLoginResponse->json('token');

        // Verify three tokens exist
        $this->assertDatabaseCount('personal_access_tokens', 3);

        // Logout all using second token
        $response = $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->postJson('/api/devices/logout-all');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Successfully logged out from all other devices',
            ]);

        // Verify only one token remains
        $this->assertDatabaseCount('personal_access_tokens', 1);

        // Verify second token still works
        $verifyResponse = $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->getJson('/api/devices');

        $verifyResponse->assertStatus(200);
    }

    /**
     * Test logout all removes other tokens from database.
     */
    public function test_logout_all_removes_other_tokens_from_database(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Login twice
        $firstLoginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        $secondLoginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ]);

        $secondToken = $secondLoginResponse->json('token');

        // Verify two tokens exist
        $this->assertDatabaseCount('personal_access_tokens', 2);

        // Logout all using second token
        $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->postJson('/api/devices/logout-all');

        // Verify only one token remains (the one used to make the request)
        $this->assertDatabaseCount('personal_access_tokens', 1);

        // The remaining token should still work
        $verifyResponse = $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->getJson('/api/devices');

        $verifyResponse->assertStatus(200);
        $devices = $verifyResponse->json('devices');
        $this->assertCount(1, $devices);
    }

    /**
     * Test logout all requires authentication.
     */
    public function test_logout_all_requires_authentication(): void
    {
        $response = $this->postJson('/api/devices/logout-all');

        $response->assertStatus(401);
    }

    /**
     * Test devices endpoint returns correct fields.
     */
    public function test_devices_endpoint_returns_correct_fields(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ], [
            'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ]);

        $token = $loginResponse->json('token');

        // List devices
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/devices');

        $response->assertStatus(200);

        $devices = $response->json('devices');
        $this->assertCount(1, $devices);

        $device = $devices[0];
        $this->assertArrayHasKey('id', $device);
        $this->assertArrayHasKey('name', $device);
        $this->assertArrayHasKey('last_used_at', $device);
    }

    /**
     * Test devices only returns current user's tokens.
     */
    public function test_devices_only_returns_current_users_tokens(): void
    {
        $user1 = User::factory()->create([
            'email' => 'user1@example.com',
            'password' => bcrypt('password123'),
        ]);

        $user2 = User::factory()->create([
            'email' => 'user2@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Login both users multiple times
        $this->postJson('/api/login', [
            'email' => 'user1@example.com',
            'password' => 'password123',
        ]);

        $this->postJson('/api/login', [
            'email' => 'user1@example.com',
            'password' => 'password123',
        ]);

        $user2LoginResponse = $this->postJson('/api/login', [
            'email' => 'user2@example.com',
            'password' => 'password123',
        ]);

        $user2Token = $user2LoginResponse->json('token');

        // User2 lists devices - should only see their own (1 device)
        $response = $this->withHeader('Authorization', 'Bearer ' . $user2Token)
            ->getJson('/api/devices');

        $response->assertStatus(200);

        $devices = $response->json('devices');
        $this->assertCount(1, $devices);
    }

    /**
     * Test can delete current device (self-logout) removes token from database.
     */
    public function test_can_delete_current_device_removes_token_from_database(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        // Get the token's ID
        $devicesResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/devices');

        $devices = $devicesResponse->json('devices');
        $deviceId = $devices[0]['id'];

        // Verify token exists
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $deviceId]);

        // Delete own device
        $deleteResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson("/api/devices/{$deviceId}");

        $deleteResponse->assertStatus(204);

        // Token should be removed from database (guarantees 401 in production)
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $deviceId]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    /**
     * Test logout all with only one token leaves that token valid.
     */
    public function test_logout_all_with_only_one_token_leaves_token_valid(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        // Logout all (should do nothing since it's the only token)
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/devices/logout-all');

        $response->assertStatus(200);

        // Token should still work
        $verifyResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/devices');

        $verifyResponse->assertStatus(200);

        $devices = $verifyResponse->json('devices');
        $this->assertCount(1, $devices);
    }
}
