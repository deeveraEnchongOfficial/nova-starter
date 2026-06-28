<?php

namespace App\Services\Core\User;

use App\Support\Database\Traits\BaseRepository;

class UserRepository
{
    use BaseRepository;

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function findVerifiedByEmail(string $email): ?User
    {
        return User::where('email', $email)->whereNotNull('email_verified_at')->first();
    }

    public function findById(string $id): ?User
    {
        return User::find($id);
    }
}
