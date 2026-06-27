<?php

return [
    [
        'label' => 'Dashboard',
        'route' => 'dashboard',
        'icon' => 'LayoutDashboard',
        'permission' => null,
        'children' => null,
    ],
    [
        'label' => 'Administration',
        'route' => null,
        'icon' => 'Settings2',
        'permission' => null,
        'children' => [
            [
                'label' => 'Users',
                'route' => 'users.index',
                'icon' => 'Users',
                'permission' => 'users.view',
            ],
            [
                'label' => 'Roles & Permissions',
                'route' => 'roles.index',
                'icon' => 'ShieldCheck',
                'permission' => 'roles.view',
            ],
        ],
    ],
    [
        'label' => 'Settings',
        'route' => 'settings.index',
        'icon' => 'Settings',
        'permission' => 'settings.view',
        'children' => null,
    ],
];
