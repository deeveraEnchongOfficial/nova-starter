<?php

return [
    'name' => env('APP_NAME', 'Nova Starter'),
    'short_name' => env('APP_SHORT_NAME', 'Nova'),
    'tagline' => env('APP_TAGLINE', 'Build faster, ship smarter.'),
    'logo' => env('APP_LOGO', null),
    'logo_dark' => env('APP_LOGO_DARK', null),
    'favicon' => env('APP_FAVICON', null),

    'theme' => [
        'default_mode' => env('APP_THEME_MODE', 'light'),
        'primary_color' => env('APP_PRIMARY_COLOR', 'neutral'),
        'radius' => env('APP_THEME_RADIUS', '0.625rem'),
    ],

    'layout' => [
        'sidebar_collapsible' => true,
        'sidebar_default_open' => true,
        'header_sticky' => true,
    ],
];
