<?php

namespace App\Support\Database\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use LogicException;

trait BelongsToATenant
{
    /**
     * This method adds a "saving" event listener to ensure that
     * a tenant is set before saving the model.
     *
     * @throws LogicException If tenant is not set
     */
    protected static function bootBelongsToATenant(): void
    {
        if (! config('features.multi_tenant', false)) {
            return;
        }

        static::saving(function (Model $model): void {
            if (empty($model->tenant_type) || empty($model->tenant_id)) {
                throw new LogicException('Tenant not set for model '.get_class($model));
            }
        });
    }

    /**
     * Get the tenant this model belongs to.
     */
    public function tenant(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope a query to only include models that belong to a specific tenant.
     */
    public function scopeByTenant($query, Model $tenant)
    {
        return $query->whereMorphedTo('tenant', $tenant);
    }
}
