<?php

namespace App\Http\Controllers\RestApi;

use App\Http\Controllers\Controller;
use App\Services\Core\File\Actions\DeleteFile;
use App\Services\Core\File\Actions\MoveFile;
use App\Services\Core\File\Actions\RenameFile;
use App\Services\Core\File\Actions\RestoreFile;
use App\Services\Core\File\Actions\ShareResource;
use App\Services\Core\File\Actions\ToggleStar;
use App\Services\Core\File\File;
use App\Services\Core\File\FileRepository;
use App\Services\Core\File\Folder;
use App\Services\Core\File\FolderRepository;
use App\Services\Core\File\SharePermission;
use App\Services\Core\User\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FileApiController extends Controller
{
    public function __construct(
        private readonly FileRepository $fileRepository,
        private readonly FolderRepository $folderRepository,
    ) {}

    /**
     * List files (optionally filtered by folder_id).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $folderId = $request->get('folder_id');

        $files = $this->fileRepository->getFilesInFolder($folderId, $user);

        return response()->json(['data' => $files]);
    }

    /**
     * Get file details.
     */
    public function show(string $id)
    {
        $file = $this->fileRepository->findById($id);

        if (! $file) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->json(['data' => $file]);
    }

    /**
     * Rename or move a file.
     */
    public function update(Request $request, string $id)
    {
        $file = $this->fileRepository->findById($id);

        if (! $file) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'folder_id' => ['nullable', 'string'],
        ]);

        if (isset($data['name']) && $data['name'] !== $file->name) {
            app(RenameFile::class)->execute($file, $data['name']);
        }

        if (array_key_exists('folder_id', $data) && $data['folder_id'] !== $file->folder_id) {
            $newFolder = $data['folder_id'] ? $this->folderRepository->findById($data['folder_id']) : null;
            app(MoveFile::class)->execute($file, $newFolder);
        }

        return response()->json(['id' => $file->id, 'name' => $file->name]);
    }

    /**
     * Soft-delete a file (move to trash).
     */
    public function destroy(string $id)
    {
        $file = $this->fileRepository->findById($id);

        if (! $file) {
            return response()->json(['message' => 'File not found'], 404);
        }

        app(DeleteFile::class)->execute($file);

        return response()->json(['message' => 'File moved to trash']);
    }

    /**
     * Restore a file from trash.
     */
    public function restore(string $id)
    {
        $file = File::withTrashed()->find($id);

        if (! $file) {
            return response()->json(['message' => 'File not found'], 404);
        }

        app(RestoreFile::class)->execute($file);

        return response()->json(['message' => 'File restored']);
    }

    /**
     * Toggle star on a file.
     */
    public function toggleStar(string $id)
    {
        $file = $this->fileRepository->findById($id);

        if (! $file) {
            return response()->json(['message' => 'File not found'], 404);
        }

        app(ToggleStar::class)->execute($file);

        return response()->json(['is_starred' => $file->is_starred]);
    }

    /**
     * Share a file with a user.
     */
    public function share(Request $request, string $id)
    {
        $file = $this->fileRepository->findById($id);

        if (! $file) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $data = $request->validate([
            'shared_with_id' => ['required', 'string'],
            'permission' => ['required', 'string', Rule::in(array_map(fn ($c) => $c->value, SharePermission::cases()))],
        ]);

        $sharedWith = User::find($data['shared_with_id']);

        if (! $sharedWith) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $share = app(ShareResource::class)->execute(
            $file,
            $sharedWith,
            SharePermission::from($data['permission']),
            $request->user(),
        );

        return response()->json(['id' => $share->id], 201);
    }

    /**
     * Download a file (redirect to presigned URL or stream).
     */
    public function download(string $id)
    {
        $file = $this->fileRepository->findById($id);

        if (! $file) {
            return response()->json(['message' => 'File not found'], 404);
        }

        // The url attribute already generates a presigned URL using the
        // external signing_url endpoint when configured.
        return response()->json(['url' => $file->url]);
    }
}
