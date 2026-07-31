<?php

namespace App\Http\Controllers\RestApi;

use App\Http\Controllers\Controller;
use App\Services\Core\File\Actions\CreateFolder;
use App\Services\Core\File\Actions\DeleteFolder;
use App\Services\Core\File\Actions\MoveFolder;
use App\Services\Core\File\Actions\RenameFolder;
use App\Services\Core\File\Actions\RestoreFolder;
use App\Services\Core\File\Actions\ShareResource;
use App\Services\Core\File\Actions\ToggleStar;
use App\Services\Core\File\Folder;
use App\Services\Core\File\FolderRepository;
use App\Services\Core\File\SharePermission;
use App\Services\Core\User\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FolderController extends Controller
{
    public function __construct(
        private readonly FolderRepository $folderRepository,
    ) {}

    /**
     * List folders (optionally filtered by parent_id).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $parentId = $request->get('parent_id');

        $folders = $this->folderRepository->getFoldersInFolder($parentId, $user);

        return response()->json(['data' => $folders]);
    }

    /**
     * Create a new folder.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'string'],
        ]);

        $parent = ! empty($data['parent_id']) ? $this->folderRepository->findById($data['parent_id']) : null;

        $folder = app(CreateFolder::class)->execute(
            $data['name'],
            $request->user(),
            $parent,
        );

        return response()->json(['id' => $folder->id, 'name' => $folder->name], 201);
    }

    /**
     * Get folder details.
     */
    public function show(string $id)
    {
        $folder = $this->folderRepository->findById($id);

        if (! $folder) {
            return response()->json(['message' => 'Folder not found'], 404);
        }

        return response()->json(['data' => $folder]);
    }

    /**
     * Rename or move a folder.
     */
    public function update(Request $request, string $id)
    {
        $folder = $this->folderRepository->findById($id);

        if (! $folder) {
            return response()->json(['message' => 'Folder not found'], 404);
        }

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'parent_id' => ['nullable', 'string'],
        ]);

        if (isset($data['name']) && $data['name'] !== $folder->name) {
            app(RenameFolder::class)->execute($folder, $data['name']);
        }

        if (array_key_exists('parent_id', $data) && $data['parent_id'] !== $folder->parent_id) {
            $newParent = $data['parent_id'] ? $this->folderRepository->findById($data['parent_id']) : null;
            app(MoveFolder::class)->execute($folder, $newParent);
        }

        return response()->json(['id' => $folder->id, 'name' => $folder->name]);
    }

    /**
     * Soft-delete a folder (move to trash).
     */
    public function destroy(string $id)
    {
        $folder = $this->folderRepository->findById($id);

        if (! $folder) {
            return response()->json(['message' => 'Folder not found'], 404);
        }

        app(DeleteFolder::class)->execute($folder);

        return response()->json(['message' => 'Folder moved to trash']);
    }

    /**
     * Restore a folder from trash.
     */
    public function restore(string $id)
    {
        $folder = Folder::withTrashed()->find($id);

        if (! $folder) {
            return response()->json(['message' => 'Folder not found'], 404);
        }

        app(RestoreFolder::class)->execute($folder);

        return response()->json(['message' => 'Folder restored']);
    }

    /**
     * Toggle star on a folder.
     */
    public function toggleStar(string $id)
    {
        $folder = $this->folderRepository->findById($id);

        if (! $folder) {
            return response()->json(['message' => 'Folder not found'], 404);
        }

        app(ToggleStar::class)->execute($folder);

        return response()->json(['is_starred' => $folder->is_starred]);
    }

    /**
     * Share a folder with a user.
     */
    public function share(Request $request, string $id)
    {
        $folder = $this->folderRepository->findById($id);

        if (! $folder) {
            return response()->json(['message' => 'Folder not found'], 404);
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
            $folder,
            $sharedWith,
            SharePermission::from($data['permission']),
            $request->user(),
        );

        return response()->json(['id' => $share->id], 201);
    }
}
