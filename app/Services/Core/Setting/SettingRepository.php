<?php

namespace App\Services\Core\Setting;

use App\Support\Database\Traits\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class SettingRepository
{
    use BaseRepository;

    public function findByKey(string $key): ?Setting
    {
        return Setting::tenantAware()->where('key', $key)->first();
    }

    public function findAll(): Collection
    {
        return Setting::tenantAware()
            ->orderBy('group')
            ->orderBy('key')
            ->get();
    }

    public function findByGroup(string $group): Collection
    {
        return Setting::tenantAware()
            ->where('group', $group)
            ->orderBy('key')
            ->get();
    }

    public function findPublic(): Collection
    {
        return Setting::tenantAware()
            ->where('is_public', true)
            ->orderBy('group')
            ->orderBy('key')
            ->get();
    }
}
