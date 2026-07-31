<?php

namespace App\Services\Core\Activity\Listeners;

use App\Services\Core\Activity\Activity;
use App\Services\Core\Activity\ActivityLogType;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;

class LogLogin
{
    public function __construct(
        protected Request $request,
    ) {}

    public function handle(Login $event): void
    {
        Activity::log(
            type: ActivityLogType::LOGIN,
            description: "User logged in ({$event->user->email})",
            causedBy: $event->user,
            ipAddress: $this->request->ip(),
            userAgent: $this->request->userAgent(),
            route: null,
            method: 'POST',
        );
    }
}
