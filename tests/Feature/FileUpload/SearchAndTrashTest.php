<?php

namespace Tests\Feature\FileUpload;

use App\Services\Core\File\File;
use App\Services\Core\File\Folder;
use App\Services\Core\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SearchAndTrashTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('s3');
        $this->user = User::factory()->create();
    }

    private function createFile(User $user, string $name): File
    {
        $path = $user->getKey().'/'.$name;
        Storage::disk('s3')->put($path, 'content');

        $file = File::forceMake([
            'name' => $name,
            'path' => $path,
            'disk' => 's3',
            'size' => 7,
            'mime_type' => 'text/plain',
        ]);
        $file->replaceMetadata(['visibility' => 'private', 'is_starred' => false]);
        $file->createdBy()->associate($user);
        $file->save();

        return $file;
    }

    // === Search ===

    public function test_search_requires_query(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/search');
        $response->assertUnprocessable();
    }

    public function test_search_finds_files_by_name(): void
    {
        $this->createFile($this->user, 'report-q1.txt');
        $this->createFile($this->user, 'report-q2.txt');
        $this->createFile($this->user, 'notes.txt');

        $response = $this->actingAs($this->user)->getJson('/api/v1/search?q=report');

        $response->assertOk();
        $this->assertCount(2, $response->json('files'));
        $this->assertCount(0, $response->json('folders'));
    }

    public function test_search_finds_folders_by_name(): void
    {
        $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Reports']);
        $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Images']);

        $response = $this->actingAs($this->user)->getJson('/api/v1/search?q=report');

        $response->assertOk();
        $this->assertCount(1, $response->json('folders'));
        $this->assertSame('Reports', $response->json('folders.0.name'));
    }

    public function test_search_returns_empty_for_no_matches(): void
    {
        $this->createFile($this->user, 'test.txt');

        $response = $this->actingAs($this->user)->getJson('/api/v1/search?q=nonexistent');

        $response->assertOk();
        $this->assertCount(0, $response->json('files'));
        $this->assertCount(0, $response->json('folders'));
    }

    // === Trash ===

    public function test_can_list_trashed_items(): void
    {
        $file = $this->createFile($this->user, 'trashed.txt');
        $this->actingAs($this->user)->deleteJson('/api/v1/files/'.$file->id);

        $folderResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'TrashedFolder']);
        $this->actingAs($this->user)->deleteJson('/api/v1/folders/'.$folderResponse->json('id'));

        $response = $this->actingAs($this->user)->getJson('/api/v1/trash');

        $response->assertOk();
        $this->assertCount(1, $response->json('files'));
        $this->assertCount(1, $response->json('folders'));
    }

    public function test_can_empty_trash(): void
    {
        $file = $this->createFile($this->user, 'trashed.txt');
        $this->actingAs($this->user)->deleteJson('/api/v1/files/'.$file->id);

        $response = $this->actingAs($this->user)->deleteJson('/api/v1/trash');

        $response->assertOk();
        $this->assertNull(File::withTrashed()->find($file->id));
    }

    public function test_empty_trash_does_not_affect_non_trashed_files(): void
    {
        $activeFile = $this->createFile($this->user, 'active.txt');
        $trashedFile = $this->createFile($this->user, 'trashed.txt');
        $this->actingAs($this->user)->deleteJson('/api/v1/files/'.$trashedFile->id);

        $this->actingAs($this->user)->deleteJson('/api/v1/trash');

        $this->assertNotNull(File::find($activeFile->id));
        $this->assertNull(File::withTrashed()->find($trashedFile->id));
    }
}
