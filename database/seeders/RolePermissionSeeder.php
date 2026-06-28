<?php

namespace Database\Seeders;

use App\Services\Core\Role\Permission;
use App\Services\Core\Role\Role;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(?Model $tenant = null): void
    {
        $permissions = [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'settings.view', 'settings.edit',
        ];

        foreach ($permissions as $permission) {
            $model = Permission::firstOrNew(['name' => $permission]);
            if ($tenant) {
                $model->tenant_type = 'core.organization';
                $model->tenant_id = $tenant->getKey();
            }
            $model->save();
        }

        $createRole = function (string $name) use ($tenant): Role {
            $model = Role::firstOrNew(['name' => $name]);
            if ($tenant) {
                $model->tenant_type = 'core.organization';
                $model->tenant_id = $tenant->getKey();
            }
            $model->save();

            return $model;
        };

        $superAdmin = $createRole('Super Admin');
        $superAdmin->syncPermissions($permissions);

        $admin = $createRole('Admin');
        $admin->syncPermissions([
            'users.view', 'users.create', 'users.edit',
            'roles.view',
            'settings.view',
        ]);

        $createRole('User');
    }
}
