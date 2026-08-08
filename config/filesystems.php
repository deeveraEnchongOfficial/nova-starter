<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Storage Capacity
    |--------------------------------------------------------------------------
    |
    | The total storage capacity in bytes available to users. This is used
    | by the dashboard storage widget to show usage vs. available space.
    | Set to null to hide the capacity bar and only show used space.
    | Default: 50 GB
    |
    */
    'storage_capacity' => env('STORAGE_CAPACITY', 50 * 1024 * 1024 * 1024),

    /*
    |--------------------------------------------------------------------------
    | Upload Purposes
    |--------------------------------------------------------------------------
    |
    | Defines the allowed upload purposes with their configuration:
    | - allowed_types: array of MIME types, or ['*'] for all
    | - visibility: S3 object visibility (public-read or private)
    | - listable: whether the file appears in file listings
    | - max_size: max file size in bytes, or '*' for unlimited
    |
    */
    'upload_purposes' => [
        'avatar' => [
            'allowed_types' => [
                'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
            ],
            'visibility' => 'public-read',
            'max_size' => 1024 * 1024 * 5, // 5MB
        ],
        'logo' => [
            'allowed_types' => [
                'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp',
            ],
            'visibility' => 'public-read',
            'max_size' => 1024 * 1024 * 2, // 2MB
        ],
        'document' => [
            'allowed_types' => ['*'],
            'visibility' => 'public-read',
            'listable' => true,
            'max_size' => '*', // Unlimited file size
        ],
        'default' => [
            'allowed_types' => ['*'],
            'visibility' => 'public-read',
            'listable' => true,
            'max_size' => env('FILE_UPLOAD_MAX_SIZE', 1024 * 1024 * 1024), // 1GB
        ],
        'product_images' => [
            'allowed_types' => [
                'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
            ],
            'visibility' => 'public-read',
            'max_size' => 1024 * 1024 * 5, // 5MB
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'signing_url' => env('AWS_SIGNING_URL'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
            'presigned_request_ttl' => env('AWS_PRESIGNED_REQUEST_TTL', 120), // in minutes (2hr default for large uploads)
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
