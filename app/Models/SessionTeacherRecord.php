<?php

namespace App\Models;

use App\Enums\AttendanceMark;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionTeacherRecord extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'session_teacher_records';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'attendance_session_id',
        'teacher_id',
        'mark',
        'marked_by',
        'marked_at',
        'remarks',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'attendance_session_id' => 'integer',
            'teacher_id' => 'integer',
            'mark' => AttendanceMark::class,
            'marked_by' => 'integer',
            'marked_at' => 'datetime',
        ];
    }

    /**
     * The attendance session to which this record belongs.
     */
    public function attendanceSession(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class, 'attendance_session_id');
    }

    /**
     * The teacher whose attendance was marked.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * The user who recorded this teacher's attendance mark.
     */
    public function markedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marked_by');
    }
}
