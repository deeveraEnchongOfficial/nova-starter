<?php

namespace App\Services\Core\Activity\Actions;

use App\Services\Core\Activity\Activity;
use App\Services\Core\Activity\ActivityLogType;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;

class LogActivity
{
    public function execute(
        ActivityLogType $type,
        string $description,
        Model|Authenticatable|null $subject = null,
        Model|Authenticatable|null $causedBy = null,
        array $properties = [],
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $route = null,
        ?string $method = null,
    ): Activity {
        return Activity::log(
            $type,
            $description,
            $subject,
            $causedBy,
            $properties,
            $ipAddress,
            $userAgent,
            $route,
            $method,
        );
    }
}
