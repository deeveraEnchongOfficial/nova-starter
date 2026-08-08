<?php

namespace App\Http\Controllers\RestApi;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Mime\MimeTypes;

class UploadLogoController extends Controller
{
    /**
     * Upload a logo image and return the public URL.
     *
     * Unlike the presigned URL flow used for large file uploads,
     * logos are small images uploaded directly through the server.
     * The file is stored with public-read visibility so the URL
     * is permanent (no presigned URL expiration).
     */
    public function __invoke(Request $request)
    {
        $config = config('filesystems.upload_purposes.logo', []);

        $allowedTypes = $config['allowed_types'] ?? ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
        $maxSize = $config['max_size'] ?? 1024 * 1024 * 2;

        $data = $request->validate([
            'logo' => [
                'required',
                'file',
                'max:' . intval($maxSize / 1024),
                function ($attribute, $value, $fail) use ($allowedTypes) {
                    if (!in_array($value->getMimeType(), $allowedTypes, true)) {
                        $fail(__('validation.mimetypes', [
                            'attribute' => $attribute,
                            'values' => implode(', ', array_map(fn ($type) => str_replace('image/', '.', $type), $allowedTypes)),
                        ]));
                    }
                },
            ],
        ]);

        $file = $data['logo'];
        $mimeType = $file->getMimeType();
        $extensions = MimeTypes::getDefault()->getExtensions($mimeType);
        $extension = $extensions[0] ?? 'png';

        $key = 'logos/' . Str::orderedUuid()->toString() . '.' . $extension;

        Storage::disk('s3')->put($key, file_get_contents($file->getRealPath()), 'public-read');

        $url = Storage::disk('s3')->url($key);

        return response()->json([
            'url' => $url,
            'key' => $key,
        ]);
    }
}
