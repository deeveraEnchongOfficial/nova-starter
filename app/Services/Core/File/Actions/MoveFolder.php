<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\Folder;
use Illuminate\Support\Facades\Storage;

class MoveFolder
{
    /**
     * Move a folder to a new parent folder (or to root if null).
     *
     * @param  Folder  $folder  The folder to move
     * @param  Folder|null  $newParent  The new parent folder (null = root)
     */
    public function execute(Folder $folder, ?Folder $newParent = null): Folder
    {
        $disk = 's3';
        $oldFullPath = $folder->full_path;

        $folder->forceFill([
            'parent_id' => $newParent?->id,
        ]);

        $newFullPath = $folder->full_path;

        // Move all S3 objects from old prefix to new prefix
        $this->moveS3Prefix($oldFullPath, $newFullPath, $disk);

        $folder->save();

        // Touch descendants to invalidate cached paths
        $this->touchDescendants($folder);

        return $folder;
    }

    /**
     * Move all objects from one S3 prefix to another.
     */
    private function moveS3Prefix(string $from, string $to, string $disk): void
    {
        $files = Storage::disk($disk)->allFiles($from);

        foreach ($files as $file) {
            $newPath = $to.substr($file, strlen($from));
            Storage::disk($disk)->move($file, $newPath);
        }
    }

    /**
     * Touch all descendant folders to invalidate cached paths.
     */
    private function touchDescendants(Folder $folder): void
    {
        $descendants = Folder::tenantAware()->where('parent_id', $folder->id)->get();
        foreach ($descendants as $descendant) {
            $descendant->save();
            $this->touchDescendants($descendant);
        }
    }
}
