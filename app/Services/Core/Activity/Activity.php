<?php

namespace App\Services\Core\Activity;

use App\Support\Database\Traits\BelongsToATenant;
use App\Support\Database\Traits\HasCreatedBy;
use App\Support\Database\Traits\ServiceModel;
use App\Support\Database\Traits\Unguarded;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Activity extends Model
{
    use BelongsToATenant, HasCreatedBy, ServiceModel, Unguarded;

    protected $casts = [
        'type' => ActivityLogType::class,
        'properties' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public static function log(
        ActivityLogType $type,
        string $description,
        Model|Authenticatable|null $subject = null,
        Model|Authenticatable|null $causedBy = null,
        array $properties = [],
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $route = null,
        ?string $method = null,
    ): static {
        if (! config('features.activity_logs', true)) {
            return new static;
        }

        $activity = new static;
        $activity->forceFill([
            'type' => $type,
            'description' => $description,
            'properties' => $properties,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'route' => $route,
            'method' => $method,
        ]);

        if ($subject) {
            $activity->subject()->associate($subject);
        }

        if ($causedBy) {
            $activity->createdBy()->associate($causedBy);
        }

        if (config('features.multi_tenant', false) && $causedBy && $causedBy->tenant_id && $causedBy->tenant_type) {
            $activity->tenant()->associate($causedBy->tenant);
        }

        $activity->save();

        return $activity;
    }
}
