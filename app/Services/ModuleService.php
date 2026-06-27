<?php

namespace App\Services;

use App\Models\Setting;

class ModuleService
{
    protected array $cache = [];

    public function __construct()
    {
        $this->load();
    }

    public function isEnabled(string $module): bool
    {
        return data_get($this->cache, "{$module}.enabled", false);
    }

    public function getModule(string $module): ?array
    {
        return data_get($this->cache, $module);
    }

    public function all(): array
    {
        return $this->cache;
    }

    public function enabled(): array
    {
        return array_filter($this->cache, fn ($m) => $m['enabled'] ?? false);
    }

    protected function load(): void
    {
        $config = config('modules', []);

        $dbOverrides = Setting::where('group', 'modules')->get();

        foreach ($dbOverrides as $setting) {
            $parts = explode('.', $setting->key, 3);

            if (count($parts) >= 2 && $parts[1] === 'enabled') {
                data_set($config, "{$parts[0]}.enabled", $setting->getTypedValue());
            }
        }

        $this->cache = $config;
    }
}
