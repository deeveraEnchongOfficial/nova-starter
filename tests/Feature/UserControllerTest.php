<?php

namespace Tests\Feature;

use App\Services\Core\Organization\Actions\UpsertOrganization;
use App\Services\Core\Organization\Organization;
use App\Services\Core\Organization\OrganizationStatus;
use App\Services\Core\Role\Permission;
use App\Services\Core\Role\Role;
use App\Services\Core\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $isMultiTenant = config('features.multi_tenant', false);

        if ($isMultiTenant) {
            $organization = app(UpsertOrganization::class)->execute(
                new Organization,
                'Test Org',
                OrganizationStatus::ACTIVE->value,
                true,
            );
        }

        // Create permissions and roles
        $permissions = [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        ];

        foreach ($permissions as $permission) {
            $model = Permission::firstOrNew(['name' => $permission]);
            if (isset($organization)) {
                $model->tenant_type = 'core.organization';
                $model->tenant_id = $organization->getKey();
            }
            $model->save();
        }

        $adminRole = Role::firstOrNew(['name' => 'Super Admin']);
        if (isset($organization)) {
            $adminRole->tenant_type = 'core.organization';
            $adminRole->tenant_id = $organization->getKey();
        }
        $adminRole->save();
        $adminRole->syncPermissions($permissions);

        $this->admin = User::factory()->create();
        if (isset($organization)) {
            $this->admin->tenant()->associate($organization);
            $this->admin->save();
        }
        $this->admin->assignRole($adminRole);
    }

    public function test_users_index_requires_authentication(): void
    {
        $response = $this->get('/users');

        $response->assertRedirect('/login');
    }

    public function test_users_index_requires_permission(): void
    {
        $user = User::factory()->create();
        if ($this->admin->tenant) {
            $user->tenant()->associate($this->admin->tenant);
            $user->save();
        }

        $response = $this->actingAs($user)->get('/users');

        $response->assertForbidden();
    }

    public function test_users_index_is_displayed(): void
    {
        $response = $this->actingAs($this->admin)->get('/users');

        $response->assertOk();
    }

    public function test_create_user_page_is_displayed(): void
    {
        $response = $this->actingAs($this->admin)->get('/users/create');

        $response->assertOk();
    }

    public function test_admin_can_create_user(): void
    {
        $email = fake()->unique()->safeEmail();

        $response = $this->actingAs($this->admin)->post('/users', [
            'first_name' => 'John',
            'middle_name' => 'Michael',
            'last_name' => 'Doe',
            'email' => $email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [],
        ]);

        $response->assertRedirect('/users');

        $user = User::where('email', $email)->first();
        $this->assertNotNull($user);
        $this->assertEquals('John', $user->first_name);
        $this->assertEquals('Michael', $user->middle_name);
        $this->assertEquals('Doe', $user->last_name);
    }

    public function test_create_user_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin)->post('/users', []);

        $response->assertSessionHasErrors(['first_name', 'last_name', 'email', 'password']);
    }

    public function test_create_user_validates_unique_email(): void
    {
        $response = $this->actingAs($this->admin)->post('/users', [
            'first_name' => 'John',
            'middle_name' => null,
            'last_name' => 'Doe',
            'email' => $this->admin->email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [],
        ]);

        $response->assertSessionHasErrors(['email']);
    }

    public function test_edit_user_page_is_displayed(): void
    {
        $user = User::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
        ]);
        if ($this->admin->tenant) {
            $user->tenant()->associate($this->admin->tenant);
            $user->save();
        }

        $response = $this->actingAs($this->admin)->get("/users/{$user->id}/edit");

        $response->assertOk();
    }

    public function test_admin_can_update_user(): void
    {
        $user = User::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
        ]);
        if ($this->admin->tenant) {
            $user->tenant()->associate($this->admin->tenant);
            $user->save();
        }

        $newEmail = fake()->unique()->safeEmail();

        $response = $this->actingAs($this->admin)->put("/users/{$user->id}", [
            'first_name' => 'JaneUpdated',
            'middle_name' => 'Marie',
            'last_name' => 'SmithUpdated',
            'email' => $newEmail,
            'password' => '',
            'password_confirmation' => '',
            'roles' => [],
        ]);

        $response->assertRedirect('/users');

        $user->refresh();
        $this->assertEquals('JaneUpdated', $user->first_name);
        $this->assertEquals('Marie', $user->middle_name);
        $this->assertEquals('SmithUpdated', $user->last_name);
        $this->assertEquals($newEmail, $user->email);
    }

    public function test_admin_can_update_user_with_new_password(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('oldpassword'),
        ]);
        if ($this->admin->tenant) {
            $user->tenant()->associate($this->admin->tenant);
            $user->save();
        }

        $response = $this->actingAs($this->admin)->put("/users/{$user->id}", [
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
            'roles' => [],
        ]);

        $response->assertRedirect('/users');

        $user->refresh();
        $this->assertTrue(password_verify('newpassword123', $user->password));
    }

    public function test_admin_can_delete_user(): void
    {
        $user = User::factory()->create();
        if ($this->admin->tenant) {
            $user->tenant()->associate($this->admin->tenant);
            $user->save();
        }

        $response = $this->actingAs($this->admin)->delete("/users/{$user->id}");

        $response->assertRedirect('/users');
        $this->assertNull(User::find($user->id));
    }

    public function test_new_user_inherits_admin_tenant(): void
    {
        if (!config('features.multi_tenant', false)) {
            $this->markTestSkipped('Multi-tenant is disabled.');
        }

        $email = fake()->unique()->safeEmail();

        $this->actingAs($this->admin)->post('/users', [
            'first_name' => 'Tenant',
            'middle_name' => null,
            'last_name' => 'User',
            'email' => $email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [],
        ]);

        $user = User::where('email', $email)->first();
        $this->assertNotNull($user);
        $this->assertEquals($this->admin->tenant_id, $user->tenant_id);
        $this->assertEquals($this->admin->tenant_type, $user->tenant_type);
    }
}
