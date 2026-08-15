<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Adds compound indexes on (tenant_type, tenant_id) to all tenant-aware
 * collections in the core database to speed up the scopeTenantAware() filter.
 *
 * When FEATURE_MULTI_TENANT is enabled, every query on these collections is
 * scoped by tenant_type + tenant_id. Without an index, MongoDB does a
 * collection scan on every request.
 *
 * Collections indexed:
 *   - users, files, folders, shares, settings, activities, roles, permissions
 *
 * Note: This migration is a no-op when the collections don't exist yet
 * (fresh install). MongoDB creates collections lazily on first insert.
 */
return new class extends Migration
{
    private const CORE_COLLECTIONS = [
        'users',
        'files',
        'folders',
        'shares',
        'settings',
        'activities',
        'roles',
        'permissions',
    ];

    private const PRIMARY_COLLECTIONS = [
        'sessions',
        'cache',
        'jobs',
        'job_batches',
        'failed_jobs',
    ];

    public function up(): void
    {
        $appName = strtolower(config('app.name', 'nova-starter'));
        $env = config('app.env', 'local');

        $coreDb = "{$appName}_{$env}_core";
        $primaryDb = "{$appName}_{$env}_primary";

        $coreClient = DB::connection('core')->getDatabase();
        $primaryClient = DB::connection('primary')->getDatabase();

        foreach (self::CORE_COLLECTIONS as $collection) {
            $this->ensureTenantIndex($coreClient->selectCollection($collection));
        }

        // sessions/cache/jobs in primary DB are also tenant-aware
        foreach (self::PRIMARY_COLLECTIONS as $collection) {
            $this->ensureTenantIndex($primaryClient->selectCollection($collection));
        }
    }

    public function down(): void
    {
        $appName = strtolower(config('app.name', 'nova-starter'));
        $env = config('app.env', 'local');

        $coreDb = "{$appName}_{$env}_core";
        $primaryDb = "{$appName}_{$env}_primary";

        $coreClient = DB::connection('core')->getDatabase();
        $primaryClient = DB::connection('primary')->getDatabase();

        foreach (self::CORE_COLLECTIONS as $collection) {
            $this->dropTenantIndex($coreClient->selectCollection($collection));
        }

        foreach (self::PRIMARY_COLLECTIONS as $collection) {
            $this->dropTenantIndex($primaryClient->selectCollection($collection));
        }
    }

    private function ensureTenantIndex($collection): void
    {
        $existing = collect($collection->listIndexes())
            ->pluck('name')
            ->toArray();

        if (! in_array('tenant_type_tenant_id_index', $existing)) {
            $collection->createIndex(
                ['tenant_type' => 1, 'tenant_id' => 1],
                ['name' => 'tenant_type_tenant_id_index', 'sparse' => true]
            );
        }
    }

    private function dropTenantIndex($collection): void
    {
        $existing = collect($collection->listIndexes())
            ->pluck('name')
            ->toArray();

        if (in_array('tenant_type_tenant_id_index', $existing)) {
            $collection->dropIndex('tenant_type_tenant_id_index');
        }
    }
};
