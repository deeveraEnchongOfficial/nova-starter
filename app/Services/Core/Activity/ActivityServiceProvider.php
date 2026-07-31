<?php

namespace App\Services\Core\Activity;

use App\Services\Core\Activity\Listeners\LogLogin;
use App\Services\Core\Activity\Listeners\LogLogout;
use App\Services\Core\Activity\Listeners\LogRegistered;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Registered;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class ActivityServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Relation::morphMap([
            'core.activity' => Activity::class,
        ]);

        Event::listen(Login::class, LogLogin::class);
        Event::listen(Logout::class, LogLogout::class);
        Event::listen(Registered::class, LogRegistered::class);
    }
}
