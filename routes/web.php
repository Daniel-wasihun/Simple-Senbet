<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'Simple Senbet API',
        'status' => 'online',
        'documentation' => [
            'api_status' => url('/api/status'),
            'senbet_summary' => url('/api/senbet/summary'),
            'frontend_url' => 'http://localhost:3000',
        ],
        'architecture' => 'Laravel 13 API Backend + Next.js 16 Frontend (inside /frontend)',
    ]);
});
