<?php

namespace App\Services\Core;


use App\Services\Core\Organization\Organization;
use App\Services\Core\PersonalAccessToken\PersonalAccessToken;
use App\Services\Core\User\User;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Relation::morphMap([
            'core.user' => User::class,
            'core.organization' => Organization::class,
        ]);
    }
}
