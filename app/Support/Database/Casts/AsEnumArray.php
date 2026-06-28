<?php

namespace App\Support\Database\Casts;

use BackedEnum;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class AsEnumArray implements CastsAttributes
{
    public function __construct(
        protected string $enumClass
    ) {}

    /**
     * Cast the given value.
     *
     * @param  array<array-key, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if (is_null($value)) {
            return [];
        }

        return array_map(
            fn ($item) => $this->enumClass::from($item),
            $value
        );
    }

    /**
     * Prepare the given value for storage.
     *
     * @param  array<array-key, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        if (is_null($value)) {
            return [$key => []];
        }

        $transformed = collect($value)
            ->map(function ($item) {
                if ($item instanceof BackedEnum) {
                    return $item->value;
                }
                if (is_string($item)) {
                    $enum = $this->enumClass::tryFrom($item);

                    return $enum?->value;
                }

                return null;
            })
            ->filter()
            ->values()
            ->toArray();

        return [$key => $transformed];
    }

    public static function of(string $enumClass): string
    {
        return static::class.':'.$enumClass;
    }
}
