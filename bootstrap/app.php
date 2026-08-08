<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\LogUserActivity::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\LogUserActivity::class,
        ]);

        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'permission' => \App\Http\Middleware\CheckPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Render Inertia error pages for HTTP errors on web routes
        $exceptions->render(function (HttpException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return null;
            }

            $statusCode = $e->getStatusCode();
            $page = match ($statusCode) {
                403 => 'Errors/403',
                404 => 'Errors/404',
                500 => 'Errors/500',
                default => null,
            };

            if ($page) {
                return Inertia::render($page, [
                    'status' => $statusCode,
                    'message' => $e->getMessage(),
                ])
                    ->toResponse($request)
                    ->setStatusCode($statusCode);
            }

            return null;
        });
    })->create();
