<?php

namespace Tests\Feature\FileUpload;

use App\Services\Core\File\Actions\ConfirmFileUpload;
use App\Services\Core\File\Actions\CreateFolder;
use App\Services\Core\File\Actions\ShareResource;
use App\Services\Core\File\File;
use App\Services\Core\File\FileRepository;
use App\Services\Core\File\Folder;
use App\Services\Core\File\FolderRepository;
use App\Services\Core\File\Share;
use App\Services\Core\File\SharePermission;
use App\Services\Core\Organization\Organization;
use App\Services\Core\Organization\OrganizationStatus;
use App\Services\Core\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MultiTenantFileTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org1;
    private Organization $org2;
    private User $user1;
    private User $user2;
    private FileRepository $fileRepository;
    private FolderRepository $folderRepository;

    protected function setUp(): void
    {
        parent::setUp();

        config(['features.multi_tenant' => true]);
        Storage::fake('s3');

        $this->org1 = Organization::create([
            'name' => 'Org One',
            'status' => OrganizationStatus::ACTIVE,
            'is_active' => true,
        ]);

        $this->org2 = Organization::create([
            'name' => 'Org Two',
            'status' => OrganizationStatus::ACTIVE,
            'is_active' => true,
        ]);

        $this->user1 = User::create([
            'first_name' => 'User',
            'last_name' => 'One',
            'email' => 'user1@example.com',
            'password' => 'password',
            'tenant_type' => 'core.organization',
            'tenant_id' => $this->org1->_id,
        ]);

        $this->user2 = User::create([
            'first_name' => 'User',
            'last_name' => 'Two',
            'email' => 'user2@example.com',
            'password' => 'password',
            'tenant_type' => 'core.organization',
            'tenant_id' => $this->org2->_id,
        ]);

        $this->fileRepository = app(FileRepository::class);
        $this->folderRepository = app(FolderRepository::class);
    }

    private function createFileForUser(User $user, string $name = 'test.txt'): File
    {
        $path = $user->getKey().'/'.$name;
        Storage::disk('s3')->put($path, 'test content');

        $file = File::forceMake([
            'name' => $name,
            'path' => $path,
            'disk' => 's3',
            'size' => 12,
            'mime_type' => 'text/plain',
            'folder_id' => null,
        ]);
        $file->replaceMetadata(['visibility' => 'private', 'is_starred' => false]);
        $file->createdBy()->associate($user);

        if (config('features.multi_tenant', false) && $user->tenant_id && $user->tenant_type) {
            $file->tenant()->associate($user->tenant);
        }

        $file->save();

        return $file;
    }

    private function createFolderForUser(User $user, string $name = 'TestFolder'): Folder
    {
        $folder = Folder::forceMake([
            'name' => $name,
            'parent_id' => null,
        ]);
        $folder->replaceMetadata(['visibility' => 'private', 'is_starred' => false]);
        $folder->createdBy()->associate($user);

        if (config('features.multi_tenant', false) && $user->tenant_id && $user->tenant_type) {
            $folder->tenant()->associate($user->tenant);
        }

        $folder->save();

        return $folder;
    }

    public function test_file_requires_tenant_when_multi_tenant_enabled(): void
    {
        $this->expectException(\LogicException::class);

        $file = File::forceMake([
            'name' => 'no-tenant.txt',
            'path' => 'no-tenant.txt',
            'disk' => 's3',
            'size' => 12,
            'mime_type' => 'text/plain',
        ]);
        $file->replaceMetadata(['visibility' => 'private', 'is_starred' => false]);
        $file->save();
    }

    public function test_folder_requires_tenant_when_multi_tenant_enabled(): void
    {
        $this->expectException(\LogicException::class);

        $folder = Folder::forceMake(['name' => 'NoTenantFolder']);
        $folder->replaceMetadata(['visibility' => 'private', 'is_starred' => false]);
        $folder->save();
    }

    public function test_file_is_isolated_by_tenant(): void
    {
        $file1 = $this->createFileForUser($this->user1, 'org1-file.txt');
        $file2 = $this->createFileForUser($this->user2, 'org2-file.txt');

        $this->actingAs($this->user1);
        $org1Files = $this->fileRepository->getFilesInFolder(null, $this->user1);

        $this->assertCount(1, $org1Files);
        $this->assertSame('org1-file.txt', $org1Files->first()->name);

        $this->actingAs($this->user2);
        $org2Files = $this->fileRepository->getFilesInFolder(null, $this->user2);

        $this->assertCount(1, $org2Files);
        $this->assertSame('org2-file.txt', $org2Files->first()->name);
    }

    public function test_folder_is_isolated_by_tenant(): void
    {
        $folder1 = $this->createFolderForUser($this->user1, 'Org1Folder');
        $folder2 = $this->createFolderForUser($this->user2, 'Org2Folder');

        $this->actingAs($this->user1);
        $org1Folders = $this->folderRepository->getFoldersInFolder(null, $this->user1);

        $this->assertCount(1, $org1Folders);
        $this->assertSame('Org1Folder', $org1Folders->first()->name);

        $this->actingAs($this->user2);
        $org2Folders = $this->folderRepository->getFoldersInFolder(null, $this->user2);

        $this->assertCount(1, $org2Folders);
        $this->assertSame('Org2Folder', $org2Folders->first()->name);
    }

    public function test_file_findById_is_tenant_scoped(): void
    {
        $file1 = $this->createFileForUser($this->user1, 'org1.txt');
        $file2 = $this->createFileForUser($this->user2, 'org2.txt');

        $this->actingAs($this->user1);
        $found = $this->fileRepository->findById($file2->id);

        $this->assertNull($found, 'User from org1 should not find file from org2');
    }

    public function test_folder_findById_is_tenant_scoped(): void
    {
        $folder1 = $this->createFolderForUser($this->user1, 'Org1Folder');
        $folder2 = $this->createFolderForUser($this->user2, 'Org2Folder');

        $this->actingAs($this->user1);
        $found = $this->folderRepository->findById($folder2->id);

        $this->assertNull($found, 'User from org1 should not find folder from org2');
    }

    public function test_create_folder_action_sets_tenant(): void
    {
        $folder = app(CreateFolder::class)->execute('MyFolder', $this->user1);

        $this->assertNotNull($folder->tenant_id);
        $this->assertSame($this->org1->_id, $folder->tenant_id);
        $this->assertSame('core.organization', $folder->tenant_type);
    }

    public function test_confirm_file_upload_action_sets_tenant(): void
    {
        $tmpKey = $this->user1->getKey().'/tmp-test.txt';
        Storage::disk('s3')->put($tmpKey, 'test content');

        $file = app(ConfirmFileUpload::class)->execute(
            $tmpKey,
            'test.txt',
            $this->user1,
            null,
            ['visibility' => 'private', 'is_starred' => false, 'listable' => false],
        );

        $this->assertNotNull($file->tenant_id);
        $this->assertSame($this->org1->_id, $file->tenant_id);
        $this->assertSame('core.organization', $file->tenant_type);
    }

    public function test_share_resource_action_sets_tenant(): void
    {
        $file = $this->createFileForUser($this->user1, 'share-test.txt');

        $share = app(ShareResource::class)->execute(
            $file,
            $this->user1,
            SharePermission::VIEWER,
            $this->user1,
        );

        $this->assertNotNull($share->tenant_id);
        $this->assertSame($this->org1->_id, $share->tenant_id);
        $this->assertSame('core.organization', $share->tenant_type);
    }

    public function test_search_is_tenant_scoped(): void
    {
        $this->createFileForUser($this->user1, 'report-q1.pdf');
        $this->createFileForUser($this->user2, 'report-q2.pdf');

        $this->actingAs($this->user1);
        $results = $this->fileRepository->search('report', $this->user1);

        $this->assertCount(1, $results);
        $this->assertSame('report-q1.pdf', $results->first()->name);
    }

    public function test_starred_is_tenant_scoped(): void
    {
        $file1 = $this->createFileForUser($this->user1, 'starred1.txt');
        $file1->replaceMetadata(['is_starred' => true]);
        $file1->save();

        $file2 = $this->createFileForUser($this->user2, 'starred2.txt');
        $file2->replaceMetadata(['is_starred' => true]);
        $file2->save();

        $this->actingAs($this->user1);
        $starred = $this->fileRepository->getStarred($this->user1);

        $this->assertCount(1, $starred);
        $this->assertSame('starred1.txt', $starred->first()->name);
    }

    public function test_trashed_is_tenant_scoped(): void
    {
        $file1 = $this->createFileForUser($this->user1, 'trash1.txt');
        $file1->delete();

        $file2 = $this->createFileForUser($this->user2, 'trash2.txt');
        $file2->delete();

        $this->actingAs($this->user1);
        $trashed = $this->fileRepository->getTrashed($this->user1);

        $this->assertCount(1, $trashed);
        $this->assertSame('trash1.txt', $trashed->first()->name);
    }

    protected function tearDown(): void
    {
        File::withTrashed()->forceDelete();
        Folder::withTrashed()->forceDelete();
        Share::truncate();
        User::truncate();
        Organization::truncate();

        parent::tearDown();
    }
}
