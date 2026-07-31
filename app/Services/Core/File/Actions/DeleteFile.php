<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\File;
use Illuminate\Support\Facades\Storage;

class DeleteFile
{
    /**
     * Soft-delete a file. Moves the S3 object to the trash prefix.
     *
     * @param  File  $file  The file to delete
     */
    public function execute(File $file): File
    {
        $disk = 's3';
        $ownerId = $file->created_by_id;
        $oldPath = $file->path;

        // Move S3 object to trash
        $trashPath = '.trash/'.$ownerId.'/'.$file->name;

        if (Storage::disk($disk)->exists($oldPath)) {
            Storage::disk($disk)->move($oldPath, $trashPath);
        }

        // Store the trash path in metadata so we can restore
        $file->setMetadata('trash_path', $trashPath);
        $file->save();
        $file->delete();

        return $file;
    }
}
