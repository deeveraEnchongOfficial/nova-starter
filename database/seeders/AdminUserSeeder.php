<?php

namespace Database\Seeders;

use App\Services\Core\User\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@nova-starter.test'],
            [
                'name' => 'Super Admin',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        $admin->assignRole('Super Admin');
    }
}
