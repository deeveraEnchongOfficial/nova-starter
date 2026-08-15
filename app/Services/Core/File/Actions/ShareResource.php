<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\Share;
use App\Services\Core\File\SharePermission;
use App\Services\Core\File\ShareRepository;
use Illuminate\Database\Eloquent\Model;

class ShareResource
{
    public function __construct(
        private readonly ShareRepository $shareRepository,
    ) {}

    /**
     * Share a resource (File or Folder) with a user.
     *
     * @param  Model  $resource  The resource to share (File or Folder)
     * @param  Model  $sharedWith  The user to share with
     * @param  SharePermission  $permission  The permission level
     * @param  Model  $sharedBy  The user sharing the resource
     */
    public function execute(
        Model $resource,
        Model $sharedWith,
        SharePermission $permission,
        Model $sharedBy,
    ): Share {
        // Check if share already exists, update if so
        $share = $this->shareRepository->findForResourceAndUser($resource, $sharedWith);

        if ($share) {
            $share->forceFill(['permission_value' => $permission->value]);
            $share->save();

            return $share;
        }

        $share = Share::forceMake([
            'permission_value' => $permission->value,
        ]);

        $share->shareable()->associate($resource);
        $share->sharedWith()->associate($sharedWith);
        $share->createdBy()->associate($sharedBy);

        // Set tenant from the sharing user when multi-tenant is enabled
        if (config('features.multi_tenant', false) && $sharedBy->tenant_id && $sharedBy->tenant_type) {
            $share->tenant()->associate($sharedBy->tenant);
        }

        $share->save();

        return $share;
    }
}
