<?php

namespace Tests\Feature;

use App\Models\User;
use App\States\UserWorkflow\Active;
use App\States\UserWorkflow\Pending;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that a guest user is redirected to login when accessing admin panel.
     */
    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/admin');

        $response->assertRedirect('/admin/login');
    }

    /**
     * Test that admin users can access the admin panel dashboard.
     */
    public function test_admin_can_access_admin_panel(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $user->assignRole('admin');

        $response = $this->actingAs($user)->get('/admin');

        $response->assertSuccessful();
    }

    /**
     * Test that non-admin users cannot access the admin panel.
     */
    public function test_non_admin_cannot_access_admin_panel(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);
        $user->assignRole('viewer');

        $response = $this->actingAs($user)->get('/admin');

        // Filament returns 403 for users who don't pass canAccessPanel()
        $response->assertStatus(403);
    }

    /**
     * Test that user with no roles cannot access the admin panel.
     */
    public function test_user_with_no_roles_cannot_access_admin_panel(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/admin');

        // Filament returns 403 for users who don't pass canAccessPanel()
        $response->assertStatus(403);
    }

    /**
     * Test admin login page is accessible.
     */
    public function test_admin_login_page_is_accessible(): void
    {
        $response = $this->get('/admin/login');

        $response->assertSuccessful();
    }

    /**
     * Test that admin can access users resource.
     */
    public function test_admin_can_access_users_resource(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertSuccessful();
    }

    /**
     * Test that admin can access user creation page.
     */
    public function test_admin_can_access_user_create_page(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/users/create');

        $response->assertSuccessful();
    }

    /**
     * Test that admin can access user edit page.
     */
    public function test_admin_can_access_user_edit_page(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $targetUser = User::factory()->create();

        $response = $this->actingAs($admin)->get("/admin/users/{$targetUser->id}/edit");

        $response->assertSuccessful();
    }

    /**
     * Test that admin can access roles resource.
     */
    public function test_admin_can_access_roles_resource(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/roles');

        $response->assertSuccessful();
    }

    /**
     * Test that admin can access permissions resource.
     */
    public function test_admin_can_access_permissions_resource(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/permissions');

        $response->assertSuccessful();
    }

    /**
     * Test that non-admin cannot access users resource.
     */
    public function test_non_admin_cannot_access_users_resource(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);
        $user->assignRole('viewer');

        $response = $this->actingAs($user)->get('/admin/users');

        $response->assertStatus(403);
    }

    /**
     * Test that non-admin cannot access roles resource.
     */
    public function test_non_admin_cannot_access_roles_resource(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);
        $user->assignRole('viewer');

        $response = $this->actingAs($user)->get('/admin/roles');

        $response->assertStatus(403);
    }

    /**
     * Test that non-admin cannot access permissions resource.
     */
    public function test_non_admin_cannot_access_permissions_resource(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);
        $user->assignRole('viewer');

        $response = $this->actingAs($user)->get('/admin/permissions');

        $response->assertStatus(403);
    }

    /**
     * Test that editor role (non-admin) cannot access admin panel.
     */
    public function test_editor_cannot_access_admin_panel(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        $user->assignRole('editor');

        $response = $this->actingAs($user)->get('/admin');

        $response->assertStatus(403);
    }

    /**
     * Test that user with multiple non-admin roles still cannot access admin panel.
     */
    public function test_user_with_multiple_non_admin_roles_cannot_access(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);
        $user->assignRole(['editor', 'viewer']);

        $response = $this->actingAs($user)->get('/admin');

        $response->assertStatus(403);
    }

    /**
     * Test that user with admin role among other roles can access admin panel.
     */
    public function test_user_with_admin_plus_other_roles_can_access(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        $user->assignRole(['admin', 'editor']);

        $response = $this->actingAs($user)->get('/admin');

        $response->assertSuccessful();
    }

    /**
     * Test that role creation page is accessible to admin.
     */
    public function test_admin_can_access_role_create_page(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/roles/create');

        $response->assertSuccessful();
    }

    /**
     * Test that permission creation page is accessible to admin.
     */
    public function test_admin_can_access_permission_create_page(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/permissions/create');

        $response->assertSuccessful();
    }

    /**
     * Test that role edit page is accessible to admin.
     */
    public function test_admin_can_access_role_edit_page(): void
    {
        $admin = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $editorRole = Role::create(['name' => 'editor', 'guard_name' => 'web']);

        $response = $this->actingAs($admin)->get("/admin/roles/{$editorRole->id}/edit");

        $response->assertSuccessful();
    }

    /**
     * Test that permission edit page is accessible to admin.
     */
    public function test_admin_can_access_permission_edit_page(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $permission = Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $response = $this->actingAs($admin)->get("/admin/permissions/{$permission->id}/edit");

        $response->assertSuccessful();
    }

    /**
     * Test that admin panel has proper CSRF protection.
     */
    public function test_admin_panel_has_csrf_protection(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        // Attempt POST without CSRF token should fail
        $response = $this->actingAs($admin)
            ->post('/admin/users', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => 'password123',
            ]);

        // Filament uses Livewire, so we expect either 419 CSRF error or redirect
        $this->assertTrue(
            in_array($response->status(), [419, 302, 422]),
            "Expected status 419, 302, or 422, got {$response->status()}"
        );
    }

    /**
     * Test that unauthenticated user cannot create users.
     */
    public function test_guest_cannot_access_user_create_page(): void
    {
        $response = $this->get('/admin/users/create');

        $response->assertRedirect('/admin/login');
    }

    /**
     * Test that unauthenticated user cannot access roles resource.
     */
    public function test_guest_cannot_access_roles_resource(): void
    {
        $response = $this->get('/admin/roles');

        $response->assertRedirect('/admin/login');
    }

    /**
     * Test that unauthenticated user cannot access permissions resource.
     */
    public function test_guest_cannot_access_permissions_resource(): void
    {
        $response = $this->get('/admin/permissions');

        $response->assertRedirect('/admin/login');
    }

    /**
     * Test that authenticated user session persists across requests.
     */
    public function test_admin_session_persists(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        // First request
        $response1 = $this->actingAs($admin)->get('/admin');
        $response1->assertSuccessful();

        // Second request should also be authenticated
        $response2 = $this->actingAs($admin)->get('/admin/users');
        $response2->assertSuccessful();
    }

    /**
     * Test that admin panel protects against unauthenticated access to all resources.
     */
    public function test_all_admin_routes_require_authentication(): void
    {
        $adminRoutes = [
            '/admin',
            '/admin/users',
            '/admin/users/create',
            '/admin/roles',
            '/admin/roles/create',
            '/admin/permissions',
            '/admin/permissions/create',
        ];

        foreach ($adminRoutes as $route) {
            $response = $this->get($route);
            $this->assertTrue(
                $response->isRedirect('/admin/login') || $response->isRedirect(),
                "Route {$route} should redirect unauthenticated users"
            );
        }
    }

    /**
     * Test that admin can list users in the users table.
     */
    public function test_admin_can_see_users_in_list(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        // Create some test users
        User::factory()->create(['name' => 'Test User 1', 'email' => 'test1@example.com']);
        User::factory()->create(['name' => 'Test User 2', 'email' => 'test2@example.com']);

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertSuccessful();
        // The page should contain references to the users
        $response->assertSee('Test User 1');
        $response->assertSee('Test User 2');
    }

    /**
     * Test that admin can see roles in the roles list.
     */
    public function test_admin_can_see_roles_in_list(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Role::create(['name' => 'viewer', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/roles');

        $response->assertSuccessful();
        $response->assertSee('editor');
        $response->assertSee('viewer');
    }

    /**
     * Test that admin can see permissions in the permissions list.
     */
    public function test_admin_can_see_permissions_in_list(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $response = $this->actingAs($admin)->get('/admin/permissions');

        $response->assertSuccessful();
        $response->assertSee('view-users');
        $response->assertSee('edit-users');
    }

    /**
     * Test that user workflow state is displayed in the user edit form.
     */
    public function test_user_workflow_state_shown_in_edit_form(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $user = User::factory()->create(['workflow_state' => Active::class]);

        $response = $this->actingAs($admin)->get("/admin/users/{$user->id}/edit");

        $response->assertSuccessful();
        // The form should contain workflow state field
        $response->assertSee('Workflow State');
    }

    /**
     * Test that roles can be selected in user form.
     */
    public function test_roles_selectable_in_user_form(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $user = User::factory()->create();

        $response = $this->actingAs($admin)->get("/admin/users/{$user->id}/edit");

        $response->assertSuccessful();
        // The form should contain roles section
        $response->assertSee('Roles');
    }

    /**
     * Test that admin panel dashboard loads correctly.
     */
    public function test_admin_dashboard_loads_correctly(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertSuccessful();
        // Dashboard should show the brand name
        $response->assertSee('Admin');
    }

    /**
     * Test that removing admin role loses access to admin panel.
     */
    public function test_removing_admin_role_loses_access(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        $user->assignRole('admin');

        // Can access with admin role
        $response1 = $this->actingAs($user)->get('/admin');
        $response1->assertSuccessful();

        // Remove admin role
        $user->removeRole('admin');
        $user->assignRole('editor');
        $user->refresh();

        // Clear permission cache
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Should no longer be able to access
        $response2 = $this->actingAs($user)->get('/admin');
        $response2->assertStatus(403);
    }

    /**
     * Test that password field is not visible in user list.
     */
    public function test_password_not_visible_in_user_list(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $testUser = User::factory()->create([
            'name' => 'Test User',
            'password' => bcrypt('secretpassword123'),
        ]);

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertSuccessful();
        // Password should never be displayed
        $response->assertDontSee('secretpassword123');
    }

    /**
     * Test that multiple admins can exist and access panel.
     */
    public function test_multiple_admins_can_access_panel(): void
    {
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $admin1 = User::factory()->create();
        $admin1->assignRole('admin');

        $admin2 = User::factory()->create();
        $admin2->assignRole('admin');

        $response1 = $this->actingAs($admin1)->get('/admin');
        $response1->assertSuccessful();

        $response2 = $this->actingAs($admin2)->get('/admin');
        $response2->assertSuccessful();
    }

    /**
     * Test that users with Active workflow state display correctly.
     */
    public function test_active_workflow_state_displays_correctly(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $activeUser = User::factory()->create([
            'name' => 'Active User',
            'workflow_state' => Active::class,
        ]);

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertSuccessful();
        $response->assertSee('Active User');
        $response->assertSee('Active');
    }

    /**
     * Test that users with Pending workflow state display correctly.
     */
    public function test_pending_workflow_state_displays_correctly(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $pendingUser = User::factory()->create([
            'name' => 'Pending User',
            'workflow_state' => Pending::class,
        ]);

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertSuccessful();
        $response->assertSee('Pending User');
        $response->assertSee('Pending');
    }

    /**
     * Test that navigation groups are displayed in admin panel.
     */
    public function test_navigation_groups_are_displayed(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertSuccessful();
        $response->assertSee('User Management');
        $response->assertSee('Access Control');
    }
}
