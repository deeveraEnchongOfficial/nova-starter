<?php

namespace Database\Seeders;

use App\Services\Core\Role\Role;
use App\Services\Core\User\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(?Model $tenant = null): void
    {
        $data = [
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'password' => 'password',
            'email_verified_at' => now(),
        ];

        if ($tenant) {
            $data['tenant_type'] = 'core.organization';
            $data['tenant_id'] = $tenant->getKey();
        }

        $admin = User::updateOrCreate(
            ['email' => 'admin@nova-starter.test'],
            $data,
        );

        $admin->assignRole('Super Admin');
    }
}
