<?php

namespace App\Support\Database\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

trait HasUpdatedBy
{
    /**
     * Get the user who last updated this model.
     * Uses polymorphic relationship to support different user types.
     */
    public function updatedBy(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope a query to only include models updated by a specific user.
     */
    public function scopeByUpdatedBy($query, Model $user)
    {
        return $query->whereMorphedTo('updatedBy', $user);
    }
}
