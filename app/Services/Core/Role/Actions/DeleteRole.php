<?php

namespace App\Services\Core\Role\Actions;

use App\Services\Core\Role\Role;
use App\Services\Core\User\User;
use Illuminate\Database\Eloquent\Model;

class DeleteRole
{
    /**
     * Execute the action to update or create a role.
     */
    public function execute(Role $role, User $deletedBy): Role
    {
        // Perform hard delete (permanent deletion)
        $role->forceDelete();

        return $role;
    }
}
