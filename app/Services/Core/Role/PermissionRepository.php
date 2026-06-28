<?php

namespace App\Services\Core\Role;

use App\Support\Database\Traits\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class PermissionRepository
{
    use BaseRepository;

    public function findById(string $id): ?Permission
    {
        return Permission::tenantAware()->find($id);
    }

    public function findAll(): Collection
    {
        return Permission::tenantAware()->orderBy('name')->get();
    }

    public function findManyByIds(array $ids): Collection
    {
        return Permission::tenantAware()->whereIn('_id', $ids)->get();
    }
}
