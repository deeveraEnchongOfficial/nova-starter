<?php

namespace Database\Seeders;

use App\Services\Core\Role\Permission;
use App\Services\Core\Role\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'settings.view', 'settings.edit',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin']);
        $superAdmin->syncPermissions($permissions);

        $admin = Role::firstOrCreate(['name' => 'Admin']);
        $admin->syncPermissions([
            'users.view', 'users.create', 'users.edit',
            'roles.view',
            'settings.view',
        ]);

        $user = Role::firstOrCreate(['name' => 'User']);
    }
}
