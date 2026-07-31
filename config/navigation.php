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
        'label' => 'Files',
        'route' => 'files.index',
        'icon' => 'FolderOpen',
        'permission' => 'files.view',
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
            [
                'label' => 'Activity Logs',
                'route' => 'activity-logs.index',
                'icon' => 'ScrollText',
                'permission' => 'activity-logs.view',
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
