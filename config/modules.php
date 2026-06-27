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
];
