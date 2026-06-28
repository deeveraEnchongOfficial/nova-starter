<?php

namespace App\Services\Core\Organization;

use App\Services\Core\User\User;
use App\Support\Database\Traits\HasCreatedBy;
use App\Support\Database\Traits\ServiceModel;
use App\Support\Database\Traits\Unguarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @mixin IdeHelperOrganization
 */
class Organization extends Model
{
    /** @use HasFactory<\Database\Factories\OrganizationFactory> */
    use HasCreatedBy, HasFactory, ServiceModel, Unguarded;

    protected $casts = [
        'status' => OrganizationStatus::class,
        'is_active' => 'boolean',
    ];

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_users', 'organization_id', 'user_id');
    }
}
