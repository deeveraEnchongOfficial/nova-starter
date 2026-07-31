<?php

namespace App\Services\Core\Role\Actions;

use App\Services\Core\Role\Role;
use Illuminate\Database\Eloquent\Model;

class UpsertRole
{
    /**
     * Execute the action to update or create a role.
     */
    public function execute(
        Role $role,
        string $name,
        ?Model $tenant = null,
        array $permissions = [],
        ?Model $createdBy = null,
    ): Role {
        $role->forceFill(['name' => $name]);

        if (config('features.multi_tenant', false) && $tenant) {
            $role->tenant()->associate($tenant);
        }

        $role->save();

        if (! empty($permissions)) {
            $role->syncPermissions($permissions);

            // Spatie's syncPermissions uses a pivot table, but with MongoDB the
            // relationship is stored as an embedded permission_id array on the
            // role document. Update it directly so permission checks work.
            $permissionIds = collect($permissions)->map(fn ($p) => $p instanceof Model ? $p->getKey() : $p)->all();
            $role->forceFill(['permission_id' => $permissionIds])->save();
        } else {
            $role->forceFill(['permission_id' => []])->save();
        }

        // Set the created_by if this is a new user
        if ((! $role->exists || ! $role->createdBy) && $createdBy) {
            $role->createdBy()->associate($createdBy);
        }

        return $role;
    }
}
