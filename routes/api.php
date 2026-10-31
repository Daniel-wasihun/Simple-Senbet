<?php

use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\AssessmentResultController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentExportController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\ReportCardController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\TeachingAssignmentController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public & Guest Authentication Endpoints
|--------------------------------------------------------------------------
*/
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1')->name('auth.login');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1')->name('auth.forgot-password');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1')->name('auth.reset-password');

// Laravel standard reset notification links here, redirecting browser to the frontend
Route::get('/reset-password/{token}', function (string $token, Request $request) {
    return redirect(rtrim(config('app.frontend_url'), '/').'/reset-password?token='.urlencode($token).'&email='.urlencode((string) $request->query('email')));
})->middleware('guest')->name('password.reset');

/*
|--------------------------------------------------------------------------
| Public Health & Institutional Overview Endpoints
|--------------------------------------------------------------------------
*/
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
})->name('system.status');

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
})->name('senbet.summary');

/*
|--------------------------------------------------------------------------
| Authenticated API Endpoints (Sanctum Protected)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Current user profile & authentication management
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    // Protected user registration (strictly restricted to authorized users with registration permission)
    Route::post('/auth/register', [AuthController::class, 'register'])
        ->middleware('can:register,App\Models\User')
        ->name('auth.register');

    // User and access administration is authorized by each resource policy.
    Route::apiResource('users', UserController::class);
    Route::put('users/{user}/roles', [UserController::class, 'syncRoles'])->name('users.roles.sync');
    Route::apiResource('permissions', PermissionController::class)->except(['show']);
    Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    Route::get('roles/{role}', [RoleController::class, 'show'])->name('roles.show');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::patch('roles/{role}', [RoleController::class, 'update'])->name('roles.patch');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
    Route::get('roles/{role}/permissions', [RolePermissionController::class, 'index'])->name('roles.permissions.index');
    Route::put('roles/{role}/permissions', [RolePermissionController::class, 'sync'])->name('roles.permissions.sync');

    // Academic Years: Discovery & Administrative CRUD
    Route::get('/academic-years/current', [AcademicYearController::class, 'current'])->name('academic-years.current');
    Route::apiResource('academic-years', AcademicYearController::class);

    // Core Academic Resources (Governed by CrudPolicy & Spatie Permissions)
    Route::apiResource('school-classes', SchoolClassController::class);
    Route::apiResource('courses', CourseController::class);
    Route::apiResource('members', MemberController::class);

    // Teaching Assignments Subsystem
    Route::prefix('teaching-assignments')->group(function () {
        Route::get('/', [TeachingAssignmentController::class, 'index'])->name('teaching-assignments.index');
        Route::post('/', [TeachingAssignmentController::class, 'store'])->name('teaching-assignments.store');
        Route::get('/expected', [TeachingAssignmentController::class, 'expectedTeachers'])->name('teaching-assignments.expected');
        Route::get('/{teachingAssignment}', [TeachingAssignmentController::class, 'show'])->name('teaching-assignments.show');
        Route::post('/{teachingAssignment}/end', [TeachingAssignmentController::class, 'end'])->name('teaching-assignments.end');
        Route::delete('/{teachingAssignment}', [TeachingAssignmentController::class, 'destroy'])->name('teaching-assignments.destroy');
    });

    // Assessments & Gradebook Results
    Route::apiResource('assessments', AssessmentController::class);
    Route::post('assessment-results/batch', [AssessmentResultController::class, 'batchStore'])->name('assessment-results.batch');
    Route::apiResource('assessment-results', AssessmentResultController::class);

    // Academic Reporting & Printable Gradebooks
    Route::prefix('report-cards')->group(function () {
        Route::get('/student/{student}', [ReportCardController::class, 'showStudent'])->name('report-cards.student');
        Route::get('/class/{schoolClass}', [ReportCardController::class, 'showClass'])->name('report-cards.class');
        Route::get('/class/{schoolClass}/export/csv', [ReportCardController::class, 'exportCsv'])->name('report-cards.class.export.csv');
        Route::get('/class/{schoolClass}/export/print', [ReportCardController::class, 'exportPrint'])->name('report-cards.class.export.print');
    });

    // End-of-Year Student Promotion, Retention & Graduation
    Route::prefix('promotion')->group(function () {
        Route::get('/student/{student}', [PromotionController::class, 'evaluateStudent'])->name('promotion.student');
        Route::post('/dry-run', [PromotionController::class, 'dryRun'])->name('promotion.dry-run');
        Route::post('/commit', [PromotionController::class, 'commit'])->name('promotion.commit');
    });

    // Attendance Management Subsystem
    Route::prefix('attendance')->group(function () {
        Route::prefix('sessions')->group(function () {
            Route::post('/', [AttendanceController::class, 'store'])->name('attendance.sessions.store');
            Route::get('/', [AttendanceController::class, 'index'])->name('attendance.sessions.index');
            Route::get('/{session}', [AttendanceController::class, 'show'])->name('attendance.sessions.show');
            Route::get('/{session}/roster', [AttendanceController::class, 'roster'])->name('attendance.sessions.roster');
            Route::post('/{session}/submit', [AttendanceController::class, 'submit'])->name('attendance.sessions.submit');
            Route::patch('/{session}/marks', [AttendanceController::class, 'correct'])->name('attendance.sessions.correct');
            Route::post('/{session}/close', [AttendanceController::class, 'close'])->name('attendance.sessions.close');
            Route::delete('/{session}', [AttendanceController::class, 'destroy'])->name('attendance.sessions.destroy');
        });

        Route::get('summary', [AttendanceController::class, 'summary'])->name('attendance.summary');
    });

    // Monthly Member Payments & Accounting Subsystem
    Route::prefix('payments')->group(function () {
        Route::get('/rules', [PaymentController::class, 'rules'])->name('payments.rules');
        Route::post('/rules', [PaymentController::class, 'storeRule'])->name('payments.rules.store');
        Route::get('/dashboard', [PaymentController::class, 'dashboard'])->name('payments.dashboard');
        Route::get('/members', [PaymentController::class, 'membersLedger'])->name('payments.members');
        Route::get('/members/{member}', [PaymentController::class, 'memberHistory'])->name('payments.member.history');
        Route::get('/members/{member}/history', [PaymentController::class, 'memberHistory'])->name('payments.member.history.alias');
        Route::post('/', [PaymentController::class, 'record'])->name('payments.record');
        Route::post('/record', [PaymentController::class, 'record'])->name('payments.record.alias');
        Route::post('/{payment}/void', [PaymentController::class, 'voidPayment'])->name('payments.void');
        Route::get('/{payment}/receipt', [PaymentController::class, 'receipt'])->name('payments.receipt');
        Route::get('/export/monthly-summary', [PaymentExportController::class, 'exportMonthlySummary'])->name('payments.export.monthly-summary');
        Route::get('/export/transactions', [PaymentExportController::class, 'exportTransactions'])->name('payments.export.transactions');
    });
});
