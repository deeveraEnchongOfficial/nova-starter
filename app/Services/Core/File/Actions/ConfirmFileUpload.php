<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\File;
use App\Services\Core\File\Folder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ConfirmFileUpload
{
    /**
     * Move file from temporary storage to permanent storage and create File entry.
     *
     * @param  string  $tmpKey  The file key in temporary storage
     * @param  Model|null  $uploadedBy  The user who uploaded the file
     * @param  Folder|null  $folder  The folder to place the file in (null = root)
     * @param  array  $metadata  Additional metadata (category, description, listable, visibility)
     */
    public function execute(
        string $tmpKey,
        ?string $name = null,
        ?Model $uploadedBy = null,
        ?Folder $folder = null,
        array $metadata = [],
    ): File {
        $disk = 's3';

        // Compute the permanent path
        if ($folder) {
            $permanentKey = $folder->full_path.$name;
        } elseif ($uploadedBy) {
            $permanentKey = $uploadedBy->getKey().'/'.$name;
        } else {
            $permanentKey = $name ?? Str::after($tmpKey, '/');
        }

        // Copy file from temporary to permanent storage, then delete temp.
        // Using copy+delete instead of move() because Flysystem's move()
        // can silently fail (e.g. when MinIO storage is full) without
        // throwing an exception, leaving the file in the temp location.
        $copied = Storage::disk($disk)->copy($tmpKey, $permanentKey);

        if (! $copied || ! Storage::disk($disk)->exists($permanentKey)) {
            throw new \RuntimeException("Failed to copy uploaded file from '{$tmpKey}' to '{$permanentKey}'. The storage may be full.");
        }

        Storage::disk($disk)->delete($tmpKey);

        // Get file information (retry to handle eventual consistency on large files)
        $size = $this->retry(fn () => Storage::disk($disk)->size($permanentKey), 5, 2);
        $mimeType = $this->retry(fn () => Storage::disk($disk)->mimeType($permanentKey), 5, 2);

        // Create the File entry
        $file = File::forceMake([
            'name' => $name,
            'path' => $permanentKey,
            'disk' => $disk,
            'size' => $size,
            'mime_type' => $mimeType,
            'folder_id' => $folder?->id,
        ]);

        $file->replaceMetadata($metadata);

        if ($uploadedBy) {
            $file->createdBy()->associate($uploadedBy);
        }

        $file->save();

        return $file;
    }

    /**
     * Retry a callable with backoff for handling eventual consistency.
     */
    private function retry(callable $fn, int $maxAttempts, int $sleepSeconds): mixed
    {
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                return $fn();
            } catch (\Throwable $e) {
                if ($attempt === $maxAttempts) {
                    throw $e;
                }
                sleep($sleepSeconds);
            }
        }
    }
}
