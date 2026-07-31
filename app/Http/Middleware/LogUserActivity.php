<?php

namespace App\Http\Middleware;

use App\Services\Core\Activity\Activity;
use App\Services\Core\Activity\ActivityLogType;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route as RouteFacade;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    protected array $skipRoutes = [
        'dashboard',
        'profile.edit',
        'profile.update',
        'profile.destroy',
        'activity-logs.index',
        'activity-logs.show',
        'activity-logs.clear',
    ];

    protected array $skipMethods = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if (! config('features.activity_logs', true)) {
            return;
        }

        $user = $request->user();

        if (! $user) {
            return;
        }

        $method = $request->method();
        $routeName = $request->route()?->getName();

        if (in_array($routeName, $this->skipRoutes)) {
            return;
        }

        if (in_array($method, $this->skipMethods)) {
            return;
        }

        if ($response->getStatusCode() >= 400) {
            return;
        }

        // Skip validation redirects (302 with session errors)
        if ($response->getStatusCode() === 302 && session()->has('errors')) {
            return;
        }

        $type = ActivityLogType::fromHttpMethod($method);

        if (! $type) {
            return;
        }

        $subject = $this->resolveSubject($request);
        $description = $this->buildDescription($type, $routeName, $subject);

        Activity::log(
            type: $type,
            description: $description,
            subject: $subject,
            causedBy: $user,
            properties: $this->gatherProperties($request, $subject),
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
            route: $routeName,
            method: $method,
        );
    }

    protected function resolveSubject(Request $request): ?object
    {
        $route = $request->route();

        if (! $route) {
            return null;
        }

        $parameters = $route->parameters();

        foreach ($parameters as $param) {
            if (is_object($param) && method_exists($param, 'getKey')) {
                return $param;
            }
        }

        return null;
    }

    protected function buildDescription(ActivityLogType $type, ?string $routeName, ?object $subject): string
    {
        $action = $type->label();

        $resource = 'resource';
        if ($subject) {
            $resource = class_basename($subject);
            if (isset($subject->name)) {
                $resource .= " ({$subject->name})";
            } elseif (isset($subject->email)) {
                $resource .= " ({$subject->email})";
            }
        } elseif ($routeName) {
            // Strip 'v1.' prefix and convert dot notation to readable text
            $resource = str_replace('.', ' ', str_replace('v1.', '', $routeName));
        }

        return "{$action} {$resource}";
    }

    protected function gatherProperties(Request $request, ?object $subject): array
    {
        $properties = [];

        if ($subject) {
            $properties['subject_class'] = get_class($subject);
            $properties['subject_id'] = $subject->getKey();
        }

        $validated = $request->validated ?? null;
        if ($validated && is_array($validated)) {
            $properties['attributes'] = $validated;
        }

        return $properties;
    }
}
