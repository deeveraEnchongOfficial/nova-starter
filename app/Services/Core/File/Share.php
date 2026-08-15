<?php

namespace App\Services\Core\File;

use App\Services\Core\User\User;
use App\Support\Database\Traits\BelongsToATenant;
use App\Support\Database\Traits\HasCreatedBy;
use App\Support\Database\Traits\ServiceModel;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Share extends Model
{
    use BelongsToATenant, HasCreatedBy, ServiceModel;

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Get the resource that is shared (File or Folder).
     */
    public function shareable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user the resource is shared with.
     */
    public function sharedWith(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shared_with_id');
    }

    /**
     * Get the permission level.
     */
    public function permission(): Attribute
    {
        return Attribute::make(
            get: fn () => SharePermission::tryFrom($this->permission_value ?? 'viewer')
        );
    }

    /**
     * Scope to only include shares for a specific resource.
     */
    public function scopeForResource($query, Model $resource)
    {
        return $query->where('shareable_type', $resource->getMorphClass())
            ->where('shareable_id', $resource->getKey());
    }

    /**
     * Scope to only include shares for a specific user.
     */
    public function scopeForUser($query, Model $user)
    {
        return $query->where('shared_with_id', $user->getKey());
    }
}
