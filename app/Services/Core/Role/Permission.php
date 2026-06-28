<?php

namespace App\Services\Core\Role;

use App\Support\Database\Traits\BelongsToATenant;
use App\Support\Database\Traits\ServiceModel;
use Spatie\Permission\Models\Permission as SpatiePermission;

class Permission extends SpatiePermission
{
    use BelongsToATenant, ServiceModel;
}
