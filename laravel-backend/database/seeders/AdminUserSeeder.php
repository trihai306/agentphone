<?php

namespace Database\Seeders;

use App\Models\User;
use App\States\UserWorkflow\Active;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Create default admin user with admin role and Active workflow state.
     */
    public function run(): void
    {
        // Ensure admin role exists (should be created by RolesAndPermissionsSeeder)
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'web']
        );

        // Create or update the default admin user
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'workflow_state' => Active::class,
            ]
        );

        // Assign admin role to the user (if not already assigned)
        if (! $adminUser->hasRole('admin')) {
            $adminUser->assignRole($adminRole);
        }

        // Ensure workflow state is Active
        if ($adminUser->workflow_state === null || ! $adminUser->workflow_state instanceof Active) {
            $adminUser->update(['workflow_state' => Active::class]);
        }
    }
}
