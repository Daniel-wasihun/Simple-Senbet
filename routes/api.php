<?php

use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\AssessmentResultController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\ReportCardController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');

// Laravel's standard reset notification links here, then the browser is sent to the frontend form.
Route::get('/reset-password/{token}', function (string $token, Request $request) {
    return redirect(rtrim(config('app.frontend_url'), '/').'/reset-password?token='.urlencode($token).'&email='.urlencode((string) $request->query('email')));
})->middleware('guest')->name('password.reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    Route::middleware('role:superadmin')->apiResource('permissions', PermissionController::class)->except(['show']);
    Route::middleware('role:superadmin')->get('roles/{role}/permissions', [RolePermissionController::class, 'index']);
    Route::middleware('role:superadmin')->put('roles/{role}/permissions', [RolePermissionController::class, 'sync']);
    Route::middleware('role:superadmin')->group(function () {
        Route::apiResource('academic-years', AcademicYearController::class);
    });

    Route::middleware('role:superadmin')->apiResource('users', UserController::class);
    Route::apiResource('school-classes', SchoolClassController::class);
    Route::apiResource('courses', CourseController::class);
    Route::apiResource('members', MemberController::class);
    Route::apiResource('assessments', AssessmentController::class);
    Route::apiResource('assessment-results', AssessmentResultController::class);

    Route::prefix('attendance/sessions')->group(function () {
        Route::post('/', [AttendanceController::class, 'store'])->name('attendance.sessions.store');
        Route::get('/', [AttendanceController::class, 'index'])->name('attendance.sessions.index');
        Route::get('/{session}', [AttendanceController::class, 'show'])->name('attendance.sessions.show');
        Route::get('/{session}/roster', [AttendanceController::class, 'roster'])->name('attendance.sessions.roster');
        Route::post('/{session}/submit', [AttendanceController::class, 'submit'])->name('attendance.sessions.submit');
        Route::patch('/{session}/marks', [AttendanceController::class, 'correct'])->name('attendance.sessions.correct');
        Route::post('/{session}/close', [AttendanceController::class, 'close'])->name('attendance.sessions.close');
    });

    Route::get('attendance/summary', [AttendanceController::class, 'summary'])->name('attendance.summary');

    Route::prefix('report-cards')->group(function () {
        Route::get('/student/{student}', [ReportCardController::class, 'showStudent'])->name('report-cards.student');
        Route::get('/class/{schoolClass}', [ReportCardController::class, 'showClass'])->name('report-cards.class');
        Route::get('/class/{schoolClass}/export/csv', [ReportCardController::class, 'exportCsv'])->name('report-cards.class.export.csv');
        Route::get('/class/{schoolClass}/export/print', [ReportCardController::class, 'exportPrint'])->name('report-cards.class.export.print');
    });

    Route::prefix('promotion')->group(function () {
        Route::get('/student/{student}', [PromotionController::class, 'evaluateStudent'])->name('promotion.student');
        Route::post('/dry-run', [PromotionController::class, 'dryRun'])->name('promotion.dry-run');
        Route::post('/commit', [PromotionController::class, 'commit'])->name('promotion.commit');
    });
});

Route::get('/status', function () {
    $dbConnected = false;
    try {
        DB::connection()->getPdo();
        $dbConnected = true;
    } catch (Throwable) {
        $dbConnected = false;
    }

    $healthy = $dbConnected;

    return response()->json([
        'status' => $healthy ? 'online' : 'degraded',
        'database' => [
            'connected' => $dbConnected,
        ],
        'timestamp' => now()->toIso8601String(),
    ], $healthy ? 200 : 503);
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
        ],
    ]);
});

use App\Http\Requests\SchoolClass\StoreSchoolClassRequest;
use App\Http\Requests\SchoolClass\UpdateSchoolClassRequest;
use App\Http\Resources\SchoolClassResource;
use App\Http\Responses\ApiResponse;
use App\Models\SchoolClass;

Route::get('/classes', function () {
    return ApiResponse::success(
        SchoolClassResource::collection(SchoolClass::all())
    );
});

Route::post('/classes', function (StoreSchoolClassRequest $request) {
    $schoolClass = SchoolClass::create($request->validated());
    return ApiResponse::created(new SchoolClassResource($schoolClass));
});
