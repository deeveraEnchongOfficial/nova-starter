<?php

namespace Tests\Feature;

use App\Services\Core\Activity\Activity;
use App\Services\Core\Activity\ActivityLogType;
use App\Services\Core\Activity\Actions\LogActivity;
use App\Services\Core\Activity\ActivityRepository;
use App\Services\Core\Role\Permission;
use App\Services\Core\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        // Clean up any activities persisted by terminable middleware from previous tests
        Activity::query()->delete();
        $this->user = User::factory()->create();
    }

    protected function createPermission(string $name): Permission
    {
        return Permission::firstOrCreate(['name' => $name], ['guard_name' => 'web']);
    }

    public function test_activity_can_be_logged_via_static_method(): void
    {
        $activity = Activity::log(
            type: ActivityLogType::CREATE,
            description: 'Test action',
            causedBy: $this->user,
            properties: ['key' => 'value'],
            ipAddress: '127.0.0.1',
            userAgent: 'TestAgent/1.0',
            route: 'test.route',
            method: 'POST',
        );

        $this->assertNotNull($activity->id);
        $this->assertSame(ActivityLogType::CREATE, $activity->type);
        $this->assertSame('Test action', $activity->description);
        $this->assertSame('127.0.0.1', $activity->ip_address);
        $this->assertSame('TestAgent/1.0', $activity->user_agent);
        $this->assertSame('test.route', $activity->route);
        $this->assertSame('POST', $activity->method);
        $this->assertSame(['key' => 'value'], $activity->properties);
    }

    public function test_activity_can_be_logged_via_action_class(): void
    {
        $activity = app(LogActivity::class)->execute(
            type: ActivityLogType::UPDATE,
            description: 'Updated via action',
            causedBy: $this->user,
        );

        $this->assertNotNull($activity->id);
        $this->assertSame(ActivityLogType::UPDATE, $activity->type);
        $this->assertSame('Updated via action', $activity->description);
    }

    public function test_activity_associates_subject(): void
    {
        $subject = User::factory()->create();

        $activity = Activity::log(
            type: ActivityLogType::UPDATE,
            description: 'Updated user',
            subject: $subject,
            causedBy: $this->user,
        );

        $this->assertSame($subject->id, $activity->subject_id);
        $this->assertSame('core.user', $activity->subject_type);
    }

    public function test_activity_associates_caused_by(): void
    {
        $activity = Activity::log(
            type: ActivityLogType::DELETE,
            description: 'Deleted resource',
            causedBy: $this->user,
        );

        $this->assertSame($this->user->id, $activity->created_by_id);
        $this->assertSame('core.user', $activity->created_by_type);
    }

    public function test_activity_log_type_from_http_method(): void
    {
        $this->assertSame(ActivityLogType::CREATE, ActivityLogType::fromHttpMethod('POST'));
        $this->assertSame(ActivityLogType::UPDATE, ActivityLogType::fromHttpMethod('PUT'));
        $this->assertSame(ActivityLogType::UPDATE, ActivityLogType::fromHttpMethod('PATCH'));
        $this->assertSame(ActivityLogType::DELETE, ActivityLogType::fromHttpMethod('DELETE'));
        $this->assertNull(ActivityLogType::fromHttpMethod('GET'));
    }

    public function test_activity_log_type_label(): void
    {
        $this->assertSame('Created', ActivityLogType::CREATE->label());
        $this->assertSame('Updated', ActivityLogType::UPDATE->label());
        $this->assertSame('Deleted', ActivityLogType::DELETE->label());
        $this->assertSame('Logged In', ActivityLogType::LOGIN->label());
        $this->assertSame('Logged Out', ActivityLogType::LOGOUT->label());
    }

    public function test_feature_flag_disables_logging(): void
    {
        config(['features.activity_logs' => false]);

        $activity = Activity::log(
            type: ActivityLogType::CREATE,
            description: 'Should not be saved',
            causedBy: $this->user,
        );

        $this->assertFalse($activity->exists);
        $this->assertSame(0, Activity::count());
    }

    public function test_activity_index_page_requires_permission(): void
    {
        $response = $this->actingAs($this->user)->get('/activity-logs');

        $response->assertForbidden();
    }

    public function test_activity_index_page_loads_with_permission(): void
    {
        $this->createPermission('activity-logs.view');
        $this->user->givePermissionTo('activity-logs.view');

        $this->withoutVite();

        $response = $this->actingAs($this->user)->get('/activity-logs');

        $response->assertOk();
    }

    public function test_activity_show_page_loads_with_permission(): void
    {
        $this->createPermission('activity-logs.view');
        $this->user->givePermissionTo('activity-logs.view');

        $activity = Activity::log(
            type: ActivityLogType::CREATE,
            description: 'Test activity for show',
            causedBy: $this->user,
        );

        // Use withoutMiddleware to avoid Vite manifest issues in test env
        $this->withoutVite();

        $response = $this->actingAs($this->user)->get('/activity-logs/'.$activity->id);

        $response->assertOk();
    }

    public function test_activity_show_page_requires_permission(): void
    {
        $activity = Activity::log(
            type: ActivityLogType::CREATE,
            description: 'Test activity',
            causedBy: $this->user,
        );

        $response = $this->actingAs($this->user)->get('/activity-logs/'.$activity->id);

        $response->assertForbidden();
    }

    public function test_middleware_logs_create_action(): void
    {
        $this->createPermission('users.create');
        $this->createPermission('users.view');
        $this->user->givePermissionTo('users.create', 'users.view');

        $response = $this->actingAs($this->user)->post('/users', [
            'first_name' => 'New',
            'middle_name' => null,
            'last_name' => 'User',
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasNoErrors();

        $middleware = app(\App\Http\Middleware\LogUserActivity::class);
        $middleware->terminate(app('request'), $response->baseResponse);

        $activity = Activity::where('type', ActivityLogType::CREATE->value)->first();

        $this->assertNotNull($activity, 'Create action was not logged by middleware');
        $this->assertSame($this->user->id, $activity->created_by_id);
    }

    public function test_middleware_logs_delete_action(): void
    {
        $this->createPermission('users.delete');
        $this->createPermission('users.view');
        $this->user->givePermissionTo('users.delete', 'users.view');
        $targetUser = User::factory()->create();

        $response = $this->actingAs($this->user)->delete('/users/'.$targetUser->id);

        $middleware = app(\App\Http\Middleware\LogUserActivity::class);
        $middleware->terminate(app('request'), $response->baseResponse);

        $activity = Activity::where('type', ActivityLogType::DELETE->value)->first();

        $this->assertNotNull($activity, 'Delete action was not logged by middleware');
    }

    public function test_middleware_does_not_log_get_requests(): void
    {
        $this->createPermission('users.view');
        $this->user->givePermissionTo('users.view');

        $response = $this->actingAs($this->user)->get('/users');

        $middleware = app(\App\Http\Middleware\LogUserActivity::class);
        $middleware->terminate(app('request'), $response->baseResponse);

        $this->assertSame(0, Activity::count());
    }

    public function test_middleware_does_not_log_failed_requests(): void
    {
        $this->createPermission('users.create');
        $this->user->givePermissionTo('users.create');

        $response = $this->actingAs($this->user)->post('/users', [
            'first_name' => '',
            'middle_name' => null,
            'last_name' => '',
            'email' => 'invalid',
            'password' => 'short',
            'password_confirmation' => 'mismatch',
        ]);

        $response->assertSessionHasErrors();

        $middleware = app(\App\Http\Middleware\LogUserActivity::class);
        $middleware->terminate(app('request'), $response->baseResponse);

        $this->assertSame(0, Activity::count());
    }

    public function test_login_event_is_logged(): void
    {
        $user = User::factory()->create([
            'email' => 'logintest@test.com',
            'password' => bcrypt('password'),
        ]);

        $this->post('/login', [
            'email' => 'logintest@test.com',
            'password' => 'password',
        ]);

        $activity = Activity::where('type', ActivityLogType::LOGIN->value)->first();

        $this->assertNotNull($activity, 'Login event was not logged');
        $this->assertStringContainsString('logged in', $activity->description);
    }

    public function test_logout_event_is_logged(): void
    {
        $this->actingAs($this->user)->post('/logout');

        $activity = Activity::where('type', ActivityLogType::LOGOUT->value)->first();

        $this->assertNotNull($activity, 'Logout event was not logged');
        $this->assertStringContainsString('logged out', $activity->description);
    }

    public function test_activity_repository_paginate_all(): void
    {
        Activity::log(type: ActivityLogType::CREATE, description: 'Log 1', causedBy: $this->user);
        Activity::log(type: ActivityLogType::UPDATE, description: 'Log 2', causedBy: $this->user);
        Activity::log(type: ActivityLogType::DELETE, description: 'Log 3', causedBy: $this->user);

        $repository = app(ActivityRepository::class);

        $paginator = $repository->paginateAll(perPage: 2);

        $this->assertSame(3, $paginator->total());
        $this->assertCount(2, $paginator->items());
    }

    public function test_activity_repository_filters_by_type(): void
    {
        Activity::log(type: ActivityLogType::CREATE, description: 'Create log', causedBy: $this->user);
        Activity::log(type: ActivityLogType::DELETE, description: 'Delete log', causedBy: $this->user);

        $repository = app(ActivityRepository::class);

        $paginator = $repository->paginateAll(
            filters: ['type' => ActivityLogType::DELETE->value],
        );

        $this->assertSame(1, $paginator->total());
        $this->assertSame('Delete log', $paginator->items()[0]->description);
    }

    public function test_activity_repository_search(): void
    {
        Activity::log(type: ActivityLogType::CREATE, description: 'Created user John', causedBy: $this->user);
        Activity::log(type: ActivityLogType::DELETE, description: 'Deleted role Admin', causedBy: $this->user);

        $repository = app(ActivityRepository::class);

        $paginator = $repository->paginateAll(search: 'John');

        $this->assertSame(1, $paginator->total());
        $this->assertSame('Created user John', $paginator->items()[0]->description);
    }

    public function test_activity_repository_find_recent(): void
    {
        Activity::log(type: ActivityLogType::CREATE, description: 'Log 1', causedBy: $this->user);
        Activity::log(type: ActivityLogType::CREATE, description: 'Log 2', causedBy: $this->user);
        Activity::log(type: ActivityLogType::CREATE, description: 'Log 3', causedBy: $this->user);

        $repository = app(ActivityRepository::class);

        $recent = $repository->findRecent(2);

        $this->assertCount(2, $recent->all());
    }

    public function test_activity_repository_find_by_user(): void
    {
        $otherUser = User::factory()->create();

        Activity::log(type: ActivityLogType::CREATE, description: 'My log', causedBy: $this->user);
        Activity::log(type: ActivityLogType::CREATE, description: 'Other log', causedBy: $otherUser);

        $repository = app(ActivityRepository::class);

        $logs = $repository->findByUser($this->user->id);

        $this->assertCount(1, $logs);
        $this->assertSame('My log', $logs->first()->description);
    }
}
