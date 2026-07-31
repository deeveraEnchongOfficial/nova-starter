<?php

namespace App\Http\Controllers\RestApi;

use App\Http\Controllers\Controller;
use App\Services\Core\File\Actions\ConfirmFileUpload;
use App\Services\Core\File\FileCategory;
use App\Services\Core\File\FileRepository;
use App\Services\Core\File\Folder;
use App\Services\Core\File\FolderRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ConfirmFileUploadController extends Controller
{
    public function __construct(
        private readonly FolderRepository $folderRepository,
    ) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $uploadedBy = $request->user();

        $uploadPurposes = config('filesystems.upload_purposes');

        $data = $request->validate([
            'purpose' => ['required', 'string', Rule::in(array_keys($uploadPurposes))],
            'key' => [
                'required',
                'string',
                function ($attribute, $value, $fail) use ($uploadedBy): void {
                    if (
                        ! Str::contains($value, (string) $uploadedBy->getKey()) ||
                        ! app(FileRepository::class)->existsInStorage($value)
                    ) {
                        $fail(__('validation.exists', ['attribute' => $attribute]));
                    }
                },
            ],
            'name' => ['nullable', 'string'],
            'category' => ['nullable', 'string', Rule::in(array_map(static fn ($case) => $case->value, FileCategory::cases()))],
            'description' => ['nullable', 'string', 'max:150'],
            'folder_id' => ['nullable', 'string'],
        ]);

        $folder = $data['folder_id'] ?? null
            ? $this->folderRepository->findById($data['folder_id'])
            : null;

        $file = app(ConfirmFileUpload::class)->execute(
            $data['key'],
            $data['name'] ?? null,
            $uploadedBy,
            $folder,
            [
                'category' => $data['category'] ?? null,
                'description' => $data['description'] ?? null,
                'listable' => config('filesystems.upload_purposes.'.$data['purpose'].'.listable', false),
                'visibility' => 'private',
                'is_starred' => false,
            ]
        );

        return response()->json([
            'id' => $file->id,
            'url' => $file->url,
        ]);
    }
}
