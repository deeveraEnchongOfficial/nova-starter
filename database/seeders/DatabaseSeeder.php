<?php

namespace Database\Seeders;

use App\Services\Core\Organization\Organization;
use App\Services\Core\Organization\OrganizationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = null;

        if (config('features.multi_tenant', false)) {
            $tenant = Organization::updateOrCreate(
                ['name' => 'Default Organization'],
                [
                    'status' => OrganizationStatus::ACTIVE,
                    'is_active' => true,
                ],
            );
        }

        if ($tenant) {
            (new RolePermissionSeeder)->run($tenant);
            (new AdminUserSeeder)->run($tenant);
            (new SettingsSeeder)->run($tenant);
        } else {
            (new RolePermissionSeeder)->run();
            (new AdminUserSeeder)->run();
            (new SettingsSeeder)->run();
        }
    }
}
