<?php

namespace App\Services;

use App\Models\Setting;

class BrandingService
{
    protected array $cache = [];

    public function __construct()
    {
        $this->load();
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return data_get($this->cache, $key, $default);
    }

    public function all(): array
    {
        return $this->cache;
    }

    protected function load(): void
    {
        $config = config('branding', []);

        $dbOverrides = Setting::where('group', 'branding')->get();

        foreach ($dbOverrides as $setting) {
            $key = $setting->key;
            $value = $setting->getTypedValue();

            if (str_contains($key, '.')) {
                data_set($config, $key, $value);
            } else {
                $config[$key] = $value;
            }
        }

        $this->cache = $config;
    }
}
