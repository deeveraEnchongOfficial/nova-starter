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
        ]);

        $user = $request->user();
        $term = $request->get('q');

        $files = $this->fileRepository->search($term, $user);
        $folders = $this->folderRepository->search($term, $user);

        return response()->json([
            'files' => $files,
            'folders' => $folders,
        ]);
    }
}
