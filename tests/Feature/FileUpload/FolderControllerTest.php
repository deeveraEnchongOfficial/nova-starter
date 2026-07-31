<?php

namespace Tests\Feature\FileUpload;

use App\Services\Core\File\Folder;
use App\Services\Core\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FolderControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('s3');
        $this->user = User::factory()->create();
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->postJson('/api/v1/folders', ['name' => 'Test']);
        $response->assertUnauthorized();
    }

    public function test_validates_required_name_on_create(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/folders', []);
        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_can_create_root_folder(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/folders', [
            'name' => 'Documents',
        ]);

        $response->assertCreated();
        $response->assertJsonStructure(['id', 'name']);
        $this->assertSame('Documents', $response->json('name'));

        $folder = Folder::find($response->json('id'));
        $this->assertNotNull($folder);
        $this->assertNull($folder->parent_id);
        $this->assertSame($this->user->getKey(), $folder->created_by_id);
    }

    public function test_can_create_nested_folder(): void
    {
        $parentResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', [
            'name' => 'Documents',
        ]);
        $parentId = $parentResponse->json('id');

        $childResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', [
            'name' => 'Reports',
            'parent_id' => $parentId,
        ]);

        $childResponse->assertCreated();
        $child = Folder::find($childResponse->json('id'));
        $this->assertSame($parentId, $child->parent_id);
    }

    public function test_can_list_root_folders(): void
    {
        $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Documents']);
        $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Images']);

        $response = $this->actingAs($this->user)->getJson('/api/v1/folders');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_can_list_folders_by_parent(): void
    {
        $parentResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Parent']);
        $parentId = $parentResponse->json('id');

        $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Child1', 'parent_id' => $parentId]);
        $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Child2', 'parent_id' => $parentId]);
        $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'OtherRoot']);

        $response = $this->actingAs($this->user)->getJson('/api/v1/folders?parent_id='.$parentId);

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_can_rename_folder(): void
    {
        $createResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'OldName']);
        $id = $createResponse->json('id');

        // Put a file in the folder's S3 path
        $folder = Folder::find($id);
        Storage::disk('s3')->put($folder->full_path.'test.txt', 'content');

        $response = $this->actingAs($this->user)->patchJson("/api/v1/folders/{$id}", [
            'name' => 'NewName',
        ]);

        $response->assertOk();
        $folder->refresh();
        $this->assertSame('NewName', $folder->name);

        // S3 object should be moved to new prefix
        $this->assertFalse(Storage::disk('s3')->exists('OldName/test.txt') ||
            Storage::disk('s3')->exists($this->user->getKey().'/OldName/test.txt'));
    }

    public function test_can_move_folder_to_root(): void
    {
        $parentResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Parent']);
        $parentId = $parentResponse->json('id');

        $childResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', [
            'name' => 'Child',
            'parent_id' => $parentId,
        ]);
        $childId = $childResponse->json('id');

        $response = $this->actingAs($this->user)->patchJson("/api/v1/folders/{$childId}", [
            'parent_id' => null,
        ]);

        $response->assertOk();
        $child = Folder::find($childId);
        $this->assertNull($child->parent_id);
    }

    public function test_can_delete_folder(): void
    {
        $createResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'ToDelete']);
        $id = $createResponse->json('id');

        $response = $this->actingAs($this->user)->deleteJson("/api/v1/folders/{$id}");

        $response->assertOk();
        $folder = Folder::withTrashed()->find($id);
        $this->assertNotNull($folder->deleted_at);
    }

    public function test_can_restore_folder(): void
    {
        $createResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'ToRestore']);
        $id = $createResponse->json('id');

        $this->actingAs($this->user)->deleteJson("/api/v1/folders/{$id}");

        $response = $this->actingAs($this->user)->postJson("/api/v1/folders/{$id}/restore");

        $response->assertOk();
        $folder = Folder::find($id);
        $this->assertNull($folder->deleted_at);
    }

    public function test_can_toggle_star(): void
    {
        $createResponse = $this->actingAs($this->user)->postJson('/api/v1/folders', ['name' => 'Starred']);
        $id = $createResponse->json('id');

        $response = $this->actingAs($this->user)->postJson("/api/v1/folders/{$id}/star");

        $response->assertOk();
        $this->assertTrue($response->json('is_starred'));

        // Toggle off
        $response2 = $this->actingAs($this->user)->postJson("/api/v1/folders/{$id}/star");
        $this->assertFalse($response2->json('is_starred'));
    }

    public function test_show_returns_404_for_nonexistent_folder(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/folders/nonexistent-id');
        $response->assertNotFound();
    }

    public function test_delete_returns_404_for_nonexistent_folder(): void
    {
        $response = $this->actingAs($this->user)->deleteJson('/api/v1/folders/nonexistent-id');
        $response->assertNotFound();
    }
}
