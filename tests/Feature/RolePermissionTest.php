<?php

namespace Tests\Feature;

use App\Services\Core\Organization\Organization;
use App\Services\Core\Organization\OrganizationStatus;
use App\Services\Core\Role\Actions\UpsertRole;
use App\Services\Core\Role\Permission;
use App\Services\Core\Role\Role;
use App\Services\Core\User\User;
use App\Services\NavigationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    private Organization $tenant;
    private Role $testRole;
    private User $testUser;

    /** @var string[] */
    private array $allPermNames = [
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        'settings.view', 'settings.edit',
        'files.view', 'files.create', 'files.edit', 'files.delete',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Organization::create([
            'name' => 'Test Org',
            'status' => OrganizationStatus::ACTIVE,
            'is_active' => true,
        ]);

        foreach ($this->allPermNames as $name) {
            $perm = Permission::firstOrNew(['name' => $name]);
            $perm->tenant_type = 'core.organization';
            $perm->tenant_id = $this->tenant->getKey();
            $perm->guard_name = 'web';
            $perm->save();
        }

        Artisan::call('permission:cache-reset');

        $this->testRole = new Role;
        $this->testUser = User::create([
            'first_name' => 'Test',
            'last_name' => 'Editor',
            'email' => 'test-role1@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'tenant_type' => 'core.organization',
            'tenant_id' => $this->tenant->getKey(),
        ]);
    }

    public function test_all_14_permissions_exist_in_db(): void
    {
        $this->assertSame(14, Permission::whereIn('name', $this->allPermNames)->count());
    }

    public function test_file_permissions_exist_with_correct_guard(): void
    {
        $filesPerms = Permission::whereIn('name', ['files.view', 'files.create', 'files.edit', 'files.delete'])->get();

        $this->assertCount(4, $filesPerms);

        foreach ($filesPerms as $perm) {
            $this->assertSame('web', $perm->guard_name);
        }
    }

    public function test_role_creation_with_permissions(): void
    {
        $filesPerms = Permission::whereIn('name', ['files.view', 'files.create', 'files.edit', 'files.delete'])->get();

        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: $filesPerms->all(),
        );

        $this->assertTrue($this->testRole->exists);
        $this->assertSame('Test Editor', $this->testRole->name);
        $this->assertCount(4, $this->testRole->getOriginal('permission_id'));
        $this->assertCount(4, $this->testRole->permissions);
        $this->assertTrue($this->testRole->permissions->contains('name', 'files.view'));
        $this->assertTrue($this->testRole->permissions->contains('name', 'files.create'));
        $this->assertTrue($this->testRole->permissions->contains('name', 'files.edit'));
        $this->assertTrue($this->testRole->permissions->contains('name', 'files.delete'));
        $this->assertFalse($this->testRole->permissions->contains('name', 'users.view'));
    }

    public function test_user_permission_checks_via_role(): void
    {
        $filesPerms = Permission::whereIn('name', ['files.view', 'files.create', 'files.edit', 'files.delete'])->get();

        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: $filesPerms->all(),
        );

        $this->testUser->assignRole($this->testRole);
        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();

        $this->assertTrue($this->testUser->hasRole('Test Editor'));
        $this->assertTrue($this->testUser->can('files.view'));
        $this->assertTrue($this->testUser->can('files.create'));
        $this->assertTrue($this->testUser->can('files.edit'));
        $this->assertTrue($this->testUser->can('files.delete'));
        $this->assertFalse($this->testUser->can('users.view'));
        $this->assertFalse($this->testUser->can('roles.view'));
        $this->assertFalse($this->testUser->can('settings.view'));
        $this->assertFalse($this->testUser->can('nonexistent.perm'));
    }

    public function test_updating_role_permissions_removes_old_perms(): void
    {
        $filesPerms = Permission::whereIn('name', ['files.view', 'files.create', 'files.edit', 'files.delete'])->get();
        $usersPerms = Permission::whereIn('name', ['users.view', 'users.create', 'users.edit', 'users.delete'])->get();

        // Start with file permissions
        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: $filesPerms->all(),
        );

        $this->testUser->assignRole($this->testRole);
        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();
        $this->assertTrue($this->testUser->can('files.view'));

        // Switch to user permissions
        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: $usersPerms->all(),
        );

        $this->assertCount(4, $this->testRole->getOriginal('permission_id'));
        $this->assertTrue($this->testRole->permissions->contains('name', 'users.view'));
        $this->assertFalse($this->testRole->permissions->contains('name', 'files.view'));
        $this->assertFalse($this->testRole->permissions->contains('name', 'files.create'));
        $this->assertFalse($this->testRole->permissions->contains('name', 'files.edit'));
        $this->assertFalse($this->testRole->permissions->contains('name', 'files.delete'));

        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();
        $this->assertTrue($this->testUser->can('users.view'));
        $this->assertFalse($this->testUser->can('files.view'));
        $this->assertFalse($this->testUser->can('files.create'));
        $this->assertFalse($this->testUser->can('files.edit'));
        $this->assertFalse($this->testUser->can('files.delete'));
    }

    public function test_adding_all_permissions_back(): void
    {
        $allPerms = Permission::whereIn('name', $this->allPermNames)->get();

        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: $allPerms->all(),
        );

        $this->testUser->assignRole($this->testRole);
        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();

        $this->assertCount(14, $this->testRole->getOriginal('permission_id'));
        $this->assertTrue($this->testUser->can('files.view'));
        $this->assertTrue($this->testUser->can('users.view'));
        $this->assertTrue($this->testUser->can('settings.edit'));
    }

    public function test_empty_permissions_grants_no_access(): void
    {
        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: [],
        );

        $this->testUser->assignRole($this->testRole);
        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();

        $this->assertCount(0, $this->testRole->getOriginal('permission_id'));
        $this->assertFalse($this->testUser->can('files.view'));
        $this->assertFalse($this->testUser->can('users.view'));
        $this->assertFalse($this->testUser->can('settings.view'));
    }

    public function test_navigation_filtering_hides_items_without_permission(): void
    {
        $filesPerms = Permission::whereIn('name', ['files.view', 'files.create', 'files.edit', 'files.delete'])->get();

        // No permissions — Files should be hidden
        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: [],
        );
        $this->testUser->assignRole($this->testRole);
        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();
        Auth::login($this->testUser);

        $nav = app(NavigationService::class)->getNavigation();
        $this->assertFalse(collect($nav)->contains(fn ($item) => $item['label'] === 'Files'));
        $this->assertFalse(collect($nav)->contains(fn ($item) => $item['label'] === 'Administration'));

        // Grant files.view — Files should now be visible
        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: $filesPerms->all(),
        );
        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();
        Auth::login($this->testUser);

        $nav = app(NavigationService::class)->getNavigation();
        $this->assertTrue(collect($nav)->contains(fn ($item) => $item['label'] === 'Files'));
    }

    public function test_route_protection_blocks_without_permission(): void
    {
        $filesPerms = Permission::whereIn('name', ['files.view', 'files.create', 'files.edit', 'files.delete'])->get();

        // Grant files.view
        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: $filesPerms->all(),
        );
        $this->testUser->assignRole($this->testRole);
        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();

        $response = $this->actingAs($this->testUser)->get('/files');
        $this->assertContains($response->getStatusCode(), [200, 302]);

        // Remove all permissions
        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: [],
        );
        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();

        $response = $this->actingAs($this->testUser)->get('/files');
        $response->assertForbidden();

        $response = $this->actingAs($this->testUser)->get('/users');
        $response->assertForbidden();
    }

    public function test_api_route_protection(): void
    {
        $filesPerms = Permission::whereIn('name', ['files.view', 'files.create', 'files.edit', 'files.delete'])->get();

        // Grant files.view — API should work
        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: $filesPerms->all(),
        );
        $this->testUser->assignRole($this->testRole);
        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();

        $response = $this->actingAs($this->testUser, 'sanctum')->getJson('/api/v1/files');
        $this->assertNotEquals(403, $response->getStatusCode());

        // Remove files.view — API should be forbidden
        app(UpsertRole::class)->execute(
            $this->testRole,
            'Test Editor',
            tenant: $this->tenant,
            permissions: [],
        );
        Artisan::call('permission:cache-reset');
        $this->testUser->refresh();

        $response = $this->actingAs($this->testUser, 'sanctum')->getJson('/api/v1/files');
        $response->assertForbidden();
    }
}
