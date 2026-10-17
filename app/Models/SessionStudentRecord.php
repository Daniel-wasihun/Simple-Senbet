<?php

namespace App\Models;

use App\Enums\AttendanceMark;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionStudentRecord extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'session_student_records';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'attendance_session_id',
        'student_id',
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
            'student_id' => 'integer',
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
     * The student (member) whose attendance was marked.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'student_id');
    }

    /**
     * The user who recorded this attendance mark.
     */
    public function markedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marked_by');
    }
}
