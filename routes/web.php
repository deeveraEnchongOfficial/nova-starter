<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\UserController;
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

    Route::resource('users', UserController::class)
        ->middleware('permission:users.view|users.create|users.edit|users.delete');

    Route::resource('roles', RoleController::class)
        ->middleware('permission:roles.view|roles.create|roles.edit|roles.delete');

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
