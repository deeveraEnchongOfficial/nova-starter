<?php

namespace App\Services\Core\Role;

use App\Support\Database\Traits\BaseRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class RoleRepository
{
    use BaseRepository;

    public function findByName(string $name): ?Role
    {
        return Role::tenantAware()->where('name', $name)->first();
    }

    public function findById(string $id): ?Role
    {
        return Role::tenantAware()->find($id);
    }

    public function findAll(): Collection
    {
        return Role::tenantAware()->get();
    }

    public function paginateAll(
        ?string $search = null,
        int $page = 1,
        int $perPage = 15,
        array $with = [],
        array $select = ['*'],
    ): LengthAwarePaginator {
        return Role::tenantAware()
            ->with($with)
            ->when($search, function (Builder $query) use ($search): void {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($perPage, $select, 'page', $page);
    }
}
