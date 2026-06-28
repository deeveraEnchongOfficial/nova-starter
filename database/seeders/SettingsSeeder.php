<?php

namespace Database\Seeders;

use App\Services\Core\Setting\Setting;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(?Model $tenant = null): void
    {
        $branding = config('branding');

        Setting::set('name', $branding['name'], 'string', 'branding', true, $tenant);
        Setting::set('short_name', $branding['short_name'], 'string', 'branding', true, $tenant);
        Setting::set('tagline', $branding['tagline'], 'string', 'branding', true, $tenant);
        Setting::set('logo', $branding['logo'] ?? '', 'string', 'branding', true, $tenant);
        Setting::set('logo_dark', $branding['logo_dark'] ?? '', 'string', 'branding', true, $tenant);

        $modules = config('modules', []);
        foreach ($modules as $key => $module) {
            Setting::set("modules.{$key}.enabled", $module['enabled'], 'boolean', 'modules', false, $tenant);
        }
    }
}
