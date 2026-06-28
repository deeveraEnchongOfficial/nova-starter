<?php

namespace Tests\Unit;

use App\Services\Core\Organization\Organization;
use App\Services\Core\Organization\OrganizationStatus;
use App\Services\Core\User\User;
use Tests\TestCase;

class BelongsToATenantTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['features.multi_tenant' => true]);
    }

    public function test_user_requires_tenant_when_multi_tenant_enabled(): void
    {
        $this->expectException(\LogicException::class);

        User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
        ]);
    }

    public function test_user_saves_successfully_with_tenant(): void
    {
        $organization = Organization::create([
            'name' => 'Test Org',
            'status' => OrganizationStatus::ACTIVE,
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'tenant_type' => 'core.organization',
            'tenant_id' => $organization->_id,
        ]);

        $this->assertNotNull($user->_id);
        $this->assertEquals('core.organization', $user->tenant_type);
        $this->assertEquals($organization->_id, $user->tenant_id);
    }

    public function test_user_tenant_relation_resolves_organization(): void
    {
        $organization = Organization::create([
            'name' => 'Test Org',
            'status' => OrganizationStatus::ACTIVE,
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'tenant_type' => 'core.organization',
            'tenant_id' => $organization->_id,
        ]);

        $tenant = $user->tenant;
        $this->assertInstanceOf(Organization::class, $tenant);
        $this->assertEquals($organization->_id, $tenant->_id);
    }

    public function test_scope_by_tenant_filters_correctly(): void
    {
        $org1 = Organization::create([
            'name' => 'Org One',
            'status' => OrganizationStatus::ACTIVE,
            'is_active' => true,
        ]);

        $org2 = Organization::create([
            'name' => 'Org Two',
            'status' => OrganizationStatus::ACTIVE,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'User One',
            'email' => 'user1@example.com',
            'password' => 'password',
            'tenant_type' => 'core.organization',
            'tenant_id' => $org1->_id,
        ]);

        User::create([
            'name' => 'User Two',
            'email' => 'user2@example.com',
            'password' => 'password',
            'tenant_type' => 'core.organization',
            'tenant_id' => $org2->_id,
        ]);

        $org1Users = User::byTenant($org1)->get();
        $org2Users = User::byTenant($org2)->get();

        $this->assertCount(1, $org1Users);
        $this->assertEquals('User One', $org1Users->first()->name);

        $this->assertCount(1, $org2Users);
        $this->assertEquals('User Two', $org2Users->first()->name);
    }

    public function test_tenant_not_required_when_multi_tenant_disabled(): void
    {
        config(['features.multi_tenant' => false]);

        $user = User::create([
            'name' => 'No Tenant User',
            'email' => 'notenant@example.com',
            'password' => 'password',
        ]);

        $this->assertNotNull($user->_id);
        $this->assertNull($user->tenant_type);
        $this->assertNull($user->tenant_id);
    }

    public function test_organization_factory_creates_valid_model(): void
    {
        $organization = Organization::factory()->create();

        $this->assertNotNull($organization->_id);
        $this->assertEquals(OrganizationStatus::ACTIVE, $organization->status);
        $this->assertTrue($organization->is_active);
    }

    public function test_organization_members_relation(): void
    {
        $organization = Organization::create([
            'name' => 'Test Org',
            'status' => OrganizationStatus::ACTIVE,
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Member User',
            'email' => 'member@example.com',
            'password' => 'password',
            'tenant_type' => 'core.organization',
            'tenant_id' => $organization->_id,
        ]);

        $organization->members()->attach($user->_id);

        $this->assertCount(1, $organization->members);
        $this->assertEquals('Member User', $organization->members->first()->name);
    }

    protected function tearDown(): void
    {
        User::truncate();
        Organization::truncate();

        parent::tearDown();
    }
}
