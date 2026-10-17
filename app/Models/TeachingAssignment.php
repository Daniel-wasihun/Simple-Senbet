<?php

namespace App\Models;

use App\Enums\Semester;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
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
        'class_id',
        'section',
        'semester',
        'is_primary',
        'start_date',
        'end_date',
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
            'class_id' => 'integer',
            'semester' => Semester::class,
            'is_primary' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
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
     * Get the school class for this assignment.
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * Get the assessments configured for this teaching assignment.
     */
    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class, 'teaching_assignment_id');
    }

    /**
     * Scope a query to assignments active on a given date.
     */
    public function scopeActiveForDate(Builder $query, CarbonInterface|string $date): Builder
    {
        return $query->where(function (Builder $q) use ($date) {
            $q->whereNull('start_date')
                ->orWhere('start_date', '<=', $date);
        })->where(function (Builder $q) use ($date) {
            $q->whereNull('end_date')
                ->orWhere('end_date', '>', $date);
        });
    }
}
