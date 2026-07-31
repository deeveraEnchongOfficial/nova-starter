<?php

namespace App\Services\Core\Activity\Listeners;

use App\Services\Core\Activity\Activity;
use App\Services\Core\Activity\ActivityLogType;
use Illuminate\Auth\Events\Logout;
use Illuminate\Http\Request;

class LogLogout
{
    public function __construct(
        protected Request $request,
    ) {}

    public function handle(Logout $event): void
    {
        if (! $event->user) {
            return;
        }

        Activity::log(
            type: ActivityLogType::LOGOUT,
            description: "User logged out ({$event->user->email})",
            causedBy: $event->user,
            ipAddress: $this->request->ip(),
            userAgent: $this->request->userAgent(),
            route: null,
            method: 'POST',
        );
    }
}
