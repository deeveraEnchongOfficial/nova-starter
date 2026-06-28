<?php

namespace App\Services\Core\Organization;

use App\Support\Database\Traits\BaseRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class OrganizationRepository
{
    use BaseRepository;

    public function findById(string $id): ?Organization
    {
        return Organization::find($id);
    }

    public function findByName(string $name): ?Organization
    {
        return Organization::where('name', $name)->first();
    }

    public function findAll(): Collection
    {
        return Organization::orderBy('name')->get();
    }

    public function paginateAll(
        ?string $search = null,
        int $page = 1,
        int $perPage = 15,
        array $with = [],
        array $select = ['*'],
    ): LengthAwarePaginator {
        return Organization::with($with)
            ->when($search, function (Builder $query) use ($search): void {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($perPage, $select, 'page', $page);
    }
}
