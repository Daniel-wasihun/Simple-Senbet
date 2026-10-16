<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assessment extends Model
{
    use HasTranslations;

    /**
     * Translatable attributes stored as JSON.
     *
     * @var list<string>
     */
    protected array $translatable = [
        'name',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'teaching_assignment_id',
        'name',
        'total_score',
        'weight_percentage',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'name' => 'array',
            'teaching_assignment_id' => 'integer',
            'total_score' => 'decimal:2',
            'weight_percentage' => 'decimal:2',
        ];
    }

    /**
     * Get the teaching assignment defining this assessment.
     */
    public function teachingAssignment(): BelongsTo
    {
        return $this->belongsTo(TeachingAssignment::class, 'teaching_assignment_id');
    }

    /**
     * Get the results recorded for this assessment.
     */
    public function assessmentResults(): HasMany
    {
        return $this->hasMany(AssessmentResult::class, 'assessment_id');
    }
}
