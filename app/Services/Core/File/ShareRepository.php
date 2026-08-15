<?php

namespace App\Services\Core\File;

use App\Support\Database\Traits\BaseRepository;
use Illuminate\Database\Eloquent\Model;

class ShareRepository
{
    use BaseRepository;

    protected $searchFields = [];

    public function findById(string $id): ?Share
    {
        return Share::tenantAware()->find($id);
    }

    public function forResource(Model $resource)
    {
        return Share::tenantAware()->forResource($resource)->get();
    }

    public function forUser(Model $user)
    {
        return Share::tenantAware()->forUser($user)->get();
    }

    public function findForResourceAndUser(Model $resource, Model $user): ?Share
    {
        return Share::tenantAware()
            ->forResource($resource)
            ->forUser($user)
            ->first();
    }

    public function sharedFileIdsForUser(Model $user): array
    {
        return Share::tenantAware()
            ->forUser($user)
            ->where('shareable_type', (new File)->getMorphClass())
            ->pluck('shareable_id')
            ->toArray();
    }

    public function sharedFolderIdsForUser(Model $user): array
    {
        return Share::tenantAware()
            ->forUser($user)
            ->where('shareable_type', (new Folder)->getMorphClass())
            ->pluck('shareable_id')
            ->toArray();
    }

    public function deleteForResource(Model $resource): void
    {
        Share::tenantAware()->forResource($resource)->delete();
    }
}
