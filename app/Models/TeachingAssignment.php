<?php

namespace App\Models;

use App\Enums\Semester;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TeachingAssignment extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'teacher_id',
        'course_id',
        'academic_year_id',
        'semester',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'teacher_id' => 'integer',
            'course_id' => 'integer',
            'academic_year_id' => 'integer',
            'semester' => Semester::class,
        ];
    }

    /**
     * Get the teacher (authenticated user) for this assignment.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * Get the assigned course.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    /**
     * Get the academic year for this assignment.
     */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    /**
     * Get the assessments configured for this teaching assignment.
     */
    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class, 'teaching_assignment_id');
    }
}
