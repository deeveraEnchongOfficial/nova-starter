<?php

declare(strict_types=1);

namespace App\Support\Database\Traits;

trait HasMetadata
{
    public function replaceMetadata(array $metadata): static
    {
        $this->forceFill(['__metadata' => $metadata]);

        return $this;
    }

    /**
     * Set metadata value for a given key.
     * If value is null, the key will be removed from metadata.
     */
    public function setMetadata(string|array $key, mixed $value = null): static
    {
        $metadata = $this->metadata ?? [];

        if (is_array($key)) {
            $metadata = array_merge($metadata, $key);
        } else {
            if ($value === null) {
                unset($metadata[$key]);
            } else {
                $metadata[$key] = value($value);
            }
        }

        $this->forceFill(['__metadata' => $metadata]);

        return $this;
    }

    /**
     * Get metadata value for a given key.
     * Returns default value if key doesn't exist.
     */
    public function getMetadata(string|array|null $key = null, mixed $default = null): mixed
    {
        return match (true) {
            is_null($key) => $this->__metadata ?? [],
            is_array($key) => array_map(fn ($k) => $this->getMetadata($k, $default), $key),
            default => ($this->__metadata ?? [])[$key] ?? value($default),
        };
    }
}
