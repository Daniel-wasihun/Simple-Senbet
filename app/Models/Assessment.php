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
            'teaching_assignment_id' => 'integer',
            'total_score' => 'decimal:2',
            'weight_percentage' => 'decimal:2',
        ];
    }

    /**
     * Mutator to ensure name is stored as valid JSON.
     */
    public function setNameAttribute(mixed $value): void
    {
        if (is_array($value)) {
            $this->attributes['name'] = json_encode($value);
        } elseif (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                $this->attributes['name'] = $value;
            } else {
                $this->attributes['name'] = json_encode($value);
            }
        } else {
            $this->attributes['name'] = json_encode($value);
        }
    }

    /**
     * Accessor to return JSON data as array or string scalar.
     */
    public function getNameAttribute(mixed $value): mixed
    {
        if (is_null($value)) {
            return null;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return $decoded !== null ? $decoded : $value;
        }

        return $value;
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
