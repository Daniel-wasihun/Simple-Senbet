<?php

namespace App\Providers;

use App\Services\Notification\Channels\LogNotificationChannel;
use App\Services\Notification\Channels\NotificationChannelInterface;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\DevCommands;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentResult;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\TeachingAssignment;
use App\Models\User;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            NotificationChannelInterface::class,
            LogNotificationChannel::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // --- Dev process definitions for `composer dev` / `php artisan dev` ---
        DevCommands::withoutDefaultCommands();

        DevCommands::register('php artisan serve --port=8001', 'server')->purple();
        DevCommands::register('npm --prefix frontend run dev', 'frontend')->blue();
        DevCommands::artisan('pail --timeout=0', 'logs')->green();

        // --- Authorization ---
        Gate::policy(AcademicYear::class, \App\Policies\AcademicYearPolicy::class);
        Gate::policy(Assessment::class, \App\Policies\AssessmentPolicy::class);
        Gate::policy(AssessmentResult::class, \App\Policies\AssessmentResultPolicy::class);
        Gate::policy(AttendanceSession::class, \App\Policies\AttendanceSessionPolicy::class);
        Gate::policy(Course::class, \App\Policies\CoursePolicy::class);
        Gate::policy(Member::class, \App\Policies\MemberPolicy::class);
        Gate::policy(MemberPayment::class, \App\Policies\MemberPaymentPolicy::class);
        Gate::policy(Permission::class, \App\Policies\PermissionPolicy::class);
        Gate::policy(Role::class, \App\Policies\RolePolicy::class);
        Gate::policy(SchoolClass::class, \App\Policies\SchoolClassPolicy::class);
        Gate::policy(StudentEnrollment::class, \App\Policies\StudentEnrollmentPolicy::class);
        Gate::policy(TeachingAssignment::class, \App\Policies\TeachingAssignmentPolicy::class);
        Gate::policy(User::class, \App\Policies\UserPolicy::class);

        Gate::define('report-card.view-student', [\App\Policies\ReportCardPolicy::class, 'viewStudent']);
        Gate::define('report-card.view-class', [\App\Policies\ReportCardPolicy::class, 'viewClass']);
        Gate::define('report-card.export-class', [\App\Policies\ReportCardPolicy::class, 'exportClass']);
        Gate::define('promotion.evaluate-student', [\App\Policies\PromotionPolicy::class, 'evaluateStudent']);
        Gate::define('promotion.dry-run', [\App\Policies\PromotionPolicy::class, 'dryRun']);
        Gate::define('promotion.commit', [\App\Policies\PromotionPolicy::class, 'commit']);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
