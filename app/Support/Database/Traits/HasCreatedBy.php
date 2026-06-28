<?php

namespace App\Support\Database\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

trait HasCreatedBy
{
    /**
     * Get the user who created this model.
     * Uses polymorphic relationship to support different user types.
     */
    public function createdBy(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope a query to only include models created by a specific user.
     */
    public function scopeByCreatedBy($query, Model $user)
    {
        return $query->whereMorphedTo('createdBy', $user);
    }
}
