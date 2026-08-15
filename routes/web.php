<?php

use App\Http\Controllers\App\Core\User\ProfileController;
use App\Http\Controllers\App\Core\Role\RoleController;
use App\Http\Controllers\App\Core\Setting\SettingController;
use App\Http\Controllers\App\Core\User\UserController;
use App\Http\Controllers\App\Core\Activity\ActivityController;
use App\Http\Controllers\App\Core\File\FileController;
use App\Http\Controllers\App\Core\AiBot\AiBotController;
use App\Services\Core\Activity\ActivityRepository;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function (ActivityRepository $repository) {
    return Inertia::render('Dashboard', [
        'recentActivities' => $repository->findRecent(5)->load(['createdBy'])->map(fn ($activity) => [
            'id' => $activity->id,
            'type' => $activity->type,
            'description' => $activity->description,
            'created_at' => $activity->created_at->toIso8601String(),
            'created_by' => $activity->createdBy ? [
                'id' => $activity->createdBy->id,
                'name' => $activity->createdBy->name,
                'email' => $activity->createdBy->email,
            ] : null,
        ]),
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('users', [UserController::class, 'index'])->name('users.index')->middleware('permission:users.view');
    Route::get('users/create', [UserController::class, 'create'])->name('users.create')->middleware('permission:users.create');
    Route::post('users', [UserController::class, 'store'])->name('users.store')->middleware('permission:users.create');
    Route::get('users/{user}', [UserController::class, 'show'])->name('users.show')->middleware('permission:users.view');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit')->middleware('permission:users.edit');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update')->middleware('permission:users.edit');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy')->middleware('permission:users.delete');

    Route::get('roles', [RoleController::class, 'index'])->name('roles.index')->middleware('permission:roles.view');
    Route::get('roles/create', [RoleController::class, 'create'])->name('roles.create')->middleware('permission:roles.create');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store')->middleware('permission:roles.create');
    Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit')->middleware('permission:roles.edit');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update')->middleware('permission:roles.edit');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->middleware('permission:roles.delete');

    Route::get('/settings', [SettingController::class, 'index'])
        ->name('settings.index')
        ->middleware('permission:settings.view');
    Route::post('/settings', [SettingController::class, 'update'])
        ->name('settings.update')
        ->middleware('permission:settings.edit');
    Route::post('/settings/modules', [SettingController::class, 'updateModules'])
        ->name('settings.modules.update')
        ->middleware('permission:settings.edit');

    // File Manager
    Route::get('/files', [FileController::class, 'index'])->name('files.index')->middleware('permission:files.view');
    Route::get('/files/trash', [FileController::class, 'trash'])->name('files.trash')->middleware('permission:files.view');
    Route::get('/files/starred', [FileController::class, 'starred'])->name('files.starred')->middleware('permission:files.view');
    Route::get('/files/shared', [FileController::class, 'shared'])->name('files.shared')->middleware('permission:files.view');

    // Activity Logs
    Route::get('activity-logs', [ActivityController::class, 'index'])->name('activity-logs.index')->middleware('permission:activity-logs.view');
    Route::delete('activity-logs', [ActivityController::class, 'clear'])->name('activity-logs.clear')->middleware('permission:activity-logs.view');
    Route::get('activity-logs/{activity}', [ActivityController::class, 'show'])->name('activity-logs.show')->middleware('permission:activity-logs.view');

    // AI Bot (chat endpoint only — UI is a floating widget)
    Route::post('/ai-bot/chat', [AiBotController::class, 'chat'])->name('ai-bot.chat')->middleware(['permission:ai-bot.view', 'throttle:10,1']);
});

require __DIR__.'/auth.php';
