<?php

namespace App\Services;

use Illuminate\Support\Collection;

class NavigationService
{
    public function __construct(
        protected ModuleService $moduleService
    ) {}

    public function getNavigation(): array
    {
        $nav = config('navigation', []);

        return $this->filterNavigation($nav);
    }

    protected function filterNavigation(array $items): array
    {
        $result = [];

        foreach ($items as $item) {
            if (isset($item['route']) && $item['route'] !== null) {
                $moduleKey = $this->findModuleForRoute($item['route']);
                if ($moduleKey && ! $this->moduleService->isEnabled($moduleKey)) {
                    continue;
                }
            }

            if (isset($item['children']) && is_array($item['children'])) {
                $item['children'] = $this->filterNavigation($item['children']);
                if (empty($item['children'])) {
                    continue;
                }
            }

            $result[] = $item;
        }

        return $result;
    }

    protected function findModuleForRoute(string $route): ?string
    {
        $modules = $this->moduleService->all();

        foreach ($modules as $key => $module) {
            if (isset($module['route']) && $module['route'] === $route) {
                return $key;
            }
        }

        return null;
    }
}
