<?php

namespace App\Services\Core\Organization\Actions;

use App\Services\Core\Organization\Organization;
use Illuminate\Database\Eloquent\Model;

class UpsertOrganization
{
    /**
     * Execute the action to update or create a organization.
     */
    public function execute(
        Organization $organization,
        string $name,
        string $status,
        bool $isActive = true,
        ?string $logoFileId = null,
        array $metadata = [],
        ?Model $createdBy = null,
    ): Organization {
        $orgData = [
            'name' => $name,
            'status' => $status,
            'is_active' => $isActive,
            'logo_file_id' => $logoFileId,
            '__metadata' => $metadata,
        ];

        $organization->forceFill($orgData);

        // Set the created_by if this is a new organization
        if ((! $organization->exists || ! $organization->createdBy) && $createdBy) {
            $organization->createdBy()->associate($createdBy);
        }

        $organization->save();

        return $organization;
    }
}
