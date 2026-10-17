<?php

namespace App\Models;

use App\Enums\AttendanceStatus;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AttendanceSession extends Model
{
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'attendance_sessions';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'academic_year_id',
        'term_id',
        'class_id',
        'course_id',
        'date',
        'time_slot',
        'status',
        'submitted_by',
        'submitted_at',
        'closed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'academic_year_id' => 'integer',
            'term_id' => 'integer',
            'class_id' => 'integer',
            'course_id' => 'integer',
            'date' => 'date',
            'status' => AttendanceStatus::class,
            'submitted_by' => 'integer',
            'submitted_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    /**
     * The academic year for this session.
     */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    /**
     * The school class for this session.
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * The course for this session (nullable for homeroom sessions).
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    /**
     * The user who submitted this session.
     */
    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /**
     * The student attendance marks recorded for this session.
     */
    public function studentRecords(): HasMany
    {
        return $this->hasMany(SessionStudentRecord::class, 'attendance_session_id');
    }

    /**
     * The teacher attendance marks recorded for this session.
     */
    public function teacherRecords(): HasMany
    {
        return $this->hasMany(SessionTeacherRecord::class, 'attendance_session_id');
    }

    /**
     * The audit logs tracking lifecycle and mutation history for this session.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AttendanceAuditLog::class, 'attendance_session_id');
    }

    /**
     * Check if the session is currently in draft state.
     */
    public function isDraft(): bool
    {
        return $this->status === AttendanceStatus::Draft;
    }

    /**
     * Check if the session is permanently closed.
     */
    public function isClosed(): bool
    {
        return $this->status === AttendanceStatus::Closed;
    }

    /**
     * Check if the session is editable by a teacher under the D-S1-02 24-hour rolling window.
     *
     * Rules:
     * 1. A teacher may edit only a submitted session.
     * 2. submitted_at must be populated.
     * 3. The correction deadline is exactly 24 hours after submitted_at.
     * 4. The boundary is inclusive (currentTime <= submitted_at + 24 hours).
     * 5. Draft and closed sessions are not teacher-editable.
     */
    public function isTeacherEditable(?DateTimeInterface $now = null): bool
    {
        if ($this->status !== AttendanceStatus::Submitted) {
            return false;
        }

        if ($this->submitted_at === null) {
            return false;
        }

        $currentTime = $now ? Carbon::instance($now) : now();
        $deadline = $this->submitted_at->copy()->addHours(24);

        return $currentTime->lessThanOrEqualTo($deadline);
    }
}
