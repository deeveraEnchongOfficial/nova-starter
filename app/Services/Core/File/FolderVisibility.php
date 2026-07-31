<?php

namespace App\Services\Core\File;

enum FolderVisibility: string
{
    case PRIVATE = 'private';
    case SHARED = 'shared';
    case PUBLIC = 'public';

    /**
     * Get the display name for the visibility level
     */
    public function label(): string
    {
        return match ($this) {
            self::PRIVATE => 'Private',
            self::SHARED => 'Shared',
            self::PUBLIC => 'Public',
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
