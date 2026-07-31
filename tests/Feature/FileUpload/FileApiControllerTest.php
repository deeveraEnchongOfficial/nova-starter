<?php

namespace Tests\Feature\FileUpload;

use App\Services\Core\File\File;
use App\Services\Core\File\Folder;
use App\Services\Core\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileApiControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('s3');
        $this->user = User::factory()->create();
    }

    private function createFile(User $user, string $name = 'test.txt', ?string $folderId = null): File
    {
        $folder = $folderId ? Folder::find($folderId) : null;
        $path = $folder
            ? $folder->full_path.$name
            : $user->getKey().'/'.$name;

        Storage::disk('s3')->put($path, 'test content');

        $file = File::forceMake([
            'name' => $name,
            'path' => $path,
            'disk' => 's3',
            'size' => 12,
            'mime_type' => 'text/plain',
            'folder_id' => $folderId,
        ]);
        $file->replaceMetadata(['visibility' => 'private', 'is_starred' => false]);
        $file->createdBy()->associate($user);
        $file->save();

        return $file;
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/v1/files');
        $response->assertUnauthorized();
    }

    public function test_can_list_files_in_root(): void
    {
        $this->createFile($this->user, 'file1.txt');
        $this->createFile($this->user, 'file2.txt');

        $response = $this->actingAs($this->user)->getJson('/api/v1/files');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_can_list_files_in_folder(): void
    {
        $folderResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Docs']);
        $folderId = $folderResponse->json('id');

        $this->createFile($this->user, 'in-folder.txt', $folderId);
        $this->createFile($this->user, 'in-root.txt');

        $response = $this->actingAs($this->user)->getJson('/api/v1/files?folder_id='.$folderId);

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('in-folder.txt', $response->json('data.0.name'));
    }

    public function test_can_show_file(): void
    {
        $file = $this->createFile($this->user, 'showme.txt');

        $response = $this->actingAs($this->user)->getJson('/api/v1/files/'.$file->id);

        $response->assertOk();
        $this->assertSame('showme.txt', $response->json('data.name'));
    }

    public function test_show_returns_404_for_nonexistent_file(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/files/nonexistent-id');
        $response->assertNotFound();
    }

    public function test_can_rename_file(): void
    {
        $file = $this->createFile($this->user, 'old-name.txt');

        $response = $this->actingAs($this->user)->patchJson('/api/v1/files/'.$file->id, [
            'name' => 'new-name.txt',
        ]);

        $response->assertOk();
        $file->refresh();
        $this->assertSame('new-name.txt', $file->name);
        $this->assertTrue(Storage::disk('s3')->exists($file->path));
    }

    public function test_can_move_file_to_folder(): void
    {
        $file = $this->createFile($this->user, 'move-me.txt');
        $folderResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Target']);
        $folderId = $folderResponse->json('id');

        $response = $this->actingAs($this->user)->patchJson('/api/v1/files/'.$file->id, [
            'folder_id' => $folderId,
        ]);

        $response->assertOk();
        $file->refresh();
        $this->assertSame($folderId, $file->folder_id);
        $this->assertTrue(Storage::disk('s3')->exists($file->path));
    }

    public function test_can_move_file_to_root(): void
    {
        $folderResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Folder']);
        $folderId = $folderResponse->json('id');
        $file = $this->createFile($this->user, 'in-folder.txt', $folderId);

        $response = $this->actingAs($this->user)->patchJson('/api/v1/files/'.$file->id, [
            'folder_id' => null,
        ]);

        $response->assertOk();
        $file->refresh();
        $this->assertNull($file->folder_id);
    }

    public function test_can_delete_file(): void
    {
        $file = $this->createFile($this->user, 'delete-me.txt');

        $response = $this->actingAs($this->user)->deleteJson('/api/v1/files/'.$file->id);

        $response->assertOk();
        $file->refresh();
        $this->assertNotNull($file->deleted_at);
    }

    public function test_can_restore_file(): void
    {
        $file = $this->createFile($this->user, 'restore-me.txt');
        $this->actingAs($this->user)->deleteJson('/api/v1/files/'.$file->id);

        $response = $this->actingAs($this->user)->postJson('/api/v1/files/'.$file->id.'/restore');

        $response->assertOk();
        $file->refresh();
        $this->assertNull($file->deleted_at);
    }

    public function test_can_toggle_star_on_file(): void
    {
        $file = $this->createFile($this->user, 'star-me.txt');

        $response = $this->actingAs($this->user)->postJson('/api/v1/files/'.$file->id.'/star');

        $response->assertOk();
        $this->assertTrue($response->json('is_starred'));
    }

    public function test_can_download_file(): void
    {
        $file = $this->createFile($this->user, 'download-me.txt');

        $response = $this->actingAs($this->user)->getJson('/api/v1/files/'.$file->id.'/download');

        $response->assertOk();
        $response->assertJsonStructure(['url']);
    }

    public function test_delete_returns_404_for_nonexistent_file(): void
    {
        $response = $this->actingAs($this->user)->deleteJson('/api/v1/files/nonexistent-id');
        $response->assertNotFound();
    }
}
