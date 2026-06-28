<?php

namespace App\Support\Database\Traits;

trait HasStringId
{
    /**
     * Boot the trait.
     */
    protected static function bootHasStringId(): void
    {
        static::creating(function ($model): void {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = static::generateUniqueId();
            }
        });
    }

    /**
     * Generate a unique ID using current time and random bytes.
     *
     * Format: {timestampHex}{randomHex}
     * - timestampHex: Current time in milliseconds (hex)
     * - randomHex: 10 random hex characters
     *
     * Helps avoid ID collisions on fast inserts.
     */
    protected static function generateUniqueId(): string
    {
        $micro = (int) (microtime(true) * 1000); // milliseconds
        $timestampHex = dechex($micro);

        // 5 random bytes = 10 hex characters
        $randomStr = bin2hex(random_bytes(5));

        return $timestampHex.$randomStr;
    }

    /**
     * Get the auto-incrementing key type.
     *
     * @return string
     */
    public function getKeyType()
    {
        return 'string';
    }

    /**
     * Get the value indicating whether the IDs are incrementing.
     *
     * @return bool
     */
    public function getIncrementing()
    {
        return false;
    }
}
