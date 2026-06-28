<?php

namespace App\Services\Core\User;

enum UserStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case BLOCKED = 'blocked';
    case LOCKED = 'locked';
}
