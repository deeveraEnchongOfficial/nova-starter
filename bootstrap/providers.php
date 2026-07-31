<?php

use App\Providers\AppServiceProvider;
use App\Services\Core\Activity\ActivityServiceProvider;
use App\Services\Core\CoreServiceProvider;

return [
    AppServiceProvider::class,
    CoreServiceProvider::class,
    ActivityServiceProvider::class,
];
