<?php

namespace App\Services\Core\Activity\Listeners;

use App\Services\Core\Activity\Activity;
use App\Services\Core\Activity\ActivityLogType;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;

class LogRegistered
{
    public function __construct(
        protected Request $request,
    ) {}

    public function handle(Registered $event): void
    {
        Activity::log(
            type: ActivityLogType::REGISTER,
            description: "New user registered ({$event->user->email})",
            subject: $event->user,
            causedBy: $event->user,
            ipAddress: $this->request->ip(),
            userAgent: $this->request->userAgent(),
            route: 'register',
            method: 'POST',
        );
    }
}
