<?php

return [
    'users' => [
        'enabled' => env('MODULE_USERS_ENABLED', true),
        'label' => 'User Management',
        'icon' => 'Users',
        'route' => 'users.index',
        'permission' => 'users.view',
    ],

    'roles' => [
        'enabled' => env('MODULE_ROLES_ENABLED', true),
        'label' => 'Roles & Permissions',
        'icon' => 'ShieldCheck',
        'route' => 'roles.index',
        'permission' => 'roles.view',
    ],

    'settings' => [
        'enabled' => env('MODULE_SETTINGS_ENABLED', true),
        'label' => 'Settings',
        'icon' => 'Settings',
        'route' => 'settings.index',
        'permission' => 'settings.view',
    ],

    'activity-logs' => [
        'enabled' => env('MODULE_ACTIVITY_LOGS_ENABLED', true),
        'label' => 'Activity Logs',
        'icon' => 'ScrollText',
        'route' => 'activity-logs.index',
        'permission' => 'activity-logs.view',
    ],

    'ai-bot' => [
        'enabled' => env('MODULE_AI_BOT_ENABLED', true),
        'label' => 'AI Assistant',
        'icon' => 'Bot',
        'route' => null,
        'permission' => 'ai-bot.view',
    ],
];
