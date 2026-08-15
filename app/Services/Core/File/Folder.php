<?php

namespace App\Services\Core\File;

use App\Support\Database\Traits\BelongsToATenant;
use App\Support\Database\Traits\HasCreatedBy;
use App\Support\Database\Traits\HasMetadata;
use App\Support\Database\Traits\ServiceModel;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Folder extends Model
{
    use BelongsToATenant, HasCreatedBy, HasMetadata, ServiceModel, SoftDeletes;

    protected $appends = ['is_starred', 'color'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * The disk to use for storage operations.
     */
    private string $disk = 's3';

    /**
     * Get the parent folder (null = root).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }

    /**
     * Get child folders.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Folder::class, 'parent_id');
    }

    /**
     * Get files in this folder.
     */
    public function files(): HasMany
    {
        return $this->hasMany(File::class, 'folder_id');
    }

    /**
     * Get all descendant folders (recursive).
     */
    public function descendants(): HasMany
    {
        return $this->children()->with('descendants');
    }

    /**
     * Get the full S3 path for this folder.
     * Format: {ownerId}/path/to/folder/
     */
    public function fullPath(): Attribute
    {
        return Attribute::make(
            get: function () {
                $basePath = $this->parent ? $this->parent->full_path : $this->created_by_id.'/';

                return $basePath.$this->name.'/';
            }
        );
    }

    /**
     * Get the public URL for the folder (not a real URL, but a reference).
     */
    public function url(): Attribute
    {
        return Attribute::make(
            get: fn () => Storage::disk($this->disk)->url($this->full_path)
        );
    }

    /**
     * Get the visibility of this folder.
     */
    public function visibility(): Attribute
    {
        return Attribute::make(
            get: fn () => FolderVisibility::tryFrom($this->__metadata['visibility'] ?? 'private')
        );
    }

    /**
     * Check if the folder is starred.
     */
    public function isStarred(): Attribute
    {
        return Attribute::make(
            get: fn () => (bool) ($this->__metadata['is_starred'] ?? false)
        );
    }

    /**
     * Get the folder color.
     */
    public function color(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->__metadata['color'] ?? null
        );
    }

    /**
     * Get the breadcrumb path from root to this folder.
     */
    public function breadcrumbs(): array
    {
        $breadcrumbs = [[$this->id, $this->name]];
        $parent = $this->parent;

        while ($parent) {
            array_unshift($breadcrumbs, [$parent->id, $parent->name]);
            $parent = $parent->parent;
        }

        return $breadcrumbs;
    }

    /**
     * Scope to only include root-level folders (no parent).
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope to only include folders owned by a specific user.
     */
    public function scopeOwnedBy($query, Model $owner)
    {
        return $query->where('created_by_type', $owner->getMorphClass())
            ->where('created_by_id', $owner->getKey());
    }

    /**
     * Scope to exclude soft-deleted folders.
     * SoftDeletes trait already excludes trashed records by default,
     * so this is a no-op kept for explicitness.
     */
    public function scopeNotTrashed($query)
    {
        return $query;
    }
}
