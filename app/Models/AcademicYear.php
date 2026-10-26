<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model
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
        'name',
        'start_date',
        'end_date',
        'is_current',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'name' => 'string',
            'start_date' => 'date',
            'end_date' => 'date',
            'is_current' => 'boolean',
        ];
    }

    /**
     * Mutator to ensure name is always stored as a string, handling array or string inputs.
     */
    public function setNameAttribute(mixed $value): void
    {
        if (is_array($value)) {
            $this->attributes['name'] = $value['en'] ?? $value['am'] ?? (string) reset($value);
        } else {
            $this->attributes['name'] = (string) $value;
        }
    }

    public function getTranslation(string $attribute, ?string $locale = null, bool $useFallback = true): ?string
    {
        if ($attribute === 'name') {
            return $this->attributes['name'] ?? null;
        }

        return parent::getTranslation($attribute, $locale, $useFallback);
    }

    /**
     * Get the teaching assignments for this academic year.
     */
    public function teachingAssignments(): HasMany
    {
        return $this->hasMany(TeachingAssignment::class, 'academic_year_id');
    }
}
