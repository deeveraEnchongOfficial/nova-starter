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
- **Storage:** MinIO (S3-compatible) with presigned URL uploads
- **Containerization:** Docker (PHP 8.4 + Nginx reverse proxy + MongoDB + Redis + MinIO + MailHog + n8n)

## Features

### Core Platform
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
- Feature toggles (registration, 2FA, API tokens, multi-tenant, activity logs, etc.)
- Reusable shadcn/ui components (20+ components)
- Reusable DataTable component with sorting, pagination, search, and server-side support
- Reusable database traits (auditable, ownable, tenant-scoped, metadata, string IDs)
- Repository pattern for all DB queries with automatic tenant-aware scoping
- Activity logging (automatic tracking of user actions: login, logout, CRUD, uploads, downloads, shares)
- SSR support
- Fully Dockerized

### File Management System
- **Direct-to-S3 uploads** via presigned URLs (bypasses PHP server for large files, up to 1GB)
- **Folder management** — create, rename, move, delete, restore, color customization, nested with breadcrumbs
- **File operations** — upload, rename, move, delete, restore, download via presigned URLs
- **Image thumbnails** — real image previews in grid/list views with loading states
- **File preview modal** — full-screen preview for images, videos, and audio
- **Audio player** — persistent mini-player with playlist support, auto-play next track, prev/next, seek, volume control (continues playing across page navigations)
- **Starred items** — star/unstar files and folders, dedicated starred page
- **Sharing** — share files/folders with other users (viewer, commenter, editor permissions)
- **Trash** — soft delete with restore and empty trash functionality
- **Search** — search files and folders by name (case-insensitive, scoped to folder or global)
- **Grid & list views** — toggle between grid and list layouts
- **Storage usage tracking** — configurable storage capacity with usage dashboard
- **File type icons** — contextual icons for images, videos, audio, PDF, archives, spreadsheets, code, documents
- **Breadcrumb navigation** — full path from root to current folder

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
- MinIO or S3-compatible storage (for file management)

## Quick Start (Docker)

The Docker dev stack provides a full local environment with SSL via mkcert, a reverse proxy, MongoDB, Redis, MinIO (S3-compatible storage), MailHog, and n8n.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [mkcert](https://github.com/FiloSottile/mkcert) (for local SSL certificates)
  ```bash
  brew install mkcert
  mkcert -install   # installs the local CA into system trust store
  ```

### Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Generate local SSL certificates for *.nova-starter.localhost
mkcert -cert-file "docker/certs/_wildcard.nova-starter.localhost.pem" \
       -key-file "docker/certs/_wildcard.nova-starter.localhost-key.pem" \
       "*.nova-starter.localhost" "nova-starter.localhost"

# 3. Start the stack (builds the app image on first run)
./dev.sh up
```

This starts all services, installs PHP/JS dependencies, runs migrations, and initializes the MinIO `uploads` bucket.

### Access Points

| Service | URL | Credentials |
|---|---|---|
| App | https://app.nova-starter.localhost | — |
| MinIO API | https://storage.nova-starter.localhost | minioadmin / minioadmin |
| MinIO Console | https://storage-console.nova-starter.localhost | minioadmin / minioadmin |
| MailHog | http://localhost:8025 | — |
| n8n | http://localhost:5678 | admin / password |
| MongoDB | localhost:27017 | dbuser / password |
| Redis | localhost:6379 | — |
| Vite HMR | localhost:5173 | — |
| Xdebug | localhost:9003 | — |

### Docker Services

| Service | Image | Purpose |
|---|---|---|
| `app` | Custom (Ubuntu 22.04 + PHP 8.4) | Laravel app via `artisan serve`, Xdebug, Vite HMR port |
| `nginx` | `nginx:alpine` | SSL reverse proxy with wildcard cert for `*.nova-starter.localhost` |
| `mongodb` | `mongo:latest` | Primary database with auth + persistent volumes |
| `redis` | `redis:alpine` | Cache/queue with healthcheck |
| `mailhog` | `mailhog/mailhog` | Local mail catcher (SMTP 1025, UI 8025) |
| `minio` | `minio/minio` | S3-compatible object storage (API 9000, console 9001) |
| `n8n` | `n8nio/n8n` | Workflow automation (sqlite-backed) |

### dev.sh Commands

| Command | Description |
|---|---|
| `./dev.sh up` | Start containers, install deps, run migrations, init MinIO |
| `./dev.sh up --no-update` | Start containers without running migrations |
| `./dev.sh up --rebuild` | Rebuild app image from scratch and start |
| `./dev.sh down` | Stop and remove containers |
| `./dev.sh stop` | Stop containers (keep them for quick restart) |
| `./dev.sh destroy` | Remove all containers, volumes, networks, and images |
| `./dev.sh rebuild <service>` | Rebuild and restart a specific service |
| `./dev.sh init` | Full bootstrap: containers, deps, decrypt env, migrate, build, MinIO |
| `./dev.sh art <command>` | Run artisan commands in the container |
| `./dev.sh comp <command>` | Run composer commands in the container |
| `./dev.sh npm <command>` | Run npm commands in the container |
| `./dev.sh sh` | Open a shell in the app container |
| `./dev.sh pint` | Run Laravel Pint formatter |
| `./dev.sh phpunit` | Run PHPUnit tests |
| `./dev.sh encrypt-env` | Encrypt `.env` using key from `.devconfig` |
| `./dev.sh decrypt-env` | Decrypt `.env.encrypted` using key from `.devconfig` |

### Environment Encryption

The `dev.sh` script supports encrypting/decrypting your `.env` file for safe sharing:

```bash
# 1. Set your encryption key
cp .devconfig.example .devconfig
# Edit .devconfig and set LOCAL_ENCRYPTION_KEY=your-secret-key

# 2. Encrypt
./dev.sh encrypt-env    # creates .env.encrypted

# 3. Decrypt (on another machine or after cloning)
./dev.sh decrypt-env    # restores .env from .env.encrypted
```

### Production Docker

A production-oriented Docker setup (PHP-FPM + Nginx + Supervisor in a single Alpine image) is preserved in `docker/production/`. This is suitable for deployment to a single server or as a base for CI/CD builds.

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
| `MODULE_ACTIVITY_LOGS_ENABLED` | true |

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
| `FEATURE_ACTIVITY_LOGS` | true |

### File Storage (MinIO/S3)

| Env Variable | Default | Description |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | minioadmin | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | minioadmin | S3 secret key |
| `AWS_DEFAULT_REGION` | us-east-1 | S3 region |
| `AWS_BUCKET` | uploads | S3 bucket name |
| `AWS_ENDPOINT` | http://minio:9000 | Internal S3 endpoint (Docker) |
| `AWS_URL` | http://192.168.1.7:9000/uploads | Public S3 URL |
| `AWS_SIGNING_URL` | http://192.168.1.7:9000 | External endpoint for presigned URL signing |
| `AWS_USE_PATH_STYLE_ENDPOINT` | true | Use path-style endpoints (MinIO) |
| `AWS_PRESIGNED_REQUEST_TTL` | 120 | Presigned URL TTL in minutes |
| `FILE_UPLOAD_MAX_SIZE` | 1GB | Max upload file size |
| `STORAGE_CAPACITY` | 50GB | Total storage capacity per user |

### Database (MongoDB)

The application uses MongoDB with a multi-database service architecture. Each service auto-resolves its own connection based on namespace:

| Connection | Database | Used By |
|---|---|---|
| `primary` | `{app}_{env}_primary` | Default connection |
| `cache` | `{app}_{env}_cache` | Cache, sessions, queue |
| `core` | `{app}_{env}_core` | Core service models (User, Role, Setting, Organization, File, Folder, Activity) |

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
│   │   │   │       ├── Setting/
│   │   │   │       │   └── SettingController.php
│   │   │   │       ├── Activity/
│   │   │   │       │   └── ActivityController.php  # Activity log viewer
│   │   │   │       └── File/
│   │   │   │           └── FileController.php      # File manager pages (index, trash, starred, shared)
│   │   │   └── RestApi/                           # REST API controllers
│   │   │       ├── FileApiController.php          # File CRUD, download, star, share, restore
│   │   │       ├── FolderController.php           # Folder CRUD, star, share, restore
│   │   │       ├── InitiateFileUploadController.php  # Presigned URL generation for uploads
│   │   │       ├── ConfirmFileUploadController.php   # Confirm upload + create file record
│   │   │       ├── SearchController.php           # Search files and folders
│   │   │       ├── TrashController.php            # List/empty trashed items
│   │   │       └── StorageUsageController.php     # Storage usage stats
│   │   ├── Middleware/
│   │   │   ├── HandleInertiaRequests.php          # Shares auth, branding, nav, modules
│   │   │   └── CheckPermission.php                # Permission middleware
│   │   └── Requests/
│   │       ├── Auth/
│   │       └── Core/
│   │           └── ProfileUpdateRequest.php
│   ├── Providers/
│   │   └── AppServiceProvider.php                # Registers branding/nav/module services
│   ├── Services/
│   │   ├── BrandingService.php                   # Merges config + DB branding
│   │   ├── NavigationService.php                 # Filters nav by module + permission
│   │   ├── ModuleService.php                     # Merges config + DB module states
│   │   └── Core/
│   │       ├── CoreServiceProvider.php           # Sanctum model + morph map
│   │       ├── User/
│   │       │   ├── User.php                      # Auth user with HasRoles, HasApiTokens
│   │       │   ├── UserStatus.php                # Enum: active, inactive, blocked, locked
│   │       │   ├── UserLoginType.php             # Enum
│   │       │   ├── UserRepository.php            # Tenant-aware DB queries for users
│   │       │   └── Actions/
│   │       │       └── UpsertUser.php            # Create/update user action
│   │       ├── Role/
│   │       │   ├── Role.php                      # Spatie Role with tenant + created_by
│   │       │   ├── Permission.php                # Spatie Permission
│   │       │   ├── RoleRepository.php
│   │       │   ├── PermissionRepository.php
│   │       │   └── Actions/
│   │       │       ├── UpsertRole.php
│   │       │       └── DeleteRole.php
│   │       ├── Setting/
│   │       │   ├── Setting.php                   # Key-value settings with typed values
│   │       │   └── SettingRepository.php
│   │       ├── Organization/
│   │       │   ├── Organization.php              # Org model with member relationships
│   │       │   ├── OrganizationStatus.php        # Enum: active, suspended, pending
│   │       │   ├── OrganizationRepository.php
│   │       │   └── Actions/
│   │       │       └── UpsertOrganization.php
│   │       ├── File/
│   │       │   ├── File.php                      # File model with presigned URLs, metadata
│   │       │   ├── FileCategory.php              # Enum: documents, images, tasks
│   │       │   ├── FileVisibility.php            # Enum for file visibility
│   │       │   ├── FileRepository.php            # File queries (in-folder, search, starred, trashed, shared)
│   │       │   ├── Folder.php                    # Folder model with parent/children, breadcrumbs
│   │       │   ├── FolderVisibility.php          # Enum for folder visibility
│   │       │   ├── FolderRepository.php          # Folder queries (in-folder, search, starred, trashed, descendants)
│   │       │   ├── Share.php                     # Share model for file/folder sharing
│   │       │   ├── SharePermission.php           # Enum: viewer, commenter, editor
│   │       │   └── Actions/
│   │       │       ├── ConfirmFileUpload.php     # Confirm upload + create file record
│   │       │       ├── CreateFolder.php          # Create new folder
│   │       │       ├── DeleteFile.php            # Soft-delete file to trash
│   │       │       ├── DeleteFolder.php          # Soft-delete folder to trash
│   │       │       ├── EmptyTrash.php            # Permanently delete all trashed items
│   │       │       ├── MoveFile.php              # Move file to different folder
│   │       │       ├── MoveFolder.php            # Move folder to different parent
│   │       │       ├── RenameFile.php            # Rename file
│   │       │       ├── RenameFolder.php          # Rename folder + update S3 paths
│   │       │       ├── RestoreFile.php           # Restore file from trash
│   │       │       ├── RestoreFolder.php         # Restore folder from trash
│   │       │       ├── ShareResource.php         # Share file/folder with user
│   │       │       └── ToggleStar.php            # Toggle star on file/folder
│   │       ├── Activity/
│   │       │   ├── Activity.php                  # Activity log model with polymorphic subject
│   │       │   ├── ActivityLogType.php           # Enum: create, update, delete, login, logout, etc.
│   │       │   ├── ActivityRepository.php
│   │       │   ├── Actions/
│   │       │   │   └── LogActivity.php           # Log activity action
│   │       │   └── Listeners/
│   │       │       ├── LogLogin.php              # Log user login
│   │       │       ├── LogLogout.php             # Log user logout
│   │       │       └── LogRegistered.php         # Log user registration
│   │       └── PersonalAccessToken/
│   │           └── PersonalAccessToken.php       # Sanctum token with string IDs
│   └── Support/
│       ├── SupportServiceProvider.php
│       ├── Mixins/
│       │   └── RedirectResponseMixin.php
│       └── Database/
│           ├── Casts/
│           │   └── AsEnumArray.php               # Custom cast for enum arrays
│           └── Traits/
│               ├── ServiceModel.php              # Auto-resolves DB connection by namespace
│               ├── BelongsToATenant.php          # Multi-tenant morphTo + tenantAware scope
│               ├── HasOwner.php                  # Polymorphic owner + history tracking
│               ├── HasCreatedBy.php              # Polymorphic created_by
│               ├── HasUpdatedBy.php              # Polymorphic updated_by
│               ├── HasMetadata.php               # Dynamic __metadata field management
│               ├── HasStringId.php               # Auto-generated string IDs
│               ├── BaseRepository.php            # Tenant-aware pagination with MongoDB regex search
│               ├── Unguarded.php                 # Mass-assignment unguarded
│               └── ForceMake.php                 # Force model creation
├── bootstrap/
│   ├── app.php                                   # App config (routing, middleware, exceptions)
│   └── providers.php                             # Registers AppServiceProvider + CoreServiceProvider
├── config/
│   ├── branding.php                              # Branding defaults (name, logo, theme, layout)
│   ├── modules.php                               # Module definitions (users, roles, settings, activity-logs)
│   ├── navigation.php                            # Navigation structure
│   ├── features.php                              # Feature toggles (incl. multi_tenant, activity_logs)
│   ├── database.php                              # MongoDB multi-database connections
│   ├── filesystems.php                           # S3/MinIO config + upload purposes + storage capacity
│   ├── permission.php                            # Spatie permission config
│   └── ...                                       # Standard Laravel configs
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
│       ├── DatabaseSeeder.php                    # Calls all seeders
│       ├── RolePermissionSeeder.php              # Roles + permissions
│       ├── AdminUserSeeder.php                   # Default admin user
│       └── SettingsSeeder.php                    # Default branding + module settings
├── docker/
│   ├── 8.4/                                      # Dev app image (Ubuntu 22.04 + PHP 8.4)
│   │   ├── Dockerfile                            # PHP 8.4 + extensions, Node 20, MongoDB ext
│   │   ├── php.ini                               # 100M uploads, 512M memory, opcache, Xdebug
│   │   ├── supervisord.conf                      # Runs `artisan serve` on port 80
│   │   └── start-container                       # Entry point with gosu + user remapping
│   ├── certs/                                    # mkcert wildcard SSL certs
│   ├── nginx/conf.d/
│   │   ├── app.conf                              # app.nova-starter.localhost → app:80 (SSL + WebSocket)
│   │   └── minio.conf                            # storage. + storage-console. → minio:9000/9001
│   └── production/                               # Production image (PHP-FPM + Nginx + Supervisor, Alpine)
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── supervisor.conf
│       └── entrypoint.sh                         # Auto-migrate, seed, cache config
├── resources/js/
│   ├── Components/
│   │   ├── ui/                                   # 20 shadcn/ui components
│   │   │   ├── avatar, badge, button, card, checkbox, collapsible,
│   │   │   ├── dialog, dropdown-menu, input, label, select, separator,
│   │   │   ├── sheet, sidebar, skeleton, sonner, table, tabs, tooltip
│   │   ├── data-table/                           # Reusable DataTable system
│   │   │   ├── DataTable.tsx                     # Table with sorting, pagination, search
│   │   │   ├── DataTableColumnHeader.tsx         # Sortable column header
│   │   │   ├── DataTablePagination.tsx           # Pagination controls (mobile-responsive)
│   │   │   ├── DataTableToolbar.tsx              # Search + actions toolbar
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx                    # Dynamic nav sidebar
│   │   │   ├── Sidebar.tsx                       # Sidebar wrapper
│   │   │   ├── Header.tsx                        # Top bar with theme toggle + user menu
│   │   │   └── Main.tsx                          # Main content area
│   │   ├── FilesTabs.tsx                         # File manager tab navigation (My Files, Starred, Shared, Trash)
│   │   ├── ImageThumbnail.tsx                    # Image thumbnail with loading/error states
│   │   ├── MiniPlayer.tsx                        # Floating audio player widget (play/pause, seek, volume, playlist)
│   │   ├── file-uploader.tsx                     # File upload component
│   │   ├── theme-provider.tsx                    # Light/dark/system theme context
│   │   └── (Breeze components: Modal, TextInput, PrimaryButton, etc.)
│   ├── contexts/
│   │   └── AudioPlayerContext.tsx                # Audio player state (persistent across page navigations)
│   ├── hooks/
│   │   ├── use-permission.ts                     # Permission checking hook
│   │   ├── use-mobile.ts                         # Mobile detection hook
│   │   └── use-file-upload.ts                    # File upload hook with progress tracking
│   ├── lib/
│   │   ├── utils.ts                              # cn() utility
│   │   └── icons.ts                              # Icon name → component mapping
│   ├── Layouts/
│   │   ├── AuthenticatedLayout.tsx               # Main app shell with sidebar
│   │   └── GuestLayout.tsx                       # Auth page layout
│   ├── Pages/
│   │   ├── Welcome.tsx
│   │   ├── Dashboard.tsx                         # Dashboard with recent activities
│   │   ├── Users/                                # Index, Create, Edit
│   │   ├── Roles/                                # Index, Create, Edit
│   │   ├── Settings/                             # Index (tabs: branding, modules, features)
│   │   ├── ActivityLogs/                         # Index (list), Show (details)
│   │   ├── Files/                                # Index, Starred, Shared, Trash
│   │   ├── Profile/                              # Edit (from Breeze)
│   │   └── Auth/                                 # Login, Register, ForgotPassword, etc.
│   ├── types/
│   │   ├── index.d.ts                            # Shared TypeScript types
│   │   ├── global.d.ts                           # Global type declarations
│   │   └── vite-env.d.ts
│   ├── app.tsx                                   # Inertia client entry (wraps AudioPlayerProvider + MiniPlayer)
│   ├── bootstrap.ts                              # Axios + Ziggy setup
│   └── ssr.tsx                                   # SSR entry
├── routes/
│   ├── web.php                                   # Web routes (controllers under App\Core)
│   ├── auth.php                                  # Auth routes (Breeze)
│   ├── api.php                                   # REST API routes (file management)
│   └── console.php                               # Console commands
├── tests/
│   └── Feature/
│       ├── FileUpload/                           # File/folder management tests
│       │   ├── FileControllerTest.php
│       │   ├── FolderControllerTest.php
│       │   ├── InitiateFileUploadTest.php
│       │   └── SearchAndTrashTest.php
│       ├── ProfileTest.php
│       └── Auth/                                 # Authentication tests
├── docker-compose.yml                            # Dev stack: app, nginx, mongodb, redis, mailhog, minio, n8n
├── dev.sh                                        # Dev helper script (up, init, art, comp, npm, etc.)
├── .devconfig.example                            # Template for env encryption key
└── .env.example
```

## Default Roles & Permissions

| Role | Permissions |
|---|---|
| Super Admin | All permissions |
| Admin | users.view, users.create, users.edit, roles.view, settings.view, files.view |
| User | files.view |

Permissions: `users.view`, `users.create`, `users.edit`, `users.delete`, `roles.view`, `roles.create`, `roles.edit`, `roles.delete`, `settings.view`, `settings.edit`, `files.view`

## REST API

### File Upload

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/files/initiate` | Generate presigned S3 URL for direct upload |
| `POST` | `/api/v1/files/confirm` | Confirm upload and create file record |

### Files

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/files` | List files |
| `GET` | `/api/v1/files/{id}` | Get file details |
| `PATCH` | `/api/v1/files/{id}` | Rename/move file |
| `DELETE` | `/api/v1/files/{id}` | Delete file (move to trash) |
| `POST` | `/api/v1/files/{id}/restore` | Restore file from trash |
| `POST` | `/api/v1/files/{id}/star` | Toggle star on file |
| `POST` | `/api/v1/files/{id}/share` | Share file with user |
| `GET` | `/api/v1/files/{id}/download` | Get presigned download URL |

### Folders

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/folders` | List folders |
| `POST` | `/api/v1/folders` | Create folder |
| `GET` | `/api/v1/folders/{id}` | Get folder details |
| `PATCH` | `/api/v1/folders/{id}` | Rename/move folder, set color |
| `DELETE` | `/api/v1/folders/{id}` | Delete folder (move to trash) |
| `POST` | `/api/v1/folders/{id}/restore` | Restore folder from trash |
| `POST` | `/api/v1/folders/{id}/star` | Toggle star on folder |
| `POST` | `/api/v1/folders/{id}/share` | Share folder with user |

### Search, Trash & Storage

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/search` | Search files and folders by name |
| `GET` | `/api/v1/trash` | List trashed items |
| `DELETE` | `/api/v1/trash` | Empty trash (permanently delete all) |
| `GET` | `/api/v1/storage/usage` | Get storage usage statistics |

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

## File Management Actions

All file and folder operations go through dedicated action classes in `app/Services/Core/File/Actions/`:

| Action | Purpose |
|---|---|
| `ConfirmFileUpload` | Confirm upload, copy from temp to permanent S3 path, create File record |
| `CreateFolder` | Create new folder with optional parent |
| `DeleteFile` | Soft-delete file (move to trash) |
| `DeleteFolder` | Soft-delete folder (move to trash) |
| `EmptyTrash` | Permanently delete all trashed items |
| `MoveFile` | Move file to different folder (updates S3 + DB path) |
| `MoveFolder` | Move folder to different parent (updates S3 + DB paths) |
| `RenameFile` | Rename file (updates S3 + DB path) |
| `RenameFolder` | Rename folder (moves S3 objects + updates all child File paths) |
| `RestoreFile` | Restore file from trash |
| `RestoreFolder` | Restore folder from trash |
| `ShareResource` | Share file/folder with user (viewer, commenter, editor) |
| `ToggleStar` | Toggle star on file/folder |

## Repository Pattern

All database queries go through dedicated **Repository** classes located alongside their models in `app/Services/{Service}/`. Controllers inject repositories and call their methods — no direct `Model::query()` calls in controllers.

| Repository | Location | Scope |
|---|---|---|
| `UserRepository` | `app/Services/Core/User/` | `tenantAware()` — scoped to authenticated user's tenant |
| `RoleRepository` | `app/Services/Core/Role/` | `tenantAware()` — scoped to authenticated user's tenant |
| `PermissionRepository` | `app/Services/Core/Role/` | `tenantAware()` — scoped to authenticated user's tenant |
| `SettingRepository` | `app/Services/Core/Setting/` | `tenantAware()` — scoped to authenticated user's tenant |
| `OrganizationRepository` | `app/Services/Core/Organization/` | Unscoped (Organization is the tenant itself) |
| `FileRepository` | `app/Services/Core/File/` | `ownedBy()` — scoped to authenticated user |
| `FolderRepository` | `app/Services/Core/File/` | `ownedBy()` — scoped to authenticated user |
| `ActivityRepository` | `app/Services/Core/Activity/` | Scoped to authenticated user |

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
- `App\Services\Core\File\File` → uses the `core` database connection
- `App\Services\Core\Activity\Activity` → uses the `core` database connection

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

## Activity Logging

The application automatically logs user activities via event listeners:

| Log Type | Trigger |
|---|---|
| `login` | User logs in |
| `logout` | User logs out |
| `register` | New user registers |
| `create` | Entity created |
| `update` | Entity updated |
| `delete` | Entity deleted |
| `upload` | File uploaded |
| `download` | File downloaded |
| `share` | File/folder shared |
| `restore` | File/folder restored from trash |

Activity logs are viewable in the Activity Logs page with filtering by type, user, and subject.

## Audio Player

The built-in audio player provides persistent music playback across page navigations:

- **Mini player widget** — floating bottom-right corner with track info, progress bar, and controls
- **Playlist support** — automatically builds playlist from all audio files in the current directory
- **Auto-play next** — when a track ends, automatically plays the next audio file
- **Prev/next controls** — navigate through the playlist
- **Seek & volume** — draggable progress bar and volume control
- **Minimize/close** — minimize the player or close it entirely
- **Persistent** — audio continues playing when navigating between pages (powered by React Context mounted at app level)

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

### Local (without Docker)

| Command | Description |
|---|---|
| `composer setup` | One-command setup: install deps, generate key, migrate, build assets |
| `composer dev` | Run server, queue listener, pail logs, and Vite concurrently |
| `composer test` | Clear config and run PHPUnit tests |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build frontend assets (incl. SSR build) |

### Docker (via dev.sh)

| Command | Description |
|---|---|
| `./dev.sh up` | Start stack, install deps, migrate, init MinIO |
| `./dev.sh up --rebuild` | Rebuild app image and start |
| `./dev.sh down` | Stop and remove containers |
| `./dev.sh stop` | Stop containers (quick restart later) |
| `./dev.sh destroy` | Remove all containers, volumes, and images |
| `./dev.sh art migrate` | Run migrations in container |
| `./dev.sh comp install` | Install composer deps in container |
| `./dev.sh npm install` | Install npm deps in container |
| `./dev.sh sh` | Shell into the app container |
| `./dev.sh phpunit` | Run tests in container |
| `./dev.sh pint` | Format PHP in container |

### After Making Changes

When making changes to the codebase, always clear caches and rebuild:

```bash
# Inside Docker:
docker exec nova-starter-app-1 bash -c "php artisan queue:clear && php artisan queue:flush && php artisan cache:clear && php artisan route:clear && php artisan config:clear && php artisan view:clear && php artisan clear-compiled && php artisan optimize:clear"

# Then build frontend:
npm run build
```

## Testing

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --filter=File

# Via Docker
./dev.sh phpunit
```

Test coverage includes:
- File management (upload, CRUD, folders, search, trash, restore)
- Folder management (create, rename, move, delete, restore, star)
- File upload initiation (validation, presigned URLs)
- Authentication (login, registration, password reset)
- Profile management

## License

MIT
