<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\File;
use App\Services\Core\File\FileRepository;
use App\Services\Core\File\Folder;
use App\Services\Core\File\FolderRepository;
use Illuminate\Support\Facades\Storage;

class RestoreFolder
{
    public function __construct(
        private readonly FolderRepository $folderRepository,
        private readonly FileRepository $fileRepository,
    ) {}

    /**
     * Restore a soft-deleted folder and all its descendants.
     * Moves S3 objects back from trash.
     *
     * @param  Folder  $folder  The folder to restore
     */
    public function execute(Folder $folder): Folder
    {
        $disk = 's3';
        $ownerId = $folder->created_by_id;

        // The folder's full_path will recompute from parent chain.
        // We need to restore from the trash prefix back to the real path.
        $restorePath = $folder->full_path;
        $trashPrefix = '.trash/'.$ownerId.'/'.$folder->name.'/';

        // Restore all descendant folders
        $descendantIds = $this->folderRepository->getAllDescendantIds($folder->id);
        Folder::tenantAware()->withTrashed()->whereIn('_id', $descendantIds)->restore();

        // Restore all files in this folder and descendants
        File::tenantAware()->withTrashed()->where(function ($query) use ($folder, $descendantIds) {
            $query->where('folder_id', $folder->id)
                ->orWhereIn('folder_id', $descendantIds);
        })->restore();

        // Restore the folder itself
        $folder->restore();

        // Move S3 objects back from trash
        $this->moveS3Prefix($trashPrefix, $restorePath, $disk);

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
