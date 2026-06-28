<?php

namespace App\Services\Core\Setting;

use App\Support\Database\Traits\BelongsToATenant;
use App\Support\Database\Traits\ServiceModel;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use BelongsToATenant, ServiceModel;

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    public function getTypedValue(): mixed
    {
        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $this->value,
            'float' => (float) $this->value,
            'json' => json_decode($this->value, true),
            'array' => json_decode($this->value, true),
            default => $this->value,
        };
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        if (! $setting) {
            return $default;
        }

        return $setting->getTypedValue();
    }

    public static function set(string $key, mixed $value, string $type = 'string', string $group = 'general', bool $isPublic = false, ?Model $tenant = null): void
    {
        $encoded = match ($type) {
            'boolean' => $value ? '1' : '0',
            'json', 'array' => json_encode($value),
            default => (string) $value,
        };

        $data = ['value' => $encoded, 'type' => $type, 'group' => $group, 'is_public' => $isPublic];

        if ($tenant) {
            $data['tenant_type'] = 'core.organization';
            $data['tenant_id'] = $tenant->getKey();
        }

        static::updateOrCreate(
            ['key' => $key],
            $data
        );
    }
}
