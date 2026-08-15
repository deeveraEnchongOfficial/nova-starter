<?php

use App\Providers\AppServiceProvider;
use App\Services\Core\Activity\ActivityServiceProvider;
use App\Services\Core\CoreServiceProvider;
use App\Support\SupportServiceProvider;

return [
    AppServiceProvider::class,
    CoreServiceProvider::class,
    ActivityServiceProvider::class,
    SupportServiceProvider::class,
];
