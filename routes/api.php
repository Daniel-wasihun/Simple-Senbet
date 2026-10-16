<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

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
