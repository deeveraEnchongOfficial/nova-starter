<?php

use App\Http\Controllers\App\Core\User\ProfileController;
use App\Http\Controllers\App\Core\Role\RoleController;
use App\Http\Controllers\App\Core\Setting\SettingController;
use App\Http\Controllers\App\Core\User\UserController;
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

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('users', [UserController::class, 'index'])->name('users.index')->middleware('permission:users.view');
    Route::get('users/{user}', [UserController::class, 'show'])->name('users.show')->middleware('permission:users.view');
    Route::get('users/create', [UserController::class, 'create'])->name('users.create')->middleware('permission:users.create');
    Route::post('users', [UserController::class, 'store'])->name('users.store')->middleware('permission:users.create');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit')->middleware('permission:users.edit');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update')->middleware('permission:users.edit');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy')->middleware('permission:users.delete');

    Route::get('roles', [RoleController::class, 'index'])->name('roles.index')->middleware('permission:roles.view');
    Route::get('roles/{role}', [RoleController::class, 'show'])->name('roles.show')->middleware('permission:roles.view');
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
});

require __DIR__.'/auth.php';
