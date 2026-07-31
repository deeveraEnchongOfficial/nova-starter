<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\Folder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class RenameFolder
{
    /**
     * Rename a folder and update all S3 objects under it.
     *
     * @param  Folder  $folder  The folder to rename
     * @param  string  $newName  The new folder name
     */
    public function execute(Folder $folder, string $newName): Folder
    {
        $disk = 's3';
        $oldFullPath = $folder->full_path;

        $folder->forceFill(['name' => $newName]);
        $newFullPath = $folder->full_path;

        // Move all S3 objects from old prefix to new prefix
        $this->moveS3Prefix($oldFullPath, $newFullPath, $disk);

        $folder->save();

        // Update all descendant folder paths (their full_path accessor
        // will recompute automatically from parent chain, but we need
        // to touch them so any cached paths are invalidated)
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
        $descendants = Folder::where('parent_id', $folder->id)->get();
        foreach ($descendants as $descendant) {
            $descendant->save();
            $this->touchDescendants($descendant);
        }
    }
}
