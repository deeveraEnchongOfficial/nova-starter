<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\File;
use Illuminate\Support\Facades\Storage;

class RestoreFile
{
    /**
     * Restore a soft-deleted file. Moves the S3 object back from trash.
     *
     * @param  File  $file  The file to restore
     */
    public function execute(File $file): File
    {
        $disk = 's3';
        $trashPath = $file->getMetadata('trash_path');

        // Compute the restore path (the file's full_path recomputes from folder)
        $restorePath = $file->full_path;

        if ($trashPath && Storage::disk($disk)->exists($trashPath)) {
            Storage::disk($disk)->move($trashPath, $restorePath);
        }

        $file->setMetadata('trash_path', null);
        $file->forceFill(['path' => $restorePath]);
        $file->save();
        $file->restore();

        return $file;
    }
}
