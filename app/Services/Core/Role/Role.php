<?php

namespace App\Services\Core\Role;

use App\Support\Database\Traits\BelongsToATenant;
use App\Support\Database\Traits\ServiceModel;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use BelongsToATenant, ServiceModel;
}
