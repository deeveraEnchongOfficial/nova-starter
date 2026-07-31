<?php

namespace App\Services\Core\File;

use App\Support\Database\Traits\BaseRepository;
use Illuminate\Contracts\Database\Query\Builder;
use Illuminate\Database\Eloquent\Model;

class FolderRepository
{
    use BaseRepository;

    /**
     * Fields that are searchable.
     */
    protected $searchFields = ['name'];

    public function findById(string $id): ?Folder
    {
        return Folder::find($id);
    }

    /**
     * Get folders in a specific parent folder (null = root).
     */
    public function getFoldersInFolder(
        ?string $parentId,
        Model $owner,
        bool $includeTrashed = false,
        array $with = ['children'],
    ) {
        $query = Folder::ownedBy($owner)
            ->when($parentId, fn ($q) => $q->where('parent_id', $parentId))
            ->when(! $parentId, fn ($q) => $q->whereNull('parent_id'))
            ->when(! $includeTrashed, fn ($q) => $q)
            ->with($with)
            ->latest();

        return $query->get();
    }

    /**
     * Search folders by name for a specific owner.
     */
    public function search(string $term, Model $owner, int $limit = 20)
    {
        return Folder::ownedBy($owner)
            
            ->where('name', 'regex', '/'.preg_quote($term, '/').'/i')
            ->limit($limit)
            ->get();
    }

    /**
     * Get starred folders for a specific owner.
     */
    public function getStarred(Model $owner)
    {
        return Folder::ownedBy($owner)
            
            ->where('__metadata.is_starred', true)
            ->latest()
            ->get();
    }

    /**
     * Get trashed folders for a specific owner.
     */
    public function getTrashed(Model $owner)
    {
        return Folder::ownedBy($owner)
            ->onlyTrashed()
            ->latest('deleted_at')
            ->get();
    }

    /**
     * Get all descendant folder IDs (recursive).
     */
    public function getDescendantIds(string $folderId): array
    {
        $ids = [];
        $queue = [$folderId];

        while (! empty($queue)) {
            $batch = array_splice($queue, 0);
            $childIds = Folder::whereIn('parent_id', $batch)
                
                ->pluck('_id')
                ->toArray();

            $ids = array_merge($ids, $childIds);
            $queue = $childIds;
        }

        return $ids;
    }

    /**
     * Get all descendant folder IDs including trashed ones.
     */
    public function getAllDescendantIds(string $folderId): array
    {
        $ids = [];
        $queue = [$folderId];

        while (! empty($queue)) {
            $batch = array_splice($queue, 0);
            $childIds = Folder::whereIn('parent_id', $batch)
                ->pluck('_id')
                ->toArray();

            $ids = array_merge($ids, $childIds);
            $queue = $childIds;
        }

        return $ids;
    }
}
