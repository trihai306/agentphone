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

        // Define resources and actions
        $resources = [
            'users',
            'roles',
            'permissions',
            'transactions',
            'wallets',
            'banks',
            'user_bank_accounts',
            'devices',
        ];

        $actions = [
            'view_any',
            'view',
            'create',
            'update',
            'delete',
            'delete_any',
            'force_delete',
            'force_delete_any',
            'restore',
            'restore_any',
            'reorder',
        ];

        $permissions = [];

        foreach ($resources as $resource) {
            foreach ($actions as $action) {
                $permissions[] = "{$action}_{$resource}";
            }
        }

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

        // Editor role - example subset
        $editorRole = Role::firstOrCreate(
            ['name' => 'editor', 'guard_name' => 'web']
        );
        // Assign some basic permissions to editor
        $editorPermissions = array_filter($permissions, function ($permission) {
            return str_contains($permission, '_users') || str_contains($permission, '_transactions');
        });
        $editorRole->syncPermissions($editorPermissions);

        // Viewer role - view only
        $viewerRole = Role::firstOrCreate(
            ['name' => 'viewer', 'guard_name' => 'web']
        );
        $viewerPermissions = array_filter($permissions, function ($permission) {
            return str_starts_with($permission, 'view_');
        });
        $viewerRole->syncPermissions($viewerPermissions);
    }
}
