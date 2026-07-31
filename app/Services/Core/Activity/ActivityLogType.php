<?php

namespace App\Services\Core\Activity;

enum ActivityLogType: string
{
    case CREATE = 'create';
    case UPDATE = 'update';
    case DELETE = 'delete';
    case LOGIN = 'login';
    case LOGOUT = 'logout';
    case REGISTER = 'register';
    case EXPORT = 'export';
    case DOWNLOAD = 'download';
    case SHARE = 'share';
    case RESTORE = 'restore';
    case UPLOAD = 'upload';

    public function label(): string
    {
        return match ($this) {
            self::CREATE => 'Created',
            self::UPDATE => 'Updated',
            self::DELETE => 'Deleted',
            self::LOGIN => 'Logged In',
            self::LOGOUT => 'Logged Out',
            self::REGISTER => 'Registered',
            self::EXPORT => 'Exported',
            self::DOWNLOAD => 'Downloaded',
            self::SHARE => 'Shared',
            self::RESTORE => 'Restored',
            self::UPLOAD => 'Uploaded',
        };
    }

    public static function fromHttpMethod(string $method): ?self
    {
        return match (strtoupper($method)) {
            'POST' => self::CREATE,
            'PUT', 'PATCH' => self::UPDATE,
            'DELETE' => self::DELETE,
            default => null,
        };
    }
}
