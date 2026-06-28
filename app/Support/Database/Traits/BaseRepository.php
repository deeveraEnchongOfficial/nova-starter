<?php

namespace App\Support\Database\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use MongoDB\Laravel\Eloquent\Builder;
use ReflectionClass;

trait BaseRepository
{
    /**
     * Paginate results with search functionality.
     */
    public function paginateWithSearch(
        Model $tenant,
        int $page = 1,
        int $perPage = 15,
        ?string $search = null,
        array $searchFields = ['name'],
        array $with = [],
        array $select = ['*'],
    ): LengthAwarePaginator {
        $query = $this->getModelClass()::byTenant($tenant)->with($with);

        if ($search && ! empty($searchFields)) {
            $query->where(function (Builder $query) use ($search, $searchFields): void {
                foreach ($searchFields as $field) {
                    // Use regex for MongoDB text search instead of LIKE operator
                    $query->orWhere($field, 'regex', '/'.preg_quote($search, '/').'/i');
                }
            });
        }

        return $query->latest()->paginate($perPage, $select, 'page', $page);
    }

    /**
     * Get the model class associated with this repository.
     */
    protected function getModelClass(): string
    {
        // Default implementation based on naming convention
        // Example: ContactRepository -> Contact
        $className = class_basename($this);
        $modelName = str_replace('Repository', '', $className);

        // Get namespace of the current repository
        // In The Sales Machine architecture, models are in the same namespace as their repositories
        $namespace = (new ReflectionClass($this))->getNamespaceName();

        return "{$namespace}\\{$modelName}";
    }
}
