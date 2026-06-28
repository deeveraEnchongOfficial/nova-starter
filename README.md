# Nova Starter

A reusable, modular, and highly configurable Laravel + Inertia.js + React + shadcn/ui boilerplate with a service-based architecture, designed for rapidly building new applications.

## Tech Stack

- **Backend:** Laravel 13 (PHP 8.3+)
- **Database:** MongoDB (via `mongodb/laravel-mongodb`) with multi-database service connections
- **Frontend:** React 18 + TypeScript (via Inertia.js)
- **Bundler:** Vite 8
- **UI Components:** shadcn/ui (New York style) + Radix UI primitives
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Auth:** Laravel Breeze (Inertia + React + TypeScript) + Laravel Sanctum
- **RBAC:** Spatie Laravel Permission
- **Routing:** Tightenco Ziggy (named routes in JS)
- **Charts:** Recharts
- **Notifications:** Sonner
- **Containerization:** Docker (Nginx + PHP-FPM + MySQL + Redis)

## Features

- Service-based architecture with auto-resolved database connections per service
- MongoDB document models with auto-generated string IDs (timestamp + random hex)
- Multi-tenant support (optional, via `FEATURE_MULTI_TENANT`)
- Organization model with member relationships
- API token management via Sanctum
- Dynamic app name and branding (configurable via `.env` or database)
- Authentication (login, register, password reset, email verification)
- User management (CRUD + role assignment) via `UpsertUser` action
- Role and permission management (CRUD + permission assignment) via `UpsertRole` action
- Organization management via `UpsertOrganization` action
- Upsert action pattern for centralized create/update logic across all entities
- Settings management (branding, modules, features)
- Dynamic navigation/sidebar (config-driven, permission-filtered)
- Theme customization (light/dark/system mode toggle, configurable radius & primary color)
- Modular architecture (enable/disable modules via env or database)
- Feature toggles (registration, 2FA, API tokens, multi-tenant, etc.)
- Reusable shadcn/ui components (19+ components)
- Reusable database traits (auditable, ownable, tenant-scoped, metadata, string IDs)
- Repository pattern for all DB queries with automatic tenant-aware scoping
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

Or use the one-command setup:

```bash
composer setup
```

Or run all dev processes concurrently:

```bash
composer dev
# Runs: server, queue listener, pail logs, and Vite in parallel
```

Visit `http://localhost:8000` and log in with:
- **Email:** `admin@nova-starter.test`
- **Password:** `password`

### Prerequisites

- PHP 8.3+
- MongoDB 7.0+
- Node.js 18+
- Composer 2+
- Redis (optional, for cache/queue)

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

The Docker stack includes:
- **app** — PHP 8.4 FPM + Nginx + Supervisor (Alpine)
- **db** — MySQL 8.4
- **redis** — Redis 7 Alpine

## Configuration

### Branding

Configure in `.env` or override via the Settings UI:

| Env Variable | Default | Description |
|---|---|---|
| `APP_NAME` | Nova Starter | Full application name |
| `APP_SHORT_NAME` | Nova | Short name for sidebar |
| `APP_TAGLINE` | Build faster, ship smarter. | Tagline shown in sidebar |
| `APP_LOGO` | (empty) | Logo URL (light mode) |
| `APP_LOGO_DARK` | (empty) | Logo URL (dark mode) |
| `APP_FAVICON` | (empty) | Favicon URL |
| `APP_THEME_MODE` | light | Default theme: `light`, `dark`, or `system` |
| `APP_PRIMARY_COLOR` | neutral | Primary color scheme |
| `APP_THEME_RADIUS` | 0.625rem | Border radius for UI components |

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
| `FEATURE_MULTI_TENANT` | false |
| `FEATURE_USER_REGISTRATION` | true |
| `FEATURE_PASSWORD_RESET` | true |
| `FEATURE_EMAIL_VERIFICATION` | false |
| `FEATURE_TWO_FACTOR_AUTH` | false |
| `FEATURE_USER_PROFILE_EDIT` | true |
| `FEATURE_ACCOUNT_DELETION` | true |
| `FEATURE_API_TOKENS` | false |
| `FEATURE_DARK_MODE` | true |

### Database (MongoDB)

The application uses MongoDB with a multi-database service architecture. Each service auto-resolves its own connection based on namespace:

| Connection | Database | Used By |
|---|---|---|
| `primary` | `{app}_{env}_primary` | Default connection |
| `cache` | `{app}_{env}_cache` | Cache, sessions, queue |
| `core` | `{app}_{env}_core` | Core service models (User, Role, Setting, Organization) |

Configure via `.env`:

| Env Variable | Default |
|---|---|
| `DB_DSN` | `mongodb://127.0.0.1:27017` |
| `DB_USERNAME` | (empty) |
| `DB_PASSWORD` | (empty) |

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
│   ├── Console/
│   │   └── Traits/
│   │       └── RootNamespace.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php
│   │   │   ├── App/
│   │   │   │   ├── Auth/                       # Breeze auth controllers
│   │   │   │   │   ├── AuthenticatedSessionController.php
│   │   │   │   │   ├── RegisteredUserController.php
│   │   │   │   │   ├── PasswordController.php
│   │   │   │   │   ├── PasswordResetLinkController.php
│   │   │   │   │   ├── NewPasswordController.php
│   │   │   │   │   ├── EmailVerificationPromptController.php
│   │   │   │   │   ├── EmailVerificationNotificationController.php
│   │   │   │   │   ├── VerifyEmailController.php
│   │   │   │   │   └── ConfirmablePasswordController.php
│   │   │   │   └── Core/
│   │   │   │       ├── User/
│   │   │   │       │   ├── UserController.php   # User CRUD
│   │   │   │       │   └── ProfileController.php
│   │   │   │       ├── Role/
│   │   │   │       │   └── RoleController.php   # Role CRUD
│   │   │   │       └── Setting/
│   │   │   │           └── SettingController.php
│   │   │   └── RestApi/                        # (reserved for API controllers)
│   │   ├── Middleware/
│   │   │   ├── HandleInertiaRequests.php       # Shares auth, branding, nav, modules
│   │   │   └── CheckPermission.php             # Permission middleware
│   │   └── Requests/
│   │       ├── Auth/
│   │       └── Core/
│   │           └── ProfileUpdateRequest.php
│   ├── Providers/
│   │   └── AppServiceProvider.php             # Registers branding/nav/module services
│   ├── Services/
│   │   ├── BrandingService.php                # Merges config + DB branding
│   │   ├── NavigationService.php              # Filters nav by module + permission
│   │   ├── ModuleService.php                  # Merges config + DB module states
│   │   └── Core/
│   │       ├── CoreServiceProvider.php        # Sanctum model + morph map
│   │       ├── User/
│   │       │   ├── User.php                   # Auth user with HasRoles, HasApiTokens
│   │       │   ├── UserStatus.php             # Enum: active, inactive, blocked, locked
│   │       │   ├── UserLoginType.php          # Enum
│   │       │   ├── UserRepository.php         # Tenant-aware DB queries for users
│   │       │   └── Actions/
│   │       │       └── UpsertUser.php         # Create/update user action
│   │       ├── Role/
│   │       │   ├── Role.php                   # Spatie Role with tenant + created_by support
│   │       │   ├── Permission.php             # Spatie Permission
│   │       │   ├── RoleRepository.php         # Tenant-aware DB queries for roles
│   │       │   ├── PermissionRepository.php   # Tenant-aware DB queries for permissions
│   │       │   └── Actions/
│   │       │       ├── UpsertRole.php         # Create/update role action
│   │       │       └── DeleteRole.php         # Hard-delete role action
│   │       ├── Setting/
│   │       │   ├── Setting.php                # Key-value settings with typed values
│   │       │   ├── SettingRepository.php      # Tenant-aware DB queries for settings
│   │       │   └── Actions/                   # (reserved for setting actions)
│   │       ├── Organization/
│   │       │   ├── Organization.php           # Org model with member relationships
│   │       │   ├── OrganizationStatus.php     # Enum: active, suspended, pending
│   │       │   ├── OrganizationRepository.php # DB queries for organizations
│   │       │   └── Actions/
│   │       │       └── UpsertOrganization.php # Create/update organization action
│   │       └── PersonalAccessToken/
│   │           └── PersonalAccessToken.php    # Sanctum token with string IDs
│   └── Support/
│       ├── SupportServiceProvider.php
│       ├── Mixins/
│       │   └── RedirectResponseMixin.php
│       └── Database/
│           ├── Casts/
│           │   └── AsEnumArray.php            # Custom cast for enum arrays
│           └── Traits/
│               ├── ServiceModel.php           # Auto-resolves DB connection by namespace
│               ├── BelongsToATenant.php       # Multi-tenant morphTo + tenantAware scope
│               ├── HasOwner.php               # Polymorphic owner + history tracking
│               ├── HasCreatedBy.php           # Polymorphic created_by
│               ├── HasUpdatedBy.php           # Polymorphic updated_by
│               ├── HasMetadata.php            # Dynamic __metadata field management
│               ├── HasStringId.php            # Auto-generated string IDs (timestamp + random)
│               ├── BaseRepository.php         # Tenant-aware pagination with MongoDB regex search
│               ├── Unguarded.php              # Mass-assignment unguarded
│               └── ForceMake.php              # Force model creation
├── bootstrap/
│   ├── app.php                                # App config (routing, middleware, exceptions)
│   └── providers.php                          # Registers AppServiceProvider + CoreServiceProvider
├── config/
│   ├── branding.php                           # Branding defaults (name, logo, theme, layout)
│   ├── modules.php                            # Module definitions
│   ├── navigation.php                         # Navigation structure
│   ├── features.php                           # Feature toggles (incl. multi_tenant)
│   ├── database.php                           # MongoDB multi-database connections
│   ├── permission.php                         # Spatie permission config
│   └── ...                                    # Standard Laravel configs
├── database/
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   ├── 0001_01_01_000002_create_jobs_table.php
│   │   ├── 2026_06_27_032418_create_permission_tables.php
│   │   └── 2026_06_27_032434_create_settings_table.php
│   ├── factories/
│   │   └── UserFactory.php
│   └── seeders/
│       ├── DatabaseSeeder.php                 # Calls all seeders
│       ├── RolePermissionSeeder.php           # Roles + permissions
│       ├── AdminUserSeeder.php                # Default admin user
│       └── SettingsSeeder.php                 # Default branding + module settings
├── docker/
│   ├── Dockerfile                             # PHP 8.4 FPM Alpine + Nginx + Supervisor
│   ├── nginx.conf
│   ├── supervisor.conf
│   └── entrypoint.sh                          # Auto-migrate, seed, cache config
├── resources/js/
│   ├── Components/
│   │   ├── ui/                                # 19 shadcn/ui components
│   │   │   ├── avatar, badge, button, card, checkbox, collapsible,
│   │   │   ├── dialog, dropdown-menu, input, label, select, separator,
│   │   │   ├── sheet, sidebar, skeleton, sonner, table, tabs, tooltip
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx                 # Dynamic nav sidebar
│   │   │   ├── Sidebar.tsx                    # Sidebar wrapper
│   │   │   ├── Header.tsx                     # Top bar with theme toggle + user menu
│   │   │   └── Main.tsx                       # Main content area
│   │   ├── theme-provider.tsx                 # Light/dark/system theme context
│   │   └── (Breeze components: Modal, TextInput, PrimaryButton, etc.)
│   ├── hooks/
│   │   ├── use-permission.ts                  # Permission checking hook
│   │   └── use-mobile.ts                      # Mobile detection hook
│   ├── lib/
│   │   ├── utils.ts                           # cn() utility
│   │   └── icons.ts                           # Icon name → component mapping
│   ├── Layouts/
│   │   ├── AuthenticatedLayout.tsx            # Main app shell with sidebar
│   │   └── GuestLayout.tsx                    # Auth page layout
│   ├── Pages/
│   │   ├── Welcome.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Users/                             # Index, Create, Edit
│   │   ├── Roles/                             # Index, Create, Edit
│   │   ├── Settings/                          # Index (tabs: branding, modules, features)
│   │   ├── Profile/                           # Edit (from Breeze)
│   │   └── Auth/                              # Login, Register, ForgotPassword, etc.
│   ├── types/
│   │   ├── index.d.ts                         # Shared TypeScript types
│   │   ├── global.d.ts                        # Global type declarations
│   │   └── vite-env.d.ts
│   ├── app.tsx                                # Inertia client entry
│   ├── bootstrap.ts                           # Axios + Ziggy setup
│   └── ssr.tsx                                # SSR entry
├── routes/
│   ├── web.php                                # Web routes (controllers under App\Core)
│   ├── auth.php                               # Auth routes (Breeze)
│   └── console.php                            # Console commands
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

## Upsert Action Pattern

All entity creation and updates go through dedicated **Upsert action** classes located in `app/Services/{Service}/Actions/`. Controllers are responsible for finding the entity (or creating a `new` instance) and passing it to the action. The action handles `forceFill`, tenant association, `createdBy` association, permission syncing, and saving.

| Action | Location | Purpose |
|---|---|---|
| `UpsertUser` | `app/Services/Core/User/Actions/` | Create/update users with tenant, password, and createdBy support |
| `UpsertRole` | `app/Services/Core/Role/Actions/` | Create/update roles with tenant, permissions, and createdBy support |
| `UpsertOrganization` | `app/Services/Core/Organization/Actions/` | Create/update organizations with createdBy support |
| `DeleteRole` | `app/Services/Core/Role/Actions/` | Hard-delete roles |

**Convention:**
- Controllers find the entity (e.g., `Role::where('name', $name)->first() ?? new Role`)
- Controllers pass the entity instance + validated data to the upsert action
- Actions handle `forceFill`, `tenant()->associate()`, `createdBy()->associate()`, `save()`, and permission syncing
- Password is only set when explicitly provided (non-null)
- Tenant is only associated when multi-tenant is enabled and a tenant model is passed

## Repository Pattern

All database queries go through dedicated **Repository** classes located alongside their models in `app/Services/{Service}/`. Controllers inject repositories and call their methods — no direct `Model::query()` calls in controllers.

| Repository | Location | Scope |
|---|---|---|
| `UserRepository` | `app/Services/Core/User/` | `tenantAware()` — scoped to authenticated user's tenant |
| `RoleRepository` | `app/Services/Core/Role/` | `tenantAware()` — scoped to authenticated user's tenant |
| `PermissionRepository` | `app/Services/Core/Role/` | `tenantAware()` — scoped to authenticated user's tenant |
| `SettingRepository` | `app/Services/Core/Setting/` | `tenantAware()` — scoped to authenticated user's tenant |
| `OrganizationRepository` | `app/Services/Core/Organization/` | Unscoped (Organization is the tenant itself) |

**Tenant-Aware Scoping Rule (`scopeTenantAware`):**
- **Multi-tenant enabled (`FEATURE_MULTI_TENANT=true`):** Only returns records belonging to the authenticated user's tenant (`tenant_type` + `tenant_id` match). If no authenticated user with tenant, returns empty results.
- **Multi-tenant disabled (`FEATURE_MULTI_TENANT=false`):** Only returns records where `tenant_id` and `tenant_type` are both `null`. Tenanted data is never exposed.

**Convention:**
- Controllers inject repositories via constructor DI
- All repository methods use `Model::tenantAware()` (except `OrganizationRepository` which is the tenant itself)
- `BaseRepository` trait provides `paginateWithSearch()` with MongoDB regex search + tenant-aware scoping
- No direct `Model::` query calls in controllers — always go through the repository

## Service-Based Architecture

Models are organized under `app/Services/{ServiceName}/` rather than `app/Models/`. The `ServiceModel` trait auto-resolves the database connection based on the service namespace:

- `App\Services\Core\User\User` → uses the `core` database connection
- `App\Services\Core\Setting\Setting` → uses the `core` database connection

To add a new service (e.g., `Portfolio`):

1. Create models under `app/Services/Portfolio/`
2. Add a MongoDB connection in `config/database.php` (e.g., `portfolio`)
3. Models using `ServiceModel` will auto-resolve to the `portfolio` connection
4. Register any morph maps or Sanctum models in a service provider

## Reusable Database Traits

Available in `app/Support/Database/Traits/`:

| Trait | Description |
|---|---|
| `ServiceModel` | Auto-resolves MongoDB connection by service namespace; includes `DocumentModel`, `HasStringId`, `Unguarded`, `ForceMake` |
| `BelongsToATenant` | Multi-tenant polymorphic relationship with `tenantAware` scope + auto-tenant validation on save |
| `HasOwner` | Polymorphic owner with ownership history tracking |
| `HasCreatedBy` | Polymorphic `createdBy` relationship |
| `HasUpdatedBy` | Polymorphic `updatedBy` relationship |
| `HasMetadata` | Dynamic `__metadata` field with get/set/replace helpers |
| `HasStringId` | Auto-generates string IDs (timestamp hex + random hex) on create |
| `BaseRepository` | Tenant-aware pagination with MongoDB regex search support (uses `tenantAware` scope) |
| `Unguarded` | Disables mass assignment protection |
| `ForceMake` | Allows forced model creation |

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

4. Create a repository class (under `app/Services/{Service}/`) extending `BaseRepository` for all DB queries.

5. Create controller (under `app/Http/Controllers/App/{Service}/`), inject the repository, routes, and pages.

6. Add permissions via the Roles UI or seeder.

## Development Commands

| Command | Description |
|---|---|
| `composer setup` | One-command setup: install deps, generate key, migrate, build assets |
| `composer dev` | Run server, queue listener, pail logs, and Vite concurrently |
| `composer test` | Clear config and run PHPUnit tests |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build frontend assets (incl. SSR build) |

## License

MIT
