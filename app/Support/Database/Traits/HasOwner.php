<?php

namespace App\Support\Database\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

trait HasOwner
{
    /**
     * Boot the HasOwner trait.
     */
    public static function bootHasOwner(): void
    {
        static::saving(function (Model $model): void {
            if ($model->isDirty(['owned_by_type', 'owned_by_id'])) {
                $previousOwners = $model->previous_owners ?? [];

                // If there was a previous owner, record it
                if ($model->getOriginal('owned_by_type') && $model->getOriginal('owned_by_id')) {
                    $previousOwners[] = [
                        'owner_type' => $model->getOriginal('owned_by_type'),
                        'owner_id' => $model->getOriginal('owned_by_id'),
                        'ended_at' => Carbon::now(),
                    ];
                }

                $model->previous_owners = $previousOwners;
            }
        });
    }

    /**
     * Get the owner of this model.
     * Uses polymorphic relationship to support different owner types.
     */
    public function ownedBy(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the previous owners of this model.
     * Returns an array of ownership records with owner_type, owner_id, and ended_at.
     *
     * @return array<array{owner_type: string, owner_id: string, ended_at: \Carbon\Carbon}>
     */
    public function getPreviousOwners(): array
    {
        return $this->previous_owners ?? [];
    }

    /**
     * Scope a query to only include models owned by a specific owner.
     */
    public function scopeByOwnedBy($query, Model $owner)
    {
        return $query->whereMorphedTo('ownedBy', $owner);
    }
}
