<?php

namespace Tests\Feature;

use App\Models\Device;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test list devices returns all user devices.
     */
    public function test_list_devices_returns_all_user_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Create two devices for the user
        Device::create([
            'user_id' => $user->id,
            'device_id' => 'device-uuid-1',
            'name' => 'Samsung Galaxy S24',
            'model' => 'SM-S921B',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        Device::create([
            'user_id' => $user->id,
            'device_id' => 'device-uuid-2',
            'name' => 'Pixel 8 Pro',
            'model' => 'Pixel 8 Pro',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        // List devices
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/devices');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name'],
                ],
            ]);

        $devices = $response->json('data');
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
     * Test destroy deletes a specific device.
     */
    public function test_destroy_deletes_specific_device_token(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Create two devices
        $device1 = Device::create([
            'user_id' => $user->id,
            'device_id' => 'device-uuid-1',
            'name' => 'Samsung Galaxy S24',
            'model' => 'SM-S921B',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        $device2 = Device::create([
            'user_id' => $user->id,
            'device_id' => 'device-uuid-2',
            'name' => 'Pixel 8 Pro',
            'model' => 'Pixel 8 Pro',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        // Delete first device
        $deleteResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson("/api/devices/{$device1->id}");

        $deleteResponse->assertStatus(204);

        // Verify device count is now 1
        $this->assertDatabaseCount('devices', 1);
    }

    /**
     * Test deleted device is removed from database.
     */
    public function test_deleted_token_is_removed_from_database(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Create two devices
        $device1 = Device::create([
            'user_id' => $user->id,
            'device_id' => 'device-uuid-1',
            'name' => 'Samsung Galaxy S24',
            'model' => 'SM-S921B',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        $device2 = Device::create([
            'user_id' => $user->id,
            'device_id' => 'device-uuid-2',
            'name' => 'Pixel 8 Pro',
            'model' => 'Pixel 8 Pro',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        // Verify device exists before deletion
        $this->assertDatabaseHas('devices', ['id' => $device1->id]);

        // Delete first device
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson("/api/devices/{$device1->id}");

        // Verify device is removed from database
        $this->assertDatabaseMissing('devices', ['id' => $device1->id]);
        $this->assertDatabaseCount('devices', 1);
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

        $response->assertStatus(404);
    }

    /**
     * Test cannot delete another user's device.
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

        // Create device for user1
        $user1Device = Device::create([
            'user_id' => $user1->id,
            'device_id' => 'device-uuid-1',
            'name' => 'Samsung Galaxy S24',
            'model' => 'SM-S921B',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        // Create device for user2
        Device::create([
            'user_id' => $user2->id,
            'device_id' => 'device-uuid-2',
            'name' => 'Pixel 8 Pro',
            'model' => 'Pixel 8 Pro',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        // Login as user2
        $user2LoginResponse = $this->postJson('/api/login', [
            'email' => 'user2@example.com',
            'password' => 'password123',
        ]);

        $user2Token = $user2LoginResponse->json('token');

        // User2 tries to delete user1's device
        $response = $this->withHeader('Authorization', 'Bearer ' . $user2Token)
            ->deleteJson("/api/devices/{$user1Device->id}");

        // Should return 404 since user2 can't see user1's devices
        $response->assertStatus(404);

        // Verify both devices still exist
        $this->assertDatabaseCount('devices', 2);
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
        ]);

        $secondLoginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $secondToken = $secondLoginResponse->json('token');

        // Verify three tokens exist
        $this->assertDatabaseCount('personal_access_tokens', 3);

        // Logout all using second token
        $response = $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->postJson('/api/devices/logout-all');

        $response->assertStatus(200);

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
        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $secondLoginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $secondToken = $secondLoginResponse->json('token');

        // Verify two tokens exist
        $this->assertDatabaseCount('personal_access_tokens', 2);

        // Logout all using second token
        $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->postJson('/api/devices/logout-all');

        // Verify only one token remains
        $this->assertDatabaseCount('personal_access_tokens', 1);

        // The remaining token should still work
        $verifyResponse = $this->withHeader('Authorization', 'Bearer ' . $secondToken)
            ->getJson('/api/devices');

        $verifyResponse->assertStatus(200);
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

        // Create a device for the user
        Device::create([
            'user_id' => $user->id,
            'device_id' => 'device-uuid-1',
            'name' => 'Samsung Galaxy S24',
            'model' => 'SM-S921B',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        // List devices
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/devices');

        $response->assertStatus(200);

        $devices = $response->json('data');
        $this->assertCount(1, $devices);

        $device = $devices[0];
        $this->assertArrayHasKey('id', $device);
        $this->assertArrayHasKey('name', $device);
        $this->assertArrayHasKey('last_active_at', $device);
    }

    /**
     * Test devices only returns current user's devices.
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

        // Create devices for user1
        Device::create([
            'user_id' => $user1->id,
            'device_id' => 'device-uuid-1',
            'name' => 'Samsung Galaxy S24',
            'model' => 'SM-S921B',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        Device::create([
            'user_id' => $user1->id,
            'device_id' => 'device-uuid-2',
            'name' => 'Pixel 8 Pro',
            'model' => 'Pixel 8 Pro',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        // Create device for user2
        Device::create([
            'user_id' => $user2->id,
            'device_id' => 'device-uuid-3',
            'name' => 'OnePlus 12',
            'model' => 'CPH2581',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
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

        $devices = $response->json('data');
        $this->assertCount(1, $devices);
    }

    /**
     * Test can delete a device and it is removed from database.
     */
    public function test_can_delete_current_device_removes_token_from_database(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Create a device
        $device = Device::create([
            'user_id' => $user->id,
            'device_id' => 'device-uuid-1',
            'name' => 'Samsung Galaxy S24',
            'model' => 'SM-S921B',
            'android_version' => '14',
            'status' => Device::STATUS_ACTIVE,
            'last_active_at' => now(),
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');

        // Verify device exists
        $this->assertDatabaseHas('devices', ['id' => $device->id]);

        // Delete device
        $deleteResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson("/api/devices/{$device->id}");

        $deleteResponse->assertStatus(204);

        // Device should be removed from database
        $this->assertDatabaseMissing('devices', ['id' => $device->id]);
        $this->assertDatabaseCount('devices', 0);
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
    }
}
