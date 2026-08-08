# Application Context

Nova Starter is a full-stack web application built with:

## Tech Stack

- **Backend**: Laravel 12 (PHP 8.4+)
- **Frontend**: React 19 + TypeScript + Inertia.js
- **UI Components**: shadcn/ui (Tailwind CSS v4)
- **Database**: MongoDB (via laravel-mongodb)
- **File Storage**: S3-compatible (MinIO for local development)
- **Authentication**: Laravel Breeze + Sanctum
- **Authorization**: Spatie Laravel-Permission (roles & permissions)
- **AI**: Prism PHP (prism-php/prism) for AI integrations

## Key Features

### File Manager
- Upload, download, preview files (images, videos, audio, documents)
- Create, rename, move, delete folders
- Star/favorite files and folders
- Share files and folders with other users (viewer, commenter, editor permissions)
- Trash with restore functionality
- Persistent audio mini-player for audio files

### User Management
- Create, edit, delete users
- Assign roles (Super Admin, Admin, User)
- Permission-based access control
- Multi-tenant support (organizations)

### Settings
- Branding (app name, tagline, logo upload)
- Module management (enable/disable features)
- Feature flags

### Activity Logs
- Tracks user actions (create, update, delete)
- Filterable by type and user

### AI Assistant
- Chat interface powered by Prism PHP
- Uses OpenRouter as the AI provider
- Guardrails defined in markdown files

## Routes

- `/dashboard` — Main dashboard
- `/files` — File manager (with sub-routes: /files/shared, /files/starred, /files/trash)
- `/users` — User management
- `/roles` — Role management
- `/settings` — Application settings
- `/activity-logs` — Activity log viewer
- `/ai-bot` — AI chatbot interface

## Permissions

The application uses Spatie's permission system with the following key permissions:
- `users.view`, `users.create`, `users.edit`, `users.delete`
- `roles.view`, `roles.create`, `roles.edit`, `roles.delete`
- `settings.view`, `settings.edit`
- `files.view`, `files.create`, `files.edit`, `files.delete`
- `activity-logs.view`
