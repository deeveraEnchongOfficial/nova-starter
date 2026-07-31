<?php

namespace App\Services\Core\File;

enum SharePermission: string
{
    case VIEWER = 'viewer';
    case COMMENTER = 'commenter';
    case EDITOR = 'editor';

    /**
     * Get the display name for the share permission
     */
    public function label(): string
    {
        return match ($this) {
            self::VIEWER => 'Viewer',
            self::COMMENTER => 'Commenter',
            self::EDITOR => 'Editor',
        };
    }

    /**
     * Convert the enum to an array suitable for dropdown options
     */
    public static function toOptions(): array
    {
        return array_map(static function ($case) {
            return [
                'value' => $case->value,
                'label' => $case->label(),
            ];
        }, self::cases());
    }
}
