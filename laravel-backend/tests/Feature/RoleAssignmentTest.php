<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class RoleAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Reset cached roles and permissions for each test
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Test that a role can be assigned to a user.
     */
    public function test_role_can_be_assigned_to_user(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $user->assignRole('admin');

        $this->assertTrue($user->hasRole('admin'));
        $this->assertCount(1, $user->roles);
    }

    /**
     * Test that multiple roles can be assigned to a user.
     */
    public function test_multiple_roles_can_be_assigned_to_user(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);

        $user->assignRole(['admin', 'editor', 'viewer']);

        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->hasRole('editor'));
        $this->assertTrue($user->hasRole('viewer'));
        $this->assertCount(3, $user->roles);
    }

    /**
     * Test that a role can be removed from a user.
     */
    public function test_role_can_be_removed_from_user(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $user->assignRole('admin');
        $this->assertTrue($user->hasRole('admin'));

        $user->removeRole('admin');

        $this->assertFalse($user->fresh()->hasRole('admin'));
    }

    /**
     * Test that all roles can be synced to replace existing roles.
     */
    public function test_roles_can_be_synced(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);

        $user->assignRole(['admin', 'editor']);
        $this->assertTrue($user->hasRole(['admin', 'editor']));

        // Sync roles to only have 'viewer'
        $user->syncRoles(['viewer']);
        $user = $user->fresh();

        $this->assertFalse($user->hasRole('admin'));
        $this->assertFalse($user->hasRole('editor'));
        $this->assertTrue($user->hasRole('viewer'));
        $this->assertCount(1, $user->roles);
    }

    /**
     * Test that a permission can be assigned directly to a user.
     */
    public function test_permission_can_be_assigned_directly_to_user(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $user->givePermissionTo('edit-users');

        $this->assertTrue($user->hasPermissionTo('edit-users'));
    }

    /**
     * Test that multiple permissions can be assigned directly to a user.
     */
    public function test_multiple_permissions_can_be_assigned_to_user(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'delete-users', 'guard_name' => 'web']);

        $user->givePermissionTo(['view-users', 'edit-users', 'delete-users']);

        $this->assertTrue($user->hasAllPermissions(['view-users', 'edit-users', 'delete-users']));
    }

    /**
     * Test that a permission can be revoked from a user.
     */
    public function test_permission_can_be_revoked_from_user(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $user->givePermissionTo('edit-users');
        $this->assertTrue($user->hasPermissionTo('edit-users'));

        $user->revokePermissionTo('edit-users');

        $this->assertFalse($user->fresh()->hasPermissionTo('edit-users'));
    }

    /**
     * Test that a permission can be assigned to a role.
     */
    public function test_permission_can_be_assigned_to_role(): void
    {
        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $role->givePermissionTo('edit-users');

        $this->assertTrue($role->hasPermissionTo('edit-users'));
    }

    /**
     * Test that multiple permissions can be assigned to a role.
     */
    public function test_multiple_permissions_can_be_assigned_to_role(): void
    {
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'delete-users', 'guard_name' => 'web']);

        $role->givePermissionTo(['view-users', 'edit-users', 'delete-users']);

        $this->assertCount(3, $role->permissions);
    }

    /**
     * Test that a user inherits permissions from their assigned role.
     */
    public function test_user_inherits_permissions_from_role(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $role->givePermissionTo('edit-users');
        $user->assignRole('editor');

        $this->assertTrue($user->hasPermissionTo('edit-users'));
    }

    /**
     * Test that a user loses inherited permissions when role is removed.
     */
    public function test_user_loses_inherited_permissions_when_role_removed(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $role->givePermissionTo('edit-users');
        $user->assignRole('editor');
        $this->assertTrue($user->hasPermissionTo('edit-users'));

        $user->removeRole('editor');
        $user = $user->fresh();

        $this->assertFalse($user->hasPermissionTo('edit-users'));
    }

    /**
     * Test that a user keeps direct permissions even after role removal.
     */
    public function test_user_keeps_direct_permissions_after_role_removal(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);

        // Give role permission for edit-users
        $role->givePermissionTo('edit-users');
        $user->assignRole('editor');

        // Give direct permission for view-users
        $user->givePermissionTo('view-users');

        $this->assertTrue($user->hasPermissionTo('edit-users'));
        $this->assertTrue($user->hasPermissionTo('view-users'));

        // Remove role
        $user->removeRole('editor');
        $user = $user->fresh();

        // Should lose role permission but keep direct permission
        $this->assertFalse($user->hasPermissionTo('edit-users'));
        $this->assertTrue($user->hasPermissionTo('view-users'));
    }

    /**
     * Test that permissions can be synced to a role.
     */
    public function test_permissions_can_be_synced_to_role(): void
    {
        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'delete-users', 'guard_name' => 'web']);

        $role->givePermissionTo(['view-users', 'edit-users']);
        $this->assertCount(2, $role->permissions);

        // Sync to only have delete-users
        $role->syncPermissions(['delete-users']);
        $role = $role->fresh();

        $this->assertFalse($role->hasPermissionTo('view-users'));
        $this->assertFalse($role->hasPermissionTo('edit-users'));
        $this->assertTrue($role->hasPermissionTo('delete-users'));
        $this->assertCount(1, $role->permissions);
    }

    /**
     * Test that permission cache is cleared after role changes.
     */
    public function test_permission_cache_cleared_after_role_changes(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $role->givePermissionTo('edit-users');
        $user->assignRole('editor');

        // Verify initial state
        $this->assertTrue($user->hasPermissionTo('edit-users'));

        // Revoke permission from role
        $role->revokePermissionTo('edit-users');

        // Clear cache to ensure fresh check
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Refresh user and check again
        $user = $user->fresh();
        $this->assertFalse($user->hasPermissionTo('edit-users'));
    }

    /**
     * Test that permission cache is cleared after permission changes.
     */
    public function test_permission_cache_cleared_after_permission_assignment(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'delete-users', 'guard_name' => 'web']);

        $user->assignRole('editor');

        // Initially no permissions
        $this->assertFalse($user->hasPermissionTo('edit-users'));

        // Give permission to role
        $role->givePermissionTo('edit-users');

        // Clear cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // User should now have permission
        $user = $user->fresh();
        $this->assertTrue($user->hasPermissionTo('edit-users'));
    }

    /**
     * Test hasAnyRole method.
     */
    public function test_user_has_any_role(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);

        $user->assignRole('viewer');

        $this->assertTrue($user->hasAnyRole(['admin', 'viewer']));
        $this->assertFalse($user->hasAnyRole(['admin', 'editor']));
    }

    /**
     * Test hasAllRoles method.
     */
    public function test_user_has_all_roles(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);

        $user->assignRole(['admin', 'editor']);

        $this->assertTrue($user->hasAllRoles(['admin', 'editor']));
        $this->assertFalse($user->hasAllRoles(['admin', 'editor', 'viewer']));
    }

    /**
     * Test hasAnyPermission method.
     */
    public function test_user_has_any_permission(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'delete-users', 'guard_name' => 'web']);

        $user->givePermissionTo('view-users');

        $this->assertTrue($user->hasAnyPermission(['view-users', 'edit-users']));
        $this->assertFalse($user->hasAnyPermission(['edit-users', 'delete-users']));
    }

    /**
     * Test hasAllPermissions method.
     */
    public function test_user_has_all_permissions(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'delete-users', 'guard_name' => 'web']);

        $user->givePermissionTo(['view-users', 'edit-users']);

        $this->assertTrue($user->hasAllPermissions(['view-users', 'edit-users']));
        $this->assertFalse($user->hasAllPermissions(['view-users', 'edit-users', 'delete-users']));
    }

    /**
     * Test that role assignment updates permissions correctly for admin panel access.
     */
    public function test_assigning_admin_role_grants_panel_access(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);

        // User without admin role cannot access panel
        $user->assignRole('viewer');
        $panel = $this->createMock(\Filament\Panel::class);
        $this->assertFalse($user->canAccessPanel($panel));

        // Assign admin role
        $user->assignRole('admin');
        $user = $user->fresh();

        // Clear cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->assertTrue($user->canAccessPanel($panel));
    }

    /**
     * Test that removing admin role revokes panel access.
     */
    public function test_removing_admin_role_revokes_panel_access(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);

        $user->assignRole(['admin', 'viewer']);
        $panel = $this->createMock(\Filament\Panel::class);
        $this->assertTrue($user->canAccessPanel($panel));

        // Remove admin role
        $user->removeRole('admin');
        $user = $user->fresh();

        // Clear cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->assertFalse($user->canAccessPanel($panel));
    }

    /**
     * Test that role with multiple permissions grants all permissions to user.
     */
    public function test_role_grants_all_its_permissions_to_user(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'manager', 'guard_name' => 'web']);

        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-roles', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-permissions', 'guard_name' => 'web']);

        $role->givePermissionTo(['view-users', 'edit-users', 'manage-roles', 'manage-permissions']);
        $user->assignRole('manager');

        $this->assertTrue($user->hasPermissionTo('view-users'));
        $this->assertTrue($user->hasPermissionTo('edit-users'));
        $this->assertTrue($user->hasPermissionTo('manage-roles'));
        $this->assertTrue($user->hasPermissionTo('manage-permissions'));
    }

    /**
     * Test that user with multiple roles has combined permissions.
     */
    public function test_user_with_multiple_roles_has_combined_permissions(): void
    {
        $user = User::factory()->create();

        $editorRole = Role::create(['name' => 'editor', 'guard_name' => 'web']);
        $viewerRole = Role::create(['name' => 'viewer', 'guard_name' => 'web']);

        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $viewerRole->givePermissionTo('view-users');
        $editorRole->givePermissionTo('edit-users');

        $user->assignRole(['editor', 'viewer']);

        // User should have permissions from both roles
        $this->assertTrue($user->hasPermissionTo('view-users'));
        $this->assertTrue($user->hasPermissionTo('edit-users'));
    }

    /**
     * Test getRoleNames method returns correct role names.
     */
    public function test_get_role_names_returns_correct_values(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);

        $user->assignRole(['admin', 'editor']);

        $roleNames = $user->getRoleNames();

        $this->assertContains('admin', $roleNames);
        $this->assertContains('editor', $roleNames);
        $this->assertCount(2, $roleNames);
    }

    /**
     * Test getPermissionNames method returns correct permission names.
     */
    public function test_get_permission_names_returns_correct_values(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $user->givePermissionTo(['view-users', 'edit-users']);

        $permissionNames = $user->getPermissionNames();

        $this->assertContains('view-users', $permissionNames);
        $this->assertContains('edit-users', $permissionNames);
        $this->assertCount(2, $permissionNames);
    }

    /**
     * Test getAllPermissions includes both direct and role-based permissions.
     */
    public function test_get_all_permissions_includes_direct_and_role_permissions(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);

        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'delete-users', 'guard_name' => 'web']);

        // Direct permission
        $user->givePermissionTo('view-users');

        // Role-based permission
        $role->givePermissionTo('edit-users');
        $user->assignRole('editor');

        $allPermissions = $user->getAllPermissions();

        $this->assertTrue($allPermissions->contains('name', 'view-users'));
        $this->assertTrue($allPermissions->contains('name', 'edit-users'));
        $this->assertFalse($allPermissions->contains('name', 'delete-users'));
    }

    /**
     * Test that assigning non-existent role throws exception.
     */
    public function test_assigning_non_existent_role_throws_exception(): void
    {
        $user = User::factory()->create();

        $this->expectException(\Spatie\Permission\Exceptions\RoleDoesNotExist::class);

        $user->assignRole('non-existent-role');
    }

    /**
     * Test that giving non-existent permission throws exception.
     */
    public function test_giving_non_existent_permission_throws_exception(): void
    {
        $user = User::factory()->create();

        $this->expectException(\Spatie\Permission\Exceptions\PermissionDoesNotExist::class);

        $user->givePermissionTo('non-existent-permission');
    }

    /**
     * Test that role can be assigned by Role model instance.
     */
    public function test_role_can_be_assigned_by_model_instance(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $user->assignRole($role);

        $this->assertTrue($user->hasRole('admin'));
    }

    /**
     * Test that permission can be assigned by Permission model instance.
     */
    public function test_permission_can_be_assigned_by_model_instance(): void
    {
        $user = User::factory()->create();
        $permission = Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $user->givePermissionTo($permission);

        $this->assertTrue($user->hasPermissionTo('edit-users'));
    }

    /**
     * Test role users relationship.
     */
    public function test_role_users_relationship(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);

        $user1->assignRole('editor');
        $user2->assignRole('editor');

        $role = $role->fresh();

        $this->assertCount(2, $role->users);
        $this->assertTrue($role->users->contains($user1));
        $this->assertTrue($role->users->contains($user2));
        $this->assertFalse($role->users->contains($user3));
    }

    /**
     * Test permission roles relationship.
     */
    public function test_permission_roles_relationship(): void
    {
        $permission = Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $editorRole = Role::create(['name' => 'editor', 'guard_name' => 'web']);

        $adminRole->givePermissionTo('edit-users');
        $editorRole->givePermissionTo('edit-users');

        $permission = $permission->fresh();

        $this->assertCount(2, $permission->roles);
    }

    /**
     * Test that admin can access admin panel after role assignment via HTTP.
     */
    public function test_admin_role_assignment_grants_http_access_to_panel(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        // Initially cannot access
        $response = $this->actingAs($user)->get('/admin');
        $response->assertStatus(403);

        // Assign admin role
        $user->assignRole('admin');
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Now can access
        $response = $this->actingAs($user->fresh())->get('/admin');
        $response->assertSuccessful();
    }

    /**
     * Test that removing admin role removes HTTP access to panel.
     */
    public function test_admin_role_removal_removes_http_access_to_panel(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $user->assignRole('admin');

        // Can access with admin role
        $response = $this->actingAs($user)->get('/admin');
        $response->assertSuccessful();

        // Remove admin role
        $user->removeRole('admin');
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Cannot access anymore
        $response = $this->actingAs($user->fresh())->get('/admin');
        $response->assertStatus(403);
    }

    /**
     * Test that permissions are correctly scoped by guard.
     */
    public function test_permissions_are_scoped_by_guard(): void
    {
        $user = User::factory()->create();

        // Create web and api permissions with same name
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'api']);

        $webRole = Role::create(['name' => 'web-editor', 'guard_name' => 'web']);
        $webRole->givePermissionTo(Permission::findByName('edit-users', 'web'));
        $user->assignRole('web-editor');

        // User should have web permission but not api permission
        $this->assertTrue($user->hasPermissionTo('edit-users', 'web'));
    }
}
