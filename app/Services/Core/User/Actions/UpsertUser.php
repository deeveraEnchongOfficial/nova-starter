<?php

namespace App\Services\Core\User\Actions;

use App\Services\Core\User\User;
use Illuminate\Database\Eloquent\Model;

class UpsertUser
{
    /**
     * Execute the action to update or create a user.
     */
    public function execute(
        User $user,
        string $firstName,
        ?string $middleName,
        ?string $lastName,
        string $email,
        ?Model $tenant = null,
        ?string $password = null,
        ?string $avatarFileId = null,
        array $metadata = [],
        ?Model $createdBy = null,
    ): User {
        // Update the user's information
        $userData = [
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'last_name' => $lastName,
            'email' => $email,
            'avatar_file_id' => $avatarFileId,
            '__metadata' => $metadata,
        ];

        if ($password !== null) {
            $userData['password'] = $password;
        }

        $user->forceFill($userData);

        if (config('features.multi_tenant', false) && $tenant) {
            // Associate the user with the tenant
            $user->tenant()->associate($tenant);
        }

        // Set the created_by if this is a new user
        if ((! $user->exists || ! $user->createdBy) && $createdBy) {
            $user->createdBy()->associate($createdBy);
        }

        $user->save();

        return $user;
    }
}
