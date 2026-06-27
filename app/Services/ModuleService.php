<?php

namespace App\Services;

use App\Services\Core\Setting\Setting;

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

        try {
            $dbOverrides = Setting::where('group', 'modules')->get();

            foreach ($dbOverrides as $setting) {
                $parts = explode('.', $setting->key, 3);

                if (count($parts) === 3 && $parts[0] === 'modules' && $parts[2] === 'enabled') {
                    data_set($config, "{$parts[1]}.enabled", $setting->getTypedValue());
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('ModuleService: Failed to load settings from DB', [
                'error' => $e->getMessage(),
            ]);
        }

        $this->cache = $config;
    }
}
