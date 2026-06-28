<?php

namespace App\Support\Database\Traits;

trait ForceMake
{
    public static function forceMake(array $attributes): self
    {
        return (new static)->forceFill($attributes);
    }
}
