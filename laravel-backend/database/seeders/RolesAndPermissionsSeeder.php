<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Create default roles (admin, editor, viewer) and permissions.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Define all permissions
        $permissions = [
            // User management permissions
            'view-users',
            'edit-users',
            'manage-users',     // Full CRUD for users

            // Role management permissions
            'manage-roles',     // Full CRUD for roles

            // Permission management permissions
            'manage-permissions', // Full CRUD for permissions
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        // Create roles and assign permissions

        // Admin role - has all permissions
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'web']
        );
        $adminRole->syncPermissions($permissions);

        // Editor role - can view and edit users
        $editorRole = Role::firstOrCreate(
            ['name' => 'editor', 'guard_name' => 'web']
        );
        $editorRole->syncPermissions([
            'view-users',
            'edit-users',
        ]);

        // Viewer role - can only view users
        $viewerRole = Role::firstOrCreate(
            ['name' => 'viewer', 'guard_name' => 'web']
        );
        $viewerRole->syncPermissions([
            'view-users',
        ]);
    }
}
