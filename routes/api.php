<?php

use App\Http\Controllers\RestApi\ConfirmFileUploadController;
use App\Http\Controllers\RestApi\FileApiController;
use App\Http\Controllers\RestApi\FolderController;
use App\Http\Controllers\RestApi\InitiateFileUploadController;
use App\Http\Controllers\RestApi\SearchController;
use App\Http\Controllers\RestApi\StorageUsageController;
use App\Http\Controllers\RestApi\TrashController;
use App\Http\Controllers\RestApi\UploadLogoController;
use Illuminate\Support\Facades\Route;

// Authenticated routes
Route::middleware(['auth:sanctum'])->group(function (): void {
    // Logo upload (settings)
    Route::post('/v1/settings/logo', UploadLogoController::class)->name('v1.settings.logo');

    // File upload (existing, extended with folder_id)
    Route::post('/v1/files/initiate', InitiateFileUploadController::class)->name('v1.files.initiate-upload')->middleware('permission:files.create');
    Route::post('/v1/files/confirm', ConfirmFileUploadController::class)->name('v1.files.confirm-upload')->middleware('permission:files.create');

    // Files CRUD
    Route::get('/v1/files', [FileApiController::class, 'index'])->name('v1.files.index')->middleware('permission:files.view');
    Route::get('/v1/files/{id}', [FileApiController::class, 'show'])->name('v1.files.show')->middleware('permission:files.view');
    Route::patch('/v1/files/{id}', [FileApiController::class, 'update'])->name('v1.files.update')->middleware('permission:files.edit');
    Route::delete('/v1/files/{id}', [FileApiController::class, 'destroy'])->name('v1.files.destroy')->middleware('permission:files.delete');
    Route::post('/v1/files/{id}/restore', [FileApiController::class, 'restore'])->name('v1.files.restore')->middleware('permission:files.delete');
    Route::post('/v1/files/{id}/star', [FileApiController::class, 'toggleStar'])->name('v1.files.star')->middleware('permission:files.edit');
    Route::post('/v1/files/{id}/share', [FileApiController::class, 'share'])->name('v1.files.share')->middleware('permission:files.edit');
    Route::get('/v1/files/{id}/download', [FileApiController::class, 'download'])->name('v1.files.download')->middleware('permission:files.view');

    // Folders CRUD
    Route::get('/v1/folders', [FolderController::class, 'index'])->name('v1.folders.index')->middleware('permission:files.view');
    Route::post('/v1/folders', [FolderController::class, 'store'])->name('v1.folders.store')->middleware('permission:files.create');
    Route::get('/v1/folders/{id}', [FolderController::class, 'show'])->name('v1.folders.show')->middleware('permission:files.view');
    Route::patch('/v1/folders/{id}', [FolderController::class, 'update'])->name('v1.folders.update')->middleware('permission:files.edit');
    Route::delete('/v1/folders/{id}', [FolderController::class, 'destroy'])->name('v1.folders.destroy')->middleware('permission:files.delete');
    Route::post('/v1/folders/{id}/restore', [FolderController::class, 'restore'])->name('v1.folders.restore')->middleware('permission:files.delete');
    Route::post('/v1/folders/{id}/star', [FolderController::class, 'toggleStar'])->name('v1.folders.star')->middleware('permission:files.edit');
    Route::post('/v1/folders/{id}/share', [FolderController::class, 'share'])->name('v1.folders.share')->middleware('permission:files.edit');

    // Search
    Route::get('/v1/search', [SearchController::class, 'index'])->name('v1.search')->middleware('permission:files.view');

    // Trash
    Route::get('/v1/trash', [TrashController::class, 'index'])->name('v1.trash.index')->middleware('permission:files.view');
    Route::delete('/v1/trash', [TrashController::class, 'destroy'])->name('v1.trash.destroy')->middleware('permission:files.delete');

    // Storage usage
    Route::get('/v1/storage/usage', StorageUsageController::class)->name('v1.storage.usage')->middleware('permission:files.view');
});
