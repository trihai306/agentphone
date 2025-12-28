<?php

namespace Tests\Unit\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that passwords are automatically hashed when set on User model.
     */
    public function test_password_is_hashed_when_creating_user(): void
    {
        $plainTextPassword = 'secret-password-123';

        $user = User::factory()->create([
            'password' => $plainTextPassword,
        ]);

        // Password should not be stored in plain text
        $this->assertNotEquals($plainTextPassword, $user->password);

        // Password should be a valid bcrypt hash
        $this->assertTrue(Hash::check($plainTextPassword, $user->password));
    }

    /**
     * Test that passwords are hashed with bcrypt algorithm.
     */
    public function test_password_is_hashed_with_bcrypt(): void
    {
        $plainTextPassword = 'my-secure-password';

        $user = User::factory()->create([
            'password' => $plainTextPassword,
        ]);

        // Bcrypt hashes start with $2y$ (or $2a$, $2b$)
        $this->assertMatchesRegularExpression('/^\$2[ayb]\$/', $user->password);
    }

    /**
     * Test that plain text passwords are never stored in database.
     */
    public function test_plain_text_password_never_stored(): void
    {
        $plainTextPassword = 'never-store-me-plain';

        User::factory()->create([
            'password' => $plainTextPassword,
        ]);

        // Query the database directly to ensure plain text is not stored
        $this->assertDatabaseMissing('users', [
            'password' => $plainTextPassword,
        ]);
    }

    /**
     * Test that password is hidden from array/JSON serialization.
     */
    public function test_password_is_hidden_from_serialization(): void
    {
        $user = User::factory()->create([
            'password' => 'hidden-password',
        ]);

        $userArray = $user->toArray();

        $this->assertArrayNotHasKey('password', $userArray);
    }

    /**
     * Test that password is hidden from JSON output.
     */
    public function test_password_is_hidden_from_json(): void
    {
        $user = User::factory()->create([
            'password' => 'json-hidden-password',
        ]);

        $userJson = $user->toJson();
        $userData = json_decode($userJson, true);

        $this->assertArrayNotHasKey('password', $userData);
    }

    /**
     * Test that Hash::check can verify password.
     */
    public function test_hash_check_verifies_correct_password(): void
    {
        $plainTextPassword = 'verify-this-password';

        $user = User::factory()->create([
            'password' => $plainTextPassword,
        ]);

        $this->assertTrue(Hash::check($plainTextPassword, $user->password));
    }

    /**
     * Test that Hash::check rejects incorrect password.
     */
    public function test_hash_check_rejects_incorrect_password(): void
    {
        $user = User::factory()->create([
            'password' => 'correct-password',
        ]);

        $this->assertFalse(Hash::check('wrong-password', $user->password));
    }

    /**
     * Test that different users with same password have different hashes.
     */
    public function test_same_password_produces_different_hashes(): void
    {
        $samePassword = 'identical-password';

        $user1 = User::factory()->create([
            'password' => $samePassword,
        ]);

        $user2 = User::factory()->create([
            'password' => $samePassword,
        ]);

        // Same password should produce different hashes (due to unique salts)
        $this->assertNotEquals($user1->password, $user2->password);

        // Both hashes should still verify correctly
        $this->assertTrue(Hash::check($samePassword, $user1->password));
        $this->assertTrue(Hash::check($samePassword, $user2->password));
    }

    /**
     * Test that password update also gets hashed.
     */
    public function test_password_update_is_hashed(): void
    {
        $user = User::factory()->create([
            'password' => 'old-password',
        ]);

        $newPassword = 'new-secure-password';
        $user->password = $newPassword;
        $user->save();

        $user->refresh();

        // New password should not be stored in plain text
        $this->assertNotEquals($newPassword, $user->password);

        // New password should verify correctly
        $this->assertTrue(Hash::check($newPassword, $user->password));

        // Old password should no longer work
        $this->assertFalse(Hash::check('old-password', $user->password));
    }

    /**
     * Test that password cast is set to 'hashed' in model.
     */
    public function test_password_has_hashed_cast(): void
    {
        $user = new User();
        $casts = $user->getCasts();

        $this->assertArrayHasKey('password', $casts);
        $this->assertEquals('hashed', $casts['password']);
    }

    /**
     * Test that password is in hidden attributes.
     */
    public function test_password_is_in_hidden_attributes(): void
    {
        $user = new User();
        $hidden = $user->getHidden();

        $this->assertContains('password', $hidden);
    }

    /**
     * Test that remember_token is also hidden.
     */
    public function test_remember_token_is_hidden(): void
    {
        $user = new User();
        $hidden = $user->getHidden();

        $this->assertContains('remember_token', $hidden);
    }

    /**
     * Test that empty password string is handled properly.
     */
    public function test_empty_password_is_hashed(): void
    {
        // Note: In production, empty passwords should be prevented by validation
        // This test verifies the hashing behavior
        $user = User::factory()->create([
            'password' => '',
        ]);

        // Even empty string gets hashed (becomes a valid hash of empty string)
        $this->assertNotEquals('', $user->password);
        $this->assertTrue(Hash::check('', $user->password));
    }

    /**
     * Test that special characters in password are handled correctly.
     */
    public function test_password_with_special_characters(): void
    {
        $specialPassword = 'P@$$w0rd!#%^&*()_+{}[]|:;<>?,./~`';

        $user = User::factory()->create([
            'password' => $specialPassword,
        ]);

        $this->assertTrue(Hash::check($specialPassword, $user->password));
    }

    /**
     * Test that unicode characters in password are handled correctly.
     */
    public function test_password_with_unicode_characters(): void
    {
        $unicodePassword = 'password_密码_пароль_パスワード_🔐';

        $user = User::factory()->create([
            'password' => $unicodePassword,
        ]);

        $this->assertTrue(Hash::check($unicodePassword, $user->password));
    }

    /**
     * Test that very long password is handled correctly.
     */
    public function test_long_password_is_handled(): void
    {
        // bcrypt has a 72 byte limit, but should still work (truncates silently)
        $longPassword = str_repeat('a', 100);

        $user = User::factory()->create([
            'password' => $longPassword,
        ]);

        // Password should be hashed
        $this->assertNotEquals($longPassword, $user->password);

        // Note: bcrypt truncates at 72 bytes, so verify with the truncated version works
        // The full password verification may still work depending on implementation
        $this->assertTrue(Hash::check($longPassword, $user->password));
    }

    /**
     * Test that password is hashed using configured bcrypt rounds.
     */
    public function test_password_uses_configured_bcrypt_rounds(): void
    {
        $user = User::factory()->create([
            'password' => 'test-password',
        ]);

        // Extract rounds from bcrypt hash
        // Format: $2y$XX$... where XX is the number of rounds
        preg_match('/^\$2[ayb]\$(\d{2})\$/', $user->password, $matches);

        $this->assertNotEmpty($matches);
        $rounds = (int) $matches[1];

        // Verify rounds match the configured value (default is 12 from .env)
        $configuredRounds = config('hashing.bcrypt.rounds', 12);
        $this->assertEquals($configuredRounds, $rounds);
    }

    /**
     * Test that password attribute exists and is fillable.
     */
    public function test_password_is_fillable(): void
    {
        $user = new User();
        $fillable = $user->getFillable();

        $this->assertContains('password', $fillable);
    }
}
