<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RolePermissionController;

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');

// Laravel's standard reset notification links here, then the browser is sent to the frontend form.
Route::get('/reset-password/{token}', function (string $token, Request $request) {
    return redirect(rtrim(config('app.frontend_url'), '/') . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode((string) $request->query('email')));
})->middleware('guest')->name('password.reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    Route::middleware('role:superadmin')->apiResource('users', UserController::class);
    Route::middleware('role:superadmin')->apiResource('permissions', PermissionController::class)->except(['show']);
    Route::middleware('role:superadmin')->get('roles/{role}/permissions', [RolePermissionController::class, 'index']);
    Route::middleware('role:superadmin')->put('roles/{role}/permissions', [RolePermissionController::class, 'sync']);
});

Route::get('/status', function () {
    $dbConnected = false;
    try {
        DB::connection()->getPdo();
        $dbConnected = true;
    } catch (\Throwable $e) {
        $dbConnected = false;
    }

    return response()->json([
        'status' => 'online',
        'app' => 'Simple Senbet (የሰንበት ትምህርት ቤት)',
        'framework' => 'Laravel ' . app()->version(),
        'php_version' => PHP_VERSION,
        'database' => [
            'connected' => $dbConnected,
            'driver' => config('database.default'),
            'database' => config('database.connections.' . config('database.default') . '.database'),
        ],
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::get('/senbet/summary', function () {
    return response()->json([
        'title' => 'Sunday School Management (የሰንበት ትምህርት ቤት መረጃ አስተዳደር)',
        'motto' => 'Spiritual growth through organized Christian education',
        'modules' => [
            ['id' => 'students', 'name' => 'ተማሪዎች (Students)', 'count' => 128, 'description' => 'Student registration, roster, and spiritual progression.'],
            ['id' => 'classes', 'name' => 'ክፍሎች (Classes)', 'count' => 8, 'description' => 'Age & grade based spiritual study classes.'],
            ['id' => 'courses', 'name' => 'ትምህርቶች (Courses)', 'count' => 12, 'description' => 'Bible study, Church history, Mezmur, and Dogma.'],
            ['id' => 'attendance', 'name' => 'ክትትል (Attendance)', 'rate' => '94%', 'description' => 'Sunday roll-call and participation tracking.'],
        ],
        'announcements' => [
            ['title' => 'የዘመነ ጽጌ መርሐግብር', 'date' => 'October 2026', 'priority' => 'High'],
            ['title' => 'Sunday Teacher Alignment Meeting', 'date' => 'Every Sunday 8:00 AM', 'priority' => 'Medium'],
        ]
    ]);
});
