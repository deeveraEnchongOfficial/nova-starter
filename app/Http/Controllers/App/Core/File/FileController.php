<?php

namespace App\Http\Controllers\App\Core\File;

use App\Http\Controllers\Controller;
use App\Services\Core\File\FileRepository;
use App\Services\Core\File\FolderRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FileController extends Controller
{
    public function __construct(
        private readonly FileRepository $fileRepository,
        private readonly FolderRepository $folderRepository,
    ) {}

    /**
     * Display the file manager (main page).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $folderId = $request->get('folder_id');

        $folders = $this->folderRepository->getFoldersInFolder($folderId, $user);
        $files = $this->fileRepository->getFilesInFolder($folderId, $user);

        // Build breadcrumbs
        $breadcrumbs = [];
        if ($folderId) {
            $folder = $this->folderRepository->findById($folderId);
            if ($folder) {
                $breadcrumbs = $folder->breadcrumbs();
            }
        }

        return Inertia::render('Files/Index', [
            'folders' => $folders,
            'files' => $files,
            'currentFolderId' => $folderId,
            'breadcrumbs' => $breadcrumbs,
        ]);
    }

    /**
     * Display the trash page.
     */
    public function trash(Request $request)
    {
        $user = $request->user();

        $trashedFolders = $this->folderRepository->getTrashed($user);
        $trashedFiles = $this->fileRepository->getTrashed($user);

        return Inertia::render('Files/Trash', [
            'trashedFolders' => $trashedFolders,
            'trashedFiles' => $trashedFiles,
        ]);
    }

    /**
     * Display starred files and folders.
     */
    public function starred(Request $request)
    {
        $user = $request->user();

        $starredFolders = $this->folderRepository->getStarred($user);
        $starredFiles = $this->fileRepository->getStarred($user);

        return Inertia::render('Files/Starred', [
            'starredFolders' => $starredFolders,
            'starredFiles' => $starredFiles,
        ]);
    }

    /**
     * Display files and folders shared with the user.
     */
    public function shared(Request $request)
    {
        $user = $request->user();

        $sharedFiles = $this->fileRepository->getSharedWithUser($user);
        $sharedFolders = $this->folderRepository->getSharedWithUser($user);

        return Inertia::render('Files/Shared', [
            'sharedFiles' => $sharedFiles,
            'sharedFolders' => $sharedFolders,
        ]);
    }
}
