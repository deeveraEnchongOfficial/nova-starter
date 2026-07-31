<?php

namespace App\Http\Controllers\RestApi;

use App\Http\Controllers\Controller;
use Aws\S3\S3Client;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Symfony\Component\Mime\MimeTypes;

class InitiateFileUploadController extends Controller
{
    const EXCLUDED_HEADERS = ['Host'];

    public function __invoke(Request $request)
    {
        $this->ensureEnvironmentVariablesAreAvailable();

        $uploadPurposes = config('filesystems.upload_purposes');

        $data = $request->validate([
            'purpose' => ['required', 'string', Rule::in(array_keys($uploadPurposes))],
            'content_type' => [
                'required',
                'string',
                function ($attribute, $value, $fail) use ($uploadPurposes, $request): void {
                    $purpose = $request->get('purpose');

                    if (
                        $purpose &&
                        isset($uploadPurposes[$purpose]['allowed_types']) &&
                        in_array('*', $uploadPurposes[$purpose]['allowed_types'], true)
                    ) {
                        return;
                    }

                    if (
                        ! $purpose ||
                        ! isset($uploadPurposes[$purpose]) ||
                        ! isset($uploadPurposes[$purpose]['allowed_types']) ||
                        ! in_array($value, $uploadPurposes[$purpose]['allowed_types'], true)
                    ) {
                        $fail(__('validation.mimetypes', [
                            'attribute' => $attribute,
                            'values' => implode(', ', array_map(fn ($type) => str_replace('image/', '.', $type), $uploadPurposes[$purpose]['allowed_types'] ?? [])),
                        ]));
                    }
                },
            ],
            'content_size' => [
                'required',
                'integer',
                'min:1',
                function ($attribute, $value, $fail) use ($uploadPurposes, $request): void {
                    $purpose = $request->get('purpose');

                    if (
                        $purpose &&
                        isset($uploadPurposes[$purpose]['max_size']) &&
                        $uploadPurposes[$purpose]['max_size'] === '*'
                    ) {
                        return;
                    }

                    if (
                        ! $purpose ||
                        ! isset($uploadPurposes[$purpose]) ||
                        ! isset($uploadPurposes[$purpose]['max_size']) ||
                        $value > $uploadPurposes[$purpose]['max_size']
                    ) {
                        $fail(__('validation.max.file', [
                            'attribute' => $attribute,
                            'max' => ($uploadPurposes[$purpose]['max_size'] ?? 0) / 1024,
                        ]));
                    }
                },
            ],
        ]);

        $client = $this->createStorageClient($request);

        $signedRequest = $client->createPresignedRequest(
            $this->createStoreCommand(
                $data['purpose'],
                $client,
                config('filesystems.disks.s3.bucket'),
                $key = $this->generateKey(
                    $request->user(),
                    $data['purpose'],
                    $data['content_type']
                ),
                $data['content_type'],
            ),
            sprintf('+%s minutes', config('filesystems.disks.s3.presigned_request_ttl', 3))
        );

        $signedRequestUri = $signedRequest->getUri();

        return response()->json([
            'key' => $key,
            'url' => $signedRequestUri->getScheme().'://'.$signedRequestUri->getAuthority().$signedRequestUri->getPath().'?'.$signedRequestUri->getQuery(),
            'headers' => collect(array_merge(
                $signedRequest->getHeaders(),
                [
                    'Content-Type' => $data['content_type'],
                ]
            ))
                ->filter(fn ($_, $key) => ! in_array($key, self::EXCLUDED_HEADERS, true))
                ->mapWithKeys(fn ($value, $key) => [
                    $key => is_array($value) && ! empty($value) ? $value[0] : $value,
                ])
                ->toArray(),
        ]);
    }

    private function ensureEnvironmentVariablesAreAvailable(): void
    {
        $required = [
            'AWS_ACCESS_KEY_ID' => config('filesystems.disks.s3.key'),
            'AWS_SECRET_ACCESS_KEY' => config('filesystems.disks.s3.secret'),
            'AWS_DEFAULT_REGION' => config('filesystems.disks.s3.region'),
            'AWS_BUCKET' => config('filesystems.disks.s3.bucket'),
        ];

        $missing = array_keys(array_filter($required, fn ($value) => $value === null));

        if (! empty($missing)) {
            throw new Exception('Missing AWS environment variables: '.implode(', ', $missing));
        }
    }

    private function createStorageClient(?Request $request = null)
    {
        $config = [
            'region' => config('filesystems.disks.s3.region'),
            'version' => 'latest',
            'signature_version' => 'v4',
            'use_path_style_endpoint' => config('filesystems.disks.s3.use_path_style_endpoint', false),
        ];

        $config['credentials'] = array_filter([
            'key' => config('filesystems.disks.s3.key'),
            'secret' => config('filesystems.disks.s3.secret'),
            'token' => config('filesystems.disks.s3.token'),
        ]);

        $signingUrl = config('filesystems.disks.s3.signing_url', env('AWS_SIGNING_URL'));
        $url = config('filesystems.disks.s3.url');
        $endpoint = config('filesystems.disks.s3.endpoint');

        // When accessed from a non-localhost host (e.g. LAN IP from another device),
        // use the request host with MinIO's exposed port so the browser can reach it.
        if ($request) {
            $requestHost = $request->getHost();
            $isLocalhost = str_contains($requestHost, 'localhost') || $requestHost === '127.0.0.1';

            if (! $isLocalhost) {
                $minioPort = env('LOCAL_NOVA_MINIO_API_PORT', '9000');
                $signingUrl = 'http://' . $requestHost . ':' . $minioPort;
            }
        }

        if (! empty($signingUrl)) {
            $config['url'] = $config['endpoint'] = $signingUrl;
        } elseif (! empty($url)) {
            $config['url'] = $config['endpoint'] = $url;
        } elseif (! empty($endpoint)) {
            $config['url'] = $config['endpoint'] = $endpoint;
        }

        return new S3Client($config);
    }

    private function createStoreCommand(
        string $purpose,
        S3Client $client,
        string $bucket,
        string $key,
        string $contentType = 'application/octet-stream',
        ?string $cacheControl = null
    ) {
        return $client->getCommand('putObject', array_filter([
            'Bucket' => $bucket,
            'Key' => $key,
            'ACL' => config('filesystems.upload_purposes.'.$purpose.'.visibility', 'private'),
            'ContentType' => $contentType,
            'CacheControl' => $cacheControl,
        ]));
    }

    private function generateKey($user, string $purpose, string $contentType): string
    {
        $key = implode('/', [
            'tmp-'.now()->format('Y-m-d'),
            $user->getKey(),
            implode('-', [
                $purpose,
                Str::replace('-', '', Str::orderedUuid()->toString()),
            ]),
        ]);

        $extension = MimeTypes::getDefault()->getExtensions($contentType);
        if ($extension) {
            $key .= '.'.$extension[0];
        }

        return $key;
    }
}
