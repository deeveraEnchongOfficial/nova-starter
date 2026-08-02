<?php

namespace App\Services\Core\File;

use App\Support\Database\Traits\BaseRepository;
use Illuminate\Contracts\Database\Query\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class FileRepository
{
    use BaseRepository;

    /**
     * Fields that are searchable.
     */
    protected $searchFields = ['name'];

    public function findById(string $id): ?File
    {
        return File::find($id);
    }

    /**
     * Check if a file exists in storage.
     */
    public function existsInStorage(string $key): bool
    {
        return Storage::disk('s3')->exists($key);
    }

    /**
     * Get files in a specific folder (null = root) for an owner.
     */
    public function getFilesInFolder(
        ?string $folderId,
        Model $owner,
        bool $includeTrashed = false,
        array $with = ['folder'],
    ) {
        return File::ownedBy($owner)
            ->when($folderId, fn ($q) => $q->where('folder_id', $folderId))
            ->when(! $folderId, fn ($q) => $q->whereNull('folder_id'))
            ->when(! $includeTrashed, fn ($q) => $q)
            ->with($with)
            ->latest()
            ->get();
    }

    /**
     * Search files by name for a specific owner.
     */
    public function search(string $term, Model $owner, ?string $folderId = null, int $limit = 20)
    {
        return File::ownedBy($owner)
            ->when($folderId, function (Builder $query, string $folderId): void {
                $query->where('folder_id', $folderId);
            })
            ->when(!$folderId, function (Builder $query): void {
                $query->whereNull('folder_id');
            })
            ->where('name', 'regex', '/'.preg_quote($term, '/').'/i')
            ->limit($limit)
            ->get();
    }

    /**
     * Get starred files for a specific owner.
     */
    public function getStarred(Model $owner)
    {
        return File::ownedBy($owner)

            ->where('__metadata.is_starred', true)
            ->latest()
            ->get();
    }

    /**
     * Get trashed files for a specific owner.
     */
    public function getTrashed(Model $owner)
    {
        return File::ownedBy($owner)
            ->onlyTrashed()
            ->latest('deleted_at')
            ->get();
    }

    /**
     * Get files shared with a specific user.
     */
    public function getSharedWithUser(Model $user)
    {
        $sharedFileIds = Share::forUser($user)
            ->where('shareable_type', (new File)->getMorphClass())
            ->pluck('shareable_id')
            ->toArray();

        return File::whereIn('_id', $sharedFileIds)

            ->latest()
            ->get();
    }

    /**
     * Paginate all files with optional search and filters.
     */
    public function paginateAll(
        ?string $search = null,
        int $page = 1,
        int $perPage = 15,
        array $with = ['createdBy'],
        array $select = ['*'],
        array $filters = [],
    ): LengthAwarePaginator {
        $query = File::query()
            ->with($with)
            ->latest()

            ->where('__metadata.listable', true);

        if (! empty($search)) {
            $query->where('name', 'regex', '/'.preg_quote($search, '/').'/i');
        }

        $this->applyFilters($query, $filters);

        return $query->paginate($perPage, $select, 'page', $page);
    }

    /**
     * Apply filters to the query.
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['categories'])) {
            $query->whereIn('__metadata.category', $filters['categories']);
        }

        if (! empty($filters['uploaded_by'])) {
            $query->whereIn('created_by_id', $filters['uploaded_by']);
        }

        if (! empty($filters['folder_id'])) {
            $query->where('folder_id', $filters['folder_id']);
        }

        if (! empty($filters['starred'])) {
            $query->where('__metadata.is_starred', true);
        }
    }
}
