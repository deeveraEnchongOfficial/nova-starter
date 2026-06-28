<?php

namespace App\Services\Core\PersonalAccessToken;

use App\Support\Database\Traits\ServiceModel;
use App\Support\Database\Traits\Unguarded;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

/**
 * @mixin IdeHelperPersonalAccessToken
 */
class PersonalAccessToken extends SanctumPersonalAccessToken
{
    use ServiceModel, Unguarded;

    /**
     * Indicates if the model's ID is auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The data type of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';
}
