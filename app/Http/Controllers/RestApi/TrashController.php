<?php

namespace App\Http\Controllers\RestApi;

use App\Http\Controllers\Controller;
use App\Services\Core\File\Actions\EmptyTrash;
use App\Services\Core\File\FileRepository;
use App\Services\Core\File\FolderRepository;
use Illuminate\Http\Request;

class TrashController extends Controller
{
    public function __construct(
        private readonly FileRepository $fileRepository,
        private readonly FolderRepository $folderRepository,
    ) {}

    /**
     * List trashed files and folders.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $trashedFolders = $this->folderRepository->getTrashed($user);
        $trashedFiles = $this->fileRepository->getTrashed($user);

        return response()->json([
            'folders' => $trashedFolders,
            'files' => $trashedFiles,
        ]);
    }

    /**
     * Empty the trash (permanently delete all trashed items).
     */
    public function destroy(Request $request)
    {
        app(EmptyTrash::class)->execute($request->user());

        return response()->json(['message' => 'Trash emptied']);
    }
}
