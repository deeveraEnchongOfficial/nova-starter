<?php

namespace App\Support;

use App\Support\Mixins\RedirectResponseMixin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\ServiceProvider;

class SupportServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        RedirectResponse::mixin(new RedirectResponseMixin);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
