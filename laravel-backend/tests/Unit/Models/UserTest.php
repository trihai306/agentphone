<?php

namespace Tests\Unit\Models;

use App\Models\User;
use App\States\UserWorkflow\Active;
use App\States\UserWorkflow\Archived;
use App\States\UserWorkflow\Pending;
use App\States\UserWorkflow\Suspended;
use App\States\UserWorkflow\UserWorkflowState;
use Filament\Models\Contracts\FilamentUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\HasApiTokens;
use Spatie\ModelStates\HasStates;
use Spatie\ModelStates\Exceptions\CouldNotPerformTransition;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;
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
     * Test that User model uses the HasRoles trait from Spatie Permission.
     */
    public function test_user_has_roles_trait(): void
    {
        $this->assertTrue(
            in_array(HasRoles::class, class_uses_recursive(User::class)),
            'User model should use HasRoles trait'
        );
    }

    /**
     * Test that User model uses the HasStates trait from Spatie Model States.
     */
    public function test_user_has_states_trait(): void
    {
        $this->assertTrue(
            in_array(HasStates::class, class_uses_recursive(User::class)),
            'User model should use HasStates trait'
        );
    }

    /**
     * Test that User model implements FilamentUser contract.
     */
    public function test_user_implements_filament_user_contract(): void
    {
        $this->assertTrue(
            in_array(FilamentUser::class, class_implements(User::class)),
            'User model should implement FilamentUser contract'
        );
    }

    /**
     * Test that User model can be assigned roles.
     */
    public function test_user_can_be_assigned_role(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $user->assignRole('admin');

        $this->assertTrue($user->hasRole('admin'));
    }

    /**
     * Test that User model can have multiple roles.
     */
    public function test_user_can_have_multiple_roles(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);

        $user->assignRole(['admin', 'editor']);

        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->hasRole('editor'));
        $this->assertCount(2, $user->roles);
    }

    /**
     * Test that User role can be removed.
     */
    public function test_user_role_can_be_removed(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $user->assignRole('admin');
        $this->assertTrue($user->hasRole('admin'));

        $user->removeRole('admin');
        $this->assertFalse($user->fresh()->hasRole('admin'));
    }

    /**
     * Test that new User defaults to Pending workflow state.
     */
    public function test_new_user_defaults_to_pending_workflow_state(): void
    {
        $user = User::factory()->create();

        $this->assertInstanceOf(Pending::class, $user->workflow_state);
    }

    /**
     * Test that workflow_state is properly cast to UserWorkflowState.
     */
    public function test_workflow_state_is_cast_to_state_class(): void
    {
        $user = User::factory()->create();

        $this->assertInstanceOf(UserWorkflowState::class, $user->workflow_state);
    }

    /**
     * Test valid transition from Pending to Active.
     */
    public function test_transition_from_pending_to_active(): void
    {
        $user = User::factory()->create();
        $this->assertInstanceOf(Pending::class, $user->workflow_state);

        $user->workflow_state->transitionTo(Active::class);
        $user->save();

        $this->assertInstanceOf(Active::class, $user->fresh()->workflow_state);
    }

    /**
     * Test valid transition from Active to Suspended.
     */
    public function test_transition_from_active_to_suspended(): void
    {
        $user = User::factory()->create(['workflow_state' => Active::class]);
        $this->assertInstanceOf(Active::class, $user->workflow_state);

        $user->workflow_state->transitionTo(Suspended::class);
        $user->save();

        $this->assertInstanceOf(Suspended::class, $user->fresh()->workflow_state);
    }

    /**
     * Test valid transition from Suspended to Active.
     */
    public function test_transition_from_suspended_to_active(): void
    {
        $user = User::factory()->create(['workflow_state' => Suspended::class]);
        $this->assertInstanceOf(Suspended::class, $user->workflow_state);

        $user->workflow_state->transitionTo(Active::class);
        $user->save();

        $this->assertInstanceOf(Active::class, $user->fresh()->workflow_state);
    }

    /**
     * Test valid transition from Active to Archived.
     */
    public function test_transition_from_active_to_archived(): void
    {
        $user = User::factory()->create(['workflow_state' => Active::class]);
        $this->assertInstanceOf(Active::class, $user->workflow_state);

        $user->workflow_state->transitionTo(Archived::class);
        $user->save();

        $this->assertInstanceOf(Archived::class, $user->fresh()->workflow_state);
    }

    /**
     * Test valid transition from Suspended to Archived.
     */
    public function test_transition_from_suspended_to_archived(): void
    {
        $user = User::factory()->create(['workflow_state' => Suspended::class]);
        $this->assertInstanceOf(Suspended::class, $user->workflow_state);

        $user->workflow_state->transitionTo(Archived::class);
        $user->save();

        $this->assertInstanceOf(Archived::class, $user->fresh()->workflow_state);
    }

    /**
     * Test invalid transition from Pending to Suspended throws exception.
     */
    public function test_invalid_transition_from_pending_to_suspended_throws_exception(): void
    {
        $user = User::factory()->create();
        $this->assertInstanceOf(Pending::class, $user->workflow_state);

        $this->expectException(CouldNotPerformTransition::class);
        $user->workflow_state->transitionTo(Suspended::class);
    }

    /**
     * Test invalid transition from Pending to Archived throws exception.
     */
    public function test_invalid_transition_from_pending_to_archived_throws_exception(): void
    {
        $user = User::factory()->create();
        $this->assertInstanceOf(Pending::class, $user->workflow_state);

        $this->expectException(CouldNotPerformTransition::class);
        $user->workflow_state->transitionTo(Archived::class);
    }

    /**
     * Test invalid transition from Archived to any state throws exception.
     */
    public function test_invalid_transition_from_archived_throws_exception(): void
    {
        $user = User::factory()->create(['workflow_state' => Archived::class]);
        $this->assertInstanceOf(Archived::class, $user->workflow_state);

        $this->expectException(CouldNotPerformTransition::class);
        $user->workflow_state->transitionTo(Active::class);
    }

    /**
     * Test workflow state label() method returns correct value.
     */
    public function test_workflow_state_label_returns_correct_value(): void
    {
        $pending = new Pending(User::factory()->create());
        $active = new Active(User::factory()->create());
        $suspended = new Suspended(User::factory()->create());
        $archived = new Archived(User::factory()->create());

        $this->assertEquals('Pending', $pending->label());
        $this->assertEquals('Active', $active->label());
        $this->assertEquals('Suspended', $suspended->label());
        $this->assertEquals('Archived', $archived->label());
    }

    /**
     * Test workflow state color() method returns correct value.
     */
    public function test_workflow_state_color_returns_correct_value(): void
    {
        $pending = new Pending(User::factory()->create());
        $active = new Active(User::factory()->create());
        $suspended = new Suspended(User::factory()->create());
        $archived = new Archived(User::factory()->create());

        $this->assertEquals('warning', $pending->color());
        $this->assertEquals('success', $active->color());
        $this->assertEquals('danger', $suspended->color());
        $this->assertEquals('gray', $archived->color());
    }

    /**
     * Test canTransitionTo returns true for valid transitions.
     */
    public function test_can_transition_to_returns_true_for_valid_transitions(): void
    {
        $pendingUser = User::factory()->create();
        $activeUser = User::factory()->create(['workflow_state' => Active::class]);
        $suspendedUser = User::factory()->create(['workflow_state' => Suspended::class]);

        // Valid transitions
        $this->assertTrue($pendingUser->workflow_state->canTransitionTo(Active::class));
        $this->assertTrue($activeUser->workflow_state->canTransitionTo(Suspended::class));
        $this->assertTrue($activeUser->workflow_state->canTransitionTo(Archived::class));
        $this->assertTrue($suspendedUser->workflow_state->canTransitionTo(Active::class));
        $this->assertTrue($suspendedUser->workflow_state->canTransitionTo(Archived::class));
    }

    /**
     * Test canTransitionTo returns false for invalid transitions.
     */
    public function test_can_transition_to_returns_false_for_invalid_transitions(): void
    {
        $pendingUser = User::factory()->create();
        $archivedUser = User::factory()->create(['workflow_state' => Archived::class]);

        // Invalid transitions
        $this->assertFalse($pendingUser->workflow_state->canTransitionTo(Suspended::class));
        $this->assertFalse($pendingUser->workflow_state->canTransitionTo(Archived::class));
        $this->assertFalse($archivedUser->workflow_state->canTransitionTo(Active::class));
        $this->assertFalse($archivedUser->workflow_state->canTransitionTo(Pending::class));
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

        $this->assertEquals(['name', 'email', 'password', 'workflow_state'], $user->getFillable());
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

    /**
     * Test that canAccessPanel returns true for admin users.
     */
    public function test_can_access_panel_returns_true_for_admin(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $user->assignRole('admin');

        // Create a mock Panel object
        $panel = $this->createMock(\Filament\Panel::class);

        $this->assertTrue($user->canAccessPanel($panel));
    }

    /**
     * Test that canAccessPanel returns false for non-admin users.
     */
    public function test_can_access_panel_returns_false_for_non_admin(): void
    {
        $user = User::factory()->create();

        // Create a mock Panel object
        $panel = $this->createMock(\Filament\Panel::class);

        $this->assertFalse($user->canAccessPanel($panel));
    }

    /**
     * Test that canAccessPanel returns false for users with other roles.
     */
    public function test_can_access_panel_returns_false_for_other_roles(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        $user->assignRole('editor');

        // Create a mock Panel object
        $panel = $this->createMock(\Filament\Panel::class);

        $this->assertFalse($user->canAccessPanel($panel));
    }
}
