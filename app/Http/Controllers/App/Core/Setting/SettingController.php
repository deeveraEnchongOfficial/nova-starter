<?php

namespace App\Http\Controllers\App\Core\Setting;

use App\Services\Core\Setting\Setting;
use App\Services\ModuleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::orderBy('group')->orderBy('key')->get();

        $grouped = $settings->groupBy('group')->map(function ($items) {
            return $items->mapWithKeys(function ($item) {
                return [$item->key => $item->getTypedValue()];
            });
        });

        return Inertia::render('Settings/Index', [
            'settings' => $grouped,
            'modules' => app(ModuleService::class)->all(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable'],
            'settings.*.type' => ['required', 'string', 'in:string,boolean,integer,float,json,array'],
            'settings.*.group' => ['required', 'string'],
            'settings.*.is_public' => ['boolean'],
        ]);

        foreach ($validated['settings'] as $setting) {
            Setting::set(
                $setting['key'],
                $setting['value'],
                $setting['type'],
                $setting['group'],
                $setting['is_public'] ?? false,
            );
        }

        return redirect()->route('settings.index')
            ->with('message', 'Settings updated successfully.');
    }

    public function updateModules(Request $request)
    {
        $validated = $request->validate([
            'modules' => ['required', 'array'],
            'modules.*' => ['boolean'],
        ]);

        foreach ($validated['modules'] as $key => $enabled) {
            Setting::set(
                "modules.{$key}.enabled",
                $enabled,
                'boolean',
                'modules',
                false,
            );
        }

        return redirect()->route('settings.index')
            ->with('message', 'Modules updated successfully.');
    }
}
