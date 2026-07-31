<?php

namespace App\Services\Core\File;

enum FileCategory: string
{
    case DOCUMENTS = 'documents';
    case IMAGES = 'images';
    case TASKS = 'tasks';

    /**
     * Get the display name for the file category
     */
    public function label(): string
    {
        return match ($this) {
            self::DOCUMENTS => 'Documents',
            self::IMAGES => 'Images',
            self::TASKS => 'Tasks',
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
