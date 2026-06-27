<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        if (! $request->user()) {
            abort(403, __('Unauthorized action.'));
        }

        $permissions = collect($permissions)
            ->flatMap(fn ($permission) => explode('|', $permission))
            ->unique()
            ->all();

        foreach ($permissions as $permission) {
            if ($request->user()->can($permission)) {
                return $next($request);
            }
        }

        abort(403, __('You do not have permission to access this resource.'));
    }
}
