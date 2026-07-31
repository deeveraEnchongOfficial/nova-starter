<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\Folder;
use App\Services\Core\File\FolderVisibility;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CreateFolder
{
    /**
     * Create a new folder.
     *
     * @param  string  $name  The folder name
     * @param  Model  $owner  The user creating the folder
     * @param  Folder|null  $parent  The parent folder (null = root)
     * @param  array  $metadata  Additional metadata (visibility, color)
     */
    public function execute(
        string $name,
        Model $owner,
        ?Folder $parent = null,
        array $metadata = [],
    ): Folder {
        $disk = 's3';

        $folder = Folder::forceMake([
            'name' => $name,
            'parent_id' => $parent?->id,
        ]);

        $folder->replaceMetadata(array_merge([
            'visibility' => $metadata['visibility'] ?? FolderVisibility::PRIVATE->value,
            'is_starred' => false,
            'color' => $metadata['color'] ?? null,
        ], $metadata));

        $folder->createdBy()->associate($owner);
        $folder->save();

        // Create the S3 prefix by placing a .keep file
        $keepPath = $folder->full_path.'.keep';
        Storage::disk($disk)->put($keepPath, '');

        return $folder;
    }
}
