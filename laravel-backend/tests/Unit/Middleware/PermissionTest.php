<?php

namespace Tests\Unit\Middleware;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that RoleMiddleware allows user with required role.
     */
    public function test_role_middleware_allows_user_with_role(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $user->assignRole('admin');

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new RoleMiddleware(app());

        $response = $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'admin'
        );

        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that RoleMiddleware denies user without required role.
     */
    public function test_role_middleware_denies_user_without_role(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'editor', 'guard_name' => 'web']);
        $user->assignRole('editor');

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new RoleMiddleware(app());

        $this->expectException(HttpException::class);

        $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'admin'
        );
    }

    /**
     * Test that RoleMiddleware denies user with no roles.
     */
    public function test_role_middleware_denies_user_with_no_roles(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new RoleMiddleware(app());

        $this->expectException(HttpException::class);

        $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'admin'
        );
    }

    /**
     * Test that RoleMiddleware allows user with any of the required roles (OR logic).
     */
    public function test_role_middleware_allows_user_with_any_required_role(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        $user->assignRole('super-admin');

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new RoleMiddleware(app());

        $response = $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'admin|super-admin'
        );

        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that PermissionMiddleware allows user with required permission.
     */
    public function test_permission_middleware_allows_user_with_permission(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        $user->givePermissionTo('edit-users');

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new PermissionMiddleware(app());

        $response = $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'edit-users'
        );

        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that PermissionMiddleware denies user without required permission.
     */
    public function test_permission_middleware_denies_user_without_permission(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        $user->givePermissionTo('view-users');

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new PermissionMiddleware(app());

        $this->expectException(HttpException::class);

        $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'edit-users'
        );
    }

    /**
     * Test that PermissionMiddleware denies user with no permissions.
     */
    public function test_permission_middleware_denies_user_with_no_permissions(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new PermissionMiddleware(app());

        $this->expectException(HttpException::class);

        $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'edit-users'
        );
    }

    /**
     * Test that PermissionMiddleware allows user with any of the required permissions (OR logic).
     */
    public function test_permission_middleware_allows_user_with_any_required_permission(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'delete-users', 'guard_name' => 'web']);
        $user->givePermissionTo('delete-users');

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new PermissionMiddleware(app());

        $response = $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'edit-users|delete-users'
        );

        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that PermissionMiddleware allows user with role-based permission.
     */
    public function test_permission_middleware_allows_user_with_permission_via_role(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);
        $role->givePermissionTo('manage-users');
        $user->assignRole('admin');

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new PermissionMiddleware(app());

        $response = $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'manage-users'
        );

        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that RoleOrPermissionMiddleware allows user with role.
     */
    public function test_role_or_permission_middleware_allows_user_with_role(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);
        $user->assignRole('admin');

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new RoleOrPermissionMiddleware(app());

        $response = $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'admin|manage-users'
        );

        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that RoleOrPermissionMiddleware allows user with permission.
     */
    public function test_role_or_permission_middleware_allows_user_with_permission(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);
        $user->givePermissionTo('manage-users');

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new RoleOrPermissionMiddleware(app());

        $response = $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'admin|manage-users'
        );

        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that RoleOrPermissionMiddleware denies user without role or permission.
     */
    public function test_role_or_permission_middleware_denies_user_without_role_or_permission(): void
    {
        $user = User::factory()->create();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new RoleOrPermissionMiddleware(app());

        $this->expectException(HttpException::class);

        $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'admin|manage-users'
        );
    }

    /**
     * Test that middleware correctly uses guard_name from config.
     */
    public function test_middleware_uses_correct_guard(): void
    {
        $user = User::factory()->create();
        // Create permission for 'web' guard
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        $user->givePermissionTo('edit-users');

        $request = $this->createAuthenticatedRequest($user);
        $middleware = new PermissionMiddleware(app());

        $response = $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'edit-users',
            'web'
        );

        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that middleware denies guest users (unauthenticated).
     */
    public function test_middleware_denies_guest_users(): void
    {
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $request = Request::create('/test', 'GET');
        $middleware = new RoleMiddleware(app());

        $this->expectException(HttpException::class);

        $middleware->handle(
            $request,
            function ($req) {
                return new Response('OK');
            },
            'admin'
        );
    }

    /**
     * Test that middleware is registered correctly in bootstrap/app.php.
     */
    public function test_middleware_aliases_are_registered(): void
    {
        $router = app('router');
        $middlewareAliases = $router->getMiddleware();

        $this->assertArrayHasKey('role', $middlewareAliases);
        $this->assertArrayHasKey('permission', $middlewareAliases);
        $this->assertArrayHasKey('role_or_permission', $middlewareAliases);

        $this->assertEquals(RoleMiddleware::class, $middlewareAliases['role']);
        $this->assertEquals(PermissionMiddleware::class, $middlewareAliases['permission']);
        $this->assertEquals(RoleOrPermissionMiddleware::class, $middlewareAliases['role_or_permission']);
    }

    /**
     * Test that user loses permission after role is removed.
     */
    public function test_user_loses_permission_after_role_removal(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        $role->givePermissionTo('edit-users');
        $user->assignRole('editor');

        // Verify user has permission
        $this->assertTrue($user->hasPermissionTo('edit-users'));

        // Remove role
        $user->removeRole('editor');

        // Refresh user to get updated permissions
        $user = $user->fresh();

        // Verify user no longer has permission
        $this->assertFalse($user->hasPermissionTo('edit-users'));
    }

    /**
     * Test that multiple permissions can be checked (AND logic) via separate calls.
     */
    public function test_user_with_multiple_permissions(): void
    {
        $user = User::factory()->create();
        Permission::create(['name' => 'view-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'delete-users', 'guard_name' => 'web']);

        $user->givePermissionTo(['view-users', 'edit-users', 'delete-users']);

        $this->assertTrue($user->hasAllPermissions(['view-users', 'edit-users', 'delete-users']));
    }

    /**
     * Test that direct permission takes precedence when user also has role permission.
     */
    public function test_direct_permission_works_with_role_permission(): void
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit-users', 'guard_name' => 'web']);

        // Give permission via role
        $role->givePermissionTo('edit-users');
        $user->assignRole('editor');

        // Also give direct permission
        $user->givePermissionTo('edit-users');

        // Should still have permission
        $this->assertTrue($user->hasPermissionTo('edit-users'));

        // Remove role
        $user->removeRole('editor');
        $user = $user->fresh();

        // Should still have direct permission
        $this->assertTrue($user->hasPermissionTo('edit-users'));
    }

    /**
     * Helper method to create an authenticated request.
     */
    protected function createAuthenticatedRequest(User $user): Request
    {
        $request = Request::create('/test', 'GET');
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return $request;
    }
}
