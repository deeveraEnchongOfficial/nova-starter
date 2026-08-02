<?php

namespace App\Http\Controllers\RestApi;

use App\Http\Controllers\Controller;
use App\Services\Core\File\FileRepository;
use App\Services\Core\File\FolderRepository;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(
        private readonly FileRepository $fileRepository,
        private readonly FolderRepository $folderRepository,
    ) {}

    /**
     * Search files and folders by name.
     */
    public function index(Request $request)
    {
        $request->validate([
            'q' => ['required', 'string', 'min:1'],
            'folder_id' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $term = $request->get('q');
        $folderId = $request->get('folder_id');

        $files = $this->fileRepository->search($term, $user, folderId: $folderId);
        $folders = $this->folderRepository->search($term, $user, folderId: $folderId);

        return response()->json([
            'files' => $files,
            'folders' => $folders,
        ]);
    }
}
