<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Seeders are called in the following order:
     * 1. RolesAndPermissionsSeeder - Creates roles and permissions (required for admin user)
     * 2. AdminUserSeeder - Creates default admin user with admin role
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
