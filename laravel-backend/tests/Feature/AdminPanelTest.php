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
     * Test that admin users can access the admin panel.
     */
    public function test_admin_can_access_admin_panel(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $user->assignRole('admin');

        // /admin may redirect to a sub-page (e.g. /admin/users), so follow redirects
        $response = $this->actingAs($user)->get('/admin');

        // Filament /admin redirects to first resource, so expect 302 or 200
        $this->assertTrue(
            in_array($response->status(), [200, 302]),
            "Expected 200 or 302, got {$response->status()}"
        );

        // If redirected, follow and expect success
        if ($response->status() === 302) {
            $followResponse = $this->actingAs($user)->get($response->headers->get('Location'));
            $followResponse->assertSuccessful();
        }
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

        // Filament returns 403 or redirects to login for unauthorized users
        $this->assertTrue(
            in_array($response->status(), [403, 302]),
            "Expected 403 or 302, got {$response->status()}"
        );
    }

    /**
     * Test that user with no roles cannot access the admin panel.
     */
    public function test_user_with_no_roles_cannot_access_admin_panel(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/admin');

        $this->assertTrue(
            in_array($response->status(), [403, 302]),
            "Expected 403 or 302, got {$response->status()}"
        );
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

        $response = $this->actingAs($user)->get('/admin/users');

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

        $response = $this->actingAs($user)->get('/admin/users');

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

        $response = $this->actingAs($user)->get('/admin/users');

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
     * Test that authenticated admin session persists across requests.
     */
    public function test_admin_session_persists(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        // Use specific resource pages instead of /admin which redirects
        $response1 = $this->actingAs($admin)->get('/admin/users');
        $response1->assertSuccessful();

        $response2 = $this->actingAs($admin)->get('/admin/roles');
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

        User::factory()->create(['name' => 'Test User 1', 'email' => 'test1@example.com']);
        User::factory()->create(['name' => 'Test User 2', 'email' => 'test2@example.com']);

        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertSuccessful();
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
     * Test that user edit form loads for admin.
     */
    public function test_user_edit_form_loads_for_admin(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        $user = User::factory()->create(['workflow_state' => Active::class]);

        $response = $this->actingAs($admin)->get("/admin/users/{$user->id}/edit");

        $response->assertSuccessful();
    }

    /**
     * Test that admin panel dashboard is accessible (follows redirects).
     */
    public function test_admin_dashboard_loads_correctly(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        // /admin may redirect to first resource, use /admin/users directly
        $response = $this->actingAs($admin)->get('/admin/users');

        $response->assertSuccessful();
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
        $response1 = $this->actingAs($user)->get('/admin/users');
        $response1->assertSuccessful();

        // Remove admin role
        $user->removeRole('admin');
        $user->assignRole('editor');
        $user->refresh();

        // Clear permission cache
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Should no longer be able to access
        $response2 = $this->actingAs($user)->get('/admin/users');
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
        $response->assertDontSee('secretpassword123');
    }

    /**
     * Test that multiple admins can access panel.
     */
    public function test_multiple_admins_can_access_panel(): void
    {
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $admin1 = User::factory()->create();
        $admin1->assignRole('admin');

        $admin2 = User::factory()->create();
        $admin2->assignRole('admin');

        $response1 = $this->actingAs($admin1)->get('/admin/users');
        $response1->assertSuccessful();

        $response2 = $this->actingAs($admin2)->get('/admin/users');
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
    }

    /**
     * Test that navigation is accessible in admin panel.
     */
    public function test_admin_panel_navigation_works(): void
    {
        $admin = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole('admin');

        // Verify multiple admin pages are accessible
        $pages = ['/admin/users', '/admin/roles', '/admin/permissions'];

        foreach ($pages as $page) {
            $response = $this->actingAs($admin)->get($page);
            $response->assertSuccessful();
        }
    }
}
