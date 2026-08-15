<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\File;
use App\Services\Core\File\FileRepository;
use App\Services\Core\File\Folder;
use App\Services\Core\File\FolderRepository;
use App\Services\Core\File\ShareRepository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class EmptyTrash
{
    public function __construct(
        private readonly FolderRepository $folderRepository,
        private readonly FileRepository $fileRepository,
        private readonly ShareRepository $shareRepository,
    ) {}

    /**
     * Permanently delete all trashed files and folders for a user.
     * Removes S3 objects in the trash prefix and deletes DB records.
     *
     * @param  Model  $owner  The user whose trash to empty
     */
    public function execute(Model $owner): void
    {
        $disk = 's3';
        $trashPrefix = '.trash/'.$owner->getKey().'/';

        // Delete all S3 objects in the trash
        $trashFiles = Storage::disk($disk)->allFiles($trashPrefix);
        foreach ($trashFiles as $file) {
            Storage::disk($disk)->delete($file);
        }

        // Permanently delete trashed files
        $trashedFiles = $this->fileRepository->getTrashed($owner);
        $trashedFileIds = $trashedFiles->pluck('_id')->toArray();
        foreach ($trashedFiles as $file) {
            $this->shareRepository->deleteForResource($file);
        }
        File::tenantAware()->withTrashed()->whereIn('_id', $trashedFileIds)->each(function ($file) {
            $file->forceDelete();
        });

        // Permanently delete trashed folders (and their shares)
        $trashedFolders = $this->folderRepository->getTrashed($owner);
        $trashedFolderIds = $trashedFolders->pluck('_id')->toArray();
        foreach ($trashedFolders as $folder) {
            $this->shareRepository->deleteForResource($folder);
        }
        Folder::tenantAware()->withTrashed()->whereIn('_id', $trashedFolderIds)->each(function ($folder) {
            $folder->forceDelete();
        });
    }
}
