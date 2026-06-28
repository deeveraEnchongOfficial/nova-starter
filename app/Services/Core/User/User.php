<?php

namespace App\Services\Core\User;

use App\Support\Database\Traits\BelongsToATenant;
use App\Support\Database\Traits\HasCreatedBy;
use App\Support\Database\Traits\ServiceModel;
use App\Support\Database\Traits\Unguarded;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * @mixin IdeHelperUser
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use BelongsToATenant, HasApiTokens, HasCreatedBy, HasFactory, HasRoles, Notifiable, ServiceModel, Unguarded;

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<string>
     */
    protected $appends = ['name'];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'status' => UserStatus::class,
        'is_admin' => 'boolean',
    ];

    public function name(): Attribute
    {
        return Attribute::make(
            get: fn () => trim(collect([$this->first_name, $this->middle_name, $this->last_name])
                ->filter()
                ->implode(' ')),
        );
    }

    public function getLoginType(): UserLoginType
    {
        return UserLoginType::PASSWORD;
    }

    public function markAsVerified(): static
    {
        $this->email_verified_at = $this->freshTimestamp();

        return $this;
    }

    public function isVerified(): bool
    {
        return $this->email_verified_at !== null;
    }

    public function isBlocked(): bool
    {
        return $this->status === UserStatus::BLOCKED;
    }

    public function isLocked(): bool
    {
        return $this->status === UserStatus::LOCKED;
    }
}
