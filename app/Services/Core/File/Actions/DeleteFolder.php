<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\File;
use App\Services\Core\File\FileRepository;
use App\Services\Core\File\Folder;
use App\Services\Core\File\FolderRepository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class DeleteFolder
{
    public function __construct(
        private readonly FolderRepository $folderRepository,
        private readonly FileRepository $fileRepository,
    ) {}

    /**
     * Soft-delete a folder and all its descendants.
     * Moves all S3 objects to the trash prefix.
     *
     * @param  Folder  $folder  The folder to delete
     */
    public function execute(Folder $folder): Folder
    {
        $disk = 's3';
        $ownerId = $folder->created_by_id;
        $oldFullPath = $folder->full_path;

        // Get all descendant folder IDs
        $descendantIds = $this->folderRepository->getAllDescendantIds($folder->id);

        // Soft-delete all descendant folders
        Folder::tenantAware()->whereIn('_id', $descendantIds)->delete();

        // Soft-delete all files in this folder and all descendant folders
        File::tenantAware()->where(function ($query) use ($folder, $descendantIds) {
            $query->where('folder_id', $folder->id)
                ->orWhereIn('folder_id', $descendantIds);
        })->delete();

        // Soft-delete the folder itself
        $folder->delete();

        // Move all S3 objects to trash
        $trashPrefix = '.trash/'.$ownerId.'/'.$folder->name.'/';
        $this->moveS3Prefix($oldFullPath, $trashPrefix, $disk);

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
}
