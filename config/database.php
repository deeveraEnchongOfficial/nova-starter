<?php

use Illuminate\Support\Str;
use Pdo\Mysql;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for database operations. This is
    | the connection which will be utilized unless another connection
    | is explicitly specified when you execute a query / statement.
    |
    */

    'default' => env('DB_CONNECTION', 'primary'),

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Below are all of the database connections defined for your application.
    | An example configuration is provided for each database system which
    | is supported by Laravel. You're free to add / remove connections.
    |
    */

    'connections' => [

        /*
        | The primary database connection
        */
        'primary' => [
            'driver' => 'mongodb',
            'dsn' => env('DB_DSN', 'mongodb://127.0.0.1:27017'),
            'database' => env('DB_PRIMARY_DATABASE', Str::lower(env('APP_NAME', 'nova-starter')).'_'.env('APP_ENV').'_primary'),
            'username' => env('DB_USERNAME', ''),
            'password' => env('DB_PASSWORD', ''),
            'options' => [
                'appName' => env('APP_NAME').'_'.env('APP_ENV'),
            ],
        ],

        /*
        | The cache database connection
        */
        'cache' => [
            'driver' => 'mongodb',
            'dsn' => env('DB_CACHE_DSN', env('DB_DSN', 'mongodb://127.0.0.1:27017')),
            'database' => env('DB_CACHE_DATABASE', Str::lower(env('APP_NAME', 'nova-starter')).'_'.env('APP_ENV').'_cache'),
            'username' => env('DB_CACHE_USERNAME', env('DB_USERNAME', '')),
            'password' => env('DB_CACHE_PASSWORD', env('DB_PASSWORD', '')),
            'options' => [
                'appName' => env('APP_NAME').'_'.env('APP_ENV'),
            ],
        ],

        'core' => [
            'driver' => 'mongodb',
            'dsn' => env('DB_CORE_SERVICE_DSN', env('DB_DSN', 'mongodb://127.0.0.1:27017')),
            'database' => env('DB_CORE_SERVICE_DATABASE', Str::lower(env('APP_NAME', 'nova-starter')).'_'.env('APP_ENV').'_core'),
            'username' => env('DB_CORE_SERVICE_USERNAME', env('DB_USERNAME', '')),
            'password' => env('DB_CORE_SERVICE_PASSWORD', env('DB_PASSWORD', '')),
            'options' => [
                'appName' => env('APP_NAME').'_'.env('APP_ENV'),
            ],
        ],

        // 'portfolio' => [
        //     'driver' => 'mongodb',
        //     'dsn' => env('DB_PORTFOLIO_SERVICE_DSN', env('DB_DSN', 'mongodb://127.0.0.1:27017')),
        //     'database' => env('DB_PORTFOLIO_SERVICE_DATABASE', Str::lower(env('APP_NAME', 'nova-starter')).'_'.env('APP_ENV').'_portfolio'),
        //     'username' => env('DB_PORTFOLIO_SERVICE_USERNAME', env('DB_USERNAME', '')),
        //     'password' => env('DB_PORTFOLIO_SERVICE_PASSWORD', env('DB_PASSWORD', '')),
        //     'options' => [
        //         'appName' => env('APP_NAME').'_'.env('APP_ENV'),
        //     ],
        // ],


        'mongodb' => [
            'driver' => 'mongodb',
            'dsn' => env('DB_DSN'),
            'database' => env('DB_DATABASE', 'cluster'),
            'options' => [
                'database' => env('DB_AUTH_DATABASE', 'admin'),
                'username' => env('DB_USERNAME'),
                'password' => env('DB_PASSWORD'),
            ],
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    |
    | This table keeps track of all the migrations that have already run for
    | your application. Using this information, we can determine which of
    | the migrations on disk haven't actually been run on the database.
    |
    */

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    |
    | Redis is an open source, fast, and advanced key-value store that also
    | provides a richer body of commands than a typical key-value system
    | such as Memcached. You may define your connection settings here.
    |
    */

    'redis' => [

        'client' => env('REDIS_CLIENT', 'phpredis'),

        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', Str::slug((string) env('APP_NAME', 'laravel')).'-database-'),
            'persistent' => env('REDIS_PERSISTENT', false),
        ],

        'default' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
            'max_retries' => env('REDIS_MAX_RETRIES', 3),
            'backoff_algorithm' => env('REDIS_BACKOFF_ALGORITHM', 'decorrelated_jitter'),
            'backoff_base' => env('REDIS_BACKOFF_BASE', 100),
            'backoff_cap' => env('REDIS_BACKOFF_CAP', 1000),
        ],

        'cache' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '1'),
            'max_retries' => env('REDIS_MAX_RETRIES', 3),
            'backoff_algorithm' => env('REDIS_BACKOFF_ALGORITHM', 'decorrelated_jitter'),
            'backoff_base' => env('REDIS_BACKOFF_BASE', 100),
            'backoff_cap' => env('REDIS_BACKOFF_CAP', 1000),
        ],

    ],

];
