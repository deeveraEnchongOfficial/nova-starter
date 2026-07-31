<?php

namespace App\Services\Core\Activity;

use App\Support\Database\Traits\BaseRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ActivityRepository
{
    use BaseRepository;

    public function findById(string $id): ?Activity
    {
        return Activity::tenantAware()->find($id);
    }

    public function paginateAll(
        ?string $search = null,
        int $page = 1,
        int $perPage = 15,
        array $with = [],
        array $select = ['*'],
        array $filters = [],
    ): LengthAwarePaginator {
        return Activity::tenantAware()
            ->with($with)
            ->when($search, function (Builder $query) use ($search): void {
                $query->where(function (Builder $q) use ($search): void {
                    $q->where('description', 'regex', '/'.preg_quote($search, '/').'/i')
                        ->orWhere('route', 'regex', '/'.preg_quote($search, '/').'/i');
                });
            })
            ->when($filters['type'] ?? null, function (Builder $query, string $type): void {
                $query->where('type', $type);
            })
            ->when($filters['created_by_id'] ?? null, function (Builder $query, string $userId): void {
                $query->where('created_by_id', $userId);
            })
            ->when($filters['subject_type'] ?? null, function (Builder $query, string $subjectType): void {
                $query->where('subject_type', $subjectType);
            })
            ->latest()
            ->paginate($perPage, $select, 'page', $page);
    }

    public function findBySubject(string $subjectType, string $subjectId): Collection
    {
        return Activity::tenantAware()
            ->where('subject_type', $subjectType)
            ->where('subject_id', $subjectId)
            ->latest()
            ->get();
    }

    public function findByUser(string $userId): Collection
    {
        return Activity::tenantAware()
            ->where('created_by_id', $userId)
            ->latest()
            ->get();
    }

    public function findRecent(int $limit = 10): Collection
    {
        return Activity::tenantAware()
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function clearAll(): int
    {
        return Activity::tenantAware()->delete();
    }
}
