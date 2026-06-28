<?php

namespace App\Support\Database\Traits;

use Illuminate\Support\Str;
use MongoDB\Laravel\Eloquent\DocumentModel;
use ReflectionClass;

trait ServiceModel
{
    use DocumentModel, ForceMake, HasStringId, Unguarded;

    /**
     * Get the database connection for the model.
     * Automatically determines connection based on service name.
     * For example: Core service models use the 'core' connection.
     */
    public function getConnectionName(): ?string
    {
        if (isset($this->connection)) {
            return $this->connection;
        }

        // Get the full class name and split it into parts
        $reflection = new ReflectionClass($this);
        $namespace = $reflection->getNamespaceName();

        // Extract service name from namespace (e.g., "Core" from "App\Services\Core\...")
        preg_match('/App\\\\Services\\\\([^\\\\]+)/', $namespace, $matches);
        $serviceName = $matches[1] ?? '';

        // Convert service name to snake case for connection name

        // \Log::info([
        //     'reflection' => $reflection,
        //     'namespace' => $namespace,
        //     'service_name' => $serviceName,
        //     'connection' => Str::snake($serviceName),
        // ]);

        return Str::snake($serviceName);
    }
}
