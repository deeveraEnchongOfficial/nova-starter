<?php

namespace Tests\Feature\FileUpload;

use App\Services\Core\File\Actions\ConfirmFileUpload;
use App\Services\Core\File\File;
use App\Services\Core\File\FileRepository;
use App\Services\Core\Role\Permission;
use App\Services\Core\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ConfirmFileUploadTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $permissions = ['files.view', 'files.create', 'files.edit', 'files.delete'];
        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name], ['guard_name' => 'web']);
        }
        $this->user->givePermissionTo($permissions);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->postJson('/api/v1/files/confirm', [
            'purpose' => 'default',
            'key' => 'tmp-'.now()->format('Y-m-d').'/'.$this->user->getKey().'/default-test.txt',
        ]);

        $response->assertUnauthorized();
    }

    public function test_validates_required_purpose(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'key' => 'tmp-'.now()->format('Y-m-d').'/'.$this->user->getKey().'/default-test.txt',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['purpose']);
    }

    public function test_validates_invalid_purpose(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'purpose' => 'invalid_purpose',
                'key' => 'tmp-'.now()->format('Y-m-d').'/'.$this->user->getKey().'/default-test.txt',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['purpose']);
    }

    public function test_validates_required_key(): void
    {
        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'purpose' => 'default',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['key']);
    }

    public function test_validates_key_must_contain_user_id(): void
    {
        Storage::fake('s3');
        Storage::disk('s3')->put('tmp-'.now()->format('Y-m-d').'/some-other-user/default-test.txt', 'test');

        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'purpose' => 'default',
                'key' => 'tmp-'.now()->format('Y-m-d').'/some-other-user/default-test.txt',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['key']);
    }

    public function test_validates_key_must_exist_in_storage(): void
    {
        Storage::fake('s3');

        $key = 'tmp-'.now()->format('Y-m-d').'/'.$this->user->getKey().'/default-nonexistent.txt';

        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'purpose' => 'default',
                'key' => $key,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['key']);
    }

    public function test_validates_category_must_be_valid_enum(): void
    {
        Storage::fake('s3');
        $key = 'tmp-'.now()->format('Y-m-d').'/'.$this->user->getKey().'/default-test.txt';
        Storage::disk('s3')->put($key, 'test');

        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'purpose' => 'default',
                'key' => $key,
                'category' => 'invalid_category',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['category']);
    }

    public function test_validates_description_max_length(): void
    {
        Storage::fake('s3');
        $key = 'tmp-'.now()->format('Y-m-d').'/'.$this->user->getKey().'/default-test.txt';
        Storage::disk('s3')->put($key, 'test');

        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'purpose' => 'default',
                'key' => $key,
                'description' => str_repeat('x', 151),
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['description']);
    }

    public function test_successful_confirm_returns_file_id_and_url(): void
    {
        Storage::fake('s3');
        $key = 'tmp-'.now()->format('Y-m-d').'/'.$this->user->getKey().'/default-test.txt';
        Storage::disk('s3')->put($key, 'Hello World!');

        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'purpose' => 'default',
                'key' => $key,
                'name' => 'test.txt',
                'category' => 'documents',
                'description' => 'Test file',
            ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'id',
            'url',
        ]);

        $fileId = $response->json('id');
        $this->assertNotEmpty($fileId);

        // Verify the File record was created in the database
        $file = File::find($fileId);
        $this->assertNotNull($file);
        $this->assertSame('test.txt', $file->name);
        $this->assertSame('s3', $file->disk);
    }

    public function test_confirm_moves_file_from_temporary_to_permanent_location(): void
    {
        Storage::fake('s3');
        $key = 'tmp-'.now()->format('Y-m-d').'/'.$this->user->getKey().'/default-test.txt';
        Storage::disk('s3')->put($key, 'Hello World!');

        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'purpose' => 'default',
                'key' => $key,
                'name' => 'test.txt',
            ]);

        $response->assertOk();

        // The file should be moved from tmp-.../... to a permanent path
        // Without a folder, the permanent key is {userId}/{name}
        $permanentKey = $this->user->getKey().'/test.txt';

        // Temporary key should no longer exist
        $this->assertFalse(Storage::disk('s3')->exists($key));

        // Permanent key should exist
        $this->assertTrue(Storage::disk('s3')->exists($permanentKey));
    }

    public function test_confirm_associates_uploaded_by_user(): void
    {
        Storage::fake('s3');
        $key = 'tmp-'.now()->format('Y-m-d').'/'.$this->user->getKey().'/default-test.txt';
        Storage::disk('s3')->put($key, 'Hello World!');

        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'purpose' => 'default',
                'key' => $key,
                'name' => 'test.txt',
            ]);

        $response->assertOk();

        $file = File::find($response->json('id'));
        $this->assertNotNull($file);
        $this->assertSame($this->user->getKey(), $file->createdBy->getKey());
    }

    public function test_confirm_stores_metadata(): void
    {
        Storage::fake('s3');
        $key = 'tmp-'.now()->format('Y-m-d').'/'.$this->user->getKey().'/default-test.txt';
        Storage::disk('s3')->put($key, 'Hello World!');

        $response = $this
            ->actingAs($this->user)
            ->postJson('/api/v1/files/confirm', [
                'purpose' => 'default',
                'key' => $key,
                'name' => 'test.txt',
                'category' => 'documents',
                'description' => 'A test file',
            ]);

        $response->assertOk();

        $file = File::find($response->json('id'));
        $this->assertNotNull($file);
        $this->assertSame('documents', $file->__metadata['category']);
        $this->assertSame('A test file', $file->__metadata['description']);
        $this->assertTrue($file->__metadata['listable']);
    }
}
