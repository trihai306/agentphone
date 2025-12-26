<?php

namespace Tests\Unit\Models;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\HasApiTokens;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that User model uses the HasApiTokens trait.
     */
    public function test_user_has_api_tokens_trait(): void
    {
        $this->assertTrue(
            in_array(HasApiTokens::class, class_uses_recursive(User::class)),
            'User model should use HasApiTokens trait'
        );
    }

    /**
     * Test that User model can create API tokens.
     */
    public function test_user_can_create_token(): void
    {
        $user = User::factory()->create();

        $token = $user->createToken('test-device');

        $this->assertNotNull($token);
        $this->assertNotEmpty($token->plainTextToken);
        $this->assertNotNull($token->accessToken);
    }

    /**
     * Test that User model can create token with custom device name.
     */
    public function test_user_can_create_token_with_device_name(): void
    {
        $user = User::factory()->create();
        $deviceName = 'iPhone - iOS - Safari';

        $token = $user->createToken($deviceName);

        $this->assertEquals($deviceName, $token->accessToken->name);
    }

    /**
     * Test that User model can list tokens.
     */
    public function test_user_can_list_tokens(): void
    {
        $user = User::factory()->create();

        // Create multiple tokens
        $user->createToken('Device 1');
        $user->createToken('Device 2');
        $user->createToken('Device 3');

        // Refresh to get tokens relationship
        $user->refresh();

        $this->assertCount(3, $user->tokens);
    }

    /**
     * Test that User token contains correct attributes.
     */
    public function test_token_has_required_attributes(): void
    {
        $user = User::factory()->create();
        $deviceName = 'MacBook Pro - macOS - Chrome';

        $token = $user->createToken($deviceName);

        $this->assertNotNull($token->accessToken->id);
        $this->assertEquals($deviceName, $token->accessToken->name);
        $this->assertNotNull($token->accessToken->created_at);
    }

    /**
     * Test that User can delete a specific token.
     */
    public function test_user_can_delete_token(): void
    {
        $user = User::factory()->create();

        $token1 = $user->createToken('Device 1');
        $token2 = $user->createToken('Device 2');

        // Delete first token
        $token1->accessToken->delete();

        // Refresh user tokens
        $user->refresh();

        $this->assertCount(1, $user->tokens);
        $this->assertEquals('Device 2', $user->tokens->first()->name);
    }

    /**
     * Test that User can delete all tokens.
     */
    public function test_user_can_delete_all_tokens(): void
    {
        $user = User::factory()->create();

        $user->createToken('Device 1');
        $user->createToken('Device 2');
        $user->createToken('Device 3');

        // Delete all tokens
        $user->tokens()->delete();

        // Refresh user tokens
        $user->refresh();

        $this->assertCount(0, $user->tokens);
    }

    /**
     * Test that User model has correct fillable attributes.
     */
    public function test_user_has_correct_fillable_attributes(): void
    {
        $user = new User();

        $this->assertEquals(['name', 'email', 'password'], $user->getFillable());
    }

    /**
     * Test that User model hides sensitive attributes.
     */
    public function test_user_hides_sensitive_attributes(): void
    {
        $user = new User();

        $hidden = $user->getHidden();

        $this->assertContains('password', $hidden);
        $this->assertContains('remember_token', $hidden);
    }
}
