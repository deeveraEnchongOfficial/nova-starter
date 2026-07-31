<?php

namespace Tests\Feature\FileUpload;

use App\Services\Core\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InitiateFileUploadTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->postJson('/api/v1/files/initiate', [
            'purpose' => 'default',
            'content_type' => 'text/plain',
            'content_size' => 1024,
        ]);

        $response->assertUnauthorized();
    }

    public function test_validates_required_purpose(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'content_type' => 'text/plain',
                'content_size' => 1024,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['purpose']);
    }

    public function test_validates_invalid_purpose(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'invalid_purpose',
                'content_type' => 'text/plain',
                'content_size' => 1024,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['purpose']);
    }

    public function test_validates_required_content_type(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'default',
                'content_size' => 1024,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['content_type']);
    }

    public function test_validates_required_content_size(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'default',
                'content_type' => 'text/plain',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['content_size']);
    }

    public function test_validates_content_size_is_integer(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'default',
                'content_type' => 'text/plain',
                'content_size' => 'not-an-integer',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['content_size']);
    }

    public function test_validates_content_size_is_positive(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'default',
                'content_type' => 'text/plain',
                'content_size' => 0,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['content_size']);
    }

    public function test_avatar_purpose_rejects_non_image_content_type(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'avatar',
                'content_type' => 'text/plain',
                'content_size' => 1024,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['content_type']);
    }

    public function test_avatar_purpose_accepts_image_content_type(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'avatar',
                'content_type' => 'image/png',
                'content_size' => 1024,
            ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'key',
            'url',
            'headers',
        ]);
    }

    public function test_default_purpose_accepts_any_content_type(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'default',
                'content_type' => 'application/pdf',
                'content_size' => 1024 * 1024 * 10,
            ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'key',
            'url',
            'headers',
        ]);
    }

    public function test_avatar_purpose_rejects_oversized_file(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'avatar',
                'content_type' => 'image/png',
                'content_size' => 1024 * 1024 * 10, // 10MB, max is 5MB
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['content_size']);
    }

    public function test_successful_initiate_returns_key_with_user_id(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'default',
                'content_type' => 'text/plain',
                'content_size' => 1024,
            ]);

        $response->assertOk();

        $key = $response->json('key');
        $this->assertStringContainsString((string) $this->user->getKey(), $key);
        $this->assertStringStartsWith('tmp-', $key);
    }

    public function test_successful_initiate_returns_presigned_url(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'default',
                'content_type' => 'text/plain',
                'content_size' => 1024,
            ]);

        $response->assertOk();

        $url = $response->json('url');
        $this->assertNotEmpty($url);
        $this->assertStringContainsString('X-Amz-Signature', $url);
    }

    public function test_successful_initiate_returns_headers_without_host(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/initiate', [
                'purpose' => 'default',
                'content_type' => 'text/plain',
                'content_size' => 1024,
            ]);

        $response->assertOk();

        $headers = $response->json('headers');
        $this->assertArrayNotHasKey('Host', $headers);
        $this->assertArrayHasKey('Content-Type', $headers);
    }
}
