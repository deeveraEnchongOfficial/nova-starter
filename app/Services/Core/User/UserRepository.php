<?php

namespace App\Services\Core\User;

use App\Support\Database\Traits\BaseRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class UserRepository
{
    use BaseRepository;

    public function findByEmail(string $email): ?User
    {
        return User::tenantAware()->where('email', $email)->first();
    }

    public function findVerifiedByEmail(string $email): ?User
    {
        return User::tenantAware()
            ->where('email', $email)
            ->whereNotNull('email_verified_at')
            ->first();
    }

    public function findById(string $id): ?User
    {
        return User::tenantAware()->find($id);
    }

    public function findAll(): Collection
    {
        return User::tenantAware()->get();
    }

    public function paginateAll(
        ?string $search = null,
        int $page = 1,
        int $perPage = 15,
        array $with = [],
        array $select = ['*'],
    ): LengthAwarePaginator {
        return User::tenantAware()
            ->with($with)
            ->when($search, function (Builder $query) use ($search): void {
                $query->where(function (Builder $q) use ($search): void {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage, $select, 'page', $page);
    }

    public function getActiveUsers(): Collection
    {
        return User::tenantAware()
            ->where(function (Builder $query): void {
                $query->whereNull('status')
                    ->orWhere('status', UserStatus::ACTIVE);
            })
            ->get();
    }
}

