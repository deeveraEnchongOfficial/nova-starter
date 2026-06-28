<?php

namespace App\Support\Database\Traits;

trait Unguarded
{
    /**
     * Boot the unguarded trait for a model.
     */
    protected static function bootUnguarded(): void
    {
        static::unguard();
    }
}
