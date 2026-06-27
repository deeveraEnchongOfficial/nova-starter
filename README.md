# Nova Starter

A reusable, modular, and highly configurable Laravel + Inertia.js + React + shadcn/ui boilerplate for rapidly building new applications.

## Tech Stack

- **Backend:** Laravel 13 (PHP 8.4)
- **Frontend:** React 18 + TypeScript (via Inertia.js)
- **Bundler:** Vite 8
- **UI Components:** shadcn/ui (New York style)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Auth:** Laravel Breeze (Inertia + React + TypeScript)
- **RBAC:** Spatie Laravel Permission
- **Containerization:** Docker (Nginx + PHP-FPM + MySQL + Redis)

## Features

- Dynamic app name and branding (configurable via `.env` or database)
- Authentication (login, register, password reset, email verification)
- User management (CRUD + role assignment)
- Role and permission management (CRUD + permission assignment)
- Settings management (branding, modules, features)
- Dynamic navigation/sidebar (config-driven, permission-filtered)
- Theme customization (light/dark/system mode toggle)
- Modular architecture (enable/disable modules via env or database)
- Feature toggles (registration, 2FA, API tokens, etc.)
- Reusable shadcn/ui components
- SSR support
- Fully Dockerized

## Quick Start (Local)

```bash
# 1. Clone the project
git clone <your-repo-url> my-app
cd my-app

# 2. Install PHP dependencies
composer install

# 3. Install JS dependencies
npm install --legacy-peer-deps

# 4. Copy environment file
cp .env.example .env

# 5. Generate application key
php artisan key:generate

# 6. Run migrations and seeders
php artisan migrate --seed

# 7. Build frontend assets
npm run build

# 8. Start the dev server
php artisan serve

# In a separate terminal, start Vite:
npm run dev
```

Visit `http://localhost:8000` and log in with:
- **Email:** `admin@nova-starter.test`
- **Password:** `password`

## Quick Start (Docker)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Build and start containers
docker compose up -d --build

# 3. (Optional) Seed the database on first run
# Set RUN_SEEDERS=true in .env before building, or run:
docker compose exec app php artisan db:seed
```

Visit `http://localhost:8080`.

## Configuration

### Branding

Configure in `.env` or override via the Settings UI:

| Env Variable | Default | Description |
|---|---|---|
| `APP_NAME` | Nova Starter | Full application name |
| `APP_SHORT_NAME` | Nova | Short name for sidebar |
| `APP_TAGLINE` | Build faster, ship smarter. | Tagline shown in sidebar |
| `APP_LOGO` | (empty) | Logo URL |
| `APP_THEME_MODE` | light | Default theme: `light`, `dark`, or `system` |
| `APP_PRIMARY_COLOR` | neutral | Primary color scheme |

### Modules

Enable/disable modules in `.env` or via Settings UI:

| Env Variable | Default |
|---|---|
| `MODULE_USERS_ENABLED` | true |
| `MODULE_ROLES_ENABLED` | true |
| `MODULE_SETTINGS_ENABLED` | true |

### Feature Toggles

| Env Variable | Default |
|---|---|
| `FEATURE_USER_REGISTRATION` | true |
| `FEATURE_PASSWORD_RESET` | true |
| `FEATURE_EMAIL_VERIFICATION` | false |
| `FEATURE_TWO_FACTOR_AUTH` | false |
| `FEATURE_DARK_MODE` | true |
| `FEATURE_API_TOKENS` | false |

### Navigation

Navigation is defined in `config/navigation.php`. Each item supports:
- `label` — Display name
- `route` — Named route (or `null` for parent items)
- `icon` — Lucide icon name
- `permission` — Required permission (or `null` for public)
- `children` — Array of sub-items

## Architecture

```
nova-starter/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── UserController.php        # User CRUD
│   │   │   ├── RoleController.php        # Role CRUD
│   │   │   ├── SettingController.php     # Settings management
│   │   │   └── ProfileController.php     # Profile (from Breeze)
│   │   └── Middleware/
│   │       ├── HandleInertiaRequests.php # Shares auth, branding, nav, modules
│   │       └── CheckPermission.php       # Permission middleware
│   ├── Models/
│   │   ├── User.php                      # HasRoles trait
│   │   └── Setting.php                   # Key-value settings with typed values
│   └── Services/
│       ├── BrandingService.php           # Merges config + DB branding
│       ├── NavigationService.php         # Filters nav by module + permission
│       └── ModuleService.php             # Merges config + DB module states
├── config/
│   ├── branding.php                      # Branding defaults
│   ├── modules.php                       # Module definitions
│   ├── navigation.php                    # Navigation structure
│   └── features.php                      # Feature toggles
├── database/seeders/
│   ├── RolePermissionSeeder.php          # Roles + permissions
│   ├── AdminUserSeeder.php               # Default admin user
│   └── SettingsSeeder.php                # Default settings
├── docker/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── supervisor.conf
│   └── entrypoint.sh
├── resources/js/
│   ├── Components/
│   │   ├── ui/                           # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx               # Dynamic nav sidebar
│   │   │   └── Header.tsx                # Top bar with theme toggle + user menu
│   │   └── theme-provider.tsx            # Light/dark/system theme context
│   ├── hooks/
│   │   └── use-permission.ts             # Permission checking hook
│   ├── lib/
│   │   ├── utils.ts                      # cn() utility
│   │   └── icons.ts                      # Icon name → component mapping
│   ├── Layouts/
│   │   └── AuthenticatedLayout.tsx       # Main app shell
│   ├── Pages/
│   │   ├── Dashboard.tsx
│   │   ├── Users/                        # Index, Create, Edit
│   │   ├── Roles/                        # Index, Create, Edit
│   │   ├── Settings/                     # Index (tabs: branding, modules, features)
│   │   └── Auth/                         # Login, Register, etc. (from Breeze)
│   └── types/
│       └── index.d.ts                    # Shared TypeScript types
├── docker-compose.yml
└── .env.example
```

## Default Roles & Permissions

| Role | Permissions |
|---|---|
| Super Admin | All permissions |
| Admin | users.view, users.create, users.edit, roles.view, settings.view |
| User | (none by default) |

Permissions: `users.view`, `users.create`, `users.edit`, `users.delete`, `roles.view`, `roles.create`, `roles.edit`, `roles.delete`, `settings.view`, `settings.edit`

## Adding a New Module

1. Add module config in `config/modules.php`:
```php
'projects' => [
    'enabled' => env('MODULE_PROJECTS_ENABLED', true),
    'label' => 'Projects',
    'icon' => 'FolderKanban',
    'route' => 'projects.index',
    'permission' => 'projects.view',
],
```

2. Add nav item in `config/navigation.php`:
```php
[
    'label' => 'Projects',
    'route' => 'projects.index',
    'icon' => 'FolderKanban',
    'permission' => 'projects.view',
    'children' => null,
],
```

3. Add the icon to `resources/js/lib/icons.ts`.

4. Create controller, routes, and pages.

5. Add permissions via the Roles UI or seeder.

## License

MIT
