<?php

/**
 * Comprehensive Roles & Permissions Test Script
 * Run: docker compose exec -T app php tests/RolePermissionTest.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\Core\Role\Role;
use App\Services\Core\Role\Permission;
use App\Services\Core\Role\Actions\UpsertRole;
use App\Services\Core\User\User;
use App\Services\Core\Organization\Organization;
use App\Services\Core\Organization\OrganizationStatus;

$pass = 0;
$fail = 0;
$warnings = [];

function test(string $name, bool $condition, string $details = ''): void
{
    global $pass, $fail;
    if ($condition) {
        echo "  ✓ {$name}" . ($details ? " — {$details}" : '') . "\n";
        $pass++;
    } else {
        echo "  ✗ {$name}" . ($details ? " — {$details}" : '') . "\n";
        $fail++;
    }
}

function section(string $name): void
{
    echo "\n── {$name} ──\n";
}

function cleanup(): void
{
    // Clean up test data
    $testRoles = Role::where('name', 'LIKE', 'Test%')->get();
    foreach ($testRoles as $role) {
        $role->forceFill(['permission_id' => []])->save();
        $role->delete();
    }

    $testUsers = User::where('email', 'LIKE', 'test-role%@test.com')->get();
    foreach ($testUsers as $user) {
        $user->delete();
    }

    \Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
}

// ─────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────
echo "Roles & Permissions Test Suite\n";
echo "════════════════════════════════\n";

cleanup();

// Get or create tenant
$tenant = Organization::first();
if (!$tenant) {
    $tenant = Organization::create([
        'name' => 'Test Org',
        'status' => OrganizationStatus::ACTIVE,
        'is_active' => true,
    ]);
}

// Ensure all permissions exist
$allPermNames = [
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
    'settings.view', 'settings.edit',
    'files.view', 'files.create', 'files.edit', 'files.delete',
];

foreach ($allPermNames as $name) {
    $perm = Permission::firstOrNew(['name' => $name]);
    $perm->tenant_type = 'core.organization';
    $perm->tenant_id = $tenant->getKey();
    $perm->guard_name = 'web';
    $perm->save();
}

\Illuminate\Support\Facades\Artisan::call('permission:cache-reset');

$allPerms = Permission::whereIn('name', $allPermNames)->get();
$filesPerms = Permission::whereIn('name', ['files.view', 'files.create', 'files.edit', 'files.delete'])->get();
$usersPerms = Permission::whereIn('name', ['users.view', 'users.create', 'users.edit', 'users.delete'])->get();

// ─────────────────────────────────────────────────────────
section('1. Permission Creation & Existence');
// ─────────────────────────────────────────────────────────

test('All 14 permissions exist in DB', Permission::whereIn('name', $allPermNames)->count() === 14,
    'Found: ' . Permission::whereIn('name', $allPermNames)->count());

test('File permissions exist', $filesPerms->count() === 4,
    'files.view, files.create, files.edit, files.delete');

foreach ($filesPerms as $perm) {
    test("Permission '{$perm->name}' has correct guard", $perm->guard_name === 'web');
}

// ─────────────────────────────────────────────────────────
section('2. Role Creation with Permissions');
// ─────────────────────────────────────────────────────────

// Create a test role with file permissions only
$testRole = new Role;
app(UpsertRole::class)->execute(
    $testRole,
    'Test Editor',
    tenant: $tenant,
    permissions: $filesPerms->all(),
);

test('Test Editor role created', $testRole->exists && $testRole->name === 'Test Editor');
test('Role has 4 permissions in embedded array', count($testRole->getOriginal('permission_id')) === 4,
    'Count: ' . count($testRole->getOriginal('permission_id')));
test('Role permissions relationship loads 4', $testRole->permissions->count() === 4,
    'Loaded: ' . $testRole->permissions->count());
test('Role has files.view', $testRole->permissions->contains('name', 'files.view'));
test('Role has files.create', $testRole->permissions->contains('name', 'files.create'));
test('Role has files.edit', $testRole->permissions->contains('name', 'files.edit'));
test('Role has files.delete', $testRole->permissions->contains('name', 'files.delete'));
test('Role does NOT have users.view', !$testRole->permissions->contains('name', 'users.view'));

// ─────────────────────────────────────────────────────────
section('3. User Permission Checks (via role)');
// ─────────────────────────────────────────────────────────

$testUser = User::create([
    'first_name' => 'Test',
    'last_name' => 'Editor',
    'email' => 'test-role1@test.com',
    'password' => bcrypt('password'),
    'email_verified_at' => now(),
    'tenant_type' => 'core.organization',
    'tenant_id' => $tenant->getKey(),
]);
$testUser->assignRole($testRole);

\Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
$testUser->refresh();

test('User has Test Editor role', $testUser->hasRole('Test Editor'));
test('User can files.view', $testUser->can('files.view'));
test('User can files.create', $testUser->can('files.create'));
test('User can files.edit', $testUser->can('files.edit'));
test('User can files.delete', $testUser->can('files.delete'));
test('User cannot users.view', !$testUser->can('users.view'));
test('User cannot roles.view', !$testUser->can('roles.view'));
test('User cannot settings.view', !$testUser->can('settings.view'));
test('User cannot nonexistent.perm', !$testUser->can('nonexistent.perm'));

// ─────────────────────────────────────────────────────────
section('4. Updating Role Permissions (Remove file perms)');
// ─────────────────────────────────────────────────────────

// Simulate removing file permissions via UpsertRole (like Edit Role page does)
app(UpsertRole::class)->execute(
    $testRole,
    'Test Editor',
    tenant: $tenant,
    permissions: $usersPerms->all(), // Now only user permissions
);

test('Role now has 4 permissions (users)', count($testRole->getOriginal('permission_id')) === 4,
    'Count: ' . count($testRole->getOriginal('permission_id')));
test('Role has users.view', $testRole->permissions->contains('name', 'users.view'));
test('Role does NOT have files.view', !$testRole->permissions->contains('name', 'files.view'));
test('Role does NOT have files.create', !$testRole->permissions->contains('name', 'files.create'));
test('Role does NOT have files.edit', !$testRole->permissions->contains('name', 'files.edit'));
test('Role does NOT have files.delete', !$testRole->permissions->contains('name', 'files.delete'));

// ─────────────────────────────────────────────────────────
section('5. User Permission Checks After Removal');
// ─────────────────────────────────────────────────────────

\Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
$testUser->refresh();

test('User can still users.view', $testUser->can('users.view'));
test('User can NOT files.view', !$testUser->can('files.view'));
test('User can NOT files.create', !$testUser->can('files.create'));
test('User can NOT files.edit', !$testUser->can('files.edit'));
test('User can NOT files.delete', !$testUser->can('files.delete'));

// ─────────────────────────────────────────────────────────
section('6. Adding Permissions Back');
// ─────────────────────────────────────────────────────────

$allPermsCollection = Permission::whereIn('name', $allPermNames)->get();
app(UpsertRole::class)->execute(
    $testRole,
    'Test Editor',
    tenant: $tenant,
    permissions: $allPermsCollection->all(),
);

\Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
$testUser->refresh();

test('Role has 14 permissions', count($testRole->getOriginal('permission_id')) === 14,
    'Count: ' . count($testRole->getOriginal('permission_id')));
test('User can files.view again', $testUser->can('files.view'));
test('User can users.view again', $testUser->can('users.view'));
test('User can settings.edit again', $testUser->can('settings.edit'));

// ─────────────────────────────────────────────────────────
section('7. Empty Permissions (no access)');
// ─────────────────────────────────────────────────────────

app(UpsertRole::class)->execute(
    $testRole,
    'Test Editor',
    tenant: $tenant,
    permissions: [],
);

\Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
$testUser->refresh();

test('Role has 0 permissions', count($testRole->getOriginal('permission_id')) === 0,
    'Count: ' . count($testRole->getOriginal('permission_id')));
test('User can NOT files.view', !$testUser->can('files.view'));
test('User can NOT users.view', !$testUser->can('users.view'));
test('User can NOT settings.view', !$testUser->can('settings.view'));

// ─────────────────────────────────────────────────────────
section('8. Super Admin Role');
// ─────────────────────────────────────────────────────────

$superAdmin = Role::where('name', 'Super Admin')->first();
if ($superAdmin) {
    $adminUser = User::where('email', 'admin@nova-starter.test')->first();
    if ($adminUser) {
        test('Super Admin role exists', true);
        test('Admin user exists', true);

        // Super Admin should have all permissions via the role
        $saPermCount = count($superAdmin->getOriginal('permission_id') ?? []);
        test('Super Admin has permissions in embedded array', $saPermCount > 0,
            "Count: {$saPermCount}");

        // Test each permission
        foreach ($allPermNames as $permName) {
            $hasPerm = $adminUser->can($permName);
            test("Admin can {$permName}", $hasPerm);
        }
    } else {
        test('Admin user exists', false, 'admin@nova-starter.test not found');
    }
} else {
    test('Super Admin role exists', false);
}

// ─────────────────────────────────────────────────────────
section('9. Navigation Filtering');
// ─────────────────────────────────────────────────────────

// Test with user that has files.view
$navService = app(\App\Services\NavigationService::class);

// Login as test user with no permissions
\Illuminate\Support\Facades\Auth::login($testUser);
$nav = $navService->getNavigation();
$filesInNav = collect($nav)->contains(fn ($item) => $item['label'] === 'Files');
test('Files hidden from nav when no files.view', !$filesInNav);

// Give back files.view permission
app(UpsertRole::class)->execute(
    $testRole,
    'Test Editor',
    tenant: $tenant,
    permissions: $filesPerms->all(),
);
\Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
$testUser->refresh();
\Illuminate\Support\Facades\Auth::login($testUser);

$nav = $navService->getNavigation();
$filesInNav = collect($nav)->contains(fn ($item) => $item['label'] === 'Files');
test('Files visible in nav when has files.view', $filesInNav);

// Check Administration section is hidden (no users.view or roles.view)
$adminInNav = collect($nav)->contains(fn ($item) => $item['label'] === 'Administration');
test('Administration hidden when no admin perms', !$adminInNav);

// ─────────────────────────────────────────────────────────
section('10. Route Protection (Middleware)');
// ─────────────────────────────────────────────────────────

// Test that /files returns 403 without files.view
$testUser->refresh();
\Illuminate\Support\Facades\Auth::login($testUser);

// User has files.view now, should get 200
$response = app()->handle(\Illuminate\Http\Request::create('/files', 'GET'));
test('/files accessible with files.view', $response->getStatusCode() === 200 || $response->getStatusCode() === 302,
    'Status: ' . $response->getStatusCode());

// Remove files.view
app(UpsertRole::class)->execute(
    $testRole,
    'Test Editor',
    tenant: $tenant,
    permissions: [],
);
\Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
$testUser->refresh();
\Illuminate\Support\Facades\Auth::login($testUser);

$response = app()->handle(\Illuminate\Http\Request::create('/files', 'GET'));
test('/files blocked (403) without files.view', $response->getStatusCode() === 403,
    'Status: ' . $response->getStatusCode());

$response = app()->handle(\Illuminate\Http\Request::create('/users', 'GET'));
test('/users blocked (403) without users.view', $response->getStatusCode() === 403,
    'Status: ' . $response->getStatusCode());

// ─────────────────────────────────────────────────────────
section('11. API Route Protection');
// ─────────────────────────────────────────────────────────

// Test API endpoints with files.view
app(UpsertRole::class)->execute(
    $testRole,
    'Test Editor',
    tenant: $tenant,
    permissions: $filesPerms->all(),
);
\Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
$testUser->refresh();

$apiRequest = \Illuminate\Http\Request::create('/api/v1/files', 'GET');
$apiRequest->headers->set('Accept', 'application/json');
$apiRequest->setUserResolver(fn () => $testUser);
$response = app()->handle($apiRequest);
test('API /v1/files accessible with files.view', $response->getStatusCode() !== 403,
    'Status: ' . $response->getStatusCode());

// Remove files.view, test API
app(UpsertRole::class)->execute(
    $testRole,
    'Test Editor',
    tenant: $tenant,
    permissions: [],
);
\Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
$testUser->refresh();

$apiRequest = \Illuminate\Http\Request::create('/api/v1/files', 'GET');
$apiRequest->headers->set('Accept', 'application/json');
$apiRequest->setUserResolver(fn () => $testUser);
$response = app()->handle($apiRequest);
test('API /v1/files blocked without files.view', $response->getStatusCode() === 403,
    'Status: ' . $response->getStatusCode());

// ─────────────────────────────────────────────────────────
// CLEANUP & SUMMARY
// ─────────────────────────────────────────────────────────

cleanup();

echo "\n════════════════════════════════\n";
echo "Results: {$pass} passed, {$fail} failed\n";
if ($fail > 0) {
    echo "STATUS: FAILED\n";
    exit(1);
} else {
    echo "STATUS: ALL TESTS PASSED\n";
    exit(0);
}
