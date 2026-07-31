<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\File;
use Illuminate\Support\Facades\Storage;

class RenameFile
{
    /**
     * Rename a file. This updates the display name and the S3 key.
     *
     * @param  File  $file  The file to rename
     * @param  string  $newName  The new file name
     */
    public function execute(File $file, string $newName): File
    {
        $disk = 's3';
        $oldPath = $file->path;

        // Compute new path: same directory prefix + new name
        $directory = dirname($oldPath);
        $newPath = ($directory !== '.' ? $directory.'/' : '').$newName;

        // Move the S3 object to the new key
        if (Storage::disk($disk)->exists($oldPath)) {
            Storage::disk($disk)->move($oldPath, $newPath);
        }

        $file->forceFill([
            'name' => $newName,
            'path' => $newPath,
        ]);
        $file->save();

        return $file;
    }
}
