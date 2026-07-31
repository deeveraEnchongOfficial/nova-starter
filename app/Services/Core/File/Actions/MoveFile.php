<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\File;
use App\Services\Core\File\Folder;
use Illuminate\Support\Facades\Storage;

class MoveFile
{
    /**
     * Move a file to a new folder (or to root if null).
     *
     * @param  File  $file  The file to move
     * @param  Folder|null  $newFolder  The new parent folder (null = root)
     */
    public function execute(File $file, ?Folder $newFolder = null): File
    {
        $disk = 's3';
        $oldPath = $file->path;

        // Compute new path: folder's full_path + file name
        $newPath = $newFolder
            ? $newFolder->full_path.$file->name
            : $file->created_by_id.'/'.$file->name;

        // Move the S3 object
        if (Storage::disk($disk)->exists($oldPath)) {
            Storage::disk($disk)->move($oldPath, $newPath);
        }

        $file->forceFill([
            'path' => $newPath,
            'folder_id' => $newFolder?->id,
        ]);
        $file->save();

        return $file;
    }
}
