<?php

namespace App\Services\Core\File;

use App\Support\Database\Traits\HasCreatedBy;
use App\Support\Database\Traits\HasMetadata;
use App\Support\Database\Traits\ServiceModel;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class File extends Model
{
    use HasCreatedBy, HasMetadata, ServiceModel, SoftDeletes;

    protected $appends = ['is_starred', 'url'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * The disk to use for storage operations.
     */
    private string $disk = 's3';

    /**
     * Get the folder this file belongs to (null = root).
     */
    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class, 'folder_id');
    }

    /**
     * Get a presigned URL for this file (accessible from the browser).
     *
     * Uses the external signing_url endpoint so the browser can resolve
     * the hostname and the signature matches. When accessed from a non-
     * localhost host (e.g. LAN IP or Tailscale), the signing URL auto-
     * adapts to use the request host with MinIO's exposed port so the
     * browser can reach MinIO from any device.
     */
    public function url(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->presignedUrl(),
        );
    }

    /**
     * Get a presigned URL that forces the browser to download the file
     * (Content-Disposition: attachment) instead of displaying it inline.
     */
    public function downloadUrl(): string
    {
        return $this->presignedUrl([
            'ResponseContentDisposition' => 'attachment; filename="' . rawurlencode($this->name) . '"',
        ]);
    }

    /**
     * Build a presigned GetObject URL for this file.
     *
     * Uses the external signing_url endpoint so the browser can resolve
     * the hostname and the signature matches. When accessed from a non-
     * localhost host (e.g. LAN IP or Tailscale), the signing URL auto-
     * adapts to use the request host with MinIO's exposed port so the
     * browser can reach MinIO from any device.
     *
     * @param  array<string, mixed>  $extra  Additional GetObject parameters
     *                                       (e.g. ResponseContentDisposition).
     */
    protected function presignedUrl(array $extra = []): string
    {
        $diskConfig = config("filesystems.disks.{$this->disk}");
        $signingUrl = $diskConfig['signing_url'] ?? null;
        $endpoint = $diskConfig['endpoint'] ?? null;

        // Auto-adapt signing URL for non-localhost access (LAN IP,
        // Tailscale, tunnel, etc.) so presigned URLs use the same
        // host the browser is connecting to.
        if ($signingUrl && app()->runningInConsole() === false) {
            $request = request();
            if ($request) {
                $requestHost = $request->getHost();
                $isLocalhost = str_contains($requestHost, 'localhost') || $requestHost === '127.0.0.1';

                if (! $isLocalhost) {
                    $minioPort = env('LOCAL_NOVA_MINIO_API_PORT', '9000');
                    $signingUrl = 'http://' . $requestHost . ':' . $minioPort;
                }
            }
        }

        if ($signingUrl && $endpoint) {
            $client = new \Aws\S3\S3Client([
                'region' => $diskConfig['region'],
                'version' => 'latest',
                'signature_version' => 'v4',
                'use_path_style_endpoint' => $diskConfig['use_path_style_endpoint'] ?? false,
                'credentials' => [
                    'key' => $diskConfig['key'],
                    'secret' => $diskConfig['secret'],
                ],
                'endpoint' => $signingUrl,
            ]);

            $ttl = (int) ($diskConfig['presigned_request_ttl'] ?? 5);

            $command = $client->getCommand('GetObject', array_merge([
                'Bucket' => $diskConfig['bucket'],
                'Key' => $this->path,
            ], $extra));

            return (string) $client->createPresignedRequest($command, now()->addMinutes($ttl))->getUri();
        }

        return Storage::disk($this->disk)->url($this->path);
    }

    /**
     * Get the category of this file.
     */
    public function category(): Attribute
    {
        return Attribute::make(
            get: fn () => FileCategory::tryFrom($this->__metadata['category'] ?? null)
        );
    }

    /**
     * Get the visibility of this file.
     */
    public function visibility(): Attribute
    {
        return Attribute::make(
            get: fn () => FileVisibility::tryFrom($this->__metadata['visibility'] ?? 'private')
        );
    }

    /**
     * Check if the file is starred.
     */
    public function isStarred(): Attribute
    {
        return Attribute::make(
            get: fn () => (bool) ($this->__metadata['is_starred'] ?? false)
        );
    }

    /**
     * Get the full S3 path including folder prefix.
     * This is the actual key used in S3/MinIO.
     */
    public function fullPath(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->folder) {
                    return $this->folder->full_path.$this->name;
                }

                return $this->created_by_id.'/'.$this->name;
            }
        );
    }

    /**
     * Get the breadcrumb path from root to the file's folder.
     */
    public function breadcrumbs(): array
    {
        if (! $this->folder) {
            return [];
        }

        return $this->folder->breadcrumbs();
    }

    /**
     * Scope to only include files in a specific folder (null = root).
     */
    public function scopeInFolder($query, ?string $folderId)
    {
        if ($folderId) {
            return $query->where('folder_id', $folderId);
        }

        return $query->whereNull('folder_id');
    }

    /**
     * Scope to only include files owned by a specific user.
     */
    public function scopeOwnedBy($query, Model $owner)
    {
        return $query->where('created_by_type', $owner->getMorphClass())
            ->where('created_by_id', $owner->getKey());
    }

    /**
     * Scope to only include starred files.
     */
    public function scopeStarred($query)
    {
        return $query->where('__metadata.is_starred', true);
    }

    /**
     * Scope to exclude soft-deleted files.
     * SoftDeletes trait already excludes trashed records by default,
     * so this is a no-op kept for explicitness.
     */
    public function scopeNotTrashed($query)
    {
        return $query;
    }
}
