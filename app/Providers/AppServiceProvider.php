<?php

namespace App\Providers;

use App\Services\BrandingService;
use App\Services\ModuleService;
use App\Services\NavigationService;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(BrandingService::class);
        $this->app->singleton(ModuleService::class);
        $this->app->singleton(NavigationService::class);
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
